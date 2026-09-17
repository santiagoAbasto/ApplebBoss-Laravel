<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Faq;
use App\Models\HomeSection;
use App\Models\User;
use Database\Seeders\CatalogCategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Preguntas frecuentes.
 * Cada pregunta se muestra en un solo lugar: el final del inicio, la ficha de todos los productos, la página de
 * iPhone o la de Seminuevos. Sin preguntas encendidas, esa sección no se dibuja.
 */
class PreguntasAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CatalogCategorySeeder::class);
        Faq::query()->delete();
    }

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function pregunta(string $lugar, string $texto, array $datos = []): Faq
    {
        static $orden = 0;
        $orden++;

        return Faq::create(array_merge([
            'scope'      => $lugar,
            'question'   => $texto,
            'answer'     => 'Una respuesta clara.',
            'active'     => true,
            'sort_order' => $orden,
        ], $datos));
    }

    private function publicacion(): CatalogoPublicacion
    {
        $equipo = Celular::create([
            'modelo' => 'iPhone 14 Plus', 'capacidad' => '128 GB', 'color' => 'Azul',
            'imei_1' => fake()->unique()->numerify('###############'), 'estado_imei' => 'libre',
            'procedencia' => 'Proveedor', 'precio_costo' => 4000, 'precio_venta' => 6000, 'estado' => 'disponible',
        ]);

        return CatalogoPublicacion::create([
            'producto_tipo' => 'celular', 'producto_id' => $equipo->id, 'storefront' => 'APPLE_BOSS',
            'publicado' => true, 'titulo' => 'iPhone de prueba', 'slug' => 'iphone-de-prueba',
            'resumen' => 'Equipo disponible.', 'condicion' => 'Seminuevo', 'categoria' => 'celulares',
        ]);
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $faq = $this->pregunta('general', '¿Hacen envíos?');

        $this->get('/admin/sitio/faq')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/sitio/faq')->assertForbidden();
        $this->actingAs($vendedor)->patch(route('admin.faqs.update', $faq), ['question' => 'Otra'])->assertForbidden();
        $this->actingAs($vendedor)->delete(route('admin.faqs.destroy', $faq))->assertForbidden();

        $this->assertSame('¿Hacen envíos?', $faq->fresh()->question);
    }

    public function test_el_listado_agrupa_por_lugar_y_cuenta_las_visibles(): void
    {
        $this->pregunta('general', '¿Hacen envíos?');
        $this->pregunta('general', '¿Aceptan tarjeta?', ['active' => false]);
        $this->pregunta('producto', '¿Puedo verlo antes?');

        $this->actingAs($this->admin())->get('/admin/sitio/faq')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Faqs/Index')
                ->has('lugares', 4)
                ->where('lugares.0.clave', 'general')
                ->where('lugares.0.total', 2)
                ->where('lugares.0.visibles', 1)
                ->where('lugares.1.clave', 'producto')
                ->where('lugares.1.visibles', 1)
                ->where('lugares.2.visibles', 0)
                ->has('preguntas.general', 2)
                ->where('preguntas.producto.0.question', '¿Puedo verlo antes?')
                ->where('bloqueInicio', true));
    }

    public function test_avisa_si_la_seccion_del_inicio_esta_apagada_en_portada(): void
    {
        HomeSection::where('type', 'faq')->delete();
        HomeSection::create(['type' => 'faq', 'label' => 'Preguntas', 'active' => false, 'orden' => 1, 'settings' => []]);

        $this->actingAs($this->admin())->get('/admin/sitio/faq')
            ->assertInertia(fn (Assert $page) => $page->where('bloqueInicio', false));
    }

    public function test_agregar_una_pregunta_la_pone_al_final_de_su_lugar(): void
    {
        $this->pregunta('general', 'Primera');

        $this->actingAs($this->admin())
            ->post(route('admin.faqs.store'), ['scope' => 'general', 'question' => '<b>Segunda</b>', 'answer' => 'Respuesta <i>limpia</i>.'])
            ->assertRedirect();

        $preguntas = Faq::where('scope', 'general')->orderBy('sort_order')->get();
        $this->assertSame(['Primera', 'Segunda'], $preguntas->pluck('question')->all());
        // Se guarda como texto simple: la tienda lo muestra tal cual
        $this->assertSame('Respuesta limpia.', $preguntas->last()->answer);
    }

    public function test_no_se_puede_inventar_un_lugar(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.faqs.store'), ['scope' => 'categoria', 'question' => '¿Hola?', 'answer' => 'Sí.'])
            ->assertSessionHasErrors('scope');

        $this->assertSame(0, Faq::count());
    }

    public function test_el_interruptor_esconde_la_pregunta_sin_borrarla(): void
    {
        $faq = $this->pregunta('general', '¿Hacen envíos?');

        $this->actingAs($this->admin())
            ->patch(route('admin.faqs.update', $faq), ['active' => false])
            ->assertRedirect();

        $this->assertFalse($faq->fresh()->active);
        $this->assertSame([], Faq::deLugar('general'));
    }

    public function test_el_orden_se_guarda(): void
    {
        $uno = $this->pregunta('general', 'Primera');
        $dos = $this->pregunta('general', 'Segunda');

        $this->actingAs($this->admin())
            ->post(route('admin.faqs.reorder'), ['orden' => [
                ['id' => $dos->id, 'orden' => 1],
                ['id' => $uno->id, 'orden' => 2],
            ]])
            ->assertRedirect();

        $this->assertSame(['Segunda', 'Primera'], collect(Faq::deLugar('general'))->pluck('question')->all());
    }

    public function test_copiar_trae_las_que_faltan_y_no_repite(): void
    {
        $this->pregunta('general', '¿Hacen envíos?');
        $this->pregunta('general', '¿Aceptan tarjeta?');
        $this->pregunta('general', 'Oculta', ['active' => false]);
        $this->pregunta('producto', '¿Hacen envíos?');

        $this->actingAs($this->admin())
            ->post(route('admin.faqs.copiar'), ['desde' => 'general', 'hacia' => 'producto'])
            ->assertRedirect();

        $this->assertSame(
            ['¿Hacen envíos?', '¿Aceptan tarjeta?'],
            collect(Faq::deLugar('producto'))->pluck('question')->all()
        );
    }

    public function test_borrar_la_pregunta_la_saca_de_la_tienda(): void
    {
        $faq = $this->pregunta('general', '¿Hacen envíos?');

        $this->actingAs($this->admin())->delete(route('admin.faqs.destroy', $faq))->assertRedirect();

        $this->assertNull(Faq::find($faq->id));
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_cada_lugar_recibe_solo_sus_preguntas(): void
    {
        $this->pregunta('general', 'Del inicio');
        $this->pregunta('producto', 'De la ficha');
        $this->pregunta('iphone', 'De iPhone');
        $this->pregunta('seminuevos', 'De seminuevos');
        $this->publicacion();
        HomeSection::firstOrCreate(['type' => 'faq'], ['label' => 'Preguntas', 'active' => true, 'orden' => 99, 'settings' => []]);

        $inicio = $this->get('/')->assertOk()->viewData('page')['props'];
        $this->assertSame(['Del inicio'], collect($inicio['faqs'])->pluck('question')->all());

        $this->get('/productos/iphone-de-prueba')
            ->assertInertia(fn (Assert $page) => $page->where('faqs.0.question', 'De la ficha')->has('faqs', 1));

        $this->get('/iphone')
            ->assertInertia(fn (Assert $page) => $page->where('faqs.0.question', 'De iPhone')->has('faqs', 1));

        $this->get('/seminuevos')
            ->assertInertia(fn (Assert $page) => $page->where('faqs.0.question', 'De seminuevos')->has('faqs', 1));
    }

    public function test_sin_preguntas_la_seccion_del_inicio_no_se_dibuja(): void
    {
        HomeSection::firstOrCreate(['type' => 'faq'], ['label' => 'Preguntas', 'active' => true, 'orden' => 99, 'settings' => []]);

        $props = $this->get('/')->assertOk()->viewData('page')['props'];
        $this->assertSame([], $props['faqs']);

        // Y el panel de Portada lo dice
        $this->actingAs($this->admin())->get('/admin/home-builder')
            ->assertInertia(fn (Assert $page) => $page
                ->where('sections', fn ($secciones) => collect($secciones)
                    ->firstWhere('type', 'faq')['motivo'] === 'No hay preguntas cargadas para el inicio.'));
    }
}
