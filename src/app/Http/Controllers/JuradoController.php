<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Acceso de demostración para el jurado de la defensa.
 *
 * Cada jurado escanea su QR -> /jurado/{n}/{token} y elige rol (admin / vendedor);
 * el sistema lo loguea automáticamente en una cuenta de SOLO LECTURA. La tienda
 * (vista de cliente) es pública y se abre directo.
 */
class JuradoController extends Controller
{
    private function verificar(int $n, string $token): void
    {
        abort_unless(config('jurado.habilitado', true), 404);
        $esperado = config("jurado.tokens.$n");
        abort_unless(is_string($esperado) && hash_equals($esperado, $token), 404);
    }

    /** Página con los 3 accesos (admin / vendedor / tienda). */
    public function landing(int $n, string $token)
    {
        $this->verificar($n, $token);

        return response()
            ->view('jurado', ['n' => $n, 'token' => $token])
            ->header('X-Robots-Tag', 'noindex, nofollow');
    }

    /** Autologin en la cuenta demo del rol elegido y entrada al panel. */
    public function entrar(int $n, string $token, string $rol)
    {
        $this->verificar($n, $token);
        abort_unless(in_array($rol, ['admin', 'vendedor'], true), 404);

        $user = User::where('email', "jurado{$n}.{$rol}@appleboss.com.bo")
            ->where('demo', true)
            ->first();

        abort_unless($user !== null, 404);

        Auth::login($user);
        request()->session()->regenerate();

        $texto = $rol === 'admin' ? 'Administrador' : 'Vendedor';

        return redirect()->route('dashboard')->with(
            'success',
            "Modo demostración (solo lectura) · Jurado {$n} como {$texto}. Para cambiar de rol, volvé a escanear tu QR."
        );
    }
}
