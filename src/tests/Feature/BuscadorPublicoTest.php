<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * El buscador de la tienda (/api/buscar): solo lo que se puede comprar, con el precio que se cobra.
 */
class BuscadorPublicoTest extends TestCase
{
    use RefreshDatabase;

    private int $imei = 358051325422000;

    private function publicar(array $celular = [], array $publicacion = []): CatalogoPublicacion
    {
        $equipo = Celular::create(array_merge([
            'modelo'       => 'iPhone 15 Pro',
            'capacidad'    => '256GB',
            'color'        => 'Negro',
            'imei_1'       => (string) $this->imei++,
            'imei_2'       => (string) $this->imei++,
            'estado_imei'  => 'libre',
            'procedencia'  => 'Proveedor de prueba',
            'precio_costo' => 6000,
            'precio_venta' => 9500,
            'estado'       => 'disponible',
        ], $celular));

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $equipo->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'iPhone 15 Pro 256GB Negro',
            'slug'          => 'iphone-15-pro-'.$equipo->id,
            'resumen'       => 'Equipo disponible en Cochabamba.',
            'condicion'     => 'Nuevo',
            'categoria'     => 'celulares',
        ], $publicacion));
    }

    public function test_con_una_sola_letra_no_busca(): void
    {
        $this->publicar();

        $this->getJson('/api/buscar?q=i')->assertOk()->assertExactJson(['results' => []]);
    }

    public function test_no_muestra_productos_vendidos(): void
    {
        $this->publicar();
        $this->publicar(['estado' => 'vendido'], ['titulo' => 'iPhone 15 Pro vendido']);

        $nombres = collect($this->getJson('/api/buscar?q=iphone')->assertOk()->json('results'))->pluck('name');

        $this->assertEquals(['iPhone 15 Pro 256GB Negro'], $nombres->all());
    }

    public function test_muestra_el_precio_promocional_vigente_con_el_anterior(): void
    {
        $this->publicar([], ['precio_promocional' => 8900, 'promocion_desde' => now()->subDay(), 'promocion_hasta' => now()->addDay()]);

        $resultado = $this->getJson('/api/buscar?q=iphone')->assertOk()->json('results.0');

        $this->assertEquals(8900, $resultado['price']);
        $this->assertEquals(9500, $resultado['price_before']);
    }

    public function test_encuentra_sin_importar_las_tildes(): void
    {
        $this->publicar([], ['titulo' => 'Cámara para iPhone', 'categoria' => 'accesorios', 'subcategoria' => 'Cámaras']);

        $this->assertCount(1, $this->getJson('/api/buscar?q=camara')->assertOk()->json('results'));
    }

    public function test_filtra_por_categoria_y_por_seminuevos(): void
    {
        $this->publicar();
        $this->publicar([], ['titulo' => 'iPhone 13 seminuevo', 'condicion' => 'Seminuevo']);
        $this->publicar([], ['titulo' => 'Funda para iPhone', 'categoria' => 'accesorios', 'subcategoria' => 'Fundas']);

        $this->assertCount(1, $this->getJson('/api/buscar?q=iphone&categoria=accesorios')->json('results'));
        $this->assertCount(1, $this->getJson('/api/buscar?q=iphone&categoria=seminuevos')->json('results'));
        $this->assertCount(3, $this->getJson('/api/buscar?q=iphone&categoria=inventada')->json('results'));
    }

    public function test_sin_texto_devuelve_los_destacados(): void
    {
        $this->publicar([], ['titulo' => 'Uno común']);
        $this->publicar([], ['titulo' => 'El destacado', 'destacado' => true]);

        $resultados = $this->getJson('/api/buscar?destacados=1')->assertOk()->json('results');

        $this->assertCount(2, $resultados);
        $this->assertEquals('El destacado', $resultados[0]['name']);
    }

    public function test_el_resultado_no_lleva_datos_internos(): void
    {
        $this->publicar();

        $cuerpo = $this->getJson('/api/buscar?q=iphone')->assertOk()->getContent();

        foreach (['precio_costo', 'imei', 'procedencia', '6000', '358051325422'] as $dato) {
            $this->assertStringNotContainsString($dato, $cuerpo);
        }
    }
}
