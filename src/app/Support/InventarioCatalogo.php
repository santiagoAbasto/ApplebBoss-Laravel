<?php

namespace App\Support;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ModeloReferencia;
use App\Models\ProductoApple;
use App\Models\ProductoGeneral;
use App\Support\FichaTecnica\ContenidoAccesorio;
use App\Support\FichaTecnica\ContenidoProductoApple;
use App\Support\FichaTecnica\TextosComputadora;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Lleva productos del inventario a la tienda pública.
 *
 * - Equipos (iPhone, Mac, otros Apple): una publicación por unidad (cada equipo es distinto).
 * - Accesorios: una publicación por artículo (mismo nombre + mismo precio); se muestra
 *   mientras quede al menos una unidad disponible. Toman la ficha y la descripción de su tipo en la base de
 *   accesorios (el cargador de 20 W de Apple, la funda de silicona…), que se reconoce por el nombre.
 * - La condición NUNCA se inventa: es la que se eligió en el inventario o la elige la persona que publica.
 * - Nunca se copia IMEI, número de serie, procedencia ni costo.
 */
class InventarioCatalogo
{
    public const GRUPOS = [
        'celular'          => ['label' => 'iPhone',     'categoria' => 'celulares'],
        'computadora'      => ['label' => 'Mac',        'categoria' => 'computadoras'],
        'producto_apple'   => ['label' => 'Más Apple',  'categoria' => 'productos-apple'],
        'producto_general' => ['label' => 'Accesorios', 'categoria' => 'accesorios'],
    ];

    public const TIPO_GENERAL = [
        'funda'           => 'Funda',
        'cargador_20w'    => 'Cargador 20 W',
        'cargador_5w'     => 'Cargador 5 W',
        'vidrio_templado' => 'Vidrio templado',
        'vidrio_camara'   => 'Protector de cámara',
        'accesorio'       => 'Accesorio',
        'otro'            => 'Accesorio',
    ];

    // Palabras con escritura propia (marcas y unidades)
    private const PALABRAS = [
        'iphone' => 'iPhone', 'ipad' => 'iPad', 'imac' => 'iMac', 'macbook' => 'MacBook', 'airpods' => 'AirPods',
        'airtag' => 'AirTag', 'iwatch' => 'Apple Watch', 'magsafe' => 'MagSafe', 'pro' => 'Pro', 'max' => 'Max',
        'mini' => 'mini', 'plus' => 'Plus', 'air' => 'Air', 'se' => 'SE', 'gb' => 'GB', 'tb' => 'TB', 'mm' => 'mm',
        'lte' => 'LTE', 'gps' => 'GPS', 'usb' => 'USB', 'usb-c' => 'USB-C', 'de' => 'de', 'para' => 'para',
        'con' => 'con', 'y' => 'y', 'ip' => 'iPhone', 'm1' => 'M1', 'm2' => 'M2', 'm3' => 'M3', 'm4' => 'M4',
        'icore' => 'Intel Core', 'i3' => 'i3', 'i5' => 'i5', 'i7' => 'i7', 'i9' => 'i9', 'ram' => 'RAM',
        'k&f' => 'K&F', 'coolite' => 'COOLiTE', '5g' => '5G', 'm5' => 'M5', 'a16' => 'A16', 'a17' => 'A17',
    ];

    public static function claseInventario(string $tipo): ?string
    {
        return match ($tipo) {
            'celular'          => Celular::class,
            'computadora'      => Computadora::class,
            'producto_apple'   => ProductoApple::class,
            'producto_general' => ProductoGeneral::class,
            default            => null,
        };
    }

    public static function modelo(string $tipo, int $id): mixed
    {
        $class = self::claseInventario($tipo);
        return $class ? $class::find($id) : null;
    }

    /** Tipo de inventario ("celular", "computadora"…) de un producto. */
    public static function tipoDe(mixed $modelo): ?string
    {
        return match (true) {
            $modelo instanceof Celular         => 'celular',
            $modelo instanceof Computadora     => 'computadora',
            $modelo instanceof ProductoApple   => 'producto_apple',
            $modelo instanceof ProductoGeneral => 'producto_general',
            default                            => null,
        };
    }

