<?php

namespace App\Mail;

use App\Models\Diagnostico;
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
 * El informe técnico firmado: el resumen en el correo y el PDF sellado adjunto. Solo sale cuando el diagnóstico está
 * listo (pruebas, conclusión y técnico): un borrador no se manda. El destinatario lo pone quien envía.
 */
class InformeTecnico extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Diagnostico $diagnostico) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address(config('mail.casillas.soporte'))],
            subject: 'Tu informe técnico ' . $this->diagnostico->codigo . ' · Apple Boss',
        );
    }

    public function content(): Content
    {
        $d = $this->diagnostico;
        $pruebas = collect($d->pruebasHechas())->countBy('resultado');

        return new Content(view: 'emails.informe-tecnico', with: [
            'diagnostico' => $d,
            'nombre'      => Documento::nombreDePila($d),
            'fecha'       => Carbon::parse($d->fecha ?? $d->created_at)->translatedFormat('d \d\e F \d\e Y'),
            'pruebas'     => ['ok' => $pruebas['ok'] ?? 0, 'falla' => $pruebas['falla'] ?? 0, 'nc' => $pruebas['nc'] ?? 0],
            'enlace'      => Documento::enlace($d),
        ]);
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => Documento::pdf($this->diagnostico)->output(), Documento::nombreArchivo($this->diagnostico))->withMime('application/pdf')];
    }
}
