<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\CompatibilityTarget;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    private function crearCelularConPublicacion(array $celularOverrides = [], array $pubOverrides = []): CatalogoPublicacion
    {
        $celular = Celular::create(array_merge([
            'modelo'       => 'iPhone 14',
            'capacidad'    => '128GB',
            'color'        => 'Negro',
            'imei_1'       => '358051325422989',
            'estado_imei'  => 'libre',
            'procedencia'  => 'TEST',
            'precio_costo' => 5000,
            'precio_venta' => 8000,
            'estado'       => 'disponible',
        ], $celularOverrides));

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $celular->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'iPhone 14 128GB Negro',
            'slug'          => 'iphone-14-128gb-negro-test',
            'resumen'       => 'Equipo disponible.',
            'condicion'     => 'Nuevo',
            'categoria'     => 'celulares',
        ], $pubOverrides));
    }

    private function target(string $family, string $gen, string $name): CompatibilityTarget
    {
        return CompatibilityTarget::create([
            'family'     => $family,
            'generation' => $gen,
            'name'       => $name,
            'slug'       => \Illuminate\Support\Str::slug($name),
            'active'     => true,
            'sort_order' => 0,
        ]);
    }

    public function test_pdp_includes_compatibilidades_grouped_by_family(): void
    {
        $pub = $this->crearCelularConPublicacion(
            [],
            ['categoria' => 'fundas', 'storefront' => 'MYSKIN']
        );

        $t14 = $this->target('iphone', 'iPhone 14', 'iPhone 14');
        $t13 = $this->target('iphone', 'iPhone 13', 'iPhone 13');

        $pub->compatibilidades()->createMany([
            ['target_id' => $t14->id],
            ['target_id' => $t13->id],
        ]);

        $response = $this->withHeader('X-Inertia', 'true')->get("/productos/{$pub->slug}");
        $response->assertStatus(200);

        $product = $response->json('props.product');
        $this->assertArrayHasKey('compatibilidades', $product);

        $compat = $product['compatibilidades'];
        $this->assertArrayHasKey('iphone', $compat);

        $names = array_column($compat['iphone'], 'name');
        $this->assertContains('iPhone 14', $names);
        $this->assertContains('iPhone 13', $names);
    }

    public function test_pdp_compatibility_is_empty_when_none_defined(): void
    {
        $pub = $this->crearCelularConPublicacion();

        $response = $this->withHeader('X-Inertia', 'true')->get("/productos/{$pub->slug}");
        $response->assertStatus(200);

        $product = $response->json('props.product');
        $this->assertEmpty($product['compatibilidades'] ?? []);
    }

    public function test_compatibility_does_not_appear_in_catalog_listing(): void
    {
        $pub = $this->crearCelularConPublicacion(
            [],
            ['categoria' => 'fundas', 'storefront' => 'MYSKIN']
        );
        $t = $this->target('iphone', 'iPhone 14', 'iPhone 14 v2');
        $pub->compatibilidades()->create(['target_id' => $t->id]);

        $response = $this->withHeader('X-Inertia', 'true')->get('/catalogo');
        $response->assertStatus(200);

        $products = $response->json('props.products') ?? [];
        if (!empty($products)) {
            $this->assertArrayNotHasKey('compatibilidades', $products[0], 'compatibilidades must not be in catalog list');
        } else {
            $this->markTestSkipped('No products in catalog to check.');
        }
    }
}
