<?php

namespace App\Http\Controllers;

use App\Models\ServicioTecnico;
use App\Support\Documentos\Documento;
use App\Support\Documentos\Envio;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use App\Services\GeneradorCodigos;
use App\Models\Cliente;
use App\Models\Tecnico;
use App\Support\RecepcionDeEquipo;
use App\Support\SinCostos;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;


class ServicioTecnicoController extends Controller
{
    private function authorizeServicioAccess(ServicioTecnico $servicio): void
    {
        if (Auth::user()->rol === 'vendedor' && (int) $servicio->user_id !== (int) Auth::id()) {
            abort(404);
        }
    }

    /** Técnicos ya usados en servicios anteriores (para filtrar y elegir rápido). */
    private function tecnicosConocidos()
    {
        return ServicioTecnico::query()
            ->whereNotNull('tecnico')
            ->where('tecnico', '<>', '')
            ->distinct()
            ->orderBy('tecnico')
            ->pluck('tecnico')
            ->values();
    }

    /* ======================================================
     * INDEX
     * ====================================================== */
    public function index(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'vendedor_id' => 'nullable|exists:users,id',
            'tecnico' => 'nullable|string|max:120',
            'buscar' => 'nullable|string',
            'pendientes' => 'nullable|boolean',
        ]);

        $esAdmin = ! SinCostos::aplica(Auth::user());
        $query = ServicioTecnico::with(['vendedor', 'quienCargoElCosto:id,name'])->orderByDesc('fecha')->orderByDesc('id');

        // «Sin costo»: los servicios que el administrador todavía tiene que completar
        if ($esAdmin && $request->boolean('pendientes')) {
            $query->sinCosto();
        }

        if (Auth::user()->rol === 'vendedor') {
            $query->where('user_id', Auth::id());
        } elseif ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }

        if ($request->filled('tecnico')) {
            $query->where('tecnico', $request->tecnico);
        }

        if ($request->filled('buscar')) {
            $query->where(function ($q) use ($request) {
                $q->where('cliente', 'like', '%' . $request->buscar . '%')
                    ->orWhere('codigo_nota', 'like', '%' . $request->buscar . '%');
            });

            // Al vendedor tampoco le viaja el costo por la búsqueda rápida
            return response()->json([
                'servicios' => $esAdmin ? $this->conCompartir($query->get()) : $this->sinCostos($this->conCompartir($query->get())),
            ]);
        }

        return Inertia::render(
            Auth::user()->rol === 'admin'
                ? 'Admin/Servicios/Index'
                : 'Vendedor/Servicios/Index',
            [
                // Al vendedor no le viajan ni el costo del servicio ni el de cada trabajo
                'servicios' => $esAdmin ? $this->conCompartir($query->get()) : $this->sinCostos($this->conCompartir($query->get())),
                'filtros' => $request->only(['fecha_inicio', 'fecha_fin', 'vendedor_id', 'tecnico', 'pendientes']),
                // Cuántos servicios esperan su costo, sin importar el período que se esté mirando
                'pendientesDeCosto' => $esAdmin ? ServicioTecnico::sinCosto()->count() : 0,
                // Quienes registraron al menos un servicio (filtro «Registrado por»)
                'vendedores' => $esAdmin
                    ? \App\Models\User::whereIn('id', ServicioTecnico::query()->select('user_id'))
                        ->orderBy('name')
                        ->get(['id', 'name'])
                    : [],
                // Los técnicos conocidos sirven en los dos paneles para autocompletar y filtrar
                'tecnicos' => $this->tecnicosConocidos(),
            ]
        );
    }

    /* ======================================================
     * CREATE
     * ====================================================== */
    public function create()
    {
        return Inertia::render(
            Auth::user()->rol === 'admin' ? 'Admin/Servicios/Create' : 'Vendedor/Servicios/Create',
            [
                // Quién puede recibir el equipo sale de la marca: por eso van con su especialidad
                'tecnicos' => Tecnico::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'especialidad']),
                'marcas'   => collect(ServicioTecnico::MARCAS)->map(fn ($label, $value) => compact('value', 'label'))->values(),
                'especialidades' => collect(Tecnico::ESPECIALIDADES)->map(fn ($label, $value) => compact('value', 'label'))->values(),
                'revision' => RecepcionDeEquipo::PUNTOS,
            ]
        );
    }

    /**
     * Alta de un técnico desde el propio formulario: nombre y qué equipos atiende. No se le registra ningún pago:
     * el catálogo existe para saber a quién se le puede entregar cada marca.
     */
    public function guardarTecnico(Request $request)
    {
        $data = $request->validate([
            'nombre'       => ['required', 'string', 'max:120'],
            'especialidad' => ['required', Rule::in(array_keys(Tecnico::ESPECIALIDADES))],
        ]);

        Tecnico::updateOrCreate(
            ['nombre' => trim($data['nombre'])],
            ['especialidad' => $data['especialidad'], 'activo' => true]
        );

        return back()->with('success', 'Técnico guardado.');
    }

    /** Cambiar qué equipos atiende un técnico (solo el administrador). */
    public function actualizarTecnico(Request $request, Tecnico $tecnico)
    {
        abort_if(SinCostos::aplica(Auth::user()), 403, 'Solo el administrador cambia la especialidad de un técnico.');

        $tecnico->update($request->validate([
            'especialidad' => ['required', Rule::in(array_keys(Tecnico::ESPECIALIDADES))],
        ]));

        return back()->with('success', 'Técnico actualizado.');
    }

    /* ======================================================
     * STORE
     * ====================================================== */
    public function store(Request $request)
    {
        // Dos formas de ingresar: «directo» (ya se sabe el precio, como siempre) o «diagnóstico» (entra para revisar,
        // el precio de la reparación se carga después). En diagnóstico no se exigen trabajos ni precio.
        $modo = in_array($request->input('modo'), [ServicioTecnico::MODO_DIAGNOSTICO, ServicioTecnico::MODO_DIRECTO], true)
            ? $request->input('modo')
            : ServicioTecnico::MODO_DIRECTO;
        $esDiagnostico = $modo === ServicioTecnico::MODO_DIAGNOSTICO;

        $data = $request->validate(RecepcionDeEquipo::reglas() + [
            'cliente'           => 'required|string|max:255',
            'telefono'          => 'nullable|string|max:50',
            'correo'            => 'nullable|email:rfc|max:191',
            'equipo'            => 'required|string|max:255',
            'marca'             => ['required', Rule::in(array_keys(ServicioTecnico::MARCAS))],
            'detalle_servicio'  => [Rule::requiredIf(! $esDiagnostico), 'string'],
            'notas_adicionales' => 'nullable|string',
            // El costo solo lo carga el administrador: al vendedor se le ignora aunque lo mande
            'precio_costo'      => 'nullable|numeric|min:0',
            'precio_venta'      => [Rule::requiredIf(! $esDiagnostico), 'numeric', 'min:0'],
            // La cuota del diagnóstico es opcional: por defecto 0 (no se cobra por revisar)
            'cuota_diagnostico' => 'nullable|numeric|min:0',
            'tecnico_id'        => 'required|integer|exists:tecnicos,id',
            'fecha'             => 'nullable|date',
        ]);

        $tecnico = Tecnico::findOrFail($data['tecnico_id']);

        // La regla del taller, aplicada también en el servidor y no solo en el desplegable
        if (! $tecnico->atiende($data['marca'])) {
            throw ValidationException::withMessages([
                'tecnico_id' => $tecnico->nombre . ' no atiende esa marca.',
            ]);
        }

        $data['tecnico'] = $tecnico->nombre;
        $esAdmin = ! SinCostos::aplica(Auth::user());
        $correo = Str::lower(trim((string) ($data['correo'] ?? ''))) ?: null;

        // En diagnóstico el cliente paga (de momento) solo la cuota del diagnóstico; el precio de la reparación
        // llega con el presupuesto. En directo, los montos salen de los trabajos como siempre.
        $cuota = $esDiagnostico ? round((float) ($data['cuota_diagnostico'] ?? 0), 2) : null;
        // Sin trabajos todavía: detalle vacío (no '[]', que se imprimiría literal en la nota y el correo).
        $montos = $esDiagnostico
            ? ['detalle' => '', 'venta' => $cuota, 'costo' => 0.0, 'pendiente' => true]
            : $this->montosDelServicio($data, $esAdmin);
        $estadoInicial = $esDiagnostico ? ServicioTecnico::EN_DIAGNOSTICO : ServicioTecnico::RECIBIDO;

        return DB::transaction(function () use ($data, $modo, $montos, $cuota, $estadoInicial, $esDiagnostico, $esAdmin, $correo) {

            $cliente = Cliente::firstOrCreate(
                [
                    'user_id' => auth()->id(),
                    'nombre'  => $data['cliente'],
                ],
                [
                    'telefono' => $data['telefono'] ?? null,
                    'correo'   => $correo,
                ]
            );

            $servicio = null;

            GeneradorCodigos::crearServicioTecnicoConCodigo(function (string $codigo) use ($cliente, $data, $modo, $montos, $cuota, $estadoInicial, $correo, &$servicio) {
                $servicio = ServicioTecnico::create([
                    'codigo_nota'       => $codigo,
                    'cliente_id'        => $cliente->id,
                    'cliente'           => $cliente->nombre,
                    'telefono'          => $cliente->telefono,
                    'correo'            => $correo,
                    'estado'            => $estadoInicial,
                    'modo'              => $modo,
                    'cuota_diagnostico' => $cuota,
                    'equipo'            => $data['equipo'],
                    'marca'             => $data['marca'],
                    'recepcion'         => RecepcionDeEquipo::normalizar($data['recepcion'] ?? null),
                    'detalle_servicio'  => $montos['detalle'],
                    'notas_adicionales' => $data['notas_adicionales'] ?? null,
                    'precio_costo'      => $montos['costo'],
                    'precio_venta'      => $montos['venta'],
                    'costo_pendiente'   => $montos['pendiente'],
                    'costo_cargado_por' => $montos['pendiente'] ? null : auth()->id(),
                    'costo_cargado_en'  => $montos['pendiente'] ? null : now(),
                    'tecnico'           => $data['tecnico'],
                    'fecha'             => $data['fecha'] ?? now('America/La_Paz'),
                    'user_id'           => auth()->id(),
                ]);
            });

            // Un servicio directo del vendedor llega al administrador para cargar el costo (el diagnóstico no: todavía no hay reparación)
            if ($servicio && $montos['pendiente'] && ! $esAdmin && ! $esDiagnostico) {
                $servicio->load('vendedor')->avisarCostoPendiente();
            }

            // La nota le llega al cliente por correo si dejó uno (en diagnóstico: «recibimos tu equipo para revisarlo»)
            $correoEnviado = $servicio ? Envio::avisar($servicio, 'servicio') : false;

            $mensaje = $esDiagnostico
                ? 'Equipo recibido para diagnóstico. Cuando lo revises, carga el presupuesto.'
                : (($montos['pendiente'] && ! $esAdmin)
                    ? 'Servicio técnico registrado. Ya puedes imprimir la nota.'
                    : 'Servicio técnico registrado correctamente.');

            return redirect()
                ->route($esAdmin ? 'admin.servicios.index' : 'vendedor.servicios.index')
                ->with('success', $mensaje . ($correoEnviado ? ' Nota enviada por correo a ' . $correo . '.' : ''));
        });
    }

    /* ======================================================
     * COSTO DEL SERVICIO (solo el administrador)
     * ====================================================== */
    public function cargarCosto(Request $request, ServicioTecnico $servicio)
    {
        abort_if(SinCostos::aplica(Auth::user()), 403, 'Solo el administrador carga el costo de un servicio técnico.');

        $trabajos = $servicio->trabajos();

        if ($trabajos !== null && count($trabajos) > 0) {
            $validated = $request->validate([
                'costos'   => ['required', 'array', 'size:' . count($trabajos)],
                'costos.*' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            ], [
                'costos.size'       => 'Carga el costo de cada trabajo del servicio.',
                'costos.*.required' => 'Carga el costo de cada trabajo del servicio.',
                'costos.*.numeric'  => 'El costo tiene que ser un monto.',
                'costos.*.min'      => 'El costo no puede ser negativo.',
            ]);

            // Solo se completa el costo: la descripción y lo que paga el cliente (lo que dice la nota) no cambian
            foreach ($trabajos as $i => $trabajo) {
                $trabajos[$i] = is_array($trabajo) ? $trabajo : ['descripcion' => (string) $trabajo];
                $trabajos[$i]['costo'] = round((float) $validated['costos'][$i], 2);
            }

            $costo = round(array_sum(array_column($trabajos, 'costo')), 2);
            $servicio->detalle_servicio = json_encode($trabajos, JSON_UNESCAPED_UNICODE);
        } else {
            // Registros antiguos con el detalle en texto libre: un solo costo total
            $validated = $request->validate([
                'costo_total' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            ], [
                'costo_total.required' => 'Carga el costo del servicio.',
            ]);
            $costo = round((float) $validated['costo_total'], 2);
        }

        $servicio->fill([
            'precio_costo'      => $costo,
            'costo_pendiente'   => false,
            'costo_cargado_por' => Auth::id(),
            'costo_cargado_en'  => now(),
        ])->save();

        // El aviso del Resumen ya cumplió su tarea
        if (\Illuminate\Support\Facades\Schema::hasColumn('system_notifications', 'servicio_tecnico_id')) {
            \App\Models\SystemNotification::where('servicio_tecnico_id', $servicio->id)->update(['read' => true]);
        }

        $ganancia = (float) $servicio->precio_venta - $costo;

        return back()->with('success', "Costo cargado en {$servicio->codigo_nota}: "
            . ($ganancia < 0 ? 'se cobró Bs ' . number_format(abs($ganancia), 2) . ' menos de lo que costó.' : 'deja una utilidad de Bs ' . number_format($ganancia, 2) . '.'));
    }

    /* ======================================================
     * PRESUPUESTO (a partir del diagnóstico): se fija el precio y el cliente lo aprueba o rechaza por correo
     * ====================================================== */
    public function cargarPresupuesto(Request $request, ServicioTecnico $servicio)
    {
        $this->authorizeServicioAccess($servicio);

        if (! $servicio->esDiagnostico() || ! in_array($servicio->estado, [ServicioTecnico::RECIBIDO, ServicioTecnico::EN_DIAGNOSTICO], true)) {
            return back()->with('error', 'El presupuesto solo se carga sobre un servicio en diagnóstico.');
        }

        $data = $request->validate([
            'detalle_servicio' => ['required', 'string'],
            'precio_costo'     => ['nullable', 'numeric', 'min:0'],
        ]);

        $esAdmin = ! SinCostos::aplica(Auth::user());
        $montos = $this->montosDelServicio($data, $esAdmin); // valida trabajos, arma venta/costo/pendiente

        return DB::transaction(function () use ($servicio, $montos, $esAdmin) {
            $servicio->fill([
                'detalle_servicio'  => $montos['detalle'],
                'precio_venta'      => $montos['venta'],
                'precio_costo'      => $montos['costo'],
                'costo_pendiente'   => $montos['pendiente'],
                'costo_cargado_por' => $montos['pendiente'] ? null : Auth::id(),
                'costo_cargado_en'  => $montos['pendiente'] ? null : now(),
                'estado'            => ServicioTecnico::PRESUPUESTO,
                'presupuesto_en'    => now(),
                'aprobado_en'       => null,
                'rechazado_en'      => null,
            ])->save();

            // Si lo armó el vendedor, al administrador todavía le falta el costo para la utilidad
            if ($montos['pendiente'] && ! $esAdmin) {
                $servicio->load('vendedor')->avisarCostoPendiente();
            }

            // El cliente recibe el monto y el enlace para aprobar o rechazar
            $correoEnviado = Envio::avisar($servicio, 'servicio');

            return back()->with('success', "Presupuesto de {$servicio->codigo_nota}: Bs " . number_format($montos['venta'], 2) . '.'
                . ($correoEnviado ? ' Se lo enviamos al cliente para que lo apruebe.' : ' El cliente no dejó correo: avísale por WhatsApp.'));
        });
    }

    /* ======================================================
     * APROBAR / RECHAZAR EL PRESUPUESTO (público, con la clave del enlace del correo; sin login)
     * ====================================================== */
    private const CABECERAS_PUBLICAS = [
        'X-Robots-Tag'    => 'noindex, nofollow, noarchive',
        'Referrer-Policy' => 'no-referrer',
        'Cache-Control'   => 'private, no-store, max-age=0',
    ];

    /** La página del enlace del presupuesto: el cliente ve el monto y los botones Aprobar / Rechazar. */
    public function presupuestoPublico(string $token)
    {
        [$servicio, $vence] = $this->servicioPorToken($token);

        return response()->view('servicios.presupuesto', [
            'servicio' => $servicio,
            'token'    => $token,
            'trabajos' => Documento::trabajosDeServicio($servicio),
            'total'    => (float) $servicio->precio_venta,
            'vencido'  => $vence?->isPast() ?? false,
        ])->withHeaders(self::CABECERAS_PUBLICAS);
    }

    public function aprobarPresupuesto(string $token)
    {
        [$servicio] = $this->servicioPorToken($token);

        if ($servicio->estado === ServicioTecnico::PRESUPUESTO) {
            $servicio->update(['estado' => ServicioTecnico::EN_REPARACION, 'aprobado_en' => now()]);
            Envio::avisar($servicio, 'servicio'); // «manos a la obra»
            $this->avisarPresupuestoResuelto($servicio, true);
        }

        return redirect()->route('servicios.presupuesto.publico', $token);
    }

    public function rechazarPresupuesto(string $token)
    {
        [$servicio] = $this->servicioPorToken($token);

        if ($servicio->estado === ServicioTecnico::PRESUPUESTO) {
            $servicio->update(['estado' => ServicioTecnico::RECHAZADO, 'rechazado_en' => now()]);
            Envio::avisar($servicio, 'servicio'); // «entendido, pasá a recoger tu equipo»
            $this->avisarPresupuestoResuelto($servicio, false);
        }

        return redirect()->route('servicios.presupuesto.publico', $token);
    }

    /** El documento del enlace tiene que ser un servicio técnico; si no, 404. */
    private function servicioPorToken(string $token): array
    {
        [$doc, $vence] = Documento::porToken($token) ?? [null, null];
        abort_unless($doc instanceof ServicioTecnico, 404);

        return [$doc, $vence];
    }

    /** Avisa en el Resumen del administrador que el cliente aprobó o rechazó el presupuesto. */
    private function avisarPresupuestoResuelto(ServicioTecnico $servicio, bool $aprobado): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasColumn('system_notifications', 'servicio_tecnico_id')) {
            return;
        }

        \App\Models\SystemNotification::create([
            'type'                => $aprobado ? 'presupuesto_aprobado' : 'presupuesto_rechazado',
            'title'               => $aprobado ? 'Presupuesto aprobado' : 'Presupuesto rechazado',
            'message'             => ($aprobado ? 'El cliente aprobó el presupuesto de ' : 'El cliente rechazó el presupuesto de ')
                . $servicio->codigo_nota . ' (' . $servicio->equipo . ', ' . $servicio->cliente . '), Bs '
                . number_format((float) $servicio->precio_venta, 2) . '.'
                . ($aprobado ? ' Ya puedes empezar la reparación.' : ' El equipo espera a que lo recojan.'),
            'servicio_tecnico_id' => $servicio->id,
        ]);
    }

    /**
     * Los montos del servicio salen de sus trabajos, no del total que manda el navegador: así la nota, el total y la
     * utilidad siempre cuadran. El vendedor registra solo lo que paga el cliente; si el administrador deja algún costo
     * vacío, el servicio queda con el costo pendiente igual que uno del vendedor.
     */
    /* ======================================================
     * ESTADO DEL TRABAJO: recibido → en reparación → listo → entregado
     * ====================================================== */
    public function cambiarEstado(Request $request, ServicioTecnico $servicio)
    {
        $this->authorizeServicioAccess($servicio);

        // El desplegable solo mueve entre los estados válidos del modo. El presupuesto y el rechazo salen de su
        // propio flujo (cargar presupuesto / el cliente aprueba), no de acá.
        $datos = $request->validate(
            ['estado' => ['required', Rule::in($servicio->estadosSeleccionables())]],
            ['estado.in' => 'Ese paso no corresponde a este servicio.'],
        );

        if ($datos['estado'] === $servicio->estado) {
            return back();
        }

        $servicio->update(['estado' => $datos['estado']]);

        // Cada paso le avisa al cliente por correo, con la nota adjunta, si dejó un correo
        $correoEnviado = Envio::avisar($servicio, 'servicio');

        // Al entregar, además se le pide la reseña por correo (con retraso: así no llega pegado a la nota de entrega).
        if ($datos['estado'] === ServicioTecnico::ENTREGADO) {
            \App\Support\Resenas\Solicitud::pedir($servicio->refresh(), null, 'auto', retrasoMinutos: 180);
        }

        return back()->with('success', $servicio->codigo_nota . ': ' . $servicio->etiquetaDeEstado()
            . ($correoEnviado ? '. Aviso enviado por correo a ' . $servicio->correo . '.' : '.'));
    }

    /* ======================================================
     * EDICIÓN (admin y vendedor): por si alguien se equivoca al registrar
     * ====================================================== */
    public function edit(ServicioTecnico $servicio)
    {
        $this->authorizeServicioAccess($servicio);

        $esAdmin = ! SinCostos::aplica(Auth::user());

        // Los técnicos activos, más el del propio servicio aunque ya esté inactivo (para no perderlo al editar).
        $tecnicos = Tecnico::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'especialidad']);
        $actual = Tecnico::where('nombre', $servicio->tecnico)->first();
        if ($actual && ! $tecnicos->contains('id', $actual->id)) {
            $tecnicos->push($actual);
        }

        // Los trabajos ya parseados; al vendedor, sin el costo de cada uno.
        $trabajos = array_values($servicio->trabajos() ?? []);
        if (! $esAdmin) {
            $trabajos = array_map(function ($t) {
                if (is_array($t)) {
                    unset($t['costo']);
                }

                return $t;
            }, $trabajos);
        }

        return Inertia::render($esAdmin ? 'Admin/Servicios/Edit' : 'Vendedor/Servicios/Edit', [
            'servicio'       => array_merge(
                $esAdmin ? $servicio->toArray() : SinCostos::purgar($servicio),
                ['tecnico_id' => $actual?->id, 'trabajos' => $trabajos],
            ),
            'tecnicos'       => $tecnicos->map->only(['id', 'nombre', 'especialidad'])->values(),
            'marcas'         => collect(ServicioTecnico::MARCAS)->map(fn ($label, $value) => compact('value', 'label'))->values(),
            'especialidades' => collect(Tecnico::ESPECIALIDADES)->map(fn ($label, $value) => compact('value', 'label'))->values(),
            'revision'       => RecepcionDeEquipo::PUNTOS,
        ]);
    }

    public function update(Request $request, ServicioTecnico $servicio)
    {
        $this->authorizeServicioAccess($servicio);

        // Un diagnóstico que todavía no tiene presupuesto se edita sin trabajos ni precio: solo los datos y la cuota.
        if ($servicio->esDiagnostico() && in_array($servicio->estado, [ServicioTecnico::RECIBIDO, ServicioTecnico::EN_DIAGNOSTICO], true)) {
            return $this->actualizarDiagnostico($request, $servicio);
        }

        $data = $request->validate(RecepcionDeEquipo::reglas() + [
            'cliente'           => 'required|string|max:255',
            'telefono'          => 'nullable|string|max:50',
            'correo'            => 'nullable|email:rfc|max:191',
            'equipo'            => 'required|string|max:255',
            'marca'             => ['required', Rule::in(array_keys(ServicioTecnico::MARCAS))],
            'detalle_servicio'  => 'required|string',
            'notas_adicionales' => 'nullable|string',
            'precio_costo'      => 'nullable|numeric|min:0',
            'precio_venta'      => 'required|numeric|min:0',
            'tecnico_id'        => 'required|integer|exists:tecnicos,id',
            'fecha'             => 'nullable|date',
        ]);

        $tecnico = Tecnico::findOrFail($data['tecnico_id']);
        if (! $tecnico->atiende($data['marca'])) {
            throw ValidationException::withMessages(['tecnico_id' => $tecnico->nombre . ' no atiende esa marca.']);
        }
        $data['tecnico'] = $tecnico->nombre;

        $esAdmin = ! SinCostos::aplica(Auth::user());
        // El administrador manda los costos; el vendedor no los ve ni los toca: se conservan los que ya había.
        $montos = $esAdmin ? $this->montosDelServicio($data, true) : $this->montosVendedor($data, $servicio);
        $correo = Str::lower(trim((string) ($data['correo'] ?? ''))) ?: $servicio->correo;

        return DB::transaction(function () use ($servicio, $data, $montos, $esAdmin, $correo) {
            $antes = $this->servicioEditSnapshot($servicio);

            $cambios = [
                'cliente'           => $data['cliente'],
                'telefono'          => $data['telefono'] ?? null,
                'correo'            => $correo,
                'equipo'            => $data['equipo'],
                'marca'             => $data['marca'],
                'recepcion'         => RecepcionDeEquipo::normalizar($data['recepcion'] ?? null),
                'detalle_servicio'  => $montos['detalle'],
                'notas_adicionales' => $data['notas_adicionales'] ?? null,
                'precio_venta'      => $montos['venta'],
                'tecnico'           => $data['tecnico'],
                'fecha'             => $data['fecha'] ?? $servicio->fecha,
            ];

            // El costo solo lo escribe el administrador. El vendedor deja intacto lo que ya se cargó.
            if ($esAdmin) {
                $cambios['precio_costo']      = $montos['costo'];
                $cambios['costo_pendiente']   = $montos['pendiente'];
                $cambios['costo_cargado_por'] = $montos['pendiente'] ? null : Auth::id();
                $cambios['costo_cargado_en']  = $montos['pendiente'] ? null : now();
            }

            $servicio->update($cambios);
            $servicio->refresh();

            // El administrador ve qué se editó y quién lo hizo (igual que en ventas).
            $this->notifyAdminServiceEdited($servicio, $antes, $this->servicioEditSnapshot($servicio));

            return redirect()
                ->route($esAdmin ? 'admin.servicios.index' : 'vendedor.servicios.index')
                ->with('success', $servicio->codigo_nota . ' actualizado correctamente.');
        });
    }

    /** Editar un diagnóstico sin presupuesto: datos básicos y la cuota, sin trabajos ni precio de reparación. */
    private function actualizarDiagnostico(Request $request, ServicioTecnico $servicio)
    {
        $data = $request->validate(RecepcionDeEquipo::reglas() + [
            'cliente'           => 'required|string|max:255',
            'telefono'          => 'nullable|string|max:50',
            'correo'            => 'nullable|email:rfc|max:191',
            'equipo'            => 'required|string|max:255',
            'marca'             => ['required', Rule::in(array_keys(ServicioTecnico::MARCAS))],
            'notas_adicionales' => 'nullable|string',
            'cuota_diagnostico' => 'nullable|numeric|min:0',
            'tecnico_id'        => 'required|integer|exists:tecnicos,id',
            'fecha'             => 'nullable|date',
        ]);

        $tecnico = Tecnico::findOrFail($data['tecnico_id']);
        if (! $tecnico->atiende($data['marca'])) {
            throw ValidationException::withMessages(['tecnico_id' => $tecnico->nombre . ' no atiende esa marca.']);
        }

        $cuota = round((float) ($data['cuota_diagnostico'] ?? 0), 2);
        $correo = Str::lower(trim((string) ($data['correo'] ?? ''))) ?: $servicio->correo;

        return DB::transaction(function () use ($servicio, $data, $tecnico, $cuota, $correo) {
            $antes = $this->servicioEditSnapshot($servicio);

            $servicio->update([
                'cliente'           => $data['cliente'],
                'telefono'          => $data['telefono'] ?? null,
                'correo'            => $correo,
                'equipo'            => $data['equipo'],
                'marca'             => $data['marca'],
                'recepcion'         => RecepcionDeEquipo::normalizar($data['recepcion'] ?? null),
                'notas_adicionales' => $data['notas_adicionales'] ?? null,
                'cuota_diagnostico' => $cuota,
                'precio_venta'      => $cuota, // mientras no haya presupuesto, el cliente solo paga la cuota del diagnóstico
                'tecnico'           => $tecnico->nombre,
                'fecha'             => $data['fecha'] ?? $servicio->fecha,
            ]);
            $servicio->refresh();

            $this->notifyAdminServiceEdited($servicio, $antes, $this->servicioEditSnapshot($servicio));

            return redirect()
                ->route((! SinCostos::aplica(Auth::user())) ? 'admin.servicios.index' : 'vendedor.servicios.index')
                ->with('success', $servicio->codigo_nota . ' actualizado correctamente.');
        });
    }

    /**
     * Los montos cuando edita el vendedor: no ve ni manda costos. A cada trabajo se le vuelve a pegar el costo que ya
     * tenía (por su descripción); así lo que cargó el administrador no se pierde al corregir un nombre o un precio.
     * Un trabajo nuevo o renombrado queda sin su costo, pero el precio_costo del servicio no lo toca el vendedor.
     */
    private function montosVendedor(array $data, ServicioTecnico $servicio): array
    {
        $previos = collect($servicio->trabajos() ?? [])
            ->filter(fn ($t) => is_array($t) && isset($t['costo'], $t['descripcion']))
            ->keyBy(fn ($t) => trim((string) $t['descripcion']));

        $items = json_decode($data['detalle_servicio'], true);
        if (! is_array($items)) {
            throw ValidationException::withMessages(['detalle_servicio' => 'Agrega al menos un trabajo.']);
        }

        $trabajos = [];
        foreach ($items as $item) {
            $desc = trim(strip_tags((string) ($item['descripcion'] ?? '')));
            if ($desc === '') {
                continue;
            }
            $precio = $item['precio'] ?? null;
            if (! is_numeric($precio) || (float) $precio < 0) {
                throw ValidationException::withMessages(['detalle_servicio' => "Revisa lo que paga el cliente por «{$desc}»."]);
            }
            $trabajo = ['descripcion' => $desc, 'precio' => round((float) $precio, 2)];
            if ($previos->has($desc)) {
                $trabajo['costo'] = round((float) $previos[$desc]['costo'], 2);
            }
            $trabajos[] = $trabajo;
        }

        if ($trabajos === []) {
            throw ValidationException::withMessages(['detalle_servicio' => 'Agrega al menos un trabajo.']);
        }

        return [
            'detalle' => json_encode($trabajos, JSON_UNESCAPED_UNICODE),
            'venta'   => round(array_sum(array_column($trabajos, 'precio')), 2),
        ];
    }

    private function formatSnapshotValue($value, bool $dinero = false): string
    {
        if ($dinero) {
            return 'Bs ' . number_format((float) $value, 2);
        }

        if ($value === null || $value === '') {
            return 'vacío';
        }

        return (string) $value;
    }

    private function servicioEditSnapshot(ServicioTecnico $servicio): array
    {
        $trabajos = collect($servicio->trabajos() ?? [])->mapWithKeys(function ($t, $i) {
            $desc = is_array($t) ? ($t['descripcion'] ?? ('Trabajo #' . ($i + 1))) : (string) $t;

            return [$desc => ['precio' => is_array($t) ? (float) ($t['precio'] ?? 0) : 0]];
        })->all();

        return [
            'cliente'    => $servicio->cliente,
            'telefono'   => $servicio->telefono,
            'correo'     => $servicio->correo,
            'equipo'     => $servicio->equipo,
            'marca'      => ServicioTecnico::MARCAS[$servicio->marca] ?? $servicio->marca,
            'tecnico'    => $servicio->tecnico,
            'estado'     => $servicio->etiquetaDeEstado(),
            'venta'      => (float) ($servicio->precio_venta ?? 0),
            'costo'      => (float) ($servicio->precio_costo ?? 0),
            'notas'      => $servicio->notas_adicionales ?: null,
            'fecha'      => optional($servicio->fecha)->format('Y-m-d'),
            'desbloqueo' => RecepcionDeEquipo::textoDesbloqueo($servicio->recepcion['desbloqueo'] ?? null),
            'trabajos'   => $trabajos,
        ];
    }

    private function buildServicioEditChanges(array $before, array $after): array
    {
        $labels = [
            'cliente' => 'Cliente', 'telefono' => 'Teléfono', 'correo' => 'Correo',
            'equipo' => 'Equipo', 'marca' => 'Marca', 'tecnico' => 'Técnico',
            'estado' => 'Estado', 'notas' => 'Notas', 'fecha' => 'Fecha', 'desbloqueo' => 'Desbloqueo',
        ];
        $dinero = ['venta' => 'Lo que paga el cliente', 'costo' => 'Costo'];

        $cambios = [];

        foreach ($labels as $k => $label) {
            if (($before[$k] ?? null) != ($after[$k] ?? null)) {
                $cambios[] = $label . ': ' . $this->formatSnapshotValue($before[$k] ?? null)
                    . ' → ' . $this->formatSnapshotValue($after[$k] ?? null);
            }
        }

        foreach ($dinero as $k => $label) {
            if (($before[$k] ?? null) != ($after[$k] ?? null)) {
                $cambios[] = $label . ': ' . $this->formatSnapshotValue($before[$k] ?? null, true)
                    . ' → ' . $this->formatSnapshotValue($after[$k] ?? null, true);
            }
        }

        $antes = $before['trabajos'] ?? [];
        $desp = $after['trabajos'] ?? [];
        foreach ($desp as $desc => $t) {
            if (! array_key_exists($desc, $antes)) {
                $cambios[] = 'Trabajo agregado: ' . $desc . ' (' . $this->formatSnapshotValue($t['precio'] ?? 0, true) . ')';
            } elseif (($antes[$desc]['precio'] ?? null) != ($t['precio'] ?? null)) {
                $cambios[] = $desc . ' — cobro: ' . $this->formatSnapshotValue($antes[$desc]['precio'] ?? 0, true)
                    . ' → ' . $this->formatSnapshotValue($t['precio'] ?? 0, true);
            }
        }
        foreach ($antes as $desc => $t) {
            if (! array_key_exists($desc, $desp)) {
                $cambios[] = 'Trabajo quitado: ' . $desc;
            }
        }

        return $cambios;
    }

    private function notifyAdminServiceEdited(ServicioTecnico $servicio, array $before, array $after): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('system_notifications')) {
            return;
        }

        $cambios = $this->buildServicioEditChanges($before, $after);
        if ($cambios === []) {
            return;
        }

        $visibles = array_slice($cambios, 0, 8);
        if (($resto = count($cambios) - count($visibles)) > 0) {
            $visibles[] = '+' . $resto . ' cambios adicionales.';
        }

        $editor = Auth::user()->name ?? 'Usuario';

        \App\Models\SystemNotification::create([
            'type'                => 'service_edit',
            'title'               => 'Servicio editado',
            'message'             => $editor . ' editó el servicio ' . $servicio->codigo_nota
                . ".\nCliente: " . ($servicio->cliente ?: 'Sin cliente')
                . "\nEquipo: " . ($servicio->equipo ?: '—')
                . "\nCambios registrados:\n- " . implode("\n- ", $visibles),
            'servicio_tecnico_id' => $servicio->id,
        ]);
    }

    private function montosDelServicio(array $data, bool $esAdmin): array
    {
        $items = json_decode($data['detalle_servicio'], true);

        if (! is_array($items)) {
            $pendiente = ! $esAdmin || ! isset($data['precio_costo']);

            return [
                'detalle'   => $data['detalle_servicio'],
                'venta'     => round((float) $data['precio_venta'], 2),
                'costo'     => $pendiente ? 0 : round((float) $data['precio_costo'], 2),
                'pendiente' => $pendiente,
            ];
        }

        $trabajos = [];
        $errores = [];

        foreach (array_values($items) as $i => $item) {
            $descripcion = trim(strip_tags((string) ($item['descripcion'] ?? '')));

            if ($descripcion === '') {
                continue;
            }

            $precio = $item['precio'] ?? null;
            if (! is_numeric($precio) || (float) $precio < 0) {
                $errores['detalle_servicio'] = "Revisa lo que paga el cliente por «{$descripcion}».";
                continue;
            }

            $trabajo = ['descripcion' => $descripcion, 'precio' => round((float) $precio, 2)];

            $costo = $item['costo'] ?? null;
            if ($esAdmin && $costo !== null && $costo !== '') {
                if (! is_numeric($costo) || (float) $costo < 0) {
                    $errores['detalle_servicio'] = "Revisa el costo de «{$descripcion}».";
                    continue;
                }
                $trabajo['costo'] = round((float) $costo, 2);
            }

            $trabajos[] = $trabajo;
        }

        if ($trabajos === [] && $errores === []) {
            $errores['detalle_servicio'] = 'Agrega al menos un trabajo.';
        }

        if ($errores !== []) {
            throw \Illuminate\Validation\ValidationException::withMessages($errores);
        }

        $pendiente = ! $esAdmin || collect($trabajos)->contains(fn (array $t) => ! array_key_exists('costo', $t));

        return [
            'detalle'   => json_encode($trabajos, JSON_UNESCAPED_UNICODE),
            'venta'     => round(array_sum(array_column($trabajos, 'precio')), 2),
            'costo'     => round(array_sum(array_column($trabajos, 'costo')), 2),
            'pendiente' => $pendiente,
        ];
    }

    /** Servicios listos para el panel del vendedor: sin el costo del servicio ni el de cada trabajo. */
    /** Lo que el panel necesita para los botones Correo, WhatsApp y Copiar de cada fila. */
    private function conCompartir($servicios)
    {
        Documento::prepararEnlaces($servicios);

        return $servicios->each(fn (ServicioTecnico $s) => $s->setAttribute('compartir', Documento::compartir($s)));
    }

    private function sinCostos($servicios)
    {
        return SinCostos::deColeccion($servicios)->map(function (array $s) {
            $s['detalle_servicio'] = SinCostos::detalleDeServicio($s['detalle_servicio'] ?? null);

            return $s;
        })->values();
    }

    /* ======================================================
     * EXPORTACIONES BASE
     * ====================================================== */
    public function exportar(Request $request)
    {
        return $this->generarPDF(
            ServicioTecnico::with('vendedor')->orderByDesc('fecha')->get()
        );
    }

    public function exportarDia()
    {
        return $this->generarPDF(
            ServicioTecnico::whereDate('fecha', Carbon::now('America/La_Paz'))->get()
        );
    }

    public function exportarSemana()
    {
        return $this->generarPDF(
            ServicioTecnico::whereBetween('fecha', [
                Carbon::now('America/La_Paz')->startOfWeek(),
                Carbon::now('America/La_Paz')->endOfWeek()
            ])->get()
        );
    }

    public function exportarMes()
    {
        return $this->generarPDF(
            ServicioTecnico::whereBetween('fecha', [
                Carbon::now('America/La_Paz')->startOfMonth(),
                Carbon::now('America/La_Paz')->endOfMonth()
            ])->get()
        );
    }

    public function exportarAnio()
    {
        return $this->generarPDF(
            ServicioTecnico::whereBetween('fecha', [
                Carbon::now('America/La_Paz')->startOfYear(),
                Carbon::now('America/La_Paz')->endOfYear()
            ])->get()
        );
    }

    private function generarPDF($servicios)
    {
        return Pdf::loadView('pdf.servicios_tecnicos', compact('servicios'))
            ->setPaper('A4', 'portrait')
            ->download('reporte_servicios.pdf');
    }

    /* ======================================================
     * NORMALIZADOR (CORREGIDO)
     * ====================================================== */
    private function normalizarServiciosParaExport($servicios)
    {
        $filas = collect();

        foreach ($servicios as $servicio) {

            $items = json_decode($servicio->detalle_servicio, true);

            if (!is_array($items)) {
                continue;
            }

            foreach ($items as $item) {

                // Sin costo cargado no se inventa uno: el PDF dice «Pendiente» y no lo suma
                $costoReal = $servicio->costo_pendiente
                    ? null
                    : (isset($item['costo']) ? (float) $item['costo'] : (float) $servicio->precio_costo);

                $filas->push([
                    'codigo_nota' => $servicio->codigo_nota,
                    'cliente'     => $servicio->cliente,
                    'equipo'      => $servicio->equipo,
                    'servicio'    => $item['descripcion'] ?? '—',
                    'costo'       => $costoReal,
                    'pendiente'   => (bool) $servicio->costo_pendiente,
                    'venta'       => (float) ($item['precio'] ?? 0),
                    'tecnico'     => $servicio->tecnico,
                    'vendedor'    => optional($servicio->vendedor)->name ?? '—',
                    'fecha'       => $servicio->fecha,
                ]);
            }
        }

        return $filas;
    }


    /* ======================================================
     * EXPORTAR FILTRADO / RESUMEN
     * ====================================================== */
    public function exportarFiltrado(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
            'tecnico' => 'nullable|string|max:120',
        ]);

        $query = ServicioTecnico::with('vendedor')->orderByDesc('fecha')->orderByDesc('id');

        if (Auth::user()->rol === 'vendedor') {
            $query->where('user_id', Auth::id());
        }

        if ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }

        if ($request->filled('tecnico')) {
            $query->where('tecnico', $request->tecnico);
        }

        $filas = $this->normalizarServiciosParaExport($query->get());
        $periodo = $this->descripcionFiltros($request);
        $conCostos = ! SinCostos::aplica(Auth::user());

        return Pdf::loadView('pdf.servicios_tecnicos_resumen', compact('filas', 'periodo', 'conCostos'))
            ->setPaper('A4', 'landscape')
            ->download('servicios_tecnicos_filtrado.pdf');
    }

    /** Encabezado del PDF: qué período y filtros incluye el reporte. */
    private function descripcionFiltros(Request $request): string
    {
        $partes = [
            $request->filled('fecha_inicio') && $request->filled('fecha_fin')
                ? 'Del ' . Carbon::parse($request->fecha_inicio)->format('d/m/Y') . ' al ' . Carbon::parse($request->fecha_fin)->format('d/m/Y')
                : 'Todas las fechas',
        ];

        if ($request->filled('tecnico')) {
            $partes[] = 'Técnico: ' . $request->tecnico;
        }

        if (Auth::user()->rol === 'admin' && $request->filled('vendedor_id')) {
            $nombre = \App\Models\User::whereKey($request->vendedor_id)->value('name');
            if ($nombre) {
                $partes[] = 'Registrado por: ' . $nombre;
            }
        }

        return implode(' · ', $partes);
    }

    public function exportarResumen(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        // Sin fechas se toma el mes en curso: así el PDF nunca sale vacío por un parámetro que falta
        $desde = $request->input('fecha_inicio') ?: now()->startOfMonth()->toDateString();
        $hasta = $request->input('fecha_fin') ?: now()->endOfMonth()->toDateString();

        $servicios = ServicioTecnico::with('vendedor')
            ->when(Auth::user()->rol === 'vendedor', fn($q) => $q->where('user_id', Auth::id()))
            ->whereBetween('fecha', [$desde, $hasta])
            ->orderByDesc('fecha')
            ->get();

        $filas = $this->normalizarServiciosParaExport($servicios);
        $conCostos = ! SinCostos::aplica(Auth::user());

        return Pdf::loadView('pdf.servicios_tecnicos_resumen', compact('filas', 'conCostos'))
            ->setPaper('A4', 'landscape')
            ->stream('servicios_tecnicos_resumen.pdf');
    }

    /* ======================================================
     * BOLETA / RECIBO
     * ====================================================== */
    public function boleta(ServicioTecnico $servicio)
    {
        $this->authorizeServicioAccess($servicio);

        // El mismo PDF que recibe el cliente por correo y por el enlace firmado
        return Documento::pdf($servicio)->stream("boleta-servicio-{$servicio->codigo_nota}.pdf");
    }

    public function recibo80mm(ServicioTecnico $servicio)
    {
        $this->authorizeServicioAccess($servicio);

        $servicios_cliente = collect(json_decode($servicio->detalle_servicio, true));

        return Pdf::loadView('pdf.recibo_servicio_80mm', compact('servicio', 'servicios_cliente'))
            ->setPaper([0, 0, 226.77, 600], 'portrait')
            ->stream("recibo-{$servicio->codigo_nota}.pdf");
    }
}
