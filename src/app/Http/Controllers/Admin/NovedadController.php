<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use App\Models\NavMenuItem;
use App\Models\Novedad;
use App\Services\ImagenNovedadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Novedades: las publicaciones con fecha de la tienda (un equipo que llegó, una guía, un aviso).
 *
 * Cada una vive en /novedades/…, se lista en /novedades y las más nuevas salen en el inicio con la sección «Novedades»
 * de Portada. Se crean como borrador. Al publicarlas se ven desde su fecha (con una fecha futura quedan programadas) y
 * su dirección queda fija, porque es el enlace que se comparte.
 */
class NovedadController extends Controller
{
    public function __construct(private readonly ImagenNovedadService $imagenes) {}

    public function index(): Response
    {
        $filas = Novedad::all()
            ->map(fn (Novedad $n) => $this->fila($n))
            ->sort(fn (array $a, array $b) => $a['orden'] <=> $b['orden'])
            ->map(fn (array $f) => collect($f)->except('orden')->all())
            ->values();

        $donde = $this->dondeSeVen();

        return Inertia::render('Admin/Novedades/Index', [
            'novedades'   => $filas,
            'resumen'     => [
                'total'       => $filas->count(),
                'publicadas'  => $filas->where('estado', 'publicada')->count(),
                'programadas' => $filas->where('estado', 'programada')->count(),
                'borradores'  => $filas->where('estado', 'borrador')->count(),
            ],
            'donde'       => $donde,
            // Lo que muestra hoy la sección del inicio, con la misma consulta que usa la tienda
            'vistaInicio' => Novedad::paraLaTienda($donde['inicio']['cantidad'] ?? HomeSection::limite('news')),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate(['titulo' => 'required|string|max:200'], [
            'titulo.required' => 'Escribe el título de la novedad.',
            'titulo.max'      => 'El título puede tener hasta 200 letras.',
        ]);

        $titulo = $this->limpio($validated['titulo']);
        if ($titulo === '') {
            throw ValidationException::withMessages(['titulo' => 'Escribe el título de la novedad.']);
        }

        $novedad = Novedad::create([
            'title'          => $titulo,
            'slug'           => $this->slugLibre($titulo),
            'content_blocks' => [],
            'status'         => 'draft',
            'indexable'      => true,
        ]);

        return redirect()->route('admin.novedades.edit', $novedad)
            ->with('success', 'Borrador creado. Escribe el texto, sube una foto y publícala cuando esté lista.');
    }

    public function edit(Novedad $novedad): Response
    {
        return Inertia::render('Admin/Novedades/Edit', [
            'novedad' => [
                'id'              => $novedad->id,
                'titulo'          => $novedad->title,
                'slug'            => $novedad->slug,
                'url'             => $novedad->urlPublica(),
                'resumen'         => $novedad->excerpt ?? '',
                'cuerpo'          => $novedad->cuerpoHtml(),
                'autor'           => $novedad->author ?? '',
                'estado'          => $novedad->estado(),
                'fecha'           => $novedad->published_at?->format('Y-m-d\TH:i'),
                'seo_title'       => $novedad->seo_title ?? '',
                'seo_description' => $novedad->seo_description ?? '',
                'indexable'       => $novedad->indexable,
                'imagen'          => $novedad->urlImagen('card'),
                'imagen_meta'     => $novedad->imagen_meta,
                'direccion_fija'  => $novedad->direccionFija(),
                'extras'          => $novedad->bloquesExtra(),
                'actualizada'     => $novedad->updated_at?->diffForHumans(),
                'version'         => (string) ($novedad->updated_at?->getTimestampMs() ?? 0),
            ],
            'donde'  => $this->dondeSeVen(),
            'google' => ['base' => url('/novedades') . '/', 'sufijo' => Novedad::SUFIJO_GOOGLE],
            'foto'   => ['min_ancho' => ImagenNovedadService::MIN_ANCHO, 'max_mb' => intdiv(ImagenNovedadService::MAX_KB, 1024)],
        ]);
    }

    public function update(Request $request, Novedad $novedad): RedirectResponse
    {
        $validated = $request->validate([
            'titulo'          => 'required|string|max:200',
            'slug'            => 'nullable|string|max:200',
            'resumen'         => 'nullable|string|max:300',
            'cuerpo'          => 'nullable|string|max:100000',
            'autor'           => 'nullable|string|max:100',
            'estado'          => 'required|in:borrador,publicada',
            'fecha'           => 'nullable|date',
            'seo_title'       => 'nullable|string|max:70',
            'seo_description' => 'nullable|string|max:160',
            'indexable'       => 'boolean',
            'imagen'          => 'nullable|file|mimes:jpg,jpeg,png,webp|max:' . ImagenNovedadService::MAX_KB
                                 . '|dimensions:min_width=' . ImagenNovedadService::MIN_ANCHO,
            'quitar_imagen'   => 'boolean',
        ], [
            'titulo.required'     => 'Escribe el título de la novedad.',
            'titulo.max'          => 'El título puede tener hasta 200 letras.',
            'resumen.max'         => 'El resumen puede tener hasta 300 letras.',
            'autor.max'           => 'El nombre del autor puede tener hasta 100 letras.',
            'estado.in'           => 'Elige si queda como borrador o publicada.',
            'fecha.date'          => 'La fecha de publicación no es válida.',
            'seo_title.max'       => 'El título en Google puede tener hasta 70 letras.',
            'seo_description.max' => 'La descripción en Google puede tener hasta 160 letras.',
            'imagen.file'         => 'No se pudo subir la foto. Prueba otra vez.',
            'imagen.mimes'        => 'La foto debe ser JPG, PNG o WebP.',
            'imagen.max'          => 'La foto puede pesar hasta ' . intdiv(ImagenNovedadService::MAX_KB, 1024) . ' MB.',
            'imagen.dimensions'   => 'La foto debe medir al menos ' . ImagenNovedadService::MIN_ANCHO . ' px de ancho: más chica se ve borrosa.',
        ]);

        $titulo = $this->limpio($validated['titulo']);
        if ($titulo === '') {
            throw ValidationException::withMessages(['titulo' => 'Escribe el título de la novedad.']);
        }

        $cuerpo = $this->htmlSeguro($this->parrafos((string) ($validated['cuerpo'] ?? '')));
        $publicar = $validated['estado'] === 'publicada';

        if ($publicar && trim(strip_tags($cuerpo)) === '') {
            throw ValidationException::withMessages(['cuerpo' => 'Escribe el texto antes de publicarla: sin texto se vería vacía.']);
        }

        $novedad->fill([
            'title'           => $titulo,
            'excerpt'         => $this->limpio($validated['resumen'] ?? '') ?: null,
            'content_blocks'  => $novedad->bloquesConCuerpo($cuerpo),
            'author'          => $this->limpio($validated['autor'] ?? '') ?: null,
            'seo_title'       => $this->limpio($validated['seo_title'] ?? '') ?: null,
            'seo_description' => $this->limpio($validated['seo_description'] ?? '') ?: null,
            'indexable'       => $validated['indexable'] ?? $novedad->indexable,
            'status'          => $publicar ? 'published' : 'draft',
        ]);

        // La dirección se puede cambiar hasta que se publica por primera vez; después es el enlace que ya se compartió
        if (! $novedad->direccionFija()) {
            $novedad->slug = $this->slugLibre(($validated['slug'] ?? '') ?: $titulo, $novedad->id);
        }

        if ($publicar) {
            $novedad->published_at = ! empty($validated['fecha'])
                ? Carbon::parse($validated['fecha'])
                : ($novedad->published_at ?? now());
        }

        try {
            if ($request->hasFile('imagen')) {
                $this->imagenes->guardar($novedad, $request->file('imagen'));
            } elseif ($request->boolean('quitar_imagen')) {
                $this->imagenes->quitar($novedad);
            }
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['imagen' => $e->getMessage()]);
        }

        $novedad->save();

        return back()->with('success', $this->mensaje($novedad));
    }

    /** El interruptor del listado: publicarla ya o pasarla a borrador. */
    public function publicacion(Request $request, Novedad $novedad): RedirectResponse
    {
        $request->validate(['publicada' => 'required|boolean']);
        $publicar = $request->boolean('publicada');

        if ($publicar && $novedad->palabras() === 0) {
            return back()->with('error', "«{$novedad->title}» no tiene texto: escríbelo antes de publicarla.");
        }

        $novedad->status = $publicar ? 'published' : 'draft';
        if ($publicar) {
            $novedad->published_at ??= now();
        }
        $novedad->save();

        return back()->with('success', $publicar
            ? $this->mensaje($novedad)
            : "«{$novedad->title}» pasó a borrador: ya no se ve en la tienda.");
    }

    public function destroy(Novedad $novedad): RedirectResponse
    {
        $titulo = $novedad->title;
        $this->imagenes->borrarArchivos($novedad);
        $novedad->delete();

        return redirect()->route('admin.novedades.index')->with('success', "Se borró «{$titulo}».");
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private function fila(Novedad $n): array
    {
        $estado = $n->estado();
        $publicada = $n->published_at?->getTimestamp() ?? 0;

        return [
            'id'          => $n->id,
            'titulo'      => $n->title,
            'url'         => $n->urlPublica(),
            'estado'      => $estado,
            'fecha'       => $n->published_at?->toIso8601String(),
            'actualizada' => $n->updated_at?->diffForHumans(),
            'resumen'     => $n->excerpt ?: Str::limit($n->textoPlano(), 110),
            'imagen'      => $n->urlImagen('card'),
            'minutos'     => $n->minutosLectura(),
            'palabras'    => $n->palabras(),
            'faltantes'   => $n->faltantes(),
            'indexable'   => $n->indexable,
            // Arriba lo que se viene (programadas, la más próxima primero), después los borradores y al final lo publicado
            'orden'       => match ($estado) {
                'programada' => [0, $publicada],
                'borrador'   => [1, -($n->updated_at?->getTimestamp() ?? 0)],
                default      => [2, -$publicada],
            },
        ];
    }

    /** Dónde se ven las novedades: su página, la sección del inicio y los enlaces de los menús. */
    private function dondeSeVen(): array
    {
        $seccion = HomeSection::where('type', 'news')->orderBy('orden')->first();
        $ahora = now();
        $enVigor = $seccion && $seccion->active
            && ($seccion->publicar_desde === null || $seccion->publicar_desde->lte($ahora))
            && ($seccion->publicar_hasta === null || $seccion->publicar_hasta->gte($ahora));

        $enlaces = NavMenuItem::where('active', true)->get();
        $activos = $enlaces->pluck('id')->flip();
        $menus = $enlaces
            ->filter(fn (NavMenuItem $m) => ($m->parent_id === null || isset($activos[$m->parent_id]))
                && rtrim((string) parse_url((string) $m->url, PHP_URL_PATH), '/') === '/novedades')
            ->pluck('slot')
            ->unique()
            ->map(fn (string $slot) => ['slot' => $slot, 'label' => MenuController::MENUS[$slot] ?? $slot])
            ->values()
            ->all();

        return [
            'publicadas' => Novedad::published()->count(),
            'inicio'     => $seccion ? [
                'encendida' => $seccion->active,
                'en_vigor'  => $enVigor,
                'titulo'    => ($seccion->settings['titulo'] ?? '') ?: 'Lo último de Apple Boss',
                'cantidad'  => HomeSection::limite('news', $seccion->settings['limit'] ?? null),
            ] : null,
            'menus'      => $menus,
        ];
    }

    private function mensaje(Novedad $n): string
    {
        return match ($n->estado()) {
            'publicada'  => "«{$n->title}» ya se ve en la tienda.",
            'programada' => "«{$n->title}» se publica sola el " . $n->published_at->format('d/m/Y \a \l\a\s H:i') . '.',
            default      => 'Borrador guardado: todavía no se ve en la tienda.',
        };
    }

    private function limpio(string $texto): string
    {
        return trim(preg_replace('/\s+/u', ' ', strip_tags($texto)));
    }

    /** Texto sin formato (sin etiquetas): cada párrafo separado por una línea en blanco. */
    private function parrafos(string $texto): string
    {
        if (trim($texto) === '' || $texto !== strip_tags($texto)) {
            return $texto;
        }

        return collect(preg_split('/\R{2,}/', trim($texto)))
            ->map(fn ($p) => trim($p))
            ->filter()
            ->map(fn ($p) => '<p>' . nl2br(e($p), false) . '</p>')
            ->implode("\n");
    }

    /** Solo etiquetas de texto y enlaces con dirección segura; sin atributos (on*, style…). Vacío si no queda texto. */
    private function htmlSeguro(string $html): string
    {
        $limpio = strip_tags($html, '<p><br><strong><b><em><i><ul><ol><li><h2><h3><a><blockquote>');

        $limpio = preg_replace_callback('/<(\/?)([a-z0-9]+)([^>]*)>/i', function ($m) {
            $cierre = $m[1];
            $tag = strtolower($m[2]);
            if ($cierre !== '' || $tag !== 'a') {
                return "<{$cierre}{$tag}>";
            }
            if (preg_match('/href\s*=\s*["\']([^"\']*)["\']/i', $m[3], $h) && preg_match('#^(https?://|/|mailto:)#i', trim($h[1]))) {
                return '<a href="' . e(trim($h[1])) . '" rel="noopener">';
            }

            return '<a>';
        }, $limpio);

        return trim(strip_tags($limpio)) === '' ? '' : trim($limpio);
    }

    /** La dirección se arma con el texto que se le pase; si ya existe, suma un número. */
    private function slugLibre(string $texto, ?int $excepto = null): string
    {
        $base = rtrim(Str::limit(Str::slug($texto), 180, ''), '-') ?: 'novedad';
        $slug = $base;
        $n = 2;

        while (Novedad::where('slug', $slug)->when($excepto, fn ($q) => $q->where('id', '!=', $excepto))->exists()) {
            $slug = "{$base}-{$n}";
            $n++;
        }

        return $slug;
    }
}
