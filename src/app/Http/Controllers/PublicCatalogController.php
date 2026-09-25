<?php

namespace App\Http\Controllers;

use App\Models\CatalogoPublicacion;
use App\Models\CatalogCategory;
use App\Models\CatalogCollection;
use App\Models\Faq;
use App\Models\HomeSection;
use App\Models\Novedad;
use App\Models\ModeloReferencia;
use App\Models\StoreLocation;
use App\Models\StoreService;
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
        $available = $this->publicaciones()->where('available', true);

        // Secciones del Home desde CMS (solo activas y en vigencia).
        // Las secciones de productos traen su propio listado ya filtrado por el backend.
        $secciones   = HomeSection::visible()->get();
        $colecciones = $this->coleccionesDeSecciones($secciones);

        $sections = $secciones->map(function (HomeSection $s) use ($available, $colecciones) {
            $settings = $s->settings ?? [];
            $limit    = HomeSection::limite($s->type, $settings['limit'] ?? null);
            // «Colección de productos»: la vitrina armada a mano en Tienda online → Colecciones
            $coleccion = $s->type === 'product_collection'
                ? $colecciones->get((int) ($settings['collection_id'] ?? 0))
                : null;

            // Cada sección de productos trae su propio listado, con la regla que comparte con el panel
            $products = in_array($s->type, HomeSection::TIPOS_CON_PRODUCTOS, true)
                ? HomeSection::filtrar($s->type, $settings, $available, $coleccion?->publicaciones->pluck('id'))->take($limit)->values()
                : null;

            return [
                'id'        => $s->id,
                'type'      => $s->type,
                'label'     => $s->label,
                'settings'  => $settings,
                'products'  => $products,
                'coleccion' => $coleccion ? ['nombre' => $coleccion->name, 'url' => $coleccion->urlPublica()] : null,
            ];
        })->values();

        // Los productos que van pasando en la parte grande de arriba
        $featured = $available->sortByDesc('id')->take(8)->values();

        // FAQs — solo si la sección faq está activa
        $hasFaqSection = $sections->contains('type', 'faq');
        $faqs = $hasFaqSection
            ? Faq::deLugar('general')
            : [];

        // Servicios — solo si la sección está encendida. Las tarjetas y su botón salen de Tienda online → Servicios
        $hasServicesSection = $sections->contains('type', 'services');
        $services = $hasServicesSection
            ? StoreService::paraLaTienda()
            : [];

        // Locales — todos los encendidos, en el orden de Tienda online → Ubicaciones. Se mandan aunque la sección esté
        // apagada: también son los datos del negocio que lee Google.
        $locations = StoreLocation::paraLaTienda();

        // Novedades — solo si la sección está encendida: las más nuevas de Tienda online → Novedades
        $seccionNovedades = $secciones->firstWhere('type', 'news');
        $novedades = $seccionNovedades
            ? Novedad::paraLaTienda(HomeSection::limite('news', $seccionNovedades->settings['limit'] ?? null))
            : [];

        // Reseñas — solo si la sección está encendida, y solo las aprobadas en Tienda online → Reseñas
        $conResenas = $sections->contains('type', 'reviews');
        $resenas = $conResenas ? \App\Models\Resena::paraLaTienda() : [];

        return Inertia::render('Store/Home', [
            'sections'       => $sections,
            'featured'       => $featured,
            // Los accesos del inicio cuentan solo lo que está a la venta («3 disponibles»)
            'categories'     => $this->categoriasInicio($available),
            'totalAvailable' => $available->count(),
            'faqs'           => $faqs,
            'services'       => $services,
            'locations'      => $locations,
            'novedades'      => $novedades,
            'resenas'        => $resenas,
            'resenasResumen' => $conResenas && $resenas !== [] ? \App\Models\Resena::resumenPublico() : null,
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
        $modelo    = is_string($request->query('modelo')) ? trim($request->query('modelo')) : '';
        // Tipo de accesorio (cargador, vidrio…): los chips de la portada de Accesorios
        $tipo      = is_string($request->query('tipo')) && isset(CatalogCategory::TIPOS_ACCESORIO[$request->query('tipo')]) ? $request->query('tipo') : '';

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
            ->when($priceMax > 0,                                       fn (Collection $items) => $items->where('price', '<=', $priceMax))
            ->when($modelo !== '',                                      fn (Collection $items) => $items->where('modelo_slug', $modelo))
            ->when($tipo !== '',                                        fn (Collection $items) => $items->where('tipo_accesorio', $tipo));

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

        // La página de una categoría muestra su portada y usa su título y su descripción en Google (Categorías del panel)
        $categoria = $category !== 'todos' ? CatalogCategory::active()->where('slug', $category)->first() : null;
        if ($categoria) {
            app(\App\Support\Seo::class)->context([
                'titulo'          => $categoria->name,
                'seo_title'       => $categoria->tituloGoogle(),
                'seo_description' => $categoria->descripcionGoogle(),
                'canonical'       => $categoria->urlCatalogo(),
            ]);
        }

        return Inertia::render('Store/Catalog', [
            'products'   => $products->values()->slice(($page - 1) * $perPage, $perPage)->values(),
            'categories' => $this->categoriasCatalogo($all, $category),
            'categoria'  => $categoria ? $this->portada($categoria, $all) : null,
            'filters'    => [
                ...compact('query', 'category', 'sort', 'condition', 'priceMin', 'priceMax'),
                'modelo'       => $modelo ?: null,
                'modeloNombre' => $modelo !== '' ? ModeloReferencia::where('slug', $modelo)->value('nombre') : null,
                'tipo'         => $tipo ?: null,
            ],
            'pagination' => ['current' => $page, 'last' => $lastPage, 'total' => $total],
        ]);
    }

    /**
     * La página de una colección: la vitrina que se arma a mano en Tienda online → Colecciones.
     * Muestra solo lo que sigue a la venta, en el orden que eligió el administrador.
     */
    public function coleccion(CatalogCollection $collection): Response
    {
        abort_unless($collection->active, 404);

        $disponibles = $this->publicaciones()->where('available', true);
        $productos   = $this->productosDeColeccion($collection, $disponibles, 200);

        app(\App\Support\Seo::class)->context([
            'titulo'          => $collection->name,
            'seo_title'       => $collection->tituloGoogle(),
            'seo_description' => $collection->descripcionGoogle(),
            'canonical'       => $collection->urlPublica(),
        ]);

        return Inertia::render('Store/Coleccion', [
            'coleccion' => [
                'nombre'      => $collection->name,
                'descripcion' => $collection->description,
                'url'         => $collection->urlPublica(),
            ],
            'productos' => $productos,
        ]);
    }

    public function compare(Request $request): Response
    {
        $slugsParam = (string) $request->string('slugs');
        $slugs = collect(explode(',', $slugsParam))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->unique()
            ->take(3)
            ->values();

        $products = collect();
        if ($slugs->isNotEmpty()) {
            $pubs = CatalogoPublicacion::with('imagenes')
                ->publicadoAhora()
                ->whereIn('slug', $slugs->all())
                ->get();

            // Preserve order from the slugs param
            foreach ($slugs as $slug) {
                $pub = $pubs->firstWhere('slug', $slug);
                if (!$pub) continue;
                $price     = $pub->precioVigente();
                $available = $pub->productoDisponible();
                $item      = $this->serialize($pub, $price, $available);
                $item['garantia']  = $pub->garantia;
                $item['atributos'] = $pub->atributosPublicos();
                $products->push($item);
            }
        }

        return Inertia::render('Store/Compare', [
            'products' => $products->values(),
        ]);
    }

    public function show(string $slug): Response
    {
        $pub = CatalogoPublicacion::with(['imagenes', 'compatibilidades.target'])
            ->publicadoAhora()
            ->where('slug', $slug)
            ->firstOrFail();

        $price     = $pub->precioVigente();
        $available = $pub->productoDisponible();
        $product   = $this->serialize($pub, $price, $available);

        // Campos extra solo para PDP — no se incluyen en listados por peso
        $product['subtitulo']       = $pub->subtitulo;
        $product['description']     = $pub->descripcion;
        $product['que_incluye']     = $pub->que_incluye;
        $product['observaciones']   = $pub->observaciones;
        $product['promo_price']     = $pub->promocionActiva() ? $pub->precio_promocional : null;
        $product['promo_badge']     = $pub->badge;
        $product['battery']         = $product['atributos']['salud_bateria'] ?? null; // del inventario, o cargada a mano
        $product['numero_serie']    = $pub->numeroSeriePublico(); // celulares y computadoras; nunca el IMEI
        $product['comparar_modelo'] = $this->compararModelo($pub);

        // SEO: el SEO propio de la publicación manda; si no, plantilla "Producto" del admin
        $principal = collect($product['images'])->firstWhere('es_principal', true) ?? ($product['images'][0] ?? null);
        app(\App\Support\Seo::class)->context([
            'titulo'          => $pub->titulo,
            'seo_title'       => $pub->seo_title,
            'seo_description' => $pub->seo_description,
            'descripcion'     => trim(($pub->resumen ? rtrim($pub->resumen, '. ') . '. ' : '') . 'Disponible en Apple Boss, Cochabamba.'),
            'imagen'          => $principal['url_card'] ?? null,
        ]);
        // Agrupar por family del target para el PDP
        $product['compatibilidades'] = $pub->compatibilidades
            ->filter(fn ($c) => $c->target !== null)
            ->groupBy(fn ($c) => $c->target->family)
            ->map(fn ($items) => $items->map(fn ($c) => [
                'id'   => $c->target->id,
                'name' => $c->target->name,
                'slug' => $c->target->slug,
            ])->values()->toArray())
            ->toArray();

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

        $faqs = Faq::deLugar('producto');

        return Inertia::render('Store/Product', compact('product', 'related', 'crossSell', 'faqs'));
    }

    // ─── API: sincronización del carrito ────────────────────────────────────────
    // Recibe [{key: "celular:123", quantity: 1}]
    // Devuelve datos vigentes del servidor. Frontend NO es autoridad de precios.
    public function syncCart(Request $request): JsonResponse
    {
        // Blindaje de entrada: como cada ítem dispara una consulta, se limita el tamaño del carrito
        // y se ignora cualquier ítem con forma inesperada (un bot no puede pedir miles de consultas
        // ni tumbar el endpoint mandando basura).
        $entrada = $request->input('items', []);
        $items = is_array($entrada) ? collect($entrada)->take(50) : collect();

        if ($items->isEmpty()) {
            return response()->json(['items' => []]);
        }

        $result = $items->map(function ($item) {
            if (! is_array($item)) return null;

            $key = is_string($item['key'] ?? null) ? $item['key'] : '';
            [$tipo, $id] = array_pad(explode(':', $key, 2), 2, null);

            if (! $tipo || ! ctype_digit((string) $id)) return null;

            $pub = CatalogoPublicacion::with('imagenes')
                ->publicadoAhora()
                ->where('producto_tipo', $tipo)
                ->where('producto_id', (int) $id)
                ->first();

            if (! $pub) return null; // publicación eliminada o despublicada

            $available = $pub->productoDisponible();

            if (! $available) return null; // vendido o reservado: quitar del carrito

            return [
                'key'       => $key,
                'quantity'  => 1, // stock unitario
                'name'      => $pub->titulo,
                // El precio lo pone el servidor: el rebajado si la promoción está vigente, si no el del inventario
                'price'     => $pub->precioPublico(),
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
        // Del modelo: el slug (filtro por modelo del catálogo) y, en los accesorios, la forma de su ilustración y su tipo
        // (la familia de su ficha: cargador, vidrio…), que filtra la portada de Accesorios
        $pubs = CatalogoPublicacion::with(['imagenes', 'modeloReferencia:id,slug,tipo,familia,datos'])
            ->publicadoAhora()
            ->orderByDesc('destacado')
            ->orderBy('orden')
            ->orderByDesc('id')
            ->get();

        // Inventario, reservas y stock de accesorios en pocas consultas (no una por producto)
        CatalogoPublicacion::precargarInventario($pubs);

        return $pubs
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
            // Precio rebajado vigente (se carga en la publicación): la tarjeta lo muestra tachando el anterior
            'promo_price'    => $pub->promocionActiva() && $pub->precio_promocional ? (float) $pub->precio_promocional : null,
            'category'       => $pub->categoria,
            'category_label' => $this->categoryLabel($pub),
            // Un producto de otra marca cargado en «Productos Apple» muestra su marca, no la categoría «Apple»
            'marca'          => $pub->producto_tipo === 'producto_apple' && $pub->modeloReferencia?->familia === 'otra_marca'
                ? ($pub->atributos['fabricante'] ?? $pub->modeloReferencia->datos['ficha']['fabricante'] ?? null)
                : null,
            'specs'          => $this->buildSpecs($pub),
            'summary'        => $pub->resumen,
            'condition'      => $pub->condicion,  // explícito, nunca inferido
            'garantia'       => $pub->garantia,
            'is_myskin'      => $pub->esMyskin(),
            'is_featured'    => $pub->destacado,
            'available'      => $available,
            'images'         => $this->serializeImagenes($pub),
            'modelo_slug'    => $pub->modeloReferencia?->slug,   // filtro del catálogo por modelo
            'atributos'      => $pub->atributosPublicos(),
            // Accesorio sin foto: la ilustración de su tipo (cargador, vidrio, funda…)
            'visual'         => in_array($pub->producto_tipo, ['producto_general', 'producto_apple'], true) ? $pub->modeloReferencia?->visual() : null,
            // Tipo de accesorio (Categorías → Accesorios): la familia de su ficha; sin ficha, «otros accesorios»
            'tipo_accesorio' => $pub->producto_tipo === 'producto_general' ? ($pub->modeloReferencia?->familia ?? 'accesorio') : null,
            // NUNCA incluir: precio_costo, imei, serial, procedencia, ganancia
        ];
    }

    /**
     * Enlace a la comparativa del modelo de la publicación, si su familia tiene comparador. Un accesorio se compara con
     * los que la comparativa muestra al entrar (el cargador certificado, con el original de 20 W y el de 40 W).
     */
    private function compararModelo(CatalogoPublicacion $pub): ?array
    {
        $modelo = $pub->modeloReferencia;
        $familia = $modelo ? ComparadorModelosController::familiaDe($modelo) : null;
        if ($familia === null) {
            return null;
        }

        $config = ComparadorModelosController::FAMILIAS[$familia];
        $modelos = collect([$modelo->slug, ...($config['inicio'] ?? [])])->unique()->take(ComparadorModelosController::MAXIMO);

        return [
            'nombre' => $modelo->nombre,
            'url'    => route('store.compare.modelos', ['familia' => $familia, 'modelos' => $modelos->implode(',')]),
            'titulo' => $config['invitacion']['titulo'] ?? '¿Dudas entre modelos?',
            'texto'  => $config['invitacion']['texto'] ?? "Compara el {$modelo->nombre} con otros modelos, lado a lado.",
            'boton'  => isset($config['invitacion']) ? "Comparar {$config['nombre']}" : 'Comparar modelos',
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

    /** Accesos del bloque «¿Qué estás buscando?» del inicio: las categorías activas marcadas para el inicio. */
    private function categoriasInicio(Collection $disponibles): array
    {
        return $this->conConteo($this->categoriasBase(CatalogCategory::forHome()->get()), $disponibles);
    }

    /**
     * Filtro «Categoría» del catálogo: todas las activas con productos a la venta (y la elegida aunque no tenga), estén
     * o no en el inicio. Así Accesorios aparece aunque se saque del inicio.
     */
    private function categoriasCatalogo(Collection $disponibles, string $elegida): array
    {
        $categorias = $this->conConteo($this->categoriasBase(CatalogCategory::active()->orderBy('sort_order')->get()), $disponibles);

        return array_values(array_filter($categorias, fn (array $c) => $c['count'] > 0 || $c['slug'] === $elegida));
    }

    /** Sin categorías en la base (instalación nueva), las de siempre. Si existen y están apagadas, se respeta. */
    private function categoriasBase(Collection $categorias): Collection
    {
        if ($categorias->isNotEmpty() || CatalogCategory::query()->exists()) {
            return $categorias;
        }

        return collect([
            ['slug' => 'celulares',       'name' => 'iPhone',        'description' => 'Equipos revisados y disponibles.',           'is_myskin' => false],
            ['slug' => 'computadoras',    'name' => 'Mac',           'description' => 'Potencia para crear y trabajar.',            'is_myskin' => false],
            ['slug' => 'productos-apple', 'name' => 'Apple',         'description' => 'iPad, Watch, AirPods y más.',                'is_myskin' => false],
            ['slug' => 'fundas',          'name' => 'Fundas MYSKIN', 'description' => 'Protección con identidad propia.',           'is_myskin' => true],
            ['slug' => 'accesorios',      'name' => 'Accesorios',    'description' => 'Cargadores, vidrios, fundas, cables y más.', 'is_myskin' => false],
        ])->map(fn (array $datos) => new CatalogCategory($datos));
    }

    private function conConteo(Collection $categorias, Collection $disponibles): array
    {
        return $categorias->map(fn (CatalogCategory $cat) => [
            'slug'        => $cat->slug,
            'name'        => $cat->name,
            'description' => $cat->description,
            'myskin'      => $cat->is_myskin,
            'url'         => $cat->urlInicio(),
            'count'       => $cat->is_myskin
                ? $disponibles->where('is_myskin', true)->count()
                : $disponibles->where('category', $cat->slug)->count(),
        ])->values()->all();
    }

    /** Portada de la página de una categoría (título, texto y botón) y, en Accesorios, sus tipos para filtrar. */
    private function portada(CatalogCategory $cat, Collection $disponibles): array
    {
        $productos = $cat->is_myskin ? $disponibles->where('is_myskin', true) : $disponibles->where('category', $cat->slug);
        $tipos = $cat->slug !== 'accesorios' ? [] : collect(CatalogCategory::TIPOS_ACCESORIO)
            ->map(fn (string $label, string $key) => ['key' => $key, 'label' => $label, 'count' => $productos->where('tipo_accesorio', $key)->count()])
            ->filter(fn (array $t) => $t['count'] > 0)
            ->values()
            ->all();

        return [
            'slug'        => $cat->slug,
            'nombre'      => $cat->name,
            'titulo'      => $cat->hero_titulo ?: $cat->name,
            'descripcion' => $cat->hero_descripcion ?: $cat->description,
            'cta'         => $cat->hero_cta_label && $cat->hero_cta_url ? ['label' => $cat->hero_cta_label, 'url' => $cat->hero_cta_url] : null,
            'tipos'       => $tipos,
        ];
    }

    /** Las colecciones que usan las secciones «Colección de productos» del inicio, en una sola consulta. */
    private function coleccionesDeSecciones(Collection $secciones): Collection
    {
        $ids = $secciones
            ->where('type', 'product_collection')
            ->map(fn (HomeSection $s) => (int) (($s->settings['collection_id'] ?? 0)))
            ->filter()
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        return CatalogCollection::active()
            ->with('publicaciones:catalogo_publicaciones.id')
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    /** Los productos de una colección, en el orden elegido y solo los que siguen a la venta. */
    private function productosDeColeccion(?CatalogCollection $coleccion, Collection $disponibles, int $limite): Collection
    {
        if (! $coleccion) {
            return collect();
        }

        return HomeSection::filtrar('product_collection', [], $disponibles, $coleccion->publicaciones->pluck('id'))
            ->take($limite)
            ->values();
    }
}
