<?php

namespace Tests\Feature;

use App\Models\ModeloReferencia;
use App\Support\FichaTecnica\EsquemaComputadora;
use App\Support\FichaTecnica\TextosComputadora;
use App\Support\InventarioCatalogo;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Fichas de Mac (database/data/modelos_referencia/computadora.php): esquema, textos y cómo se reconocen en el inventario. */
class EsquemaFichaComputadoraTest extends TestCase
{
    use RefreshDatabase;

    private function modelo(string $slug): array
    {
        return collect(ModelosReferenciaSeeder::modelos())->firstWhere('slug', $slug);
    }

    /** Un equipo del inventario (solo lo que se usa para reconocerlo). */
    private function equipo(string $nombre, string $procesador, string $ram, string $almacenamiento, string $color = 'PLATA'): object
    {
        return (object) compact('nombre', 'procesador', 'ram', 'almacenamiento', 'color');
    }

    public function test_todas_las_fichas_de_mac_estan_completas(): void
    {
        $macs = array_filter(ModelosReferenciaSeeder::modelos(), fn ($m) => $m['tipo'] === 'computadora' && $m['familia'] === 'mac');
        $this->assertCount(16, $macs);

        foreach ($macs as $modelo) {
            [$errores, $pendientes] = EsquemaComputadora::revisar($modelo);
            $this->assertSame([], $errores, "{$modelo['nombre']}: " . implode(' ', $errores));
            $this->assertSame([], array_diff($pendientes, EsquemaComputadora::PENDIENTES_PERMITIDOS), $modelo['nombre']);
        }
        // Lo único que espera fuente: el identificador del MacBook Neo, que Apple todavía no lista
        $this->assertSame(['sistema.identificador'], array_column($this->modelo('macbook-neo')['pendientes'], 'campo'));
    }

    public function test_detecta_errores_de_tipo_y_datos_que_se_contradicen(): void
    {
        $air = $this->modelo('macbook-air-13-m3-2024');
        $air['datos']['bateria']['wh'] = false;                     // una portátil sin batería
        $air['datos']['rendimiento']['ram_gb'] = [16, 8];            // opciones desordenadas
        $air['datos']['entrada']['touch_bar'] = true;                // Touch Bar en una Mac con chip de Apple
        $air['datos']['diseno']['peso_kg'] = 12.4;                   // error de tipeo
        $air['datos']['pantalla']['pulgadones'] = 13;                // clave inventada

        $texto = implode(' ', EsquemaComputadora::revisar($air)[0]);
        $this->assertStringContainsString('Una portátil necesita batería', $texto);
        $this->assertStringContainsString('rendimiento.ram_gb debe ir de menor a mayor', $texto);
        $this->assertStringContainsString('La Touch Bar solo existió en MacBook Pro con Intel', $texto);
        $this->assertStringContainsString('diseno.peso_kg = 12.4 está fuera de rango', $texto);
        $this->assertStringContainsString('Clave desconocida: pantalla.pulgadones', $texto);

        $intel = $this->modelo('macbook-pro-13-2019-dos-puertos');
        $intel['datos']['rendimiento']['apple_intelligence'] = true;
        $this->assertContains('Una Mac con Intel no tiene Neural Engine ni Apple Intelligence.', EsquemaComputadora::revisar($intel)[0]);
    }

    public function test_los_textos_salen_de_los_datos_oficiales(): void
    {
        $air = TextosComputadora::desde($this->modelo('macbook-air-13-m3-2024')['datos']);
        $this->assertSame('13,6 pulgadas', $air['tamano_pantalla']);
        $this->assertSame('2.560 × 1.664 px a 224 ppi', $air['resolucion']);
        $this->assertSame('8 o 10 núcleos, según la configuración · Trazado de rayos por hardware', $air['gpu_cores']);
        $this->assertSame('Hasta 18 h de reproducción de video en la app Apple TV (15 h de navegación web)', $air['autonomia']);
        $this->assertSame('30,41 × 21,5 cm · 1,13 cm de grosor', $air['dimensiones']);
        $this->assertSame(['8 GB', '16 GB', '24 GB'], $air['memorias_disponibles']);
        $this->assertSame('macOS 27 Golden Gate', $air['ultimo_so']);
        $this->assertArrayNotHasKey('tasa_refresco', $air);          // sin ProMotion: la comparativa dice «Sin ProMotion»

        $pro = TextosComputadora::desde($this->modelo('macbook-pro-14-m5-pro')['datos']);
        $this->assertSame('ProMotion, adaptativa hasta 120 Hz', $pro['tasa_refresco']);
        $this->assertSame('1.000 nits constantes en XDR y 1.600 de pico en HDR · SDR de hasta 1.000 nits', $pro['brillo']);
        $this->assertSame(['1 TB', '2 TB', '4 TB'], $pro['almacenamientos_disponibles']);

        $imac = TextosComputadora::desde($this->modelo('imac-24-2024-dos-puertos')['datos']);
        $this->assertSame('24 pulgadas (23,5 en diagonal)', $imac['tamano_pantalla']);
        $this->assertSame('54,7 cm de ancho × 46,1 cm de alto · base de 13 × 14,7 cm', $imac['dimensiones']);
        $this->assertArrayNotHasKey('autonomia', $imac);             // de escritorio: sin batería

        $intel = TextosComputadora::desde($this->modelo('macbook-pro-13-2019-dos-puertos')['datos']);
        $this->assertSame('macOS Sequoia 15', $intel['ultimo_so']);
        $this->assertSame('MacBookPro15,4 · número de modelo A2159', $intel['modelo']);
        $this->assertArrayNotHasKey('neural_engine', $intel);
        $this->assertArrayNotHasKey('apple_intelligence', $intel);
    }

