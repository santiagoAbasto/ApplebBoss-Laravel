<?php

namespace Tests\Feature;

use App\Models\CatalogCollection;
use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\HomeSection;
use App\Models\NavMenuItem;
use App\Models\User;
use Database\Seeders\CatalogCategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Colecciones: las vitrinas que se arman a mano.
 * Se elige qué publicaciones entran y en qué orden; cada colección tiene su página, puede salir en el inicio
 * y en los menús, y en la tienda solo se muestra lo que sigue a la venta.
 */
class ColeccionesAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CatalogCategorySeeder::class);
    }

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function celularPublicado(string $titulo, string $estado = 'disponible'): CatalogoPublicacion
    {
        static $n = 0;
        $n++;

        $equipo = Celular::create([
            'modelo'       => 'iPhone 14 Plus',
            'capacidad'    => '128 GB',
            'color'        => 'Azul',
            'imei_1'       => fake()->unique()->numerify('###############'),
            'estado_imei'  => 'libre',
            'procedencia'  => 'Proveedor',
            'precio_costo' => 4000,
            'precio_venta' => 6000,
            'estado'       => $estado,
        ]);

        return CatalogoPublicacion::create([
            'producto_tipo' => 'celular',
            'producto_id'   => $equipo->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => $titulo,
            'slug'          => 'publicacion-de-prueba-' . $n,
            'resumen'       => 'Equipo disponible.',
            'condicion'     => 'Seminuevo',
            'categoria'     => 'celulares',
        ]);
    }

    private function coleccionCon(array $publicaciones, array $datos = []): CatalogCollection
    {
        $coleccion = CatalogCollection::create(array_merge([
            'name'        => 'Ofertas de la semana',
            'slug'        => 'ofertas-de-la-semana',
            'description' => 'Lo que sale esta semana.',
            'active'      => true,
            'sort_order'  => 1,
        ], $datos));

        $coleccion->publicaciones()->sync(
            collect($publicaciones)->mapWithKeys(fn (CatalogoPublicacion $p, int $i) => [$p->id => ['sort_order' => $i]])->all()
        );

        return $coleccion;
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $coleccion = $this->coleccionCon([]);

        $this->get('/admin/sitio/colecciones')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/sitio/colecciones')->assertForbidden();
        $this->actingAs($vendedor)->patch(route('admin.collections.update', $coleccion), ['name' => 'Otro nombre'])->assertForbidden();
        $this->actingAs($vendedor)->delete(route('admin.collections.destroy', $coleccion))->assertForbidden();

        $this->assertSame('Ofertas de la semana', $coleccion->fresh()->name);
    }

    public function test_el_listado_dice_cuantos_hay_a_la_venta_y_donde_se_ve(): void
    {
        $vendido = $this->celularPublicado('iPhone vendido', 'vendido');
        $enVenta = $this->celularPublicado('iPhone disponible');
        $coleccion = $this->coleccionCon([$enVenta, $vendido]);

        HomeSection::create(['type' => 'product_collection', 'label' => 'Ofertas', 'active' => true, 'orden' => 1,
            'settings' => ['collection_id' => $coleccion->id, 'titulo' => 'Ofertas de la semana']]);
        NavMenuItem::create(['slot' => 'header', 'label' => 'Ofertas', 'url' => '/coleccion/ofertas-de-la-semana', 'active' => true, 'sort_order' => 1]);

        $this->actingAs($this->admin())->get('/admin/sitio/colecciones')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Collections/Index')
                ->has('colecciones', 1)
                ->where('colecciones.0.url', '/coleccion/ofertas-de-la-semana')
                ->where('colecciones.0.total', 2)
                ->where('colecciones.0.en_venta', 1)
                ->where('colecciones.0.vendidos', 1)
                ->where('colecciones.0.donde.inicio.0.activa', true)
                ->where('colecciones.0.donde.menus.0.label', 'Menú de arriba')
                ->where('resumen.en_venta', 1)
                ->where('resumen.publicados', 2)
                ->has('sinColeccion', 0));
    }

    public function test_avisa_cuando_un_carrusel_del_inicio_no_tiene_coleccion(): void
    {
        HomeSection::create(['type' => 'product_collection', 'label' => 'Disponibles ahora', 'active' => true, 'orden' => 1, 'settings' => []]);

        $this->actingAs($this->admin())->get('/admin/sitio/colecciones')
            ->assertInertia(fn (Assert $page) => $page
                ->has('sinColeccion', 1)
                ->where('sinColeccion.0.label', 'Disponibles ahora'));
    }

    public function test_crear_una_coleccion_arma_su_direccion_sin_repetirla(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post(route('admin.collections.store'), ['name' => 'Regreso a clases'])
            ->assertRedirect();
        $this->actingAs($admin)->post(route('admin.collections.store'), ['name' => 'Regreso a clases'])
            ->assertRedirect();

        $this->assertSame(
            ['regreso-a-clases', 'regreso-a-clases-2'],
            CatalogCollection::orderBy('id')->pluck('slug')->all()
        );
    }

    public function test_la_direccion_web_no_se_cambia_y_el_texto_se_limpia(): void
    {
        $coleccion = $this->coleccionCon([]);

        $this->actingAs($this->admin())
            ->patch(route('admin.collections.update', $coleccion), [
                'slug'        => 'otra-direccion',
                'name'        => '<b>Ofertas</b>',
                'description' => 'Solo por esta semana.',
                'meta_title'  => '<script>alert(1)</script>Ofertas',
                'active'      => true,
            ])
            ->assertRedirect();

        $coleccion->refresh();
        $this->assertSame('ofertas-de-la-semana', $coleccion->slug);
        $this->assertSame('Ofertas', $coleccion->name);
        $this->assertSame('alert(1)Ofertas', $coleccion->meta_title);
    }

    public function test_guardar_los_productos_respeta_el_orden(): void
    {
        $uno = $this->celularPublicado('Primero');
        $dos = $this->celularPublicado('Segundo');
        $coleccion = $this->coleccionCon([$uno]);

        $this->actingAs($this->admin())
            ->post(route('admin.collections.sync', $coleccion), ['ids' => [$dos->id, $uno->id]])
            ->assertRedirect();

        $this->assertSame(['Segundo', 'Primero'], $coleccion->fresh()->publicaciones->pluck('titulo')->all());
    }

    public function test_el_interruptor_esconde_la_coleccion(): void
    {
        $coleccion = $this->coleccionCon([$this->celularPublicado('iPhone')]);

        $this->actingAs($this->admin())
            ->patch(route('admin.collections.visibilidad', $coleccion), ['active' => false])
            ->assertRedirect();

        $this->assertFalse($coleccion->fresh()->active);
        $this->get('/coleccion/ofertas-de-la-semana')->assertNotFound();
    }

    public function test_borrar_la_coleccion_no_borra_las_publicaciones_y_apaga_lo_que_llevaba_a_ella(): void
    {
        $producto  = $this->celularPublicado('iPhone');
        $coleccion = $this->coleccionCon([$producto]);

        $seccion = HomeSection::create(['type' => 'product_collection', 'label' => 'Ofertas', 'active' => true, 'orden' => 1,
            'settings' => ['collection_id' => $coleccion->id, 'titulo' => 'Ofertas']]);
        $enlace = NavMenuItem::create(['slot' => 'header', 'label' => 'Ofertas', 'url' => '/coleccion/ofertas-de-la-semana', 'active' => true, 'sort_order' => 1]);

        $this->actingAs($this->admin())->delete(route('admin.collections.destroy', $coleccion))
            ->assertRedirect(route('admin.collections.index'));

        $this->assertNull(CatalogCollection::find($coleccion->id));
        $this->assertNotNull(CatalogoPublicacion::find($producto->id));

        $seccion->refresh();
        $this->assertFalse($seccion->active);
        $this->assertArrayNotHasKey('collection_id', $seccion->settings);
        $this->assertFalse($enlace->fresh()->active);
    }

    public function test_las_colecciones_activas_son_destino_en_el_menu(): void
    {
        $this->coleccionCon([], ['name' => 'Oculta', 'slug' => 'oculta', 'active' => false, 'sort_order' => 2]);
        $this->coleccionCon([$this->celularPublicado('iPhone')]);

        $this->actingAs($this->admin())->get(route('admin.menus.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('colecciones', 1)
                ->where('colecciones.0.url', '/coleccion/ofertas-de-la-semana')
                ->where('colecciones.0.nombre', 'Ofertas de la semana'));
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_la_pagina_muestra_solo_lo_que_sigue_a_la_venta_en_su_orden(): void
    {
        $vendido = $this->celularPublicado('iPhone vendido', 'vendido');
        $uno     = $this->celularPublicado('iPhone uno');
        $dos     = $this->celularPublicado('iPhone dos');
        $this->coleccionCon([$dos, $vendido, $uno]);

        $this->get('/coleccion/ofertas-de-la-semana')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Coleccion')
                ->where('coleccion.nombre', 'Ofertas de la semana')
                ->has('productos', 2)
                ->where('productos.0.name', 'iPhone dos')
                ->where('productos.1.name', 'iPhone uno'));
    }

    public function test_la_pagina_lleva_su_titulo_en_google_y_su_direccion_canonica(): void
    {
        $this->coleccionCon([$this->celularPublicado('iPhone')], ['meta_description' => 'Las mejores ofertas de la semana.']);

        $this->get('/coleccion/ofertas-de-la-semana')
            ->assertOk()
            ->assertSee('Ofertas de la semana — Apple Boss Cochabamba', false)
            ->assertSee('Las mejores ofertas de la semana.', false)
            ->assertSee(url('/coleccion/ofertas-de-la-semana'), false);
    }

    public function test_el_inicio_muestra_los_productos_de_la_coleccion_elegida(): void
    {
        $fuera = $this->celularPublicado('iPhone fuera de la vitrina');
        $uno   = $this->celularPublicado('iPhone de la vitrina');
        $coleccion = $this->coleccionCon([$uno]);

        HomeSection::create(['type' => 'product_collection', 'label' => 'Ofertas', 'active' => true, 'orden' => 1,
            'settings' => ['collection_id' => $coleccion->id, 'titulo' => 'Ofertas de la semana']]);

        $props = $this->get('/')->assertOk()->viewData('page')['props'];
        $vitrina = collect($props['sections'])->firstWhere('type', 'product_collection');

        $this->assertSame('/coleccion/ofertas-de-la-semana', $vitrina['coleccion']['url']);
        $this->assertSame(['iPhone de la vitrina'], collect($vitrina['products'])->pluck('name')->all());
        $this->assertNotContains($fuera->titulo, collect($vitrina['products'])->pluck('name')->all());
    }

    public function test_el_sitemap_solo_lista_las_colecciones_con_algo_a_la_venta(): void
    {
        $this->coleccionCon([$this->celularPublicado('iPhone')]);
        $this->coleccionCon([], ['name' => 'Vacía', 'slug' => 'vacia', 'sort_order' => 2]);
        $this->coleccionCon([$this->celularPublicado('iPhone oculto')], ['name' => 'Oculta', 'slug' => 'oculta', 'active' => false, 'sort_order' => 3]);

        $respuesta = $this->get('/sitemap.xml')->assertOk();

        $respuesta->assertSee(url('/coleccion/ofertas-de-la-semana'), false);
        $respuesta->assertDontSee(url('/coleccion/vacia'), false);
        $respuesta->assertDontSee(url('/coleccion/oculta'), false);
    }
}
