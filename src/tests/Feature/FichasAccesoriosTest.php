<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\ModeloReferencia;
use App\Models\ProductoGeneral;
use App\Support\FichaTecnica\EsquemaAccesorio;
use App\Support\InventarioCatalogo;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Base de accesorios (database/data/modelos_referencia/accesorios.php): esquema, cómo se reconoce cada accesorio por su
 * nombre en el inventario, la descripción que lleva la publicación y las comparativas de cargadores y vidrios.
 */
class FichasAccesoriosTest extends TestCase
{
    use RefreshDatabase;

    private int $codigo = 0;

    private function accesorio(string $nombre, float $precio = 300, string $tipo = 'cargador_20w'): ProductoGeneral
    {
        $this->codigo++;

        return ProductoGeneral::create([
            'codigo' => "ACC-{$this->codigo}", 'tipo' => $tipo, 'nombre' => $nombre, 'procedencia' => 'Proveedor secreto',
            'precio_costo' => 98765, 'precio_venta' => $precio, 'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);
    }

    private function fichas(): array
    {
        return collect(ModelosReferenciaSeeder::modelos())->where('tipo', 'producto_general')->values()->all();
    }

    public function test_todas_las_fichas_de_accesorios_estan_completas(): void
    {
        $fichas = $this->fichas();
        $this->assertGreaterThanOrEqual(50, count($fichas));

        foreach ($fichas as $ficha) {
            $this->assertSame([], ModelosReferenciaSeeder::revisar($ficha)[0], $ficha['nombre']);
        }
    }

    public function test_detecta_lo_que_no_cumple_el_esquema(): void
    {
        $ficha = collect($this->fichas())->firstWhere('slug', 'apple-adaptador-usb-c-20w');
        $ficha['datos']['ficha']['wattaje'] = '20 W';              // clave inventada
        $ficha['datos']['ficha']['potencia'] = '';                  // lo que no se sabe, no se escribe
        $ficha['datos']['sistema']['detectar'] = ['(cubo'];        // expresión rota
        $ficha['datos']['sistema']['forma'] = 'tostadora';
        $ficha['datos']['contenido']['resumen'] = 'Para {equipo}';

        $texto = implode(' ', EsquemaAccesorio::revisar($ficha)[0]);
        $this->assertStringContainsString('Clave desconocida: ficha.wattaje', $texto);
        $this->assertStringContainsString('ficha.potencia debe ser un texto', $texto);
        $this->assertStringContainsString('Expresión inválida', $texto);
        $this->assertStringContainsString('sistema.forma debe ser', $texto);
        $this->assertStringContainsString('Marca desconocida en el contenido: {equipo}', $texto);
    }

    public function test_reconoce_cada_accesorio_por_su_nombre_en_el_inventario(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $fichas = ModeloReferencia::delTipo('producto_general');

        $casos = [
            'CUBO 20 W ORIGINAL'                        => 'apple-adaptador-usb-c-20w',
            'CUBO 40 W ORIGINAL'                        => 'apple-adaptador-dinamico-40w',
            'CUBO DE 40W'                               => 'apple-adaptador-dinamico-40w',
            'CUBO CERTIFICADO APPLE 20 W POWER ADAPTER' => 'cargador-usb-c-20w-certificado',
            'CUBO 20W Calidad Origen'                   => 'cargador-usb-c-20w-certificado',
            'CUBO CERTIFICADO APPLE 25 W POWER ADAPTER' => 'cargador-usb-c-25w-certificado',
            'CUBO 35 W CALIDAD ORIGINAL'                => 'cargador-pared-35w',   // «calidad original» no es un original de Apple
            'CUBO 5W USB POWE ADAPTER'                  => 'cargador-usb-5w',
            'PROTECTOR CUBO 20W + PROTECTOR CABLE'      => 'protector-cubo-cable',
            'VIDRIO TEMPLADO'                           => 'vidrio-templado-tradicional',
            'Vidrio Templado IP 12/12PRO'               => 'vidrio-templado-tradicional',
            'VIDRIO TEMPLADO ANTIESPIA'                 => 'vidrio-templado-antiespia',
            'Vidrio Templado Anti-Glare IP 13 PRO'      => 'vidrio-templado-mate-antirreflejo',
            'Vidrio Templado AntiBlue light IP 13 PRO'  => 'vidrio-templado-luz-azul',
            'VIDRIO TEMPLADO GORILLA GLASS IP 15'       => 'vidrio-templado-gorilla-glass',
            'GLASS TR EZ FIT'                           => 'spigen-glastr-ez-fit',
            'VIDRIO TEMPLADO CAMARA IP 11 PRO'          => 'protector-camara',
            'Vidrio de Camara IP 13 MINI'               => 'protector-camara',
            'Vidrio Protecto IWach for 41 mm'           => 'protector-pantalla-apple-watch',
            'FUNDA MAGSFE IP 14 PRO'                    => 'funda-magsafe',
            'FUNDA_SILIC_7'                             => 'funda-silicona',
            'FUNDA DE DISEÑO IP 13'                     => 'funda-diseno',
            'FUNDA IPAD PRO + TECLADO'                  => 'funda-teclado-ipad-pro',
            'Cable USB C - to Lightning 1m'             => 'cable-usb-c-lightning-1m',
            'Cable Lightning to USB'                    => 'cable-lightning-usb',
            'Lighning to Headphone Jack'                => 'adaptador-lightning-3-5mm',
            'ALEXA ECHO DOT MAX'                        => 'amazon-echo-dot-max',
            'Alexa Echo Dot'                            => 'amazon-echo-dot',
            'PLAYSTATION PS5 WHITE CHROME CONTROLLER'   => 'sony-dualsense',
            'Rapoo Ralemo Pre 5 Wireless Keyboard DE Layout QWERTZ' => 'rapoo-ralemo-pre-5',
        ];
        foreach ($casos as $nombre => $slug) {
            $this->assertSame($slug, ModeloReferencia::detectarAccesorio($fichas, $nombre)?->slug, $nombre);
        }

        // Sin datos comprobables para una ficha: queda sin vincular
        $this->assertNull(ModeloReferencia::detectarAccesorio($fichas, 'Rayban Wayfarer'));
    }

    public function test_la_publicacion_de_un_accesorio_lleva_su_ficha_y_su_descripcion(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);

        $funda = $this->accesorio('FUNDA SILICONA IP 13 PRO', 60, 'funda');
        $pub = InventarioCatalogo::crear('producto_general', $funda, null, true);
        $this->assertSame('funda-silicona', $pub->modeloReferencia->slug);
        $this->assertSame('Funda', $pub->subcategoria);
        $this->assertSame('Funda de silicona para iPhone 13 Pro: suave al tacto, firme en la mano y con protección para el uso diario.', $pub->resumen);
        $this->assertStringContainsString('<li>Silicona suave al tacto</li>', $pub->descripcion);
        $this->assertStringNotContainsString('{modelo}', $pub->descripcion);
        $this->assertSame('Funda de silicona', $pub->que_incluye);
        $this->assertSame('Silicona', $pub->atributos['material']);
        $this->assertSame('iPhone 13 Pro', $pub->atributos['modelo_compatible']);
        $this->assertTrue($pub->publicado);   // la condición Nuevo viene del inventario

        // Un cable cargado como «cargador 20 W» no se presenta como cargador
        $cable = $this->accesorio('Cable USB C - to Lightning 1m', 130);
        $pub = InventarioCatalogo::crear('producto_general', $cable, null, false);
        $this->assertSame('Cable', $pub->subcategoria);
        $this->assertSame('Cable USB‑C a Lightning', $pub->atributos['tipo']);

        // Sin ficha: sale solo con el nombre, como hasta ahora
        $lentes = $this->accesorio('Rayban Wayfarer', 3000, 'otro');
        $pub = InventarioCatalogo::crear('producto_general', $lentes, null, false);
        $this->assertNull($pub->modelo_referencia_id);
        $this->assertNull($pub->descripcion);
        $this->assertSame('Accesorio', $pub->atributos['tipo']);

        // Nada interno: ni costo ni procedencia
        $json = json_encode(CatalogoPublicacion::all()->toArray());
        $this->assertStringNotContainsString('Proveedor secreto', $json);
        $this->assertStringNotContainsString('98765', $json);
    }

    public function test_el_cargador_original_se_publica_con_los_datos_de_apple_e_invita_a_comparar(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $cubo = $this->accesorio('CUBO 20 W ORIGINAL', 300);
        $pub = InventarioCatalogo::crear('producto_general', $cubo, null, true);

        $this->assertSame('20 W', $pub->atributos['potencia']);
        $this->assertStringContainsString('35 minutos', $pub->atributos['carga_rapida']);
        $this->assertArrayNotHasKey('pruebas', $pub->atributos);   // solo para comparar
        $this->assertArrayNotHasKey('normas', $pub->atributos);
        $this->assertArrayNotHasKey('modelo_compatible', $pub->atributos);

        $this->get(route('store.product', $pub->slug))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('product.comparar_modelo.titulo', '¿Original o certificado?')
            ->where('product.comparar_modelo.url', route('store.compare.modelos', [
                'familia' => 'cargadores', 'modelos' => 'apple-adaptador-usb-c-20w,cargador-usb-c-20w-certificado,apple-adaptador-dinamico-40w',
            ]))
            ->where('product.visual.forma', 'cargador')
            ->where('product.visual.etiqueta', '20W'));
    }

