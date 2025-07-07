<?php

namespace App\Http\Controllers;

use App\Models\Egreso;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class EgresoController extends Controller
{
    public function index(Request $request)
    {
        $fechaInicio = $request->input('fecha_inicio') ?? now()->startOfMonth()->toDateString();
        $fechaFin = $request->input('fecha_fin') ?? now()->toDateString();

        $egresos = Egreso::with('user')
            ->whereBetween('created_at', [$fechaInicio . ' 00:00:00', $fechaFin . ' 23:59:59'])
            ->latest()
            ->get();

        $totalGastado = $egresos->sum('precio_invertido');

        $tipoMasFrecuente = $egresos
            ->groupBy('tipo_gasto')
            ->map->count()
            ->sortDesc()
            ->keys()
            ->first();

        return Inertia::render('Admin/Egresos/Index', [
            'egresos' => $egresos,
            'filtros' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
            ],
            'resumen' => [
                'total_gastado' => $totalGastado,
                'tipo_mas_frecuente' => $tipoMasFrecuente,
                'cantidad_egresos' => $egresos->count(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Egresos/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'concepto' => 'required|string|max:255',
            'precio_invertido' => 'required|numeric|min:0',
            'tipo_gasto' => 'required|in:servicio_basico,cuota_bancaria,gasto_personal,sueldos',
            'frecuencia' => 'nullable|string|max:50',
            'cuotas_pendientes' => 'nullable|integer|min:0',
            'comentario' => 'nullable|string|max:255',
        ]);

        $validated['user_id'] = Auth::id();

        Egreso::create($validated);

        return redirect()->route('admin.egresos.index')->with('success', 'Egreso registrado correctamente.');
    }

    public function exportarPDF(Request $request)
    {
        $fechaInicio = $request->input('fecha_inicio') ?? now()->startOfMonth()->toDateString();
        $fechaFin = $request->input('fecha_fin') ?? now()->toDateString();

        $egresos = Egreso::with('user')
            ->whereBetween('created_at', [$fechaInicio . ' 00:00:00', $fechaFin . ' 23:59:59'])
            ->latest()
            ->get();

        $totalGastado = $egresos->sum('precio_invertido');

        $pdf = Pdf::loadView('pdf.egresos', [
            'egresos' => $egresos,
            'total' => $totalGastado,
            'fechaInicio' => $fechaInicio,
            'fechaFin' => $fechaFin,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('egresos_' . now()->format('Ymd_His') . '.pdf');
    }
}
