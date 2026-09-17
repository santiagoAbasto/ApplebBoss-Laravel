<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\HomeSectionController;
use App\Models\HomeSection;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeSectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // La migración 2026_09_13_120000 siembra secciones por defecto; estos tests parten de tabla vacía.
        HomeSection::query()->delete();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private function admin(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->forceFill(['rol' => 'admin'])->save();
        return $user;
    }

    private function section(array $overrides = []): HomeSection
    {
        return HomeSection::create(array_merge([
            'type'     => 'hero',
            'label'    => 'Hero principal',
            'active'   => true,
            'orden'    => 1,
            'settings' => [],
        ], $overrides));
    }

    // ─── scopeVisible ──────────────────────────────────────────────────────────

    public function test_active_section_is_visible(): void
    {
        $s = $this->section(['active' => true]);
        $this->assertTrue(HomeSection::visible()->pluck('id')->contains($s->id));
    }

    public function test_inactive_section_is_not_visible(): void
    {
        $s = $this->section(['active' => false]);
        $this->assertFalse(HomeSection::visible()->pluck('id')->contains($s->id));
    }

    public function test_future_scheduled_section_is_not_visible(): void
    {
        $s = $this->section(['active' => true, 'publicar_desde' => Carbon::now()->addDay()]);
        $this->assertFalse(HomeSection::visible()->pluck('id')->contains($s->id));
    }

    public function test_expired_section_is_not_visible(): void
    {
        $s = $this->section(['active' => true, 'publicar_hasta' => Carbon::now()->subDay()]);
        $this->assertFalse(HomeSection::visible()->pluck('id')->contains($s->id));
    }

    public function test_active_within_window_is_visible(): void
    {
        $s = $this->section([
            'active'         => true,
            'publicar_desde' => Carbon::now()->subHour(),
            'publicar_hasta' => Carbon::now()->addHour(),
        ]);
        $this->assertTrue(HomeSection::visible()->pluck('id')->contains($s->id));
    }

    public function test_visible_respects_orden(): void
    {
        $this->section(['type' => 'trust',    'label' => 'Trust',    'active' => true, 'orden' => 2]);
        $this->section(['type' => 'location', 'label' => 'Location', 'active' => true, 'orden' => 1]);
        $this->section(['type' => 'faq',      'label' => 'FAQ',      'active' => true, 'orden' => 3]);

        $types = HomeSection::visible()->pluck('type')->toArray();
        $this->assertEquals(['location', 'trust', 'faq'], $types);
    }

    public function test_all_sections_disabled_returns_empty_without_exception(): void
    {
        $this->section(['active' => false]);
        $this->section(['type' => 'trust', 'label' => 'Trust', 'active' => false]);

        $visible = HomeSection::visible()->get();
        $this->assertCount(0, $visible);
    }

    // ─── Public home page ──────────────────────────────────────────────────────

    public function test_home_page_renders_with_zero_active_sections(): void
    {
        $this->section(['active' => false]);

        $this->get(route('store.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Home')
                ->where('sections', [])
            );
    }

    public function test_home_page_only_passes_active_sections(): void
    {
        $active   = $this->section(['active' => true, 'orden' => 1]);
        $inactive = $this->section(['type' => 'trust', 'label' => 'Trust', 'active' => false, 'orden' => 2]);

        $this->get(route('store.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/Home')
                ->has('sections', 1)
                ->where('sections.0.id', $active->id)
            );
    }

    // ─── Admin: toggle active ──────────────────────────────────────────────────

    public function test_admin_can_toggle_section_inactive(): void
    {
        $section = $this->section(['active' => true]);

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $section), ['active' => false])
            ->assertRedirect();

        $this->assertFalse($section->fresh()->active);
    }

    public function test_admin_can_toggle_section_active(): void
    {
        $section = $this->section(['active' => false]);

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $section), ['active' => true])
            ->assertRedirect();

        $this->assertTrue($section->fresh()->active);
    }

    // ─── Admin: settings persist ───────────────────────────────────────────────

    public function test_hero_settings_persist(): void
    {
        $section = $this->section(['type' => 'hero']);

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $section), [
                'settings' => [
                    'titulo'     => 'Nuevo título',
                    'descripcion' => 'Nueva descripción',
                    'tema'       => 'light',
                ],
            ])
            ->assertRedirect();

        $settings = $section->fresh()->settings;
        $this->assertEquals('Nuevo título', $settings['titulo']);
        $this->assertEquals('Nueva descripción', $settings['descripcion']);
        $this->assertEquals('light', $settings['tema']);
    }

    // ─── Admin: settings validation by type ───────────────────────────────────

    public function test_unknown_settings_fields_are_discarded(): void
    {
        $section = $this->section(['type' => 'hero']);

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $section), [
                'settings' => [
                    'titulo'         => 'Válido',
                    'campo_fantasma' => 'debería ser descartado',
                    'otro_campo'     => 'también descartado',
                ],
            ])
            ->assertRedirect();

        $settings = $section->fresh()->settings;
        $this->assertArrayHasKey('titulo', $settings);
        $this->assertArrayNotHasKey('campo_fantasma', $settings);
        $this->assertArrayNotHasKey('otro_campo', $settings);
    }

    public function test_tema_enum_rejects_invalid_value(): void
    {
        $section = $this->section(['type' => 'hero']);

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $section), [
                'settings' => ['tema' => 'rojo_arbitrario'],
            ])
            ->assertRedirect();

        // Debe caer al primer valor del enum
        $this->assertEquals('appleboss_navy', $section->fresh()->settings['tema']);
    }

    public function test_settings_for_no_settings_type_stored_empty(): void
    {
        $section = $this->section(['type' => 'trust', 'label' => 'Trust bar']);

        $this->actingAs($this->admin())
            ->patch(route('admin.home-builder.update', $section), [
                'settings' => ['titulo' => 'intentando inyectar', 'script' => '<script>x</script>'],
            ])
            ->assertRedirect();

        $this->assertEquals([], $section->fresh()->settings);
    }

    // ─── Admin: reorder ────────────────────────────────────────────────────────

    public function test_admin_can_reorder_sections(): void
    {
        $a = $this->section(['type' => 'hero',  'label' => 'Hero',  'active' => true, 'orden' => 1]);
        $b = $this->section(['type' => 'trust', 'label' => 'Trust', 'active' => true, 'orden' => 2]);

        $this->actingAs($this->admin())
            ->post(route('admin.home-builder.reorder'), [
                'orden' => [
                    ['id' => $a->id, 'orden' => 2],
                    ['id' => $b->id, 'orden' => 1],
                ],
            ])
            ->assertRedirect();

        $this->assertEquals(2, $a->fresh()->orden);
        $this->assertEquals(1, $b->fresh()->orden);
    }

    // ─── Guest cannot access admin ────────────────────────────────────────────

    public function test_guest_cannot_access_home_builder(): void
    {
        $this->get(route('admin.home-builder.index'))->assertRedirect(route('login'));
    }

    public function test_guest_cannot_update_section(): void
    {
        $section = $this->section();
        $this->patch(route('admin.home-builder.update', $section), ['active' => false])
            ->assertRedirect(route('login'));
    }
}