    public function test_la_comparativa_de_cargadores_compara_el_original_con_el_certificado(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $cubo = $this->accesorio('CUBO 20 W ORIGINAL', 300);
        $this->accesorio('CUBO 20 W ORIGINAL', 300);
        $this->accesorio('CUBO 20 W ORIGINAL', 300);
        InventarioCatalogo::crear('producto_general', $cubo, null, true);

        $this->get('/comparar/cargadores')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Store/CompararModelos')
            ->where('familia.tipo', 'producto_general')
            ->where('familia.titulo', 'Compara cargadores')
            ->where('seleccion.0.slug', 'apple-adaptador-usb-c-20w')
            ->where('seleccion.1.slug', 'cargador-usb-c-20w-certificado')
            ->where('seleccion.2.slug', 'apple-adaptador-dinamico-40w')
            ->where('seleccion.0.oferta.unidades', 3)          // las unidades del artículo, no las publicaciones
            ->where('seleccion.0.specs.fabricante', 'Apple (original)')
            ->where('seleccion.1.specs.fabricante', 'Otra marca (no es de Apple)')
            ->where('seleccion.1.oferta', null)
            ->where('opciones', fn ($opciones) => collect($opciones)->every(fn ($o) => ! str_contains($o['slug'], 'vidrio'))));
    }

    public function test_la_comparativa_de_vidrios_compara_gorilla_glass_con_el_tradicional(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);

        $this->get('/comparar/vidrios')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('seleccion.0.slug', 'vidrio-templado-gorilla-glass')
            ->where('seleccion.1.slug', 'vidrio-templado-tradicional')
            ->where('seleccion.0.specs.material', 'Vidrio de aluminosilicato Corning Gorilla Glass')
            ->where('seleccion.1.specs.material', 'Vidrio templado común')
            // El protector de cámara no es un vidrio de pantalla: no entra en esta comparativa
            ->where('opciones', fn ($opciones) => collect($opciones)->doesntContain('slug', 'protector-camara')));
    }

    public function test_el_importador_dice_con_que_ficha_se_publica_cada_accesorio(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $this->accesorio('CUBO 40 W ORIGINAL', 400);
        $this->accesorio('Rayban Wayfarer', 3000, 'otro');

        $pendientes = collect(InventarioCatalogo::pendientes()['producto_general']);
        $this->assertSame('Adaptador de corriente dinámico de 40 W de Apple', $pendientes->firstWhere('titulo', 'Cubo 40 W Original')['ficha']);
        $this->assertNull($pendientes->firstWhere('titulo', 'Rayban Wayfarer')['ficha']);
    }

    public function test_si_el_accesorio_se_vende_su_ficha_queda(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $cubo = $this->accesorio('CUBO 40 W ORIGINAL', 400);
        InventarioCatalogo::crear('producto_general', $cubo, null, true);
        $cubo->update(['estado' => 'vendido']);

        $this->seed(ModelosReferenciaSeeder::class);   // volver a cargar la base no borra nada
        $this->assertTrue(ModeloReferencia::where('slug', 'apple-adaptador-dinamico-40w')->exists());
        $this->get('/comparar/cargadores')->assertInertia(fn (Assert $page) => $page
            ->where('seleccion.2.slug', 'apple-adaptador-dinamico-40w')
            ->where('seleccion.2.oferta', null));
    }
}
