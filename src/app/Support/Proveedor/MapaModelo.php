<?php

namespace App\Support\Proveedor;

/**
 * Convierte el texto de un modelo tal como lo escribe un proveedor en su lista ("17 pro max 256gb ESIM",
 * "APPLE WATCH SE 3RA DE 40MM", "MACBOOK AIR M5 2026 13\" 16GB/512GB") a la forma que usa el catálogo
 * (tipo, modelo, capacidad, sim). Devuelve null cuando no lo reconoce, para que la vista previa lo marque
 * en rojo y el dueño lo revise antes de publicar. No inventa: lo que no entiende, lo deja fuera.
 */
final class MapaModelo
{
    /**
     * @param ?string $simPorDefecto el SIM que se asume para un iPhone 17/18 que NO lo dice: 'fisico' en el Excel de
     *                               Apple Land (donde el eSIM va siempre rotulado), 'esim' en el PDF de Planet.
     * @return array{tipo:string,modelo:string,capacidad:string,sim:?string}|null
     */
    public static function de(string $texto, ?string $simPorDefecto = null): ?array
    {
        $t = self::norm($texto);
        if ($t === '') {
            return null;
        }

        return match (true) {
            self::esAccesorio($t) !== null => self::esAccesorio($t),
            str_contains($t, 'ipad')        => self::ipad($t),
            str_contains($t, 'watch')       => self::watch($t),
            str_contains($t, 'airpod')      => self::airpods($t),
            str_contains($t, 'macbook')     => self::mac($t),
            str_contains($t, 'apple tv') || preg_match('/\btv\b/', $t) === 1 => self::unTipo('producto_apple', 'Apple TV 4K', ''),
            default                         => self::iphone($t, $simPorDefecto),
        };
    }

    /** La capacidad legible ("256 GB", "1 TB") a partir del texto; '' si no dice. */
    public static function capacidad(string $t): string
    {
        // Primero TB/TERA (incluso pegado, "1TERAgb"), luego GB.
        if (preg_match('/(\d+)\s*(?:tera|tb)/u', $t, $m)) {
            return $m[1] . ' TB';
        }
        if (preg_match('/(\d+)\s*gb\b/u', $t, $m)) {
            return $m[1] . ' GB';
        }

        return '';
    }

    /** El tipo de SIM declarado en el texto, o null si no lo dice. */
    public static function sim(string $t): ?string
    {
        if (preg_match('/e-?\s?sim/u', $t)) {
            return 'esim';
        }
        if (preg_match('/c\s*\/?\s*chip|\bchip\b|\bsim\b/u', $t)) {
            return 'fisico';
        }

        return null;
    }

    // ─── iPhone ────────────────────────────────────────────────────────────────

    private static function iphone(string $t, ?string $simPorDefecto = null): ?array
    {
        if (! preg_match('/\b(1[3-8])\b/u', $t, $g)) {
            return null;
        }
        $gen = (int) $g[1];

        $variante = match (true) {
            (bool) preg_match('/pro\s*max/u', $t) => ' Pro Max',
            (bool) preg_match('/\bpro\b/u', $t)   => ' Pro',
            (bool) preg_match('/\bair\b/u', $t)   => ' Air',
            (bool) preg_match('/\be\b/u', $t)     => 'e',
            default                               => '',
        };

        $cap = self::capacidad($t);
        if ($cap === '') {
            return null; // un iPhone sin capacidad no es una fila de producto
        }

        // Si no dice el SIM: un iPhone viejo (≤16) es físico; un 17/18 toma el default de la fuente (Excel físico, PDF eSIM).
        $sim = self::sim($t) ?? ($gen >= 17 ? ($simPorDefecto ?? 'esim') : 'fisico');
        $modelo = $variante === 'e' ? "iPhone {$gen}e" : "iPhone {$gen}{$variante}";

        return ['tipo' => 'celular', 'modelo' => $modelo, 'capacidad' => $cap, 'sim' => $sim];
    }

    // ─── Apple Watch ─────────────────────────────────────────────────────────────

