<?php

namespace App\Support\Seo;

use App\Models\CatalogoPublicacion;
use Illuminate\Support\Str;

/**
 * Arma el SEO (título y descripción meta) de un producto a partir de SUS datos reales: nombre, condición, las specs
 * más vistosas de su ficha, la garantía y el lugar. Pensado para guardarlo en la publicación (seo_title/seo_description)
 * y que cada producto tenga su propio texto, no una plantilla. No lleva el precio: ese cambia (sale en vivo en la ficha
 * y en los datos estructurados), así el texto guardado no envejece. No inventa specs: usa solo las que tiene.
 */
final class SeoProducto
{
    private const MARCA = 'Apple Boss';
    private const CIUDAD = 'Cochabamba';

    /** Título ≤ ~60 car.: el nombre del producto (la palabra clave) + condición si no es nuevo + marca, y la ciudad si entra. */
    public static function titulo(CatalogoPublicacion $pub): string
    {
        $nombre = trim((string) $pub->titulo);
        $cond = mb_strtolower(trim((string) $pub->condicion));
        if ($cond !== '' && $cond !== 'nuevo' && ! Str::contains(mb_strtolower($nombre), $cond)) {
            $nombre .= ' ' . $cond;
        }

        $conCiudad = "{$nombre} | " . self::MARCA . ' ' . self::CIUDAD;

        return mb_strlen($conCiudad) <= 60 ? $conCiudad : "{$nombre} | " . self::MARCA;
    }

    /** Descripción meta (~155 car.): qué es, su estado, una o dos specs fuertes, la garantía y dónde se compra. */
    public static function descripcion(CatalogoPublicacion $pub): string
    {
        $nombre = trim((string) $pub->titulo);
        $estado = match ((string) $pub->condicion) {
            'Seminuevo'       => 'seminuevo, revisado por nuestros técnicos',
            'Open Box'        => 'open box, como nuevo',
            'Reacondicionado' => 'reacondicionado y garantizado',
            default           => 'nuevo y sellado',
        };

        $g = $pub->garantiaCobertura();
        $garantia = $g ? ('garantía de ' . $g['meses'] . ' meses') : 'garantía real';

        $frases = array_values(array_filter([
            "{$nombre} {$estado} en " . self::MARCA . ', ' . self::CIUDAD,
            self::specs((string) $pub->producto_tipo, (array) $pub->atributos),
            ucfirst($garantia) . ', compra segura y envíos a toda Bolivia',
        ]));

        return Str::limit(implode('. ', $frases) . '.', 160, '');
    }

    /** Una frase con 1–2 specs fuertes según el tipo; '' si la ficha no las trae. */
    private static function specs(string $tipo, array $a): string
    {
        $v = fn (string ...$claves) => collect($claves)->map(fn ($k) => $a[$k] ?? null)->first(fn ($x) => is_string($x) && $x !== '');

        $partes = match ($tipo) {
            'celular' => [
                ($x = self::limpio($v('chip'))) ? "chip {$x}" : null,
                ($x = self::limpio($v('camara_principal', 'sistema_camaras'))) ? "cámara de {$x}" : null,
            ],
            'computadora' => [
                ($x = self::limpio($v('chip', 'procesador'))) ? "chip {$x}" : null,
                ($x = self::limpio($v('tamano_pantalla', 'pantalla'))) ? "pantalla {$x}" : null,
            ],
            'producto_apple' => [
                ($x = self::limpio($v('chip'))) ? "chip {$x}" : null,
                ($x = self::limpio($v('capacidad', 'tamano_pantalla', 'autonomia'))) ? $x : null,
            ],
            default => [
                ($x = self::limpio($v('tipo', 'modelo_compatible'))) ? $x : null,
            ],
        };

        $partes = array_values(array_filter($partes));

        return $partes ? ucfirst(implode(', ', $partes)) : '';
    }

    /** Primer segmento legible de una spec (antes de · ( ; — no de la coma decimal), acortado. */
    private static function limpio(?string $x): ?string
    {
        if (! $x) {
            return null;
        }
        $x = trim((string) preg_split('/\s*[·(;]/u', $x)[0]);
        $x = rtrim($x, " \t.·-");

        return $x !== '' ? Str::limit($x, 28, '') : null;
    }
}
