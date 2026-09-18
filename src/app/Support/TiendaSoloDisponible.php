<?php

namespace App\Support;

use App\Models\CatalogoPublicacion;
use App\Models\ProductoGeneral;
use Illuminate\Database\Eloquent\Model;

/**
 * La tienda solo muestra lo que está en stock.
 *
 * - Un equipo (iPhone, Mac, otro Apple) que se vende deja de estar publicado en ese momento.
 * - Un accesorio se publica por artículo (mismo nombre y precio): se despublica cuando se vende la última unidad
 *   disponible. Una unidad reservada no cuenta como vendida: si la reserva se cae, vuelve a estar a la venta.
 * - Lo vendido nunca se vuelve a publicar solo: si una venta se anula, publicar de nuevo lo decide el administrador.
 */
class TiendaSoloDisponible
{
    public const VENDIDO = 'vendido';

    /** Se llama cuando un producto del inventario cambia de estado o se elimina. */
    public static function revisar(Model $producto, bool $eliminado = false): int
    {
        $tipo = InventarioCatalogo::tipoDe($producto);
        if (! $tipo) {
            return 0;
        }

        if ($tipo === 'producto_general') {
            return self::revisarArticulo($producto);
        }

        if (! $eliminado && $producto->estado !== self::VENDIDO) {
            return 0;
        }

        return CatalogoPublicacion::where('producto_tipo', $tipo)
            ->where('producto_id', $producto->getKey())
            ->where('publicado', true)
            ->update(['publicado' => false]);
    }

    /** Despublica los accesorios que ya no tienen ninguna unidad disponible en el inventario. */
    private static function revisarArticulo(Model $unidad): int
    {
        $quedan = ProductoGeneral::where('estado', 'disponible')
            ->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower(trim((string) $unidad->nombre))])
            ->where('precio_venta', $unidad->precio_venta)
            ->exists();

        if ($quedan) {
            return 0;
        }

        $ids = ProductoGeneral::whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower(trim((string) $unidad->nombre))])
            ->where('precio_venta', $unidad->precio_venta)
            ->pluck('id')
            ->push($unidad->getKey());

        return CatalogoPublicacion::where('producto_tipo', 'producto_general')
            ->whereIn('producto_id', $ids->unique())
            ->where('publicado', true)
            ->update(['publicado' => false]);
    }

    /**
     * ¿Se puede mostrar en la tienda? Solo lo que está disponible en el inventario (ni vendido ni reservado).
     */
    public static function sePuedePublicar(string $tipo, int $productoId): bool
    {
        return (new CatalogoPublicacion(['producto_tipo' => $tipo, 'producto_id' => $productoId]))->productoDisponible();
    }

    /**
     * Repaso completo: despublica todo lo que está publicado y ya se vendió o ya no existe. Devuelve cuántas
     * publicaciones se apagaron.
     */
    public static function repasar(): int
    {
        $apagadas = 0;

        CatalogoPublicacion::where('publicado', true)->get()->each(function (CatalogoPublicacion $pub) use (&$apagadas) {
            $producto = $pub->inventario();

            $vendido = match (true) {
                ! $producto                               => true,
                $pub->producto_tipo === 'producto_general' => ! ProductoGeneral::where('estado', 'disponible')
                    ->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower(trim((string) $producto->nombre))])
                    ->where('precio_venta', $producto->precio_venta)
                    ->exists(),
                default                                   => $producto->estado === self::VENDIDO,
            };

            if ($vendido) {
                $pub->update(['publicado' => false]);
                $apagadas++;
            }
        });

        return $apagadas;
    }
}
