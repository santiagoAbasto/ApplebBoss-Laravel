<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class HomeSection extends Model
{
    protected $fillable = [
        'type',
        'label',
        'active',
        'orden',
        'settings',
        'publicar_desde',
        'publicar_hasta',
    ];

    protected function casts(): array
    {
        return [
            'active'         => 'boolean',
            'settings'       => 'array',
            'publicar_desde' => 'datetime',
            'publicar_hasta' => 'datetime',
        ];
    }

    /** Devuelve solo secciones visibles ahora mismo en el storefront. */
    public function scopeVisible($query): void
    {
        $now = Carbon::now();
        $query->where('active', true)
            ->where(fn ($q) => $q->whereNull('publicar_desde')->orWhere('publicar_desde', '<=', $now))
            ->where(fn ($q) => $q->whereNull('publicar_hasta')->orWhere('publicar_hasta', '>=', $now))
            ->orderBy('orden');
    }

    public const TYPES = [
        'hero',
        'trust',
        'featured',
        'category_rail',
        'category_products',
        'myskin',
        'semiused',
        'trade_in',
        'product_collection',
        'new_arrivals',
        'offers',
        'services',
        'location',
        'news',
        'faq',
    ];

    /** Categorías que puede mostrar una sección category_products (mismo orden del header). */
    public const CATEGORY_OPTIONS = ['celulares', 'computadoras', 'productos-apple', 'accesorios'];

    /**
     * Las secciones que muestran productos. Si hoy no hay ninguno que mostrar, la sección no sale en la tienda:
     * la portada nunca queda con un título y un hueco debajo.
     */
    public const TIPOS_CON_PRODUCTOS = [
        'featured', 'category_products', 'product_collection', 'myskin', 'semiused', 'new_arrivals', 'offers',
    ];

    /** Cuántos productos muestra cada sección cuando no se le pone un número. */
    public const LIMITES = [
        'featured'           => 8,
        'category_products'  => 8,
        'product_collection' => 12,
        'myskin'             => 4,
        'semiused'           => 4,
        'new_arrivals'       => 4,
        'offers'             => 4,
        // No muestra productos: las novedades más nuevas (Tienda online → Novedades)
        'news'               => 3,
    ];

    /** Cuántos productos mostrar: lo que eligió el administrador, entre 1 y 12. */
    public static function limite(string $tipo, mixed $guardado = null): int
    {
        $valor = (int) ($guardado ?: (self::LIMITES[$tipo] ?? 8));

        return min(12, max(1, $valor));
    }

    /**
     * Qué productos le tocan a una sección. Es la única regla: la usan la tienda (para mostrarlos) y el panel
     * (para decir qué muestra hoy cada sección y por qué no muestra nada).
     *
     * @param  Collection  $disponibles  productos a la venta, ya serializados (id, key, category, condition,
     *                                   is_myskin, is_featured, promo_price)
     * @param  Collection|null  $coleccion  ids de las publicaciones de la vitrina, en su orden
     */
    public static function filtrar(string $tipo, array $settings, Collection $disponibles, ?Collection $coleccion = null): Collection
    {
        return match ($tipo) {
            'featured'           => $disponibles->where('is_featured', true)->values(),
            'category_products'  => $disponibles->where('is_myskin', false)->where('category', $settings['categoria'] ?? '')->values(),
            'product_collection' => self::enOrdenDeColeccion($disponibles, $coleccion),
            'myskin'             => $disponibles->where('is_myskin', true)->sortByDesc('id')->values(),
            'semiused'           => $disponibles->whereIn('condition', ['Seminuevo', 'Open Box'])->sortByDesc('id')->values(),
            'new_arrivals'       => $disponibles->sortByDesc('id')->values(),
            'offers'             => $disponibles->whereNotNull('promo_price')->sortByDesc('id')->values(),
            default              => collect(),
        };
    }

    /** Los productos de la vitrina, en el orden que eligió el administrador y solo los que siguen a la venta. */
    private static function enOrdenDeColeccion(Collection $disponibles, ?Collection $ids): Collection
    {
        if ($ids === null) {
            return collect();
        }

        $porId = $disponibles->keyBy('id');

        return $ids->map(fn ($id) => $porId->get($id))->filter()->values();
    }
}
