<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use App\Models\HomeSection;
use App\Models\StoreService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Servicios: las tarjetas de «Nuestros servicios» del inicio.
 * Cada tarjeta puede solo informar, abrir WhatsApp o llevar a una página; sin tarjetas encendidas la sección no se
 * dibuja. No confundir con AdminServiciosTest (Servicio técnico: las órdenes de reparación).
 */
class ServiciosTiendaAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        StoreService::query()->delete();
        $this->whatsapp(true);
    }

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function whatsapp(bool $encendido): void
    {
        ConfiguracionTienda::set('whatsapp_enabled', $encendido ? '1' : '0');
        ConfiguracionTienda::set('whatsapp_numero', '591 70000000');
    }

    private function servicio(string $titulo, array $datos = []): StoreService
    {
        static $orden = 0;
        $orden++;

        return StoreService::create(array_merge([
            'icon'        => 'wrench',
            'title'       => $titulo,
            'description' => 'Una frase clara.',
            'accion'      => 'ninguna',
            'active'      => true,
            'sort_order'  => $orden,
        ], $datos));
    }

    private function seccion(array $datos = []): HomeSection
    {
        HomeSection::where('type', 'services')->delete();

        return HomeSection::create(array_merge([
            'type' => 'services', 'label' => 'Servicios', 'active' => true, 'orden' => 1, 'settings' => [],
        ], $datos));
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $servicio = $this->servicio('Diagnóstico');

        $this->get('/admin/sitio/servicios')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/sitio/servicios')->assertForbidden();
        $this->actingAs($vendedor)->patch(route('admin.services.update', $servicio), ['title' => 'Otro'])->assertForbidden();
        $this->actingAs($vendedor)->delete(route('admin.services.destroy', $servicio))->assertForbidden();

        $this->assertSame('Diagnóstico', $servicio->fresh()->title);
    }

    public function test_el_listado_cuenta_y_dice_que_hace_cada_tarjeta(): void
    {
        $this->seccion(['settings' => ['titulo' => 'Lo que hacemos']]);
        $this->servicio('Diagnóstico');
        $this->servicio('Atención directa', ['accion' => 'whatsapp', 'boton' => 'Escríbenos']);
        $this->servicio('Trade-In', ['accion' => 'enlace', 'enlace' => '/trade-in']);
        $this->servicio('Envíos', ['active' => false]);

        $this->actingAs($this->admin())->get('/admin/sitio/servicios')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Services/Index')
                ->has('servicios', 4)
                ->where('resumen.total', 4)
                ->where('resumen.visibles', 3)
                ->where('resumen.ocultos', 1)
                ->where('resumen.con_boton', 2)
                ->where('servicios.1.en_tienda', 'whatsapp')
                ->where('servicios.1.texto_boton', 'Escríbenos')
                ->where('servicios.1.mensaje', 'Hola Apple Boss, quiero consultar por: Atención directa')
                ->where('servicios.2.texto_boton', 'Ver más')
                ->where('servicios.0.texto_boton', null)
                ->where('seccion.estado', 'encendida')
                ->where('seccion.titulo', 'Lo que hacemos')
                ->where('whatsapp', true)
                ->has('acciones', 3));
    }

    public function test_avisa_si_la_seccion_esta_apagada_o_programada_en_portada(): void
    {
        $this->seccion(['active' => false]);

        $this->actingAs($this->admin())->get('/admin/sitio/servicios')
            ->assertInertia(fn (Assert $page) => $page->where('seccion.estado', 'apagada'));

        $this->seccion(['publicar_desde' => now()->addWeek()]);

        $this->actingAs($this->admin())->get('/admin/sitio/servicios')
            ->assertInertia(fn (Assert $page) => $page
                ->where('seccion.estado', 'programada')
                ->where('seccion.fecha', now()->addWeek()->format('d/m/Y')));
    }

    public function test_avisa_cuando_el_whatsapp_de_la_tienda_esta_apagado(): void
    {
        $this->whatsapp(false);
        $this->servicio('Atención directa', ['accion' => 'whatsapp']);

        $this->actingAs($this->admin())->get('/admin/sitio/servicios')
            ->assertInertia(fn (Assert $page) => $page
                ->where('whatsapp', false)
                ->where('resumen.con_boton', 0)
                ->where('servicios.0.en_tienda', 'ninguna')
                ->where('servicios.0.aviso', 'El WhatsApp de la tienda está apagado: la tarjeta se ve sin su botón.'));
    }

    public function test_agregar_un_servicio_lo_pone_al_final_con_el_texto_limpio(): void
    {
        $this->servicio('Primero');

        $this->actingAs($this->admin())
            ->post(route('admin.services.store'), [
                'icon' => 'truck', 'title' => '<b>Envíos</b>', 'description' => 'Coordinamos <i>contigo</i>.',
                'accion' => 'whatsapp', 'boton' => '',
            ])
            ->assertRedirect();

        $servicios = StoreService::orderBy('sort_order')->get();
        $this->assertSame(['Primero', 'Envíos'], $servicios->pluck('title')->all());
        $this->assertSame('Coordinamos contigo.', $servicios->last()->description);
        $this->assertTrue($servicios->last()->active);
        $this->assertNull($servicios->last()->boton);
    }

    public function test_no_se_puede_usar_un_icono_que_la_tienda_no_dibuja(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.services.store'), ['icon' => '🔧', 'title' => 'Reparaciones', 'accion' => 'ninguna'])
            ->assertSessionHasErrors('icon');

        $this->assertSame(0, StoreService::count());
    }

    public function test_un_boton_a_una_pagina_necesita_una_direccion_segura(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.services.store'), ['icon' => 'exchange', 'title' => 'Trade-In', 'accion' => 'enlace', 'enlace' => ''])
            ->assertSessionHasErrors('enlace');

        $this->actingAs($admin)
            ->post(route('admin.services.store'), ['icon' => 'exchange', 'title' => 'Trade-In', 'accion' => 'enlace', 'enlace' => 'javascript:alert(1)'])
            ->assertSessionHasErrors('enlace');

        $this->assertSame(0, StoreService::count());
    }

    public function test_si_solo_informa_no_guarda_boton_ni_direccion(): void
    {
        $servicio = $this->servicio('Trade-In', ['accion' => 'enlace', 'enlace' => '/trade-in', 'boton' => 'Cotizar']);

        $this->actingAs($this->admin())
            ->patch(route('admin.services.update', $servicio), [
                'icon' => 'exchange', 'title' => 'Trade-In', 'description' => '', 'accion' => 'ninguna',
                'enlace' => '/trade-in', 'boton' => 'Cotizar',
            ])
            ->assertRedirect();

        $servicio->refresh();
        $this->assertSame('ninguna', $servicio->accion);
        $this->assertNull($servicio->enlace);
        $this->assertNull($servicio->boton);
        $this->assertNull($servicio->description);
    }

    public function test_el_interruptor_lo_oculta_sin_borrarlo(): void
    {
        $servicio = $this->servicio('Diagnóstico');

        $this->actingAs($this->admin())
            ->patch(route('admin.services.update', $servicio), ['active' => false])
            ->assertRedirect()
            ->assertSessionHas('success', 'El servicio quedó oculto.');

        $this->assertFalse($servicio->fresh()->active);
        $this->assertSame('Diagnóstico', $servicio->fresh()->title);
        $this->assertSame([], StoreService::paraLaTienda());
    }

    public function test_el_orden_se_guarda(): void
    {
        $uno = $this->servicio('Primero');
        $dos = $this->servicio('Segundo');

        $this->actingAs($this->admin())
            ->post(route('admin.services.reorder'), ['orden' => [
                ['id' => $dos->id, 'orden' => 1],
                ['id' => $uno->id, 'orden' => 2],
            ]])
            ->assertRedirect();

        $this->assertSame(['Segundo', 'Primero'], collect(StoreService::paraLaTienda())->pluck('title')->all());
    }

    public function test_borrar_lo_saca_de_la_tienda(): void
    {
        $servicio = $this->servicio('Diagnóstico');

        $this->actingAs($this->admin())->delete(route('admin.services.destroy', $servicio))->assertRedirect();

        $this->assertNull(StoreService::find($servicio->id));
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_el_inicio_recibe_las_tarjetas_encendidas_con_su_boton(): void
    {
        $this->seccion();
        $this->servicio('Diagnóstico');
        $this->servicio('Atención directa', ['accion' => 'whatsapp']);
        $this->servicio('Trade-In', ['accion' => 'enlace', 'enlace' => '/trade-in', 'boton' => 'Cotizar mi equipo']);
        $this->servicio('Oculto', ['active' => false]);

        $servicios = collect($this->get('/')->assertOk()->viewData('page')['props']['services']);

        $this->assertSame(['Diagnóstico', 'Atención directa', 'Trade-In'], $servicios->pluck('title')->all());
        $this->assertSame(['ninguna', 'whatsapp', 'enlace'], $servicios->pluck('accion')->all());
        $this->assertNull($servicios[0]['boton']);
        $this->assertSame('Consultar por WhatsApp', $servicios[1]['boton']);
        $this->assertSame('Hola Apple Boss, quiero consultar por: Atención directa', $servicios[1]['mensaje']);
        $this->assertSame('/trade-in', $servicios[2]['enlace']);
        $this->assertSame('Cotizar mi equipo', $servicios[2]['boton']);
    }

    public function test_sin_whatsapp_la_tarjeta_queda_sin_boton(): void
    {
        $this->seccion();
        $this->whatsapp(false);
        $this->servicio('Atención directa', ['accion' => 'whatsapp']);

        $servicio = $this->get('/')->assertOk()->viewData('page')['props']['services'][0];

        $this->assertSame('ninguna', $servicio['accion']);
        $this->assertNull($servicio['boton']);
        $this->assertNull($servicio['mensaje']);
    }

    public function test_sin_servicios_la_seccion_no_se_dibuja_y_portada_lo_dice(): void
    {
        $this->seccion();
        $this->servicio('Oculto', ['active' => false]);

        $this->assertSame([], $this->get('/')->assertOk()->viewData('page')['props']['services']);

        $this->actingAs($this->admin())->get('/admin/home-builder')
            ->assertInertia(fn (Assert $page) => $page
                ->where('sections', fn ($secciones) => collect($secciones)->firstWhere('type', 'services')['se_ve'] === false
                    && collect($secciones)->firstWhere('type', 'services')['motivo'] === 'No hay servicios encendidos.'));
    }

    public function test_el_titulo_de_la_seccion_se_cambia_en_portada(): void
    {
        $seccion = $this->seccion();

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $seccion), ['settings' => [
                'titulo' => '<b>Lo que hacemos</b>', 'subtitle' => 'Además de vender equipos.', 'limit' => 4,
            ]])
            ->assertRedirect();

        $this->assertSame(
            ['titulo' => 'Lo que hacemos', 'subtitle' => 'Además de vender equipos.'],
            $seccion->fresh()->settings
        );
    }

    public function test_los_iconos_del_panel_son_los_que_dibuja_la_tienda(): void
    {
        $iconos = file_get_contents(resource_path('js/Components/Store/Icons.jsx'));
        preg_match('/export const SERVICE_ICONS = \{(.*?)\n\};/s', $iconos, $bloque);
        preg_match_all('/^\s+(\w+):\s+\{ Icon:/m', $bloque[1] ?? '', $claves);

        $this->assertSame(StoreService::ICONOS, $claves[1]);
    }
}
