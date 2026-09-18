<?php

namespace App\Support\Checkout;

use App\Models\Pedido;
use App\Models\PedidoItem;

/**
 * Qué unidades están apartadas por un pedido en curso.
 *
 * Mientras un pedido no se pague (o no se cancele), su equipo no se le puede vender a otra
 * persona: así nadie compra algo que ya está comprometido.
 */
class StockDePedidos
{
    /** IDs de un tipo que están retenidos por pedidos vivos (opcionalmente ignorando un pedido). */
    public static function retenidos(string $tipo, ?int $exceptoPedido = null): array
    {
        return PedidoItem::query()
            ->where('tipo', $tipo)
            ->whereHas('pedido', function ($q) use ($exceptoPedido) {
                $q->whereIn('estado', Pedido::RETIENEN_STOCK);
                if ($exceptoPedido) {
                    $q->where('id', '!=', $exceptoPedido);
                }
            })
            ->pluck('producto_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /** ¿Esta unidad puntual está apartada por otro pedido? */
    public static function estaRetenido(string $tipo, int $productoId, ?int $exceptoPedido = null): bool
    {
        return PedidoItem::query()
            ->where('tipo', $tipo)
            ->where('producto_id', $productoId)
            ->whereHas('pedido', function ($q) use ($exceptoPedido) {
                $q->whereIn('estado', Pedido::RETIENEN_STOCK);
                if ($exceptoPedido) {
                    $q->where('id', '!=', $exceptoPedido);
                }
            })
            ->exists();
    }

    /** Libera los pedidos que vencieron sin pago y devuelve cuántos liberó. */
    public static function liberarVencidos(): int
    {
        $vencidos = Pedido::whereIn('estado', [Pedido::PENDIENTE_PAGO, Pedido::PAGO_EN_REVISION])
            ->whereNotNull('expira_en')
            ->where('expira_en', '<', now())
            ->get();

        foreach ($vencidos as $pedido) {
            $pedido->update(['estado' => Pedido::CANCELADO]);
            $pedido->registrarEvento(
                'Pedido cancelado por falta de pago',
                'Se venció el tiempo para pagar y el equipo volvió a estar disponible.',
            );
        }

        return $vencidos->count();
    }
}
