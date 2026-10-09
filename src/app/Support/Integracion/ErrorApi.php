<?php

namespace App\Support\Integracion;

use Illuminate\Http\JsonResponse;

/**
 * Todos los errores de la API de integración tienen la misma forma:
 * {"error": {"code": "not_found", "message": "...", "details": {...}}}
 */
class ErrorApi
{
    public static function respuesta(int $estado, string $codigo, string $mensaje, ?array $detalles = null, array $cabeceras = []): JsonResponse
    {
        return response()->json(['error' => array_filter([
            'code'    => $codigo,
            'message' => $mensaje,
            'details' => $detalles,
        ], fn ($v) => $v !== null)], $estado, $cabeceras);
    }
}
