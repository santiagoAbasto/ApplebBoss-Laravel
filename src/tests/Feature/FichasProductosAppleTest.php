<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\ModeloReferencia;
use App\Models\ProductoApple;
use App\Support\FichaTecnica\EsquemaProductoApple;
use App\Support\InventarioCatalogo;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Base de productos Apple (database/data/modelos_referencia/productos_apple.php): iPad, Apple Watch, AirPods, Apple Pencil
 * y Magic Mouse. Esquema, cómo se reconoce cada producto por su nombre en el inventario, la publicación con su ficha y su
 * descripción, y la ficha pública con un ícono propio por dato.
 */
class FichasProductosAppleTest extends TestCase
{
    use RefreshDatabase;

    private function producto(string $modelo, array $datos = []): ProductoApple
    {
        return ProductoApple::create([
            'modelo' => $modelo, 'capacidad' => '-', 'bateria' => '100', 'color' => 'BLANCO', 'procedencia' => 'Proveedor secreto',
            'numero_serie' => 'SERIE123', 'precio_costo' => 98765, 'precio_venta' => 1500, 'tiene_imei' => false,
            'estado' => 'disponible', 'condicion' => 'Nuevo', ...$datos,
        ]);
    }

    private function fichas(): array
    {
        return collect(ModelosReferenciaSeeder::modelos())->where('tipo', 'producto_apple')->values()->all();
    }

    public function test_todas_las_fichas_de_productos_apple_estan_completas_y_con_su_fuente(): void
    {
        $fichas = $this->fichas();
        $this->assertGreaterThanOrEqual(29, count($fichas));

        foreach ($fichas as $ficha) {
            $this->assertSame([], ModelosReferenciaSeeder::revisar($ficha)[0], $ficha['nombre']);
        }
        // Los iPad de la tienda son Wi‑Fi, salvo un iPad Pro de 11 pulgadas (M5) Wi‑Fi + Cellular
        $this->assertSame(['ipad-pro-11-m5-wifi-cellular'], collect($fichas)->where('familia', 'ipad')
            ->filter(fn ($f) => $f['datos']['sistema']['celular'] === true)->pluck('slug')->values()->all());

        // Todos los iPad dicen con qué iPadOS salieron (Wikipedia y everymac.com coinciden en la versión principal)
        foreach (collect($fichas)->where('familia', 'ipad') as $ipad) {
            $this->assertMatchesRegularExpression('/^iPadOS \d+$/', $ipad['datos']['ficha']['lanzamiento_so'] ?? '', $ipad['nombre']);
        }
        $this->assertSame('iPadOS 17', collect($fichas)->firstWhere('slug', 'ipad-pro-11-m4-wifi')['datos']['ficha']['lanzamiento_so']);
        $this->assertSame('iPadOS 26', collect($fichas)->firstWhere('slug', 'ipad-pro-11-m5-wifi-cellular')['datos']['ficha']['lanzamiento_so']);

        // El generador no escribe una ficha sin su fuente (FUENTES, con la página de Apple de cada una)
        $generador = file_get_contents(database_path('data/modelos_referencia/herramientas/generar_productos_apple.py'));
        $this->assertStringContainsString("assert m['slug'] in FUENTES", $generador);
    }

    public function test_detecta_lo_que_no_cumple_el_esquema(): void
    {
        $ficha = collect($this->fichas())->firstWhere('slug', 'airpods-pro-3');
        $ficha['datos']['ficha']['bateria_mah'] = '500 mAh';       // clave inventada
        $ficha['datos']['ficha']['chip'] = '';                      // lo que no se sabe, no se escribe
        $ficha['datos']['sistema']['celular'] = 'si';
        $ficha['datos']['sistema']['forma'] = 'tostadora';
        $ficha['datos']['visual'] = ['variante' => 'gigantes'];
        $ficha['datos']['contenido']['resumen'] = 'Para {modelo}';

        $texto = implode(' ', EsquemaProductoApple::revisar($ficha)[0]);
        $this->assertStringContainsString('Clave desconocida: ficha.bateria_mah', $texto);
        $this->assertStringContainsString('ficha.chip debe ser un texto', $texto);
        $this->assertStringContainsString('sistema.celular debe ser bool|null', $texto);
        $this->assertStringContainsString('sistema.forma debe ser', $texto);
        $this->assertStringContainsString('visual debe ser', $texto);
        $this->assertStringContainsString('no lleva marcas: {modelo}', $texto);
    }

