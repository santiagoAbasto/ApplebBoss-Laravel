<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ServicioTecnico;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReporteController extends Controller
{
public function index(Request $request)
{
    $request->validate([
        'fecha_inicio' => 'nullable|date',
        'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        'vendedor_id'  => 'nullable|exists:users,id',
    ]);

    /* =====================================================
     * VENTAS (PRODUCTOS + HISTÓRICO)
     * ===================================================== */
    $ventas = Venta::with([
        'vendedor',
        'entregadoCelular',
        'entregadoComputadora',
        'entregadoProductoGeneral',
        'entregadoProductoApple',
        'items.celular',
        'items.computadora',
        'items.productoGeneral',
        'items.productoApple',
        'servicioTecnico',
    ])
        ->when($request->filled('vendedor_id'), fn ($q) =>
            $q->where('user_id', $request->vendedor_id)
        )
        ->when(
            $request->filled('fecha_inicio') && $request->filled('fecha_fin'),
            fn ($q) => $q->whereBetween('fecha', [
                $request->fecha_inicio,
                $request->fecha_fin
            ])
        )
        ->orderByDesc('fecha')
        ->get();

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES
     * ===================================================== */
    $serviciosTecnicos = ServicioTecnico::with('vendedor')
        ->when($request->filled('vendedor_id'), fn ($q) =>
            $q->where('user_id', $request->vendedor_id)
        )
        ->when(
            $request->filled('fecha_inicio') && $request->filled('fecha_fin'),
            fn ($q) => $q->whereBetween('fecha', [
                $request->fecha_inicio,
                $request->fecha_fin
            ])
        )
        ->get();

    $items = collect();

    $gananciasPorTipo = [
        'celulares'        => 0,
        'computadoras'     => 0,
        'generales'        => 0,
        'productos_apple'  => 0,
        'servicio_tecnico' => 0,
    ];

    $mapTipo = [
    'Celular'          => 'celulares',
    'Computadora'      => 'computadoras',
    'Producto General' => 'generales',
    'Producto Apple'   => 'productos_apple',
];

    $inversionTotal = 0;

    /* =====================================================
     * PROCESAR VENTAS (ITEMS)
     * ===================================================== */
    foreach ($ventas as $venta) {

        $permutaCosto =
            optional($venta->entregadoCelular)->precio_costo
            ?? optional($venta->entregadoComputadora)->precio_costo
            ?? optional($venta->entregadoProductoGeneral)->precio_costo
            ?? optional($venta->entregadoProductoApple)->precio_costo
            ?? 0;

        $permutaAplicada = false;

        foreach ($venta->items as $item) {

            $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
            $permuta = $aplicaPermuta ? $permutaCosto : 0;
            $permutaAplicada = $aplicaPermuta ?: $permutaAplicada;

            $tipoProducto = match ($item->tipo) {
                'celular'          => 'Celular',
                'computadora'      => 'Computadora',
                'producto_general' => 'Producto General',
                'producto_apple'   => 'Producto Apple',
                default            => '—',
            };

            $nombreProducto = match ($item->tipo) {
                'celular'          => $item->celular?->modelo ?? '—',
                'computadora'      => $item->computadora?->nombre ?? '—',
                'producto_general' => $item->productoGeneral?->nombre ?? '—',
                'producto_apple'   => $item->productoApple?->modelo ?? '—',
                default            => '—',
            };

            $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;

            $inversionTotal += $item->precio_invertido;

            if (isset($mapTipo[$tipoProducto])) {
                $gananciasPorTipo[$mapTipo[$tipoProducto]] += $ganancia;
            }

            $items->push([
                'fecha'     => $venta->fecha,
                'producto'  => $nombreProducto,
                'tipo'      => $tipoProducto,
                'subtotal'  => $item->subtotal,
                'ganancia'  => $ganancia,
                'descuento' => $item->descuento,
                'permuta'   => $permuta,
                'capital'   => $item->precio_invertido,
                'vendedor'  => $venta->vendedor?->name,
            ]);
        }
    }

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES
     * ===================================================== */
    foreach ($serviciosTecnicos as $servicio) {

        $ganancia = $servicio->precio_venta - $servicio->precio_costo;

        $gananciasPorTipo['servicio_tecnico'] += $ganancia;
        $inversionTotal += $servicio->precio_costo;

        $items->push([
            'fecha'     => $servicio->fecha,
            'producto'  => 'Servicio Técnico',
            'tipo'      => 'Servicio Técnico',
            'subtotal'  => $servicio->precio_venta,
            'ganancia'  => $ganancia,
            'descuento' => 0,
            'permuta'   => 0,
            'capital'   => $servicio->precio_costo,
            'vendedor'  => $servicio->vendedor?->name,
        ]);
    }

    /* =====================================================
     * RESUMEN (FUENTE ÚNICA: ITEMS)
     * ===================================================== */
    $resumen = [
        'total_ventas'       => $items->sum('subtotal'),
        'total_ganancia'     => $items->sum('ganancia'),
        'total_descuento'    => $items->sum('descuento'),
        'total_inversion'    => $inversionTotal,
        'ganancias_por_tipo' => $gananciasPorTipo,
        'ganancia_servicio'  => $gananciasPorTipo['servicio_tecnico'],
        'ganancia_liquida'   => $items
            ->where('tipo', '!=', 'Servicio Técnico')
            ->sum('ganancia'),
    ];

    $resumenGrafico = $items
        ->groupBy(fn ($i) => Carbon::parse($i['fecha'])->toDateString())
        ->map(fn ($g, $fecha) => [
            'fecha'        => $fecha,
            'total_venta'  => $g->sum('subtotal'),
            'ganancia'     => $g->sum('ganancia'),
        ])
        ->values();

    return Inertia::render('Admin/Reportes/Index', [
        'ventas'           => $items,
        'resumen'          => $resumen,
        'resumen_grafico'  => $resumenGrafico,
        'filtros'          => $request->only(['vendedor_id', 'fecha_inicio', 'fecha_fin']),
        'vendedores'       => User::where('rol', 'vendedor')->select('id', 'name')->get(),
    ]);
}


public function exportar(Request $request)
{
    $request->validate([
        'fecha_inicio' => 'nullable|date',
        'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        'vendedor_id'  => 'nullable|exists:users,id',
    ]);

    /* =====================================================
     * VENTAS (PRODUCTOS + SERVICIOS HISTÓRICOS)
     * ===================================================== */
    $ventas = Venta::with([
        'vendedor',
        'items.celular',
        'items.computadora',
        'items.productoGeneral',
        'items.productoApple',
        'entregadoCelular',
        'entregadoComputadora',
        'entregadoProductoGeneral',
        'entregadoProductoApple',
        'servicioTecnico',
    ])
        ->when($request->filled('vendedor_id'), fn ($q) =>
            $q->where('user_id', $request->vendedor_id)
        )
        ->when(
            $request->filled('fecha_inicio') && $request->filled('fecha_fin'),
            fn ($q) => $q->whereBetween('fecha', [
                $request->fecha_inicio,
                $request->fecha_fin
            ])
        )
        ->orderByDesc('fecha')
        ->get();

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES
     * ===================================================== */
    $serviciosTecnicos = ServicioTecnico::with('vendedor')
        ->when($request->filled('vendedor_id'), fn ($q) =>
            $q->where('user_id', $request->vendedor_id)
        )
        ->when(
            $request->filled('fecha_inicio') && $request->filled('fecha_fin'),
            fn ($q) => $q->whereBetween('fecha', [
                $request->fecha_inicio,
                $request->fecha_fin
            ])
        )
        ->get();

    $resultados = collect();

    /* =====================================================
     * PROCESAR VENTAS (PRODUCTOS)
     * ===================================================== */
    foreach ($ventas as $venta) {

        $permutaCosto =
            optional($venta->entregadoCelular)->precio_costo
            ?? optional($venta->entregadoComputadora)->precio_costo
            ?? optional($venta->entregadoProductoGeneral)->precio_costo
            ?? optional($venta->entregadoProductoApple)->precio_costo
            ?? 0;

        $permutaAplicada = false;

        foreach ($venta->items as $item) {

            $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
            $permuta = $aplicaPermuta ? $permutaCosto : 0;
            $permutaAplicada = $aplicaPermuta ?: $permutaAplicada;

            $tipoProducto = match ($item->tipo) {
                'celular'          => 'Celular',
                'computadora'      => 'Computadora',
                'producto_general' => 'Producto General',
                'producto_apple'   => 'Producto Apple',
                default            => '—',
            };

            $nombreProducto = match ($item->tipo) {
                'celular'          => $item->celular?->modelo ?? '—',
                'computadora'      => $item->computadora?->nombre ?? '—',
                'producto_general' => $item->productoGeneral?->nombre ?? '—',
                'producto_apple'   => $item->productoApple?->modelo ?? '—',
                default            => '—',
            };

            $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;

            $resultados->push((object)[
                'fecha'           => $venta->fecha,
                'cliente'         => $venta->nombre_cliente,
                'producto'        => $nombreProducto,
                'tipo'            => $tipoProducto,
                'cantidad'        => $item->cantidad,
                'precio_invertido'=> $item->precio_invertido,
                'precio_venta'    => $item->precio_venta,
                'descuento'       => $item->descuento,
                'permuta'         => $permuta,
                'subtotal'        => $item->subtotal,
                'ganancia'        => $ganancia,
                'vendedor'        => $venta->vendedor?->name,
            ]);
        }

        /* =====================================================
         * SERVICIOS HISTÓRICOS (VENTAS SIN ITEMS)
         * ===================================================== */
        if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {

            $ganancia = $venta->precio_venta
                - $venta->descuento
                - $venta->precio_invertido;

            $resultados->push((object)[
                'fecha'           => $venta->fecha,
                'cliente'         => $venta->nombre_cliente,
                'producto'        => 'Servicio Técnico',
                'tipo'            => 'Servicio Técnico',
                'cantidad'        => 1,
                'precio_invertido'=> $venta->precio_invertido,
                'precio_venta'    => $venta->precio_venta,
                'descuento'       => $venta->descuento,
                'permuta'         => 0,
                'subtotal'        => $venta->subtotal,
                'ganancia'        => $ganancia,
                'vendedor'        => $venta->vendedor?->name,
            ]);
        }
    }

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES (NUEVOS)
     * ===================================================== */
    foreach ($serviciosTecnicos as $servicio) {

        $ganancia = $servicio->precio_venta - $servicio->precio_costo;

        $resultados->push((object)[
            'fecha'           => $servicio->fecha,
            'cliente'         => $servicio->nombre_cliente ?? '—',
            'producto'        => 'Servicio Técnico',
            'tipo'            => 'Servicio Técnico',
            'cantidad'        => 1,
            'precio_invertido'=> $servicio->precio_costo,
            'precio_venta'    => $servicio->precio_venta,
            'descuento'       => 0,
            'permuta'         => 0,
            'subtotal'        => $servicio->precio_venta,
            'ganancia'        => $ganancia,
            'vendedor'        => $servicio->vendedor?->name,
        ]);
    }

    /* =====================================================
     * ORDEN FINAL
     * ===================================================== */
    $resultados = $resultados
        ->sortBy([
            fn ($a, $b) =>
                array_search($a->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ])
                <=>
                array_search($b->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ]),
            fn ($a, $b) => strtotime($a->fecha) <=> strtotime($b->fecha),
        ])
        ->values();

    $pdf = Pdf::loadView('pdf.reporte_ventas', [
        'ventas'       => $resultados,
        'fecha_inicio' => $request->fecha_inicio,
        'fecha_fin'    => $request->fecha_fin,
    ])->setPaper('A4', 'portrait');

    return $pdf->download('reporte_ventas.pdf');
}

