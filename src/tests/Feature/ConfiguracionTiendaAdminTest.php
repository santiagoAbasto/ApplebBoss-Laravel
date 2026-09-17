<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use App\Models\SeoPage;
use App\Models\StoreLocation;
use App\Models\StoreService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Configuración: el WhatsApp con el que le escribe el cliente y la identidad de la tienda
 * (nombre, frase del pie, barra de anuncio y descripción para Google). Lo demás vive en su propio módulo.
 */
class ConfiguracionTiendaAdminTest extends TestCase
{
    use RefreshDatabase;

    private const COMPLETO = [
        'whatsapp_enabled'   => true,
        'whatsapp_numero'    => '59175904313',
        'whatsapp_mensaje'   => 'Hola, quiero consultar.',
        'tienda_nombre'      => 'Apple Boss',
        'tienda_descripcion' => 'Equipos Apple en Cochabamba.',
        'footer_tagline'     => 'Equipos revisados uno por uno.',
        'anuncio_barra'      => 'Envíos a todo el país',
    ];

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function guardar(array $cambios = []): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($this->admin())
            ->post('/admin/configuracion/tienda', array_merge(self::COMPLETO, $cambios));
    }

    public function test_solo_un_admin_entra(): void
    {
        $this->get('/admin/configuracion/tienda')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/configuracion/tienda')->assertForbidden();
    }

    public function test_la_pantalla_manda_solo_lo_que_se_edita_aca(): void
    {
        ConfiguracionTienda::set('tienda_nombre', 'Apple Boss');

        $this->actingAs($this->admin())
            ->get('/admin/configuracion/tienda')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Configuracion/Tienda')
                ->has('configuracion', fn (Assert $cfg) => $cfg
                    ->hasAll(['whatsapp_enabled', 'whatsapp_numero', 'whatsapp_mensaje', 'tienda_nombre', 'tienda_descripcion', 'footer_tagline', 'anuncio_barra'])
                    ->where('tienda_nombre', 'Apple Boss')
                )
                ->has('largos')
                ->has('contexto')
            );
    }

    public function test_el_hero_la_barra_vieja_y_el_seo_del_inicio_ya_no_estan_en_configuracion(): void
    {
        foreach (['hero_titulo', 'hero_subtitulo', 'seo_titulo_home', 'seo_descripcion_home'] as $clave) {
            $this->assertDatabaseMissing('configuracion_tienda', ['clave' => $clave]);
        }

        // El SEO del inicio vive en «Google y redes sociales»
        $this->assertDatabaseHas('seo_pages', ['page_key' => 'store.home']);
    }

    public function test_guardar_deja_los_datos_limpios(): void
    {
        $this->guardar([
            'tienda_nombre'  => '  Apple Boss  ',
            'footer_tagline' => '<b>Equipos revisados</b>',
            'anuncio_barra'  => '   ',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertSame('Apple Boss', ConfiguracionTienda::get('tienda_nombre'));
        $this->assertSame('Equipos revisados', ConfiguracionTienda::get('footer_tagline'));
        $this->assertNull(ConfiguracionTienda::get('anuncio_barra'));
    }

    public function test_el_numero_va_con_codigo_de_pais_y_solo_numeros(): void
    {
        $this->guardar(['whatsapp_numero' => '+591 759-04313'])
            ->assertSessionHasErrors('whatsapp_numero');

        $this->guardar(['whatsapp_numero' => '7590431'])
            ->assertSessionHasErrors('whatsapp_numero');
    }

    public function test_encendido_sin_numero_no_se_guarda(): void
    {
        $this->guardar(['whatsapp_enabled' => true, 'whatsapp_numero' => ''])
            ->assertSessionHasErrors('whatsapp_numero');

        // Apagado sí puede quedar sin número
        $this->guardar(['whatsapp_enabled' => false, 'whatsapp_numero' => ''])
            ->assertSessionHasNoErrors();

        $this->assertFalse(ConfiguracionTienda::waEnabled());
    }

    public function test_la_tienda_necesita_un_nombre(): void
    {
        $this->guardar(['tienda_nombre' => ''])->assertSessionHasErrors('tienda_nombre');
        $this->guardar(['tienda_nombre' => str_repeat('a', 61)])->assertSessionHasErrors('tienda_nombre');
    }

    public function test_los_textos_tienen_un_largo_maximo(): void
    {
        $this->guardar(['anuncio_barra' => str_repeat('a', 91)])->assertSessionHasErrors('anuncio_barra');
        $this->guardar(['footer_tagline' => str_repeat('a', 161)])->assertSessionHasErrors('footer_tagline');
        $this->guardar(['whatsapp_mensaje' => str_repeat('a', 301)])->assertSessionHasErrors('whatsapp_mensaje');
    }

    public function test_el_nombre_de_la_tienda_llega_a_la_tienda_y_a_los_mensajes(): void
    {
        ConfiguracionTienda::set('tienda_nombre', 'Mac Center BO');
        ConfiguracionTienda::clearAllCache();

        $this->assertSame('Mac Center BO', ConfiguracionTienda::nombre());
        $this->assertSame('Hola Mac Center BO,', ConfiguracionTienda::saludoWhatsapp());

        $servicio = StoreService::create(['title' => 'Diagnóstico', 'accion' => 'whatsapp', 'active' => true]);
        $this->assertSame('Hola Mac Center BO, quiero consultar por: Diagnóstico', $servicio->mensajeWhatsapp());

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('tienda.tienda_nombre', 'Mac Center BO')
        );
    }

    public function test_el_nombre_vacio_no_deja_la_tienda_sin_nombre(): void
    {
        ConfiguracionTienda::set('tienda_nombre', '');
        ConfiguracionTienda::clearAllCache();

        $this->assertSame('Apple Boss', ConfiguracionTienda::nombre());
    }

    public function test_la_barra_de_anuncio_la_escribe_el_panel(): void
    {
        $this->guardar(['anuncio_barra' => 'Envíos a todo el país'])->assertSessionHasNoErrors();

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('tienda.anuncio_barra', 'Envíos a todo el país')
        );

        $this->guardar(['anuncio_barra' => ''])->assertSessionHasNoErrors();

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('tienda.anuncio_barra', null)
        );
    }

    public function test_el_numero_no_sale_a_la_tienda_con_el_whatsapp_apagado(): void
    {
        $this->guardar(['whatsapp_enabled' => false, 'whatsapp_numero' => '59175904313']);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('tienda.whatsapp_enabled', false)
            ->where('tienda.whatsapp_numero', null)
        );
    }

    public function test_la_pantalla_cuenta_quien_usa_el_whatsapp(): void
    {
        StoreService::create(['title' => 'Diagnóstico', 'accion' => 'whatsapp', 'active' => true]);
        StoreService::create(['title' => 'Envíos', 'accion' => 'ninguna', 'active' => true]);
        StoreLocation::create([
            'name' => 'Casa matriz', 'address' => 'Av. Heroínas 456', 'city' => 'Cochabamba',
            'country' => 'Bolivia', 'whatsapp' => '59171111111', 'active' => true, 'sort_order' => 1,
        ]);

        $this->actingAs($this->admin())
            ->get('/admin/configuracion/tienda')
            ->assertInertia(fn (Assert $page) => $page
                ->where('contexto.servicios_con_whatsapp', 1)
                ->where('contexto.locales_con_whatsapp', 1)
                ->where('contexto.ciudad', 'Cochabamba')
            );
    }

    public function test_el_titulo_del_inicio_lo_resuelve_el_modulo_de_seo(): void
    {
        SeoPage::where('page_key', 'store.home')->update(['title' => 'Apple Boss — Cochabamba']);
        SeoPage::flush();

        $this->get('/')->assertSee('<title data-inertia>Apple Boss — Cochabamba</title>', false);
    }
}
