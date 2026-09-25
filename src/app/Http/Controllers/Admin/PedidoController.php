<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Support\Checkout\ConfirmadorDePago;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Pedidos de la tienda en línea.
 *
 * Mientras el QR automático del banco no esté habilitado, el cobro es manual: el cliente
 * transfiere, sube su comprobante y el pedido queda en «pago en revisión». Desde acá se
 * revisa ese comprobante y se confirma. Confirmar el pago es lo que marca la unidad como
 * vendida, la despublica de la tienda y le revela al comprador el IMEI y la serie.
 *
 * Cada paso deja un evento en la línea de tiempo, con su autor y su fecha.
 */
class PedidoController extends Controller
{
    /** Estados a los que se puede mover un pedido a mano desde el panel. */
    private const AVANCES = [Pedido::PREPARANDO, Pedido::ENVIADO, Pedido::ENTREGADO];

    public function index(Request $request): Response
    {
        $filtro = $request->string('estado')->toString();
        $busca  = trim($request->string('q')->toString());

        $pedidos = Pedido::query()
            ->with('items:id,pedido_id,nombre,cantidad')
            ->when($filtro !== '' && $filtro !== 'todos', fn ($q) => $q->where('estado', $filtro))
            ->when($busca !== '', fn ($q) => $q->where(function ($sub) use ($busca) {
                $sub->where('codigo', 'like', "%{$busca}%")
                    ->orWhere('nombre_cliente', 'like', "%{$busca}%")
                    ->orWhere('email_cliente', 'like', "%{$busca}%")
                    ->orWhere('telefono_cliente', 'like', "%{$busca}%");
            }))
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Pedido $p) => [
                'id'        => $p->id,
                'codigo'    => $p->codigo,
                'estado'    => $p->estado,
                'etiqueta'  => $p->etiqueta(),
                'cliente'   => $p->nombre_cliente,
                'total'     => (float) $p->total,
                'moneda'    => $p->moneda,
                'metodo'    => $p->metodo_pago,
                'entrega'   => $p->tipo_entrega,
                'articulos' => $p->items->sum('cantidad'),
                'creado_en' => $p->created_at?->toIso8601String(),
                'comprobante' => filled($p->pago_comprobante),
            ]);

        return Inertia::render('Admin/Pedidos/Index', [
            'pedidos'  => $pedidos,
            'filtros'  => ['estado' => $filtro ?: 'todos', 'q' => $busca],
            'estados'  => collect(Pedido::ETIQUETAS)->map(fn ($l, $v) => ['valor' => $v, 'etiqueta' => $l])->values()->all(),
            // Lo que espera acción: sirve para saber qué mirar primero
            'conteos'  => [
                'en_revision'     => Pedido::where('estado', Pedido::PAGO_EN_REVISION)->count(),
                'pendiente_pago'  => Pedido::where('estado', Pedido::PENDIENTE_PAGO)->count(),
                'pagados'         => Pedido::where('estado', Pedido::PAGADO)->count(),
            ],
        ]);
    }

    public function show(Pedido $pedido): Response
    {
        return Inertia::render('Admin/Pedidos/Show', [
            'pedido'  => $pedido->load(['items', 'eventos.usuario', 'confirmadoPor'])->paraElPanel(),
            'avances' => $this->avancesPosibles($pedido),
        ]);
    }

    /**
     * El comprobante que subió el cliente.
     *
     * Vive en disco privado a propósito: no se sirve por URL pública. Se entrega solo acá,
     * a alguien con sesión y permiso sobre el módulo.
     */
    public function comprobante(Pedido $pedido): StreamedResponse
    {
        abort_if(blank($pedido->pago_comprobante), 404, 'Este pedido no tiene comprobante.');
        abort_unless(Storage::disk('local')->exists($pedido->pago_comprobante), 404, 'El archivo ya no está.');

        return Storage::disk('local')->response(
            $pedido->pago_comprobante,
            'comprobante-' . $pedido->codigo . '.' . pathinfo($pedido->pago_comprobante, PATHINFO_EXTENSION),
            ['Content-Disposition' => 'inline']
        );
    }

    /** Confirmar el pago: vende la unidad, la despublica y le revela los datos al comprador. */
    public function confirmarPago(Request $request, Pedido $pedido): RedirectResponse
    {
        $datos = $request->validate([
            'referencia' => ['nullable', 'string', 'max:80'],
        ]);

        if ($pedido->estado === Pedido::CANCELADO) {
            return back()->with('error', 'Un pedido cancelado no se puede confirmar.');
        }

        if ($pedido->pagoConfirmado()) {
            return back()->with('error', 'Este pedido ya tenía el pago confirmado.');
        }

        ConfirmadorDePago::confirmar($pedido, $datos['referencia'] ?? $pedido->pago_referencia, $request->user()->id);

        return back()->with('success', 'Pago confirmado. El equipo quedó vendido y el comprador ya ve sus datos.');
    }

    /** Mover el pedido por su ciclo: preparando → enviado → entregado. */
    public function avanzar(Request $request, Pedido $pedido): RedirectResponse
    {
        $datos = $request->validate([
            'estado'         => ['required', Rule::in(self::AVANCES)],
            'courier'        => ['nullable', 'string', 'max:60'],
            'tracking_codigo' => ['nullable', 'string', 'max:80'],
            'tracking_url'   => ['nullable', 'url', 'max:300'],
        ]);

        if (! $pedido->pagoConfirmado()) {
            return back()->with('error', 'Primero hay que confirmar el pago.');
        }

        if (! in_array($datos['estado'], $this->avancesPosibles($pedido), true)) {
            return back()->with('error', 'Ese no es el siguiente paso de este pedido.');
        }

        $pedido->estado = $datos['estado'];

        if ($datos['estado'] === Pedido::ENVIADO) {
            $pedido->courier         = $datos['courier'] ?? $pedido->courier;
            $pedido->tracking_codigo = $datos['tracking_codigo'] ?? $pedido->tracking_codigo;
            $pedido->tracking_url    = $datos['tracking_url'] ?? $pedido->tracking_url;
            $pedido->enviado_en      = now();
        }

        if ($datos['estado'] === Pedido::ENTREGADO) {
            $pedido->entregado_en = now();
        }

        $pedido->save();

        $pedido->registrarEvento(
            Pedido::ETIQUETAS[$datos['estado']] ?? $datos['estado'],
            $datos['estado'] === Pedido::ENVIADO && filled($pedido->tracking_codigo)
                ? trim(($pedido->courier ? $pedido->courier . ' · ' : '') . $pedido->tracking_codigo)
                : null,
            publico: true,
            userId: $request->user()->id,
        );

        return back()->with('success', 'Pedido actualizado.');
    }

    public function cancelar(Request $request, Pedido $pedido): RedirectResponse
    {
        $datos = $request->validate([
            'motivo' => ['required', 'string', 'max:200'],
        ]);

        if ($pedido->estado === Pedido::CANCELADO) {
            return back()->with('error', 'El pedido ya estaba cancelado.');
        }

        ConfirmadorDePago::cancelar($pedido, $datos['motivo'], $request->user()->id);

        return back()->with('success', 'Pedido cancelado y equipo liberado.');
    }

    /** Una nota que solo se ve en el panel: nunca llega al seguimiento del cliente. */
    public function notaInterna(Request $request, Pedido $pedido): RedirectResponse
    {
        $datos = $request->validate([
            'nota' => ['required', 'string', 'max:500'],
        ]);

        $pedido->notas_internas = trim(($pedido->notas_internas ? $pedido->notas_internas . "\n" : '') . $datos['nota']);
        $pedido->save();

        $pedido->registrarEvento('Nota interna', $datos['nota'], publico: false, userId: $request->user()->id);

        return back()->with('success', 'Nota guardada.');
    }

    /** El siguiente paso lógico, para no ofrecer saltos imposibles. */
    private function avancesPosibles(Pedido $pedido): array
    {
        if (! $pedido->pagoConfirmado()) {
            return [];
        }

        return match ($pedido->estado) {
            Pedido::PAGADO     => [Pedido::PREPARANDO],
            Pedido::PREPARANDO => $pedido->esADomicilio() ? [Pedido::ENVIADO] : [Pedido::ENTREGADO],
            Pedido::ENVIADO    => [Pedido::ENTREGADO],
            default            => [],
        };
    }
}
