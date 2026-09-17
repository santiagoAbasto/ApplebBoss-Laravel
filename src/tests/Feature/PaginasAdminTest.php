<?php

namespace Tests\Feature;

use App\Models\NavMenuItem;
use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Páginas: las páginas de solo texto (Nosotros, Garantía, Envíos…).
 * Viven en /paginas/… y salen solas en la columna «Información» del pie, salvo que tengan su propio enlace en «Menú».
 */
class PaginasAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Page::query()->delete();
        NavMenuItem::query()->delete();
    }

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function pagina(string $titulo, array $datos = []): Page
    {
        static $orden = 0;
        $orden++;

        return Page::create(array_merge([
            'title'      => $titulo,
            'slug'       => str($titulo)->slug()->value(),
            'content'    => '<p>Texto de prueba.</p>',
            'active'     => true,
            'sort_order' => $orden,
        ], $datos));
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $pagina = $this->pagina('Nosotros');

        $this->get('/admin/sitio/paginas')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/sitio/paginas')->assertForbidden();
        $this->actingAs($vendedor)->patch(route('admin.pages.update', $pagina), ['title' => 'Otro'])->assertForbidden();
        $this->actingAs($vendedor)->delete(route('admin.pages.destroy', $pagina))->assertForbidden();

        $this->assertSame('Nosotros', $pagina->fresh()->title);
    }

    public function test_el_listado_dice_donde_figura_cada_pagina_y_cual_esta_vacia(): void
    {
        $this->pagina('Nosotros');
        $this->pagina('Garantía', ['content' => null]);
        $this->pagina('Envíos');
        NavMenuItem::create(['slot' => 'footer', 'label' => 'Envíos', 'url' => '/paginas/envios', 'group' => 'Ayuda', 'active' => true, 'sort_order' => 1]);

        $this->actingAs($this->admin())->get('/admin/sitio/paginas')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Pages/Index')
                ->has('paginas', 3)
                ->where('paginas.0.url', '/paginas/nosotros')
                ->where('paginas.0.donde.en_informacion', true)
                ->where('paginas.1.vacia', true)
                // Con su propio enlace en el pie, deja de listarse sola en «Información»
                ->where('paginas.2.donde.en_informacion', false)
                ->where('paginas.2.donde.menus.0.slot', 'footer')
                ->where('resumen.vacias', 1));
    }

    public function test_crear_una_pagina_arma_su_direccion_sin_repetirla_y_nace_apagada(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post(route('admin.pages.store'), ['title' => 'Cómo comprar'])->assertRedirect();
        $this->actingAs($admin)->post(route('admin.pages.store'), ['title' => 'Cómo comprar'])->assertRedirect();

        $paginas = Page::orderBy('id')->get();
        $this->assertSame(['como-comprar', 'como-comprar-2'], $paginas->pluck('slug')->all());
        $this->assertFalse($paginas->first()->active);
        $this->get('/paginas/como-comprar')->assertNotFound();
    }

    public function test_la_direccion_no_se_cambia_y_el_texto_se_limpia(): void
    {
        $pagina = $this->pagina('Nosotros');

        $this->actingAs($this->admin())
            ->patch(route('admin.pages.update', $pagina), [
                'slug'       => 'otra-direccion',
                'title'      => '<b>Nosotros</b>',
                'content'    => '<p>Hola</p><script>alert(1)</script><img src=x>',
                'meta_title' => '<i>Quiénes somos</i>',
                'active'     => true,
            ])
            ->assertRedirect();

        $pagina->refresh();
        $this->assertSame('nosotros', $pagina->slug);
        $this->assertSame('Nosotros', $pagina->title);
        $this->assertSame('Quiénes somos', $pagina->meta_title);
        $this->assertStringNotContainsString('<script>', $pagina->content);
        $this->assertStringNotContainsString('<img', $pagina->content);
        $this->assertStringContainsString('<p>Hola</p>', $pagina->content);
    }

    public function test_el_texto_sin_formato_se_convierte_en_parrafos(): void
    {
        $pagina = $this->pagina('Nosotros', ['content' => null]);

        $this->actingAs($this->admin())
            ->patch(route('admin.pages.update', $pagina), [
                'title'   => 'Nosotros',
                'content' => "Primer párrafo.\n\nSegundo párrafo.",
                'active'  => true,
            ])
            ->assertRedirect();

        $this->assertSame("<p>Primer párrafo.</p>\n<p>Segundo párrafo.</p>", $pagina->fresh()->content);
    }

    public function test_un_enlace_peligroso_dentro_del_texto_pierde_su_direccion(): void
    {
        $pagina = $this->pagina('Nosotros');

        $this->actingAs($this->admin())
            ->patch(route('admin.pages.update', $pagina), [
                'title'   => 'Nosotros',
                'content' => '<p>Mira <a href="javascript:alert(1)">esto</a> y <a href="https://wa.me/591" target="_blank">esto</a>.</p>',
                'active'  => true,
            ])
            ->assertRedirect();

        $contenido = $pagina->fresh()->content;
        $this->assertStringNotContainsString('javascript:', $contenido);
        $this->assertStringContainsString('href="https://wa.me/591" target="_blank" rel="noopener noreferrer"', $contenido);
    }

    public function test_el_interruptor_esconde_la_pagina(): void
    {
        $pagina = $this->pagina('Nosotros');

        $this->actingAs($this->admin())
            ->patch(route('admin.pages.visibilidad', $pagina), ['active' => false])
            ->assertRedirect();

        $this->assertFalse($pagina->fresh()->active);
        $this->get('/paginas/nosotros')->assertNotFound();
    }

    public function test_el_orden_se_guarda(): void
    {
        $uno = $this->pagina('Nosotros');
        $dos = $this->pagina('Garantía');

        $this->actingAs($this->admin())
            ->post(route('admin.pages.reorder'), ['orden' => [
                ['id' => $dos->id, 'orden' => 1],
                ['id' => $uno->id, 'orden' => 2],
            ]])
            ->assertRedirect();

        $this->assertSame(['Garantía', 'Nosotros'], Page::orderBy('sort_order')->pluck('title')->all());
    }

    public function test_borrar_la_pagina_oculta_los_enlaces_que_llevaban_a_ella(): void
    {
        $pagina = $this->pagina('Garantía');
        $enlace = NavMenuItem::create(['slot' => 'footer', 'label' => 'Garantía', 'url' => '/paginas/garantia', 'group' => 'Ayuda', 'active' => true, 'sort_order' => 1]);

        $this->actingAs($this->admin())->delete(route('admin.pages.destroy', $pagina))
            ->assertRedirect(route('admin.pages.index'));

        $this->assertNull(Page::find($pagina->id));
        $this->assertFalse($enlace->fresh()->active);
        $this->get('/paginas/garantia')->assertNotFound();
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_la_pagina_encendida_se_ve_y_lleva_su_titulo_en_google(): void
    {
        $this->pagina('Nosotros', ['meta_description' => 'Quiénes somos en Cochabamba.']);

        $this->get('/paginas/nosotros')
            ->assertOk()
            ->assertSee('Nosotros — Apple Boss Cochabamba', false)
            ->assertSee('Quiénes somos en Cochabamba.', false);
    }

    public function test_el_pie_recibe_las_paginas_encendidas_en_orden(): void
    {
        $this->pagina('Nosotros');
        $this->pagina('Garantía');
        $this->pagina('Borrador', ['active' => false]);

        $this->get('/catalogo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('paginas', 2)
                ->where('paginas.0.title', 'Nosotros')
                ->where('paginas.1.href', '/paginas/garantia'));
    }

    public function test_el_sitemap_solo_lista_las_paginas_encendidas(): void
    {
        $this->pagina('Nosotros');
        $this->pagina('Borrador', ['active' => false]);

        $respuesta = $this->get('/sitemap.xml')->assertOk();
        $respuesta->assertSee(url('/paginas/nosotros'), false);
        $respuesta->assertDontSee(url('/paginas/borrador'), false);
    }
}
