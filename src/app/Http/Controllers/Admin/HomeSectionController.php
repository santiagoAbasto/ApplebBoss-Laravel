<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CatalogCategory;
use App\Models\CatalogCollection;
use App\Models\CatalogoPublicacion;
use App\Models\Faq;
use App\Models\HomeSection;
use App\Models\Novedad;
use App\Models\StoreLocation;
use App\Models\StoreService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Portada: el orden de la página de inicio.
 *
 * Las secciones no se crean ni se borran: son las piezas que sabe dibujar la tienda. Acá se enciende cada una, se
 * cambia su orden y se editan sus títulos, botones y cuántos productos muestra. El contenido sale de otros módulos
 * (el catálogo, las categorías, las colecciones, los servicios, las ubicaciones y las preguntas frecuentes), y una
 * sección de productos que hoy no tiene nada que mostrar no se dibuja: la portada nunca queda con un hueco.
 */
class HomeSectionController extends Controller
{
    public const ALLOWED_TYPES = HomeSection::TYPES;

    /** Qué se puede editar de cada tipo de sección. Lo que no esté acá se descarta. */
    private const TYPE_SETTINGS = [
        'hero' => [
            'text' => ['eyebrow', 'titulo', 'descripcion', 'cta_label', 'cta2_label'],
            'url'  => ['cta_url', 'cta2_url'],
            'enum' => ['tema' => ['appleboss_navy', 'light', 'myskin']],
        ],
        'featured'           => ['text' => ['titulo', 'subtitle'], 'integer' => ['limit']],
        'category_products'  => ['text' => ['titulo', 'subtitle'], 'integer' => ['limit'], 'enum' => ['categoria' => HomeSection::CATEGORY_OPTIONS]],
        'product_collection' => ['text' => ['titulo', 'subtitle'], 'integer' => ['collection_id', 'limit']],
        'myskin'             => ['text' => ['titulo', 'subtitle'], 'integer' => ['limit']],
        'semiused'           => ['text' => ['titulo', 'subtitle'], 'integer' => ['limit']],
        'new_arrivals'       => ['text' => ['titulo', 'subtitle'], 'integer' => ['limit']],
        'offers'             => ['text' => ['titulo', 'subtitle'], 'integer' => ['limit']],
        'trade_in'           => ['text' => ['titulo', 'descripcion', 'cta_label']],
        // Los locales, su orden y sus datos salen de Tienda online → Ubicaciones; acá solo el título de la sección
        'location'           => ['text' => ['titulo', 'subtitle']],
        // Las tarjetas salen de Tienda online → Servicios; acá solo el título de la sección
        'services'           => ['text' => ['titulo', 'subtitle']],
        // Las publicaciones salen de Tienda online → Novedades; acá el título y cuántas se muestran
        'news'               => ['text' => ['titulo', 'subtitle'], 'integer' => ['limit']],
        // Las opiniones salen de Tienda online → Reseñas (solo las aprobadas); acá solo el título
        'reviews'            => ['text' => ['titulo', 'subtitle']],
        // Tipos sin nada que editar: su contenido sale entero de otro módulo
        'category_rail' => [],
        'trust'         => [],
        'faq'           => [],
    ];

    public function index(): Response
    {
        $contexto = $this->contexto();
        $secciones = HomeSection::orderBy('orden')->get();
        $enLaTienda = $this->loQueMuestraCadaUna($secciones, $contexto);

        return Inertia::render('Admin/HomeBuilder/Index', [
            'sections' => $secciones->map(fn (HomeSection $s) => $this->serialize($s, $enLaTienda[$s->id] ?? []))->values(),
            'resumen'  => [
                'total'       => $secciones->count(),
                'encendidas'  => $secciones->where('active', true)->count(),
                'se_ven'      => collect($enLaTienda)->where('se_ve', true)->count(),
                'disponibles' => $contexto['disponibles']->count(),
            ],
            // Las vitrinas armadas a mano en Tienda online → Colecciones, para «Colección de productos»
            'colecciones' => CatalogCollection::paraEnlaces(),
            'categorias'  => $contexto['categorias'],
        ]);
    }

