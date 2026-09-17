<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CatalogCollection;
use App\Models\CatalogoPublicacion;
use App\Models\HomeSection;
use App\Models\NavMenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Colecciones: las vitrinas que se arman a mano.
 *
 * Una categoría se llena sola (cada producto cae en la suya según el inventario del que sale); una colección la armas
 * tú para una campaña —«Ofertas de la semana», «Regreso a clases»— eligiendo qué publicaciones entran y en qué orden,
 * mezclando categorías si quieres.
 *
 * Dónde se ve cada colección: en su propia página (/coleccion/…), en un carrusel del inicio (Portada → «Colección de
 * productos») y en los menús, si le pones un enlace. En la tienda solo salen los productos que siguen a la venta.
 */
class CollectionController extends Controller
{
    /** Menús de la tienda (Tienda online → Menú). */
    private const MENUS = [
        'header' => 'Menú de arriba',
        'mobile' => 'Menú del celular',
        'footer' => 'Pie de página',
    ];

    /** Campos de texto libre: se guardan sin etiquetas HTML. */
    private const TEXTOS = ['name', 'description', 'meta_title', 'meta_description'];

    public function index(): Response
    {
        $contexto = $this->contexto();
        $filas    = $this->filas($contexto);
        $ids      = $filas->pluck('id')->flip();

        return Inertia::render('Admin/Collections/Index', [
            'colecciones' => $filas,
            'resumen'     => [
                'publicados' => $contexto['publicados']->count(),
                'en_venta'   => $contexto['disponibles']->count(),
            ],
            // Carruseles encendidos en la portada que no tienen colección elegida: hoy no muestran nada
            'sinColeccion' => $contexto['secciones']
                ->filter(fn (HomeSection $s) => $s->active && ! isset($ids[(int) (($s->settings['collection_id'] ?? 0))]))
                ->map(fn (HomeSection $s) => ['id' => $s->id, 'label' => $s->label])
                ->values()
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:120',
            'description' => 'nullable|string|max:500',
        ]);

        $collection = CatalogCollection::create([
            'name'        => strip_tags($validated['name']),
            'description' => strip_tags((string) ($validated['description'] ?? '')) ?: null,
            'slug'        => $this->slugLibre($validated['name']),
            'active'      => true,
            'sort_order'  => (int) CatalogCollection::max('sort_order') + 1,
        ]);

        return redirect()->route('admin.collections.edit', $collection)
            ->with('success', 'Colección creada. Ahora elige qué productos van adentro.');
    }

    public function edit(CatalogCollection $collection): Response
    {
        $contexto = $this->contexto();
        $enVenta  = $contexto['disponibles'];
        $elegidas = $collection->publicaciones()->get();

        // Lo elegido, en el orden de la colección: lo que sigue a la venta y lo que ya no
        $productos = $elegidas->map(fn (CatalogoPublicacion $p) => $this->producto($p, $contexto))->values();

        // Candidatos: todo lo publicado que no esté ya en la colección, lo disponible primero
        $yaEstan = $elegidas->pluck('id')->flip();
        $candidatos = $contexto['publicados']
            ->reject(fn (CatalogoPublicacion $p) => isset($yaEstan[$p->id]))
            ->map(fn (CatalogoPublicacion $p) => $this->producto($p, $contexto))
            ->sortByDesc(fn (array $p) => $p['disponible'] ? 1 : 0)
            ->values();

        return Inertia::render('Admin/Collections/Edit', [
            'collection' => [
                'id'               => $collection->id,
                'name'             => $collection->name,
                'slug'             => $collection->slug,
                'description'      => $collection->description,
                'meta_title'       => $collection->meta_title,
                'meta_description' => $collection->meta_description,
                'active'           => $collection->active,
                'url'              => $collection->urlPublica(),
            ],
            'productos'  => $productos,
            'candidatos' => $candidatos,
            'donde'      => $this->donde($collection, $contexto),
            'google'     => ['url' => url($collection->urlPublica()), 'sufijo' => CatalogCollection::SUFIJO_GOOGLE],
            'enVenta'    => $productos->where('disponible', true)->count(),
        ]);
    }

