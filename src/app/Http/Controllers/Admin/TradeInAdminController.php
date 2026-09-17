<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use App\Models\ModeloReferencia;
use App\Models\NavMenuItem;
use App\Models\StoreService;
use App\Models\SystemNotification;
use App\Models\TradeInSolicitud;
use App\Services\FotosTradeInService;
use App\Support\TradeIn\Cuestionario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Tienda online → Trade-In: las solicitudes que llegan desde /trade-in. Cada una trae el equipo, las respuestas del
 * cuestionario (con los puntos a revisar y un grado sugerido) y las fotos; acá se le escribe al cliente por WhatsApp,
 * se carga el valor estimado y se sigue por etapas hasta recibir el equipo o cerrar sin acuerdo.
 */
class TradeInAdminController extends Controller
{
    public function __construct(private readonly FotosTradeInService $fotos) {}

    public function index(): Response
    {
        $solicitudes = TradeInSolicitud::with('atendidoPor:id,name')->latest()->get();
        $inicioMes = now()->startOfMonth();

        return Inertia::render('Admin/TradeIn/Index', [
            'solicitudes' => $solicitudes->map(fn (TradeInSolicitud $s) => $this->fila($s))->values(),
            'resumen'     => [
                'por_estado'      => collect(TradeInSolicitud::ESTADOS)->mapWithKeys(fn (string $e) => [$e => $solicitudes->where('estado', $e)->count()]),
                'demoradas'       => $solicitudes->filter(fn (TradeInSolicitud $s) => $s->demorada())->count(),
                'llegadas_mes'    => $solicitudes->filter(fn (TradeInSolicitud $s) => $s->created_at?->gte($inicioMes))->count(),
                'completadas_mes' => $solicitudes->filter(fn (TradeInSolicitud $s) => $s->estado === 'completado' && $s->updated_at?->gte($inicioMes))->count(),
            ],
            'etapas'      => $this->etapas(),
            'grados'      => Cuestionario::GRADOS,
            'donde'       => $this->dondeSeLlega(),
            'horasDemora' => TradeInSolicitud::HORAS_DEMORA,
        ]);
    }

    public function show(TradeInSolicitud $tradeIn): Response
    {
        $tradeIn->load('atendidoPor:id,name');

        return Inertia::render('Admin/TradeIn/Show', [
            'solicitud' => [
                ...$this->fila($tradeIn),
                'marca'           => $tradeIn->marca,
                'modelo'          => $tradeIn->modelo,
                'capacidad'       => $tradeIn->capacidad,
                'memoria'         => $tradeIn->memoria(),
                'color'           => $tradeIn->color,
                'email'           => $tradeIn->email_contacto,
                'ciudad'          => $tradeIn->ciudad,
                'interes'         => $tradeIn->interes,
                'observaciones'   => $tradeIn->observaciones_cliente,
                'valor_estimado'  => $tradeIn->valor_estimado,
                'nota_estimacion' => $tradeIn->nota_estimacion,
                'notas_internas'  => $tradeIn->notas_internas,
                'mensaje'         => $tradeIn->mensajeWhatsapp(),
                'alertas'         => $tradeIn->alertas(),
                'resumen'         => $tradeIn->resumen(),
                'fotos'           => collect($tradeIn->fotos ?? [])->map(fn (array $f, int $i) => [
                    'url'    => route('admin.trade-in.foto', [$tradeIn, $i]),
                    'nombre' => $f['nombre'] ?? 'Foto ' . ($i + 1),
                    // El navegador no muestra HEIC: esas fotos se descargan
                    'imagen' => ! str_contains((string) ($f['mime'] ?? ''), 'hei'),
                ])->values(),
                'historial'       => $tradeIn->historial ?? [],
                'ficha'           => $this->ficha($tradeIn),
                'inventario'      => $this->inventario($tradeIn),
                'version'         => (string) ($tradeIn->updated_at?->getTimestampMs() ?? 0),
            ],
            'etapas' => $this->etapas(),
            'grados' => Cuestionario::GRADOS,
        ]);
    }

