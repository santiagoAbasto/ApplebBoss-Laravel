<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Carrito;
use App\Support\Carritos\Recuperacion;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/** Ventas y operación → Carritos abandonados: quién dejó qué, si ya se le recordó, y el WhatsApp listo para escribirle. */
class CarritoController extends Controller
{
    public function index(): Response
    {
        $desde = now()->subDays(30);

        $filas = Carrito::with(['user:id,name,email,telefono,sin_recordatorios', 'pedido:id,codigo', 'pedidoRecuperado:id,codigo,total'])
            ->where(fn ($q) => $q->whereNull('recuperado_en')->orWhere('recuperado_en', '>=', $desde))
            ->orderByRaw('case when recuperado_en is null then 0 else 1 end')
            ->orderByDesc('actualizado_en')
            ->limit(200)
            ->get()
            ->map(fn (Carrito $c) => [
                'id'                => $c->id,
                'cliente'           => ['nombre' => $c->user?->name, 'email' => $c->user?->email, 'telefono' => $c->user?->telefono],
                'items'             => collect($c->items)->pluck('nombre')->all(),
                'total'             => (float) $c->total,
                'origen'            => $c->origen,
                'pedido'            => $c->pedido?->codigo,
                'pedido_id'         => $c->pedido_id,
                'estado'            => $c->estado(),
                'recordatorios'     => $c->recordatorios,
                'actualizado_en'    => $c->actualizado_en,
                'recordado_en'      => $c->recordado_en,
                'recuperado_en'     => $c->recuperado_en,
                'recuperado'        => $c->pedidoRecuperado?->codigo,
                'recuperado_total'  => $c->pedidoRecuperado ? (float) $c->pedidoRecuperado->total : null,
                'whatsapp'          => $c->whatsapp(),
                'enlace'            => $c->enlace(),
                'sin_recordatorios' => (bool) $c->user?->sin_recordatorios,
            ]);

        $recuperados = Carrito::with('pedidoRecuperado:id,total')->where('recuperado_en', '>=', $desde)->get();
        $recordados = Carrito::where(fn ($q) => $q->where('recordado_en', '>=', $desde)->orWhere('recuperado_en', '>=', $desde))->count();

        return Inertia::render('Admin/Carritos/Index', [
            'filas'     => $filas,
            'etiquetas' => Carrito::ETIQUETAS,
            'resumen'   => [
                'abiertos'       => Carrito::abierto()->count(),
                'recordados_30'  => $recordados,
                'recuperados_30' => $recuperados->count(),
                'monto_30'       => (float) $recuperados->sum(fn (Carrito $c) => (float) ($c->pedidoRecuperado?->total ?? $c->total)),
                'tasa_30'        => $recordados > 0 ? round($recuperados->count() * 100 / $recordados) : null,
            ],
            'primerAviso'  => Recuperacion::PRIMER_AVISO_MINUTOS,
            'segundoAviso' => Recuperacion::SEGUNDO_AVISO_HORAS,
        ]);
    }

    public function recordar(Carrito $carrito): RedirectResponse
    {
        if ($carrito->recuperado_en) {
            return back()->with('error', 'Ese carrito ya se recuperó: la persona compró.');
        }
        if ($carrito->user?->sin_recordatorios) {
            return back()->with('error', 'Esa persona pidió no recibir más recordatorios. Queda el WhatsApp.');
        }

        return Recuperacion::recordar($carrito)
            ? back()->with('success', 'Recordatorio enviado por correo.')
            : back()->with('error', 'Ya no queda nada disponible de ese carrito, así que se descartó.');
    }
}
