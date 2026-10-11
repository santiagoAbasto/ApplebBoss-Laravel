<?php

namespace App\Http\Controllers;

use App\Models\EventoWeb;
use App\Support\Trafico\Medicion;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * POST /api/eventos: la tienda avisa una página vista o una acción (navigator.sendBeacon, sin cookies).
 * Solo del propio sitio, con cuerpo chico y límite por visitante. Siempre responde sin contenido.
 */
class EventoWebController extends Controller
{
    private const MAX_BYTES = 2048;

    public function store(Request $request): Response
    {
        $origen = $request->headers->get('Origin');
        if ($origen && parse_url($origen, PHP_URL_HOST) !== $request->getHost()) {
            return response()->noContent(403);
        }

        if (strlen($request->getContent()) > self::MAX_BYTES) {
            return response()->noContent(413);
        }

        $clave = 'eventos:' . hash('sha256', Medicion::ip($request));
        if (RateLimiter::tooManyAttempts($clave, 60)) {
            return response()->noContent(429);
        }
        RateLimiter::hit($clave, 60);

        // sendBeacon manda el JSON como texto plano: se lee del cuerpo
        $datos = json_decode($request->getContent(), true);
        $v = Validator::make(is_array($datos) ? $datos : [], [
            'nombre'   => ['required', Rule::in(EventoWeb::DESDE_EL_NAVEGADOR)],
            'ruta'     => ['required', 'string', 'max:300'],
            'etiqueta' => ['nullable', 'string', 'max:120'],
            'ref'      => ['nullable', 'string', 'max:300'],
        ]);
        if ($v->fails()) {
            return response()->noContent(400);
        }

        $d = $v->validated();
        $etiqueta = str_starts_with($d['nombre'], 'busqueda') ? Medicion::busqueda($d['etiqueta'] ?? null) : ($d['etiqueta'] ?? null);

        Medicion::registrar($request, $d['nombre'], $d['ruta'], $etiqueta, $d['nombre'] === 'pagina' ? ($d['ref'] ?? null) : null);

        return response()->noContent();
    }
}
