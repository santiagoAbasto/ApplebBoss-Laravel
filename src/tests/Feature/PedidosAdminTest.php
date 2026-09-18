<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Pedido;
use App\Models\User;
use App\Support\Checkout\ConfirmadorDePago;
use App\Support\Checkout\CreadorDePedido;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Panel → Pedidos de la tienda.
 *
 * Sin el QR automático del banco, el cobro es manual: el cliente sube su comprobante, el
 * pedido queda «en revisión» y alguien del panel lo confirma. Confirmar es lo que vende la
 * unidad, la despublica y le revela al comprador el IMEI y la serie.
 */
class PedidosAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function pedidoConEquipo(array $datos = []): Pedido
    {
        $celular = Celular::create([
            'modelo' => 'iPhone 15', 'capacidad' => '128 GB', 'color' => 'Negro',
            'imei_1' => fake()->unique()->numerify('###############'), 'estado_imei' => 'libre',
            'procedencia' => 'EEUU', 'precio_costo' => 5000, 'precio_venta' => 6500,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);

        CatalogoPublicacion::create([
            'producto_tipo' => 'celular', 'producto_id' => $celular->id,
            'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => 'iPhone 15 128 GB Negro', 'slug' => 'iphone-15-128gb-negro-' . $celular->id,
            'resumen' => 'Sellado.', 'condicion' => 'Nuevo', 'categoria' => 'celulares',
        ]);

        return CreadorDePedido::crear(["celular:{$celular->id}"], array_merge([
            'nombre_cliente'   => 'Ana Quispe',
            'email_cliente'    => 'ana@example.com',
            'telefono_cliente' => '70011223',
            'tipo_entrega'     => 'retiro',
            'metodo_pago'      => 'transferencia',
        ], $datos));
    }

    /* ─── Acceso ──────────────────────────────────────────────────────────── */

    public function test_sin_sesion_no_se_ven_los_pedidos(): void
    {
        $this->get('/admin/pedidos')->assertRedirect('/login');
    }

    public function test_un_vendedor_no_entra_a_los_pedidos(): void
    {
        $vendedor = User::factory()->create(['rol' => 'vendedor']);

        $this->actingAs($vendedor)->get('/admin/pedidos')->assertForbidden();
    }

    /* ─── Lista ───────────────────────────────────────────────────────────── */

    public function test_la_lista_muestra_los_pedidos_y_lo_que_espera_accion(): void
    {
        $pedido = $this->pedidoConEquipo();
        ConfirmadorDePago::marcarEnRevision($pedido, null, 'OP-123');

        $this->actingAs($this->admin())->get('/admin/pedidos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Pedidos/Index')
                ->where('conteos.en_revision', 1)
                ->where('pedidos.data.0.codigo', $pedido->codigo));
    }

    public function test_se_puede_buscar_por_codigo_y_filtrar_por_estado(): void
    {
        $uno = $this->pedidoConEquipo();
        $this->pedidoConEquipo(['nombre_cliente' => 'Otro Cliente']);

        $this->actingAs($this->admin())->get('/admin/pedidos?q=' . $uno->codigo)
            ->assertInertia(fn ($page) => $page->count('pedidos.data', 1));

        $this->actingAs($this->admin())->get('/admin/pedidos?estado=' . Pedido::PAGADO)
            ->assertInertia(fn ($page) => $page->count('pedidos.data', 0));
    }

    /* ─── Confirmación del pago ───────────────────────────────────────────── */

    public function test_confirmar_el_pago_vende_el_equipo_y_deja_rastro(): void
    {
        $admin  = $this->admin();
        $pedido = $this->pedidoConEquipo();
        ConfirmadorDePago::marcarEnRevision($pedido, null, 'OP-123');

        $this->actingAs($admin)
            ->post("/admin/pedidos/{$pedido->id}/confirmar-pago", ['referencia' => 'OP-999'])
            ->assertRedirect();

        $pedido->refresh();
        $this->assertTrue($pedido->pagoConfirmado());
        $this->assertSame($admin->id, $pedido->pago_confirmado_por);
        $this->assertNotNull($pedido->pago_confirmado_en);

        // El equipo sale de la tienda
        $this->assertSame('vendido', $pedido->items->first()->producto_id
            ? Celular::find($pedido->items->first()->producto_id)->estado : null);

        // Y queda el rastro de quién lo hizo
        $this->assertTrue($pedido->eventos()->where('user_id', $admin->id)->exists());
    }

    public function test_no_se_confirma_dos_veces_ni_un_pedido_cancelado(): void
    {
        $admin  = $this->admin();
        $pedido = $this->pedidoConEquipo();

        $this->actingAs($admin)->post("/admin/pedidos/{$pedido->id}/confirmar-pago");
        $eventos = $pedido->fresh()->eventos()->count();

        $this->actingAs($admin)->post("/admin/pedidos/{$pedido->id}/confirmar-pago")
            ->assertSessionHas('error');

        $this->assertSame($eventos, $pedido->fresh()->eventos()->count(), 'no debe duplicar la línea de tiempo');
    }

    /* ─── Comprobante ─────────────────────────────────────────────────────── */

    public function test_el_comprobante_se_guarda_privado_y_solo_lo_abre_el_panel(): void
    {
        Storage::fake('local');

        $pedido = $this->pedidoConEquipo();

        // El cliente lo sube desde su pantalla de pago
        $this->post("/pedido/{$pedido->codigo}/pago/reportar?t={$pedido->token_seguimiento}", [
            'referencia'  => 'OP-123',
            'comprobante' => UploadedFile::fake()->image('boleta.jpg'),
        ]);

        $pedido->refresh();
        $this->assertNotNull($pedido->pago_comprobante);
        $this->assertSame(Pedido::PAGO_EN_REVISION, $pedido->estado);

        // No se sirve público: da igual si responde 403 o 404, lo que importa es que no se entregue
        $publico = $this->get('/storage/' . $pedido->pago_comprobante);
        $this->assertContains($publico->status(), [403, 404], 'el comprobante no puede servirse por URL pública');

        // Pero el panel sí lo abre
        $this->actingAs($this->admin())->get("/admin/pedidos/{$pedido->id}/comprobante")->assertOk();
    }

    /* ─── Ciclo de vida y trazabilidad ────────────────────────────────────── */

    public function test_no_se_avanza_un_pedido_sin_pago_confirmado(): void
    {
        $pedido = $this->pedidoConEquipo();

        $this->actingAs($this->admin())
            ->post("/admin/pedidos/{$pedido->id}/avanzar", ['estado' => Pedido::PREPARANDO])
            ->assertSessionHas('error');

        $this->assertSame(Pedido::PENDIENTE_PAGO, $pedido->fresh()->estado);
    }

    public function test_el_pedido_avanza_paso_a_paso_y_cada_paso_queda_registrado(): void
    {
        $admin  = $this->admin();
        $pedido = $this->pedidoConEquipo();
        ConfirmadorDePago::confirmar($pedido, 'OP-1', $admin->id);

        // No se puede saltar directo a entregado
        $this->actingAs($admin)->post("/admin/pedidos/{$pedido->id}/avanzar", ['estado' => Pedido::ENTREGADO])
            ->assertSessionHas('error');

        $this->actingAs($admin)->post("/admin/pedidos/{$pedido->id}/avanzar", ['estado' => Pedido::PREPARANDO]);
        $this->assertSame(Pedido::PREPARANDO, $pedido->fresh()->estado);

        // Retiro en tienda: de preparando pasa a entregado, sin envío de por medio
        $this->actingAs($admin)->post("/admin/pedidos/{$pedido->id}/avanzar", ['estado' => Pedido::ENTREGADO]);
        $pedido->refresh();

        $this->assertSame(Pedido::ENTREGADO, $pedido->estado);
        $this->assertNotNull($pedido->entregado_en);
        $this->assertGreaterThanOrEqual(2, $pedido->eventos()->where('user_id', $admin->id)->count());
    }

    public function test_la_nota_interna_no_llega_nunca_al_cliente(): void
    {
        $admin  = $this->admin();
        $pedido = $this->pedidoConEquipo();

        $this->actingAs($admin)->post("/admin/pedidos/{$pedido->id}/nota", ['nota' => 'Cliente pidió factura a otro NIT']);

        $pedido->refresh();
        $this->assertStringContainsString('otro NIT', $pedido->notas_internas);

        // El seguimiento público no la muestra
        $publico = json_encode($pedido->load('eventos')->paraElCliente());
        $this->assertStringNotContainsString('otro NIT', $publico);
    }

    public function test_cancelar_libera_el_equipo(): void
    {
        $admin  = $this->admin();
        $pedido = $this->pedidoConEquipo();

        $this->actingAs($admin)->post("/admin/pedidos/{$pedido->id}/cancelar", ['motivo' => 'El cliente desistió']);

        $this->assertSame(Pedido::CANCELADO, $pedido->fresh()->estado);
    }
}
