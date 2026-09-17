<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Una pregunta frecuente de la tienda.
 *
 * Cada pregunta se muestra en un solo lugar (la columna `scope`), y esos lugares son los cuatro que la tienda
 * dibuja de verdad: el final del inicio, la ficha de todos los productos, la página de iPhone y la de Seminuevos.
 * Si un lugar se queda sin preguntas encendidas, esa sección no se dibuja.
 */
class Faq extends Model
{
    /** Dónde se puede mostrar una pregunta. La clave es lo que se guarda en `scope`. */
    public const LUGARES = [
        'general' => [
            'label' => 'En el inicio',
            'donde' => 'La sección «Preguntas frecuentes» del final del inicio.',
            'url'   => '/#faq',
        ],
        'producto' => [
            'label' => 'En la ficha de los productos',
            'donde' => 'Al final de todas las publicaciones, en «Preguntas».',
            'url'   => '/catalogo',
        ],
        'iphone' => [
            'label' => 'En la página de iPhone',
            'donde' => 'El final de la página /iphone.',
            'url'   => '/iphone',
        ],
        'seminuevos' => [
            'label' => 'En la página de Seminuevos',
            'donde' => 'El final de la página /seminuevos.',
            'url'   => '/seminuevos',
        ],
    ];

    protected $fillable = ['scope', 'scope_ref', 'question', 'answer', 'active', 'sort_order'];

    protected $casts = ['active' => 'boolean'];

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeGeneral($query)
    {
        return $query->where('scope', 'general');
    }

    /** Las preguntas encendidas de un lugar, en su orden. Lo usan la tienda y el panel. */
    public static function deLugar(string $lugar): array
    {
        if (! isset(self::LUGARES[$lugar])) {
            return [];
        }

        return self::active()
            ->where('scope', $lugar)
            ->orderBy('sort_order')
            ->get(['id', 'question', 'answer'])
            ->toArray();
    }
}
