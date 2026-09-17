<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\CompatibilityTarget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompatibilityTargetTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->forceFill(['rol' => 'admin'])->save();
        return $user;
    }

    private function target(array $overrides = []): CompatibilityTarget
    {
        static $n = 0; $n++;
        return CompatibilityTarget::create(array_merge([
            'family'     => 'iphone',
            'generation' => 'iPhone 15',
            'name'       => 'iPhone 15 Pro ' . $n,
            'slug'       => 'iphone-15-pro-' . $n,
            'active'     => true,
            'sort_order' => $n,
        ], $overrides));
    }

    private function publicacion(array $overrides = []): CatalogoPublicacion
    {
        static $n = 0; $n++;
        $cel = Celular::create([
            'modelo'       => 'iPhone',
            'capacidad'    => '128 GB',
            'color'        => 'Negro',
            'imei_1'       => fake()->unique()->numerify('###############'),
            'estado_imei'  => 'libre',
            'procedencia'  => 'Tienda',
            'precio_costo' => 100,
            'precio_venta' => 200,
            'estado'       => 'disponible',
        ]);
        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $cel->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'Pub ' . $n,
            'slug'          => 'test-compat-' . $n,
            'resumen'       => 'Ok.',
            'condicion'     => 'Nuevo',
            'garantia'      => '3 meses',
            'categoria'     => 'celulares',
            'precio_venta'  => 200,
        ], $overrides));
    }

    // ─── Sync targets ────────────────────────────────────────────────────────

    public function test_admin_can_sync_compatibility_targets(): void
    {
        $pub = $this->publicacion();
        $t1  = $this->target();
        $t2  = $this->target();

        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.compatibilidades.sync', $pub), [
                'target_ids' => [$t1->id, $t2->id],
            ])
            ->assertOk()
            ->assertJson(['ok' => true, 'count' => 2]);

        $this->assertEquals(2, $pub->fresh()->compatibilidades()->count());
    }

    public function test_cannot_duplicate_same_target(): void
    {
        $pub = $this->publicacion();
        $t   = $this->target();

        // Duplicados en el mismo request son deduplicados
        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.compatibilidades.sync', $pub), [
                'target_ids' => [$t->id, $t->id],
            ])
            ->assertOk()
            ->assertJson(['count' => 1]);

        $this->assertEquals(1, $pub->fresh()->compatibilidades()->count());
    }

    public function test_invalid_target_id_is_rejected(): void
    {
        $pub = $this->publicacion();

        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.compatibilidades.sync', $pub), [
                'target_ids' => [99999],
            ])
            ->assertSessionHasErrors('target_ids.0');
    }

    public function test_sync_replaces_previous_targets(): void
    {
        $pub = $this->publicacion();
        $t1  = $this->target();
        $t2  = $this->target();
        $t3  = $this->target();

        // Primera sincronización
        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.compatibilidades.sync', $pub), ['target_ids' => [$t1->id, $t2->id]]);

        // Segunda sincronización — reemplaza
        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.compatibilidades.sync', $pub), ['target_ids' => [$t3->id]])
            ->assertOk();

        $ids = $pub->fresh()->compatibilidades()->pluck('target_id')->toArray();
        $this->assertCount(1, $ids);
        $this->assertContains($t3->id, $ids);
        $this->assertNotContains($t1->id, $ids);
    }

    public function test_empty_target_ids_clears_all(): void
    {
        $pub = $this->publicacion();
        $t   = $this->target();

        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.compatibilidades.sync', $pub), ['target_ids' => [$t->id]]);

        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.compatibilidades.sync', $pub), ['target_ids' => []])
            ->assertOk()
            ->assertJson(['count' => 0]);

        $this->assertEquals(0, $pub->fresh()->compatibilidades()->count());
    }

    // ─── Inverse lookup ──────────────────────────────────────────────────────

    public function test_inverse_lookup_target_to_publications(): void
    {
        $pub1 = $this->publicacion();
        $pub2 = $this->publicacion();
        $t    = $this->target();

        $pub1->compatibilidades()->create(['target_id' => $t->id]);

        $related = $t->publicaciones()->pluck('catalogo_publicaciones.id')->toArray();
        $this->assertContains($pub1->id, $related);
        $this->assertNotContains($pub2->id, $related);
    }

    // ─── Guest blocked ────────────────────────────────────────────────────────

    public function test_guest_cannot_sync_targets(): void
    {
        $pub = $this->publicacion();
        $t   = $this->target();

        $this->post(route('admin.catalogo.compatibilidades.sync', $pub), ['target_ids' => [$t->id]])
            ->assertRedirect(route('login'));
    }
}
