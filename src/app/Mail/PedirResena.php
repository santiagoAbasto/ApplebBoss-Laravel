<?php

namespace App\Mail;

use App\Models\Pedido;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/** Una semana después de la entrega: «¿cómo te fue?», con el enlace directo a calificar (resenas:pedir). */
class PedirResena extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Pedido $pedido)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            to: [$this->pedido->email_cliente],
            replyTo: [new Address(config('mail.casillas.pedidos'))],
            subject: '¿Cómo te fue con tu ' . $this->producto() . '?',
        );
    }

    public function content(): Content
    {
        // El enlace lleva el token: funciona sin sesión y cae directo en el formulario de opinión
        $enlace = route('seguimiento.ver', ['codigo' => $this->pedido->codigo, 't' => $this->pedido->token_seguimiento]) . '#opinar';

        return new Content(view: 'emails.pedir-resena', with: [
            'nombre'   => (string) Str::of((string) $this->pedido->nombre_cliente)->before(' ')->title(),
            'producto' => $this->producto(),
            'enlace'   => $enlace,
            'codigo'   => $this->pedido->codigo,
        ]);
    }

    private function producto(): string
    {
        return Str::limit((string) ($this->pedido->items->first()?->nombre ?: 'compra'), 48, '');
    }
}
