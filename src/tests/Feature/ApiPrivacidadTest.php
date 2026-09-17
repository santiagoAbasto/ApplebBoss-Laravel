<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Computadora;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Nada sensible del inventario sale a lo público (API v1, buscador, ficha, comparador):
 * ni IMEI 1 / 2, ni el estado del IMEI, ni el precio de costo, ni la procedencia.
 * El número de serie sí puede mostrarse.
 */
class ApiPrivacidadTest extends TestCase
{
    use RefreshDatabase;

    private const IMEI_1 = '358051325422989';
    private const IMEI_2 = '358051325422997';
    private const PROCEDENCIA = 'IMPORTADORA SECRETA - CEL 70000000';
    private const COSTO = 6123.45;

    private function celularPublicado(array $atributos = []): CatalogoPublicacion
    {
        $celular = Celular::create([
            'modelo'       => 'IPHONE 15 PRO',
            'capacidad'    => '256 GB',
            'color'        => 'NEGRO',
            'bateria'      => '90',
            'imei_1'       => self::IMEI_1,
            'imei_2'       => self::IMEI_2,
            'numero_serie' => 'F2LXK1ABCD',
            'estado_imei'  => 'registrado',
            'procedencia'  => self::PROCEDENCIA,
            'precio_costo' => self::COSTO,
            'precio_venta' => 9500,
            'estado'       => 'disponible',
            'condicion'    => 'Seminuevo',
        ]);

        return CatalogoPublicacion::create([
            'producto_tipo' => 'celular',
            'producto_id'   => $celular->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'iPhone 15 Pro 256 GB Negro',
            'slug'          => 'iphone-15-pro-256-gb-negro',
            'resumen'       => 'Equipo disponible.',
            'condicion'     => 'Seminuevo',
            'categoria'     => 'celulares',
            'atributos'     => array_merge(['capacidad' => '256 GB', 'color' => 'Negro', 'salud_bateria' => 90], $atributos),
        ]);
    }

    private function computadoraPublicada(): CatalogoPublicacion
    {
        $mac = Computadora::create([
            'nombre'         => 'MACBOOK AIR M2',
            'procesador'     => 'M2',
            'numero_serie'   => 'C02XYZ123',
            'color'          => 'GRIS',
            'bateria'        => '95',
            'ram'            => '8',
            'almacenamiento' => '256',
            'procedencia'    => self::PROCEDENCIA,
            'precio_costo'   => self::COSTO,
            'precio_venta'   => 6500,
            'estado'         => 'disponible',
            'condicion'      => 'Nuevo',
        ]);

        return CatalogoPublicacion::create([
            'producto_tipo' => 'computadora',
            'producto_id'   => $mac->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'MacBook Air M2 256 GB Gris',
            'slug'          => 'macbook-air-m2-256-gb-gris',
            'resumen'       => 'Equipo disponible.',
            'condicion'     => 'Nuevo',
            'categoria'     => 'computadoras',
        ]);
    }

    private function assertSinDatosSensibles(string $json): void
    {
        foreach ([self::IMEI_1, self::IMEI_2, 'imei', 'estado_imei', 'precio_costo', 'procedencia', 'IMPORTADORA SECRETA', '6123'] as $prohibido) {
            $this->assertStringNotContainsStringIgnoringCase($prohibido, $json, "Salió a lo público: {$prohibido}");
        }
    }

    public function test_la_api_publica_no_manda_imei_estado_del_imei_costo_ni_procedencia(): void
    {
        $celular = $this->celularPublicado();
        $mac = $this->computadoraPublicada();

        $listado = $this->getJson('/api/v1/products?per_page=100')->assertOk()->assertJsonPath('meta.total', 2);
        $this->assertSinDatosSensibles($listado->getContent());

        foreach ([$celular, $mac] as $pub) {
            $this->assertSinDatosSensibles($this->getJson("/api/v1/products/{$pub->slug}")->assertOk()->getContent());
        }

        $this->assertSinDatosSensibles($this->getJson('/api/v1/filters')->assertOk()->getContent());
        $this->assertSinDatosSensibles($this->getJson('/api/buscar?q=iphone')->assertOk()->getContent());
    }

    public function test_los_atributos_cargados_a_mano_no_sacan_datos_sensibles(): void
    {
        $pub = $this->celularPublicado([
            'IMEI'         => self::IMEI_1,
            'Estado IMEI'  => 'registrado',
            'Precio costo' => '6123',
            'Procedencia'  => self::PROCEDENCIA,
            'Código'       => self::IMEI_2,   // un IMEI con otro nombre
            'numero_serie' => 'F2LXK1ABCD',   // el número de serie sí puede mostrarse
        ]);

        $respuesta = $this->getJson("/api/v1/products/{$pub->slug}")
            ->assertOk()
            ->assertJsonPath('data.atributos.numero_serie', 'F2LXK1ABCD')
            ->assertJsonPath('data.atributos.capacidad', '256 GB');
        $this->assertSinDatosSensibles($respuesta->getContent());

        // La ficha de la tienda y el comparador tampoco los muestran
        $paginas = [
            $this->get("/productos/{$pub->slug}")->assertOk()->getContent(),
            $this->get('/comparar?slugs=' . $pub->slug)->assertOk()->getContent(),
        ];
        foreach ($paginas as $html) {
            foreach ([self::IMEI_1, self::IMEI_2, 'IMPORTADORA SECRETA', 'Estado IMEI', 'Precio costo'] as $prohibido) {
                $this->assertStringNotContainsString($prohibido, $html, "Salió a la tienda: {$prohibido}");
            }
        }
    }

    public function test_el_detalle_muestra_el_numero_de_serie_de_celulares_y_computadoras_pero_nunca_un_imei(): void
    {
        $celular = $this->celularPublicado();
        $mac = $this->computadoraPublicada();

        $this->getJson("/api/v1/products/{$celular->slug}")->assertOk()->assertJsonPath('data.numero_serie', 'F2LXK1ABCD');
        $this->getJson("/api/v1/products/{$mac->slug}")->assertOk()->assertJsonPath('data.numero_serie', 'C02XYZ123');
        $this->get("/productos/{$mac->slug}")->assertOk()->assertSee('C02XYZ123');

        // Un "número de serie" que en realidad es el IMEI no sale
        Celular::whereKey($celular->producto_id)->update(['numero_serie' => self::IMEI_1]);
        $respuesta = $this->getJson("/api/v1/products/{$celular->slug}")->assertOk()->assertJsonPath('data.numero_serie', null);
        $this->assertSinDatosSensibles($respuesta->getContent());
    }
}
