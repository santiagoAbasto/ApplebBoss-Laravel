<?php

namespace Tests\Feature;

use App\Models\CatalogCollection;
use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\HomeSection;
use App\Models\User;
use Database\Seeders\CatalogCategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Portada: el orden de la página de inicio.
 * Las secciones no se crean ni se borran; acá se encienden, se mueven y se editan sus textos. El panel dice qué
 * muestra hoy cada una y, si no muestra nada, por qué.
 */
class PortadaAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CatalogCategorySeeder::class);
        HomeSection::query()->delete();
    }

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function seccion(string $tipo, array $datos = []): HomeSection
    {
        static $orden = 0;
        $orden++;

        return HomeSection::create(array_merge([
            'type'     => $tipo,
            'label'    => ucfirst($tipo),
            'active'   => true,
            'orden'    => $orden,
            'settings' => [],
        ], $datos));
    }

    private function publicacion(string $titulo, array $publicacion = [], string $estado = 'disponible'): CatalogoPublicacion
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

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $equipo->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => $titulo,
            'slug'          => 'publicacion-' . $n,
            'resumen'       => 'Equipo disponible.',
            'condicion'     => 'Seminuevo',
            'categoria'     => 'celulares',
        ], $publicacion));
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $seccion = $this->seccion('featured');

        $this->get('/admin/home-builder')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/home-builder')->assertForbidden();
        $this->actingAs($vendedor)->patch(route('admin.home-builder.update', $seccion), ['active' => false])->assertForbidden();

        $this->assertTrue($seccion->fresh()->active);
    }

    public function test_el_listado_dice_que_muestra_cada_seccion_y_por_que_no(): void
    {
        $this->publicacion('iPhone destacado', ['destacado' => true]);
        $this->seccion('featured', ['label' => 'Productos destacados']);
        $this->seccion('myskin', ['label' => 'MYSKIN']);
        $this->seccion('offers', ['label' => 'Ofertas']);
        $this->seccion('product_collection', ['label' => 'Vitrina']);

        $this->actingAs($this->admin())->get('/admin/home-builder')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/HomeBuilder/Index')
                ->has('sections', 4)
                ->where('sections.0.type', 'featured')
                ->where('sections.0.cantidad', 1)
                ->where('sections.0.se_ve', true)
                ->where('sections.0.motivo', null)
                ->where('sections.1.se_ve', false)
                ->where('sections.1.motivo', 'No hay fundas MYSKIN a la venta.')
                ->where('sections.2.motivo', 'Ninguna publicación tiene un precio promocional vigente.')
                ->where('sections.3.motivo', 'No elegiste qué colección mostrar.')
                ->where('resumen.se_ven', 1)
                ->where('resumen.disponibles', 1));
    }

    public function test_avisa_cuando_los_productos_ya_salen_mas_arriba(): void
    {
        $this->publicacion('iPhone único', ['destacado' => true]);
        $this->seccion('featured', ['label' => 'Destacados']);
        $this->seccion('category_products', ['label' => 'iPhone', 'settings' => ['categoria' => 'celulares']]);

        $this->actingAs($this->admin())->get('/admin/home-builder')
            ->assertInertia(fn (Assert $page) => $page
                ->where('sections.1.se_ve', false)
                ->where('sections.1.motivo', 'Sus productos ya salen en una sección de más arriba: en el inicio cada producto aparece una sola vez.'));
    }

    public function test_el_interruptor_apaga_la_seccion(): void
    {
        $seccion = $this->seccion('featured', ['label' => 'Destacados']);

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $seccion), ['active' => false])
            ->assertRedirect();

        $this->assertFalse($seccion->fresh()->active);
    }

    public function test_el_orden_se_guarda(): void
    {
        $uno = $this->seccion('featured');
        $dos = $this->seccion('offers');

        $this->actingAs($this->admin())
            ->post(route('admin.home-builder.reorder'), ['orden' => [
                ['id' => $dos->id, 'orden' => 1],
                ['id' => $uno->id, 'orden' => 2],
            ]])
            ->assertRedirect();

        $this->assertSame(['offers', 'featured'], HomeSection::orderBy('orden')->pluck('type')->all());
    }

    public function test_los_textos_se_limpian_y_el_enlace_peligroso_se_descarta(): void
    {
        $seccion = $this->seccion('hero');

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $seccion), ['settings' => [
                'titulo'  => '<b>Bienvenido</b>',
                'cta_url' => 'javascript:alert(1)',
                'inventado' => 'no debería guardarse',
            ]])
            ->assertRedirect();

        $ajustes = $seccion->fresh()->settings;
        $this->assertSame('Bienvenido', $ajustes['titulo']);
        $this->assertSame('', $ajustes['cta_url']);
        $this->assertArrayNotHasKey('inventado', $ajustes);
    }

    public function test_el_limite_de_productos_no_pasa_de_doce(): void
    {
        $seccion = $this->seccion('featured');

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $seccion), ['settings' => ['limit' => 50]])
            ->assertRedirect();

        $this->assertSame(12, $seccion->fresh()->settings['limit']);
        $this->assertSame(12, HomeSection::limite('featured', 50));
        $this->assertSame(8, HomeSection::limite('featured', null));
    }

    public function test_la_fecha_de_fin_tiene_que_ser_posterior(): void
    {
        $seccion = $this->seccion('featured');

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $seccion), [
                'publicar_desde' => '2026-10-10',
                'publicar_hasta' => '2026-10-01',
            ])
            ->assertSessionHasErrors('publicar_hasta');
    }

    public function test_una_seccion_programada_para_despues_no_se_ve(): void
    {
        $this->publicacion('iPhone destacado', ['destacado' => true]);
        $seccion = $this->seccion('featured', ['publicar_desde' => now()->addWeek()]);

        $this->actingAs($this->admin())->get('/admin/home-builder')
            ->assertInertia(fn (Assert $page) => $page
                ->where('sections.0.se_ve', false)
                ->where('sections.0.motivo', 'Programada: se muestra desde el ' . now()->addWeek()->format('d/m/Y') . '.'));

        $props = $this->get('/')->assertOk()->viewData('page')['props'];
        $this->assertCount(0, $props['sections']);
    }

    public function test_ya_no_quedan_tipos_de_seccion_sin_uso(): void
    {
        $this->assertNotContains('editorial_split', HomeSection::TYPES);
        $this->assertNotContains('recently_viewed', HomeSection::TYPES);
        $this->assertSame(HomeSection::TYPES, \App\Http\Controllers\Admin\HomeSectionController::ALLOWED_TYPES);
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_ofertas_muestra_las_publicaciones_con_precio_promocional(): void
    {
        $this->publicacion('iPhone normal');
        $this->publicacion('iPhone en oferta', ['precio_promocional' => 4990]);
        $this->seccion('offers', ['label' => 'Ofertas']);

        $props = $this->get('/')->assertOk()->viewData('page')['props'];
        $ofertas = collect($props['sections'])->firstWhere('type', 'offers');

        $this->assertSame(['iPhone en oferta'], collect($ofertas['products'])->pluck('name')->all());
    }

    public function test_el_precio_rebajado_llega_al_catalogo_y_al_carrito(): void
    {
        $pub = $this->publicacion('iPhone en oferta', ['precio_promocional' => 4990]);

        $this->get('/catalogo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('products.0.price', 6000)
                ->where('products.0.promo_price', 4990));

        // El servidor es la autoridad del precio: cobra el rebajado, no el del inventario
        $this->postJson('/api/carrito/sync', ['items' => [['key' => "celular:{$pub->producto_id}", 'quantity' => 1]]])
            ->assertOk()
            ->assertJsonPath('items.0.price', 4990);
    }

    public function test_nuevos_ingresos_muestra_las_ultimas_publicaciones(): void
    {
        $this->publicacion('Primera');
        $this->publicacion('Segunda');
        $this->seccion('new_arrivals', ['label' => 'Nuevos ingresos', 'settings' => ['limit' => 1]]);

        $props = $this->get('/')->assertOk()->viewData('page')['props'];
        $nuevos = collect($props['sections'])->firstWhere('type', 'new_arrivals');

        $this->assertSame(['Segunda'], collect($nuevos['products'])->pluck('name')->all());
    }

    public function test_una_seccion_de_productos_sin_nada_que_mostrar_no_llega_con_productos(): void
    {
        $this->publicacion('iPhone vendido', [], 'vendido');
        $this->seccion('semiused', ['label' => 'Seminuevos']);

        $props = $this->get('/')->assertOk()->viewData('page')['props'];
        $seminuevos = collect($props['sections'])->firstWhere('type', 'semiused');

        $this->assertCount(0, $seminuevos['products']);
    }

    public function test_la_vitrina_se_reserva_sus_productos_antes_que_los_demas_carruseles(): void
    {
        $uno = $this->publicacion('iPhone de la vitrina', ['destacado' => true]);
        $coleccion = CatalogCollection::create(['name' => 'Ofertas', 'slug' => 'ofertas', 'active' => true, 'sort_order' => 1]);
        $coleccion->publicaciones()->sync([$uno->id => ['sort_order' => 0]]);

        $this->seccion('featured', ['label' => 'Destacados']);
        $this->seccion('product_collection', ['label' => 'Vitrina', 'settings' => ['collection_id' => $coleccion->id]]);

        $this->actingAs($this->admin())->get('/admin/home-builder')
            ->assertInertia(fn (Assert $page) => $page
                ->where('sections.0.cantidad', 0)
                ->where('sections.1.cantidad', 1)
                ->where('sections.1.se_ve', true));
    }
}
