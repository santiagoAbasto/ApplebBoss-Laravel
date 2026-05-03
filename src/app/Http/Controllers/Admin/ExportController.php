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
    private function streamOrViewPdf($pdf, string $filename, string $title, string $routeName, array $routeParams = [])
    {
        if (! request()->boolean('raw')) {
            return view('pdf.viewer', [
                'title' => $title,
                'pdfUrl' => route($routeName, array_merge($routeParams, ['raw' => 1])),
            ]);
        }

        return $pdf->stream($filename);
    }

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

        return $this->streamOrViewPdf(
            $pdf,
            'inventario-celulares.pdf',
            'Inventario Celulares',
            'admin.exportar.celulares'
        );
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

        return $this->streamOrViewPdf(
            $pdf,
            'inventario-computadoras.pdf',
            'Inventario Computadoras',
            'admin.exportar.computadoras'
        );
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

        return $this->streamOrViewPdf(
            $pdf,
            'inventario-productos-apple.pdf',
            'Inventario Productos Apple',
            'admin.exportar.productos-apple'
        );
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

        return $this->streamOrViewPdf(
            $pdf,
            'inventario-productos-generales.pdf',
            'Inventario Productos Generales',
            'admin.exportar.productos-generales'
        );
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

        return $this->streamOrViewPdf(
            $pdf,
            "productos-generales-{$tipo}.pdf",
            'Inventario ' . ucfirst($tipo),
            'admin.exportar.productos-generales.tipo',
            ['tipo' => $tipo]
        );
    }
}
