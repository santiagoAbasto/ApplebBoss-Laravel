<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoApple extends Model
{
    protected $table = 'productos_apple';

    protected $fillable = [
        'modelo',
        'capacidad',
        'bateria',
        'color',
        'numero_serie',
        'procedencia',
        'precio_costo',
        'precio_venta',
        'tiene_imei',
        'imei_1',
        'imei_2',
        'estado_imei',
        'estado',
    ];

    protected $casts = [
        'tiene_imei' => 'boolean',
        'precio_costo' => 'float',
        'precio_venta' => 'float',
    ];

    public function ventaItems()
{
    return $this->hasMany(VentaItem::class);
}

}
