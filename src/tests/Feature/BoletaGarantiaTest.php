<?php

namespace Tests\Feature;

use App\Support\GarantiaDeVenta;
use App\Support\MontoEnLetras;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BoletaGarantiaTest extends TestCase
{
    public function test_el_monto_se_escribe_como_en_un_comprobante(): void
    {
        $this->assertSame('Ocho mil setecientos treinta 00/100 bolivianos', MontoEnLetras::bolivianos(8730));
        $this->assertSame('Diez mil ochocientos 50/100 bolivianos', MontoEnLetras::bolivianos('10800.50'));
        $this->assertSame('Veintiún mil 00/100 bolivianos', MontoEnLetras::bolivianos(21000));
        $this->assertSame('Un millón cien 99/100 bolivianos', MontoEnLetras::bolivianos(1000100.99));
        $this->assertSame('Cero 00/100 bolivianos', MontoEnLetras::bolivianos(0));
    }

    public function test_cada_producto_recibe_el_plazo_de_la_hoja_de_garantia(): void
    {
        $venta = Carbon::parse('2026-09-21 13:02');
        $meses = fn (string $tipo, array $p) => GarantiaDeVenta::cobertura($tipo, (object) $p, $venta);

        $this->assertSame(12, $meses('celular', ['condicion' => 'Nuevo'])['meses']);
        $this->assertSame('21/01/2027', $meses('celular', ['condicion' => 'Seminuevo'])['vence']->format('d/m/Y'));
        $this->assertSame(6, $meses('producto_general', ['tipo' => 'cargador_20w', 'nombre' => 'CUBO 20 W ORIGINAL'])['meses']);
        $this->assertSame(3, $meses('producto_general', ['tipo' => 'cargador_20w', 'nombre' => 'CUBO 20 W'])['meses']);
    }

    public function test_la_condicion_no_se_adivina_y_un_accesorio_sin_plazo_no_promete_nada(): void
    {
        $venta = Carbon::parse('2026-09-21');

        $this->assertNull(GarantiaDeVenta::cobertura('celular', (object) ['condicion' => null], $venta));
        $this->assertNull(GarantiaDeVenta::cobertura('producto_general', (object) ['tipo' => 'vidrio_templado', 'nombre' => 'VIDRIO TEMPLADO'], $venta));
    }
}
