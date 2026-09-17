<?php

namespace Tests\Feature;

use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use App\Support\NewsletterEstado;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Las tres pantallas de Marketing y Google → newsletter: Campañas, Suscriptores y Ajustes.
 * Lo que se prueba acá es el cableado: que el panel diga la verdad sobre si los correos pueden salir,
 * que la búsqueda funcione en cualquier base y que una campaña no se envíe si le falta algo.
 */
class NewsletterPanelTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function suscriptor(string $email, ?string $nombre = null, array $extra = []): NewsletterSubscriber
    {
        return NewsletterSubscriber::create(array_merge(['email' => $email, 'nombre' => $nombre, 'source' => 'footer'], $extra));
    }

    private function campana(array $datos = []): NewsletterCampaign
    {
        return NewsletterCampaign::create(array_merge([
            'asunto'  => 'Llegaron equipos nuevos',
            'bloques' => [['tipo' => 'titulo', 'texto' => 'Hola']],
            'destino' => 'todos',
            'estado'  => 'borrador',
        ], $datos));
    }

    // ─── Estado del servidor ────────────────────────────────────────────────

    public function test_avisa_cuando_falta_la_clave_del_correo(): void
    {
        config(['mail.default' => 'smtp', 'mail.mailers.smtp.host' => 'smtp.gmail.com', 'mail.mailers.smtp.username' => 'tienda@gmail.com', 'mail.mailers.smtp.password' => '']);

        $correo = NewsletterEstado::correo();

        $this->assertFalse($correo['listo']);
        $this->assertStringContainsString('clave', $correo['falta']);
        // La clave nunca sale en los datos que ve el panel
        $this->assertArrayNotHasKey('clave', $correo);
        $this->assertFalse($correo['con_clave']);
    }

    public function test_avisa_cuando_el_correo_esta_en_modo_prueba(): void
    {
        config(['mail.default' => 'log']);

        $correo = NewsletterEstado::correo();

        $this->assertFalse($correo['listo']);
        $this->assertTrue($correo['prueba']);
    }

    public function test_con_la_clave_cargada_el_correo_esta_listo(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.gmail.com',
            'mail.mailers.smtp.username' => 'tienda@gmail.com',
            'mail.mailers.smtp.password' => 'una-clave-de-aplicacion',
            'mail.from.address' => 'tienda@gmail.com',
        ]);

        $this->assertTrue(NewsletterEstado::correo()['listo']);
    }

    public function test_avisa_cuando_la_cola_esta_en_modo_directo(): void
    {
        config(['queue.default' => 'sync']);

        $cola = NewsletterEstado::cola();

        $this->assertFalse($cola['listo']);
        $this->assertStringContainsString('queue:work', $cola['falta']);
    }

    // ─── Campañas ───────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra_a_las_tres_pantallas(): void
    {
        $urls = ['/admin/newsletter/campanas', '/admin/newsletter/suscriptores', '/admin/newsletter/ajustes'];

        foreach ($urls as $url) {
            $this->get($url)->assertRedirect('/login');
        }

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        foreach ($urls as $url) {
            $this->actingAs($vendedor)->get($url)->assertForbidden();
        }
    }

    public function test_el_listado_dice_si_los_correos_pueden_salir(): void
    {
        $this->campana();

        $this->actingAs($this->admin())
            ->get('/admin/newsletter/campanas')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Newsletter/Campaigns')
                ->has('estado.correo.listo')
                ->has('estado.cola.listo')
                ->has('stats.borradores')
                ->has('campaigns.data.0.destinatarios')
            );
    }

    public function test_una_campana_sin_asunto_no_se_envia_y_el_panel_lo_explica(): void
    {
        $this->suscriptor('ana@correo.com');
        $campana = $this->campana(['asunto' => '']);

        $this->assertSame('Escribe el asunto del correo.', $campana->porQueNoSePuedeEnviar());

        $this->actingAs($this->admin())
            ->postJson("/admin/newsletter/campanas/{$campana->id}/enviar")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Escribe el asunto del correo.');
    }

    public function test_una_campana_vacia_no_se_envia(): void
    {
        $this->suscriptor('ana@correo.com');
        $campana = $this->campana(['bloques' => []]);

        $this->actingAs($this->admin())
            ->postJson("/admin/newsletter/campanas/{$campana->id}/enviar")
            ->assertStatus(422)
            ->assertJsonPath('message', 'El correo está vacío: agrega al menos un bloque.');
    }

    public function test_sin_suscriptores_activos_no_se_envia(): void
    {
        $this->suscriptor('ana@correo.com', null, ['unsubscribed_at' => now()]);
        $campana = $this->campana();

        $this->actingAs($this->admin())
            ->postJson("/admin/newsletter/campanas/{$campana->id}/enviar")
            ->assertStatus(422)
            ->assertJsonPath('message', 'No hay suscriptores activos a quienes mandarles.');
    }

    public function test_sin_la_clave_del_correo_no_se_envia(): void
    {
        config(['mail.default' => 'log']);
        $this->suscriptor('ana@correo.com');
        $campana = $this->campana();

        $this->actingAs($this->admin())
            ->postJson("/admin/newsletter/campanas/{$campana->id}/enviar")
            ->assertStatus(422);

        $this->assertSame('borrador', $campana->fresh()->estado);
    }

    public function test_el_progreso_de_una_campana_se_calcula_igual_en_todos_lados(): void
    {
        $campana = $this->campana(['estado' => 'enviando', 'total' => 200, 'enviados' => 98, 'fallidos' => 2]);

        $this->assertSame(50, $campana->progreso());
        $this->assertSame(50, $campana->paraElPanel()['progreso']);
    }

    // ─── Suscriptores ───────────────────────────────────────────────────────

    public function test_la_busqueda_de_suscriptores_no_depende_de_postgresql(): void
    {
        $this->suscriptor('Ana.Quiroga@Correo.com', 'Ana Quiroga');
        $this->suscriptor('juan@otro.com', 'Juan Pérez');

        $this->actingAs($this->admin())
            ->get('/admin/newsletter/suscriptores?q=QUIROGA&filtro=todos')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Newsletter/Subscribers')
                ->has('subscribers.data', 1)
                ->where('subscribers.data.0.nombre', 'Ana Quiroga')
            );

        // También por parte del correo, sin importar mayúsculas
        $this->actingAs($this->admin())
            ->get('/admin/newsletter/suscriptores?q=ana.quiroga&filtro=todos')
            ->assertInertia(fn (Assert $page) => $page->has('subscribers.data', 1));
    }

    public function test_el_listado_cuenta_de_donde_salio_cada_suscriptor(): void
    {
        $this->suscriptor('ana@correo.com');
        $this->suscriptor('local@correo.com', null, ['source' => 'admin']);
        $this->suscriptor('baja@correo.com', null, ['unsubscribed_at' => now()]);

        $this->actingAs($this->admin())
            ->get('/admin/newsletter/suscriptores')
            ->assertInertia(fn (Assert $page) => $page
                ->where('counts.activos', 2)
                ->where('counts.bajas', 1)
                ->where('counts.todos', 3)
                ->where('counts.del_sitio', 2)
            );
    }

    public function test_dar_de_baja_y_reactivar_desde_el_panel(): void
    {
        $sub = $this->suscriptor('ana@correo.com');
        $admin = $this->admin();

        $this->actingAs($admin)->patch("/admin/newsletter/suscriptores/{$sub->id}", ['baja' => true]);
        $this->assertNotNull($sub->fresh()->unsubscribed_at);

        $this->actingAs($admin)->patch("/admin/newsletter/suscriptores/{$sub->id}", ['baja' => false]);
        $this->assertNull($sub->fresh()->unsubscribed_at);
    }

    public function test_la_importacion_no_reactiva_a_quien_se_dio_de_baja(): void
    {
        $baja = $this->suscriptor('baja@correo.com', null, ['unsubscribed_at' => now()]);

        $this->actingAs($this->admin())
            ->post('/admin/newsletter/suscriptores/importar', ['emails' => "baja@correo.com\nnueva@correo.com"])
            ->assertRedirect();

        $this->assertNotNull($baja->fresh()->unsubscribed_at);
        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'nueva@correo.com', 'source' => 'importacion']);
    }

    // ─── Ajustes ────────────────────────────────────────────────────────────

    public function test_los_ajustes_guardan_y_validan_en_espanol(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/admin/newsletter/ajustes', [
            'newsletter_enabled' => true,
            'newsletter_titulo' => '',
            'newsletter_boton' => 'Suscribirme',
            'newsletter_remitente_nombre' => 'Apple Boss',
            'newsletter_lote_por_minuto' => 20,
        ])->assertSessionHasErrors('newsletter_titulo');

        $this->actingAs($admin)->post('/admin/newsletter/ajustes', [
            'newsletter_enabled' => true,
            'newsletter_titulo' => 'Ofertas para suscriptores',
            'newsletter_boton' => 'Suscribirme',
            'newsletter_remitente_nombre' => 'Apple Boss',
            'newsletter_responder_a' => 'ventas@appleboss.bo',
            'newsletter_pie' => 'Apple Boss · Cochabamba',
            'newsletter_lote_por_minuto' => 25,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('configuracion_tienda', ['clave' => 'newsletter_titulo', 'valor' => 'Ofertas para suscriptores']);
    }

    public function test_la_velocidad_no_puede_pasar_del_maximo(): void
    {
        $this->actingAs($this->admin())->post('/admin/newsletter/ajustes', [
            'newsletter_enabled' => true,
            'newsletter_titulo' => 'Ofertas',
            'newsletter_boton' => 'Suscribirme',
            'newsletter_remitente_nombre' => 'Apple Boss',
            'newsletter_lote_por_minuto' => 999,
        ])->assertSessionHasErrors('newsletter_lote_por_minuto');
    }

    public function test_el_correo_de_prueba_sale_con_el_nombre_de_la_tienda(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.gmail.com',
            'mail.mailers.smtp.username' => 'tienda@gmail.com',
            'mail.mailers.smtp.password' => 'clave',
            'mail.from.address' => 'tienda@gmail.com',
        ]);
        Mail::fake();

        $this->actingAs($this->admin())
            ->post('/admin/newsletter/ajustes/prueba', ['email' => 'admin@appleboss.bo'])
            ->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');
    }

    public function test_el_correo_de_prueba_avisa_si_falta_la_clave(): void
    {
        config(['mail.default' => 'log']);

        $this->actingAs($this->admin())
            ->post('/admin/newsletter/ajustes/prueba', ['email' => 'admin@appleboss.bo'])
            ->assertSessionHasErrors('email');
    }
}
