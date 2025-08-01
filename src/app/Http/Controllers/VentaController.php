<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\VentaItem;
use App\Models\ProductoApple;
use App\Models\Cliente;
use Illuminate\Support\Str;
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
            'productoApple',
            'entregadoCelular',
            'entregadoComputadora',
            'entregadoProductoGeneral',
            'entregadoProductoApple',
            'items',
            'items.celular',
            'items.computadora',
            'items.productoGeneral',
            'items.productoApple',
            'servicioTecnico', // ✅ Añade esta relación
        ])
            ->when(auth()->user()->rol === 'vendedor', function ($q) {
                $q->where('user_id', auth()->id());
            })
            ->orderBy('created_at', 'desc')
            ->get();

        if (auth()->user()->rol === 'admin') {
            return Inertia::render('Admin/Ventas/Index', [
                'ventas' => $ventas,
            ]);
        } else {
            return Inertia::render('Vendedor/Ventas/Index', [
                'ventas' => $ventas,
            ]);
        }
    }

    public function create()
    {
        $celulares = Celular::where('estado', 'disponible')->get();
        $computadoras = Computadora::where('estado', 'disponible')->get();
        $productosGenerales = ProductoGeneral::where('estado', 'disponible')->get();
        $productosApple = ProductoApple::where('estado', 'disponible')->get();

        $data = [
            'celulares' => $celulares,
            'computadoras' => $computadoras,
            'productosGenerales' => $productosGenerales,
            'productosApple' => $productosApple,
        ];

        if (auth()->user()->rol === 'admin') {
            return Inertia::render('Admin/Ventas/Create', $data);
        } else {
            return Inertia::render('Vendedor/Ventas/Create', $data);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre_cliente' => 'required|string',
            'telefono_cliente' => 'nullable|string',
            'codigo_nota' => 'required|string|max:10',
            'tipo_venta' => 'required|in:producto,servicio_tecnico',
            'es_permuta' => 'boolean',
            'tipo_permuta' => 'nullable|in:celular,computadora,producto_general',
            'metodo_pago' => 'required|in:efectivo,qr,tarjeta',
            'items' => 'required|array|min:1',
            'equipo' => 'required_if:tipo_venta,servicio_tecnico|string',
            'detalle_servicio' => 'required_if:tipo_venta,servicio_tecnico|string',
            'tecnico' => 'required_if:tipo_venta,servicio_tecnico|string',
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
                    $entregado = Celular::create(array_merge($permutaData, ['estado' => 'permuta']));
                    $entregado->refresh();
                    $permutaCosto = floatval($entregado->precio_costo);
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
                    $entregado = Computadora::create(array_merge($permutaData, ['estado' => 'permuta']));
                    $entregado->refresh();
                    $permutaCosto = floatval($entregado->precio_costo);
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
                    $entregado = ProductoGeneral::create(array_merge($permutaData, ['estado' => 'permuta']));
                    $entregado->refresh();
                    $permutaCosto = floatval($entregado->precio_costo);
                    break;
            }
        }

        // Cálculos de totales
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
            'codigo_nota' => $request->codigo_nota,
            'tipo_venta' => $request->tipo_venta,
            'es_permuta' => $request->es_permuta,
            'tipo_permuta' => $request->tipo_permuta,
            'precio_invertido' => $request->precio_invertido ?? 0,
            'precio_venta' => $request->precio_venta ?? 0,
            'descuento' => $request->descuento ?? 0,
            'subtotal' => $subtotal,
            'ganancia_neta' => $subtotal - ($request->descuento ?? 0) - ($aplicaPermuta ? $permutaCosto : 0) - ($request->precio_invertido ?? 0),
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

        // Crear los ítems vendidos
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

        // Cambiar estado de productos a "vendido"
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

        // Registrar también el servicio técnico si corresponde
        if ($request->tipo_venta === 'servicio_tecnico') {
            ServicioTecnico::create([
                'venta_id' => $venta->id,
                'cliente' => $request->nombre_cliente,
                'telefono' => $request->telefono_cliente,
                'equipo' => $request->equipo,
                'detalle_servicio' => $request->detalle_servicio,
                'precio_costo' => $request->precio_invertido ?? 0,
                'precio_venta' => $request->precio_venta ?? 0,
                'tecnico' => $request->tecnico,
                'codigo_nota' => $request->codigo_nota,
                'fecha' => now('America/La_Paz'),
                'user_id' => auth()->id(),
            ]);
        }

        // Crear cliente si no existe
        if ($venta->telefono_cliente) {
            $clienteExistente = Cliente::where('telefono', $venta->telefono_cliente)->first();
            if (!$clienteExistente) {
                Cliente::create([
                    'user_id' => $venta->user_id,
                    'nombre' => Str::title(trim($venta->nombre_cliente)),
                    'telefono' => $venta->telefono_cliente,
                    'correo' => null,
                    'documento' => null,
                ]);
            }
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
            'items.productoApple',
            'vendedor',
            'entregadoCelular',
            'entregadoComputadora',
            'entregadoProductoGeneral',
            'entregadoProductoApple',
        ]);

        $sumaSubtotalItems = $venta->items->sum('subtotal');
        $valorPermuta = $venta->valor_permuta ?? 0;
        $totalAPagar = $sumaSubtotalItems - $valorPermuta;

        return PDF::loadView('pdf.boleta', compact('venta', 'sumaSubtotalItems', 'valorPermuta', 'totalAPagar'))
            ->stream("boleta-venta-{$venta->id}.pdf");
    }


    public function exportarVentasVendedor(Request $request)
    {
        $fechaInicio = $request->input('fecha_inicio') ?? now()->startOfMonth()->toDateString();
        $fechaFin = $request->input('fecha_fin') ?? now()->endOfMonth()->toDateString();

        $ventas = Venta::with([
            'items.celular',
            'items.computadora',
            'items.productoGeneral',
            'items.productoApple',
            'vendedor'
        ])
            ->where('user_id', auth()->id())
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->orderBy('fecha', 'desc')
            ->get();

        $pdf = PDF::loadView('pdf.ventas_vendedor', [
            'ventas' => $ventas,
            'vendedor' => auth()->user(),
            'fechaInicio' => $fechaInicio,
            'fechaFin' => $fechaFin,
        ]);

        return $pdf->stream("ventas-vendedor.pdf");
    }

    public function buscarNota(Request $request)
    {
        try {
            $query = trim($request->input('codigo_nota'));

            if ($query === '') {
                return response()->json([]);
            }

            // Buscar servicios técnicos válidos
            $serviciosRaw = \App\Models\ServicioTecnico::with('vendedor')
                ->whereNotNull('codigo_nota')
                ->where(function ($q) use ($query) {
                    $q->where('codigo_nota', 'ILIKE', "%{$query}%")
                        ->orWhere('cliente', 'ILIKE', "%{$query}%");
                })
                ->get();

            // Obtener códigos ya usados en servicio técnico
            $codigosST = $serviciosRaw->pluck('codigo_nota')->unique()->toArray();

            // Buscar ventas válidas que no estén repetidas
            $ventasRaw = \App\Models\Venta::with('vendedor')
                ->whereNotNull('codigo_nota')
                ->whereNotIn('codigo_nota', $codigosST)
                ->where(function ($q) use ($query) {
                    $q->where('codigo_nota', 'ILIKE', "%{$query}%")
                        ->orWhere('nombre_cliente', 'ILIKE', "%{$query}%");
                })
                ->get();

            // Mapear servicios técnicos
            $servicios = $serviciosRaw->map(function ($s) {
                return [
                    'id' => 'st-' . $s->id,
                    'id_real' => $s->id, // 👈 nuevo
                    'codigo_nota' => $s->codigo_nota,
                    'nombre_cliente' => $s->cliente,
                    'tipo' => 'servicio_tecnico',
                    'tipo_venta' => 'servicio_tecnico',
                    'created_at' => $s->created_at,
                    'vendedor' => $s->vendedor?->name ?? null,
                ];
            });

            // Mapear ventas
            $ventas = $ventasRaw->map(function ($v) {
                return [
                    'id' => 'v-' . $v->id,
                    'id_real' => $v->id, // 👈 nuevo
                    'codigo_nota' => $v->codigo_nota,
                    'nombre_cliente' => $v->nombre_cliente,
                    'tipo' => 'venta',
                    'tipo_venta' => 'producto',
                    'created_at' => $v->created_at,
                    'vendedor' => $v->vendedor?->name ?? null,
                ];
            });
            // Unir y retornar correctamente
            return response()->json(
                $servicios->concat($ventas)->sortByDesc('created_at')->values()
            );
        } catch (\Throwable $e) {
            \Log::error('❌ Error en buscarNota: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Error interno al buscar nota.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function buscarSoloVentas(Request $request)
    {
        $query = trim($request->input('codigo_nota'));

        if ($query === '') {
            return response()->json([]);
        }

        $ventas = \App\Models\Venta::select('id', 'codigo_nota', 'nombre_cliente', 'created_at')
            ->whereNotNull('codigo_nota')
            ->where(function ($q) use ($query) {
                $q->where('codigo_nota', 'ILIKE', "%{$query}%")
                    ->orWhere('nombre_cliente', 'ILIKE', "%{$query}%");
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($v) {
                return [
                    'id' => $v->id,
                    'codigo_nota' => $v->codigo_nota,
                    'nombre_cliente' => $v->nombre_cliente,
                    'tipo' => 'venta',
                    'created_at' => $v->created_at,
                ];
            });

        return response()->json($ventas);
    }
}
