<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\User;
use App\Models\Venta;

class ServicioTecnico extends Model
{
    use HasFactory;

    /**
     * Campos asignables en masa
     */
    protected $fillable = [
        'codigo_nota',
        'cliente',
        'telefono',
        'equipo',
        'detalle_servicio',
        'notas_adicionales', // 👈 NUEVO
        'precio_costo',
        'precio_venta',
        'tecnico',
        'fecha',
        'user_id',
        'venta_id',
    ];

    /**
     * Casts automáticos
     */
    protected $casts = [
        'fecha' => 'date',
    ];

    /**
     * Generación automática del código de nota
     * Formato: AT-ST001, AT-ST002, etc.
     */
    protected static function booted()
    {
        static::created(function (ServicioTecnico $servicio) {
            if (empty($servicio->codigo_nota)) {
                $servicio->codigo_nota = 'AT-ST' . str_pad($servicio->id, 3, '0', STR_PAD_LEFT);
                $servicio->save();
            }
        });
    }

    /* =========================
     |  RELACIONES
     ========================= */

    /**
     * Usuario que registró el servicio (vendedor)
     */
    public function vendedor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Venta asociada (opcional)
     */
    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }
}
