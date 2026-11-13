<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use App\Models\User;
use App\Support\Temporada;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Correos, PDF y páginas de documentos se visten de Navidad solo con la campaña activa y su interruptor encendido,
 * y vuelven a su aspecto de siempre en cuanto la campaña se apaga desde el panel.
 */
class NavidadEnDocumentosTest extends TestCase
{
    use RefreshDatabase;

    private function encender(array $claves = []): void
    {
        foreach (array_merge(['navidad_modo' => 'manual'], $claves) as $clave => $valor) {
            ConfiguracionTienda::set($clave, $valor);
        }
        ConfiguracionTienda::clearAllCache();
    }

    private function correo(): string
    {
        return view('emails.bienvenida', ['nombre' => 'Ana', 'user' => User::factory()->make(['name' => 'Ana'])])->render();
    }

    public function test_apagada_ningun_documento_lleva_navidad(): void
    {
        $this->assertFalse(Temporada::enDocumentos());
        $this->assertSame('', trim(view('pdf.partials.navidad')->render()));
        $this->assertSame('', trim(view('emails.partials.navidad')->render()));
        $this->assertSame('', trim(view('partials.navidad-pagina')->render()));
        $this->assertStringNotContainsString('#143D2B', view('pdf.partials.estilos')->render());
    }

    public function test_encendida_se_visten_los_pdf_los_correos_y_las_paginas(): void
    {
        $this->encender();

        $this->assertTrue(Temporada::enDocumentos());
        $pdf = view('pdf.partials.navidad')->render();
        $this->assertStringContainsString('FELICES FIESTAS DE PARTE DE APPLE BOSS', $pdf);
        $this->assertStringContainsString('data:image/svg+xml;base64,', $pdf);
        $this->assertStringContainsString('font-size: 7px', view('pdf.partials.navidad', ['compacto' => true])->render(), 'los tickets de 80 mm llevan la versión fina');
        $this->assertStringContainsString('.ficha, .pildora { background: #143D2B; }', view('pdf.partials.estilos')->render());
        $this->assertStringContainsString('Felices fiestas de parte de Apple Boss', view('emails.partials.navidad')->render());
        $this->assertStringContainsString('/images/correo/navidad-trineo.gif', view('emails.partials.navidad')->render());
        $this->assertFileExists(public_path('images/correo/navidad-trineo.gif'), 'el banner animado de los correos tiene que estar en el repo');
        $this->assertStringContainsString('Felices fiestas de parte de Apple Boss', view('partials.navidad-pagina')->render());
    }

    public function test_el_marco_de_los_correos_cambia_de_color_y_vuelve_al_apagar(): void
    {
        $html = view('emails.layouts.marca')->render();
        $this->assertStringContainsString('background:#011446;padding:26px 28px 24px', $html);
        $this->assertStringNotContainsString('Felices fiestas', $html);

        $this->encender();
        $html = view('emails.layouts.marca')->render();
        $this->assertStringContainsString('background:#143D2B;padding:26px 28px 24px', $html);
        $this->assertStringContainsString('Felices fiestas de parte de Apple Boss', $html);

        // Un clic en «Apagar la campaña» del panel y los correos vuelven a ser los de siempre
        $admin = User::factory()->create(['rol' => 'admin', 'email_verified_at' => now()]);
        $this->actingAs($admin)->post('/admin/configuracion/navidad/apagar')->assertSessionHasNoErrors();

        $this->assertFalse(Temporada::enDocumentos());
        $html = view('emails.layouts.marca')->render();
        $this->assertStringContainsString('background:#011446;padding:26px 28px 24px', $html);
        $this->assertStringNotContainsString('Felices fiestas', $html);
        $this->assertSame('', trim(view('pdf.partials.navidad')->render()));
    }

    public function test_el_interruptor_de_documentos_los_apaga_sin_apagar_la_campana(): void
    {
        $this->encender(['navidad_documentos' => '0']);

        $this->assertTrue(Temporada::activa(Temporada::ajustes()), 'la campaña sigue encendida en la web');
        $this->assertFalse(Temporada::enDocumentos());
        $this->assertSame('', trim(view('pdf.partials.navidad')->render()));
        $this->assertStringNotContainsString('Felices fiestas', view('emails.layouts.marca')->render());
    }

    public function test_programada_los_documentos_siguen_el_mismo_reloj(): void
    {
        $this->encender(['navidad_modo' => 'programado', 'navidad_inicio' => '2026-12-01T00:00', 'navidad_fin' => '2026-12-26T00:00']);

        $this->travelTo(\Carbon\CarbonImmutable::parse('2026-11-30 23:00', Temporada::ZONA));
        $this->assertFalse(Temporada::enDocumentos());
        $this->travelTo(\Carbon\CarbonImmutable::parse('2026-12-24 20:00', Temporada::ZONA));
        $this->assertTrue(Temporada::enDocumentos());
        $this->travelTo(\Carbon\CarbonImmutable::parse('2026-12-26 00:00', Temporada::ZONA));
        $this->assertFalse(Temporada::enDocumentos());
    }

    public function test_todos_los_pdf_y_las_paginas_incluyen_el_saludo_de_temporada(): void
    {
        $sinSaludo = [];
        foreach (glob(resource_path('views/pdf/*.blade.php')) as $archivo) {
            $nombre = basename($archivo);
            if ($nombre === 'viewer.blade.php') {
                continue; // es la página que envuelve al PDF en un marco, no un documento
            }
            $texto = file_get_contents($archivo);
            if (! str_contains($texto, 'pdf.partials.navidad') && ! str_contains($texto, 'partials.membrete')) {
                $sinSaludo[] = $nombre;
            }
        }
        $this->assertSame([], $sinSaludo, 'un PDF nuevo tiene que incluir pdf.partials.navidad o el membrete');

        foreach (['documentos/publico', 'servicios/presupuesto'] as $pagina) {
            $this->assertStringContainsString("@include('partials.navidad-pagina')", file_get_contents(resource_path("views/{$pagina}.blade.php")), $pagina);
        }
    }
}
