<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Documentos\Documento;
use App\Support\Documentos\Envio;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Los documentos que la tienda le entrega al cliente: nota de venta, nota de servicio, nota de reserva e informe técnico.
 * Afuera: el PDF por enlace firmado (el del correo y el del WhatsApp). Adentro: el botón «Correo» del panel.
 */
class DocumentoController extends Controller
{
    /** El PDF para el cliente. Sin firma válida, 403 (lo decide el middleware `signed`); un informe sin firmar, 404. */
    public function ver(string $tipo, int $id)
    {
        $doc = Documento::buscar($tipo, $id);
        abort_unless(Documento::publicable($doc), 404);

        return Documento::pdf($doc)->stream(Documento::nombreArchivo($doc));
    }

    /** Manda (o vuelve a mandar) el correo del documento. Si viene un correo nuevo, queda guardado en el documento y en Clientes. */
    public function correo(Request $request, string $tipo, int $id)
    {
        $doc = Documento::buscar($tipo, $id);
        $this->autorizar($request->user(), $doc);

        $datos = $request->validate(
            ['correo' => ['nullable', 'email:rfc', 'max:191']],
            ['correo.email' => 'Revisa el correo.', 'correo.max' => 'El correo es demasiado largo.'],
        );

        if (! Documento::publicable($doc)) {
            return back()->with('error', 'El informe todavía no está firmado: complétalo antes de enviarlo.');
        }

        $correo = trim((string) ($datos['correo'] ?? '')) ?: Documento::correo($doc);
        if (! $correo) {
            return back()->withErrors(['correo' => 'Escribe el correo del cliente.']);
        }

        $enviado = Envio::enviar($doc, $correo, 'panel');

        return back()->with(
            $enviado ? 'success' : 'error',
            $enviado ? Documento::titulo($doc) . " enviada a {$correo}." : 'No se pudo enviar el correo.',
        );
    }

    /** El administrador comparte cualquier documento; el vendedor, solo los que registró. */
    private function autorizar(User $user, Model $doc): void
    {
        if ($user->rol === 'admin') {
            return;
        }

        abort_unless(($doc->user_id ?? null) === $user->id, 403);
    }
}
