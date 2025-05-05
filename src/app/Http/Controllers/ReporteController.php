<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReporteController extends Controller
{
    public function index(Request $request)
    {
        // ✅ Validación de filtros
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'vendedor_id' => 'nullable|exists:users,id',
        ]);

        // 📊 Consulta base
        $query = Venta::with('vendedor')->orderByDesc('fecha');

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

        // 📈 Resumen
        $resumen = [
            'total_ventas' => $ventas->sum('precio_venta'),
            'total_ganancia' => $ventas->sum('ganancia'),
            'cantidad_total' => $ventas->sum('cantidad'),
        ];

        return Inertia::render('Admin/Reportes/Index', [
            'ventas' => $ventas,
            'resumen' => $resumen,
            'filtros' => $request->only(['vendedor_id', 'fecha_inicio', 'fecha_fin']),
        ]);
    }
}
