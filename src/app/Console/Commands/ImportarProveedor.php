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

    /** Colores cuyo costo difiere en más de esto (USD) van en tarjetas distintas; uno más caro (Vino) queda aparte. */
    private const UMBRAL = 40;

    public function handle(): int
    {
        $dir = $this->option('dir') ?: database_path('data/proveedores');
        $archivos = glob(rtrim($dir, '/') . '/*.json');
        if (! $archivos) {
            $this->error("No hay listas de proveedor en {$dir}");
            return self::FAILURE;
        }

        // 1) Juntar los equipos de todas las listas (sin explotar: una entrada puede traer varios colores a un precio)
        $entradas = collect();
        foreach ($archivos as $f) {
            $data = json_decode((string) file_get_contents($f), true) ?: [];
            $prov = $data['proveedor'] ?? pathinfo($f, PATHINFO_FILENAME);
            foreach ($data['items'] ?? [] as $it) {
                $entradas->push([
                    'tipo' => $it['tipo'], 'modelo' => $it['modelo'], 'capacidad' => $it['capacidad'] ?? '',
                    'colores' => $it['colores'] ?? [], 'usd' => (float) $it['usd'], 'sim' => self::normalizarSim($it['sim'] ?? null), 'proveedor' => $prov,
                ]);
            }
        }

        // 2) Por equipo, el precio MÁS BARATO de cada color. Los colores salen de la unión de todas las listas; una
        //    entrada SIN colores es un precio para cualquier color (así un proveedor que no detalla color igual compite).
        $porColor = collect();
        $entradas->groupBy(fn ($e) => $this->clave($e))->each(function ($g) use ($porColor) {
            $nombrados = $g->flatMap(fn ($e) => $e['colores'])->filter()->unique()->values();
            $colores = $nombrados->isEmpty() ? collect(['']) : $nombrados;
            foreach ($colores as $color) {
                $cand = $g->filter(fn ($e) => $color === '' || empty($e['colores']) || in_array($color, $e['colores'], true));
                $barato = $cand->sortBy('usd')->first();
                if ($barato) {
                    $porColor->push([
                        'tipo' => $barato['tipo'], 'modelo' => $barato['modelo'], 'capacidad' => $barato['capacidad'],
                        'color' => $color, 'usd' => (float) $barato['usd'], 'sim' => $barato['sim'], 'proveedor' => $barato['proveedor'],
                    ]);
                }
            }
        });

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

        // Reconstruir: borrar los de proveedor DISPONIBLES (derivados de las listas) y volver a crearlos; los vendidos no se tocan.
        // Antes de borrar, guardar las fotos que cargó el dueño para volver a colgarlas de la tarjeta equivalente.
        $fotos = $this->capturarFotos();
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
                $datos['sim'] = $c['sim'] ?? null;
            }
            if ($c['tipo'] === 'computadora') {
                // Una Mac usa `nombre` (no `modelo`) y `almacenamiento` (no `capacidad`).
                unset($datos['modelo'], $datos['capacidad']);
                $datos['nombre'] = $c['modelo'];
                $datos['procesador'] = '';
                $datos['ram'] = '';
                $datos['almacenamiento'] = $c['capacidad'] ?: '';
            }
            $reg = $clase::create($datos);

            $pub = InventarioCatalogo::crear($c['tipo'], $reg, 'Nuevo', true);
            // El SIM ya lo pone InventarioCatalogo::atributos (desde el equipo) con su etiqueta pública; aquí solo lo propio.
            $extra = array_filter([
                'capacidad' => $c['capacidad'] ?: null,
                'color'     => $c['colores'] ? implode(', ', $c['colores']) : null,
            ]);
            $pub->update(['atributos' => array_merge($pub->atributos ?? [], $extra), 'publicado' => true]);
            $creados++;
        }

        $this->restaurarFotos($fotos);

        $this->newLine();
        $this->info("Listo. Tarjetas publicadas: {$creados}");

        return self::SUCCESS;
    }

    /**
     * Guarda las fotos de los productos de proveedor DISPONIBLES antes de reconstruirlos, por el título de la tarjeta
     * SIN el sufijo de SIM. Los archivos en disco no se tocan (el borrado es en bloque, sin eventos): solo se pierden
     * los registros, que se recrean en restaurarFotos(). Así el dueño no pierde las fotos que subió al re-importar.
     *
     * @return array<string, list<array<string, mixed>>>
     */
    private function capturarFotos(): array
    {
        $fotos = [];
        foreach (self::MODELOS as $tipo => $clase) {
            $ids = $clase::where('es_proveedor', true)->where('estado', 'disponible')->pluck('id');
            if ($ids->isEmpty()) {
                continue;
            }
            $pubs = CatalogoPublicacion::where('producto_tipo', $tipo)->whereIn('producto_id', $ids)->with('imagenes')->get();
            foreach ($pubs as $pub) {
                if ($pub->imagenes->isEmpty()) {
                    continue;
                }
                $fotos[$this->claveFoto($pub->titulo)] = $pub->imagenes->map(fn ($img) => collect($img->getAttributes())->only([
                    'nombre_original', 'ruta_original', 'ruta_thumb', 'ruta_card', 'ruta_medium', 'ruta_detail', 'alt', 'orden', 'es_principal', 'metadata',
                ])->all())->all();
            }
        }

        return $fotos;
    }

    /** Vuelve a colgar las fotos guardadas de la tarjeta de proveedor cuyo título (sin el SIM) coincide. */
    private function restaurarFotos(array $fotos): void
    {
        if (! $fotos) {
            return;
        }
        $ok = 0;
        foreach (self::MODELOS as $tipo => $clase) {
            $ids = $clase::where('es_proveedor', true)->where('estado', 'disponible')->pluck('id');
            if ($ids->isEmpty()) {
                continue;
            }
            $pubs = CatalogoPublicacion::where('producto_tipo', $tipo)->whereIn('producto_id', $ids)->get();
            foreach ($pubs as $pub) {
                $imgs = $fotos[$this->claveFoto($pub->titulo)] ?? null;
                if (! $imgs || $pub->imagenes()->exists()) {
                    continue;
                }
                foreach ($imgs as $img) {
                    $pub->imagenes()->create($img);
                }
                $ok++;
            }
        }
        if ($ok) {
            $this->info("Fotos re-enlazadas a {$ok} tarjetas (no se pierden al re-importar).");
        }
    }

    /**
     * Clave de una tarjeta para re-enlazar fotos: el título sin el sufijo « · eSIM» o « · Chip físico». Así una foto
     * subida antes de separar físico/eSIM se vuelve a colgar de las dos tarjetas (es el mismo equipo).
     */
    private function claveFoto(?string $titulo): string
    {
        $t = preg_replace('/\s*·\s*(eSIM|Chip f[ií]sico)\s*$/u', '', (string) $titulo);

        return mb_strtolower(trim(preg_replace('/\s+/', ' ', (string) $t)));
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
        // El SIM entra en la clave: un mismo modelo+capacidad con chip físico y con eSIM son DOS productos (distinto
        // precio, distinta activación), nunca se agrupan ni se comparan en precio entre sí.
        return mb_strtolower(trim($i['tipo'] . '|' . $i['modelo'] . '|' . ($i['capacidad'] ?? '') . '|' . ($i['sim'] ?? '')));
    }

    /** El tipo de SIM de la lista a un valor fijo: 'esim', 'fisico' o null (no lo dice). */
    private static function normalizarSim(?string $valor): ?string
    {
        return match (mb_strtolower(trim((string) $valor))) {
            'esim', 'e-sim', 'virtual' => 'esim',
            'chip', 'fisico', 'física', 'fisica', 'chip físico', 'chip fisico', 'physical' => 'fisico',
            default => null,
        };
    }
}
