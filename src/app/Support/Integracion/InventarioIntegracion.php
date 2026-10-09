<?php

namespace App\Support\Integracion;

use App\Models\CatalogoImagen;
use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\Integracion;
use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\ProductoApple;
use App\Models\ProductoGeneral;
use App\Models\ReservaItem;
use App\Support\InventarioCatalogo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Lo que la API de integración entrega de un producto, armado desde el inventario real de Apple Boss.
 *
 * - Un equipo (celular, computadora, otro producto Apple) es una unidad: su batería, color, capacidad y precio son
 *   solo suyos y nunca se mezclan con otra unidad. Id: «celular-22», «computadora-5», «producto-apple-31».
 * - Un accesorio es un artículo: las unidades con el mismo nombre y el mismo precio, como en la tienda. Id estable
 *   derivado de ese nombre y precio: «accesorio-<16 hex>». Si cambia el precio, es otro artículo.
 * - Si el producto tiene una publicación en la tienda, se suman su estado, su dirección, sus atributos públicos, su
 *   promoción y sus fotos. Las fotos salen solo de publicaciones visibles en la tienda.
 *
 * Nunca sale: costo, ganancia, IMEI ni su estado, número de serie, procedencia o proveedor, código interno,
 * notas privadas ni datos de clientes. Las columnas se eligen una por una, así esos datos ni se leen.
 * Nada se infiere del nombre: lo que no está cargado va en null.
 *
 * ponytail: arma todo el inventario en memoria en cada pedido (~600 productos y ~10 consultas hoy). Si pasa de unos
 * miles, filtrar en SQL antes de armar.
 */
class InventarioIntegracion
{
    public const SISTEMA = 'appleboss';

    /** Tipo de inventario => [prefijo del id, columnas que se leen]. */
    private const EQUIPOS = [
        'celular'        => ['celular', Celular::class, ['id', 'modelo', 'capacidad', 'color', 'bateria', 'precio_venta', 'estado', 'condicion', 'created_at', 'updated_at']],
        'computadora'    => ['computadora', Computadora::class, ['id', 'nombre', 'procesador', 'ram', 'almacenamiento', 'color', 'bateria', 'precio_venta', 'estado', 'condicion', 'created_at', 'updated_at']],
        'producto_apple' => ['producto-apple', ProductoApple::class, ['id', 'modelo', 'capacidad', 'color', 'bateria', 'precio_venta', 'estado', 'condicion', 'created_at', 'updated_at']],
    ];

    public const CATEGORIAS = [
        'celular'          => 'celulares',
        'computadora'      => 'computadoras',
        'producto_apple'   => 'productos-apple',
        'producto_general' => 'accesorios',
    ];

    /** La condición cargada en el inventario. Vacía = null (no se supone). */
    public const CONDICIONES = ['Nuevo' => 'new', 'Seminuevo' => 'used', 'Open Box' => 'open_box', 'Reacondicionado' => 'refurbished'];

    /** Estados de disponibilidad que la lista muestra si no se pide otra cosa: lo que sigue en la tienda física. */
    public const EN_STOCK = ['available', 'reserved'];

    private string $momento;

    /** Reservas activas y pedidos sin cerrar que apartan unidades: "tipo:id" => motivo. */
    private array $apartados = [];

    /** Último movimiento de reservas y pedidos por unidad: "tipo:id" => Carbon. */
    private array $movimientos = [];

    public function __construct(private readonly Integracion $integracion)
    {
        $this->momento = now()->toIso8601String();
    }

    public function momento(): string
    {
        return $this->momento;
    }

    /**
     * Todos los productos: cada uno es ['id', 'json', y las claves para filtrar y ordenar].
     */
    public function todos(): Collection
    {
        $this->cargarApartados();
        $publicaciones = $this->publicaciones();

        $equipos = collect(self::EQUIPOS)->flatMap(function ($def, $tipo) use ($publicaciones) {
            [$prefijo, $clase, $columnas] = $def;

            return $clase::query()->get($columnas)->map(fn ($m) => $this->equipo($tipo, $prefijo, $m, $publicaciones["{$tipo}:{$m->id}"] ?? null));
        });

        return $equipos->concat($this->accesorios($publicaciones))->values();
    }

    public function buscar(string $id): ?array
    {
        // Un id con otra forma ni se busca
        if (! preg_match('/^(celular|computadora|producto-apple)-\d{1,10}$|^accesorio-[0-9a-f]{16}$/', $id)) {
            return null;
        }

        return $this->todos()->firstWhere('id', $id);
    }

    /** Id estable de un artículo de accesorios: el mismo nombre (sin mayúsculas ni espacios de más) y el mismo precio. */
    public static function idArticulo(?string $nombre, mixed $precio): string
    {
        return 'accesorio-' . substr(hash('sha256', CatalogoPublicacion::claveArticulo($nombre, $precio)), 0, 16);
    }

