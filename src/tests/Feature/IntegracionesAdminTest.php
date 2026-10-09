<?php

namespace Tests\Feature;

use App\Models\Integracion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Sistema → Integraciones API: crear, ver el token una sola vez, rotar, revocar y desactivar.
 */
class IntegracionesAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    public function test_crea_la_integracion_y_el_token_se_ve_una_sola_vez_y_se_guarda_como_hash(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post(route('admin.integraciones.store'), [
            'nombre' => 'APPLE BOSS AI',
            'scopes' => ['integration.products.read', 'integration.pricing.read'],
        ])->assertRedirect(route('admin.integraciones.index'));

        $integracion = Integracion::firstOrFail();
        $this->assertSame(['integration.products.read', 'integration.pricing.read'], $integracion->scopes);
        $this->assertSame($admin->id, $integracion->creado_por);

        $r = $this->get(route('admin.integraciones.index'))->assertOk()->assertInertia(fn (Assert $p) => $p
            ->component('Admin/Integraciones/Index')
            ->where('tokenNuevo.integracion', 'APPLE BOSS AI')
            ->has('integraciones', 1)
            ->where('integraciones.0.tokens.0.vence', null));
        $token = $r->viewData('page')['props']['tokenNuevo']['token'];
        $this->assertStringContainsString('|abi_', $token);

        // En la base, solo el hash
        $this->assertStringNotContainsString(explode('|', $token)[1], json_encode(DB::table('personal_access_tokens')->get()));
        $this->assertSame(hash('sha256', explode('|', $token)[1]), DB::table('personal_access_tokens')->value('token'));

        // Al volver a entrar, ya no está
        $this->get(route('admin.integraciones.index'))->assertInertia(fn (Assert $p) => $p->where('tokenNuevo', null));

        // Y sirve para la API
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/integration/health')->assertOk();
    }

    public function test_valida_nombre_y_permisos(): void
    {
        $this->actingAs($this->admin())->post(route('admin.integraciones.store'), ['nombre' => '', 'scopes' => ['admin.todo']])
            ->assertSessionHasErrors(['nombre', 'scopes.0']);
        $this->post(route('admin.integraciones.store'), ['nombre' => 'X', 'scopes' => []])->assertSessionHasErrors('scopes');
        $this->assertSame(0, Integracion::count());
    }

    public function test_rotar_revocar_y_desactivar(): void
    {
        $admin = $this->admin();
        $integracion = Integracion::create(['nombre' => 'APPLE BOSS AI', 'scopes' => ['integration.products.read'], 'activa' => true]);
        $integracion->emitirToken('viejo');
        $otra = Integracion::create(['nombre' => 'Otra', 'scopes' => ['integration.products.read'], 'activa' => true]);
        $otra->emitirToken('ajeno');

        // Rotar: el viejo vence en 24 h y hay uno nuevo
        $this->actingAs($admin)->post(route('admin.integraciones.token', $integracion), ['vencer_anteriores' => true])->assertRedirect();
        $tokens = $integracion->tokens()->orderBy('id')->get();
        $this->assertCount(2, $tokens);
        $this->assertTrue($tokens[0]->expires_at->between(now()->addHours(23), now()->addHours(25)));
        $this->assertNull($tokens[1]->expires_at);
        $this->assertNull($otra->tokens()->first()->expires_at);

        // Revocar el de otra integración desde esta: no existe
        $this->delete(route('admin.integraciones.revocar', [$integracion, $otra->tokens()->first()->id]))->assertNotFound();
        $this->delete(route('admin.integraciones.revocar', [$integracion, $tokens[0]->id]))->assertRedirect();
        $this->assertSame([$tokens[1]->id], $integracion->tokens()->pluck('id')->all());

        $this->patch(route('admin.integraciones.update', $integracion), ['nombre' => 'APPLE BOSS AI', 'scopes' => ['integration.products.read'], 'activa' => false])
            ->assertRedirect();
        $this->assertFalse($integracion->fresh()->activa);
    }

    public function test_un_rol_sin_el_modulo_no_entra(): void
    {
        $vendedor = User::factory()->create(['rol' => 'vendedor']);

        $this->actingAs($vendedor)->get(route('admin.integraciones.index'))->assertForbidden();
        $this->post(route('admin.integraciones.store'), ['nombre' => 'X', 'scopes' => ['integration.products.read']])->assertForbidden();
        $this->assertSame(0, Integracion::count());
    }
}
