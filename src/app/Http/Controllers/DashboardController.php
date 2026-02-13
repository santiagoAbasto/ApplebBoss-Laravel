<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\ServicioTecnico;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use App\Models\Egreso;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $fechaInicio = request('fecha_inicio');
        $fechaFin    = request('fecha_fin');

        $periodo = request('periodo', 'mes');

        if (!$fechaInicio || !$fechaFin) {

            switch ($periodo) {

                case 'dia':
                    $fechaInicio = now()->startOfDay()->toDateString();
                    $fechaFin    = now()->endOfDay()->toDateString();
                    break;

                case 'anio':
                    $fechaInicio = now()->startOfYear()->toDateString();
                    $fechaFin    = now()->endOfYear()->toDateString();
                    break;

                case 'mes':
                default:
                    $fechaInicio = now()->startOfMonth()->toDateString();
                    $fechaFin    = now()->endOfMonth()->toDateString();
                    break;
            }
        }

        $vendedorId  = request('vendedor_id');

        /* =========================
         * VENTAS (SIN TOCAR)
         * ========================= */
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
            ->when($vendedorId, fn($q) => $q->where('user_id', $vendedorId))
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->get();

        /* =========================
         * SERVICIOS TÉCNICOS REALES
         * ========================= */
        $serviciosTecnicos = ServicioTecnico::with('vendedor')
            ->when($vendedorId, fn($q) => $q->where('user_id', $vendedorId))
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

        /* =========================
         * PROCESAR VENTAS (IGUAL QUE ANTES)
         * ========================= */
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
                    'fecha'        => $venta->fecha,
                    'producto'     => $productoNombre,
                    'tipo'         => $item->tipo,

                    'precio_bruto' => $item->precio_venta, // ✅ FALTABA
                    'descuento'    => $item->descuento,
                    'permuta'      => $permuta,

                    'ganancia'     => $ganancia,
                    'capital'      => $item->precio_invertido,
                    'subtotal'     => $item->precio_venta - $item->descuento - $permuta,

                    'vendedor'     => $venta->vendedor?->name ?? '—',
                ]);
            }

            // ⛔ LÓGICA ANTIGUA SE MANTIENE (DATOS HISTÓRICOS)
            if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {
                $ganancia = $venta->precio_venta - $venta->descuento - $venta->precio_invertido;
                $ganancias['servicio_tecnico'] += $ganancia;
                $inversionTotal += $venta->precio_invertido;

                $items->push([
                    'fecha'        => $venta->fecha,
                    'producto'     => $productoNombre,
                    'tipo'         => $item->tipo,

                    'precio_bruto' => $item->precio_venta, // ✅ NUEVO
                    'descuento'    => $item->descuento,
                    'permuta'      => $permuta,

                    'ganancia'     => $ganancia,
                    'capital'      => $item->precio_invertido,

                    // neto (lo que entra a caja)
                    'subtotal'     => $item->precio_venta - $item->descuento - $permuta,

                    'vendedor'     => $venta->vendedor?->name ?? '—',
                ]);
            }
        }

        /* =========================
         * 🔧 NUEVO: SERVICIOS TÉCNICOS REALES
         * ========================= */
        foreach ($serviciosTecnicos as $servicio) {
            $ganancia = $servicio->precio_venta - $servicio->precio_costo;
            $ganancias['servicio_tecnico'] += $ganancia;
            $inversionTotal += $servicio->precio_costo;

            $items->push([
                'fecha'        => $servicio->fecha,
                'producto'     => 'Servicio Técnico',
                'tipo'         => 'servicio_tecnico',

                'precio_bruto' => $servicio->precio_venta, // ✅ NUEVO
                'descuento'    => 0,
                'permuta'      => 0,

                'ganancia'     => $ganancia,
                'capital'      => $servicio->precio_costo,
                'subtotal'     => $servicio->precio_venta,

                'vendedor'     => $servicio->vendedor?->name ?? '—',
            ]);
        }

        // =========================
        // 🔻 EGRESOS (día/mes/año)  ✅ ANTES DEL HISTÓRICO
        // =========================
        $egresosCollection = Egreso::whereBetween('created_at', [
            $fechaInicio . ' 00:00:00',
            $fechaFin    . ' 23:59:59',
        ])->get(['created_at', 'precio_invertido']);

        // Por día (YYYY-MM-DD)
        $egresosPorDia = $egresosCollection
            ->groupBy(fn($e) => $e->created_at->toDateString())
            ->map(fn($grp) => $grp->sum('precio_invertido'));

        // Por mes (YYYY-MM)
        $egresosPorMes = $egresosCollection
            ->groupBy(fn($e) => $e->created_at->format('Y-m'))
            ->map(fn($grp) => $grp->sum('precio_invertido'));

        // Por año (YYYY)
        $egresosPorAnio = $egresosCollection
            ->groupBy(fn($e) => $e->created_at->format('Y'))
            ->map(fn($grp) => $grp->sum('precio_invertido'));

        $totalEgresos = $egresosCollection->sum('precio_invertido');

        /* =====================================================
 * 📈 HISTÓRICO PARA SVG (DÍA / MES / AÑO) ✅ POST-EGRESOS
 * - Inversión = costo + permuta (SOLO productos)
 * - Permuta entra UNA SOLA VEZ (ya viene controlada en $items)
 * - Servicio técnico NO entra en inversión
 * ===================================================== */

        $tiposConInversion = ['celular', 'computadora', 'producto_apple', 'producto_general'];

        /* ======================
 * 📅 DÍA (por movimiento)
 * ====================== */
        $historicoDia = $items
            ->sortBy('fecha')
            ->values()
            ->map(function ($i) use ($egresosPorDia, $tiposConInversion) {

                $fecha = Carbon::parse($i['fecha'])->toDateString();
                $egresoDia = $egresosPorDia[$fecha] ?? 0;

                // ✅ INVERSIÓN REAL: costo + permuta (si aplica)
                $capitalReal = in_array($i['tipo'], $tiposConInversion)
                    ? ($i['capital'] + $i['permuta'])
                    : 0;

                return [
                    'fecha'    => Carbon::parse($i['fecha'])->toDateTimeString(),
                    'total'    => $i['subtotal'],
                    'capital'  => $capitalReal,                 // ← AQUÍ entra la permuta
                    'utilidad' => $i['ganancia'] - $egresoDia,
                ];
            });

        /* ======================
 * 📆 MES (agrupado por día)
 * ====================== */
        $historicoMes = $items
            ->groupBy(fn($i) => Carbon::parse($i['fecha'])->toDateString())
            ->map(function ($grp, $fecha) use ($egresosPorDia, $tiposConInversion) {

                $gananciaDia = $grp->sum('ganancia');
                $egresoDia   = $egresosPorDia[$fecha] ?? 0;

                // ✅ SUMA costo + permuta (permuta ya viene 1 sola vez)
                $capitalDia = $grp
                    ->whereIn('tipo', $tiposConInversion)
                    ->sum(fn($i) => $i['capital'] + $i['permuta']);

                return [
                    'fecha'    => $fecha,
                    'total'    => $grp->sum('subtotal'),
                    'capital'  => $capitalDia,                   // ← incluye los Bs 200
                    'utilidad' => $gananciaDia - $egresoDia,
                ];
            })
            ->values();

        /* ======================
 * 📈 AÑO (agrupado por mes)
 * ====================== */
        $historicoAnio = $items
            ->groupBy(fn($i) => Carbon::parse($i['fecha'])->format('Y-m'))
            ->map(function ($grp, $ym) use ($egresosPorMes, $tiposConInversion) {

                $gananciaMes = $grp->sum('ganancia');
                $egresoMes   = $egresosPorMes[$ym] ?? 0;

                // ✅ costo + permuta (una sola vez)
                $capitalMes = $grp
                    ->whereIn('tipo', $tiposConInversion)
                    ->sum(fn($i) => $i['capital'] + $i['permuta']);

                return [
                    'fecha'    => $ym . '-01',
                    'total'    => $grp->sum('subtotal'),
                    'capital'  => $capitalMes,                   // ← ya cuadra
                    'utilidad' => $gananciaMes - $egresoMes,
                ];
            })
            ->values();

        $gananciaNeta       = $items->sum('ganancia');
        $utilidadDisponible = $gananciaNeta - $totalEgresos;


        // ✅ Ventas hoy: calcula desde $items, no desde $ventas
        $ventasHoy = $items
            ->filter(fn($i) => Carbon::parse($i['fecha'])->isToday())
            ->sum('precio_bruto'); // ✅


        // Stocks
        $stockCel   = Celular::where('estado', 'disponible')->count();
        $stockComp  = Computadora::where('estado', 'disponible')->count();
        $stockGen   = ProductoGeneral::where('estado', 'disponible')->count();
        $stockApple = ProductoApple::where('estado', 'disponible')->count();
        $stockTotal = $stockCel + $stockComp + $stockGen + $stockApple;

        // Últimas 5 ventas (desde items)
        $ultimasVentas = $items->sortByDesc('fecha')->take(5)->values()->map(fn($i) => [
            'cliente' => $i['vendedor'],
            'producto' => $i['producto'],
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
                'total'                        => $itemsDelDia->sum(fn($i) => $i['ganancia'] + $i['capital'] + $i['descuento'] + $i['permuta']),
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
        // 💰 Utilidad REAL por Categoría
        // =========================

        $distribucionEconomica = [
            [
                'label' => 'Celulares',
                'valor' => round($ganancias['celulares'], 2),
            ],
            [
                'label' => 'Computadoras',
                'valor' => round($ganancias['computadoras'], 2),
            ],
            [
                'label' => 'Productos Generales',
                'valor' => round($ganancias['generales'], 2),
            ],
            [
                'label' => 'Productos Apple',
                'valor' => round($ganancias['producto_apple'], 2),
            ],
            [
                'label' => 'Servicios Técnicos',
                'valor' => round($ganancias['servicio_tecnico'], 2),
            ],
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
                'servicios' =>
                $ventas->where('tipo_venta', 'servicio_tecnico')->count()
                    + $serviciosTecnicos->count(),
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
                'total_inversion' => $items->sum('capital') + $items->sum('permuta'),
                'ganancia_neta' => $gananciaNeta,
                'egresos_total' => $totalEgresos,
                'utilidad_disponible' => $utilidadDisponible,
                'ganancia_productos' => $ganancias['celulares'] + $ganancias['computadoras'] + $ganancias['producto_apple'],
                'ganancia_productos_generales' => $ganancias['generales'],
                'ganancia_servicios' => $ganancias['servicio_tecnico'],
            ],

            'distribucion_economica' => $distribucionEconomica,

            'resumen_grafico' => $resumenGrafico,
            'historico' => [
                'dia'  => $historicoDia,
                'mes'  => $historicoMes,
                'anio' => $historicoAnio,
            ],

            'periodo_actual' => $periodo,


            // 🔹 Egresos agrupados para usar en tabs/filtros del front (día/mes/año)
            'egresos_agrupados' => [
                'por_dia'  => $egresosPorDia,
                'por_mes'  => $egresosPorMes,
                'por_anio' => $egresosPorAnio,
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
