<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\PedidoEvento;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Usuarios de la tienda: las cuentas que crean los clientes para comprar por la web.
 *
 * No son usuarios del panel (esos están en Sistema → Usuarios y roles): acá solo aparecen las de rol «cliente».
 * La ficha junta todo lo que hizo cada uno: sus pedidos, en qué estado va cada uno y su línea de tiempo.
 */
class CuentaTiendaController extends Controller
{
    public function index(Request $request): Response
    {
        $busca  = trim($request->string('q')->toString());
        $filtro = $request->string('filtro')->toString() ?: 'todos';

        $cuentas = User::query()
            ->where('rol', 'cliente')
            ->when($busca !== '', fn (Builder $q) => $q->where(fn (Builder $sub) => $sub
                ->where('name', 'like', "%{$busca}%")
                ->orWhere('email', 'like', "%{$busca}%")
                ->orWhere('telefono', 'like', "%{$busca}%")))
            ->when($filtro === 'compraron', fn (Builder $q) => $q->whereHas('pedidos', fn (Builder $p) => $p->whereIn('estado', Pedido::CON_PAGO_CONFIRMADO)))
            ->when($filtro === 'sin_pedidos', fn (Builder $q) => $q->doesntHave('pedidos'))
            ->withCount('pedidos')
            ->withSum(['pedidos as total_comprado' => fn (Builder $q) => $q->whereIn('estado', Pedido::CON_PAGO_CONFIRMADO)], 'total')
            ->withMax('pedidos as ultimo_pedido', 'created_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $u) => [
                'id'             => $u->id,
                'nombre'         => $u->name,
                'email'          => $u->email,
                'telefono'       => $u->telefono,
                'google'         => filled($u->google_id),
                'pedidos'        => (int) $u->pedidos_count,
                'total_comprado' => (float) ($u->total_comprado ?? 0),
                'ultimo_pedido'  => $u->ultimo_pedido,
                'creada_en'      => $u->created_at?->toIso8601String(),
            ]);

        $clientes = User::where('rol', 'cliente');

        return Inertia::render('Admin/CuentasTienda/Index', [
            'cuentas' => $cuentas,
            'filtros' => ['q' => $busca, 'filtro' => $filtro],
            'resumen' => [
                'cuentas'     => (clone $clientes)->count(),
                'compraron'   => (clone $clientes)->whereHas('pedidos', fn (Builder $p) => $p->whereIn('estado', Pedido::CON_PAGO_CONFIRMADO))->count(),
                'con_google'  => (clone $clientes)->whereNotNull('google_id')->count(),
                'esta_semana' => (clone $clientes)->where('created_at', '>=', now()->subDays(7))->count(),
            ],
        ]);
    }

    public function show(User $cuenta): Response
    {
        // Una cuenta del panel no se abre por acá: esta pantalla es solo de clientes
        abort_unless($cuenta->rol === 'cliente', 404);

        // Sus pedidos, más los que hizo con el mismo correo antes de que existieran las cuentas
        $pedidos = Pedido::with(['items:id,pedido_id,nombre,cantidad,condicion', 'eventos.usuario:id,name', 'resena:id,pedido_id,calificacion,publicada'])
            ->where(fn (Builder $q) => $q->where('user_id', $cuenta->id)
                ->orWhere(fn (Builder $viejos) => $viejos->whereNull('user_id')->where('email_cliente', $cuenta->email)))
            ->latest('id')
            ->get();

        $pagados = $pedidos->filter(fn (Pedido $p) => $p->pagoConfirmado());

        return Inertia::render('Admin/CuentasTienda/Show', [
            'cuenta' => [
                'id'         => $cuenta->id,
                'nombre'     => $cuenta->name,
                'email'      => $cuenta->email,
                'telefono'   => $cuenta->telefono,
                'google'     => filled($cuenta->google_id),
                'verificada' => $cuenta->email_verified_at !== null,
                'creada_en'  => $cuenta->created_at?->toIso8601String(),
            ],
            'resumen' => [
                'pedidos'        => $pedidos->count(),
                'pagados'        => $pagados->count(),
                'total_comprado' => (float) $pagados->sum('total'),
                'en_curso'       => $pedidos->whereIn('estado', [Pedido::PENDIENTE_PAGO, Pedido::PAGO_EN_REVISION, Pedido::PAGADO, Pedido::PREPARANDO, Pedido::ENVIADO])->count(),
                'ultimo_pedido'  => $pedidos->first()?->created_at?->toIso8601String(),
            ],
            'pedidos' => $pedidos->map(fn (Pedido $p) => [
                'id'          => $p->id,
                'codigo'      => $p->codigo,
                'estado'      => $p->estado,
                'etiqueta'    => $p->etiqueta(),
                'total'       => (float) $p->total,
                'metodo'      => $p->metodo_pago,
                'entrega'     => $p->tipo_entrega,
                'destino'     => $p->esADomicilio()
                    ? collect([$p->envio_direccion, $p->envio_barrio, $p->envio_zona, $p->envio_ciudad])->filter()->implode(', ')
                    : null,
                'creado_en'   => $p->created_at?->toIso8601String(),
                'sin_cuenta'  => $p->user_id === null,
                'articulos'   => $p->items->map(fn ($i) => trim($i->nombre . ($i->cantidad > 1 ? " ×{$i->cantidad}" : '')))->all(),
                'resena'      => $p->resena ? ['calificacion' => $p->resena->calificacion, 'publicada' => $p->resena->publicada] : null,
                // Toda la línea de tiempo: acá también lo interno, con su autor
                'eventos'     => $p->eventos->sortBy('id')->values()->map(fn (PedidoEvento $e) => [
                    'titulo'  => $e->titulo,
                    'detalle' => $e->detalle,
                    'publico' => (bool) $e->publico,
                    'autor'   => $e->usuario?->name,
                    'fecha'   => $e->created_at?->toIso8601String(),
                ])->all(),
            ])->values()->all(),
        ]);
    }
}
