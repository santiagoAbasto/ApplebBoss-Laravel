<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Support\FichaTecnica\Etiquetas;
use App\Support\Seo\DescripcionProducto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Lo que recibe quien no ejecuta JavaScript: buscadores de IA (ChatGPT, Claude, Perplexity), redes y lectores.
 *
 * La tienda es una SPA y sin esto el servidor entregaba 0 palabras y 0 enlaces en todas las páginas.
 */
class SeoLegibleSinJavascriptTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['seo.public_url' => 'https://appleboss.com.bo']);
    }

    private function productoPublicado(): CatalogoPublicacion
    {
        $celular = Celular::create([
            'modelo' => 'iPhone 15', 'capacidad' => '128 GB', 'color' => 'Azul',
            'imei_1' => '356789012345678', 'estado_imei' => 'libre', 'procedencia' => 'EEUU',
            'precio_costo' => 5000, 'precio_venta' => 6500, 'estado' => 'disponible', 'condicion' => 'Seminuevo',
        ]);

        return CatalogoPublicacion::create([
            'producto_tipo' => 'celular', 'producto_id' => $celular->id, 'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => 'iPhone 15 128 GB Azul', 'slug' => 'iphone-15-128gb-azul',
            'resumen' => 'Equipo disponible en Cochabamba. Revisado y listo para usar.', 'condicion' => 'Seminuevo', 'categoria' => 'celulares',
        ]);
    }

    /** El bloque legible que imprime el servidor, sin las etiquetas. */
    private function lectura(string $html): string
    {
        $this->assertSame(1, preg_match('/<div id="lectura">(.*)<\/div>\s*<\/body>/s', $html, $m), 'La página no trae el contenido legible');

        return $m[1];
    }

    public function test_el_inicio_y_el_catalogo_se_leen_sin_javascript_con_titulo_productos_y_enlaces(): void
    {
        $this->productoPublicado();

        $inicio = $this->lectura($this->get('/')->assertOk()->getContent());
        $this->assertSame(1, substr_count($inicio, '<h1>'));

        // El catálogo lista cada producto con su enlace y su precio: así un buscador llega a la ficha sin ejecutar nada
        $catalogo = $this->lectura($this->get('/catalogo')->assertOk()->getContent());
        $this->assertSame(1, substr_count($catalogo, '<h1>'));
        $this->assertMatchesRegularExpression('#<a href="[^"]*/productos/iphone-15-128gb-azul">iPhone 15 128 GB Azul</a>: Bs 6\.500, Seminuevo#u', $catalogo);
    }

    public function test_la_ficha_del_producto_trae_precio_condicion_y_ficha_tecnica(): void
    {
        $this->productoPublicado();

        $html    = $this->get('/productos/iphone-15-128gb-azul')->assertOk()->getContent();
        $lectura = $this->lectura($html);

        $this->assertStringContainsString('<h1>iPhone 15 128 GB Azul</h1>', $lectura);
        $this->assertStringContainsString('<dt>Precio</dt><dd>Bs 6.500</dd>', $lectura);
        $this->assertStringContainsString('<dt>Condición</dt><dd>Seminuevo</dd>', $lectura);

        // La descripción para buscadores sale de los datos del equipo, no de la frase de fábrica
        $this->assertMatchesRegularExpression('/<meta name="description" content="iPhone 15 128 GB Azul, seminuevo[^"]*Bs 6\.500 en Apple Boss, Cochabamba/u', $html);
        $this->assertStringNotContainsString('Revisado y listo para usar. Disponible en Apple Boss', $html);
        $this->assertStringContainsString('"brand":{"@type":"Brand","name":"Apple"}', $html);
    }

    public function test_nada_interno_sale_en_el_contenido_legible(): void
    {
        $this->productoPublicado();

        $lectura = $this->lectura($this->get('/productos/iphone-15-128gb-azul')->getContent());

        foreach (['356789012345678', '5000', 'EEUU', 'precio_costo', 'procedencia'] as $interno) {
            $this->assertStringNotContainsString($interno, $lectura);
        }
    }

    public function test_el_panel_y_el_acceso_no_llevan_contenido_legible(): void
    {
        $this->assertStringNotContainsString('id="lectura"', $this->get('/login')->getContent());
    }

    public function test_llms_txt_presenta_la_tienda_y_lo_disponible_hoy(): void
    {
        $this->productoPublicado();

        $txt = $this->get('/llms.txt')->assertOk()->getContent();

        $this->assertStringStartsWith('# Apple Boss', $txt);
        $this->assertStringContainsString('- [iPhone 15 128 GB Azul](https://appleboss.com.bo/productos/iphone-15-128gb-azul): Bs 6.500, Seminuevo', $txt);
        $this->assertStringContainsString('(https://appleboss.com.bo/catalogo)', $txt);
        $this->assertStringNotContainsString('localhost', $txt);
    }

    public function test_el_sitemap_fecha_el_inicio_con_el_ultimo_cambio_real_y_no_con_la_hora_del_pedido(): void
    {
        $pub = $this->productoPublicado();
        CatalogoPublicacion::whereKey($pub->id)->update(['updated_at' => '2026-09-10 10:00:00']);

        $this->travelTo('2026-10-02 08:00:00');
        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringContainsString('<lastmod>2026-09-10T', $xml);
        $this->assertStringNotContainsString('<lastmod>2026-10-02T', $xml);
    }

    public function test_la_marca_solo_se_dice_cuando_el_nombre_la_trae(): void
    {
        $this->assertSame('Apple', DescripcionProducto::marcaPorNombre('iPhone 14 Plus 128 GB Celeste'));
        $this->assertSame('Apple', DescripcionProducto::marcaPorNombre('MacBook Air 13"'));
        $this->assertNull(DescripcionProducto::marcaPorNombre('Alexa Echo Dot Max'));
        $this->assertNull(DescripcionProducto::marcaPorNombre('Mando Dualshock 4'));
    }

    /** Las etiquetas del servidor tienen que ser las mismas que muestra la ficha de la tienda. */
    public function test_cada_caracteristica_de_la_ficha_tiene_su_nombre_en_el_servidor(): void
    {
        preg_match_all("/c\('([a-z0-9_]+)',\s*'([^']+)'/", file_get_contents(resource_path('js/Components/Store/fichaTecnica.jsx')), $m);

        $this->assertNotEmpty($m[1]);
        foreach (array_unique($m[1]) as $clave) {
            $this->assertArrayHasKey($clave, Etiquetas::MAPA, "Falta «{$clave}» en App\\Support\\FichaTecnica\\Etiquetas");
        }
    }
}
