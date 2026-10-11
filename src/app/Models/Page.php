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

    /** Los textos legales. Su página no sale en Google mientras sean un borrador (ver esBorrador). */
    public const LEGALES = ['privacidad', 'terminos', 'cookies'];

    /** Lo que marca un dato que falta confirmar: con esto adentro, el texto es un borrador. */
    public const MARCA_PENDIENTE = '[DATO POR CONFIRMAR';

    /**
     * ¿Es un borrador? Un texto legal vacío o con un dato por confirmar no se publica en Google, ni en el sitemap ni
     * en llms.txt: se ve en la tienda (para revisarlo) pero con noindex. Así nunca se indexa un texto a medias.
     */
    public function esBorrador(): bool
    {
        return in_array($this->slug, self::LEGALES, true)
            && (blank(strip_tags((string) $this->content)) || str_contains((string) $this->content, self::MARCA_PENDIENTE));
    }

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
