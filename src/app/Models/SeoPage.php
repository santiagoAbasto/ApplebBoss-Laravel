<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SeoPage extends Model
{
    protected $fillable = ['title', 'description', 'og_image', 'noindex', 'canonical'];

    protected function casts(): array
    {
        return ['noindex' => 'boolean'];
    }

    private const CACHE_KEY = 'seo_pages_map';

    /** Mapa page_key => overrides, cacheado. Nunca rompe la página si la tabla no existe. */
    public static function map(): array
    {
        try {
            return Cache::remember(self::CACHE_KEY, 300, fn () => static::all()
                ->keyBy('page_key')
                ->map(fn (self $p) => $p->only(['title', 'description', 'og_image', 'noindex', 'canonical']))
                ->all());
        } catch (\Throwable) {
            return [];
        }
    }

    public static function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    protected static function booted(): void
    {
        static::saved(fn () => static::flush());
    }
}
