<?php

namespace App\Console\Commands;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoApple;
use App\Support\Celulares\Marcas;
use App\Support\InventarioCatalogo;
use Illuminate\Console\Command;

/**
 * Carga los productos «de proveedor» desde las listas en database/data/proveedores (una por proveedor) y los publica.
 * Por cada equipo (tipo + modelo + capacidad) toma el COSTO MÁS BAJO entre las listas que lo tengan; si solo una lo
 * tiene, de esa. Junta los colores de todas. Reusa InventarioCatalogo::crear, así cada equipo se enlaza a su ficha
 * técnica (specs + foto) si ya existe. Idempotente: al re-correr actualiza el costo/proveedor, no duplica.
 * Mañana entra otra lista: se agrega su .json a la carpeta y se vuelve a correr.
 */
class ImportarProveedor extends Command
{
    protected $signature = 'catalogo:importar-proveedor {--dry : Solo muestra lo que haría} {--dir= : Carpeta de listas}';

    protected $description = 'Carga/actualiza los productos de proveedor (el más barato por equipo) y los publica';

    private const MODELOS = [
        'celular'        => Celular::class,
        'computadora'    => Computadora::class,
        'producto_apple' => ProductoApple::class,
    ];

    /** Colores cuyo costo está dentro de este rango (USD) van en la misma tarjeta; uno más caro (Vino) va aparte. */
    private const UMBRAL = 50;

    public function handle(): int
    {
        $dir = $this->option('dir') ?: database_path('data/proveedores');
        $archivos = glob(rtrim($dir, '/') . '/*.json');
        if (! $archivos) {
            $this->error("No hay listas de proveedor en {$dir}");
            return self::FAILURE;
        }

        // 1) Una fila por COLOR de cada lista (un color caro no se mezcla con los baratos)
        $filas = collect();
        foreach ($archivos as $f) {
            $data = json_decode((string) file_get_contents($f), true) ?: [];
            $prov = $data['proveedor'] ?? pathinfo($f, PATHINFO_FILENAME);
            foreach ($data['items'] ?? [] as $it) {
                foreach (($it['colores'] ?? []) ?: [''] as $color) {
                    $filas->push([
                        'tipo' => $it['tipo'], 'modelo' => $it['modelo'], 'capacidad' => $it['capacidad'] ?? '',
                        'color' => $color, 'usd' => (float) $it['usd'], 'sim' => $it['sim'] ?? null, 'proveedor' => $prov,
                    ]);
                }
            }
        }

        // 2) El MÁS BARATO por color (entre todas las listas)
        $porColor = $filas->groupBy(fn ($f) => $this->clave($f) . '|' . mb_strtolower($f['color']))
            ->map(fn ($g) => $g->sortBy('usd')->first());

        // 3) Dentro de cada modelo+capacidad, agrupar colores de costo parecido; el precio del grupo = el costo MÁS ALTO
        //    (así ningún color pierde margen). Un color notablemente más caro (Vino) queda en su propia tarjeta.
        $cards = collect();
        $porColor->groupBy(fn ($f) => $this->clave($f))->each(function ($g) use ($cards) {
            $orden = $g->sortBy('usd')->values();
            $grupo = collect();
            $base = null;
            foreach ($orden as $f) {
                if ($base !== null && $f['usd'] - $base > self::UMBRAL) {
                    $cards->push($this->armarCard($grupo));
                    $grupo = collect();
                    $base = null;
                }
                $grupo->push($f);
                $base ??= $f['usd'];
            }
            if ($grupo->isNotEmpty()) {
                $cards->push($this->armarCard($grupo));
            }
        });

        $this->info("Tarjetas: {$cards->count()} (desde " . count($archivos) . ' listas, por color)');

        if ($this->option('dry')) {
            foreach ($cards as $c) {
                $this->line(sprintf('  %-26s %-7s  %-12s $%.0f  [%s]  %s',
                    $c['modelo'], $c['capacidad'], $c['proveedor'], $c['usd'], $c['sim'] ?? '-', implode('/', $c['colores']) ?: '—'));
            }
            return self::SUCCESS;
        }

        // Reconstruir: borrar los de proveedor DISPONIBLES (derivados de las listas) y volver a crearlos; los vendidos no se tocan
        $this->limpiarDisponibles();

        $creados = 0;
        foreach ($cards as $c) {
            $clase = self::MODELOS[$c['tipo']] ?? null;
            if (! $clase) {
                $this->warn("Tipo desconocido: {$c['tipo']} ({$c['modelo']})");
                continue;
            }

            $colorUnico = count($c['colores']) === 1 ? $c['colores'][0] : '';
            $datos = [
                'modelo' => $c['modelo'], 'capacidad' => $c['capacidad'], 'color' => $colorUnico, 'bateria' => '',
                'procedencia' => $c['proveedor'], 'estado' => 'disponible', 'condicion' => 'Nuevo',
                'es_proveedor' => true, 'proveedor' => $c['proveedor'], 'costo_usd' => $c['usd'],
            ];
            if ($c['tipo'] === 'celular') {
                $datos['marca'] = Marcas::detectar($c['modelo']);
                $datos['estado_imei'] = 'libre';
            }
            $reg = $clase::create($datos);

            $pub = InventarioCatalogo::crear($c['tipo'], $reg, 'Nuevo', true);
            $extra = array_filter([
                'capacidad' => $c['capacidad'] ?: null,
                'color'     => $c['colores'] ? implode(', ', $c['colores']) : null,
                'sim'       => $c['sim'] ?? null,
            ]);
            $pub->update(['atributos' => array_merge($pub->atributos ?? [], $extra), 'publicado' => true]);
            $creados++;
        }

        $this->newLine();
        $this->info("Listo. Tarjetas publicadas: {$creados}");

        return self::SUCCESS;
    }

    /** @param \Illuminate\Support\Collection $grupo filas de color */
    private function armarCard($grupo): array
    {
        $caro = $grupo->sortByDesc('usd')->first(); // el precio del grupo = el costo más alto (nadie pierde margen)

        return [
            'tipo'      => $caro['tipo'],
            'modelo'    => $caro['modelo'],
            'capacidad' => $caro['capacidad'],
            'usd'       => (float) $caro['usd'],
            'proveedor' => $caro['proveedor'],
            'sim'       => $caro['sim'] ?? null,
            'colores'   => $grupo->pluck('color')->filter()->unique()->values()->all(),
        ];
    }

    /** Borra los productos de proveedor DISPONIBLES y sus publicaciones (se reconstruyen). Los vendidos se conservan. */
    private function limpiarDisponibles(): void
    {
        foreach (self::MODELOS as $tipo => $clase) {
            $ids = $clase::where('es_proveedor', true)->where('estado', 'disponible')->pluck('id');
            if ($ids->isEmpty()) {
                continue;
            }
            CatalogoPublicacion::where('producto_tipo', $tipo)->whereIn('producto_id', $ids)->delete();
            $clase::whereIn('id', $ids)->delete();
        }
    }

    private function clave(array $i): string
    {
        return mb_strtolower(trim($i['tipo'] . '|' . $i['modelo'] . '|' . ($i['capacidad'] ?? '')));
    }
}
