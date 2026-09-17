<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CatalogCollection;
use App\Models\NavMenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Menú: los enlaces con los que el cliente se mueve por la tienda.
 *
 * Hay tres menús y son independientes, porque no se ven en el mismo lugar:
 *  · «Arriba, en la computadora»: la barra de arriba. Es el único que admite opciones adentro (se abren al pasar el mouse).
 *  · «En el celular»: la lista que sale al tocar el botón del menú. Es plana: no muestra opciones adentro.
 *  · «Abajo, en el pie de página»: los enlaces del final, repartidos en columnas.
 *
 * Si un menú se queda sin enlaces encendidos, la tienda muestra uno armado de fábrica para no dejar al cliente sin
 * por dónde moverse.
 */
class MenuController extends Controller
{
    /** Los tres menús de la tienda, con su nombre en el panel. */
    public const MENUS = [
        'header' => 'Arriba, en la computadora',
        'mobile' => 'En el celular',
        'footer' => 'Abajo, en el pie de página',
    ];

    /** Columna por defecto del pie de página cuando no se elige ninguna. */
    private const COLUMNA_POR_DEFECTO = 'Comprar';

    public function index(Request $request): Response
    {
        $items = NavMenuItem::orderBy('sort_order')->get();
        // Se puede llegar directo a un menú: /admin/sitio/menus?menu=footer
        $elegido = (string) $request->string('menu');

        $menus = [];
        foreach (array_keys(self::MENUS) as $slot) {
            $menus[$slot] = $items
                ->where('slot', $slot)
                ->whereNull('parent_id')
                ->map(fn (NavMenuItem $item) => $this->fila($item, $items))
                ->values()
                ->all();
        }

        return Inertia::render('Admin/Menus/Index', [
            'menus'       => $menus,
            'slotInicial' => isset(self::MENUS[$elegido]) ? $elegido : 'header',
            'resumen' => collect($menus)->map(fn (array $lista) => [
                'total'     => count($lista),
                'visibles'  => collect($lista)->where('active', true)->count(),
                'sin_ellos' => collect($lista)->where('active', true)->count() === 0,
            ])->all(),
            // Enlaces que están en otro menú y faltan en este: el botón «Copiar» los trae
            'faltantes'   => $this->faltantes($items),
            'columnas'    => $this->columnas($items),
            // Las colecciones activas aparecen como destino en «¿A dónde lleva?»
            'colecciones' => CatalogCollection::paraEnlaces(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validar($request, [
            'slot'      => ['required', 'in:' . implode(',', array_keys(self::MENUS))],
            'parent_id' => 'nullable|integer|exists:nav_menu_items,id',
            'label'     => 'required|string|max:120',
        ]);

        // Una opción adentro solo existe en el menú de arriba y siempre cuelga de un enlace de ese mismo menú
        if (! empty($validated['parent_id'])) {
            $padre = NavMenuItem::findOrFail($validated['parent_id']);
            abort_unless($padre->slot === 'header' && $padre->parent_id === null, 422);
            $validated['slot'] = 'header';
        }

        $validated['sort_order'] = $this->siguienteOrden($validated['slot'], $validated['parent_id'] ?? null);
        $validated['active']     = true;

        NavMenuItem::create($validated);

        return back()->with('success', "Se agregó «{$validated['label']}».");
    }

    public function update(Request $request, NavMenuItem $menuItem): RedirectResponse
    {
        $validated = $this->validar($request, [
            'label'  => 'sometimes|required|string|max:120',
            'active' => 'sometimes|boolean',
        ]);

        $menuItem->update($validated);

        $mensaje = array_key_exists('active', $validated)
            ? ($validated['active'] ? "«{$menuItem->label}» se ve en la tienda." : "«{$menuItem->label}» quedó oculto.")
            : 'Enlace guardado.';

        return back()->with('success', $mensaje);
    }

    public function destroy(NavMenuItem $menuItem): RedirectResponse
    {
        $nombre = $menuItem->label;
        $hijos  = $menuItem->children()->count();
        $menuItem->children()->delete();
        $menuItem->delete();

        return back()->with('success', $hijos > 0
            ? "Se quitó «{$nombre}» y sus {$hijos} opciones."
            : "Se quitó «{$nombre}».");
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'orden'         => 'required|array',
            'orden.*.id'    => 'required|integer|exists:nav_menu_items,id',
            'orden.*.orden' => 'required|integer|min:0',
        ]);

        foreach ($validated['orden'] as $fila) {
            NavMenuItem::where('id', $fila['id'])->update(['sort_order' => $fila['orden']]);
        }

        return back();
    }

    /** Trae a un menú los enlaces que ya están en otro. No copia las opciones de adentro: solo el menú de arriba las muestra. */
    public function copiar(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'desde' => ['required', 'in:' . implode(',', array_keys(self::MENUS))],
            'hacia' => ['required', 'different:desde', 'in:' . implode(',', array_keys(self::MENUS))],
        ]);

