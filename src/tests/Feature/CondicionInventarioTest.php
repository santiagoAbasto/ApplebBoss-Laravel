<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\ProductoGeneral;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** La condición (Nuevo / Seminuevo) se carga en el inventario y alimenta la tienda y la API. */
class CondicionInventarioTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function celular(array $datos = []): Celular
    {
        return Celular::create(array_merge([
            'modelo'       => 'IPHONE 15 PRO',
            'capacidad'    => '256 GB',
            'color'        => 'NEGRO',
            'bateria'      => '90',
            'imei_1'       => fake()->unique()->numerify('35#############'),
            'estado_imei'  => 'libre',
            'procedencia'  => 'EEUU',
            'precio_costo' => 6000,
            'precio_venta' => 7500,
            'estado'       => 'disponible',
        ], $datos));
    }

    private function publicar(Celular $celular, string $condicion = 'Nuevo'): CatalogoPublicacion
    {
        return CatalogoPublicacion::create([
            'producto_tipo' => 'celular',
            'producto_id'   => $celular->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'iPhone 15 Pro 256 GB Negro',
            'slug'          => 'iphone-15-pro-256-gb-negro-' . $celular->id,
            'resumen'       => 'Equipo disponible.',
            'condicion'     => $condicion,
            'categoria'     => 'celulares',
        ]);
    }

    /** Lo que envía el formulario de edición con los datos guardados del equipo. */
    private function datosDe(Celular $celular, array $cambios = []): array
    {
        return array_merge($celular->only([
            'modelo', 'capacidad', 'color', 'bateria', 'imei_1', 'imei_2', 'numero_serie',
            'estado_imei', 'procedencia', 'precio_costo', 'precio_venta', 'estado', 'condicion',
        ]), $cambios);
    }

    /** Accesorio como los que había antes: sin condición (salvo que se indique). */
    private function accesorio(string $codigo, string $nombre = 'CUBO 20 W ORIGINAL', float $precio = 300, ?string $condicion = null): ProductoGeneral
    {
        return ProductoGeneral::create([
            'codigo'       => $codigo,
            'tipo'         => 'cargador_20w',
            'nombre'       => $nombre,
            'procedencia'  => 'Proveedor',
            'precio_costo' => 150,
            'precio_venta' => $precio,
            'estado'       => 'disponible',
            'condicion'    => $condicion,
        ]);
    }

    public function test_registrar_un_celular_pide_la_condicion(): void
    {
        $admin = $this->admin();
        $datos = [
            'modelo'       => 'iPhone 16',
            'capacidad'    => '128 GB',
            'color'        => 'Negro',
            'bateria'      => '100 SELLADO',
            'imei_1'       => '490154203237518',
            'estado_imei'  => 'libre',
            'procedencia'  => 'EEUU',
            'precio_costo' => 6000,
            'precio_venta' => 7000,
            'estado'       => 'disponible',
        ];

        $this->actingAs($admin)->from(route('admin.celulares.create'))
            ->post(route('admin.celulares.store'), $datos)
            ->assertSessionHasErrors(['condicion' => 'Elige si es nuevo o seminuevo.']);

        $this->actingAs($admin)->from(route('admin.celulares.create'))
            ->post(route('admin.celulares.store'), $datos + ['condicion' => 'Usado'])
            ->assertSessionHasErrors(['condicion' => 'Elige si es nuevo o seminuevo.']);

        $this->actingAs($admin)
            ->post(route('admin.celulares.store'), $datos + ['condicion' => 'Nuevo'])
            ->assertRedirect(route('admin.celulares.index'));

        $this->assertDatabaseHas('celulares', ['imei_1' => '490154203237518', 'condicion' => 'Nuevo']);
    }

    public function test_cambiar_la_condicion_en_el_inventario_actualiza_la_tienda_y_la_api(): void
    {
        $celular = $this->celular(['condicion' => 'Nuevo']);
        $pub = $this->publicar($celular, 'Nuevo');

        $this->getJson('/api/v1/products?condicion=Nuevo')->assertJsonPath('meta.total', 1);

        $this->actingAs($this->admin())
            ->put(route('admin.celulares.update', $celular), $this->datosDe($celular, ['condicion' => 'Seminuevo']))
            ->assertRedirect(route('admin.celulares.index'));

        $this->assertSame('Seminuevo', $pub->fresh()->condicion);

        $this->getJson('/api/v1/products?condicion=seminuevo')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.condicion', 'Seminuevo');
        $this->getJson('/api/v1/products?condicion=Nuevo')->assertJsonPath('meta.total', 0);
    }

    public function test_publicar_desde_el_inventario_usa_su_condicion(): void
    {
        $celular = $this->celular(['condicion' => 'Seminuevo']);

        $this->actingAs($this->admin())
            ->get(route('admin.catalogo.create', ['tipo' => 'celular', 'id' => $celular->id]))
            ->assertRedirect()
            ->assertSessionHas('success', fn ($mensaje) => str_contains($mensaje, 'Seminuevo'));

        $pub = CatalogoPublicacion::first();
        $this->assertSame('Seminuevo', $pub->condicion);
        $this->assertFalse($pub->publicado); // queda como borrador para revisarla
    }

    public function test_el_asistente_usa_la_condicion_del_inventario_y_guarda_la_elegida(): void
    {
        $admin = $this->admin();
        $nuevo = $this->celular(['condicion' => 'Nuevo']);
        $sinCondicion = $this->celular();

        $this->actingAs($admin)
            ->post(route('admin.catalogo.importar.store'), [
                'items'     => ["celular:{$nuevo->id}", "celular:{$sinCondicion->id}"],
                'condicion' => 'Seminuevo',
                'publicar'  => true,
            ])
            ->assertRedirect(route('admin.catalogo.index'));

        $this->assertSame('Nuevo', CatalogoPublicacion::where('producto_id', $nuevo->id)->value('condicion'));
        $this->assertSame('Seminuevo', CatalogoPublicacion::where('producto_id', $sinCondicion->id)->value('condicion'));
        $this->assertSame('Nuevo', $nuevo->fresh()->condicion);
        $this->assertSame('Seminuevo', $sinCondicion->fresh()->condicion); // la elegida queda en el inventario

        // Si todos ya tienen condición, no hace falta elegirla
        $otro = $this->celular(['condicion' => 'Seminuevo']);
        $this->actingAs($admin)
            ->post(route('admin.catalogo.importar.store'), ['items' => ["celular:{$otro->id}"], 'publicar' => true])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.catalogo.index'));
        $this->assertSame('Seminuevo', CatalogoPublicacion::where('producto_id', $otro->id)->value('condicion'));
    }

    public function test_en_accesorios_la_condicion_elegida_queda_en_todas_las_unidades_del_articulo(): void
    {
        $a = $this->accesorio('AC-1');
        $b = $this->accesorio('AC-2');
        $otro = $this->accesorio('AC-3', 'CUBO 40 W ORIGINAL', 400);

        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.importar.store'), [
                'items'     => ["producto_general:{$a->id}"],
                'condicion' => 'Nuevo',
                'publicar'  => true,
            ])
            ->assertRedirect(route('admin.catalogo.index'));

        $this->assertSame('Nuevo', $a->fresh()->condicion);
        $this->assertSame('Nuevo', $b->fresh()->condicion);
        $this->assertNull($otro->fresh()->condicion);
    }

    public function test_los_productos_generales_entran_como_nuevos(): void
    {
        // Sin indicar condición, un producto general queda como Nuevo
        $nuevo = ProductoGeneral::create([
            'codigo'       => 'AC-10',
            'tipo'         => 'funda',
            'nombre'       => 'FUNDA SILICONA 15 PRO',
            'procedencia'  => 'CHINA',
            'precio_costo' => 30,
            'precio_venta' => 80,
            'estado'       => 'disponible',
        ]);
        $this->assertSame('Nuevo', $nuevo->fresh()->condicion);

        // Los que estaban sin condición pasan a Nuevo con la migración
        $antiguo = $this->accesorio('AC-11');
        $this->assertNull($antiguo->fresh()->condicion);
        (require database_path('migrations/2026_09_14_130000_marcar_productos_generales_como_nuevos.php'))->up();
        $this->assertSame('Nuevo', $antiguo->fresh()->condicion);
    }

    public function test_elegir_la_condicion_en_la_tienda_actualiza_el_inventario(): void
    {
        $celular = $this->celular(['condicion' => 'Nuevo']);
        $pub = $this->publicar($celular, 'Nuevo');

        $this->actingAs($this->admin())
            ->from(route('admin.catalogo.edit', $pub))
            ->patch(route('admin.catalogo.update', $pub), [
                'storefront' => 'APPLE_BOSS',
                'titulo'     => $pub->titulo,
                'slug'       => $pub->slug,
                'resumen'    => $pub->resumen,
                'categoria'  => 'celulares',
                'condicion'  => 'Seminuevo',
                'publicado'  => true,
                'destacado'  => false,
                'orden'      => 0,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('Seminuevo', $celular->fresh()->condicion);
    }

    public function test_marcar_varios_celulares_de_una_vez(): void
    {
        $admin = $this->admin();
        $a = $this->celular();
        $b = $this->celular();
        $pub = $this->publicar($a, 'Nuevo');

        $this->actingAs($admin)
            ->from(route('admin.celulares.index'))
            ->patch(route('admin.celulares.condicion'), ['ids' => [$a->id, $b->id], 'condicion' => 'Seminuevo'])
            ->assertRedirect(route('admin.celulares.index'))
            ->assertSessionHas('success', 'Listo: 2 celulares quedaron como Seminuevo.');

        $this->assertSame('Seminuevo', $a->fresh()->condicion);
        $this->assertSame('Seminuevo', $b->fresh()->condicion);
        $this->assertSame('Seminuevo', $pub->fresh()->condicion);

        $this->actingAs($admin)
            ->from(route('admin.celulares.index'))
            ->patch(route('admin.celulares.condicion'), ['ids' => [$a->id]])
            ->assertSessionHasErrors(['condicion' => 'Elige si es nuevo o seminuevo.']);
    }

    public function test_los_demas_productos_tambien_guardan_la_condicion(): void
    {
        $admin = $this->admin();
        $computadora = [
            'nombre'         => 'MACBOOK AIR M2',
            'procesador'     => 'M2',
            'numero_serie'   => 'C02XYZ123',
            'color'          => 'GRIS',
            'bateria'        => '95',
            'ram'            => '8',
            'almacenamiento' => '256',
            'procedencia'    => 'EEUU',
            'precio_costo'   => 5000,
            'precio_venta'   => 6500,
            'estado'         => 'disponible',
        ];

        $this->actingAs($admin)->from(route('admin.computadoras.create'))
            ->post(route('admin.computadoras.store'), $computadora)
            ->assertSessionHasErrors(['condicion' => 'Elige si es nuevo o seminuevo.']);

        $this->actingAs($admin)
            ->post(route('admin.computadoras.store'), $computadora + ['condicion' => 'Seminuevo'])
            ->assertRedirect(route('admin.computadoras.index'));
        $this->assertDatabaseHas('computadoras', ['numero_serie' => 'C02XYZ123', 'condicion' => 'Seminuevo']);

        $this->actingAs($admin)
            ->post(route('admin.productos-apple.store'), [
                'modelo'       => 'IPAD AIR',
                'capacidad'    => '256 GB',
                'bateria'      => '100',
                'color'        => 'AZUL',
                'numero_serie' => null,
                'procedencia'  => 'EEUU',
                'precio_costo' => 4000,
                'precio_venta' => 5200,
                'tiene_imei'   => false,
                'imei_1'       => null,
                'imei_2'       => null,
                'estado_imei'  => null,
                'condicion'    => 'Nuevo',
            ])
            ->assertRedirect(route('admin.productos-apple.index'));
        $this->assertDatabaseHas('productos_apple', ['modelo' => 'IPAD AIR', 'condicion' => 'Nuevo']);

        $this->actingAs($admin)->from(route('admin.productos-generales.create'))
            ->post(route('admin.productos-generales.store'), [
                'codigo'       => 'FUNDA-001',
                'tipo'         => 'funda',
                'nombre'       => 'FUNDA SILICONA 15 PRO',
                'procedencia'  => 'CHINA',
                'precio_costo' => 30,
                'precio_venta' => 80,
                'estado'       => 'disponible',
                'condicion'    => 'Nuevo',
            ])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('productos_generales', ['codigo' => 'FUNDA-001', 'condicion' => 'Nuevo']);
    }

    public function test_la_busqueda_de_stock_muestra_la_condicion(): void
    {
        $celular = $this->celular(['condicion' => 'Seminuevo']);

        $this->actingAs($this->admin())
            ->postJson(route('api.stock.buscar_codigo'), ['codigo' => $celular->imei_1])
            ->assertOk()
            ->assertJsonPath('producto.condicion', 'Seminuevo');
    }
}
