<?php

namespace Tests\Feature;

use App\Models\Celular;
use App\Models\ProductoApple;
use App\Support\Proveedor\MargenProveedor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ProductoProveedorTest extends TestCase
{
    use RefreshDatabase;

    private const TASA = 12.0; // Bs por USDT (dólar paralelo) fijo para la prueba

    protected function setUp(): void
    {
        parent::setUp();
        // Fijar el paralelo sin salir a internet: TipoDeCambio lee el último valor del cache si es reciente.
        Cache::put('tc.blue.momento', now()->toISOString());
        Cache::put('tc.blue.ultimo', self::TASA);
    }

    public function test_el_precio_de_un_celular_de_proveedor_sale_del_costo_en_usd_mas_su_margen(): void
    {
        // iPhone de proveedor: no es nuestro capital, no tiene IMEI todavía. Costo 1250 USD, margen celular 60 USD.
        $c = Celular::create([
            'modelo'       => 'iPhone 17 Pro Max',
            'marca'        => 'iphone',
            'capacidad'    => '256 GB',
            'color'        => 'Naranja',
            'estado_imei'  => 'libre',
            'procedencia'  => 'EEUU',
            'es_proveedor' => true,
            'proveedor'    => 'Planet Cell',
            'costo_usd'    => 1250,
            'estado'       => 'disponible',
            'condicion'    => 'Nuevo',
        ]);

        $this->assertSame(60.0, $c->margenVigenteUsd());
        $this->assertEqualsWithDelta((1250 + 60) * self::TASA, $c->precio_venta, 0.01); // 15720 Bs
        $this->assertEqualsWithDelta(1250 * self::TASA, $c->precio_costo, 0.01);        // 15000 Bs (lo que se le paga al proveedor)
        $this->assertNull($c->imei_1);
    }

    public function test_un_margen_propio_pisa_al_de_la_categoria(): void
    {
        $c = Celular::create([
            'modelo' => 'iPhone 16', 'marca' => 'iphone', 'capacidad' => '128 GB', 'color' => 'Negro',
            'estado_imei' => 'libre', 'procedencia' => 'EEUU', 'es_proveedor' => true, 'proveedor' => 'Apple Land',
            'costo_usd' => 730, 'margen_usd' => 90, 'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);

        $this->assertSame(90.0, $c->margenVigenteUsd());
        $this->assertEqualsWithDelta((730 + 90) * self::TASA, $c->precio_venta, 0.01);
    }

    public function test_el_apple_watch_de_proveedor_gana_30_y_el_ipad_40(): void
    {
        $watch = ProductoApple::create([
            'modelo' => 'Apple Watch Series 11 46mm', 'capacidad' => '', 'bateria' => '', 'color' => 'Black',
            'procedencia' => 'EEUU', 'es_proveedor' => true, 'proveedor' => 'Apple Land', 'costo_usd' => 400,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);
        $ipad = ProductoApple::create([
            'modelo' => 'iPad Air M4 11 256GB', 'capacidad' => '256 GB', 'bateria' => '', 'color' => 'Azul',
            'procedencia' => 'EEUU', 'es_proveedor' => true, 'proveedor' => 'Apple Land', 'costo_usd' => 890,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);

        $this->assertSame(30.0, $watch->margenVigenteUsd());
        $this->assertSame(40.0, $ipad->margenVigenteUsd());
        $this->assertEqualsWithDelta((400 + 30) * self::TASA, $watch->precio_venta, 0.01);
    }

    public function test_un_producto_propio_no_cambia(): void
    {
        $c = Celular::create([
            'modelo' => 'iPhone 15 Pro Max', 'marca' => 'iphone', 'capacidad' => '256 GB', 'color' => 'Natural',
            'imei_1' => '356789012345678', 'estado_imei' => 'libre', 'procedencia' => 'EEUU',
            'precio_costo' => 6000, 'precio_venta' => 7500, 'estado' => 'disponible', 'condicion' => 'Seminuevo',
        ]);

        $c->refresh(); // releer de la BD para que aplique el default es_proveedor=false
        $this->assertFalse($c->es_proveedor);
        $this->assertSame(7500.0, $c->precio_venta);
        $this->assertSame(6000.0, $c->precio_costo);
    }

    public function test_el_catalogo_de_margenes_es_el_pedido(): void
    {
        $this->assertSame(60.0, MargenProveedor::enUsd('celular'));
        $this->assertSame(70.0, MargenProveedor::enUsd('computadora'));
        $this->assertSame(40.0, MargenProveedor::enUsd('producto_apple', 'iPad Pro M5'));
        $this->assertSame(30.0, MargenProveedor::enUsd('producto_apple', 'Apple Watch Ultra'));
        $this->assertSame(30.0, MargenProveedor::enUsd('producto_apple', 'AirPods Pro'));
        $this->assertSame(40.0, MargenProveedor::enUsd('producto_apple', 'AirPods Max'));
    }
}
