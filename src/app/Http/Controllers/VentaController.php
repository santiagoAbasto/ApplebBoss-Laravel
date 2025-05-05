<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VentaController extends Controller
{
    public function index()
    {
        $ventas = Venta::with(['vendedor', 'celular', 'computadora', 'productoGeneral'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Ventas/Index', [
            'ventas' => $ventas,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Ventas/Create', [
            'celulares' => Celular::where('estado', 'disponible')->get(),
            'computadoras' => Computadora::where('estado', 'disponible')->get(),
            'productosGenerales' => ProductoGeneral::where('estado', 'disponible')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre_cliente' => 'required|string',
            'tipo_venta' => 'required|in:producto,servicio_tecnico',
            'es_permuta' => 'boolean',
            'tipo_permuta' => 'nullable|in:celular,computadora,producto_general',
            'precio_venta' => 'required|numeric',
            'cantidad' => 'required|numeric|min:1',
        ]);

        // Calcular campos
        $ganancia = $request->precio_venta - $request->precio_invertido;
        $subtotal = $request->precio_venta * $request->cantidad - $request->descuento;

        $venta = Venta::create([
            ...$request->only([
                'nombre_cliente', 'telefono_cliente', 'tipo_venta', 'es_permuta', 'tipo_permuta',
                'cantidad', 'precio_invertido', 'precio_venta', 'descuento',
                'celular_id', 'computadora_id', 'producto_general_id'
            ]),
            'user_id' => auth()->id(),
            'ganancia_neta' => $ganancia,
            'subtotal' => $subtotal,
        ]);

        // Registrar producto entregado por permuta (si corresponde)
        if ($request->es_permuta && $request->has('permuta')) {
            switch ($request->tipo_permuta) {
                case 'celular':
                    Celular::create(array_merge($request->permuta, ['estado' => 'permuta']));
                    break;
                case 'computadora':
                    Computadora::create(array_merge($request->permuta, ['estado' => 'permuta']));
                    break;
                case 'producto_general':
                    ProductoGeneral::create(array_merge($request->permuta, ['estado' => 'permuta']));
                    break;
            }
        }

        return redirect()->route('admin.ventas.index')->with('success', 'Venta registrada correctamente.');
    }
}
