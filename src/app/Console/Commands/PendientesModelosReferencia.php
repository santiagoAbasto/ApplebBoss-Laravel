<?php

namespace App\Console\Commands;

use App\Support\FichaTecnica\EsquemaCelular;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

/**
 * Lista lo que falta o hay que verificar en las fichas de database/data/modelos_referencia, con la fuente
 * donde buscarlo. Con --markdown arma docs/admin-ui/modelos-referencia-pendientes.md.
 */
class PendientesModelosReferencia extends Command
{
    protected $signature = 'modelos:pendientes
                            {--markdown : Salida en Markdown para la documentación}';

    protected $description = 'Lista los datos de los modelos de referencia que faltan o hay que verificar, con su fuente';

    private const ETIQUETAS = [
        'sistema.ios_maximo'      => 'Último iOS disponible',
        'sistema.ios_lanzamiento' => 'iOS con el que salió',
        'sistema.numeros_modelo'  => 'Números de modelo',
        'bateria.qi_w'            => 'Carga Qi (W)',
        'bateria.carga_rapida_magsafe_w' => 'Carga rápida con MagSafe (adaptador, W)',
        'conectividad.uwb'        => 'Chip de banda ultraancha',
        'diseno.dorso'            => 'Material del dorso',
        'diseno.frente'           => 'Material del frente',
        'pantalla.apple_pencil'   => 'Apple Pencil',
        'diseno.grosor_mm'        => 'Grosor (mm)',
        'diseno.capacidades_gb'   => 'Capacidades (GB)',
        'camaras.zoom_opciones'   => 'Niveles de zoom (x)',
        'seguridad.sos_satelite'  => 'SOS vía satélite',
    ];

    public function handle(): int
    {
        $pendientes = $this->pendientes();

        if ($this->option('markdown')) {
            $this->line($this->markdown($pendientes));

            return self::SUCCESS;
        }

        $this->table(
            ['Modelo', 'Dato', 'Estado', 'Valor actual', 'Qué hay que confirmar'],
            $pendientes->map(fn ($p) => [$p['modelo'], $p['dato'], $p['estado'], $p['valor'], $p['detalle']])->all(),
        );
        $this->line($this->resumen($pendientes));

        return self::SUCCESS;
    }

    private function pendientes(): Collection
    {
        return collect(ModelosReferenciaSeeder::modelos())
            ->flatMap(fn (array $modelo) => collect($modelo['pendientes'] ?? [])->map(fn ($p) => [
                'modelo'  => $modelo['nombre'],
                'anio'    => Arr::get($modelo, 'datos.sistema.anio'),
                'campo'   => $p['campo'] ?? '',
                'dato'    => self::ETIQUETAS[$p['campo'] ?? ''] ?? ($p['campo'] ?? ''),
                'tipo'    => $p['tipo'] ?? '',
                'estado'  => EsquemaCelular::TIPOS_PENDIENTE[$p['tipo'] ?? ''] ?? ($p['tipo'] ?? ''),
                'valor'   => self::valor(Arr::get($modelo['datos'] ?? [], $p['campo'] ?? '')),
                'detalle' => $p['detalle'] ?? '',
                'fuente'  => $p['fuente'] ?? '',
            ]))
            ->values();
    }

    private function resumen(Collection $pendientes): string
    {
        return sprintf(
            '%d pendientes en %d modelos · %d datos faltan · %d por verificar.',
            $pendientes->count(),
            $pendientes->pluck('modelo')->unique()->count(),
            $pendientes->where('tipo', 'falta')->count(),
            $pendientes->where('tipo', 'verificar')->count(),
        );
    }

    private function markdown(Collection $pendientes): string
    {
        $celda = fn ($t) => str_replace(['|', "\n"], ['\|', ' '], (string) $t);

        $md = [
            '# Modelos de referencia: datos pendientes',
            '',
            '> Generado con `php artisan modelos:pendientes --markdown`. No se edita a mano: los pendientes viven en',
            '> `src/database/data/modelos_referencia/*.php`, en la lista `pendientes` de cada modelo.',
            '',
            '**' . $this->resumen($pendientes) . '**',
            '',
            '- **Falta el dato**: el campo está vacío; la ficha no lo muestra hasta conseguir la fuente.',
            '- **Por verificar**: el dato está cargado y se muestra, pero no sale de la página oficial que se pegó; hay que confirmarlo.',
            '',
            '## Cómo cerrar un pendiente',
            '',
            '1. Buscar el dato en la fuente indicada (sitio oficial de Apple).',
            '2. Cargar o corregir el valor en `datos` del modelo.',
            '3. Quitar el pendiente de la lista `pendientes` de ese modelo.',
            '4. Revisar con `php artisan modelos:verificar`, cargar con `php artisan db:seed --class=ModelosReferenciaSeeder` y volver a generar este archivo.',
            '',
            '## Resumen por dato',
            '',
            '| Dato | Falta el dato | Por verificar | Modelos |',
            '|---|---|---|---|',
        ];

        foreach ($pendientes->groupBy('dato') as $dato => $grupo) {
            $md[] = sprintf(
                '| %s | %s | %s | %s |',
                $celda($dato),
                $grupo->where('tipo', 'falta')->count() ?: '—',
                $grupo->where('tipo', 'verificar')->count() ?: '—',
                $celda($grupo->pluck('modelo')->unique()->implode(', ')),
            );
        }

        $md[] = '';
        $md[] = '## Por modelo';

        foreach ($pendientes->groupBy('modelo') as $modelo => $grupo) {
            $anio = $grupo->first()['anio'];
            array_push($md, '', "### {$modelo}" . ($anio ? " ({$anio})" : ''), '',
                '| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |', '|---|---|---|---|---|');

            foreach ($grupo as $p) {
                $md[] = '| ' . implode(' | ', [
                    $celda($p['dato']) . " (`{$p['campo']}`)",
                    $p['estado'],
                    $celda($p['valor']),
                    $celda($p['detalle']),
                    $celda($p['fuente']),
                ]) . ' |';
            }
        }

        return implode("\n", $md);
    }

    private static function valor(mixed $v): string
    {
        return match (true) {
            $v === null  => '— (vacío)',
            $v === false => 'No tiene',
            $v === true  => 'Sí',
            is_array($v) => implode(', ', array_map(fn ($x) => is_float($x) ? self::num($x) : (string) $x, $v)),
            is_float($v) => self::num($v),
            default      => (string) $v,
        };
    }

    /** 7.85 → "7,85"; 1.0 → "1" */
    private static function num(float $n): string
    {
        return rtrim(rtrim(number_format($n, 2, ',', '.'), '0'), ',');
    }
}
