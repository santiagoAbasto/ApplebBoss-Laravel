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

    public function scopeOrdenInventarioIphone($query)
    {
        $modeloNormalizado = "LOWER(REGEXP_REPLACE(COALESCE(modelo, ''), '[^a-zA-Z0-9]', '', 'g'))";
        $ordenModelo = [
            ["({$modeloNormalizado} = 'x' OR {$modeloNormalizado} LIKE '%iphonex%') AND {$modeloNormalizado} NOT LIKE '%xs%' AND {$modeloNormalizado} NOT LIKE '%xr%'", 100],
            ["({$modeloNormalizado} LIKE '%iphonexs%' OR {$modeloNormalizado} LIKE '%xs%') AND {$modeloNormalizado} NOT LIKE '%xsmax%'", 110],
            ["{$modeloNormalizado} LIKE '%iphonexsmax%' OR {$modeloNormalizado} LIKE '%xsmax%'", 120],
            ["{$modeloNormalizado} LIKE '%iphonexr%' OR {$modeloNormalizado} LIKE '%xr%'", 130],
        ];

        foreach (range(11, 20) as $serie) {
            $base = $serie * 100;
            $ordenModelo[] = ["{$modeloNormalizado} LIKE '%{$serie}mini%'", $base + 10];
            $ordenModelo[] = ["({$modeloNormalizado} LIKE '%iphone{$serie}%' OR {$modeloNormalizado} LIKE '{$serie}%') AND {$modeloNormalizado} NOT LIKE '%mini%' AND {$modeloNormalizado} NOT LIKE '%plus%' AND {$modeloNormalizado} NOT LIKE '%pro%'", $base + 20];
            $ordenModelo[] = ["{$modeloNormalizado} LIKE '%{$serie}plus%'", $base + 30];
            $ordenModelo[] = ["{$modeloNormalizado} LIKE '%{$serie}pro%' AND {$modeloNormalizado} NOT LIKE '%promax%'", $base + 40];
            $ordenModelo[] = ["{$modeloNormalizado} LIKE '%{$serie}promax%'", $base + 50];
        }

        $caseModelo = collect($ordenModelo)
            ->map(fn ($orden) => "WHEN {$orden[0]} THEN {$orden[1]}")
            ->implode(' ');

        return $query
            ->orderByRaw("CASE estado WHEN 'disponible' THEN 0 ELSE 1 END")
            ->orderByRaw("CASE {$caseModelo} ELSE 9999 END")
            ->orderByRaw($modeloNormalizado)
            ->orderBy('capacidad')
            ->orderBy('color');
    }
}
