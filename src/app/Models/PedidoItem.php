<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Un producto dentro de un pedido, con el precio congelado al momento de comprar.
 *
 * El IMEI y el número de serie se guardan recién cuando el pago está confirmado y solo se
 * muestran al dueño del pedido: antes de eso, `paraElCliente()` no los devuelve nunca.
 */
class PedidoItem extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'subtotal'        => 'decimal:2',
        'cantidad'        => 'integer',
    ];

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    /** El modelo del inventario al que apunta este ítem. */
    public function inventario(): mixed
    {
        return \App\Support\InventarioCatalogo::modelo($this->tipo, (int) $this->producto_id);
    }

    public function paraElCliente(bool $pagoConfirmado): array
    {
        $base = [
            'nombre'    => $this->nombre,
            'condicion' => $this->condicion,
            'slug'      => $this->slug,
            'cantidad'  => $this->cantidad,
            'precio'    => (float) $this->precio_unitario,
            'subtotal'  => (float) $this->subtotal,
        ];

        // Los datos de la unidad son del comprador, y recién con el pago confirmado
        if ($pagoConfirmado) {
            $base['imei_1']       = $this->imei_1;
            $base['imei_2']       = $this->imei_2;
            $base['numero_serie'] = $this->numero_serie;
        }

        return $base;
    }
}
