<?php

namespace Tests\Unit;

use App\Support\Proveedor\MapaModelo;
use PHPUnit\Framework\TestCase;

/** Las filas del Excel de Apple Land que cambiaron de nombre o son nuevas se reconocen bien. */
class MapaModeloTest extends TestCase
{
    public function test_airpods_5_no_se_confunde_con_los_4(): void
    {
        $this->assertSame('AirPods 5', MapaModelo::de('airpods 5ta CON CANCELACION RUIDO')['modelo']);
        $this->assertSame('AirPods 4 con cancelación activa de ruido', MapaModelo::de('airpods 4ta CON CANCELACION RUIDO')['modelo']);
        $this->assertSame('AirPods 4', MapaModelo::de('airpods 4ta SIN CANCELACION RUIDO')['modelo']);
        $this->assertSame('AirPods Pro 3', MapaModelo::de('AIRPODS PRO 3RA GENERACION')['modelo']);
    }

    public function test_el_ipad_de_11a_generacion_es_el_a16(): void
    {
        $this->assertSame(['tipo' => 'producto_apple', 'modelo' => 'iPad (A16)', 'capacidad' => '128 GB', 'sim' => null], MapaModelo::de('IPAD 11VA DE 128GB'));
    }
}
