<?php

namespace App\Http\Controllers\Vendedor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Cliente;
use App\Models\PromocionEnviada;
use Inertia\Inertia;

class ClienteVendedorController extends Controller
{
    /**
     * Mostrar todos los clientes del vendedor autenticado.
     */
    public function index()
    {
        $clientes = Cliente::where('user_id', Auth::id())
            ->latest()
            ->get();

        return Inertia::render('Vendedor/Clientes/Index', [
            'clientes' => $clientes,
        ]);
    }

    /**
     * Sugerencias para autocompletar clientes (solo del vendedor).
     * Usado en ventas y servicio técnico.
     */
    public function sugerencias(Request $request)
    {
        $term = $request->input('term');

        if (!$term || strlen($term) < 2) {
            return [];
        }

        return Cliente::where('user_id', Auth::id())
            ->where(function ($q) use ($term) {
                $q->where('nombre', 'ilike', "%{$term}%")
                    ->orWhere('telefono', 'ilike', "%{$term}%");
            })
            ->select('id', 'nombre', 'telefono', 'correo')
            ->limit(8)
            ->get();
    }




    /**
     * Enviar promociones por WhatsApp a los clientes del vendedor.
     */
    public function enviarPromocionMasiva()
    {
        $clientes = Cliente::where('user_id', Auth::id())->get();

        foreach ($clientes as $cliente) {
            PromocionEnviada::create([
                'cliente_id' => $cliente->id,
                'mensaje'    => '🎉 ¡Aprovecha nuestras nuevas promociones en AppleBoss!',
                'canal'      => 'whatsapp',
                'enviado_en' => now(),
            ]);
        }

        return response()->json([
            'message' => '✅ Promoción enviada a tus clientes correctamente.',
        ]);
    }

    /**
     * Formulario para editar cliente.
     */
    public function edit($id)
    {
        $cliente = Cliente::where('user_id', Auth::id())
            ->findOrFail($id);

        return Inertia::render('Vendedor/Clientes/Edit', [
            'cliente' => $cliente,
        ]);
    }

    /**
     * Actualizar cliente.
     */
    public function update(Request $request, $id)
    {
        $cliente = Cliente::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'nombre'   => 'required|string|max:255',
            'telefono' => 'required|string|max:20',
            'correo'   => 'nullable|email|max:255',
        ]);

        $cliente->update([
            'nombre'   => $request->nombre,
            'telefono' => $request->telefono,
            'correo'   => $request->correo,
        ]);

        return redirect()
            ->route('vendedor.clientes.index')
            ->with('success', 'Cliente actualizado correctamente.');
    }
}
