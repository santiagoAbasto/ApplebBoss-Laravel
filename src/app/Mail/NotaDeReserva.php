<?php

namespace App\Mail;

use App\Models\Reserva;
use App\Support\Documentos\Documento;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Attachment;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * La reserva del cliente: al registrarla (con el abono y el saldo) y si vence o se cancela. Cuando se convierte en
 * venta no manda nada: la nota de venta ya lo cubre. El destinatario lo pone quien envía.
 */
class NotaDeReserva extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public const MENSAJES = [
        'activa' => [
            'asunto' => 'Tu reserva {codigo} quedó registrada',
            'titulo' => 'Separamos tu equipo, {nombre}',
            'cuerpo' => 'Tu reserva quedó registrada con el abono que dejaste. Cuando vengas a completar el pago, te lo entregamos. Acá va la nota con el detalle.',
            'icono'  => ['icono' => 'check-animado.gif', 'ancho' => 72, 'alto' => 72],
        ],
        'vencida' => [
            'asunto' => 'Tu reserva {codigo} venció',
            'titulo' => 'Tu reserva venció',
            'cuerpo' => 'Pasó el plazo acordado y el equipo volvió a la venta. Si todavía lo quieres, respóndenos y vemos cómo ayudarte.',
            'icono'  => [],
        ],
        'cancelada' => [
            'asunto' => 'Tu reserva {codigo} fue cancelada',
            'titulo' => 'Cancelamos tu reserva',
            'cuerpo' => 'La reserva quedó sin efecto. Si fue un error o quieres retomarla, respóndenos y lo resolvemos.',
            'icono'  => [],
        ],
    ];

    public function __construct(public Reserva $reserva) {}

    public static function hayMensajePara(?string $estado): bool
    {
        return isset(self::MENSAJES[$estado]);
    }

    private function texto(): array
    {
        $plantilla = self::MENSAJES[$this->reserva->estado] ?? self::MENSAJES['activa'];
        $cambios = ['{codigo}' => $this->reserva->codigo_nota, '{nombre}' => Documento::nombreDePila($this->reserva)];

        return array_map(fn ($v) => is_string($v) ? strtr($v, $cambios) : $v, $plantilla);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address(config('mail.casillas.ventas'))],
            subject: $this->texto()['asunto'],
        );
    }

    public function content(): Content
    {
        $reserva = $this->reserva->loadMissing('items');
        $items = $reserva->items->map(fn ($i) => [
            'nombre'   => $i->nombre_producto ?: ($i->modelo ?: 'Producto'),
            'detalle'  => implode(' · ', array_filter([$i->capacidad ?? null, $i->color ?? null])),
            'subtotal' => (float) $i->subtotal,
        ])->values()->all();

        return new Content(view: 'emails.nota-reserva', with: [
            'reserva' => $reserva,
            'texto'   => $this->texto(),
            'items'   => $items,
            'saldo'   => max(0, (float) $reserva->subtotal - (float) $reserva->monto_reserva),
            'fecha'   => Carbon::parse($reserva->fecha ?? $reserva->created_at)->translatedFormat('d \d\e F \d\e Y'),
            'enlace'  => Documento::enlace($reserva),
        ]);
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => Documento::pdf($this->reserva)->output(), Documento::nombreArchivo($this->reserva))->withMime('application/pdf')];
    }
}
