<?php

namespace App\Http\Middleware;

use App\Models\Integracion;
use App\Support\Integracion\ErrorApi;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** La ruta pide un permiso de la integración (Sistema → Integraciones API). Sin él: 403 insufficient_scope. */
class IntegracionScope
{
    public function handle(Request $request, Closure $next, string ...$scopes): Response
    {
        $integracion = $request->user();

        if (! $integracion instanceof Integracion || ! $integracion->activa) {
            return ErrorApi::respuesta(401, 'unauthenticated', 'Falta un token de integración válido.');
        }

        foreach ($scopes as $scope) {
            if (! $integracion->tieneScope($scope)) {
                return ErrorApi::respuesta(403, 'insufficient_scope', "Este token no tiene el permiso {$scope}.", ['required_scope' => $scope]);
            }
        }

        return $next($request);
    }
}
