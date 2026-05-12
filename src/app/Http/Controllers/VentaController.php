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
use App\Models\ServicioTecnico;
use App\Services\GeneradorCodigos;
use Illuminate\Support\Facades\DB;
use App\Models\SystemNotification;
use Illuminate\Support\Facades\Schema;



class VentaController extends Controller
{
    private function authorizeVentaAccess(Venta $venta): void
    {
        if (auth()->user()->rol === 'vendedor' && (int) $venta->user_id !== (int) auth()->id()) {
            abort(404);
        }
    }

    private function ventaEditSnapshot(Venta $venta): array
    {
        $venta->loadMissing(['items', 'servicioTecnico']);

        return [
            'cliente' => $venta->nombre_cliente,
            'telefono' => $venta->telefono_cliente,
            'metodo_pago' => $venta->metodo_pago,
            'tarjeta' => $venta->metodo_pago === 'tarjeta'
                ? trim(($venta->inicio_tarjeta ?? '----') . '...' . ($venta->fin_tarjeta ?? '----'))
                : null,
            'descuento' => (float) ($venta->descuento ?? 0),
            'valor_permuta' => (float) ($venta->valor_permuta ?? 0),
            'subtotal' => (float) ($venta->subtotal ?? 0),
            'capital' => (float) ($venta->precio_invertido ?? 0),
            'ganancia' => (float) ($venta->ganancia_neta ?? 0),
            'notas' => $venta->notas_adicionales,
            'servicio' => $venta->servicioTecnico ? [
                'equipo' => $venta->servicioTecnico->equipo,
                'detalle' => $venta->servicioTecnico->detalle_servicio,
                'tecnico' => $venta->servicioTecnico->tecnico,
                'costo' => (float) ($venta->servicioTecnico->precio_costo ?? 0),
                'venta' => (float) ($venta->servicioTecnico->precio_venta ?? 0),
            ] : null,
            'items' => $venta->items->mapWithKeys(function ($item) {
                return [
                    $item->id => [
                        'producto' => $item->nombre_producto ?: $item->modelo ?: ($item->tipo . ' #' . $item->producto_id),
                        'cantidad' => (int) $item->cantidad,
                        'precio_venta' => (float) ($item->precio_venta ?? 0),
                        'precio_invertido' => (float) ($item->precio_invertido ?? 0),
                        'descuento' => (float) ($item->descuento ?? 0),
                        'subtotal' => (float) ($item->subtotal ?? 0),
                    ],
                ];
            })->all(),
        ];
    }

    private function formatSnapshotValue($value, ?bool $asMoney = null): string
    {
        if ($asMoney ?? is_float($value)) {
            return 'Bs ' . number_format((float) $value, 2);
        }

        if ($value === null || $value === '') {
            return 'vacío';
        }

        return (string) $value;
    }

    private function buildVentaEditChanges(array $before, array $after): array
    {
        $labels = [
            'cliente' => 'Cliente',
            'telefono' => 'Teléfono',
            'metodo_pago' => 'Método de pago',
            'tarjeta' => 'Tarjeta',
            'descuento' => 'Descuento',
            'valor_permuta' => 'Valor permuta',
            'subtotal' => 'Subtotal',
            'capital' => 'Capital',
            'ganancia' => 'Ganancia',
            'notas' => 'Notas',
        ];

        $changes = [];

        foreach ($labels as $key => $label) {
            if (($before[$key] ?? null) != ($after[$key] ?? null)) {
                $changes[] = $label . ': ' .
                    $this->formatSnapshotValue($before[$key] ?? null) .
                    ' → ' .
                    $this->formatSnapshotValue($after[$key] ?? null);
            }
        }

        foreach (($after['servicio'] ?? []) ?: [] as $key => $value) {
            if (($before['servicio'][$key] ?? null) != $value) {
                $changes[] = 'Servicio ' . $key . ': ' .
                    $this->formatSnapshotValue($before['servicio'][$key] ?? null) .
                    ' → ' .
                    $this->formatSnapshotValue($value);
            }
        }

        foreach (($after['items'] ?? []) as $id => $itemAfter) {
            $itemBefore = $before['items'][$id] ?? [];
            foreach (['cantidad', 'precio_venta', 'precio_invertido', 'descuento', 'subtotal'] as $key) {
                if (($itemBefore[$key] ?? null) != ($itemAfter[$key] ?? null)) {
                    $isMoney = $key !== 'cantidad';
                    $changes[] = ($itemAfter['producto'] ?? 'Item #' . $id) . ' - ' . str_replace('_', ' ', $key) . ': ' .
                        $this->formatSnapshotValue($itemBefore[$key] ?? null, $isMoney) .
                        ' → ' .
                        $this->formatSnapshotValue($itemAfter[$key] ?? null, $isMoney);
                }
            }
        }

        return $changes;
    }