    public function test_reconoce_cada_producto_por_su_nombre_en_el_inventario(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $fichas = ModeloReferencia::delTipo('producto_apple');

        // Nombres reales del inventario; null: el nombre no alcanza y la ficha la elige quien publica
        $casos = [
            'IPAD A16'                      => 'ipad-a16-wifi',
            'IPAD A16 WIFI'                 => 'ipad-a16-wifi',
            'IPAD A16 LTE'                  => null,   // sin ficha Wi‑Fi + Cellular del A16, no toma la Wi‑Fi
            'IPAD MINI 7MA GEN.'            => 'ipad-mini-a17-pro-wifi',
            'IPAD MINI A17 PRO'             => 'ipad-mini-a17-pro-wifi',
            'IPAD AIR 13 M4'                => 'ipad-air-13-m4-wifi',
            'IPAD AIR CHIP M4'              => null,   // ¿de 11 o de 13 pulgadas?
            'IPAD PRO M5'                   => null,   // ¿de 11 o de 13 pulgadas?
            'IPAD PRO M4 + PENCIL'          => null,
            'IPAD PRO 11 M4'                => 'ipad-pro-11-m4-wifi',
            'IPAD PRO 13 M5'                => 'ipad-pro-13-m5-wifi',
            'IPAD PRO M5 11 INCH'           => 'ipad-pro-11-m5-wifi',
            'IPAD PRO M5 11 INCH + LTE'     => 'ipad-pro-11-m5-wifi-cellular',
            'IPAD AIR M4 11 INCH'           => 'ipad-air-11-m4-wifi',
            'APPLE WATCH SERIES 10 46MM + LTE' => 'apple-watch-series-10-46-aluminio-gps-cellular',
            'IWATCH SERIE 10 DE 46MM'       => 'apple-watch-series-10-46-aluminio-gps',
            'IWATCH SERIE 10 DE 46MM + LTE' => 'apple-watch-series-10-46-aluminio-gps-cellular',
            'IWATCH SERIES 10 46MM CON LTE' => 'apple-watch-series-10-46-aluminio-gps-cellular',
            'AIRPODS PRO 3RA GEN'           => 'airpods-pro-3',
            'AIRPODS PRO 3 GEN'             => 'airpods-pro-3',
            'AIRPODS PRO 2DA GEN.'          => null,   // ¿estuche USB‑C o Lightning?
            'AIRPODS PRO 2 USB C'           => 'airpods-pro-2-usb-c',
            'AIRPODS PRO 2DA GEN LIGHTNING' => 'airpods-pro-2-lightning',
            'AIRPODS 4TA GEN'               => 'airpods-4',
            'AIRPODS 4 ANC'                 => 'airpods-4-anc',
            'AIRPODS 1RA GEN.'              => 'airpods-1',
            'AIRPODS MAX 2 TYPE C'          => 'airpods-max-2',
            'PENCIL USB C'                  => 'apple-pencil-usb-c',
            'APPLE PENCIL USB - C'          => 'apple-pencil-usb-c',
            'PENCIL PRO'                    => 'apple-pencil-pro',
            'PENCIL 2DA GEN'                => 'apple-pencil-2',
            'APPLE PENCIL 2DA GEN.'         => 'apple-pencil-2',
            'MAGIC MOUSE'                   => null,   // ¿USB‑C o Lightning?
            'MAGIC MOUSE - LIGTHNING'       => 'magic-mouse-lightning',   // con el error de tipeo del inventario
            'AIRPODS MAX 2 USB-C'           => 'airpods-max-2',
            'APPLE PENCIL USB-C'            => 'apple-pencil-usb-c',
            // Otras marcas cargadas en «Productos Apple»: casos puntuales con su ficha
            'SAMSUNG GALAXY TAB S9 ULTRA'   => 'samsung-galaxy-tab-s9-ultra-wifi',
            'TORRAS COOLITE VENTILADOR PORTÁTIL DE CUELLO' => 'torras-coolite-fg2',
            'K&F CONCEPT MONITOR PORTÁTIL 5" M5'   => 'kf-concept-m5',
            'GALAXY TAB S9 ULTRA'           => 'samsung-galaxy-tab-s9-ultra-wifi',
        ];
        foreach ($casos as $nombre => $slug) {
            $equipo = new ProductoApple(['modelo' => $nombre, 'tiene_imei' => false]);
            $this->assertSame($slug, ModeloReferencia::deInventario('producto_apple', $equipo, $fichas)?->slug, $nombre);
        }

        // La Galaxy Tab S10 Lite de la tienda es 5G (tiene IMEI)
        $tab = new ProductoApple(['modelo' => 'SAMSUNG GALAXY TAB S10 LITE 5G', 'tiene_imei' => true]);
        $this->assertSame('samsung-galaxy-tab-s10-lite-5g', ModeloReferencia::deInventario('producto_apple', $tab, $fichas)?->slug);

        // Un Apple Watch con IMEI en el inventario es GPS + Cellular aunque el nombre no lo diga
        $conImei = new ProductoApple(['modelo' => 'IWATCH SERIE 10 DE 46MM', 'tiene_imei' => true]);
        $this->assertSame('apple-watch-series-10-46-aluminio-gps-cellular', ModeloReferencia::deInventario('producto_apple', $conImei, $fichas)?->slug);
    }

