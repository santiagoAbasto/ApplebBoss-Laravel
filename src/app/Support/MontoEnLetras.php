<?php

namespace App\Support;

/**
 * «Son: Diez mil ochocientos 00/100 bolivianos», como se escribe un monto en un comprobante.
 * La imagen de producción no trae la extensión intl, por eso no se usa NumberFormatter.
 */
class MontoEnLetras
{
    private const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece',
        'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
        'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];

    private const DECENAS = [3 => 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

    private const CENTENAS = [1 => 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos',
        'ochocientos', 'novecientos'];

    public static function bolivianos(float|int|string $monto): string
    {
        $monto    = round((float) $monto, 2);
        $entero   = (int) floor(abs($monto));
        $centavos = (int) round((abs($monto) - $entero) * 100);

        return ucfirst(self::entero($entero)) . ' ' . str_pad((string) $centavos, 2, '0', STR_PAD_LEFT) . '/100 bolivianos';
    }

    public static function entero(int $n): string
    {
        if ($n === 0) {
            return 'cero';
        }

        $millones = intdiv($n, 1_000_000);
        $miles    = intdiv($n % 1_000_000, 1000);
        $resto    = $n % 1000;
        $partes   = [];

        if ($millones) {
            $partes[] = $millones === 1 ? 'un millón' : self::apocopar(self::hastaMil($millones)) . ' millones';
        }
        if ($miles) {
            $partes[] = $miles === 1 ? 'mil' : self::apocopar(self::hastaMil($miles)) . ' mil';
        }
        if ($resto) {
            $partes[] = self::hastaMil($resto);
        }

        return implode(' ', $partes);
    }

    private static function hastaMil(int $n): string
    {
        if ($n === 100) {
            return 'cien';
        }

        $texto = $n >= 100 ? self::CENTENAS[intdiv($n, 100)] . ' ' : '';
        $n %= 100;

        if ($n < 30) {
            return trim($texto . self::UNIDADES[$n]);
        }

        return trim($texto . self::DECENAS[intdiv($n, 10)] . ($n % 10 ? ' y ' . self::UNIDADES[$n % 10] : ''));
    }

    /** «veintiuno mil» no existe: delante de «mil» y «millones» es «veintiún», «treinta y un». */
    private static function apocopar(string $texto): string
    {
        return preg_replace(['/veintiuno$/u', '/uno$/u'], ['veintiún', 'un'], $texto);
    }
}
