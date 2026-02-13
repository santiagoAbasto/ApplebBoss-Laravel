<?php

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use App\Models\VentaItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TopProductsController extends Controller
{
    public function __invoke()
    {
        $startOfMonth = Carbon::now()->startOfMonth();

        $items = VentaItem::where('created_at', '>=', $startOfMonth)
            ->select(
                'tipo',
                'producto_id',
                DB::raw('SUM(cantidad) as total_sold')
            )
            ->groupBy('tipo', 'producto_id')
            ->orderByDesc('total_sold')
            ->get();

        $result = [
            'period' => now()->format('Y-m'),
            'alerts' => [],
            'summary' => [],
        ];

        foreach (['celular', 'computadora', 'producto_general', 'producto_apple'] as $tipo) {

            $top = $items->where('tipo', $tipo)->first();

            if (!$top) {
                continue;
            }

            $product = $this->resolveProduct($tipo, $top->producto_id);

            if (!$product) {
                continue;
            }

            $stock = $product->stock ?? 0;

            $data = [
                'modelo' => $product->modelo ?? $product->nombre ?? 'N/D',
                'color' => $product->color ?? null,
                'sold' => (int) $top->total_sold,
                'stock' => $stock,
            ];

            $result['summary'][$tipo] = $data;

            if ($stock <= 3) {
                $result['alerts'][] = [
                    'category' => $tipo,
                    'product' => $data,
                    'alert' => 'LOW_STOCK',
                ];
            }
        }

        return response()->json($result);
    }

    protected function resolveProduct(string $tipo, int $id)
    {
        return match ($tipo) {
            'celular' => \App\Models\Celular::find($id),
            'computadora' => \App\Models\Computadora::find($id),
            'producto_general' => \App\Models\ProductoGeneral::find($id),
            'producto_apple' => \App\Models\ProductoApple::find($id),
            default => null,
        };
    }
}
