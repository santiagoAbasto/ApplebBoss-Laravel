<?php

namespace Tests\Unit;

use App\Support\Catalogo\Busqueda;
use PHPUnit\Framework\TestCase;

/** El buscador del catálogo encuentra por palabras clave, no por la frase exacta. */
class BusquedaTest extends TestCase
{
    public function test_encuentra_aunque_las_palabras_no_esten_juntas(): void
    {
        // El caso que se rompía: el producto existe pero la búsqueda no lo traía.
        $this->assertTrue(Busqueda::coincide('Magic Keyboard para iPad Pro 12.9 White Gray', 'magic keyboard 12.9'));
        $this->assertTrue(Busqueda::coincide('Magic Keyboard para iPad Pro 12.9 White Gray', 'Magic Keyboard 12.9'));
    }

    public function test_el_orden_de_las_palabras_no_importa(): void
    {
        $this->assertTrue(Busqueda::coincide('iPhone 17 Pro Max 256 GB', 'pro iphone'));
        $this->assertTrue(Busqueda::coincide('Apple TV 4K 64 GB', 'apple tv'));
    }

    public function test_exige_todas_las_palabras(): void
    {
        $this->assertFalse(Busqueda::coincide('iPhone 17 Pro Max', 'iphone 15'));
        $this->assertFalse(Busqueda::coincide('Magic Keyboard para iPad Pro 12.9', 'magic keyboard 11'));
    }

    public function test_ignora_tildes_y_mayusculas(): void
    {
        $this->assertTrue(Busqueda::coincide('Cámara trasera de 48 MP', 'camara'));
        $this->assertTrue(Busqueda::coincide('iPad Pro de 13 Pulgadas', 'IPAD PULGADAS'));
    }

    public function test_consulta_vacia_coincide_con_todo(): void
    {
        // Sin términos, no filtra nada (el controlador ya decide cuándo aplicar la búsqueda).
        $this->assertTrue(Busqueda::coincide('cualquier cosa', '   '));
        $this->assertSame([], Busqueda::terminos('   '));
    }
}