    public function test_la_publicacion_lleva_su_ficha_su_descripcion_y_lo_que_trae_la_caja_solo_si_es_nuevo(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);

        $ipad = $this->producto('IPAD A16', ['capacidad' => '128 GB', 'color' => 'BLUE']);
        $pub = InventarioCatalogo::crear('producto_apple', $ipad, null, true);

        $this->assertSame('ipad-a16-wifi', $pub->modeloReferencia->slug);
        $this->assertSame('A16', $pub->atributos['chip']);
        $this->assertSame('128 GB', $pub->atributos['capacidad']);
        $this->assertSame('Azul', $pub->atributos['color']);                 // «BLUE» con el nombre oficial de Apple
        $this->assertEquals(10, $pub->atributos['autonomia_video_horas']);  // para estimar con la salud de la batería
        $this->assertStringContainsString('<p>', $pub->descripcion);
        $this->assertStringContainsString('Adaptador de corriente USB‑C de 20 W', $pub->que_incluye);
        $this->assertNotEmpty($pub->resumen);

        // Un seminuevo no promete lo que trae la caja de Apple
        $reloj = $this->producto('IWATCH SERIE 10 DE 46MM + LTE', ['capacidad' => '64 GB', 'color' => 'NEGRO', 'condicion' => 'Seminuevo']);
        $pub = InventarioCatalogo::crear('producto_apple', $reloj, null, true);
        $this->assertSame('apple-watch-series-10-46-aluminio-gps-cellular', $pub->modeloReferencia->slug);
        $this->assertNull($pub->que_incluye);
        $this->assertSame('Negro azabache', $pub->atributos['color']);
        $this->assertStringContainsString('no están disponibles en Bolivia', $pub->atributos['salud']);

        // Sin ficha: sale como hasta ahora, con los datos de la unidad
        $mouse = $this->producto('MAGIC MOUSE');
        $pub = InventarioCatalogo::crear('producto_apple', $mouse, null, false);
        $this->assertNull($pub->modelo_referencia_id);
        $this->assertNull($pub->descripcion);

