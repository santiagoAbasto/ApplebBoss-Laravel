<?php

namespace App\Mail;

use App\Support\Documentos\Documento;
use App\Support\Resenas\Solicitud;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Pocos días después de la compra, o al entregar un servicio técnico, le pedimos al cliente que califique en Google.
 * Un solo botón al enlace de reseña, sin PDF ni adjuntos. El destinatario lo pone quien envía (Solicitud::pedir o el
 * comando de prueba): así una muestra nunca le llega al cliente real.
 */
class SolicitudDeResena extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Model $doc) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address(config('mail.casillas.ventas'))],
            subject: '¿Nos dejas tu opinión? · Apple Boss',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.solicitud-resena',
            text: 'emails.solicitud-resena-text', // versión en texto plano: multipart entrega mejor (iCloud marcaba el solo-HTML)
            with: [
                'nombre' => Documento::nombreDePila($this->doc),
                'enlace' => Solicitud::enlaceCorreo(), // enlace directo de Google, no el g.page (los acortadores los filtra Apple)
            ],
        );
    }
}
