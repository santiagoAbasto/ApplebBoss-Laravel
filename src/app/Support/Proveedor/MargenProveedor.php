<?php

namespace App\Support\Proveedor;

use Illuminate\Support\Str;

/**
 * La ganancia (margen) que le sumamos al costo del proveedor, EN DÓLARES, por categoría. Fija y editable aquí.
 * Cada producto puede tener su propio margen (celular->margen_usd); si no, se usa el de su categoría.
 * Idea: ganar poco por unidad para vender más, porque no es nuestro capital — solo suma cuando se vende.
 */
final class MargenProveedor
{
    /** Margen por defecto en USD según el tipo de inventario. */
    public const POR_TIPO = [
        'celular'          => 60,  // iPhone (y Android)
        'computadora'      => 70,  // Mac
        'producto_apple'   => 40,  // iPad, Pencil, teclados… (Watch y AirPods se afinan abajo)
        'producto_general' => 40,  // accesorios Apple sueltos
    ];

    /** Afinado por subtipo dentro de «Apple»: Apple Watch y AirPods ganan 30; iPad/Pencil/teclado 40. */
    public static function enUsd(string $tipo, ?string $nombre = null): float
    {
        if (in_array($tipo, ['producto_apple', 'producto_general'], true) && $nombre) {
            $n = Str::lower($nombre);
            if (str_contains($n, 'watch')) {
                return 30;
            }
            // AirPods normales 30; AirPods Max (audífonos over-ear) 40
            if (str_contains($n, 'airpod')) {
                return str_contains($n, 'max') ? 40 : 30;
            }
        }

        return (float) (self::POR_TIPO[$tipo] ?? 40);
    }
}
