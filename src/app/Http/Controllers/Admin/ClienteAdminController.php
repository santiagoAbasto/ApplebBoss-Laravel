<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\Cliente;
use App\Models\PromocionEnviada;
use Inertia\Inertia;

class ClienteAdminController extends Controller
{
    public function index()
    {
        // ✅ Mostrar todos los clientes al admin
        $clientes = Cliente::with('usuario')->latest()->get();

        return Inertia::render('Admin/Clientes/Index', [
            'clientes' => $clientes
        ]);
    }

    public function enviarPromocionMasiva()
    {
        // ✅ Enviar a todos los clientes registrados
        $clientes = Cliente::all();

        foreach ($clientes as $cliente) {
            PromocionEnviada::create([
                'cliente_id' => $cliente->id,
                'mensaje' => '🎉 ¡Aprovecha nuestras nuevas promociones en AppleBoss!',
                'canal' => 'whatsapp',
                'enviado_en' => now(),
            ]);

            // Aquí puedes integrar con WhatsApp API o programar una cola
        }

        return response()->json(['message' => 'Promoción enviada a todos los clientes.']);
    }

    public function sugerencias(Request $request)
    {
        $term = $request->input('term');

        // ✅ Buscar sin limitar por user_id para el admin
        return Cliente::where(function ($q) use ($term) {
                $q->where('nombre', 'ilike', "%{$term}%")
                  ->orWhere('telefono', 'ilike', "%{$term}%");
            })
            ->select('id', 'nombre', 'telefono')
            ->limit(8)
            ->get();
    }
}
