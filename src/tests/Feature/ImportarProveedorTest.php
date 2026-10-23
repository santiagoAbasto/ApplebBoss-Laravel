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
            ['tipo' => 'celular', 'modelo' => 'iPhone 18 Pro Max', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Vino', 'Negro'], 'usd' => 1570],
            ['tipo' => 'celular', 'modelo' => 'iPhone 16', 'capacidad' => '128 GB', 'sim' => 'chip', 'colores' => ['Teal'], 'usd' => 740],
        ]]));
        file_put_contents($this->dir . '/b.json', json_encode(['proveedor' => 'Planet Cell', 'items' => [
            ['tipo' => 'celular', 'modelo' => 'iPhone 18 Pro Max', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Silver'], 'usd' => 1690],
            ['tipo' => 'celular', 'modelo' => 'iPhone 16', 'capacidad' => '128 GB', 'sim' => 'chip', 'colores' => ['Negro', 'Blanco'], 'usd' => 730],
        ]]));
    }

    protected function tearDown(): void
    {
        array_map('unlink', glob($this->dir . '/*'));
        @rmdir($this->dir);
        parent::tearDown();
    }

    public function test_carga_el_mas_barato_junta_colores_y_publica(): void
    {
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);

        // 18 Pro Max: Apple Land (1570) es más barato que Planet Cell (1690)
        $pm = Celular::where('es_proveedor', true)->where('modelo', 'iPhone 18 Pro Max')->where('capacidad', '256 GB')->first();
        $this->assertNotNull($pm);
        $this->assertSame(1570.0, $pm->costo_usd);
        $this->assertSame('Apple Land', $pm->proveedor);
        $this->assertSame('iphone', $pm->marca);
        $this->assertEqualsWithDelta((1570 + 60) * 12.0, $pm->precio_venta, 0.01);

        // iPhone 16: Planet Cell (730) es más barato que Apple Land (740)
        $g16 = Celular::where('es_proveedor', true)->where('modelo', 'iPhone 16')->first();
        $this->assertSame(730.0, $g16->costo_usd);
        $this->assertSame('Planet Cell', $g16->proveedor);

        // Publicados, con los colores de ambas listas juntos
        $pub = CatalogoPublicacion::where('producto_tipo', 'celular')->where('producto_id', $pm->id)->first();
        $this->assertNotNull($pub);
        $this->assertTrue((bool) $pub->publicado);
        $this->assertStringContainsString('Vino', $pub->atributos['color'] ?? '');
        $this->assertStringContainsString('Silver', $pub->atributos['color'] ?? '');

        // Idempotente: re-correr no duplica
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);
        $this->assertSame(1, Celular::where('es_proveedor', true)->where('modelo', 'iPhone 18 Pro Max')->count());
    }
}
