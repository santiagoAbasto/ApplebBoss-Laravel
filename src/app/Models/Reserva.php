<?php

namespace App\Models;

use App\Services\GeneradorCodigos;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reserva extends Model
{
    use HasFactory;

    protected $fillable = [
        'codigo_nota',
        'nombre_cliente',
        'telefono_cliente',
        'fecha',
        'subtotal',
        'monto_reserva',
        'terminos_condiciones',
        'estado',
        'venta_id',
        'user_id',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'subtotal' => 'decimal:2',
        'monto_reserva' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::created(function (Reserva $reserva) {
            if (empty($reserva->codigo_nota)) {
                $reserva->codigo_nota = 'AT-R' . str_pad($reserva->id, 3, '0', STR_PAD_LEFT);
                $reserva->save();
            }

            if (preg_match('/AT-R(\d+)/', (string) $reserva->codigo_nota, $matches)) {
                GeneradorCodigos::sincronizarSecuencia('reservas', (int) $matches[1]);
            }
        });
    }

    public function items()
    {
        return $this->hasMany(ReservaItem::class);
    }

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }
}
