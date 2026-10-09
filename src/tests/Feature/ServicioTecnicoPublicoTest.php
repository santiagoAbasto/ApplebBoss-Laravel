<?php

namespace Tests\Feature;

use App\Models\SolicitudServicio;
use App\Models\SystemNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** /servicio-tecnico: la página pública, el pedido de revisión y su seguimiento en el panel. */
class ServicioTecnicoPublicoTest extends TestCase
{
    use RefreshDatabase;

    private const SOLICITUD = [
        'tipo_equipo' => 'iPhone', 'modelo' => 'iPhone 13 Pro', 'problemas' => ['pantalla', 'bateria'],
        'descripcion' => 'Se cayó ayer.', 'nombre_contacto' => 'Carla Rojas', 'telefono_contacto' => '70012345',
    ];

    public function test_la_pagina_se_lee_sin_javascript_y_tiene_titulo_y_descripcion_propios(): void
    {
        $html = $this->get('/servicio-tecnico')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/ServicioTecnico')
                ->where('formulario.tipos', SolicitudServicio::TIPOS)
                ->has('formulario.problemas', count(SolicitudServicio::PROBLEMAS))
                ->where('enviada', null))
            ->getContent();

        $this->assertStringContainsString('<title data-inertia>Servicio técnico de iPhone y Mac en Cochabamba — Apple Boss</title>', $html);
        $this->assertStringContainsString('<h1>Servicio técnico de iPhone y Mac en Cochabamba</h1>', $html);
        $this->assertStringContainsString('<h2>Cómo trabajamos</h2>', $html);
        $this->assertStringContainsString('<strong>Diagnóstico sin costo</strong>', $html);
    }

    public function test_una_solicitud_se_guarda_avisa_al_panel_y_confirma_solo_a_quien_la_envio(): void
    {
        $this->post('/servicio-tecnico', self::SOLICITUD)->assertRedirect(route('servicio-tecnico.index'));

        $solicitud = SolicitudServicio::sole();
        $this->assertSame('AB-SV-000001', $solicitud->codigo);
        $this->assertSame('Apple', $solicitud->marca);
        $this->assertSame(['pantalla', 'bateria'], $solicitud->problemas);
        $this->assertSame('nuevo', $solicitud->estado);
        $this->assertSame('59170012345', $solicitud->whatsapp());

        $aviso = SystemNotification::where('type', 'solicitud_servicio')->sole();
        $this->assertSame($solicitud->id, $aviso->solicitud_servicio_id);
        $this->assertStringContainsString('Carla Rojas pide revisar su iPhone 13 Pro', $aviso->message);

        // La confirmación sale una vez, en el navegador que envió; después vuelve el formulario
        $this->get('/servicio-tecnico')->assertInertia(fn (Assert $page) => $page
            ->where('enviada.codigo', 'AB-SV-000001')->where('enviada.nombre', 'Carla')->where('enviada.equipo', 'iPhone 13 Pro'));
        $this->get('/servicio-tecnico')->assertInertia(fn (Assert $page) => $page->where('enviada', null));
    }

    public function test_valida_lo_necesario_y_pide_la_marca_cuando_no_es_apple(): void
    {
        $this->post('/servicio-tecnico', [])->assertSessionHasErrors(['tipo_equipo', 'modelo', 'problemas', 'nombre_contacto', 'telefono_contacto']);

        $this->post('/servicio-tecnico', [...self::SOLICITUD, 'tipo_equipo' => 'Celular Android', 'problemas' => ['inventado'], 'telefono_contacto' => 'abc'])
            ->assertSessionHasErrors(['marca', 'problemas.0', 'telefono_contacto']);

        $this->post('/servicio-tecnico', [...self::SOLICITUD, 'tipo_equipo' => 'Celular Android', 'marca' => 'Samsung', 'modelo' => '<b>Galaxy S23</b>'])
            ->assertSessionHasNoErrors();

        $this->assertSame('Samsung Galaxy S23', SolicitudServicio::sole()->equipo());
    }

    public function test_un_robot_que_llena_el_campo_oculto_no_guarda_nada(): void
    {
        $this->post('/servicio-tecnico', [...self::SOLICITUD, 'sitio_web' => 'https://spam.example'])->assertRedirect(route('servicio-tecnico.index'));

        $this->assertSame(0, SolicitudServicio::count());
        $this->assertSame(0, SystemNotification::count());
    }

    public function test_el_panel_lista_las_solicitudes_las_sigue_y_las_borra_y_no_se_abre_sin_sesion(): void
    {
        $this->post('/servicio-tecnico', self::SOLICITUD);
        $solicitud = SolicitudServicio::sole();

        $this->get('/admin/solicitudes-servicio')->assertNotFound();

        $admin = User::factory()->create(['rol' => 'admin']);

        $this->actingAs($admin)->get('/admin/solicitudes-servicio')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/SolicitudesServicio/Index')
                ->where('solicitudes.0.codigo', 'AB-SV-000001')
                ->where('solicitudes.0.problemas', ['Pantalla rota o con fallas', 'La batería dura poco'])
                ->where('solicitudes.0.whatsapp', '59170012345')
                ->where('avisosAdmin.solicitud_servicio', 1));

        // Abrir WhatsApp solo cambia el estado: las notas quedan como estaban y el aviso se apaga
        $this->actingAs($admin)->patch("/admin/solicitudes-servicio/{$solicitud->id}", ['estado' => 'recibido', 'notas_internas' => 'Trae el equipo el lunes.']);
        $this->actingAs($admin)->patch("/admin/solicitudes-servicio/{$solicitud->id}", ['estado' => 'contactado']);

        $solicitud->refresh();
        $this->assertSame('contactado', $solicitud->estado);
        $this->assertSame('Trae el equipo el lunes.', $solicitud->notas_internas);
        $this->assertSame($admin->id, $solicitud->atendido_por);
        $this->assertTrue((bool) SystemNotification::sole()->read);

        $this->actingAs($admin)->delete("/admin/solicitudes-servicio/{$solicitud->id}");
        $this->assertSame(0, SolicitudServicio::count());
        $this->assertSame(0, SystemNotification::count());
    }
}
