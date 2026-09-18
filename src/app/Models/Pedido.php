<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Un pedido de la tienda en línea.
 *
 * El pago manda: hasta que no está confirmado, el pedido no avanza y los datos de la unidad
 * (IMEI, serie) no se copian a los ítems. Todo lo que ve el cliente sale de `paraElCliente()`.
 */
class Pedido extends Model
{
    use HasFactory;

    /** Estados por los que pasa un pedido, en orden. */
    public const PENDIENTE_PAGO   = 'pendiente_pago';
    public const PAGO_EN_REVISION = 'pago_en_revision';
    public const PAGADO           = 'pagado';
    public const PREPARANDO       = 'preparando';
    public const ENVIADO          = 'enviado';
    public const ENTREGADO        = 'entregado';
    public const CANCELADO        = 'cancelado';

    /** Estados que todavía retienen stock (el producto no se puede vender a otro). */
    public const RETIENEN_STOCK = [self::PENDIENTE_PAGO, self::PAGO_EN_REVISION, self::PAGADO, self::PREPARANDO, self::ENVIADO];

    /** Desde acá el cliente ya puede ver el IMEI y la serie de su equipo. */
    public const CON_PAGO_CONFIRMADO = [self::PAGADO, self::PREPARANDO, self::ENVIADO, self::ENTREGADO];

    public const ETIQUETAS = [
        self::PENDIENTE_PAGO   => 'Esperando el pago',
        self::PAGO_EN_REVISION => 'Revisando el pago',
        self::PAGADO           => 'Pago confirmado',
        self::PREPARANDO       => 'Preparando el pedido',
        self::ENVIADO          => 'En camino',
        self::ENTREGADO        => 'Entregado',
        self::CANCELADO        => 'Cancelado',
    ];

    protected $guarded = ['id'];

    protected $casts = [
        'subtotal'           => 'decimal:2',
        'costo_envio'        => 'decimal:2',
        'total'              => 'decimal:2',
        'pago_confirmado_en' => 'datetime',
        'expira_en'          => 'datetime',
        'enviado_en'         => 'datetime',
        'entregado_en'       => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(PedidoItem::class);
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(PedidoEvento::class)->orderBy('created_at');
    }

    public function confirmadoPor()
    {
        return $this->belongsTo(User::class, 'pago_confirmado_por');
    }

    /** Genera un código legible para el cliente: AB-260918-0007. */
    public static function nuevoCodigo(): string
    {
        $prefijo = 'AB-' . now()->format('ymd') . '-';
        $ultimo = static::where('codigo', 'like', $prefijo . '%')->orderByDesc('id')->value('codigo');
        $n = $ultimo ? ((int) Str::afterLast($ultimo, '-')) + 1 : 1;

        return $prefijo . str_pad((string) $n, 4, '0', STR_PAD_LEFT);
    }

    public static function nuevoToken(): string
    {
        return Str::random(48);
    }

    public function esEnvio(): bool
    {
        return $this->tipo_entrega === 'envio';
    }

    public function pagoConfirmado(): bool
    {
        return in_array($this->estado, self::CON_PAGO_CONFIRMADO, true);
    }

    public function etiqueta(): string
    {
        return self::ETIQUETAS[$this->estado] ?? $this->estado;
    }

    /** Deja registrado un paso en la línea de tiempo del pedido. */
    public function registrarEvento(string $titulo, ?string $detalle = null, bool $publico = true, ?int $userId = null): PedidoEvento
    {
        return $this->eventos()->create([
            'estado'  => $this->estado,
            'titulo'  => $titulo,
            'detalle' => $detalle,
            'publico' => $publico,
            'user_id' => $userId,
        ]);
    }

    /**
     * Lo único que puede ver el cliente en el seguimiento.
     *
     * El IMEI y la serie salen SOLO con el pago confirmado; las notas internas nunca.
     */
    public function paraElCliente(): array
    {
        $confirmado = $this->pagoConfirmado();

        return [
            'codigo'        => $this->codigo,
            'estado'        => $this->estado,
            'etiqueta'      => $this->etiqueta(),
            'pago_confirmado' => $confirmado,
            'creado_en'     => $this->created_at?->toIso8601String(),
            'tipo_entrega'  => $this->tipo_entrega,
            'subtotal'      => (float) $this->subtotal,
            'costo_envio'   => (float) $this->costo_envio,
            'total'         => (float) $this->total,
            'moneda'        => $this->moneda,
            'metodo_pago'   => $this->metodo_pago,
            'cliente'       => [
                'nombre'   => $this->nombre_cliente,
                'telefono' => $this->telefono_cliente,
                'email'    => $this->email_cliente,
            ],
            'envio' => $this->esEnvio() ? [
                'departamento' => $this->envio_departamento,
                'ciudad'       => $this->envio_ciudad,
                'direccion'    => $this->envio_direccion,
                'referencia'   => $this->envio_referencia,
                'destinatario' => $this->envio_destinatario,
                'courier'      => $this->courier,
                'tracking'     => $this->tracking_codigo,
                'tracking_url' => $this->tracking_url,
                'enviado_en'   => $this->enviado_en?->toIso8601String(),
                'entregado_en' => $this->entregado_en?->toIso8601String(),
            ] : null,
            'items' => $this->items->map(fn (PedidoItem $i) => $i->paraElCliente($confirmado))->all(),
            'eventos' => $this->eventos->where('publico', true)->values()->map(fn (PedidoEvento $e) => [
                'titulo'  => $e->titulo,
                'detalle' => $e->detalle,
                'estado'  => $e->estado,
                'fecha'   => $e->created_at?->toIso8601String(),
            ])->all(),
        ];
    }
}
