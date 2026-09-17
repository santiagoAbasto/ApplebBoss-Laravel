<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use App\Models\HomeSection;
use App\Models\StoreLocation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Ubicaciones: los locales, único lugar de la dirección, el horario, el contacto y el mapa.
 * «Dónde estamos» muestra los encendidos en orden; el primero es el principal (ciudad de la tienda, pie y Google).
 */
class UbicacionesAdminTest extends TestCase
{
    use RefreshDatabase;

    private const MAPA = 'https://www.google.com/maps/embed?pb=!1m18!1m12!2sApple%20Boss';

    protected function setUp(): void
    {
        parent::setUp();
        StoreLocation::query()->delete();
        $this->whatsapp(true);
    }

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function whatsapp(bool $encendido): void
    {
        ConfiguracionTienda::set('whatsapp_enabled', $encendido ? '1' : '0');
        ConfiguracionTienda::set('whatsapp_numero', '59171111111');
    }

    private function local(string $nombre, array $datos = []): StoreLocation
    {
        static $orden = 0;
        $orden++;

        return StoreLocation::create(array_merge([
            'name'       => $nombre,
            'address'    => 'Av. Heroínas 456',
            'city'       => 'Cochabamba',
            'country'    => 'Bolivia',
            'active'     => true,
            'sort_order' => $orden,
        ], $datos));
    }

    private function seccion(array $datos = []): HomeSection
    {
        HomeSection::where('type', 'location')->delete();

        return HomeSection::create(array_merge([
            'type' => 'location', 'label' => 'Dónde estamos', 'active' => true, 'orden' => 1, 'settings' => [],
        ], $datos));
    }

    /** Lunes a viernes de 9 a 19, sábado de 9 a 13, domingo cerrado. */
    private function semana(): array
    {
        $dias = [];
        foreach (range(1, 7) as $dia) {
            $dias[] = match (true) {
                $dia <= 5 => ['dia' => $dia, 'abierto' => true, 'tramos' => [['abre' => '09:00', 'cierra' => '19:00']]],
                $dia === 6 => ['dia' => $dia, 'abierto' => true, 'tramos' => [['abre' => '9:00', 'cierra' => '13:00']]],
                default => ['dia' => $dia, 'abierto' => false, 'tramos' => []],
            };
        }

        return $dias;
    }

    private function formulario(array $datos = []): array
    {
        return array_merge([
            'name' => 'Apple Boss Cochabamba', 'address' => 'Av. Heroínas 456', 'city' => 'Cochabamba', 'country' => 'Bolivia',
            'description' => '', 'horarios' => $this->semana(), 'hours' => '', 'phone' => '', 'whatsapp' => '',
            'map_embed_url' => '', 'map_link_url' => '', 'active' => true,
        ], $datos);
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $local = $this->local('Apple Boss Cochabamba');

        $this->get('/admin/sitio/ubicaciones')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/sitio/ubicaciones')->assertForbidden();
        $this->actingAs($vendedor)->patch(route('admin.locations.update', $local), ['active' => false])->assertForbidden();
        $this->actingAs($vendedor)->delete(route('admin.locations.destroy', $local))->assertForbidden();

        $this->assertTrue($local->fresh()->active);
    }

