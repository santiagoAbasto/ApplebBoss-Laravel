<?php

namespace App\Models;

use App\Support\TradeIn\Cuestionario;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Una solicitud de Trade-In: un cliente quiere entregar su equipo como parte de pago. Llega desde el formulario de
 * /trade-in con las respuestas del cuestionario (App\Support\TradeIn\Cuestionario) y se sigue en el panel por etapas.
 * Nada de esto es público: la confirmación solo la ve quien la envió.
 */
class TradeInSolicitud extends Model
{
    protected $table = 'trade_in_solicitudes';

    protected $fillable = [
        'codigo',
        'tipo_dispositivo',
        'marca',
        'modelo',
        'capacidad',
        'color',
        'respuestas',
        'fotos',
        'observaciones_cliente',
        'valor_estimado',
        'moneda',
        'nota_estimacion',
        'nombre_contacto',
        'telefono_contacto',
        'email_contacto',
        'ciudad',
        'interes',
        'estado',
        'notas_internas',
        'atendido_por',
        'historial',
    ];

    protected $casts = [
        'respuestas'     => 'array',
        'fotos'          => 'array',
        'historial'      => 'array',
        'valor_estimado' => 'float',
    ];

    public const TIPOS = Cuestionario::TIPOS;

    public const ESTADOS = [
        'nuevo',
        'pendiente',
        'contactado',
        'evaluacion',
        'cotizado',
        'aceptado',
        'completado',
        'rechazado',
    ];

    /** Las etapas en curso; `completado` y `rechazado` cierran la solicitud. */
    public const ABIERTAS = ['nuevo', 'pendiente', 'contactado', 'evaluacion', 'cotizado', 'aceptado'];

    public const ETIQUETAS = [
        'nuevo'      => 'Nueva',
        'pendiente'  => 'Esperando respuesta',
        'contactado' => 'En conversación',
        'evaluacion' => 'En revisión',
        'cotizado'   => 'Cotizada',
        'aceptado'   => 'Aceptada',
        'completado' => 'Completada',
        'rechazado'  => 'Cerrada sin acuerdo',
    ];

    /** Horas desde las que una solicitud nueva sin responder se marca como demorada. */
    public const HORAS_DEMORA = 24;

    public static function generarCodigo(): string
    {
        $ultimo = static::orderByDesc('id')->value('codigo');
        $num = $ultimo ? ((int) substr($ultimo, -6)) + 1 : 1;

        return 'AB-TI-' . str_pad($num, 6, '0', STR_PAD_LEFT);
    }

    public function atendidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'atendido_por');
    }

    public function scopePendientes(Builder $query): Builder
    {
        return $query->whereIn('estado', ['nuevo', 'pendiente', 'contactado']);
    }

    public function etiqueta(): string
    {
        return self::ETIQUETAS[$this->estado] ?? $this->estado;
    }

    public function abierta(): bool
    {
        return in_array($this->estado, self::ABIERTAS, true);
    }

    public function demorada(): bool
    {
        return $this->estado === 'nuevo' && $this->created_at && $this->created_at->lte(now()->subHours(self::HORAS_DEMORA));
    }

    public function memoria(): ?string
    {
        return $this->respuestas['memoria'] ?? null;
    }

    /**
     * «iPhone 14 Pro · 256 GB · Morado oscuro» o «Samsung Galaxy S23 · 256 GB · 8 GB de memoria» (sin los «No sé»). En
     * otras marcas, la marca va delante si el modelo no la trae.
     */
    public function dispositivo(): string
    {
        $sabido = fn (?string $v) => filled($v) && $v !== 'No sé' ? $v : null;
        $marca = $sabido($this->marca);
        // «Microsoft Xbox» con «Xbox Series X» ya se entiende; «Samsung» con «Galaxy S23» suma la marca
        $yaLaNombra = collect(preg_split('/\s+/u', Str::lower((string) $marca)))
            ->contains(fn (string $palabra) => mb_strlen($palabra) >= 3 && Str::contains(Str::lower((string) $this->modelo), $palabra));
        $nombre = $marca && $marca !== 'Apple' && ! $yaLaNombra ? "{$marca} {$this->modelo}" : $this->modelo;
        $memoria = $sabido($this->memoria());

        return collect([$nombre, $sabido($this->capacidad), $memoria ? "{$memoria} de memoria" : null, $sabido($this->color)])
            ->filter()
            ->implode(' · ');
    }

    public function alertas(): array
    {
        return Cuestionario::alertas($this->tipo_dispositivo, $this->respuestas ?? []);
    }

    public function grado(): string
    {
        return Cuestionario::grado($this->tipo_dispositivo, $this->respuestas ?? []);
    }

    public function resumen(): array
    {
        return Cuestionario::resumen($this->tipo_dispositivo, $this->respuestas ?? []);
    }

    /** El número para abrir WhatsApp: solo dígitos y con código de país (un celular boliviano de 8 dígitos suma 591). */
    public function whatsapp(): ?string
    {
        $telefono = trim((string) $this->telefono_contacto);
        $digitos = preg_replace('/\D/', '', $telefono);

        if (str_starts_with($digitos, '00')) {
            $digitos = substr($digitos, 2);
        }
        if (strlen($digitos) === 8 && in_array($digitos[0], ['6', '7'], true)) {
            return '591' . $digitos;
        }

        return strlen($digitos) >= 10 ? $digitos : null;
    }

    /** El primer mensaje para el cliente: con el valor estimado si ya se cargó; si no, para coordinar la revisión. */
    public function mensajeWhatsapp(): string
    {
        $nombre = Str::of((string) $this->nombre_contacto)->trim()->before(' ');
        $equipo = trim($this->modelo . ($this->capacidad && $this->capacidad !== 'No sé' ? " de {$this->capacidad}" : ''));
        $saludo = "Hola {$nombre}, te escribimos de Apple Boss por tu solicitud de Trade-In {$this->codigo} ({$equipo}).";

        if ($this->valor_estimado) {
            $valor = 'Bs ' . number_format($this->valor_estimado, fmod($this->valor_estimado, 1) ? 2 : 0, ',', '.');

            return trim("{$saludo} Por lo que nos contaste, el valor estimado es de {$valor}, sujeto a la revisión del equipo en la tienda. {$this->nota_estimacion}");
        }

        return "{$saludo} Revisamos tus respuestas y queremos coordinar la revisión del equipo. ¿Cuándo podrías traerlo?";
    }

    /** Deja constancia en el historial (no guarda: lo guarda quien la llama). */
    public function registrar(string $tipo, array $datos = [], ?User $usuario = null): void
    {
        $this->historial = [
            ...($this->historial ?? []),
            array_filter(['tipo' => $tipo, 'fecha' => now()->toIso8601String(), 'usuario' => $usuario?->name, ...$datos], fn ($v) => $v !== null),
        ];
    }
}
