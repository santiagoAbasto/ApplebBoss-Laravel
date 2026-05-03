<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AutomationTokenMiddleware
{
    /**
     * Protege las rutas de automatización (n8n → Laravel).
     *
     * Validaciones:
     *  - El token se lee del header X-AUTOMATION-TOKEN.
     *  - Se compara con hash_equals para evitar timing attacks.
     *  - Si el token está vacío en config → se rechaza (falla segura).
     *  - Se añaden cabeceras anti-caché para que la respuesta 401 no quede cacheada.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token    = (string) $request->header('X-AUTOMATION-TOKEN', '');
        $expected = (string) config('automation.token', '');

        // Falla segura: si no hay token configurado → siempre rechaza
        if ($expected === '' || $token === '' || ! hash_equals($expected, $token)) {
            return response()->json([
                'message' => 'Unauthorized automation request.',
            ], 401)->withHeaders([
                'Cache-Control' => 'no-store',
                'Pragma'        => 'no-cache',
            ]);
        }

        return $next($request);
    }
}