    public function update(Request $request, CatalogCollection $collection): RedirectResponse
    {
        // La dirección (slug) no se recibe: los enlaces compartidos y los del menú apuntan ahí
        $validated = $request->validate([
            'name'             => 'required|string|max:120',
            'description'      => 'nullable|string|max:500',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'active'           => 'boolean',
        ]);

        foreach (self::TEXTOS as $campo) {
            if (array_key_exists($campo, $validated)) {
                $validated[$campo] = strip_tags((string) $validated[$campo]) ?: null;
            }
        }

        $collection->update($validated);

        return back()->with('success', 'Colección guardada.');
    }

    /** El interruptor del listado: mostrarla o esconderla de la tienda. */
    public function visibilidad(Request $request, CatalogCollection $collection): RedirectResponse
    {
        $validated = $request->validate(['active' => 'required|boolean']);
        $collection->update($validated);

        return back()->with('success', $validated['active']
            ? "«{$collection->name}» se muestra en la tienda."
            : "«{$collection->name}» quedó oculta: su página y sus carruseles no se ven.");
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'orden'         => 'required|array',
            'orden.*.id'    => 'required|integer|exists:catalog_collections,id',
            'orden.*.orden' => 'required|integer|min:0',
        ]);

        foreach ($validated['orden'] as $fila) {
            CatalogCollection::where('id', $fila['id'])->update(['sort_order' => $fila['orden']]);
        }

        return back();
    }

    /** Guarda qué publicaciones entran y en qué orden (la posición en la lista manda). */
    public function syncPublicaciones(Request $request, CatalogCollection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => 'array',
            'ids.*' => 'integer|exists:catalogo_publicaciones,id',
        ]);

        $ids = collect($validated['ids'] ?? [])->unique()->values();

        $collection->publicaciones()->sync(
            $ids->mapWithKeys(fn ($id, $i) => [$id => ['sort_order' => $i]])->all()
        );

        return back()->with('success', $ids->isEmpty()
            ? 'La colección quedó vacía.'
            : $ids->count() . ' ' . ($ids->count() === 1 ? 'producto guardado' : 'productos guardados') . ' en la colección.');
    }

    /**
     * Borra la colección. Las publicaciones no se tocan: siguen en el catálogo y en su categoría.
     * Lo que llevaba a esta colección se apaga para no dejar enlaces rotos en la tienda.
     */
    public function destroy(CatalogCollection $collection): RedirectResponse
    {
        $nombre = $collection->name;
        $url    = $collection->urlPublica();

        $secciones = HomeSection::where('type', 'product_collection')->get()
            ->filter(fn (HomeSection $s) => (int) (($s->settings['collection_id'] ?? 0)) === $collection->id);
        foreach ($secciones as $seccion) {
            $ajustes = $seccion->settings ?? [];
            unset($ajustes['collection_id']);
            $seccion->update(['settings' => $ajustes, 'active' => false]);
        }

        $enlaces = NavMenuItem::where('url', $url)->where('active', true)->get();
        foreach ($enlaces as $enlace) {
            $enlace->update(['active' => false]);
        }

        $collection->delete();

        $avisos = [];
        if ($secciones->isNotEmpty()) {
            $avisos[] = $secciones->count() === 1
                ? 'Se apagó la sección de la portada que la mostraba.'
                : 'Se apagaron las ' . $secciones->count() . ' secciones de la portada que la mostraban.';
        }
        if ($enlaces->isNotEmpty()) {
            $avisos[] = $enlaces->count() === 1
                ? 'Se ocultó el enlace del menú que llevaba a ella.'
                : 'Se ocultaron los ' . $enlaces->count() . ' enlaces del menú que llevaban a ella.';
        }

        return redirect()->route('admin.collections.index')
            ->with('success', trim("Se borró «{$nombre}». Sus productos siguen en el catálogo. " . implode(' ', $avisos)));
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    /** Publicaciones, disponibilidad, secciones del inicio y enlaces de los menús, en pocas consultas. */
    private function contexto(): array
    {
        $publicados = CatalogoPublicacion::publicadoAhora()
            ->orderByDesc('id')
            ->get(['id', 'titulo', 'slug', 'categoria', 'condicion', 'producto_tipo', 'producto_id']);

        CatalogoPublicacion::precargarInventario($publicados);

        $disponibles = $publicados->filter(fn (CatalogoPublicacion $p) => $p->productoDisponible());

        return [
            'publicados'  => $publicados,
            'disponibles' => $disponibles,
            'enTienda'    => $publicados->pluck('id')->flip(),
            'enVenta'     => $disponibles->pluck('id')->flip(),
            'secciones'   => HomeSection::where('type', 'product_collection')->orderBy('orden')->get(),
            'menus'       => NavMenuItem::where('active', true)->get(),
        ];
    }

    /** @return Collection<int, array> */
    private function filas(array $contexto): Collection
    {
        return CatalogCollection::withCount('publicaciones')
            ->with('publicaciones:catalogo_publicaciones.id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (CatalogCollection $c) use ($contexto) {
                $enVenta = $c->publicaciones->filter(fn ($p) => isset($contexto['enVenta'][$p->id]))->count();

                return [
                    'id'          => $c->id,
                    'name'        => $c->name,
                    'slug'        => $c->slug,
                    'description' => $c->description,
                    'active'      => $c->active,
                    'url'         => $c->urlPublica(),
                    'total'       => $c->publicaciones_count,
                    'en_venta'    => $enVenta,
                    'vendidos'    => $c->publicaciones_count - $enVenta,
                    'donde'       => $this->donde($c, $contexto),
                ];
            })
            ->values();
    }

    /** Dónde se ve una colección: su página, el inicio y los menús. */
    private function donde(CatalogCollection $c, array $contexto): array
    {
        $secciones = $contexto['secciones']
            ->filter(fn (HomeSection $s) => (int) (($s->settings['collection_id'] ?? 0)) === $c->id)
            ->map(fn (HomeSection $s) => [
                'id'     => $s->id,
                'label'  => $s->label,
                'titulo' => $s->settings['titulo'] ?? null,
                'activa' => (bool) $s->active,
            ])
            ->values()
            ->all();

        $activos = $contexto['menus']->pluck('id')->flip();
        $url     = $c->urlPublica();
        $menus   = $contexto['menus']
            ->filter(fn (NavMenuItem $m) => ($m->parent_id === null || isset($activos[$m->parent_id]))
                && rtrim((string) parse_url((string) $m->url, PHP_URL_PATH), '/') === $url)
            ->groupBy('slot')
            ->map(fn (Collection $enlaces, string $slot) => [
                'slot'    => $slot,
                'label'   => self::MENUS[$slot] ?? $slot,
                'enlaces' => $enlaces->count(),
            ])
            ->sortBy(fn (array $m) => array_search($m['slot'], array_keys(self::MENUS), true))
            ->values()
            ->all();

        return ['inicio' => $secciones, 'menus' => $menus];
    }

    private function producto(CatalogoPublicacion $p, array $contexto): array
    {
        return [
            'id'         => $p->id,
            'titulo'     => $p->titulo,
            'categoria'  => $p->categoria,
            'condicion'  => $p->condicion,
            'disponible' => isset($contexto['enVenta'][$p->id]),
            'estado'     => isset($contexto['enVenta'][$p->id])
                ? 'A la venta'
                : (isset($contexto['enTienda'][$p->id]) ? 'Vendido o reservado' : 'Fuera de la tienda'),
            'url'        => route('store.product', $p->slug),
        ];
    }

    /** El nombre manda: la dirección se arma con él y no se vuelve a tocar. */
    private function slugLibre(string $nombre): string
    {
        $base = Str::slug($nombre) ?: 'coleccion';
        $slug = $base;
        $n    = 2;

        while (CatalogCollection::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $n++;
        }

        return $slug;
    }
}
