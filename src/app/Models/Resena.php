<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Una reseña de un cliente.
 *
 * Nada se inventa: o la dejó quien recibió su pedido de la web (compra verificada) o la tienda la trae de donde la
 * recibió, con el enlace para comprobarla. Solo se ve en la tienda si alguien del panel la aprobó.
 */
class Resena extends Model
{
    protected $table = 'resenas';

    protected $guarded = ['id'];

    protected $casts = [
        'calificacion' => 'integer',
        'fecha'        => 'date',
        'publicada'    => 'boolean',
        'orden'        => 'integer',
    ];

    public const FUENTES = [
        'web'       => 'Compra en la web',
        'google'    => 'Google',
        'facebook'  => 'Facebook',
        'instagram' => 'Instagram',
        'whatsapp'  => 'WhatsApp',
        'tienda'    => 'En la tienda',
    ];

    /** Las que se cargan desde el panel: todas menos «web», que es la compra verificada. */
    public const FUENTES_A_MANO = [
        'google'    => 'Google',
        'facebook'  => 'Facebook',
        'instagram' => 'Instagram',
        'whatsapp'  => 'WhatsApp',
        'tienda'    => 'En la tienda',
    ];

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    public function scopePublicadas(Builder $q): Builder
    {
        return $q->where('publicada', true);
    }

    /** «María Fernanda López» → «María L.»: en público no va el nombre completo de nadie. */
    public function firma(): string
    {
        $partes = preg_split('/\s+/', trim($this->nombre)) ?: [];
        $nombre = Str::title(mb_strtolower($partes[0] ?? 'Cliente'));
        $apellido = end($partes);

        return count($partes) > 1 ? $nombre . ' ' . mb_strtoupper(mb_substr($apellido, 0, 1)) . '.' : $nombre;
    }

    /** Promedio y cantidad de TODAS las aprobadas (el carrusel muestra hasta 20). */
    public static function resumenPublico(): array
    {
        $q = static::publicadas();

        return ['promedio' => round((float) $q->avg('calificacion'), 1), 'total' => $q->count()];
    }

    /** Lo que ve la tienda: sin pedido, sin correo, sin nombre completo. */
    public static function paraLaTienda(int $limite = 20): array
    {
        return static::publicadas()
            ->orderBy('orden')->orderByDesc('fecha')->orderByDesc('id')
            ->limit($limite)->get()
            ->map(fn (Resena $r) => [
                'id'           => $r->id,
                'firma'        => $r->firma(),
                'calificacion' => $r->calificacion,
                'texto'        => $r->texto,
                'fuente'       => $r->fuente,
                'fuente_label' => self::FUENTES[$r->fuente] ?? $r->fuente,
                'verificada'   => $r->pedido_id !== null,
                'producto'     => $r->producto,
                'fecha'        => $r->fecha?->toDateString(),
                'enlace'       => $r->enlace,
            ])->all();
    }
}
