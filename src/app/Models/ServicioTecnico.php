<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ServicioTecnico extends Model
{
    use HasFactory;

    protected $fillable = [
        'codigo_nota',
        'cliente',
        'telefono',
        'equipo',
        'detalle_servicio',
        'precio_costo',
        'precio_venta',
        'tecnico',
        'fecha',
        'user_id',
        'cliente_id',
        'venta_id',
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
        return $this->belongsTo(Venta::class); // 🔗 relación oficial por venta_id
    }
}
