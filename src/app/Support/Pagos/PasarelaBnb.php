<?php

namespace App\Support\Pagos;

use App\Models\Pedido;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cobro con QR Simple del Banco Nacional de Bolivia.
 *
 * Contrato del banco (API v1):
 *   POST auth/token                 { accountId, authorizationId }   -> token
 *   POST main/getQRWithImageAsync   { ...datos del cobro }           -> imagen del QR + id
 *   POST main/getQRStatusAsync      { qrId }                         -> estado del cobro
 *
 * Las credenciales las entrega el banco y viven solo en el .env. Si no están cargadas,
 * `disponible()` devuelve false y el checkout ofrece las otras formas de pago.
 */
class PasarelaBnb
{
    /** Estados que devuelve el banco para un QR. */
    public const PENDIENTE = 1;
    public const PAGADO    = 2;

    public static function disponible(): bool
    {
        return (bool) config('pagos.bnb.habilitado')
            && filled(config('pagos.bnb.account_id'))
            && filled(config('pagos.bnb.authorization_id'));
    }

    /** Token de sesión con el banco (se guarda un ratito para no pedirlo en cada cobro). */
    public static function token(): ?string
    {
        if (! self::disponible()) {
            return null;
        }

        return Cache::remember('bnb.qr.token', now()->addMinutes(20), function () {
            $r = Http::timeout(20)->acceptJson()->post(self::url('auth/token'), [
                'accountId'       => config('pagos.bnb.account_id'),
                'authorizationId' => config('pagos.bnb.authorization_id'),
            ]);

            if (! $r->successful()) {
                Log::warning('BNB QR: no se pudo obtener el token', ['status' => $r->status()]);
                return null;
            }

            return $r->json('message') ?? $r->json('token') ?? null;
        });
    }

    /**
     * Genera el QR de cobro para un pedido.
     *
     * @return array{qr_id:string,imagen:string}|null  imagen en base64 lista para <img src="data:image/png;base64,...">
     */
    public static function generarQr(Pedido $pedido): ?array
    {
        $token = self::token();
        if (! $token) {
            return null;
        }

        $r = Http::timeout(25)->acceptJson()->withToken($token)->post(self::url('main/getQRWithImageAsync'), [
            'currency'            => config('pagos.bnb.moneda', 'BOB'),
            'gloss'               => 'Pedido ' . $pedido->codigo . ' - Apple Boss',
            'amount'              => (float) $pedido->total,
            'singleUse'           => true,
            'expirationDate'      => now()->addMinutes((int) config('pagos.bnb.vigencia_minutos', 120))->format('Y-m-d'),
            'additionalData'      => $pedido->codigo,
            'destinationAccountId' => 1,
        ]);

        if (! $r->successful()) {
            Log::warning('BNB QR: no se pudo generar el cobro', ['pedido' => $pedido->codigo, 'status' => $r->status()]);
            return null;
        }

        $qrId   = $r->json('id') ?? $r->json('qrId') ?? null;
        $imagen = $r->json('qr') ?? $r->json('image') ?? null;

        if (! $qrId || ! $imagen) {
            return null;
        }

        return ['qr_id' => (string) $qrId, 'imagen' => (string) $imagen];
    }

    /** Pregunta al banco si ese QR ya fue pagado. */
    public static function consultarEstado(string $qrId): ?int
    {
        $token = self::token();
        if (! $token) {
            return null;
        }

        $r = Http::timeout(20)->acceptJson()->withToken($token)->post(self::url('main/getQRStatusAsync'), [
            'qrId' => $qrId,
        ]);

        if (! $r->successful()) {
            return null;
        }

        $estado = $r->json('statusId') ?? $r->json('status') ?? null;

        return $estado === null ? null : (int) $estado;
    }

    private static function url(string $ruta): string
    {
        return rtrim((string) config('pagos.bnb.base_url'), '/') . '/' . ltrim($ruta, '/');
    }
}
