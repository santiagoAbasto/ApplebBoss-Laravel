<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ReporteController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'vendedor_id' => 'nullable|exists:users,id',
        ]);

        $query = Venta::with([
            'vendedor',
            'celular',
            'computadora',
            'productoGeneral'
        ])->orderByDesc('fecha');

        if ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->input('vendedor_id'));
        }

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [
                $request->input('fecha_inicio'),
                $request->input('fecha_fin')
            ]);
        }

        $ventas = $query->get();

        $ventasProductos = $ventas->whereIn('tipo_venta', ['producto', 'celular', 'computadora', 'producto_general']);
        $ventasServicios = $ventas->where('tipo_venta', 'servicio_tecnico');

        $resumen = [
            'total_ventas'       => $ventas->sum('subtotal'),
            'total_ganancia'     => $ventas->sum('ganancia_neta'),
            'cantidad_total'     => $ventas->sum('cantidad'),
            'ventas_servicio'    => $ventasServicios->sum('subtotal'),
            'ganancia_servicio'  => $ventasServicios->sum('ganancia_neta'),
            'ganancia_liquida'   => $ventasProductos->sum('ganancia_neta'),
            'total_descuento'    => $ventas->sum('descuento'),
            'totales_por_tipo'   => $ventas->groupBy('tipo_venta')->map(fn($g) => $g->sum('subtotal')),
        ];

        $resumenGrafico = Venta::selectRaw('DATE(fecha) as fecha')
            ->selectRaw('SUM(subtotal) as total_venta')
            ->selectRaw('SUM(ganancia_neta) as ganancia')
            ->when($request->filled('vendedor_id'), fn($q) => $q->where('user_id', $request->vendedor_id))
            ->when($request->filled('fecha_inicio') && $request->filled('fecha_fin'), fn($q) => $q->whereBetween('fecha', [
                $request->fecha_inicio, $request->fecha_fin
            ]))
            ->groupByRaw('DATE(fecha)')
            ->orderBy('fecha')
            ->get();

        return Inertia::render('Admin/Reportes/Index', [
            'ventas' => $ventas,
            'resumen' => $resumen,
            'resumen_grafico' => $resumenGrafico,
            'filtros' => $request->only(['vendedor_id', 'fecha_inicio', 'fecha_fin']),
        ]);
    }

    public function exportar(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'vendedor_id' => 'nullable|exists:users,id',
        ]);

        $query = Venta::with([
            'vendedor',
            'celular',
            'computadora',
            'productoGeneral'
        ])->orderByDesc('fecha');

        if ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->input('vendedor_id'));
        }

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [
                $request->input('fecha_inicio'),
                $request->input('fecha_fin')
            ]);
        }

        $ventas = $query->get();

        $pdf = Pdf::loadView('pdf.reporte_ventas', [
            'ventas' => $ventas,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_fin' => $request->fecha_fin,
        ]);

        return $pdf->download('reporte_ventas.pdf');
    }
}
