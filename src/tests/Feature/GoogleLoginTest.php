<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\TestCase;

/**
 * Entrar con Google.
 *
 * Lo crítico: al staff NO se le deja entrar por acá. El control de horario del vendedor
 * vive en el login por contraseña, así que abrir el panel con Google sería saltárselo.
 */
class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.google.client_id'     => 'id-de-prueba',
            'services.google.client_secret' => 'secreto-de-prueba',
        ]);
    }

    private function googleDevuelve(string $email, string $id = 'sub-123', bool $verificado = true, string $nombre = 'Ana Quispe'): void
    {
        $usuario = (new GoogleUser())->map([
            'id' => $id, 'name' => $nombre, 'email' => $email,
        ]);
        $usuario->user = ['email_verified' => $verificado];

        Socialite::shouldReceive('driver->user')->andReturn($usuario);
    }

    public function test_sin_credenciales_la_ruta_no_existe(): void
    {
        config(['services.google.client_id' => null, 'services.google.client_secret' => null]);

        $this->get('/auth/google')->assertNotFound();
        $this->get('/auth/google/callback')->assertNotFound();
    }

    public function test_crea_al_cliente_con_el_correo_ya_verificado(): void
    {
        $this->googleDevuelve('ana@gmail.com');

        $this->get('/auth/google/callback')->assertRedirect(route('cuenta.index'));

        $user = User::where('email', 'ana@gmail.com')->firstOrFail();
        $this->assertSame('cliente', $user->rol);
        $this->assertSame('sub-123', $user->google_id);
        $this->assertNotNull($user->email_verified_at, 'Google ya confirmó que el correo es suyo');
        $this->assertAuthenticatedAs($user);
    }

    public function test_un_admin_no_entra_por_google(): void
    {
        $this->elStaffNoEntra('admin');
    }

    public function test_un_vendedor_no_entra_por_google(): void
    {
        // El horario laboral se controla en el login por contraseña: si Google abriera el
        // panel, un vendedor entraría de madrugada saltándose ese control.
        $this->elStaffNoEntra('vendedor');
    }

    private function elStaffNoEntra(string $rol): void
    {
        $staff = User::factory()->create(['rol' => $rol, 'email' => "{$rol}@gmail.com"]);
        $this->googleDevuelve("{$rol}@gmail.com", "sub-{$rol}");

        $this->get('/auth/google/callback')
            ->assertRedirect(route('login'))
            ->assertSessionHasErrors('email');

        $this->assertGuest();
        $this->assertNull($staff->fresh()->google_id, 'ni siquiera se le ata la cuenta de Google');
    }

    public function test_un_correo_de_google_sin_verificar_se_rechaza(): void
    {
        $this->googleDevuelve('ana@gmail.com', verificado: false);

        $this->get('/auth/google/callback')->assertRedirect(route('login'))->assertSessionHasErrors('email');

        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_si_ya_tenia_cuenta_con_contrasena_se_le_ata_la_de_google(): void
    {
        $cliente = User::factory()->create(['rol' => 'cliente', 'email' => 'ana@gmail.com', 'google_id' => null]);

        $this->googleDevuelve('ana@gmail.com');
        $this->get('/auth/google/callback')->assertRedirect(route('cuenta.index'));

        $this->assertSame(1, User::where('email', 'ana@gmail.com')->count(), 'no debe duplicar la cuenta');
        $this->assertSame('sub-123', $cliente->fresh()->google_id);
        $this->assertAuthenticatedAs($cliente);
    }
}
