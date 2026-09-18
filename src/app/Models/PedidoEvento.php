<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Un paso en la línea de tiempo del pedido (lo que el cliente ve como seguimiento). */
class PedidoEvento extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['publico' => 'boolean'];

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
