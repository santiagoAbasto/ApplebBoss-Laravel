<?php

namespace Tests\Feature;

use App\Mail\SolicitudDeResena;
use App\Models\Cliente;
use App\Models\ConfiguracionTienda;
use App\Models\NewsletterSubscriber;
use App\Models\ProductoGeneral;
use App\Models\User;
use App\Models\Venta;
use App\Support\Resenas\Solicitud;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Pedirle al cliente que califique en Google después de una venta: el botón del panel (WhatsApp + correo), el correo
 * automático unos días después y el envío masivo a clientes anteriores. Nunca se repite ni se le manda a quien pidió
 * no recibir correos, y el enlace es el que cargó el dueño.
 */
class SolicitudDeResenaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function registrarVenta(User $quien, array $extra = [], string $prefijo = 'admin'): Venta
    {
        $producto = ProductoGeneral::create([
            'codigo' => 'PG-' . random_int(100, 999), 'tipo' => 'accesorio', 'nombre' => 'Cargador 20 W',
            'procedencia' => 'tienda', 'precio_costo' => 25, 'precio_venta' => 40, 'estado' => 'disponible',
        ]);
        $respuesta = $this->actingAs($quien)->postJson(route("$prefijo.ventas.store"), $extra + [
            'nombre_cliente' => 'Ana María Quispe', 'telefono_cliente' => '75555555', 'tipo_venta' => 'producto',
            'es_permuta' => false, 'tipo_permuta' => null, 'metodo_pago' => 'efectivo', 'descuento' => 0,
            'items' => [['tipo' => 'producto_general', 'producto_id' => $producto->id, 'cantidad' => 1, 'descuento' => 0]],
        ])->assertOk();

        return Venta::findOrFail($respuesta->json('venta_id'));
    }

    public function test_el_enlace_y_el_mensaje_salen_de_la_configuracion_y_llevan_el_nombre(): void
    {
        ConfiguracionTienda::set('resena_enlace', 'https://g.page/r/ABC/review');
        $venta = $this->registrarVenta($this->admin(), ['nombre_cliente' => 'Carlos Rojas', 'telefono_cliente' => '70011223']);

        $this->assertSame('https://g.page/r/ABC/review', Solicitud::enlace());
        $mensaje = Solicitud::mensajeWhatsapp($venta);
        $this->assertStringContainsString('Hola Carlos', $mensaje);
        $this->assertStringContainsString('https://g.page/r/ABC/review', $mensaje);

        $panel = Solicitud::paraPanel($venta);
        $this->assertStringStartsWith('https://wa.me/59170011223?text=', $panel['whatsapp']);
        $this->assertSame('https://g.page/r/ABC/review', $panel['enlace']);
    }

    public function test_el_boton_del_panel_manda_el_correo_marca_la_venta_y_guarda_el_contacto(): void
    {
        $admin = $this->admin();
        $venta = $this->registrarVenta($admin); // sin correo del cliente

        $this->actingAs($admin)->post(route('admin.resenas.pedir', ['id' => $venta->id]), ['correo' => ' Ana.Quispe@Example.com '])
            ->assertRedirect();

        $venta->refresh();
        $this->assertSame('ana.quispe@example.com', $venta->correo_cliente);
        $this->assertNotNull($venta->resena_pedida_en);
        Mail::assertQueued(SolicitudDeResena::class, fn (SolicitudDeResena $m) => $m->hasTo('ana.quispe@example.com') && $m->venta->is($venta));
        $this->assertDatabaseHas('clientes', ['correo' => 'ana.quispe@example.com']);
        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'ana.quispe@example.com']);
    }

    public function test_el_vendedor_solo_pide_resena_de_sus_propias_ventas(): void
    {
        $vendedora = User::factory()->create(['rol' => 'vendedor']);
        $otro = User::factory()->create(['rol' => 'vendedor']);
        $venta = $this->registrarVenta($vendedora, ['correo_cliente' => 'duena@example.com'], 'vendedor');

        $this->actingAs($otro)->post(route('vendedor.resenas.pedir', ['id' => $venta->id]), [])->assertForbidden();
        $this->actingAs($vendedora)->post(route('vendedor.resenas.pedir', ['id' => $venta->id]), [])->assertRedirect();
        Mail::assertQueued(SolicitudDeResena::class, fn (SolicitudDeResena $m) => $m->hasTo('duena@example.com'));
    }

    public function test_no_se_pide_dos_veces_salvo_que_el_panel_lo_fuerce_ni_a_quien_no_quiere_correos(): void
    {
        $venta = $this->registrarVenta($this->admin(), ['correo_cliente' => 'ana@example.com']);

        $this->assertTrue(Solicitud::pedir($venta, 'ana@example.com', 'auto'));
        $this->assertFalse(Solicitud::pedir($venta->fresh(), 'ana@example.com', 'auto'), 'no repite en automático');
        $this->assertTrue(Solicitud::pedir($venta->fresh(), 'ana@example.com', 'panel', forzar: true), 'el panel sí puede reenviar');

        // Opt-out: un cliente con usuario que pidió no recibir correos no recibe el pedido de reseña.
        $usuario = User::factory()->create(['rol' => 'cliente', 'sin_recordatorios' => true]);
        $vOpt = $this->registrarVenta($this->admin(), ['correo_cliente' => 'opt@example.com']);
        $vOpt->forceFill(['user_id' => $usuario->id])->save();
        $this->assertFalse(Solicitud::pedir($vOpt->fresh(), 'opt@example.com', 'auto'));
    }

    public function test_el_comando_automatico_pide_a_las_ventas_de_hace_unos_dias_una_vez_por_correo(): void
    {
        $admin = $this->admin();
        // En ventana (hace 3 días), con correo
        $enVentana = $this->registrarVenta($admin, ['correo_cliente' => 'uno@example.com']);
        $enVentana->forceFill(['created_at' => now()->subDays(3)])->save();
        // Mismo correo, también en ventana: no debe recibir un segundo correo
        $mismo = $this->registrarVenta($admin, ['correo_cliente' => 'uno@example.com']);
        $mismo->forceFill(['created_at' => now()->subDays(3)])->save();
        // Recién hecha (hoy): todavía no entra
        $this->registrarVenta($admin, ['correo_cliente' => 'dos@example.com']);

        Mail::fake(); // ignorar las notas de venta ya encoladas
        $this->artisan('resenas:pedir-ventas')->assertSuccessful();

        Mail::assertQueued(SolicitudDeResena::class, 1);
        Mail::assertQueued(SolicitudDeResena::class, fn (SolicitudDeResena $m) => $m->hasTo('uno@example.com'));
        $this->assertNotNull($enVentana->fresh()->resena_pedida_en);
        $this->assertNull($mismo->fresh()->resena_pedida_en, 'no se pide dos veces al mismo correo');
    }

    public function test_el_comando_masivo_pide_a_los_clientes_con_correo_con_dedupe_y_limite(): void
    {
        $admin = $this->admin();
        foreach (['a@example.com', 'b@example.com', 'a@example.com'] as $correo) {
            $this->registrarVenta($admin, ['correo_cliente' => $correo]);
        }
        $this->registrarVenta($admin); // sin correo: se salta

        Mail::fake();
        $this->artisan('resenas:pedir-historico', ['--limite' => 10])->assertSuccessful();

        Mail::assertQueued(SolicitudDeResena::class, 2); // a@ y b@, una sola vez cada uno
        Mail::assertQueued(SolicitudDeResena::class, fn (SolicitudDeResena $m) => $m->hasTo('a@example.com'));
        Mail::assertQueued(SolicitudDeResena::class, fn (SolicitudDeResena $m) => $m->hasTo('b@example.com'));
    }

    public function test_el_comando_de_prueba_manda_la_muestra_de_resena(): void
    {
        $this->registrarVenta($this->admin(), ['correo_cliente' => 'real@example.com']);
        Mail::fake();
        $this->artisan('correos:prueba', ['correo' => 'prueba@example.com', '--solo' => 'resena'])->assertSuccessful();
        Mail::assertSent(SolicitudDeResena::class, fn (SolicitudDeResena $m) => $m->hasTo('prueba@example.com'));
    }
}
