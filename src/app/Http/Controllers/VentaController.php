<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\VentaItem;
use Barryvdh\DomPDF\Facade\Pdf;

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
            'entregadoProductoGeneral',
            'items'
        ])->orderBy('created_at', 'desc')->get();

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
            'metodo_pago' => 'required|in:efectivo,qr,tarjeta',
            'items' => 'required|array|min:1',
        ]);
    
        $permutaCosto = 0;
        $entregado = null;
    
        if ($request->es_permuta && $request->has('producto_entregado')) {
            $permutaData = $request->producto_entregado;
    
            switch ($request->tipo_permuta) {
                case 'celular':
                    $request->validate([
                        'producto_entregado.modelo' => 'required|string',
                        'producto_entregado.capacidad' => 'required|string',
                        'producto_entregado.color' => 'required|string',
                        'producto_entregado.bateria' => 'required|string',
                        'producto_entregado.imei_1' => 'required|string|max:15|unique:celulares,imei_1',
                        'producto_entregado.imei_2' => 'nullable|string|max:15|unique:celulares,imei_2',
                        'producto_entregado.procedencia' => 'required|string',
                        'producto_entregado.estado_imei' => 'required|string',
                        'producto_entregado.precio_costo' => 'required|numeric',
                        'producto_entregado.precio_venta' => 'required|numeric',
                    ]);
                    $permutaCosto = $permutaData['precio_costo'];
                    $entregado = Celular::create(array_merge($permutaData, ['estado' => 'permuta']));
                    break;
    
                case 'computadora':
                    $request->validate([
                        'producto_entregado.nombre' => 'required|string',
                        'producto_entregado.procesador' => 'nullable|string',
                        'producto_entregado.numero_serie' => 'required|string|unique:computadoras,numero_serie',
                        'producto_entregado.bateria' => 'required|string',
                        'producto_entregado.ram' => 'required|string',
                        'producto_entregado.almacenamiento' => 'required|string',
                        'producto_entregado.color' => 'required|string',
                        'producto_entregado.procedencia' => 'required|string',
                        'producto_entregado.precio_costo' => 'required|numeric',
                        'producto_entregado.precio_venta' => 'required|numeric',
                    ]);
                    $permutaCosto = $permutaData['precio_costo'];
                    $entregado = Computadora::create(array_merge($permutaData, ['estado' => 'permuta']));
                    break;
    
                case 'producto_general':
                    $request->validate([
                        'producto_entregado.tipo' => 'required|string',
                        'producto_entregado.nombre' => 'required|string',
                        'producto_entregado.codigo' => 'required|string|unique:producto_generals,codigo',
                        'producto_entregado.procedencia' => 'required|string',
                        'producto_entregado.precio_costo' => 'required|numeric',
                        'producto_entregado.precio_venta' => 'required|numeric',
                    ]);
                    $permutaCosto = $permutaData['precio_costo'];
                    $entregado = ProductoGeneral::create(array_merge($permutaData, ['estado' => 'permuta']));
                    break;
            }
        }
    
        $subtotal = 0;
        $ganancia = 0;
        $aplicaPermuta = false;
    
        foreach ($request->items as $item) {
            $subtotal += $item['subtotal'];
            $ganancia += ($item['subtotal'] - $item['precio_invertido']);
    
            if (in_array($item['tipo'], ['celular', 'computadora'])) {
                $aplicaPermuta = true;
            }
        }
    
        $venta = Venta::create([
            'nombre_cliente' => $request->nombre_cliente,
            'telefono_cliente' => $request->telefono_cliente,
            'tipo_venta' => $request->tipo_venta,
            'es_permuta' => $request->es_permuta,
            'tipo_permuta' => $request->tipo_permuta,
            'precio_invertido' => $request->precio_invertido ?? 0,
            'precio_venta' => $request->precio_venta ?? 0,
            'descuento' => $request->descuento ?? 0,
            'subtotal' => $subtotal,
            'ganancia_neta' => $subtotal
                - ($request->descuento ?? 0)
                - ($aplicaPermuta ? $permutaCosto : 0)
                - ($request->precio_invertido ?? 0),
            'valor_permuta' => $permutaCosto,
            'metodo_pago' => $request->metodo_pago,
            'tarjeta_inicio' => $request->tarjeta_inicio,
            'tarjeta_fin' => $request->tarjeta_fin,
            'notas_adicionales' => $request->notas_adicionales,
            'celular_id' => $request->celular_id,
            'computadora_id' => $request->computadora_id,
            'producto_general_id' => $request->producto_general_id,
            'entregado_celular_id' => $request->tipo_permuta === 'celular' ? $entregado?->id : null,
            'entregado_computadora_id' => $request->tipo_permuta === 'computadora' ? $entregado?->id : null,
            'entregado_producto_general_id' => $request->tipo_permuta === 'producto_general' ? $entregado?->id : null,
            'user_id' => auth()->id(),
            'fecha' => now('America/La_Paz'),
        ]);
    
        foreach ($request->items as $item) {
            $venta->items()->create([
                'tipo' => $item['tipo'],
                'producto_id' => $item['producto_id'],
                'cantidad' => $item['cantidad'],
                'precio_venta' => $item['precio_venta'],
                'precio_invertido' => $item['precio_invertido'],
                'descuento' => $item['descuento'],
                'subtotal' => $item['subtotal'],
            ]);
        }
    
        foreach ($request->items as $item) {
            $modelo = match ($item['tipo']) {
                'celular' => Celular::class,
                'computadora' => Computadora::class,
                'producto_general' => ProductoGeneral::class,
                default => null,
            };
    
            if ($modelo) {
                $producto = $modelo::find($item['producto_id']);
                if ($producto) {
                    $producto->estado = 'vendido';
                    $producto->save();
                }
            }
        }

        if ($request->tipo_venta === 'servicio_tecnico') {
            $venta->items()->create([
                'tipo' => 'servicio',
                'producto_id' => null,
                'cantidad' => 1,
                'precio_venta' => $request->precio_venta ?? 0,
                'precio_invertido' => $request->precio_invertido ?? 0,
                'descuento' => $request->descuento ?? 0,
                'subtotal' => $subtotal,
            ]);
        }
        
    
        return response()->json([
            'message' => 'Venta registrada con éxito',
            'venta_id' => $venta->id,
        ]);
    }    

    public function boleta(Venta $venta)
    {
        $venta->load([
            'items',
            'items.celular',
            'items.computadora',
            'items.productoGeneral',
            'vendedor',
            'entregadoCelular',
            'entregadoComputadora',
            'entregadoProductoGeneral',
        ]);

        $pdf = PDF::loadView('pdf.boleta', compact('venta'));
        return $pdf->stream("boleta-venta-{$venta->id}.pdf");
    }
}
