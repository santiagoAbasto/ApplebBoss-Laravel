<?php

namespace App\Support\Navidad;

/**
 * Adornos de Navidad para los PDF y los correos, como imágenes en data URI.
 *
 * dompdf no dibuja <svg> en línea ni degradados repetidos, y su lector de SVG solo resuelve formas simples: por
 * eso la franja de bastón de caramelo se arma con paralelogramos y el gorro con trazos de curva básicos. El ancho
 * y el alto de cada SVG son los de su viewBox (ese lector no escala uno contra el otro).
 */
class AdornoPdf
{
    public const PINO = '#143D2B';
    public const BURDEOS = '#A42635';
    public const ORO = '#E2BC72';
    public const MARFIL = '#FFF8EE';

    /** Franja de bastón de caramelo: rayas burdeos y marfil inclinadas. */
    public static function franja(int $ancho = 560, int $alto = 8): string
    {
        $paso = $alto * 2;
        $rayas = '';
        for ($x = -$alto; $x < $ancho + $alto; $x += $paso) {
            $rayas .= sprintf('<path d="M%d %d L%d %d L%d 0 L%d 0 Z" fill="%s"/>', $x, $alto, $x + $alto, $alto, $x + $paso, $x + $alto, self::BURDEOS);
        }

        return self::uri(sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" width="%1$d" height="%2$d" viewBox="0 0 %1$d %2$d"><rect width="%1$d" height="%2$d" fill="%3$s"/>%4$s</svg>',
            $ancho, $alto, self::MARFIL, $rayas
        ));
    }

    /** Gorro de Papá Noel, el mismo dibujo que lleva el logotipo en la web. */
    public static function gorro(): string
    {
        return self::uri(
            '<svg xmlns="http://www.w3.org/2000/svg" width="68" height="60" viewBox="0 0 68 60">'
            . '<path d="M10 43 C9 24 22 8 39 8 C51 8 60 17 60 31 C57 26 52 24 48 27 C44 30 45 37 46 43 Z" fill="' . self::BURDEOS . '"/>'
            . '<rect x="4" y="38" width="46" height="14" rx="7" fill="#FFFFFF" stroke="#E9DCC6" stroke-width="1"/>'
            . '<circle cx="60" cy="34" r="7" fill="#FFFFFF" stroke="#E9DCC6" stroke-width="1"/>'
            . '</svg>'
        );
    }

    /** Arbolito con estrella, para el saludo de los documentos. */
    public static function arbol(): string
    {
        return self::uri(
            '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">'
            . '<path d="M20 6 L30 20 L10 20 Z" fill="' . self::PINO . '"/><path d="M20 14 L34 32 L6 32 Z" fill="#1F5A40"/><path d="M20 24 L38 44 L2 44 Z" fill="' . self::PINO . '"/>'
            . '<rect x="17" y="43" width="6" height="5" fill="#6B4A2B"/>'
            . '<circle cx="15" cy="27" r="2" fill="' . self::BURDEOS . '"/><circle cx="26" cy="37" r="2" fill="' . self::ORO . '"/><circle cx="12" cy="40" r="2" fill="' . self::BURDEOS . '"/>'
            . '<path d="M20 0 L21.500 4 L25.500 5.500 L21.500 7 L20 11 L18.500 7 L14.500 5.500 L18.500 4 Z" fill="' . self::ORO . '"/>'
            . '</svg>'
        );
    }

    private static function uri(string $svg): string
    {
        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }
}
