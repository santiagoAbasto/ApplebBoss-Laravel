<?php

namespace App\Support\Resenas;

use App\Mail\SolicitudDeResena;
use App\Models\ConfiguracionTienda;
use App\Models\Venta;
use App\Support\Documentos\Contacto;
use App\Support\Documentos\Documento;
use App\Support\ResenasDeGoogle;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Pedirle al cliente que califique en Google después de una compra.
 *
 * El enlace es el g.page oficial del perfil (configurable en `resena_enlace`). El WhatsApp es un botón que abre el
 * chat con el mensaje armado —no se puede mandar solo sin la API de WhatsApp—; el correo sale por cola, unos días
 * después de la venta o cuando el panel lo dispara. `resena_pedida_en` marca a quién ya se le pidió, para no repetir.
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
    public static function mensajeWhatsapp(Venta $venta): string
    {
        $nombre = Documento::nombreDePila($venta);
        $saludo = $nombre === 'Hola' ? 'Hola' : "Hola {$nombre}";

        return "{$saludo}, ¡gracias por tu compra en Apple Boss! ¿Nos dejas tu opinión en Google? "
            . "Son 10 segundos y nos ayudas muchísimo a seguir creciendo:\n"
            . self::enlace()
            . "\n\nApple Boss · appleboss.com.bo";
    }

    /** El enlace wa.me con el mensaje armado, o null si el cliente no dejó teléfono. */
    public static function whatsapp(Venta $venta): ?string
    {
        $numero = Documento::numeroWhatsapp(Documento::telefono($venta));

        return $numero ? 'https://wa.me/' . $numero . '?text=' . rawurlencode(self::mensajeWhatsapp($venta)) : null;
    }

    /** Lo que el panel necesita para los botones de reseña de una venta. */
    public static function paraPanel(Venta $venta): array
    {
        return [
            'whatsapp'  => self::whatsapp($venta),
            'mensaje'   => self::mensajeWhatsapp($venta),
            'enlace'    => self::enlace(),
            'correo'    => Documento::correo($venta),
            'pedida_en' => $venta->resena_pedida_en?->toIso8601String(),
        ];
    }

    /** Los correos (en minúsculas) a los que ya se les pidió reseña, para no repetir en los envíos por lote. */
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

    /** ¿Se le puede pedir reseña por correo a esta venta ahora? (tiene correo, no se pidió aún, no está en opt-out). */
    public static function corresponde(Venta $venta): bool
    {
        return $venta->resena_pedida_en === null
            && filled(Documento::correo($venta))
            && ! optional($venta->vendedor)->sin_recordatorios;
    }

    /**
     * Manda el correo pidiendo la reseña. Si viene un correo nuevo lo guarda (ficha + newsletter). Marca la venta
     * como pedida. Con `forzar=false` no repite si ya se pidió. Devuelve true si se encoló el correo.
     */
    public static function pedir(Venta $venta, ?string $correo = null, string $origen = 'panel', bool $forzar = false): bool
    {
        if ($venta->resena_pedida_en && ! $forzar) {
            return false;
        }

        $correo = Str::lower(trim((string) ($correo ?: Documento::correo($venta))));
        if ($correo === '' || ! filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        // Quien pidió no recibir recordatorios no recibe el pedido de reseña.
        if (optional($venta->vendedor)->sin_recordatorios) {
            return false;
        }

        if ($correo !== Documento::correo($venta)) {
            $venta->forceFill([Documento::campoCorreo($venta) => $correo])->save();
        }

        Contacto::recordar(Documento::nombre($venta), Documento::telefono($venta), $correo, $venta->user_id ?? null);
        Contacto::suscribir($correo, Documento::nombre($venta), $origen);

        Mail::to($correo)->queue(new SolicitudDeResena($venta));
        $venta->forceFill(['resena_pedida_en' => now()])->save();

        return true;
    }
}
