<?php

namespace Tests\Feature;

use App\Models\ServicioTecnico;
use App\Models\SystemNotification;
use App\Models\Tecnico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Editar un servicio técnico «por si alguien se equivoca», igual que en ventas: lo pueden hacer el administrador
 * y el vendedor (solo los suyos). El administrador ve en el Resumen qué se cambió y quién lo hizo. El costo lo
 * escribe solo el administrador: una edición del vendedor nunca pisa lo que el administrador ya cargó.
 */
class ServicioEdicionTest extends TestCase
{
    use RefreshDatabase;

    private int $n = 0;

    private function tecnico(): Tecnico
    {
        return Tecnico::create(['nombre' => 'AXEL', 'especialidad' => Tecnico::AMBAS, 'activo' => true]);
    }

    private function servicio(User $user, array $datos = []): ServicioTecnico
    {
        $this->n++;

        return ServicioTecnico::create(array_merge([
            'codigo_nota' => sprintf('AT-ST%03d', $this->n),
            'cliente' => 'Cliente ' . $this->n,
            'telefono' => '7000000' . $this->n,
            'equipo' => 'iPhone 13',
            'marca' => 'apple',
            'estado' => ServicioTecnico::RECIBIDO,
            'detalle_servicio' => json_encode([['descripcion' => 'Cambio de batería', 'costo' => 100, 'precio' => 250]]),
            'precio_costo' => 100,
            'precio_venta' => 250,
            'costo_pendiente' => false,
            'tecnico' => 'AXEL',
            'fecha' => '2026-09-10',
            'user_id' => $user->id,
        ], $datos));
    }

    private function payload(Tecnico $tecnico, array $trabajos, array $extra = []): array
    {
        return array_merge([
            'cliente' => 'Cliente Corregido',
            'telefono' => '70011223',
            'equipo' => 'iPhone 13 Pro',
            'marca' => 'apple',
            'tecnico_id' => $tecnico->id,
            'recepcion' => ['revision' => [], 'desbloqueo' => ['modo' => 'sin_bloqueo']],
            'fecha' => '2026-09-10',
            'notas_adicionales' => null,
            'detalle_servicio' => json_encode($trabajos),
            'precio_venta' => array_sum(array_column($trabajos, 'precio')),
        ], $extra);
    }

    public function test_el_admin_edita_y_queda_la_trazabilidad_del_cambio(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $tecnico = $this->tecnico();
        $servicio = $this->servicio($admin);

        $this->actingAs($admin)
            ->put(route('admin.servicios.update', $servicio), $this->payload($tecnico, [
                ['descripcion' => 'Cambio de pantalla', 'costo' => 300, 'precio' => 500],
            ]))
            ->assertRedirect(route('admin.servicios.index'));

        $servicio->refresh();
        $this->assertSame('Cliente Corregido', $servicio->cliente);
        $this->assertSame('iPhone 13 Pro', $servicio->equipo);
        $this->assertEqualsWithDelta(500, (float) $servicio->precio_venta, 0.01);
        $this->assertEqualsWithDelta(300, (float) $servicio->precio_costo, 0.01, 'el admin recalcula el costo');
        $this->assertFalse((bool) $servicio->costo_pendiente);

        $notif = SystemNotification::where('type', 'service_edit')->where('servicio_tecnico_id', $servicio->id)->first();
        $this->assertNotNull($notif, 'queda la notificación de servicio editado');
        $this->assertStringContainsString('Cliente:', $notif->message);
        $this->assertStringContainsString('Cliente ', $notif->message); // el nombre viejo aparece en el diff
    }

    public function test_el_vendedor_solo_edita_los_suyos(): void
    {
        $tecnico = $this->tecnico();
        $vendedora = User::factory()->create(['rol' => 'vendedor']);
        $otro = User::factory()->create(['rol' => 'vendedor']);
        $servicio = $this->servicio($vendedora);

        $this->actingAs($otro)
            ->get(route('vendedor.servicios.edit', $servicio))
            ->assertNotFound();

        $this->actingAs($otro)
            ->put(route('vendedor.servicios.update', $servicio), $this->payload($tecnico, [
                ['descripcion' => 'Cambio de batería', 'precio' => 260],
            ]))
            ->assertNotFound();

        $this->actingAs($vendedora)
            ->put(route('vendedor.servicios.update', $servicio), $this->payload($tecnico, [
                ['descripcion' => 'Cambio de batería', 'precio' => 260],
            ]))
            ->assertRedirect(route('vendedor.servicios.index'));

        $this->assertEqualsWithDelta(260, (float) $servicio->refresh()->precio_venta, 0.01);
    }

    public function test_la_edicion_del_vendedor_no_pisa_el_costo_cargado_por_el_admin(): void
    {
        $tecnico = $this->tecnico();
        $vendedora = User::factory()->create(['rol' => 'vendedor']);
        // El admin ya dejó el costo cargado (100) y el servicio no está pendiente.
        $servicio = $this->servicio($vendedora, ['precio_costo' => 100, 'costo_pendiente' => false]);

        $this->actingAs($vendedora)
            ->put(route('vendedor.servicios.update', $servicio), $this->payload($tecnico, [
                // El vendedor corrige lo que paga el cliente; no ve ni manda el costo.
                ['descripcion' => 'Cambio de batería', 'precio' => 300],
            ]))
            ->assertRedirect();

        $servicio->refresh();
        $this->assertEqualsWithDelta(300, (float) $servicio->precio_venta, 0.01, 'sube lo que cobra');
        $this->assertEqualsWithDelta(100, (float) $servicio->precio_costo, 0.01, 'el costo del admin queda intacto');
        $this->assertFalse((bool) $servicio->costo_pendiente, 'no se vuelve a marcar pendiente');
        // El costo del trabajo se conserva por descripción, aunque el vendedor nunca lo mandó.
        $this->assertSame(100.0, (float) ($servicio->trabajos()[0]['costo'] ?? null));
    }
}