        $items   = NavMenuItem::orderBy('sort_order')->get();
        $yaEstan = $items->where('slot', $validated['hacia'])->whereNull('parent_id')->pluck('url')->filter()->flip();
        $columna = $this->columnas($items)[0] ?? self::COLUMNA_POR_DEFECTO;
        $orden   = $this->siguienteOrden($validated['hacia'], null);
        $copiados = 0;

        foreach ($items->where('slot', $validated['desde'])->whereNull('parent_id')->where('active', true) as $item) {
            if (! $item->url || isset($yaEstan[$item->url])) {
                continue;
            }

            NavMenuItem::create([
                'slot'            => $validated['hacia'],
                'label'           => $item->label,
                'url'             => $item->url,
                'group'           => $validated['hacia'] === 'footer' ? $columna : null,
                'myskin'          => $item->myskin,
                'open_in_new_tab' => $item->open_in_new_tab,
                'active'          => true,
                'sort_order'      => $orden++,
            ]);
            $copiados++;
        }

        return back()->with('success', $copiados === 0
            ? 'No había nada nuevo que copiar: ese menú ya tiene todos esos enlaces.'
            : ($copiados === 1 ? 'Se copió 1 enlace.' : "Se copiaron {$copiados} enlaces."));
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    /** Validación común: el texto se limpia y la dirección no puede ser un enlace peligroso. */
    private function validar(Request $request, array $reglas): array
    {
        $validated = $request->validate($reglas + [
            'url'             => 'sometimes|nullable|string|max:500',
            'group'           => 'sometimes|nullable|string|max:80',
            'open_in_new_tab' => 'sometimes|boolean',
            'myskin'          => 'sometimes|boolean',
        ]);

        if (array_key_exists('label', $validated)) {
            $validated['label'] = strip_tags($validated['label']);
        }

        if (array_key_exists('url', $validated)) {
            $url = trim((string) $validated['url']);
            if (preg_match('/^\s*(javascript|data|vbscript):/i', $url)) {
                throw ValidationException::withMessages(['url' => 'Esa dirección no se puede usar.']);
            }
            $validated['url'] = $url ?: null;
        }

        if (array_key_exists('group', $validated)) {
            $validated['group'] = strip_tags((string) $validated['group']) ?: null;
        }

        return $validated;
    }

    private function siguienteOrden(string $slot, ?int $parentId): int
    {
        return (int) NavMenuItem::where('slot', $slot)
            ->where('parent_id', $parentId)
            ->max('sort_order') + 1;
    }

    private function fila(NavMenuItem $item, Collection $todos): array
    {
        return [
            'id'              => $item->id,
            'slot'            => $item->slot,
            'parent_id'       => $item->parent_id,
            'label'           => $item->label,
            'url'             => $item->url,
            'group'           => $item->group,
            'myskin'          => $item->myskin,
            'open_in_new_tab' => $item->open_in_new_tab,
            'active'          => $item->active,
            'externo'         => $item->url !== null && preg_match('#^(https?:)?//#i', $item->url) === 1,
            'children'        => $todos
                ->where('parent_id', $item->id)
                ->map(fn (NavMenuItem $hijo) => $this->fila($hijo, $todos))
                ->values()
                ->all(),
        ];
    }

    /** Las columnas del pie de página que ya existen, para elegir de una lista en vez de escribirlas. */
    private function columnas(Collection $items): array
    {
        return $items->where('slot', 'footer')
            ->pluck('group')
            ->filter()
            ->unique()
            ->values()
            ->all() ?: [self::COLUMNA_POR_DEFECTO];
    }

    /**
     * Cuántos enlaces le faltan a un menú respecto del otro. Solo se comparan el de la computadora y el del celular:
     * son la misma navegación en dos pantallas y deberían decir lo mismo. El pie de página lleva otros enlaces a
     * propósito (ayuda, información), así que no se compara con nadie.
     */
    private function faltantes(Collection $items): array
    {
        $urls = fn (string $slot) => $items->where('slot', $slot)->whereNull('parent_id')->where('active', true)
            ->pluck('url')->filter()->unique();

        $arriba  = $urls('header');
        $celular = $urls('mobile');

        return array_filter([
            'header' => array_filter(['mobile' => $celular->diff($arriba)->count()]),
            'mobile' => array_filter(['header' => $arriba->diff($celular)->count()]),
            'footer' => [],
        ]);
    }
}
