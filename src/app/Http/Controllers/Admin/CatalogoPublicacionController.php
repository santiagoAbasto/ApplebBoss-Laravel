<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CatalogoImagen;
use App\Models\CatalogoPublicacion;
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

class CatalogoPublicacionController extends Controller
{
    public function __construct(private readonly ImagenProductoService $imagenes) {}

    // ─── Listado ──────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $q        = trim((string) $request->input('q', ''));
        $tab      = (string) $request->input('tab', 'todos');
        $categoria= (string) $request->input('categoria', 'todos');

        // Base filtros de búsqueda (sin eager loads para clones de count)
        $baseFilters = fn ($qb) => $qb
            ->when($q !== '', fn ($q2) => $q2->where('titulo', 'ilike', "%{$q}%"))
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

        $publicaciones = $query->paginate(30)->through(fn ($pub) => $this->cardData($pub));

        return Inertia::render('Admin/Catalogo/Index', [
            'publicaciones' => $publicaciones,
            'filters'       => ['q' => (string) $q, 'tab' => (string) $tab, 'categoria' => (string) $categoria],
            'counts'        => $counts,
        ]);
    }

    // ─── Crear desde inventario ───────────────────────────────────────────────

    public function createFromInventory(string $tipo, int $id): Response
    {
        // Verificar que el producto existe en inventario
        $modelo = $this->encontrarProducto($tipo, $id);
        abort_unless($modelo, 404, 'Producto no encontrado en inventario.');

        // Si ya existe publicación para este producto, redirigir al edit
        $existente = CatalogoPublicacion::where('producto_tipo', $tipo)
            ->where('producto_id', $id)
            ->first();

        if ($existente) {
            return Inertia::render('Admin/Catalogo/Edit', [
                'publicacion'    => $this->publicacionData($existente),
                'inventario'     => $this->inventarioData($tipo, $id, $modelo),
                'condiciones'    => CatalogoPublicacion::CONDICIONES,
                'storefronts'    => [CatalogoPublicacion::STOREFRONT_APPLE_BOSS, CatalogoPublicacion::STOREFRONT_MYSKIN],
                'camposFaltantes'=> $existente->camposFaltantes(),
                'estadoPublicacion' => $existente->estadoPublicacion(),
            ]);
        }

        // Sugerir datos iniciales (el admin los confirma)
        $sugerido = $this->sugerirContenido($tipo, $modelo);

        return Inertia::render('Admin/Catalogo/Create', [
            'inventario'  => $this->inventarioData($tipo, $id, $modelo),
            'sugerido'    => $sugerido,
            'condiciones' => CatalogoPublicacion::CONDICIONES,
            'storefronts' => [CatalogoPublicacion::STOREFRONT_APPLE_BOSS, CatalogoPublicacion::STOREFRONT_MYSKIN],
        ]);
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

        $pub = CatalogoPublicacion::create($validated);

        return redirect()->route('admin.catalogo.edit', $pub->id)
            ->with('success', 'Publicación creada. Ahora agrega imágenes y verifica los campos.');
    }

    // ─── Editar ───────────────────────────────────────────────────────────────

    public function edit(CatalogoPublicacion $publicacion): Response
    {
        $publicacion->load(['imagenes' => fn ($q) => $q->orderBy('orden')]);

        return Inertia::render('Admin/Catalogo/Edit', [
            'publicacion'       => $this->publicacionData($publicacion),
            'inventario'        => $this->inventarioData(
                $publicacion->producto_tipo,
                $publicacion->producto_id,
                $this->encontrarProducto($publicacion->producto_tipo, $publicacion->producto_id)
            ),
            'condiciones'       => CatalogoPublicacion::CONDICIONES,
            'storefronts'       => [CatalogoPublicacion::STOREFRONT_APPLE_BOSS, CatalogoPublicacion::STOREFRONT_MYSKIN],
            'camposFaltantes'   => $publicacion->camposFaltantes(),
            'estadoPublicacion' => $publicacion->estadoPublicacion(),
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
        ]);

        // Precio promo debe ser menor al precio de venta normal
        $precioNormal = $publicacion->precioVigente();
        if (! empty($validated['precio_promocional']) && $precioNormal
            && $validated['precio_promocional'] >= $precioNormal) {
            return back()->withErrors(['precio_promocional' => 'El precio promocional debe ser menor al precio de venta.']);
        }

        $this->validarStorefrontMyskin($validated['storefront'], $validated['categoria']);

        // Bloquear publicación si faltan campos obligatorios
        if ($validated['publicado'] && $publicacion->fill($validated)->camposFaltantes() !== []) {
            return back()->withErrors([
                'publicado' => 'No se puede publicar: faltan campos obligatorios. ' .
                    implode(', ', $publicacion->fill($validated)->camposFaltantes()),
            ]);
        }

        $publicacion->update($validated);

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
            'storefront'         => $pub->storefront,
            'precio_venta'       => $pub->precioVigente(),
            'precio_promocional' => $pub->precio_promocional,
            'imagenes_count'     => $pub->imagenes_count ?? 0,
            'thumb'              => $principal?->urlThumb() ?? $principal?->urlCard(),
            'estado_publicacion' => $pub->estadoPublicacion(),
            'campos_faltantes'   => $pub->camposFaltantes(),
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
    private function validarStorefrontMyskin(string $storefront, string $categoria): void
    {
        if ($storefront === CatalogoPublicacion::STOREFRONT_MYSKIN
            && ! in_array($categoria, CatalogoPublicacion::MYSKIN_CATEGORIAS, true)
        ) {
            abort(422, 'El storefront MYSKIN solo está permitido para la categoría fundas.');
        }
    }
}
