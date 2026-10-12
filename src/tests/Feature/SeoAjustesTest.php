<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Support\Seo;
use Tests\TestCase;

/** Ajustes de SEO técnico: redirecciones permanentes y nada de indexar páginas privadas. */
class SeoAjustesTest extends TestCase
{
    use RefreshDatabase;

    public function test_las_direcciones_cortas_redirigen_de_forma_permanente(): void
    {
        $this->get('/apple')->assertStatus(301)->assertRedirect('/catalogo?categoria=productos-apple');
        $this->get('/accesorios')->assertStatus(301)->assertRedirect('/catalogo?categoria=accesorios');
    }

    public function test_las_paginas_privadas_o_de_cuenta_no_se_indexan(): void
    {
        foreach (['/ingresar', '/crear-cuenta', '/seguimiento'] as $ruta) {
            $this->get($ruta)->assertOk()->assertSee('<meta name="robots" content="noindex,nofollow">', false);
        }
        $this->get('/catalogo')->assertSee('content="index,follow"', false);
    }

    public function test_el_titulo_de_un_modelo_no_pasa_de_65_caracteres_y_sigue_distinguiendo_el_modelo(): void
    {
        $this->assertSame('iPhone 14 Plus en Cochabamba: precio y ficha técnica', Seo::tituloDeModelo('iPhone 14 Plus'));
        $this->assertSame('MacBook Pro (13″, 2019, 2 puertos): precio en Cochabamba', Seo::tituloDeModelo('MacBook Pro (13 pulgadas, 2019, dos puertos Thunderbolt 3)'));
        $this->assertSame('iPad Pro 11″ (M5) Cellular: precio en Cochabamba', Seo::tituloDeModelo('iPad Pro de 11 pulgadas (M5) Wi‑Fi + Cellular'));

        $largos = ['Apple Watch Series 10 (46 mm, aluminio, GPS + Cellular)', 'Apple Watch Series 10 (46 mm, aluminio, GPS)', 'Apple Watch Series 10 (46 mm, titanio, GPS + Cellular)',
            'MacBook Air (13 pulgadas, principios de 2014)', 'MacBook Pro (16 pulgadas, M3 Pro, noviembre de 2023)', 'AirPods 4 con cancelación activa de ruido', 'Apple Pencil (2.ª generación)'];
        $titulos = array_map(fn ($n) => Seo::tituloDeModelo($n), $largos);
        foreach ($titulos as $i => $t) {
            $this->assertLessThanOrEqual(65, mb_strlen($t), $largos[$i]);
        }
        $this->assertCount(count($largos), array_unique($titulos), 'modelos distintos, títulos distintos');
    }
}
