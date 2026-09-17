<?php

namespace App\Support;

use App\Models\CatalogoPublicacion;
use App\Models\ProductoGeneral;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

/**
 * Condición comercial que se elige al cargar un producto al inventario (Nuevo / Seminuevo).
 * Es la que usa la tienda: al publicar se toma sola y, si cambia, las publicaciones se actualizan.
 * Nunca se infiere: la elige la persona que carga o edita el producto.
 */
final class CondicionInventario
{
    public const VALORES = ['Nuevo', 'Seminuevo'];

    public const MENSAJES = [
        'condicion.required' => 'Elige si es nuevo o seminuevo.',
        'condicion.in'       => 'Elige si es nuevo o seminuevo.',
    ];

    public static function regla(bool $obligatoria = true): array
    {
        return [$obligatoria ? 'required' : 'nullable', Rule::in(self::VALORES)];
    }

    /** La condición del producto de inventario, o null si todavía no la tiene. */
    public static function de(mixed $modelo): ?string
    {
        $valor = $modelo->condicion ?? null;

        return in_array($valor, self::VALORES, true) ? $valor : null;
    }

    /** Lleva la condición del producto a sus publicaciones en la tienda. */
    public static function sincronizarPublicaciones(Model $modelo): int
    {
        $tipo = InventarioCatalogo::tipoDe($modelo);
        $condicion = self::de($modelo);
        if (! $tipo || ! $condicion) {
            return 0;
        }

        return CatalogoPublicacion::where('producto_tipo', $tipo)
            ->where('producto_id', $modelo->getKey())
            ->where(fn ($q) => $q->whereNull('condicion')->orWhere('condicion', '!=', $condicion))
            ->update(['condicion' => $condicion]);
    }

    /**
     * Guarda en el inventario la condición elegida al publicar un producto que no la tenía.
     * Accesorios: todas las unidades del mismo artículo (mismo nombre y precio) que todavía no tienen condición.
     */
    public static function completarInventario(string $tipo, Model $modelo, string $condicion): void
    {
        if (! in_array($condicion, self::VALORES, true)) {
            return;
        }

        if ($tipo === 'producto_general') {
            ProductoGeneral::whereNull('condicion')
                ->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower(trim((string) $modelo->nombre))])
                ->where('precio_venta', $modelo->precio_venta)
                ->update(['condicion' => $condicion]);

            return;
        }

        if (blank($modelo->condicion)) {
            $modelo->update(['condicion' => $condicion]);
        }
    }

    /** Si en la publicación eligen Nuevo o Seminuevo, el producto del inventario queda igual. */
    public static function desdePublicacion(CatalogoPublicacion $pub): void
    {
        if (! in_array($pub->condicion, self::VALORES, true)) {
            return;
        }

        $modelo = InventarioCatalogo::modelo((string) $pub->producto_tipo, (int) $pub->producto_id);
        if ($modelo && $modelo->condicion !== $pub->condicion) {
            $modelo->update(['condicion' => $pub->condicion]);
        }
    }
}
