<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/** El primer correo de un cliente nuevo (formulario o Google): qué puede hacer con su cuenta. Lo manda UserObserver. */
class Bienvenida extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            to: [$this->user->email],
            replyTo: [new Address(config('mail.casillas.info'))],
            subject: 'Tu cuenta en Apple Boss está lista, ' . $this->nombre(),
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.bienvenida', with: [
            'nombre'   => $this->nombre(),
            'tienda'   => route('store.catalog'),
            'cuenta'   => route('cuenta.index'),
            'whatsapp' => ($n = \App\Models\StoreLocation::principal()?->whatsapp) ? 'https://wa.me/' . preg_replace('/\D+/', '', $n) : null,
        ]);
    }

    private function nombre(): string
    {
        return (string) Str::of((string) $this->user->name)->before(' ')->title();
    }
}
