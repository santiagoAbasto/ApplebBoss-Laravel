<?php

namespace Tests\Feature;

use App\Mail\EstadoDePedido;
use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Pedido;
use App\Models\User;
use App\Support\Checkout\ConfirmadorDePago;
use App\Support\Checkout\CreadorDePedido;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * La cuenta de quien compra: registro, portón del checkout y avisos por correo.
 *
 * El cliente es un `User` con rol 'cliente'. Lo crítico acá es que esa cuenta no abra
 * ninguna puerta del panel, y que el rol nunca pueda llegar desde el formulario.
 */
class CuentaClienteTest extends TestCase
{
    use RefreshDatabase;

    // Ojo: el registro valida con `email:rfc,dns`, así que el dominio del fixture tiene que
    // existir de verdad. Es a propósito: un «gmial.com» mal tipeado se tragaría los avisos.
    private array $datosValidos = [
        'name' => 'Ana Quispe',
        'email' => 'ana@gmail.com',
        'telefono' => '70011223',
        'password' => 'clave-larga-y-unica-2026',
        'password_confirmation' => 'clave-larga-y-unica-2026',
    ];

    private function celularPublicado(): Celular
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
            'titulo' => 'iPhone 15 128 GB Negro', 'slug' => 'iphone-15-' . $celular->id,
            'resumen' => 'Sellado.', 'condicion' => 'Nuevo', 'categoria' => 'celulares',
        ]);

        return $celular;
    }

    /* ─── Registro ────────────────────────────────────────────────────────── */

    public function test_quien_se_registra_queda_como_cliente_y_nunca_como_staff(): void
    {
        $this->post('/crear-cuenta', $this->datosValidos)->assertRedirect();

        $user = User::where('email', 'ana@gmail.com')->firstOrFail();
        $this->assertSame('cliente', $user->rol);
        $this->assertSame('70011223', $user->telefono);
        $this->assertAuthenticatedAs($user);
    }

    public function test_el_rol_no_se_puede_mandar_desde_el_formulario(): void
    {
        $this->post('/crear-cuenta', $this->datosValidos + ['rol' => 'admin']);

        $this->assertSame('cliente', User::where('email', 'ana@gmail.com')->value('rol'));
    }

    public function test_no_acepta_una_contrasena_corta(): void
    {
        $this->post('/crear-cuenta', array_merge($this->datosValidos, [
            'password' => 'corta123', 'password_confirmation' => 'corta123',
        ]))->assertSessionHasErrors('password');

        $this->assertDatabaseCount('users', 0);
    }

    /* ─── El cliente no entra al panel ────────────────────────────────────── */

    public function test_la_cuenta_de_cliente_no_abre_ninguna_puerta_del_panel(): void
    {
        $cliente = User::factory()->create(['rol' => 'cliente']);

        foreach (['/admin/dashboard', '/admin/usuarios', '/admin/pedidos', '/vendedor/dashboard'] as $privada) {
            $this->actingAs($cliente)->get($privada)->assertForbidden();
        }
    }

    public function test_al_cliente_el_dashboard_lo_manda_a_su_cuenta(): void
    {
        $cliente = User::factory()->create(['rol' => 'cliente', 'email_verified_at' => now()]);

        $this->actingAs($cliente)->get('/dashboard')->assertRedirect(route('cuenta.index'));
    }

    /* ─── El checkout exige cuenta ────────────────────────────────────────── */

    public function test_sin_cuenta_no_se_puede_comprar(): void
    {
        // Y va a la puerta de la tienda, no a la del panel
        $this->get('/checkout')->assertRedirect(route('cuenta.entrar'));
        $this->post('/checkout', [])->assertRedirect(route('cuenta.entrar'));
    }

    public function test_las_dos_puertas_estan_separadas(): void
    {
        // La del equipo no ofrece crear cuenta; la de la tienda sí
        $this->get('/login')->assertOk()
            ->assertInertia(fn ($page) => $page->component('Auth/Login'));

        $this->get('/ingresar')->assertOk()
            ->assertInertia(fn ($page) => $page->component('Store/Cuenta/Entrar'));
    }

    /**
     * Al entrar, la app se reconstruye entera.
     *
     * La lista de rutas de Ziggy se imprime en el HTML una sola vez, y al invitado se le da
     * una recortada (sin admin.* ni vendedor.*). Si Inertia solo cambiara el componente, esa
     * lista quedaría congelada en la de invitado y el panel reventaría con
     * «route 'admin.ventas.create' is not in the route list» hasta que recargaras a mano.
     */
    public function test_al_entrar_se_recarga_la_app_y_no_queda_la_lista_de_rutas_vieja(): void
    {
        foreach (['admin', 'vendedor', 'cliente'] as $rol) {
            User::factory()->create(['rol' => $rol, 'email' => "{$rol}@gmail.com"]);

            $r = $this->withHeader('X-Inertia', 'true')
                ->post('/login', ['email' => "{$rol}@gmail.com", 'password' => 'password']);

            $r->assertStatus(409);
            $this->assertNotEmpty($r->headers->get('X-Inertia-Location'),
                "al entrar como {$rol} tiene que recargarse la aplicación entera");

            $this->post('/logout');
        }
    }

    public function test_al_salir_tambien_se_recarga(): void
    {
        $this->actingAs(User::factory()->create(['rol' => 'admin']));

        // Si no, la lista completa de rutas del panel quedaría en memoria del navegador
        $this->withHeader('X-Inertia', 'true')->post('/logout')->assertStatus(409);
    }

    public function test_el_cliente_que_entra_por_la_tienda_va_a_su_cuenta(): void
    {
        $cliente = User::factory()->create(['rol' => 'cliente', 'email' => 'ana@gmail.com']);

        $this->post('/ingresar', ['email' => 'ana@gmail.com', 'password' => 'password'])
            ->assertRedirect(route('cuenta.index'));

        $this->assertAuthenticatedAs($cliente);
    }

    public function test_con_cuenta_el_checkout_llega_con_los_datos_puestos(): void
    {
        $cliente = User::factory()->create(['rol' => 'cliente', 'name' => 'Ana Quispe', 'telefono' => '70011223']);

        $this->actingAs($cliente)->get('/checkout')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('cliente.nombre', 'Ana Quispe')
                ->where('cliente.telefono', '70011223'));
    }

    public function test_el_pedido_queda_atado_a_la_cuenta_y_aparece_en_mi_cuenta(): void
    {
        $cliente = User::factory()->create(['rol' => 'cliente']);
        $celular = $this->celularPublicado();

        $this->actingAs($cliente);
        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], [
            'nombre_cliente' => 'Ana Quispe', 'email_cliente' => 'ana@example.com',
            'telefono_cliente' => '70011223', 'tipo_entrega' => 'retiro', 'metodo_pago' => 'transferencia',
        ]);

        $this->assertSame($cliente->id, $pedido->user_id);

        $this->get('/mi-cuenta')->assertOk()
            ->assertInertia(fn ($page) => $page->where('pedidos.data.0.codigo', $pedido->codigo));
    }

    public function test_nadie_ve_los_pedidos_de_otro(): void
    {
        $celular = $this->celularPublicado();
        $ana = User::factory()->create(['rol' => 'cliente']);

        $this->actingAs($ana);
        CreadorDePedido::crear(["celular:{$celular->id}"], [
            'nombre_cliente' => 'Ana', 'email_cliente' => 'ana@example.com',
            'telefono_cliente' => '70011223', 'tipo_entrega' => 'retiro', 'metodo_pago' => 'transferencia',
        ]);

        $otro = User::factory()->create(['rol' => 'cliente']);
        $this->actingAs($otro)->get('/mi-cuenta')->assertOk()
            ->assertInertia(fn ($page) => $page->count('pedidos.data', 0));
    }

    /* ─── Correos de cada estado ──────────────────────────────────────────── */

    public function test_cada_cambio_de_estado_le_avisa_al_comprador(): void
    {
        Mail::fake();

        $cliente = User::factory()->create(['rol' => 'cliente']);
        $celular = $this->celularPublicado();

        $this->actingAs($cliente);
        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], [
            'nombre_cliente' => 'Ana', 'email_cliente' => 'ana@example.com',
            'telefono_cliente' => '70011223', 'tipo_entrega' => 'retiro', 'metodo_pago' => 'transferencia',
        ]);

        // Al crearse: «lo reservamos, completa el pago»
        Mail::assertQueued(EstadoDePedido::class, fn ($m) => $m->pedido->estado === Pedido::PENDIENTE_PAGO);

        ConfirmadorDePago::confirmar($pedido, 'OP-1', $cliente->id);
        Mail::assertQueued(EstadoDePedido::class, fn ($m) => $m->pedido->estado === Pedido::PAGADO);

        Mail::assertQueued(EstadoDePedido::class, 2);
    }

    public function test_el_correo_nunca_lleva_el_imei(): void
    {
        $cliente = User::factory()->create(['rol' => 'cliente']);
        $celular = $this->celularPublicado();

        $this->actingAs($cliente);
        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], [
            'nombre_cliente' => 'Ana', 'email_cliente' => 'ana@example.com',
            'telefono_cliente' => '70011223', 'tipo_entrega' => 'retiro', 'metodo_pago' => 'transferencia',
        ]);
        ConfirmadorDePago::confirmar($pedido, 'OP-1', $cliente->id);

        // Un correo se reenvía; los datos de la unidad viven detrás del token, no en la bandeja
        $html = (new EstadoDePedido($pedido->fresh()->load('items')))->render();
        $this->assertStringNotContainsString($celular->imei_1, $html);
    }
}
