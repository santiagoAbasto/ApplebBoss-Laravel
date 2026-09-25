<?php

namespace App\Support\Pagos;

use App\Models\Pedido;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Binance Pay — cobro en cripto (USDT).
 *
 * Legal en Bolivia desde la Resolución 082/2024 del BCB.
 *
 * ── EL TIPO DE CAMBIO ──────────────────────────────────────────────────────
 * El precio está en bolivianos y Binance cobra en USDT. La conversión sale del dólar
 * PARALELO (ver App\Support\Pagos\TipoDeCambio), no del oficial del banco: con el
 * oficial se cobraría de menos en cada venta. Sin tipo de cambio, no se ofrece.
 *
 * ── LA CONFIRMACIÓN ────────────────────────────────────────────────────────
 * El webhook de Binance sí viene firmado, a diferencia del aviso de Libélula. Aun así se
 * trata igual: como un aviso, no como comprobante. Lo único que confirma un pedido es
 * preguntarle a Binance por el estado de la orden. Si mañana la verificación de la firma
 * tuviera un error sutil, nadie podría cobrarse un equipo gratis por eso.
 */
class BinancePay
{
    /** Marca que Binance rechazó al servidor por su ubicación (HTTP 451). */
    private const BLOQUEADO = 'binance.api_bloqueada';

    /**
     * Se ofrece si hay tipo de cambio y alguna forma de cobrar: la API (automático) o el
     * Pay ID de la tienda (manual). Con el Pay ID nunca queda un cliente sin cómo pagar.
     */
    public static function disponible(): bool
    {
        return (bool) config('pagos.binance.habilitado')
            && (filled(config('pagos.binance.pay_id')) || self::automatico())
            && self::tasa() > 0;
    }

    /** ¿Se puede crear la orden y confirmarla sola? Hace falta la API y que Binance nos atienda. */
    public static function automatico(): bool
    {
        return filled(config('pagos.binance.api_key'))
            && filled(config('pagos.binance.api_secret'))
            && ! Cache::has(self::BLOQUEADO);
    }

    /**
     * El monto en USDT, congelado en el pedido la primera vez que se calcula.
     *
     * El paralelo se mueve durante el día: el cliente paga lo que le mostramos y el equipo
     * verifica contra ese mismo número, no contra el de la hora en que revisa.
     */
    public static function cotizar(Pedido $pedido): float
    {
        if ((float) $pedido->pago_monto_usdt > 0) {
            return (float) $pedido->pago_monto_usdt;
        }

        $monto = self::enCripto((float) $pedido->total);

        if ($monto > 0) {
            $pedido->forceFill(['pago_monto_usdt' => $monto])->save();
            $pedido->registrarEvento(
                'Monto en USDT fijado',
                number_format($monto, 2, ',', '.') . ' USDT, a Bs ' . number_format(self::tasa(), 2, ',', '.') . ' por USDT.',
            );
        }

        return $monto;
    }

    /** Lo que el cliente necesita para pagar desde su app, cuando no hay orden automática. */
    public static function datosManuales(Pedido $pedido): ?array
    {
        $payId = config('pagos.binance.pay_id');
        $monto = self::cotizar($pedido);

        if (blank($payId) || $monto <= 0) {
            return null;
        }

        return [
            'pay_id'     => (string) $payId,
            'monto_usdt' => $monto,
            'moneda'     => (string) config('pagos.binance.moneda', 'USDT'),
        ];
    }

    /** Cuántos bolivianos vale 1 USDT, al paralelo. Ver TipoDeCambio. */
    public static function tasa(): float
    {
        return TipoDeCambio::bobPorUsdt();
    }

    /** Lo que se le cobra en cripto por un total en bolivianos. */
    public static function enCripto(float $bolivianos): float
    {
        return TipoDeCambio::aUsdt($bolivianos);
    }

    /**
     * Firma de Binance Pay: HMAC-SHA512 de "timestamp\nnonce\ncuerpo\n", en hexadecimal
     * y en MAYÚSCULAS. Si no va en mayúsculas, Binance rechaza la llamada.
     */
    private static function cabeceras(string $cuerpo): array
    {
        $timestamp = (string) (int) (microtime(true) * 1000);
        $nonce     = Str::random(32);

        $firma = strtoupper(hash_hmac(
            'sha512',
            $timestamp . "\n" . $nonce . "\n" . $cuerpo . "\n",
            (string) config('pagos.binance.api_secret')
        ));

        return [
            'Content-Type'              => 'application/json',
            'BinancePay-Timestamp'      => $timestamp,
            'BinancePay-Nonce'          => $nonce,
            'BinancePay-Certificate-SN' => (string) config('pagos.binance.api_key'),
            'BinancePay-Signature'      => $firma,
        ];
    }

