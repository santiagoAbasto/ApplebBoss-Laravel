<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ImportarProveedorTest extends TestCase
{
    use RefreshDatabase;

    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::put('tc.blue.momento', now()->toISOString());
        Cache::put('tc.blue.ultimo', 12.0);

        $this->dir = sys_get_temp_dir() . '/prov_' . uniqid();
        mkdir($this->dir);
        file_put_contents($this->dir . '/a.json', json_encode(['proveedor' => 'Apple Land', 'items' => [
            ['tipo' => 'celular', 'modelo' => 'iPhone 18 Pro Max', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Negro', 'Silver'], 'usd' => 1570],
            ['tipo' => 'celular', 'modelo' => 'iPhone 18 Pro Max', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Vino'], 'usd' => 1710],
            ['tipo' => 'celular', 'modelo' => 'iPhone 16', 'capacidad' => '128 GB', 'sim' => 'chip', 'colores' => ['Teal'], 'usd' => 740],
        ]]));
        file_put_contents($this->dir . '/b.json', json_encode(['proveedor' => 'Planet Cell', 'items' => [
            ['tipo' => 'celular', 'modelo' => 'iPhone 18 Pro Max', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Silver'], 'usd' => 1690],
            ['tipo' => 'celular', 'modelo' => 'iPhone 18 Pro Max', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Vino'], 'usd' => 1730],
            ['tipo' => 'celular', 'modelo' => 'iPhone 16', 'capacidad' => '128 GB', 'sim' => 'chip', 'colores' => ['Negro'], 'usd' => 730],
        ]]));
    }

    protected function tearDown(): void
    {
        array_map('unlink', glob($this->dir . '/*'));
        @rmdir($this->dir);
        parent::tearDown();
    }

    public function test_separa_el_color_caro_y_cobra_bien_cada_tarjeta(): void
    {
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);

        // 18 Pro Max 256: dos tarjetas — los colores comunes (1570) y el Vino aparte (1710, más caro)
        $this->assertSame(2, Celular::where('es_proveedor', true)->where('modelo', 'iPhone 18 Pro Max')->count());

        $comun = Celular::where('es_proveedor', true)->where('modelo', 'iPhone 18 Pro Max')->where('color', '')->first();
        $vino = Celular::where('es_proveedor', true)->where('modelo', 'iPhone 18 Pro Max')->where('color', 'Vino')->first();

        $this->assertSame(1570.0, $comun->costo_usd);                                  // Negro/Silver, Apple Land
        $this->assertSame(1710.0, $vino->costo_usd);                                   // Vino, Apple Land (más barato que 1730)
        $this->assertEqualsWithDelta((1570 + 60) * 12.0, $comun->precio_venta, 0.01);
        $this->assertEqualsWithDelta((1710 + 60) * 12.0, $vino->precio_venta, 0.01);

        // iPhone 16: colores de costo parecido (730/740) → una tarjeta, al costo MÁS ALTO (nadie pierde margen)
        $g16 = Celular::where('es_proveedor', true)->where('modelo', 'iPhone 16')->get();
        $this->assertCount(1, $g16);
        $this->assertSame(740.0, $g16->first()->costo_usd);

        // La tarjeta Vino se publica con su color en el título/atributos
        $pub = CatalogoPublicacion::where('producto_tipo', 'celular')->where('producto_id', $vino->id)->first();
        $this->assertTrue((bool) $pub->publicado);
        $this->assertStringContainsString('Vino', $pub->titulo);

        // Re-correr no duplica (reconstruye los disponibles)
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);
        $this->assertSame(2, Celular::where('es_proveedor', true)->where('modelo', 'iPhone 18 Pro Max')->count());
    }

    public function test_el_chip_fisico_y_el_esim_son_tarjetas_distintas(): void
    {
        $dir = sys_get_temp_dir() . '/provsim_' . uniqid();
        mkdir($dir);
        // El chip físico se paga más caro que el eSIM; son dos productos distintos del mismo modelo+capacidad.
        file_put_contents($dir . '/x.json', json_encode(['proveedor' => 'Apple Land', 'items' => [
            ['tipo' => 'celular', 'modelo' => 'iPhone 17', 'capacidad' => '256 GB', 'sim' => 'chip', 'colores' => ['Negro'], 'usd' => 930],
            ['tipo' => 'celular', 'modelo' => 'iPhone 17', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Negro'], 'usd' => 880],
        ]]));

        $this->artisan('catalogo:importar-proveedor', ['--dir' => $dir])->assertExitCode(0);

        // Mismo modelo y capacidad, pero chip físico y eSIM NO se mezclan: dos productos, cada uno con su precio.
        $phones = Celular::where('es_proveedor', true)->where('modelo', 'iPhone 17')->get();
        $this->assertCount(2, $phones);
        $this->assertSame(['esim', 'fisico'], $phones->pluck('sim')->sort()->values()->all());

        $esim = $phones->firstWhere('sim', 'esim');
        $fisico = $phones->firstWhere('sim', 'fisico');
        $this->assertSame(930.0, $fisico->costo_usd);
        $this->assertSame(880.0, $esim->costo_usd);

        // El tipo de SIM aparece en el título y en los atributos públicos de cada tarjeta.
        $pubEsim = CatalogoPublicacion::where('producto_tipo', 'celular')->where('producto_id', $esim->id)->first();
        $pubFisico = CatalogoPublicacion::where('producto_tipo', 'celular')->where('producto_id', $fisico->id)->first();
        $this->assertStringContainsString('eSIM', $pubEsim->titulo);
        $this->assertStringContainsString('Chip físico', $pubFisico->titulo);
        $this->assertSame('eSIM', $pubEsim->atributos['sim'] ?? null);
        $this->assertSame('Chip físico', $pubFisico->atributos['sim'] ?? null);

        array_map('unlink', glob($dir . '/*'));
        @rmdir($dir);
    }
}
