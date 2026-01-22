<?php

namespace App\Http\Controllers\Vendedor;

use App\Http\Controllers\Controller;
use App\Models\Venta;
use App\Models\Cotizacion;
use App\Models\ServicioTecnico;
use App\Models\Egreso;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardVendedorController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $hoy  = now()->toDateString();
        $mes  = now()->month;

        /* ===============================
           TOTALES DEL DÍA
        =============================== */
        $totalBruto   = 0;
        $totalPagado  = 0;
        $gananciaNeta = 0;

        /* ===============================
           VENTAS DEL DÍA
        =============================== */
        $ventasHoy = Venta::with('items')
            ->where('user_id', $user->id)
            ->whereDate('fecha', $hoy)
            ->get();

        foreach ($ventasHoy as $venta) {

            $brutoVenta = $venta->items->sum(fn ($i) =>
                (float)$i->precio_venta - (float)$i->descuento
            );

            $valorPermuta = (float) ($venta->valor_permuta ?? 0);

            $totalBruto  += $brutoVenta;
            $totalPagado += max(0, $brutoVenta - $valorPermuta);

            foreach ($venta->items as $item) {
                $gananciaNeta +=
                    (float)$item->precio_venta
                    - (float)$item->descuento
                    - (float)$item->precio_invertido
                    - $valorPermuta;
            }
        }

        /* ===============================
           SERVICIOS TÉCNICOS
        =============================== */
        $serviciosHoy = ServicioTecnico::where('user_id', $user->id)
            ->whereDate('fecha', $hoy)
            ->get();

        foreach ($serviciosHoy as $s) {
            $totalBruto  += (float)$s->precio_venta;
            $totalPagado += (float)$s->precio_venta;
            $gananciaNeta += (float)$s->precio_venta - (float)$s->precio_costo;
        }

        /* ===============================
           EGRESOS (SOLO RESTAN GANANCIA)
        =============================== */
        $egresosHoy = Egreso::whereDate('created_at', $hoy)
            ->sum('precio_invertido');

        $disponibleHoy = max(0, $gananciaNeta - $egresosHoy);

        /* ===============================
           ÚLTIMOS REGISTROS
        =============================== */
        $ultimasVentas = $ventasHoy->take(5)->map(function ($v) {
            return [
                'id' => $v->id,
                'nombre_cliente' => $v->nombre_cliente,
                'total' => $v->items->sum(fn ($i) =>
                    (float)$i->precio_venta - (float)$i->descuento
                ),
            ];
        });

        $ultimasCotizaciones = Cotizacion::where('user_id', $user->id)
            ->latest()->take(5)->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'nombre_cliente' => $c->nombre_cliente,
                'total' => $c->total,
            ]);

        $ultimosServicios = $serviciosHoy->take(5)->map(fn ($s) => [
            'id' => $s->id,
            'equipo' => $s->equipo,
            'precio_venta' => $s->precio_venta,
        ]);

        /* ===============================
           TOTAL DEL MES
        =============================== */
        $totalMes = Venta::with('items')
            ->where('user_id', $user->id)
            ->whereMonth('fecha', $mes)
            ->get()
            ->sum(fn ($v) =>
                $v->items->sum(fn ($i) =>
                    (float)$i->precio_venta - (float)$i->descuento
                )
            )
            + ServicioTecnico::where('user_id', $user->id)
                ->whereMonth('fecha', $mes)
                ->sum('precio_venta');

        /* ===============================
           RENDER
        =============================== */
        return Inertia::render('Vendedor/Dashboard', [
            'auth' => ['user' => $user],

            'resumen' => [
                'total_bruto_dia'   => $totalBruto,     // 8500
                'total_pagado_dia'  => $totalPagado,    // 6500
                'ganancia_neta_dia' => $gananciaNeta,   // 2800
                'egresos_dia'       => $egresosHoy,     // 100
                'disponible_dia'    => $disponibleHoy,  // 2700
                'cotizaciones_dia'  => Cotizacion::where('user_id', $user->id)
                    ->whereDate('created_at', $hoy)->count(),
                'servicios_dia'     => $serviciosHoy->count(),
                'total_mes'         => $totalMes,
                'meta_mensual'      => 10000,
            ],

            'ultimasVentas'       => $ultimasVentas,
            'ultimasCotizaciones' => $ultimasCotizaciones,
            'ultimosServicios'    => $ultimosServicios,
        ]);
    }
}
