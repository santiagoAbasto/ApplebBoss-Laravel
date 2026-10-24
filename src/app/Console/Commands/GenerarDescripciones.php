<?php

namespace App\Console\Commands;

use App\Models\CatalogoPublicacion;
use App\Support\Catalogo\GeneradorDescripcion;
use Illuminate\Console\Command;

/**
 * Genera la descripción larga de los productos PUBLICADOS que no la tienen, a partir de su ficha, condición y
 * garantía (App\Support\Catalogo\GeneradorDescripcion). No pisa las descripciones ya escritas salvo con --forzar.
 */
class GenerarDescripciones extends Command
{
    protected $signature = 'catalogo:generar-descripciones {--dry : Solo muestra} {--forzar : Regenera también las que ya tienen}';

    protected $description = 'Genera la descripción larga de los productos publicados que no la tienen';

    public function handle(): int
    {
        $q = CatalogoPublicacion::query()
            ->with('modeloReferencia')
            ->where('publicado', true)
            ->whereNotNull('modelo_referencia_id');

        if (! $this->option('forzar')) {
            $q->where(fn ($w) => $w->whereNull('descripcion')->orWhere('descripcion', ''));
        }

        $pubs = $q->get();
        $this->info("Publicaciones a generar: {$pubs->count()}");

        $n = 0;
        foreach ($pubs as $pub) {
            if ($this->option('dry')) {
                $this->line("  • {$pub->titulo}");
                continue;
            }
            $pub->update(['descripcion' => GeneradorDescripcion::para($pub)]);
            $n++;
        }

        if (! $this->option('dry')) {
            $this->newLine();
            $this->info("Descripciones generadas: {$n}");
        }

        return self::SUCCESS;
    }
}
