<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Resena;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Reseñas: nada se inventa y nada se publica solo.
 *
 * La de la web la deja quien recibió su pedido (una por pedido, con el enlace del pedido) y espera aprobación. La
 * tienda no ve nombres completos ni datos del pedido. Desde el panel no se puede fabricar una «compra verificada».
 */
class ResenasTest extends TestCase
{
    use RefreshDatabase;

    private function pedido(string $estado = Pedido::ENTREGADO): Pedido
    {
        $pedido = Pedido::create([
            'codigo' => Pedido::nuevoCodigo(), 'token_seguimiento' => Pedido::nuevoToken(),
            'nombre_cliente' => 'María Fernanda López', 'email_cliente' => 'maria@gmail.com', 'telefono_cliente' => '70011223',
            'subtotal' => 6500, 'total' => 6500, 'estado' => $estado, 'metodo_pago' => 'binance_pay',
        ]);
        $pedido->items()->create([
            'tipo' => 'celular', 'producto_id' => 1, 'nombre' => 'iPhone 15 128 GB', 'precio_unitario' => 6500, 'subtotal' => 6500,
        ]);

        return $pedido;
    }

    private function opinar(Pedido $pedido, array $datos = [], ?string $token = null)
    {
        return $this->post("/seguimiento/{$pedido->codigo}/opinion?t=" . ($token ?? $pedido->token_seguimiento), array_merge([
            'calificacion' => 5,
            'texto'        => 'Excelente atención y el equipo llegó perfecto.',
        ], $datos));
    }

    /* ─── La opinión del cliente ─────────────────────────────────────────── */

    public function test_quien_recibio_su_pedido_opina_y_queda_esperando_aprobacion(): void
    {
        $pedido = $this->pedido();

        $this->opinar($pedido)->assertSessionHas('success');

        $resena = Resena::sole();
        $this->assertSame($pedido->id, $resena->pedido_id);
        $this->assertSame('web', $resena->fuente);
        $this->assertSame('iPhone 15 128 GB', $resena->producto);
        $this->assertFalse($resena->publicada, 'nada se publica solo');
    }

    public function test_antes_de_recibir_no_se_puede_opinar(): void
    {
        $this->opinar($this->pedido(Pedido::ENVIADO))->assertSessionHas('error');

        $this->assertDatabaseCount('resenas', 0);
    }

    public function test_una_sola_opinion_por_pedido(): void
    {
        $pedido = $this->pedido();

        $this->opinar($pedido);
        $this->opinar($pedido, ['calificacion' => 1, 'texto' => 'Otra opinión distinta del mismo pedido.'])->assertSessionHas('error');

        $this->assertDatabaseCount('resenas', 1);
    }

    public function test_sin_el_enlace_del_pedido_no_se_puede_opinar(): void
    {
        $this->opinar($this->pedido(), [], 'inventado')->assertNotFound();

        $this->assertDatabaseCount('resenas', 0);
    }

    /* ─── Lo que ve la tienda ────────────────────────────────────────────── */

    public function test_el_inicio_muestra_solo_las_aprobadas_y_sin_datos_del_cliente(): void
    {
        $pedido = $this->pedido();
        Resena::create([
            'nombre' => 'María Fernanda López', 'calificacion' => 5, 'texto' => 'Todo impecable, lo recomiendo.',
            'fuente' => 'web', 'fecha' => now()->toDateString(), 'pedido_id' => $pedido->id, 'publicada' => true,
        ]);
        Resena::create([
            'nombre' => 'Juan Pérez', 'calificacion' => 2, 'texto' => 'Todavía no la aprobaron.',
            'fuente' => 'google', 'fecha' => now()->toDateString(), 'publicada' => false,
        ]);

        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Store/Home')
            ->has('resenas', 1)
            ->where('resenas.0.firma', 'María L.')
            ->where('resenas.0.verificada', true)
            ->missing('resenas.0.nombre')
            ->missing('resenas.0.pedido_id')
            ->where('resenasResumen.total', 1));
    }

    public function test_la_firma_publica_es_nombre_e_inicial(): void
    {
        $this->assertSame('María L.', (new Resena(['nombre' => 'maría fernanda lópez']))->firma());
        $this->assertSame('Carlos', (new Resena(['nombre' => 'Carlos']))->firma());
    }

    /* ─── El panel ───────────────────────────────────────────────────────── */

    public function test_el_panel_carga_publica_y_borra(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);

        $this->actingAs($admin)->post(route('admin.resenas.store'), [
            'nombre' => 'Ana Quispe', 'calificacion' => 4, 'texto' => 'Muy buena atención en la tienda.',
            'fuente' => 'google', 'enlace' => 'https://maps.app.goo.gl/abc', 'fecha' => now()->subDay()->toDateString(), 'publicada' => true,
        ])->assertSessionHasNoErrors();

        $resena = Resena::sole();
        $this->assertTrue($resena->publicada);

        $this->actingAs($admin)->patch(route('admin.resenas.update', $resena), ['publicada' => false]);
        $this->assertFalse($resena->fresh()->publicada);

        $this->actingAs($admin)->delete(route('admin.resenas.destroy', $resena));
        $this->assertDatabaseCount('resenas', 0);
    }

    public function test_desde_el_panel_no_se_puede_fabricar_una_compra_verificada(): void
    {
        $this->actingAs(User::factory()->create(['rol' => 'admin']))->post(route('admin.resenas.store'), [
            'nombre' => 'Alguien', 'calificacion' => 5, 'texto' => 'Una opinión cargada a mano.',
            'fuente' => 'web', 'fecha' => now()->toDateString(),
        ])->assertSessionHasErrors('fuente');

        $this->assertDatabaseCount('resenas', 0);
    }

    public function test_un_vendedor_no_administra_resenas(): void
    {
        $this->actingAs(User::factory()->create(['rol' => 'vendedor']))
            ->get(route('admin.resenas.index'))->assertForbidden();
    }
}