        // Nada interno: ni costo ni procedencia
        $json = json_encode(CatalogoPublicacion::all()->toArray());
        $this->assertStringNotContainsString('Proveedor secreto', $json);
        $this->assertStringNotContainsString('98765', $json);
    }

    public function test_la_tienda_dibuja_el_producto_por_su_forma_mientras_no_tenga_foto(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $pub = InventarioCatalogo::crear('producto_apple', $this->producto('AIRPODS PRO 3RA GEN'), null, true);

        $this->get("/productos/{$pub->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('product.visual.forma', 'audifonos')
                ->where('product.visual.variante', 'pro')
                ->where('product.atributos.chip', 'H2 de Apple · chip de banda ultraancha de segunda generación en el estuche'));
    }

    public function test_el_importador_dice_con_que_ficha_se_publica_cada_producto(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $this->producto('AIRPODS 4TA GEN');
        $this->producto('MAGIC MOUSE');

        $pendientes = collect(InventarioCatalogo::pendientes()['producto_apple']);
        $this->assertSame('AirPods 4', $pendientes->first(fn ($i) => str_starts_with($i['titulo'], 'AirPods 4ta Gen'))['ficha']);
        $this->assertNull($pendientes->first(fn ($i) => str_starts_with($i['titulo'], 'Magic Mouse'))['ficha']);
    }

    public function test_cada_dato_de_la_ficha_tiene_su_campo_y_su_propio_icono(): void
    {
        $jsx = file_get_contents(resource_path('js/Components/Store/fichaTecnica.jsx'));
        $inicio = strpos($jsx, 'producto_apple: [');
        $bloque = substr($jsx, $inicio, strpos($jsx, 'producto_general: [') - $inicio);
        preg_match_all("/c\\('([a-z_]+)', '[^']*', '[^']*', (\\w+)/u", $bloque, $m, PREG_SET_ORDER);
        $campos = collect($m)->mapWithKeys(fn ($x) => [$x[1] => $x[2]])->all();

        $claves = collect($this->fichas())
            ->flatMap(fn ($modelo) => array_keys(ModelosReferenciaSeeder::textos($modelo)))
            ->reject(fn ($clave) => in_array($clave, ModeloReferencia::CAMPOS_SOLO_COMPARATIVA, true))
            ->merge(EsquemaProductoApple::FICHA)
            ->unique();
        foreach ($claves as $clave) {
            $this->assertArrayHasKey($clave, $campos, "La ficha del producto Apple no muestra «{$clave}».");
        }

        $repetidos = array_keys(array_filter(array_count_values($campos), fn ($n) => $n > 1));
        $this->assertSame([], $repetidos, 'Íconos repetidos en los productos Apple: ' . implode(', ', $repetidos));
        $iconos = file_get_contents(resource_path('js/Components/Store/Icons.jsx'));
        foreach (array_unique($campos) as $icono) {
            $this->assertMatchesRegularExpression("/export const {$icono}\\b/", $iconos, "Falta el ícono {$icono}.");
        }
    }

    public function test_la_comparativa_de_productos_apple_compara_hasta_cuatro_con_su_precio(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $pub = InventarioCatalogo::crear('producto_apple', $this->producto('IPAD A16', ['capacidad' => '128 GB', 'color' => 'BLUE', 'precio_venta' => 3990]), null, true);

        // Al entrar: los iPad que indica la comparativa, con el precio y el stock de la tienda
        $this->get('/comparar/apple')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/CompararModelos')
                ->where('familia.tipo', 'producto_apple')
                ->where('familia.base', null)
                ->where('maximo', 4)
                ->where('seleccion.0.slug', 'ipad-a16-wifi')
                ->where('seleccion.0.oferta.desde', 3990)
                ->where('seleccion.0.visual.forma', 'tablet')
                ->where('seleccion.0.specs.colores_disponibles', ['Plata', 'Azul', 'Rosa', 'Amarillo'])
                // El selector los agrupa por tipo, en orden
                ->where('opciones', fn ($opciones) => collect($opciones)->pluck('grupo')->unique()->values()->all()
                    === ['iPad', 'Apple Watch', 'AirPods', 'Accesorios Apple']));

        // Se eligen hasta 4, de cualquier tipo
        $this->get('/comparar/apple?modelos=airpods-pro-3,airpods-4,airpods-max-2,apple-watch-series-10-46-aluminio-gps,ipad-a16-wifi')
            ->assertInertia(fn (Assert $page) => $page
                ->has('seleccion', 4)
                ->where('seleccion.0.specs.cancelacion_ruido', 'Cancelación Activa de Ruido · Audio Adaptativo · Modo Ambiente · Reconocimiento de Conversación')
                ->where('seleccion.3.etiqueta', 'Apple Watch'));

        // La ficha del producto invita a comparar
        $this->get("/productos/{$pub->slug}")
            ->assertInertia(fn (Assert $page) => $page->where('product.comparar_modelo.url', route('store.compare.modelos', ['familia' => 'apple', 'modelos' => 'ipad-a16-wifi,ipad-mini-a17-pro-wifi,ipad-air-11-m4-wifi'])));

        // Nada interno en la comparativa
        $this->get('/comparar/apple')->assertDontSee('98765')->assertDontSee('Proveedor secreto');

        // Los productos de otras marcas tienen ficha, pero no entran en la comparativa ni invitan a comparar
        $this->get('/comparar/apple?modelos=samsung-galaxy-tab-s9-ultra-wifi,ipad-a16-wifi')
            ->assertInertia(fn (Assert $page) => $page
                ->has('seleccion', 1)
                ->where('seleccion.0.slug', 'ipad-a16-wifi')
                ->where('opciones', fn ($opciones) => collect($opciones)->pluck('grupo')->doesntContain('Otras marcas')));
        $samsung = InventarioCatalogo::crear('producto_apple', $this->producto('SAMSUNG GALAXY TAB S9 ULTRA', ['capacidad' => '256 GB', 'color' => 'NEGRO']), null, true);
        $this->assertSame('Samsung', $samsung->atributos['fabricante']);
        $this->get("/productos/{$samsung->slug}")->assertInertia(fn (Assert $page) => $page->where('product.comparar_modelo', null));
    }

    public function test_si_el_producto_se_vende_su_ficha_queda(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $airpods = $this->producto('AIRPODS 4TA GEN');
        InventarioCatalogo::crear('producto_apple', $airpods, null, true);
        $airpods->update(['estado' => 'vendido']);

        $this->seed(ModelosReferenciaSeeder::class);
        $this->assertTrue(ModeloReferencia::where('slug', 'airpods-4')->exists());
    }
}
