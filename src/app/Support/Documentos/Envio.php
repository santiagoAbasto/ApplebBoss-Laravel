<?php

namespace App\Support\Documentos;

use App\Mail\BoletaDeVenta;
use App\Mail\InformeTecnico;
use App\Mail\NotaDeReserva;
use App\Mail\NotaDeServicio;
use App\Models\Diagnostico;
use App\Models\Reserva;
use App\Models\ServicioTecnico;
use App\Models\Venta;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Manda al cliente el correo de un documento. Si viene un correo nuevo, primero lo guarda en el documento, en la ficha
 * del cliente y en el newsletter. Va por cola: el SMTP tarda y nadie espera por un correo para ver la pantalla.
 */
final class Envio
{
    /** @return bool true si se encoló el correo; false si el documento no tiene correo o no corresponde mandar nada */
    public static function enviar(Model $doc, ?string $correo = null, string $origen = 'panel'): bool
    {
        $correo = Str::lower(trim((string) ($correo ?: Documento::correo($doc))));
        if ($correo === '' || ! filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        if ($correo !== Documento::correo($doc)) {
            $doc->forceFill([Documento::campoCorreo($doc) => $correo])->save();
        }

        Contacto::recordar(Documento::nombre($doc), Documento::telefono($doc), $correo, $doc->user_id ?? null);
        Contacto::suscribir($correo, Documento::nombre($doc), $origen);

        $mailable = self::mailable($doc);
        if (! $mailable) {
            return false;
        }

        Mail::to($correo)->queue($mailable);
        $doc->forceFill(['correo_enviado_en' => now()])->save();

        return true;
    }

    /** El correo que le toca al documento tal como está hoy; null cuando no hay nada que decirle al cliente. */
    public static function mailable(Model $doc): ?Mailable
    {
        return match (true) {
            $doc instanceof Venta           => new BoletaDeVenta($doc),
            $doc instanceof ServicioTecnico => NotaDeServicio::hayMensajePara($doc->estado) ? new NotaDeServicio($doc) : null,
            $doc instanceof Reserva         => NotaDeReserva::hayMensajePara($doc->estado) ? new NotaDeReserva($doc) : null,
            $doc instanceof Diagnostico     => $doc->listo() ? new InformeTecnico($doc) : null,
            default                         => null,
        };
    }

    /** Al registrar o cambiar un documento: manda si hay correo, y si el correo falla la operación sigue. */
    public static function avisar(Model $doc, string $origen): bool
    {
        try {
            return self::enviar($doc, null, $origen);
        } catch (\Throwable $e) {
            Log::warning('No se pudo encolar el correo de ' . Documento::titulo($doc) . ': ' . $e->getMessage());

            return false;
        }
    }
}
