<?php

namespace App\Support\FichaTecnica\Concerns;

use Illuminate\Support\Arr;

/**
 * Revisión común de una ficha contra su esquema: que no falte ningún campo, tipos, rangos, valores permitidos, claves
 * desconocidas y pendientes bien documentados. La clase define CAMPOS, PENDIENTES_PERMITIDOS, RANGOS y VALORES.
 *
 * Tipos: string, int, float, bool, list (no vacía), false (= «no tiene») y null (= el fabricante no lo publica o espera
 * su fuente en `pendientes`).
 */
trait RevisaEsquema
{
    /**
     * @return array{0: list<string>, 1: list<string>} [errores, campos pendientes]
     */
    protected static function revisarCampos(array $modelo): array
    {
        $datos = $modelo['datos'] ?? null;
        if (! is_array($datos)) {
            return [['No tiene datos estructurados.'], []];
        }

        [$declarados, $errores] = self::revisarPendientes($modelo['pendientes'] ?? [], $datos);
        $pendientes = [];

        foreach (static::CAMPOS as $ruta => $tipo) {
            if (! Arr::has($datos, $ruta)) {
                $errores[] = "Falta {$ruta}.";
                continue;
            }

            $valor = Arr::get($datos, $ruta);
            if ($valor === null && in_array($ruta, $declarados, true)) {
                $pendientes[] = $ruta;
                continue;
            }
            if (! self::cumple($valor, $tipo)) {
                $errores[] = "{$ruta} debe ser {$tipo}.";
                continue;
            }
            if (isset(static::RANGOS[$ruta]) && is_numeric($valor)) {
                [$min, $max] = static::RANGOS[$ruta];
                if ($valor < $min || $valor > $max) {
                    $errores[] = "{$ruta} = {$valor} está fuera de rango ({$min}–{$max}).";
                }
            }
            if (isset(static::VALORES[$ruta]) && ! in_array($valor, static::VALORES[$ruta], true)) {
                $errores[] = "{$ruta} debe ser " . implode(' o ', array_map(fn ($v) => var_export($v, true), static::VALORES[$ruta])) . '.';
            }
        }

        foreach (array_keys(Arr::dot($datos)) as $ruta) {
            $base = preg_replace('/\.\d+$/', '', $ruta);
            if (! isset(static::CAMPOS[$base])) {
                $errores[] = "Clave desconocida: {$base}.";
            }
        }

        return [$errores, $pendientes];
    }

    /**
     * @return array{0: list<string>, 1: list<string>} [campos que faltan, errores]
     */
    private static function revisarPendientes(mixed $items, array $datos): array
    {
        if (! is_array($items) || ! array_is_list($items)) {
            return [[], ['pendientes debe ser una lista.']];
        }

        $faltan = [];
        $errores = [];
        $vistos = [];
        foreach ($items as $i => $item) {
            $campo = is_array($item) ? ($item['campo'] ?? null) : null;
            if (! is_string($campo) || ! isset(static::CAMPOS[$campo])) {
                $errores[] = 'Pendiente ' . ($i + 1) . ': el campo ' . (is_string($campo) ? "«{$campo}» " : '') . 'no existe en el esquema.';
                continue;
            }
            if (isset($vistos[$campo])) {
                $errores[] = "{$campo} figura dos veces en pendientes.";
            }
            $vistos[$campo] = true;

            foreach (['detalle', 'fuente'] as $clave) {
                if (! is_string($item[$clave] ?? null) || trim($item[$clave]) === '') {
                    $errores[] = "{$campo}: el pendiente necesita {$clave}.";
                }
            }
            if (array_diff(array_keys($item), ['campo', 'tipo', 'detalle', 'fuente'])) {
                $errores[] = "{$campo}: el pendiente solo lleva campo, tipo, detalle y fuente.";
            }

            $valor = Arr::get($datos, $campo);
            match ($item['tipo'] ?? null) {
                'falta' => ! in_array($campo, static::PENDIENTES_PERMITIDOS, true)
                    ? $errores[] = "{$campo} no puede quedar pendiente."
                    : ($valor !== null
                        ? $errores[] = "{$campo} figura como pendiente pero ya tiene valor: quítalo de la lista o márcalo para verificar."
                        : $faltan[] = $campo),
                'verificar' => $valor === null ? $errores[] = "{$campo} está por verificar pero no tiene valor: márcalo como falta." : null,
                default => $errores[] = "{$campo}: el tipo de pendiente debe ser falta o verificar.",
            };
        }

        return [$faltan, $errores];
    }

    private static function cumple(mixed $valor, string $tipo): bool
    {
        foreach (explode('|', $tipo) as $t) {
            $ok = match ($t) {
                'string' => is_string($valor) && trim($valor) !== '',
                'int'    => is_int($valor),
                'float'  => is_int($valor) || is_float($valor),
                'bool'   => is_bool($valor),
                'list'   => is_array($valor) && $valor !== [] && array_is_list($valor),
                'false'  => $valor === false,
                'null'   => $valor === null,
                default  => false,
            };
            if ($ok) {
                return true;
            }
        }

        return false;
    }
}
