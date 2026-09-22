<?php

namespace Tests\Rendimiento;

use App\Models\Celular;
use App\Models\ProductoGeneral;
use App\Models\ServicioTecnico;
use App\Models\User;
use App\Models\Venta;
use App\Models\VentaItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Medición de los indicadores cuantitativos del capítulo de pruebas.
 *
 * No forma parte de la batería de `php artisan test`: se ejecuta a mano con
 *   vendor/bin/phpunit tests/Rendimiento/IndicadoresRendimientoTest.php
 * y deja el resultado en storage/app/indicadores-rendimiento.json
 * (la copia publicada del proyecto vive en docs/seguridad/pruebas/resultados/indicadores.json)
 */
class IndicadoresRendimientoTest extends TestCase
{
    use RefreshDatabase;

    private const REPETICIONES = 30;

    private User $admin;

    private array $medidas = [];

    private function sembrar(): void
    {
        $this->admin = User::factory()->create(['rol' => 'admin', 'name' => 'Administrador']);

        $celulares = [];
        for ($i = 1; $i <= 400; $i++) {
            $celulares[] = Celular::create([
                'modelo' => 'IPHONE ' . (11 + ($i % 6)) . ' PRO',
                'capacidad' => [128, 256, 512][$i % 3] . ' GB',
                'color' => ['NEGRO', 'BLANCO', 'AZUL'][$i % 3],
                'bateria' => (string) (80 + ($i % 20)),
                'imei_1' => str_pad((string) (350000000000000 + $i), 15, '0', STR_PAD_LEFT),
                'estado_imei' => 'libre',
                'procedencia' => ['EEUU', 'CHILE', 'TIENDA'][$i % 3],
                'precio_costo' => 4000 + ($i % 50) * 20,
                'precio_venta' => 5200 + ($i % 50) * 25,
                'estado' => 'disponible',
            ]);
        }

        $productos = [];
        for ($i = 1; $i <= 250; $i++) {
            $productos[] = ProductoGeneral::create([
                'codigo' => sprintf('PG-%04d', $i),
                'tipo' => 'accesorio',
                'nombre' => 'Accesorio ' . $i,
                'procedencia' => 'tienda',
                'precio_costo' => 20 + ($i % 30),
                'precio_venta' => 45 + ($i % 30),
                'estado' => 'disponible',
            ]);
        }

        for ($i = 1; $i <= 150; $i++) {
            ServicioTecnico::create([
                'codigo_nota' => sprintf('AT-ST%03d', $i),
                'cliente' => 'Cliente ' . $i,
                'equipo' => 'iPhone 13',
                'detalle_servicio' => json_encode([['descripcion' => 'Cambio de batería', 'costo' => 100, 'precio' => 250]]),
                'precio_costo' => 100,
                'precio_venta' => 250,
                'tecnico' => 'AXEL',
                'fecha' => now()->subDays($i % 25)->toDateString(),
                'user_id' => $this->admin->id,
            ]);
        }

        for ($i = 0; $i < 200; $i++) {
            $producto = $productos[$i % count($productos)];
            $venta = Venta::create([
                'nombre_cliente' => 'Cliente historico ' . $i,
                'telefono_cliente' => '7000' . str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                'fecha' => now()->subDays($i % 25)->toDateString(),
                'tipo_venta' => 'producto',
                'es_permuta' => false,
                'cantidad' => 1,
                'precio_invertido' => $producto->precio_costo,
                'precio_venta' => $producto->precio_venta,
                'ganancia_neta' => $producto->precio_venta - $producto->precio_costo,
                'subtotal' => $producto->precio_venta,
                'descuento' => 0,
                'metodo_pago' => 'efectivo',
                'user_id' => $this->admin->id,
            ]);

            VentaItem::create([
                'venta_id' => $venta->id,
                'tipo' => 'producto_general',
                'producto_id' => $producto->id,
                'cantidad' => 1,
                'precio_venta' => $producto->precio_venta,
                'precio_invertido' => $producto->precio_costo,
                'descuento' => 0,
                'subtotal' => $producto->precio_venta,
            ]);
        }

        $this->celularesLibres = $celulares;
    }

    private array $celularesLibres = [];

    private function medir(string $nombre, callable $accion): void
    {
        $tiempos = [];
        for ($i = 0; $i < self::REPETICIONES + 3; $i++) {
            $inicio = hrtime(true);
            $respuesta = $accion($i);
            $tiempos[] = (hrtime(true) - $inicio) / 1_000_000;

            if ($respuesta !== null) {
                $this->assertContains(
                    $respuesta->getStatusCode(),
                    [200, 201, 302],
                    "La operación «{$nombre}» respondió " . $respuesta->getStatusCode()
                );
            }
        }

        $tiempos = array_slice($tiempos, 3); // descarta el calentamiento
        sort($tiempos);
        $n = count($tiempos);

        $this->medidas[] = [
            'operacion' => $nombre,
            'muestras' => $n,
            'mediana_ms' => round($tiempos[intdiv($n, 2)], 1),
            'promedio_ms' => round(array_sum($tiempos) / $n, 1),
            'minimo_ms' => round($tiempos[0], 1),
            'p95_ms' => round($tiempos[(int) ceil($n * 0.95) - 1], 1),
            'maximo_ms' => round($tiempos[$n - 1], 1),
        ];
    }

