<?php

namespace App\Observers;

use App\Mail\EstadoDePedido;
use App\Models\Pedido;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Avisa al comprador cada vez que su pedido cambia de estado.
 *
 * Vive acá y no en cada controlador a propósito: el estado se mueve desde el checkout, desde
 * el panel, desde la pasarela y desde el comando que libera pedidos vencidos. Un solo lugar
 * cubre todos esos caminos —y también los que se agreguen después.
 */
class PedidoObserver
{
    public function created(Pedido $pedido): void
    {
        $this->avisar($pedido);
    }

    public function updated(Pedido $pedido): void
    {
        if ($pedido->wasChanged('estado')) {
            $this->avisar($pedido);
        }
    }

    private function avisar(Pedido $pedido): void
    {
        if (blank($pedido->email_cliente) || ! EstadoDePedido::hayMensajePara($pedido->estado)) {
            return;
        }

        try {
            Mail::send(new EstadoDePedido($pedido->loadMissing('items')));
        } catch (\Throwable $e) {
            // Que no se caiga una compra porque el correo falló: queda anotado y se sigue.
            Log::warning('No se pudo encolar el aviso del pedido ' . $pedido->codigo . ': ' . $e->getMessage());
        }
    }
}
