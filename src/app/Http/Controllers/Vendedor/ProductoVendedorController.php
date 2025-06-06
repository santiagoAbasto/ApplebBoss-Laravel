<?php

namespace App\Http\Controllers\Vendedor;

use App\Http\Controllers\Controller;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use Inertia\Inertia;

class ProductoVendedorController extends Controller
{
    public function index()
    {
        return Inertia::render('Vendedor/Productos/Index', [
            'celulares' => Celular::where('estado', 'disponible')->get(),
            'computadoras' => Computadora::where('estado', 'disponible')->get(),
            'productosGenerales' => ProductoGeneral::where('estado', 'disponible')->get(),
            'productosApple' => ProductoApple::where('estado', 'disponible')->get(),
        ]);
    }
}