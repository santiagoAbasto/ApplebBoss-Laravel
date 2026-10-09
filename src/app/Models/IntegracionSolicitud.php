<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Una llamada a la API de integración: quién, qué ruta, cómo terminó y cuánto tardó. Se guardan 90 días. */
class IntegracionSolicitud extends Model
{
    use Prunable;

    protected $table = 'integracion_solicitudes';

    public const UPDATED_AT = null;

    protected $fillable = ['integracion_id', 'token_id', 'metodo', 'ruta', 'estado', 'duracion_ms', 'ip'];

    public function integracion(): BelongsTo
    {
        return $this->belongsTo(Integracion::class);
    }

    public function prunable(): Builder
    {
        return static::where('created_at', '<', now()->subDays(90));
    }
}
