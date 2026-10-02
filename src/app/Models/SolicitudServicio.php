<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Un pedido de revisión que llega desde /servicio-tecnico: qué equipo es, qué le pasa y cómo ubicar al cliente. Es el
 * paso anterior a la recepción: cuando el equipo llega a la tienda se registra en Servicio técnico (ServicioTecnico).
 * Nada de esto es público. TIPOS y PROBLEMAS son la única fuente: el formulario, la validación y el panel salen de acá.
 */
class SolicitudServicio extends Model
{
    protected $table = 'solicitudes_servicio';

    protected $fillable = [
        'codigo', 'tipo_equipo', 'marca', 'modelo', 'problemas', 'descripcion',
        'nombre_contacto', 'telefono_contacto', 'estado', 'notas_internas', 'atendido_por',
    ];

    protected $casts = ['problemas' => 'array'];

    /** Los equipos Apple no preguntan la marca. */
    public const APPLE = ['iPhone', 'iPad', 'Mac', 'Apple Watch', 'AirPods'];

    public const TIPOS = [...self::APPLE, 'Celular Android', 'Otro equipo'];

    public const PROBLEMAS = [
        'pantalla'    => 'Pantalla rota o con fallas',
        'bateria'     => 'La batería dura poco',
        'carga'       => 'No carga',
        'no_enciende' => 'No enciende',
        'tapa'        => 'Tapa trasera rota',
        'camara'      => 'Cámara',
        'audio'       => 'Parlante o micrófono',
        'liquido'     => 'Se mojó',
        'otro'        => 'Otro problema',
    ];

    public const ETIQUETAS = [
        'nuevo'      => 'Nueva',
        'contactado' => 'En conversación',
        'recibido'   => 'Equipo recibido',
        'cerrado'    => 'Cerrada',
    ];

    public static function generarCodigo(): string
    {
        $ultimo = static::orderByDesc('id')->value('codigo');

        return 'AB-SV-' . str_pad((string) ($ultimo ? ((int) substr($ultimo, -6)) + 1 : 1), 6, '0', STR_PAD_LEFT);
    }

    public function atendidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'atendido_por');
    }

    /** «iPhone 14 Pro» o «Samsung Galaxy S23»: la marca va delante cuando no es Apple. */
    public function equipo(): string
    {
        return trim(($this->marca && $this->marca !== 'Apple' ? $this->marca . ' ' : '') . $this->modelo);
    }

    /** Lo que marcó el cliente, con las palabras del formulario. */
    public function problemasTexto(): array
    {
        return array_values(array_filter(array_map(fn ($p) => self::PROBLEMAS[$p] ?? null, $this->problemas ?? [])));
    }

    public function whatsapp(): ?string
    {
        return TradeInSolicitud::numeroWhatsapp($this->telefono_contacto);
    }

    public function mensajeWhatsapp(): string
    {
        $nombre = Str::of((string) $this->nombre_contacto)->trim()->before(' ');

        return "Hola {$nombre}, te escribimos de Apple Boss por tu solicitud de servicio técnico {$this->codigo} ({$this->equipo()}). ¿Cuándo podrías traer el equipo para revisarlo?";
    }
}
