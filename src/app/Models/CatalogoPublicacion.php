<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class CatalogoPublicacion extends Model
{
    protected $table = 'catalogo_publicaciones';

    protected $fillable = [
        'producto_tipo',
        'producto_id',
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

    // ─── Relaciones ───────────────────────────────────────────────────────────

    public function imagenes(): HasMany
    {
        return $this->hasMany(CatalogoImagen::class, 'publicacion_id')->orderBy('orden');
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
     * Campos obligatorios por categoría para poder publicar.
     * Devuelve array de campos faltantes. Vacío = puede publicar.
     */
    public function camposFaltantes(): array
    {
        $faltantes = [];

        if (blank($this->titulo))   $faltantes[] = 'Título público';
        if (blank($this->slug))     $faltantes[] = 'Slug';
        if (blank($this->resumen))  $faltantes[] = 'Resumen';
        if (blank($this->categoria)) $faltantes[] = 'Categoría';
        if (is_null($this->condicion)) $faltantes[] = 'Condición';
        if ($this->imagenes->isEmpty()) $faltantes[] = 'Imagen principal';

        // Precio: lo sacamos del producto de inventario asociado
        if (! $this->precioVigente()) $faltantes[] = 'Precio de venta válido';

        return $faltantes;
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
        return match ($this->producto_tipo) {
            'celular'          => \App\Models\Celular::find($this->producto_id)?->precio_venta,
            'computadora'      => \App\Models\Computadora::find($this->producto_id)?->precio_venta,
            'producto_apple'   => \App\Models\ProductoApple::find($this->producto_id)?->precio_venta,
            'producto_general' => \App\Models\ProductoGeneral::find($this->producto_id)?->precio_venta,
            default            => null,
        };
    }

    /**
     * El producto de inventario sigue disponible (no vendido/reservado).
     */
    public function productoDisponible(): bool
    {
        $model = match ($this->producto_tipo) {
            'celular'          => \App\Models\Celular::find($this->producto_id),
            'computadora'      => \App\Models\Computadora::find($this->producto_id),
            'producto_apple'   => \App\Models\ProductoApple::find($this->producto_id),
            'producto_general' => \App\Models\ProductoGeneral::find($this->producto_id),
            default            => null,
        };
        if (! $model) return false;
        if ($model->estado !== 'disponible') return false;

        // Verificar si está reservado
        return ! ReservaItem::query()
            ->where('tipo', $this->producto_tipo)
            ->where('producto_id', $this->producto_id)
            ->whereHas('reserva', fn ($q) => $q->where('estado', 'activa'))
            ->exists();
    }
}
