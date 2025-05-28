<?php

namespace App\Mail;

use App\Models\Cotizacion;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;

class CotizacionMailable extends Mailable
{
    use Queueable, SerializesModels;

    public $cotizacion;

    public function __construct(Cotizacion $cotizacion)
    {
        $this->cotizacion = $cotizacion;
    }

    public function build()
    {
        // Generar PDF adjunto
        $pdf = Pdf::loadView('pdf.cotizacion', [
            'cotizacion' => $this->cotizacion,
            'logo_path' => public_path('images/logo-appleboss1.png'), // solo si el PDF lo necesita
        ]);

        return $this->subject('Cotización N.º COT-' . $this->cotizacion->id . ' | Apple Boss')
                    ->from('apple.boss2011@gmail.com', 'Apple Boss')
                    ->view('emails.cotizacion')
                    ->with([
                        'cotizacion' => $this->cotizacion,
                    ])
                    ->attachData($pdf->output(), 'Cotizacion_' . $this->cotizacion->id . '.pdf', [
                        'mime' => 'application/pdf',
                    ]);
    }
}
