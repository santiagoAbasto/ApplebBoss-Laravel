<?php

namespace Tests\Feature;

use App\Models\Celular;
use App\Models\ProductoGeneral;
use App\Support\InventarioCatalogo;
use App\Support\ModelosCompatibles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** API pública: filtros por categoría, modelo compatible, precio, marca y orden. */
class ApiFiltrosTest extends TestCase
{
    use RefreshDatabase;

    private function funda(string $nombre, float $precio = 70, string $storefront = 'APPLE_BOSS')
    {
        $u = ProductoGeneral::create([
            'codigo' => fake()->unique()->bothify('FU-#####'), 'tipo' => 'funda', 'nombre' => $nombre,
            'procedencia' => 'Proveedor secreto', 'precio_costo' => 20, 'precio_venta' => $precio, 'estado' => 'disponible',
        ]);
        return InventarioCatalogo::crear('producto_general', $u, 'Nuevo', true, $storefront);
    }

    private function celular(string $modelo, float $precio, string $estado = 'disponible')
    {
        $c = Celular::create([
            'modelo' => $modelo, 'capacidad' => '128 GB', 'color' => 'NEGRO', 'bateria' => '90',
            'imei_1' => fake()->unique()->numerify('###############'), 'estado_imei' => 'libre',
            'procedencia' => 'Proveedor secreto', 'precio_costo' => 1000, 'precio_venta' => $precio, 'estado' => 'disponible',
        ]);
        $pub = InventarioCatalogo::crear('celular', $c, 'Seminuevo', true);
        if ($estado !== 'disponible') $c->update(['estado' => $estado]);
        return $pub;
    }

    public function test_models_are_detected_from_inventory_names(): void
    {
        $slugs = fn ($n) => array_keys(ModelosCompatibles::detectar($n));

        $this->assertSame(['iphone-14-pro-max'], $slugs('Funda de Diseño IP 14 PRO MAX'));
        $this->assertSame(['iphone-12', 'iphone-12-pro'], $slugs('FUNDA SILICONA IP 12/12 PRO'));
        $this->assertSame(['iphone-12', 'iphone-12-pro'], $slugs('Funda de Diseño IP 12/12PRO'));
        $this->assertSame(['iphone-7-plus', 'iphone-8-plus'], $slugs('FUNDA DE SILICONA IP 7/8 PLUS'));
        $this->assertSame(['iphone-13', 'iphone-14'], $slugs('Funda de Diseño IP 13/14'));
        $this->assertSame(['iphone-xs-max'], $slugs('FUNDA DE SILICONA IP XS MAX'));
        $this->assertSame(['iphone-x', 'iphone-xs'], $slugs('FUNDA SILICONA IP X/XS'));
        $this->assertSame(['iphone-17-air'], $slugs('FUNDA SILICONA IP 17 AIR'));
        $this->assertSame(['iphone-14-pro'], $slugs('FUNDA MAGSAFE IP 14 PRO AYE'));
        $this->assertSame(['iphone-14-pro-max'], $slugs('FUNDA DE SILICONA IPHONE 14 PRO MAX'));
        $this->assertSame(['airpods-pro-2a-gen'], $slugs('FUNDA PARA AIRPODS PRO 2DA GEN'));
        $this->assertSame([], $slugs('FUNDA DE IPAD'));
    }

    public function test_all_cases_for_a_model_regardless_of_style(): void
    {
        $this->funda('Funda de Diseño IP 14 PRO MAX');
        $this->funda('FUNDA DE SILICONA IP 14 PRO MAX', 60);
        $this->funda('FUNDA MAGSAFE IP 14 PRO MAX', 100);
        $this->funda('FUNDA MYSKIN IP 14 PRO MAX', 150, 'MYSKIN');
        $this->funda('FUNDA SILICONA IP 13 PRO', 60);
        $this->funda('Funda de Diseño IP 13/14');

        foreach (['iphone-14-pro-max', 'iPhone 14 Pro Max', '14 pro max'] as $modelo) {
            $this->getJson('/api/v1/products?categoria=fundas&modelo=' . urlencode($modelo))
                ->assertOk()
                ->assertJsonPath('meta.total', 4);
        }

        $this->getJson('/api/v1/products?modelo=iphone-14')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/products?modelo=iphone-13')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/products?categoria=fundas&modelo=iphone-14-pro-max&marca=myskin')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.marca', 'MYSKIN');
        $this->getJson('/api/v1/products?categoria=fundas&modelo=iphone-14-pro-max&q=silicona')
            ->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/products?modelo=iphone-99')->assertJsonPath('meta.total', 0);
    }

    public function test_price_order_and_filters_use_inventory_price(): void
    {
        $this->celular('IPHONE 13', 3500);
        $this->celular('IPHONE 15 PRO', 7000);
        $this->celular('IPHONE 11', 2200);

        $this->getJson('/api/v1/products?categoria=iphone&orden=precio-menor')
            ->assertJsonPath('data.0.precio', 2200)
            ->assertJsonPath('data.2.precio', 7000);
        $this->getJson('/api/v1/products?orden=precio-mayor')->assertJsonPath('data.0.precio', 7000);
        $this->getJson('/api/v1/products?precio_min=3000&precio_max=5000')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.precio', 3500);
    }

    public function test_sold_products_are_hidden_unless_requested(): void
    {
        $this->celular('IPHONE 13', 3500);
        $this->celular('IPHONE 12', 2800, 'vendido');

        $this->getJson('/api/v1/products')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/products?disponible=todos')->assertJsonPath('meta.total', 2);
    }

    public function test_pagination_and_public_fields_only(): void
    {
        foreach (range(1, 5) as $i) $this->funda("FUNDA SILICONA IP 1{$i}", 60 + $i);

        $res = $this->getJson('/api/v1/products?per_page=2&page=3')
            ->assertOk()
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonCount(1, 'data');

        $json = $res->getContent();
        foreach (['precio_costo', 'procedencia', 'Proveedor secreto', 'imei'] as $prohibido) {
            $this->assertStringNotContainsString($prohibido, $json);
        }
    }

    public function test_filters_endpoint_lists_models_with_counts(): void
    {
        $this->funda('Funda de Diseño IP 14 PRO MAX');
        $this->funda('FUNDA DE SILICONA IP 14 PRO MAX', 60);
        $this->celular('IPHONE 13', 3500);

        $data = $this->getJson('/api/v1/filters')->assertOk()->json('data');

        $modelo = collect($data['modelos'])->firstWhere('slug', 'iphone-14-pro-max');
        $this->assertSame(2, $modelo['total']);
        $this->assertSame('iPhone 14 Pro Max', $modelo['nombre']);
        $this->assertSame(2, collect($data['categorias'])->firstWhere('slug', 'fundas')['total']);
        $this->assertSame(1, collect($data['categorias'])->firstWhere('slug', 'iphone')['total']);
        $this->assertEquals(60, $data['precio']['min']);
        $this->assertStringNotContainsString('precio_costo', json_encode($data));
    }
}
