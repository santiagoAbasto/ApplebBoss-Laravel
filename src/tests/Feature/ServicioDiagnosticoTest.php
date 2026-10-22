<?php

namespace Tests\Feature;

use App\Mail\NotaDeServicio;
use App\Models\ServicioTecnico;
use App\Models\Tecnico;
use App\Models\User;
use App\Support\Documentos\Documento;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Servicio técnico en dos modos: «diagnóstico» (entra sin precio de reparación; el presupuesto se carga después y el
 * cliente lo aprueba o rechaza por correo) y «directo» (ya se sabe el precio, como siempre). Cada estado le avisa al
 * cliente, estilo tracker, hasta reparado y entregado.
 */
class ServicioDiagnosticoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function tecnico(): Tecnico
    {
        return Tecnico::create(['nombre' => 'AXEL', 'especialidad' => Tecnico::AMBAS, 'activo' => true]);
    }

    private function ingreso(array $extra = []): array
    {
        return array_merge([
            'cliente' => 'María Rojas',
            'telefono' => '70011223',
            'correo' => 'maria@example.com',
            'equipo' => 'iPhone 13',
            'marca' => 'apple',
            'recepcion' => ['revision' => [], 'desbloqueo' => ['modo' => 'sin_bloqueo']],
            'fecha' => '2026-10-20',
        ], $extra);
    }

    public function test_ingreso_en_modo_diagnostico_entra_sin_precio_y_en_estado_diagnostico(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $this->tecnico();

        $this->actingAs($admin)
            ->post(route('admin.servicios.store'), $this->ingreso([
                'modo' => 'diagnostico',
                'tecnico_id' => Tecnico::first()->id,
                'cuota_diagnostico' => 0,
            ]))
            ->assertRedirect(route('admin.servicios.index'));

        $servicio = ServicioTecnico::firstOrFail();
        $this->assertSame(ServicioTecnico::MODO_DIAGNOSTICO, $servicio->modo);
        $this->assertSame(ServicioTecnico::EN_DIAGNOSTICO, $servicio->estado);
        $this->assertEqualsWithDelta(0, (float) $servicio->precio_venta, 0.01);
        $this->assertTrue((bool) $servicio->costo_pendiente);
        // Sin trabajos todavía: detalle vacío (nunca '[]', que se imprimiría literal en la nota y el correo).
        $this->assertSame('', (string) $servicio->detalle_servicio);
        // Un diagnóstico en diagnóstico no cuenta como «falta el costo»: todavía no hay precio sobre el cual cargar costo.
        $this->assertSame(0, ServicioTecnico::sinCosto()->count());
    }

    public function test_un_diagnostico_cuenta_como_falta_costo_recien_con_presupuesto_de_vendedor(): void
    {
        $vendedora = User::factory()->create(['rol' => 'vendedor']);
        $servicio = $this->servicioDiagnostico($vendedora);

        // En diagnóstico no cuenta…
        $this->assertSame(0, ServicioTecnico::sinCosto()->count());

        // …pero una vez que el vendedor carga el presupuesto (precio sin costo), sí: el admin debe cargar el costo.
        Mail::fake();
        $this->actingAs($vendedora)
            ->patch(route('vendedor.servicios.presupuesto', $servicio), [
                'detalle_servicio' => json_encode([['descripcion' => 'Cambio de pantalla', 'precio' => 550]]),
            ])
            ->assertRedirect();

        $servicio->refresh();
        $this->assertSame(ServicioTecnico::PRESUPUESTO, $servicio->estado);
        $this->assertTrue((bool) $servicio->costo_pendiente);
        $this->assertSame(1, ServicioTecnico::sinCosto()->count());
    }

    public function test_el_modo_directo_sigue_como_siempre(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $this->tecnico();

        $this->actingAs($admin)
            ->post(route('admin.servicios.store'), $this->ingreso([
                'modo' => 'directo',
                'tecnico_id' => Tecnico::first()->id,
                'detalle_servicio' => json_encode([['descripcion' => 'Cambio de batería', 'costo' => 100, 'precio' => 250]]),
                'precio_venta' => 250,
            ]))
            ->assertRedirect(route('admin.servicios.index'));

        $servicio = ServicioTecnico::firstOrFail();
        $this->assertSame(ServicioTecnico::MODO_DIRECTO, $servicio->modo);
        $this->assertSame(ServicioTecnico::RECIBIDO, $servicio->estado);
        $this->assertEqualsWithDelta(250, (float) $servicio->precio_venta, 0.01);
    }

    public function test_cargar_presupuesto_fija_el_precio_y_avisa_al_cliente(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $servicio = $this->servicioDiagnostico($admin);

        Mail::fake();
        $this->actingAs($admin)
            ->patch(route('admin.servicios.presupuesto', $servicio), [
                'detalle_servicio' => json_encode([['descripcion' => 'Cambio de pantalla', 'costo' => 300, 'precio' => 550]]),
            ])
            ->assertRedirect();

        $servicio->refresh();
        $this->assertSame(ServicioTecnico::PRESUPUESTO, $servicio->estado);
        $this->assertEqualsWithDelta(550, (float) $servicio->precio_venta, 0.01);
        $this->assertEqualsWithDelta(300, (float) $servicio->precio_costo, 0.01);
        $this->assertNotNull($servicio->presupuesto_en);
        Mail::assertQueued(NotaDeServicio::class, fn (NotaDeServicio $m) => $m->hasTo('maria@example.com'));
    }

    public function test_el_cliente_aprueba_el_presupuesto_desde_el_enlace(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $servicio = $this->servicioConPresupuesto($admin);
        $token = Documento::tokenDe($servicio);

        // La página pública muestra el monto y los botones.
        $this->get(route('servicios.presupuesto.publico', $token))
            ->assertOk();

        Mail::fake();
        $this->post(route('servicios.presupuesto.aprobar', $token))->assertRedirect();

        $servicio->refresh();
        $this->assertSame(ServicioTecnico::EN_REPARACION, $servicio->estado);
        $this->assertNotNull($servicio->aprobado_en);
        Mail::assertQueued(NotaDeServicio::class);

        // Idempotente: volver a aprobar no revierte ni duplica.
        $this->post(route('servicios.presupuesto.aprobar', $token))->assertRedirect();
        $this->assertSame(ServicioTecnico::EN_REPARACION, $servicio->fresh()->estado);
    }

    public function test_el_cliente_rechaza_el_presupuesto(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $servicio = $this->servicioConPresupuesto($admin);
        $token = Documento::tokenDe($servicio);

        $this->post(route('servicios.presupuesto.rechazar', $token))->assertRedirect();

        $servicio->refresh();
        $this->assertSame(ServicioTecnico::RECHAZADO, $servicio->estado);
        $this->assertNotNull($servicio->rechazado_en);
    }

    public function test_un_diagnostico_sin_presupuesto_no_salta_a_entregado_desde_el_desplegable(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $servicio = $this->servicioDiagnostico($admin);

        // En_diagnostico no permite saltar a entregado (hay que pasar por el presupuesto).
        $this->actingAs($admin)
            ->patch(route('admin.servicios.estado', $servicio), ['estado' => ServicioTecnico::ENTREGADO])
            ->assertSessionHasErrors('estado');

        $this->assertSame(ServicioTecnico::EN_DIAGNOSTICO, $servicio->fresh()->estado);
    }

    private function servicioDiagnostico(User $user): ServicioTecnico
    {
        return ServicioTecnico::create([
            'codigo_nota' => 'AT-ST900', 'cliente' => 'María Rojas', 'telefono' => '70011223',
            'correo' => 'maria@example.com', 'equipo' => 'iPhone 13', 'marca' => 'apple',
            'estado' => ServicioTecnico::EN_DIAGNOSTICO, 'modo' => ServicioTecnico::MODO_DIAGNOSTICO,
            'detalle_servicio' => '[]', 'precio_venta' => 0, 'precio_costo' => 0, 'costo_pendiente' => true,
            'cuota_diagnostico' => 0, 'tecnico' => 'AXEL', 'fecha' => '2026-10-20', 'user_id' => $user->id,
        ]);
    }

    private function servicioConPresupuesto(User $user): ServicioTecnico
    {
        $servicio = $this->servicioDiagnostico($user);
        $servicio->update([
            'estado' => ServicioTecnico::PRESUPUESTO,
            'detalle_servicio' => json_encode([['descripcion' => 'Cambio de pantalla', 'costo' => 300, 'precio' => 550]]),
            'precio_venta' => 550, 'precio_costo' => 300, 'costo_pendiente' => false, 'presupuesto_en' => now(),
        ]);

        return $servicio;
    }
}
