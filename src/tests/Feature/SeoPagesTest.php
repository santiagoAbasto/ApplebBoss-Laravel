<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\SeoPage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** SEO administrable página por página (Marketing y SEO → SEO por página). */
class SeoPagesTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->forceFill(['rol' => 'admin'])->save();
        return $user;
    }

    private function publicacion(array $pub = []): CatalogoPublicacion
    {
        $celular = Celular::create([
            'modelo'       => 'iPhone 15 Pro',
            'capacidad'    => '256 GB',
            'color'        => 'Negro',
            'imei_1'       => fake()->unique()->numerify('###############'),
            'estado_imei'  => 'libre',
            'procedencia'  => 'Tienda',
            'precio_costo' => 5000,
            'precio_venta' => 7500,
            'estado'       => 'disponible',
        ]);

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $celular->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'iPhone 15 Pro 256GB',
            'slug'          => 'iphone-15-pro-256gb',
            'resumen'       => 'Equipo disponible',
            'condicion'     => 'Nuevo',
            'categoria'     => 'celulares',
        ], $pub));
    }

    public function test_server_renders_meta_tags_for_crawlers(): void
    {
        $html = $this->get('/catalogo')->assertOk()->getContent();

        $this->assertStringContainsString('<title data-inertia>Catálogo — Apple Boss Cochabamba</title>', $html);
        $this->assertStringContainsString('property="og:title"', $html);
        $this->assertStringContainsString('name="robots" content="index,follow"', $html);
        $this->assertStringContainsString('rel="canonical" href="' . url('/catalogo') . '"', $html);
    }

    public function test_admin_override_wins_and_query_string_is_not_canonical(): void
    {
        SeoPage::where('page_key', 'store.catalog')->first()->update([
            'title' => 'Catálogo Apple en Bolivia', 'description' => 'Todo lo disponible hoy.',
        ]);

        $this->get('/catalogo?orden=precio-menor')
            ->assertInertia(fn ($p) => $p
                ->where('seo.title', 'Catálogo Apple en Bolivia')
                ->where('seo.description', 'Todo lo disponible hoy.')
                ->where('seo.canonical', url('/catalogo')));
    }

    public function test_noindex_page_is_marked_and_left_out_of_sitemap(): void
    {
        SeoPage::where('page_key', 'hub.mac')->first()->update(['noindex' => true]);

        $this->get('/mac')->assertInertia(fn ($p) => $p->where('seo.robots', 'noindex,nofollow'));

        $xml = $this->get('/sitemap.xml')->getContent();
        $this->assertStringNotContainsString('<loc>' . url('/mac') . '</loc>', $xml);
        $this->assertStringContainsString('<loc>' . url('/iphone') . '</loc>', $xml);
        $this->assertStringContainsString('<loc>' . url('/trade-in') . '</loc>', $xml);
    }

    public function test_product_template_replaces_titulo(): void
    {
        SeoPage::where('page_key', 'store.product')->first()->update(['title' => 'Compra {titulo} en Cochabamba']);
        $this->publicacion();

        $this->get('/productos/iphone-15-pro-256gb')
            ->assertInertia(fn ($p) => $p
                ->where('seo.title', 'Compra iPhone 15 Pro 256GB en Cochabamba')
                ->where('seo.type', 'product')
                ->where('seo.description', 'Equipo disponible. Disponible en Apple Boss, Cochabamba.'));
    }

    public function test_product_own_seo_beats_template(): void
    {
        $this->publicacion(['seo_title' => 'Título propio del producto', 'seo_description' => 'Descripción propia']);

        $this->get('/productos/iphone-15-pro-256gb')
            ->assertInertia(fn ($p) => $p
                ->where('seo.title', 'Título propio del producto')
                ->where('seo.description', 'Descripción propia'));
    }

    public function test_admin_pages_have_no_public_seo(): void
    {
        $this->actingAs($this->admin())
            ->get(route('admin.seo.index'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Admin/Seo/Index')->where('seo', null));
    }

    public function test_admin_update_rejects_unsafe_values(): void
    {
        $page = SeoPage::where('page_key', 'store.home')->first();

        $this->actingAs($this->admin())
            ->patch(route('admin.seo.update', $page), [
                'title'     => 'Ok',
                'og_image'  => '../../.env',
                'canonical' => 'javascript:alert(1)',
            ])
            ->assertSessionHasErrors(['og_image', 'canonical']);
    }

    public function test_admin_can_update_page_seo(): void
    {
        $page = SeoPage::where('page_key', 'hub.iphone')->first();

        $this->actingAs($this->admin())
            ->patch(route('admin.seo.update', $page), [
                'title' => '<b>iPhone en Cochabamba</b>', 'description' => 'Nuevos y seminuevos.', 'noindex' => false,
            ])
            ->assertRedirect();

        $this->assertSame('iPhone en Cochabamba', $page->fresh()->title);
        $this->get('/iphone')->assertInertia(fn ($p) => $p->where('seo.title', 'iPhone en Cochabamba'));
    }
}
