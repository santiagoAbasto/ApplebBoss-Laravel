<?php

namespace App\Mail;

use App\Models\ServicioTecnico;
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
 * Lo que recibe el cliente del taller: al dejar el equipo y en cada paso (en reparación, listo, entregado). Siempre va
 * con la nota de servicio en PDF y el camino del equipo marcado. El destinatario lo pone quien envía.
 */
class NotaDeServicio extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** Qué decirle en cada estado. Si un estado no está acá, no se manda nada. */
    public const MENSAJES = [
        ServicioTecnico::RECIBIDO => [
            'asunto' => 'Recibimos tu equipo · {codigo}',
            'titulo' => 'Recibimos tu {equipo}',
            'cuerpo' => 'Ya está en nuestro taller{tecnico}. Te avisamos por este correo en cada paso, y acá va tu nota de servicio con lo acordado.',
            'icono'  => ['icono' => 'progreso-animado.gif', 'ancho' => 96, 'alto' => 24],
        ],
        ServicioTecnico::EN_DIAGNOSTICO => [
            'asunto' => 'Estamos revisando tu equipo · {codigo}',
            'titulo' => 'Revisando tu {equipo}',
            'cuerpo' => 'Lo recibimos para diagnóstico{tecnico}. Apenas sepamos qué tiene, te mandamos el presupuesto a este correo para que lo apruebes.',
            'icono'  => ['icono' => 'progreso-animado.gif', 'ancho' => 96, 'alto' => 24],
        ],
        ServicioTecnico::PRESUPUESTO => [
            'asunto' => 'Tu presupuesto está listo · {codigo}',
            'titulo' => 'Presupuesto de tu {equipo}',
            'cuerpo' => 'Revisamos tu equipo y preparamos el presupuesto. Revísalo y, si estás de acuerdo, apruébalo para que empecemos la reparación.',
            'icono'  => ['icono' => 'progreso-animado.gif', 'ancho' => 96, 'alto' => 24],
        ],
        ServicioTecnico::RECHAZADO => [
            'asunto' => 'Presupuesto no aprobado · {codigo}',
            'titulo' => 'Entendido, no haremos la reparación',
            'cuerpo' => 'No haremos la reparación de tu {equipo}. Puedes pasar a recogerlo por la tienda; si cambias de idea, escríbenos y lo retomamos.',
            'icono'  => ['icono' => 'check-animado.gif', 'ancho' => 72, 'alto' => 72],
        ],
        ServicioTecnico::EN_REPARACION => [
            'asunto' => 'Tu equipo está en reparación · {codigo}',
            'titulo' => 'Estamos trabajando en tu {equipo}',
            'cuerpo' => 'El trabajo ya empezó{tecnico}. Apenas termine te avisamos para que pases a recogerlo.',
            'icono'  => ['icono' => 'progreso-animado.gif', 'ancho' => 96, 'alto' => 24],
        ],
        ServicioTecnico::LISTO => [
            'asunto' => 'Tu equipo está reparado · {codigo}',
            'titulo' => 'Tu {equipo} está reparado y listo',
            'cuerpo' => 'Ya puedes pasar a recogerlo por la tienda (la dirección está al pie de este correo). Trae esta nota o dinos el código {codigo}.',
            'icono'  => ['icono' => 'check-animado.gif', 'ancho' => 72, 'alto' => 72],
        ],
        ServicioTecnico::ENTREGADO => [
            'asunto' => 'Entregado · {codigo}',
            'titulo' => 'Gracias por confiar en nuestro taller',
            'cuerpo' => 'Tu {equipo} fue entregado. Si algo no quedó como esperabas, responde este correo: el trabajo tiene garantía y lo revisamos.',
            'icono'  => ['icono' => 'check-animado.gif', 'ancho' => 72, 'alto' => 72],
        ],
    ];

    public function __construct(public ServicioTecnico $servicio) {}

    public static function hayMensajePara(?string $estado): bool
    {
        return isset(self::MENSAJES[$estado]);
    }

    private function texto(): array
    {
        $plantilla = self::MENSAJES[$this->servicio->estado] ?? self::MENSAJES[ServicioTecnico::RECIBIDO];
        $cambios = [
            '{codigo}'  => $this->servicio->codigo_nota,
            '{equipo}'  => $this->servicio->equipo,
            '{tecnico}' => $this->servicio->tecnico ? ' con ' . $this->servicio->tecnico : '',
        ];

        return array_map(fn ($v) => is_string($v) ? strtr($v, $cambios) : $v, $plantilla);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address(config('mail.casillas.soporte'))],
            subject: $this->texto()['asunto'],
        );
    }

    public function content(): Content
    {
        $servicio = $this->servicio;

        // El camino que se muestra depende del modo (el directo no tiene diagnóstico ni presupuesto).
        $clavesPaso = $servicio->pasosTracker();
        $pasos = array_map(fn ($k) => ServicioTecnico::ESTADOS[$k], $clavesPaso);
        $actual = array_search($servicio->estado, $clavesPaso, true);
        if ($actual === false) {
            // Rechazado: el camino se detiene en el presupuesto.
            $actual = array_search(ServicioTecnico::PRESUPUESTO, $clavesPaso, true);
            $actual = $actual === false ? 0 : $actual;
        }

        // En el presupuesto, el botón lleva a la página pública donde el cliente aprueba o rechaza.
        $enlacePresupuesto = null;
        if ($servicio->estado === ServicioTecnico::PRESUPUESTO && ($token = Documento::tokenDe($servicio))) {
            $enlacePresupuesto = route('servicios.presupuesto.publico', $token);
        }

        return new Content(view: 'emails.nota-servicio', with: [
            'servicio'          => $servicio,
            'texto'             => $this->texto(),
            'pasos'             => $pasos,
            'actual'            => $actual,
            'trabajos'          => Documento::trabajosDeServicio($servicio),
            'fecha'             => Carbon::parse($servicio->fecha ?? $servicio->created_at)->translatedFormat('d \d\e F \d\e Y'),
            'enlace'            => Documento::enlace($servicio),
            'enlacePresupuesto' => $enlacePresupuesto,
            'total'             => (float) $servicio->precio_venta,
        ]);
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => Documento::pdf($this->servicio)->output(), Documento::nombreArchivo($this->servicio))->withMime('application/pdf')];
    }
}
