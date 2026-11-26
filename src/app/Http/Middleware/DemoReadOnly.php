<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Modo demostración (solo lectura) para el acceso del jurado.
 *
 * Una cuenta con demo=true puede NAVEGAR y abrir cualquier formulario, pero no
 * puede guardar nada: cualquier método que escriba (POST/PUT/PATCH/DELETE) se
 * bloquea y se devuelve al usuario con un aviso. Así el jurado explora el sistema
 * real sin tocar la base de datos. No afecta a las cuentas normales.
 */
class DemoReadOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ($user->demo ?? false) && ! $request->isMethodSafe()) {
            // Dejar cerrar sesión (para cambiar de rol) y la selección del jurado.
            if ($request->routeIs('logout')) {
                return $next($request);
            }

            $aviso = 'Modo demostración (solo lectura): los formularios se pueden explorar, pero los cambios no se guardan.';

            // Llamadas XHR/axios que esperan JSON (p. ej. el botón de análisis con IA):
            // responder JSON para que el front no quede en blanco.
            if (($request->wantsJson() || $request->expectsJson()) && ! $request->header('X-Inertia')) {
                return response()->json(['message' => $aviso, 'demo' => true], 422);
            }

            // Inertia (formularios del panel): volver atrás con el aviso (toast).
            if ($request->header('X-Inertia')) {
                return back(303)->with('error', $aviso);
            }

            return back()->with('error', $aviso);
        }

        return $next($request);
    }
}
