<?php

namespace App\Mail;

use App\Models\Cotizacion;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;

class CotizacionEnviada extends Mailable
{
    use Queueable, SerializesModels;

    public Cotizacion $cotizacion;

    public function __construct(Cotizacion $cotizacion)
    {
        $this->cotizacion = $cotizacion;
    }

    public function build()
    {
        // Generar el PDF de la cotización
        $pdf = Pdf::loadView('pdf.cotizacion', [
            'cotizacion' => $this->cotizacion,
            'logo_path' => public_path('images/logo-appleboss1.png'), // usado solo en PDF
        ])->setPaper('letter');

        return $this->from('apple.boss2011@gmail.com', 'Apple Boss')
                    ->subject('Cotización enviada - Apple Boss')
                    ->view('emails.cotizacion')
                    ->with([
                        'cotizacion' => $this->cotizacion,
                    ])
                    ->attachData($pdf->output(), 'Cotizacion_#' . $this->cotizacion->id . '.pdf', [
                        'mime' => 'application/pdf',
                    ]);
    }
}
