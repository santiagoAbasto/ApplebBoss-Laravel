<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogoImagen extends Model
{
    protected $table = 'catalogo_imagenes';

    protected $fillable = [
        'publicacion_id',
        'nombre_original',
        'ruta_original',
        'ruta_thumb',
        'ruta_card',
        'ruta_medium',
        'ruta_detail',
        'alt',
        'orden',
        'es_principal',
        'metadata',
    ];

    protected $casts = [
        'es_principal' => 'boolean',
        'metadata'     => 'array',
    ];

    public function publicacion(): BelongsTo
    {
        return $this->belongsTo(CatalogoPublicacion::class, 'publicacion_id');
    }

    public function urlCard(): ?string
    {
        return $this->url($this->ruta_card);
    }

    public function urlThumb(): ?string
    {
        return $this->url($this->ruta_thumb);
    }

    public function urlDetail(): ?string
    {
        return $this->url($this->ruta_detail);
    }

    public function urlMedium(): ?string
    {
        return $this->url($this->ruta_medium);
    }

    /**
     * URL pública con cache-buster. Al reprocesar una foto el archivo mantiene su nombre (misma ruta), así que sin
     * el ?v el CDN/navegador seguiría sirviendo la versión vieja. updated_at cambia en cada reproceso -> URL nueva.
     */
    private function url(?string $ruta): ?string
    {
        if (! $ruta) {
            return null;
        }
        $v = $this->updated_at?->timestamp;

        return asset('storage/' . $ruta) . ($v ? '?v=' . $v : '');
    }
}
