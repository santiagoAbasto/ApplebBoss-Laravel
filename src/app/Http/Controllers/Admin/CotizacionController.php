<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cotizacion;
use App\Models\User;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class CotizacionController extends Controller
{
    public function index()
    {
        $cotizaciones = Cotizacion::with('usuario')->latest()->get()->map(function ($c) {
            $c->total = (float) $c->total;
            return $c;
        });

        return Inertia::render('Admin/Cotizaciones/Index', [
            'cotizaciones' => $cotizaciones
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Cotizaciones/Create', [
            'fechaHoy' => now()->toDateString(),
            'celulares' => Celular::where('estado', 'disponible')->get(),
            'computadoras' => Computadora::where('estado', 'disponible')->get(),
            'productosGenerales' => ProductoGeneral::where('estado', 'disponible')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre_cliente' => 'required|string|max:255',
            'telefono_cliente' => 'nullable|string|max:50',
            'correo_cliente' => 'nullable|email|max:255',
            'items' => 'required|array|min:1',
            'fecha_cotizacion' => 'required|date',
            'descuento' => 'nullable|numeric|min:0',
        ]);
    
        $items = collect($request->items)->map(function ($item) {
            $base = floatval($item['precio']);
            $iva = $base * 0.13;
            $it = $base * 0.03;
    
            return [
                'nombre' => $item['nombre'],
                'cantidad' => intval($item['cantidad']),
                'precio_base' => $base,
                'precio_sin_factura' => $base,
                'precio_con_factura' => round($base + $iva + $it, 2),
            ];
        });
    
        // Cálculo de totales
        $subtotalSinFactura = $items->sum(fn($item) => $item['precio_sin_factura'] * $item['cantidad']);
        $subtotalConFactura = $items->sum(fn($item) => $item['precio_con_factura'] * $item['cantidad']);
        $descuento = floatval($request->descuento ?? 0);
    
        $totalSinFactura = max(0, $subtotalSinFactura - $descuento);
        $totalConFactura = max(0, $subtotalConFactura - $descuento); // el que se guarda como 'total'
    
        Cotizacion::create([
            'nombre_cliente' => $request->nombre_cliente,
            'telefono_cliente' => $request->telefono_cliente,
            'correo_cliente' => $request->correo_cliente,
            'fecha_cotizacion' => $request->fecha_cotizacion,
            'notas_adicionales' => $request->notas_adicionales,
            'user_id' => Auth::id(),
            'items' => $items,
            'descuento' => $descuento,
            'total' => $totalConFactura, // se guarda el total con factura menos descuento
        ]);
    
        return redirect()->route('admin.cotizaciones.index')->with('success', 'Cotización registrada correctamente.');
    }
    
    public function exportarPDF($id)
{
    $cotizacion = Cotizacion::findOrFail($id);

    $pdf = Pdf::loadView('pdf.cotizacion', [
        'cotizacion' => $cotizacion
    ])->setPaper('letter');

    return $pdf->download('Cotizacion_' . $cotizacion->id . '.pdf');
}

}
