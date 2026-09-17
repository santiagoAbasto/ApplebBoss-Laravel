<?php

namespace Tests\Feature;

use App\Models\HomeSection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeSectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_returns_only_active_sections_in_order_with_products_key(): void
    {
        // La migración de datos ya siembra secciones; partimos de cero para aislar el caso.
        HomeSection::query()->delete();

        HomeSection::create(['type' => 'featured',          'label' => 'Productos destacados', 'active' => true,  'orden' => 2, 'settings' => ['limit' => 8]]);
        HomeSection::create(['type' => 'category_products', 'label' => 'iPhone',               'active' => true,  'orden' => 3, 'settings' => ['categoria' => 'celulares']]);
        HomeSection::create(['type' => 'trade_in',          'label' => 'Trade-In',             'active' => false, 'orden' => 1, 'settings' => []]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Home')
                ->has('sections', 2)
                ->where('sections.0.type', 'featured')
                ->where('sections.1.type', 'category_products')
                ->has('sections.0.products', 0)
                ->has('sections.1.products', 0)
            );
    }

    public function test_admin_rejects_unknown_category_value(): void
    {
        $section = HomeSection::create(['type' => 'category_products', 'label' => 'iPhone', 'active' => true, 'orden' => 1, 'settings' => []]);

        $admin = \App\Models\User::factory()->create(['email_verified_at' => now()]);
        $admin->forceFill(['rol' => 'admin'])->save();

        $this->actingAs($admin)
            ->patch(route('admin.home-builder.update', $section), ['settings' => ['categoria' => 'hack', 'limit' => 5]])
            ->assertRedirect();

        // Valor fuera de la lista se reemplaza por el primero permitido
        $this->assertSame('celulares', $section->fresh()->settings['categoria']);
        $this->assertSame(5, $section->fresh()->settings['limit']);
    }
}
