<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Tienda\GoogleLoginController;
use App\Models\Resena;
use App\Support\ResenasDeGoogle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

/**
 * Tienda online → Reseñas → Google: la cuenta dueña del perfil autoriza una sola vez y desde ahí las reseñas llegan
 * solas cada día. Usa el mismo cliente OAuth de «Entrar con Google», con otra dirección de regreso.
 */
class ResenaGoogleController extends Controller
{
    public function conectar(): RedirectResponse
    {
        abort_unless(GoogleLoginController::configurado(), 404);

        // offline + consent: sin eso Google no entrega el refresh token para las importaciones diarias
        return $this->google()
            ->scopes([ResenasDeGoogle::SCOPE])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->redirect();
    }

    public function volver(): RedirectResponse
    {
        abort_unless(GoogleLoginController::configurado(), 404);
        $volver = redirect()->route('admin.resenas.index');

        try {
            $google = $this->google()->user();
        } catch (\Throwable $e) {
            Log::warning('Falló la conexión de reseñas de Google: ' . $e->getMessage());

            return $volver->with('error', 'No se pudo conectar con Google. Intenta de nuevo.');
        }

        if (blank($google->refreshToken) || ! in_array(ResenasDeGoogle::SCOPE, (array) ($google->approvedScopes ?? [ResenasDeGoogle::SCOPE]), true)) {
            return $volver->with('error', 'Google no dio permiso para leer las reseñas. Al conectar, marca la casilla de Google Business Profile.');
        }

        ResenasDeGoogle::conectar($google->refreshToken, $google->getEmail());

        return $this->traer($volver, 'Google quedó conectado. ');
    }

    public function sincronizar(): RedirectResponse
    {
        return $this->traer(back());
    }

    /** Publica de una vez todas las de Google que esperan aprobación. */
    public function publicarTodas(): RedirectResponse
    {
        $n = Resena::whereNotNull('google_id')->where('publicada', false)->update(['publicada' => true]);

        return back()->with('success', $n === 1 ? 'Se publicó 1 reseña de Google.' : "Se publicaron {$n} reseñas de Google.");
    }

    public function desconectar(): RedirectResponse
    {
        ResenasDeGoogle::desconectar();

        return back()->with('success', 'Google quedó desconectado. Las reseñas que ya se trajeron siguen acá.');
    }

    private function traer(RedirectResponse $volver, string $antes = ''): RedirectResponse
    {
        try {
            $n = ResenasDeGoogle::importar();
        } catch (\Throwable $e) {
            Log::warning('Falló la importación de reseñas de Google: ' . $e->getMessage());

            return $volver->with('error', $antes . 'No se pudieron traer las reseñas: ' . mb_substr($e->getMessage(), 0, 200));
        }

        $nuevas = $n['nuevas'] === 1 ? '1 reseña nueva' : "{$n['nuevas']} reseñas nuevas";

        return $volver->with('success', $antes . "Llegaron {$nuevas} de Google" . ($n['nuevas'] ? ', esperando tu aprobación.' : '.'));
    }

    private function google()
    {
        return Socialite::driver('google')->redirectUrl(route('admin.resenas.google.volver'));
    }
}