    /** Productos disponibles en inventario que todavía no están en la tienda, agrupados por tipo. */
    public static function pendientes(): array
    {
        $publicados = CatalogoPublicacion::query()
            ->get(['producto_tipo', 'producto_id'])
            ->groupBy('producto_tipo')
            ->map(fn ($g) => $g->pluck('producto_id')->flip());

        $out = [];
        foreach (['celular', 'computadora', 'producto_apple'] as $tipo) {
            $ya = $publicados[$tipo] ?? collect();
            // Cada producto Apple dice con qué ficha de la base de productos Apple se va a publicar
            $fichasApple = $tipo === 'producto_apple' ? ModeloReferencia::delTipo('producto_apple') : null;
            $out[$tipo] = self::claseInventario($tipo)::where('estado', 'disponible')
                ->orderBy('id')
                ->get()
                ->reject(fn ($m) => $ya->has($m->id))
                ->map(fn ($m) => self::item($tipo, $m, 1, $fichasApple))
                ->values()
                ->all();
        }

        // Cada accesorio dice con qué ficha de la base de accesorios se va a publicar
        $fichas = ModeloReferencia::delTipo('producto_general');
        $articulosPublicados = self::articulosPublicados();
        $out['producto_general'] = ProductoGeneral::where('estado', 'disponible')
            ->orderBy('id')
            ->get(['id', 'nombre', 'tipo', 'precio_venta', 'condicion'])
            ->groupBy(fn ($u) => CatalogoPublicacion::claveArticulo($u->nombre, $u->precio_venta))
            ->reject(fn ($unidades, $clave) => isset($articulosPublicados[$clave]))
            ->map(fn ($unidades) => self::item('producto_general', $unidades->first(), $unidades->count(), $fichas))
            ->sortBy('titulo', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();

        return $out;
    }

    public static function contarPendientes(): int
    {
        return collect(self::pendientes())->sum(fn ($items) => count($items));
    }

    /** Claves (nombre|precio) de los accesorios que ya tienen publicación. */
    public static function articulosPublicados(): array
    {
        $ids = CatalogoPublicacion::where('producto_tipo', 'producto_general')->pluck('producto_id');
        if ($ids->isEmpty()) return [];

        return ProductoGeneral::whereIn('id', $ids)->get(['nombre', 'precio_venta'])
            ->mapWithKeys(fn ($u) => [CatalogoPublicacion::claveArticulo($u->nombre, $u->precio_venta) => true])
            ->all();
    }

    /**
     * Crea la publicación con los datos del inventario. La condición es la del inventario si ya la tiene;
     * si no, la que se elige al publicar. Sin condición, queda como borrador.
     */
    public static function crear(
        string $tipo,
        mixed $m,
        ?string $condicion,
        bool $publicar,
        string $storefront = CatalogoPublicacion::STOREFRONT_APPLE_BOSS,
    ): CatalogoPublicacion {
        $condicion = CondicionInventario::de($m) ?? $condicion;
        $esMyskin  = $storefront === CatalogoPublicacion::STOREFRONT_MYSKIN;

        // Ficha del modelo (iPhone X, XR…) si está en la base; lo del equipo real (capacidad, color, batería) manda.
        // Un accesorio toma la de su tipo (cargador de 20 W de Apple, funda de silicona…) y su descripción.
        $modeloRef = in_array($tipo, ['celular', 'computadora', 'producto_apple', 'producto_general'], true)
            ? ModeloReferencia::deInventario($tipo, $m)
            : null;
        $titulo = self::titulo($tipo, $m, $modeloRef);
        // Un producto Apple toma también su descripción; lo que trae la caja, solo si es Nuevo
        $contenido = match (true) {
            ! $modeloRef                  => [],
            $tipo === 'producto_general'  => ContenidoAccesorio::paraPublicacion($modeloRef, $m->nombre),
            $tipo === 'producto_apple'    => array_filter(ContenidoProductoApple::paraPublicacion($modeloRef, $condicion), fn ($v) => $v !== null),
            default                       => [],
        };

        $pub = CatalogoPublicacion::create([
            'producto_tipo' => $tipo,
            'producto_id'   => $m->id,
            'storefront'    => $esMyskin ? CatalogoPublicacion::STOREFRONT_MYSKIN : CatalogoPublicacion::STOREFRONT_APPLE_BOSS,
            'titulo'        => $titulo,
            'slug'          => self::slugUnico($titulo),
            'resumen'       => $contenido['resumen'] ?? self::resumen($tipo, $m),
            'descripcion'   => $contenido['descripcion'] ?? null,
            'que_incluye'   => $contenido['que_incluye'] ?? null,
            'categoria'     => $esMyskin ? 'fundas' : self::GRUPOS[$tipo]['categoria'],
            'subcategoria'  => $tipo === 'producto_general' ? self::subcategoria($m, $modeloRef) : null,
            'condicion'     => $condicion,
            'atributos'     => array_merge($modeloRef?->fichaParaPublicacion() ?? [], self::atributos($tipo, $m, $modeloRef)),
            'modelo_referencia_id' => $modeloRef?->id,
            'publicado'     => $publicar && $condicion !== null,
            'destacado'     => false,
            'orden'         => 0,
        ]);

        // Fundas, vidrios, etc.: se vinculan solos a los modelos de iPhone que figuran en el nombre
        if ($tipo === 'producto_general') {
            ModelosCompatibles::sincronizar($pub, $m->nombre);
        }

        return $pub;
    }

    // ─── Textos ──────────────────────────────────────────────────────────────

    /** Con la ficha de un producto Apple, el color va con su nombre oficial («BLUE» → «Azul»). */
    public static function titulo(string $tipo, mixed $m, ?ModeloReferencia $modelo = null): string
    {
        $partes = match ($tipo) {
            'celular'          => [$m->modelo, $m->capacidad, $m->color],
            'computadora'      => [$m->nombre, $m->procesador, self::almacenamiento($m->almacenamiento), $m->color],
            'producto_apple'   => [$m->modelo, self::valor($m->capacidad), $modelo?->colorDelEquipo($m->color ?? null) ?? $m->color],
            'producto_general' => [$m->nombre],
            default            => ['Producto'],
        };

        return Str::limit(self::bonito(implode(' ', array_filter($partes, fn ($p) => self::util($p)))), 250, '');
    }

    public static function resumen(string $tipo, mixed $m): string
    {
        $bateria = self::bateria($m->bateria ?? null);

        $partes = match ($tipo) {
            'celular'          => [self::bonito($m->modelo), $m->capacidad, self::bonito($m->color), $bateria ? "Batería al {$bateria}%" : null],
            'computadora'      => [
                self::bonito($m->procesador ?? ''),
                is_numeric($m->ram) ? "{$m->ram} GB de RAM" : self::valor($m->ram),
                self::almacenamiento($m->almacenamiento),
                self::bonito($m->color ?? ''),
                $bateria ? "Batería al {$bateria}%" : (preg_match('/(\d+)\s*ciclos/i', (string) $m->bateria, $c) ? "{$c[1]} ciclos de batería" : null),
            ],
            'producto_apple'   => [self::bonito($m->modelo), self::valor($m->capacidad), self::bonito($m->color ?? ''), $bateria && $bateria < 100 ? "Batería al {$bateria}%" : null],
            'producto_general' => [self::TIPO_GENERAL[$m->tipo] ?? 'Accesorio', self::bonito($m->nombre)],
            default            => [],
        };

        $texto = implode(' · ', array_filter($partes, fn ($p) => self::util($p)));
        return $texto !== '' ? $texto : self::titulo($tipo, $m);
    }

    /**
     * Solo datos públicos. Nunca IMEI, serie, procedencia ni costo. Con el modelo de una computadora, el chip y el color
     * van con su nombre oficial y la memoria dice de qué tipo es («16 GB de memoria unificada»). En un accesorio, el tipo
     * lo da su ficha (un cable cargado como «cargador 20 W» no es un cargador) y «Compatible con», su nombre.
     */
    public static function atributos(string $tipo, mixed $m, ?ModeloReferencia $modelo = null): array
    {
        $bateria = self::bateria($m->bateria ?? null);
        $ram = ModeloReferencia::gb($m->ram ?? null);
        $disco = ModeloReferencia::gb($m->almacenamiento ?? null);

        $attrs = match ($tipo) {
            'celular'          => ['capacidad' => $m->capacidad, 'color' => self::bonito($m->color), 'salud_bateria' => $bateria],
            'computadora'      => [
                'chip'           => $modelo?->chipDelEquipo($m->procesador ?? null) ?? self::bonito($m->procesador ?? ''),
                'ram'            => $ram ? ($modelo ? TextosComputadora::memoria($ram, $modelo->datos) : "{$ram} GB") : null,
                'almacenamiento' => self::conTipoDeDisco(
                    $disco ? ($disco >= 1024 && $disco % 1024 === 0 ? ($disco / 1024) . ' TB' : "{$disco} GB") : self::almacenamiento($m->almacenamiento),
                    $modelo,
                ),
                'color'          => $modelo?->colorDelEquipo($m->color ?? null) ?? self::bonito($m->color ?? ''),
            ],
            'producto_apple'   => [
                // Solo si es almacenamiento: «4 VENTILADORES» en un ventilador no es una capacidad
                'capacidad' => self::util($m->capacidad) && preg_match('/\d+\s*(gb|tb)\b/i', (string) $m->capacidad) ? $m->capacidad : null,
                'color'     => $modelo?->colorDelEquipo($m->color ?? null) ?? self::bonito($m->color ?? ''),
            ],
            'producto_general' => [
                'tipo'              => $modelo ? null : (self::TIPO_GENERAL[$m->tipo] ?? 'Accesorio'),
                'modelo_compatible' => ModelosCompatibles::nombres($m->nombre ?? null),
            ],
            default            => [],
        };

        return array_filter($attrs, fn ($v) => self::util($v));
    }

    /** En una PC con ficha, el disco de fábrica: «512 GB (SSD NVMe M.2 2242 PCIe 4.0, QLC)». Las Mac no lo detallan. */
    private static function conTipoDeDisco(?string $texto, ?ModeloReferencia $modelo): ?string
    {
        $ssd = $modelo?->datos['rendimiento']['ssd'] ?? null;

        return $texto && $ssd ? "{$texto} ({$ssd})" : $texto;
    }

    /** La categoría de un accesorio en la tienda: la de su ficha («Cable», «Vidrio templado») o la de su tipo en el inventario. */
    private static function subcategoria(mixed $m, ?ModeloReferencia $modelo): ?string
    {
        return $modelo?->datos['sistema']['categoria'] ?? (self::TIPO_GENERAL[$m->tipo] ?? null);
    }

    /** "IPHONE 13 PRO MAX 128GB AZUL" → "iPhone 13 Pro Max 128 GB Azul" */
    public static function bonito(?string $texto): string
    {
        $texto = trim(preg_replace('/\s+/', ' ', (string) $texto));
        if ($texto === '') return '';

        $texto = preg_replace('/(\d+)\s*(gb|tb)\b/i', '$1 $2', $texto);
        $texto = preg_replace('/(\d+)\s*w\b/i', '$1 W', $texto);
        $texto = preg_replace('/(\d+)\s*mm\b/i', '$1 mm', $texto);

        $palabras = array_map(function ($w) {
            $lower = mb_strtolower($w);
            if (isset(self::PALABRAS[$lower])) return self::PALABRAS[$lower];
            if (preg_match('/^\d/', $w)) return $lower === $w ? $w : mb_strtolower($w); // 13, 7ma, 2019
            return mb_strtoupper(mb_substr($lower, 0, 1)) . mb_substr($lower, 1);
        }, explode(' ', $texto));

        $out = implode(' ', $palabras);
        return preg_replace('/\b(\d+) (GB|TB|W|mm)\b/', '$1 $2', $out);
    }

    private static function item(string $tipo, mixed $m, int $unidades = 1, ?Collection $fichas = null): array
    {
        // Con qué ficha de la base de accesorios o de productos Apple se va a publicar (null: sin ficha, sale solo con el nombre)
        $ficha = match (true) {
            ! $fichas                    => null,
            $tipo === 'producto_general' => ModeloReferencia::detectarAccesorio($fichas, $m->nombre),
            $tipo === 'producto_apple'   => ModeloReferencia::detectarProductoApple($fichas, $m),
            default                      => null,
        };

        return [
            'key'      => "{$tipo}:{$m->id}",
            'tipo'     => $tipo,
            'titulo'   => self::titulo($tipo, $m),
            'detalle'  => self::resumen($tipo, $m),
            'precio'   => (float) $m->precio_venta,
            'unidades' => $unidades,
            'es_funda' => $tipo === 'producto_general' && $m->tipo === 'funda',
            'condicion' => CondicionInventario::de($m),
            'ficha'    => $ficha?->nombre,
            'familia'  => $ficha?->familia, // tipo de accesorio (cargador, vidrio…): Categorías → Accesorios
        ];
    }

    private static function slugUnico(string $titulo): string
    {
        $base = Str::slug($titulo) ?: 'producto';
        $slug = Str::limit($base, 200, '');
        while (CatalogoPublicacion::where('slug', $slug)->exists()) {
            $slug = Str::limit($base, 200, '') . '-' . Str::lower(Str::random(4));
        }
        return $slug;
    }

    private static function almacenamiento(mixed $valor): ?string
    {
        if (! self::util($valor)) return null;
        return is_numeric(trim((string) $valor)) ? trim((string) $valor) . ' GB' : self::bonito((string) $valor);
    }

    private static function bateria(mixed $valor): ?int
    {
        return CatalogoPublicacion::bateriaDe($valor)['salud'];
    }

    private static function util(mixed $valor): bool
    {
        $v = trim((string) $valor);
        return $v !== '' && $v !== '-' && $v !== '0';
    }

    /** El valor limpio si sirve para mostrar ("-" o vacío → null). */
    private static function valor(mixed $valor): ?string
    {
        return self::util($valor) ? trim((string) $valor) : null;
    }
}