    // ─── Equipos ─────────────────────────────────────────────────────────────

    private function equipo(string $tipo, string $prefijo, mixed $m, ?CatalogoPublicacion $pub): array
    {
        $id = "{$prefijo}-{$m->id}";
        $clave = "{$tipo}:{$m->id}";
        $apartado = $this->apartados[$clave] ?? null;

        $estado = match (true) {
            $m->estado === 'vendido'                 => 'sold',
            $m->estado !== 'disponible'              => 'unavailable',
            $apartado !== null                       => 'reserved',
            default                                  => 'available',
        };

        $atributos = match ($tipo) {
            'celular'        => ['capacity' => self::texto($m->capacidad), 'color' => self::texto($m->color), 'battery' => self::bateria($m->bateria)],
            'computadora'    => [
                'processor' => self::texto($m->procesador),
                'ram'       => self::texto($m->ram),
                'storage'   => self::texto($m->almacenamiento),
                'color'     => self::texto($m->color),
                'battery'   => self::bateria($m->bateria),
            ],
            'producto_apple' => ['capacity' => self::texto($m->capacidad), 'color' => self::texto($m->color), 'battery' => self::bateria($m->bateria)],
        };

        return $this->producto(
            id: $id,
            tipo: $tipo,
            clase: 'unit',
            nombre: self::texto($tipo === 'computadora' ? $m->nombre : $m->modelo),
            titulo: InventarioCatalogo::titulo($tipo, $m),
            condicion: $m->condicion,
            atributos: $atributos,
            disponibilidad: [
                'status'            => $estado,
                'quantity'          => $estado === 'available' ? 1 : 0,
                'reserved_quantity' => $estado === 'reserved' ? 1 : 0,
                'reason'            => $estado === 'reserved' ? $apartado : null,
            ],
            precio: $m->precio_venta,
            pub: $pub,
            creado: $m->created_at,
            actualizado: [$m->updated_at, $this->movimientos[$clave] ?? null],
        );
    }

    // ─── Accesorios ──────────────────────────────────────────────────────────

    /** Artículos de accesorios: unidades con el mismo nombre y precio, con cuántas quedan libres. */
    private function accesorios(array $publicaciones): Collection
    {
        $grupos = ProductoGeneral::query()
            ->selectRaw('LOWER(TRIM(nombre)) AS clave_nombre, precio_venta, MIN(nombre) AS nombre, MIN(tipo) AS tipo, MIN(condicion) AS condicion')
            ->selectRaw("SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) AS en_tienda, COUNT(*) AS total")
            ->selectRaw('MIN(created_at) AS creado, MAX(updated_at) AS actualizado')
            ->groupByRaw('LOWER(TRIM(nombre)), precio_venta')
            ->toBase()
            ->get()
            // En SQLite LOWER no baja las tildes: se vuelven a juntar con la clave de PHP
            ->groupBy(fn ($g) => self::idArticulo($g->clave_nombre, $g->precio_venta));

        // Unidades en tienda apartadas por una reserva o un pedido, por artículo; y su último movimiento
        $ids = collect(array_keys($this->apartados + $this->movimientos))
            ->filter(fn ($k) => str_starts_with($k, 'producto_general:'))
            ->map(fn ($k) => (int) substr($k, 17));
        $unidades = $ids->isEmpty() ? collect() : ProductoGeneral::query()->whereIn('id', $ids)->get(['id', 'nombre', 'precio_venta', 'estado']);
        $apartadas = [];
        $movidos = [];
        foreach ($unidades as $u) {
            $articulo = self::idArticulo($u->nombre, $u->precio_venta);
            if ($u->estado === 'disponible' && isset($this->apartados["producto_general:{$u->id}"])) {
                $apartadas[$articulo][] = $this->apartados["producto_general:{$u->id}"];
            }
            if ($mov = $this->movimientos["producto_general:{$u->id}"] ?? null) {
                $movidos[$articulo] = max($movidos[$articulo] ?? $mov, $mov);
            }
        }

        return $grupos->map(function (Collection $g, string $id) use ($publicaciones, $apartadas, $movidos) {
            $primero = $g->sortByDesc('total')->first();
            $enTienda = (int) $g->sum('en_tienda');
            $reservadas = min($enTienda, count($apartadas[$id] ?? []));
            $libres = $enTienda - $reservadas;

            $estado = match (true) {
                $libres > 0      => 'available',
                $reservadas > 0  => 'reserved',
                default          => 'sold_out',
            };

            return $this->producto(
                id: $id,
                tipo: 'producto_general',
                clase: 'article',
                nombre: self::texto($primero->nombre),
                titulo: InventarioCatalogo::titulo('producto_general', (object) ['nombre' => $primero->nombre]),
                condicion: $primero->condicion,
                atributos: [
                    'accessory_type' => $primero->tipo ? ['id' => $primero->tipo, 'name' => InventarioCatalogo::TIPO_GENERAL[$primero->tipo] ?? null] : null,
                ],
                disponibilidad: [
                    'status'            => $estado,
                    'quantity'          => $libres,
                    'reserved_quantity' => $reservadas,
                    'reason'            => $estado === 'reserved' ? (collect($apartadas[$id])->unique()->count() === 1 ? $apartadas[$id][0] : 'mixed') : null,
                ],
                precio: $primero->precio_venta,
                pub: $publicaciones["articulo:{$id}"] ?? null,
                creado: $g->min('creado'),
                actualizado: [$g->max('actualizado'), $movidos[$id] ?? null],
            );
        })->values();
    }