    public function test_reconoce_las_mac_del_inventario_solo_cuando_no_hay_dudas(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $de = fn (object $equipo) => ModeloReferencia::deInventario('computadora', $equipo)?->slug;

        $this->assertSame('macbook-air-13-m3-2024', $de($this->equipo('MACBOOK AIR 13"', 'M3', '8', '256 GB')));
        $this->assertSame('macbook-air-15-m5', $de($this->equipo('MACBOOK AIR', 'M5 15"', '16 RAM', '512 GB')));
        $this->assertSame('macbook-air-15-m5', $de($this->equipo('MACBOOK AIR 15 PULGADAS', 'CHIP M5', '24 GB', '512 GB')));
        $this->assertSame('macbook-pro-14-m5', $de($this->equipo('MACBOOK PRO CHIP M5', 'CHIP M5 NORMAL', '16 RAM', '1 TB')));
        $this->assertSame('macbook-pro-14-m5-pro', $de($this->equipo('MACBOOK PRO 14 INCH', 'CHIP M5 PRO', '24 GB', '1 TB')));
        $this->assertSame('macbook-neo', $de($this->equipo('MACBOOK NEO 13 INCH', 'A18 PRO', '8', '256 GB')));
        $this->assertSame('macbook-12-2017', $de($this->equipo('MACBOOK RETINA 2017', 'iCORE i5', '8', '512 GB')));
        $this->assertSame('macbook-pro-13-2019-dos-puertos', $de($this->equipo('MACBOOK PRO 2019 DE 13 INCH', 'I5 DE 4 NUCLEOS', '16 RAM', '512 GB')));
        $this->assertSame('macbook-air-13-2014', $de($this->equipo('MACBOOK AIR 13 INCH', 'INTEL I7 DE 1.7 GZH DUAL CORE', '8 GB', '256 GB')));

        // Con dudas, lo elige el admin: sin pulgadas, dos variantes de iMac o una configuración que el modelo no tuvo
        $this->assertNull($de($this->equipo('MACBOOK PRO', 'M3 PRO', '18', '512')));
        $this->assertNull($de($this->equipo('MACBOOK AIR', 'M5', '24 RAM', '512 GB')));
        $this->assertNull($de($this->equipo('IMAC 24 PULGADAS', 'M4', '16 RAM', '256 GB')));
        $this->assertNull($de($this->equipo('MACBOOK PRO', 'M5 PRO', '24 GB', '512 GB')));   // el M5 Pro no se vende con 512 GB
        $this->assertNull($de($this->equipo('ACER NITRO V15', 'I5', '16', '512 GB')));   // una PC sin ficha
    }

    public function test_la_publicacion_lleva_el_chip_la_memoria_y_el_color_con_su_nombre_oficial(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);

        $equipo = $this->equipo('MACBOOK AIR 13 INCH', 'INTEL I7 DE 1.7 GZH DUAL CORE', '8 GB', '256 GB', 'BLANCO');
        $modelo = ModeloReferencia::deInventario('computadora', $equipo);
        $a = InventarioCatalogo::atributos('computadora', $equipo, $modelo);
        $this->assertSame('Intel Core i7 de doble núcleo a 1.7 GHz (Turbo Boost hasta 3.3 GHz)', $a['chip']);
        $this->assertSame('8 GB LPDDR3 a 1600 MHz', $a['ram']);
        $this->assertSame('Blanco', $a['color']);                   // su ficha no lista colores: queda el del inventario

        $air = $this->equipo('MACBOOK AIR 13"', 'M3', '8', '256 GB', 'GRIS');
        $a = InventarioCatalogo::atributos('computadora', $air, ModeloReferencia::deInventario('computadora', $air));
        $this->assertSame(['Apple M3', '8 GB de memoria unificada', '256 GB', 'Gris espacial'], [$a['chip'], $a['ram'], $a['almacenamiento'], $a['color']]);

        $pro = $this->equipo('MACBOOK PRO 14 INCH', 'CHIP M5 PRO', '24 GB', '1 TB', 'SPACE BLACK');
        $this->assertSame('Negro espacial', InventarioCatalogo::atributos('computadora', $pro, ModeloReferencia::deInventario('computadora', $pro))['color']);

        // La ficha copiada a la publicación: Apple Intelligence «No compatible» en las Intel; nada de opciones del modelo
        $ficha = ModeloReferencia::where('slug', 'macbook-pro-13-2017-dos-puertos')->first()->fichaParaPublicacion();
        $this->assertSame('No compatible', $ficha['apple_intelligence']);
        $this->assertArrayNotHasKey('memorias_disponibles', $ficha);
        $this->assertArrayNotHasKey('colores_disponibles', $ficha);
        $this->assertSame(10.0, ModeloReferencia::where('slug', 'macbook-pro-13-2017-dos-puertos')->first()->autonomia_video_horas);
        $this->assertNull(ModeloReferencia::where('slug', 'imac-24-2024-dos-puertos')->first()->autonomia_video_horas);
    }
}
