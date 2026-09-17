<?php

namespace Tests\Feature;

use App\Models\HomeSection;
use App\Models\NavMenuItem;
use App\Models\Novedad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Novedades: publicaciones con fecha que se listan en /novedades y, las más nuevas, en el inicio.
 * Se crean como borrador; publicadas se ven desde su fecha (con fecha futura quedan programadas) y su dirección queda
 * fija. Sin ninguna publicada, el enlace del menú y el sitemap no llevan a una página vacía.
 */
class NovedadesAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function novedad(string $titulo, array $datos = []): Novedad
    {
        return Novedad::create(array_merge([
            'title'          => $titulo,
            'slug'           => \Illuminate\Support\Str::slug($titulo),
            'excerpt'        => 'Un resumen corto.',
            'content_blocks' => [['type' => 'text', 'content' => '<p>Texto de la novedad.</p>']],
            'status'         => 'published',
            'published_at'   => now()->subDay(),
            'indexable'      => true,
        ], $datos));
    }

    private function datos(Novedad $n, array $cambios = []): array
    {
        return array_merge([
            'titulo'          => $n->title,
            'slug'            => $n->slug,
            'resumen'         => $n->excerpt,
            'cuerpo'          => $n->cuerpoHtml(),
            'autor'           => '',
            'estado'          => $n->status === 'published' ? 'publicada' : 'borrador',
            'fecha'           => '',
            'seo_title'       => '',
            'seo_description' => '',
            'indexable'       => true,
            'quitar_imagen'   => false,
        ], $cambios);
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $this->get(route('admin.novedades.index'))->assertRedirect('/login');
        $this->post(route('admin.novedades.store'), ['titulo' => 'Hola'])->assertRedirect('/login');
        $this->assertSame(0, Novedad::count());
    }

    public function test_el_listado_ordena_por_estado_y_dice_lo_que_falta(): void
    {
        $publicada  = $this->novedad('Llegaron los iPhone 17');
        $programada = $this->novedad('Feriado de octubre', ['published_at' => now()->addDays(3)]);
        $borrador   = $this->novedad('Guía de baterías', ['status' => 'draft', 'published_at' => null, 'excerpt' => null, 'content_blocks' => []]);

        $this->actingAs($this->admin())
            ->get(route('admin.novedades.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Novedades/Index')
                ->where('resumen', ['total' => 3, 'publicadas' => 1, 'programadas' => 1, 'borradores' => 1])
                ->where('novedades.0.id', $programada->id)
                ->where('novedades.0.estado', 'programada')
                ->where('novedades.1.id', $borrador->id)
                ->where('novedades.1.faltantes', ['texto', 'resumen', 'foto'])
                ->where('novedades.2.id', $publicada->id)
                ->where('novedades.2.faltantes', ['foto'])
                ->has('vistaInicio', 1)
                ->where('vistaInicio.0.titulo', 'Llegaron los iPhone 17')
                ->where('donde.publicadas', 1)
                ->where('donde.inicio.encendida', true));
    }

    public function test_una_novedad_nueva_nace_como_borrador_con_su_direccion(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post(route('admin.novedades.store'), ['titulo' => 'Llegó el iPhone 17'])
            ->assertRedirect(route('admin.novedades.edit', Novedad::first()));
        $this->actingAs($admin)->post(route('admin.novedades.store'), ['titulo' => 'Llegó el iPhone 17']);

        $this->assertSame(['llego-el-iphone-17', 'llego-el-iphone-17-2'], Novedad::orderBy('id')->pluck('slug')->all());
        $this->assertSame('draft', Novedad::first()->status);
        $this->assertNull(Novedad::first()->published_at);

        $this->actingAs($admin)->post(route('admin.novedades.store'), ['titulo' => '<b></b>'])->assertSessionHasErrors('titulo');
    }

    public function test_publicar_exige_texto_y_pone_la_fecha_de_hoy(): void
    {
        $admin = $this->admin();
        $novedad = $this->novedad('Guía de baterías', ['status' => 'draft', 'published_at' => null, 'content_blocks' => []]);

        $this->actingAs($admin)->from(route('admin.novedades.edit', $novedad))
            ->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, ['estado' => 'publicada', 'cuerpo' => '<p> </p>']))
            ->assertSessionHasErrors('cuerpo');
        $this->assertSame('draft', $novedad->fresh()->status);

        $this->actingAs($admin)->from(route('admin.novedades.edit', $novedad))
            ->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, ['estado' => 'publicada', 'cuerpo' => '<p>Cómo cuidar la batería.</p>']))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', '«Guía de baterías» ya se ve en la tienda.');

        $novedad->refresh();
        $this->assertSame('publicada', $novedad->estado());
        $this->assertTrue($novedad->published_at->isToday());
        $this->get('/novedades/guia-de-baterias')->assertOk();
    }

    public function test_con_fecha_futura_queda_programada_y_se_publica_sola(): void
    {
        $novedad = $this->novedad('Feriado de octubre', ['status' => 'draft', 'published_at' => null]);

        $this->actingAs($this->admin())
            ->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, ['estado' => 'publicada', 'fecha' => now()->addDays(2)->format('Y-m-d\TH:i')]))
            ->assertSessionHasNoErrors();

        $this->assertSame('programada', $novedad->fresh()->estado());
        $this->get('/novedades/feriado-de-octubre')->assertNotFound();

        $this->travel(3)->days();
        $this->get('/novedades/feriado-de-octubre')->assertOk();
    }

    public function test_la_direccion_queda_fija_desde_que_se_publica(): void
    {
        $admin = $this->admin();
        $novedad = $this->novedad('Borrador', ['status' => 'draft', 'published_at' => null]);

        $this->actingAs($admin)->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, ['titulo' => 'Llegó el Air', 'slug' => 'Llegó el Air']));
        $this->assertSame('llego-el-air', $novedad->fresh()->slug);

        $this->actingAs($admin)->patch(route('admin.novedades.update', $novedad->fresh()), $this->datos($novedad->fresh(), ['estado' => 'publicada']));
        $this->actingAs($admin)->patch(route('admin.novedades.update', $novedad->fresh()), $this->datos($novedad->fresh(), ['estado' => 'borrador', 'slug' => 'otra-direccion']));

        $this->assertSame('llego-el-air', $novedad->fresh()->slug);
        $this->assertSame('draft', $novedad->fresh()->status);
    }

    public function test_el_texto_se_guarda_limpio(): void
    {
        $novedad = $this->novedad('Aviso', ['status' => 'draft', 'published_at' => null]);

        $this->actingAs($this->admin())->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, [
            'titulo'  => '<b>Aviso</b> importante',
            'resumen' => '<i>Un</i> resumen',
            'cuerpo'  => '<h2 style="color:red">Título</h2><p onclick="x()">Hola <a href="javascript:alert(1)">aquí</a> y <a href="https://wa.me/591">acá</a></p><script>alert(1)</script>',
        ]));

        $novedad->refresh();
        $this->assertSame('Aviso importante', $novedad->title);
        $this->assertSame('Un resumen', $novedad->excerpt);
        $this->assertSame(
            '<h2>Título</h2><p>Hola <a>aquí</a> y <a href="https://wa.me/591" rel="noopener">acá</a></p>alert(1)',
            $novedad->content_blocks[0]['content'],
        );

        // Texto pegado sin formato: cada párrafo por separado
        $this->actingAs($this->admin())->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, ['cuerpo' => "Primero\n\nSegundo"]));
        $this->assertSame("<p>Primero</p>\n<p>Segundo</p>", $novedad->fresh()->content_blocks[0]['content']);
    }

    public function test_las_imagenes_y_citas_que_ya_tenia_se_conservan_en_su_lugar(): void
    {
        $novedad = $this->novedad('Con foto adentro', ['content_blocks' => [
            ['type' => 'heading', 'content' => 'Arriba'],
            ['type' => 'image', 'url' => '/storage/foto.jpg', 'caption' => 'Una foto'],
            ['type' => 'text', 'content' => '<p>Abajo</p>'],
        ]]);

        $this->actingAs($this->admin())->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, ['cuerpo' => '<p>Nuevo texto</p>']));

        $this->assertSame([
            ['type' => 'text', 'content' => '<p>Nuevo texto</p>'],
            ['type' => 'image', 'url' => '/storage/foto.jpg', 'caption' => 'Una foto'],
        ], $novedad->fresh()->content_blocks);
    }

    public function test_la_foto_se_guarda_con_variantes_y_se_borra_al_cambiarla(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $novedad = $this->novedad('Llegaron los Mac');

        $this->actingAs($admin)->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, [
            'imagen' => UploadedFile::fake()->image('chica.jpg', 800, 450),
        ]))->assertSessionHasErrors('imagen');

        $this->actingAs($admin)->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, [
            'imagen' => UploadedFile::fake()->image('mac.jpg', 1600, 900),
        ]))->assertSessionHasNoErrors();

        $primera = $novedad->fresh();
        $this->assertNotNull($primera->imagen_card);
        Storage::disk('public')->assertExists([$primera->imagen_original, $primera->imagen_card, $primera->imagen_detalle]);
        $this->assertSame(1600, $primera->imagen_meta['width']);

        $this->actingAs($admin)->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, [
            'imagen' => UploadedFile::fake()->image('otra.png', 2000, 1125),
        ]));
        Storage::disk('public')->assertMissing([$primera->imagen_original, $primera->imagen_card, $primera->imagen_detalle]);

        $segunda = $novedad->fresh();
        $this->actingAs($admin)->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, ['quitar_imagen' => true]));
        $this->assertNull($novedad->fresh()->imagen_card);
        Storage::disk('public')->assertMissing([$segunda->imagen_original, $segunda->imagen_card]);

        $this->actingAs($admin)->patch(route('admin.novedades.update', $novedad), $this->datos($novedad, [
            'imagen' => UploadedFile::fake()->image('ultima.jpg', 1600, 900),
        ]));
        $tercera = $novedad->fresh();
        $this->actingAs($admin)->delete(route('admin.novedades.destroy', $novedad))->assertRedirect(route('admin.novedades.index'));
        Storage::disk('public')->assertMissing([$tercera->imagen_original, $tercera->imagen_card]);
        $this->assertSame(0, Novedad::count());
    }

    public function test_el_interruptor_del_listado_publica_o_pasa_a_borrador(): void
    {
        $admin = $this->admin();
        $vacia = $this->novedad('Sin texto', ['status' => 'draft', 'published_at' => null, 'content_blocks' => []]);
        $lista = $this->novedad('Con texto', ['status' => 'draft', 'published_at' => null]);

        $this->actingAs($admin)->from(route('admin.novedades.index'))
            ->patch(route('admin.novedades.publicacion', $vacia), ['publicada' => true])
            ->assertSessionHas('error');
        $this->assertSame('draft', $vacia->fresh()->status);

        $this->actingAs($admin)->patch(route('admin.novedades.publicacion', $lista), ['publicada' => true]);
        $this->assertSame('publicada', $lista->fresh()->estado());

        $fecha = $lista->fresh()->published_at;
        $this->actingAs($admin)->patch(route('admin.novedades.publicacion', $lista), ['publicada' => false]);
        $this->assertSame('borrador', $lista->fresh()->estado());
        $this->assertEquals($fecha, $lista->fresh()->published_at);   // la fecha de la primera publicación se conserva
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_la_tienda_muestra_solo_lo_publicado_con_sus_datos_para_google(): void
    {
        $vieja = $this->novedad('Llegaron los iPhone 16', ['published_at' => now()->subDays(10), 'author' => 'Carla Rojas']);
        $nueva = $this->novedad('Llegaron los iPhone 17', ['published_at' => now()->subDay(), 'seo_description' => 'Unidades nuevas en tres colores.']);
        $this->novedad('Borrador', ['status' => 'draft']);
        $this->novedad('Programada', ['published_at' => now()->addDay()]);

        $this->get('/novedades')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Novedades')
                ->has('novedades', 2)
                ->where('novedades.0.titulo', 'Llegaron los iPhone 17')
                ->where('novedades.1.autor', 'Carla Rojas')
                ->where('seo.title', 'Novedades — Apple Boss Cochabamba')
                ->where('seo.robots', 'index,follow'));

        $this->get('/novedades/llegaron-los-iphone-17')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Novedad')
                ->where('novedad.titulo', 'Llegaron los iPhone 17')
                ->where('novedad.minutos', 1)
                ->where('datosGoogle.@type', 'BlogPosting')
                ->where('datosGoogle.author.@type', 'Organization')
                ->where('datosGoogle.description', 'Unidades nuevas en tres colores.')
                ->has('relacionadas', 1)
                ->where('relacionadas.0.id', $vieja->id)
                ->where('seo.title', 'Llegaron los iPhone 17 — Apple Boss Cochabamba')
                ->where('seo.description', 'Unidades nuevas en tres colores.'));

        $nueva->update(['indexable' => false]);
        $this->get('/novedades/llegaron-los-iphone-17')->assertInertia(fn (Assert $page) => $page->where('seo.robots', 'noindex,nofollow'));
        $this->get('/novedades/borrador')->assertNotFound();
    }

    public function test_sin_novedades_publicadas_el_menu_y_el_sitemap_no_llevan_a_una_pagina_vacia(): void
    {
        NavMenuItem::create(['slot' => 'footer', 'label' => 'Novedades', 'url' => '/novedades', 'group' => 'Apple Boss', 'active' => true, 'sort_order' => 1]);
        NavMenuItem::create(['slot' => 'footer', 'label' => 'Catálogo', 'url' => '/catalogo', 'group' => 'Apple Boss', 'active' => true, 'sort_order' => 2]);
        $borrador = $this->novedad('Borrador', ['status' => 'draft']);

        $this->get('/novedades')->assertInertia(fn (Assert $page) => $page
            ->has('novedades', 0)
            ->where('seo.robots', 'noindex,nofollow')
            ->where('navMenu.footer', fn ($enlaces) => ! collect($enlaces)->pluck('href')->contains('/novedades')
                && collect($enlaces)->pluck('href')->contains('/catalogo')));
        $this->get('/sitemap.xml')->assertDontSee('/novedades</loc>', false);

        $borrador->update(['status' => 'published']);

        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page
            ->where('navMenu.footer', fn ($enlaces) => collect($enlaces)->pluck('href')->contains('/novedades')));
        $this->get('/sitemap.xml')->assertSee(url('/novedades') . '</loc>', false)->assertSee(url('/novedades/borrador') . '</loc>', false);
    }

    public function test_el_inicio_muestra_las_mas_nuevas_y_portada_dice_por_que_no(): void
    {
        $seccion = HomeSection::where('type', 'news')->firstOrFail();   // la suma la migración
        $seccion->update(['settings' => ['titulo' => 'Lo último', 'limit' => 2]]);

        $admin = $this->admin();
        $this->actingAs($admin)->get(route('admin.home-builder.index'))
            ->assertInertia(fn (Assert $page) => $page->where('sections', fn ($secciones) => collect($secciones)->firstWhere('type', 'news')['motivo'] === 'No hay novedades publicadas.'));

        $this->novedad('Primera', ['published_at' => now()->subDays(3)]);
        $this->novedad('Segunda', ['published_at' => now()->subDays(2)]);
        $this->novedad('Tercera', ['published_at' => now()->subDay()]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->has('novedades', 2)
            ->where('novedades.0.titulo', 'Tercera')
            ->where('novedades.1.titulo', 'Segunda'));

        $this->actingAs($admin)->get(route('admin.home-builder.index'))
            ->assertInertia(fn (Assert $page) => $page->where('sections', fn ($secciones) => collect($secciones)->firstWhere('type', 'news')['se_ve'] === true));

        $seccion->update(['active' => false]);
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('novedades', []));
    }
}
