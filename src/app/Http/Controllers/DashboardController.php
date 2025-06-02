<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $fechaInicio = request('fecha_inicio') ?? now()->toDateString();
        $fechaFin = request('fecha_fin') ?? now()->toDateString();
        $vendedorId = request('vendedor_id');

        $ventas = Venta::with([
            'vendedor',
            'items.celular',
            'items.computadora',
            'items.productoGeneral',
            'entregadoCelular',
            'entregadoComputadora',
            'entregadoProductoGeneral',
        ])
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
        ];

        foreach ($ventas as $venta) {
            $permutaCosto = optional($venta->entregadoCelular)->precio_costo
                ?? optional($venta->entregadoComputadora)->precio_costo
                ?? optional($venta->entregadoProductoGeneral)->precio_costo ?? 0;

            $permutaAplicada = false;

            foreach ($venta->items as $item) {
                $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
                $permuta = $aplicaPermuta ? $permutaCosto : 0;
                $permutaAplicada = $aplicaPermuta;

                $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;
                $inversionTotal += $item->precio_invertido;

                match ($item->tipo) {
                    'celular' => $ganancias['celulares'] += $ganancia,
                    'computadora' => $ganancias['computadoras'] += $ganancia,
                    'producto_general' => $ganancias['generales'] += $ganancia,
                    default => null,
                };

                $productoNombre = match ($item->tipo) {
                    'celular' => $item->celular?->modelo ?? 'Celular',
                    'computadora' => $item->computadora?->nombre ?? 'Computadora',
                    'producto_general' => $item->productoGeneral?->nombre ?? 'Producto General',
                    default => '—',
                };
                

                $items->push([
                    'fecha' => $venta->fecha,
                    'producto' => $productoNombre,
                    'tipo' => $item->tipo,
                    'ganancia' => $ganancia,
                    'descuento' => $item->descuento,
                    'permuta' => $permuta,
                    'capital' => $item->precio_invertido,
                    'subtotal' => $item->precio_venta - $item->descuento - $permuta,
                    'vendedor' => $venta->vendedor?->name ?? '—',
                ]);
            }

            if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {
                $ganancia = $venta->precio_venta - $venta->descuento - $venta->precio_invertido;
                $ganancias['servicio_tecnico'] += $ganancia;
                $inversionTotal += $venta->precio_invertido;

                $items->push([
                    'fecha' => $venta->fecha,
                    'producto' => 'Servicio Técnico',
                    'tipo' => 'servicio_tecnico',
                    'ganancia' => $ganancia,
                    'descuento' => $venta->descuento,
                    'permuta' => 0,
                    'capital' => $venta->precio_invertido,
                    // ✅ Línea corregida:
                    'subtotal' => $venta->precio_venta - $venta->descuento,
                    'vendedor' => $venta->vendedor?->name ?? '—',
                ]);
            }
        }

        $ultimasVentas = $items->sortByDesc('fecha')->take(5)->values()->map(fn($i) => [
            'cliente' => $i['vendedor'],
            'producto' => $i['producto'],
            'tipo' => $i['tipo'],
            'total' => $i['subtotal'],
            'fecha' => $i['fecha'],
        ]);

        $ventasHoy = $ventas->where('fecha', today()->toDateString())->sum('subtotal');
        $stockCel = Celular::where('estado', 'disponible')->count();
        $stockComp = Computadora::where('estado', 'disponible')->count();
        $stockGen = ProductoGeneral::where('estado', 'disponible')->count();
        $stockTotal = $stockCel + $stockComp + $stockGen;

        $resumenGrafico = $items->groupBy('fecha')->map(function ($itemsDelDia, $fecha) {
            return [
                'fecha' => $fecha,
                'total' => $itemsDelDia->sum(fn($i) => $i['ganancia'] + $i['capital'] + $i['descuento'] + $i['permuta']),
                'ganancia_productos' => $itemsDelDia->whereIn('tipo', ['celular', 'computadora'])->sum('ganancia'),
                'ganancia_productos_generales' => $itemsDelDia->where('tipo', 'producto_general')->sum('ganancia'),
                'ganancia_servicios' => $itemsDelDia->where('tipo', 'servicio_tecnico')->sum('ganancia'),
                'descuento' => $itemsDelDia->sum('descuento'),
            ];
        })->values();

        return Inertia::render('Admin/Dashboard', [
            'user' => Auth::user(),
            'resumen' => [
                'ventas_hoy' => $ventasHoy,
                'stock_total' => $stockTotal,
                'stock_detalle' => [
                    'celulares' => $stockCel,
                    'computadoras' => $stockComp,
                    'productos_generales' => $stockGen,
                    'porcentaje_productos_generales' => $stockTotal > 0 ? round(($stockGen / $stockTotal) * 100, 1) : 0,
                ],
                'permutas' => $ventas->where('es_permuta', true)->count(),
                'servicios' => $ventas->where('tipo_venta', 'servicio_tecnico')->count(),
                'ganancia_neta' => $items->sum('ganancia'),
                'ventas_con_descuento' => $items->where('descuento', '>', 0)->count(),
                'ultimas_ventas' => $ultimasVentas,
                'cotizaciones' => 0,
            ],
            'resumen_total' => [
                'total_ventas' => $items->sum('subtotal'),
                'total_descuento' => $items->sum('descuento'),
                'total_costo' => $items->sum('capital'),
                'total_permuta' => $items->sum('permuta'),
                'ganancia_neta' => $items->sum('ganancia'),
                'ganancia_productos' => $ganancias['celulares'] + $ganancias['computadoras'],
                'ganancia_productos_generales' => $ganancias['generales'],
                'ganancia_servicios' => $ganancias['servicio_tecnico'],
            ],
            'resumen_grafico' => $resumenGrafico,
            'vendedores' => User::where('rol', 'vendedor')->select('id', 'name')->get(),
            'filtros' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
                'vendedor_id' => $vendedorId,
            ],
        ]);
    }
}
