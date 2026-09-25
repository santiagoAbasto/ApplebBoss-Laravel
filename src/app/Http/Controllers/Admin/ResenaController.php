<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use App\Models\Resena;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Reseñas.
 *
 * Las que dejan los clientes al recibir su pedido llegan acá esperando aprobación. Las que la tienda recibió por
 * otro lado (Google, Facebook, WhatsApp, en el local) se cargan a mano, con el enlace a la original cuando existe.
 * Solo las aprobadas se ven en el inicio.
 */
class ResenaController extends Controller
{
    public function index(): Response
    {
        $todas = Resena::with('pedido:id,codigo')
            ->orderBy('publicada')          // primero las que esperan aprobación
            ->orderBy('orden')->orderByDesc('fecha')->orderByDesc('id')
            ->get();

        $publicadas = $todas->where('publicada', true);
        $seccion = HomeSection::where('type', 'reviews')->first();

        return Inertia::render('Admin/Resenas/Index', [
            'resenas' => $todas->map(fn (Resena $r) => [
                'id'           => $r->id,
                'nombre'       => $r->nombre,
                'firma'        => $r->firma(),
                'calificacion' => $r->calificacion,
                'texto'        => $r->texto,
                'fuente'       => $r->fuente,
                'enlace'       => $r->enlace,
                'producto'     => $r->producto,
                'fecha'        => $r->fecha?->toDateString(),
                'publicada'    => $r->publicada,
                'pedido'       => $r->pedido ? ['id' => $r->pedido->id, 'codigo' => $r->pedido->codigo] : null,
            ])->values()->all(),
            'fuentes' => collect(Resena::FUENTES)->map(fn ($l, $v) => ['valor' => $v, 'etiqueta' => $l])->values()->all(),
            'fuentesAMano' => array_keys(Resena::FUENTES_A_MANO),
            'resumen' => [
                'publicadas' => $publicadas->count(),
                'pendientes' => $todas->where('publicada', false)->count(),
                'promedio'   => $publicadas->count() ? round($publicadas->avg('calificacion'), 1) : null,
            ],
            // La sección del inicio se enciende en Portada: si está apagada, las aprobadas no se ven
            'bloqueInicio' => $seccion === null || $seccion->active,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);
        $datos['orden'] = (int) Resena::max('orden') + 1;

        Resena::create($datos);

        return back()->with('success', $datos['publicada'] ?? false ? 'Reseña publicada.' : 'Reseña guardada sin publicar.');
    }

    public function update(Request $request, Resena $resena): RedirectResponse
    {
        // Solo encender o apagar
        if ($request->keys() === ['publicada']) {
            $resena->update(['publicada' => $request->boolean('publicada')]);

            return back()->with('success', $resena->publicada ? 'La reseña ya se ve en la tienda.' : 'La reseña quedó oculta.');
        }

        $datos = $this->validar($request, $resena);

        // La de una compra verificada no cambia de origen: su valor es justamente ese
        if ($resena->pedido_id !== null) {
            unset($datos['fuente'], $datos['producto']);
        }

        $resena->update($datos);

        return back()->with('success', 'Reseña guardada.');
    }

    public function destroy(Resena $resena): RedirectResponse
    {
        $resena->delete();

        return back()->with('success', 'Se borró la reseña.');
    }

    /** Todo se guarda como texto simple: la tienda lo muestra tal cual. */
    private function validar(Request $request, ?Resena $resena = null): array
    {
        $datos = $request->validate([
            'nombre'       => ['required', 'string', 'max:80'],
            'calificacion' => ['required', 'integer', 'between:1,5'],
            'texto'        => ['required', 'string', 'min:10', 'max:1000'],
            // «Compra en la web» solo la pone el sistema, cuando la deja quien recibió su pedido
            'fuente'       => ['required', Rule::in($resena?->pedido_id ? array_keys(Resena::FUENTES) : array_keys(Resena::FUENTES_A_MANO))],
            'enlace'       => ['nullable', 'url:https', 'max:300'],
            'producto'     => ['nullable', 'string', 'max:120'],
            'fecha'        => ['required', 'date', 'before_or_equal:today'],
            'publicada'    => ['sometimes', 'boolean'],
        ], [], ['calificacion' => 'calificación', 'enlace' => 'enlace a la reseña original']);

        foreach (['nombre', 'texto', 'producto'] as $campo) {
            if (isset($datos[$campo])) {
                $datos[$campo] = trim(strip_tags((string) $datos[$campo]));
            }
        }

        return $datos;
    }
}