    private static function watch(string $t): ?array
    {
        $caja = preg_match('/(\d{2})\s*mm/u', $t, $m) ? $m[1] . ' mm' : '';
        $modelo = match (true) {
            (bool) preg_match('/ultra\s*4\b/u', $t)               => 'Apple Watch Ultra 4',
            (bool) preg_match('/ultra\s*3\b/u', $t)               => 'Apple Watch Ultra 3',
            (bool) preg_match('/\bultra\b/u', $t)                 => 'Apple Watch Ultra',
            (bool) preg_match('/\bse\b/u', $t)                    => 'Apple Watch SE (3.ª generación)',
            (bool) preg_match('/(serie|series)?\s*12/u', $t)      => 'Apple Watch Series 12',
            (bool) preg_match('/(serie|series)?\s*11/u', $t)      => 'Apple Watch Series 11',
            default                                               => null,
        };
        if ($modelo === null) {
            return null;
        }
        if (str_contains($modelo, 'Ultra')) {
            $caja = '49 mm';
        }

        return ['tipo' => 'producto_apple', 'modelo' => $modelo, 'capacidad' => $caja, 'sim' => null];
    }

    // ─── AirPods ─────────────────────────────────────────────────────────────────

    private static function airpods(string $t): ?array
    {
        $modelo = match (true) {
            str_contains($t, 'max') && str_contains($t, '2026') => 'AirPods Max (USB-C) 2026',
            str_contains($t, 'max')                             => 'AirPods Max (USB-C)',
            (bool) preg_match('/pro\s*3|3\s*(ra|era)?\s*gen/u', $t) => 'AirPods Pro 3',
            str_contains($t, '4') && str_contains($t, 'con')    => 'AirPods 4 con cancelación activa de ruido',
            str_contains($t, '4')                               => 'AirPods 4',
            (bool) preg_match('/2\s*(da|nd)?\s*gen/u', $t)       => 'AirPods (2.ª generación)',
            default                                              => null,
        };

        return $modelo ? self::unTipo('producto_apple', $modelo, '') : null;
    }

    // ─── Accesorios (Pencil, Mouse, Magic Keyboard) ──────────────────────────────

    private static function esAccesorio(string $t): ?array
    {
        if (str_contains($t, 'pencil')) {
            return self::unTipo('producto_apple', str_contains($t, 'pro') ? 'Apple Pencil Pro' : 'Apple Pencil (USB-C)', '');
        }
        if (str_contains($t, 'mouse')) {
            return self::unTipo('producto_apple', 'Magic Mouse (USB-C)', '');
        }
        if (str_contains($t, 'magic keyboard') || (str_contains($t, 'keyboard') && str_contains($t, 'ipad'))) {
            $modelo = match (true) {
                str_contains($t, '12.9')                       => 'Magic Keyboard para iPad Pro 12.9',
                str_contains($t, 'air')                        => 'Magic Keyboard para iPad Air (M3/M4)',
                (bool) preg_match('/pro\s*11/u', $t)           => 'Magic Keyboard para iPad Pro 11 (M4/M5)',
                default                                        => 'Magic Keyboard para iPad (10.9" y 11")',
            };

            return self::unTipo('producto_apple', $modelo, '');
        }

        return null;
    }

    // ─── iPad ────────────────────────────────────────────────────────────────────

    private static function ipad(string $t): ?array
    {
        if (str_contains($t, 'keyboard')) {
            return self::esAccesorio($t);
        }
        $cap = self::capacidad($t);
        $modelo = match (true) {
            str_contains($t, 'pro') && (str_contains($t, '13') || str_contains($t, 'm5') && str_contains($t, '13')) => 'iPad Pro de 13 pulgadas (M5)',
            str_contains($t, 'pro') && str_contains($t, '11') && str_contains($t, 'm5')  => 'iPad Pro de 11 pulgadas (M5)',
            str_contains($t, 'pro') && str_contains($t, '11') && str_contains($t, 'm4')  => 'iPad Pro de 11 pulgadas (M4)',
            str_contains($t, 'pro') && str_contains($t, '13')                            => 'iPad Pro de 13 pulgadas (M5)',
            str_contains($t, 'pro') && str_contains($t, '11')                            => 'iPad Pro de 11 pulgadas (M5)',
            str_contains($t, 'air') && str_contains($t, '13')                            => 'iPad Air de 13 pulgadas (M3)',
            str_contains($t, 'air') && str_contains($t, '11')                            => 'iPad Air de 11 pulgadas (M4)',
            (bool) preg_match('/\ba16\b|11\s*va|11\.?a/u', $t)                            => 'iPad (11.ª generación)',
            (bool) preg_match('/10\s*(th|ma)/u', $t)                                      => 'iPad (10.ª generación)',
            default                                                                       => null,
        };

        return $modelo ? ['tipo' => 'producto_apple', 'modelo' => $modelo, 'capacidad' => $cap, 'sim' => null] : null;
    }

