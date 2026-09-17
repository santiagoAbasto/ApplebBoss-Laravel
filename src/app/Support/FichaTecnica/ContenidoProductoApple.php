<?php

namespace App\Support\FichaTecnica;

use App\Models\ModeloReferencia;

/**
 * La descripción de la publicación de un producto Apple (iPad, Apple Watch, AirPods…), armada con su ficha
 * (`datos.contenido`). Lo que trae la caja es lo que entrega Apple con un equipo nuevo: solo se copia si la publicación
 * es de un equipo Nuevo; en un seminuevo lo carga quien publica, con lo que realmente se entrega.
 *
 * El HTML solo usa <p>, <ul> y <li>, con el texto escapado: es lo que acepta la descripción de la tienda.
 */
final class ContenidoProductoApple
{
    /** @return array{resumen: string, descripcion: string, que_incluye: ?string} */
    public static function paraPublicacion(ModeloReferencia $modelo, ?string $condicion): array
    {
        $c = $modelo->datos['contenido'] ?? [];

        $html = collect($c['parrafos'] ?? [])->map(fn ($p) => '<p>' . e($p) . '</p>')->implode('');
        if ($puntos = $c['puntos'] ?? []) {
            $html .= '<ul>' . collect($puntos)->map(fn ($p) => '<li>' . e($p) . '</li>')->implode('') . '</ul>';
        }

        return [
            'resumen'     => $c['resumen'] ?? $modelo->nombre,
            'descripcion' => $html,
            'que_incluye' => $condicion === 'Nuevo' && ($c['incluye'] ?? []) ? implode("\n", $c['incluye']) : null,
        ];
    }
}