    public function update(Request $request, TradeInSolicitud $tradeIn): RedirectResponse
    {
        $validated = $request->validate([
            'estado'          => ['required', Rule::in(TradeInSolicitud::ESTADOS)],
            'valor_estimado'  => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'nota_estimacion' => ['nullable', 'string', 'max:500'],
            'notas_internas'  => ['nullable', 'string', 'max:2000'],
        ], [
            'estado.required'      => 'Elige la etapa de la solicitud.',
            'estado.in'            => 'Elige una de las etapas.',
            'valor_estimado.numeric' => 'El valor estimado tiene que ser un número.',
            'valor_estimado.min'   => 'El valor estimado no puede ser negativo.',
            'valor_estimado.max'   => 'El valor estimado es demasiado alto.',
            'nota_estimacion.max'  => 'La nota para el cliente puede tener hasta 500 letras.',
            'notas_internas.max'   => 'Las notas internas pueden tener hasta 2000 letras.',
        ]);

        $antes = ['estado' => $tradeIn->estado, 'valor' => $tradeIn->valor_estimado];
        $valor = isset($validated['valor_estimado']) ? round((float) $validated['valor_estimado'], 2) : null;

        $tradeIn->fill([
            'estado'          => $validated['estado'],
            'valor_estimado'  => $valor,
            'nota_estimacion' => trim(preg_replace('/\s+/u', ' ', strip_tags((string) ($validated['nota_estimacion'] ?? '')))) ?: null,
            'notas_internas'  => trim(strip_tags((string) ($validated['notas_internas'] ?? ''))) ?: null,
            'atendido_por'    => $request->user()->id,
        ]);

        if ($antes['estado'] !== $tradeIn->estado) {
            $tradeIn->registrar('etapa', ['de' => $antes['estado'], 'a' => $tradeIn->estado], $request->user());
        }
        if ($antes['valor'] !== $valor) {
            $tradeIn->registrar('valor', ['valor' => $valor], $request->user());
        }

        $tradeIn->save();

        return back()->with('success', $antes['estado'] !== $tradeIn->estado
            ? "La solicitud {$tradeIn->codigo} pasó a «{$tradeIn->etiqueta()}»."
            : 'Solicitud guardada.');
    }

    /** Se abrió WhatsApp con el cliente: queda en el historial y una solicitud nueva pasa a «Esperando respuesta». */
    public function contacto(Request $request, TradeInSolicitud $tradeIn): RedirectResponse
    {
        $tradeIn->registrar('whatsapp', [], $request->user());

        $avanza = $tradeIn->estado === 'nuevo';
        if ($avanza) {
            $tradeIn->registrar('etapa', ['de' => 'nuevo', 'a' => 'pendiente'], $request->user());
            $tradeIn->estado = 'pendiente';
        }

        $tradeIn->atendido_por = $request->user()->id;
        $tradeIn->save();

        return back()->with('success', $avanza
            ? "Se abrió WhatsApp: {$tradeIn->codigo} pasó a «Esperando respuesta»."
            : 'Se abrió WhatsApp con el cliente.');
    }