    public function test_el_listado_marca_la_principal_y_manda_lo_que_ve_la_tienda(): void
    {
        $this->seccion(['settings' => ['titulo' => 'Visítanos']]);
        $this->local('Depósito', ['active' => false]);
        $this->local('Apple Boss Cochabamba', ['horarios' => $this->semana(), 'phone' => '4 4123456']);
        $this->local('Apple Boss Santa Cruz', ['city' => 'Santa Cruz']);

        $this->actingAs($this->admin())->get('/admin/sitio/ubicaciones')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Locations/Index')
                ->has('ubicaciones', 3)
                ->where('ubicaciones.0.principal', false)
                ->where('ubicaciones.1.principal', true)
                ->where('ubicaciones.2.principal', false)
                ->where('ubicaciones.1.publico.telefono_url', 'tel:+59144123456')
                ->has('ubicaciones.1.horarios', 7)
                ->where('seccion.estado', 'encendida')
                ->where('seccion.titulo', 'Visítanos')
                ->where('contacto.whatsapp_activo', true)
                ->where('contacto.whatsapp_numero', '59171111111'));
    }

    public function test_agregar_una_ubicacion_deja_los_datos_limpios(): void
    {
        $this->local('Primera');

        $this->actingAs($this->admin())
            ->post(route('admin.locations.store'), $this->formulario([
                'name'          => '<b>Apple Boss</b> Santa Cruz',
                'whatsapp'      => '+591 700-00000',
                'phone'         => '+591 3 3123456',
                'map_embed_url' => '<iframe src="' . self::MAPA . '&amp;x=1" width="600" height="450"></iframe>',
                'map_link_url'  => 'https://maps.app.goo.gl/abc123',
            ]))
            ->assertRedirect(route('admin.locations.index'));

        $local = StoreLocation::where('name', 'Apple Boss Santa Cruz')->firstOrFail();
        $this->assertSame('59170000000', $local->whatsapp);
        $this->assertSame(self::MAPA . '&x=1', $local->map_embed_url);
        $this->assertSame('tel:+59133123456', $local->telefonoUrl());
        $this->assertGreaterThan(StoreLocation::where('name', 'Primera')->value('sort_order'), $local->sort_order);
        // El sábado se escribió «9:00»: se guarda «09:00»; el domingo cerrado queda sin tramos
        $this->assertSame(['abre' => '09:00', 'cierra' => '13:00'], $local->horarios[5]['tramos'][0]);
        $this->assertSame(['dia' => 7, 'abierto' => false, 'tramos' => []], $local->horarios[6]);
    }

    public function test_el_horario_se_valida_dia_por_dia(): void
    {
        $admin = $this->admin();
        $semana = $this->semana();

        $alReves = $semana;
        $alReves[0]['tramos'] = [['abre' => '19:00', 'cierra' => '09:00']];
        $this->actingAs($admin)->post(route('admin.locations.store'), $this->formulario(['horarios' => $alReves]))
            ->assertSessionHasErrors(['horarios.0' => 'El lunes, la hora de cierre tiene que ser después de la de apertura.']);

        $tardeEncimada = $semana;
        $tardeEncimada[1]['tramos'] = [['abre' => '09:00', 'cierra' => '13:00'], ['abre' => '12:00', 'cierra' => '19:00']];
        $this->actingAs($admin)->post(route('admin.locations.store'), $this->formulario(['horarios' => $tardeEncimada]))
            ->assertSessionHasErrors(['horarios.1' => 'El martes, la tarde tiene que empezar después de que termina la mañana.']);

        $sinHoras = $semana;
        $sinHoras[2]['tramos'] = [['abre' => '', 'cierra' => '']];
        $this->actingAs($admin)->post(route('admin.locations.store'), $this->formulario(['horarios' => $sinHoras]))
            ->assertSessionHasErrors(['horarios.2' => 'Completa las horas del miércoles.']);

        $this->assertSame(0, StoreLocation::count());

        // Sin ningún día abierto no hay horario cargado: no se muestra «cerrado» toda la semana
        $cerrado = array_map(fn ($d) => ['dia' => $d['dia'], 'abierto' => false, 'tramos' => []], $semana);
        $this->actingAs($admin)->post(route('admin.locations.store'), $this->formulario(['horarios' => $cerrado]))->assertRedirect();
        $this->assertNull(StoreLocation::first()->horarios);
        $this->assertSame([], StoreLocation::first()->horariosAbiertos());
    }

    public function test_rechaza_un_mapa_que_no_es_de_google_y_un_whatsapp_sin_codigo_de_pais(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.locations.store'), $this->formulario(['map_embed_url' => 'https://otro-sitio.com/maps/embed?x=1']))
            ->assertSessionHasErrors('map_embed_url');

        $this->actingAs($admin)
            ->post(route('admin.locations.store'), $this->formulario(['whatsapp' => '70000000']))
            ->assertSessionHasErrors('whatsapp');

        $this->actingAs($admin)
            ->post(route('admin.locations.store'), $this->formulario(['map_link_url' => 'javascript:alert(1)']))
            ->assertSessionHasErrors('map_link_url');

        $this->assertSame(0, StoreLocation::count());
    }

    public function test_la_ciudad_no_puede_quedar_vacia(): void
    {
        $local = $this->local('Apple Boss Cochabamba');

        // Antes esto rompía al guardar: la columna no acepta vacío
        $this->actingAs($this->admin())
            ->patch(route('admin.locations.update', $local), $this->formulario(['city' => '']))
            ->assertSessionHasErrors('city');

        $this->assertSame('Cochabamba', $local->fresh()->city);
    }

    public function test_el_interruptor_la_oculta_sin_borrarla(): void
    {
        $local = $this->local('Apple Boss Cochabamba');

        $this->actingAs($this->admin())
            ->patch(route('admin.locations.update', $local), ['active' => false])
            ->assertRedirect()
            ->assertSessionHas('success', 'La ubicación quedó oculta.');

        $this->assertFalse($local->fresh()->active);
        $this->assertSame('Av. Heroínas 456', $local->fresh()->address);
        $this->assertSame([], StoreLocation::paraLaTienda());
    }

    public function test_el_orden_decide_la_principal_y_la_ciudad_de_la_tienda(): void
    {
        $cocha = $this->local('Apple Boss Cochabamba');
        $santa = $this->local('Apple Boss Santa Cruz', ['city' => 'Santa Cruz', 'address' => 'Av. Monseñor Rivero 100']);

        $this->assertSame($cocha->id, StoreLocation::principal()->id);

        $this->actingAs($this->admin())
            ->post(route('admin.locations.reorder'), ['orden' => [
                ['id' => $santa->id, 'orden' => 1],
                ['id' => $cocha->id, 'orden' => 2],
            ]])
            ->assertRedirect();

        $this->assertSame($santa->id, StoreLocation::principal()->id);

        $tienda = $this->withHeader('X-Inertia', 'true')->get('/')->json('props.tienda');
        $this->assertSame('Santa Cruz', $tienda['tienda_ciudad']);
        $this->assertSame('Av. Monseñor Rivero 100', $tienda['tienda_direccion']);
        $this->assertTrue($tienda['tienda_local']);
    }

    public function test_borrar_la_saca_de_la_tienda(): void
    {
        $local = $this->local('Apple Boss Cochabamba');

        $this->actingAs($this->admin())
            ->delete(route('admin.locations.destroy', $local))
            ->assertRedirect(route('admin.locations.index'));

        $this->assertNull(StoreLocation::find($local->id));
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_el_inicio_recibe_los_locales_encendidos_con_sus_datos_para_google(): void
    {
        $this->seccion();
        $this->local('Apple Boss Cochabamba', [
            'horarios' => $this->semana(), 'phone' => '4 4123456', 'whatsapp' => '59170000000',
            'map_embed_url' => self::MAPA, 'map_link_url' => 'https://maps.app.goo.gl/abc123', 'hours' => 'Feriados: cerrado',
        ]);
        $this->local('Oculto', ['active' => false]);
        $this->local('Apple Boss Santa Cruz', ['city' => 'Santa Cruz']);

        $locales = $this->get('/')->assertOk()->viewData('page')['props']['locations'];

        $this->assertSame(['Apple Boss Cochabamba', 'Apple Boss Santa Cruz'], array_column($locales, 'nombre'));

        $cocha = $locales[0];
        $this->assertSame('59170000000', $cocha['whatsapp']);
        $this->assertSame('Feriados: cerrado', $cocha['horario_nota']);
        $this->assertSame('https://maps.app.goo.gl/abc123', $cocha['como_llegar']);
        $this->assertCount(7, $cocha['horarios']);

        $google = $cocha['google'];
        $this->assertSame('Store', $google['@type']);
        $this->assertSame('BO', $google['address']['addressCountry']);
        $this->assertSame('Av. Heroínas 456', $google['address']['streetAddress']);
        $this->assertSame('+59144123456', $google['telephone']);
        $this->assertSame([
            ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 'opens' => '09:00', 'closes' => '19:00'],
            ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => ['Saturday'], 'opens' => '09:00', 'closes' => '13:00'],
        ], $google['openingHoursSpecification']);

        // Sin horario cargado, Google no recibe horario
        $this->assertArrayNotHasKey('openingHoursSpecification', $locales[1]['google']);
    }

    public function test_con_el_whatsapp_de_la_tienda_apagado_no_se_manda_el_del_local(): void
    {
        $this->seccion();
        $this->whatsapp(false);
        $this->local('Apple Boss Cochabamba', ['whatsapp' => '59170000000']);

        $local = $this->get('/')->assertOk()->viewData('page')['props']['locations'][0];

        $this->assertNull($local['whatsapp']);
        $this->assertArrayNotHasKey('telephone', $local['google']);
    }

    public function test_sin_locales_la_seccion_no_se_dibuja_y_portada_lo_dice(): void
    {
        $this->seccion();
        $this->local('Oculto', ['active' => false]);

        $this->assertSame([], $this->get('/')->assertOk()->viewData('page')['props']['locations']);

        $this->actingAs($this->admin())->get('/admin/home-builder')
            ->assertInertia(fn (Assert $page) => $page
                ->missing('ubicaciones')
                ->where('sections', fn ($secciones) => collect($secciones)->firstWhere('type', 'location')['se_ve'] === false
                    && collect($secciones)->firstWhere('type', 'location')['motivo'] === 'No hay ubicaciones encendidas.'));
    }

    public function test_portada_solo_cambia_el_titulo_de_la_seccion(): void
    {
        $seccion = $this->seccion();

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $seccion), ['settings' => [
                'titulo' => '<b>Visítanos</b>', 'subtitle' => 'Te esperamos.', 'location_id' => 5,
            ]])
            ->assertRedirect();

        // El local ya no se elige en Portada: salen todos los encendidos, en el orden de Ubicaciones
        $this->assertSame(['titulo' => 'Visítanos', 'subtitle' => 'Te esperamos.'], $seccion->fresh()->settings);
    }

    public function test_configuracion_ya_no_repite_los_datos_del_local(): void
    {
        $this->local('Apple Boss Cochabamba', ['address' => 'Av. Heroínas 456']);

        foreach (['tienda_direccion', 'tienda_ciudad', 'tienda_pais', 'tienda_horario'] as $clave) {
            $this->assertFalse(ConfiguracionTienda::where('clave', $clave)->exists(), "Sigue la clave {$clave} en Configuración.");
        }

        $tienda = $this->withHeader('X-Inertia', 'true')->get('/')->json('props.tienda');
        $this->assertArrayNotHasKey('tienda_horario', $tienda);
        $this->assertSame('Av. Heroínas 456', $tienda['tienda_direccion']);
        $this->assertSame('Bolivia', $tienda['tienda_pais']);
    }
}
