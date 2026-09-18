<?php

namespace App\Support\Checkout;

use App\Models\Pedido;
use App\Models\PedidoItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Confirmar el pago es el momento en que todo pasa:
 *
 *  1. El pedido queda como pagado.
 *  2. Cada equipo se marca vendido en el inventario (y por eso se despublica solo de la tienda).
 *  3. Recién ahí se copian el IMEI y la serie al ítem: son datos del comprador, no del público.
 *  4. Queda registrado en la línea de tiempo para que el cliente lo vea en su seguimiento.
 *
 * Es idempotente: confirmar dos veces el mismo pedido no vende dos veces ni duplica eventos.
 */
class ConfirmadorDePago
{
    public static function confirmar(Pedido $pedido, ?string $referencia = null, ?int $userId = null, ?string $metodo = null): Pedido
    {
        if ($pedido->pagoConfirmado()) {
            return $pedido; // ya estaba confirmado: no se hace nada dos veces
        }

        if ($pedido->estado === Pedido::CANCELADO) {
            throw ValidationException::withMessages([
                'estado' => 'Este pedido está cancelado: no se puede confirmar el pago.',
            ]);
        }

        return DB::transaction(function () use ($pedido, $referencia, $userId, $metodo) {
            $pedido->forceFill([
                'estado'             => Pedido::PAGADO,
                'metodo_pago'        => $metodo ?: $pedido->metodo_pago,
                'pago_referencia'    => $referencia ?: $pedido->pago_referencia,
                'pago_confirmado_en' => now(),
                'pago_confirmado_por' => $userId,
                'expira_en'          => null, // ya no vence: el equipo es suyo
            ])->save();

            foreach ($pedido->items as $item) {
                self::venderYRevelar($item);
            }

            $pedido->registrarEvento(
                'Pago confirmado',
                'Recibimos tu pago. Ya puedes ver los datos de tu equipo en este seguimiento.',
                publico: true,
                userId: $userId,
            );

            return $pedido->fresh(['items', 'eventos']);
        });
    }

    /** Marca la unidad como vendida y copia sus datos propios al ítem del pedido. */
    private static function venderYRevelar(PedidoItem $item): void
    {
        $producto = $item->inventario();

        if (! $producto) {
            return; // ya no está en el inventario: se deja el ítem tal cual quedó
        }

        // Los datos de la unidad pasan a ser del comprador
        $item->forceFill([
            'imei_1'       => $producto->imei_1 ?? null,
            'imei_2'       => $producto->imei_2 ?? null,
            'numero_serie' => $producto->numero_serie ?? ($producto->codigo ?? null),
        ])->save();

        // Marcar vendido dispara la regla que lo despublica de la tienda (AppServiceProvider)
        if ($producto->estado !== 'vendido') {
            $producto->estado = 'vendido';
            $producto->save();
        }
    }

    /** El cliente avisa que ya pagó y sube su comprobante: queda en revisión, no confirmado. */
    public static function marcarEnRevision(Pedido $pedido, ?string $comprobante = null, ?string $referencia = null): Pedido
    {
        if ($pedido->pagoConfirmado() || $pedido->estado === Pedido::CANCELADO) {
            return $pedido;
        }

        $pedido->forceFill([
            'estado'           => Pedido::PAGO_EN_REVISION,
            'pago_comprobante' => $comprobante ?: $pedido->pago_comprobante,
            'pago_referencia'  => $referencia ?: $pedido->pago_referencia,
        ])->save();

        $pedido->registrarEvento(
            'Pago reportado',
            'Recibimos tu comprobante. Lo estamos verificando y te confirmamos en breve.',
        );

        return $pedido;
    }

    /** Cancela un pedido y devuelve el equipo a la tienda (si todavía no se vendió). */
    public static function cancelar(Pedido $pedido, string $motivo, ?int $userId = null): Pedido
    {
        if ($pedido->estado === Pedido::CANCELADO) {
            return $pedido;
        }

        $pedido->forceFill(['estado' => Pedido::CANCELADO, 'expira_en' => null])->save();

        $pedido->registrarEvento('Pedido cancelado', $motivo, publico: true, userId: $userId);

        return $pedido;
    }
}
