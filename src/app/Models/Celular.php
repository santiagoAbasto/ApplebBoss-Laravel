<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Celular extends Model
{
    use HasFactory;

    /**
     * Nombre explícito de la tabla en la base de datos.
     */
    protected $table = 'celulares'; // ✅ Corrige el error de "celulars"

    /**
     * Campos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'modelo',
        'capacidad',
        'color',
        'bateria',
        'imei_1',
        'imei_2',
        'estado_imei',
        'procedencia',
        'precio_costo',
        'precio_venta',
        'estado',
    ];

    // 🔖 Constantes de estado del IMEI
    public const ESTADO_IMEI_LIBRE = 'libre';
    public const ESTADO_IMEI_REGISTRADO = 'registrado';
    public const ESTADO_IMEI1_LIBRE_IMEI2_REGISTRADO = 'imei1_libre_imei2_registrado';
    public const ESTADO_IMEI1_REGISTRADO_IMEI2_LIBRE = 'imei1_registrado_imei2_libre';

    // 🔖 Constantes de estado del producto
    public const ESTADO_DISPONIBLE = 'disponible';
    public const ESTADO_VENDIDO = 'vendido';
    public const ESTADO_PERMUTA = 'permuta';
}
