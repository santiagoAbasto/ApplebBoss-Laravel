<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Support\Seo\UrlPublica;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * SEO técnico: lo que Google necesita para descubrir, entender e indexar la tienda.
 *
 * Estas pruebas cuidan que no se rompa lo básico en un deploy: robots, sitemap,
 * canonical sobre el dominio oficial y datos estructurados verdaderos.
 */
class SeoTecnicoTest extends TestCase
{
    use RefreshDatabase;

    private const DOMINIO = 'https://appleboss.com.bo';

    protected function setUp(): void
    {
        parent::setUp();
        config(['seo.public_url' => self::DOMINIO]);
    }

    private function productoPublicado(array $datos = []): CatalogoPublicacion
    {
        $celular = Celular::create(array_merge([
            'modelo' => 'iPhone 15', 'capacidad' => '128 GB', 'color' => 'Azul',
            'imei_1' => fake()->unique()->numerify('###############'), 'estado_imei' => 'libre',
            'procedencia' => 'EEUU', 'precio_costo' => 5000, 'precio_venta' => 6500,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ], $datos));

        return CatalogoPublicacion::create([
            'producto_tipo' => 'celular', 'producto_id' => $celular->id,
            'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => 'iPhone 15 128 GB Azul', 'slug' => 'iphone-15-128gb-azul',
            'resumen' => 'Equipo nuevo, sellado.', 'condicion' => 'Nuevo', 'categoria' => 'celulares',
        ]);
    }

    /* ─── robots.txt ──────────────────────────────────────────────────────── */

    public function test_robots_declara_el_sitemap_y_cierra_lo_privado(): void
    {
        $r = $this->get('/robots.txt')->assertOk();
        $txt = $r->getContent();

        // Google tiene que poder descubrir el sitemap desde robots
        $this->assertStringContainsString('Sitemap: ' . self::DOMINIO . '/sitemap.xml', $txt);

        // Nada del panel ni del flujo de compra privado debe rastrearse
        foreach (['/admin', '/vendedor', '/checkout', '/pedido/', '/seguimiento/', '/api/'] as $privado) {
            $this->assertStringContainsString("Disallow: {$privado}", $txt, "robots.txt debería cerrar {$privado}");
        }
    }

    public function test_robots_no_bloquea_el_contenido_publico(): void
    {
        $txt = $this->get('/robots.txt')->getContent();

        // Un "Disallow: /" dejaría el sitio entero fuera de Google
        $this->assertStringNotContainsString("Disallow: /\n", $txt);
        $this->assertStringNotContainsString('Disallow: *', $txt);
    }

    /* ─── sitemap ─────────────────────────────────────────────────────────── */

    public function test_el_sitemap_usa_el_dominio_oficial_y_no_filtra_lo_privado(): void
    {
        $this->productoPublicado();

        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringContainsString('<loc>' . self::DOMINIO . '/</loc>', $xml);
        $this->assertStringNotContainsString('localhost', $xml);

        foreach (['/checkout', '/pedido/', '/seguimiento/', '/admin', '/login', '/vendedor'] as $privado) {
            $this->assertStringNotContainsString($privado, $xml, "el sitemap no debe listar {$privado}");
        }
    }

    public function test_el_sitemap_lista_los_productos_publicados(): void
    {
        $pub = $this->productoPublicado();

        $this->get('/sitemap.xml')
            ->assertSee(self::DOMINIO . '/productos/' . $pub->slug, escape: false);
    }

    /* ─── canonical ───────────────────────────────────────────────────────── */

    public function test_el_canonical_siempre_apunta_al_dominio_oficial(): void
    {
        // Aunque la petición llegue por otro host (un túnel, una IP), el canonical no cambia
        $html = $this->get('/')->assertOk()->getContent();

        $this->assertStringContainsString('<link rel="canonical" href="' . self::DOMINIO . '/', $html);
        $this->assertStringNotContainsString('rel="canonical" href="http://localhost', $html);
    }

    /* ─── datos estructurados ─────────────────────────────────────────────── */

    private function jsonLd(string $url): array
    {
        $html = $this->get($url)->assertOk()->getContent();
        preg_match('#application/ld\+json[^>]*>(.*?)</script>#s', $html, $m);
        $this->assertNotEmpty($m, "falta el JSON-LD en {$url}");

        $datos = json_decode($m[1], true);
        $this->assertIsArray($datos, "el JSON-LD de {$url} no es JSON válido");

        return $datos['@graph'] ?? [];
    }

    public function test_el_home_declara_la_tienda_y_el_sitio(): void
    {
        $tipos = array_column($this->jsonLd('/'), '@type');

        $this->assertContains('Store', $tipos);
        $this->assertContains('WebSite', $tipos);
    }

    public function test_el_producto_declara_precio_y_disponibilidad_reales(): void
    {
        $pub = $this->productoPublicado();

        $grafo = $this->jsonLd('/productos/' . $pub->slug);
        $producto = collect($grafo)->firstWhere('@type', 'Product');

        $this->assertNotNull($producto, 'la ficha debería declarar Product');
        $this->assertSame('iPhone 15 128 GB Azul', $producto['name']);
        $this->assertSame('6500.00', $producto['offers']['price']);
        $this->assertSame('BOB', $producto['offers']['priceCurrency']);
        $this->assertSame('https://schema.org/InStock', $producto['offers']['availability']);
        $this->assertSame('https://schema.org/NewCondition', $producto['itemCondition']);
    }

    public function test_un_producto_vendido_no_se_anuncia_como_disponible(): void
    {
        $pub = $this->productoPublicado();
        $pub->inventario()->forceFill(['estado' => 'vendido'])->saveQuietly();

        $grafo = $this->jsonLd('/productos/' . $pub->slug);
        $producto = collect($grafo)->firstWhere('@type', 'Product');

        if ($producto) {
            $this->assertSame('https://schema.org/OutOfStock', $producto['offers']['availability']);
        }
        $this->assertTrue(true); // si ya no se publica, tampoco hay nada que anunciar
    }

    public function test_el_json_ld_no_inventa_calificaciones_ni_resenas(): void
    {
        $pub = $this->productoPublicado();
        $html = $this->get('/productos/' . $pub->slug)->getContent();

        // Nunca publicar ratings/reviews falsos: Google los penaliza y engañan al cliente
        foreach (['aggregateRating', 'reviewCount', 'ratingValue'] as $prohibido) {
            $this->assertStringNotContainsString($prohibido, $html);
        }
    }

    /* ─── dominio publicable ──────────────────────────────────────────────── */

    public function test_detecta_dominios_que_google_no_puede_indexar(): void
    {
        foreach (['http://localhost:8010', 'http://127.0.0.1:8010', 'https://algo.trycloudflare.com'] as $malo) {
            config(['seo.public_url' => $malo]);
            $this->assertFalse(UrlPublica::esPublicable(), "{$malo} no debería considerarse publicable");
            $this->assertNotNull(UrlPublica::motivoNoPublicable());
        }

        config(['seo.public_url' => self::DOMINIO]);
        $this->assertTrue(UrlPublica::esPublicable());
        $this->assertNull(UrlPublica::motivoNoPublicable());
    }
}