    public function foto(TradeInSolicitud $tradeIn, int $indice): StreamedResponse
    {
        $foto = ($tradeIn->fotos ?? [])[$indice] ?? null;
        abort_unless($foto && Storage::disk(FotosTradeInService::DISCO)->exists($foto['ruta']), 404);

        return Storage::disk(FotosTradeInService::DISCO)->response($foto['ruta'], $foto['nombre'] ?? null, [
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /** Borra la solicitud con los datos del cliente, sus fotos y sus avisos (para solicitudes falsas o si el cliente lo pide). */
    public function destroy(TradeInSolicitud $tradeIn): RedirectResponse
    {
        $codigo = $tradeIn->codigo;

        $this->fotos->borrar($tradeIn);
        SystemNotification::where('trade_in_id', $tradeIn->id)->delete();
        $tradeIn->delete();

        return redirect()->route('admin.trade-in.index')->with('success', "Se borró la solicitud {$codigo} con los datos del cliente y sus fotos.");
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private function fila(TradeInSolicitud $s): array
    {
        $alertas = collect($s->alertas());

        return [
            'id'           => $s->id,
            'codigo'       => $s->codigo,
            'tipo'         => $s->tipo_dispositivo,
            'dispositivo'  => $s->dispositivo(),
            'cliente'      => $s->nombre_contacto,
            'telefono'     => $s->telefono_contacto,
            'whatsapp'     => $s->whatsapp(),
            'mensaje'      => $s->mensajeWhatsapp(),
            'estado'       => $s->estado,
            'abierta'      => $s->abierta(),
            'creada'       => $s->created_at?->toIso8601String(),
            'creada_hace'  => $s->created_at?->diffForHumans(),
            'demorada'     => $s->demorada(),
            'valor'        => $s->valor_estimado,
            'grado'        => $s->grado(),
            'criticas'     => $alertas->where('nivel', 'critico')->pluck('texto')->values(),
            'a_revisar'    => $alertas->where('nivel', 'revisar')->count(),
            'fotos_total'  => count($s->fotos ?? []),
            'atendida_por' => $s->atendidoPor?->name,
        ];
    }

    private function etapas(): array
    {
        return collect(TradeInSolicitud::ETIQUETAS)
            ->map(fn (string $label, string $valor) => ['valor' => $valor, 'label' => $label, 'abierta' => in_array($valor, TradeInSolicitud::ABIERTAS, true)])
            ->values()
            ->all();
    }

    /** La ficha del modelo en la comparativa, si el cliente eligió un modelo de la base. */
    private function ficha(TradeInSolicitud $s): ?string
    {
        [$tipo, $familia] = match ($s->tipo_dispositivo) {
            'iPhone'         => ['celular', 'iphone'],
            'MacBook', 'Mac' => ['computadora', 'mac'],
            default          => [null, null],
        };
        $modelo = $tipo ? ModeloReferencia::detectar($tipo, $s->modelo) : null;

        return $modelo && $modelo->familia === $familia
            ? route('store.compare.modelos', ['familia' => $familia, 'modelos' => $modelo->slug])
            : null;
    }

    /** Dónde se registra el equipo recibido en el inventario. */
    private function inventario(TradeInSolicitud $s): ?array
    {
        [$ruta, $modulo] = match ($s->tipo_dispositivo) {
            'iPhone'                          => ['admin.celulares.create', 'Celulares'],
            'MacBook', 'Mac'                  => ['admin.computadoras.create', 'Computadoras'],
            'iPad', 'Apple Watch', 'AirPods'  => ['admin.productos-apple.create', 'Productos Apple'],
            default                           => [null, null],
        };

        return $ruta && Route::has($ruta) ? ['url' => route($ruta), 'modulo' => $modulo] : null;
    }

    /** Por dónde llega el cliente a /trade-in: la barra de arriba, el inicio, los menús y los servicios. */
    private function dondeSeLlega(): array
    {
        $esTradeIn = fn (?string $url) => rtrim((string) parse_url((string) $url, PHP_URL_PATH), '/') === '/trade-in';

        $seccion = HomeSection::where('type', 'trade_in')->orderBy('orden')->first();
        $enlaces = NavMenuItem::where('active', true)->get();
        $activos = $enlaces->pluck('id')->flip();

        return [
            'inicio'    => $seccion ? [
                'encendida' => $seccion->active,
                'en_vigor'  => HomeSection::visible()->where('type', 'trade_in')->exists(),
                'titulo'    => ($seccion->settings['titulo'] ?? '') ?: 'Tu equipo actual vale como parte de pago',
            ] : null,
            'menus'     => $enlaces
                ->filter(fn (NavMenuItem $m) => ($m->parent_id === null || isset($activos[$m->parent_id])) && $esTradeIn($m->url))
                ->pluck('slot')->unique()
                ->map(fn (string $slot) => MenuController::MENUS[$slot] ?? $slot)
                ->values()->all(),
            'servicios' => StoreService::where('active', true)->where('accion', 'enlace')->get()
                ->filter(fn (StoreService $s) => $esTradeIn($s->enlace))
                ->pluck('title')->values()->all(),
        ];
    }
}
