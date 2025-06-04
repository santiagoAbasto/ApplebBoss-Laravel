<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class ExportController extends Controller
{
    public function index()
    {
        // Subcategorías únicas (tipo) de productos generales
        $subtipos = ProductoGeneral::select('tipo')
            ->whereNotNull('tipo')
            ->distinct()
            ->orderBy('tipo')
            ->pluck('tipo');

        return Inertia::render('Admin/Exportaciones/Index', [
            'subtipos' => $subtipos,
        ]);
    }

    public function celulares()
    {
        // Celulares disponibles
        $productos = Celular::where('estado', 'disponible')
            ->orderBy('modelo')
            ->get();

        $pdf = Pdf::loadView('pdf.exportar_productos', [
            'productos' => $productos,
            'tipo' => 'celular',
        ])->setPaper('a4', 'landscape');

        return $pdf->stream('inventario-celulares.pdf');
    }

    public function computadoras()
    {
        // Computadoras disponibles
        $productos = Computadora::where('estado', 'disponible')
            ->orderBy('nombre')
            ->get();

        $pdf = Pdf::loadView('pdf.exportar_productos', [
            'productos' => $productos,
            'tipo' => 'computadora',
        ])->setPaper('a4', 'landscape');

        return $pdf->stream('inventario-computadoras.pdf');
    }

    public function productosApple()
    {
        // Productos Apple disponibles
        $productos = ProductoApple::where('estado', 'disponible')
            ->orderBy('modelo')
            ->get();

        $pdf = Pdf::loadView('pdf.exportar_productos', [
            'productos' => $productos,
            'tipo' => 'producto_apple',
        ])->setPaper('a4', 'landscape');

        return $pdf->stream('inventario-productos-apple.pdf');
    }

    public function productosGenerales()
    {
        // Todos los productos generales disponibles
        $productos = ProductoGeneral::where('estado', 'disponible')
            ->orderBy('codigo') // si son formateados como "VIDRIO: 1"
            ->get()
            ->sortBy(function ($p) {
                preg_match('/\d+/', $p->codigo, $matches);
                return isset($matches[0]) ? (int) $matches[0] : 0;
            });

        $pdf = Pdf::loadView('pdf.exportar_productos', [
            'productos' => $productos,
            'tipo' => 'producto_general',
            'subtipo' => 'todos',
        ])->setPaper('a4', 'landscape');

        return $pdf->stream('inventario-productos-generales.pdf');
    }


    public function productosGeneralesPorTipo($tipo)
    {
        // Subcategoría específica
        $productos = ProductoGeneral::where('tipo', $tipo)
            ->where('estado', 'disponible')
            ->get()
            ->sortBy(function ($p) {
                preg_match('/\d+/', $p->codigo, $matches);
                return isset($matches[0]) ? (int) $matches[0] : 0;
            });

        if ($productos->isEmpty()) {
            return back()->with('error', 'No hay productos de ese tipo.');
        }

        $pdf = Pdf::loadView('pdf.exportar_productos', [
            'productos' => $productos,
            'tipo' => 'producto_general',
            'subtipo' => ucfirst($tipo),
        ])->setPaper('a4', 'landscape');

        return $pdf->stream("productos-generales-{$tipo}.pdf");
    }
}
