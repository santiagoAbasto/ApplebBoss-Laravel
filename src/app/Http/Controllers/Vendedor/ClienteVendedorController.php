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
     * Enviar promociones por WhatsApp a todos los clientes del vendedor.
     */
    public function enviarPromocionMasiva()
    {
        $clientes = Cliente::where('user_id', Auth::id())->get();

        foreach ($clientes as $cliente) {
            PromocionEnviada::create([
                'cliente_id' => $cliente->id,
                'mensaje' => '🎉 ¡Aprovecha nuestras nuevas promociones en AppleBoss!',
                'canal' => 'whatsapp',
                'enviado_en' => now(),
            ]);

            // 🔄 Puedes agregar aquí integración con API externa o una cola
            // Ejemplo: dispatch(new EnviarPromoWhatsAppJob($cliente));
        }

        return response()->json([
            'message' => '✅ Promoción enviada a tus clientes correctamente.',
        ]);
    }

    /**
     * Sugerencias para autocompletar clientes (nombre o teléfono).
     */
    public function sugerencias(Request $request)
    {
        $term = $request->input('term');
    
        return Cliente::where(function ($q) use ($term) {
                $q->where('nombre', 'ilike', "%{$term}%")
                  ->orWhere('telefono', 'ilike', "%{$term}%");
            })
            ->select('id', 'nombre', 'telefono')
            ->limit(8)
            ->get();
    }    

    /**
     * Mostrar formulario para editar un cliente específico.
     */
    public function edit($id)
    {
        $cliente = Cliente::where('user_id', Auth::id())->findOrFail($id);

        return Inertia::render('Vendedor/Clientes/Edit', [
            'cliente' => $cliente,
        ]);
    }

    /**
     * Actualizar datos del cliente.
     */
    public function update(Request $request, $id)
    {
        $cliente = Cliente::where('user_id', Auth::id())->findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:255',
            'telefono' => 'required|string|max:20',
            'correo' => 'nullable|email|max:255',
        ]);

        $cliente->update([
            'nombre' => $request->nombre,
            'telefono' => $request->telefono,
            'correo' => $request->correo,
        ]);

        return redirect()->route('vendedor.clientes.index')->with('success', 'Cliente actualizado correctamente.');
    }
}
