<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

/**
 * Crea la primera cuenta de administrador con los datos de .env: SEED_ADMIN_NAME, SEED_ADMIN_EMAIL y
 * SEED_ADMIN_PASSWORD. Las contraseñas y los correos nunca van en el código: el repositorio es público.
 *
 * - Si falta el correo o la contraseña, no crea nada y lo avisa.
 * - Si la cuenta ya existe, no la toca: volver a sembrar nunca pone una contraseña vieja.
 * - La contraseña cumple la misma regla que el resto del sistema (Password::defaults()).
 * - Los vendedores se crean desde el panel, en Usuarios y roles.
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $nombre = trim((string) env('SEED_ADMIN_NAME', '')) ?: 'Administrador';
        $correo = mb_strtolower(trim((string) env('SEED_ADMIN_EMAIL', '')));
        $clave = (string) env('SEED_ADMIN_PASSWORD', '');

        if ($correo === '' || $clave === '') {
            $this->avisar('No se creó el administrador: define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en .env '
                . '(si la configuración está en caché, corre antes php artisan config:clear).');

            return;
        }

        $validacion = Validator::make(
            ['correo' => $correo, 'password' => $clave],
            ['correo' => ['email'], 'password' => [Password::defaults()]],
        );
        if ($validacion->fails()) {
            $this->avisar('No se creó el administrador: ' . implode(' ', $validacion->errors()->all()));

            return;
        }

        if (User::query()->whereRaw('LOWER(email) = ?', [$correo])->exists()) {
            $this->avisar("La cuenta {$correo} ya existe: no se cambió su contraseña.");

            return;
        }

        $admin = new User();
        $admin->name = $nombre;
        $admin->email = $correo;
        $admin->password = Hash::make($clave);
        $admin->rol = 'admin';
        $admin->save();

        $this->command?->info("Administrador creado: {$correo}. Ya puedes borrar SEED_ADMIN_PASSWORD del .env.");
    }

    private function avisar(string $mensaje): void
    {
        $this->command?->warn($mensaje);
    }
}
