<?php

namespace App\Console\Commands;

use App\Models\CatalogoPublicacion;
use App\Support\Seo\SeoProducto;
use Illuminate\Console\Command;

/**
 * Escribe el SEO (seo_title / seo_description) de cada producto publicado analizándolo uno por uno con App\Support\Seo\SeoProducto
 * (nombre, condición, specs reales de su ficha, garantía y lugar). Por defecto solo completa los que están vacíos, así respeta
 * cualquier SEO escrito a mano; con --forzar regenera todos. Idempotente: re-correrlo da el mismo texto (no lleva precio, que
 * cambia). El precio sigue saliendo en vivo en la ficha y en los datos estructurados.
 */
class GenerarSeoProductos extends Command
{
    protected $signature = 'seo:generar-productos {--dry : Solo muestra lo que haría} {--forzar : Sobrescribe también el SEO ya escrito}';

    protected $description = 'Pone el SEO profesional (título y descripción) a cada producto publicado, analizándolo uno por uno';

    public function handle(): int
    {
        $forzar = (bool) $this->option('forzar');
        $dry = (bool) $this->option('dry');
        $puestos = $saltados = 0;

        CatalogoPublicacion::query()
            ->where('publicado', true)
            ->orderBy('id')
            ->chunkById(200, function ($pubs) use ($forzar, $dry, &$puestos, &$saltados) {
                foreach ($pubs as $pub) {
                    $titulo = SeoProducto::titulo($pub);
                    $descripcion = SeoProducto::descripcion($pub);

                    $nuevoTitulo = ($forzar || blank($pub->seo_title)) ? $titulo : $pub->seo_title;
                    $nuevaDesc = ($forzar || blank($pub->seo_description)) ? $descripcion : $pub->seo_description;

                    if ($nuevoTitulo === $pub->seo_title && $nuevaDesc === $pub->seo_description) {
                        $saltados++;
                        continue;
                    }

                    if ($dry) {
                        $this->line("· <info>{$pub->titulo}</info>");
                        $this->line("  T: {$nuevoTitulo}");
                        $this->line("  D: {$nuevaDesc}");
                    } else {
                        $pub->forceFill(['seo_title' => $nuevoTitulo, 'seo_description' => $nuevaDesc])->save();
                    }
                    $puestos++;
                }
            });

        $verbo = $dry ? 'se pondrían' : ($forzar ? 'regenerados' : 'completados');
        $this->info("SEO {$verbo}: {$puestos}. Sin cambios: {$saltados}.");

        return self::SUCCESS;
    }
}
