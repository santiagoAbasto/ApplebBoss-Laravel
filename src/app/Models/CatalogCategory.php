<?php

namespace App\Models;

use App\Support\InventarioCatalogo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Categoría de la tienda: los «estantes» (iPhone, Mac, Apple, Fundas MYSKIN y Accesorios).
 *
 * No se crean ni se borran: al publicar, cada producto cae solo en la suya según el inventario del que sale
 * (InventarioCatalogo::GRUPOS), y las fundas marcadas como MYSKIN van a «fundas». El slug es la dirección de la
 * categoría y agrupa sus publicaciones: no se cambia. show_navigation ya no se usa: los menús se arman en «Menú».
 */
class CatalogCategory extends Model
{
    protected $table = 'catalog_categories';

    /** Título automático en Google: el nombre de la categoría con el final de las páginas de la tienda. */
    public const SUFIJO_GOOGLE = ' — Apple Boss Cochabamba';

    /** Páginas propias de algunas categorías: los menús pueden llevar ahí en vez de al catálogo. */
    public const HUBS = [
        'celulares'    => '/iphone',
        'computadoras' => '/mac',
        'fundas'       => '/myskin',
    ];

    /** Tipos de accesorio: la familia de su ficha en la base de accesorios («Modelos y fotos»). */
    public const TIPOS_ACCESORIO = [
        'cargador'  => 'Cargadores',
        'vidrio'    => 'Vidrios templados',
        'protector' => 'Protectores',
        'funda'     => 'Fundas',
        'cable'     => 'Cables',
        'accesorio' => 'Otros accesorios',
    ];

    protected $fillable = [
        'parent_id', 'name', 'slug', 'description', 'active',
        'show_home', 'show_navigation', 'is_myskin', 'sort_order',
        'meta_title', 'meta_description',
        'hero_eyebrow', 'hero_titulo', 'hero_descripcion', 'hero_cta_label', 'hero_cta_url',
    ];

    protected $casts = [
        'active'          => 'boolean',
        'show_home'       => 'boolean',
        'show_navigation' => 'boolean',
        'is_myskin'       => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(CatalogCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(CatalogCategory::class, 'parent_id')->orderBy('sort_order');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeForHome($query)
    {
        return $query->active()->where('show_home', true)->orderBy('sort_order');
    }

    /** Página de la categoría en el catálogo: su portada, su título en Google y el filtro de sus productos. */
    public function urlCatalogo(): string
    {
        return '/catalogo?categoria=' . rawurlencode((string) $this->slug);
    }

    /** A dónde lleva su acceso del inicio: Fundas MYSKIN a su página (/myskin); las demás, a su página del catálogo. */
    public function urlInicio(): string
    {
        return $this->is_myskin ? self::HUBS['fundas'] : $this->urlCatalogo();
    }

    /** Inventario del que salen sus productos (celular, computadora…); null si no sale de ninguno. */
    public function tipoInventario(): ?string
    {
        if ($this->is_myskin) {
            return 'producto_general'; // fundas de productos generales, marcadas como MYSKIN al publicarlas
        }

        $tipo = collect(InventarioCatalogo::GRUPOS)->search(fn (array $grupo) => $grupo['categoria'] === $this->slug);

        return $tipo === false ? null : $tipo;
    }

    public function tituloGoogle(): string
    {
        return $this->meta_title ?: $this->name . self::SUFIJO_GOOGLE;
    }

    public function descripcionGoogle(): ?string
    {
        return $this->meta_description ?: $this->description;
    }

    /**
     * Devuelve el conteo de publicaciones activas para esta categoría.
     * MYSKIN usa storefront filter, el resto usa la columna categoria.
     */
    public function publicacionesCount(): int
    {
        if ($this->is_myskin) {
            return CatalogoPublicacion::publicadoAhora()
                ->where('storefront', 'MYSKIN')
                ->count();
        }

        return CatalogoPublicacion::publicadoAhora()
            ->where('categoria', $this->slug)
            ->count();
    }
}
