<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Integracion;
use App\Models\IntegracionSolicitud;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Sistema → Integraciones API: quién puede leer la API de integración, con qué permisos, y qué pidió.
 * El token se muestra una sola vez, al crearlo; en la base queda solo su hash.
 */
class IntegracionController extends Controller
{
    public function index(): Response
    {
        $integraciones = Integracion::with(['tokens' => fn ($q) => $q->latest('id')])->orderBy('nombre')->get();
        $desde = now()->subDay();

        return Inertia::render('Admin/Integraciones/Index', [
            'integraciones' => $integraciones->map(fn (Integracion $i) => [
                'id'         => $i->id,
                'nombre'     => $i->nombre,
                'scopes'     => array_values($i->scopes ?? []),
                'activa'     => $i->activa,
                'creada'     => $i->created_at?->toIso8601String(),
                'ultimo_uso' => $i->tokens->max('last_used_at')?->toIso8601String(),
                'pedidos_24h'   => $i->solicitudes()->where('created_at', '>=', $desde)->count(),
                'rechazos_24h'  => $i->solicitudes()->where('created_at', '>=', $desde)->where('estado', '>=', 400)->count(),
                'tokens'     => $i->tokens->map(fn (PersonalAccessToken $t) => [
                    'id'         => $t->id,
                    'nombre'     => $t->name,
                    'creado'     => $t->created_at?->toIso8601String(),
                    'ultimo_uso' => $t->last_used_at?->toIso8601String(),
                    'vence'      => $t->expires_at?->toIso8601String(),
                    'vencido'    => $t->expires_at?->isPast() ?? false,
                ])->values(),
            ])->values(),
            'solicitudes'   => IntegracionSolicitud::with('integracion:id,nombre')->latest('id')->limit(60)->get()->map(fn ($s) => [
                'id'          => $s->id,
                'integracion' => $s->integracion?->nombre,
                'metodo'      => $s->metodo,
                'ruta'        => $s->ruta,
                'estado'      => $s->estado,
                'duracion_ms' => $s->duracion_ms,
                'fecha'       => $s->created_at?->toIso8601String(),
            ]),
            'scopes'        => collect(Integracion::SCOPES)->map(fn ($texto, $clave) => ['clave' => $clave, 'texto' => $texto])->values(),
            'base'          => rtrim((string) config('app.url'), '/') . '/api/v1/integration',
            'limite'        => Integracion::LIMITE_POR_MINUTO,
            'horasDeGracia' => Integracion::HORAS_DE_GRACIA,
            // Solo existe en el pedido que sigue a crearlo: al recargar, desaparece
            'tokenNuevo'    => session('token_integracion'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        $integracion = Integracion::create($datos + ['activa' => true, 'creado_por' => $request->user()->id]);

        return $this->conToken($integracion, "Se creó «{$integracion->nombre}». Copia el token ahora: no se vuelve a mostrar.");
    }

    public function update(Request $request, Integracion $integracion): RedirectResponse
    {
        $datos = $this->validar($request) + $request->validate(['activa' => 'required|boolean']);
        $integracion->update($datos);

        return back()->with('success', $integracion->activa ? "«{$integracion->nombre}» quedó guardada." : "«{$integracion->nombre}» quedó desactivada: sus tokens ya no entran.");
    }

    /** Un token nuevo. Con «vencer_anteriores», los vigentes duran HORAS_DE_GRACIA más (para cambiarlo sin cortar). */
    public function token(Request $request, Integracion $integracion): RedirectResponse
    {
        $vencer = $request->validate(['vencer_anteriores' => 'required|boolean'])['vencer_anteriores'];

        if ($vencer) {
            $limite = now()->addHours(Integracion::HORAS_DE_GRACIA);
            $integracion->tokens()
                ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', $limite))
                ->update(['expires_at' => $limite]);
        }

        return $this->conToken($integracion, $vencer
            ? 'Token nuevo listo. Los anteriores dejan de servir en ' . Integracion::HORAS_DE_GRACIA . ' horas.'
            : 'Token nuevo listo. Los anteriores siguen sirviendo.');
    }

    public function revocar(Integracion $integracion, int $token): RedirectResponse
    {
        $integracion->tokens()->whereKey($token)->firstOrFail()->delete();

        return back()->with('success', 'Token revocado: deja de servir ya.');
    }

    private function validar(Request $request): array
    {
        return $request->validate([
            'nombre'   => 'required|string|max:80',
            'scopes'   => 'required|array|min:1',
            'scopes.*' => ['string', Rule::in(array_keys(Integracion::SCOPES))],
        ], [
            'scopes.required' => 'Elige al menos un permiso.',
            'scopes.min'      => 'Elige al menos un permiso.',
        ]);
    }

    private function conToken(Integracion $integracion, string $mensaje): RedirectResponse
    {
        $plano = $integracion->emitirToken('Token del ' . now()->timezone('America/La_Paz')->format('d-m-Y H:i'));

        return to_route('admin.integraciones.index')
            ->with('success', $mensaje)
            ->with('token_integracion', ['integracion' => $integracion->nombre, 'token' => $plano]);
    }
}
