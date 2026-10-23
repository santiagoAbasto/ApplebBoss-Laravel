<?php

namespace App\Support\Celulares;

use Illuminate\Support\Str;

/**
 * Las marcas de teléfonos. La clave se guarda en celulares.marca; la etiqueta es lo que ve el cliente. Los chips de
 * acceso rápido son las más comunes en Bolivia; el resto va en el desplegable con buscador. `apple` se muestra como
 * «iPhone» porque es la línea de teléfonos de Apple.
 */
final class Marcas
{
    /** clave => etiqueta. El orden es el del desplegable (los chips primero). */
    public const MARCAS = [
        'iphone'    => 'iPhone',
        'samsung'   => 'Samsung',
        'xiaomi'    => 'Xiaomi',
        'realme'    => 'Realme',
        'honor'     => 'Honor',
        'google'    => 'Google',
        'huawei'    => 'Huawei',
        'motorola'  => 'Motorola',
        'oppo'      => 'OPPO',
        'vivo'      => 'vivo',
        'oneplus'   => 'OnePlus',
        'nothing'   => 'Nothing',
        'sony'      => 'Sony',
        'nokia'     => 'Nokia',
        'asus'      => 'ASUS',
        'zte'       => 'ZTE',
        'tcl'       => 'TCL',
        'infinix'   => 'Infinix',
        'tecno'     => 'Tecno',
        'alcatel'   => 'Alcatel',
        'lg'        => 'LG',
        'htc'       => 'HTC',
        'lenovo'    => 'Lenovo',
        'meizu'     => 'Meizu',
        'blu'       => 'BLU',
        'cat'       => 'CAT',
        'fairphone' => 'Fairphone',
        'otro'      => 'Otra marca',
    ];

    /** Los botones de acceso rápido (check), en orden. */
    public const CHIPS = ['iphone', 'samsung', 'xiaomi', 'realme', 'honor'];

    public const POR_DEFECTO = 'iphone';

    public static function existe(?string $clave): bool
    {
        return $clave !== null && array_key_exists($clave, self::MARCAS);
    }

    public static function etiqueta(?string $clave): string
    {
        return self::existe($clave) ? self::MARCAS[$clave] : self::MARCAS[self::POR_DEFECTO];
    }

    /** Lo que necesita el formulario: todas las marcas como {value,label} y cuáles son chips. */
    public static function paraFormulario(): array
    {
        return [
            'todas' => collect(self::MARCAS)->map(fn ($label, $value) => compact('value', 'label'))->values()->all(),
            'chips' => self::CHIPS,
        ];
    }

    /**
     * Adivina la marca a partir del nombre/modelo del teléfono. Palabras clave y submarcas conocidas; si no reconoce
     * nada, asume iPhone (es lo que más se vende y lo que había por defecto).
     */
    public static function detectar(?string $nombre): string
    {
        $n = Str::lower(trim((string) $nombre));
        if ($n === '') {
            return self::POR_DEFECTO;
        }

        foreach (self::REGLAS as $clave => $palabras) {
            foreach ($palabras as $palabra) {
                if (str_contains($n, $palabra)) {
                    return $clave;
                }
            }
        }

        return self::POR_DEFECTO;
    }

    /** Palabras (y submarcas) que delatan cada marca. Se revisan en este orden. */
    private const REGLAS = [
        'google'   => ['pixel', 'google'],
        'samsung'  => ['samsung', 'galaxy'],
        'xiaomi'   => ['xiaomi', 'redmi', 'poco'],
        'realme'   => ['realme'],
        'honor'    => ['honor'],
        'huawei'   => ['huawei', 'mate '],
        'motorola' => ['motorola', 'moto '],
        'oppo'     => ['oppo'],
        'oneplus'  => ['oneplus', 'one plus'],
        'vivo'     => ['vivo '],
        'nothing'  => ['nothing'],
        'sony'     => ['sony', 'xperia'],
        'nokia'    => ['nokia'],
        'asus'     => ['asus', 'zenfone', 'rog phone'],
        'zte'      => ['zte'],
        'tcl'      => ['tcl'],
        'infinix'  => ['infinix'],
        'tecno'    => ['tecno'],
        'alcatel'  => ['alcatel'],
        'lg'       => ['lg '],
        'htc'      => ['htc'],
        'lenovo'   => ['lenovo'],
        'meizu'    => ['meizu'],
        'blu'      => ['blu '],
        'fairphone' => ['fairphone'],
        'iphone'   => ['iphone', 'apple'],
    ];
}
