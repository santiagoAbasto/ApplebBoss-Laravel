<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
