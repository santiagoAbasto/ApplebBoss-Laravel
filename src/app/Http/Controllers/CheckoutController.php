<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Support\Checkout\ConfirmadorDePago;
use App\Support\Checkout\CreadorDePedido;
use App\Support\Checkout\Entrega;
use App\Support\Pagos\MetodosDePago;
use App\Support\Pagos\PasarelaBnb;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * El checkout de la tienda.
 *
 * El navegador solo dice QUÉ quiere comprar: el precio, la disponibilidad y el costo de envío
 * los pone el servidor. El pedido avanza recién cuando el pago está confirmado.
 */
class CheckoutController extends Controller
{
    /** Pantalla de datos + entrega. El carrito se resuelve contra el inventario. */
    public function mostrar(): Response
    {
        return Inertia::render('Store/Checkout', [
            'entrega'  => Entrega::opciones(),
            'destinos' => Entrega::destinos(),
            'metodos'  => MetodosDePago::disponibles(),
        ]);
    }

    /** Crea el pedido con los precios del servidor y manda a pagar. */
    public function guardar(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'claves'             => ['required', 'array', 'min:1', 'max:50'],
            'claves.*'           => ['string', 'max:60'],
            'nombre_cliente'     => ['required', 'string', 'max:120'],
            'email_cliente'      => ['required', 'email:rfc', 'max:150'],
            'telefono_cliente'   => ['required', 'string', 'max:30', 'regex:/^\+?[\d\s\-().]{7,30}$/'],
            'documento'          => ['nullable', 'string', 'max:30'],
            'razon_social'       => ['nullable', 'string', 'max:150'],
            'tipo_entrega'       => ['required', Rule::in([Entrega::RETIRO, Entrega::ENVIO])],
            'envio_departamento' => ['nullable', 'string', 'max:40'],
            'envio_ciudad'       => ['nullable', 'string', 'max:80'],
            'envio_direccion'    => ['nullable', 'string', 'max:200'],
            'envio_referencia'   => ['nullable', 'string', 'max:200'],
            'envio_destinatario' => ['nullable', 'string', 'max:120'],
            'envio_telefono'     => ['nullable', 'string', 'max:30'],
            'metodo_pago'        => ['required', Rule::in(MetodosDePago::valores())],
            'notas_cliente'      => ['nullable', 'string', 'max:500'],
        ]);

        // Si eligió envío, la dirección es obligatoria
        if ($datos['tipo_entrega'] === Entrega::ENVIO) {
            $request->validate([
                'envio_departamento' => ['required', 'string', 'max:40'],
                'envio_ciudad'       => ['required', 'string', 'max:80'],
                'envio_direccion'    => ['required', 'string', 'max:200'],
            ], [], ['envio_departamento' => 'departamento', 'envio_ciudad' => 'ciudad', 'envio_direccion' => 'dirección']);
        }

        $pedido = CreadorDePedido::crear($datos['claves'], $datos);

        return redirect()->route('checkout.pago', [
            'codigo' => $pedido->codigo,
            't'      => $pedido->token_seguimiento,
        ]);
    }

    /** Pantalla de pago: QR del banco o datos para transferir. */
    public function pago(Request $request, string $codigo): Response
    {
        $pedido = $this->pedidoDelCliente($request, $codigo);

        $qr = null;
        if ($pedido->metodo_pago === MetodosDePago::QR_BNB && ! $pedido->pagoConfirmado() && PasarelaBnb::disponible()) {
            $generado = PasarelaBnb::generarQr($pedido);
            if ($generado) {
                $pedido->forceFill(['pago_referencia' => $generado['qr_id']])->save();
                $qr = $generado['imagen'];
            }
        }

        return Inertia::render('Store/Pago', [
            'pedido'        => $pedido->paraElCliente(),
            'token'         => $pedido->token_seguimiento,
            'qr'            => $qr,
            'transferencia' => MetodosDePago::datosDeTransferencia(),
            'metodo'        => $pedido->metodo_pago,
        ]);
    }

    /** El cliente avisa que pagó y (opcional) sube su comprobante. */
    public function reportarPago(Request $request, string $codigo): RedirectResponse
    {
        $pedido = $this->pedidoDelCliente($request, $codigo);

        $request->validate([
            'referencia'  => ['nullable', 'string', 'max:80'],
            'comprobante' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);

        $ruta = null;
        if ($request->hasFile('comprobante')) {
            // Disco privado: el comprobante no se sirve público
            $ruta = $request->file('comprobante')->store('comprobantes', 'local');
        }

        ConfirmadorDePago::marcarEnRevision($pedido, $ruta, $request->input('referencia'));

        return back()->with('success', 'Recibimos tu comprobante. Lo verificamos y te avisamos.');
    }

    /**
     * Estado del pago para que la pantalla se actualice sola.
     * Si el pago es por QR del BNB, le pregunta al banco y confirma automáticamente.
     */
    public function estado(Request $request, string $codigo): JsonResponse
    {
        $pedido = $this->pedidoDelCliente($request, $codigo);

        if (! $pedido->pagoConfirmado()
            && $pedido->metodo_pago === MetodosDePago::QR_BNB
            && $pedido->pago_referencia
            && PasarelaBnb::disponible()) {
            if (PasarelaBnb::consultarEstado($pedido->pago_referencia) === PasarelaBnb::PAGADO) {
                $pedido = ConfirmadorDePago::confirmar($pedido, $pedido->pago_referencia, null, MetodosDePago::QR_BNB);
            }
        }

        return response()->json([
            'estado'          => $pedido->estado,
            'etiqueta'        => $pedido->etiqueta(),
            'pago_confirmado' => $pedido->pagoConfirmado(),
        ]);
    }

    /**
     * Busca el pedido y comprueba que quien pregunta es su dueño.
     * Sin el token (o el correo correcto) no se abre: los pedidos son privados.
     */
    private function pedidoDelCliente(Request $request, string $codigo): Pedido
    {
        $pedido = Pedido::with(['items', 'eventos'])->where('codigo', $codigo)->firstOrFail();

        $token = (string) $request->query('t', $request->input('t', ''));
        $email = mb_strtolower(trim((string) $request->input('email', '')));

        $esDueño = ($token !== '' && hash_equals($pedido->token_seguimiento, $token))
            || ($email !== '' && hash_equals(mb_strtolower($pedido->email_cliente), $email));

        abort_unless($esDueño, 404);

        return $pedido;
    }
}
