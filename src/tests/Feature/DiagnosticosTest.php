<?php

namespace Tests\Feature;

use App\Models\Cotizacion;
use App\Models\Diagnostico;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DiagnosticosTest extends TestCase
{
    use RefreshDatabase;

    private function datos(array $extra = []): array
    {
        return array_merge([
            'fecha'           => '2026-10-06',
            'cliente_nombre'  => 'Cliente de prueba',
            'cliente_telefono' => '+59170000000',
            'equipo'          => 'iPhone 15',
            'falla_reportada' => 'Se calienta al cargar.',
        ], $extra);
    }

    public function test_sale_como_borrador_sin_firma_hasta_que_el_tecnico_lo_revisa(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);

        $this->actingAs($admin)->post('/admin/diagnosticos', $this->datos())->assertRedirect();

        $diagnostico = Diagnostico::firstOrFail();
        $this->assertSame('AB-DG-000001', $diagnostico->codigo);
        $this->assertFalse($diagnostico->listo());

        $html = view('pdf.diagnostico', compact('diagnostico'))->render();
        $this->assertStringContainsString('BORRADOR SIN VALIDEZ', $html);
        $this->assertStringContainsString('Faltan las pruebas, la conclusión y el técnico', $html);
        $this->assertStringNotContainsString('firma.png', $html);

        // El técnico lo revisa: solo cuentan las pruebas con resultado
        $this->actingAs($admin)->put("/admin/diagnosticos/{$diagnostico->id}", $this->datos([
            'pruebas' => [
                ['prueba' => 'Batería (salud y temperatura)', 'resultado' => 'falla', 'detalle' => 'Salud 78 %'],
                ['prueba' => 'Cámaras', 'resultado' => '', 'detalle' => ''],
            ],
            'conclusion' => 'Batería degradada.',
            'tecnico'    => 'Técnico de prueba',
        ]))->assertRedirect();

        $diagnostico->refresh();
        $this->assertTrue($diagnostico->listo());
        $this->assertCount(1, $diagnostico->pruebas);

        $html = view('pdf.diagnostico', compact('diagnostico'))->render();
        $this->assertStringNotContainsString('BORRADOR SIN VALIDEZ', $html);
        $this->assertStringContainsString('firma.png', $html);
        $this->assertStringContainsString('Presenta falla', $html);

        $this->actingAs($admin)->get("/admin/diagnosticos/{$diagnostico->id}/pdf")
            ->assertOk()->assertHeader('content-type', 'application/pdf');

        $this->actingAs($admin)->get('/admin/diagnosticos')->assertOk()
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
                ->component('Admin/Diagnosticos/Index')
                ->where('diagnosticos.0.codigo', 'AB-DG-000001')
                ->where('diagnosticos.0.listo', true)
                ->where('diagnosticos.0.falta', null));
    }

    public function test_pide_cliente_equipo_y_falla(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);

        $this->actingAs($admin)->post('/admin/diagnosticos', ['fecha' => '2026-10-06'])
            ->assertSessionHasErrors(['cliente_nombre', 'equipo', 'falla_reportada']);

        $this->assertSame(0, Diagnostico::count());
    }

    public function test_solo_entra_quien_tiene_el_modulo(): void
    {
        Cache::flush();
        Role::create(['clave' => 'encargado', 'nombre' => 'Encargado', 'permisos' => ['servicios'], 'activo' => true]);
        $encargado = User::factory()->create(['rol' => 'encargado']);

        $this->actingAs($encargado)->get('/admin/diagnosticos')->assertForbidden();
        $this->post('/logout');
        $this->get('/admin/diagnosticos')->assertRedirect();
    }

    public function test_una_cotizacion_en_dolares_se_imprime_en_dolares(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['rol' => 'admin']);

        $this->actingAs($admin)->post(route('admin.cotizaciones.store'), [
            'nombre_cliente'    => 'Cliente de prueba',
            'telefono_completo' => '+59170000000',
            'fecha_cotizacion'  => '2026-10-06',
            'moneda'            => 'USD',
            'items'             => [['nombre' => 'iPhone 15', 'cantidad' => 1, 'precio_sin_factura' => 720]],
        ])->assertRedirect();

        $cotizacion = Cotizacion::firstOrFail();
        $this->assertSame('USD', $cotizacion->moneda);

        $html = view('pdf.cotizacion', compact('cotizacion'))->render();
        $this->assertStringContainsString('$us 720.00', $html);
        $this->assertStringContainsString('dólares estadounidenses', $html);
        $this->assertStringContainsString('Precios en dólares', $html);
        $this->assertStringNotContainsString('Bs ', $html);
    }
}
