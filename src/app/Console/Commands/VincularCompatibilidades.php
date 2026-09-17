<?php

namespace App\Console\Commands;

use App\Models\CatalogoPublicacion;
use App\Models\ProductoGeneral;
use App\Support\ModelosCompatibles;
use Illuminate\Console\Command;

/** Vincula las fundas y accesorios ya publicados con los modelos de iPhone de su nombre. */
class VincularCompatibilidades extends Command
{
    protected $signature = 'catalogo:compatibilidades';

    protected $description = 'Detecta los modelos compatibles de los accesorios publicados (fundas, vidrios, etc.)';

    public function handle(): int
    {
        $pubs     = CatalogoPublicacion::where('producto_tipo', 'producto_general')->get(['id', 'producto_id']);
        $nombres  = ProductoGeneral::whereIn('id', $pubs->pluck('producto_id'))->pluck('nombre', 'id');
        $vinculos = 0;

        foreach ($pubs as $pub) {
            $vinculos += ModelosCompatibles::sincronizar($pub, $nombres[$pub->producto_id] ?? null);
        }

        $this->info("Revisadas {$pubs->count()} publicaciones · {$vinculos} vínculos con modelos.");

        return self::SUCCESS;
    }
}
