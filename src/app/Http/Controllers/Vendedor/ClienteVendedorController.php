<?php

namespace App\Http\Controllers\Vendedor;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\Cliente;
use App\Models\PromocionEnviada;
use Inertia\Inertia;

class ClienteVendedorController extends Controller
{
    public function index()
    {
        // ✅ Solo los clientes del vendedor autenticado
        $clientes = Cliente::where('user_id', Auth::id())
            ->latest()
            ->get();

        return Inertia::render('Vendedor/Clientes/Index', [
            'clientes' => $clientes
        ]);
    }

    public function enviarPromocionMasiva()
    {
        // ✅ Solo promociona a los clientes de este vendedor
        $clientes = Cliente::where('user_id', Auth::id())->get();

        foreach ($clientes as $cliente) {
            PromocionEnviada::create([
                'cliente_id' => $cliente->id,
                'mensaje' => '🎉 ¡Aprovecha nuestras nuevas promociones en AppleBoss!',
                'canal' => 'whatsapp',
                'enviado_en' => now(),
            ]);

            // Aquí puedes integrar el envío real por WhatsApp
        }

        return response()->json(['message' => 'Promoción enviada a tus clientes.']);
    }

    public function sugerencias(Request $request)
    {
        $term = $request->input('term');

        return Cliente::where('user_id', Auth::id())
            ->where(function ($q) use ($term) {
                $q->where('nombre', 'ilike', "%{$term}%")
                  ->orWhere('telefono', 'ilike', "%{$term}%");
            })
            ->select('id', 'nombre', 'telefono')
            ->limit(8)
            ->get();
    }
}
