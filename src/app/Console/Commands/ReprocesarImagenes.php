<?php

namespace App\Console\Commands;

use App\Models\CatalogoImagen;
use App\Services\ImagenProductoService;
use Illuminate\Console\Command;

/**
 * Regenera las variantes (card/detalle/…) de las fotos de catálogo desde su original, con el recorte+encuadre nuevo,
 * para que las fotos viejas queden con el mismo zoom que las nuevas. Conserva los originales; sobrescribe las variantes.
 */
class ReprocesarImagenes extends Command
{
    protected $signature = 'catalogo:reprocesar-imagenes';

    protected $description = 'Recorta y re-encuadra las fotos del catálogo (desde su original) para uniformar el zoom';

    public function handle(ImagenProductoService $servicio): int
    {
        $total = CatalogoImagen::whereNotNull('ruta_original')->count();
        if ($total === 0) {
            $this->info('No hay imágenes para reprocesar.');
            return self::SUCCESS;
        }

        $this->info("Reprocesando {$total} imágenes…");
        $bar = $this->output->createProgressBar($total);
        $ok = 0;
        $fallas = 0;

        CatalogoImagen::whereNotNull('ruta_original')->orderBy('id')->chunkById(100, function ($imagenes) use ($servicio, $bar, &$ok, &$fallas) {
            foreach ($imagenes as $imagen) {
                try {
                    $servicio->reprocesar($imagen) ? $ok++ : $fallas++;
                } catch (\Throwable $e) {
                    $fallas++;
                    $this->newLine();
                    $this->warn("  Imagen {$imagen->id}: {$e->getMessage()}");
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);
        $this->info("Listas: {$ok}" . ($fallas ? " · con problema: {$fallas}" : ''));

        return self::SUCCESS;
    }
}
