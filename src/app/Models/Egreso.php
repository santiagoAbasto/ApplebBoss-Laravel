<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // ✅ ESTA LÍNEA FALTABA
use Illuminate\Database\Eloquent\Model;

class Egreso extends Model
{
    use HasFactory;

    protected $fillable = [
        'concepto',
        'precio_invertido',
        'tipo_gasto',
        'frecuencia',
        'cuotas_pendientes',
        'comentario',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getCuotasFormateadasAttribute()
    {
        return $this->tipo_gasto === 'cuota_bancaria'
            ? $this->cuotas_pendientes . ' cuotas restantes'
            : 'No aplica';
    }
}