public function exportDia()
{
    $hoy = Carbon::now('America/La_Paz')->toDateString();

    /* =====================================================
     * VENTAS DEL DÍA
     * ===================================================== */
    $ventas = Venta::with([
        'vendedor',
        'items.celular',
        'items.computadora',
        'items.productoGeneral',
        'items.productoApple',
        'entregadoCelular',
        'entregadoComputadora',
        'entregadoProductoGeneral',
        'entregadoProductoApple',
        'servicioTecnico',
    ])
        ->whereDate('fecha', $hoy)
        ->get();

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES DEL DÍA
     * ===================================================== */
    $serviciosTecnicos = ServicioTecnico::with('vendedor')
        ->whereDate('fecha', $hoy)
        ->get();

    $resultados = collect();

    /* =====================================================
     * PROCESAR VENTAS (PRODUCTOS)
     * ===================================================== */
    foreach ($ventas as $venta) {

        $permutaCosto =
            optional($venta->entregadoCelular)->precio_costo
            ?? optional($venta->entregadoComputadora)->precio_costo
            ?? optional($venta->entregadoProductoGeneral)->precio_costo
            ?? optional($venta->entregadoProductoApple)->precio_costo
            ?? 0;

        $permutaAplicada = false;

        foreach ($venta->items as $item) {

            $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
            $permuta = $aplicaPermuta ? $permutaCosto : 0;
            $permutaAplicada = $aplicaPermuta ?: $permutaAplicada;

            $tipoProducto = match ($item->tipo) {
                'celular'          => 'Celular',
                'computadora'      => 'Computadora',
                'producto_general' => 'Producto General',
                'producto_apple'   => 'Producto Apple',
                default            => '—',
            };

            $nombreProducto = match ($item->tipo) {
                'celular'          => $item->celular?->modelo ?? '—',
                'computadora'      => $item->computadora?->nombre ?? '—',
                'producto_general' => $item->productoGeneral?->nombre ?? '—',
                'producto_apple'   => $item->productoApple?->modelo ?? '—',
                default            => '—',
            };

            $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;

            $resultados->push((object)[
                'fecha'            => $venta->fecha,
                'cliente'          => $venta->nombre_cliente,
                'producto'         => $nombreProducto,
                'tipo'             => $tipoProducto,
                'cantidad'         => $item->cantidad,
                'precio_invertido' => $item->precio_invertido,
                'precio_venta'     => $item->precio_venta,
                'descuento'        => $item->descuento,
                'permuta'          => $permuta,
                'subtotal'         => $item->subtotal,
                'ganancia'         => $ganancia,
                'vendedor'         => $venta->vendedor?->name,
            ]);
        }

        /* =====================================================
         * SERVICIOS HISTÓRICOS (VENTAS SIN ITEMS)
         * ===================================================== */
        if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {

            $ganancia =
                $venta->precio_venta
                - $venta->descuento
                - $venta->precio_invertido;

            $resultados->push((object)[
                'fecha'            => $venta->fecha,
                'cliente'          => $venta->nombre_cliente,
                'producto'         => 'Servicio Técnico',
                'tipo'             => 'Servicio Técnico',
                'cantidad'         => 1,
                'precio_invertido' => $venta->precio_invertido,
                'precio_venta'     => $venta->precio_venta,
                'descuento'        => $venta->descuento,
                'permuta'          => 0,
                'subtotal'         => $venta->subtotal,
                'ganancia'         => $ganancia,
                'vendedor'         => $venta->vendedor?->name,
            ]);
        }
    }

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES
     * ===================================================== */
    foreach ($serviciosTecnicos as $servicio) {

        $ganancia = $servicio->precio_venta - $servicio->precio_costo;

        $resultados->push((object)[
            'fecha'            => $servicio->fecha,
            'cliente'          => $servicio->nombre_cliente ?? '—',
            'producto'         => 'Servicio Técnico',
            'tipo'             => 'Servicio Técnico',
            'cantidad'         => 1,
            'precio_invertido' => $servicio->precio_costo,
            'precio_venta'     => $servicio->precio_venta,
            'descuento'        => 0,
            'permuta'          => 0,
            'subtotal'         => $servicio->precio_venta,
            'ganancia'         => $ganancia,
            'vendedor'         => $servicio->vendedor?->name,
        ]);
    }

    /* =====================================================
     * ORDEN FINAL
     * ===================================================== */
    $resultados = $resultados
        ->sortBy([
            fn ($a, $b) =>
                array_search($a->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ])
                <=>
                array_search($b->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ]),
            fn ($a, $b) => strtotime($a->fecha) <=> strtotime($b->fecha),
        ])
        ->values();

    $pdf = Pdf::loadView('pdf.reporte_ventas', [
        'ventas'       => $resultados,
        'fecha_inicio' => $hoy,
        'fecha_fin'    => $hoy,
    ])->setPaper('A4', 'portrait');

    return $pdf->download("reporte_ventas_$hoy.pdf");
}


   public function exportSemana()
{
    $inicio = Carbon::now('America/La_Paz')->startOfWeek()->toDateString();
    $fin    = Carbon::now('America/La_Paz')->endOfWeek()->toDateString();

    /* =====================================================
     * VENTAS DE LA SEMANA
     * ===================================================== */
    $ventas = Venta::with([
        'vendedor',
        'items.celular',
        'items.computadora',
        'items.productoGeneral',
        'items.productoApple',
        'entregadoCelular',
        'entregadoComputadora',
        'entregadoProductoGeneral',
        'entregadoProductoApple',
        'servicioTecnico',
    ])
        ->whereBetween('fecha', [$inicio, $fin])
        ->get();

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES DE LA SEMANA
     * ===================================================== */
    $serviciosTecnicos = ServicioTecnico::with('vendedor')
        ->whereBetween('fecha', [$inicio, $fin])
        ->get();

    $resultados = collect();

    /* =====================================================
     * PROCESAR VENTAS (PRODUCTOS)
     * ===================================================== */
    foreach ($ventas as $venta) {

        $permutaCosto =
            optional($venta->entregadoCelular)->precio_costo
            ?? optional($venta->entregadoComputadora)->precio_costo
            ?? optional($venta->entregadoProductoGeneral)->precio_costo
            ?? optional($venta->entregadoProductoApple)->precio_costo
            ?? 0;

        $permutaAplicada = false;

        foreach ($venta->items as $item) {

            $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
            $permuta = $aplicaPermuta ? $permutaCosto : 0;
            $permutaAplicada = $aplicaPermuta ?: $permutaAplicada;

            $tipoProducto = match ($item->tipo) {
                'celular'          => 'Celular',
                'computadora'      => 'Computadora',
                'producto_general' => 'Producto General',
                'producto_apple'   => 'Producto Apple',
                default            => '—',
            };

            $nombreProducto = match ($item->tipo) {
                'celular'          => $item->celular?->modelo ?? '—',
                'computadora'      => $item->computadora?->nombre ?? '—',
                'producto_general' => $item->productoGeneral?->nombre ?? '—',
                'producto_apple'   => $item->productoApple?->modelo ?? '—',
                default            => '—',
            };

            $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;

            $resultados->push((object)[
                'fecha'            => $venta->fecha,
                'cliente'          => $venta->nombre_cliente,
                'producto'         => $nombreProducto,
                'tipo'             => $tipoProducto,
                'cantidad'         => $item->cantidad,
                'precio_invertido' => $item->precio_invertido,
                'precio_venta'     => $item->precio_venta,
                'descuento'        => $item->descuento,
                'permuta'          => $permuta,
                'subtotal'         => $item->subtotal,
                'ganancia'         => $ganancia,
                'vendedor'         => $venta->vendedor?->name,
            ]);
        }

        /* =====================================================
         * SERVICIOS HISTÓRICOS (VENTAS VACÍAS)
         * ===================================================== */
        if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {

            $ganancia =
                $venta->precio_venta
                - $venta->descuento
                - $venta->precio_invertido;

            $resultados->push((object)[
                'fecha'            => $venta->fecha,
                'cliente'          => $venta->nombre_cliente,
                'producto'         => 'Servicio Técnico',
                'tipo'             => 'Servicio Técnico',
                'cantidad'         => 1,
                'precio_invertido' => $venta->precio_invertido,
                'precio_venta'     => $venta->precio_venta,
                'descuento'        => $venta->descuento,
                'permuta'          => 0,
                'subtotal'         => $venta->subtotal,
                'ganancia'         => $ganancia,
                'vendedor'         => $venta->vendedor?->name,
            ]);
        }
    }

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES
     * ===================================================== */
    foreach ($serviciosTecnicos as $servicio) {

        $ganancia = $servicio->precio_venta - $servicio->precio_costo;

        $resultados->push((object)[
            'fecha'            => $servicio->fecha,
            'cliente'          => $servicio->nombre_cliente ?? '—',
            'producto'         => 'Servicio Técnico',
            'tipo'             => 'Servicio Técnico',
            'cantidad'         => 1,
            'precio_invertido' => $servicio->precio_costo,
            'precio_venta'     => $servicio->precio_venta,
            'descuento'        => 0,
            'permuta'          => 0,
            'subtotal'         => $servicio->precio_venta,
            'ganancia'         => $ganancia,
            'vendedor'         => $servicio->vendedor?->name,
        ]);
    }

    /* =====================================================
     * ORDEN FINAL
     * ===================================================== */
    $resultados = $resultados
        ->sortBy([
            fn ($a, $b) =>
                array_search($a->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ])
                <=>
                array_search($b->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ]),
            fn ($a, $b) => strtotime($a->fecha) <=> strtotime($b->fecha),
        ])
        ->values();

    $pdf = Pdf::loadView('pdf.reporte_ventas', [
        'ventas'       => $resultados,
        'fecha_inicio' => $inicio,
        'fecha_fin'    => $fin,
    ])->setPaper('A4', 'portrait');

    return $pdf->download("reporte_ventas_semana_$inicio-$fin.pdf");
}

