<?php

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use App\Models\Venta;
use App\Models\ServicioTecnico;
use App\Models\Egreso;
use Carbon\Carbon;

class TopProductsController extends Controller
{
    public function __invoke()
    {
        $startCurrent = now()->startOfMonth();
        $endCurrent   = now();

        $startPrevious = now()->subMonth()->startOfMonth();
        $endPrevious   = now()->subMonth()->endOfMonth();

        /*
        |--------------------------------------------------------------------------
        | 1️⃣ VENTAS COMPLETAS (MISMA LÓGICA DASHBOARD)
        |--------------------------------------------------------------------------
        */
        $ventas = Venta::with([
            'items',
            'entregadoCelular',
            'entregadoComputadora',
            'entregadoProductoGeneral',
            'entregadoProductoApple',
        ])
        ->whereBetween('fecha', [$startCurrent, $endCurrent])
        ->get();

        $serviciosTecnicos = ServicioTecnico::whereBetween('fecha', [$startCurrent, $endCurrent])->get();

        $items = collect();

        /*
        |--------------------------------------------------------------------------
        | 2️⃣ PROCESAR VENTAS (CON PERMUTA CORRECTA)
        |--------------------------------------------------------------------------
        */
        foreach ($ventas as $venta) {

            $permutaCosto =
                optional($venta->entregadoCelular)->precio_costo ??
                optional($venta->entregadoComputadora)->precio_costo ??
                optional($venta->entregadoProductoGeneral)->precio_costo ??
                optional($venta->entregadoProductoApple)->precio_costo ??
                0;

            $permutaAplicada = false;

            foreach ($venta->items as $item) {

                $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora', 'producto_apple']) && !$permutaAplicada;
                $permuta = $aplicaPermuta ? $permutaCosto : 0;
                $permutaAplicada = $aplicaPermuta;

                $subtotal = $item->precio_venta - $item->descuento - $permuta;
                $ganancia = $subtotal - $item->precio_invertido;

                $items->push([
                    'categoria' => $item->tipo,
                    'nombre'    => $item->nombre_producto ?? 'Producto',
                    'subtotal'  => (float) $subtotal,
                    'capital'   => (float) $item->precio_invertido,
                    'permuta'   => (float) $permuta,
                    'ganancia'  => (float) $ganancia,
                ]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 3️⃣ SERVICIOS TÉCNICOS REALES
        |--------------------------------------------------------------------------
        */
        foreach ($serviciosTecnicos as $servicio) {

            $subtotal = $servicio->precio_venta;
            $ganancia = $servicio->precio_venta - $servicio->precio_costo;

            $items->push([
                'categoria' => 'servicio_tecnico',
                'nombre'    => 'Servicio Técnico',
                'subtotal'  => (float) $subtotal,
                'capital'   => (float) $servicio->precio_costo,
                'permuta'   => 0,
                'ganancia'  => (float) $ganancia,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | 4️⃣ TOTALES FINANCIEROS
        |--------------------------------------------------------------------------
        */
        $facturacionTotal = $items->sum('subtotal');
        $capitalTotal     = $items->sum('capital');
        $permutaTotal     = $items->sum('permuta');
        $inversionTotal   = $capitalTotal + $permutaTotal;
        $utilidadBruta    = $items->sum('ganancia');

        /*
        |--------------------------------------------------------------------------
        | 5️⃣ EGRESOS DEL PERÍODO
        |--------------------------------------------------------------------------
        */
        $egresosTotal = Egreso::whereBetween('created_at', [
            $startCurrent->startOfDay(),
            $endCurrent->endOfDay()
        ])->sum('precio_invertido');

        $utilidadDisponible = $utilidadBruta - $egresosTotal;

        /*
        |--------------------------------------------------------------------------
        | 6️⃣ RESUMEN POR CATEGORÍA
        |--------------------------------------------------------------------------
        */
        $resumenCategorias = $items
            ->groupBy('categoria')
            ->map(function ($group, $categoria) {

                $ingresos = $group->sum('subtotal');
                $utilidad = $group->sum('ganancia');

                return [
                    'categoria' => $categoria,
                    'ingresos'  => round($ingresos, 2),
                    'utilidad'  => round($utilidad, 2),
                    'margen_pct'=> $ingresos > 0
                        ? round(($utilidad / $ingresos) * 100, 2)
                        : 0,
                ];
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | 7️⃣ CATEGORÍA MÁS RENTABLE
        |--------------------------------------------------------------------------
        */
        $categoriaTop = $resumenCategorias
            ->sortByDesc('utilidad')
            ->first();

        /*
        |--------------------------------------------------------------------------
        | 8️⃣ CRECIMIENTO MENSUAL REAL
        |--------------------------------------------------------------------------
        */
        $previousVentas = Venta::whereBetween('fecha', [$startPrevious, $endPrevious])->get();
        $previousServicios = ServicioTecnico::whereBetween('fecha', [$startPrevious, $endPrevious])->get();

        $previousTotalVentas = $previousVentas->sum(function ($venta) {
            return $venta->items->sum('precio_venta');
        });

        $previousTotalServicios = $previousServicios->sum('precio_venta');

        $previousTotal = $previousTotalVentas + $previousTotalServicios;

        $growth = $previousTotal > 0
            ? round((($facturacionTotal - $previousTotal) / $previousTotal) * 100, 2)
            : null;

        /*
        |--------------------------------------------------------------------------
        | RESPUESTA FINAL COMPLETA
        |--------------------------------------------------------------------------
        */
        return response()->json([
            'periodo'                    => now()->format('Y-m'),

            // Totales
            'facturacion_total'          => round($facturacionTotal, 2),
            'capital_total'              => round($capitalTotal, 2),
            'permuta_total'              => round($permutaTotal, 2),
            'inversion_total'            => round($inversionTotal, 2),

            // Utilidades
            'utilidad_bruta'             => round($utilidadBruta, 2),
            'egresos_total'              => round($egresosTotal, 2),
            'utilidad_disponible'        => round($utilidadDisponible, 2),

            // Márgenes
            'margen_global_pct'          => $facturacionTotal > 0
                ? round(($utilidadBruta / $facturacionTotal) * 100, 2)
                : 0,

            'crecimiento_mensual_pct'    => $growth,

            // Categorías
            'categoria_mas_rentable'     => $categoriaTop,
            'resumen_categorias'         => $resumenCategorias,
        ]);
    }
}