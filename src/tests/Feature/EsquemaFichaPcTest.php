<?php

namespace Tests\Feature;

use App\Models\ModeloReferencia;
use App\Support\FichaTecnica\EsquemaPc;
use App\Support\FichaTecnica\TextosPc;
use App\Support\InventarioCatalogo;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Fichas de laptops con Windows (database/data/modelos_referencia/pc.php): esquema, textos y cómo se reconocen en el inventario. */
class EsquemaFichaPcTest extends TestCase
{
    use RefreshDatabase;

    private const SLUG = 'lenovo-ideapad-gaming-3-15arh7-82sb00k9us';

    private function modelo(): array
    {
        return collect(ModelosReferenciaSeeder::modelos())->firstWhere('slug', self::SLUG);
    }

    /** La Lenovo del inventario (#10), con lo que se usa para reconocerla. */
    private function equipo(string $procesador = 'RYZEN 7', string $ram = '16', string $almacenamiento = '512 GB'): object
    {
        return (object) ['nombre' => 'LENOVO IDEAPAD GAMING 3', 'procesador' => $procesador, 'ram' => $ram,
            'almacenamiento' => $almacenamiento, 'color' => 'NEGRO'];
    }

    public function test_la_ficha_de_la_lenovo_esta_completa(): void
    {
        $modelo = $this->modelo();
        $this->assertSame(['computadora', 'pc'], [$modelo['tipo'], $modelo['familia']]);
        $this->assertSame([[], []], EsquemaPc::revisar($modelo));
        $this->assertSame([[], []], ModelosReferenciaSeeder::revisar($modelo));   // el seeder elige el esquema por la familia
        $this->assertSame([], $modelo['pendientes']);
    }

    public function test_detecta_datos_que_se_contradicen(): void
    {
        $pc = $this->modelo();
        $pc['datos']['rendimiento']['cpu_hilos'] = 4;           // menos hilos que núcleos
        $pc['datos']['rendimiento']['cpu_ghz_max'] = 2.0;       // máxima menor que la base
        $pc['datos']['rendimiento']['gpu_memoria'] = false;     // tarjeta dedicada sin memoria
        $pc['datos']['rendimiento']['ram_gb'] = [16, 8];
        $pc['datos']['pantalla']['pulgadas'] = 156.0;           // error de tipeo
        $pc['datos']['sistema']['numero_serie'] = 'X';          // clave inventada

        $texto = implode(' ', EsquemaPc::revisar($pc)[0]);
        $this->assertStringContainsString('El procesador no puede tener menos hilos que núcleos', $texto);
        $this->assertStringContainsString('La frecuencia máxima del procesador no puede ser menor que la base', $texto);
        $this->assertStringContainsString('Una tarjeta gráfica dedicada necesita su memoria y su potencia (TGP)', $texto);
        $this->assertStringContainsString('rendimiento.ram_gb debe ir de menor a mayor', $texto);
        $this->assertStringContainsString('pantalla.pulgadas = 156 está fuera de rango', $texto);
        $this->assertStringContainsString('Clave desconocida: sistema.numero_serie', $texto);

        $otra = $this->modelo();
        $otra['familia'] = 'chromebook';
        $this->assertSame(['Familia de computadora desconocida.'], ModelosReferenciaSeeder::revisar($otra)[0]);
    }

    public function test_los_textos_salen_de_la_ficha_oficial(): void
    {
        $t = TextosPc::desde($this->modelo()['datos']);
        $this->assertSame('AMD Ryzen 7 7735HS', $t['chip']);
        $this->assertSame('8 núcleos y 16 hilos · 3,2 GHz, hasta 4,75 GHz · 16 MB de caché L3', $t['cpu_cores']);
        $this->assertSame('NVIDIA GeForce RTX 4050 de 6 GB GDDR6 · Potencia de 85 W (TGP) con Dynamic Boost 2.0 · Además, gráficos integrados AMD Radeon 680M', $t['gpu']);
        $this->assertSame('1.920 × 1.080 px (Full HD)', $t['resolucion']);
        $this->assertSame('120 Hz · AMD FreeSync', $t['tasa_refresco']);
        $this->assertSame('Hasta 13,1 h de reproducción de video local en 1080p a 150 nits (7,8 h con MobileMark 2018)', $t['autonomia']);
        $this->assertSame('Memoria: 2 × 8 GB SO‑DIMM, sin ranuras libres · Segunda ranura M.2 2280 PCIe 4.0 libre para otro SSD', $t['ampliacion']);
        $this->assertSame('Adaptador de 170 W con conector slim tip', $t['cargador']);
        $this->assertSame('35,96 × 26,64 cm · 2,18 a 2,59 cm de grosor', $t['dimensiones']);
        $this->assertSame('Desde 2,4 kg', $t['peso']);
        $this->assertSame('IdeaPad Gaming 3 15ARH7 · MTM 82SB00K9US', $t['modelo']);
        $this->assertSame('Retroiluminado en blanco, con teclado numérico · Distribución en inglés (EE. UU.)', $t['teclado']);
        foreach (['apple_intelligence', 'ultimo_so', 'neural_engine', 'ancho_banda', 'biometria', 'thread'] as $clave) {
            $this->assertArrayNotHasKey($clave, $t);          // nada de Apple en una PC
        }
    }

    public function test_reconoce_la_lenovo_del_inventario_y_la_publicacion_lleva_su_ficha(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);
        $de = fn (object $equipo) => ModeloReferencia::deInventario('computadora', $equipo)?->slug;

        $this->assertSame(self::SLUG, $de($this->equipo()));
        $this->assertNull($de($this->equipo('RYZEN 5')));            // otro procesador: otra configuración
        $this->assertNull($de($this->equipo('RYZEN 7', '8')));       // otra memoria

        $equipo = $this->equipo();
        $modelo = ModeloReferencia::deInventario('computadora', $equipo);
        $a = InventarioCatalogo::atributos('computadora', $equipo, $modelo);
        $this->assertSame('AMD Ryzen 7 7735HS', $a['chip']);
        $this->assertSame('16 GB DDR5-4800', $a['ram']);
        $this->assertSame('512 GB (SSD NVMe M.2 2242 PCIe 4.0, QLC)', $a['almacenamiento']);
        $this->assertSame('Negro', $a['color']);                    // manda el inventario; la ficha de Lenovo dice Gris ónix

        $ficha = $modelo->fichaParaPublicacion();
        $this->assertArrayNotHasKey('apple_intelligence', $ficha);
        $this->assertSame('Adaptador de 170 W con conector slim tip', $ficha['cargador']);
        $this->assertSame(13.1, $modelo->autonomia_video_horas);

        // La comparativa de Mac no la muestra
        $this->get('/comparar/mac')->assertInertia(fn (Assert $page) => $page
            ->where('opciones', fn ($opciones) => collect($opciones)->doesntContain('slug', self::SLUG)));
    }
}
