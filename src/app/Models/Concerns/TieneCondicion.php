<?php

namespace App\Models\Concerns;

use App\Support\CondicionInventario;

/**
 * Productos de inventario con condición (Nuevo / Seminuevo).
 * Cuando cambia, sus publicaciones de la tienda (y la API pública) se actualizan solas,
 * venga el cambio del panel, de una acción masiva o de la API.
 */
trait TieneCondicion
{
    public static function bootTieneCondicion(): void
    {
        static::updated(function ($modelo) {
            if ($modelo->wasChanged('condicion')) {
                CondicionInventario::sincronizarPublicaciones($modelo);
            }
        });
    }
}