    // ─── Lo común ────────────────────────────────────────────────────────────

    private function producto(
        string $id, string $tipo, string $clase, ?string $nombre, string $titulo, ?string $condicion, array $atributos,
        array $disponibilidad, mixed $precio, ?CatalogoPublicacion $pub, mixed $creado, array $actualizado,
    ): array {
        $publicada = $pub !== null && $pub->getAttribute('publicada_ahora');
        $imagenes = $publicada ? $pub->imagenes->sortBy([['es_principal', 'desc'], ['orden', 'asc'], ['id', 'asc']])->values() : collect();
        $promo = $publicada && $pub->promocionActiva();

        $fechas = collect([...$actualizado, $pub?->updated_at, $imagenes->max('updated_at')])
            ->filter()->map(fn ($f) => Carbon::parse($f));
        $actualizadoEn = $fechas->max();

        $categoria = self::CATEGORIAS[$tipo];
        $condicion = self::texto($condicion);
        $monto = $precio !== null && $precio !== '' ? number_format((float) $precio, 2, '.', '') : null;

        $json = [
            'id'             => $id,
            'kind'           => $clase,
            'inventory_type' => $tipo,
            'name'           => $nombre,
            'display_name'   => $titulo !== '' ? $titulo : $nombre,
            'category'       => ['id' => $categoria, 'name' => InventarioCatalogo::GRUPOS[$tipo]['label']],
            'condition'      => ['value' => $condicion !== null ? (self::CONDICIONES[$condicion] ?? null) : null, 'label' => $condicion],
            'attributes'     => $atributos,
            'availability'   => $this->puede('integration.inventory.read') ? $disponibilidad + ['checked_at' => $this->momento] : null,
            'pricing'        => $this->puede('integration.pricing.read') ? [
                'currency'            => 'BOB',
                'amount'              => $monto,
                'price_type'          => 'list_price',
                'promotional_amount'  => $promo ? number_format((float) $pub->precio_promocional, 2, '.', '') : null,
                'promotion_starts_at' => $promo ? $pub->promocion_desde?->toIso8601String() : null,
                'promotion_ends_at'   => $promo ? $pub->promocion_hasta?->toIso8601String() : null,
            ] : null,
            'publication'    => [
                'status'     => $pub === null ? 'not_listed' : ($publicada ? 'published' : 'not_published'),
                'title'      => $publicada ? $pub->titulo : null,
                'slug'       => $publicada ? $pub->slug : null,
                'url'        => $publicada ? self::absoluta(route('store.product', $pub->slug, false)) : null,
                'summary'     => $publicada ? self::texto($pub->resumen) : null,
                'description' => $publicada ? self::texto($pub->descripcion) : null,
                'includes'    => $publicada ? self::texto($pub->que_incluye) : null,
                'warranty'   => $publicada ? self::texto($pub->garantia) : null,
                'attributes' => $publicada ? (object) $pub->atributosPublicos() : null,
                'updated_at' => $publicada ? $pub->updated_at?->toIso8601String() : null,
            ],
            'images'         => $this->puede('integration.media.read') ? $imagenes->map(fn (CatalogoImagen $img) => self::imagen($img, $pub))->all() : null,
            'source'         => [
                'system'       => self::SISTEMA,
                'source_type'  => 'internal_inventory',
                'record_id'    => $id,
                'retrieved_at' => $this->momento,
            ],
            'created_at'     => $creado ? Carbon::parse($creado)->toIso8601String() : null,
            'updated_at'     => $actualizadoEn?->toIso8601String(),
        ];

        return [
            'id'          => $id,
            'json'        => $json,
            'categoria'   => $categoria,
            'condicion'   => $json['condition']['value'],
            'estado'      => $disponibilidad['status'],
            // El que paga hoy quien compra: el de la promoción si está vigente (como en la tienda)
            'precio'      => $promo ? (float) $pub->precio_promocional : ($monto !== null ? (float) $monto : null),
            'actualizado' => $actualizadoEn,
            // Sin el nombre de la categoría: «iPhone» es la etiqueta de todos los celulares y un Realme saldría al buscar «iphone»
            'texto'       => Str::ascii(mb_strtolower(implode(' ', array_filter([
                $nombre, $titulo, $pub?->titulo, ...self::planos($atributos),
            ])))),
        ];
    }

