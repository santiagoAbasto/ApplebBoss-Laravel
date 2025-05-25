<?php

namespace App\Http\Controllers;

use App\Models\Computadora;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComputadoraController extends Controller
{
    public function index()
    {
        $computadoras = Computadora::orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/Computadoras/Index', [
            'computadoras' => $computadoras,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Computadoras/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'procesador' => 'nullable|string|max:100',
            'numero_serie' => 'required|string|unique:computadoras,numero_serie',
            'color' => 'required|string|max:100',
            'bateria' => 'nullable|string|max:100',
            'ram' => 'required|string|max:50',
            'almacenamiento' => 'required|string|max:100',
            'procedencia' => 'required|string|max:100',
            'precio_costo' => 'required|numeric',
            'precio_venta' => 'required|numeric',
            'estado' => 'required|in:disponible,vendido,permuta',
        ]);

        Computadora::create($request->all());

        return redirect(
            $request->get('return_to', route('admin.computadoras.index'))
        )->with('success', 'Computadora registrada correctamente.');
    }

    public function show(Computadora $computadora)
    {
        return Inertia::render('Admin/Computadoras/Show', [
            'computadora' => $computadora,
        ]);
    }

    public function edit(Computadora $computadora)
    {
        return Inertia::render('Admin/Computadoras/Edit', [
            'computadora' => $computadora,
        ]);
    }

    public function update(Request $request, Computadora $computadora)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'procesador' => 'nullable|string|max:100',
            'numero_serie' => 'required|string|unique:computadoras,numero_serie,' . $computadora->id,
            'color' => 'required|string|max:100',
            'bateria' => 'nullable|string|max:100',
            'ram' => 'required|string|max:50',
            'almacenamiento' => 'required|string|max:100',
            'procedencia' => 'required|string|max:100',
            'precio_costo' => 'required|numeric',
            'precio_venta' => 'required|numeric',
            'estado' => 'required|in:disponible,vendido,permuta',
        ]);

        $computadora->update($request->all());

        return redirect()->route('admin.computadoras.index')->with('success', 'Computadora actualizada correctamente.');
    }

    public function destroy(Computadora $computadora)
    {
        $computadora->delete();

        return redirect()->route('admin.computadoras.index')->with('success', 'Computadora eliminada correctamente.');
    }

    public function apiStore(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'procesador' => 'nullable|string|max:100',
            'numero_serie' => 'required|string|unique:computadoras,numero_serie',
            'precio_costo' => 'required|numeric',
            'precio_venta' => 'required|numeric',
        ]);

        $computadora = new Computadora();
        $computadora->nombre = $data['nombre'];
        $computadora->procesador = $data['procesador'] ?? 'permuta';
        $computadora->numero_serie = $data['numero_serie'];
        $computadora->precio_costo = $data['precio_costo'];
        $computadora->precio_venta = $data['precio_venta'];
        $computadora->estado = 'disponible';

        // Campos opcionales
        $computadora->color = 'permuta';
        $computadora->bateria = null;
        $computadora->ram = 'permuta';
        $computadora->almacenamiento = 'permuta';
        $computadora->procedencia = 'permuta';

        $computadora->save();

        return response()->json($computadora);
    }

    public function habilitar(Computadora $computadora)
    {
        $computadora->update(['estado' => 'disponible']);
        return back()->with('success', 'Computadora habilitada para la venta.');
    }
}
