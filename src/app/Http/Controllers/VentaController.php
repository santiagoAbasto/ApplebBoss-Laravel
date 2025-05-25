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
        $ventas = Venta::with([
            'vendedor',
            'celular',
            'computadora',
            'productoGeneral',
            'entregadoCelular',
            'entregadoComputadora',
            'entregadoProductoGeneral'
        ])
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
            'telefono_cliente' => 'nullable|string',
            'tipo_venta' => 'required|in:producto,servicio_tecnico',
            'es_permuta' => 'boolean',
            'tipo_permuta' => 'nullable|in:celular,computadora,producto_general',
            'precio_venta' => 'required|numeric',
            'precio_invertido' => 'required|numeric',
            'cantidad' => 'required|numeric|min:1',
            'descuento' => 'nullable|numeric|min:0',
            'metodo_pago' => 'required|in:efectivo,qr,tarjeta',
        ]);

        $permutaCosto = 0;
        $entregado = null;

        if ($request->es_permuta && $request->has('permuta')) {
            switch ($request->tipo_permuta) {
                case 'celular':
                    $request->validate([
                        'permuta.modelo' => 'required|string',
                        'permuta.capacidad' => 'required|string',
                        'permuta.color' => 'required|string',
                        'permuta.bateria' => 'required|string',
                        'permuta.imei_1' => 'required|string|max:15|unique:celulares,imei_1',
                        'permuta.imei_2' => 'nullable|string|max:15|unique:celulares,imei_2',
                        'permuta.procedencia' => 'required|string',
                        'permuta.estado_imei' => 'required|string',
                        'permuta.precio_costo' => 'required|numeric',
                        'permuta.precio_venta' => 'required|numeric',
                    ]);
                    $permutaCosto = $request->permuta['precio_costo'];
                    $entregado = Celular::create(array_merge($request->permuta, ['estado' => 'permuta']));
                    break;

                case 'computadora':
                    $request->validate([
                        'permuta.nombre' => 'required|string',
                        'permuta.procesador' => 'nullable|string',
                        'permuta.numero_serie' => 'required|string|unique:computadoras,numero_serie',
                        'permuta.bateria' => 'required|string',
                        'permuta.ram' => 'required|string',
                        'permuta.almacenamiento' => 'required|string',
                        'permuta.color' => 'required|string',
                        'permuta.procedencia' => 'required|string',
                        'permuta.precio_costo' => 'required|numeric',
                        'permuta.precio_venta' => 'required|numeric',
                    ]);
                    $permutaCosto = $request->permuta['precio_costo'];
                    $entregado = Computadora::create(array_merge($request->permuta, ['estado' => 'permuta']));
                    break;

                case 'producto_general':
                    $request->validate([
                        'permuta.tipo' => 'required|string',
                        'permuta.nombre' => 'required|string',
                        'permuta.codigo' => 'required|string|unique:producto_generals,codigo',
                        'permuta.procedencia' => 'required|string',
                        'permuta.precio_costo' => 'required|numeric',
                        'permuta.precio_venta' => 'required|numeric',
                    ]);
                    $permutaCosto = $request->permuta['precio_costo'];
                    $entregado = ProductoGeneral::create(array_merge($request->permuta, ['estado' => 'permuta']));
                    break;
            }
        }

        $cantidad = $request->cantidad;
        $precioVenta = $request->precio_venta;
        $precioCosto = $request->precio_invertido;
        $descuento = $request->descuento ?? 0;

        $subtotal = $request->es_permuta
            ? max(0, $precioVenta - $permutaCosto - $descuento)
            : ($precioVenta * $cantidad) - $descuento;

        $ganancia = $request->es_permuta
            ? ($subtotal - $precioCosto)
            : ($precioVenta - $precioCosto) * $cantidad;

        // 🟢 Garantizar zona horaria Bolivia para reportes por día
        $request->merge(['fecha' => now('America/La_Paz')]);

        $venta = Venta::create([
            ...$request->only([
                'nombre_cliente',
                'telefono_cliente',
                'tipo_venta',
                'es_permuta',
                'tipo_permuta',
                'cantidad',
                'precio_invertido',
                'precio_venta',
                'descuento',
                'metodo_pago',
                'inicio_tarjeta',
                'fin_tarjeta',
                'notas_adicionales',
                'fecha',
            ]),
            'user_id' => auth()->id(),
            'ganancia_neta' => $ganancia,
            'subtotal' => $subtotal,
            'celular_id' => $request->celular_id,
            'computadora_id' => $request->computadora_id,
            'producto_general_id' => $request->producto_general_id,
            'entregado_celular_id' => $request->tipo_permuta === 'celular' ? $entregado?->id : null,
            'entregado_computadora_id' => $request->tipo_permuta === 'computadora' ? $entregado?->id : null,
            'entregado_producto_general_id' => $request->tipo_permuta === 'producto_general' ? $entregado?->id : null,
        ]);

        // Marcar el producto vendido como 'vendido'
        if ($request->celular_id) {
            Celular::where('id', $request->celular_id)->update(['estado' => 'vendido']);
        }
        if ($request->computadora_id) {
            Computadora::where('id', $request->computadora_id)->update(['estado' => 'vendido']);
        }
        if ($request->producto_general_id) {
            ProductoGeneral::where('id', $request->producto_general_id)->update(['estado' => 'vendido']);
        }

        return redirect()->route('admin.ventas.index')->with('success', 'Venta registrada correctamente.');
    }
}
