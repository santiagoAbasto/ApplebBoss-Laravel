<?php

namespace App\Support\Resenas;

use App\Mail\SolicitudDeResena;
use App\Models\ConfiguracionTienda;
use App\Models\Venta;
use App\Support\Documentos\Contacto;
use App\Support\Documentos\Documento;
use App\Support\ResenasDeGoogle;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Pedirle al cliente que califique en Google después de una compra o de un servicio técnico entregado.
 *
 * Funciona para cualquier documento que maneje `Documento` (venta o servicio): usa sus ayudantes para el nombre,
 * teléfono y correo del cliente. El enlace es el g.page oficial del perfil (configurable en `resena_enlace`). El
 * WhatsApp es un botón que abre el chat con el mensaje armado —no se puede mandar solo sin la API de WhatsApp—; el
 * correo sale por cola. `resena_pedida_en` marca a quién ya se le pidió, para no repetir.
 */
final class Solicitud
{
    public const ENLACE_POR_DEFECTO = 'https://g.page/r/Ce_YKZWYAZCKEAE/review';

    /** El enlace para calificar: el que cargó el dueño, o el que trajo Google, o el de fábrica. */
    public static function enlace(): string
    {
        $config = trim((string) ConfiguracionTienda::get('resena_enlace'));
        if ($config !== '') {
            return $config;
        }

        return (string) (ResenasDeGoogle::resumen()['escribir'] ?? self::ENLACE_POR_DEFECTO);
    }

    /**
     * El enlace para el CORREO: el directo de Google (search.google.com/local/writereview), no el g.page.
     * Apple y otros filtros ven los acortadores/redirecciones como señal de spam; el enlace directo pasa mejor.
     * En WhatsApp se usa igual el de `enlace()` (más corto y prolijo para un chat).
     */
    public static function enlaceCorreo(): string
    {
        $directo = (string) (ResenasDeGoogle::resumen()['escribir'] ?? '');

        return str_contains($directo, 'search.google.com') ? $directo : self::enlace();
    }

    /** El mensaje de WhatsApp: saludo con el nombre, agradecimiento y el enlace para calificar. */
    public static function mensajeWhatsapp(Model $doc): string
    {
        $nombre = Documento::nombreDePila($doc);
        $saludo = $nombre === 'Hola' ? 'Hola' : "Hola {$nombre}";

        return "{$saludo}, ¡gracias por elegir Apple Boss! ¿Nos dejas tu opinión en Google? "
            . "Son 10 segundos y nos ayudas muchísimo a seguir creciendo:\n"
            . self::enlace()
            . "\n\nApple Boss · appleboss.com.bo";
    }

    /** El enlace wa.me con el mensaje armado, o null si el cliente no dejó teléfono. */
    public static function whatsapp(Model $doc): ?string
    {
        $numero = Documento::numeroWhatsapp(Documento::telefono($doc));

        return $numero ? 'https://wa.me/' . $numero . '?text=' . rawurlencode(self::mensajeWhatsapp($doc)) : null;
    }

    /** Lo que el panel necesita para los botones de reseña de una venta o un servicio. */
    public static function paraPanel(Model $doc): array
    {
        return [
            'tipo'      => Documento::tipo($doc),
            'whatsapp'  => self::whatsapp($doc),
            'mensaje'   => self::mensajeWhatsapp($doc),
            'enlace'    => self::enlace(),
            'correo'    => Documento::correo($doc),
            'pedida_en' => $doc->resena_pedida_en?->toIso8601String(),
        ];
    }

    /** Los correos (en minúsculas) a los que ya se les pidió reseña, para no repetir en los envíos por lote de ventas. */
    public static function correosYaPedidos(): array
    {
        return Venta::whereNotNull('resena_pedida_en')
            ->whereNotNull('correo_cliente')
            ->pluck('correo_cliente')
            ->map(fn ($c) => Str::lower(trim((string) $c)))
            ->filter()
            ->flip()
            ->all();
    }

    /** ¿Se le puede pedir reseña por correo ahora? (tiene correo, no se pidió aún, no está en opt-out). */
    public static function corresponde(Model $doc): bool
    {
        return $doc->resena_pedida_en === null
            && filled(Documento::correo($doc))
            && ! optional($doc->vendedor)->sin_recordatorios;
    }

    /**
     * Manda el correo pidiendo la reseña (venta o servicio). Si viene un correo nuevo lo guarda (ficha + newsletter).
     * Marca el documento como pedido. Con `forzar=false` no repite si ya se pidió. Devuelve true si se encoló el correo.
     */
    public static function pedir(Model $doc, ?string $correo = null, string $origen = 'panel', bool $forzar = false, ?int $retrasoMinutos = null): bool
    {
        if ($doc->resena_pedida_en && ! $forzar) {
            return false;
        }

        $correo = Str::lower(trim((string) ($correo ?: Documento::correo($doc))));
        if ($correo === '' || ! filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        // Quien pidió no recibir recordatorios no recibe el pedido de reseña.
        if (optional($doc->vendedor)->sin_recordatorios) {
            return false;
        }

        if ($correo !== Documento::correo($doc)) {
            $doc->forceFill([Documento::campoCorreo($doc) => $correo])->save();
        }

        Contacto::recordar(Documento::nombre($doc), Documento::telefono($doc), $correo, $doc->user_id ?? null);
        Contacto::suscribir($correo, Documento::nombre($doc), $origen);

        // Con retraso cuando sale junto a otro correo (al entregar un servicio ya sale la nota «entregado»):
        // así el pedido de reseña no llega pegado al otro.
        $destino = Mail::to($correo);
        $retrasoMinutos
            ? $destino->later(now()->addMinutes($retrasoMinutos), new SolicitudDeResena($doc))
            : $destino->queue(new SolicitudDeResena($doc));

        $doc->forceFill(['resena_pedida_en' => now()])->save();

        return true;
    }
}
