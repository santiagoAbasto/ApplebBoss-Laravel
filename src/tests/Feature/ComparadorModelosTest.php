<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ModeloReferencia;
use App\Support\InventarioCatalogo;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ComparadorModelosTest extends TestCase
{
    use RefreshDatabase;

    private const IMEI = '356789012345671';
    private const PROCEDENCIA = 'IMPORTADORA SECRETA';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ModelosReferenciaSeeder::class);
    }

    private function publicar(string $slugModelo, array $equipo = [], array $publicacion = []): CatalogoPublicacion
    {
        $modelo = ModeloReferencia::where('slug', $slugModelo)->firstOrFail();
        $celular = Celular::create(array_merge([
            'modelo' => mb_strtoupper($modelo->nombre), 'capacidad' => '128 GB', 'color' => 'AZUL', 'bateria' => '100',
            'imei_1' => fake()->unique()->numerify('###############'), 'estado_imei' => 'registrado', 'procedencia' => self::PROCEDENCIA,
            'precio_costo' => 3111, 'precio_venta' => 4500, 'estado' => 'disponible', 'condicion' => 'Nuevo',
        ], $equipo));

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular', 'producto_id' => $celular->id, 'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => "{$modelo->nombre} 128 GB", 'slug' => fake()->unique()->slug(), 'resumen' => 'Disponible.',
            'condicion' => $celular->condicion, 'categoria' => 'celulares', 'modelo_referencia_id' => $modelo->id,
        ], $publicacion));
    }

    public function test_compara_hasta_cuatro_modelos_en_el_orden_pedido(): void
    {
        $this->get('/comparar/iphone?modelos=iphone-14-plus,no-existe,iphone-16,iphone-14-plus,iphone-17-pro,iphone-air,iphone-duo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/CompararModelos')
                ->where('familia.tipo', 'celular')
                ->where('familia.version_actual', 'iOS 27')
                ->where('maximo', 4)
                ->has('opciones', ModeloReferencia::where('tipo', 'celular')->count())
                ->has('seleccion', 4)
                ->where('seleccion.0.slug', 'iphone-14-plus')
                ->where('seleccion.1.slug', 'iphone-16')
                ->where('seleccion.2.slug', 'iphone-17-pro')
                ->where('seleccion.3.slug', 'iphone-air')
                ->where('seleccion.0.specs.red', '5G (sub-6 GHz) con MIMO 4x4 · LTE Gigabit; las unidades de EE. UU. también admiten 5G mmWave')
                ->where('seleccion.0.specs.colores_disponibles', ['Azul', 'Púrpura', 'Amarillo', 'Medianoche', 'Blanco estrella', '(PRODUCT)RED'])
                ->where('seleccion.0.visual.alto_mm', 160.8)
                ->where('seleccion.0.visual.tele', false)
                ->where('seleccion.2.visual.lidar', true)
                ->where('seleccion.0.oferta', null));
    }

    public function test_sin_eleccion_propone_primero_los_modelos_en_tienda(): void
    {
        $this->publicar('iphone-14-plus');

        $this->get('/comparar/iphone')
            ->assertInertia(fn (Assert $page) => $page
                ->has('seleccion', 3)
                ->where('seleccion.0.slug', 'iphone-14-plus')
                ->where('seleccion.1.slug', ModeloReferencia::delTipo('celular')->first()->slug)
                ->where('opciones', fn ($opciones) => collect($opciones)->firstWhere('slug', 'iphone-14-plus')['en_tienda'] === true));
    }

    public function test_el_precio_y_el_stock_salen_del_inventario_sin_datos_internos(): void
    {
        $this->publicar('iphone-14-plus', ['precio_venta' => 4500, 'imei_1' => self::IMEI]);
        $this->publicar('iphone-14-plus', ['precio_venta' => 4200, 'condicion' => 'Seminuevo', 'bateria' => '88']);
        $this->publicar('iphone-14-plus', ['precio_venta' => 3900, 'estado' => 'vendido']);   // vendido: no cuenta
        $this->publicar('iphone-14-plus', ['precio_venta' => 3500], ['publicado' => false]);  // sin publicar: no cuenta

        $respuesta = $this->get('/comparar/iphone?modelos=iphone-14-plus')
            ->assertInertia(fn (Assert $page) => $page
                ->where('seleccion.0.oferta.unidades', 2)
                ->where('seleccion.0.oferta.desde', 4200)
                ->where('seleccion.0.oferta.condiciones', ['Nuevo', 'Seminuevo'])
                ->where('seleccion.0.oferta.url', route('store.catalog', ['categoria' => 'celulares', 'modelo' => 'iphone-14-plus'])));

        foreach ([self::IMEI, self::PROCEDENCIA, 'precio_costo', 'procedencia'] as $prohibido) {
            $this->assertStringNotContainsString($prohibido, $respuesta->getContent(), "Salió al comparador: {$prohibido}");
        }
    }

    public function test_un_solo_equipo_lleva_a_su_publicacion_y_la_ficha_ofrece_comparar(): void
    {
        $pub = $this->publicar('iphone-14-plus');
        $this->publicar('iphone-14');

        $this->get('/comparar/iphone?modelos=iphone-14-plus')
            ->assertInertia(fn (Assert $page) => $page->where('seleccion.0.oferta.url', route('store.product', $pub->slug)));

        $this->get("/productos/{$pub->slug}")
            ->assertInertia(fn (Assert $page) => $page
                ->where('product.comparar_modelo.nombre', 'iPhone 14 Plus')
                ->where('product.comparar_modelo.url', route('store.compare.modelos', ['familia' => 'iphone', 'modelos' => 'iphone-14-plus'])));

        // El catálogo filtra por modelo sin confundir el 14 con el 14 Plus
        $this->get('/catalogo?modelo=iphone-14-plus')
            ->assertInertia(fn (Assert $page) => $page
                ->has('products', 1)
                ->where('products.0.slug', $pub->slug)
                ->where('filters.modeloNombre', 'iPhone 14 Plus'));
    }

    public function test_una_familia_sin_base_no_tiene_comparador(): void
    {
        $this->get('/comparar/ipad')->assertNotFound();   // las Mac ya tienen su base: /comparar/mac
    }

    public function test_la_comparativa_tiene_seo_propio_y_esta_en_el_sitemap(): void
    {
        $this->get('/comparar/iphone?modelos=iphone-14-plus')
            ->assertSee('<title data-inertia>Comparar modelos de iPhone — Apple Boss Cochabamba</title>', false)
            ->assertSee('<link rel="canonical" href="' . url('/comparar/iphone') . '"', false);

        $this->get('/sitemap.xml')->assertSee('<loc>' . url('/comparar/iphone') . '</loc>', false);
    }

    public function test_compara_las_mac_con_su_ficha_y_su_ilustracion(): void
    {
        $this->get('/comparar/mac?modelos=macbook-air-13-m3-2024,macbook-pro-14-m5-pro,imac-24-2024-cuatro-puertos,macbook-pro-13-2019-dos-puertos')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/CompararModelos')
                ->where('familia.slug', 'mac')
                ->where('familia.tipo', 'computadora')
                ->where('familia.version_actual', 'macOS 27 Golden Gate')
                ->has('opciones', ModeloReferencia::where('tipo', 'computadora')->where('familia', 'mac')->count())
                ->has('seleccion', 4)
                ->where('seleccion.0.specs.memorias_disponibles', ['8 GB', '16 GB', '24 GB'])
                ->where('seleccion.0.specs.colores_disponibles', ['Plata', 'Blanco estelar', 'Gris espacial', 'Medianoche'])
                ->where('seleccion.0.visual.formato', 'portatil')
                ->where('seleccion.0.visual.muesca', true)
                ->where('seleccion.1.specs.chip', 'Apple M5 Pro')
                ->where('seleccion.2.visual.formato', 'escritorio')
                ->missing('seleccion.2.specs.autonomia')
                ->where('seleccion.3.specs.ultimo_so', 'macOS Sequoia 15')
                ->missing('seleccion.3.specs.apple_intelligence'));

        $this->get('/sitemap.xml')->assertSee('<loc>' . url('/comparar/mac') . '</loc>', false);
    }

    public function test_la_ficha_de_una_mac_prevalece_cuando_se_vende(): void
    {
        $mac = Computadora::create([
            'numero_serie' => 'C02XK0AAJG5J', 'nombre' => 'MACBOOK AIR 13"', 'procesador' => 'M3', 'ram' => '8', 'almacenamiento' => '256 GB',
            'color' => 'GRIS', 'bateria' => '100', 'procedencia' => self::PROCEDENCIA, 'precio_costo' => 5111, 'precio_venta' => 7500,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);
        $pub = InventarioCatalogo::crear('computadora', $mac, 'Nuevo', true);
        $this->assertSame('macbook-air-13-m3-2024', $pub->modeloReferencia?->slug);   // se enlaza sola a su ficha

        $respuesta = $this->get('/comparar/mac?modelos=macbook-air-13-m3-2024')
            ->assertInertia(fn (Assert $page) => $page
                ->where('seleccion.0.oferta.unidades', 1)
                ->where('seleccion.0.oferta.desde', 7500)
                ->where('seleccion.0.oferta.url', route('store.product', $pub->slug)));
        foreach ([self::PROCEDENCIA, 'precio_costo', '5111'] as $prohibido) {
            $this->assertStringNotContainsString($prohibido, $respuesta->getContent(), "Salió al comparador: {$prohibido}");
        }

        // Se vende: deja de ofrecerse, pero el modelo sigue en el comparador y la publicación conserva su ficha,
        // también después de volver a cargar la base
        $mac->update(['estado' => 'vendido']);
        $this->seed(ModelosReferenciaSeeder::class);

        $this->get('/comparar/mac?modelos=macbook-air-13-m3-2024')
            ->assertInertia(fn (Assert $page) => $page
                ->where('seleccion.0.slug', 'macbook-air-13-m3-2024')
                ->where('seleccion.0.specs.chip', 'Apple M3')
                ->where('seleccion.0.oferta', null));
        $pub->refresh();
        $this->assertSame('macbook-air-13-m3-2024', $pub->modeloReferencia?->slug);
        $this->assertSame('Hasta 18 h de reproducción de video en la app Apple TV (15 h de navegación web)', $pub->atributos['autonomia']);
    }
}
