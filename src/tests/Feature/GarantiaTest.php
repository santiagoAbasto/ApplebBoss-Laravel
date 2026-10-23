<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use Tests\TestCase;

class GarantiaTest extends TestCase
{
    public function test_la_garantia_se_deriva_de_la_condicion(): void
    {
        $this->assertSame(12, (new CatalogoPublicacion(['condicion' => 'Nuevo']))->garantiaCobertura()['meses']);
        $this->assertSame(4, (new CatalogoPublicacion(['condicion' => 'Seminuevo']))->garantiaCobertura()['meses']);
        $this->assertFalse((new CatalogoPublicacion(['condicion' => 'Nuevo']))->garantiaCobertura()['extendida']);
    }

    public function test_mas_que_el_estandar_es_garantia_extendida(): void
    {
        $cob = (new CatalogoPublicacion(['condicion' => 'Seminuevo', 'garantia_meses' => 6]))->garantiaCobertura();

        $this->assertSame(6, $cob['meses']);
        $this->assertSame(2, $cob['extra']);      // 6 − 4 estándar
        $this->assertTrue($cob['extendida']);
    }

    public function test_sin_condicion_no_inventa_garantia(): void
    {
        $this->assertNull((new CatalogoPublicacion([]))->garantiaCobertura());
    }
}
