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
        'equipo',
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
    ];

    /**
     * Casts automáticos
     */
    protected $casts = [
        'fecha'            => 'date',
        'recepcion'        => 'array',
        'costo_pendiente'  => 'boolean',
        'costo_cargado_en' => 'datetime',
    ];

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

    /** Los servicios que todavía no tienen costo: el administrador tiene que cargarlo para saber la utilidad. */
    public function scopeSinCosto($query)
    {
        return $query->where('costo_pendiente', true);
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
