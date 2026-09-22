<?php

namespace App\Support\Pagos;

use App\Models\Pedido;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Libélula — tarjetas, QR Simple y Tigo Money en una sola integración.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * LO MÁS IMPORTANTE DE ESTE ARCHIVO
 *
 * El aviso de pago de Libélula llega así (manual v2.145, pág. 15):
 *
 *     GET /pago-exitoso?transaction_id=dd5a5391-34bf-4cb4-ad13-be6621a54979
 *
 * Sin firma, sin secreto, sin autenticación. Y el cliente ve ese identificador en su
 * propio navegador. Si se confirmara el pedido con solo recibir ese GET, cualquiera
 * podría abandonar el pago, pegar la URL a mano y llevarse el equipo gratis.
 *
 * Por eso `confirmoElPago()` NO cree en el aviso: le vuelve a preguntar a Libélula con
 * `consultar_pagos`, usando el appkey que nunca sale del servidor, y además compara el
 * monto. El aviso es un golpecito en el hombro, no un comprobante.
 * ────────────────────────────────────────────────────────────────────────────
 */
class Libelula
{
    public static function disponible(): bool
    {
        return (bool) config('pagos.libelula.habilitado') && filled(config('pagos.libelula.appkey'));
    }

    private static function url(string $ruta): string
    {
        return rtrim((string) config('pagos.libelula.base_url'), '/') . '/' . ltrim($ruta, '/');
    }

    /**
     * Registra el pedido como deuda y devuelve a dónde mandar al cliente a pagar.
     *
     * Devuelve ['url' => …, 'id_transaccion' => …] o null si algo falló.
     */
    public static function registrarDeuda(Pedido $pedido): ?array
    {
        if (! self::disponible()) {
            return null;
        }

        [$nombre, $apellido] = self::partirNombre($pedido->nombre_cliente);

        $payload = [
            'appkey'         => config('pagos.libelula.appkey'),
            'email_cliente'  => $pedido->email_cliente,
            'identificador'  => $pedido->codigo,
            'descripcion'    => 'Compra en Apple Boss · ' . $pedido->codigo,
            'nombre_cliente' => $nombre,
            'apellido_cliente' => $apellido,
            'moneda'         => $pedido->moneda ?: 'BOB',

            // A dónde avisa Libélula cuando el pago entra, y a dónde vuelve el cliente.
            // Los dos llevan el token del pedido: sin él no se atiende el aviso.
            'callback_url'   => route('pago.libelula.aviso', ['codigo' => $pedido->codigo, 't' => $pedido->token_seguimiento]),
            'url_retorno'    => route('checkout.pago', ['codigo' => $pedido->codigo, 't' => $pedido->token_seguimiento]),

            'lineas_detalle_deuda' => $pedido->items->map(fn ($i) => [
                'concepto'       => $i->nombre,
                'cantidad'       => (int) $i->cantidad,
                'costo_unitario' => (float) $i->precio_unitario,
            ])->values()->all(),
        ];

        if ((float) $pedido->costo_envio > 0) {
            $payload['valor_envio'] = (float) $pedido->costo_envio;
            $payload['descripcion_envio'] = 'Envío';
        }

        if (filled($pedido->documento)) {
            $payload['ci'] = $pedido->documento;
        }

        if (filled($pedido->razon_social)) {
            $payload['razon_social'] = $pedido->razon_social;
        }

        try {
            $r = Http::timeout(25)->acceptJson()->post(self::url('deuda/registrar'), $payload);
        } catch (\Throwable $e) {
            Log::warning('Libélula no respondió al registrar la deuda de ' . $pedido->codigo . ': ' . $e->getMessage());

            return null;
        }

        // La API contesta `error` como 0/false cuando salió bien
        if (! $r->successful() || filter_var($r->json('error'), FILTER_VALIDATE_BOOLEAN)) {
            Log::warning('Libélula rechazó la deuda de ' . $pedido->codigo . ': ' . $r->json('mensaje', $r->body()));

            return null;
        }

        $url = $r->json('url_pasarela_pagos');
        $id  = $r->json('id_transaccion');

        if (blank($url) || blank($id)) {
            Log::warning('Libélula respondió sin URL ni id para ' . $pedido->codigo);

            return null;
        }

        return ['url' => $url, 'id_transaccion' => $id, 'qr' => $r->json('qr_simple_url')];
    }

    /**
     * ¿Libélula tiene registrado ESE pago, y por el monto correcto?
     *
     * Esta es la única fuente de verdad. Se consulta una ventana de días hacia atrás
     * porque los pagos por banco o PagosNet pueden acreditarse horas después.
     */
    public static function confirmoElPago(string $idTransaccion, float $montoEsperado, int $diasAtras = 7): bool
    {
        if (! self::disponible() || blank($idTransaccion)) {
            return false;
        }

        try {
            $r = Http::timeout(25)->acceptJson()->post(self::url('deuda/consultar_pagos'), [
                'appkey'        => config('pagos.libelula.appkey'),
                'fecha_inicial' => now()->subDays($diasAtras)->format('Y-m-d H:i:s'),
                'fecha_final'   => now()->addDay()->format('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo consultar pagos en Libélula: ' . $e->getMessage());

            return false;
        }

        if (! $r->successful()) {
            return false;
        }

        foreach ((array) $r->json('datos', []) as $pago) {
            if (($pago['id_transaccion'] ?? null) !== $idTransaccion) {
                continue;
            }

            // Pagó de menos: no se confirma. Un céntimo de diferencia por redondeo se tolera.
            $pagado = (float) ($pago['monto_pagado'] ?? 0);
            if ($pagado + 0.01 < $montoEsperado) {
                Log::warning("Libélula reporta Bs {$pagado} para {$idTransaccion}, se esperaban Bs {$montoEsperado}");

                return false;
            }

            return true;
        }

        return false;   // todavía no figura como pagado
    }

    /** Libélula pide nombre y apellido por separado. */
    private static function partirNombre(?string $completo): array
    {
        $partes = preg_split('/\s+/', trim((string) $completo), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if (count($partes) <= 1) {
            return [$partes[0] ?? 'Cliente', ''];
        }

        return [implode(' ', array_slice($partes, 0, -1)), end($partes)];
    }
}
