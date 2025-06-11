<?php

namespace App\Http\Controllers\Vendedor;

use App\Http\Controllers\Controller;
use App\Models\Venta;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use App\Models\Cotizacion;
use App\Models\ServicioTecnico;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardVendedorController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $hoy = now()->toDateString();

        // Ventas del día del vendedor
        $ventasHoy = Venta::where('user_id', $user->id)->whereDate('fecha', $hoy)->get();
        $gananciaHoy = 0;

        foreach ($ventasHoy as $venta) {
            $permuta = optional($venta->entregadoCelular)->precio_costo
                ?? optional($venta->entregadoComputadora)->precio_costo
                ?? optional($venta->entregadoProductoGeneral)->precio_costo
                ?? optional($venta->entregadoProductoApple)->precio_costo
                ?? 0;

            foreach ($venta->items as $item) {
                $permutaAplicada = in_array($item->tipo, ['celular', 'computadora', 'producto_apple']);
                $permutaReal = $permutaAplicada ? $permuta : 0;
                $gananciaHoy += $item->precio_venta - $item->descuento - $permutaReal - $item->precio_invertido;
            }

            if ($venta->tipo_venta === 'servicio_tecnico' && $venta->items->isEmpty()) {
                $gananciaHoy += $venta->precio_venta - $venta->descuento - $venta->precio_invertido;
            }
        }

        // Últimas ventas
        $ultimasVentas = Venta::where('user_id', $user->id)->latest()->take(5)->get()->map(function ($v) {
            return [
                'nombre_cliente' => $v->nombre_cliente,
                'total' => $v->items->sum(fn($i) => $i->precio_venta - $i->descuento),
                'fecha' => $v->fecha,
            ];
        });

        // Cotizaciones del día
        $cotizacionesDia = Cotizacion::where('user_id', $user->id)->whereDate('created_at', $hoy)->count();
        $ultimasCotizaciones = Cotizacion::where('user_id', $user->id)->latest()->take(5)->get();

        // Servicios del día
        $serviciosDia = ServicioTecnico::where('user_id', $user->id)->whereDate('fecha', $hoy)->count();
        $ultimosServicios = ServicioTecnico::where('user_id', $user->id)->latest()->take(5)->get();

        return Inertia::render('Vendedor/Dashboard', [
            'auth' => ['user' => $user],
            'resumen' => [
                'ventas_dia' => $ventasHoy->sum('subtotal'),
                'ganancia_dia' => $gananciaHoy,
                'cotizaciones_dia' => $cotizacionesDia,
                'servicios_dia' => $serviciosDia,
                'total_mes' => Venta::where('user_id', $user->id)->whereMonth('fecha', now()->month)->sum('subtotal'),
                'meta_mensual' => 10000, // puedes hacer esto dinámico si deseas
            ],
            'ultimasVentas' => $ultimasVentas,
            'ultimasCotizaciones' => $ultimasCotizaciones->map(fn($c) => [
                'id' => $c->id,
                'cliente' => $c->cliente,
                'total' => $c->total,
                'created_at' => $c->created_at,
            ]),
            'ultimosServicios' => $ultimosServicios->map(fn($s) => [
                'id' => $s->id,
                'equipo' => $s->equipo,
                'precio_venta' => $s->precio_venta,
                'fecha' => $s->fecha,
            ]),
        ]);
    }
}
