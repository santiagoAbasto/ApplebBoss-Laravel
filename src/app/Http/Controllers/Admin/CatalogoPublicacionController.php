<?php

namespace App\Http\Controllers\Admin;

use App\Support\InventarioCatalogo;
use App\Http\Controllers\Controller;
use App\Models\CatalogoCompatibilidad;
use App\Models\CatalogoImagen;
use App\Models\CatalogoPublicacion;
use App\Models\CompatibilityTarget;
use App\Models\ModeloReferencia;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoApple;
use App\Models\ProductoGeneral;
use App\Services\ImagenProductoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use App\Support\FichaTecnica\ContenidoAccesorio;
use App\Support\FichaTecnica\ContenidoProductoApple;

class CatalogoPublicacionController extends Controller
{
    /** Tipo del accesorio en el inventario → familia de su ficha: qué campos muestra el editor si no tiene ficha vinculada. */
    private const FAMILIA_ACCESORIO = [
        'funda' => 'funda', 'vidrio_templado' => 'vidrio', 'vidrio_camara' => 'protector',
        'cargador_20w' => 'cargador', 'cargador_5w' => 'cargador', 'accesorio' => 'accesorio', 'otro' => 'accesorio',
    ];

    private const NO_DISPONIBLE = 'Este producto ya no está disponible en el inventario (vendido o reservado). En la tienda solo se publica lo que está en stock.';

    public function __construct(private readonly ImagenProductoService $imagenes) {}

    // ─── Listado ──────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $q        = trim((string) $request->input('q', ''));
        $tab      = (string) $request->input('tab', 'todos');
        $categoria= (string) $request->input('categoria', 'todos');
        $porPagina = in_array((int) $request->input('per_page'), [30, 60, 100], true) ? (int) $request->input('per_page') : 30;

        // Base filtros de búsqueda (sin eager loads para clones de count)
        $baseFilters = fn ($qb) => $qb
            ->when($q !== '', fn ($q2) => $q2->whereRaw('LOWER(titulo) LIKE ?', [\App\Support\Busqueda::contiene($q)]))
            ->when($categoria !== 'todos', fn ($q2) => $q2->where('categoria', $categoria));

        // Conteos por tab (sin eager loads — solo count)
        $counts = [
            'todos'       => CatalogoPublicacion::query()->tap($baseFilters)->count(),
            'publicados'  => CatalogoPublicacion::query()->tap($baseFilters)->where('publicado', true)->count(),
            'borradores'  => CatalogoPublicacion::query()->tap($baseFilters)->where('publicado', false)->count(),
            'sin_imagen'  => CatalogoPublicacion::query()->tap($baseFilters)->doesntHave('imagenes')->count(),
            'myskin'      => CatalogoPublicacion::query()->tap($baseFilters)->where('storefront', 'MYSKIN')->count(),
            'seminuevos'  => CatalogoPublicacion::query()->tap($baseFilters)->where('condicion', 'Seminuevo')->count(),
            'promociones' => CatalogoPublicacion::query()->tap($baseFilters)->whereNotNull('precio_promocional')->count(),
        ];

        // Query principal con eager loads + paginación
        $query = CatalogoPublicacion::with(['imagenes' => fn ($q2) => $q2->orderBy('orden')])
            ->withCount('imagenes')
            ->tap($baseFilters)
            ->when(true, function ($qb) use ($tab) {
                return match ($tab) {
                    'publicados'  => $qb->where('publicado', true),
                    'borradores'  => $qb->where('publicado', false),
                    'sin_imagen'  => $qb->doesntHave('imagenes'),
                    'myskin'      => $qb->where('storefront', 'MYSKIN'),
                    'seminuevos'  => $qb->where('condicion', 'Seminuevo'),
                    'promociones' => $qb->whereNotNull('precio_promocional'),
                    default       => $qb,
                };
            })
            ->orderByDesc('updated_at');

        $pagina = $query->paginate($porPagina)->withQueryString();
        CatalogoPublicacion::precargarInventario($pagina->getCollection());
        $publicaciones = $pagina->through(fn ($pub) => $this->cardData($pub));

