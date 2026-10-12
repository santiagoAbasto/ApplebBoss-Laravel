<?php

namespace App\Mail;

use App\Models\Carrito;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * «Te guardamos tu carrito»: el recordatorio de un carrito o un pedido sin pagar (App\Support\Carritos\Recuperacion).
 * Va por cola, como los avisos de pedido. Lleva solo lo que sigue disponible, nunca datos de la unidad.
 */
class CarritoAbandonado extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** @param list<array{key: string, nombre: string, precio: float, condicion: ?string, imagen: ?string, url: string}> $items */
    public function __construct(public Carrito $carrito, public array $items, public int $numero)
    {
    }

    public function envelope(): Envelope
    {
        $primero = Str::limit($this->items[0]['nombre'] ?? 'tu equipo', 40, '');

        return new Envelope(
            to: [$this->carrito->user->email],
            subject: $this->numero === 1
                ? 'Te guardamos tu carrito, ' . $this->nombre()
                : "Última llamada: {$primero} sigue disponible",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.carrito-abandonado', with: [
            'nombre'   => $this->nombre(),
            'items'    => $this->items,
            'total'    => collect($this->items)->sum('precio'),
            'enlace'   => $this->carrito->enlace(),
            'baja'     => $this->carrito->enlaceBaja(),
            'ultimo'   => $this->numero >= Carrito::MAX_RECORDATORIOS,
            'pedido'   => $this->carrito->origen === Carrito::ORIGEN_PEDIDO ? $this->carrito->pedido?->codigo : null,
            'whatsapp' => $this->whatsappTienda(),
        ]);
    }

    private function nombre(): string
    {
        return (string) Str::of((string) $this->carrito->user->name)->before(' ')->title();
    }

    private function whatsappTienda(): ?string
    {
        $numero = \App\Models\StoreLocation::principal()?->whatsapp;

        return $numero ? 'https://wa.me/' . preg_replace('/\D+/', '', $numero) : null;
    }
}
