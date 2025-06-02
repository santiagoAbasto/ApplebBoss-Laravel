<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;

class StockController extends Controller
{
    public function celulares()
    {
        return response()->json(Celular::where('estado', 'disponible')->get());
    }

    public function computadoras()
    {
        return response()->json(Computadora::where('estado', 'disponible')->get());
    }

    public function productosGenerales()
    {
        return response()->json(ProductoGeneral::where('estado', 'disponible')->get());
    }

    /**
     * Buscar un producto en stock por código.
     */
    public function buscarPorCodigo(Request $request)
    {
        $codigo = $request->input('codigo');

        if (!$codigo) {
            return response()->json(['error' => 'Código no proporcionado.'], 400);
        }

        // Buscar en celulares (IMEI 1 o 2)
        $celular = Celular::where('imei_1', $codigo)
            ->orWhere('imei_2', $codigo)
            ->where('estado', 'disponible')
            ->first();

        if ($celular) {
            return response()->json([
                'tipo' => 'celular',
                'producto' => [
                    'id' => $celular->id,
                    'nombre' => $celular->modelo,
                    'precio_venta' => $celular->precio_venta,
                    'precio_costo' => $celular->precio_costo,
                    'stock' => 1,
                    'estado' => $celular->estado,
                ]
            ]);
        }

        // Buscar en computadoras (número de serie)
        $computadora = Computadora::where('numero_serie', $codigo)
            ->where('estado', 'disponible')
            ->first();

        if ($computadora) {
            return response()->json([
                'tipo' => 'computadora',
                'producto' => [
                    'id' => $computadora->id,
                    'nombre' => $computadora->modelo,
                    'precio_venta' => $computadora->precio_venta,
                    'precio_costo' => $computadora->precio_costo,
                    'stock' => 1,
                    'estado' => $computadora->estado,
                ]
            ]);
        }

        // Buscar en productos generales (código)
        $pg = ProductoGeneral::where('codigo', $codigo)
            ->where('estado', 'disponible')
            ->first();

        if ($pg) {
            return response()->json([
                'tipo' => 'producto_general',
                'producto' => [
                    'id' => $pg->id,
                    'nombre' => $pg->nombre,
                    'precio_venta' => $pg->precio_venta,
                    'precio_costo' => $pg->precio_costo,
                    'stock' => $pg->stock,
                    'estado' => $pg->estado,
                ]
            ]);
        }

        return response()->json(['error' => 'Producto no encontrado.'], 404);
    }
}
