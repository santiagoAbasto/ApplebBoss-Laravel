<?php

namespace App\Console\Commands;

use App\Models\CatalogoPublicacion;
use App\Models\ModeloReferencia;
use App\Support\InventarioCatalogo;
use Illuminate\Console\Command;

/**
 * Enlaza las publicaciones que quedaron SIN ficha (modelo_referencia_id null) a su ModeloReferencia, cuando la ficha
 * ya existe. Trae las specs de la ficha a los atributos de la publicación (sin pisar lo propio, p. ej. los colores
 * que cargó el importador de proveedor). Idempotente: solo toca las que no tienen ficha.
 */
class RevincularFichas extends Command
{
    protected $signature = 'catalogo:revincular-fichas {--refrescar : Vuelve a volcar la ficha sobre las que YA tienen una (tras corregir una ficha)}';

    protected $description = 'Enlaza a su ficha técnica las publicaciones que no tienen una (y trae sus specs)';

    public function handle(): int
    {
        $refrescar = (bool) $this->option('refrescar');

        // Sin --refrescar: solo las que no tienen ficha. Con --refrescar: también las ya enlazadas, para traerles
        // los datos de una ficha que se corrigió (p. ej. specs reales de un modelo recién lanzado).
        $pubs = $refrescar
            ? CatalogoPublicacion::query()->get()
            : CatalogoPublicacion::whereNull('modelo_referencia_id')->get();
        $this->info($refrescar ? "Publicaciones a revisar: {$pubs->count()}" : "Publicaciones sin ficha: {$pubs->count()}");

        $ok = 0;
        foreach ($pubs as $pub) {
            $equipo = InventarioCatalogo::modelo((string) $pub->producto_tipo, (int) $pub->producto_id);
            if (! $equipo) {
                continue;
            }
            $ref = ModeloReferencia::deInventario($pub->producto_tipo, $equipo);
            if (! $ref) {
                continue;
            }

            $tieneFicha = $pub->modelo_referencia_id !== null;
            // Al enlazar por primera vez, lo propio de la publicación (colores, SIM) manda sobre la ficha.
            // Al refrescar una ya enlazada, la ficha NUEVA pisa sus propios valores viejos (mismas claves),
            // y lo propio que no es de la ficha (color, capacidad, SIM) se conserva.
            $atributos = $tieneFicha && $refrescar
                ? array_merge($pub->atributos ?? [], $ref->fichaParaPublicacion() ?? [])
                : array_merge($ref->fichaParaPublicacion() ?? [], $pub->atributos ?? []);

            $pub->update([
                'modelo_referencia_id' => $ref->id,
                'atributos' => $atributos,
            ]);
            $ok++;
            $this->line('  ' . ($tieneFicha ? '↻' : '✓') . " {$pub->titulo}  →  {$ref->nombre}");
        }

        $this->newLine();
        $this->info($refrescar ? "Revisadas/refrescadas: {$ok}" : "Revinculadas: {$ok}");

        return self::SUCCESS;
    }
}
