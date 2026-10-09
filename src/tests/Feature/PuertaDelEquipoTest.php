<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * El acceso al sistema no se ve por ningún lado: solo existe en /admin/login y /vendedor/login, y quien lo encuentra
 * por la tienda o probando direcciones del panel recibe 404. El «Acceder» de la tienda es solo para quien compra.
 */
class PuertaDelEquipoTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_puerta_del_equipo_solo_existe_en_su_direccion_y_no_se_indexa(): void
    {
        $this->get('/login')->assertNotFound();
        $this->post('/login', ['email' => 'a@b.c', 'password' => 'x'])->assertNotFound();

        foreach (['/admin/login' => '/admin/login', '/vendedor/login' => '/vendedor/login'] as $url => $accion) {
            $this->get($url)->assertOk()
                ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
                ->assertInertia(fn ($p) => $p->component('Auth/Login')->where('accion', url($accion)));
        }
    }

    public function test_sin_sesion_el_panel_responde_404_y_no_manda_a_la_puerta(): void
    {
        foreach (['/admin', '/admin/dashboard', '/admin/integraciones', '/vendedor/dashboard', '/dashboard', '/profile', '/register'] as $url) {
            $r = $this->get($url);
            $this->assertSame(404, $r->getStatusCode(), "{$url} respondió {$r->getStatusCode()}");
        }
        // La compra y «Mi cuenta» sí llevan a la puerta de la tienda
        $this->get('/checkout')->assertRedirect(route('cuenta.entrar'));
        $this->get('/mi-cuenta')->assertRedirect(route('cuenta.entrar'));
    }

    public function test_cada_puerta_acepta_solo_a_los_suyos_sin_revelar_quien_es_del_equipo(): void
    {
        User::factory()->create(['rol' => 'admin', 'email' => 'jefe@appleboss.com.bo']);
        User::factory()->create(['rol' => 'vendedor', 'email' => 'ventas@appleboss.com.bo']);
        User::factory()->create(['rol' => 'cliente', 'email' => 'ana@gmail.com']);

        // Por la tienda no entra el equipo: el mismo mensaje que una contraseña equivocada
        $mal = $this->post(route('cuenta.entrar.enviar'), ['email' => 'nadie@gmail.com', 'password' => 'otra'])->assertSessionHasErrors('email');
        $mensaje = session('errors')->first('email');
        $this->flushSession();
        foreach (['jefe@appleboss.com.bo', 'ventas@appleboss.com.bo'] as $correo) {
            $this->post(route('cuenta.entrar.enviar'), ['email' => $correo, 'password' => 'password'])->assertSessionHasErrors(['email' => $mensaje]);
            $this->assertGuest();
            $this->flushSession();
        }

        // Por las del equipo no entra quien compra
        $this->post(route('login.enviar'), ['email' => 'ana@gmail.com', 'password' => 'password'])->assertSessionHasErrors(['email' => $mensaje]);
        $this->assertGuest();
        $this->flushSession();

        // Y cada uno entra por la suya
        $this->post(route('cuenta.entrar.enviar'), ['email' => 'ana@gmail.com', 'password' => 'password']);
        $this->assertAuthenticated();
        $this->post('/logout');
        $this->post(route('login.enviar'), ['email' => 'jefe@appleboss.com.bo', 'password' => 'password']);
        $this->assertAuthenticated();
    }

    public function test_la_tienda_no_publica_la_puerta_ni_las_rutas_del_equipo(): void
    {
        // Aunque el menú del pie, cargado en el panel, tenga un «Acceder» que apunta a la puerta vieja
        \App\Models\NavMenuItem::create(['slot' => 'footer', 'label' => 'Acceder', 'url' => '/login', 'group' => 'Apple Boss', 'active' => true, 'sort_order' => 1]);
        $html = $this->get('/')->assertOk()->getContent();

        foreach (['admin/login', 'vendedor/login', '"login"', '\\/login', '"register"', '"dashboard"', 'profile.edit', '/admin/', 'vendedor.'] as $rastro) {
            $this->assertStringNotContainsString($rastro, $html, "la portada publica «{$rastro}»");
        }
        $this->assertStringNotContainsString('/admin', $this->get('/robots.txt')->getContent());
    }

    public function test_quien_encuentra_el_panel_ve_el_aviso_de_acceso_restringido(): void
    {
        // La puerta sigue respondiendo, y un 404 de la tienda no es «restringido»
        $this->get('/admin/login')->assertOk();
        $this->assertStringNotContainsString('AccesoRestringido', $this->get('/no-existe-en-la-tienda')->assertNotFound()->getContent());

        // Visitante: 404 con la página animada, también en direcciones del panel que no existen
        foreach (['/admin', '/admin/ventas', '/admin/no-existe', '/vendedor/dashboard', '/dashboard'] as $url) {
            $this->get($url)->assertNotFound()
                ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
                ->assertInertia(fn ($p) => $p->component('Errores/AccesoRestringido'));
        }

        // Un cliente con sesión: 403, la misma página
        $cliente = User::factory()->create(['rol' => 'cliente']);
        $this->actingAs($cliente)->get('/admin/ventas')->assertForbidden()
            ->assertInertia(fn ($p) => $p->component('Errores/AccesoRestringido'));

        // Alguien del equipo que pide algo que no existe no ve «restringido»
        $this->app['auth']->forgetGuards();
        $admin = User::factory()->create(['rol' => 'admin']);
        $r = $this->actingAs($admin)->get('/admin/no-existe');
        $r->assertNotFound();
        $this->assertStringNotContainsString('AccesoRestringido', $r->getContent());

    }
}