    private function puede(string $scope): bool
    {
        return $this->integracion->tieneScope($scope);
    }

    /**
     * Publicaciones por "tipo:id" (equipos) y "articulo:<id>" (accesorios). Si dos apuntan a lo mismo, gana la visible
     * en la tienda y después la más nueva.
     */
    private function publicaciones(): array
    {
        $visibles = CatalogoPublicacion::query()->publicadoAhora()->pluck('id')->flip();
        $pubs = CatalogoPublicacion::with('imagenes')->orderBy('id')->get()
            ->each(fn ($p) => $p->setAttribute('publicada_ahora', $visibles->has($p->id)));
        CatalogoPublicacion::precargarInventario($pubs);

        $mapa = [];
        foreach ($pubs as $pub) {
            $clave = $pub->producto_tipo === 'producto_general'
                ? (($u = $pub->inventario()) ? 'articulo:' . self::idArticulo($u->nombre, $u->precio_venta) : null)
                : "{$pub->producto_tipo}:{$pub->producto_id}";
            if ($clave === null) {
                continue;
            }
            $actual = $mapa[$clave] ?? null;
            if ($actual === null || $pub->getAttribute('publicada_ahora') || ! $actual->getAttribute('publicada_ahora')) {
                $mapa[$clave] = $pub;
            }
        }

        return $mapa;
    }

    /** Reservas activas y pedidos que retienen stock, y el último movimiento de cada unidad en ellos. */
    private function cargarApartados(): void
    {
        foreach (ReservaItem::with('reserva:id,estado,updated_at')->get(['id', 'reserva_id', 'tipo', 'producto_id']) as $item) {
            $clave = "{$item->tipo}:{$item->producto_id}";
            if ($item->reserva?->estado === 'activa') {
                $this->apartados[$clave] = 'reservation';
            }
            $this->movido($clave, $item->reserva?->updated_at);
        }

        foreach (PedidoItem::with('pedido:id,estado,updated_at')->get(['id', 'pedido_id', 'tipo', 'producto_id']) as $item) {
            $clave = "{$item->tipo}:{$item->producto_id}";
            if (in_array($item->pedido?->estado, Pedido::RETIENEN_STOCK, true)) {
                $this->apartados[$clave] ??= 'pending_order';
            }
            $this->movido($clave, $item->pedido?->updated_at);
        }
    }

    private function movido(string $clave, mixed $fecha): void
    {
        if ($fecha) {
            $f = Carbon::parse($fecha);
            $this->movimientos[$clave] = max($this->movimientos[$clave] ?? $f, $f);
        }
    }

    private static function imagen(CatalogoImagen $img, CatalogoPublicacion $pub): array
    {
        $ruta = fn (?string $r) => $r ? self::absoluta('/storage/' . ltrim($r, '/')) : null;

        return [
            'id'         => 'imagen-' . $img->id,
            'url'        => $ruta($img->ruta_detail ?? $img->ruta_medium ?? $img->ruta_card),
            'sizes'      => [
                'thumb'  => $ruta($img->ruta_thumb),
                'card'   => $ruta($img->ruta_card),
                'medium' => $ruta($img->ruta_medium),
                'detail' => $ruta($img->ruta_detail),
            ],
            'alt'        => $img->alt ?: $pub->titulo,
            'is_primary' => (bool) $img->es_principal,
            'position'   => (int) $img->orden,
            'updated_at' => $img->updated_at?->toIso8601String(),
        ];
    }

    /** Batería tal como se cargó («86», «100 SELLADO», «149 CICLOS») y lo que dice ese texto. */
    private static function bateria(mixed $valor): ?array
    {
        $texto = self::texto($valor);
        if ($texto === null || $texto === '-') {
            return null;
        }
        $b = CatalogoPublicacion::bateriaDe($texto);

        return ['raw' => $texto, 'health_percent' => $b['salud'], 'cycles' => $b['ciclos'], 'sealed' => $b['sellado']];
    }

    private static function texto(mixed $v): ?string
    {
        $t = trim((string) $v);

        return $t === '' ? null : $t;
    }

    private static function planos(array $atributos): array
    {
        return collect($atributos)->flatten()->filter(fn ($v) => is_string($v))->all();
    }

    /** Direcciones absolutas con el dominio público (APP_URL), aunque el pedido llegue por otro lado. */
    public static function absoluta(string $ruta): string
    {
        return rtrim((string) config('app.url'), '/') . $ruta;
    }
}
