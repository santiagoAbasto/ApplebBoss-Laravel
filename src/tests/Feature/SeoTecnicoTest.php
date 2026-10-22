<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\StoreLocation;
use App\Support\Seo\UrlPublica;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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

        // El flujo de compra privado no se rastrea
        foreach (['/checkout', '/pedido/', '/seguimiento/', '/api/'] as $privado) {
            $this->assertStringContainsString("Disallow: {$privado}", $txt, "robots.txt debería cerrar {$privado}");
        }
        // El panel ni se nombra: sin sesión responde 404 y su puerta va con noindex
        foreach (['/admin', '/vendedor', '/login'] as $panel) {
            $this->assertStringNotContainsString($panel, $txt);
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

    /* ─── un solo negocio ─────────────────────────────────────────────────── */

    public function test_la_pagina_declara_un_solo_negocio(): void
    {
        // Antes había dos Store: uno del servidor y otro que inyectaba React al renderizar.
        // Con dos, Google no sabe cuál es el negocio de verdad.
        $html = $this->get('/')->assertOk()->getContent();

        $this->assertSame(1, substr_count($html, 'application/ld+json'),
            'debe haber un solo bloque de datos estructurados');

        $tipos = array_column($this->jsonLd('/'), '@type');
        $this->assertSame(1, count(array_keys($tipos, 'Store', true)),
            'solo puede declararse una vez la tienda');
    }

    /* ─── NAP: nada inventado ─────────────────────────────────────────────── */

    public function test_no_publica_como_calle_lo_que_es_solo_la_ciudad(): void
    {
        StoreLocation::create([
            'name' => 'Apple Boss Cochabamba', 'address' => 'Cochabamba, Bolivia',
            'city' => 'Cochabamba', 'country' => 'Bolivia', 'active' => true,
        ]);
        Cache::forget('seo.sede');

        $tienda = collect($this->jsonLd('/'))->firstWhere('@type', 'Store');

        // «Cochabamba, Bolivia» es la ciudad y el país: publicarlo como calle sería un dato falso
        $this->assertArrayNotHasKey('streetAddress', $tienda['address'] ?? []);
        $this->assertSame('Cochabamba', $tienda['address']['addressLocality'] ?? null);
    }

    public function test_publica_la_calle_cuando_es_una_direccion_de_verdad(): void
    {
        StoreLocation::create([
            'name' => 'Apple Boss Cochabamba', 'address' => 'Av. Melchor Urquidi, Edificio Fidel Anze',
            'city' => 'Cochabamba', 'country' => 'Bolivia', 'phone' => '75904313', 'active' => true,
            'horarios' => [['dia' => 1, 'abierto' => true, 'tramos' => [['abre' => '09:00', 'cierra' => '19:00']]]],
        ]);
        Cache::forget('seo.sede');

        $tienda = collect($this->jsonLd('/'))->firstWhere('@type', 'Store');

        $this->assertSame('Av. Melchor Urquidi, Edificio Fidel Anze', $tienda['address']['streetAddress'] ?? null);
        $this->assertNotEmpty($tienda['telephone'] ?? null);
        $this->assertNotEmpty($tienda['openingHoursSpecification'] ?? null, 'el horario cargado en el panel debe llegar a Google');
    }

    public function test_publica_las_coordenadas_del_mapa_y_la_zona_que_atiende(): void
    {
        StoreLocation::create([
            'name' => 'Apple Boss Cochabamba', 'address' => 'Av. Melchor Urquidi, Edificio Fidel Anze',
            'city' => 'Cochabamba', 'country' => 'Bolivia', 'active' => true,
            // El mismo enlace del mapa que carga el dueño; de ahí salen las coordenadas (!2d<lng>!3d<lat>).
            'map_embed_url' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!2d-66.1519459242608!3d-17.371618283512824!2m3',
        ]);
        Cache::forget('seo.sedes');

        $tienda = collect($this->jsonLd('/'))->firstWhere('@type', 'Store');

        $this->assertSame('GeoCoordinates', $tienda['geo']['@type'] ?? null);
        $this->assertEqualsWithDelta(-17.371618, $tienda['geo']['latitude'] ?? 0, 0.0001);
        $this->assertEqualsWithDelta(-66.151945, $tienda['geo']['longitude'] ?? 0, 0.0001);
        $this->assertSame('Cochabamba', $tienda['areaServed']['name'] ?? null, 'la tienda declara la ciudad que atiende');
    }

    public function test_publica_la_calificacion_real_de_google_y_nunca_una_inventada(): void
    {
        StoreLocation::create([
            'name' => 'Apple Boss Cochabamba', 'address' => 'Av. Melchor Urquidi, Edificio Fidel Anze',
            'city' => 'Cochabamba', 'country' => 'Bolivia', 'active' => true,
        ]);
        Cache::forget('seo.sedes');

        // Sin reseñas cargadas: no se publica calificación.
        $this->assertArrayNotHasKey('aggregateRating', collect($this->jsonLd('/'))->firstWhere('@type', 'Store') ?? []);

        // Con el promedio y la cantidad oficiales de Google: se publica tal cual.
        \App\Models\ConfiguracionTienda::set('google_resenas_total', '47');
        \App\Models\ConfiguracionTienda::set('google_resenas_promedio', '4.8');

        $tienda = collect($this->jsonLd('/'))->firstWhere('@type', 'Store');
        $this->assertSame('4.8', $tienda['aggregateRating']['ratingValue'] ?? null);
        $this->assertSame(47, $tienda['aggregateRating']['reviewCount'] ?? null);
    }

    public function test_el_titulo_de_la_home_dice_que_es_una_tienda_de_productos_apple(): void
    {
        // La consulta real de la gente es «tiendas de Apple en Cochabamba»: el título lo refleja,
        // sin dar a entender que es una Apple Store oficial (es un revendedor independiente).
        $html = $this->get('/')->assertOk()->getContent();
        $this->assertStringContainsString('Tienda de productos Apple en Cochabamba', $html);
    }

    public function test_llms_txt_presenta_la_tienda_para_los_buscadores_de_ia(): void
    {
        $html = $this->get('/llms.txt')->assertOk()->getContent();
        $this->assertStringContainsString('es una tienda de productos Apple en Cochabamba', $html);
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
