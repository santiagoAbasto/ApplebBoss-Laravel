<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CatalogCollection;
use App\Models\ConfiguracionTienda;
use App\Models\HomeSection;
use App\Models\StoreService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Servicios: las tarjetas de «Nuestros servicios» del inicio, con lo que ofreces además de vender.
 *
 * Cada tarjeta puede solo informar, abrir WhatsApp con un mensaje sobre ese servicio o llevar a una página. La sección
 * se enciende, se mueve y se le cambia el título en Portada; sin tarjetas encendidas, la tienda no la dibuja. No es
 * «Servicio técnico» (las órdenes de reparación).
 */
class ServiceController extends Controller
{
    public function index(): Response
    {
        $whatsapp  = StoreService::whatsappActivo();
        $servicios = StoreService::orderBy('sort_order')->orderBy('id')->get();
        $visibles  = $servicios->where('active', true);

        return Inertia::render('Admin/Services/Index', [
            'servicios' => $servicios->map(fn (StoreService $s) => $this->fila($s, $whatsapp))->values(),
            'resumen'   => [
                'total'     => $servicios->count(),
                'visibles'  => $visibles->count(),
                'ocultos'   => $servicios->count() - $visibles->count(),
                'con_boton' => $visibles->filter(fn (StoreService $s) => $s->accionEnTienda($whatsapp) !== 'ninguna')->count(),
            ],
            'seccion'  => $this->seccionDelInicio(),
            'whatsapp' => $whatsapp,
            // El saludo lleva el nombre de la tienda de Configuración: el panel muestra el mensaje tal cual sale
            'saludo'   => ConfiguracionTienda::saludoWhatsapp(),
            'acciones' => collect(StoreService::ACCIONES)
                ->map(fn (array $a, string $clave) => ['value' => $clave, 'label' => $a['label'], 'boton' => $a['boton']])
                ->values(),
            // Destinos para «Lleva a una página»: las colecciones (las páginas informativas llegan compartidas)
            'colecciones' => CatalogCollection::paraEnlaces(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validar($request, [
            'icon'        => ['required', Rule::in(StoreService::ICONOS)],
            'title'       => 'required|string|max:120',
            'description' => 'nullable|string|max:300',
            'accion'      => ['required', Rule::in(array_keys(StoreService::ACCIONES))],
            'enlace'      => 'nullable|required_if:accion,enlace|string|max:500',
            'boton'       => 'nullable|string|max:40',
        ]);

        $validated['sort_order'] = (int) StoreService::max('sort_order') + 1;
        $validated['active']     = true;

        StoreService::create($validated);

        return back()->with('success', 'Servicio agregado: ya se ve en la tienda.');
    }

    public function update(Request $request, StoreService $service): RedirectResponse
    {
        $validated = $this->validar($request, [
            'icon'        => ['sometimes', 'required', Rule::in(StoreService::ICONOS)],
            'title'       => 'sometimes|required|string|max:120',
            'description' => 'sometimes|nullable|string|max:300',
            'accion'      => ['sometimes', 'required', Rule::in(array_keys(StoreService::ACCIONES))],
            'enlace'      => 'sometimes|nullable|required_if:accion,enlace|string|max:500',
            'boton'       => 'sometimes|nullable|string|max:40',
            'active'      => 'sometimes|boolean',
        ]);

        $service->update($validated);

        $mensaje = array_key_exists('active', $validated) && count($validated) === 1
            ? ($validated['active'] ? 'El servicio se ve en la tienda.' : 'El servicio quedó oculto.')
            : 'Servicio guardado.';

        return back()->with('success', $mensaje);
    }

    public function destroy(StoreService $service): RedirectResponse
    {
        $service->delete();

        return back()->with('success', 'Se borró el servicio.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'orden'         => 'required|array',
            'orden.*.id'    => 'required|integer|exists:store_services,id',
            'orden.*.orden' => 'required|integer|min:0',
        ]);

        foreach ($validated['orden'] as $fila) {
            StoreService::where('id', $fila['id'])->update(['sort_order' => $fila['orden']]);
        }

        return back();
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private function fila(StoreService $s, bool $whatsapp): array
    {
        return [
            'id'          => $s->id,
            'icon'        => $s->icon,
            'title'       => $s->title,
            'description' => $s->description,
            'accion'      => $s->accion,
            'enlace'      => $s->enlace,
            'boton'       => $s->boton,
            'active'      => $s->active,
            // Lo que muestra de verdad la tienda, y por qué no si no coincide
            'en_tienda'   => $s->accionEnTienda($whatsapp),
            'texto_boton' => $s->textoBoton(),
            'mensaje'     => $s->mensajeWhatsapp(),
            'aviso'       => match (true) {
                $s->accion === 'whatsapp' && ! $whatsapp => 'El WhatsApp de la tienda está apagado: la tarjeta se ve sin su botón.',
                $s->accion === 'enlace' && blank($s->enlace) => 'No tiene a dónde llevar: la tarjeta se ve sin su botón.',
                default => null,
            },
        ];
    }

    /** La sección del inicio donde salen las tarjetas: está en Portada y ahí se enciende. */
    private function seccionDelInicio(): array
    {
        $seccion = HomeSection::where('type', 'services')->first();

        if ($seccion === null) {
            return ['estado' => 'no_existe', 'titulo' => 'Nuestros servicios', 'subtitulo' => null, 'fecha' => null];
        }

        $ahora = Carbon::now();
        $estado = match (true) {
            ! $seccion->active => 'apagada',
            $seccion->publicar_desde !== null && $seccion->publicar_desde->gt($ahora) => 'programada',
            $seccion->publicar_hasta !== null && $seccion->publicar_hasta->lt($ahora) => 'vencida',
            default => 'encendida',
        };

        return [
            'estado'    => $estado,
            'titulo'    => ($seccion->settings['titulo'] ?? '') ?: 'Nuestros servicios',
            'subtitulo' => ($seccion->settings['subtitle'] ?? '') ?: null,
            'fecha'     => $estado === 'programada' ? $seccion->publicar_desde->format('d/m/Y') : null,
        ];
    }

    /**
     * Los textos se guardan limpios (la tienda los muestra tal cual). Si la tarjeta solo informa no guarda botón, y si
     * no lleva a una página no guarda dirección: lo que no se usa no queda escondido en la base.
     */
    private function validar(Request $request, array $reglas): array
    {
        $validated = $request->validate($reglas, [
            'icon.in'            => 'Elige uno de los íconos de la lista.',
            'accion.in'          => 'Elige qué pasa cuando el cliente toca la tarjeta.',
            'enlace.required_if' => 'Elige a dónde lleva el botón.',
        ]);

        foreach (['title', 'description', 'boton'] as $campo) {
            if (array_key_exists($campo, $validated)) {
                $validated[$campo] = trim(strip_tags((string) $validated[$campo])) ?: null;
            }
        }

        if (array_key_exists('title', $validated) && $validated['title'] === null) {
            throw ValidationException::withMessages(['title' => 'Escribe el nombre del servicio.']);
        }

        if (array_key_exists('enlace', $validated)) {
            $enlace = trim((string) $validated['enlace']);
            if (preg_match('/^\s*(javascript|data|vbscript):/i', $enlace)) {
                throw ValidationException::withMessages(['enlace' => 'Esa dirección no se puede usar.']);
            }
            $validated['enlace'] = $enlace ?: null;
        }

        if (array_key_exists('accion', $validated)) {
            if ($validated['accion'] !== 'enlace') {
                $validated['enlace'] = null;
            }
            if ($validated['accion'] === 'ninguna') {
                $validated['boton'] = null;
            }
        }

        return $validated;
    }
}
