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
        return Inertia::render('Vendedor/Productos/Index', [
            'celulares' => Celular::where('estado', 'disponible')->paginate(25)->withQueryString(),
            'computadoras' => Computadora::where('estado', 'disponible')->paginate(25)->withQueryString(),
            'productosGenerales' => ProductoGeneral::where('estado', 'disponible')->paginate(25)->withQueryString(),
            'productosApple' => ProductoApple::where('estado', 'disponible')->paginate(25)->withQueryString(),
        ]);
    }
}
