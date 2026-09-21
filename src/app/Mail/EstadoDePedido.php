<?php

namespace App\Mail;

use App\Models\Pedido;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * El correo que recibe el comprador cada vez que su pedido cambia de estado.
 *
 * Va por cola: el SMTP de Gmail tarda, y nadie debería esperar a que salga un correo
 * para ver la pantalla de pago.
 *
 * Nunca lleva el IMEI ni la serie: esos datos se muestran en el seguimiento, detrás del
 * token, y solo con el pago confirmado. Un correo se reenvía; el enlace es el control.
 */
class EstadoDePedido extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** Qué decirle en cada estado. Si un estado no está acá, no se manda nada. */
    public const MENSAJES = [
        Pedido::PENDIENTE_PAGO => [
            'asunto' => 'Recibimos tu pedido %s',
            'titulo' => 'Tu pedido está reservado',
            'cuerpo' => 'Apartamos tu equipo mientras completas el pago. Si no lo registramos a tiempo, vuelve a la tienda.',
            'boton'  => 'Completar el pago',
        ],
        Pedido::PAGO_EN_REVISION => [
            'asunto' => 'Estamos verificando tu pago · %s',
            'titulo' => 'Recibimos tu comprobante',
            'cuerpo' => 'Lo estamos verificando. Apenas confirmemos el pago te avisamos y te mostramos los datos de tu equipo.',
            'boton'  => 'Ver mi pedido',
        ],
        Pedido::PAGADO => [
            'asunto' => 'Pago confirmado · %s',
            'titulo' => '¡Listo! Tu pago está confirmado',
            'cuerpo' => 'Tu equipo es tuyo. Ya puedes ver su IMEI y su número de serie en el seguimiento.',
            'boton'  => 'Ver los datos de mi equipo',
        ],
        Pedido::PREPARANDO => [
            'asunto' => 'Preparando tu pedido %s',
            'titulo' => 'Estamos preparando tu equipo',
            'cuerpo' => 'Lo estamos dejando listo. Te avisamos apenas salga.',
            'boton'  => 'Ver mi pedido',
        ],
        Pedido::ENVIADO => [
            'asunto' => 'Tu pedido %s va en camino',
            'titulo' => 'Tu equipo salió',
            'cuerpo' => 'Ya está en camino a la dirección que nos diste.',
            'boton'  => 'Seguir mi envío',
        ],
        Pedido::ENTREGADO => [
            'asunto' => 'Entregado · %s',
            'titulo' => 'Tu pedido fue entregado',
            'cuerpo' => 'Gracias por comprar en Apple Boss. Cualquier cosa, escríbenos.',
            'boton'  => 'Ver mi pedido',
        ],
        Pedido::CANCELADO => [
            'asunto' => 'Tu pedido %s fue cancelado',
            'titulo' => 'Cancelamos tu pedido',
            'cuerpo' => 'El equipo volvió a la tienda. Si fue un error, escríbenos y lo resolvemos.',
            'boton'  => 'Ver el detalle',
        ],
    ];

    public function __construct(public Pedido $pedido) {}

    public static function hayMensajePara(string $estado): bool
    {
        return isset(self::MENSAJES[$estado]);
    }

    public function envelope(): Envelope
    {
        $texto = self::MENSAJES[$this->pedido->estado] ?? null;

        return new Envelope(
            to: [$this->pedido->email_cliente],
            subject: sprintf($texto['asunto'] ?? 'Tu pedido %s', $this->pedido->codigo),
        );
    }

    public function content(): Content
    {
        $texto = self::MENSAJES[$this->pedido->estado];

        // El enlace lleva el token: así funciona aunque abra el correo sin sesión iniciada
        $enlace = route('seguimiento.ver', [
            'codigo' => $this->pedido->codigo,
            't'      => $this->pedido->token_seguimiento,
        ]);

        return new Content(view: 'emails.pedido-estado', with: [
            'pedido' => $this->pedido,
            'texto'  => $texto,
            'enlace' => $this->pedido->estado === Pedido::PENDIENTE_PAGO
                ? route('checkout.pago', ['codigo' => $this->pedido->codigo, 't' => $this->pedido->token_seguimiento])
                : $enlace,
        ]);
    }
}
