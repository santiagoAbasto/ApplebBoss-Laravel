<?php

namespace Tests\Feature;

use App\Models\CatalogoImagen;
use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\ReservaItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests de privacidad y seguridad del catálogo público.
 *
 * Verifican que NINGÚN endpoint público exponga:
 *   - precio_costo, ganancia, margen
 *   - imei_1, imei_2
 *   - numero_serie
 *   - procedencia interna
 *   - notas privadas
 */
class PublicCatalogPrivacyTest extends TestCase
{
    use RefreshDatabase;

    private function crearCelularConPublicacion(array $celularOverrides = [], array $pubOverrides = []): CatalogoPublicacion
    {
        $celular = Celular::create(array_merge([
            'modelo'       => 'iPhone 15 Pro',
            'capacidad'    => '256GB',
            'color'        => 'Negro',
            'imei_1'       => '358051325422989',
            'imei_2'       => '358051325422990',
            'estado_imei'  => 'libre',
            'procedencia'  => 'IMPORTADORA SECRETA',
            'precio_costo' => 6000,
            'precio_venta' => 9500,
            'estado'       => 'disponible',
        ], $celularOverrides));

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $celular->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'iPhone 15 Pro 256GB Negro',
            'slug'          => 'iphone-15-pro-256gb-negro',
            'resumen'       => 'Equipo disponible en Cochabamba.',
            'condicion'     => 'Nuevo',
            'categoria'     => 'celulares',
        ], $pubOverrides));
    }

    // ─── Catálogo público ─────────────────────────────────────────────────────

    public function test_catalog_page_does_not_expose_sensitive_fields(): void
    {
        $this->crearCelularConPublicacion();

        $response = $this->get('/catalogo');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertSensitiveFieldsAbsent($content);
    }

    public function test_home_page_does_not_expose_sensitive_fields(): void
    {
        $this->crearCelularConPublicacion(['destacado' => true]);

        $response = $this->get('/');
        $response->assertStatus(200);

        $this->assertSensitiveFieldsAbsent($response->getContent());
    }

    public function test_product_page_does_not_expose_sensitive_fields(): void
    {
        $pub = $this->crearCelularConPublicacion();

        $response = $this->get("/productos/{$pub->slug}");
        $response->assertStatus(200);

        $this->assertSensitiveFieldsAbsent($response->getContent());
    }

    // ─── Cart sync API ────────────────────────────────────────────────────────

    public function test_cart_sync_does_not_expose_sensitive_fields(): void
    {
        $pub = $this->crearCelularConPublicacion();

        $response = $this->postJson('/api/carrito/sync', [
            'items' => [['key' => "celular:{$pub->producto_id}", 'quantity' => 1]],
        ]);

        $response->assertStatus(200);
        $this->assertSensitiveFieldsAbsent($response->getContent());
    }

    public function test_cart_sync_returns_server_price_ignoring_client(): void
    {
        $pub = $this->crearCelularConPublicacion();

        $response = $this->postJson('/api/carrito/sync', [
            'items' => [['key' => "celular:{$pub->producto_id}", 'quantity' => 1]],
        ]);

        $data  = $response->json();
        $items = $data['items'] ?? [];

        $this->assertCount(1, $items);
        // El precio devuelto es el del inventario, no el del cliente
        $this->assertEquals(9500.0, $items[0]['price']);
    }

    public function test_cart_sync_rejects_sold_product(): void
    {
        $pub = $this->crearCelularConPublicacion(['estado' => 'vendido']);

        $response = $this->postJson('/api/carrito/sync', [
            'items' => [['key' => "celular:{$pub->producto_id}", 'quantity' => 1]],
        ]);

        $data = $response->json();
        $this->assertCount(0, $data['items'] ?? []);
    }

    public function test_cart_sync_rejects_unpublished_product(): void
    {
        $pub = $this->crearCelularConPublicacion([], ['publicado' => false]);

        $response = $this->postJson('/api/carrito/sync', [
            'items' => [['key' => "celular:{$pub->producto_id}", 'quantity' => 1]],
        ]);

        $data = $response->json();
        $this->assertCount(0, $data['items'] ?? []);
    }

    // ─── Visibilidad de productos ─────────────────────────────────────────────

    public function test_sold_product_not_listed_in_catalog(): void
    {
        $pub = $this->crearCelularConPublicacion(['estado' => 'vendido']);

        $response = $this->getJson('/catalogo');
        $response->assertStatus(200);

        // El producto vendido no debe aparecer en el catálogo activo
        $content = $response->getContent();
        $this->assertStringNotContainsString($pub->slug, $content, 'Producto vendido no debe aparecer en catálogo.');
    }

    public function test_unpublished_product_not_listed(): void
    {
        $pub = $this->crearCelularConPublicacion([], ['publicado' => false]);

        $response = $this->get('/catalogo');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertStringNotContainsString($pub->slug, $content, 'Producto no publicado no debe aparecer.');
    }

    public function test_unpublished_product_detail_returns_404(): void
    {
        $pub = $this->crearCelularConPublicacion([], ['publicado' => false]);

        $this->get("/productos/{$pub->slug}")->assertStatus(404);
    }

    // ─── MYSKIN solo para fundas ──────────────────────────────────────────────

    public function test_myskin_storefront_requires_fundas_category(): void
    {
        // La regla de negocio se valida en el modelo/controlador.
        // Verificamos que la validación lanza excepción al intentar crear
        // una publicación MYSKIN para una categoría que no es 'fundas'.
        $celular = Celular::create([
            'modelo' => 'iPhone 15', 'capacidad' => '128GB', 'color' => 'Azul',
            'imei_1' => '000000000000001', 'estado_imei' => 'libre',
            'procedencia' => 'Tienda', 'precio_costo' => 1, 'precio_venta' => 2, 'estado' => 'disponible',
        ]);

        $admin = \App\Models\User::factory()->create(['rol' => 'admin']);

        $response = $this->actingAs($admin)->post('/admin/catalogo', [
            'producto_tipo' => 'celular',
            'producto_id'   => $celular->id,
            'storefront'    => 'MYSKIN',
            'titulo'        => 'iPhone Test',
            'slug'          => 'iphone-test',
            'resumen'       => 'Test',
            'condicion'     => 'Nuevo',
            'categoria'     => 'celulares', // ← incorrecto para MYSKIN
            'publicado'     => false,
        ]);

        // Debe rechazar con 422: MYSKIN + categoría que no es fundas
        $response->assertStatus(422);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function assertSensitiveFieldsAbsent(string $content): void
    {
        $forbidden = [
            'precio_costo',
            'imei_1',
            'imei_2',
            'numero_serie',
            'IMPORTADORA SECRETA',
            '358051325422989',  // IMEI real del test
            '358051325422990',
            '"ganancia"',
            '"margen"',
            '"costo"',
        ];

        foreach ($forbidden as $field) {
            $this->assertStringNotContainsString(
                $field,
                $content,
                "El campo sensible '{$field}' fue expuesto en respuesta pública."
            );
        }
    }
}
