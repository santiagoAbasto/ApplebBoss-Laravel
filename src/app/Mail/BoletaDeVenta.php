<?php

namespace App\Mail;

use App\Models\Venta;
use App\Support\Documentos\Documento;
use App\Support\GarantiaDeVenta;
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
 * La nota de venta que recibe el cliente al comprar en la tienda física: el detalle, la garantía de cada producto,
 * el total y el PDF adjunto. El destinatario lo pone quien envía (Envio o el comando de prueba): así una muestra
 * nunca le llega al cliente real.
 */
class BoletaDeVenta extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Venta $venta) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address(config('mail.casillas.ventas'))],
            subject: 'Tu compra en Apple Boss · ' . $this->venta->codigo_nota,
        );
    }

    public function content(): Content
    {
        $venta = $this->venta->loadMissing(['items.celular', 'items.computadora', 'items.productoGeneral', 'items.productoApple', 'servicioTecnico']);
        $fecha = Carbon::parse($venta->fecha ?? $venta->created_at);

        $items = $venta->items->map(function ($item) use ($fecha) {
            $producto = match ($item->tipo) {
                'celular'        => $item->celular,
                'computadora'    => $item->computadora,
                'producto_apple' => $item->productoApple,
                default          => $item->productoGeneral,
            };
            $nombre = $item->nombre_producto ?: ($producto->modelo ?? $producto->nombre ?? 'Producto');
            $detalle = implode(' · ', array_filter([$item->capacidad ?? null, $item->color ?? null, $item->modelo && $item->modelo !== $nombre ? $item->modelo : null]));

            return [
                'nombre'   => $nombre,
                'detalle'  => $detalle,
                'cantidad' => (int) $item->cantidad,
                'subtotal' => (float) $item->subtotal,
                'garantia' => $producto ? GarantiaDeVenta::cobertura($item->tipo, $producto, $fecha) : null,
            ];
        })->values()->all();

        if ($venta->tipo_venta === 'servicio_tecnico' && $venta->servicioTecnico) {
            $servicio = $venta->servicioTecnico;
            $items[] = [
                'nombre'   => 'Servicio técnico · ' . $servicio->equipo,
                'detalle'  => Documento::trabajosDeServicio($servicio)->pluck('descripcion')->implode(' · '),
                'cantidad' => 1,
                'subtotal' => (float) $servicio->precio_venta,
                'garantia' => null,
            ];
        }

        $suma = array_sum(array_column($items, 'subtotal'));
        $lineas = [['etiqueta' => 'Subtotal', 'monto' => 'Bs ' . number_format($suma, 2, ',', '.')]];
        // Igual que el PDF: el descuento de cada producto ya está en su renglón; solo se restan permuta y abono
        foreach ([['valor_permuta', 'Equipo entregado en parte de pago'], ['monto_reserva_aplicado', 'Abono de la reserva']] as [$campo, $etiqueta]) {
            if ((float) $venta->{$campo} > 0) {
                $lineas[] = ['etiqueta' => $etiqueta, 'monto' => '− Bs ' . number_format((float) $venta->{$campo}, 2, ',', '.')];
            }
        }
        $total = $suma - (float) $venta->valor_permuta - (float) $venta->monto_reserva_aplicado;

        return new Content(view: 'emails.boleta-venta', with: [
            'venta'       => $venta,
            'nombre'      => Documento::nombreDePila($venta),
            'fecha'       => $fecha->translatedFormat('d \d\e F \d\e Y'),
            'items'       => $items,
            'totales'     => [
                'lineas' => $lineas,
                'total'  => max(0, $total),
                'metodo' => ['efectivo' => 'efectivo', 'qr' => 'QR', 'tarjeta' => 'tarjeta'][$venta->metodo_pago] ?? $venta->metodo_pago,
            ],
            'enlace'      => Documento::enlace($venta),
            'garantiaUrl' => rtrim((string) config('seo.public_url', config('app.url')), '/') . '/paginas/garantia',
        ]);
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => Documento::pdf($this->venta)->output(), Documento::nombreArchivo($this->venta))->withMime('application/pdf')];
    }
}
