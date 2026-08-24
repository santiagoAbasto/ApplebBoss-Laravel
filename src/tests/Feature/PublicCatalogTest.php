<?php

namespace Tests\Feature;

use App\Models\Celular;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicCatalogTest extends TestCase
{
    use RefreshDatabase;

    private function celular(array $overrides = []): Celular
    {
        return Celular::create(array_merge([
            'modelo' => 'iPhone de prueba',
            'capacidad' => '128 GB',
            'color' => 'Negro',
            'imei_1' => fake()->unique()->numerify('###############'),
            'estado_imei' => 'libre',
            'procedencia' => 'Tienda',
            'precio_costo' => 4000,
            'precio_venta' => 6000,
            'estado' => 'disponible',
        ], $overrides));
    }

    public function test_home_only_exposes_available_public_product_data(): void
    {
        $this->celular([
            'modelo' => 'iPhone 15 Pro',
            'capacidad' => '256 GB',
            'color' => 'Natural',
            'imei_1' => 'SECRET-IMEI',
            'precio_costo' => 5000,
            'precio_venta' => 7500,
            'estado' => 'disponible',
        ]);
        $this->celular([
            'modelo' => 'iPhone vendido',
            'precio_venta' => 100,
            'estado' => 'vendido',
        ]);

        $response = $this->get('/');

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Store/Home')
            ->has('featured', 1)
            ->where('featured.0.name', 'iPhone 15 Pro')
            ->where('featured.0.price', 7500)
            ->missing('featured.0.imei_1')
            ->missing('featured.0.precio_costo'));
    }

    public function test_catalog_can_filter_and_search_products(): void
    {
        $this->celular([
            'modelo' => 'iPhone 14 Pro Max',
            'capacidad' => '512 GB',
            'precio_venta' => 8200,
            'estado' => 'disponible',
        ]);

        $this->get('/catalogo?q=512&categoria=celulares')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Catalog')
                ->has('products', 1)
                ->where('products.0.name', 'iPhone 14 Pro Max'));
    }

    public function test_product_detail_returns_404_for_unavailable_product(): void
    {
        $product = $this->celular([
            'modelo' => 'Equipo no disponible',
            'precio_venta' => 1,
            'estado' => 'vendido',
        ]);

        $this->get("/productos/celular/{$product->id}/equipo-no-disponible")->assertNotFound();
    }
}
