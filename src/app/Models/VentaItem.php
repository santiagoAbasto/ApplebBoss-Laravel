<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VentaItem extends Model
{

    protected $table = 'ventas_items'; // 👈 Corrige el nombre de la tabla

    protected $fillable = [
        'venta_id',
        'tipo',
        'producto_id',
        'cantidad',
        'precio_venta',
        'precio_invertido',
        'descuento',
        'subtotal',
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }
    public function celular() {
        return $this->belongsTo(Celular::class, 'producto_id');
    }
    
    public function computadora() {
        return $this->belongsTo(Computadora::class, 'producto_id');
    }
    
    public function productoGeneral() {
        return $this->belongsTo(ProductoGeneral::class, 'producto_id');
    }
}    
