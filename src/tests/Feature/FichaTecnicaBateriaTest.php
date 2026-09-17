<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoApple;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FichaTecnicaBateriaTest extends TestCase
{
    use RefreshDatabase;

    private function celular(string $bateria): Celular
    {
        return Celular::create([
            'modelo' => 'IPHONE 14 PLUS', 'capacidad' => '128 GB', 'color' => 'CELESTE', 'bateria' => $bateria,
            'imei_1' => fake()->unique()->numerify('###############'), 'estado_imei' => 'libre', 'procedencia' => 'EEUU',
            'precio_costo' => 4000, 'precio_venta' => 5200, 'estado' => 'disponible', 'condicion' => 'Seminuevo',
        ]);
    }

    private function publicar(string $tipo, int $id, array $atributos = []): CatalogoPublicacion
    {
        return CatalogoPublicacion::create([
            'producto_tipo' => $tipo, 'producto_id' => $id, 'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => 'Equipo', 'slug' => fake()->unique()->slug(3), 'resumen' => 'Disponible.', 'condicion' => 'Seminuevo',
            'categoria' => $tipo === 'computadora' ? 'computadoras' : 'celulares', 'atributos' => $atributos,
        ]);
    }

    public function test_lee_la_bateria_como_se_carga_en_el_inventario(): void
    {
        $this->assertSame(['salud' => 86, 'ciclos' => null, 'sellado' => false], CatalogoPublicacion::bateriaDe('86 %'));
        $this->assertSame(['salud' => 100, 'ciclos' => null, 'sellado' => true], CatalogoPublicacion::bateriaDe('100 SELLADO'));
        $this->assertSame(['salud' => 95, 'ciclos' => 308, 'sellado' => false], CatalogoPublicacion::bateriaDe('95 - 308 CICLOS'));
        $this->assertSame(['salud' => null, 'ciclos' => 5, 'sellado' => false], CatalogoPublicacion::bateriaDe('CICLOS 5'));
        $this->assertSame(['salud' => null, 'ciclos' => null, 'sellado' => false], CatalogoPublicacion::bateriaDe('-'));
    }

    public function test_la_api_toma_la_bateria_del_inventario_aunque_la_publicacion_no_la_tenga(): void
    {
        // Publicación creada antes del arreglo: sin salud_bateria guardada
        $pub = $this->publicar('celular', $this->celular('90')->id, ['capacidad' => '128 GB', 'color' => 'Celeste']);

        $this->getJson("/api/v1/products/{$pub->slug}")
            ->assertOk()
            ->assertJsonPath('data.atributos.salud_bateria', 90)
            ->assertJsonPath('data.bateria.salud', 90);

        $this->getJson('/api/v1/products')->assertJsonPath('data.0.atributos.salud_bateria', 90);

        $this->get("/productos/{$pub->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('product.battery', 90)->where('product.atributos.salud_bateria', 90));
    }

    public function test_si_el_inventario_cambia_la_tienda_muestra_el_valor_nuevo(): void
    {
        $celular = $this->celular('90');
        $pub = $this->publicar('celular', $celular->id, ['salud_bateria' => 90]);

        $celular->update(['bateria' => '84']);

        $this->getJson("/api/v1/products/{$pub->slug}")->assertJsonPath('data.atributos.salud_bateria', 84);
    }

    public function test_sin_porcentaje_en_el_inventario_vale_el_cargado_a_mano(): void
    {
        $pub = $this->publicar('celular', $this->celular('-')->id, ['salud_bateria' => '87']);

        $this->getJson("/api/v1/products/{$pub->slug}")->assertJsonPath('data.atributos.salud_bateria', '87');
    }

    public function test_sellado_y_ciclos_llegan_a_la_api(): void
    {
        $apple = ProductoApple::create([
            'modelo' => 'IPAD AIR M4', 'capacidad' => '128 GB', 'bateria' => '100 SELLADO', 'color' => 'AZUL', 'procedencia' => 'EEUU',
            'precio_costo' => 4000, 'precio_venta' => 5600, 'tiene_imei' => false, 'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);
        $mac = Computadora::create([
            'nombre' => 'MACBOOK AIR 13', 'procesador' => 'M2', 'numero_serie' => 'C02XYZ999', 'color' => 'GRIS', 'bateria' => '95 - 308 CICLOS',
            'ram' => '8 GB', 'almacenamiento' => '256 GB', 'procedencia' => 'EEUU', 'precio_costo' => 5000, 'precio_venta' => 6500,
            'estado' => 'disponible', 'condicion' => 'Seminuevo',
        ]);

        $this->getJson('/api/v1/products/' . $this->publicar('producto_apple', $apple->id)->slug)
            ->assertJsonPath('data.atributos.salud_bateria', 100)
            ->assertJsonPath('data.atributos.bateria_sellada', true);

        $this->getJson('/api/v1/products/' . $this->publicar('computadora', $mac->id)->slug)
            ->assertJsonPath('data.atributos.salud_bateria', 95)
            ->assertJsonPath('data.atributos.ciclos_bateria', 308);
    }

    public function test_el_editor_recibe_la_bateria_del_inventario_y_guarda_la_ficha(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $pub = $this->publicar('celular', $this->celular('100 SELLADO')->id);

        $this->actingAs($admin)
            ->get(route('admin.catalogo.edit', $pub))
            ->assertInertia(fn (Assert $page) => $page->where('inventario.bateria.salud', 100)->where('inventario.bateria.sellado', true));

        $this->actingAs($admin)
            ->from(route('admin.catalogo.edit', $pub))
            ->patch(route('admin.catalogo.update', $pub), [
                'storefront' => 'APPLE_BOSS', 'titulo' => $pub->titulo, 'slug' => $pub->slug, 'resumen' => $pub->resumen,
                'categoria' => 'celulares', 'condicion' => 'Seminuevo', 'publicado' => true, 'destacado' => false, 'orden' => 0,
                'atributos' => ['chip' => 'A15 Bionic', 'camara_principal' => '12 MP', 'resistencia' => 'IP68'],
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('A15 Bionic', $pub->fresh()->atributos['chip']);
        $this->getJson("/api/v1/products/{$pub->slug}")
            ->assertJsonPath('data.atributos.camara_principal', '12 MP')
            ->assertJsonPath('data.atributos.salud_bateria', 100);
    }
}
