<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ComparadorModelosController;
use App\Http\Controllers\Controller;
use App\Models\CatalogoPublicacion;
use App\Models\ModeloReferencia;
use App\Services\FotoModeloService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Modelos y fotos. Lista las fichas de la base de modelos de referencia y permite subir la foto de
 * cada modelo, que usa la comparativa pública. Las fichas no se editan acá: salen de las páginas oficiales de Apple
 * y se cargan con el generador (ver docs/admin-ui/TRASPASO.md).
 */
class ModeloReferenciaController extends Controller
{
    public function index(): Response
    {
        $modelos = $this->ordenados()->loadCount('publicaciones');
        $enTienda = $this->enTienda($modelos->pluck('id'));

        return Inertia::render('Admin/Modelos/Index', [
            'modelos' => $modelos->map(fn (ModeloReferencia $m) => [
                'id'               => $m->id,
                'slug'             => $m->slug,
                'nombre'           => $m->nombre,
                'anio'             => $m->anio,
                'tipo'             => $m->tipo,
                'familia'          => $m->familia,
                'alias'            => $m->alias ?? [],
                'foto'             => $m->urlFoto('card'),
                'foto_actualizada' => $m->foto_actualizada_at?->toIso8601String(),
                'visual'           => $m->visual(),
                'publicaciones'    => $m->publicaciones_count,
                'en_tienda'        => $enTienda[$m->id] ?? 0,
            ])->values(),
            // Una comparativa por familia con base (iPhone, Mac, productos Apple, cargadores y vidrios)
            'comparativas' => collect(ComparadorModelosController::FAMILIAS)
                ->map(fn (array $f, string $slug) => ['tipo' => $f['tipo'], 'nombre' => $f['nombre'], 'url' => route('store.compare.modelos', ['familia' => $slug])])
                ->values(),
        ]);
    }

    public function show(ModeloReferencia $modelo): Response
    {
        $publicaciones = $modelo->publicaciones()->latest('updated_at')->get();
        CatalogoPublicacion::precargarInventario($publicaciones);

        $orden = $this->ordenados();
        $posicion = $orden->search(fn (ModeloReferencia $m) => $m->id === $modelo->id);
        // El siguiente sin foto, dando la vuelta a la lista: para subir varias seguidas
        $siguienteSinFoto = $orden->slice($posicion + 1)->concat($orden->take($posicion))
            ->first(fn (ModeloReferencia $m) => ! $m->tieneFoto());

        return Inertia::render('Admin/Modelos/Show', [
            'modelo' => [
                'id'               => $modelo->id,
                'slug'             => $modelo->slug,
                'nombre'           => $modelo->nombre,
                'anio'             => $modelo->anio,
                'tipo'             => $modelo->tipo,
                'familia'          => $modelo->familia,
                'alias'            => $modelo->alias ?? [],
                'specs'            => $modelo->specs ?? [],
                'visual'           => $modelo->visual(),
                'foto'             => $modelo->urlFoto('card'),
                'foto_detalle'     => $modelo->urlFoto('detalle'),
                'foto_meta'        => $modelo->foto_meta,
                'foto_actualizada' => $modelo->foto_actualizada_at?->toIso8601String(),
            ],
            'publicaciones' => $publicaciones->map(fn (CatalogoPublicacion $p) => [
                'id'         => $p->id,
                'titulo'     => $p->titulo,
                'estado'     => $p->estadoPublicacion(),
                'condicion'  => $p->condicion,
                'precio'     => $p->precioVigente(),
                'disponible' => $p->productoDisponible(),
                'editar'     => route('admin.catalogo.edit', $p->id),
            ])->values(),
            'navegacion' => [
                'anterior'           => $posicion > 0 ? $orden[$posicion - 1]->slug : null,
                'siguiente'          => $orden[$posicion + 1]->slug ?? null,
                'siguiente_sin_foto' => $siguienteSinFoto?->only(['slug', 'nombre']),
                'posicion'           => $posicion + 1,
                'total'              => $orden->count(),
                'sin_foto'           => $orden->reject(fn (ModeloReferencia $m) => $m->tieneFoto())->count(),
            ],
            'comparativa' => $this->urlComparativa($modelo),
            'requisitos'  => ['max_kb' => FotoModeloService::MAX_KB, 'min_lado' => FotoModeloService::MIN_LADO],
        ]);
    }

    public function subirFoto(Request $request, ModeloReferencia $modelo, FotoModeloService $fotos): RedirectResponse
    {
        $request->validate([
            'foto' => [
                'required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:' . FotoModeloService::MAX_KB,
                'dimensions:min_width=' . FotoModeloService::MIN_LADO . ',min_height=' . FotoModeloService::MIN_LADO,
            ],
        ], [
            'foto.required'   => 'Elige una foto.',
            'foto.uploaded'   => 'No se pudo subir la foto. Prueba de nuevo o con una más liviana.',
            'foto.file'       => 'Elige una foto.',
            'foto.mimes'      => 'La foto debe ser JPG, PNG o WebP.',
            'foto.max'        => 'La foto pesa más de 10 MB. Expórtala más liviana.',
            'foto.dimensions' => 'La foto es muy chica: necesita al menos ' . FotoModeloService::MIN_LADO . ' px de ancho y de alto.',
        ]);

        try {
            $fotos->guardar($modelo, $request->file('foto'));
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['foto' => $e->getMessage()]);
        }

        return back()->with('success', "Foto del {$modelo->nombre} guardada. Ya se ve en la comparativa.");
    }

    public function quitarFoto(ModeloReferencia $modelo, FotoModeloService $fotos): RedirectResponse
    {
        $fotos->quitar($modelo);

        return back()->with('success', "Se quitó la foto del {$modelo->nombre}. La comparativa vuelve a mostrar la ilustración.");
    }

    /**
     * Mismo orden que la comparativa: del más nuevo al más antiguo. Los accesorios van al final, por familia (cargadores,
     * vidrios, protectores, fundas, cables y el resto) y en el orden de su base.
     */
    private function ordenados(): Collection
    {
        $familias = array_flip(\App\Support\FichaTecnica\EsquemaAccesorio::FAMILIAS);

        return ModeloReferencia::query()
            ->where('activo', true)
            ->orderBy('tipo')
            ->orderByDesc('anio')
            ->orderBy('orden')
            ->orderBy('nombre')
            ->get()
            ->sortBy(fn (ModeloReferencia $m) => $m->tipo === 'producto_general'
                ? sprintf('z%02d%05d', $familias[$m->familia] ?? 99, $m->orden)
                : '')
            ->values();
    }

    /** Equipos publicados y disponibles por modelo. */
    private function enTienda(Collection $ids): array
    {
        $pubs = CatalogoPublicacion::query()->publicadoAhora()->whereIn('modelo_referencia_id', $ids)->get();
        CatalogoPublicacion::precargarInventario($pubs);

        return $pubs->filter(fn (CatalogoPublicacion $p) => $p->productoDisponible())
            ->countBy('modelo_referencia_id')
            ->all();
    }

    private function urlComparativa(ModeloReferencia $modelo): ?string
    {
        $familia = ComparadorModelosController::familiaDe($modelo);

        return $familia === null ? null : route('store.compare.modelos', ['familia' => $familia, 'modelos' => $modelo->slug]);
    }
}
