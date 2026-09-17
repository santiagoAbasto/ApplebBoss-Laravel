<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Una colección es una vitrina armada a mano: tú eliges qué publicaciones entran y en qué orden.
 *
 * Se diferencia de una categoría en que la categoría se llena sola (cada producto cae en la suya
 * según el inventario del que sale) y no se crea ni se borra. Una colección la creas tú para una
 * campaña —«Ofertas de la semana», «Regreso a clases»— y puede mezclar productos de cualquier
 * categoría.
 *
 * Dónde se ve: en su propia página (/coleccion/…), en un carrusel del inicio (Portada → «Colección
 * de productos») y en los menús, si le pones un enlace.
 */
class CatalogCollection extends Model
{
    /** El mismo sufijo que usan las categorías para el título en Google. */
    public const SUFIJO_GOOGLE = CatalogCategory::SUFIJO_GOOGLE;

    protected $fillable = [
        'name', 'slug', 'description', 'meta_title', 'meta_description', 'active', 'sort_order',
    ];

    protected $casts = ['active' => 'boolean'];

    public function publicaciones(): BelongsToMany
    {
        return $this->belongsToMany(
            CatalogoPublicacion::class,
            'catalog_collection_publicacion',
            'collection_id',
            'publicacion_id'
        )->withPivot('sort_order')->orderByPivot('sort_order');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function publicacionesCount(): int
    {
        return $this->publicaciones()->count();
    }

    /** Su página en la tienda. El slug no se cambia: los enlaces compartidos y los menús apuntan ahí. */
    public function urlPublica(): string
    {
        return '/coleccion/' . $this->slug;
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
     * Las colecciones activas como destinos del sitio, para los selectores «¿A dónde lleva?»
     * del panel (Menú, Portada y la portada de una categoría).
     */
    public static function paraEnlaces(): array
    {
        return static::active()
            ->withCount('publicaciones')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (self $c) => [
                'id'       => $c->id,
                'nombre'   => $c->name,
                'url'      => $c->urlPublica(),
                'cantidad' => $c->publicaciones_count,
            ])
            ->all();
    }
}
