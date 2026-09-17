<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CatalogCategory;
use App\Models\CatalogoPublicacion;
use App\Models\HomeSection;
use App\Models\NavMenuItem;
use App\Support\InventarioCatalogo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Categorías: los estantes de la tienda.
 *
 * Al publicar, cada producto cae solo en su categoría según el inventario del que sale; por eso las categorías no se
 * crean ni se borran y su dirección no cambia. Acá se eligen el nombre, la descripción, el orden, si se muestran en el
 * catálogo y en el inicio, la portada de su página y cómo aparece en Google. Los menús y los carruseles del inicio se
 * arman en «Menú» y en «Portada»: esta pantalla solo dice en cuáles figura cada una.
 */
class CatalogCategoryController extends Controller
{
    /** Nombre de cada inventario en el menú del panel. */
    private const INVENTARIOS = [
        'celular'          => 'Celulares',
        'computadora'      => 'Computadoras',
        'producto_apple'   => 'Productos Apple',
        'producto_general' => 'Productos generales',
    ];

    /** Menús de la tienda (Tienda online → Menú). */
    private const MENUS = [
        'header' => 'Menú de arriba',
        'mobile' => 'Menú del celular',
        'footer' => 'Pie de página',
    ];

    /** Campos de texto libre: se guardan sin etiquetas HTML. */
    private const TEXTOS = ['name', 'description', 'meta_title', 'meta_description', 'hero_titulo', 'hero_descripcion', 'hero_cta_label', 'hero_cta_url'];

    public function index(): Response
    {
        $contexto = $this->contexto();

        return Inertia::render('Admin/Categories/Index', [
            'categorias'   => $this->filas($contexto),
            'resumen'      => [
                'en_tienda'    => $contexto['disponibles']->count(),
                'por_publicar' => collect($contexto['pendientes'])->sum(fn (array $items) => count($items)),
            ],
            'bloqueInicio' => $contexto['bloque_inicio'],
        ]);
    }

    public function edit(CatalogCategory $category): Response
    {
        $contexto = $this->contexto();

        return Inertia::render('Admin/Categories/Edit', [
            'category'     => $category->only([
                'id', 'name', 'slug', 'description', 'active', 'show_home', 'is_myskin',
                'meta_title', 'meta_description', 'hero_titulo', 'hero_descripcion', 'hero_cta_label', 'hero_cta_url',
            ]),
            // Todas: la fila de esta (qué tiene, dónde figura) y las demás para la vista previa del inicio
            'categorias'   => $this->filas($contexto),
            'google'       => ['url' => url($category->urlCatalogo()), 'sufijo' => CatalogCategory::SUFIJO_GOOGLE],
            'bloqueInicio' => $contexto['bloque_inicio'],
            // Destinos extra del botón de la portada: las colecciones activas
            'colecciones'  => \App\Models\CatalogCollection::paraEnlaces(),
        ]);
    }

    public function update(Request $request, CatalogCategory $category): RedirectResponse
    {
        // La dirección (slug) no se recibe: agrupa las publicaciones de la categoría y cambiarla las dejaría fuera
        $validated = $request->validate([
            'name'             => 'required|string|max:100',
            'description'      => 'nullable|string|max:500',
            'active'           => 'boolean',
            'show_home'        => 'boolean',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'hero_titulo'      => 'nullable|string|max:255',
            'hero_descripcion' => 'nullable|string|max:500',
            'hero_cta_label'   => 'nullable|required_with:hero_cta_url|string|max:60',
            'hero_cta_url'     => 'nullable|required_with:hero_cta_label|string|max:255',
        ], [
            'name.required'                => 'Escribe el nombre de la categoría.',
            'hero_cta_label.required_with' => 'Escribe el texto del botón, o quita a dónde lleva.',
            'hero_cta_url.required_with'   => 'Elige a dónde lleva el botón, o borra su texto.',
        ]);

        foreach (self::TEXTOS as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = trim(strip_tags((string) $validated[$campo])) ?: null;
            }
        }

        if (empty($validated['name'])) {
            throw ValidationException::withMessages(['name' => 'Escribe el nombre de la categoría.']);
        }
        // El botón de la portada no puede ejecutar código
        if (! empty($validated['hero_cta_url']) && preg_match('/^\s*(javascript|data|vbscript):/i', $validated['hero_cta_url'])) {
            throw ValidationException::withMessages(['hero_cta_url' => 'Ese destino no está permitido: elige una página de la tienda o una dirección web.']);
        }

        $category->update($validated);

