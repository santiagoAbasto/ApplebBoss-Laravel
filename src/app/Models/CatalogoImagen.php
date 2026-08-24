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
        return $this->ruta_card ? asset('storage/' . $this->ruta_card) : null;
    }

    public function urlThumb(): ?string
    {
        return $this->ruta_thumb ? asset('storage/' . $this->ruta_thumb) : null;
    }

    public function urlDetail(): ?string
    {
        return $this->ruta_detail ? asset('storage/' . $this->ruta_detail) : null;
    }

    public function urlMedium(): ?string
    {
        return $this->ruta_medium ? asset('storage/' . $this->ruta_medium) : null;
    }
}
