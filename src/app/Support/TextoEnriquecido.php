<?php

namespace App\Support;

/**
 * Texto con formato que escribe una persona en el panel (títulos, negrita, listas, enlaces).
 *
 * limpiar() deja solo las etiquetas permitidas, sin atributos: es lo que se guarda.
 * aHtml()   es lo que se imprime en un PDF; si la nota es texto plano de antes, le da estructura.
 * aTexto()  es la versión sin etiquetas para tickets de 80 mm, listados y búsquedas.
 */
class TextoEnriquecido
{
    private const PERMITIDAS = '<p><br><strong><b><em><i><ul><ol><li><h2><h3><h4><a>';

    public static function limpiar(?string $html): ?string
    {
        if (blank($html)) {
            return null;
        }

        // El editor del navegador arma los renglones con <div>: pasan a ser párrafos
        // Un script o un estilo se va entero, no solo sus etiquetas
        $html  = preg_replace('/<(script|style)\b.*?<\/\1>/is', '', $html);
        $html  = preg_replace(['/<div\b[^>]*>/i', '/<\/div>/i'], ['<p>', '</p>'], $html);
        $clean = strip_tags($html, self::PERMITIDAS);

        $clean = preg_replace_callback('/<(?!a\b|\/a)([a-z][a-z0-9]*)\b[^>]*>/i', fn ($m) => '<' . strtolower($m[1]) . '>', $clean);

        $clean = preg_replace_callback('/<a\b([^>]*)>/i', function ($m) {
            $href = '';
            if (preg_match('/\bhref\s*=\s*["\']([^"\']*)["\']/', $m[1], $h) && ! preg_match('/^\s*(javascript|data|vbscript):/i', $h[1])) {
                $href = ' href="' . htmlspecialchars(trim($h[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"';
            }
            $extra = preg_match('/\btarget=["\']_blank["\']/i', $m[1]) ? ' target="_blank" rel="noopener noreferrer"' : '';

            return '<a' . $href . $extra . '>';
        }, $clean);

        // Si solo quedaron etiquetas vacías, no hay nada que guardar
        return trim(strip_tags($clean)) === '' ? null : trim($clean);
    }

    public static function tieneFormato(?string $texto): bool
    {
        return (bool) preg_match('/<(p|br|ul|ol|li|h[2-4]|strong|b|em|i)\b/i', (string) $texto);
    }

    public static function aHtml(?string $texto): string
    {
        if (blank($texto)) {
            return '';
        }

        return self::tieneFormato($texto) ? (string) self::limpiar($texto) : self::estructurar($texto);
    }

    public static function aTexto(?string $texto): string
    {
        $texto = preg_replace('/<\/(p|li|h[2-4]|div)>|<br\s*\/?>/i', "\n", (string) $texto);
        $texto = html_entity_decode(strip_tags($texto), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // El editor mete espacios duros (&nbsp;): en un ticket son espacios comunes
        return trim(preg_replace(["/[ \t\x{00A0}]+/u", "/\n\s*\n+/u"], [' ', "\n"], $texto));
    }

    /**
     * Notas de texto plano (las de antes del editor, o pegadas de corrido): cada «Rótulo: …» pasa a
     * ser un párrafo con el rótulo en negrita y las enumeraciones con punto y coma, una lista.
     */
    private static function estructurar(string $texto): string
    {
        $e = fn (string $s) => htmlspecialchars(trim($s), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Corta antes de cada rótulo de hasta 6 palabras que empieza con mayúscula y termina en dos puntos
        $rotulo  = '(?:\p{Lu}[\p{L}\p{N}\/]*)(?:\s+[\p{L}\p{N}\/]+){0,5}:';
        // «Rótulo:» solo en su renglón, con el texto en el de abajo: es lo mismo que en un solo renglón
        $texto   = preg_replace('/^(' . $rotulo . ')[ \t]*\R+(?=\S)/mu', '$1 ', trim($texto));
        $partes  = preg_split('/(?:\R+|(?<=[.;])\s+)(?=' . $rotulo . '\s)/u', $texto);
        $html    = '';

        foreach ($partes as $parte) {
            foreach (preg_split('/\R+/u', trim($parte)) as $linea) {
                if ($linea === '') {
                    continue;
                }

                // Un renglón entero en mayúsculas es el título de la nota
                if (mb_strlen($linea) >= 12 && mb_strtoupper($linea) === $linea && preg_match('/\p{Lu}/u', $linea) && ! str_contains($linea, ':')) {
                    $html .= '<h3>' . $e(self::oracion($linea)) . '</h3>';
                    continue;
                }

                if (! preg_match('/^(' . $rotulo . ')\s+(.+)$/us', $linea, $m)) {
                    // Primer renglón en mayúsculas sostenidas: es el título de la nota
                    $html .= preg_match('/^([\p{Lu}\s,Y]{12,}?)\s+(?=\p{Lu}\p{Ll})(.*)$/us', $linea, $t)
                        ? '<h3>' . $e(self::oracion($t[1])) . '</h3>' . ($t[2] !== '' ? self::estructurar($t[2]) : '')
                        : '<p>' . $e($linea) . '</p>';
                    continue;
                }

                $items = array_values(array_filter(array_map('trim', explode(';', $m[2]))));
                if (count($items) >= 3) {
                    $html .= '<p><strong>' . $e($m[1]) . '</strong></p><ul>';
                    foreach ($items as $item) {
                        $html .= '<li>' . $e(rtrim(self::oracion($item), '.')) . '.</li>';
                    }
                    $html .= '</ul>';
                } else {
                    $html .= '<p><strong>' . $e($m[1]) . '</strong> ' . $e($m[2]) . '</p>';
                }
            }
        }

        return $html;
    }

    private static function oracion(string $s): string
    {
        $s = trim($s);
        $s = mb_strtoupper($s) === $s ? mb_strtolower($s) : $s;

        return mb_strtoupper(mb_substr($s, 0, 1)) . mb_substr($s, 1);
    }
}
