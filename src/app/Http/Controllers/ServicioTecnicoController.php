<?php

namespace App\Http\Controllers;
use App\Models\Venta;


use App\Models\ServicioTecnico;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ServicioTecnicoController extends Controller
{
    public function index()
    {
        $servicios = ServicioTecnico::with('vendedor')->latest()->get();
        return Inertia::render(Auth::user()->rol === 'admin'
            ? 'Admin/Servicios/Index'
            : 'Vendedor/Servicios/Index', [
                'servicios' => $servicios
        ]);
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
            'precio_costo' => 'required|numeric',
            'precio_venta' => 'required|numeric',
            'tecnico' => 'required|string',
            'fecha' => 'required|date',
        ]);
    
        $data['user_id'] = Auth::id();
    
        // 1. Registrar el servicio técnico
        ServicioTecnico::create($data);
    
        // 2. Registrar también una venta asociada
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
}    