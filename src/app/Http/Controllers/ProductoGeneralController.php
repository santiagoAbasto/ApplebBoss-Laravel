<?php

namespace App\Http\Controllers;

use App\Models\ProductoGeneral;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductoGeneralController extends Controller
{
    public function index()
    {
        $productos = ProductoGeneral::orderBy('created_at', 'desc')->get();
        return Inertia::render('Admin/ProductosGenerales/Index', [
            'productos' => $productos,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/ProductosGenerales/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'codigo' => 'required|string|unique:productos_generales,codigo',
            'tipo' => 'required|string|max:100',
            'nombre' => 'required|string|max:255',
            'procedencia' => 'required|string|max:100',
            'precio_costo' => 'required|numeric',
            'precio_venta' => 'required|numeric',
            'estado' => 'required|in:disponible,vendido,permuta',
        ]);
    
        ProductoGeneral::create($request->all());
    
        return redirect(
            $request->get('return_to', route('admin.productos-generales.index'))
        )->with('success', 'Producto registrado correctamente.');
    }
    

    public function show(ProductoGeneral $producto)
    {
        return Inertia::render('Admin/ProductosGenerales/Show', [
            'producto' => $producto,
        ]);
    }

    public function edit(ProductoGeneral $producto)
    {
        return Inertia::render('Admin/ProductosGenerales/Edit', [
            'producto' => $producto,
        ]);
    }

    public function update(Request $request, ProductoGeneral $producto)
    {
        $request->validate([
            'codigo' => 'required|string|unique:productos_generales,codigo,' . $producto->id,
            'tipo' => 'required|string|max:100',
            'nombre' => 'required|string|max:255',
            'procedencia' => 'required|string|max:100',
            'precio_costo' => 'required|numeric',
            'precio_venta' => 'required|numeric',
            'estado' => 'required|in:disponible,vendido,permuta',
        ]);

        $producto->update($request->all());

        return redirect()->route('admin.productos-generales.index')
                         ->with('success', 'Producto actualizado correctamente.');
    }

    public function destroy(ProductoGeneral $producto)
    {
        $producto->delete();

        return redirect()->route('admin.productos-generales.index')
                         ->with('success', 'Producto eliminado correctamente.');
    }
    public function apiStore(Request $request)
{
    $data = $request->validate([
        'codigo' => 'required|string|unique:productos_generales,codigo',
        'nombre' => 'required|string|max:255',
        'precio_costo' => 'required|numeric',
        'precio_venta' => 'required|numeric',
    ]);

    $producto = new ProductoGeneral();
    $producto->codigo = $data['codigo'];
    $producto->nombre = $data['nombre'];
    $producto->precio_costo = $data['precio_costo'];
    $producto->precio_venta = $data['precio_venta'];
    $producto->estado = 'disponible';

    // Campos por defecto para permutas
    $producto->tipo = 'permuta';
    $producto->procedencia = 'permuta';

    $producto->save();

    return response()->json($producto);
}

}
