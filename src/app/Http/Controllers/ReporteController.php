<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
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
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'vendedor_id' => 'nullable|exists:users,id',
        ]);
    
        $query = Venta::with([
            'vendedor',
            'celular',
            'computadora',
            'productoGeneral',
            'entregadoCelular',
            'entregadoComputadora',
            'entregadoProductoGeneral',
            'items'
        ])->orderByDesc('fecha');
    
        if ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }
    
        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }
    
        $ventas = $query->get();
        $items = collect();
    
        foreach ($ventas as $venta) {
            // Procesar ventas con ítems (productos o servicios)
            foreach ($venta->items as $item) {
                $permutaCosto =
                    optional($venta->entregadoCelular)->precio_costo ??
                    optional($venta->entregadoComputadora)->precio_costo ??
                    optional($venta->entregadoProductoGeneral)->precio_costo ?? 0;
    
                $tipoProducto = match ($item->tipo) {
                    'celular' => 'Celular',
                    'computadora' => 'Computadora',
                    'producto_general' => 'Producto General',
                    default => ($venta->tipo_venta === 'servicio_tecnico' ? 'Servicio Técnico' : '—'),
                };
    
                $nombreProducto = $item->nombre ?? '—';
    
                $items->push([
                    'id' => $item->id,
                    'fecha' => $venta->fecha,
                    'producto' => $nombreProducto,
                    'tipo' => $tipoProducto,
                    'cantidad' => $item->cantidad,
                    'precio_venta' => $item->precio_venta,
                    'descuento' => $item->descuento,
                    'permuta' => $permutaCosto,
                    'capital' => $item->precio_invertido,
                    'subtotal' => $item->subtotal,
                    'ganancia' => $item->subtotal - $item->descuento - $permutaCosto - $item->precio_invertido,
                    'vendedor' => $venta->vendedor?->name,
                    'entregado' =>
                        $venta->entregadoCelular?->modelo ??
                        $venta->entregadoComputadora?->nombre ??
                        $venta->entregadoProductoGeneral?->nombre ?? null,
                ]);
            }
    
            // Agregar servicio técnico sin ítems
            if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {
                $items->push([
                    'id' => $venta->id,
                    'fecha' => $venta->fecha,
                    'producto' => '🛠 Servicio Técnico',
                    'tipo' => 'Servicio Técnico',
                    'cantidad' => 1,
                    'precio_venta' => $venta->precio_venta,
                    'descuento' => $venta->descuento,
                    'permuta' => 0,
                    'capital' => $venta->precio_invertido,
                    'subtotal' => $venta->subtotal,
                    'ganancia' => $venta->subtotal - $venta->descuento - $venta->precio_invertido,
                    'vendedor' => $venta->vendedor?->name,
                    'entregado' => null,
                ]);
            }
        }
    
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
            ->when($request->filled('fecha_inicio') && $request->filled('fecha_fin'), fn($q) => $q->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]))
            ->groupByRaw('DATE(fecha)')
            ->orderBy('fecha')
            ->get();
    
        return Inertia::render('Admin/Reportes/Index', [
            'ventas' => $items,
            'resumen' => $resumen,
            'resumen_grafico' => $resumenGrafico,
            'filtros' => $request->only(['vendedor_id', 'fecha_inicio', 'fecha_fin']),
            'vendedores' => User::where('rol', 'vendedor')->select('id', 'name')->get(),
        ]);
    }
           

    public function exportar(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'vendedor_id' => 'nullable|exists:users,id',
        ]);

        $query = Venta::with(['vendedor', 'celular', 'computadora', 'productoGeneral'])->orderByDesc('fecha');

        if ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }

        $ventas = $query->get();

        foreach ($ventas as $venta) {
            if ($venta->es_permuta) {
                switch ($venta->tipo_permuta) {
                    case 'celular':
                        $venta->permuta = Celular::find($venta->entregado_celular_id)?->toArray();
                        break;
                    case 'computadora':
                        $venta->permuta = Computadora::find($venta->entregado_computadora_id)?->toArray();
                        break;
                    case 'producto_general':
                        $venta->permuta = ProductoGeneral::find($venta->entregado_producto_general_id)?->toArray();
                        break;
                }
            }
        }

        $pdf = Pdf::loadView('pdf.reporte_ventas', [
            'ventas' => $ventas,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_fin' => $request->fecha_fin,
        ])->setPaper('A4', 'portrait');

        return $pdf->download('reporte_ventas.pdf');
    }

    public function exportDia()
    {
        $hoy = Carbon::now('America/La_Paz')->toDateString();

        $ventas = Venta::whereDate('fecha', $hoy)
            ->with(['vendedor', 'celular', 'computadora', 'productoGeneral'])
            ->get();

        return $this->generarPDF($ventas);
    }

    public function exportSemana()
    {
        $inicio = Carbon::now('America/La_Paz')->startOfWeek()->toDateString();
        $fin = Carbon::now('America/La_Paz')->endOfWeek()->toDateString();

        $ventas = Venta::whereBetween('fecha', [$inicio, $fin])
            ->with(['vendedor', 'celular', 'computadora', 'productoGeneral'])
            ->get();

        return $this->generarPDF($ventas);
    }

    public function exportMes()
    {
        $inicio = Carbon::now('America/La_Paz')->startOfMonth()->toDateString();
        $fin = Carbon::now('America/La_Paz')->endOfMonth()->toDateString();

        $ventas = Venta::whereBetween('fecha', [$inicio, $fin])
            ->with(['vendedor', 'celular', 'computadora', 'productoGeneral'])
            ->get();

        return $this->generarPDF($ventas);
    }

    public function exportAnio()
    {
        $inicio = Carbon::now('America/La_Paz')->startOfYear()->toDateString();
        $fin = Carbon::now('America/La_Paz')->endOfYear()->toDateString();

        $ventas = Venta::whereBetween('fecha', [$inicio, $fin])
            ->with(['vendedor', 'celular', 'computadora', 'productoGeneral'])
            ->get();

        return $this->generarPDF($ventas);
    }

    private function generarPDF($ventas)
    {
        foreach ($ventas as $venta) {
            if ($venta->es_permuta) {
                switch ($venta->tipo_permuta) {
                    case 'celular':
                        $venta->permuta = Celular::find($venta->entregado_celular_id)?->toArray();
                        break;
                    case 'computadora':
                        $venta->permuta = Computadora::find($venta->entregado_computadora_id)?->toArray();
                        break;
                    case 'producto_general':
                        $venta->permuta = ProductoGeneral::find($venta->entregado_producto_general_id)?->toArray();
                        break;
                }
            }
        }

        $pdf = Pdf::loadView('pdf.reporte_ventas', [
            'ventas' => $ventas,
            'fecha_inicio' => null,
            'fecha_fin' => null,
        ])->setPaper('A4', 'portrait');

        return $pdf->download('reporte_ventas.pdf');
    }
}
