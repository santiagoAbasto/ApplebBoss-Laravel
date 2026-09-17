<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Una campaña de newsletter: el correo que se le manda a los suscriptores.
 *
 * El estado es el que manda en toda la pantalla, así que vive acá y no repartido entre el controlador y los jobs:
 * un borrador se edita y se envía; mientras se envía solo se puede detener; una enviada o cancelada se lee, se
 * duplica o se borra.
 */
class NewsletterCampaign extends Model
{
    /** Estado => cómo se llama en el panel y qué significa. */
    public const ESTADOS = [
        'borrador'  => ['label' => 'Borrador',  'tono' => 'slate',   'texto' => 'Todavía no se envió. Se puede editar y probar.'],
        'enviando'  => ['label' => 'Enviando',  'tono' => 'lila',    'texto' => 'Saliendo por lotes. Se puede detener.'],
        'enviada'   => ['label' => 'Enviada',   'tono' => 'emerald', 'texto' => 'Terminó de salir.'],
        'cancelada' => ['label' => 'Cancelada', 'tono' => 'amber',   'texto' => 'Se detuvo a mitad del envío.'],
    ];

    protected $fillable = [
        'asunto', 'preheader', 'bloques', 'destino', 'seleccion', 'adjuntar_imagenes',
        'estado', 'total', 'enviados', 'fallidos', 'iniciada_at', 'finalizada_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'bloques'           => 'array',
            'seleccion'         => 'array',
            'adjuntar_imagenes' => 'boolean',
            'iniciada_at'       => 'datetime',
            'finalizada_at'     => 'datetime',
        ];
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(NewsletterCampaignRecipient::class, 'campaign_id');
    }

    public function scopeEnviadas(Builder $q): void
    {
        $q->where('estado', 'enviada');
    }

    public function editable(): bool
    {
        return $this->estado === 'borrador';
    }

    public function enviando(): bool
    {
        return $this->estado === 'enviando';
    }

    /** A cuántos suscriptores activos le llegaría hoy. La misma cuenta que hace el envío. */
    public function destinatarios(): int
    {
        return NewsletterSubscriber::active()
            ->when($this->destino === 'seleccion', fn ($q) => $q->whereIn('id', $this->seleccion ?? []))
            ->count();
    }

    /**
     * Por qué todavía no se puede enviar, en palabras del panel. `null` si está lista.
     * Es la única regla: la usan el botón de la pantalla y el controlador al recibir el envío.
     */
    public function porQueNoSePuedeEnviar(): ?string
    {
        return match (true) {
            ! $this->editable()               => 'Esta campaña ya se envió. Duplícala para mandar otra.',
            blank($this->asunto)              => 'Escribe el asunto del correo.',
            empty($this->bloques)             => 'El correo está vacío: agrega al menos un bloque.',
            $this->destinatarios() === 0      => $this->destino === 'seleccion'
                ? 'No elegiste suscriptores, o los que elegiste se dieron de baja.'
                : 'No hay suscriptores activos a quienes mandarles.',
            default                           => null,
        };
    }

    /** Lo que ya salió, en porcentaje, para la barra de progreso. */
    public function progreso(): int
    {
        if (! $this->total) {
            return 0;
        }

        return (int) round((($this->enviados + $this->fallidos) / $this->total) * 100);
    }

    /** La fila del listado del panel. */
    public function paraElPanel(): array
    {
        return [
            'id'            => $this->id,
            'asunto'        => $this->asunto,
            'preheader'     => $this->preheader,
            'estado'        => $this->estado,
            'destino'       => $this->destino,
            'bloques'       => count($this->bloques ?? []),
            'total'         => $this->total,
            'enviados'      => $this->enviados,
            'fallidos'      => $this->fallidos,
            'progreso'      => $this->progreso(),
            'destinatarios' => $this->editable() ? $this->destinatarios() : $this->total,
            'aviso'         => $this->editable() ? $this->porQueNoSePuedeEnviar() : null,
            'updated_at'    => $this->updated_at?->toIso8601String(),
            'iniciada_at'   => $this->iniciada_at?->toIso8601String(),
            'finalizada_at' => $this->finalizada_at?->toIso8601String(),
        ];
    }
}
