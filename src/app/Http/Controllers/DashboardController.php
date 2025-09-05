<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use App\Models\Egreso;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $fechaInicio = request('fecha_inicio') ?? now()->toDateString();
        $fechaFin    = request('fecha_fin') ?? now()->toDateString();
        $vendedorId  = request('vendedor_id');

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
        ])
        ->when($vendedorId, fn ($q) => $q->where('user_id', $vendedorId))
        ->whereBetween('fecha', [$fechaInicio, $fechaFin])
        ->get();

        $items = collect();
        $inversionTotal = 0;
        $ganancias = [
            'celulares' => 0,
            'computadoras' => 0,
            'generales' => 0,
            'servicio_tecnico' => 0,
            'producto_apple' => 0,
        ];

        foreach ($ventas as $venta) {
            $permutaCosto = optional($venta->entregadoCelular)->precio_costo
                ?? optional($venta->entregadoComputadora)->precio_costo
                ?? optional($venta->entregadoProductoGeneral)->precio_costo
                ?? optional($venta->entregadoProductoApple)->precio_costo
                ?? 0;

            $permutaAplicada = false;

            foreach ($venta->items as $item) {
                $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora', 'producto_apple']) && !$permutaAplicada;
                $permuta = $aplicaPermuta ? $permutaCosto : 0;
                $permutaAplicada = $aplicaPermuta;

                $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;
                $inversionTotal += $item->precio_invertido;

                match ($item->tipo) {
                    'celular'          => $ganancias['celulares']       += $ganancia,
                    'computadora'      => $ganancias['computadoras']    += $ganancia,
                    'producto_general' => $ganancias['generales']       += $ganancia,
                    'producto_apple'   => $ganancias['producto_apple']  += $ganancia,
                    default            => null,
                };

                $productoNombre = match ($item->tipo) {
                    'celular'          => $item->celular?->modelo ?? 'Celular',
                    'computadora'      => $item->computadora?->nombre ?? 'Computadora',
                    'producto_general' => $item->productoGeneral?->nombre ?? 'Producto General',
                    'producto_apple'   => $item->productoApple?->modelo ?? 'Producto Apple',
                    default            => '—',
                };

                $items->push([
                    'fecha'     => $venta->fecha,
                    'producto'  => $productoNombre,
                    'tipo'      => $item->tipo,
                    'ganancia'  => $ganancia,
                    'descuento' => $item->descuento,
                    'permuta'   => $permuta,
                    'capital'   => $item->precio_invertido,
                    'subtotal'  => $item->precio_venta - $item->descuento - $permuta,
                    'vendedor'  => $venta->vendedor?->name ?? '—',
                ]);
            }

            // Servicios técnicos sin items
            if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {
                $ganancia = $venta->precio_venta - $venta->descuento - $venta->precio_invertido;
                $ganancias['servicio_tecnico'] += $ganancia;
                $inversionTotal += $venta->precio_invertido;

                $items->push([
                    'fecha'     => $venta->fecha,
                    'producto'  => 'Servicio Técnico',
                    'tipo'      => 'servicio_tecnico',
                    'ganancia'  => $ganancia,
                    'descuento' => $venta->descuento,
                    'permuta'   => 0,
                    'capital'   => $venta->precio_invertido,
                    'subtotal'  => $venta->precio_venta - $venta->descuento,
                    'vendedor'  => $venta->vendedor?->name ?? '—',
                ]);
            }
        }

        // =========================
        // 🔻 Egresos (día/mes/año)
        // =========================
        $egresosCollection = Egreso::whereBetween('created_at', [
                $fechaInicio . ' 00:00:00',
                $fechaFin    . ' 23:59:59',
            ])
            ->get(['created_at', 'precio_invertido']); // Asegúrate que el campo sea precio_invertido

        // Por día (YYYY-MM-DD)
        $egresosPorDia = $egresosCollection
            ->groupBy(fn ($e) => $e->created_at->toDateString())
            ->map(fn ($grp) => $grp->sum('precio_invertido'));

        // Por mes (YYYY-MM)
        $egresosPorMes = $egresosCollection
            ->groupBy(fn ($e) => $e->created_at->format('Y-m'))
            ->map(fn ($grp) => $grp->sum('precio_invertido'));

        // Por año (YYYY)
        $egresosPorAnio = $egresosCollection
            ->groupBy(fn ($e) => $e->created_at->format('Y'))
            ->map(fn ($grp) => $grp->sum('precio_invertido'));

        $totalEgresos = $egresosCollection->sum('precio_invertido');

        $gananciaNeta       = $items->sum('ganancia');
        $utilidadDisponible = $gananciaNeta - $totalEgresos;

        // ✅ Ventas hoy: calcula desde $items, no desde $ventas
        $ventasHoy = $items->where('fecha', today()->toDateString())->sum('subtotal');

        // Stocks
        $stockCel   = Celular::where('estado', 'disponible')->count();
        $stockComp  = Computadora::where('estado', 'disponible')->count();
        $stockGen   = ProductoGeneral::where('estado', 'disponible')->count();
        $stockApple = ProductoApple::where('estado', 'disponible')->count();
        $stockTotal = $stockCel + $stockComp + $stockGen + $stockApple;

        // Últimas 5 ventas (desde items)
        $ultimasVentas = $items->sortByDesc('fecha')->take(5)->values()->map(fn ($i) => [
            'cliente' => $i['vendedor'],
            'producto'=> $i['producto'],
            'tipo'    => $i['tipo'],
            'total'   => $i['subtotal'],
            'fecha'   => $i['fecha'],
        ]);

        // ✅ Resumen por día con egresos y utilidad disponible
        $resumenGrafico = $items->groupBy('fecha')->map(function ($itemsDelDia, $fecha) use ($egresosPorDia) {
            $egresosDia   = $egresosPorDia[$fecha] ?? 0;
            $gananciaDia  = $itemsDelDia->sum('ganancia');

            return [
                'fecha'                        => $fecha,
                'total'                        => $itemsDelDia->sum(fn ($i) => $i['ganancia'] + $i['capital'] + $i['descuento'] + $i['permuta']),
                'ganancia_productos'           => $itemsDelDia->whereIn('tipo', ['celular', 'computadora', 'producto_apple'])->sum('ganancia'),
                'ganancia_productos_generales' => $itemsDelDia->where('tipo', 'producto_general')->sum('ganancia'),
                'ganancia_servicios'           => $itemsDelDia->where('tipo', 'servicio_tecnico')->sum('ganancia'),
                'descuento'                    => $itemsDelDia->sum('descuento'),
                // 🔻 nuevos
                'egresos'                      => $egresosDia,
                'utilidad_disponible'          => $gananciaDia - $egresosDia,
            ];
        })->values();

        // =========================
        // 🔸 Distribución económica
        //    (ganancia ya post egresos)
        // =========================
        $distribucionEconomica = [
            [
                'label' => 'Inversión',
                'valor' => $items->sum('capital'),
            ],
            [
                'label' => 'Descuento',
                'valor' => $items->sum('descuento'),
            ],
            [
                'label' => 'Permuta',
                'valor' => $items->sum('permuta'),
            ],
            [
                'label' => 'Utilidad (post egresos)',
                'valor' => max($utilidadDisponible, 0),
            ],
            // Si prefieres visualizar egresos como porción separada, descomenta:
            // [
            //     'label' => 'Egresos',
            //     'valor' => $totalEgresos,
            // ],
        ];

        return Inertia::render('Admin/Dashboard', [
            'user' => Auth::user(),

            'resumen' => [
                'ventas_hoy' => $ventasHoy,
                'stock_total' => $stockTotal,
                'stock_detalle' => [
                    'celulares' => $stockCel,
                    'computadoras' => $stockComp,
                    'productos_generales' => $stockGen,
                    'productos_apple' => $stockApple,
                    'porcentaje_productos_generales' => $stockTotal > 0 ? round(($stockGen / $stockTotal) * 100, 1) : 0,
                ],
                'permutas' => $ventas->where('es_permuta', true)->count(),
                'servicios' => $ventas->where('tipo_venta', 'servicio_tecnico')->count(),
                'ganancia_neta' => $gananciaNeta,
                'egresos' => $totalEgresos,
                'utilidad_disponible' => $utilidadDisponible,
                'ventas_con_descuento' => $items->where('descuento', '>', 0)->count(),
                'ultimas_ventas' => $ultimasVentas,
                'cotizaciones' => 0,
            ],

            'resumen_total' => [
                'total_ventas' => $items->sum('subtotal'),
                'total_descuento' => $items->sum('descuento'),
                'total_costo' => $items->sum('capital'),
                'total_permuta' => $items->sum('permuta'),
                'ganancia_neta' => $gananciaNeta,
                'egresos_total' => $totalEgresos,
                'utilidad_disponible' => $utilidadDisponible,
                'ganancia_productos' => $ganancias['celulares'] + $ganancias['computadoras'] + $ganancias['producto_apple'],
                'ganancia_productos_generales' => $ganancias['generales'],
                'ganancia_servicios' => $ganancias['servicio_tecnico'],
            ],

            'distribucion_economica' => $distribucionEconomica,

            'resumen_grafico' => $resumenGrafico,

            // 🔹 Egresos agrupados para usar en tabs/filtros del front (día/mes/año)
            'egresos_agrupados' => [
                'por_dia'  => $egresosPorDia,   // ['2025-09-01' => 150, ...]
                'por_mes'  => $egresosPorMes,   // ['2025-09' => 900, ...]
                'por_anio' => $egresosPorAnio,  // ['2025' => 12345, ...]
            ],

            'vendedores' => User::where('rol', 'vendedor')->select('id', 'name')->get(),

            'filtros' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin'    => $fechaFin,
                'vendedor_id'  => $vendedorId,
            ],
        ]);
    }
}
