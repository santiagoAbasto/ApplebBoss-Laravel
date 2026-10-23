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

    public function handle(): int
    {
        $dir = $this->option('dir') ?: database_path('data/proveedores');
        $archivos = glob(rtrim($dir, '/') . '/*.json');
        if (! $archivos) {
            $this->error("No hay listas de proveedor en {$dir}");
            return self::FAILURE;
        }

        // 1) Juntar todos los equipos de todas las listas, con su proveedor
        $items = collect();
        foreach ($archivos as $f) {
            $data = json_decode((string) file_get_contents($f), true) ?: [];
            $prov = $data['proveedor'] ?? pathinfo($f, PATHINFO_FILENAME);
            foreach ($data['items'] ?? [] as $it) {
                $items->push($it + ['proveedor' => $prov]);
            }
        }

        // 2) Agrupar por equipo (tipo|modelo|capacidad) y quedarse con el MÁS BARATO; juntar colores
        $merged = $items->groupBy(fn ($i) => $this->clave($i))->map(function ($g) {
            $barato = $g->sortBy('usd')->first();
            return [
                'tipo'      => $barato['tipo'],
                'modelo'    => $barato['modelo'],
                'capacidad' => $barato['capacidad'] ?? '',
                'usd'       => (float) $barato['usd'],
                'proveedor' => $barato['proveedor'],
                'sim'       => $barato['sim'] ?? null,
                'colores'   => $g->flatMap(fn ($i) => $i['colores'] ?? [])->unique()->values()->all(),
            ];
        })->values();

        $this->info("Equipos: {$merged->count()} (desde " . count($archivos) . ' listas)');

        $creados = 0;
        $actualizados = 0;
        $publicados = 0;

        foreach ($merged as $sku) {
            $clase = self::MODELOS[$sku['tipo']] ?? null;
            if (! $clase) {
                $this->warn("Tipo desconocido: {$sku['tipo']} ({$sku['modelo']})");
                continue;
            }

            if ($this->option('dry')) {
                $this->line(sprintf('  %-28s %-7s  %-12s $%.0f  [%s]  %s',
                    $sku['modelo'], $sku['capacidad'], $sku['proveedor'], $sku['usd'], $sku['sim'] ?? '-', implode('/', $sku['colores'])));
                continue;
            }

            // Un registro de inventario por modelo+capacidad, marcado de proveedor (sin IMEI: aún no está físicamente)
            $datos = [
                'modelo'       => $sku['modelo'],
                'capacidad'    => $sku['capacidad'],
                'color'        => '',
                'bateria'      => '',
                'procedencia'  => $sku['proveedor'],
                'estado'       => 'disponible',
                'condicion'    => 'Nuevo',
                'es_proveedor' => true,
                'proveedor'    => $sku['proveedor'],
                'costo_usd'    => $sku['usd'],
            ];
            if ($sku['tipo'] === 'celular') {
                $datos['marca'] = Marcas::detectar($sku['modelo']);
                $datos['estado_imei'] = 'libre';
            }

            $reg = $clase::where('es_proveedor', true)
                ->where('modelo', $sku['modelo'])
                ->where('capacidad', $sku['capacidad'])
                ->first();

            if ($reg) {
                $reg->update($datos);
                $actualizados++;
            } else {
                $reg = $clase::create($datos);
                $creados++;
            }

            // Publicar reusando el flujo normal (enlaza ficha técnica + foto si el modelo existe)
            $pub = CatalogoPublicacion::where('producto_tipo', $sku['tipo'])->where('producto_id', $reg->id)->first();
            if (! $pub) {
                $pub = InventarioCatalogo::crear($sku['tipo'], $reg, 'Nuevo', true);
                $publicados++;
            }

            // Colores disponibles y tipo de SIM, visibles en la tarjeta/ficha
            $extra = array_filter([
                'capacidad' => $sku['capacidad'] ?: null,
                'color'     => $sku['colores'] ? implode(', ', $sku['colores']) : null,
                'sim'       => $sku['sim'] ?? null,
            ]);
            $pub->update([
                'atributos' => array_merge($pub->atributos ?? [], $extra),
                'publicado' => true,
            ]);
        }

        $this->newLine();
        $this->info("Listo. Creados: {$creados} · Actualizados: {$actualizados} · Publicados nuevos: {$publicados}");

        return self::SUCCESS;
    }

    private function clave(array $i): string
    {
        return strtolower(trim($i['tipo'] . '|' . $i['modelo'] . '|' . ($i['capacidad'] ?? '')));
    }
}
