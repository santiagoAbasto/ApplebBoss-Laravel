<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Cotizacion extends Model
{
    use HasFactory;

    protected $table = 'cotizaciones'; 

    protected $fillable = [
        'nombre_cliente',
        'telefono_cliente',
        'correo_cliente',
        'items',
        'precio_base',
        'precio_sin_factura',
        'precio_con_factura',
        'descuento', // campo nuevo
        'total',
        'notas_adicionales',
        'fecha_cotizacion',
        'user_id',
        'enviado_por_correo',
        'enviado_por_whatsapp',
    ];

    protected $casts = [
        'items' => 'array',
        'descuento' => 'decimal:2', // casteo nuevo
        'enviado_por_correo' => 'boolean',
        'enviado_por_whatsapp' => 'boolean',
        'fecha_cotizacion' => 'date',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