    private function notifyAdminSaleEditedBySeller(Venta $venta, array $before, array $after): void
    {
        if (auth()->user()->rol !== 'vendedor' || ! Schema::hasTable('system_notifications')) {
            return;
        }

        $changes = $this->buildVentaEditChanges($before, $after);

        SystemNotification::create([
            'type' => 'sale_edit',
            'title' => 'Venta editada por vendedor',
            'message' => auth()->user()->name .
                ' editó la venta ' .
                ($venta->codigo_nota ?? '#' . $venta->id) .
                ".\nCambios:\n- " .
                implode("\n- ", $changes ?: ['Sin cambios detectables en campos auditados.']),
        ]);
    }

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
            'tipo_venta' => 'required|in:producto,servicio_tecnico',
            'es_permuta' => 'boolean',
            'tipo_permuta' => 'nullable|in:celular,computadora,producto_general',
            'metodo_pago' => 'required|in:efectivo,qr,tarjeta',
            'inicio_tarjeta' => 'required_if:metodo_pago,tarjeta|nullable|digits:4',
            'fin_tarjeta' => 'required_if:metodo_pago,tarjeta|nullable|digits:4',
            'items' => 'required|array|min:1',
            'equipo' => 'required_if:tipo_venta,servicio_tecnico|string',
            'detalle_servicio' => 'required_if:tipo_venta,servicio_tecnico|string',
            'tecnico' => 'required_if:tipo_venta,servicio_tecnico|string',
        ]);

        return DB::transaction(function () use ($request) {

            $permutaCosto = 0;
            $entregado = null;

            /* ======================================================
         * 1) PERMUTA (MISMAS VALIDACIONES COMPLETAS)
         * ====================================================== */
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

            /* ======================================================
         * 2) CÁLCULOS (IGUAL QUE TU CÓDIGO)
         * ====================================================== */
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

            /* ======================================================
         * 3) CÓDIGO CORRELATIVO VENTA (AT-V###)
         * ====================================================== */
            $venta = GeneradorCodigos::crearVentaConCodigo(function (string $codigoVenta) use ($request, $subtotal, $aplicaPermuta, $permutaCosto, $entregado) {
                return Venta::create([
                    'codigo_nota' => $codigoVenta,

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
                    'inicio_tarjeta' => $request->metodo_pago === 'tarjeta' ? $request->inicio_tarjeta : null,
                    'fin_tarjeta' => $request->metodo_pago === 'tarjeta' ? $request->fin_tarjeta : null,
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
            });
            $codigoVenta = $venta->codigo_nota;
            /* ======================================================
 * 5) CREAR ITEMS (CON SNAPSHOT BI PROFESIONAL)
 * ====================================================== */
            foreach ($request->items as $item) {

                $snapshot = [
                    'categoria' => null,
                    'nombre_producto' => null,
                    'modelo' => null,
                    'capacidad' => null,
                    'color' => null,
                    'bateria' => null,
                    'procesador' => null,
                    'ram' => null,
                    'almacenamiento' => null,
                ];

                switch ($item['tipo']) {

                    /* =========================
         * 📱 CELULAR
         * ========================= */
                    case 'celular':
                        $producto = Celular::findOrFail($item['producto_id']);

                        $snapshot['categoria'] = 'celulares';
                        $snapshot['nombre_producto'] = $producto->modelo;
                        $snapshot['modelo'] = $producto->modelo;
                        $snapshot['capacidad'] = $producto->capacidad;
                        $snapshot['color'] = $producto->color;
                        $snapshot['bateria'] = $producto->bateria;
                        break;

                    /* =========================
         * 💻 COMPUTADORA
         * ========================= */
                    case 'computadora':
                        $producto = Computadora::findOrFail($item['producto_id']);

                        $snapshot['categoria'] = 'computadoras';
                        $snapshot['nombre_producto'] = $producto->nombre;
                        $snapshot['modelo'] = $producto->nombre;
                        $snapshot['procesador'] = $producto->procesador;
                        $snapshot['ram'] = $producto->ram;
                        $snapshot['almacenamiento'] = $producto->almacenamiento;
                        break;

                    /* =========================
         * 📦 PRODUCTO GENERAL
         * ========================= */
                    case 'producto_general':
                        $producto = ProductoGeneral::findOrFail($item['producto_id']);

                        $snapshot['categoria'] = $producto->tipo; // vidrio, funda, cable, etc.
                        $snapshot['nombre_producto'] = $producto->nombre;
                        break;

                    /* =========================
         * 🍎 PRODUCTO APPLE
         * ========================= */
                    case 'producto_apple':
                        $producto = ProductoApple::findOrFail($item['producto_id']);

                        $snapshot['categoria'] = 'productos_apple';
                        $snapshot['nombre_producto'] = $producto->modelo;
                        $snapshot['modelo'] = $producto->modelo;
                        $snapshot['capacidad'] = $producto->capacidad;
                        $snapshot['color'] = $producto->color;
                        $snapshot['bateria'] = $producto->bateria;
                        break;
                }

                $venta->items()->create(array_merge([
                    'tipo' => $item['tipo'],
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_venta' => $item['precio_venta'],
                    'precio_invertido' => $item['precio_invertido'],
                    'descuento' => $item['descuento'],
                    'subtotal' => $item['subtotal'],
                ], $snapshot));
            }


            /* ======================================================
         * 6) CAMBIAR ESTADO A VENDIDO (INCLUYE APPLE)
         * ====================================================== */
            foreach ($request->items as $item) {
                $modelo = match ($item['tipo']) {
                    'celular' => Celular::class,
                    'computadora' => Computadora::class,
                    'producto_general' => ProductoGeneral::class,
                    'producto_apple' => ProductoApple::class,
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

            /* ======================================================
         * 7) SERVICIO TÉCNICO (USANDO GENERADOR AT-ST###)
         * ====================================================== */
            if ($request->tipo_venta === 'servicio_tecnico') {
                GeneradorCodigos::crearServicioTecnicoConCodigo(function (string $codigoServicio) use ($request, $venta) {
                    ServicioTecnico::create([
                        'venta_id' => $venta->id,
                        'codigo_nota' => $codigoServicio,
                        'cliente' => $request->nombre_cliente,
                        'telefono' => $request->telefono_cliente,
                        'equipo' => $request->equipo,
                        'detalle_servicio' => $request->detalle_servicio,
                        'precio_costo' => $request->precio_invertido ?? 0,
                        'precio_venta' => $request->precio_venta ?? 0,
                        'tecnico' => $request->tecnico,
                        'fecha' => now('America/La_Paz'),
                        'user_id' => auth()->id(),
                    ]);
                });
            }

            /* ======================================================
         * 8) CREAR CLIENTE SI NO EXISTE (MISMA LÓGICA)
         * ====================================================== */
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

            if (Schema::hasTable('system_notifications')) {
                SystemNotification::create([
                    'type' => 'sale',
                    'title' => 'Nueva venta registrada',
                    'message' =>
                    auth()->user()->name .
                        ' vendió por Bs ' .
                        number_format($subtotal, 2) .
                        ' (' . $codigoVenta . ')',
                ]);
            }

            return response()->json([
                'message' => 'Venta registrada con éxito',
                'venta_id' => $venta->id,
            ]);
        });
    }

    public function edit(Venta $venta)
    {
        $this->authorizeVentaAccess($venta);

        $venta->load([
            'vendedor',
            'items',
            'items.celular',
            'items.computadora',
            'items.productoGeneral',
            'items.productoApple',
            'servicioTecnico',
            'entregadoCelular',
            'entregadoComputadora',
            'entregadoProductoGeneral',
            'entregadoProductoApple',
        ]);

        if (auth()->user()->rol === 'admin') {
            return Inertia::render('Admin/Ventas/Edit', [
                'venta' => $venta,
            ]);
        }

        return Inertia::render('Vendedor/Ventas/Edit', [
            'venta' => $venta,
        ]);
    }

    public function update(Request $request, Venta $venta)
    {
        $this->authorizeVentaAccess($venta);

        $request->validate([
            'nombre_cliente' => 'required|string|max:255',
            'telefono_cliente' => 'nullable|string|max:255',
            'metodo_pago' => 'required|in:efectivo,qr,tarjeta',
            'inicio_tarjeta' => 'required_if:metodo_pago,tarjeta|nullable|digits:4',
            'fin_tarjeta' => 'required_if:metodo_pago,tarjeta|nullable|digits:4',
            'notas_adicionales' => 'nullable|string',
            'descuento' => 'nullable|numeric|min:0',
            'valor_permuta' => 'nullable|numeric|min:0',
            'items' => 'nullable|array',
            'items.*.id' => 'required|integer|exists:ventas_items,id',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.precio_venta' => 'required|numeric|min:0',
            'items.*.precio_invertido' => 'required|numeric|min:0',
            'items.*.descuento' => 'required|numeric|min:0',
            'servicio_tecnico.equipo' => 'nullable|string|max:255',
            'servicio_tecnico.detalle_servicio' => 'nullable|string',
            'servicio_tecnico.tecnico' => 'nullable|string|max:255',
            'servicio_tecnico.precio_costo' => 'nullable|numeric|min:0',
            'servicio_tecnico.precio_venta' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $venta) {
            $venta->load(['items', 'servicioTecnico']);
            $beforeEdit = $this->ventaEditSnapshot($venta);

            if ($venta->tipo_venta === 'servicio_tecnico' && $venta->servicioTecnico) {
                $servicioData = $request->input('servicio_tecnico', []);
                $precioVenta = (float) ($servicioData['precio_venta'] ?? $venta->servicioTecnico->precio_venta ?? 0);
                $precioCosto = (float) ($servicioData['precio_costo'] ?? $venta->servicioTecnico->precio_costo ?? 0);
                $descuento = (float) ($request->descuento ?? 0);
                $subtotal = max(0, $precioVenta - $descuento);

                $venta->servicioTecnico->update([
                    'cliente' => $request->nombre_cliente,
                    'telefono' => $request->telefono_cliente,
                    'equipo' => $servicioData['equipo'] ?? $venta->servicioTecnico->equipo,
                    'detalle_servicio' => $servicioData['detalle_servicio'] ?? $venta->servicioTecnico->detalle_servicio,
                    'tecnico' => $servicioData['tecnico'] ?? $venta->servicioTecnico->tecnico,
                    'precio_costo' => $precioCosto,
                    'precio_venta' => $precioVenta,
                    'notas_adicionales' => $request->notas_adicionales,
                ]);

                $venta->update([
                    'nombre_cliente' => $request->nombre_cliente,
                    'telefono_cliente' => $request->telefono_cliente,
                    'metodo_pago' => $request->metodo_pago,
                    'inicio_tarjeta' => $request->metodo_pago === 'tarjeta' ? $request->inicio_tarjeta : null,
                    'fin_tarjeta' => $request->metodo_pago === 'tarjeta' ? $request->fin_tarjeta : null,
                    'notas_adicionales' => $request->notas_adicionales,
                    'precio_venta' => $precioVenta,
                    'precio_invertido' => $precioCosto,
                    'descuento' => $descuento,
                    'subtotal' => $subtotal,
                    'ganancia_neta' => $subtotal - $precioCosto,
                    'valor_permuta' => 0,
                ]);

                $venta->refresh()->load(['items', 'servicioTecnico']);
                $this->notifyAdminSaleEditedBySeller(
                    $venta,
                    $beforeEdit,
                    $this->ventaEditSnapshot($venta)
                );

                return redirect()
                    ->route(auth()->user()->rol === 'admin' ? 'admin.ventas.index' : 'vendedor.ventas.index')
                    ->with('success', 'Venta actualizada correctamente.');
            }

            $itemsPayload = collect($request->input('items', []));
            if ($itemsPayload->isEmpty()) {
                return back()->withErrors(['items' => 'La venta debe tener al menos un producto.']);
            }

            $itemsPorId = $venta->items->keyBy('id');
            $subtotal = 0;
            $capitalTotal = 0;

            foreach ($itemsPayload as $itemData) {
                $item = $itemsPorId->get((int) $itemData['id']);

                if (!$item) {
                    abort(422, 'Uno de los items no pertenece a esta venta.');
                }

                $cantidad = (int) $itemData['cantidad'];
                $precioVenta = (float) $itemData['precio_venta'];
                $precioInvertido = (float) $itemData['precio_invertido'];
                $descuentoItem = (float) $itemData['descuento'];
                $subtotalItem = max(0, ($precioVenta - $descuentoItem) * $cantidad);

                $item->update([
                    'cantidad' => $cantidad,
                    'precio_venta' => $precioVenta,
                    'precio_invertido' => $precioInvertido,
                    'descuento' => $descuentoItem,
                    'subtotal' => $subtotalItem,
                ]);

                $subtotal += $subtotalItem;
                $capitalTotal += $precioInvertido;
            }

            $descuentoVenta = (float) ($request->descuento ?? 0);
            $valorPermuta = $venta->es_permuta ? (float) ($request->valor_permuta ?? 0) : 0;

            $venta->update([
                'nombre_cliente' => $request->nombre_cliente,
                'telefono_cliente' => $request->telefono_cliente,
                'metodo_pago' => $request->metodo_pago,
                'inicio_tarjeta' => $request->metodo_pago === 'tarjeta' ? $request->inicio_tarjeta : null,
                'fin_tarjeta' => $request->metodo_pago === 'tarjeta' ? $request->fin_tarjeta : null,
                'notas_adicionales' => $request->notas_adicionales,
                'descuento' => $descuentoVenta,
                'valor_permuta' => $valorPermuta,
                'subtotal' => $subtotal,
                'precio_venta' => $subtotal,
                'precio_invertido' => $capitalTotal,
                'ganancia_neta' => $subtotal - $descuentoVenta - $valorPermuta - $capitalTotal,
            ]);

            if ($venta->telefono_cliente) {
                Cliente::updateOrCreate(
                    ['telefono' => $venta->telefono_cliente],
                    [
                        'user_id' => $venta->user_id,
                        'nombre' => Str::title(trim($venta->nombre_cliente)),
                        'correo' => null,
                        'documento' => null,
                    ]
                );
            }

            $venta->refresh()->load(['items', 'servicioTecnico']);
            $this->notifyAdminSaleEditedBySeller(
                $venta,
                $beforeEdit,
                $this->ventaEditSnapshot($venta)
            );

            return redirect()
                ->route(auth()->user()->rol === 'admin' ? 'admin.ventas.index' : 'vendedor.ventas.index')
                ->with('success', 'Venta actualizada correctamente.');
        });
    }

    public function boleta(Venta $venta)
    {
        $this->authorizeVentaAccess($venta);

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
                ->when(auth()->user()->rol === 'vendedor', fn($q) => $q->where('user_id', auth()->id()))
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
                ->when(auth()->user()->rol === 'vendedor', fn($q) => $q->where('user_id', auth()->id()))
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
            ->when(auth()->user()->rol === 'vendedor', fn($q) => $q->where('user_id', auth()->id()))
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

    public function boleta80(Venta $venta)
    {
        $this->authorizeVentaAccess($venta);

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

        $pdf = Pdf::loadView('pdf.boleta_80mm', [
            'venta' => $venta,
            'sumaSubtotalItems' => $sumaSubtotalItems,
            'valorPermuta' => $valorPermuta,
            'totalAPagar' => $totalAPagar,
        ]);

        /**
         * 📏 FORMATO TÉRMICO 80mm (PRODUCCIÓN)
         * - 226.77 pt = 80mm
         * - 1200 pt = alto suficiente (NO infinito)
         * DomPDF corta automáticamente donde termina el contenido
         */
        $pdf->setPaper([0, 0, 226.77, 650], 'portrait');

        return $pdf->stream("boleta-80mm-{$venta->id}.pdf");
    }
}
