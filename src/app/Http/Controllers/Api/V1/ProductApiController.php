<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CatalogoPublicacion;
use App\Support\InventarioCatalogo;
use App\Support\ModelosCompatibles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * API pública de productos — v1
 *
 * REGLA: Frontend NUNCA es autoridad de precios. El precio sale siempre del inventario (backend).
 * NUNCA exponer: precio_costo, ganancia, IMEI (ni su estado), notas privadas,
 *               procedencia/proveedor, datos financieros internos, IDs sensibles.
 * El número de serie de celulares y computadoras sí va en el detalle (nunca un IMEI).
 */
class ProductApiController extends Controller
{
    /** Alias públicos de categoría → [categoría interna, palabra del título] */
    private const CATEGORIAS = [
        'iphone'          => ['celulares', null],
        'iphones'         => ['celulares', null],
        'celulares'       => ['celulares', null],
        'mac'             => ['computadoras', null],
        'computadoras'    => ['computadoras', null],
        'apple'           => ['productos-apple', null],
        'mas-apple'       => ['productos-apple', null],
        'productos-apple' => ['productos-apple', null],
        'ipad'            => ['productos-apple', 'ipad'],
        'watch'           => ['productos-apple', 'watch'],
        'apple-watch'     => ['productos-apple', 'watch'],
        'airpods'         => ['productos-apple', 'airpods'],
        'accesorios'      => ['accesorios', null],
        'fundas'          => ['fundas', null],
    ];

    private const CONDICIONES = ['Nuevo', 'Seminuevo', 'Open Box', 'Reacondicionado'];

    private const ORDENES = ['novedades', 'destacados', 'precio-menor', 'precio-mayor', 'nombre'];

    /**
     * GET /api/v1/products
     *
     * Filtros (todos opcionales y combinables):
     *   categoria   iphone | mac | apple | ipad | watch | airpods | accesorios | fundas
     *   modelo      iphone-14-pro-max | "iPhone 14 Pro Max" | "14 pro max"  → accesorios compatibles
     *   tipo        funda | vidrio templado | cargador …  (tipo de accesorio)
     *   marca       myskin | apple-boss
     *   condicion   Nuevo | Seminuevo | Open Box | Reacondicionado
     *   q           texto libre (todas las palabras deben aparecer)
     *   precio_min, precio_max   en Bs
     *   destacado   1
     *   disponible  1 (por defecto) | todos
     *   orden       novedades | destacados | precio-menor | precio-mayor | nombre
     *   per_page    1–100 (24) · page
     */
    public function index(Request $request): JsonResponse
    {
        $query = $this->baseQuery();
        $this->aplicarFiltros($query, $request);

        $rows = $this->conPrecios($query->get());

        if ($request->string('disponible')->lower()->toString() !== 'todos') {
            $rows = $rows->where('disponible', true);
        }
        if (($min = $request->float('precio_min')) > 0) {
            $rows = $rows->filter(fn ($r) => $r['precio_final'] !== null && $r['precio_final'] >= $min);
        }
        if (($max = $request->float('precio_max')) > 0) {
            $rows = $rows->filter(fn ($r) => $r['precio_final'] !== null && $r['precio_final'] <= $max);
        }

        $orden = in_array($o = $request->string('orden')->toString(), self::ORDENES, true) ? $o : 'novedades';
        $rows  = $this->ordenar($rows, $orden)->values();

        $perPage  = max(1, min(100, $request->integer('per_page', 24)));
        $total    = $rows->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page     = max(1, min($request->integer('page', 1), $lastPage));

        return response()->json([
            'data' => $rows->slice(($page - 1) * $perPage, $perPage)
                ->map(fn ($r) => $this->serialize($r['pub'], $r['precio'], $r['disponible']))
                ->values(),
            'meta' => [
                'current_page' => $page,
                'last_page'    => $lastPage,
                'per_page'     => $perPage,
                'total'        => $total,
                'orden'        => $orden,
            ],
        ]);
    }