    // ─── Mac ─────────────────────────────────────────────────────────────────────

    private static function mac(string $t): ?array
    {
        // El identificador de una Mac para EMPAREJAR con la lista actual (no para mostrar): «TERA» → «TB», se separa la
        // capacidad final tras «/» y el resto queda como nombre normalizado. La clave() lo vuelve un conjunto de palabras,
        // así «MACBOOK AIR M5 2026 13" 16GB/512GB» empareja con «MacBook Air M5 2026 13" 16GB» del catálogo.
        // El almacenamiento va DESPUÉS de «/» (RAM/almacenamiento, p. ej. 16GB/512GB → disco 512 GB). Si no hay «/»,
        // la capacidad que aparezca (la Neo es «256GB» a secas). El nombre es todo menos ese «/almacenamiento».
        $cap = preg_match('#/\s*(\d+)\s*(tera|tb|gb)#u', $t, $m)
            ? (in_array($m[2], ['tera', 'tb'], true) ? $m[1] . ' TB' : $m[1] . ' GB')
            : self::capacidad($t);

        if (str_contains($t, 'neo')) {
            return ['tipo' => 'computadora', 'modelo' => 'macbook neo', 'capacidad' => $cap, 'sim' => null];
        }

        $nombre = trim((string) preg_replace('#\s*/\s*[\d.]+\s*(?:tera|tb|gb)\b.*$#u', '', $t));

        return $nombre !== '' ? ['tipo' => 'computadora', 'modelo' => $nombre, 'capacidad' => $cap, 'sim' => null] : null;
    }

    /**
     * Clave de EMPAREJAMIENTO de un producto (tipo + modelo + capacidad + SIM), como conjunto de palabras ordenadas,
     * para unir una fila de la lista con el producto del catálogo aunque el nombre esté escrito distinto. Se usa sobre
     * la salida de self::de() y sobre los items del catálogo actual.
     */
    public static function clave(string $tipo, string $modelo, string $capacidad, ?string $sim): string
    {
        $palabras = preg_split('/[^a-z0-9]+/u', self::norm($modelo), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        sort($palabras);
        $cap = (string) preg_replace('/[^a-z0-9]+/u', '', self::norm($capacidad));
        // El SIM se normaliza para que «eSIM» y «esim», o «chip» y «fisico», se emparejen.
        $simNorm = match (mb_strtolower(trim((string) $sim))) {
            'esim', 'e-sim', 'virtual'                                           => 'esim',
            'chip', 'fisico', 'física', 'fisica', 'chip físico', 'physical'      => 'fisico',
            default                                                              => '',
        };

        return $tipo . '|' . implode(' ', $palabras) . '|' . $cap . '|' . $simNorm;
    }

    // ─── Apoyo ───────────────────────────────────────────────────────────────────

    /** @return array{tipo:string,modelo:string,capacidad:string,sim:null} */
    private static function unTipo(string $tipo, string $modelo, string $cap): array
    {
        return ['tipo' => $tipo, 'modelo' => $modelo, 'capacidad' => $cap, 'sim' => null];
    }

    /** Minúsculas, sin tildes, espacios colapsados. */
    private static function norm(string $s): string
    {
        $s = \Illuminate\Support\Str::ascii($s);
        $s = mb_strtolower(trim($s));

        return (string) preg_replace('/\s+/u', ' ', $s);
    }
}
