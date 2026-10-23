<?php

namespace App\Models;

use App\Models\Concerns\ProductoDeProveedor;
use App\Models\Concerns\TieneCondicion;
use Illuminate\Database\Eloquent\Model;

class Computadora extends Model
{
    use TieneCondicion, ProductoDeProveedor;

    /** Tipo de inventario (para el margen de proveedor). */
    public const TIPO_INVENTARIO = 'computadora';

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
        'es_proveedor',
        'proveedor',
        'costo_usd',
        'margen_usd',
        'estado',
        'condicion',
    ];

    protected $casts = [
        'es_proveedor' => 'boolean',
        'costo_usd'    => 'float',
        'margen_usd'   => 'float',
    ];
}    