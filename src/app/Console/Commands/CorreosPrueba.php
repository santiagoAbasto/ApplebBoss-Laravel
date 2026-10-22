<?php

namespace App\Console\Commands;

use App\Mail\BoletaDeVenta;
use App\Mail\SolicitudDeResena;
use App\Mail\InformeTecnico;
use App\Mail\NotaDeReserva;
use App\Mail\NotaDeServicio;
use App\Models\Diagnostico;
use App\Models\Reserva;
use App\Models\ServicioTecnico;
use App\Models\Venta;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Manda una muestra de los correos del cliente (nota de venta, nota de servicio en dos pasos, nota de reserva e
 * informe técnico) a la dirección que se indique, con los últimos registros reales. No toca ningún dato: el cliente
 * de esos registros no recibe nada, y el estado que se muestra en la nota de servicio no se guarda.
 */
class CorreosPrueba extends Command
{
    protected $signature = 'correos:prueba {correo : A dónde mandar la muestra} {--solo= : venta, servicio, reserva, diagnostico o resena}';

    protected $description = 'Manda una muestra de los correos de documentos del cliente a un correo dado';

    public function handle(): int
    {
        $correo = $this->argument('correo');
        $solo = $this->option('solo');
        $enviados = 0;

        if (! $solo || $solo === 'venta') {
            $venta = Venta::with('items')->has('items')->latest()->first() ?? Venta::latest()->first();
            $enviados += $this->mandar($correo, $venta ? new BoletaDeVenta($venta) : null, 'nota de venta ' . ($venta?->codigo_nota ?? '—'));
        }

        if (! $solo || $solo === 'resena') {
            $venta = Venta::latest()->first();
            $enviados += $this->mandar($correo, $venta ? new SolicitudDeResena($venta) : null, 'pedido de reseña (venta ' . ($venta?->codigo_nota ?? '—') . ')');
        }

        if (! $solo || $solo === 'servicio') {
            $servicio = ServicioTecnico::latest()->first();
            foreach ([ServicioTecnico::RECIBIDO, ServicioTecnico::LISTO] as $estado) {
                if ($servicio) {
                    $servicio->estado = $estado; // solo en memoria: no se guarda
                }
                $enviados += $this->mandar($correo, $servicio ? new NotaDeServicio($servicio) : null, "nota de servicio {$servicio?->codigo_nota} ({$estado})");
            }
        }

        if (! $solo || $solo === 'reserva') {
            $reserva = Reserva::with('items')->latest()->first();
            if ($reserva) {
                $reserva->estado = 'activa';
            }
            $enviados += $this->mandar($correo, $reserva ? new NotaDeReserva($reserva) : null, 'nota de reserva ' . ($reserva?->codigo_nota ?? '—'));
        }

        if (! $solo || $solo === 'diagnostico') {
            $diagnostico = Diagnostico::latest()->get()->first(fn (Diagnostico $d) => $d->listo());
            $enviados += $this->mandar($correo, $diagnostico ? new InformeTecnico($diagnostico) : null, 'informe técnico ' . ($diagnostico?->codigo ?? '—'));
        }

        $this->info("Listo: {$enviados} correos mandados a {$correo}.");

        return self::SUCCESS;
    }

    private function mandar(string $correo, $mailable, string $que): int
    {
        if (! $mailable) {
            $this->warn("Sin registros para la {$que}: no se mandó.");

            return 0;
        }

        Mail::to($correo)->sendNow($mailable); // directo, sin cola: es una prueba y se quiere ver ya
        $this->line("Enviada la {$que}.");

        return 1;
    }
}
