<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Una página de solo texto de la tienda (Nosotros, Garantía, Envíos…).
 * Vive en /paginas/… y, si está encendida, aparece sola en la columna «Información» del pie de página.
 */
class Page extends Model
{
    /** El mismo sufijo que usan las categorías y las colecciones para el título en Google. */
    public const SUFIJO_GOOGLE = CatalogCategory::SUFIJO_GOOGLE;

    protected $fillable = [
        'slug', 'title', 'content',
        'meta_title', 'meta_description',
        'active', 'sort_order',
    ];

    protected $casts = ['active' => 'boolean'];

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /** Su dirección en la tienda. No se cambia: es el enlace que se comparte y el que usan los menús. */
    public function urlPublica(): string
    {
        return '/paginas/' . $this->slug;
    }

    public function tituloGoogle(): string
    {
        return $this->meta_title ?: $this->title . self::SUFIJO_GOOGLE;
    }
}
