<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\ProductoGeneral;
use App\Models\User;
use App\Support\InventarioCatalogo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Asistente "Agregar productos a la tienda" desde el inventario. */
class CatalogoImportTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->forceFill(['rol' => 'admin'])->save();
        return $user;
    }

    private function celular(array $o = []): Celular
    {
        return Celular::create(array_merge([
            'modelo'       => 'IPHONE 13 PRO MAX',
            'capacidad'    => '128 GB',
            'color'        => 'AZUL',
            'bateria'      => '84',
            'imei_1'       => fake()->unique()->numerify('###############'),
            'estado_imei'  => 'libre',
            'procedencia'  => 'Proveedor secreto',
            'precio_costo' => 3000,
            'precio_venta' => 4150,
            'estado'       => 'disponible',
        ], $o));
    }

    private function accesorio(string $nombre = 'CUBO 20 W ORIGINAL', float $precio = 300, array $o = []): ProductoGeneral
    {
        return ProductoGeneral::create(array_merge([
            'codigo'       => fake()->unique()->bothify('AC-#####'),
            'tipo'         => 'cargador_20w',
            'nombre'       => $nombre,
            'procedencia'  => 'Proveedor secreto',
            'precio_costo' => 150,
            'precio_venta' => $precio,
            'estado'       => 'disponible',
        ], $o));
    }

    public function test_titles_are_friendly(): void
    {
        $this->assertSame('iPhone 13 Pro Max 128 GB Azul', InventarioCatalogo::bonito('IPHONE 13 PRO MAX 128GB AZUL'));
        $this->assertSame('Funda de Diseño iPhone 14 Pro Max', InventarioCatalogo::bonito('Funda de Diseño IP 14 PRO MAX'));
        $this->assertSame('Cubo 20 W Original', InventarioCatalogo::bonito('CUBO 20W ORIGINAL'));
    }

    public function test_identical_accessories_are_one_article(): void
    {
        $this->accesorio(); $this->accesorio(); $this->accesorio();
        $this->accesorio('CUBO 40 W ORIGINAL', 400);
        $this->celular();

        $p = InventarioCatalogo::pendientes();

        $this->assertCount(1, $p['celular']);
        $this->assertCount(2, $p['producto_general']);
        $cubo20 = collect($p['producto_general'])->firstWhere('titulo', 'Cubo 20 W Original');
        $this->assertSame(3, $cubo20['unidades']);
    }

    public function test_import_requires_condition(): void
    {
        $cel = $this->celular();

        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.importar.store'), ['items' => ["celular:{$cel->id}"], 'publicar' => true])
            ->assertSessionHasErrors('condicion');

        $this->assertSame(0, CatalogoPublicacion::count());
    }

    public function test_import_creates_published_items_without_internal_data(): void
    {
        $cel = $this->celular();
        $acc = $this->accesorio();
        $this->accesorio(); // segunda unidad del mismo artículo

        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.importar.store'), [
                'items'     => ["celular:{$cel->id}", "producto_general:{$acc->id}"],
                'condicion' => 'Seminuevo',
                'publicar'  => true,
            ])
            ->assertRedirect(route('admin.catalogo.index'));

        $this->assertSame(2, CatalogoPublicacion::count());
        $pub = CatalogoPublicacion::where('producto_tipo', 'celular')->first();
        $this->assertTrue($pub->publicado);
        $this->assertSame('Seminuevo', $pub->condicion);
        $this->assertSame('iPhone 13 Pro Max 128 GB Azul', $pub->titulo);
        $this->assertSame([], $pub->camposFaltantes()); // publicable sin foto

        $json = json_encode($pub->toArray());
        $this->assertStringNotContainsString($cel->imei_1, $json);
        $this->assertStringNotContainsString('Proveedor secreto', $json);
        $this->assertStringNotContainsString('3000', $json);

        // Ya no quedan pendientes: el artículo cuenta como publicado aunque tenga 2 unidades
        $this->assertSame(0, InventarioCatalogo::contarPendientes());
    }

    public function test_public_api_lists_all_imported_products(): void
    {
        $ids = collect(range(1, 5))->map(fn () => 'celular:' . $this->celular()->id)->all();

        $this->actingAs($this->admin())->post(route('admin.catalogo.importar.store'), [
            'items' => $ids, 'condicion' => 'Nuevo', 'publicar' => true,
        ]);

        $this->getJson('/api/v1/products?per_page=100')
            ->assertOk()
            ->assertJsonPath('meta.total', 5)
            ->assertJsonMissingPath('data.0.precio_costo');
    }

    public function test_accessory_stays_available_while_units_remain(): void
    {
        $a = $this->accesorio();
        $b = $this->accesorio();
        $pub = InventarioCatalogo::crear('producto_general', $a, 'Nuevo', true);

        $a->update(['estado' => 'vendido']); // se vende la unidad "representante"
        $this->assertTrue($pub->fresh()->productoDisponible());
        $this->assertSame(300.0, $pub->fresh()->precioVigente());

        $b->update(['estado' => 'vendido']);
        $this->assertFalse($pub->fresh()->productoDisponible());

        // Mismo resultado con la precarga en lote
        $lista = CatalogoPublicacion::whereKey($pub->id)->get();
        CatalogoPublicacion::precargarInventario($lista);
        $this->assertFalse($lista->first()->productoDisponible());
    }

    public function test_publish_from_inventory_button_opens_editor(): void
    {
        $cel = $this->celular();

        $this->actingAs($this->admin())
            ->get(route('admin.catalogo.create', ['tipo' => 'celular', 'id' => $cel->id]))
            ->assertRedirect();

        $pub = CatalogoPublicacion::first();
        $this->assertNotNull($pub);
        $this->assertFalse($pub->publicado);
        $this->assertNull($pub->condicion); // la condición la elige la persona
    }

    public function test_catalog_admin_shows_pending_count(): void
    {
        $this->celular();

        $this->actingAs($this->admin())
            ->get(route('admin.catalogo.index'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p->where('pendientes', 1));
    }
}
