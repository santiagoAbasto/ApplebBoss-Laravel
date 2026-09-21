<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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

    /** La cuenta que hizo el pedido. Null en los pedidos viejos, de cuando no hacía falta cuenta. */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

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
     * El pedido completo, para el panel.
     *
     * Acá sí va todo: notas internas, comprobante, quién confirmó el pago y los eventos
     * privados. Es la vista de quien administra, no la del cliente.
     */
    public function paraElPanel(): array
    {
        return [
            'id'              => $this->id,
            'codigo'          => $this->codigo,
            'estado'          => $this->estado,
            'etiqueta'        => $this->etiqueta(),
            'pago_confirmado' => $this->pagoConfirmado(),
            'creado_en'       => $this->created_at?->toIso8601String(),
            'expira_en'       => $this->expira_en?->toIso8601String(),
            'tipo_entrega'    => $this->tipo_entrega,
            'subtotal'        => (float) $this->subtotal,
            'costo_envio'     => (float) $this->costo_envio,
            'total'           => (float) $this->total,
            'moneda'          => $this->moneda,
            'cliente' => [
                'nombre'       => $this->nombre_cliente,
                'email'        => $this->email_cliente,
                'telefono'     => $this->telefono_cliente,
                'documento'    => $this->documento,
                'razon_social' => $this->razon_social,
            ],
            'pago' => [
                'metodo'         => $this->metodo_pago,
                'referencia'     => $this->pago_referencia,
                'tiene_comprobante' => filled($this->pago_comprobante),
                'confirmado_en'  => $this->pago_confirmado_en?->toIso8601String(),
                'confirmado_por' => $this->confirmadoPor?->name,
            ],
            'envio' => $this->esEnvio() ? [
                'departamento' => $this->envio_departamento,
                'ciudad'       => $this->envio_ciudad,
                'direccion'    => $this->envio_direccion,
                'referencia'   => $this->envio_referencia,
                'destinatario' => $this->envio_destinatario,
                'telefono'     => $this->envio_telefono,
                'courier'      => $this->courier,
                'tracking'     => $this->tracking_codigo,
                'tracking_url' => $this->tracking_url,
                'enviado_en'   => $this->enviado_en?->toIso8601String(),
                'entregado_en' => $this->entregado_en?->toIso8601String(),
            ] : null,
            'notas_cliente'  => $this->notas_cliente,
            'notas_internas' => $this->notas_internas,
            'items' => $this->items->map(fn (PedidoItem $i) => [
                'nombre'       => $i->nombre,
                'condicion'    => $i->condicion,
                'slug'         => $i->slug,
                'tipo'         => $i->tipo,
                'cantidad'     => $i->cantidad,
                'precio'       => (float) $i->precio_unitario,
                'subtotal'     => (float) $i->subtotal,
                'imei_1'       => $i->imei_1,
                'imei_2'       => $i->imei_2,
                'numero_serie' => $i->numero_serie,
            ])->all(),
            // Toda la línea de tiempo, también lo que el cliente no ve, y con su autor
            'eventos' => $this->eventos->sortBy('id')->values()->map(fn (PedidoEvento $e) => [
                'titulo'  => $e->titulo,
                'detalle' => $e->detalle,
                'estado'  => $e->estado,
                'publico' => (bool) $e->publico,
                'autor'   => $e->usuario?->name,
                'fecha'   => $e->created_at?->toIso8601String(),
            ])->all(),
        ];
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
