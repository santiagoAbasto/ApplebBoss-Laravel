<?php

namespace App\Http\Controllers;

use App\Models\CatalogoPublicacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicCatalogController extends Controller
{
    // ─── Páginas públicas ─────────────────────────────────────────────────────

    public function home(): Response
    {
        $all        = $this->publicaciones();
        $featured   = $all->where('available', true)->sortByDesc('id')->take(8)->values();
        $seminuevos = $all->where('condition', 'Seminuevo')->where('available', true)->sortByDesc('id')->take(4)->values();
        $myskin     = $all->where('is_myskin', true)->where('available', true)->sortByDesc('id')->take(4)->values();

        return Inertia::render('Store/Home', [
            'featured'       => $featured,
            'seminuevos'     => $seminuevos,
            'myskin'         => $myskin,
            'categories'     => $this->categorias($all),
            'totalAvailable' => $all->where('available', true)->count(),
        ]);
    }

    public function index(Request $request): Response
    {
        $query     = Str::lower(trim((string) $request->string('q')));
        $category  = (string) $request->string('categoria', 'todos');
        $sort      = (string) $request->string('orden', 'novedades');
        $condition = (string) $request->string('condicion', 'todos');
        $priceMin  = $request->integer('precio_min', 0);
        $priceMax  = $request->integer('precio_max', 0);

        // Solo publicaciones con producto disponible (no vendido/reservado)
        $all = $this->publicaciones()->where('available', true);

        $products = $all
            ->when($query, fn (Collection $items) => $items->filter(
                fn ($p) => Str::contains(
                    Str::lower(implode(' ', array_filter([$p['name'], $p['category_label'], ...$p['specs']]))),
                    $query
                )
            ))
            ->when($category === 'fundas',                              fn (Collection $items) => $items->where('is_myskin', true))
            ->when($category !== 'todos' && $category !== 'fundas',    fn (Collection $items) => $items->where('category', $category))
            ->when($condition !== 'todos',                              fn (Collection $items) => $items->where('condition', $condition))
            ->when($priceMin > 0,                                       fn (Collection $items) => $items->where('price', '>=', $priceMin))
            ->when($priceMax > 0,                                       fn (Collection $items) => $items->where('price', '<=', $priceMax));

        $products = match ($sort) {
            'precio-menor' => $products->sortBy('price'),
            'precio-mayor' => $products->sortByDesc('price'),
            'nombre'       => $products->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE),
            default        => $products->sortByDesc('orden'),
        };

        $page     = max(1, $request->integer('page', 1));
        $perPage  = 24;
        $total    = $products->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page     = min($page, $lastPage);

        return Inertia::render('Store/Catalog', [
            'products'   => $products->values()->slice(($page - 1) * $perPage, $perPage)->values(),
            'categories' => $this->categorias($all),
            'filters'    => compact('query', 'category', 'sort', 'condition', 'priceMin', 'priceMax'),
            'pagination' => ['current' => $page, 'last' => $lastPage, 'total' => $total],
        ]);
    }

    public function show(string $slug): Response
    {
        $pub = CatalogoPublicacion::with('imagenes')
            ->publicadoAhora()
            ->where('slug', $slug)
            ->firstOrFail();

        $price     = $pub->precioVigente();
        $available = $pub->productoDisponible();
        $product   = $this->serialize($pub, $price, $available);

        // Campos extra solo para PDP — no se incluyen en listados por peso
        $product['subtitulo']    = $pub->subtitulo;
        $product['description']  = $pub->descripcion;
        $product['que_incluye']  = $pub->que_incluye;
        $product['observaciones'] = $pub->observaciones;
        $product['promo_price']  = $pub->promocionActiva() ? $pub->precio_promocional : null;
        $product['promo_badge']  = $pub->badge;
        $product['battery']      = ($pub->atributos['salud_bateria'] ?? null)
                                    ?: ($pub->atributos['bateria'] ?? null);

        // Relacionados de la misma categoría
        $related = $this->publicaciones()
            ->where('category', $product['category'])
            ->reject(fn ($item) => $item['slug'] === $slug)
            ->take(4)
            ->values();

        // Cross-sell MYSKIN: si es iPhone/celular, mostrar fundas
        $crossSell = collect();
        if ($product['category'] === 'celulares') {
            $crossSell = $this->publicaciones()
                ->where('is_myskin', true)
                ->where('available', true)
                ->take(3)
                ->values();
        }

        return Inertia::render('Store/Product', compact('product', 'related', 'crossSell'));
    }

    // ─── API: sincronización del carrito ────────────────────────────────────────
    // Recibe [{key: "celular:123", quantity: 1}]
    // Devuelve datos vigentes del servidor. Frontend NO es autoridad de precios.
    public function syncCart(Request $request): JsonResponse
    {
        $items = collect($request->input('items', []));

        if ($items->isEmpty()) {
            return response()->json(['items' => []]);
        }

        $result = $items->map(function (array $item) {
            $key = $item['key'] ?? '';
            [$tipo, $id] = array_pad(explode(':', $key, 2), 2, null);

            if (! $tipo || ! $id) return null;

            $pub = CatalogoPublicacion::with('imagenes')
                ->publicadoAhora()
                ->where('producto_tipo', $tipo)
                ->where('producto_id', (int) $id)
                ->first();

            if (! $pub) return null; // publicación eliminada o despublicada

            $price     = $pub->precioVigente();
            $available = $pub->productoDisponible();

            if (! $available) return null; // vendido o reservado: quitar del carrito

            return [
                'key'       => $key,
                'quantity'  => 1, // stock unitario
                'name'      => $pub->titulo,
                'price'     => (float) $price,
                'type'      => $pub->producto_tipo,
                'condition' => $pub->condicion,
                'is_myskin' => $pub->esMyskin(),
                'images'    => $this->serializeImagenes($pub),
                'url'       => route('store.product', $pub->slug),
                'available' => true,
            ];
        })->filter()->values();

        return response()->json(['items' => $result]);
    }

    // ─── Colección unificada de publicaciones activas ──────────────────────────
    // Solo datos seguros para frontend público.
    // NUNCA incluir: precio_costo, ganancia, imei, serial, procedencia interna
    private function publicaciones(): Collection
    {
        return CatalogoPublicacion::with('imagenes')
            ->publicadoAhora()
            ->orderByDesc('destacado')
            ->orderBy('orden')
            ->orderByDesc('id')
            ->get()
            ->map(function (CatalogoPublicacion $pub) {
                $price     = $pub->precioVigente();
                $available = $pub->productoDisponible();
                return $this->serialize($pub, $price, $available);
            });
    }

    private function serialize(CatalogoPublicacion $pub, ?float $price, bool $available): array
    {
        return [
            'key'            => "{$pub->producto_tipo}:{$pub->producto_id}",
            'id'             => $pub->id,
            'product_id'     => $pub->producto_id,
            'type'           => $pub->producto_tipo,
            'name'           => $pub->titulo,
            'slug'           => $pub->slug,
            'url'            => route('store.product', $pub->slug),
            'price'          => (float) ($price ?? 0),
            'category'       => $pub->categoria,
            'category_label' => $this->categoryLabel($pub),
            'specs'          => $this->buildSpecs($pub),
            'summary'        => $pub->resumen,
            'condition'      => $pub->condicion,  // explícito, nunca inferido
            'garantia'       => $pub->garantia,
            'is_myskin'      => $pub->esMyskin(),
            'is_featured'    => $pub->destacado,
            'available'      => $available,
            'images'         => $this->serializeImagenes($pub),
            'atributos'      => $pub->atributos ?? [],
            // NUNCA incluir: precio_costo, imei, serial, procedencia, ganancia
        ];
    }

    private function serializeImagenes(CatalogoPublicacion $pub): array
    {
        return $pub->imagenes->map(fn ($img) => [
            'id'           => $img->id,
            'url_thumb'    => $img->urlThumb(),
            'url_card'     => $img->urlCard(),
            'url_medium'   => $img->urlMedium(),
            'url_detail'   => $img->urlDetail(),
            'alt'          => $img->alt ?: $pub->titulo,
            'es_principal' => $img->es_principal,
            'orden'        => $img->orden,
        ])->toArray();
    }

    private function categoryLabel(CatalogoPublicacion $pub): string
    {
        if ($pub->esMyskin()) return 'MYSKIN';
        return match ($pub->categoria) {
            'celulares'       => 'iPhone',
            'computadoras'    => 'Mac',
            'productos-apple' => 'Apple',
            default           => ucfirst($pub->subcategoria ?? $pub->categoria),
        };
    }

    private function buildSpecs(CatalogoPublicacion $pub): array
    {
        $atributos = $pub->atributos ?? [];
        $specs = [];
        foreach (['capacidad', 'color', 'ram', 'almacenamiento', 'chip', 'material', 'modelo_compatible'] as $campo) {
            if (! empty($atributos[$campo])) $specs[] = $atributos[$campo];
        }
        return array_slice($specs, 0, 4);
    }

    private function categorias(Collection $publicaciones): array
    {
        return collect([
            ['slug' => 'celulares',       'name' => 'iPhone',        'description' => 'Equipos revisados y disponibles.'],
            ['slug' => 'computadoras',    'name' => 'Mac',           'description' => 'Potencia para crear y trabajar.'],
            ['slug' => 'productos-apple', 'name' => 'Apple',         'description' => 'iPad, Watch, AirPods y más.'],
            ['slug' => 'fundas',          'name' => 'Fundas MYSKIN',  'description' => 'Protección con identidad propia.', 'myskin' => true],
            ['slug' => 'accesorios',      'name' => 'Accesorios',    'description' => 'Cargadores, cables y más.'],
        ])->map(fn ($cat) => [
            ...$cat,
            'count' => $cat['slug'] === 'fundas'
                ? $publicaciones->where('is_myskin', true)->count()
                : $publicaciones->where('category', $cat['slug'])->count(),
        ])->all();
    }
}
