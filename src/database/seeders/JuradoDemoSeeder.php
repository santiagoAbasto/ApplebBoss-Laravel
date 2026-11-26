<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Crea/actualiza las 12 cuentas de demostración del jurado (6 admin + 6 vendedor),
 * todas de SOLO LECTURA (demo=true). Idempotente: se puede correr varias veces.
 */
class JuradoDemoSeeder extends Seeder
{
    public function run(): void
    {
        $plano = config('jurado.password');
        if (empty($plano)) {
            $this->command?->error('Definí JURADO_PASS en .env antes de correr JuradoDemoSeeder.');
            return;
        }
        $password = Hash::make($plano);

        for ($n = 1; $n <= 6; $n++) {
            foreach (['admin', 'vendedor'] as $rol) {
                $email = "jurado{$n}.{$rol}@appleboss.com.bo";

                $user = User::firstOrNew(['email' => $email]);
                $user->name = "Jurado {$n} · " . ($rol === 'admin' ? 'Administrador' : 'Vendedor');
                $user->password = $password;
                $user->email_verified_at = now();
                $user->demo = true;
                $user->save();

                // 'rol' no es fillable a propósito: se asigna directo.
                $user->rol = $rol;
                $user->save();
            }
        }
    }
}
