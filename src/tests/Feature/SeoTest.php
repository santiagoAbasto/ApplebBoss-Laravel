<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Page;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_returns_xml(): void
    {
        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function test_sitemap_includes_home_and_catalog(): void
    {
        $content = $this->get('/sitemap.xml')->getContent();

        $this->assertStringContainsString('<loc>', $content);
        $this->assertStringContainsString('/catalogo', $content);
    }

    public function test_sitemap_includes_published_product(): void
    {
        $celular = Celular::create([
            'modelo'       => 'iPhone SEO',
            'capacidad'    => '128 GB',
            'color'        => 'Negro',
            'imei_1'       => '111222333444555',
            'estado_imei'  => 'libre',
            'procedencia'  => 'Tienda',
            'precio_costo' => 3000,
            'precio_venta' => 5000,
            'estado'       => 'disponible',
        ]);

        CatalogoPublicacion::create([
            'producto_tipo' => 'celular',
            'producto_id'   => $celular->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'iPhone SEO',
            'slug'          => 'iphone-seo-test',
            'resumen'       => 'Equipo de prueba SEO.',
            'condicion'     => 'Nuevo',
            'categoria'     => 'celulares',
        ]);

        $content = $this->get('/sitemap.xml')->getContent();

        $this->assertStringContainsString('iphone-seo-test', $content);
    }

    public function test_sitemap_includes_active_pages(): void
    {
        Page::create([
            'slug'    => 'nosotros-seo',
            'title'   => 'Nosotros',
            'active'  => true,
            'sort_order' => 0,
        ]);

        $content = $this->get('/sitemap.xml')->getContent();

        $this->assertStringContainsString('nosotros-seo', $content);
    }

    public function test_robots_returns_text_plain(): void
    {
        $this->get('/robots.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
    }

    public function test_robots_disallows_admin(): void
    {
        $content = $this->get('/robots.txt')->getContent();

        $this->assertStringContainsString('Disallow: /admin', $content);
        $this->assertStringContainsString('Sitemap:', $content);
    }
}
