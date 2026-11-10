<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\ProductoApple;
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
        @unlink($this->dir . '/.fotos-proveedor');
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

    public function test_las_fotos_del_dueno_no_se_pierden_al_re_importar(): void
    {
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);

        // El dueño sube una foto a una tarjeta de proveedor
        $pub = CatalogoPublicacion::where('producto_tipo', 'celular')->where('titulo', 'like', 'iPhone 16%')->firstOrFail();
        $pub->imagenes()->create([
            'nombre_original' => 'foto.jpg',
            'ruta_original'   => 'catalogo/foto-16.jpg',
            'orden'           => 0,
            'es_principal'    => true,
            'metadata'        => ['width' => 1000, 'mime' => 'image/png'],
        ]);

        // Re-importar borra y recrea los productos, pero la foto se re-engancha a la tarjeta equivalente
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);

        $pub2 = CatalogoPublicacion::where('producto_tipo', 'celular')->where('titulo', 'like', 'iPhone 16%')->firstOrFail();
        $this->assertSame('catalogo/foto-16.jpg', $pub2->imagenes()->first()?->ruta_original);
        // Los metadatos siguen siendo un arreglo tras dos importaciones (antes se codificaban de nuevo cada vez)
        $this->assertSame(['width' => 1000, 'mime' => 'image/png'], $pub2->imagenes()->first()?->metadata);
    }

    public function test_el_vino_va_siempre_en_su_tarjeta_aunque_cueste_casi_lo_mismo(): void
    {
        file_put_contents($this->dir . '/a.json', json_encode(['proveedor' => 'Apple Land', 'items' => [
            ['tipo' => 'celular', 'modelo' => 'iPhone 18 Pro Max', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Negro', 'Silver', 'Azul'], 'usd' => 1530],
            ['tipo' => 'celular', 'modelo' => 'iPhone 18 Pro Max', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Vino'], 'usd' => 1560],
        ]]));
        unlink($this->dir . '/b.json');

        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);

        // Solo 30 USD más caro, pero el Borgoña tiene su tarjeta (su foto y su precio); los otros tres, al suyo
        $this->assertSame(1560.0, Celular::where('es_proveedor', true)->where('color', 'Vino')->sole()->costo_usd);
        $this->assertSame(1530.0, Celular::where('es_proveedor', true)->where('color', '')->sole()->costo_usd);
    }

    public function test_una_tarjeta_que_sale_de_la_lista_y_vuelve_recupera_su_foto(): void
    {
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);
        $vino = Celular::where('es_proveedor', true)->where('color', 'Vino')->firstOrFail();
        CatalogoPublicacion::where('producto_tipo', 'celular')->where('producto_id', $vino->id)->firstOrFail()
            ->imagenes()->create(['nombre_original' => 'v.png', 'ruta_original' => 'catalogo/vino.png', 'orden' => 0, 'es_principal' => true]);

        // Una semana sin Vino en las listas: la tarjeta se va…
        $sinVino = fn (string $f) => json_encode(array_merge($l = json_decode(file_get_contents($f), true), [
            'items' => array_values(array_filter($l['items'], fn ($i) => $i['colores'] !== ['Vino'])),
        ]));
        $a = file_get_contents($this->dir . '/a.json');
        $b = file_get_contents($this->dir . '/b.json');
        file_put_contents($this->dir . '/a.json', $sinVino($this->dir . '/a.json'));
        file_put_contents($this->dir . '/b.json', $sinVino($this->dir . '/b.json'));
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);
        $this->assertSame(0, Celular::where('es_proveedor', true)->where('color', 'Vino')->count());

        // …y cuando vuelve, vuelve con su foto
        file_put_contents($this->dir . '/a.json', $a);
        file_put_contents($this->dir . '/b.json', $b);
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);
        $pub = CatalogoPublicacion::where('producto_tipo', 'celular')->where('titulo', 'like', '%Vino%')->firstOrFail();
        $this->assertSame('catalogo/vino.png', $pub->imagenes()->first()?->ruta_original);
    }

    public function test_una_foto_que_el_dueno_quito_no_vuelve(): void
    {
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);
        $pub = CatalogoPublicacion::where('producto_tipo', 'celular')->where('titulo', 'like', 'iPhone 16%')->firstOrFail();
        $pub->imagenes()->create(['nombre_original' => 'f.jpg', 'ruta_original' => 'catalogo/foto-16.jpg', 'orden' => 0, 'es_principal' => true]);
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);   // queda guardada

        CatalogoPublicacion::where('producto_tipo', 'celular')->where('titulo', 'like', 'iPhone 16%')->firstOrFail()->imagenes()->delete();
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);

        $this->assertFalse(CatalogoPublicacion::where('producto_tipo', 'celular')->where('titulo', 'like', 'iPhone 16%')->firstOrFail()->imagenes()->exists());
    }

    public function test_la_foto_sigue_al_equipo_aunque_la_tarjeta_cambie_de_titulo(): void
    {
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);

        // La tarjeta común del 18 Pro Max (Negro/Silver, sin color en el título) tiene foto
        $comun = Celular::where('es_proveedor', true)->where('modelo', 'iPhone 18 Pro Max')->where('color', '')->firstOrFail();
        CatalogoPublicacion::where('producto_tipo', 'celular')->where('producto_id', $comun->id)->firstOrFail()
            ->imagenes()->create(['nombre_original' => 'f.jpg', 'ruta_original' => 'catalogo/18pm.jpg', 'orden' => 0, 'es_principal' => true]);

        // La lista nueva trae solo el Negro: la tarjeta pasa a llamarse «… Negro» y la foto la sigue
        file_put_contents($this->dir . '/a.json', json_encode(['proveedor' => 'Apple Land', 'items' => [
            ['tipo' => 'celular', 'modelo' => 'iPhone 18 Pro Max', 'capacidad' => '256 GB', 'sim' => 'eSIM', 'colores' => ['Negro'], 'usd' => 1500],
        ]]));
        unlink($this->dir . '/b.json');
        $this->artisan('catalogo:importar-proveedor', ['--dir' => $this->dir])->assertExitCode(0);

        $pub = CatalogoPublicacion::where('producto_tipo', 'celular')->where('titulo', 'like', 'iPhone 18 Pro Max%Negro%')->firstOrFail();
        $this->assertSame('catalogo/18pm.jpg', $pub->imagenes()->first()?->ruta_original);
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

    public function test_un_equipo_cpo_se_publica_como_reacondicionado_no_como_nuevo(): void
    {
        $dir = sys_get_temp_dir() . '/provcpo_' . uniqid();
        mkdir($dir);
        // CPO (Certified Pre-Owned) = reacondicionado certificado, NO nuevo. La condición de la lista manda.
        file_put_contents($dir . '/x.json', json_encode(['proveedor' => 'Planet Cell', 'items' => [
            ['tipo' => 'producto_apple', 'modelo' => 'Apple Watch Ultra', 'capacidad' => '49 mm', 'colores' => [], 'condicion' => 'Reacondicionado', 'usd' => 490],
        ]]));

        $this->artisan('catalogo:importar-proveedor', ['--dir' => $dir])->assertExitCode(0);

        $reg = ProductoApple::where('es_proveedor', true)->where('modelo', 'Apple Watch Ultra')->firstOrFail();
        $this->assertSame('Reacondicionado', $reg->condicion);

        $pub = CatalogoPublicacion::where('producto_tipo', 'producto_apple')->where('producto_id', $reg->id)->firstOrFail();
        $this->assertSame('Reacondicionado', $pub->condicion, 'la publicación muestra la condición real, no «Nuevo»');

        array_map('unlink', glob($dir . '/*'));
        @rmdir($dir);
    }
}
