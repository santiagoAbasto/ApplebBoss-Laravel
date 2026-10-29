<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Support\Seo\SeoProducto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** El SEO profesional por producto: título y descripción a medida, y el comando que los escribe en la base. */
class SeoProductoTest extends TestCase
{
    use RefreshDatabase;

    private function publicar(array $pub = [], array $cel = []): CatalogoPublicacion
    {
        $celular = Celular::create(array_merge([
            'modelo' => 'iPhone 15', 'capacidad' => '128 GB', 'color' => 'Azul',
            'imei_1' => fake()->unique()->numerify('###############'), 'estado_imei' => 'libre',
            'procedencia' => 'EEUU', 'precio_costo' => 5000, 'precio_venta' => 6500,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ], $cel));

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular', 'producto_id' => $celular->id,
            'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => 'iPhone 15 128 GB Azul', 'slug' => 'iphone-15-128gb-azul', 'resumen' => 'Disponible.',
            'condicion' => 'Nuevo', 'categoria' => 'celulares',
            'atributos' => ['chip' => 'A16 Bionic', 'sistema_camaras' => '48 MP · gran angular'],
        ], $pub));
    }

    public function test_el_titulo_lleva_el_producto_y_la_marca_y_no_se_pasa_de_largo(): void
    {
        $t = SeoProducto::titulo($this->publicar());
        $this->assertStringContainsString('iPhone 15 128 GB Azul', $t);
        $this->assertStringContainsString('Apple Boss', $t);
        $this->assertLessThanOrEqual(60, mb_strlen($t));
    }

    public function test_un_seminuevo_lo_dice_en_el_titulo_y_la_descripcion(): void
    {
        $pub = $this->publicar(['condicion' => 'Seminuevo'], ['condicion' => 'Seminuevo']);
        $this->assertStringContainsString('seminuevo', mb_strtolower(SeoProducto::titulo($pub)));
        $this->assertStringContainsString('seminuevo', mb_strtolower(SeoProducto::descripcion($pub)));
    }

    public function test_la_descripcion_usa_las_specs_reales_y_no_lleva_precio(): void
    {
        $d = SeoProducto::descripcion($this->publicar());
        $this->assertStringContainsString('A16 Bionic', $d);
        $this->assertStringContainsString('Cochabamba', $d);
        $this->assertDoesNotMatchRegularExpression('/Bs\s*\d|\$us|bolivianos/ui', $d, 'el SEO guardado no debe llevar precio (ese cambia)');
        $this->assertLessThanOrEqual(160, mb_strlen($d));
    }

    public function test_el_comando_completa_lo_vacio_y_respeta_lo_escrito_a_mano(): void
    {
        $auto = $this->publicar();
        $aMano = $this->publicar(
            ['titulo' => 'iPhone 15 256 GB Negro', 'slug' => 'iphone-15-256gb-negro', 'seo_title' => 'Mi título', 'seo_description' => 'Mi descripción'],
            ['capacidad' => '256 GB', 'color' => 'Negro'],
        );

        $this->artisan('seo:generar-productos')->assertSuccessful();

        $this->assertNotEmpty($auto->refresh()->seo_title);
        $this->assertNotEmpty($auto->seo_description);
        $this->assertSame('Mi título', $aMano->refresh()->seo_title, 'no pisa el SEO escrito a mano');

        // --forzar sí lo regenera
        $this->artisan('seo:generar-productos --forzar')->assertSuccessful();
        $this->assertNotSame('Mi título', $aMano->refresh()->seo_title);
    }
}
