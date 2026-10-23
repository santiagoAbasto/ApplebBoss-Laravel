<?php

namespace App\Models;

use App\Models\Concerns\ProductoDeProveedor;
use App\Models\Concerns\TieneCondicion;
use Illuminate\Database\Eloquent\Model;

class ProductoApple extends Model
{
    use TieneCondicion, ProductoDeProveedor;

    /** Tipo de inventario (para el margen de proveedor). */
    public const TIPO_INVENTARIO = 'producto_apple';

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
        'es_proveedor',
        'proveedor',
        'costo_usd',
        'margen_usd',
        'tiene_imei',
        'imei_1',
        'imei_2',
        'estado_imei',
        'estado',
        'condicion',
    ];

    // precio_costo/precio_venta ya no se castean aquí: el trait ProductoDeProveedor los resuelve como accessors
    // (en productos de proveedor se calculan en Bs desde el costo en USD × dólar paralelo).
    protected $casts = [
        'tiene_imei'   => 'boolean',
        'es_proveedor' => 'boolean',
        'costo_usd'    => 'float',
        'margen_usd'   => 'float',
    ];

    public function ventaItems()
{
    return $this->hasMany(VentaItem::class);
}

}
