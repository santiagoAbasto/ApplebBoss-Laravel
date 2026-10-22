<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Services\GeneradorCodigos;
use App\Models\User;
use App\Models\Venta;

class ServicioTecnico extends Model
{
    use HasFactory;

    /**
     * Campos asignables en masa
     */
    protected $fillable = [
        'codigo_nota',
        'cliente',
        'telefono',
        'correo',
        'equipo',
        'estado',
        'correo_enviado_en',
        'marca',
        'recepcion',
        'detalle_servicio',
        'notas_adicionales', // 👈 NUEVO
        'precio_costo',
        'precio_venta',
        'tecnico',
        'fecha',
        'user_id',
        'cliente_id',
        'venta_id',
        'costo_pendiente',
        'costo_cargado_por',
        'costo_cargado_en',
        'modo',
        'cuota_diagnostico',
        'presupuesto_en',
        'aprobado_en',
        'rechazado_en',
    ];

    /**
     * Casts automáticos
     */
    protected $casts = [
        'fecha'            => 'date',
        'recepcion'        => 'array',
        'costo_pendiente'  => 'boolean',
        'costo_cargado_en' => 'datetime',
        'correo_enviado_en' => 'datetime',
        'resena_pedida_en' => 'datetime',
        'cuota_diagnostico' => 'decimal:2',
        'presupuesto_en'   => 'datetime',
        'aprobado_en'      => 'datetime',
        'rechazado_en'     => 'datetime',
    ];

    /* =========================
     |  ESTADO DEL TRABAJO
     ========================= */

    public const RECIBIDO = 'recibido';

    public const EN_DIAGNOSTICO = 'en_diagnostico';

    public const PRESUPUESTO = 'presupuesto';

    public const EN_REPARACION = 'en_reparacion';

    public const LISTO = 'listo';

    public const ENTREGADO = 'entregado';

    /** El cliente no aprobó el presupuesto: no se repara. Rama aparte, no es un paso del camino normal. */
    public const RECHAZADO = 'rechazado';

    /**
     * El camino completo del equipo, en orden (sirve de tracker en el correo, estilo Pedidos Ya). Un servicio de
     * «reparación directa» salta el diagnóstico y el presupuesto (ver pasosTracker). Cada paso avisa al cliente.
     */
    public const ESTADOS = [
        self::RECIBIDO       => 'Recibido',
        self::EN_DIAGNOSTICO => 'En diagnóstico',
        self::PRESUPUESTO    => 'Presupuesto',
        self::EN_REPARACION  => 'En reparación',
        self::LISTO          => 'Reparado',
        self::ENTREGADO      => 'Entregado',
    ];

    /** Etiquetas de todos los estados, incluido el rechazado que no es parte del camino normal. */
    public const ETIQUETAS = self::ESTADOS + [self::RECHAZADO => 'Presupuesto rechazado'];

    /* =========================
     |  CÓMO INGRESA EL SERVICIO
     ========================= */

    public const MODO_DIRECTO = 'directo';

    public const MODO_DIAGNOSTICO = 'diagnostico';

    public const MODOS = [
        self::MODO_DIRECTO     => 'Reparación directa',
        self::MODO_DIAGNOSTICO => 'Diagnóstico',
    ];

    public function etiquetaDeEstado(): string
    {
        return self::ETIQUETAS[$this->estado] ?? self::ETIQUETAS[self::RECIBIDO];
    }

    public function esDiagnostico(): bool
    {
        return $this->modo === self::MODO_DIAGNOSTICO;
    }

    /** Los pasos del camino para ESTE servicio: el directo no muestra diagnóstico ni presupuesto. */
    public function pasosTracker(): array
    {
        $saltar = $this->esDiagnostico() ? [] : [self::EN_DIAGNOSTICO, self::PRESUPUESTO];

        return array_values(array_diff(array_keys(self::ESTADOS), $saltar));
    }

