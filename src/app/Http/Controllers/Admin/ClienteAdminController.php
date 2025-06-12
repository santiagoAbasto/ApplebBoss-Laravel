<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cliente;
use App\Models\PromocionEnviada;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ClienteAdminController extends Controller
{
    /**
     * Muestra el listado completo de clientes.
     */
    public function index()
    {
        $clientes = Cliente::with('usuario')->latest()->get();

        return Inertia::render('Admin/Clientes/Index', [
            'clientes' => $clientes,
        ]);
    }

    /**
     * Envía una promoción masiva por WhatsApp.
     */
    public function enviarPromocionMasiva()
    {
        $clientes = Cliente::all();

        foreach ($clientes as $cliente) {
            PromocionEnviada::create([
                'cliente_id' => $cliente->id,
                'mensaje' => '🎉 ¡Aprovecha nuestras nuevas promociones en AppleBoss!',
                'canal' => 'whatsapp',
                'enviado_en' => now(),
            ]);

            // 🔧 Aquí podrías encolar el mensaje o usar una API como UltraMsg, Chat API, etc.
        }

        return response()->json(['message' => 'Promoción enviada a todos los clientes.']);
    }

    /**
     * Devuelve sugerencias de clientes para autocompletar.
     */
    public function sugerencias(Request $request)
    {
        $term = $request->input('q', $request->input('term')); // acepta ambos formatos
    
        return Cliente::where(function ($q) use ($term) {
                $q->where('nombre', 'ilike', "%{$term}%")
                  ->orWhere('telefono', 'ilike', "%{$term}%");
            })
            ->select('id', 'nombre', 'telefono')
            ->limit(8)
            ->get();
    }
    /**
     * Muestra el formulario de edición de un cliente.
     */
    public function edit(Cliente $cliente)
    {
        return Inertia::render('Admin/Clientes/Edit', [
            'cliente' => $cliente,
        ]);
    }

    /**
     * Actualiza la información del cliente.
     */
    public function update(Request $request, Cliente $cliente)
    {
        $validated = $request->validate([
            'nombre'   => 'required|string|max:255',
            'telefono' => 'required|string|min:7|max:20',
            'correo'   => 'nullable|email|max:255',
        ]);

        $cliente->update($validated);

        return redirect()->route('admin.clientes.index')->with('success', 'Cliente actualizado correctamente.');
    }

}
