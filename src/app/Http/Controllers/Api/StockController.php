<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use App\Models\ReservaItem;

class StockController extends Controller
{
    private function idsReservados(string $tipo)
    {
        return ReservaItem::where('tipo', $tipo)
            ->whereHas('reserva', fn($q) => $q->where('estado', 'activa'))
            ->pluck('producto_id');
    }

    public function celulares()
    {
        return response()->json(Celular::where('estado', 'disponible')
            ->whereNotIn('id', $this->idsReservados('celular'))
            ->get());
    }

    public function computadoras()
    {
        return response()->json(Computadora::where('estado', 'disponible')
            ->whereNotIn('id', $this->idsReservados('computadora'))
            ->get());
    }

    public function productosGenerales()
    {
        return response()->json(ProductoGeneral::where('estado', 'disponible')
            ->whereNotIn('id', $this->idsReservados('producto_general'))
            ->get());
    }

    public function productosApple()
    {
        return response()->json(ProductoApple::where('estado', 'disponible')
            ->whereNotIn('id', $this->idsReservados('producto_apple'))
            ->get());
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

        // Buscar en productos Apple (IMEI 1, IMEI 2, número de serie o modelo exacto)
        $apple = ProductoApple::where(function ($q) use ($codigo) {
            $q->where('imei_1', $codigo)
              ->orWhere('imei_2', $codigo)
              ->orWhere('numero_serie', $codigo)
              ->orWhere('modelo', $codigo);
        })
        ->where('estado', 'disponible')
        ->whereNotIn('id', $this->idsReservados('producto_apple'))
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
        ->whereNotIn('id', $this->idsReservados('celular'))
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

        // Buscar en computadoras (número de serie o nombre exacto)
        $computadora = Computadora::where(function ($q) use ($codigo) {
            $q->where('numero_serie', $codigo)
              ->orWhere('nombre', $codigo);
        })
            ->where('estado', 'disponible')
            ->whereNotIn('id', $this->idsReservados('computadora'))
            ->first();

        if ($computadora) {
            return response()->json([
                'tipo' => 'computadora',
                'producto' => [
                    'id' => $computadora->id,
                    'nombre' => $computadora->nombre,
                    'precio_venta' => $computadora->precio_venta,
                    'precio_costo' => $computadora->precio_costo,
                    'stock' => 1,
                    'estado' => $computadora->estado,
                ]
            ]);
        }

        // Buscar en productos generales (código o nombre exacto)
        $pg = ProductoGeneral::where(function ($q) use ($codigo) {
            $q->where('codigo', $codigo)
              ->orWhere('nombre', $codigo);
        })
            ->where('estado', 'disponible')
            ->whereNotIn('id', $this->idsReservados('producto_general'))
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
