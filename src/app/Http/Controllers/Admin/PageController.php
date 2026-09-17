<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NavMenuItem;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Páginas: las páginas de solo texto de la tienda (Nosotros, Garantía, Envíos…).
 *
 * Cada una vive en /paginas/… y aparece sola en la columna «Información» del pie de página, salvo que se le ponga un
 * enlace propio en «Menú». No llevan productos ni formularios: son texto para explicar algo al cliente.
 */
class PageController extends Controller
{
    /** Campos de texto libre que se guardan sin etiquetas HTML. */
    private const TEXTOS = ['title', 'meta_title', 'meta_description'];

    public function index(): Response
    {
        $enlaces = NavMenuItem::where('active', true)->get();

        $paginas = Page::orderBy('sort_order')->orderBy('title')->get()
            ->map(fn (Page $p) => $this->fila($p, $enlaces))
            ->values();

        return Inertia::render('Admin/Pages/Index', [
            'paginas' => $paginas,
            'resumen' => [
                'total'    => $paginas->count(),
                'visibles' => $paginas->where('active', true)->count(),
                'vacias'   => $paginas->where('active', true)->where('vacia', true)->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate(['title' => 'required|string|max:255']);
        $titulo    = strip_tags($validated['title']);

        $page = Page::create([
            'title'      => $titulo,
            'slug'       => $this->slugLibre($titulo),
            'content'    => null,
            'active'     => false,
            'sort_order' => (int) Page::max('sort_order') + 1,
        ]);

        return redirect()->route('admin.pages.edit', $page)
            ->with('success', 'Página creada. Escribe su texto y enciéndela cuando esté lista.');
    }

    public function edit(Page $page): Response
    {
        return Inertia::render('Admin/Pages/Edit', [
            'page' => [
                'id'               => $page->id,
                'slug'             => $page->slug,
                'title'            => $page->title,
                'content'          => $page->content ?? '',
                'meta_title'       => $page->meta_title ?? '',
                'meta_description' => $page->meta_description ?? '',
                'active'           => $page->active,
                'url'              => $page->urlPublica(),
            ],
            'donde'  => $this->donde($page, NavMenuItem::where('active', true)->get()),
            'google' => ['url' => url($page->urlPublica()), 'sufijo' => Page::SUFIJO_GOOGLE],
        ]);
    }

    public function update(Request $request, Page $page): RedirectResponse
    {
        // La dirección (slug) no se recibe: es el enlace que se comparte y el que usan los menús
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'content'          => 'nullable|string',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'active'           => 'boolean',
        ]);

        // Texto simple (sin formato): cada párrafo separado por una línea en blanco
        if (isset($validated['content']) && $validated['content'] === strip_tags($validated['content'])) {
            $validated['content'] = collect(preg_split('/\R{2,}/', trim($validated['content'])))
                ->map(fn ($p) => trim($p))->filter()
                ->map(fn ($p) => '<p>' . nl2br(e($p), false) . '</p>')
                ->implode("\n");
        }

        if (isset($validated['content'])) {
            $validated['content'] = $this->sanitizeRichText($validated['content']) ?: null;
        }

        foreach (self::TEXTOS as $campo) {
            if (array_key_exists($campo, $validated)) {
                $validated[$campo] = strip_tags((string) $validated[$campo]) ?: null;
            }
        }

        $page->update($validated);

        return back()->with('success', 'Página guardada.');
    }

    /** El interruptor del listado: mostrarla o esconderla de la tienda. */
    public function visibilidad(Request $request, Page $page): RedirectResponse
    {
        $validated = $request->validate(['active' => 'required|boolean']);
        $page->update($validated);

        return back()->with('success', $validated['active']
            ? "«{$page->title}» ya se puede abrir en la tienda."
            : "«{$page->title}» quedó oculta: quien entre verá «página no encontrada».");
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'orden'         => 'required|array',
            'orden.*.id'    => 'required|integer|exists:pages,id',
            'orden.*.orden' => 'required|integer|min:0',
        ]);

        foreach ($validated['orden'] as $fila) {
            Page::where('id', $fila['id'])->update(['sort_order' => $fila['orden']]);
        }

