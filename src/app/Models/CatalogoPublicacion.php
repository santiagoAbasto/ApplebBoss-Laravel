<?php

namespace App\Models;

use App\Support\InventarioCatalogo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CatalogoPublicacion extends Model
{
    protected $table = 'catalogo_publicaciones';

    protected $fillable = [
        'producto_tipo',
        'producto_id',
        'modelo_referencia_id',
        'storefront',
        'publicado',
        'destacado',
        'publicar_desde',
        'publicar_hasta',
        'orden',
        'titulo',
        'subtitulo',
        'slug',
        'resumen',
        'descripcion',
        'que_incluye',
        'observaciones',
        'garantia',
        'condicion',
        'categoria',
        'subcategoria',
        'tags',
        'atributos',
        'seo_title',
        'seo_description',
        'precio_promocional',
        'promocion_desde',
        'promocion_hasta',
        'badge',
    ];

    protected $casts = [
        'publicado'          => 'boolean',
        'destacado'          => 'boolean',
        'publicar_desde'     => 'datetime',
        'publicar_hasta'     => 'datetime',
        'promocion_desde'    => 'datetime',
        'promocion_hasta'    => 'datetime',
        'precio_promocional' => 'float',
        'tags'               => 'array',
        'atributos'          => 'array',
    ];

    // Storefronts válidos
    public const STOREFRONT_APPLE_BOSS = 'APPLE_BOSS';
    public const STOREFRONT_MYSKIN     = 'MYSKIN';

    // MYSKIN solo para estas categorías
    public const MYSKIN_CATEGORIAS = ['fundas'];

    // Condiciones permitidas
    public const CONDICIONES = ['Nuevo', 'Seminuevo', 'Open Box', 'Reacondicionado'];

    /**
     * Datos de inventario cargados en lote (precargarInventario). No se guardan en la base.
     * Evita una consulta por producto al listar cientos de publicaciones.
     */
    protected ?array $precarga = null;

    // ─── Relaciones ───────────────────────────────────────────────────────────

    public function imagenes(): HasMany
    {
        return $this->hasMany(CatalogoImagen::class, 'publicacion_id')->orderBy('orden');
    }

    public function compatibilidades(): HasMany
    {
        return $this->hasMany(CatalogoCompatibilidad::class, 'publicacion_id')->orderBy('target_id');
    }

    public function imagenPrincipal(): ?CatalogoImagen
    {
        return $this->imagenes->firstWhere('es_principal', true)
            ?? $this->imagenes->first();
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopePublicadoAhora(Builder $query): Builder
    {
        $now = Carbon::now();
        return $query
            ->where('publicado', true)
            ->where(fn ($q) => $q->whereNull('publicar_desde')->orWhere('publicar_desde', '<=', $now))
            ->where(fn ($q) => $q->whereNull('publicar_hasta')->orWhere('publicar_hasta', '>=', $now));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function esMyskin(): bool
    {
        return $this->storefront === self::STOREFRONT_MYSKIN;
    }

    /**
     * Lo mínimo para poder publicar (en palabras simples para el admin).
     * La foto es recomendada pero no obligatoria: sin foto se muestra una ilustración de marca.
     */
    public function camposFaltantes(): array
    {
        $faltantes = [];

        if (blank($this->titulo))      $faltantes[] = 'Nombre del producto';
        if (blank($this->slug))        $faltantes[] = 'Dirección web';
        if (blank($this->resumen))     $faltantes[] = 'Descripción corta';
        if (blank($this->categoria))   $faltantes[] = 'Categoría';
        if (is_null($this->condicion)) $faltantes[] = 'Condición (Nuevo, Seminuevo…)';

        // Precio: lo sacamos del producto de inventario asociado
        if (! $this->precioVigente()) $faltantes[] = 'Precio de venta en el inventario';

        return $faltantes;
    }

    /** Mejoras sugeridas que no impiden publicar. */
    public function recomendaciones(): array
    {
        return $this->imagenes->isEmpty() ? ['Agregar una foto'] : [];
    }

    /** Partes de nombres de atributo que nunca salen a lo público, aunque alguien las cargue a mano. */
    private const ATRIBUTOS_PRIVADOS = [
        'imei', 'costo', 'precio_compra', 'invertido', 'procedencia', 'proveedor', 'ganancia', 'margen', 'nota_interna', 'notas_internas', 'privad',
    ];

    /**
     * Atributos aptos para la tienda y la API pública: sin IMEI (ni su estado), costo, procedencia ni ganancia.
     * El número de serie sí puede mostrarse.
     */
    public function modeloReferencia(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(ModeloReferencia::class, 'modelo_referencia_id');
    }

    /** Tipos de inventario que tienen batería. */
    private const TIPOS_CON_BATERIA = ['celular', 'computadora', 'producto_apple'];

    /**
     * Batería del inventario, tal como se carga: "86", "86 %", "100 SELLADO", "95 - 308 CICLOS", "CICLOS 5", "-".
     * @return array{salud: ?int, ciclos: ?int, sellado: bool}
     */
    public static function bateriaDe(mixed $valor): array
    {
        $texto = mb_strtoupper(trim((string) $valor));
        $ciclos = preg_match('/(\d+)\s*CICLOS|CICLOS\s*(\d+)/', $texto, $m) ? (int) ($m[1] !== '' ? $m[1] : $m[2]) : null;
        $sinCiclos = preg_replace('/\d+\s*CICLOS|CICLOS\s*\d+/', ' ', $texto);
        $salud = preg_match('/\b(\d{1,3})\b/', $sinCiclos, $n) && (int) $n[1] >= 1 && (int) $n[1] <= 100 ? (int) $n[1] : null;
        $sellado = str_contains($texto, 'SELLAD');

        return ['salud' => $salud ?? ($sellado ? 100 : null), 'ciclos' => $ciclos, 'sellado' => $sellado];
    }

    /** Batería actual del equipo en el inventario (null si el tipo no tiene batería o no hay equipo). */
    public function bateriaInventario(): ?array
    {
        if (! in_array($this->producto_tipo, self::TIPOS_CON_BATERIA, true)) {
            return null;
        }
        $m = $this->inventario();

        return $m ? self::bateriaDe($m->bateria ?? null) : null;
    }

    public function atributosPublicos(): array
    {
        $atributos = $this->atributos ?? [];

        // La batería sale del inventario, siempre al día. Si allí no hay un porcentaje claro, vale lo cargado a mano.
        if ($bateria = $this->bateriaInventario()) {
            if ($bateria['salud'] !== null) {
                $atributos['salud_bateria'] = $bateria['salud'];
                unset($atributos['bateria']);
            } elseif (! isset($atributos['salud_bateria']) && isset($atributos['bateria'])) {
                $atributos['salud_bateria'] = $atributos['bateria'];
                unset($atributos['bateria']);
            }
            if ($bateria['ciclos'] !== null) {
                $atributos['ciclos_bateria'] = $bateria['ciclos'];
            }
            if ($bateria['sellado']) {
                $atributos['bateria_sellada'] = true;
            }
        }

        // Un seminuevo no dura lo que uno nuevo: la autonomía del modelo se ajusta con la salud de su batería
        $horas = (float) ($atributos['autonomia_video_horas'] ?? 0);
        $salud = preg_match('/\d{1,3}/', (string) ($atributos['salud_bateria'] ?? ''), $s) ? (int) $s[0] : 0;
        if ($horas > 0 && $salud > 0 && $salud < 100 && empty($atributos['bateria_sellada']) && $this->condicion !== 'Nuevo') {
            $atributos['autonomia_estimada_horas'] = (int) round($horas * $salud / 100);
        }

        return collect($atributos)
            ->reject(function ($valor, $clave) {
                $nombre = preg_replace('/[^a-z0-9]+/', '_', \Illuminate\Support\Str::ascii(mb_strtolower((string) $clave)));
                foreach (self::ATRIBUTOS_PRIVADOS as $privado) {
                    if (str_contains($nombre, $privado)) {
                        return true;
                    }
                }

                // Un número de 15 dígitos es un IMEI aunque venga con otro nombre
                return is_scalar($valor) && preg_match('/^\d{15}$/', preg_replace('/[\s-]/', '', (string) $valor));
            })
            ->all();
    }

    /** Tipos de inventario cuyo número de serie se muestra en la ficha pública. */
    private const TIPOS_CON_SERIE_PUBLICA = ['celular', 'computadora'];

    /**
     * Número de serie del equipo para la ficha pública (solo celulares y computadoras).
     * Nunca devuelve un IMEI: si el dato parece uno (15 dígitos) o coincide con sus IMEI, no se muestra.
     */
    public function numeroSeriePublico(): ?string
    {
        if (! in_array($this->producto_tipo, self::TIPOS_CON_SERIE_PUBLICA, true)) {
            return null;
        }

        $m = $this->inventario();
        $serie = trim((string) ($m->numero_serie ?? ''));
        if ($serie === '' || in_array(mb_strtolower($serie), ['-', '0', 'permuta'], true)) {
            return null;
        }

        $compacta = preg_replace('/[\s-]/', '', $serie);
        $imeis = array_filter([$m->imei_1 ?? null, $m->imei_2 ?? null]);
        if (preg_match('/^\d{15}$/', $compacta) || in_array($compacta, $imeis, true)) {
            return null;
        }

        return mb_strtoupper($serie);
    }

    public function estadoPublicacion(): string
    {
        $faltantes = $this->camposFaltantes();
        if ($faltantes !== []) return 'Incompleto';

        if (! $this->publicado) {
            if ($this->publicar_desde && $this->publicar_desde->isFuture()) return 'Programado';
            return 'Borrador';
        }

        if ($this->publicar_hasta && $this->publicar_hasta->isPast()) return 'Oculto';
        return 'Publicado';
    }

    public function promocionActiva(): bool
    {
        if (! $this->precio_promocional) return false;
        $now = Carbon::now();
        if ($this->promocion_desde && $this->promocion_desde->gt($now)) return false;
        if ($this->promocion_hasta && $this->promocion_hasta->lt($now)) return false;
        return true;
    }

    public function precioPublico(): float
    {
        if ($this->promocionActiva() && $this->precio_promocional) {
            return (float) $this->precio_promocional;
        }
        return (float) ($this->precioVigente() ?? 0);
    }

    /**
     * Precio vigente del producto de inventario.
     * NUNCA exponer costo, ganancia u otros campos internos.
     */
    public function precioVigente(): ?float
    {
        $m = $this->inventario();
        return $m && $m->precio_venta !== null ? (float) $m->precio_venta : null;
    }

    /**
     * El producto sigue disponible (no vendido ni reservado).
     * Accesorios: disponible mientras quede al menos una unidad del mismo artículo (nombre + precio).
     */
    public function productoDisponible(): bool
    {
        if ($this->producto_tipo === 'producto_general') {
            return $this->unidadesDisponibles() > 0;
        }

        $m = $this->inventario();
        if (! $m || $m->estado !== 'disponible') return false;

        // Un pedido en línea sin pagar también aparta el equipo: no se le vende a otra persona.
        if (\App\Support\Checkout\StockDePedidos::estaRetenido($this->producto_tipo, (int) $this->producto_id)) {
            return false;
        }

        if ($this->precarga !== null) {
            return ! $this->precarga['reservado'];
        }

        return ! ReservaItem::query()
            ->where('tipo', $this->producto_tipo)
            ->where('producto_id', $this->producto_id)
            ->whereHas('reserva', fn ($q) => $q->where('estado', 'activa'))
            ->exists();
    }

    /** Unidades disponibles del artículo (solo accesorios). */
    public function unidadesDisponibles(): int
    {
        if ($this->precarga !== null) {
            return (int) ($this->precarga['unidades'] ?? 0);
        }

        $m = $this->inventario();
        if (! $m) return 0;

        return ProductoGeneral::where('estado', 'disponible')
            ->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower(trim($m->nombre))])
            ->where('precio_venta', $m->precio_venta)
            ->whereNotIn('id', self::idsReservados('producto_general'))
            ->count();
    }

    /** Un accesorio "artículo" = mismo nombre (sin distinguir mayúsculas) y mismo precio. */
    public static function claveArticulo(?string $nombre, mixed $precio): string
    {
        return mb_strtolower(trim((string) $nombre)) . '|' . number_format((float) $precio, 2, '.', '');
    }

    /** Carga en pocas consultas el inventario, reservas y stock de accesorios de muchas publicaciones. */
    public static function precargarInventario(iterable $pubs): void
    {
        $pubs = collect($pubs)->filter(fn ($p) => $p instanceof self)->values();
        if ($pubs->isEmpty()) return;

        $inv = [];
        foreach ($pubs->groupBy('producto_tipo') as $tipo => $grupo) {
            $class = InventarioCatalogo::claseInventario($tipo);
            if ($class) {
                $inv[$tipo] = $class::whereIn('id', $grupo->pluck('producto_id')->unique()->values())->get()->keyBy('id');
            }
        }

        $reservados = ReservaItem::query()
            ->whereHas('reserva', fn ($q) => $q->where('estado', 'activa'))
            ->get(['tipo', 'producto_id'])
            ->mapWithKeys(fn ($r) => ["{$r->tipo}:{$r->producto_id}" => true])
            ->all();

        // Accesorios: unidades disponibles (no reservadas) por artículo
        $unidades = collect();
        $reps = collect($inv['producto_general'] ?? []);
        if ($reps->isNotEmpty()) {
            $nombres = $reps->map(fn ($m) => mb_strtolower(trim($m->nombre)))->unique()->values()->all();
            $unidades = ProductoGeneral::where('estado', 'disponible')
                ->whereIn(DB::raw('LOWER(TRIM(nombre))'), $nombres)
                ->get(['id', 'nombre', 'precio_venta'])
                ->reject(fn ($u) => isset($reservados["producto_general:{$u->id}"]))
                ->countBy(fn ($u) => self::claveArticulo($u->nombre, $u->precio_venta));
        }

        foreach ($pubs as $pub) {
            $m = ($inv[$pub->producto_tipo] ?? collect())->get($pub->producto_id);
            $pub->precarga = [
                'modelo'    => $m,
                'reservado' => isset($reservados["{$pub->producto_tipo}:{$pub->producto_id}"]),
                'unidades'  => $pub->producto_tipo === 'producto_general' && $m
                    ? (int) ($unidades[self::claveArticulo($m->nombre, $m->precio_venta)] ?? 0)
                    : null,
            ];
        }
    }

    public function inventario(): mixed
    {
        if ($this->precarga !== null) {
            return $this->precarga['modelo'];
        }
        return InventarioCatalogo::modelo((string) $this->producto_tipo, (int) $this->producto_id);
    }

    private static function idsReservados(string $tipo): array
    {
        return ReservaItem::query()
            ->where('tipo', $tipo)
            ->whereHas('reserva', fn ($q) => $q->where('estado', 'activa'))
            ->pluck('producto_id')
            ->all();
    }
}
