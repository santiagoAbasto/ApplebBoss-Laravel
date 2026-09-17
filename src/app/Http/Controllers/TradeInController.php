<?php

namespace App\Http\Controllers;

use App\Models\ModeloReferencia;
use App\Models\SystemNotification;
use App\Models\TradeInSolicitud;
use App\Services\FotosTradeInService;
use App\Support\Seo;
use App\Support\TradeIn\Cuestionario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * /trade-in: el cliente cuenta cómo está su equipo (Apple o de otra marca) para recibir una cotización estimada. Las preguntas salen de
 * App\Support\TradeIn\Cuestionario. La solicitud llega al panel (Tienda online → Trade-In) con un aviso en el Resumen.
 */
class TradeInController extends Controller
{
    /** Cuántas solicitudes recientes recuerda la sesión para mostrar su confirmación. */
    private const CONFIRMACIONES = 5;

    public function __construct(private readonly FotosTradeInService $fotos) {}

    public function index(): Response
    {
        return Inertia::render('Store/TradeIn', [
            'cuestionario' => Cuestionario::paraFormulario(),
            'modelos'      => $this->modelosDeLaBase(),
            'maxFotos'     => FotosTradeInService::MAXIMO,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // Un robot llena el campo oculto; una persona no lo ve
        if (filled($request->input('sitio_web'))) {
            return redirect()->route('trade-in.index');
        }

        $tipo = $request->validate(
            ['tipo_dispositivo' => ['required', Rule::in(Cuestionario::TIPOS)]],
            ['tipo_dispositivo.required' => 'Elige qué equipo quieres entregar.', 'tipo_dispositivo.in' => 'Elige qué equipo quieres entregar.'],
        )['tipo_dispositivo'];

        $validated = $request->validate([
            'marca'                 => [Rule::requiredIf(! in_array($tipo, Cuestionario::APPLE, true)), 'nullable', 'string', 'max:60'],
            'modelo'                => ['required', 'string', 'max:120'],
            'capacidad'             => ['nullable', 'string', 'max:30'],
            'memoria'               => ['nullable', 'string', 'max:30'],
            'color'                 => ['nullable', 'string', 'max:60'],
            'observaciones_cliente' => ['nullable', 'string', 'max:1000'],
            'nombre_contacto'       => ['required', 'string', 'max:120'],
            'telefono_contacto'     => ['required', 'string', 'max:30', 'regex:/^\+?[\d\s\-().]{7,30}$/'],
            'email_contacto'        => ['nullable', 'email', 'max:120'],
            'ciudad'                => ['nullable', 'string', 'max:60'],
            'interes'               => ['nullable', 'string', 'max:160'],
            'declaracion'           => ['accepted'],
            'fotos'                 => ['nullable', 'array', 'max:' . FotosTradeInService::MAXIMO],
            'fotos.*'               => ['file', 'mimes:jpg,jpeg,png,webp,heic,heif', 'max:' . FotosTradeInService::MAX_KB],
            ...Cuestionario::reglas($tipo),
        ], [
            'marca.required'             => 'Escribe la marca de tu equipo.',
            'marca.max'                  => 'La marca puede tener hasta 60 letras.',
            'modelo.required'            => 'Escribe el modelo de tu equipo.',
            'modelo.max'                 => 'El modelo puede tener hasta 120 letras.',
            'observaciones_cliente.max'  => 'Los comentarios pueden tener hasta 1000 letras.',
            'nombre_contacto.required'   => 'Escribe tu nombre.',
            'telefono_contacto.required' => 'Escribe tu número de WhatsApp o de teléfono.',
            'telefono_contacto.regex'    => 'Escribe un número válido, por ejemplo 70012345.',
            'email_contacto.email'       => 'El correo no es válido.',
            'declaracion.accepted'       => 'Confirma que el equipo es tuyo y que la información es verdadera.',
            'fotos.max'                  => 'Puedes subir hasta ' . FotosTradeInService::MAXIMO . ' fotos.',
            'fotos.*.file'               => 'No se pudo subir una de las fotos. Prueba otra vez.',
            'fotos.*.mimes'              => 'Las fotos deben ser JPG, PNG, WebP o HEIC.',
            'fotos.*.max'                => 'Cada foto puede pesar hasta ' . intdiv(FotosTradeInService::MAX_KB, 1024) . ' MB.',
            ...Cuestionario::mensajes($tipo),
        ]);

        $limpio = fn (?string $texto) => trim(preg_replace('/\s+/u', ' ', strip_tags((string) $texto))) ?: null;

        $respuestas = Cuestionario::limpiar($tipo, $validated['respuestas'] ?? []);
        if (array_key_exists($tipo, Cuestionario::MEMORIAS) && ($memoria = $limpio($validated['memoria'] ?? null))) {
            $respuestas['memoria'] = $memoria;
        }

        $solicitud = TradeInSolicitud::create([
            'codigo'                => TradeInSolicitud::generarCodigo(),
            'tipo_dispositivo'      => $tipo,
            'marca'                 => in_array($tipo, Cuestionario::APPLE, true) ? 'Apple' : Str::limit($limpio($validated['marca'] ?? null) ?? 'Sin marca', 60, ''),
            'modelo'                => $limpio($validated['modelo']) ?? Str::limit(strip_tags($validated['modelo']), 120, ''),
            'capacidad'             => $limpio($validated['capacidad'] ?? null),
            'color'                 => $limpio($validated['color'] ?? null),
            'respuestas'            => $respuestas,
            'observaciones_cliente' => trim(strip_tags((string) ($validated['observaciones_cliente'] ?? ''))) ?: null,
            'nombre_contacto'       => $limpio($validated['nombre_contacto']) ?? 'Sin nombre',
            'telefono_contacto'     => trim($validated['telefono_contacto']),
            'email_contacto'        => $validated['email_contacto'] ?? null,
            'ciudad'                => $limpio($validated['ciudad'] ?? null),
            'interes'               => $limpio($validated['interes'] ?? null),
            'moneda'                => 'BOB',
            'estado'                => 'nuevo',
            'historial'             => [['tipo' => 'recibida', 'fecha' => now()->toIso8601String()]],
        ]);

        if ($request->hasFile('fotos')) {
            $this->fotos->guardar($solicitud, $request->file('fotos'));
        }

        // El aviso del Resumen del panel (solo lo ve el administrador)
        SystemNotification::create([
            'type'        => 'trade_in',
            'title'       => 'Nueva solicitud de Trade-In',
            'message'     => "{$solicitud->nombre_contacto} quiere entregar su {$solicitud->dispositivo()}.\nCódigo {$solicitud->codigo}.",
            'trade_in_id' => $solicitud->id,
        ]);

        // La confirmación muestra el nombre y el teléfono: solo la ve el navegador que envió la solicitud (el código es correlativo)
        $enviadas = $request->session()->get('trade_in.enviadas', []);
        $request->session()->put('trade_in.enviadas', array_slice([...$enviadas, $solicitud->codigo], -self::CONFIRMACIONES));

        return redirect()->route('trade-in.confirmacion', ['codigo' => $solicitud->codigo]);
    }

    public function confirmacion(Request $request, string $codigo): Response
    {
        abort_unless(in_array($codigo, $request->session()->get('trade_in.enviadas', []), true), 404);

        $solicitud = TradeInSolicitud::where('codigo', $codigo)->firstOrFail();

        app(Seo::class)->context(['noindex' => true]);

        // Solo lo necesario: nunca el valor, las notas internas ni el seguimiento
        return Inertia::render('Store/TradeInConfirmacion', [
            'codigo'   => $solicitud->codigo,
            'tipo'     => $solicitud->tipo_dispositivo,
            'equipo'   => $solicitud->dispositivo(),
            'nombre'   => (string) Str::of($solicitud->nombre_contacto)->trim()->before(' '),
            'telefono' => $solicitud->telefono_contacto,
            'fotos'    => count($solicitud->fotos ?? []),
        ]);
    }

    /** Los modelos de la base, para sugerir el nombre exacto con sus capacidades, memorias y colores. */
    private function modelosDeLaBase(): array
    {
        $ficha = fn (ModeloReferencia $m) => array_filter([
            'nombre'      => $m->nombre,
            'capacidades' => $m->specs['capacidades_disponibles'] ?? null,
            'memorias'    => $m->specs['memorias_disponibles'] ?? null,
            'colores'     => $m->specs['colores_disponibles'] ?? null,
        ]);

        $mac = ModeloReferencia::delTipo('computadora')->where('familia', 'mac');
        $esPortatil = fn (ModeloReferencia $m) => str_starts_with($m->nombre, 'MacBook');

        return [
            'iPhone'  => ModeloReferencia::delTipo('celular')->where('familia', 'iphone')->map($ficha)->values()->all(),
            'MacBook' => $mac->filter($esPortatil)->map($ficha)->values()->all(),
            'Mac'     => $mac->reject($esPortatil)->map($ficha)->values()->all(),
        ];
    }
}
