<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use App\Models\User;
use App\Support\Temporada;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Campaña de Navidad: cuándo se ve (apagada, manual, programada en hora de Bolivia), dónde (tienda y panel por
 * separado), quién la configura y que la vista previa no le llega a nadie más.
 */
class CampanaNavidadTest extends TestCase
{
    use RefreshDatabase;

    private const COMPLETO = [
        'navidad_modo'               => 'manual',
        'navidad_publico'            => true,
        'navidad_admin'              => true,
        'navidad_inicio'             => null,
        'navidad_fin'                => null,
        'navidad_intensidad_publico' => 'festiva',
        'navidad_intensidad_admin'   => 'discreta',
        'navidad_personajes'         => true,
        'navidad_luces'              => true,
        'navidad_animaciones'        => true,
        'navidad_nieve'              => false,
        'navidad_musica'             => true,
        'navidad_tapas'              => true,
        'navidad_texto'              => 'Esta Navidad, regala tecnología',
        'navidad_enlace'             => '/catalogo',
    ];

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin', 'email_verified_at' => now()]);
    }

    private function guardar(array $cambios = [], ?User $user = null): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($user ?? $this->admin())
            ->post('/admin/configuracion/navidad', array_merge(self::COMPLETO, $cambios));
    }

    public function test_apagada_la_tienda_no_lleva_ni_el_atributo_ni_la_prop(): void
    {
        $html = $this->get('/catalogo')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('temporada', null))
            ->getContent();

        $this->assertStringNotContainsString('data-season', $html);
    }

    public function test_encendida_a_mano_viste_la_tienda_desde_el_html_del_servidor(): void
    {
        $this->guardar()->assertSessionHasNoErrors();
        auth()->logout();

        $html = $this->get('/catalogo')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('temporada.nombre', 'christmas')
                ->where('temporada.superficie', 'publico')
                ->where('temporada.intensidad', 'festiva')
                ->where('temporada.texto', 'Esta Navidad, regala tecnología')
                ->where('temporada.enlace', '/catalogo')
                ->where('temporada.musica', true)
                ->where('temporada.tapas', true)
                ->where('temporada.vistaPrevia', false))
            ->getContent();

        $this->assertStringContainsString('data-season="christmas" data-season-surface="publico" data-season-intensity="festiva"', $html);
    }

    public function test_el_intervalo_programado_incluye_el_inicio_y_excluye_el_fin_en_hora_de_bolivia(): void
    {
        $a = Temporada::normalizar(['navidad_modo' => 'programado', 'navidad_inicio' => '2026-12-01T00:00', 'navidad_fin' => '2026-12-26T00:00']);
        $bolivia = fn (string $t) => CarbonImmutable::parse($t, Temporada::ZONA);

        $this->assertFalse(Temporada::activa($a, $bolivia('2026-11-30 23:59:59')));
        $this->assertTrue(Temporada::activa($a, $bolivia('2026-12-01 00:00:00')), 'el inicio es inclusivo');
        $this->assertTrue(Temporada::activa($a, $bolivia('2026-12-25 23:59:59')));
        $this->assertFalse(Temporada::activa($a, $bolivia('2026-12-26 00:00:00')), 'el fin es exclusivo');

        // La medianoche de Bolivia son las 04:00 UTC: a las 03:59 UTC del 1 de diciembre todavía no empezó
        $this->assertFalse(Temporada::activa($a, CarbonImmutable::parse('2026-12-01 03:59:59', 'UTC')));
        $this->assertTrue(Temporada::activa($a, CarbonImmutable::parse('2026-12-01 04:00:00', 'UTC')));

        // Un intervalo incompleto o al revés nunca enciende
        $this->assertFalse(Temporada::activa(Temporada::normalizar(['navidad_modo' => 'programado', 'navidad_inicio' => '2026-12-01T00:00']), $bolivia('2026-12-10')));
        $this->assertFalse(Temporada::activa(Temporada::normalizar(['navidad_modo' => 'programado', 'navidad_inicio' => '2026-12-26T00:00', 'navidad_fin' => '2026-12-01T00:00']), $bolivia('2026-12-10')));
    }

    public function test_programada_se_enciende_y_se_apaga_sola_con_el_reloj_del_servidor(): void
    {
        $this->guardar(['navidad_modo' => 'programado', 'navidad_inicio' => '2026-12-01T00:00', 'navidad_fin' => '2026-12-26T00:00'])->assertSessionHasNoErrors();
        auth()->logout();

        $this->travelTo(CarbonImmutable::parse('2026-11-30 23:00', Temporada::ZONA));
        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada', null));

        $this->travelTo(CarbonImmutable::parse('2026-12-10 12:00', Temporada::ZONA));
        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada.nombre', 'christmas'));

        $this->travelTo(CarbonImmutable::parse('2026-12-26 00:00', Temporada::ZONA));
        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada', null));
    }

    public function test_la_tienda_y_el_panel_se_encienden_por_separado(): void
    {
        $admin = $this->admin();
        $this->guardar(['navidad_admin' => false], $admin);

        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada.superficie', 'publico'));
        $this->get('/admin/configuracion/navidad')->assertInertia(fn (Assert $page) => $page->where('temporada', null));

        $this->guardar(['navidad_publico' => false, 'navidad_admin' => true, 'navidad_nieve' => true], $admin);

        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada', null));
        $this->get('/admin/configuracion/navidad')->assertInertia(fn (Assert $page) => $page
            ->where('temporada.superficie', 'admin')
            ->where('temporada.intensidad', 'discreta')
            ->where('temporada.nieve', false)   // la nieve nunca cae sobre el panel
            ->where('temporada.musica', false)  // ni suena música
            ->where('temporada.tapas', false)   // ni hay tapas de regalo
            ->where('temporada.texto', null));
    }

    public function test_solo_quien_administra_la_tienda_configura_la_campana(): void
    {
        $this->get('/admin/configuracion/navidad')->assertNotFound();
        $this->post('/admin/configuracion/navidad', self::COMPLETO)->assertNotFound();

        $vendedor = User::factory()->create(['rol' => 'vendedor', 'email_verified_at' => now()]);
        $this->actingAs($vendedor)->get('/admin/configuracion/navidad')->assertForbidden();
        $this->actingAs($vendedor)->post('/admin/configuracion/navidad', self::COMPLETO)->assertForbidden();
        $this->actingAs($vendedor)->post('/admin/configuracion/navidad/vista-previa', self::COMPLETO)->assertForbidden();

        $this->assertSame('apagado', Temporada::ajustes()['navidad_modo']);
    }

    public function test_valida_fechas_enlace_y_limpia_el_texto(): void
    {
        $this->guardar(['navidad_modo' => 'programado'])->assertSessionHasErrors(['navidad_inicio', 'navidad_fin']);
        $this->guardar(['navidad_modo' => 'programado', 'navidad_inicio' => '2026-12-26T00:00', 'navidad_fin' => '2026-12-01T00:00'])
            ->assertSessionHasErrors(['navidad_fin']);
        $this->guardar(['navidad_modo' => 'siempre'])->assertSessionHasErrors(['navidad_modo']);
        $this->guardar(['navidad_intensidad_publico' => 'maxima'])->assertSessionHasErrors(['navidad_intensidad_publico']);

        foreach (['https://otro.sitio/x', '//otro.sitio', 'javascript:alert(1)', '/a b', '/x"onmouseover="y'] as $malo) {
            $this->guardar(['navidad_enlace' => $malo])->assertSessionHasErrors(['navidad_enlace']);
        }
        $this->assertSame('apagado', Temporada::ajustes()['navidad_modo'], 'nada inválido llegó a guardarse');

        $this->guardar(['navidad_texto' => '<b>Regala</b> <script>alert(1)</script>tecnología', 'navidad_enlace' => '/catalogo?categoria=celulares'])
            ->assertSessionHasNoErrors();
        $ajustes = Temporada::ajustes();
        $this->assertSame('Regala alert(1)tecnología', $ajustes['navidad_texto']);
        $this->assertSame('/catalogo?categoria=celulares', $ajustes['navidad_enlace']);
    }

    public function test_la_vista_previa_es_solo_de_quien_la_pide_y_no_publica_nada(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/admin/configuracion/navidad/vista-previa', self::COMPLETO)->assertSessionHasNoErrors();

        // Quien la pidió ve la tienda vestida y marcada como vista previa…
        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page
            ->where('temporada.nombre', 'christmas')
            ->where('temporada.vistaPrevia', true));
        // …pero la campaña publicada sigue apagada
        $this->assertSame('apagado', Temporada::ajustes()['navidad_modo']);
        $this->assertNull(ConfiguracionTienda::where('clave', 'navidad_modo')->value('valor'));

        // Salir la retira
        $this->delete('/admin/configuracion/navidad/vista-previa')->assertSessionHasNoErrors();
        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada', null));
    }

    public function test_la_vista_previa_no_le_llega_a_un_visitante_ni_por_la_url_ni_por_la_sesion(): void
    {
        // Ningún parámetro de la URL enciende la campaña
        $this->get('/catalogo?navidad=1&vista_previa=1&season=christmas')
            ->assertInertia(fn (Assert $page) => $page->where('temporada', null));

        // Y una sesión con la marca, sin ser quien administra la tienda, tampoco
        $this->withSession([Temporada::SESION_VISTA_PREVIA => self::COMPLETO])->get('/catalogo')
            ->assertInertia(fn (Assert $page) => $page->where('temporada', null));

        $vendedor = User::factory()->create(['rol' => 'vendedor', 'email_verified_at' => now()]);
        $this->actingAs($vendedor)->withSession([Temporada::SESION_VISTA_PREVIA => self::COMPLETO])->get('/catalogo')
            ->assertInertia(fn (Assert $page) => $page->where('temporada', null));
    }

    public function test_apagar_retira_la_campana_y_conserva_los_demas_ajustes(): void
    {
        $admin = $this->admin();
        $this->guardar([], $admin);
        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada.nombre', 'christmas'));

        $this->post('/admin/configuracion/navidad/apagar')->assertSessionHasNoErrors();

        $html = $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada', null))->getContent();
        $this->assertStringNotContainsString('data-season', $html);
        $this->assertSame('Esta Navidad, regala tecnología', Temporada::ajustes()['navidad_texto']);
    }

    public function test_guardar_se_ve_enseguida_aunque_el_ajuste_estuviera_en_cache(): void
    {
        $admin = $this->admin();
        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada', null)); // deja «apagado» en caché
        $this->guardar([], $admin);
        $this->get('/catalogo')->assertInertia(fn (Assert $page) => $page->where('temporada.nombre', 'christmas'));
    }
}
