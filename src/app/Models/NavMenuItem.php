<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NavMenuItem extends Model
{
    protected $table = 'nav_menu_items';

    protected $fillable = [
        'slot', 'parent_id', 'label', 'url', 'group',
        'open_in_new_tab', 'myskin', 'active', 'sort_order',
    ];

    protected $casts = [
        'open_in_new_tab' => 'boolean',
        'myskin'          => 'boolean',
        'active'          => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    /** Structured tree for a slot, only active items. */
    public static function forSlot(string $slot): Collection
    {
        return static::with(['children' => fn ($q) => $q->where('active', true)->orderBy('sort_order')])
            ->where('slot', $slot)
            ->whereNull('parent_id')
            ->where('active', true)
            ->orderBy('sort_order')
            ->get();
    }

    /** Flat serialization for Inertia shared data. */
    public static function serializeSlot(string $slot): array
    {
        // Sin novedades publicadas, /novedades solo muestra un aviso: sus enlaces no se muestran hasta la primera
        $ocultas = Novedad::published()->exists() ? [] : ['/novedades'];
        $visible = fn ($item) => ! in_array(rtrim((string) parse_url((string) $item->url, PHP_URL_PATH), '/'), $ocultas, true);

        return static::forSlot($slot)->filter($visible)->values()->map(fn ($item) => [
            'id'              => $item->id,
            'label'           => $item->label,
            'href'            => $item->url,
            'group'           => $item->group,
            'myskin'          => $item->myskin,
            'open_in_new_tab' => $item->open_in_new_tab,
            'items'           => $item->children->filter($visible)->values()->map(fn ($c) => [
                'id'              => $c->id,
                'label'           => $c->label,
                'href'            => $c->url,
                'open_in_new_tab' => $c->open_in_new_tab,
            ])->all(),
        ])->all();
    }
}
