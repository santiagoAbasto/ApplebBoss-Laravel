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

        // Datos del día
        $ventasHoy = $ventas->where('fecha', today()->toDateString())->sum('subtotal');

        $stockTotal = Celular::where('estado', 'disponible')->count()
            + Computadora::where('estado', 'disponible')->count()
            + ProductoGeneral::where('estado', 'disponible')->count();

        $permutas = $ventas->where('es_permuta', true)->count();
        $servicios = $ventas->where('tipo_venta', 'servicio_tecnico')->count();

        $ultimasVentas = $ventas->sortByDesc('fecha')->take(5)->values()->map(fn($v) => [
            'cliente' => $v->nombre_cliente,
            'tipo_venta' => $v->tipo_venta,
            'total' => $v->subtotal,
            'fecha' => $v->fecha,
        ]);

        // Gráfico por fecha
        $resumenGrafico = $ventas->groupBy('fecha')->map(function ($ventasDelDia, $fecha) {
            return [
                'fecha' => $fecha,
                'total' => $ventasDelDia->sum('subtotal'),
                'ganancia_productos' => $ventasDelDia->where('tipo_venta', 'producto')->sum(function ($v) {
                    $costo = $v->precio_invertido + ($v->precio_costo_permuta ?? 0);
                    return $v->subtotal - $costo;
                }),
                'ganancia_servicios' => $ventasDelDia->where('tipo_venta', 'servicio_tecnico')->sum(function ($v) {
                    return $v->subtotal - $v->precio_invertido;
                }),
                'descuento' => $ventasDelDia->sum('descuento'),
            ];
        })->values();

        // Totales para torta y tarjetas
        $totalVentas = $ventas->sum('subtotal');
        $totalDescuento = $ventas->sum('descuento');

        $totalCosto = $ventas->sum(function ($v) {
            return $v->precio_invertido + ($v->precio_costo_permuta ?? 0);
        });

        $gananciaNeta = $ventas->sum(function ($v) {
            $costo = $v->precio_invertido + ($v->precio_costo_permuta ?? 0);
            return $v->subtotal - $costo;
        });

        $ventasConDescuento = $ventas->where('descuento', '>', 0)->count();

        return Inertia::render('Admin/Dashboard', [
            'user' => Auth::user(),
            'resumen' => [
                'ventas_hoy' => $ventasHoy,
                'stock_total' => $stockTotal,
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
                'ganancia_neta' => $gananciaNeta,
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
