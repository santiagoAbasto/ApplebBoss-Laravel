<?php

namespace App\Mail;

use App\Models\Venta;
use App\Support\Documentos\Documento;
use App\Support\Resenas\Solicitud;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Pocos días después de la compra: le pedimos al cliente que califique en Google. Un solo botón al enlace de reseña,
 * sin PDF ni adjuntos. El destinatario lo pone quien envía (Solicitud::pedir o el comando de prueba): así una muestra
 * nunca le llega al cliente real.
 */
class SolicitudDeResena extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Venta $venta) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address(config('mail.casillas.ventas'))],
            subject: '¿Nos dejas tu opinión? · Apple Boss',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.solicitud-resena', with: [
            'nombre' => Documento::nombreDePila($this->venta),
            'enlace' => Solicitud::enlace(),
        ]);
    }
}
