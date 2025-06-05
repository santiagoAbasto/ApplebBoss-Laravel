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
            'entregadoProductoApple', // NUEVO
            'items.celular',
            'items.computadora',
            'items.productoGeneral',
            'items.productoApple', // NUEVO
        ])->orderByDesc('fecha');
        

        if ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }

        $ventas = $query->get();
        $items = collect();

        $gananciasPorTipo = [
            'celulares' => 0,
            'computadoras' => 0,
            'generales' => 0,
            'productos_apple' => 0,
            'servicio_tecnico' => 0,
        ];

        $inversionTotal = 0;

        foreach ($ventas as $venta) {
            $permutaCosto = optional($venta->entregadoCelular)->precio_costo
            ?? optional($venta->entregadoComputadora)->precio_costo
            ?? optional($venta->entregadoProductoGeneral)->precio_costo
            ?? optional($venta->entregadoProductoApple)->precio_costo
            ?? 0;
        

            $permutaAplicada = false;

            foreach ($venta->items as $item) {
                $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
                $permuta = $aplicaPermuta ? $permutaCosto : 0;
                $permutaAplicada = $aplicaPermuta ? true : $permutaAplicada;

                $tipoProducto = match ($item->tipo) {
                    'celular' => 'Celular',
                    'computadora' => 'Computadora',
                    'producto_general' => 'Producto General',
                    'producto_apple' => 'Producto Apple',
                    default => ($venta->tipo_venta === 'servicio_tecnico' ? 'Servicio Técnico' : '—'),
                };

                $nombreProducto = match ($item->tipo) {
                    'celular' => $item->celular?->modelo ?? '—',
                    'computadora' => $item->computadora?->nombre ?? '—',
                    'producto_general' => $item->productoGeneral?->nombre ?? '—',
                    'producto_apple' => $item->productoApple?->modelo ?? '—', // NUEVO
                    default => '—',
                };
                $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;
                $inversionTotal += $item->precio_invertido;

                match ($tipoProducto) {
                    'Celular' => $gananciasPorTipo['celulares'] += $ganancia,
                    'Computadora' => $gananciasPorTipo['computadoras'] += $ganancia,
                    'Producto General' => $gananciasPorTipo['generales'] += $ganancia,
                    'Producto Apple' => $gananciasPorTipo['productos_apple'] += $ganancia,
                    default => null,
                };                             

                $items->push([
                    'id' => $item->id,
                    'fecha' => $venta->fecha,
                    'producto' => $nombreProducto,
                    'tipo' => $tipoProducto,
                    'cantidad' => $item->cantidad,
                    'precio_venta' => $item->precio_venta,
                    'descuento' => $item->descuento,
                    'permuta' => $permuta,
                    'capital' => $item->precio_invertido,
                    'subtotal' => $item->subtotal,
                    'ganancia' => $ganancia,
                    'vendedor' => $venta->vendedor?->name,
                    'entregado' => $aplicaPermuta ? (
                        $venta->entregadoCelular?->modelo
                        ?? $venta->entregadoComputadora?->nombre
                        ?? $venta->entregadoProductoGeneral?->nombre
                        ?? $venta->entregadoProductoApple?->modelo                    
                    ) : null,
                ]);
            }

            if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {
                $gananciaServicio = $venta->precio_venta - $venta->descuento - $venta->precio_invertido;
                $gananciasPorTipo['servicio_tecnico'] += $gananciaServicio;
                $inversionTotal += $venta->precio_invertido;

                $items->push([
                    'id' => $venta->id,
                    'fecha' => $venta->fecha,
                    'producto' => 'Servicio Técnico',
                    'tipo' => 'Servicio Técnico',
                    'cantidad' => 1,
                    'precio_venta' => $venta->precio_venta,
                    'descuento' => $venta->descuento,
                    'permuta' => 0,
                    'capital' => $venta->precio_invertido,
                    'subtotal' => $venta->subtotal,
                    'ganancia' => $gananciaServicio,
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
            'total_inversion'    => $inversionTotal,
            'ganancias_por_tipo' => $gananciasPorTipo,
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
    
        $query = Venta::with([
            'vendedor',
            'items.celular',
            'items.computadora',
            'items.productoGeneral',
            'items.productoApple',
            'entregadoCelular',
            'entregadoComputadora',
            'entregadoProductoGeneral',
            'entregadoProductoApple',
        ])->orderByDesc('fecha');
    
        if ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }
    
        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }
    
        $ventas = $query->get();
    
        $resultados = collect();
    
        foreach ($ventas as $venta) {
            $permutaCosto = optional($venta->entregadoCelular)->precio_costo
                ?? optional($venta->entregadoComputadora)->precio_costo
                ?? optional($venta->entregadoProductoGeneral)->precio_costo
                ?? 0;
    
            $permutaAplicada = false;
    
            foreach ($venta->items as $item) {
                $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
                $permuta = $aplicaPermuta ? $permutaCosto : 0;
                $permutaAplicada = $aplicaPermuta;
    
                $nombreProducto = match ($item->tipo) {
                    'celular' => $item->celular?->modelo ?? 'Celular',
                    'computadora' => $item->computadora?->nombre ?? 'Computadora',
                    'producto_general' => $item->productoGeneral?->nombre ?? 'Producto General',
                    'producto_apple' => $item->productoApple?->nombre ?? 'Producto Apple',
                    default => '—',
                };
                
    
                $tipoProducto = match ($item->tipo) {
                    'celular' => 'Celular',
                    'computadora' => 'Computadora',
                    'producto_general' => 'Producto General',
                    'producto_apple' => 'Producto Apple',
                    default => '—'
                };
    
                $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;
    
                $resultados->push((object)[
                    'fecha' => $venta->fecha,
                    'cliente' => $venta->nombre_cliente,
                    'producto' => $nombreProducto,
                    'tipo' => $tipoProducto,
                    'cantidad' => $item->cantidad,
                    'precio_invertido' => $item->precio_invertido,
                    'precio_venta' => $item->precio_venta,
                    'descuento' => $item->descuento,
                    'permuta' => $permuta,
                    'subtotal' => $item->subtotal,
                    'ganancia' => $ganancia,
                    'vendedor' => $venta->vendedor?->name,
                ]);
            }
    
            // Agregar ventas sin ítems (servicio técnico)
            if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {
                $ganancia = $venta->precio_venta - $venta->descuento - $venta->precio_invertido;
    
                $resultados->push((object)[
                    'fecha' => $venta->fecha,
                    'cliente' => $venta->nombre_cliente,
                    'producto' => 'Servicio Técnico',
                    'tipo' => 'Servicio Técnico',
                    'cantidad' => 1,
                    'precio_invertido' => $venta->precio_invertido,
                    'precio_venta' => $venta->precio_venta,
                    'descuento' => $venta->descuento,
                    'permuta' => 0,
                    'subtotal' => $venta->subtotal,
                    'ganancia' => $ganancia,
                    'vendedor' => $venta->vendedor?->name,
                ]);
            }
        }

        $resultados = $resultados->sortBy([
            fn ($a, $b) =>
                array_search($a->tipo, ['Celular', 'Computadora', 'Producto General', 'Producto Apple', 'Servicio Técnico'])
                <=> array_search($b->tipo, ['Celular', 'Computadora', 'Producto General', 'Producto Apple', 'Servicio Técnico']),
            fn ($a, $b) => strtotime($a->fecha) <=> strtotime($b->fecha),
        ])->values();
        
    
        $pdf = Pdf::loadView('pdf.reporte_ventas', [
            'ventas' => $resultados,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_fin' => $request->fecha_fin,
        ])->setPaper('A4', 'portrait');
    
        return $pdf->download('reporte_ventas.pdf');
    }

    public function exportDia()
    {
        $hoy = Carbon::now('America/La_Paz')->toDateString();
        $ventas = Venta::whereDate('fecha', $hoy)
            ->with([
                'vendedor',
                'items.celular',
                'items.computadora',
                'items.productoGeneral',
                'items.productoApple',
                'entregadoCelular',
                'entregadoComputadora',
                'entregadoProductoGeneral',
                'entregadoProductoApple',
            ])->get();

        return $this->generarPDFDesdeVentas($ventas);
    }
    
    public function exportSemana()
    {
        $inicio = Carbon::now('America/La_Paz')->startOfWeek()->toDateString();
        $fin = Carbon::now('America/La_Paz')->endOfWeek()->toDateString();
    
        $ventas = Venta::whereBetween('fecha', [$inicio, $fin])
            ->with([
                'vendedor',
                'items.celular',
                'items.computadora',
                'items.productoGeneral',
                'items.productoApple',
                'entregadoCelular',
                'entregadoComputadora',
                'entregadoProductoGeneral',
                'entregadoProductoApple',
            ])->get();
    
        return $this->generarPDFDesdeVentas($ventas);
    }
    
    public function exportMes()
    {
        $inicio = Carbon::now('America/La_Paz')->startOfMonth()->toDateString();
        $fin = Carbon::now('America/La_Paz')->endOfMonth()->toDateString();
    
        $ventas = Venta::whereBetween('fecha', [$inicio, $fin])
            ->with([
                'vendedor',
                'items.celular',
                'items.computadora',
                'items.productoGeneral',
                'items.productoApple',
                'entregadoCelular',
                'entregadoComputadora',
                'entregadoProductoGeneral',
                'entregadoProductoApple',
            ])->get();
    
        return $this->generarPDFDesdeVentas($ventas);
    }
    
    public function exportAnio()
    {
        $inicio = Carbon::now('America/La_Paz')->startOfYear()->toDateString();
        $fin = Carbon::now('America/La_Paz')->endOfYear()->toDateString();
    
        $ventas = Venta::whereBetween('fecha', [$inicio, $fin])
            ->with([
                'vendedor',
                'items.celular',
                'items.computadora',
                'items.productoGeneral',
                'items.productoApple',
                'entregadoCelular',
                'entregadoComputadora',
                'entregadoProductoGeneral',
                'entregadoProductoApple',
            ])->get();

    
        return $this->generarPDFDesdeVentas($ventas);
    }
    
    private function generarPDFDesdeVentas($ventas)
    {
        $resultados = collect();
    
        // Cargar relaciones necesarias
        $ventas->loadMissing([
            'vendedor',
            'celular',
            'computadora',
            'productoGeneral',
            'ProductoApple',
            'items.celular',
            'items.computadora',
            'items.productoGeneral',
            'items.productoApple',
        ]);
    
        foreach ($ventas as $venta) {
            $permutaCosto = optional($venta->entregadoCelular)->precio_costo
                ?? optional($venta->entregadoComputadora)->precio_costo
                ?? optional($venta->entregadoProductoGeneral)->precio_costo
                ?? 0;
    
            $permutaAplicada = false;
    
            foreach ($venta->items as $item) {
                $aplicaPermuta = in_array($item->tipo, ['celular', 'computadora']) && !$permutaAplicada;
                $permuta = $aplicaPermuta ? $permutaCosto : 0;
                $permutaAplicada = $aplicaPermuta;
    
                $nombreProducto = match ($item->tipo) {
                    'celular' => $item->celular?->modelo ?? '—',
                    'computadora' => $item->computadora?->nombre ?? '—',
                    'producto_general' => $item->productoGeneral?->nombre ?? '—',
                    'producto_apple' => $item->productoApple?->nombre ?? '—',
                    default => '—'
                };                
    
                $tipoProducto = match ($item->tipo) {
                    'celular' => 'Celular',
                    'computadora' => 'Computadora',
                    'producto_general' => 'Producto General',
                    'producto_apple' => 'Producto Apple',
                    default => '—'
                };
    
                $ganancia = $item->precio_venta - $item->descuento - $permuta - $item->precio_invertido;
    
                $resultados->push((object)[
                    'fecha' => $venta->fecha,
                    'producto' => $nombreProducto,
                    'tipo' => $tipoProducto,
                    'cantidad' => $item->cantidad,
                    'precio_invertido' => $item->precio_invertido,
                    'precio_venta' => $item->precio_venta,
                    'descuento' => $item->descuento,
                    'permuta' => $permuta,
                    'subtotal' => $item->subtotal,
                    'ganancia' => $ganancia,
                    'vendedor' => $venta->vendedor?->name ?? '—',
                ]);
            }
    
            // Casos sin ítems (servicio técnico sin ítems)
            if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {
                $ganancia = $venta->precio_venta - $venta->descuento - $venta->precio_invertido;
    
                $resultados->push((object)[
                    'fecha' => $venta->fecha,
                    'producto' => 'Servicio Técnico',
                    'tipo' => 'Servicio Técnico',
                    'cantidad' => 1,
                    'precio_invertido' => $venta->precio_invertido,
                    'precio_venta' => $venta->precio_venta,
                    'descuento' => $venta->descuento,
                    'permuta' => 0,
                    'subtotal' => $venta->subtotal,
                    'ganancia' => $ganancia,
                    'vendedor' => $venta->vendedor?->name ?? '—',
                ]);
            }
        }

        $resultados = $resultados->sortBy([
            fn ($a, $b) =>
                array_search($a->tipo, ['Celular', 'Computadora', 'Producto General', 'Producto Apple', 'Servicio Técnico'])
                <=> array_search($b->tipo, ['Celular', 'Computadora', 'Producto General', 'Producto Apple', 'Servicio Técnico']),
            fn ($a, $b) => strtotime($a->fecha) <=> strtotime($b->fecha),
        ])->values();
        
    
        $pdf = Pdf::loadView('pdf.reporte_ventas', [
            'ventas' => $resultados,
            'fecha_inicio' => null,
            'fecha_fin' => null,
        ])->setPaper('A4', 'portrait');
    
        return $pdf->download('reporte_ventas.pdf');
    }
}    