    private static function llamar(string $ruta, array $datos): ?array
    {
        $cuerpo = json_encode($datos, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        try {
            $r = Http::timeout(25)
                ->withHeaders(self::cabeceras($cuerpo))
                ->withBody($cuerpo, 'application/json')
                ->post(rtrim((string) config('pagos.binance.base_url'), '/') . $ruta);
        } catch (\Throwable $e) {
            Log::warning("Binance Pay no respondió en {$ruta}: " . $e->getMessage());

            return null;
        }

        // 451: Binance no atiende a servidores en países donde no opera (EE. UU.). Se deja de
        // intentar por 12 horas y el cobro pasa a manual con el Pay ID.
        if ($r->status() === 451) {
            Cache::put(self::BLOQUEADO, true, now()->addHours(12));
            Log::warning('Binance Pay rechazó al servidor por su ubicación (451). El cobro sigue en modo manual.');

            return null;
        }

        if (! $r->successful() || $r->json('status') !== 'SUCCESS') {
            Log::warning("Binance Pay rechazó {$ruta}: " . $r->json('errorMessage', $r->body()));

            return null;
        }

        return (array) $r->json('data', []);
    }

    /** Crea la orden y devuelve a dónde mandar al cliente a pagar. */
    public static function crearOrden(Pedido $pedido): ?array
    {
        if (! self::disponible() || ! self::automatico()) {
            return null;
        }

        $monto = self::cotizar($pedido);

        if ($monto <= 0) {
            return null;
        }

        $datos = self::llamar('/binancepay/openapi/v3/order', [
            'env'             => ['terminalType' => 'WEB'],
            // El código del pedido es la referencia: así se reconcilia sin ambigüedad
            'merchantTradeNo' => $pedido->codigo,
            'orderAmount'     => $monto,
            'currency'        => (string) config('pagos.binance.moneda', 'USDT'),
            'description'     => 'Compra en Apple Boss ' . $pedido->codigo,
            'goodsDetails'    => [[
                'goodsType'         => '01',          // bien físico
                'goodsCategory'     => 'Z000',        // otros
                'referenceGoodsId'  => $pedido->codigo,
                'goodsName'         => Str::limit((string) ($pedido->items->first()->nombre ?? 'Pedido'), 60, ''),
            ]],
            'returnUrl'  => route('checkout.pago', ['codigo' => $pedido->codigo, 't' => $pedido->token_seguimiento]),
            'cancelUrl'  => route('checkout.pago', ['codigo' => $pedido->codigo, 't' => $pedido->token_seguimiento]),
            'webhookUrl' => route('pago.binance.aviso', ['codigo' => $pedido->codigo, 't' => $pedido->token_seguimiento]),
        ]);

        if (! $datos || blank($datos['checkoutUrl'] ?? null)) {
            return null;
        }

        return [
            'url'        => $datos['checkoutUrl'],
            'prepay_id'  => $datos['prepayId'] ?? null,
            'qr'         => $datos['qrcodeLink'] ?? null,
            'monto_usdt' => $monto,
        ];
    }

    /**
     * ¿Binance tiene esa orden como pagada, y por el monto correcto?
     *
     * Única fuente de verdad. El webhook solo dispara esta pregunta.
     */
    public static function confirmoElPago(Pedido $pedido): bool
    {
        if (! self::disponible() || ! self::automatico()) {
            return false;
        }

        $datos = self::llamar('/binancepay/openapi/v2/order/query', [
            'merchantTradeNo' => $pedido->codigo,
        ]);

        if (! $datos || ($datos['status'] ?? null) !== 'PAID') {
            return false;
        }

        // Pagó de menos: no se confirma. Se compara contra lo que se le cotizó, no contra el paralelo de ahora.
        $pagado   = (float) ($datos['orderAmount'] ?? 0);
        $esperado = self::cotizar($pedido);

        if ($pagado + 0.01 < $esperado) {
            Log::warning("Binance reporta {$pagado} USDT para {$pedido->codigo}, se esperaban {$esperado}");

            return false;
        }

        return true;
    }
}
