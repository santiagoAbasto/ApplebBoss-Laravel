<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Cliente extends Model
{
    use HasFactory;

    protected $table = 'clientes';

    protected $fillable = [
        'user_id',     // admin o vendedor dueño del cliente
        'nombre',
        'telefono',
        'correo',
        'documento',
    ];

    /* ===============================
     | RELACIONES
     =============================== */

    // 🔗 El cliente pertenece a un usuario (admin o vendedor)
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // 🔗 Un cliente puede tener muchas cotizaciones
    public function cotizaciones()
    {
        return $this->hasMany(Cotizacion::class, 'cliente_id');
    }

    // 🔗 Historial de promociones enviadas
    public function promociones()
    {
        return $this->hasMany(PromocionEnviada::class);
    }
}
