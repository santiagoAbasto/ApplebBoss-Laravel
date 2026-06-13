<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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

    private function normalizeSearchText(?string $value): string
    {
        $text = Str::ascii(Str::lower((string) $value));
        $text = preg_replace('/[^a-z0-9]+/', ' ', $text);

        return trim(preg_replace('/\s+/', ' ', $text));
    }

    private function searchTerms(string $value): array
    {
        $stopWords = ['de', 'del', 'la', 'las', 'el', 'los', 'para', 'por'];

        return collect(explode(' ', $this->normalizeSearchText($value)))
            ->filter(fn ($term) => $term !== '' && ! in_array($term, $stopWords, true))
            ->values()
            ->all();
    }

    private function matchesNameFilter(?string $value, string $filter): bool
    {
        $haystack = $this->normalizeSearchText($value);

        foreach ($this->searchTerms($filter) as $term) {
            $variants = [$term];

            if (Str::endsWith($term, 's') && Str::length($term) > 3) {
                $variants[] = Str::substr($term, 0, -1);
            }

            if ($term === 'iphone') {
                $variants[] = 'ip';
            }

            if ($term === 'ip') {
                $variants[] = 'iphone';
            }

            if (! collect($variants)->contains(fn ($variant) => str_contains($haystack, $variant))) {
                return false;
            }
        }

        return true;
    }

    private function inventoryConfig(string $inventory): array
    {
        return match ($inventory) {
            'celulares' => [
                'model' => Celular::class,
                'column' => 'modelo',
                'tipo' => 'celular',
                'label' => 'Celulares',
            ],
            'computadoras' => [
                'model' => Computadora::class,
                'column' => 'nombre',
                'tipo' => 'computadora',
                'label' => 'Computadoras',
            ],
            'productos_apple' => [
                'model' => ProductoApple::class,
                'column' => 'modelo',
                'tipo' => 'producto_apple',
                'label' => 'Productos Apple',
            ],
            default => [
                'model' => ProductoGeneral::class,
                'column' => 'nombre',
                'tipo' => 'producto_general',
                'label' => 'Productos Generales',
            ],
        };
    }

    private function sortFilteredProducts($products, string $inventory)
    {
        if ($inventory === 'productos_generales') {
            return $products
                ->sortBy([
                    fn ($a, $b) => strnatcasecmp((string) $a->nombre, (string) $b->nombre),
                    fn ($a, $b) => strnatcasecmp((string) $a->codigo, (string) $b->codigo),
                ])
                ->values();
        }

        if ($inventory === 'celulares') {
            return $products
                ->sortBy([
                    fn ($a, $b) => strnatcasecmp((string) $a->modelo, (string) $b->modelo),
                    fn ($a, $b) => strnatcasecmp((string) $a->capacidad, (string) $b->capacidad),
                    fn ($a, $b) => strnatcasecmp((string) $a->color, (string) $b->color),
                ])
                ->values();
        }

        return $products->sortBy('id')->values();
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

    public function personalizado()
    {
        return Inertia::render('Admin/Exportaciones/Personalizado', [
            'defaults' => [
                'inventario' => 'productos_generales',
                'nombre' => 'fundas magsafe de 14 pro max',
                'solo_disponibles' => true,
            ],
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

    public function porNombre(Request $request)
    {
        $validated = $request->validate([
            'inventario' => ['required', 'string', 'in:celulares,computadoras,productos_generales,productos_apple'],
            'nombre' => ['required', 'string', 'max:120'],
            'solo_disponibles' => ['nullable'],
        ]);

        $inventory = $validated['inventario'];
        $name = trim($validated['nombre']);
        $onlyAvailable = $request->boolean('solo_disponibles', true);
        $config = $this->inventoryConfig($inventory);
        $model = $config['model'];
        $column = $config['column'];

        $query = $model::query();

        if ($onlyAvailable) {
            $query->where('estado', 'disponible');
        }

        $products = $this->sortFilteredProducts(
            $query->get()->filter(fn ($product) => $this->matchesNameFilter($product->{$column}, $name)),
            $inventory
        );

        if ($products->isEmpty()) {
            return back()->with('error', 'No hay productos con ese nombre.');
        }

        $pdf = Pdf::loadView('pdf.exportar_productos', [
            'productos' => $products,
            'tipo' => $config['tipo'],
            'subtipo' => $config['label'],
            'filtroNombre' => $name,
            'soloDisponibles' => $onlyAvailable,
        ])->setPaper('a4', 'landscape');

        return $this->streamOrViewPdf(
            $pdf,
            'inventario-' . Str::slug($name) . '.pdf',
            'Inventario ' . $config['label'] . ' - ' . $name,
            'admin.exportar.por-nombre',
            [
                'inventario' => $inventory,
                'nombre' => $name,
                'solo_disponibles' => $onlyAvailable ? 1 : 0,
            ]
        );
    }

    public function fundasMagsafe14ProMax(Request $request)
    {
        $request->merge([
            'inventario' => 'productos_generales',
            'nombre' => 'fundas magsafe de 14 pro max',
            'solo_disponibles' => $request->input('solo_disponibles', 1),
        ]);

        return $this->porNombre($request);
    }
}
