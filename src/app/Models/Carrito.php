<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Un carrito o un pedido que alguien dejó sin pagar, con lo justo para invitarlo a retomarlo.
 * Solo clientes con cuenta: sin correo no hay a quién avisar. La lógica vive en App\Support\Carritos\Recuperacion.
 */
class Carrito extends Model
{
    use Prunable;

    public const MAX_RECORDATORIOS = 2;
    public const ORIGEN_CARRITO = 'carrito';
    public const ORIGEN_PEDIDO = 'pedido';

    public const ETIQUETAS = [
        'esperando'     => 'Esperando',
        'recordado'     => 'Recordado',
        'sin_respuesta' => 'Sin respuesta',
        'recuperado'    => 'Recuperado',
    ];

    protected $guarded = ['id'];

    protected $casts = [
        'items'          => 'array',
        'total'          => 'decimal:2',
        'actualizado_en' => 'datetime',
        'recordado_en'   => 'datetime',
        'recuperado_en'  => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $c) {
            $c->token ??= Str::random(40);
            $c->actualizado_en ??= now();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    public function pedidoRecuperado(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'recuperado_pedido_id');
    }

    /** Todavía sin comprar: el carrito actual de la persona. */
    public function scopeAbierto(Builder $q): Builder
    {
        return $q->whereNull('recuperado_en');
    }

    public function estado(): string
    {
        return match (true) {
            $this->recuperado_en !== null                       => 'recuperado',
            $this->recordatorios >= self::MAX_RECORDATORIOS     => 'sin_respuesta',
            $this->recordatorios > 0                            => 'recordado',
            default                                             => 'esperando',
        };
    }

    /** Lo que hoy sigue publicado y disponible, con el precio de hoy: es lo único que vale la pena recordar. */
    public function disponibles(): Collection
    {
        return collect($this->items)->map(function (array $item) {
            [$tipo, $id] = array_pad(explode(':', (string) ($item['key'] ?? ''), 2), 2, null);
            if (! $tipo || ! ctype_digit((string) $id)) {
                return null;
            }
            $pub = CatalogoPublicacion::with('imagenes')->publicadoAhora()
                ->where('producto_tipo', $tipo)->where('producto_id', (int) $id)->first();
            if (! $pub || ! $pub->productoDisponible()) {
                return null;
            }

            return [
                'key'       => $item['key'],
                'nombre'    => $pub->titulo,
                'precio'    => $pub->precioPublico(),
                'condicion' => $pub->condicion,
                'imagen'    => $pub->imagenPrincipal()?->urlCard(),
                'url'       => route('store.product', $pub->slug),
            ];
        })->filter()->values();
    }

    public function enlace(): string
    {
        return route('carrito.recuperar', $this->token);
    }

    public function enlaceBaja(): string
    {
        return route('carrito.sin-recordatorios', $this->token);
    }

    /** Enlace de WhatsApp con el mensaje listo, para que el equipo lo mande desde el panel. Sin teléfono, nada. */
    public function whatsapp(): ?string
    {
        $digitos = preg_replace('/\D+/', '', (string) ($this->user?->telefono ?? ''));
        if (strlen($digitos) < 7) {
            return null;
        }
        if (strlen($digitos) === 8) {
            $digitos = '591' . $digitos; // celular boliviano sin código de país
        }
        $nombre = Str::of((string) $this->user?->name)->before(' ')->title();
        $productos = collect($this->items)->pluck('nombre')->take(3)->implode(', ');
        $texto = "Hola {$nombre}, te escribo de Apple Boss. Vi que dejaste {$productos} en tu carrito y sigue disponible. "
            . "¿Te ayudo a terminar la compra? Lo retomas acá: {$this->enlace()}";

        return 'https://wa.me/' . $digitos . '?text=' . rawurlencode($texto);
    }

    /** Seis meses de historial alcanzan para la tasa de recuperación. */
    public function prunable(): Builder
    {
        return static::where('updated_at', '<', now()->subMonths(6));
    }
}
