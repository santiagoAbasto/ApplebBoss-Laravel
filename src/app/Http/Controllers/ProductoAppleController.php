<?php

namespace App\Http\Controllers;

use App\Models\ProductoApple;
use Illuminate\Http\Request;

class ProductoAppleController extends Controller
{
    public function index()
    {
        $productos = ProductoApple::latest()->get();
        return inertia('Admin/ProductosApple/Index', compact('productos'));
    }

    public function create()
    {
        return inertia('Admin/ProductosApple/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'modelo' => 'required|string|max:255',
            'capacidad' => 'required|string|max:255',
            'bateria' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'numero_serie' => 'nullable|string|unique:productos_apple,numero_serie',
            'procedencia' => 'required|string|max:255',
            'precio_costo' => 'required|numeric|min:0',
            'precio_venta' => 'required|numeric|min:0',
            'tiene_imei' => 'required|boolean',
            'imei_1' => 'nullable|required_if:tiene_imei,true|unique:productos_apple,imei_1',
            'imei_2' => 'nullable|unique:productos_apple,imei_2',
            'estado_imei' => 'nullable|required_if:tiene_imei,true|in:Libre,Registro seguro,IMEI 1 libre y IMEI 2 registrado,IMEI 2 libre y IMEI 1 registrado',
        ]);

        ProductoApple::create($validated);

        return redirect()->route('admin.productos-apple.index')->with('success', 'Producto Apple creado correctamente.');
    }

    public function edit(ProductoApple $productoApple)
    {
        return inertia('Admin/ProductosApple/Edit', compact('productoApple'));
    }

    public function update(Request $request, ProductoApple $productoApple)
    {
        $validated = $request->validate([
            'modelo' => 'required|string|max:255',
            'capacidad' => 'required|string|max:255',
            'bateria' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'numero_serie' => 'nullable|string|unique:productos_apple,numero_serie,' . $productoApple->id,
            'procedencia' => 'required|string|max:255',
            'precio_costo' => 'required|numeric|min:0',
            'precio_venta' => 'required|numeric|min:0',
            'tiene_imei' => 'required|boolean',
            'imei_1' => 'nullable|required_if:tiene_imei,true|unique:productos_apple,imei_1,' . $productoApple->id,
            'imei_2' => 'nullable|unique:productos_apple,imei_2,' . $productoApple->id,
            'estado_imei' => 'nullable|required_if:tiene_imei,true|in:Libre,Registro seguro,IMEI 1 libre y IMEI 2 registrado,IMEI 2 libre y IMEI 1 registrado',
        ]);

        $productoApple->update($validated);

        return redirect()->route('admin.productos-apple.index')->with('success', 'Producto Apple actualizado correctamente.');
    }

    public function destroy(ProductoApple $productoApple)
    {
        $productoApple->delete();
        return redirect()->route('admin.productos-apple.index')->with('success', 'Producto eliminado correctamente.');
    }
}
