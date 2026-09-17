<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class NewsletterSubscriber extends Model
{
    protected $fillable = ['email', 'nombre', 'source', 'unsubscribed_at'];

    protected $hidden = ['token'];

    protected function casts(): array
    {
        return ['unsubscribed_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        // Cada suscriptor tiene un token único para su link de baja
        static::creating(function (self $s) {
            $s->token ??= Str::random(48);
        });
    }

    public function scopeActive(Builder $q): void
    {
        $q->whereNull('unsubscribed_at');
    }
}