    /**
     * Qué estados puede elegir a mano el panel desde el desplegable. El presupuesto y el rechazo salen de su propio
     * flujo (cargar presupuesto / el cliente aprueba), no del desplegable.
     */
    public function estadosSeleccionables(): array
    {
        $pasos = array_values(array_diff($this->pasosTracker(), [self::PRESUPUESTO]));

        // Mientras no haya precio aprobado, un diagnóstico no salta a reparación desde el desplegable.
        if ($this->esDiagnostico() && in_array($this->estado, [self::RECIBIDO, self::EN_DIAGNOSTICO], true)) {
            return array_values(array_diff($pasos, [self::EN_REPARACION, self::LISTO, self::ENTREGADO]));
        }

        return $pasos;
    }

    /* =========================
     |  MARCA DEL EQUIPO
     ========================= */

    public const MARCA_APPLE = 'apple';

    public const MARCA_ANDROID = 'android';

    public const MARCA_OTRO = 'otro';

    /** De qué es el equipo: de acá sale quién lo puede reparar. */
    public const MARCAS = [
        self::MARCA_APPLE   => 'iPhone / Apple',
        self::MARCA_ANDROID => 'Android',
        self::MARCA_OTRO    => 'Otro equipo',
    ];

    /**
     * Generación automática del código de nota
     * Formato: AT-ST001, AT-ST002, etc.
     */
    protected static function booted()
    {
        static::created(function (ServicioTecnico $servicio) {
            if (empty($servicio->codigo_nota)) {
                $servicio->codigo_nota = 'AT-ST' . str_pad($servicio->id, 3, '0', STR_PAD_LEFT);
                $servicio->save();
            }

            if (preg_match('/AT-ST(\d+)/', (string) $servicio->codigo_nota, $matches)) {
                GeneradorCodigos::sincronizarSecuencia('servicio_tecnico', (int) $matches[1]);
            }
        });
    }

    /* =========================
     |  RELACIONES
     ========================= */

    /**
     * Usuario que registró el servicio (vendedor)
     */
    public function vendedor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Venta asociada (opcional)
     */
    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }

    /** Quién cargó el costo del servicio (el administrador). */
    public function quienCargoElCosto()
    {
        return $this->belongsTo(User::class, 'costo_cargado_por');
    }

    /* =========================
     |  COSTO Y UTILIDAD
     ========================= */

    /**
     * Los servicios que todavía no tienen costo: el administrador tiene que cargarlo para saber la utilidad. Un
     * diagnóstico que aún está en diagnóstico no cuenta: todavía no hay reparación ni precio sobre el cual cargar costo.
     */
    public function scopeSinCosto($query)
    {
        return $query->where('costo_pendiente', true)
            ->where(function ($q) {
                $q->where('modo', '!=', self::MODO_DIAGNOSTICO)
                    ->orWhereNotIn('estado', [self::RECIBIDO, self::EN_DIAGNOSTICO]);
            });
    }

    /** Lo que cuesta el servicio para los reportes: sin costo cargado no se inventa uno. */
    public function costoParaReportes(): float
    {
        return $this->costo_pendiente ? 0.0 : (float) $this->precio_costo;
    }

    /**
     * La utilidad del servicio para los reportes. Mientras falta el costo no se suma nada: sumar el cobro entero como
     * ganancia la inflaría, y el reporte avisa que hay servicios pendientes.
     */
    public function gananciaParaReportes(): float
    {
        return $this->costo_pendiente ? 0.0 : (float) $this->precio_venta - (float) $this->precio_costo;
    }

    /** Los trabajos del servicio (el JSON del detalle), o null si es un registro antiguo con texto libre. */
    public function trabajos(): ?array
    {
        $items = json_decode((string) $this->detalle_servicio, true);

        return is_array($items) ? array_values($items) : null;
    }

    /** Avisa en el Resumen del administrador que a este servicio le falta el costo. */
    public function avisarCostoPendiente(): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasColumn('system_notifications', 'servicio_tecnico_id')) {
            return;
        }

        $registro = $this->vendedor?->name ?? 'Un vendedor';

        SystemNotification::create([
            'type'                => 'servicio_sin_costo',
            'title'               => 'Falta el costo de un servicio técnico',
            'message'             => "{$registro} registró el servicio {$this->codigo_nota}: {$this->equipo} de {$this->cliente}, "
                . 'cobro de Bs ' . number_format((float) $this->precio_venta, 2) . '. '
                . 'Carga el costo para calcular la utilidad.',
            'servicio_tecnico_id' => $this->id,
        ]);
    }
}
