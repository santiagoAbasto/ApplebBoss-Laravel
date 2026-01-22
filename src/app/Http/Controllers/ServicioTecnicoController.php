<?php

namespace App\Http\Controllers;

use App\Models\ServicioTecnico;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use App\Services\GeneradorCodigos;
use App\Models\Cliente;


class ServicioTecnicoController extends Controller
{
    /* ======================================================
     * INDEX
     * ====================================================== */
    public function index(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'vendedor_id' => 'nullable|exists:users,id',
            'buscar' => 'nullable|string',
        ]);

        $query = ServicioTecnico::with('vendedor')->orderByDesc('fecha');

        if (Auth::user()->rol === 'vendedor') {
            $query->where('user_id', Auth::id());
        } elseif ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }

        if ($request->filled('buscar')) {
            $query->where(function ($q) use ($request) {
                $q->where('cliente', 'like', '%' . $request->buscar . '%')
                    ->orWhere('codigo_nota', 'like', '%' . $request->buscar . '%');
            });

            return response()->json([
                'servicios' => $query->get(),
            ]);
        }

        return Inertia::render(
            Auth::user()->rol === 'admin'
                ? 'Admin/Servicios/Index'
                : 'Vendedor/Servicios/Index',
            [
                'servicios' => $query->get(),
                'filtros' => $request->only(['fecha_inicio', 'fecha_fin', 'vendedor_id']),
                'vendedores' => Auth::user()->rol === 'admin'
                    ? \App\Models\User::where('rol', 'vendedor')->select('id', 'name')->get()
                    : [],
            ]
        );
    }

    /* ======================================================
     * CREATE
     * ====================================================== */
    public function create()
    {
        return Inertia::render(
            Auth::user()->rol === 'admin'
                ? 'Admin/Servicios/Create'
                : 'Vendedor/Servicios/Create'
        );
    }

    /* ======================================================
     * STORE
     * ====================================================== */
    public function store(Request $request)
    {
        \Log::info('REQUEST RAW', $request->all());

        $data = $request->validate([
            'cliente'           => 'required|string',
            'telefono'          => 'nullable|string',
            'equipo'            => 'required|string',
            'detalle_servicio'  => 'required|string',
            'notas_adicionales' => 'nullable|string',
            'precio_costo'      => 'required|numeric|min:0',
            'precio_venta'      => 'required|numeric|min:0',
            'tecnico'           => 'required|string',
            'fecha'             => 'nullable|date',
        ]);

        return DB::transaction(function () use ($data) {

            $cliente = Cliente::firstOrCreate(
                [
                    'user_id' => auth()->id(),
                    'nombre'  => $data['cliente'],
                ],
                [
                    'telefono' => $data['telefono'] ?? null,
                ]
            );

            ServicioTecnico::create([
                'codigo_nota'       => GeneradorCodigos::siguienteServicioTecnico(),
                'cliente'           => $cliente->nombre,
                'telefono'          => $cliente->telefono,
                'equipo'            => $data['equipo'],
                'detalle_servicio'  => $data['detalle_servicio'],
                'notas_adicionales' => $data['notas_adicionales'] ?? null,
                'precio_costo'      => $data['precio_costo'],
                'precio_venta'      => $data['precio_venta'],
                'tecnico'           => $data['tecnico'],
                'fecha'             => $data['fecha'] ?? now('America/La_Paz'),
                'user_id'           => auth()->id(),
            ]);

            \Log::info('SERVICIO TECNICO GUARDADO', $data);

            return redirect()
                ->route(auth()->user()->rol === 'admin'
                    ? 'admin.servicios.index'
                    : 'vendedor.servicios.index')
                ->with('success', 'Servicio técnico registrado correctamente.');
        });
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

                $costoReal = isset($item['costo'])
                    ? (float) $item['costo']
                    : (float) $servicio->precio_costo; // fallback SOLO si no existe

                $filas->push([
                    'codigo_nota' => $servicio->codigo_nota,
                    'cliente'     => $servicio->cliente,
                    'equipo'      => $servicio->equipo,
                    'servicio'    => $item['descripcion'] ?? '—',
                    'costo'       => $costoReal,
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
        $query = ServicioTecnico::with('vendedor')->orderByDesc('fecha');

        if (Auth::user()->rol === 'vendedor') {
            $query->where('user_id', Auth::id());
        }

        if ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }

        $filas = $this->normalizarServiciosParaExport($query->get());

        return Pdf::loadView('pdf.servicios_tecnicos_resumen', compact('filas'))
            ->setPaper('A4', 'landscape')
            ->download('servicios_tecnicos_filtrado.pdf');
    }

    public function exportarResumen(Request $request)
    {
        $servicios = ServicioTecnico::with('vendedor')
            ->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin])
            ->orderByDesc('fecha')
            ->get();

        $filas = $this->normalizarServiciosParaExport($servicios);

        return Pdf::loadView('pdf.servicios_tecnicos_resumen', compact('filas'))
            ->setPaper('A4', 'landscape')
            ->stream('servicios_tecnicos_resumen.pdf');
    }

    /* ======================================================
     * BOLETA / RECIBO
     * ====================================================== */
    public function boleta(ServicioTecnico $servicio)
    {
        $servicio->load('vendedor');

        $servicios_cliente = collect(json_decode($servicio->detalle_servicio, true))
            ->filter(fn($i) => isset($i['descripcion']))
            ->map(fn($i) => [
                'descripcion' => $i['descripcion'],
                'precio' => (float) ($i['precio'] ?? 0),
            ]);

        return Pdf::loadView('pdf.boleta_servicio', compact('servicio', 'servicios_cliente'))
            ->stream("boleta-servicio-{$servicio->codigo_nota}.pdf");
    }

    public function recibo80mm(ServicioTecnico $servicio)
    {
        $servicios_cliente = collect(json_decode($servicio->detalle_servicio, true));

        return Pdf::loadView('pdf.recibo_servicio_80mm', compact('servicio', 'servicios_cliente'))
            ->setPaper([0, 0, 226.77, 600], 'portrait')
            ->stream("recibo-{$servicio->codigo_nota}.pdf");
    }
}
