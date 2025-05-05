<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ServicioTecnico extends Model
{
    use HasFactory;

    protected $fillable = [
        'cliente',
        'telefono',
        'equipo',
        'detalle_servicio',
        'precio_costo',
        'precio_venta',
        'tecnico',
        'fecha',
        'user_id',
    ];

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
