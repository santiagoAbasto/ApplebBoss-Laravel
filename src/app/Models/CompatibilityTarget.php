<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CompatibilityTarget extends Model
{
    protected $table = 'compatibility_targets';

    protected $fillable = ['family', 'name', 'slug', 'generation', 'active', 'sort_order'];

    protected $casts = ['active' => 'boolean'];

    public const FAMILIES = ['iphone', 'ipad', 'mac', 'watch', 'airpods', 'general'];

    public function publicaciones(): BelongsToMany
    {
        return $this->belongsToMany(
            CatalogoPublicacion::class,
            'catalogo_compatibilidades',
            'target_id',
            'publicacion_id'
        );
    }

    /**
     * Devuelve todos los targets activos agrupados por family → generation → [targets].
     * Ideal para construir el selector jerárquico en el admin.
     */
    public static function forSelector(): array
    {
        return static::where('active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->groupBy('family')
            ->map(fn (Collection $items) => $items->groupBy('generation'))
            ->toArray();
    }
}
