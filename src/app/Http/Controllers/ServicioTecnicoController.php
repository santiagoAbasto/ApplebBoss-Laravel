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
        ]);
    
        $query = ServicioTecnico::with('vendedor')->orderByDesc('fecha');
    
        // Si el usuario es vendedor, solo puede ver sus propios servicios
        if (Auth::user()->rol === 'vendedor') {
            $query->where('user_id', Auth::id());
        } elseif ($request->filled('vendedor_id')) {
            // Solo los administradores pueden usar el filtro de vendedor
            $query->where('user_id', $request->vendedor_id);
        }
    
        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
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
    
        // Si es vendedor, restringimos a sus servicios
        if (Auth::user()->rol === 'vendedor') {
            $query->where('user_id', Auth::id());
        } elseif ($request->filled('vendedor_id')) {
            $query->where('user_id', $request->vendedor_id);
        }
    
        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
        }
    
        $servicios = $query->get();
    
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.servicios_tecnicos', [
            'servicios' => $servicios
        ])->setPaper('A4', 'portrait');
    
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
            'cliente' => 'required|string',
            'telefono' => 'nullable|string',
            'equipo' => 'required|string',
            'detalle_servicio' => 'required|string',
            'precio_costo' => 'required|numeric|min:0',
            'precio_venta' => 'required|numeric|min:0',
            'tecnico' => 'required|string',
            'fecha' => 'nullable|date',
        ]);

        $data['fecha'] = $data['fecha'] ?? now('America/La_Paz');
        $data['user_id'] = Auth::id();

        // 1. Registrar el servicio técnico
        ServicioTecnico::create($data);

        // 2. Registrar también una venta asociada (para reportes generales)
        Venta::create([
            'nombre_cliente' => $data['cliente'],
            'telefono_cliente' => $data['telefono'],
            'tipo_venta' => 'servicio_tecnico',
            'es_permuta' => false,
            'cantidad' => 1,
            'precio_invertido' => $data['precio_costo'],
            'precio_venta' => $data['precio_venta'],
            'ganancia_neta' => $data['precio_venta'] - $data['precio_costo'],
            'subtotal' => $data['precio_venta'],
            'descuento' => 0,
            'user_id' => Auth::id(),
            'metodo_pago' => 'efectivo',
            'fecha' => $data['fecha'],
        ]);

        return redirect()->route(Auth::user()->rol === 'admin'
            ? 'admin.servicios.index'
            : 'vendedor.servicios.index')->with('success', 'Servicio técnico registrado.');
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
}