        return back();
    }

    /** Borra la página. Los enlaces del menú que llevaban a ella se ocultan para no dejar enlaces rotos. */
    public function destroy(Page $page): RedirectResponse
    {
        $nombre  = $page->title;
        $enlaces = NavMenuItem::where('url', $page->urlPublica())->where('active', true)->get();

        foreach ($enlaces as $enlace) {
            $enlace->update(['active' => false]);
        }

        $page->delete();

        $aviso = $enlaces->isEmpty() ? '' : ($enlaces->count() === 1
            ? ' Se ocultó el enlace del menú que llevaba a ella.'
            : " Se ocultaron los {$enlaces->count()} enlaces del menú que llevaban a ella.");

        return redirect()->route('admin.pages.index')->with('success', "Se borró «{$nombre}».{$aviso}");
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private function fila(Page $page, Collection $enlaces): array
    {
        // Las etiquetas se cambian por un espacio: si no, «<h2>Sobre</h2><p>Somos…» quedaría pegado
        $texto = trim(preg_replace('/\s+/u', ' ', strip_tags(preg_replace('/<[^>]+>/', ' ', (string) $page->content))));

        return [
            'id'          => $page->id,
            'slug'        => $page->slug,
            'title'       => $page->title,
            'active'      => $page->active,
            'url'         => $page->urlPublica(),
            'letras'      => mb_strlen($texto),
            'vacia'       => $texto === '',
            'resumen'     => Str::limit($texto, 90),
            'actualizado' => $page->updated_at?->diffForHumans(),
            'donde'       => $this->donde($page, $enlaces),
        ];
    }

    /** Dónde figura la página: siempre en el pie, y en los menús donde le hayan puesto un enlace. */
    private function donde(Page $page, Collection $enlaces): array
    {
        $activos = $enlaces->pluck('id')->flip();
        $url     = $page->urlPublica();

        $menus = $enlaces
            ->filter(fn (NavMenuItem $m) => ($m->parent_id === null || isset($activos[$m->parent_id]))
                && rtrim((string) parse_url((string) $m->url, PHP_URL_PATH), '/') === $url)
            ->groupBy('slot')
            ->map(fn (Collection $items, string $slot) => [
                'slot'  => $slot,
                'label' => MenuController::MENUS[$slot] ?? $slot,
            ])
            ->values()
            ->all();

        return [
            // Sin enlace propio en el pie, la tienda la lista sola en la columna «Información»
            'en_informacion' => $page->active && ! collect($menus)->contains('slot', 'footer'),
            'menus'          => $menus,
        ];
    }

    /** El título manda: la dirección se arma con él y después no se cambia. */
    private function slugLibre(string $titulo): string
    {
        $base = Str::slug($titulo) ?: 'pagina';
        $slug = $base;
        $n    = 2;

        while (Page::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $n++;
        }

        return $slug;
    }

    private function sanitizeRichText(?string $html): ?string
    {
        if (blank($html)) {
            return $html;
        }

        $allowed = '<p><br><strong><b><em><i><ul><ol><li><h2><h3><h4><a>';
        $clean = strip_tags($html, $allowed);

        $clean = preg_replace_callback('/<(?!a\b|\/a)[a-z][a-z0-9]*\b([^>]*)>/i', function ($m) {
            preg_match('/^<([a-z][a-z0-9]*)/i', $m[0], $tagMatch);
            $tag = strtolower($tagMatch[1]);
            return "<{$tag}>";
        }, $clean);

        $clean = preg_replace_callback('/<a\b([^>]*)>/i', function ($m) {
            $attrs = $m[1];
            $href  = '';
            $extra = '';

            if (preg_match('/\bhref\s*=\s*["\']([^"\']*)["\']/', $attrs, $h)) {
                $url = trim($h[1]);
                if (! preg_match('/^\s*(javascript|data|vbscript):/i', $url)) {
                    $href = ' href="' . htmlspecialchars($url, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"';
                }
            }

            if (preg_match('/\btarget=["\']_blank["\']/i', $attrs)) {
                $extra = ' target="_blank" rel="noopener noreferrer"';
            }

            return '<a' . $href . $extra . '>';
        }, $clean);

        // Si solo quedaron etiquetas vacías, la página está en blanco
        return trim(strip_tags($clean)) === '' ? null : $clean;
    }
}
