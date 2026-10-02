<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Models\ModeloReferencia;
use App\Models\SolicitudServicio;
use App\Models\StoreLocation;
use App\Models\SystemNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * /servicio-tecnico: qué se repara, cómo es el proceso y el formulario para pedir la revisión. La solicitud llega al
 * panel (Tienda online → Solicitudes de servicio) con un aviso en el Resumen.
 *
 * Los textos son uno solo para la página y para lo que se lee sin JavaScript (App\Support\Seo\ContenidoLegible). Dicen
 * lo que la tienda ya dice de su servicio (Tienda online → Servicios) y lo que consta en su historial de reparaciones.
 */
class ServicioTecnicoPublicoController extends Controller
{
    public const BLOQUES = [
        [
            'id'     => 'equipos',
            'titulo' => 'Qué equipos atendemos',
            'texto'  => 'Reparaciones de iPhone y Mac realizadas por técnicos con experiencia en equipos Apple.',
            'items'  => [
                ['icono' => 'Smartphone', 'titulo' => 'iPhone', 'texto' => 'Es lo que más llega a nuestro servicio técnico.'],
                ['icono' => 'Laptop', 'titulo' => 'Mac', 'texto' => 'MacBook Air, MacBook Pro y Mac de escritorio.'],
                ['icono' => 'Tablet', 'titulo' => 'Otros equipos', 'texto' => 'iPad, Apple Watch, celulares Android y más: cuéntanos cuál es y te decimos si lo podemos revisar.'],
            ],
        ],
        [
            'id'     => 'reparaciones',
            'titulo' => 'Lo que más reparamos',
            'texto'  => 'Si tu equipo tiene otra falla, descríbela en el formulario: se revisa en el diagnóstico.',
            // En el orden en que salen las piezas cuando la portada desarma el equipo (SecuenciaDesarme.jsx)
            'items'  => [
                ['titulo' => 'Pantalla', 'texto' => 'Vidrio roto, manchas, líneas o un táctil que no responde.'],
                ['titulo' => 'Batería', 'texto' => 'Se descarga rápido, el equipo se apaga solo o la batería está hinchada.'],
                ['titulo' => 'Placa', 'texto' => 'El equipo no enciende o se reinicia.'],
                ['titulo' => 'Puerto de carga', 'texto' => 'No carga o el cable funciona solo en cierta posición.'],
                ['titulo' => 'Cámara', 'texto' => 'Fotos borrosas, no enfoca o la cámara no abre.'],
                ['titulo' => 'Tapa trasera', 'texto' => 'Vidrio trasero roto o rajado.'],
            ],
        ],
        [
            'id'     => 'proceso',
            'titulo' => 'Cómo trabajamos',
            'items'  => [
                ['titulo' => 'Nos cuentas qué le pasa', 'texto' => 'Llenas el formulario de esta página y te escribimos por WhatsApp para coordinar.'],
                ['titulo' => 'Diagnóstico sin costo', 'texto' => 'Revisamos tu equipo sin costo para identificar el problema antes de cualquier reparación.'],
                ['titulo' => 'Tú decides', 'texto' => 'Con el diagnóstico te decimos qué tiene y cuánto cuesta repararlo. Se repara solo si estás de acuerdo.'],
                ['titulo' => 'Recibes tu equipo con su nota', 'texto' => 'Al recibirlo registramos cómo llega y al entregarlo te llevas la nota del servicio.'],
            ],
        ],
    ];

