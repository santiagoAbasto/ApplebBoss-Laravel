<?php

namespace App\Support\Proveedor;

use App\Support\Pagos\TipoDeCambio;

/**
 * Une lo que se leyó de un archivo de proveedor con su lista actual: para cada producto leído, si ya existe en el
 * catálogo conserva su nombre lindo y sus colores (solo cambia el precio); si es nuevo, lo deja tal cual y lo marca.
 * Arma la lista final (lo que se publicaría) y las filas de la vista previa, con el margen y el precio en Bs al paralelo.
 */
final class Cotejo
{
    /**
     * @param  list<array>  $leidos  items de LectorLista
     * @param  list<array>  $actuales  items del .json vigente del proveedor (o [])
     * @return array{items: list<array>, filas: list<array>, resumen: array}
     */
    public static function preparar(array $leidos, array $actuales): array
    {
        $porClave = [];
        foreach ($actuales as $it) {
            $k = MapaModelo::clave((string) $it['tipo'], (string) $it['modelo'], (string) ($it['capacidad'] ?? ''), $it['sim'] ?? null);
            $porClave[$k][] = $it;
        }

        $tasa = TipoDeCambio::bobPorUsdt();
        $items = [];
        $filas = [];
        $nuevos = 0;

        foreach ($leidos as $p) {
            $k = MapaModelo::clave((string) $p['tipo'], (string) $p['modelo'], (string) ($p['capacidad'] ?? ''), $p['sim'] ?? null);
            $prev = $porClave[$k] ?? [];
            $esNuevo = $prev === [];

            // Si ya existe, se conserva su nombre de catálogo (más prolijo, sobre todo en Mac) y sus colores si la lista no los trae.
            $modelo = $prev[0]['modelo'] ?? $p['modelo'];
            $colores = $p['colores'] ?: collect($prev)->flatMap(fn ($e) => $e['colores'] ?? [])->unique()->values()->all();

            $item = ['tipo' => $p['tipo'], 'modelo' => $modelo, 'capacidad' => (string) ($p['capacidad'] ?? ''), 'colores' => array_values($colores), 'usd' => (float) $p['usd']];
            if ($p['tipo'] === 'celular' && ! empty($p['sim'])) {
                $item['sim'] = $p['sim'];   // el SIM solo aplica a celulares
            }
            $items[] = $item;

            $margen = MargenProveedor::enUsd((string) $p['tipo'], $modelo);
            $filas[] = [
                'tipo'       => $p['tipo'],
                'modelo'     => $modelo,
                'capacidad'  => (string) ($p['capacidad'] ?? ''),
                'sim'        => $p['sim'] ?? null,
                'colores'    => array_values($colores),
                'costo_usd'  => (float) $p['usd'],
                'margen_usd' => $margen,
                'venta_usd'  => (float) $p['usd'] + $margen,
                'precio_bs'  => round(((float) $p['usd'] + $margen) * $tasa, 2),
                'nuevo'      => $esNuevo,
            ];
            $nuevos += $esNuevo ? 1 : 0;
        }

        return [
            'items'   => $items,
            'filas'   => $filas,
            'resumen' => [
                'total'       => count($filas),
                'nuevos'      => $nuevos,
                'actualizados' => count($filas) - $nuevos,
                'tasa'        => $tasa,
            ],
        ];
    }
}
