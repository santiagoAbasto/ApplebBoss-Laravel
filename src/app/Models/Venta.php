<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\User;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use App\Models\VentaItem;
use App\Models\ServicioTecnico;

class Venta extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre_cliente',
        'telefono_cliente',
        'fecha',
        'codigo_nota',
        'tipo_venta',
        'es_permuta',
        'tipo_permuta',
        'cantidad',
        'precio_invertido',
        'precio_venta',
        'ganancia_neta',
        'subtotal',
        'descuento',
        'valor_permuta',
        'celular_id',
        'computadora_id',
        'producto_general_id',
        'producto_apple_id',
        'entregado_celular_id',
        'entregado_computadora_id',
        'entregado_producto_general_id',
        'entregado_producto_apple_id',
        'metodo_pago',
        'inicio_tarjeta',
        'fin_tarjeta',
        'notas_adicionales',
        'user_id',
    ];

    /**
     * Generación automática del código de nota de venta
     * Formato: AT-V001, AT-V101, etc.
     */
    protected static function booted()
    {
        static::created(function (Venta $venta) {
            if (empty($venta->codigo_nota)) {
                $venta->codigo_nota = 'AT-V' . str_pad($venta->id, 3, '0', STR_PAD_LEFT);
                $venta->save();
            }
        });
    }

    /* =========================
     |  RELACIONES DE PRODUCTO
     ========================= */

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

    public function productoApple()
    {
        return $this->belongsTo(ProductoApple::class, 'producto_apple_id');
    }

    /* =========================
     |  PERMUTA (PRODUCTO ENTREGADO)
     ========================= */

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

    /**
     * Devuelve dinámicamente el producto entregado según el tipo de permuta
     */
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

    /* =========================
     |  RELACIONES GENERALES
     ========================= */

    // Usuario vendedor
    public function vendedor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Ítems de venta (ventas múltiples)
    public function items()
    {
        return $this->hasMany(VentaItem::class);
    }

    // Servicio técnico asociado (opcional)
    public function servicioTecnico()
    {
        return $this->hasOne(ServicioTecnico::class, 'venta_id');
    }
}
