<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Venta;
use App\Support\Documentos\Documento;
use App\Support\Documentos\Envio;
use App\Support\Resenas\Solicitud;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Los documentos que la tienda le entrega al cliente: nota de venta, nota de servicio, nota de reserva e informe técnico.
 * Afuera: el PDF por enlace firmado (el del correo y el del WhatsApp). Adentro: el botón «Correo» del panel.
 */
class DocumentoController extends Controller
{
    /** No se indexa, no se guarda en ningún caché y no le pasa la clave a otro sitio por el Referer. */
    private const CABECERAS = [
        'X-Robots-Tag'    => 'noindex, nofollow, noarchive',
        'Referrer-Policy' => 'no-referrer',
        'Cache-Control'   => 'private, no-store, max-age=0',
    ];

    /** La página del enlace: marca, vista previa para WhatsApp y el botón al PDF. Vencida, 410; inexistente, 404. */
    public function publico(string $token)
    {
        [$doc, $vence] = Documento::porToken($token) ?? [null, null];
        $estado = match (true) {
            ! $doc || ! Documento::publicable($doc) => 'no_existe',
            $vence->isPast()                        => 'vencido',
            default                                 => 'ok',
        };
        $local = \App\Models\StoreLocation::principal();

        return response()->view('documentos.publico', [
            'estado'      => $estado,
            'titulo'      => $estado === 'ok' ? Documento::titulo($doc) : 'Documento de Apple Boss',
            'resumen'     => $estado === 'ok' ? Documento::resumen($doc) : 'Pide tu documento por WhatsApp y te lo mandamos de nuevo.',
            'pdf'         => $estado === 'ok' ? route('documentos.pdf', $token) : null,
            'vence'       => $estado === 'ok' ? $vence : null,
            'url'         => route('documentos.publico', $token),
            'whatsapp'    => $local?->whatsapp ? 'https://wa.me/' . preg_replace('/\D+/', '', $local->whatsapp) : null,
        ], ['ok' => 200, 'vencido' => 410, 'no_existe' => 404][$estado])->withHeaders(self::CABECERAS);
    }

    /** El PDF del enlace, con las mismas reglas que la página. */
    public function pdf(string $token)
    {
        [$doc, $vence] = Documento::porToken($token) ?? [null, null];
        abort_if(! $doc || ! Documento::publicable($doc), 404);
        abort_if($vence->isPast(), 410);

        return Documento::pdf($doc)->stream(Documento::nombreArchivo($doc))->withHeaders(self::CABECERAS);
    }

    /** Enlaces viejos (firmados, con el número del documento): llevan al enlace nuevo. Sin firma válida, 403. */
    public function ver(string $tipo, int $id)
    {
        $doc = Documento::buscar($tipo, $id);
        abort_unless(Documento::publicable($doc), 404);

        return redirect()->to(Documento::enlace($doc));
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

    /** Botón «Pedir reseña» de una venta: manda el correo con el enlace para calificar en Google. */
    public function pedirResena(Request $request, int $id)
    {
        $venta = Venta::findOrFail($id);
        $this->autorizar($request->user(), $venta);

        $datos = $request->validate(
            ['correo' => ['nullable', 'email:rfc', 'max:191']],
            ['correo.email' => 'Revisa el correo.', 'correo.max' => 'El correo es demasiado largo.'],
        );

        $correo = trim((string) ($datos['correo'] ?? '')) ?: Documento::correo($venta);
        if (! $correo) {
            return back()->withErrors(['correo' => 'Escribe el correo del cliente.']);
        }

        // Desde el panel se puede re-enviar: si el vendedor lo pide de nuevo, se manda igual (forzar).
        $enviado = Solicitud::pedir($venta, $correo, 'panel', forzar: true);

        return back()->with(
            $enviado ? 'success' : 'error',
            $enviado ? "Pedido de reseña enviado a {$correo}." : 'No se pudo enviar el pedido de reseña.',
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
