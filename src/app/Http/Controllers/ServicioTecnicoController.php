<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\ServicioTecnico;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;


class ServicioTecnicoController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'vendedor_id' => 'nullable|exists:users,id',
            'buscar' => 'nullable|string',
        ]);

        $query = ServicioTecnico::with('vendedor')->orderByDesc('fecha');

        // Si el usuario es vendedor, solo puede ver sus propios servicios
        if (Auth::user()->rol === 'vendedor') {
            $query->where('user_id', Auth::id());
        } elseif ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }

        // ✅ Búsqueda por nombre de cliente o código de nota
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

    public function exportarFiltrado(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'vendedor_id' => 'nullable|exists:users,id',
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

        $servicios = $query->get();

        // ✅ Usa la vista adecuada para listado
        $pdf = Pdf::loadView('pdf.servicios_tecnicos_resumen', compact('servicios'))
            ->setPaper('A4', 'landscape');

        return $pdf->download('servicios_tecnicos_filtrado.pdf');
    }


    public function create()
    {
        return Inertia::render(Auth::user()->rol === 'admin'
            ? 'Admin/Servicios/Create'
            : 'Vendedor/Servicios/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'codigo_nota'      => 'nullable|string|max:255',
            'cliente'          => 'required|string',
            'telefono'         => 'nullable|string',
            'equipo'           => 'required|string',
            'detalle_servicio' => 'required|string',
            'precio_costo'     => 'required|numeric|min:0',
            'precio_venta'     => 'required|numeric|min:0',
            'tecnico'          => 'required|string',
            'fecha'            => 'nullable|date',
        ]);

        $data['fecha'] = $data['fecha'] ?? now('America/La_Paz');

        // Buscar o crear cliente
        $cliente = \App\Models\Cliente::firstOrCreate(
            [
                'nombre'   => $data['cliente'],
                'telefono' => $data['telefono'],
            ],
            [
                'user_id' => auth()->id(),
            ]
        );

        // Crear servicio técnico
        $servicio = \App\Models\ServicioTecnico::create([
            'codigo_nota'      => $data['codigo_nota'],
            'cliente'          => $data['cliente'],
            'telefono'         => $data['telefono'],
            'equipo'           => $data['equipo'],
            'detalle_servicio' => $data['detalle_servicio'],
            'precio_costo'     => $data['precio_costo'],
            'precio_venta'     => $data['precio_venta'],
            'tecnico'          => $data['tecnico'],
            'fecha'            => $data['fecha'],
            'user_id'          => auth()->id(),
            'cliente_id'       => $cliente->id,
        ]);

        // Crear venta asociada
        $venta = \App\Models\Venta::create([
            'codigo_nota'      => $data['codigo_nota'],
            'nombre_cliente'   => $data['cliente'],
            'telefono_cliente' => $data['telefono'],
            'fecha'            => $data['fecha'],
            'tipo_venta'       => 'servicio_tecnico',
            'metodo_pago'      => 'efectivo',
            'descuento'        => 0,
            'precio_invertido' => $data['precio_costo'],
            'precio_venta'     => $data['precio_venta'],
            'ganancia_neta'    => $data['precio_venta'] - $data['precio_costo'],
            'subtotal'         => $data['precio_venta'],
            'notas_adicionales' => 'Servicio Técnico',
            'user_id'          => auth()->id(),
        ]);

        // Vincular venta al servicio
        $servicio->update(['venta_id' => $venta->id]);

        // Redireccionar según el rol
        $rol = auth()->user()->rol;
        $ruta = $rol === 'admin' ? 'admin.servicios.index' : 'vendedor.servicios.index';

        return redirect()->route($ruta)->with('success', 'Servicio técnico registrado correctamente.');
    }

    public function exportar(Request $request)
    {
        $query = ServicioTecnico::query()->with('vendedor')->orderByDesc('fecha');

        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }

        if ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }

        $servicios = $query->get();

        return $this->generarPDF($servicios);
    }

    public function exportarDia()
    {
        $hoy = Carbon::now('America/La_Paz')->toDateString();
        $servicios = ServicioTecnico::whereDate('fecha', $hoy)->get();

        return $this->generarPDF($servicios);
    }

    public function exportarSemana()
    {
        $inicio = Carbon::now('America/La_Paz')->startOfWeek()->toDateString();
        $fin = Carbon::now('America/La_Paz')->endOfWeek()->toDateString();

        $servicios = ServicioTecnico::whereBetween('fecha', [$inicio, $fin])->get();

        return $this->generarPDF($servicios);
    }

    public function exportarMes()
    {
        $inicio = Carbon::now('America/La_Paz')->startOfMonth()->toDateString();
        $fin = Carbon::now('America/La_Paz')->endOfMonth()->toDateString();

        $servicios = ServicioTecnico::whereBetween('fecha', [$inicio, $fin])->get();

        return $this->generarPDF($servicios);
    }

    public function exportarAnio()
    {
        $inicio = Carbon::now('America/La_Paz')->startOfYear()->toDateString();
        $fin = Carbon::now('America/La_Paz')->endOfYear()->toDateString();

        $servicios = ServicioTecnico::whereBetween('fecha', [$inicio, $fin])->get();

        return $this->generarPDF($servicios);
    }

    private function generarPDF($servicios)
    {
        $pdf = Pdf::loadView('pdf.servicios_tecnicos', [
            'servicios' => $servicios
        ])->setPaper('A4', 'portrait');

        return $pdf->download('reporte_servicios.pdf');
    }

    public function boleta(ServicioTecnico $servicio)
    {
        $servicio->load('vendedor');

        return Pdf::loadView('pdf.boleta_servicio', [
            'servicio' => $servicio,
        ])->stream("boleta-servicio-{$servicio->id}.pdf");
    }

    public function buscar(Request $request)
    {
        $request->validate([
            'buscar' => 'required|string',
        ]);

        $servicios = ServicioTecnico::where(function ($q) use ($request) {
            $q->where('cliente', 'like', '%' . $request->buscar . '%')
                ->orWhere('codigo_nota', 'like', '%' . $request->buscar . '%');
        })
            ->where('user_id', Auth::id()) // solo del vendedor autenticado
            ->orderByDesc('fecha')
            ->take(10)
            ->get();

        return response()->json(['servicios' => $servicios]);
    }
    public function exportarResumen(Request $request)
    {
        $servicios = ServicioTecnico::with('vendedor')
            ->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin])
            ->orderByDesc('fecha')
            ->get();

        $pdf = PDF::loadView('pdf.servicios_tecnicos_resumen', compact('servicios'))
            ->setPaper('A4', 'landscape');

        return $pdf->stream('servicios_tecnicos_resumen.pdf');
    }
}