    public function index(Request $request): Response
    {
        return Inertia::render('Store/ServicioTecnico', [
            'servicio'   => ['titulo' => 'Servicio técnico de iPhone y Mac en Cochabamba', 'bloques' => self::BLOQUES],
            'formulario' => [
                'tipos'     => SolicitudServicio::TIPOS,
                'apple'     => SolicitudServicio::APPLE,
                'problemas' => SolicitudServicio::PROBLEMAS,
                'modelos'   => $this->modelosDeLaBase(),
            ],
            // Se cargan en el panel: Tienda online → Preguntas frecuentes, «En la página de servicio técnico»
            'faqs'       => Faq::deLugar('servicio'),
            'locations'  => StoreLocation::paraLaTienda(),
            // Solo la ve el navegador que acaba de enviar la solicitud
            'enviada'    => $request->session()->get('solicitud_servicio'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // Un robot llena el campo oculto; una persona no lo ve
        if (filled($request->input('sitio_web'))) {
            return redirect()->route('servicio-tecnico.index');
        }

        $validated = $request->validate([
            'tipo_equipo'       => ['required', Rule::in(SolicitudServicio::TIPOS)],
            'marca'             => [Rule::requiredIf(fn () => ! in_array($request->input('tipo_equipo'), SolicitudServicio::APPLE, true)), 'nullable', 'string', 'max:60'],
            'modelo'            => ['required', 'string', 'max:120'],
            'problemas'         => ['required', 'array', 'min:1'],
            'problemas.*'       => [Rule::in(array_keys(SolicitudServicio::PROBLEMAS))],
            'descripcion'       => ['nullable', 'string', 'max:1000'],
            'nombre_contacto'   => ['required', 'string', 'max:120'],
            'telefono_contacto' => ['required', 'string', 'max:30', 'regex:/^\+?[\d\s\-().]{7,30}$/'],
        ], [
            'tipo_equipo.required'       => 'Elige qué equipo quieres que revisemos.',
            'tipo_equipo.in'             => 'Elige qué equipo quieres que revisemos.',
            'marca.required'             => 'Escribe la marca de tu equipo.',
            'marca.max'                  => 'La marca puede tener hasta 60 letras.',
            'modelo.required'            => 'Escribe el modelo de tu equipo.',
            'modelo.max'                 => 'El modelo puede tener hasta 120 letras.',
            'problemas.required'         => 'Marca al menos un problema.',
            'problemas.min'              => 'Marca al menos un problema.',
            'problemas.*.in'             => 'Marca los problemas de la lista.',
            'descripcion.max'            => 'La descripción puede tener hasta 1000 letras.',
            'nombre_contacto.required'   => 'Escribe tu nombre.',
            'telefono_contacto.required' => 'Escribe tu número de WhatsApp o de teléfono.',
            'telefono_contacto.regex'    => 'Escribe un número válido, por ejemplo 70012345.',
        ]);

        $limpio = fn (?string $texto) => trim(preg_replace('/\s+/u', ' ', strip_tags((string) $texto))) ?: null;
        $apple  = in_array($validated['tipo_equipo'], SolicitudServicio::APPLE, true);

        $solicitud = SolicitudServicio::create([
            'codigo'            => SolicitudServicio::generarCodigo(),
            'tipo_equipo'       => $validated['tipo_equipo'],
            'marca'             => $apple ? 'Apple' : Str::limit($limpio($validated['marca'] ?? null) ?? 'Sin marca', 60, ''),
            'modelo'            => $limpio($validated['modelo']) ?? $validated['tipo_equipo'],
            'problemas'         => array_values(array_unique($validated['problemas'])),
            'descripcion'       => trim(strip_tags((string) ($validated['descripcion'] ?? ''))) ?: null,
            'nombre_contacto'   => $limpio($validated['nombre_contacto']) ?? 'Sin nombre',
            'telefono_contacto' => trim($validated['telefono_contacto']),
            'estado'            => 'nuevo',
        ]);

        // El aviso del Resumen del panel (solo lo ve el administrador)
        SystemNotification::create([
            'type'                  => 'solicitud_servicio',
            'title'                 => 'Nueva solicitud de servicio técnico',
            'message'               => "{$solicitud->nombre_contacto} pide revisar su {$solicitud->equipo()}: "
                . Str::lower(implode(', ', $solicitud->problemasTexto())) . ".\nCódigo {$solicitud->codigo}.",
            'solicitud_servicio_id' => $solicitud->id,
        ]);

        return redirect()->route('servicio-tecnico.index')->with('solicitud_servicio', [
            'codigo' => $solicitud->codigo,
            'nombre' => (string) Str::of($solicitud->nombre_contacto)->before(' '),
            'equipo' => $solicitud->equipo(),
        ]);
    }

    /** Los nombres de los modelos de la base, para sugerir el modelo exacto al escribir. */
    private function modelosDeLaBase(): array
    {
        $apple = ModeloReferencia::delTipo('producto_apple');
        $de    = fn ($modelos, string $familia) => $modelos->where('familia', $familia)->pluck('nombre')->values()->all();

        return [
            'iPhone'      => $de(ModeloReferencia::delTipo('celular'), 'iphone'),
            'Mac'         => $de(ModeloReferencia::delTipo('computadora'), 'mac'),
            'iPad'        => $de($apple, 'ipad'),
            'Apple Watch' => $de($apple, 'watch'),
            'AirPods'     => $de($apple, 'airpods'),
        ];
    }
}
