<?php

namespace App\Console\Commands;

use App\Models\Celular;
use App\Support\Celulares\Marcas;
use Illuminate\Console\Command;

/**
 * Rellena la marca de los celulares a partir del nombre del modelo (Pixel→Google, Galaxy→Samsung…; el resto iPhone).
 * Así no hay que editar uno por uno. Por defecto solo toca los que no tienen marca; con --forzar re-detecta todos.
 */
class MarcarCelulares extends Command
{
    protected $signature = 'celulares:marcar {--forzar : Re-detecta la marca de TODOS, incluso los que ya la tienen}';

    protected $description = 'Asigna la marca de cada celular según el nombre del modelo';

    public function handle(): int
    {
        $query = Celular::query();
        if (! $this->option('forzar')) {
            $query->whereNull('marca');
        }

        $conteo = [];
        $total = 0;

        $query->orderBy('id')->chunkById(200, function ($celulares) use (&$conteo, &$total) {
            foreach ($celulares as $celular) {
                $marca = Marcas::detectar($celular->modelo);
                $celular->forceFill(['marca' => $marca])->save();
                $conteo[$marca] = ($conteo[$marca] ?? 0) + 1;
                $total++;
            }
        });

        arsort($conteo);
        $this->info("Celulares marcados: {$total}");
        foreach ($conteo as $marca => $n) {
            $this->line("  " . Marcas::etiqueta($marca) . " ({$marca}): {$n}");
        }

        return self::SUCCESS;
    }
}
