<?php

namespace App\Support\FichaTecnica;

use App\Models\ModeloReferencia;
use App\Support\ModelosCompatibles;

/**
 * La descripción de la publicación de un accesorio, armada con su ficha (`datos.contenido`) y el nombre del
 * inventario: {modelo} pasa a ser el equipo que dice ese nombre («iPhone 12 y iPhone 12 Pro», «Apple Watch de 41 mm»,
 * «MacBook Pro de 16 pulgadas») o, si no dice ninguno, lo que indica la ficha («tu iPhone»).
 *
 * El HTML solo usa <p>, <ul> y <li>, con el texto escapado: es lo que acepta la descripción de la tienda.
 */
final class ContenidoAccesorio
{
    /** @return array{resumen: string, descripcion: string, que_incluye: string} */
    public static function paraPublicacion(ModeloReferencia $modelo, ?string $nombre): array
    {
        $c = $modelo->datos['contenido'] ?? [];
        $para = self::para($modelo, $nombre);
        $texto = fn (string $t) => self::conMayuscula(str_replace('{modelo}', $para, $t));

        $html = collect($c['parrafos'] ?? [])->map(fn ($p) => '<p>' . e($texto($p)) . '</p>')->implode('');
        if ($puntos = $c['puntos'] ?? []) {
            $html .= '<ul>' . collect($puntos)->map(fn ($p) => '<li>' . e($texto($p)) . '</li>')->implode('') . '</ul>';
        }

        return [
            'resumen'     => $texto($c['resumen'] ?? $modelo->nombre),
            'descripcion' => $html,
            'que_incluye' => collect($c['incluye'] ?? [])->map($texto)->implode("\n"),
        ];
    }

    /** Para qué equipo es, según el nombre del inventario; si no lo dice, lo que indica la ficha («tu iPhone»). */
    public static function para(ModeloReferencia $modelo, ?string $nombre): string
    {
        $defecto = $modelo->datos['sistema']['para'] ?? 'tu iPhone';
        $texto = mb_strtolower((string) $nombre);

        if (str_contains($defecto, 'Apple Watch') && preg_match('/\b(3[89]|4[0-9])\s*mm\b/', $texto, $mm)) {
            return "Apple Watch de {$mm[1]} mm";
        }
        if (str_contains($defecto, 'MacBook') && preg_match('/macbook\s*(pro|air)?\s*(1[1-6])\b/', $texto, $mac)) {
            return trim('MacBook ' . ucfirst($mac[1] ?? '')) . " de {$mac[2]} pulgadas";
        }

        return ModelosCompatibles::nombres($nombre) ?? $defecto;
    }

    /** «tu iPhone…» al comienzo de una oración pasa a «Tu iPhone…»; «iPhone» se queda como está. */
    private static function conMayuscula(string $texto): string
    {
        return preg_match('/^[a-z]+[A-Z]/u', $texto) ? $texto : mb_strtoupper(mb_substr($texto, 0, 1)) . mb_substr($texto, 1);
    }
}
