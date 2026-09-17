<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogoCompatibilidad extends Model
{
    protected $table = 'catalogo_compatibilidades';

    protected $fillable = ['publicacion_id', 'target_id'];

    public function publicacion(): BelongsTo
    {
        return $this->belongsTo(CatalogoPublicacion::class, 'publicacion_id');
    }

    public function target(): BelongsTo
    {
        return $this->belongsTo(CompatibilityTarget::class, 'target_id');
    }
}
