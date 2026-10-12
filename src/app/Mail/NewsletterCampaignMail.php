<?php

namespace App\Mail;

use App\Models\ConfiguracionTienda;
use App\Models\NewsletterCampaign;
use App\Support\NewsletterContent;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Support\Facades\Storage;

class NewsletterCampaignMail extends Mailable
{
    /**
     * @param array $bloquesVista Bloques ya resueltos con NewsletterContent::forView (se calculan una vez por lote).
     */
    public function __construct(
        public NewsletterCampaign $campaign,
        public array $bloquesVista,
        public string $unsubscribeUrl,
        public bool $esPrueba = false,
    ) {}

    public function envelope(): Envelope
    {
        $replyTo = ConfiguracionTienda::get('newsletter_responder_a');

        return new Envelope(
            // El boletín sale de su propia casilla (un alias que Google acepta como remitente); solo el nombre es editable
            from: new Address(config('mail.casillas.novedades'), ConfiguracionTienda::get('newsletter_remitente_nombre') ?: config('mail.from.name')),
            replyTo: [new Address(filter_var($replyTo, FILTER_VALIDATE_EMAIL) ? $replyTo : config('mail.casillas.info'))],
            subject: ($this->esPrueba ? '[PRUEBA] ' : '') . $this->campaign->asunto,
        );
    }

    public function headers(): Headers
    {
        return new Headers(text: [
            'List-Unsubscribe'      => "<{$this->unsubscribeUrl}>",
            'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
        ]);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.newsletter',
            text: 'emails.newsletter-text',
            with: [
                'asunto'         => $this->campaign->asunto,
                'preheader'      => $this->campaign->preheader,
                'bloques'        => $this->bloquesVista,
                'unsubscribeUrl' => $this->unsubscribeUrl,
                'pie'            => ConfiguracionTienda::get('newsletter_pie'),
                'esPrueba'       => $this->esPrueba,
            ],
        );
    }

    public function attachments(): array
    {
        if (! $this->campaign->adjuntar_imagenes) {
            return [];
        }

        return collect(NewsletterContent::imageDiskPaths($this->campaign->bloques ?? []))
            ->filter(fn ($path) => Storage::disk('public')->exists($path))
            ->map(fn ($path) => Attachment::fromStorageDisk('public', $path))
            ->values()
            ->all();
    }
}
