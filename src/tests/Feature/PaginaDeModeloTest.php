<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\ModeloReferencia;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** La página permanente de cada modelo (/iphone/iphone-14-plus): ficha de la base de modelos y, del inventario, lo de hoy. */
class PaginaDeModeloTest extends TestCase
{
    use RefreshDatabase;

    private const IMEI = '356789012345671';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ModelosReferenciaSeeder::class);
        config(['seo.public_url' => 'https://appleboss.com.bo']);
    }

    private function publicar(string $slugModelo): CatalogoPublicacion
    {
        $modelo  = ModeloReferencia::where('slug', $slugModelo)->firstOrFail();
        $celular = Celular::create([
            'modelo' => mb_strtoupper($modelo->nombre), 'capacidad' => '128 GB', 'color' => 'AZUL', 'bateria' => '100',
            'imei_1' => self::IMEI, 'estado_imei' => 'registrado', 'procedencia' => 'IMPORTADORA SECRETA',
            'precio_costo' => 3111, 'precio_venta' => 4500, 'estado' => 'disponible', 'condicion' => 'Seminuevo',
        ]);

        return CatalogoPublicacion::create([
            'producto_tipo' => 'celular', 'producto_id' => $celular->id, 'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => "{$modelo->nombre} 128 GB Azul", 'slug' => 'iphone-14-plus-128gb-azul', 'resumen' => 'Disponible.',
            'condicion' => 'Seminuevo', 'categoria' => 'celulares', 'modelo_referencia_id' => $modelo->id,
        ]);
    }

    public function test_con_stock_muestra_el_precio_desde_y_los_equipos_y_lo_dice_en_los_datos_estructurados(): void
    {
        $this->publicar('iphone-14-plus');

        $respuesta = $this->get('/iphone/iphone-14-plus')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Modelo')
                ->where('modelo.titulo', 'iPhone 14 Plus en Cochabamba')
                ->where('modelo.oferta.unidades', 1)
                ->where('modelo.oferta.desde', 4500)
                ->where('modelo.specs.chip', 'A15 Bionic')
                ->has('products', 1)
                ->where('products.0.url', route('store.product', 'iphone-14-plus-128gb-azul'))
                ->where('comparar', route('store.compare.modelos', ['familia' => 'iphone', 'modelos' => 'iphone-14-plus']))
                ->has('otros'));

        $html = $respuesta->getContent();
        $this->assertStringContainsString('<title data-inertia>iPhone 14 Plus en Cochabamba: precio y ficha técnica</title>', $html);
        $this->assertMatchesRegularExpression('/<meta name="description" content="iPhone 14 Plus en Cochabamba desde Bs 4\.500: 1 disponible hoy/u', $html);
        $this->assertStringContainsString('"@type":"AggregateOffer","priceCurrency":"BOB","lowPrice":"4500.00","offerCount":1', $html);
        $this->assertStringContainsString('"name":"iPhone 14 Plus","item":"https://appleboss.com.bo/iphone/iphone-14-plus"', $html);

        // Sin JavaScript se lee la ficha y se llega al equipo publicado
        $this->assertStringContainsString('<h1>iPhone 14 Plus en Cochabamba</h1>', $html);
        $this->assertStringContainsString('<dt>Chip</dt><dd>A15 Bionic</dd>', $html);
        $this->assertStringContainsString('/productos/iphone-14-plus-128gb-azul">iPhone 14 Plus 128 GB Azul</a>', $html);

        // Nada interno sale por esta página
        foreach ([self::IMEI, '3111', 'IMPORTADORA SECRETA'] as $interno) {
            $this->assertStringNotContainsString($interno, $html);
        }
    }

    public function test_sin_stock_la_pagina_sigue_en_pie_y_no_inventa_una_oferta(): void
    {
        $html = $this->get('/iphone/iphone-16')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('modelo.oferta', null)->has('products', 0))
            ->getContent();

        $this->assertStringNotContainsString('AggregateOffer', $html);
        $this->assertStringContainsString('Hoy no tenemos iPhone 16 en stock', $html);
        $this->assertStringContainsString('ficha técnica completa y disponibilidad en Apple Boss', $html);
    }

    public function test_cada_familia_tiene_sus_paginas_y_lo_que_no_es_un_modelo_da_404(): void
    {
        $mac  = ModeloReferencia::where('tipo', 'computadora')->where('familia', 'mac')->firstOrFail();
        $ipad = ModeloReferencia::where('tipo', 'producto_apple')->where('familia', 'ipad')->firstOrFail();

        $this->get("/mac/{$mac->slug}")->assertOk();
        $this->get("/apple/{$ipad->slug}")->assertOk();

        $this->get('/iphone/no-existe')->assertNotFound();
        // Un modelo no se sirve bajo otra familia, y los de otras marcas no tienen página
        $this->get("/iphone/{$mac->slug}")->assertNotFound();
        if ($otra = ModeloReferencia::where('familia', 'otra_marca')->first()) {
            $this->get("/apple/{$otra->slug}")->assertNotFound();
        }
    }

    public function test_el_sitemap_llms_y_el_hub_enlazan_las_paginas_de_los_modelos(): void
    {
        $sitemap = $this->get('/sitemap.xml')->assertOk()->getContent();
        $this->assertStringContainsString('<loc>https://appleboss.com.bo/iphone/iphone-14-plus</loc>', $sitemap);
        $this->assertStringContainsString('<loc>https://appleboss.com.bo/servicio-tecnico</loc>', $sitemap);

        $this->assertStringContainsString('- [iPhone 14 Plus](https://appleboss.com.bo/iphone/iphone-14-plus)', $this->get('/llms.txt')->getContent());

        $this->get('/iphone')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('fichas', ModeloReferencia::where('tipo', 'celular')->where('familia', 'iphone')->where('activo', true)->count()));
    }
}
