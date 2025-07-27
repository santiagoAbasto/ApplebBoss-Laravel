<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ServicioTecnico extends Model
{
    use HasFactory;

    protected $fillable = [
        'codigo_nota',           // ✅ NUEVO campo agregado
        'cliente',
        'telefono',
        'equipo',
        'detalle_servicio',
        'precio_costo',
        'precio_venta',
        'tecnico',
        'fecha',
        'user_id',
        'cliente_id',            // ✅ Ya estaba agregado correctamente
    ];

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
    public function venta()
    {
        return $this->hasOne(Venta::class, 'codigo_nota', 'codigo_nota');
    }
}