public function exportMes()
{
    $inicio = Carbon::now('America/La_Paz')->startOfMonth()->toDateString();
    $fin    = Carbon::now('America/La_Paz')->endOfMonth()->toDateString();

    /* =====================================================
     * VENTAS DEL MES
     * ===================================================== */
    $ventas = Venta::with([
        'vendedor',
        'items.celular',
        'items.computadora',
        'items.productoGeneral',
        'items.productoApple',
        'entregadoCelular',
        'entregadoComputadora',
        'entregadoProductoGeneral',
        'entregadoProductoApple',
        'servicioTecnico',
    ])
        ->whereBetween('fecha', [$inicio, $fin])
        ->get();

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES DEL MES
     * ===================================================== */
    $serviciosTecnicos = ServicioTecnico::with('vendedor')
        ->whereBetween('fecha', [$inicio, $fin])
        ->get();

    $resultados = collect();

    /* =====================================================
     * PROCESAR VENTAS (PRODUCTOS)
     * ===================================================== */
    foreach ($ventas as $venta) {

        $permutaCosto =
            optional($venta->entregadoCelular)->precio_costo
            ?? optional($venta->entregadoComputadora)->precio_costo
            ?? optional($venta->entregadoProductoGeneral)->precio_costo
            ?? optional($venta->entregadoProductoApple)->precio_costo
            ?? 0;

        $permutaAplicada = false;

        foreach ($venta->items as $item) {

            $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
            $permuta = $aplicaPermuta ? $permutaCosto : 0;
            $permutaAplicada = $aplicaPermuta ?: $permutaAplicada;

            $tipoProducto = match ($item->tipo) {
                'celular'          => 'Celular',
                'computadora'      => 'Computadora',
                'producto_general' => 'Producto General',
                'producto_apple'   => 'Producto Apple',
                default            => '—',
            };

            $nombreProducto = match ($item->tipo) {
                'celular'          => $item->celular?->modelo ?? '—',
                'computadora'      => $item->computadora?->nombre ?? '—',
                'producto_general' => $item->productoGeneral?->nombre ?? '—',
                'producto_apple'   => $item->productoApple?->modelo ?? '—',
                default            => '—',
            };

            $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;

            $resultados->push((object)[
                'fecha'            => $venta->fecha,
                'cliente'          => $venta->nombre_cliente,
                'producto'         => $nombreProducto,
                'tipo'             => $tipoProducto,
                'cantidad'         => $item->cantidad,
                'precio_invertido' => $item->precio_invertido,
                'precio_venta'     => $item->precio_venta,
                'descuento'        => $item->descuento,
                'permuta'          => $permuta,
                'subtotal'         => $item->subtotal,
                'ganancia'         => $ganancia,
                'vendedor'         => $venta->vendedor?->name,
            ]);
        }

        /* =====================================================
         * SERVICIOS HISTÓRICOS (VENTAS VACÍAS)
         * ===================================================== */
        if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {

            $ganancia =
                $venta->precio_venta
                - $venta->descuento
                - $venta->precio_invertido;

            $resultados->push((object)[
                'fecha'            => $venta->fecha,
                'cliente'          => $venta->nombre_cliente,
                'producto'         => 'Servicio Técnico',
                'tipo'             => 'Servicio Técnico',
                'cantidad'         => 1,
                'precio_invertido' => $venta->precio_invertido,
                'precio_venta'     => $venta->precio_venta,
                'descuento'        => $venta->descuento,
                'permuta'          => 0,
                'subtotal'         => $venta->subtotal,
                'ganancia'         => $ganancia,
                'vendedor'         => $venta->vendedor?->name,
            ]);
        }
    }

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES
     * ===================================================== */
    foreach ($serviciosTecnicos as $servicio) {

        $ganancia = $servicio->precio_venta - $servicio->precio_costo;

        $resultados->push((object)[
            'fecha'            => $servicio->fecha,
            'cliente'          => $servicio->nombre_cliente ?? '—',
            'producto'         => 'Servicio Técnico',
            'tipo'             => 'Servicio Técnico',
            'cantidad'         => 1,
            'precio_invertido' => $servicio->precio_costo,
            'precio_venta'     => $servicio->precio_venta,
            'descuento'        => 0,
            'permuta'          => 0,
            'subtotal'         => $servicio->precio_venta,
            'ganancia'         => $ganancia,
            'vendedor'         => $servicio->vendedor?->name,
        ]);
    }

    /* =====================================================
     * ORDEN FINAL
     * ===================================================== */
    $resultados = $resultados
        ->sortBy([
            fn ($a, $b) =>
                array_search($a->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ])
                <=>
                array_search($b->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ]),
            fn ($a, $b) => strtotime($a->fecha) <=> strtotime($b->fecha),
        ])
        ->values();

    $pdf = Pdf::loadView('pdf.reporte_ventas', [
        'ventas'       => $resultados,
        'fecha_inicio' => $inicio,
        'fecha_fin'    => $fin,
    ])->setPaper('A4', 'portrait');

    return $pdf->download("reporte_ventas_mes_$inicio-$fin.pdf");
}


