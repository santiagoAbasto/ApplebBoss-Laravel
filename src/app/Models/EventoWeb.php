<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

/**
 * Un evento de la medición propia: una página vista o una acción. Nunca datos personales en claro.
 * Se borra solo a los 14 meses (model:prune), como dice la política de privacidad.
 */
class EventoWeb extends Model
{
    use Prunable;

    protected $table = 'eventos_web';

    public const UPDATED_AT = null;

    public const MESES_DE_CONSERVACION = 14;

    /** Lista cerrada: lo que manda el navegador (los demás los registra el servidor). */
    public const DESDE_EL_NAVEGADOR = ['pagina', 'carrito_agregar', 'busqueda', 'busqueda_sin_resultados', 'whatsapp'];

    public const DEL_SERVIDOR = ['pedido_creado', 'solicitud_servicio', 'solicitud_tradein'];

    protected $guarded = [];

    protected $casts = ['bot' => 'boolean', 'dia' => 'date', 'created_at' => 'datetime'];

    public function prunable(): Builder
    {
        return static::where('created_at', '<', now()->subMonths(self::MESES_DE_CONSERVACION));
    }
}
