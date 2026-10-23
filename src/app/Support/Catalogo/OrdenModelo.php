<?php

namespace App\Support\Catalogo;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Orden de los celulares «como Apple»: primero el modelo más nuevo y, dentro del mismo modelo, el de más capacidad.
 * Se arma solo con el nombre del producto (que ya trae el modelo y la capacidad), así sirve igual en el catálogo y
 * en los hubs. Solo se usa en las categorías de celulares (iPhone y Android); «Todo el catálogo» no se toca.
 */
final class OrdenModelo
{
    /**
     * Modelos nuevos SIN número de generación (plegables, ediciones) que van por encima de los numerados.
     * Mayor número = más nuevo. Al salir un modelo así, se agrega aquí. El iPhone DUO es hoy lo más nuevo.
     */
    private const MODELOS_NUEVOS = [
        'duo' => 1000,
    ];

    /** Ordena una colección de productos ya serializados (de mayor a menor según la clave). */
    public static function aplicar(Collection $productos): Collection
    {
        return $productos->sortByDesc(fn (array $p) => self::clave($p))->values();
    }

    /** Clave numérica: recencia del modelo (10M) · línea Pro Max/Pro/Plus (100k) · capacidad en GB. Mayor = primero. */
    public static function clave(array $p): int
    {
        $n = Str::lower((string) ($p['name'] ?? ''));

        // Recencia: un modelo nuevo sin número (DUO…) va arriba; si no, el número de generación del nombre (18, 17…).
        $recencia = 0;
        foreach (self::MODELOS_NUEVOS as $clave => $score) {
            if (str_contains($n, $clave)) {
                $recencia = $score;
                break;
            }
        }
        if ($recencia === 0) {
            $sinCapacidad = (string) preg_replace('/\b[\d.]+\s*(tb|gb)\b/i', ' ', $n);
            $recencia = preg_match('/(\d{1,3})/', $sinCapacidad, $m) ? (int) $m[1] : 0;
        }

        // Línea del modelo: Pro Max > Pro > Plus/Air/Ultra > base
        $linea = match (true) {
            str_contains($n, 'pro max') => 4,
            str_contains($n, 'pro')     => 3,
            str_contains($n, 'plus') || str_contains($n, 'air') || str_contains($n, 'ultra') => 2,
            default                     => 1,
        };

        // Capacidad en GB (1 TB = 1024 GB)
        $cap = 0;
        if (preg_match('/([\d.]+)\s*(tb|gb)/i', $n, $m)) {
            $cap = (int) round(strtolower($m[2]) === 'tb' ? (float) $m[1] * 1024 : (float) $m[1]);
        }

        return $recencia * 10_000_000 + $linea * 100_000 + $cap;
    }
}
