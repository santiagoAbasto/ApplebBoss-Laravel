<?php

namespace Tests\Feature;

use App\Models\CatalogCategory;
use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\HomeSection;
use App\Models\ModeloReferencia;
use App\Models\NavMenuItem;
use App\Models\ProductoGeneral;
use App\Models\User;
use Database\Seeders\CatalogCategorySeeder;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Categorías: los estantes de la tienda.
 * Cada producto cae solo en su categoría según el inventario del que sale; acá se controla el nombre, el orden, dónde
 * se muestra cada una, la portada de su página y cómo aparece en Google.
 */
class CategoriasAdminTest extends TestCase
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

    private function categoria(string $slug): CatalogCategory
    {
        return CatalogCategory::where('slug', $slug)->firstOrFail();
    }

    private function celularPublicado(array $celular = [], array $publicacion = []): CatalogoPublicacion
    {
        static $n = 0;
        $n++;

        $equipo = Celular::create(array_merge([
            'modelo'       => 'iPhone 14 Plus',
            'capacidad'    => '128 GB',
            'color'        => 'Azul',
            'imei_1'       => fake()->unique()->numerify('###############'),
            'estado_imei'  => 'libre',
            'procedencia'  => 'Proveedor',
            'precio_costo' => 4000,
            'precio_venta' => 6000,
            'estado'       => 'disponible',
        ], $celular));

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $equipo->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => "iPhone de prueba {$n}",
            'slug'          => "iphone-de-prueba-{$n}",
            'resumen'       => 'Equipo disponible.',
            'condicion'     => 'Seminuevo',
            'categoria'     => 'celulares',
        ], $publicacion));
    }

    /** Un accesorio publicado, con la ficha de su tipo (cargador, vidrio…) si se le pasa una. */
    private function accesorioPublicado(string $nombre, ?int $fichaId = null): CatalogoPublicacion
    {
        static $n = 0;
        $n++;

        $producto = ProductoGeneral::create([
            'codigo'       => "ACC-{$n}",
            'tipo'         => 'accesorio',
            'nombre'       => $nombre,
            'procedencia'  => 'Proveedor',
            'precio_costo' => 50,
            'precio_venta' => 120,
            'estado'       => 'disponible',
            'condicion'    => 'Nuevo',
        ]);

        return CatalogoPublicacion::create([
            'producto_tipo'        => 'producto_general',
            'producto_id'          => $producto->id,
            'storefront'           => 'APPLE_BOSS',
            'publicado'            => true,
            'titulo'               => $nombre,
            'slug'                 => "accesorio-de-prueba-{$n}",
            'resumen'              => 'Accesorio disponible.',
            'condicion'            => 'Nuevo',
            'categoria'            => 'accesorios',
            'modelo_referencia_id' => $fichaId,
        ]);
    }

    private function fichaDe(string $familia): ModeloReferencia
    {
        return ModeloReferencia::where('tipo', 'producto_general')->where('familia', $familia)->firstOrFail();
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $categoria = $this->categoria('accesorios');

        $this->get('/admin/sitio/categorias')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/sitio/categorias')->assertForbidden();
        $this->actingAs($vendedor)->patch(route('admin.categories.update', $categoria), ['name' => 'Otro nombre'])->assertForbidden();
        $this->actingAs($vendedor)->patch(route('admin.categories.visibilidad', $categoria), ['show_home' => false])->assertForbidden();

        $this->assertSame('Accesorios', $categoria->fresh()->name);
    }

    public function test_el_listado_dice_de_donde_sale_cada_categoria_y_donde_se_ve(): void
    {
        $this->celularPublicado();
        NavMenuItem::create(['slot' => 'header', 'label' => 'Accesorios', 'url' => '/catalogo?categoria=accesorios', 'active' => true, 'sort_order' => 1]);
        NavMenuItem::create(['slot' => 'footer', 'label' => 'iPhone', 'url' => '/iphone', 'active' => true, 'sort_order' => 1]);
        HomeSection::create(['type' => 'category_rail', 'label' => 'Categorías', 'active' => true, 'orden' => 1, 'settings' => []]);
        HomeSection::create(['type' => 'category_products', 'label' => 'Accesorios', 'active' => true, 'orden' => 2, 'settings' => ['categoria' => 'accesorios', 'titulo' => 'Accesorios']]);

        $this->actingAs($this->admin())->get('/admin/sitio/categorias')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Categories/Index')
                ->has('categorias', 5)
                ->where('categorias.0.slug', 'celulares')
                ->where('categorias.0.inventario.nombre', 'Celulares')
                ->where('categorias.0.en_tienda', 1)
                ->where('categorias.0.menu.0.label', 'Pie de página')
                ->where('categorias.3.slug', 'fundas')
                ->where('categorias.3.url_inicio', '/myskin')
                ->where('categorias.3.por_publicar', null)
                ->where('categorias.4.slug', 'accesorios')
                ->where('categorias.4.show_home', true)
                ->where('categorias.4.menu.0.label', 'Menú de arriba')
                ->where('categorias.4.carrusel.titulo', 'Accesorios')
                ->where('categorias.4.carrusel.activo', true)
                ->has('categorias.4.tipos', 6)
                ->where('resumen.en_tienda', 1)
                ->where('bloqueInicio', true));
    }

    public function test_accesorios_va_en_el_inicio(): void
    {
        $this->assertTrue($this->categoria('accesorios')->show_home);
    }

    public function test_la_direccion_web_no_se_cambia_y_el_texto_se_limpia(): void
    {
        $categoria = $this->categoria('accesorios');

        $this->actingAs($this->admin())
            ->patch(route('admin.categories.update', $categoria), [
                'slug'        => 'otra-direccion',
                'name'        => '<b>Accesorios</b>',
                'description' => 'Cargadores, vidrios y cables.',
                'active'      => true,
                'show_home'   => true,
                'hero_titulo' => '<script>alert(1)</script>Todo para tu equipo',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $categoria->refresh();
        $this->assertSame('accesorios', $categoria->slug);
        $this->assertSame('Accesorios', $categoria->name);
        $this->assertSame('alert(1)Todo para tu equipo', $categoria->hero_titulo);
    }

    public function test_el_boton_de_la_portada_pide_texto_y_destino(): void
    {
        $categoria = $this->categoria('accesorios');
        $admin = $this->admin();

        $this->actingAs($admin)
            ->patch(route('admin.categories.update', $categoria), ['name' => 'Accesorios', 'hero_cta_label' => 'Ver todo'])
            ->assertSessionHasErrors('hero_cta_url');

        $this->actingAs($admin)
            ->patch(route('admin.categories.update', $categoria), ['name' => 'Accesorios', 'hero_cta_label' => 'Ver todo', 'hero_cta_url' => 'javascript:alert(1)'])
            ->assertSessionHasErrors('hero_cta_url');

        $this->assertNull($categoria->fresh()->hero_cta_url);
    }

    public function test_se_muestra_y_se_oculta_desde_el_listado(): void
    {
        $categoria = $this->categoria('accesorios');
        $categoria->update(['show_home' => false]);

        $this->actingAs($this->admin())
            ->patch(route('admin.categories.visibilidad', $categoria), ['show_home' => true])
            ->assertSessionHas('success')
            ->assertRedirect();

        $this->assertTrue($categoria->fresh()->show_home);
    }

    public function test_reordenar_guarda_el_orden(): void
    {
        $accesorios = $this->categoria('accesorios');
        $celulares = $this->categoria('celulares');

        $this->actingAs($this->admin())
            ->post(route('admin.categories.reorder'), ['orden' => [
                ['id' => $accesorios->id, 'orden' => 1],
                ['id' => $celulares->id, 'orden' => 2],
            ]])
            ->assertRedirect();

        $this->assertSame(1, $accesorios->fresh()->sort_order);
        $this->assertSame(2, $celulares->fresh()->sort_order);
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_el_catalogo_solo_lista_las_categorias_con_productos(): void
    {
        $this->celularPublicado();
        // Fuera del inicio, pero sigue en el filtro del catálogo
        $this->categoria('accesorios')->update(['show_home' => false]);
        $this->accesorioPublicado('Cargador de prueba');

        $this->get('/catalogo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Catalog')
                ->has('categories', 2)
                ->where('categories.0.slug', 'celulares')
                ->where('categories.0.count', 1)
                ->where('categories.1.slug', 'accesorios')
                ->where('categories.1.count', 1)
                ->where('categoria', null));
    }

    public function test_el_inicio_cuenta_solo_lo_que_esta_a_la_venta(): void
    {
        HomeSection::create(['type' => 'category_rail', 'label' => 'Categorías', 'active' => true, 'orden' => 1, 'settings' => []]);
        $this->celularPublicado();
        $this->celularPublicado(['estado' => 'vendido']);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Home')
                ->where('categories.0.slug', 'celulares')
                ->where('categories.0.count', 1)
                ->where('categories.0.url', '/catalogo?categoria=celulares')
                ->where('categories.3.url', '/myskin'));
    }

    public function test_la_pagina_de_una_categoria_muestra_su_portada_y_su_titulo_en_google(): void
    {
        $this->accesorioPublicado('Cargador de prueba');
        $this->categoria('accesorios')->update([
            'hero_titulo'      => 'Todo para tu equipo',
            'hero_descripcion' => 'Cargadores, vidrios y cables revisados.',
            'hero_cta_label'   => 'Ver los cargadores',
            'hero_cta_url'     => '/catalogo?categoria=accesorios&tipo=cargador',
            'meta_title'       => 'Accesorios Apple en Cochabamba — Apple Boss',
        ]);

        $this->get('/catalogo?categoria=accesorios')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('categoria.titulo', 'Todo para tu equipo')
                ->where('categoria.descripcion', 'Cargadores, vidrios y cables revisados.')
                ->where('categoria.cta.label', 'Ver los cargadores')
                ->where('seo.title', 'Accesorios Apple en Cochabamba — Apple Boss')
                ->where('seo.canonical', url('/catalogo?categoria=accesorios')));
    }

    public function test_la_portada_de_accesorios_filtra_por_tipo(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $this->accesorioPublicado('Cargador de prueba', $this->fichaDe('cargador')->id);
        $this->accesorioPublicado('Vidrio de prueba', $this->fichaDe('vidrio')->id);

        $this->get('/catalogo?categoria=accesorios')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('products', 2)
                ->has('categoria.tipos', 2));

        $this->get('/catalogo?categoria=accesorios&tipo=cargador')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('products', 1)
                ->where('products.0.tipo_accesorio', 'cargador')
                ->where('filters.tipo', 'cargador'));
    }

    public function test_una_categoria_oculta_sale_del_catalogo_pero_sus_productos_siguen_a_la_venta(): void
    {
        $this->celularPublicado();
        $this->categoria('celulares')->update(['active' => false]);

        $this->get('/catalogo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('categories', 0)
                ->has('products', 1));
    }
}
