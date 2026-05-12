<?php

namespace App\Http\Controllers\Vendedor;

use App\Http\Controllers\Controller;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ProductoVendedorController extends Controller
{
    public function index(Request $request)
    {
        $orderedInventory = fn ($model) => $model::query()
            ->where('estado', 'disponible')
            ->orderByRaw("CASE estado WHEN 'disponible' THEN 0 WHEN 'vendido' THEN 1 WHEN 'permuta' THEN 2 ELSE 3 END")
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Vendedor/Productos/Index', [
            'celulares' => $orderedInventory(Celular::class),
            'computadoras' => $orderedInventory(Computadora::class),
            'productosGenerales' => $orderedInventory(ProductoGeneral::class),
            'productosApple' => $orderedInventory(ProductoApple::class),
        ]);
    }
}
