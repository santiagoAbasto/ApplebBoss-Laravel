<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\User;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\VentaItem;

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
        'descuento',
        'metodo_pago',
        'inicio_tarjeta',
        'fin_tarjeta',
        'notas_adicionales',
        'fecha',
        'user_id',
        'ganancia_neta',
        'subtotal',
        'valor_permuta', // Agregado recientemente
        'celular_id',
        'computadora_id',
        'producto_general_id',
        'entregado_celular_id',
        'entregado_computadora_id',
        'entregado_producto_general_id',
    ];

    // Producto vendido
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

    // Producto entregado (permuta)
    public function entregadoCelular()
    {
        return $this->belongsTo(Celular::class, 'entregado_celular_id');
    }

    public function entregadoComputadora()
    {
        return $this->belongsTo(Computadora::class, 'entregado_computadora_id');
    }

    public function entregadoProductoGeneral()
    {
        return $this->belongsTo(ProductoGeneral::class, 'entregado_producto_general_id');
    }
    public function entregadoProductoApple()
{
    return $this->belongsTo(ProductoApple::class, 'entregado_producto_apple_id');
}

    // Usuario que hizo la venta
    public function vendedor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relación auxiliar opcional
    public function productoEntregado()
    {
        return match ($this->tipo_permuta) {
            'celular' => $this->entregadoCelular,
            'computadora' => $this->entregadoComputadora,
            'producto_general' => $this->entregadoProductoGeneral,
            'producto_apple' => $this->entregadoProductoApple,
            default => null,
        };
    }    

    public function items()
    {
        return $this->hasMany(VentaItem::class);
    }
}