    public function update(Request $request, HomeSection $homeSection): RedirectResponse
    {
        $validated = $request->validate([
            'label'          => 'sometimes|string|max:100',
            'active'         => 'sometimes|boolean',
            'settings'       => 'sometimes|array',
            'publicar_desde' => 'sometimes|nullable|date',
            'publicar_hasta' => 'sometimes|nullable|date|after:publicar_desde',
        ], [
            'publicar_hasta.after' => 'La fecha de fin tiene que ser posterior a la de inicio.',
        ]);

        if (isset($validated['settings'])) {
            $validated['settings'] = $this->sanitizeSettings($homeSection->type, $validated['settings']);
        }

        $homeSection->update($validated);

        $nombre = ($homeSection->settings['titulo'] ?? '') ?: $homeSection->label;
        $mensaje = array_key_exists('active', $validated)
            ? ($validated['active'] ? "«{$nombre}» se muestra en la tienda." : "«{$nombre}» quedó apagada.")
            : 'Sección guardada.';

        return back()->with('success', $mensaje);
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'orden'         => 'required|array',
            'orden.*.id'    => 'required|integer|exists:home_sections,id',
            'orden.*.orden' => 'required|integer|min:0',
        ]);

        foreach ($validated['orden'] as $fila) {
            HomeSection::where('id', $fila['id'])->update(['orden' => $fila['orden']]);
        }

        return back();
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private function serialize(HomeSection $section, array $tienda): array
    {
        return [
            'id'             => $section->id,
            'type'           => $section->type,
            'label'          => $section->label,
            'titulo'         => ($section->settings['titulo'] ?? '') ?: $section->label,
            'active'         => $section->active,
            'orden'          => $section->orden,
            'settings'       => $section->settings ?? [],
            'publicar_desde' => $section->publicar_desde?->toDateString(),
            'publicar_hasta' => $section->publicar_hasta?->toDateString(),
            'editable'       => ! empty(self::TYPE_SETTINGS[$section->type]),
            'se_ve'          => $tienda['se_ve'] ?? false,
            'cantidad'       => $tienda['cantidad'] ?? null,
            'motivo'         => $tienda['motivo'] ?? null,
        ];
    }

    /** Publicaciones a la venta y el contenido de los otros módulos, en pocas consultas. */
    private function contexto(): array
    {
        $pubs = CatalogoPublicacion::publicadoAhora()->get();
        CatalogoPublicacion::precargarInventario($pubs);

        // Mismos nombres de campo que usa la tienda, para compartir la regla de cada sección
        $disponibles = $pubs
            ->filter(fn (CatalogoPublicacion $p) => $p->productoDisponible())
            ->map(fn (CatalogoPublicacion $p) => [
                'id'          => $p->id,
                'key'         => "{$p->producto_tipo}:{$p->producto_id}",
                'category'    => $p->categoria,
                'condition'   => $p->condicion,
                'is_myskin'   => $p->esMyskin(),
                'is_featured' => (bool) $p->destacado,
                'promo_price' => $p->promocionActiva() ? (float) $p->precio_promocional : null,
            ])
            ->values();

        $colecciones = CatalogCollection::active()
            ->with('publicaciones:catalogo_publicaciones.id')
            ->get()
            ->keyBy('id');

        $categorias = CatalogCategory::active()
            ->whereIn('slug', HomeSection::CATEGORY_OPTIONS)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (CatalogCategory $c) => [
                'value'    => $c->slug,
                'label'    => $c->name,
                'cantidad' => $disponibles->where('is_myskin', false)->where('category', $c->slug)->count(),
            ])
            ->values()
            ->all();

        return [
            'disponibles' => $disponibles,
            'colecciones' => $colecciones,
            'categorias'  => $categorias,
            'ubicaciones' => StoreLocation::active()->count(),
            'servicios'   => StoreService::active()->count(),
            'faqs'        => count(Faq::deLugar('general')),
            'novedades'   => Novedad::published()->count(),
            'resenas'     => \App\Models\Resena::publicadas()->count(),
            'conAccesos'  => CatalogCategory::forHome()->get()
                ->filter(fn (CatalogCategory $c) => $disponibles->where('category', $c->slug)->count() > 0
                    || ($c->is_myskin && $disponibles->where('is_myskin', true)->count() > 0))
                ->count(),
        ];
    }

    /**
     * Qué muestra hoy cada sección en la tienda, con la misma cuenta que hace la portada: las vitrinas armadas a
     * mano se reservan sus productos y, de ahí en adelante, cada producto sale una sola vez.
     */
    private function loQueMuestraCadaUna(Collection $secciones, array $contexto): array
    {
        $ahora    = Carbon::now();
        $enVigor  = fn (HomeSection $s) => $s->active
            && ($s->publicar_desde === null || $s->publicar_desde->lte($ahora))
            && ($s->publicar_hasta === null || $s->publicar_hasta->gte($ahora));

        $lista = fn (HomeSection $s) => HomeSection::filtrar(
            $s->type,
            $s->settings ?? [],
            $contexto['disponibles'],
            $this->idsDeColeccion($s, $contexto),
        )->take(HomeSection::limite($s->type, $s->settings['limit'] ?? null));

        $visibles = $secciones->filter($enVigor)->sortBy('orden');
        $vistos   = [];

        // Las vitrinas se reservan sus productos antes que nadie (igual que en la tienda)
        foreach ($visibles->where('type', 'product_collection') as $s) {
            foreach ($lista($s) as $p) {
                $vistos[$p['key']] = true;
            }
        }

        $resultado = [];
        foreach ($secciones as $s) {
            $conProductos = in_array($s->type, HomeSection::TIPOS_CON_PRODUCTOS, true);
            $propios      = $conProductos ? $lista($s) : collect();
            $cantidad     = $propios->count();

            if ($conProductos && $enVigor($s) && $s->type !== 'product_collection') {
                $nuevos   = $propios->reject(fn (array $p) => isset($vistos[$p['key']]));
                $cantidad = $nuevos->count();
                foreach ($nuevos as $p) {
                    $vistos[$p['key']] = true;
                }
            }

            $resultado[$s->id] = [
                'cantidad' => $conProductos ? $cantidad : null,
                'se_ve'    => $enVigor($s) && ($conProductos ? $cantidad > 0 : $this->tieneContenido($s, $contexto)),
                'motivo'   => $this->motivo($s, $contexto, $enVigor($s), $conProductos, $cantidad, $propios->count()),
            ];
        }

        return $resultado;
    }

    private function idsDeColeccion(HomeSection $s, array $contexto): ?Collection
    {
        if ($s->type !== 'product_collection') {
            return null;
        }

        $coleccion = $contexto['colecciones']->get((int) (($s->settings['collection_id'] ?? 0)));

        return $coleccion?->publicaciones->pluck('id');
    }

    /** Las secciones que no muestran productos: ¿hay algo que dibujar? */
    private function tieneContenido(HomeSection $s, array $contexto): bool
    {
        return match ($s->type) {
            'category_rail' => $contexto['conAccesos'] > 1,
            'faq'           => $contexto['faqs'] > 0,
            'services'      => $contexto['servicios'] > 0,
            'news'          => $contexto['novedades'] > 0,
            'reviews'       => $contexto['resenas'] > 0,
            'location'      => $contexto['ubicaciones'] > 0,
            default         => true,
        };
    }

    /** En una línea: por qué esta sección no se ve hoy en la tienda. */
    private function motivo(HomeSection $s, array $contexto, bool $enVigor, bool $conProductos, int $cantidad, int $propios): ?string
    {
        if (! $s->active) {
            return 'Apagada: no se muestra en la tienda.';
        }

        if (! $enVigor) {
            return $s->publicar_desde && $s->publicar_desde->isFuture()
                ? 'Programada: se muestra desde el ' . $s->publicar_desde->format('d/m/Y') . '.'
                : 'Su fecha ya terminó: no se muestra.';
        }

        if ($s->type === 'category_rail' && $contexto['conAccesos'] <= 1) {
            return 'Necesita al menos dos categorías marcadas para el inicio y con productos a la venta.';
        }

        if ($s->type === 'faq' && $contexto['faqs'] === 0) {
            return 'No hay preguntas cargadas para el inicio.';
        }

        if ($s->type === 'services' && $contexto['servicios'] === 0) {
            return 'No hay servicios encendidos.';
        }

        if ($s->type === 'news' && $contexto['novedades'] === 0) {
            return 'No hay novedades publicadas.';
        }

        if ($s->type === 'reviews' && $contexto['resenas'] === 0) {
            return 'No hay reseñas aprobadas.';
        }

        if ($s->type === 'location' && $contexto['ubicaciones'] === 0) {
            return 'No hay ubicaciones encendidas.';
        }

        if (! $conProductos || $cantidad > 0) {
            return null;
        }

        if ($propios > 0) {
            return 'Sus productos ya salen en una sección de más arriba: en el inicio cada producto aparece una sola vez.';
        }

        $categoria = collect($contexto['categorias'])->firstWhere('value', $s->settings['categoria'] ?? '');

        return match ($s->type) {
            'featured'           => 'Ninguna publicación está marcada como «Destacado».',
            'category_products'  => 'No hay productos a la venta en ' . ($categoria['label'] ?? 'esa categoría') . '.',
            'product_collection' => empty($s->settings['collection_id'])
                ? 'No elegiste qué colección mostrar.'
                : 'La colección elegida no tiene productos a la venta.',
            'myskin'             => 'No hay fundas MYSKIN a la venta.',
            'semiused'           => 'No hay equipos seminuevos ni Open Box a la venta.',
            'offers'             => 'Ninguna publicación tiene un precio promocional vigente.',
            default              => 'No hay productos a la venta.',
        };
    }

    /**
     * Filtra y sanitiza settings según el tipo de sección.
     * Solo se permiten los campos definidos en TYPE_SETTINGS para cada tipo.
     * Los campos desconocidos se descartan silenciosamente.
     */
    private function sanitizeSettings(string $type, array $settings): array
    {
        $schema = self::TYPE_SETTINGS[$type] ?? [];
        $clean  = [];

        foreach ($schema['text'] ?? [] as $field) {
            if (array_key_exists($field, $settings)) {
                $clean[$field] = strip_tags((string) $settings[$field]);
            }
        }

        foreach ($schema['url'] ?? [] as $field) {
            if (array_key_exists($field, $settings)) {
                $url = trim((string) $settings[$field]);
                $clean[$field] = preg_match('/^\s*(javascript|data|vbscript):/i', $url) ? '' : $url;
            }
        }

        foreach ($schema['integer'] ?? [] as $field) {
            if (array_key_exists($field, $settings)) {
                $val = filter_var($settings[$field], FILTER_VALIDATE_INT);
                if ($val !== false && $val > 0) {
                    $clean[$field] = $field === 'limit' ? min(12, $val) : $val;
                }
            }
        }

        foreach ($schema['enum'] ?? [] as $field => $allowed) {
            if (array_key_exists($field, $settings)) {
                $clean[$field] = in_array($settings[$field], $allowed, true)
                    ? $settings[$field]
                    : $allowed[0];
            }
        }

        return $clean;
    }
}
