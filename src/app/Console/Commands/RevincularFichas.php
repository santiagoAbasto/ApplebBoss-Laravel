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
    protected $signature = 'catalogo:revincular-fichas';

    protected $description = 'Enlaza a su ficha técnica las publicaciones que no tienen una (y trae sus specs)';

    public function handle(): int
    {
        $pubs = CatalogoPublicacion::whereNull('modelo_referencia_id')->get();
        $this->info("Publicaciones sin ficha: {$pubs->count()}");

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

            $pub->update([
                'modelo_referencia_id' => $ref->id,
                // La ficha aporta las specs; lo que ya tenía la publicación (colores, SIM) manda.
                'atributos' => array_merge($ref->fichaParaPublicacion() ?? [], $pub->atributos ?? []),
            ]);
            $ok++;
            $this->line("  ✓ {$pub->titulo}  →  {$ref->nombre}");
        }

        $this->newLine();
        $this->info("Revinculadas: {$ok}");

        return self::SUCCESS;
    }
}
