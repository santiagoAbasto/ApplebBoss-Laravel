<?php

namespace App\Console\Commands;

use App\Support\TiendaSoloDisponible;
use Illuminate\Console\Command;

/**
 * Apaga en la tienda todo lo que sigue publicado aunque ya se vendió o ya no existe en el inventario.
 * Desde ahora esto pasa solo al vender; el comando sirve para ordenar lo que quedó de antes.
 */
class DespublicarVendidos extends Command
{
    protected $signature = 'tienda:despublicar-vendidos';

    protected $description = 'Despublica de la tienda los productos que ya se vendieron o ya no están en el inventario';

    public function handle(): int
    {
        $apagadas = TiendaSoloDisponible::repasar();

        $this->info($apagadas === 0
            ? 'La tienda ya estaba al día: no había productos vendidos publicados.'
            : "Se despublicaron {$apagadas} producto(s) que ya estaban vendidos.");

        return self::SUCCESS;
    }
}