        return Inertia::render('Admin/Catalogo/Index', [
            'publicaciones' => $publicaciones,
            'filters'       => ['q' => (string) $q, 'tab' => (string) $tab, 'categoria' => (string) $categoria, 'per_page' => $porPagina],
            'counts'        => $counts,
            'pendientes'    => InventarioCatalogo::contarPendientes(),
        ]);
    }

    // ─── Crear desde inventario ───────────────────────────────────────────────

    /**
     * "Publicar en web" desde el inventario: prepara la publicación con los datos del equipo
     * (como borrador, con la condición del inventario si ya la tiene) y abre el editor para que la persona la complete.
     * Antes renderizaba una pantalla que no existía (Admin/Catalogo/Create).
     */
    public function createFromInventory(string $tipo, int $id): RedirectResponse
    {
        $modelo = $this->encontrarProducto($tipo, $id);
        abort_unless($modelo, 404, 'Producto no encontrado en inventario.');

        $existente = CatalogoPublicacion::where('producto_tipo', $tipo)
            ->where('producto_id', $id)
            ->first();

        if ($existente) {
            return redirect()->route('admin.catalogo.edit', $existente);
        }

        $pub = InventarioCatalogo::crear($tipo, $modelo, null, false);

        return redirect()->route('admin.catalogo.edit', $pub)
            ->with('success', $pub->condicion
                ? "Preparamos la publicación con los datos del inventario (condición: {$pub->condicion}). Revisa y guarda para mostrarla en la tienda."
                : 'Preparamos la publicación con los datos del inventario. Elige la condición y guarda para mostrarla en la tienda.');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'producto_tipo' => 'required|in:celular,computadora,producto_apple,producto_general',
            'producto_id'   => 'required|integer|min:1',
            'storefront'    => 'required|in:APPLE_BOSS,MYSKIN',
            'titulo'        => 'required|string|max:255',
            'subtitulo'     => 'nullable|string|max:255',
            'slug'          => 'required|string|max:255|unique:catalogo_publicaciones,slug',
            'resumen'       => 'required|string|max:1000',
            'descripcion'   => 'nullable|string',
            'que_incluye'   => 'nullable|string',
            'observaciones' => 'nullable|string',
            'garantia'      => 'nullable|string|max:255',
            'condicion'     => 'nullable|in:Nuevo,Seminuevo,Open Box,Reacondicionado',
            'categoria'     => 'required|string|max:100',
            'subcategoria'  => 'nullable|string|max:100',
            'tags'          => 'nullable|array',
            'atributos'     => 'nullable|array',
            'seo_title'     => 'nullable|string|max:255',
            'seo_description'=> 'nullable|string|max:500',
            'publicado'     => 'boolean',
            'destacado'     => 'boolean',
            'publicar_desde'=> 'nullable|date',
            'publicar_hasta'=> 'nullable|date',
            'orden'         => 'integer|min:0',
        ]);

        // Regla de negocio: MYSKIN solo para fundas
        $this->validarStorefrontMyskin($validated['storefront'], $validated['categoria']);

        // Solo se publica lo que está en stock (ni vendido ni reservado)
        if (($validated['publicado'] ?? false)
            && ! \App\Support\TiendaSoloDisponible::sePuedePublicar($validated['producto_tipo'], (int) $validated['producto_id'])) {
            return back()->withErrors(['publicado' => self::NO_DISPONIBLE])->withInput();
        }

        foreach (['descripcion', 'que_incluye', 'observaciones'] as $field) {
            if (isset($validated[$field])) {
                $validated[$field] = $this->sanitizeRichText($validated[$field]);
            }
        }

        $pub = CatalogoPublicacion::create($validated);

        return redirect()->route('admin.catalogo.edit', $pub->id)
            ->with('success', 'Publicación creada. Ahora agrega imágenes y verifica los campos.');
    }

    // ─── Editar ───────────────────────────────────────────────────────────────

    public function edit(CatalogoPublicacion $publicacion): Response
    {
        $publicacion->load(['imagenes' => fn ($q) => $q->orderBy('orden'), 'compatibilidades']);

        $producto = $this->encontrarProducto($publicacion->producto_tipo, $publicacion->producto_id);
        $inventario = $this->inventarioData($publicacion->producto_tipo, $publicacion->producto_id, $producto);
        $modelos = ModeloReferencia::delTipo($publicacion->producto_tipo);
        $esAccesorio = $publicacion->producto_tipo === 'producto_general';
        if ($esAccesorio) {
            $modelos = $modelos->sortBy('orden')->values();   // en el orden de la base de accesorios
        }

        return Inertia::render('Admin/Catalogo/Edit', [
            'publicacion'       => $this->publicacionData($publicacion),
            'inventario'        => $inventario,
            // Fichas de modelos para «Llenar desde modelo»; el sugerido sale del nombre del inventario. En un accesorio,
            // también la descripción, armada con el nombre de este artículo («Funda de silicona para iPhone 13 Pro…»); en
            // un producto Apple (iPad, AirPods…), la descripción de su ficha
            'modelosReferencia' => $modelos->map(fn (ModeloReferencia $m) => [
                'id'        => $m->id,
                'nombre'    => $m->nombre,
                'anio'      => $m->anio,
                'familia'   => $m->familia,
                'ficha'     => $m->fichaParaPublicacion(),
                'contenido' => match ($publicacion->producto_tipo) {
                    'producto_general' => ContenidoAccesorio::paraPublicacion($m, $producto?->nombre),
                    // Lo que trae la caja, solo en una publicación Nuevo
                    'producto_apple'   => ContenidoProductoApple::paraPublicacion($m, $publicacion->condicion),
                    default            => null,
                },
            ])->values(),
            // Accesorio sin ficha vinculada: qué campos mostrar según su tipo en el inventario (funda, vidrio, cargador…)
            'familiaAccesorio'  => $esAccesorio ? (self::FAMILIA_ACCESORIO[$producto?->tipo] ?? 'accesorio') : null,
            'modeloSugerido'    => $publicacion->modelo_referencia_id || ! $producto
                ? null
                : ModeloReferencia::deInventario($publicacion->producto_tipo, $producto, $modelos)?->id,
            'condiciones'       => CatalogoPublicacion::CONDICIONES,
            'storefronts'       => [CatalogoPublicacion::STOREFRONT_APPLE_BOSS, CatalogoPublicacion::STOREFRONT_MYSKIN],
            'camposFaltantes'   => $publicacion->camposFaltantes(),
            'estadoPublicacion' => $publicacion->estadoPublicacion(),
            'compatibilidades'       => $publicacion->compatibilidades
                                        ->pluck('target_id')
                                        ->values()
                                        ->all(),
            'compatibility_targets'  => CompatibilityTarget::where('active', true)
                                        ->orderBy('sort_order')
                                        ->get(['id', 'family', 'generation', 'name', 'slug'])
                                        ->toArray(),
        ]);
    }

    public function update(Request $request, CatalogoPublicacion $publicacion): RedirectResponse
    {
        $validated = $request->validate([
            'storefront'         => 'required|in:APPLE_BOSS,MYSKIN',
            'titulo'             => 'required|string|max:255',
            'subtitulo'          => 'nullable|string|max:255',
            'slug'               => "required|string|max:255|unique:catalogo_publicaciones,slug,{$publicacion->id}",
            'resumen'            => 'required|string|max:1000',
            'descripcion'        => 'nullable|string',
            'que_incluye'        => 'nullable|string',
            'observaciones'      => 'nullable|string',
            'garantia'           => 'nullable|string|max:255',
            'condicion'          => 'nullable|in:Nuevo,Seminuevo,Open Box,Reacondicionado',
            'categoria'          => 'required|string|max:100',
            'subcategoria'       => 'nullable|string|max:100',
            'tags'               => 'nullable|array',
            'atributos'          => 'nullable|array',
            'seo_title'          => 'nullable|string|max:255',
            'seo_description'    => 'nullable|string|max:500',
            'publicado'          => 'boolean',
            'destacado'          => 'boolean',
            'publicar_desde'     => 'nullable|date',
            'publicar_hasta'     => 'nullable|date',
            'orden'              => 'integer|min:0',
            'precio_promocional' => 'nullable|numeric|min:0',
            'promocion_desde'    => 'nullable|date',
            'promocion_hasta'    => 'nullable|date|after_or_equal:promocion_desde',
            'badge'              => 'nullable|string|max:60',
            'modelo_referencia_id' => 'nullable|integer|exists:modelos_referencia,id',
        ]);

        // Precio promo debe ser menor al precio de venta normal
        $precioNormal = $publicacion->precioVigente();
        if (! empty($validated['precio_promocional']) && $precioNormal
            && $validated['precio_promocional'] >= $precioNormal) {
            return back()->withErrors(['precio_promocional' => 'El precio promocional debe ser menor al precio de venta.']);
        }

        // Desde el editor, MYSKIN con otra categoría vuelve como error del formulario (no como página de error)
        if ($validated['storefront'] === CatalogoPublicacion::STOREFRONT_MYSKIN
            && ! in_array($validated['categoria'], CatalogoPublicacion::MYSKIN_CATEGORIAS, true)) {
            return back()->withErrors(['storefront' => 'MYSKIN es solo para la categoría Fundas.']);
        }

        foreach (['descripcion', 'que_incluye', 'observaciones'] as $field) {
            if (isset($validated[$field])) {
                $validated[$field] = $this->sanitizeRichText($validated[$field]);
            }
        }

        // Solo se publica lo que está en stock (ni vendido ni reservado)
        if (($validated['publicado'] ?? false) && ! $publicacion->productoDisponible()) {
            return back()->withErrors(['publicado' => self::NO_DISPONIBLE]);
        }

        // Bloquear publicación si faltan campos obligatorios
        if ($validated['publicado'] && $publicacion->fill($validated)->camposFaltantes() !== []) {
            return back()->withErrors([
                'publicado' => 'Para mostrarlo en la tienda falta: ' .
                    mb_strtolower(implode(', ', $publicacion->fill($validated)->camposFaltantes())) . '.',
            ]);
        }

        $publicacion->update($validated);

        // Nuevo o Seminuevo también quedan en el inventario, que es de donde la tienda toma la condición
        \App\Support\CondicionInventario::desdePublicacion($publicacion);

        return back()->with('success', 'Publicación actualizada.');
    }

    public function destroy(CatalogoPublicacion $publicacion): RedirectResponse
    {
        // Eliminar imágenes del disco
        foreach ($publicacion->imagenes as $img) {
            $this->imagenes->eliminar($img);
        }
        $publicacion->delete();

        return redirect()->route('admin.catalogo.index')->with('success', 'Publicación eliminada.');
    }

    /** Switch rápido desde el listado: marca/desmarca la publicación como destacada en el Home. */
    public function toggleDestacado(CatalogoPublicacion $publicacion): RedirectResponse
    {
        $publicacion->update(['destacado' => ! $publicacion->destacado]);

        return back()->with('success', $publicacion->destacado
            ? 'Publicación marcada como destacada.'
            : 'Publicación quitada de destacados.');
    }

    // ─── Imágenes ─────────────────────────────────────────────────────────────

    public function uploadImagen(Request $request, CatalogoPublicacion $publicacion): JsonResponse
    {
        $request->validate([
            'imagen' => 'required|file|mimes:jpg,jpeg,png,webp|max:10240',
            'alt'    => 'nullable|string|max:255',
        ]);

        try {
            $imagen = $this->imagenes->subir(
                $publicacion,
                $request->file('imagen'),
                $request->string('alt', '')->value()
            );

            return response()->json([
                'id'           => $imagen->id,
                'url_thumb'    => $imagen->urlThumb(),
                'url_card'     => $imagen->urlCard(),
                'url_medium'   => $imagen->urlMedium(),
                'url_detail'   => $imagen->urlDetail(),
                'alt'          => $imagen->alt,
                'es_principal' => $imagen->es_principal,
                'orden'        => $imagen->orden,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function deleteImagen(CatalogoPublicacion $publicacion, CatalogoImagen $imagen): JsonResponse
    {
        abort_unless($imagen->publicacion_id === $publicacion->id, 404);
        $this->imagenes->eliminar($imagen);
        return response()->json(['ok' => true]);
    }

    public function reordenarImagenes(Request $request, CatalogoPublicacion $publicacion): JsonResponse
    {
        $request->validate(['orden' => 'required|array', 'orden.*.id' => 'required|integer', 'orden.*.orden' => 'required|integer']);
        $this->imagenes->reordenar($publicacion, $request->input('orden'));
        return response()->json(['ok' => true]);
    }

    public function setPrincipal(CatalogoPublicacion $publicacion, CatalogoImagen $imagen): JsonResponse
    {
        abort_unless($imagen->publicacion_id === $publicacion->id, 404);
        $this->imagenes->marcarPrincipal($imagen);
        return response()->json(['ok' => true]);
    }

    public function syncCompatibilidades(Request $request, CatalogoPublicacion $publicacion): JsonResponse
    {
        $validated = $request->validate([
            'target_ids'   => 'array',
            'target_ids.*' => 'integer|exists:compatibility_targets,id',
        ]);

        $targetIds = collect($validated['target_ids'] ?? [])->unique()->values();

        // Validar que los targets son MYSKIN-apropiados cuando la publicación es MYSKIN
        // (no hay restricción de family en MYSKIN — fundas son para cualquier dispositivo)

        $publicacion->compatibilidades()->delete();

        foreach ($targetIds as $targetId) {
            $publicacion->compatibilidades()->create(['target_id' => $targetId]);
        }

        return response()->json(['ok' => true, 'count' => $targetIds->count()]);
    }

    // ─── Helpers privados ─────────────────────────────────────────────────────

    private function encontrarProducto(string $tipo, int $id): mixed
    {
        return match ($tipo) {
            'celular'          => Celular::find($id),
            'computadora'      => Computadora::find($id),
            'producto_apple'   => ProductoApple::find($id),
            'producto_general' => ProductoGeneral::find($id),
            default            => null,
        };
    }

    private function inventarioData(string $tipo, int $id, mixed $modelo): array
    {
        if (! $modelo) return ['tipo' => $tipo, 'id' => $id, 'existe' => false];

        // NUNCA incluir precio_costo, ganancia, IMEI, serial, procedencia
        $nombre = match ($tipo) {
            'celular'          => $modelo->modelo ?? null,
            'computadora'      => $modelo->nombre ?? null,
            'producto_apple'   => $modelo->modelo ?? null,
            'producto_general' => $modelo->nombre ?? null,
            default            => null,
        };

        return [
            'tipo'           => $tipo,
            'id'             => $id,
            'existe'         => true,
            'nombre_interno' => $nombre,
            'estado'         => $modelo->estado,
            'precio_venta'   => (float) $modelo->precio_venta,
            'condicion'      => \App\Support\CondicionInventario::de($modelo),
            // Salud, ciclos y sellado: datos públicos que la ficha técnica toma solos
            'bateria'        => in_array($tipo, ['celular', 'computadora', 'producto_apple'], true)
                ? CatalogoPublicacion::bateriaDe($modelo->bateria ?? null)
                : null,
        ];
    }

    private function publicacionData(CatalogoPublicacion $pub): array
    {
        return [
            ...$pub->toArray(),
            'imagenes' => $pub->imagenes->map(fn ($img) => [
                'id'           => $img->id,
                'url_thumb'    => $img->urlThumb(),
                'url_card'     => $img->urlCard(),
                'url_medium'   => $img->urlMedium(),
                'url_detail'   => $img->urlDetail(),
                'alt'          => $img->alt,
                'es_principal' => $img->es_principal,
                'orden'        => $img->orden,
            ])->toArray(),
        ];
    }

    private function cardData(CatalogoPublicacion $pub): array
    {
        $principal = $pub->imagenes->firstWhere('es_principal', true) ?? $pub->imagenes->first();
        return [
            'id'                 => $pub->id,
            'titulo'             => $pub->titulo,
            'slug'               => $pub->slug,
            'categoria'          => $pub->categoria,
            'condicion'          => $pub->condicion,
            'producto_tipo'      => $pub->producto_tipo,
            'producto_id'        => $pub->producto_id,
            'publicado'          => $pub->publicado,
            'destacado'          => (bool) $pub->destacado,
            'storefront'         => $pub->storefront,
            'precio_venta'       => $pub->precioVigente(),
            'precio_promocional' => $pub->precio_promocional,
            'imagenes_count'     => $pub->imagenes_count ?? 0,
            'thumb'              => $principal?->urlThumb() ?? $principal?->urlCard(),
            'estado_publicacion' => $pub->estadoPublicacion(),
            'campos_faltantes'   => $pub->camposFaltantes(),
            'recomendaciones'    => $pub->recomendaciones(),
            'tipo_label'         => \App\Support\InventarioCatalogo::GRUPOS[$pub->producto_tipo]['label'] ?? 'Inventario',
        ];
    }

    private function sugerirContenido(string $tipo, mixed $modelo): array
    {
        // Sugerencias iniciales para que el admin no empiece desde cero.
        // El admin DEBE revisar y confirmar antes de publicar.
        $nombre = match ($tipo) {
            'celular'          => $modelo->modelo,
            'computadora'      => $modelo->nombre,
            'producto_apple'   => $modelo->modelo,
            'producto_general' => $modelo->nombre,
            default            => 'Producto',
        };
        return [
            'titulo' => $nombre,
            'slug'   => Str::slug($nombre),
        ];
    }

    /**
     * Regla de negocio: MYSKIN solo para fundas/cases.
     * Valida en backend, no solo en frontend.
     */
    /**
     * Sanitiza HTML de campos enriquecidos contra XSS almacenado.
     * Allowlist estricta: solo elementos semánticos seguros, sin atributos peligrosos.
     */
    private function sanitizeRichText(?string $html): ?string
    {
        if (blank($html)) {
            return $html;
        }

        // 1. Strip todo excepto la allowlist de tags
        $allowed = '<p><br><strong><b><em><i><ul><ol><li><h2><h3><a>';
        $clean = strip_tags($html, $allowed);

        // 2. Strip todos los atributos de tags no-<a> (on*, style, class, id, etc.)
        $clean = preg_replace_callback('/<(?!a\b|\/a)[a-z][a-z0-9]*\b([^>]*)>/i', function ($m) {
            // Extraer solo el nombre del tag, descartar todos los atributos
            preg_match('/^<([a-z][a-z0-9]*)/i', $m[0], $tagMatch);
            $tag = strtolower($tagMatch[1]);
            return "<{$tag}>";
        }, $clean);

        // 3. En <a>: solo href + target="_blank" controlado; bloquear javascript: y data:
        $clean = preg_replace_callback('/<a\b([^>]*)>/i', function ($m) {
            $attrs = $m[1];
            $href = '';
            $extra = '';

            if (preg_match('/\bhref\s*=\s*["\']([^"\']*)["\']/', $attrs, $h)) {
                $url = trim($h[1]);
                if (! preg_match('/^\s*(javascript|data):/i', $url)) {
                    $href = ' href="' . htmlspecialchars($url, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"';
                }
            }

            if (preg_match('/\btarget=["\']_blank["\']/i', $attrs)) {
                $extra = ' target="_blank" rel="noopener noreferrer"';
            }

            return '<a' . $href . $extra . '>';
        }, $clean);

        return $clean;
    }

    private function validarStorefrontMyskin(string $storefront, string $categoria): void
    {
        if ($storefront === CatalogoPublicacion::STOREFRONT_MYSKIN
            && ! in_array($categoria, CatalogoPublicacion::MYSKIN_CATEGORIAS, true)
        ) {
            abort(422, 'El storefront MYSKIN solo está permitido para la categoría fundas.');
        }
    }
}
