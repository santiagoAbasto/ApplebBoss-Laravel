<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\Resena;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Seguimiento público de un pedido.
 *
 * Es privado por diseño: hace falta el enlace con token, o el código junto con el correo
 * con el que se compró. Nunca se lista ni se puede adivinar por código solo.
 */
class SeguimientoController extends Controller
{
    /** Formulario para buscar el pedido. */
    public function buscar(): Response
    {
        return Inertia::render('Store/SeguimientoBuscar');
    }

    /** Verifica código + correo y lleva al seguimiento. */
    public function resolver(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'codigo' => ['required', 'string', 'max:20'],
            'email'  => ['required', 'email:rfc', 'max:150'],
        ]);

        $pedido = Pedido::where('codigo', trim($datos['codigo']))->first();

        // Mensaje igual en los dos casos: no revelamos si el código existe
        if (! $pedido || ! hash_equals(mb_strtolower($pedido->email_cliente), mb_strtolower(trim($datos['email'])))) {
            return back()->withErrors([
                'codigo' => 'No encontramos un pedido con ese código y ese correo.',
            ])->withInput();
        }

        return redirect()->route('seguimiento.ver', [
            'codigo' => $pedido->codigo,
            't'      => $pedido->token_seguimiento,
        ]);
    }

    /** La línea de tiempo del pedido, solo para su dueño. */
    public function ver(Request $request, string $codigo): Response
    {
        $pedido = Pedido::with(['items', 'eventos'])->where('codigo', $codigo)->firstOrFail();

        $token = (string) $request->query('t', '');
        abort_unless($token !== '' && hash_equals($pedido->token_seguimiento, $token), 404);

        return Inertia::render('Store/Seguimiento', [
            'pedido' => $pedido->paraElCliente(),
            'token'  => $pedido->token_seguimiento,
        ]);
    }

    /**
     * La opinión de quien ya recibió su pedido: es la reseña de compra verificada.
     *
     * Una por pedido, solo con el enlace del pedido y solo después de la entrega. Queda esperando aprobación en
     * Tienda online → Reseñas: nada se publica solo.
     */
    public function opinar(Request $request, string $codigo): RedirectResponse
    {
        $pedido = Pedido::with('items')->where('codigo', $codigo)->firstOrFail();

        $token = (string) $request->query('t', $request->input('t', ''));
        abort_unless($token !== '' && hash_equals($pedido->token_seguimiento, $token), 404);

        if ($pedido->estado !== Pedido::ENTREGADO) {
            return back()->with('error', 'Puedes dejar tu opinión cuando recibas tu pedido.');
        }

        if (Resena::where('pedido_id', $pedido->id)->exists()) {
            return back()->with('error', 'Ya nos dejaste tu opinión sobre este pedido. ¡Gracias!');
        }

        $datos = $request->validate([
            'calificacion' => ['required', 'integer', 'between:1,5'],
            'texto'        => ['required', 'string', 'min:10', 'max:1000'],
        ], [
            'texto.min' => 'Cuéntanos un poco más: al menos 10 letras.',
        ], ['calificacion' => 'calificación', 'texto' => 'opinión']);

        Resena::create([
            'nombre'       => $pedido->nombre_cliente,
            'calificacion' => $datos['calificacion'],
            'texto'        => trim(strip_tags($datos['texto'])),
            'fuente'       => 'web',
            'producto'     => $pedido->items->first()?->nombre,
            'fecha'        => now()->toDateString(),
            'pedido_id'    => $pedido->id,
            'publicada'    => false,
        ]);

        return back()->with('success', '¡Gracias por tu opinión! La publicamos apenas la revisemos.');
    }
}
