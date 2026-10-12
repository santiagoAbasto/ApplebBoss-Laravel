<?php

namespace Tests\Feature;

use App\Models\Page;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Páginas informativas visibles en la tienda y mapa de Google permitido. */
class PaginasPublicasTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_pages_are_shared_for_the_footer(): void
    {
        Page::whereIn('slug', [...Page::LEGALES, 'garantia', 'nosotros', 'envios'])->delete(); // las migraciones de textos los siembran en toda base nueva
        Page::create(['slug' => 'nosotros', 'title' => 'Nosotros', 'content' => '<p>Hola</p>', 'active' => true, 'sort_order' => 1]);
        Page::create(['slug' => 'garantia', 'title' => 'Garantía', 'content' => '<p>Hola</p>', 'active' => true, 'sort_order' => 2]);
        Page::create(['slug' => 'borrador', 'title' => 'Oculta', 'content' => '<p>Hola</p>', 'active' => false, 'sort_order' => 3]);

        $this->get('/catalogo')
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->has('paginas', 2)
                ->where('paginas.0', ['title' => 'Nosotros', 'href' => '/paginas/nosotros'])
                ->where('paginas.1.href', '/paginas/garantia'));

        $this->get('/paginas/nosotros')->assertOk();
        $this->get('/paginas/borrador')->assertNotFound();
    }

    public function test_csp_allows_google_maps_iframe_only(): void
    {
        $csp = $this->get('/catalogo')->headers->get('Content-Security-Policy');

        $this->assertStringContainsString("frame-src 'self' https://www.google.com https://maps.google.com", $csp);
        $this->assertStringContainsString("frame-ancestors 'self'", $csp);
    }

    public function test_nosotros_y_envios_cuentan_las_entregas_y_la_garantia_de_la_configuracion(): void
    {
        $envios = Page::where('slug', 'envios')->firstOrFail()->content;
        foreach (array_keys(config('envios.envio.destinos')) as $departamento) {
            $this->assertStringContainsString($departamento, $envios);
        }
        $this->assertStringContainsString(config('envios.envio.destinos.La Paz.plazo'), $envios);
        $this->assertStringContainsString(intdiv(config('envios.minutos_para_pagar'), 60) . ' horas', $envios);

        $nosotros = Page::where('slug', 'nosotros')->firstOrFail()->content;
        $this->assertStringContainsString('Melchor Urquidi', $nosotros);
        $this->assertStringContainsString(config('documentos.garantia.meses.equipo_seminuevo') . ' en seminuevos', $nosotros);

        $this->get('/paginas/envios')->assertOk();
        $this->get('/paginas/nosotros')->assertOk();
    }
}
