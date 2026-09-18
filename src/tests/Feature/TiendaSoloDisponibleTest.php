<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\ProductoGeneral;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * La tienda solo muestra lo que está en stock: lo vendido se despublica solo y no se puede volver a publicar.
 */
class TiendaSoloDisponibleTest extends TestCase
{
    use RefreshDatabase;

    private static int $secuencia = 0;

    private function celular(string $estado = 'disponible'): Celular
    {
        return Celular::create([
            'modelo' => 'iPhone 15', 'capacidad' => '128 GB', 'color' => 'Azul',
            'imei_1' => fake()->unique()->numerify('###############'),
            'estado_imei' => 'libre', 'procedencia' => 'EEUU', 'precio_costo' => 5000, 'precio_venta' => 6500,
            'estado' => $estado, 'condicion' => 'Nuevo',
        ]);
    }

    private function publicar(string $tipo, int $id, bool $publicado = true): CatalogoPublicacion
    {
        return CatalogoPublicacion::create([
            'producto_tipo' => $tipo,
            'producto_id'   => $id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => $publicado,
            'titulo'        => 'Producto de prueba',
            'slug'          => fake()->unique()->slug(3),
            'resumen'       => 'Disponible.',
            'condicion'     => 'Nuevo',
            'categoria'     => $tipo === 'producto_general' ? 'accesorios' : 'celulares',
        ]);
    }

    private function accesorio(string $estado = 'disponible'): ProductoGeneral
    {
        return ProductoGeneral::create([
            'codigo' => 'ACC-' . str_pad((string) (++self::$secuencia), 4, '0', STR_PAD_LEFT),
            'nombre' => 'Funda de silicona iPhone 15', 'tipo' => 'funda', 'precio_costo' => 50, 'precio_venta' => 120,
            'estado' => $estado, 'procedencia' => 'Proveedor',
        ]);
    }

    public function test_vender_un_equipo_lo_despublica(): void
    {
        $celular = $this->celular();
        $pub = $this->publicar('celular', $celular->id);

        $celular->update(['estado' => 'vendido']);

        $this->assertFalse($pub->fresh()->publicado);
    }

    public function test_otros_cambios_no_despublican(): void
    {
        $celular = $this->celular();
        $pub = $this->publicar('celular', $celular->id);

        $celular->update(['precio_venta' => 6400]);

        $this->assertTrue($pub->fresh()->publicado);
    }

    public function test_borrar_el_equipo_del_inventario_lo_despublica(): void
    {
        $celular = $this->celular();
        $pub = $this->publicar('celular', $celular->id);

        $celular->delete();

        $this->assertFalse($pub->fresh()->publicado);
    }

    public function test_un_accesorio_sigue_publicado_mientras_quedan_unidades(): void
    {
        $primera = $this->accesorio();
        $segunda = $this->accesorio();
        $pub = $this->publicar('producto_general', $primera->id);

        $primera->update(['estado' => 'vendido']);
        $this->assertTrue($pub->fresh()->publicado);

        $segunda->update(['estado' => 'vendido']);
        $this->assertFalse($pub->fresh()->publicado);
    }

    public function test_no_se_puede_publicar_un_equipo_vendido(): void
    {
        $celular = $this->celular();
        $pub = $this->publicar('celular', $celular->id, publicado: false);
        $celular->forceFill(['estado' => 'vendido'])->saveQuietly();

        $this->actingAs(User::factory()->create(['rol' => 'admin']))
            ->patch(route('admin.catalogo.update', $pub), [
                'storefront' => 'APPLE_BOSS', 'titulo' => $pub->titulo, 'slug' => $pub->slug, 'resumen' => $pub->resumen,
                'categoria' => $pub->categoria, 'condicion' => 'Nuevo', 'publicado' => true, 'destacado' => false, 'orden' => 0,
            ])
            ->assertSessionHasErrors('publicado');

        $this->assertFalse($pub->fresh()->publicado);
    }

    public function test_el_comando_despublica_lo_que_ya_estaba_vendido(): void
    {
        $vendido = $this->celular();
        $disponible = $this->celular();
        $pubVendida = $this->publicar('celular', $vendido->id);
        $pubDisponible = $this->publicar('celular', $disponible->id);
        $vendido->forceFill(['estado' => 'vendido'])->saveQuietly();   // vendido antes de esta regla

        $this->artisan('tienda:despublicar-vendidos')->assertSuccessful();

        $this->assertFalse($pubVendida->fresh()->publicado);
        $this->assertTrue($pubDisponible->fresh()->publicado);
    }
}
