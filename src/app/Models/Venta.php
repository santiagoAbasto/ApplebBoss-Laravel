<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre_cliente',
        'telefono_cliente',
        'tipo_venta',
        'es_permuta',
        'tipo_permuta',
        'cantidad',
        'precio_invertido',
        'precio_venta',
        'ganancia_neta',
        'subtotal',
        'descuento',
        'celular_id',
        'computadora_id',
        'producto_general_id',
        'metodo_pago',
        'inicio_tarjeta',
        'fin_tarjeta',
        'notas_adicionales',
        'user_id',
    ];

    // Relaciones
    public function vendedor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function celular()
    {
        return $this->belongsTo(Celular::class);
    }

    public function computadora()
    {
        return $this->belongsTo(Computadora::class);
    }

    public function productoGeneral()
    {
        return $this->belongsTo(ProductoGeneral::class);
    }
}
