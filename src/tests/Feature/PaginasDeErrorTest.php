<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Los errores de la tienda se ven con el layout completo (y vestidos si la Navidad está encendida); los 500 y 503, estáticos. */
class PaginasDeErrorTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_404_de_la_tienda_usa_el_layout_de_la_tienda_y_no_se_indexa(): void
    {
        $this->get('/esta-pagina-no-existe')
            ->assertNotFound()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
            ->assertInertia(fn (Assert $page) => $page->component('Errores/Tienda')->where('estado', 404));

        $this->get('/productos/no-existe-este-producto')->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page->component('Errores/Tienda'));
    }

    public function test_el_panel_conserva_su_propio_manejo_de_errores(): void
    {
        $this->get('/admin/dashboard')->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page->component('Errores/AccesoRestringido'));
    }

    public function test_la_api_sigue_respondiendo_en_json(): void
    {
        $this->getJson('/api/v1/no-existe')->assertNotFound()->assertJsonMissing(['estado' => 404]);
    }

    public function test_las_paginas_estaticas_se_dibujan_sin_navidad_por_defecto(): void
    {
        $html = view('errors.500')->render();
        $this->assertStringContainsString('Algo salió mal de nuestro lado', $html);
        $this->assertStringContainsString('noindex', $html);
        $this->assertStringContainsString('<html lang="es">', $html);   // sin atributo de temporada en <html>
    }

    public function test_con_la_navidad_encendida_las_paginas_estaticas_se_visten(): void
    {
        ConfiguracionTienda::set('navidad_modo', 'manual');
        ConfiguracionTienda::clearAllCache();

        foreach (['errors.500', 'errors.503', 'errors.404'] as $vista) {
            $html = view($vista)->render();
            $this->assertStringContainsString('data-season="christmas"', $html, $vista);
            $this->assertStringContainsString('class="gorro"', $html, $vista);
        }
    }
}
