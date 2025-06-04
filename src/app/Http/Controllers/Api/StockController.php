<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;

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

    public function productosApple()
    {
        return response()->json(ProductoApple::where('estado', 'disponible')->get());
    }

    /**
     * Buscar un producto disponible en stock por código / serie / IMEI.
     * Soporta búsqueda en celulares, computadoras, productos Apple y generales.
     */
    public function buscarPorCodigo(Request $request)
    {
        $codigo = $request->input('codigo');

        if (!$codigo) {
            return response()->json(['error' => 'Código no proporcionado.'], 400);
        }

        // Buscar en productos Apple (IMEI 1, IMEI 2 o número de serie)
        $apple = ProductoApple::where(function ($q) use ($codigo) {
            $q->where('imei_1', $codigo)
              ->orWhere('imei_2', $codigo)
              ->orWhere('numero_serie', $codigo);
        })
        ->where('estado', 'disponible')
        ->first();

        if ($apple) {
            return response()->json([
                'tipo' => 'producto_apple',
                'producto' => [
                    'id' => $apple->id,
                    'nombre' => $apple->modelo,
                    'precio_venta' => $apple->precio_venta,
                    'precio_costo' => $apple->precio_costo,
                    'stock' => 1,
                    'estado' => $apple->estado,
                ]
            ]);
        }

        // Buscar en celulares (IMEI 1 o 2)
        $celular = Celular::where(function ($q) use ($codigo) {
            $q->where('imei_1', $codigo)
              ->orWhere('imei_2', $codigo);
        })
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

        // Buscar en productos generales (código exacto)
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
