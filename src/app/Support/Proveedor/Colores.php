<?php

namespace App\Support\Proveedor;

/**
 * Traduce los colores como los escribe un proveedor al nombre que usa el catálogo, para que un mismo color de dos
 * proveedores (p. ej. «BLUE» de Planet y «Deep» de Apple Land en un iPhone 17 Pro) se reconozca como el mismo y no
 * salga en dos tarjetas. No es exacto: lo que no reconoce lo deja con su nombre tal cual (la vista previa lo muestra).
 */
final class Colores
{
    /** Las columnas de «precio por colores» del Excel de Apple Land. «otros» = los colores que no son Vino. */
    public static function deColumna(string $nombre): array
    {
        return match (mb_strtolower(trim($nombre))) {
            'cosmic' => ['Cosmic'],
            'deep'   => ['Deep'],
            'silver' => ['Silver'],
            'vino'   => ['Vino'],
            'otros'  => ['Negro', 'Silver', 'Azul'],
            default  => [ucfirst(mb_strtolower(trim($nombre)))],
        };
    }

    /** La columna COLORES del PDF de Planet ("NEGRO, BLUE, LAVERDER, SAGE, WHITE") → nombres del catálogo. */
    public static function deTexto(string $texto, string $modelo = ''): array
    {
        $texto = trim($texto);
        if ($texto === '') {
            return [];
        }
        $proMax = (bool) preg_match('/\b17\b.*\bpro\b/u', mb_strtolower($modelo)); // el 17 Pro/Max usa Cosmic/Deep

        $colores = [];
        foreach (preg_split('/[,\/]|\s+y\s+/u', $texto) as $crudo) {
            $c = self::uno(trim($crudo), $proMax);
            if ($c !== '') {
                $colores[] = $c;
            }
        }

        return array_values(array_unique($colores));
    }

    private static function uno(string $c, bool $proMax): string
    {
        $t = mb_strtolower(\Illuminate\Support\Str::ascii(trim($c)));
        if ($t === '') {
            return '';
        }

        return match (true) {
            in_array($t, ['black', 'negro'], true)                 => 'Negro',
            in_array($t, ['white', 'blanco'], true)                => 'Blanco',
            in_array($t, ['silver', 'plata'], true)                => 'Silver',
            in_array($t, ['blue', 'azul'], true)                   => $proMax ? 'Deep' : 'Azul',
            in_array($t, ['orange', 'naranja'], true)              => $proMax ? 'Cosmic' : 'Naranja',
            in_array($t, ['burgundy', 'vino', 'borgona', 'borbona'], true) => 'Vino',
            in_array($t, ['pink', 'rosa'], true)                   => 'Rosa',
            $t === 'rosado'                                        => 'Rosado',
            $t === 'teal'                                          => 'Teal',
            $t === 'sage'                                          => 'Sage',
            in_array($t, ['laverder', 'lavender', 'lavanda'], true) => 'Lavanda',
            in_array($t, ['green', 'verde'], true)                 => 'Verde',
            in_array($t, ['purple', 'morado', 'lila'], true)       => 'Lila',
            in_array($t, ['gold', 'oro'], true)                    => 'Oro',
            str_contains($t, 'starlight')                          => 'Blanco estelar',
            str_contains($t, 'midnight')                           => 'Medianoche',
            str_contains($t, 'natural')                            => 'Natural',
            in_array($t, ['gray', 'grey', 'gris'], true)           => 'Gris',
            default                                                => ucfirst($t),
        };
    }
}
