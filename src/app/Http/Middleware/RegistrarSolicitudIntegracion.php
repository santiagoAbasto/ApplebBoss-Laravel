<?php

namespace App\Http\Middleware;

use App\Models\Integracion;
use App\Models\IntegracionSolicitud;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Anota cada llamada a la API de integración, también las rechazadas: integración, ruta, estado y duración.
 * Nunca el token, las cabeceras ni el cuerpo. Se anota al terminar, sin demorar la respuesta.
 */
class RegistrarSolicitudIntegracion
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('integracion.inicio', hrtime(true));

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        try {
            $integracion = $request->user('sanctum');
            $integracion = $integracion instanceof Integracion ? $integracion : null;
            $inicio = $request->attributes->get('integracion.inicio', hrtime(true));

            IntegracionSolicitud::create([
                'integracion_id' => $integracion?->id,
                'token_id'       => $integracion?->currentAccessToken()?->id,
                'metodo'         => $request->method(),
                'ruta'           => mb_substr('/' . ltrim($request->path(), '/'), 0, 160),
                'estado'         => $response->getStatusCode(),
                'duracion_ms'    => (int) round((hrtime(true) - $inicio) / 1e6),
                'ip'             => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            // El registro nunca tumba la API
            Log::warning('No se pudo anotar una solicitud de integración: ' . $e->getMessage());
        }
    }
}
