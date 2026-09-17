<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * La primera cuenta de administrador sale de .env: el código no tiene contraseñas ni correos (el repositorio es
 * público) y volver a sembrar nunca cambia la contraseña de una cuenta que ya existe.
 */
class UserSeederTest extends TestCase
{
    use RefreshDatabase;

    private const VARIABLES = ['SEED_ADMIN_NAME', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'];

    protected function tearDown(): void
    {
        foreach (self::VARIABLES as $variable) {
            unset($_ENV[$variable], $_SERVER[$variable]);
            putenv($variable);
        }
        parent::tearDown();
    }

    private function entorno(array $valores): void
    {
        foreach ($valores as $variable => $valor) {
            $_ENV[$variable] = $_SERVER[$variable] = $valor;
            putenv("{$variable}={$valor}");
        }
    }

    public function test_el_seeder_no_tiene_contrasenas_ni_correos_escritos(): void
    {
        $codigo = file_get_contents(database_path('seeders/UserSeeder.php'));

        $this->assertDoesNotMatchRegularExpression('/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/', $codigo);
        $this->assertDoesNotMatchRegularExpression("/Hash::make\\(\\s*['\"]/", $codigo);
    }

    public function test_sin_datos_en_env_no_crea_ninguna_cuenta(): void
    {
        $this->seed(UserSeeder::class);

        $this->assertSame(0, User::count());
    }

    public function test_crea_el_administrador_con_los_datos_de_env(): void
    {
        $this->entorno(['SEED_ADMIN_EMAIL' => 'Dueno@Tienda.test', 'SEED_ADMIN_PASSWORD' => 'Clave-Segura-2026']);

        $this->seed(UserSeeder::class);

        $admin = User::sole();
        $this->assertSame('dueno@tienda.test', $admin->email);
        $this->assertSame('Administrador', $admin->name);
        $this->assertSame('admin', $admin->rol);
        $this->assertTrue(Hash::check('Clave-Segura-2026', $admin->password));
    }

    public function test_no_cambia_la_contrasena_de_una_cuenta_que_ya_existe(): void
    {
        $existente = User::factory()->create([
            'email' => 'dueno@tienda.test', 'rol' => 'admin', 'password' => Hash::make('La-Nueva-2026'),
        ]);
        $this->entorno(['SEED_ADMIN_EMAIL' => 'dueno@tienda.test', 'SEED_ADMIN_PASSWORD' => 'Clave-Vieja-2025']);

        $this->seed(UserSeeder::class);

        $this->assertSame(1, User::count());
        $this->assertTrue(Hash::check('La-Nueva-2026', $existente->fresh()->password));
    }

    public function test_no_acepta_una_contrasena_debil(): void
    {
        $this->entorno(['SEED_ADMIN_EMAIL' => 'dueno@tienda.test', 'SEED_ADMIN_PASSWORD' => 'admin123']);

        $this->seed(UserSeeder::class);

        $this->assertSame(0, User::count());
    }
}