public function exportAnio()
{
    $inicio = Carbon::now('America/La_Paz')->startOfYear()->toDateString();
    $fin    = Carbon::now('America/La_Paz')->endOfYear()->toDateString();

    /* =====================================================
     * VENTAS DEL AÑO
     * ===================================================== */
    $ventas = Venta::with([
        'vendedor',
        'items.celular',
        'items.computadora',
        'items.productoGeneral',
        'items.productoApple',
        'entregadoCelular',
        'entregadoComputadora',
        'entregadoProductoGeneral',
        'entregadoProductoApple',
        'servicioTecnico',
    ])
        ->whereBetween('fecha', [$inicio, $fin])
        ->get();

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES DEL AÑO
     * ===================================================== */
    $serviciosTecnicos = ServicioTecnico::with('vendedor')
        ->whereBetween('fecha', [$inicio, $fin])
        ->get();

    $resultados = collect();

    /* =====================================================
     * PROCESAR VENTAS (PRODUCTOS)
     * ===================================================== */
    foreach ($ventas as $venta) {

        $permutaCosto =
            optional($venta->entregadoCelular)->precio_costo
            ?? optional($venta->entregadoComputadora)->precio_costo
            ?? optional($venta->entregadoProductoGeneral)->precio_costo
            ?? optional($venta->entregadoProductoApple)->precio_costo
            ?? 0;

        $permutaAplicada = false;

        foreach ($venta->items as $item) {

            $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
            $permuta = $aplicaPermuta ? $permutaCosto : 0;
            $permutaAplicada = $aplicaPermuta ?: $permutaAplicada;

            $tipoProducto = match ($item->tipo) {
                'celular'          => 'Celular',
                'computadora'      => 'Computadora',
                'producto_general' => 'Producto General',
                'producto_apple'   => 'Producto Apple',
                default            => '—',
            };

            $nombreProducto = match ($item->tipo) {
                'celular'          => $item->celular?->modelo ?? '—',
                'computadora'      => $item->computadora?->nombre ?? '—',
                'producto_general' => $item->productoGeneral?->nombre ?? '—',
                'producto_apple'   => $item->productoApple?->modelo ?? '—',
                default            => '—',
            };

            $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;

            $resultados->push((object)[
                'fecha'            => $venta->fecha,
                'cliente'          => $venta->nombre_cliente,
                'producto'         => $nombreProducto,
                'tipo'             => $tipoProducto,
                'cantidad'         => $item->cantidad,
                'precio_invertido' => $item->precio_invertido,
                'precio_venta'     => $item->precio_venta,
                'descuento'        => $item->descuento,
                'permuta'          => $permuta,
                'subtotal'         => $item->subtotal,
                'ganancia'         => $ganancia,
                'vendedor'         => $venta->vendedor?->name,
            ]);
        }

        /* =====================================================
         * SERVICIOS HISTÓRICOS (VENTAS VACÍAS)
         * ===================================================== */
        if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {

            $ganancia =
                $venta->precio_venta
                - $venta->descuento
                - $venta->precio_invertido;

            $resultados->push((object)[
                'fecha'            => $venta->fecha,
                'cliente'          => $venta->nombre_cliente,
                'producto'         => 'Servicio Técnico',
                'tipo'             => 'Servicio Técnico',
                'cantidad'         => 1,
                'precio_invertido' => $venta->precio_invertido,
                'precio_venta'     => $venta->precio_venta,
                'descuento'        => $venta->descuento,
                'permuta'          => 0,
                'subtotal'         => $venta->subtotal,
                'ganancia'         => $ganancia,
                'vendedor'         => $venta->vendedor?->name,
            ]);
        }
    }

    /* =====================================================
     * SERVICIOS TÉCNICOS REALES
     * ===================================================== */
    foreach ($serviciosTecnicos as $servicio) {

        $ganancia = $servicio->precio_venta - $servicio->precio_costo;

        $resultados->push((object)[
            'fecha'            => $servicio->fecha,
            'cliente'          => $servicio->nombre_cliente ?? '—',
            'producto'         => 'Servicio Técnico',
            'tipo'             => 'Servicio Técnico',
            'cantidad'         => 1,
            'precio_invertido' => $servicio->precio_costo,
            'precio_venta'     => $servicio->precio_venta,
            'descuento'        => 0,
            'permuta'          => 0,
            'subtotal'         => $servicio->precio_venta,
            'ganancia'         => $ganancia,
            'vendedor'         => $servicio->vendedor?->name,
        ]);
    }

    /* =====================================================
     * ORDEN FINAL
     * ===================================================== */
    $resultados = $resultados
        ->sortBy([
            fn ($a, $b) =>
                array_search($a->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ])
                <=>
                array_search($b->tipo, [
                    'Celular',
                    'Computadora',
                    'Producto General',
                    'Producto Apple',
                    'Servicio Técnico'
                ]),
            fn ($a, $b) => strtotime($a->fecha) <=> strtotime($b->fecha),
        ])
        ->values();

    $pdf = Pdf::loadView('pdf.reporte_ventas', [
        'ventas'       => $resultados,
        'fecha_inicio' => $inicio,
        'fecha_fin'    => $fin,
    ])->setPaper('A4', 'portrait');

    return $pdf->download("reporte_ventas_anio_$inicio-$fin.pdf");
}


}
