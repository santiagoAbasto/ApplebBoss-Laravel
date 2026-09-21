<?php

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

/**
 * Entrar con Google — solo para quien compra.
 *
 * Al staff NO se le deja entrar por acá, y no es un capricho: el control de horario del
 * vendedor (App\Support\HorarioLaboral) vive en el login por contraseña. Si Google abriera
 * el panel, un vendedor entraría a cualquier hora saltándose ese control.
 *
 * Google confirma que la persona es dueña del correo, así que la cuenta que se crea nace
 * con el correo ya verificado. Aun así se comprueba `email_verified`: Google puede devolver
 * correos sin verificar en algunos dominios.
 */
class GoogleLoginController extends Controller
{
    public static function configurado(): bool
    {
        return filled(config('services.google.client_id')) && filled(config('services.google.client_secret'));
    }

    public function redirigir(): RedirectResponse
    {
        abort_unless(self::configurado(), 404);

        // Sin `stateless`: Socialite usa el state de la sesión, que es lo que evita el CSRF
        return Socialite::driver('google')->redirect();
    }

    public function volver(Request $request): RedirectResponse
    {
        abort_unless(self::configurado(), 404);

        try {
            $google = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            Log::warning('Falló el regreso de Google: ' . $e->getMessage());

            return redirect()->route('login')->withErrors([
                'email' => 'No pudimos completar el ingreso con Google. Intenta de nuevo.',
            ]);
        }

        $correo = Str::lower((string) $google->getEmail());
        $verificado = (bool) ($google->user['email_verified'] ?? false);

        if (blank($correo) || ! $verificado) {
            return redirect()->route('login')->withErrors([
                'email' => 'Tu cuenta de Google no tiene un correo verificado.',
            ]);
        }

        $existente = User::where('google_id', $google->getId())
            ->orWhere('email', $correo)
            ->first();

        // Una cuenta del equipo no entra por Google: tiene que usar su contraseña,
        // que es donde se revisa el horario y el rol.
        if ($existente && ! $existente->esCliente()) {
            return redirect()->route('login')->withErrors([
                'email' => 'Esa cuenta es del equipo de Apple Boss. Ingresa con tu correo y contraseña.',
            ]);
        }

        $user = $existente ?: new User();

        if (! $existente) {
            $user->name  = strip_tags(trim((string) $google->getName())) ?: 'Cliente';
            $user->email = $correo;
            // Nunca va a usarse para entrar, pero la columna no admite null
            $user->password = Hash::make(Str::random(48));
            $user->rol = 'cliente';
        }

        $user->google_id = $google->getId();
        $user->email_verified_at ??= now();   // Google ya confirmó que el correo es suyo
        $user->save();

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->intended(route('cuenta.index'));
    }
}
