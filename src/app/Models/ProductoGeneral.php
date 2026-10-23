<?php

namespace App\Models;

use App\Models\Concerns\ProductoDeProveedor;
use App\Models\Concerns\TieneCondicion;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductoGeneral extends Model
{
    use HasFactory, TieneCondicion, ProductoDeProveedor;

    /** Tipo de inventario (para el margen de proveedor). */
    public const TIPO_INVENTARIO = 'producto_general';

    /**
     * Nombre explícito de la tabla.
     */
    protected $table = 'productos_generales'; // 🔧 Evita que Laravel use "producto_generals"

    /**
     * Campos asignables masivamente.
     */
    protected $fillable = [
        'codigo',
        'tipo',
        'nombre',
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

    // Los productos generales (accesorios) entran como nuevos, salvo que se indique otra condición
    protected $attributes = [
        'condicion' => 'Nuevo',
    ];

    // (Opcional) Puedes definir constantes si deseas usar estados por código
    public const ESTADO_DISPONIBLE = 'disponible';
    public const ESTADO_VENDIDO = 'vendido';
    public const ESTADO_PERMUTA = 'permuta';
}
