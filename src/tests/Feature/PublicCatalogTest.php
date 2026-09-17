<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicCatalogTest extends TestCase
{
    use RefreshDatabase;

    private function celularConPublicacion(array $celularOverrides = [], array $pubOverrides = []): CatalogoPublicacion
    {
        static $slugCount = 0;
        $slugCount++;

        $celular = Celular::create(array_merge([
            'modelo'       => 'iPhone de prueba',
            'capacidad'    => '128 GB',
            'color'        => 'Negro',
            'imei_1'       => fake()->unique()->numerify('###############'),
            'estado_imei'  => 'libre',
            'procedencia'  => 'Tienda',
            'precio_costo' => 4000,
            'precio_venta' => 6000,
            'estado'       => 'disponible',
        ], $celularOverrides));

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $celular->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => $celular->modelo . ' ' . $celular->capacidad,
            'slug'          => 'test-producto-' . $slugCount,
            'resumen'       => 'Equipo disponible.',
            'condicion'     => 'Nuevo',
            'categoria'     => 'celulares',
        ], $pubOverrides));
    }

    public function test_home_only_exposes_available_public_product_data(): void
    {
        $this->celularConPublicacion(
            ['modelo' => 'iPhone 15 Pro', 'capacidad' => '256 GB', 'color' => 'Natural', 'precio_costo' => 5000, 'precio_venta' => 7500],
            ['titulo' => 'iPhone 15 Pro']
        );
        $this->celularConPublicacion(
            ['modelo' => 'iPhone vendido', 'estado' => 'vendido'],
            ['titulo' => 'iPhone vendido', 'publicado' => true]
        );

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
        $this->celularConPublicacion(
            ['modelo' => 'iPhone 14 Pro Max', 'capacidad' => '512 GB', 'precio_venta' => 8200],
            ['titulo' => 'iPhone 14 Pro Max 512 GB']
        );

        $this->get('/catalogo?q=512&categoria=celulares')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Catalog')
                ->has('products', 1)
                ->where('products.0.name', 'iPhone 14 Pro Max 512 GB'));
    }

    public function test_product_detail_returns_404_for_slug_not_found(): void
    {
        $this->get('/productos/slug-que-no-existe')->assertNotFound();
    }
}
