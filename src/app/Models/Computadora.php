<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Computadora extends Model
{
    protected $fillable = [
        'numero_serie',
        'nombre',
        'procesador', // 👈 nuevo campo
        'bateria',
        'color',
        'ram',
        'almacenamiento',
        'procedencia',
        'precio_costo',
        'precio_venta',
        'estado',
    ];
}    