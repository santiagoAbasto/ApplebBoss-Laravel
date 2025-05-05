<?php

namespace App\Http\Controllers;

use App\Models\Celular;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CelularController extends Controller
{
    public function index()
    {
        $celulares = Celular::orderBy('created_at', 'desc')->get();
        return Inertia::render('Admin/Celulares/Index', [
            'celulares' => $celulares,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Celulares/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'modelo' => 'required|string|max:255',
            'capacidad' => 'required|string|max:100',
            'color' => 'required|string|max:100',
            'bateria' => 'nullable|string|max:100',
            'imei_1' => 'required|string|unique:celulares,imei_1',
            'imei_2' => 'nullable|string|unique:celulares,imei_2',
            'estado_imei' => 'required|in:libre,registrado,imei1_libre_imei2_registrado,imei1_registrado_imei2_libre',
            'procedencia' => 'required|string|max:100',
            'precio_costo' => 'required|numeric',
            'precio_venta' => 'required|numeric',
            'estado' => 'required|in:disponible,vendido,permuta',
        ]);

        Celular::create($request->all());

        return redirect()->route('admin.celulares.index')->with('success', 'Celular registrado correctamente.');
    }

    public function show(Celular $celular)
    {
        return Inertia::render('Admin/Celulares/Show', [
            'celular' => $celular,
        ]);
    }

    public function edit(Celular $celular)
    {
        return Inertia::render('Admin/Celulares/Edit', [
            'celular' => $celular,
        ]);
    }

    public function update(Request $request, Celular $celular)
    {
        $request->validate([
            'modelo' => 'required|string|max:255',
            'capacidad' => 'required|string|max:100',
            'color' => 'required|string|max:100',
            'bateria' => 'nullable|string|max:100',
            'imei_1' => 'required|string|unique:celulares,imei_1,' . $celular->id,
            'imei_2' => 'nullable|string|unique:celulares,imei_2,' . $celular->id,
            'estado_imei' => 'required|in:libre,registrado,imei1_libre_imei2_registrado,imei1_registrado_imei2_libre',
            'procedencia' => 'required|string|max:100',
            'precio_costo' => 'required|numeric',
            'precio_venta' => 'required|numeric',
            'estado' => 'required|in:disponible,vendido,permuta',
        ]);

        $celular->update($request->all());

        return redirect()->route('admin.celulares.index')->with('success', 'Celular actualizado correctamente.');
    }

    public function destroy(Celular $celular)
    {
        $celular->delete();
        return redirect()->route('admin.celulares.index')->with('success', 'Celular eliminado correctamente.');
    }
}
