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

    /** Colores cuyo costo difiere en más de esto (USD) van en tarjetas distintas. */
    private const UMBRAL = 40;

    /**
     * Colores que van SIEMPRE en su propia tarjeta, cueste lo que cueste: el Vino (Borgoña) del iPhone 18 Pro tiene su
     * columna de precio y su foto, y el cliente lo busca como color aparte. Pegado al negro/plata/azul quedaba escondido
     * detrás de la foto de los otros (pasó el 10-11-2026 con 5 versiones).
     */
    private const APARTE = ['Vino'];

    /**
     * Fotos del dueño por título de tarjeta, guardadas entre importaciones: una tarjeta que sale de la lista y vuelve
     * recupera su foto. Con --dir (pruebas), junto a esas listas y sin la extensión .json para que no se lea como lista.
     */
    private function archivoFotos(): string
    {
        return $this->option('dir') ? rtrim($this->option('dir'), '/') . '/.fotos-proveedor' : storage_path('app/fotos-proveedor.json');
    }

    public function handle(): int
    {
        $archivos = $this->option('dir')
            ? (glob(rtrim($this->option('dir'), '/') . '/*.json') ?: [])
            : self::listasVigentes();
        if (! $archivos) {
            $this->error('No hay listas de proveedor.');
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
                    // Condición de la lista: casi todo es 'Nuevo'; un equipo marcado CPO (Certified Pre-Owned) entra como 'Reacondicionado'.
                    'condicion' => $it['condicion'] ?? 'Nuevo',
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
                        'condicion' => $barato['condicion'] ?? 'Nuevo',
                    ]);
                }
            }
        });

        // 3) Dentro de cada modelo+capacidad, agrupar colores de costo parecido; el precio del grupo = el costo MÁS ALTO
        //    (así ningún color pierde margen). Un color de APARTE (Vino) va siempre en su propia tarjeta.
        $cards = collect();
        $porColor->groupBy(fn ($f) => $this->clave($f))->each(function ($g) use ($cards) {
            [$aparte, $g] = $g->partition(fn ($f) => in_array($f['color'], self::APARTE, true));
            foreach ($aparte as $f) {
                $cards->push($this->armarCard(collect([$f])));
            }
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
                'procedencia' => $c['proveedor'], 'estado' => 'disponible', 'condicion' => $c['condicion'] ?? 'Nuevo',
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

            $pub = InventarioCatalogo::crear($c['tipo'], $reg, $c['condicion'] ?? 'Nuevo', true);
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
        // También las tarjetas SIN foto (imgs vacío): así una foto que el dueño quitó no vuelve desde lo guardado.
        foreach ($this->tarjetasDeProveedor(true) as [$pub, $reg]) {
            $fotos[] = [
                'titulo' => $this->claveFoto($pub->titulo),
                'equipo' => $this->claveEquipo($reg),
                'imgs'   => $pub->imagenes->map(fn ($img) => collect($img->getAttributes())->only([
                    'nombre_original', 'ruta_original', 'ruta_thumb', 'ruta_card', 'ruta_medium', 'ruta_detail', 'alt', 'orden', 'es_principal',
                ])->all() + ['metadata' => self::metadatos($img->getRawOriginal('metadata'))])->all(),
            ];
        }

        return $fotos;
    }

    /**
     * Vuelve a colgar las fotos guardadas: primero de la tarjeta con el mismo título (sin el SIM). Si una tarjeta con
     * foto cambió de título (p. ej. ahora dice su único color), su foto pasa a las tarjetas del mismo equipo
     * (modelo + capacidad) que se quedaron sin foto, para que el dueño no pierda lo que subió.
     */
    private function restaurarFotos(array $fotos): void
    {
        // Lo guardado de importaciones anteriores (una tarjeta que hoy no está en la lista conserva su foto para cuando
        // vuelva); lo capturado ahora pisa lo viejo del mismo título.
        $porTitulo = json_decode((string) @file_get_contents($this->archivoFotos()), true) ?: [];
        $tarjetas = $this->tarjetasDeProveedor(false);
        $titulos = array_flip(array_map(fn ($t) => $this->claveFoto($t[0]->titulo), $tarjetas));

        $huerfanas = [];   // equipo => fotos de una tarjeta cuyo título ya no existe
        foreach ($fotos as $f) {
            $porTitulo[$f['titulo']] = $f['imgs'];
            if ($f['imgs'] && ! isset($titulos[$f['titulo']])) {
                $huerfanas[$f['equipo']] ??= $f['imgs'];
            }
        }

        $ok = 0;
        foreach ($tarjetas as [$pub, $reg]) {
            $imgs = $porTitulo[$this->claveFoto($pub->titulo)] ?? $huerfanas[$this->claveEquipo($reg)] ?? null;
            if (! $imgs || $pub->imagenes()->exists()) {
                continue;
            }
            foreach ($imgs as $img) {
                $pub->imagenes()->create($img);
            }
            $ok++;
        }
        $porTitulo = array_filter($porTitulo);
        // Guardar las fotos es una ayuda, no parte de la importación: si no se puede escribir, se avisa y se sigue.
        if (($porTitulo || is_file($this->archivoFotos()))
            && @file_put_contents($this->archivoFotos(), json_encode($porTitulo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)) === false) {
            $this->warn('No se pudieron guardar las fotos para la próxima importación: ' . $this->archivoFotos());
        }
        if ($ok) {
            $this->info("Fotos re-enlazadas a {$ok} tarjetas (no se pierden al re-importar).");
        }
    }

    /** @return list<array{0: CatalogoPublicacion, 1: \Illuminate\Database\Eloquent\Model}> las tarjetas de proveedor disponibles con su equipo */
    private function tarjetasDeProveedor(bool $conImagenes): array
    {
        $lista = [];
        foreach (self::MODELOS as $tipo => $clase) {
            $regs = $clase::where('es_proveedor', true)->where('estado', 'disponible')->get()->keyBy('id');
            if ($regs->isEmpty()) {
                continue;
            }
            $pubs = CatalogoPublicacion::where('producto_tipo', $tipo)->whereIn('producto_id', $regs->keys())
                ->when($conImagenes, fn ($q) => $q->with('imagenes'))->get();
            foreach ($pubs as $pub) {
                $lista[] = [$pub, $regs[$pub->producto_id]];
            }
        }

        return $lista;
    }

    /**
     * Los metadatos de una foto como arreglo. Se copiaban crudos (texto JSON) y el cast `array` los volvía a codificar en
     * cada importación: llegaron a estar codificados tres veces. Se desenvuelve hasta llegar al arreglo, así se sanan.
     */
    private static function metadatos(mixed $crudo): ?array
    {
        while (is_string($crudo) && ($d = json_decode($crudo, true)) !== null) {
            $crudo = $d;
        }

        return is_array($crudo) ? $crudo : null;
    }

    /** El equipo sin color ni SIM: «iphone 18 pro|256 gb». */
    private function claveEquipo($reg): string
    {
        return mb_strtolower(trim(($reg->modelo ?? $reg->nombre) . '|' . ($reg->capacidad ?? $reg->almacenamiento)));
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
            'condicion' => $caro['condicion'] ?? 'Nuevo',
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

    /**
     * Las listas vigentes: las de base (database/data/proveedores, vienen con la imagen) más las SUBIDAS por el dueño
     * desde el panel (storage/app/proveedores, que persisten). Una subida reemplaza a la de base del mismo proveedor,
     * por nombre de archivo (apple-land.json, planet-cell.json…).
     *
     * @return list<string>
     */
    public static function listasVigentes(): array
    {
        $base = collect(glob(database_path('data/proveedores/*.json')) ?: [])->keyBy(fn ($f) => basename($f));
        $subidas = collect(glob(storage_path('app/proveedores/*.json')) ?: [])->keyBy(fn ($f) => basename($f));

        return $base->merge($subidas)->values()->all();
    }
}
