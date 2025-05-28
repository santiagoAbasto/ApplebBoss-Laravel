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
        'telefono', // ✅ número completo con código de país
        'correo_cliente',
        'items',
        'precio_base',
        'precio_sin_factura',
        'precio_con_factura',
        'descuento',
        'total',
        'notas_adicionales',
        'fecha_cotizacion',
        'user_id',
        'enviado_por_correo',
        'enviado_por_whatsapp',
        'drive_url'
    ];

    protected $casts = [
        'items' => 'array',
        'descuento' => 'decimal:2',
        'enviado_por_correo' => 'boolean',
        'enviado_por_whatsapp' => 'boolean',
        'fecha_cotizacion' => 'date',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
