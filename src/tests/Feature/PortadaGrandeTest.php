<?php

namespace Tests\Feature;

use App\Models\HomeSection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Portada → «Portada grande»: la volanta, el título, el texto, los dos botones y los colores que se cargan en el panel
 * llegan a la tienda (antes el panel los guardaba y la portada solo usaba el botón principal).
 */
class PortadaGrandeTest extends TestCase
{
    use RefreshDatabase;

    public function test_lo_que_se_escribe_en_el_panel_llega_a_la_portada_de_la_tienda(): void
    {
        HomeSection::query()->delete();
        $hero = HomeSection::create(['type' => 'hero', 'label' => 'Portada', 'active' => true, 'orden' => 1, 'settings' => []]);
        $admin = User::factory()->create(['rol' => 'admin']);

        $this->actingAs($admin)
            ->patch(route('admin.home-builder.update', $hero), ['settings' => [
                'eyebrow'     => 'Nuevos ingresos',
                'titulo'      => '<b>El iPhone que buscas</b>',
                'descripcion' => 'Revisado y listo.',
                'cta_label'   => 'Ver catálogo',
                'cta_url'     => '/catalogo',
                'cta2_label'  => 'Cotiza tu equipo',
                'cta2_url'    => 'javascript:alert(1)',
                'tema'        => 'rosado',
            ]])
            ->assertRedirect();

        $seccion = collect($this->get('/')->assertOk()->viewData('page')['props']['sections'])->firstWhere('type', 'hero');

        $this->assertSame('Nuevos ingresos', $seccion['settings']['eyebrow']);
        $this->assertSame('El iPhone que buscas', $seccion['settings']['titulo']);
        $this->assertSame('Revisado y listo.', $seccion['settings']['descripcion']);
        $this->assertSame('Cotiza tu equipo', $seccion['settings']['cta2_label']);
        // Una dirección peligrosa no llega a la tienda y un color que no existe vuelve al azul
        $this->assertSame('', $seccion['settings']['cta2_url']);
        $this->assertSame('appleboss_navy', $seccion['settings']['tema']);
    }
}
