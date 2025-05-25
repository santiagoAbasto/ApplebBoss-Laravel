<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ServicioTecnico;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $ventasHoy = Venta::whereDate('created_at', today())->sum('subtotal');

        $stockTotal = Celular::where('estado', 'disponible')->count()
                    + Computadora::where('estado', 'disponible')->count()
                    + ProductoGeneral::where('estado', 'disponible')->count();

        $permutas = Venta::where('es_permuta', true)->count();

        $servicios = ServicioTecnico::whereDate('created_at', today())->count();

        return Inertia::render('Admin/Dashboard', [
            'user' => Auth::user(),
            'resumen' => [
                'ventas_hoy' => $ventasHoy,
                'stock_total' => $stockTotal,
                'permutas' => $permutas,
                'servicios' => $servicios,
            ]
        ]);
    }
}
