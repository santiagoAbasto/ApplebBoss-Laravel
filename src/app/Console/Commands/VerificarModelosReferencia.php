<?php

namespace App\Console\Commands;

use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Console\Command;

/** Revisa que las fichas de database/data/modelos_referencia estén completas antes de cargarlas. */
class VerificarModelosReferencia extends Command
{
    protected $signature = 'modelos:verificar';

    protected $description = 'Revisa que las fichas de los modelos de referencia estén completas y sin errores';

    public function handle(): int
    {
        $filas = [];
        $conErrores = 0;
        $faltan = 0;
        $porVerificar = 0;

        foreach (ModelosReferenciaSeeder::modelos() as $modelo) {
            [$errores, $pendientes] = ModelosReferenciaSeeder::revisar($modelo);
            $verificar = collect($modelo['pendientes'] ?? [])->where('tipo', 'verificar')->count();

            $conErrores += $errores ? 1 : 0;
            $faltan += count($pendientes);
            $porVerificar += $verificar;

            $filas[] = [
                $modelo['nombre'],
                $errores ? '✗ ' . implode(' ', $errores) : '✓ Completa',
                $pendientes ? implode(', ', array_map(fn ($p) => str_replace('sistema.', '', $p), $pendientes)) : '—',
                $verificar ?: '—',
            ];
        }

        $this->table(['Modelo', 'Estado', 'Falta el dato', 'Por verificar'], $filas);
        $this->line(sprintf('%d modelos · %d con errores · %d datos faltan · %d por verificar.', count($filas), $conErrores, $faltan, $porVerificar));

        if ($faltan || $porVerificar) {
            $this->line('Detalle y fuentes: php artisan modelos:pendientes');
        }

        return $conErrores ? self::FAILURE : self::SUCCESS;
    }
}
