<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Cotizacion extends Model
{
    use HasFactory;

    protected $table = 'cotizaciones';

    /* ===============================
     | CAMPOS ASIGNABLES
     =============================== */
    protected $fillable = [
        // dueño de la cotización (admin o vendedor)
        'user_id',

        // cliente asociado (opcional)
        'cliente_id',

        // snapshot del cliente (histórico)
        'nombre_cliente',
        'telefono',
        'correo_cliente',

        // detalle de productos / servicios
        'items',

        // totales
        'descuento',
        'total',
        'moneda',

        // extras
        'notas_adicionales',
        'fecha_cotizacion',
        'drive_url',

        // estado de envío
        'enviado_por_correo',
        'enviado_por_whatsapp',
    ];

    /* ===============================
     | CASTS
     =============================== */
    protected $casts = [
        'items' => 'array',
        'descuento' => 'float',
        'total' => 'float',
        'fecha_cotizacion' => 'date',
        'enviado_por_correo' => 'boolean',
        'enviado_por_whatsapp' => 'boolean',
    ];

    /* ===============================
     | RELACIONES
     =============================== */

    /** En qué moneda está la cotización: el símbolo y cómo se escribe el monto en letras. Las de siempre, en bolivianos. */
    public const MONEDAS = [
        'BOB' => ['simbolo' => 'Bs', 'letras' => 'bolivianos'],
        'USD' => ['simbolo' => '$us', 'letras' => 'dólares estadounidenses'],
    ];

    public function simboloMoneda(): string
    {
        return (self::MONEDAS[$this->moneda] ?? self::MONEDAS['BOB'])['simbolo'];
    }

    public function montoEnLetras(float $monto): string
    {
        return \App\Support\MontoEnLetras::enLetras($monto, (self::MONEDAS[$this->moneda] ?? self::MONEDAS['BOB'])['letras']);
    }

    // 👤 Usuario que creó la cotización (admin o vendedor)
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // 🧑 Cliente asociado (opcional, pero recomendado)
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