    /**
     * GET /api/v1/filters
     * Opciones disponibles para armar filtros (con cuántos productos disponibles hay en cada una).
     */
    public function filters(): JsonResponse
    {
        $rows = $this->conPrecios($this->baseQuery()->get())->where('disponible', true)->values();
        $pubs = $rows->pluck('pub');

        $categorias = collect([
            'iphone'     => ['label' => 'iPhone',     'test' => fn ($p) => $p->categoria === 'celulares'],
            'mac'        => ['label' => 'Mac',        'test' => fn ($p) => $p->categoria === 'computadoras'],
            'apple'      => ['label' => 'Más Apple',  'test' => fn ($p) => $p->categoria === 'productos-apple'],
            'accesorios' => ['label' => 'Accesorios', 'test' => fn ($p) => $p->categoria === 'accesorios'],
            'fundas'     => ['label' => 'Fundas',     'test' => fn ($p) => $this->esFunda($p)],
        ])->map(fn ($c, $slug) => ['slug' => $slug, 'label' => $c['label'], 'total' => $pubs->filter($c['test'])->count()])
          ->values();

        $modelos = $pubs->flatMap(fn ($p) => $p->compatibilidades->pluck('target')->filter())
            ->groupBy('slug')
            ->map(fn ($g) => [
                'slug'    => $g->first()->slug,
                'nombre'  => $g->first()->name,
                'familia' => $g->first()->family,
                'total'   => $g->count(),
            ])
            ->sortBy('nombre', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        $precios = $rows->pluck('precio_final')->filter();

        return response()->json(['data' => [
            'categorias'  => $categorias,
            'modelos'     => $modelos,
            'tipos'       => $pubs->pluck('subcategoria')->filter()->countBy()->map(fn ($n, $t) => ['valor' => $t, 'total' => $n])->values(),
            'condiciones' => $pubs->pluck('condicion')->filter()->countBy()->map(fn ($n, $c) => ['valor' => $c, 'total' => $n])->values(),
            'marcas'      => $pubs->map(fn ($p) => $this->marca($p))->countBy()->map(fn ($n, $m) => ['valor' => $m, 'total' => $n])->values(),
            'precio'      => ['min' => $precios->min(), 'max' => $precios->max()],
            'ordenes'     => self::ORDENES,
            'total'       => $rows->count(),
        ]]);
    }

    /** GET /api/v1/products/{slug} */
    public function show(string $slug): JsonResponse
    {
        $pub = CatalogoPublicacion::with(['imagenes', 'compatibilidades.target'])
            ->publicadoAhora()
            ->where('slug', $slug)
            ->firstOrFail();

        $data = $this->serialize($pub, $pub->precioVigente(), $pub->productoDisponible());
        $data['descripcion']   = $pub->descripcion;
        $data['que_incluye']   = $pub->que_incluye;
        $data['observaciones'] = $pub->observaciones;
        $data['numero_serie']  = $pub->numeroSeriePublico(); // solo celulares y computadoras; nunca el IMEI
        $data['imagenes']      = $pub->imagenes->map(fn ($img) => [
            'url'          => $img->url,
            'alt'          => $img->alt_text ?? $pub->titulo,
            'es_principal' => $img->es_principal,
        ]);
        $data['compatibilidades'] = $data['modelos_compatibles'];
        $data['bateria'] = ($b = $pub->bateriaInventario()) ? [
            'salud'   => $data['atributos']['salud_bateria'] ?? null,
            'ciclos'  => $b['ciclos'],
            'sellado' => $b['sellado'],
        ] : null;

        return response()->json(['data' => $data]);
    }

    // ─── Internos ────────────────────────────────────────────────────────────

    private function baseQuery(): Builder
    {
        return CatalogoPublicacion::with(['imagenes', 'compatibilidades.target'])->publicadoAhora();
    }

    private function aplicarFiltros(Builder $query, Request $request): void
    {
        if ($marca = $request->string('marca')->lower()->replace([' ', '_'], '-')->toString()) {
            $query->where('storefront', $marca === 'myskin' ? CatalogoPublicacion::STOREFRONT_MYSKIN : CatalogoPublicacion::STOREFRONT_APPLE_BOSS);
        }

        if ($cat = $request->string('categoria')->lower()->trim()->toString()) {
            [$interna, $palabra] = self::CATEGORIAS[$cat] ?? [$cat, null];
            if ($interna === 'fundas') {
                // Todas las fundas: MYSKIN y las del inventario de accesorios (diseño, silicona, MagSafe…)
                $query->where(fn ($b) => $b->where('categoria', 'fundas')
                    ->orWhere('subcategoria', InventarioCatalogo::TIPO_GENERAL['funda']));
            } else {
                $query->where('categoria', $interna);
            }
            if ($palabra) {
                $query->whereRaw('LOWER(titulo) LIKE ?', ['%' . $palabra . '%']);
            }
        }

        if ($cond = $request->string('condicion')->trim()->toString()) {
            $valida = collect(self::CONDICIONES)->first(fn ($c) => mb_strtolower($c) === mb_strtolower($cond));
            $query->where('condicion', $valida ?? $cond);
        }

        if ($request->boolean('destacado')) {
            $query->where('destacado', true);
        }

        if ($tipo = $request->string('tipo')->lower()->replace('-', ' ')->trim()->limit(60, '')->toString()) {
            $query->whereRaw('LOWER(subcategoria) LIKE ?', ['%' . $this->escaparLike($tipo) . '%']);
        }

        if ($modelo = $request->string('modelo')->trim()->limit(60, '')->toString()) {
            $slugs = ModelosCompatibles::slugsDesdeTexto($modelo);
            $slugs
                ? $query->whereHas('compatibilidades.target', fn ($t) => $t->whereIn('slug', $slugs))
                : $query->whereRaw('1 = 0');
        }

        $palabras = preg_split('/\s+/', mb_strtolower($request->string('q')->trim()->limit(100, '')->toString()), -1, PREG_SPLIT_NO_EMPTY);
        foreach (array_slice($palabras, 0, 8) as $palabra) {
            $like = '%' . $this->escaparLike($palabra) . '%';
            $query->where(fn ($b) => $b->whereRaw('LOWER(titulo) LIKE ?', [$like])
                ->orWhereRaw('LOWER(subcategoria) LIKE ?', [$like])
                ->orWhereRaw('LOWER(resumen) LIKE ?', [$like]));
        }
    }

    /** Precio y disponibilidad desde el inventario, en lote. */
    private function conPrecios(Collection $pubs): Collection
    {
        CatalogoPublicacion::precargarInventario($pubs);

        return $pubs->map(function (CatalogoPublicacion $pub) {
            $precio = $pub->precioVigente();
            $promo  = $pub->promocionActiva() ? (float) $pub->precio_promocional : null;
            return [
                'pub'          => $pub,
                'precio'       => $precio,
                'precio_final' => $promo ?: $precio,
                'disponible'   => $pub->productoDisponible(),
            ];
        });
    }

    private function ordenar(Collection $rows, string $orden): Collection
    {
        $novedades = fn ($a, $b) => [$a['pub']->orden, -$a['pub']->id] <=> [$b['pub']->orden, -$b['pub']->id];

        return match ($orden) {
            'precio-menor' => $rows->sort(fn ($a, $b) => [$a['precio_final'] === null, $a['precio_final']] <=> [$b['precio_final'] === null, $b['precio_final']]),
            'precio-mayor' => $rows->sort(fn ($a, $b) => [$b['precio_final'] !== null, $b['precio_final']] <=> [$a['precio_final'] !== null, $a['precio_final']]),
            'nombre'       => $rows->sortBy(fn ($r) => $r['pub']->titulo, SORT_NATURAL | SORT_FLAG_CASE),
            'destacados'   => $rows->sort(fn ($a, $b) => [(int) $b['pub']->destacado] <=> [(int) $a['pub']->destacado] ?: $novedades($a, $b)),
            default        => $rows->sort($novedades),
        };
    }

    private function esFunda(CatalogoPublicacion $pub): bool
    {
        return $pub->categoria === 'fundas' || $pub->subcategoria === InventarioCatalogo::TIPO_GENERAL['funda'];
    }

    private function marca(CatalogoPublicacion $pub): string
    {
        return $pub->esMyskin() ? 'MYSKIN' : 'Apple Boss';
    }

    private function escaparLike(string $s): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $s);
    }

    private function serialize(CatalogoPublicacion $pub, ?float $price, bool $available): array
    {
        $imagenPrincipal = $pub->imagenes->firstWhere('es_principal', true)
            ?? $pub->imagenes->first();

        return [
            'id'                  => $pub->id,
            'slug'                => $pub->slug,
            'titulo'              => $pub->titulo,
            'subtitulo'           => $pub->subtitulo,
            'resumen'             => $pub->resumen,
            'condicion'           => $pub->condicion,
            'categoria'           => $pub->categoria,
            'subcategoria'        => $pub->subcategoria,
            'tipo'                => $pub->subcategoria,
            'marca'               => $this->marca($pub),
            'es_funda'            => $this->esFunda($pub),
            'modelos_compatibles' => $pub->compatibilidades->pluck('target')->filter()->map(fn ($t) => [
                'nombre' => $t->name,
                'slug'   => $t->slug,
            ])->values(),
            'tags'                => $pub->tags ?? [],
            'atributos'           => $pub->atributosPublicos(),
            'garantia'            => $pub->garantia,
            'badge'               => $pub->badge,
            'destacado'           => $pub->destacado,
            'precio'              => $price,
            'precio_promocional'  => $pub->promocionActiva() ? $pub->precio_promocional : null,
            'moneda'              => 'BOB',
            'disponible'          => $available,
            'url'                 => route('store.product', $pub->slug),
            'imagen_principal'    => $imagenPrincipal ? [
                'url' => $imagenPrincipal->url,
                'alt' => $imagenPrincipal->alt_text ?? $pub->titulo,
            ] : null,
            'seo_title'           => $pub->seo_title,
            'seo_description'     => $pub->seo_description,
        ];
    }
}