    public function test_indicadores(): void
    {
        $this->sembrar();

        $this->medir('Registro de una venta (POST admin/ventas)', function (int $i) {
            $celular = $this->celularesLibres[$i];

            return $this->actingAs($this->admin)->postJson(route('admin.ventas.store'), [
                'nombre_cliente' => 'Cliente Benchmark ' . $i,
                'telefono_cliente' => '75555555',
                'tipo_venta' => 'producto',
                'es_permuta' => false,
                'tipo_permuta' => null,
                'metodo_pago' => 'efectivo',
                'precio_invertido' => $celular->precio_costo,
                'precio_venta' => $celular->precio_venta,
                'descuento' => 0,
                'items' => [[
                    'tipo' => 'celular',
                    'producto_id' => $celular->id,
                    'cantidad' => 1,
                    'precio_venta' => $celular->precio_venta,
                    'precio_invertido' => $celular->precio_costo,
                    'descuento' => 0,
                    'subtotal' => $celular->precio_venta,
                ]],
            ])->baseResponse;
        });

        $this->medir('Registro de un servicio técnico (POST admin/servicios)', function (int $i) {
            return $this->actingAs($this->admin)->post(route('admin.servicios.store'), [
                'cliente' => 'Cliente Benchmark ' . $i,
                'telefono' => '70000000',
                'equipo' => 'iPhone 13',
                'marca' => \App\Models\ServicioTecnico::MARCA_APPLE,
                'tecnico_id' => \App\Models\Tecnico::firstOrCreate(['nombre' => 'AXEL'], ['especialidad' => 'ambas'])->id,
                'fecha' => now()->toDateString(),
                'detalle_servicio' => json_encode([
                    ['descripcion' => 'Pantalla', 'costo' => 200, 'precio' => 350],
                ]),
                'notas_adicionales' => 'Equipo con garantía',
                'precio_costo' => 200,
                'precio_venta' => 350,
            ])->baseResponse;
        });

        $this->medir('Consulta de inventario (GET admin/celulares)', function () {
            return $this->actingAs($this->admin)
                ->get(route('admin.celulares.index'))->baseResponse;
        });

        $this->medir('Búsqueda en inventario (GET admin/celulares?buscar=)', function (int $i) {
            return $this->actingAs($this->admin)
                ->get(route('admin.celulares.index', ['buscar' => 'IPHONE 1' . (1 + $i % 6)]))->baseResponse;
        });

        $this->medir('Consulta de stock desde la venta (GET api/stock/celulares)', function () {
            return $this->actingAs($this->admin)
                ->getJson(route('api.stock.celulares'))->baseResponse;
        });

        $this->medir('Generación de reporte del período (GET admin/reportes)', function () {
            return $this->actingAs($this->admin)->get(route('admin.reportes.index', [
                'fecha_inicio' => now()->subDays(30)->toDateString(),
                'fecha_fin' => now()->toDateString(),
            ]))->baseResponse;
        });

        $this->medir('Exportación del reporte mensual (GET admin/reportes/exportar-mes)', function () {
            return $this->actingAs($this->admin)
                ->get(route('admin.reportes.exportar-mes'))->baseResponse;
        });

        $salida = [
            'generado' => now()->toDateTimeString(),
            'entorno' => [
                'php' => PHP_VERSION,
                'laravel' => app()->version(),
                'conexion' => config('database.default'),
                'motor' => config('database.connections.' . config('database.default') . '.driver'),
            ],
            'volumen' => [
                'celulares' => Celular::count(),
                'productos_generales' => ProductoGeneral::count(),
                'servicios_tecnicos' => ServicioTecnico::count(),
                'ventas' => Venta::count(),
                'movimientos_ultimos_30_dias' => Venta::whereDate('fecha', '>=', now()->subDays(30)->toDateString())->count()
                    + ServicioTecnico::whereDate('fecha', '>=', now()->subDays(30)->toDateString())->count(),
                'movimientos_del_mes' => Venta::whereDate('fecha', '>=', now()->startOfMonth()->toDateString())->count()
                    + ServicioTecnico::whereDate('fecha', '>=', now()->startOfMonth()->toDateString())->count(),
            ],
            'repeticiones' => self::REPETICIONES,
            'medidas' => $this->medidas,
        ];

        $ruta = base_path('storage/app/indicadores-rendimiento.json');
        @file_put_contents($ruta, json_encode($salida, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        fwrite(STDERR, "\n" . json_encode($salida, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");

        $this->assertNotEmpty($this->medidas);
    }
}
