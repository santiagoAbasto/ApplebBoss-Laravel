<?php

namespace App\Support\Seo;

/**
 * La descripción de un producto para Google y para los buscadores de IA, armada con sus datos reales:
 * qué es, en qué estado está, cuánto cuesta y dónde se compra. Antes todos los productos compartían la
 * misma frase («Equipo disponible en Cochabamba. Revisado y listo para usar.»).
 */
class DescripcionProducto
{
    /** @param array $producto El producto ya serializado para la ficha pública. */
    public static function de(array $producto, mixed $precio): string
    {
        $a      = (array) ($producto['atributos'] ?? []);
        $estado = array_filter([
            isset($producto['condition']) ? mb_strtolower((string) $producto['condition']) : null,
            isset($producto['battery']) && is_numeric($producto['battery']) ? 'batería al ' . $producto['battery'] . ' %' : null,
        ]);

        $frases = array_filter([
            trim((string) ($producto['name'] ?? '')) . ($estado ? ', ' . implode(', ', $estado) : ''),
            is_numeric($precio) && $precio > 0 ? 'Bs ' . number_format((float) $precio, 0, ',', '.') . ' en Apple Boss, Cochabamba' : 'Disponible en Apple Boss, Cochabamba',
            implode(', ', array_filter([
                is_string($a['chip'] ?? null) ? 'Chip ' . $a['chip'] : null,
                is_string($a['tamano_pantalla'] ?? null) ? 'pantalla de ' . $a['tamano_pantalla'] : null,
                is_string($a['sistema_camaras'] ?? null) ? 'cámara ' . mb_strtolower($a['sistema_camaras']) : null,
            ])),
            // El resumen que escribió la tienda, si no es la frase de fábrica
            is_string($producto['summary'] ?? null) && ! str_contains($producto['summary'], 'Revisado y listo para usar') ? rtrim($producto['summary'], '. ') : null,
        ]);

        return \Illuminate\Support\Str::limit(implode('. ', $frases) . '.', 300, '…');
    }

    /** «Apple» cuando el nombre del producto ya lo dice; si no, no se inventa una marca. */
    public static function marcaPorNombre(?string $titulo): ?string
    {
        return preg_match('/^\s*(iphone|ipad|mac\b|macbook|imac|airpods|apple\b|airtag|homepod|magic\s)/i', (string) $titulo) ? 'Apple' : null;
    }
}
