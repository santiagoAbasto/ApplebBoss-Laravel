<?php

namespace Tests\Feature;

use App\Mail\BoletaDeVenta;
use App\Mail\InformeTecnico;
use App\Mail\NotaDeReserva;
use App\Mail\NotaDeServicio;
use App\Models\Cliente;
use App\Models\Diagnostico;
use App\Models\NewsletterSubscriber;
use App\Models\ProductoGeneral;
use App\Models\Reserva;
use App\Models\ServicioTecnico;
use App\Models\Tecnico;
use App\Models\User;
use App\Models\Venta;
use App\Support\Documentos\Documento;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * Los documentos del cliente le llegan solos por correo (nota de venta, de servicio, de reserva e informe técnico),
 * su correo queda en Clientes y en el newsletter, el PDF se abre por enlace firmado y el panel puede reenviarlos.
 */
class CorreosDeDocumentosTest extends TestCase
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

    private function producto(string $codigo = 'PG-001'): ProductoGeneral
    {
        return ProductoGeneral::create([
            'codigo' => $codigo, 'tipo' => 'accesorio', 'nombre' => 'Cargador 20 W', 'procedencia' => 'tienda',
            'precio_costo' => 25, 'precio_venta' => 40, 'estado' => 'disponible',
        ]);
    }

    private function registrarVenta(User $quien, array $extra = [], string $prefijo = 'admin'): Venta
    {
        $producto = $this->producto('PG-' . random_int(100, 999));
        $respuesta = $this->actingAs($quien)->postJson(route("$prefijo.ventas.store"), $extra + [
            'nombre_cliente' => 'Ana María Quispe', 'telefono_cliente' => '75555555', 'tipo_venta' => 'producto',
            'es_permuta' => false, 'tipo_permuta' => null, 'metodo_pago' => 'efectivo', 'descuento' => 0,
            'items' => [['tipo' => 'producto_general', 'producto_id' => $producto->id, 'cantidad' => 1, 'descuento' => 0]],
        ])->assertOk();

        return Venta::findOrFail($respuesta->json('venta_id'));
    }

    private function formularioDeServicio(array $datos = []): array
    {
        return $datos + [
            'cliente' => 'Luis Mamani', 'telefono' => '70000001', 'equipo' => 'iPhone 13', 'marca' => ServicioTecnico::MARCA_APPLE,
            'tecnico_id' => Tecnico::firstOrCreate(['nombre' => 'AXEL'], ['especialidad' => Tecnico::AMBAS])->id,
            'detalle_servicio' => json_encode([['descripcion' => 'Cambio de batería', 'costo' => 100, 'precio' => 250]]),
            'precio_venta' => 250,
        ];
    }

    public function test_la_venta_con_correo_manda_la_nota_y_guarda_el_correo_en_clientes_y_el_newsletter(): void
    {
        $venta = $this->registrarVenta($this->admin(), ['correo_cliente' => ' Ana.Quispe@Example.com ']);

        $this->assertSame('ana.quispe@example.com', $venta->correo_cliente);
        $this->assertNotNull($venta->correo_enviado_en);
        Mail::assertQueued(BoletaDeVenta::class, fn (BoletaDeVenta $m) => $m->hasTo('ana.quispe@example.com') && $m->venta->is($venta));

        $this->assertSame('ana.quispe@example.com', Cliente::where('telefono', '75555555')->value('correo'));
        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'ana.quispe@example.com', 'source' => 'venta', 'unsubscribed_at' => null]);
    }

    public function test_sin_correo_no_sale_nada_y_el_cliente_queda_igual(): void
    {
        $venta = $this->registrarVenta($this->admin());

        $this->assertNull($venta->correo_cliente);
        Mail::assertNothingQueued();
        $this->assertSame(0, NewsletterSubscriber::count());
    }

    public function test_el_servicio_avisa_al_recibir_el_equipo_y_en_cada_cambio_de_estado(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.servicios.store'), $this->formularioDeServicio(['correo' => 'luis@example.com']))
            ->assertRedirect(route('admin.servicios.index'));

        $servicio = ServicioTecnico::latest('id')->firstOrFail();
        $this->assertSame(ServicioTecnico::RECIBIDO, $servicio->estado);
        $this->assertSame('luis@example.com', $servicio->correo);
        Mail::assertQueued(NotaDeServicio::class, fn (NotaDeServicio $m) => $m->hasTo('luis@example.com') && $m->servicio->estado === ServicioTecnico::RECIBIDO);

        $this->actingAs($admin)->patch(route('admin.servicios.estado', $servicio), ['estado' => ServicioTecnico::LISTO])
            ->assertRedirect()->assertSessionHas('success');
        $this->assertSame(ServicioTecnico::LISTO, $servicio->fresh()->estado);
        Mail::assertQueued(NotaDeServicio::class, fn (NotaDeServicio $m) => $m->servicio->estado === ServicioTecnico::LISTO);

        $this->actingAs($admin)->from(route('admin.servicios.index'))->patch(route('admin.servicios.estado', $servicio), ['estado' => 'perdido'])
            ->assertSessionHasErrors('estado');
        Mail::assertQueuedCount(2);
    }

    public function test_la_reserva_avisa_al_registrarse_y_cuando_vence_pero_no_al_reactivarla(): void
    {
        $admin = $this->admin();
        $producto = $this->producto();
        $respuesta = $this->actingAs($admin)->postJson(route('admin.reservas.store'), [
            'nombre_cliente' => 'Carla Flores', 'telefono_cliente' => '76000000', 'correo_cliente' => 'carla@example.com', 'monto_reserva' => 10,
            'items' => [['tipo' => 'producto_general', 'producto_id' => $producto->id, 'cantidad' => 1, 'descuento' => 0]],
        ])->assertOk();
        $reserva = Reserva::findOrFail($respuesta->json('reserva_id'));

        Mail::assertQueued(NotaDeReserva::class, fn (NotaDeReserva $m) => $m->hasTo('carla@example.com') && $m->reserva->estado === 'activa');
        $this->assertSame('carla@example.com', Cliente::where('telefono', '76000000')->value('correo'));

        $this->actingAs($admin)->patch(route('admin.reservas.estado', $reserva), ['estado' => 'vencida'])->assertRedirect();
        Mail::assertQueued(NotaDeReserva::class, fn (NotaDeReserva $m) => $m->reserva->estado === 'vencida');

        $this->actingAs($admin)->patch(route('admin.reservas.estado', $reserva), ['estado' => 'activa'])->assertRedirect();
        Mail::assertQueuedCount(2);
    }

    public function test_el_informe_tecnico_sale_la_primera_vez_que_queda_firmado_y_una_sola_vez(): void
    {
        $admin = $this->admin();
        $base = ['fecha' => '2026-10-19', 'cliente_nombre' => 'Pedro Vargas', 'cliente_correo' => 'pedro@example.com', 'equipo' => 'iPhone 15', 'falla_reportada' => 'No carga'];

        $this->actingAs($admin)->post(route('admin.diagnosticos.store'), $base)->assertRedirect();
        $diagnostico = Diagnostico::latest('id')->firstOrFail();
        $this->assertFalse($diagnostico->listo());
        Mail::assertNotQueued(InformeTecnico::class);

        $firmado = $base + ['pruebas' => [['prueba' => 'Carga y puerto', 'resultado' => 'falla', 'detalle' => 'Puerto sulfatado']], 'conclusion' => 'Cambio de puerto de carga', 'tecnico' => 'AXEL'];
        $this->actingAs($admin)->put(route('admin.diagnosticos.update', $diagnostico), $firmado)->assertRedirect();
        Mail::assertQueued(InformeTecnico::class, fn (InformeTecnico $m) => $m->hasTo('pedro@example.com') && $m->diagnostico->is($diagnostico));
        $this->assertNotNull($diagnostico->fresh()->correo_enviado_en);

        $this->actingAs($admin)->put(route('admin.diagnosticos.update', $diagnostico), $firmado + ['recomendacion' => 'Usar cargador certificado'])->assertRedirect();
        Mail::assertQueuedCount(1);
    }

    public function test_el_enlace_publico_es_una_clave_que_no_revela_nada_vence_y_no_se_indexa(): void
    {
        $venta = $this->registrarVenta($this->admin());

        $enlace = Documento::enlace($venta);
        $this->assertMatchesRegularExpression('#/d/[A-Za-z0-9]{32}$#', $enlace, 'ni el tipo ni el número interno a la vista');
        $this->assertStringNotContainsString('/venta/', $enlace);
        $this->assertStringNotContainsString('signature=', $enlace);
        $this->assertSame($enlace, Documento::enlace(Venta::find($venta->id)), 'el mismo documento reusa su enlace vigente');

        $pagina = $this->get($enlace)->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
            ->assertHeader('Referrer-Policy', 'no-referrer');
        $pagina->assertSee('<meta property="og:title" content="Nota de venta ' . $venta->codigo_nota . ' · Apple Boss">', false)
            ->assertSee('documento-og.png', false)
            ->assertSee('noindex, nofollow, noarchive', false)
            ->assertDontSee('Ana María', false); // la vista previa no lleva datos del cliente
        $this->get($enlace . '/pdf')->assertOk()->assertHeader('Content-Type', 'application/pdf')->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

        $this->get('/d/' . str_repeat('a', 32))->assertNotFound();
        $this->get('/d/' . str_repeat('a', 32) . '/pdf')->assertNotFound();

        \Illuminate\Support\Facades\DB::table('enlaces_documento')->update(['vence_en' => now()->subMinute()]);
        $this->get($enlace)->assertStatus(410)->assertSee('Este enlace venció');
        $this->get($enlace . '/pdf')->assertStatus(410);
        $nuevo = Documento::enlace(Venta::find($venta->id));
        $this->assertNotSame($enlace, $nuevo, 'vencido, se arma uno nuevo');
        $this->get($nuevo)->assertOk();

        // Los enlaces firmados del primer día llevan al enlace nuevo; sin firma, 403
        $this->get(URL::signedRoute('documentos.ver', ['tipo' => 'venta', 'id' => $venta->id]))->assertRedirect($nuevo);
        $this->get('/documentos/venta/' . $venta->id)->assertForbidden();

        $borrador = Diagnostico::create(['fecha' => '2026-10-19', 'cliente_nombre' => 'Pedro', 'equipo' => 'iPad', 'falla_reportada' => 'No enciende', 'user_id' => User::factory()->create(['rol' => 'admin'])->id]);
        $this->assertNull(Documento::enlace($borrador));
    }

    public function test_el_listado_prepara_los_enlaces_de_una_vez_y_no_los_repite(): void
    {
        $admin = $this->admin();
        foreach (range(1, 3) as $i) {
            $this->registrarVenta($admin);
        }
        \Illuminate\Support\Facades\DB::table('enlaces_documento')->delete();

        $this->actingAs($admin)->get(route('admin.ventas.index'))->assertOk();
        $this->assertSame(3, \Illuminate\Support\Facades\DB::table('enlaces_documento')->count());

        $this->actingAs($admin)->get(route('admin.ventas.index'))->assertOk();
        $this->assertSame(3, \Illuminate\Support\Facades\DB::table('enlaces_documento')->count(), 'los vigentes se reusan');
    }

    public function test_desde_el_panel_se_manda_con_un_correo_nuevo_y_el_vendedor_solo_lo_suyo(): void
    {
        $vendedora = User::factory()->create(['rol' => 'vendedor']);
        $otro = User::factory()->create(['rol' => 'vendedor']);
        $venta = $this->registrarVenta($vendedora, [], 'vendedor');
        NewsletterSubscriber::create(['email' => 'nuevo@example.com', 'source' => 'footer', 'unsubscribed_at' => now()]);

        $this->actingAs($otro)->post(route('vendedor.documentos.correo', ['tipo' => 'venta', 'id' => $venta->id]), ['correo' => 'nuevo@example.com'])->assertForbidden();

        $this->actingAs($vendedora)->from(route('vendedor.ventas.index'))
            ->post(route('vendedor.documentos.correo', ['tipo' => 'venta', 'id' => $venta->id]), ['correo' => 'nuevo@example.com'])
            ->assertRedirect(route('vendedor.ventas.index'))->assertSessionHas('success');

        $this->assertSame('nuevo@example.com', $venta->fresh()->correo_cliente);
        $this->assertSame('nuevo@example.com', Cliente::where('telefono', '75555555')->value('correo'));
        Mail::assertQueued(BoletaDeVenta::class, fn (BoletaDeVenta $m) => $m->hasTo('nuevo@example.com'));
        // Pidió la baja del newsletter: no se lo vuelve a suscribir
        $this->assertNotNull(NewsletterSubscriber::where('email', 'nuevo@example.com')->value('unsubscribed_at'));

        $this->actingAs($vendedora)->from(route('vendedor.ventas.index'))
            ->post(route('vendedor.documentos.correo', ['tipo' => 'venta', 'id' => $venta->id]), ['correo' => 'esto-no-es-correo'])
            ->assertSessionHasErrors('correo');
    }

    public function test_los_correos_se_renderizan_con_la_marca_y_el_mensaje_de_whatsapp_lleva_el_enlace(): void
    {
        $admin = $this->admin();
        $venta = $this->registrarVenta($admin, ['correo_cliente' => 'ana@example.com']);
        $this->actingAs($admin)->post(route('admin.servicios.store'), $this->formularioDeServicio());
        $servicio = ServicioTecnico::latest('id')->firstOrFail();

        $html = (new BoletaDeVenta($venta))->render();
        $this->assertStringContainsString($venta->codigo_nota, $html);
        $this->assertStringContainsString('Cargador 20 W', $html);
        $this->assertStringContainsString('check-animado.gif', $html);
        $this->assertStringContainsString('logo-animado.gif', $html);

        $servicio->estado = ServicioTecnico::LISTO;
        $html = (new NotaDeServicio($servicio))->render();
        $this->assertStringContainsString('reparado', $html);
        $this->assertStringContainsString('Cambio de batería', $html);
        $this->assertStringNotContainsString('100,00', $html, 'el costo del trabajo nunca viaja al cliente');

        $reserva = Reserva::create(['nombre_cliente' => 'Carla Flores', 'telefono_cliente' => '76000000', 'fecha' => now(), 'subtotal' => 40, 'monto_reserva' => 10, 'estado' => 'activa', 'user_id' => $admin->id]);
        $html = (new NotaDeReserva($reserva))->render();
        $this->assertStringContainsString('Separamos tu equipo, Carla', $html);
        $this->assertStringContainsString('30,00', $html, 'el saldo es el total menos el abono');

        $diagnostico = Diagnostico::create(['fecha' => '2026-10-19', 'cliente_nombre' => 'Pedro Vargas', 'equipo' => 'iPhone 15', 'falla_reportada' => 'No carga', 'conclusion' => 'Puerto dañado', 'tecnico' => 'AXEL', 'pruebas' => [['prueba' => 'Carga y puerto', 'resultado' => 'falla', 'detalle' => null]], 'user_id' => $admin->id]);
        $html = (new InformeTecnico($diagnostico))->render();
        $this->assertStringContainsString('El informe de tu iPhone 15', $html);
        $this->assertStringContainsString('1 con falla', $html);

        $cotizacion = \App\Models\Cotizacion::create(['user_id' => $admin->id, 'nombre_cliente' => 'Rosa Mamani', 'telefono' => '77000000', 'correo_cliente' => 'rosa@example.com', 'fecha_cotizacion' => '2026-10-19', 'items' => [['nombre' => 'iPhone 15 128 GB', 'cantidad' => 1, 'precio_sin_factura' => 5000, 'descuento' => 0, 'iva' => 650, 'it' => 150, 'total' => 5800]], 'total' => 5800, 'moneda' => 'BOB']);
        $html = (new \App\Mail\CotizacionMailable($cotizacion))->render();
        $this->assertStringContainsString('Tu cotización, Rosa', $html);
        $this->assertStringContainsString(Documento::enlace($cotizacion), $html);
        $this->assertStringContainsString('logo-animado.gif', $html, 'la cotización usa el mismo marco de marca');

        $mensaje = Documento::mensajeWhatsapp($venta);
        $this->assertStringContainsString($venta->codigo_nota, $mensaje);
        $this->assertStringContainsString(Documento::enlace($venta), $mensaje);
        $this->assertStringNotContainsString('respondé', $mensaje, 'tuteo, sin voseo');
        $this->assertStringStartsWith('https://wa.me/59175555555?text=', Documento::whatsapp($venta));
        $this->assertSame('ana@example.com', $venta->compartir['correo'] ?? Documento::compartir($venta)['correo']);
    }

    public function test_el_comando_de_prueba_manda_una_muestra_de_cada_correo(): void
    {
        $admin = $this->admin();
        $this->registrarVenta($admin);
        $this->actingAs($admin)->post(route('admin.servicios.store'), $this->formularioDeServicio());

        $this->artisan('correos:prueba', ['correo' => 'prueba@example.com'])->assertSuccessful();

        Mail::assertSent(BoletaDeVenta::class, fn ($m) => $m->hasTo('prueba@example.com'));
        Mail::assertSent(NotaDeServicio::class, 2);
        Mail::assertNothingQueued(); // la muestra va directa, sin cola, y nunca al cliente real
    }
}
