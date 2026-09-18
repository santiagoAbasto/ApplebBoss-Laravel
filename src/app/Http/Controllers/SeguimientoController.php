<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
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
}
