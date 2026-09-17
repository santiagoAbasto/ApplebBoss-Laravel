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
}
