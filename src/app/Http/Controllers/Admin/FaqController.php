<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\HomeSection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Preguntas frecuentes: lo que más te consultan antes de comprar, escrito una vez.
 *
 * Cada pregunta se muestra en un solo lugar (`Faq::LUGARES`): el final del inicio, la ficha de todos los productos,
 * la página de iPhone o la de Seminuevos. Si un lugar se queda sin preguntas encendidas, esa sección no se dibuja en
 * la tienda: no queda un título con un hueco debajo.
 */
class FaqController extends Controller
{
    public function index(): Response
    {
        $todas = Faq::orderBy('sort_order')->orderBy('id')->get();

        $lugares = collect(Faq::LUGARES)->map(function (array $meta, string $clave) use ($todas) {
            $suyas = $todas->where('scope', $clave);

            return [
                'clave'    => $clave,
                'label'    => $meta['label'],
                'donde'    => $meta['donde'],
                'url'      => $meta['url'],
                'total'    => $suyas->count(),
                'visibles' => $suyas->where('active', true)->count(),
            ];
        })->values()->all();

        $preguntas = collect(Faq::LUGARES)->mapWithKeys(fn (array $meta, string $clave) => [
            $clave => $todas->where('scope', $clave)->map(fn (Faq $f) => [
                'id'       => $f->id,
                'scope'    => $f->scope,
                'question' => $f->question,
                'answer'   => $f->answer,
                'resumen'  => Str::limit($f->answer, 120),
                'active'   => $f->active,
            ])->values()->all(),
        ])->all();

        // La sección del inicio se enciende en Portada: si está apagada, las preguntas de ahí no se ven
        $seccionInicio = HomeSection::where('type', 'faq')->first();

        return Inertia::render('Admin/Faqs/Index', [
            'lugares'   => $lugares,
            'preguntas' => $preguntas,
            'bloqueInicio' => $seccionInicio === null || $seccionInicio->active,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validar($request, [
            'scope'    => ['required', 'in:' . implode(',', array_keys(Faq::LUGARES))],
            'question' => 'required|string|max:500',
            'answer'   => 'required|string|max:2000',
        ]);

        $validated['sort_order'] = (int) Faq::where('scope', $validated['scope'])->max('sort_order') + 1;
        $validated['active']     = true;

        Faq::create($validated);

        return back()->with('success', 'Pregunta agregada.');
    }

    public function update(Request $request, Faq $faq): RedirectResponse
    {
        $validated = $this->validar($request, [
            'question' => 'sometimes|required|string|max:500',
            'answer'   => 'sometimes|required|string|max:2000',
            'active'   => 'sometimes|boolean',
        ]);

        $faq->update($validated);

        $mensaje = array_key_exists('active', $validated)
            ? ($validated['active'] ? 'La pregunta se ve en la tienda.' : 'La pregunta quedó oculta.')
            : 'Pregunta guardada.';

        return back()->with('success', $mensaje);
    }

    public function destroy(Faq $faq): RedirectResponse
    {
        $faq->delete();

        return back()->with('success', 'Se borró la pregunta.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'orden'         => 'required|array',
            'orden.*.id'    => 'required|integer|exists:faqs,id',
            'orden.*.orden' => 'required|integer|min:0',
        ]);

        foreach ($validated['orden'] as $fila) {
            Faq::where('id', $fila['id'])->update(['sort_order' => $fila['orden']]);
        }

        return back();
    }

    /** Copia a otro lugar las preguntas que allá no estén. */
    public function copiar(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'desde' => ['required', 'in:' . implode(',', array_keys(Faq::LUGARES))],
            'hacia' => ['required', 'different:desde', 'in:' . implode(',', array_keys(Faq::LUGARES))],
        ]);

        $todas   = Faq::orderBy('sort_order')->get();
        $yaEstan = $todas->where('scope', $validated['hacia'])->pluck('question')->flip();
        $orden   = (int) $todas->where('scope', $validated['hacia'])->max('sort_order') + 1;
        $copiadas = 0;

        foreach ($todas->where('scope', $validated['desde'])->where('active', true) as $faq) {
            if (isset($yaEstan[$faq->question])) {
                continue;
            }

            Faq::create([
                'scope'      => $validated['hacia'],
                'question'   => $faq->question,
                'answer'     => $faq->answer,
                'active'     => true,
                'sort_order' => $orden++,
            ]);
            $copiadas++;
        }

        return back()->with('success', $copiadas === 0
            ? 'No había nada nuevo que copiar: ese lugar ya tiene esas preguntas.'
            : ($copiadas === 1 ? 'Se copió 1 pregunta.' : "Se copiaron {$copiadas} preguntas."));
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    /** La pregunta y la respuesta se guardan como texto simple: la tienda las muestra tal cual. */
    private function validar(Request $request, array $reglas): array
    {
        $validated = $request->validate($reglas);

        foreach (['question', 'answer'] as $campo) {
            if (array_key_exists($campo, $validated)) {
                $validated[$campo] = trim(strip_tags((string) $validated[$campo]));
            }
        }

        return $validated;
    }
}