        return back()->with('success', "Categoría «{$category->name}» guardada.");
    }

    /** Mostrar u ocultar la categoría en el catálogo o en el inicio, desde el listado. */
    public function visibilidad(Request $request, CatalogCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'active'    => 'sometimes|boolean',
            'show_home' => 'sometimes|boolean',
        ]);

        $category->update($validated);

        $mensaje = match (true) {
            array_key_exists('show_home', $validated) => $category->show_home
                ? "Listo: «{$category->name}» va en el inicio."
                : "Listo: «{$category->name}» ya no va en el inicio.",
            array_key_exists('active', $validated) => $category->active
                ? "Listo: «{$category->name}» vuelve a la tienda."
                : "Listo: «{$category->name}» quedó oculta. Sus productos siguen a la venta en «Todo el catálogo».",
            default => null,
        };

        return $mensaje ? back()->with('success', $mensaje) : back();
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'orden'         => 'required|array',
            'orden.*.id'    => 'required|integer|exists:catalog_categories,id',
            'orden.*.orden' => 'required|integer|min:0',
        ]);

        foreach ($validated['orden'] as $fila) {
            CatalogCategory::where('id', $fila['id'])->update(['sort_order' => $fila['orden']]);
        }

        return back()->with('success', 'Orden guardado.');
    }

    // ─── Datos de cada categoría ────────────────────────────────────────────────

    /** Lo que comparten todas las filas: productos a la venta, pendientes del inventario, menús y secciones del inicio. */
    private function contexto(): array
    {
        $publicadas = CatalogoPublicacion::with('modeloReferencia:id,familia')->publicadoAhora()->get();
        CatalogoPublicacion::precargarInventario($publicadas);

        return [
            'disponibles'   => $publicadas->filter(fn (CatalogoPublicacion $p) => $p->productoDisponible())->values(),
            'pendientes'    => InventarioCatalogo::pendientes(),
            'menus'         => NavMenuItem::where('active', true)->get(['id', 'slot', 'parent_id', 'url']),
            'secciones'     => HomeSection::whereIn('type', ['category_products', 'myskin'])->orderBy('orden')->get(),
            'visibles'      => HomeSection::visible()->pluck('id')->flip(),
            // El bloque «¿Qué estás buscando?» (Portada): sin él, «En el inicio» no muestra nada
            'bloque_inicio' => HomeSection::visible()->where('type', 'category_rail')->exists(),
        ];
    }

    private function filas(array $contexto): array
    {
        return CatalogCategory::whereNull('parent_id')->orderBy('sort_order')->orderBy('id')->get()
            ->map(fn (CatalogCategory $c) => $this->fila($c, $contexto))
            ->values()
            ->all();
    }

    private function fila(CatalogCategory $c, array $ctx): array
    {
        $tipo = $c->tipoInventario();
        $productos = $ctx['disponibles']->filter(fn (CatalogoPublicacion $p) => $c->is_myskin ? $p->esMyskin() : $p->categoria === $c->slug);
        // Las fundas MYSKIN se marcan al publicarlas: antes no se sabe cuáles serán, así que no cuentan pendientes
        $pendientes = $tipo && ! $c->is_myskin ? collect($ctx['pendientes'][$tipo] ?? []) : null;

        return [
            'id'           => $c->id,
            'name'         => $c->name,
            'slug'         => $c->slug,
            'description'  => $c->description,
            'active'       => $c->active,
            'show_home'    => $c->show_home,
            'is_myskin'    => $c->is_myskin,
            'url'          => $c->urlCatalogo(),
            'url_inicio'   => $c->urlInicio(),
            'inventario'   => $tipo ? ['tipo' => $tipo, 'nombre' => self::INVENTARIOS[$tipo]] : null,
            'en_tienda'    => $productos->count(),
            'por_publicar' => $pendientes?->count(),
            'menu'         => $this->enMenus($c, $ctx['menus']),
            'carrusel'     => $this->carrusel($c, $ctx),
            'tipos'        => $c->slug === 'accesorios' ? $this->tiposAccesorio($productos, $pendientes ?? collect()) : null,
        ];
    }

    /** En qué menús figura: enlaces a su página propia (/iphone, /mac, /myskin) o a su página del catálogo. */
    private function enMenus(CatalogCategory $c, Collection $menus): array
    {
        $hub = CatalogCategory::HUBS[$c->slug] ?? null;
        $apunta = function (string $url) use ($c, $hub): bool {
            $partes = parse_url($url) ?: [];
            $ruta = rtrim($partes['path'] ?? '', '/') ?: '/';
            parse_str($partes['query'] ?? '', $query);

            return ($hub && $ruta === $hub) || ($ruta === '/catalogo' && ($query['categoria'] ?? null) === $c->slug);
        };
        // Un enlace dentro de otro que está apagado no se ve
        $activos = $menus->pluck('id')->flip();

        return $menus
            ->filter(fn (NavMenuItem $m) => ($m->parent_id === null || isset($activos[$m->parent_id])) && $apunta((string) $m->url))
            ->groupBy('slot')
            ->map(fn (Collection $enlaces, string $slot) => [
                'slot'    => $slot,
                'label'   => self::MENUS[$slot] ?? $slot,
                'enlaces' => $enlaces->count(),
            ])
            ->sortBy(fn (array $m) => array_search($m['slot'], array_keys(self::MENUS), true))
            ->values()
            ->all();
    }

    /** Su carrusel de productos en el inicio (se arma en «Portada»). Fundas MYSKIN tiene su propia sección. */
    private function carrusel(CatalogCategory $c, array $ctx): ?array
    {
        $seccion = $ctx['secciones']->first(fn (HomeSection $s) => $c->is_myskin
            ? $s->type === 'myskin'
            : $s->type === 'category_products' && ($s->settings['categoria'] ?? null) === $c->slug);

        return $seccion ? [
            'titulo' => ($seccion->settings['titulo'] ?? null) ?: $seccion->label,
            'activo' => isset($ctx['visibles'][$seccion->id]),
        ] : null;
    }

    /** Accesorios por tipo (la familia de su ficha): lo que está a la venta y lo que falta publicar. */
    private function tiposAccesorio(Collection $productos, Collection $pendientes): array
    {
        $enTienda = $productos->countBy(fn (CatalogoPublicacion $p) => $p->modeloReferencia?->familia ?? 'sin_ficha');
        $porPublicar = $pendientes->countBy(fn (array $item) => $item['familia'] ?? 'sin_ficha');

        return collect(CatalogCategory::TIPOS_ACCESORIO + ['sin_ficha' => 'Sin ficha'])
            ->map(fn (string $label, string $key) => [
                'key'          => $key,
                'label'        => $label,
                'en_tienda'    => $enTienda[$key] ?? 0,
                'por_publicar' => $porPublicar[$key] ?? 0,
            ])
            ->reject(fn (array $t) => $t['key'] === 'sin_ficha' && $t['en_tienda'] + $t['por_publicar'] === 0)
            ->values()
            ->all();
    }
}
