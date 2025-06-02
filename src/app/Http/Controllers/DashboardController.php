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

        $ventas = Venta::when($vendedorId, fn($q) => $q->where('user_id', $vendedorId))
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->get();

        $ventasHoy = $ventas->where('fecha', today()->toDateString())->sum('subtotal');

        $celularesDisponibles = Celular::where('estado', 'disponible')->count();
        $computadorasDisponibles = Computadora::where('estado', 'disponible')->count();
        $productosGeneralesDisponibles = ProductoGeneral::where('estado', 'disponible')->count();

        $stockTotal = $celularesDisponibles + $computadorasDisponibles + $productosGeneralesDisponibles;

        $permutas = $ventas->where('es_permuta', true)->count();
        $servicios = $ventas->where('tipo_venta', 'servicio_tecnico')->count();

        $ultimasVentas = $ventas->sortByDesc('fecha')->take(5)->values()->map(fn($v) => [
            'cliente' => $v->nombre_cliente,
            'tipo_venta' => $v->tipo_venta,
            'total' => $v->subtotal,
            'fecha' => $v->fecha,
        ]);

        $resumenGrafico = $ventas->groupBy('fecha')->map(function ($ventasDelDia, $fecha) {
            return [
                'fecha' => $fecha,
                'total' => $ventasDelDia->sum('subtotal'),
                'ganancia_productos' => $ventasDelDia->whereIn('tipo_venta', ['producto'])->sum(function ($v) {
                    $costo = $v->precio_invertido + ($v->precio_costo_permuta ?? 0);
                    return $v->subtotal - $costo;
                }),
                'ganancia_productos_generales' => $ventasDelDia->whereNotNull('producto_general_id')->sum(function ($v) {
                    $costo = $v->precio_invertido + ($v->precio_costo_permuta ?? 0);
                    return $v->subtotal - $costo;
                }),
                'ganancia_servicios' => $ventasDelDia->where('tipo_venta', 'servicio_tecnico')->sum(function ($v) {
                    return $v->subtotal - $v->precio_invertido;
                }),
                'descuento' => $ventasDelDia->sum('descuento'),
            ];
        })->values();

        $totalVentas = $ventas->sum('subtotal');
        $totalDescuento = $ventas->sum('descuento');
        $totalCosto = $ventas->sum('precio_invertido');
        $totalPermuta = $ventas->sum('precio_costo_permuta');
        $gananciaNeta = $totalVentas - ($totalCosto + $totalPermuta);
        $ventasConDescuento = $ventas->where('descuento', '>', 0)->count();

        return Inertia::render('Admin/Dashboard', [
            'user' => Auth::user(),
            'resumen' => [
                'ventas_hoy' => $ventasHoy,
                'stock_total' => $stockTotal,
                'stock_detalle' => [
                    'celulares' => $celularesDisponibles,
                    'computadoras' => $computadorasDisponibles,
                    'productos_generales' => $productosGeneralesDisponibles,
                    'porcentaje_productos_generales' => $stockTotal > 0
                        ? round(($productosGeneralesDisponibles / $stockTotal) * 100, 1)
                        : 0,
                ],
                'permutas' => $permutas,
                'servicios' => $servicios,
                'ganancia_neta' => $gananciaNeta,
                'ventas_con_descuento' => $ventasConDescuento,
                'ultimas_ventas' => $ultimasVentas,
                'cotizaciones' => 0,
            ],
            'resumen_grafico' => $resumenGrafico,
            'resumen_total' => [
                'total_ventas' => $totalVentas,
                'total_descuento' => $totalDescuento,
                'total_costo' => $totalCosto,
                'total_permuta' => $totalPermuta,
                'ganancia_neta' => $gananciaNeta,
                'ganancia_productos' => $ventas->whereIn('tipo_venta', ['producto'])->sum(function ($v) {
                    $costo = $v->precio_invertido + ($v->precio_costo_permuta ?? 0);
                    return $v->subtotal - $costo;
                }),
                'ganancia_productos_generales' => $ventas->whereNotNull('producto_general_id')->sum(function ($v) {
                    $costo = $v->precio_invertido + ($v->precio_costo_permuta ?? 0);
                    return $v->subtotal - $costo;
                }),
            ],
            'vendedores' => User::where('rol', 'vendedor')->select('id', 'name')->get(),
            'filtros' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
                'vendedor_id' => $vendedorId,
            ],
        ]);
    }
}
