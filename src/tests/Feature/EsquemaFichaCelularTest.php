<?php

namespace Tests\Feature;

use App\Models\ModeloReferencia;
use App\Support\FichaTecnica\EsquemaCelular;
use App\Support\FichaTecnica\TextosCelular;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EsquemaFichaCelularTest extends TestCase
{
    use RefreshDatabase;

    private function modelo(string $slug): array
    {
        return collect(ModelosReferenciaSeeder::modelos())->firstWhere('slug', $slug);
    }

    /** Solo los iPhone: las Mac tienen su propio esquema (EsquemaFichaComputadoraTest). */
    private function celulares(): array
    {
        return array_values(array_filter(ModelosReferenciaSeeder::modelos(), fn ($m) => $m['tipo'] === 'celular'));
    }

    public function test_todas_las_fichas_de_la_base_estan_completas(): void
    {
        foreach ($this->celulares() as $modelo) {
            [$errores, $pendientes] = EsquemaCelular::revisar($modelo);

            $this->assertSame([], $errores, "{$modelo['nombre']}: " . implode(' ', $errores));
            $this->assertEmpty(array_diff($pendientes, EsquemaCelular::PENDIENTES_PERMITIDOS));
        }

        $this->artisan('modelos:verificar')->assertExitCode(0);
    }

    public function test_detecta_campos_faltantes_tipos_rangos_y_claves_desconocidas(): void
    {
        $modelo = $this->modelo('iphone-12');
        unset($modelo['datos']['pantalla']['ppi']);
        $modelo['datos']['diseno']['peso_g'] = '164';          // texto en vez de número
        $modelo['datos']['pantalla']['pulgadas'] = 61;          // error de tipeo
        $modelo['datos']['camaras']['tele_mp'] = null;          // «no tiene» debe ser false, no vacío
        $modelo['datos']['camaras']['megapixeles'] = 12;        // clave inventada

        [$errores] = EsquemaCelular::revisar($modelo);
        $texto = implode(' ', $errores);

        $this->assertStringContainsString('Falta pantalla.ppi', $texto);
        $this->assertStringContainsString('diseno.peso_g debe ser int', $texto);
        $this->assertStringContainsString('pantalla.pulgadas = 61 está fuera de rango', $texto);
        $this->assertStringContainsString('camaras.tele_mp debe ser int|false', $texto);
        $this->assertStringContainsString('Clave desconocida: camaras.megapixeles', $texto);
    }

    public function test_solo_pueden_quedar_pendientes_los_campos_permitidos(): void
    {
        $modelo = $this->modelo('iphone-12');
        $modelo['datos']['rendimiento']['chip'] = null;
        $modelo['pendientes'][] = ['campo' => 'rendimiento.chip', 'tipo' => 'falta', 'detalle' => 'Chip.', 'fuente' => 'Apple.'];

        [$errores] = EsquemaCelular::revisar($modelo);

        $this->assertContains('rendimiento.chip no puede quedar pendiente.', $errores);
    }

    public function test_cada_pendiente_dice_que_falta_y_donde_buscarlo(): void
    {
        $modelo = $this->modelo('iphone-14-pro');
        $modelo['datos']['sistema']['ios_maximo'] = null;   // vacío, para probar un «verificar» sin valor
        $modelo['pendientes'] = [
            ['campo' => 'bateria.watts', 'tipo' => 'verificar', 'detalle' => 'x', 'fuente' => 'Apple'],
            ['campo' => 'bateria.qi_w', 'tipo' => 'dudoso', 'detalle' => 'x', 'fuente' => 'Apple'],
            ['campo' => 'diseno.dorso', 'tipo' => 'verificar', 'detalle' => '', 'fuente' => 'Apple'],
            ['campo' => 'sistema.anio', 'tipo' => 'verificar', 'detalle' => 'x', 'fuente' => 'Apple'],
            ['campo' => 'sistema.anio', 'tipo' => 'verificar', 'detalle' => 'x', 'fuente' => 'Apple'],
            ['campo' => 'sistema.ios_maximo', 'tipo' => 'verificar', 'detalle' => 'x', 'fuente' => 'Apple'],
            ['campo' => 'diseno.peso_g', 'tipo' => 'falta', 'detalle' => 'x', 'fuente' => 'Apple'],
        ];

        [$errores, $faltan] = EsquemaCelular::revisar($modelo);

        $this->assertContains('Pendiente 1: el campo «bateria.watts» no existe en el esquema.', $errores);
        $this->assertContains('bateria.qi_w: el tipo de pendiente debe ser falta o verificar.', $errores);
        $this->assertContains('diseno.dorso: el pendiente necesita detalle.', $errores);
        $this->assertContains('sistema.anio figura dos veces en pendientes.', $errores);
        $this->assertContains('sistema.ios_maximo está por verificar pero no tiene valor: márcalo como falta.', $errores);
        $this->assertContains('diseno.peso_g no puede quedar pendiente.', $errores);
        $this->assertSame([], $faltan);
    }

    public function test_los_datos_que_no_salen_de_la_fuente_quedan_como_pendientes(): void
    {
        // Verificado en Apple el 2026-09-15: listas de compatibilidad de iOS, «Identificar el modelo de iPhone» y fichas técnicas.
        $pro = $this->modelo('iphone-14-pro');
        $this->assertSame([], $pro['pendientes']);
        $this->assertSame('iOS 27', $pro['datos']['sistema']['ios_maximo']);
        $this->assertContains('A2891', $pro['datos']['sistema']['numeros_modelo']);   // la variante de Rusia que no traía el informe
        $this->assertSame('Chip de banda ultraancha de primera generación', $pro['datos']['conectividad']['uwb']);

        $this->assertSame('iOS 27', $this->modelo('iphone-11')['datos']['sistema']['ios_maximo']);   // el informe decía iOS 26
        $this->assertSame('iOS 18', $this->modelo('iphone-xs')['datos']['sistema']['ios_maximo']);
        $this->assertContains('A3212', $this->modelo('iphone-16e')['datos']['sistema']['numeros_modelo']);   // el informe decía A3263
        $x = $this->modelo('iphone-x');
        $this->assertSame([], $x['pendientes']);
        $this->assertSame(['A1865', 'A1901', 'A1902'], $x['datos']['sistema']['numeros_modelo']);

        // Segunda ronda (2026-09-15), con Apple EE. UU. como fuente preferida: no quedó ningún pendiente. La RAM y la batería
        // (fuentes externas, misma fecha) dejan solo lo que nadie confirma todavía: la RAM y la batería del Duo y la batería de
        // las unidades solo eSIM del 18 Pro y el 18 Pro Max.
        $esperados = [
            'iPhone 18 Pro'     => ['bateria.capacidad_mah_solo_esim'],
            'iPhone 18 Pro Max' => ['bateria.capacidad_mah_solo_esim'],
            'iPhone Duo'        => ['rendimiento.ram_gb', 'bateria.capacidad_mah'],
        ];
        foreach ($this->celulares() as $modelo) {
            $this->assertSame($esperados[$modelo['nombre']] ?? [], array_column($modelo['pendientes'], 'campo'), $modelo['nombre']);
            $this->assertSame([], array_diff(array_column($modelo['pendientes'], 'tipo'), ['falta']), $modelo['nombre']);
        }
        $this->assertSame(['A3472', 'A3713', 'A3714', 'A3715'], $this->modelo('iphone-18-pro')['datos']['sistema']['numeros_modelo']);
        $this->assertSame(['A3447', 'A3719', 'A3720', 'A3721'], $this->modelo('iphone-duo')['datos']['sistema']['numeros_modelo']);
        $this->assertSame('iOS 27.1', $this->modelo('iphone-duo')['datos']['sistema']['ios_lanzamiento']);
        $this->assertSame(25, $this->modelo('iphone-16')['datos']['bateria']['magsafe_w']);   // apple.com/iphone-16/specs (Apple España decía 22 W)
        $this->assertNull($this->modelo('iphone-16')['datos']['bateria']['qi_w']);           // la ficha de EE. UU. ya no publica la potencia de Qi
        $this->assertSame(7.5, $this->modelo('iphone-16e')['datos']['bateria']['qi_w']);
    }

    public function test_la_ram_y_la_bateria_salen_de_fuentes_externas_y_avisan_la_version_solo_esim(): void
    {
        $catorcePlus = TextosCelular::desde($this->modelo('iphone-14-plus')['datos']);
        $this->assertSame('6 GB', $catorcePlus['ram']);
        $this->assertSame('4.325 mAh', $catorcePlus['bateria_mah']);   // Wikipedia y 9to5Mac (gsmarena.com decía 4.323)

        $pro = TextosCelular::desde($this->modelo('iphone-17-pro')['datos']);
        $this->assertSame('12 GB', $pro['ram']);
        $this->assertSame('3.988 mAh; 4.252 mAh en las unidades solo eSIM', $pro['bateria_mah']);
        $this->assertSame('4.056 mAh', TextosCelular::desde($this->modelo('iphone-18-pro')['datos'])['bateria_mah']);   // la solo eSIM, pendiente

        $duo = TextosCelular::desde($this->modelo('iphone-duo')['datos']);
        $this->assertArrayNotHasKey('ram', $duo);           // nadie la confirmó: no se muestra
        $this->assertArrayNotHasKey('bateria_mah', $duo);

        // La batería aparte de las unidades solo eSIM tiene que existir y ser más grande
        $dieciseis = $this->modelo('iphone-16');
        $dieciseis['datos']['bateria']['capacidad_mah_solo_esim'] = 3000;
        $this->assertContains('La batería de las unidades solo eSIM debe ser más grande que la de las unidades con SIM.', EsquemaCelular::revisar($dieciseis)[0]);
        $x = $this->modelo('iphone-x');
        $x['datos']['bateria']['capacidad_mah_solo_esim'] = 3000;
        $this->assertContains('Tiene batería de unidades solo eSIM, pero no hay unidades solo eSIM.', EsquemaCelular::revisar($x)[0]);
        $x['datos']['rendimiento']['ram_gb'] = 64;
        $this->assertContains('rendimiento.ram_gb = 64 está fuera de rango (2–24).', EsquemaCelular::revisar($x)[0]);
    }

    public function test_el_comando_de_pendientes_lista_y_arma_la_documentacion(): void
    {
        $this->artisan('modelos:pendientes')
            ->expectsOutputToContain('por verificar')
            ->assertExitCode(0);

        $this->artisan('modelos:pendientes', ['--markdown' => true])
            ->expectsOutputToContain('# Modelos de referencia: datos pendientes')
            ->assertExitCode(0);
    }

    public function test_detecta_datos_que_se_contradicen(): void
    {
        $modelo = $this->modelo('iphone-xr');
        $modelo['datos']['camaras']['zoom_optico_max'] = 2.0;   // sin teleobjetivo
        $modelo['datos']['rendimiento']['cpu_rendimiento'] = 3; // 3 + 4 ≠ 6

        [$errores] = EsquemaCelular::revisar($modelo);

        $this->assertContains('Tiene zoom óptico mayor a 1x pero no tiene teleobjetivo.', $errores);
        $this->assertContains('Los núcleos de rendimiento y eficiencia no suman los núcleos de la CPU.', $errores);
    }

    public function test_los_textos_salen_de_los_datos_y_no_muestran_lo_que_no_tiene(): void
    {
        $xr = TextosCelular::desde($this->modelo('iphone-xr')['datos']);
        $this->assertSame('Una cámara de 12 MP', $xr['sistema_camaras']);
        $this->assertSame('1x', $xr['zoom_optico']);
        $this->assertArrayNotHasKey('teleobjetivo', $xr);
        $this->assertArrayNotHasKey('camara_ultra', $xr);
        $this->assertArrayNotHasKey('lidar', $xr);
        $this->assertSame('Liquid Retina HD (LCD)', $xr['pantalla']);

        $max = TextosCelular::desde($this->modelo('iphone-12-pro-max')['datos']);
        $this->assertSame('Triple de 12 MP (principal, ultra gran angular y teleobjetivo)', $max['sistema_camaras']);
        $this->assertSame('12 MP · zoom óptico 2,5x', $max['teleobjetivo']);
        $this->assertSame('0,5x, 1x y 2,5x', $max['zoom_optico']);
        $this->assertSame('MagSafe hasta 15 W · Qi2 · Qi hasta 7,5 W', $max['carga_inalambrica']);
        $this->assertSame('160,8 × 78,1 × 7,4 mm', $max['dimensiones']);
        $this->assertSame('800 nits (1.200 nits en HDR)', $max['brillo']);
        $this->assertSame('Hasta 20 h de reproducción de video (12 h en streaming)', $max['autonomia']);
        $this->assertSame('Sí', $max['lidar']);
    }

    public function test_la_generacion_13_suma_modo_cine_y_estilos_sin_tocar_a_los_anteriores(): void
    {
        $trece = TextosCelular::desde($this->modelo('iphone-13')['datos']);
        $this->assertStringContainsString('Modo Cine (1080p a 30 fps con Dolby Vision)', $trece['video']);
        $this->assertStringContainsString('Estilos Fotográficos', $trece['funciones_foto']);
        $this->assertStringContainsString('Modo Cine', $trece['video_frontal']);
        $this->assertSame('Doble SIM (dos eSIM activas o nano-SIM y eSIM)', $trece['sim']);

        $se3 = TextosCelular::desde($this->modelo('iphone-se-3')['datos']);
        $this->assertStringNotContainsString('Modo Cine', $se3['video']);
        $this->assertSame('5G (sub-6 GHz) con MIMO 2x2 · 4G LTE Advanced', $se3['red']);
        $this->assertSame('Touch ID (2.ª generación) en el botón de inicio', $se3['biometria']);

        $doce = TextosCelular::desde($this->modelo('iphone-12')['datos']);
        $this->assertStringNotContainsString('Estilos Fotográficos', $doce['funciones_foto']);
        $this->assertStringNotContainsString('Modo Cine', $doce['video']);
    }

    public function test_el_13_pro_y_el_14_plus_muestran_sus_funciones_propias(): void
    {
        $pro = TextosCelular::desde($this->modelo('iphone-13-pro')['datos']);
        $this->assertSame('ProMotion hasta 120 Hz', $pro['tasa_refresco']);
        $this->assertSame('0,5x, 1x y 3x', $pro['zoom_optico']);
        $this->assertStringContainsString('Fotografía macro', $pro['funciones_foto']);
        $this->assertStringContainsString('ProRes hasta 4K a 30 fps', $pro['video']);
        $this->assertStringContainsString('video macro', $pro['video']);
        $this->assertSame('Emergencia SOS', $pro['seguridad']);
        $this->assertContains('1 TB', $pro['capacidades_disponibles']);

        $plus = TextosCelular::desde($this->modelo('iphone-14-plus')['datos']);
        $this->assertSame('60 Hz', $plus['tasa_refresco']);
        $this->assertStringContainsString('Photonic Engine', $plus['funciones_foto']);
        $this->assertStringNotContainsString('ProRAW', $plus['funciones_foto']);
        $this->assertStringContainsString('Modo Acción (hasta 2,8K a 60 fps con Dolby Vision)', $plus['video']);
        $this->assertSame('Emergencia SOS · SOS vía satélite (no disponible en Bolivia) · Detección de accidentes', $plus['seguridad']);
        $this->assertArrayNotHasKey('lidar', $plus);
    }

    public function test_la_generacion_14_suma_dynamic_island_siempre_activa_y_48_mp_solo_en_los_pro(): void
    {
        $pro = TextosCelular::desde($this->modelo('iphone-14-pro')['datos']);
        $this->assertSame('Dynamic Island · Pantalla siempre activa · True Tone · Gama cromática amplia (P3)', $pro['funciones_pantalla']);
        $this->assertSame('1.000 nits (1.600 nits en HDR · 2.000 nits en exteriores)', $pro['brillo']);
        $this->assertSame('A16 Bionic', $pro['chip']);
        $this->assertSame('Triple con principal de 48 MP (ultra gran angular y teleobjetivo de 12 MP)', $pro['sistema_camaras']);
        $this->assertSame('0,5x, 1x, 2x y 3x', $pro['zoom_optico']);
        $this->assertStringContainsString('Fotos en superalta resolución (48 MP)', $pro['funciones_foto']);
        $this->assertStringContainsString('Flash True Tone adaptativo', $pro['funciones_foto']);
        $this->assertStringContainsString('segunda generación', $pro['camara_principal']);
        $this->assertStringStartsWith('4K hasta 60 fps con Dolby Vision · Modo Cine', $pro['video']);   // sin repetir «hasta 60 fps»

        $doce = TextosCelular::desde($this->modelo('iphone-12')['datos']);
        $this->assertStringStartsWith('4K hasta 60 fps con Dolby Vision hasta 30 fps', $doce['video']);

        $max = TextosCelular::desde($this->modelo('iphone-14-pro-max')['datos']);
        $this->assertSame('2.796 × 1.290 px a 460 ppi', $max['resolucion']);
        $this->assertSame('Hasta 29 h de reproducción de video (25 h en streaming)', $max['autonomia']);
        $this->assertSame('160,7 × 77,6 × 7,85 mm', $max['dimensiones']);

        $catorce = TextosCelular::desde($this->modelo('iphone-14')['datos']);
        $this->assertSame('True Tone · Gama cromática amplia (P3)', $catorce['funciones_pantalla']);
        $this->assertSame('800 nits (1.200 nits en HDR)', $catorce['brillo']);
        $this->assertSame('Doble de 12 MP (principal y ultra gran angular)', $catorce['sistema_camaras']);
        $this->assertSame('0,5x y 1x', $catorce['zoom_optico']);
        $this->assertStringNotContainsString('superalta', $catorce['funciones_foto']);
        $this->assertSame('Hasta 20 h de reproducción de video (16 h en streaming)', $catorce['autonomia']);
    }

    public function test_la_generacion_15_suma_usb_c_titanio_boton_accion_y_apple_intelligence_en_el_pro(): void
    {
        $quince = TextosCelular::desde($this->modelo('iphone-15')['datos']);
        $this->assertSame('Dynamic Island · True Tone · Gama cromática amplia (P3)', $quince['funciones_pantalla']);
        $this->assertSame('1.000 nits (1.600 nits en HDR · 2.000 nits en exteriores)', $quince['brillo']);
        $this->assertSame('Doble con principal de 48 MP (ultra gran angular de 12 MP)', $quince['sistema_camaras']);
        $this->assertSame('0,5x, 1x y 2x', $quince['zoom_optico']);
        $this->assertStringContainsString('Fotos en superalta resolución (24 y 48 MP)', $quince['funciones_foto']);
        $this->assertSame('USB-C (USB 2)', $quince['puerto']);
        $this->assertSame('5 núcleos', $quince['gpu_cores']);
        $this->assertArrayNotHasKey('apple_intelligence', $quince);
        $this->assertArrayNotHasKey('boton_accion', $quince);
        $this->assertArrayNotHasKey('teleobjetivo', $quince);

        $pro = TextosCelular::desde($this->modelo('iphone-15-pro')['datos']);
        $this->assertSame('A17 Pro', $pro['chip']);
        $this->assertSame('6 núcleos con trazado de rayos por hardware', $pro['gpu_cores']);
        $this->assertSame('Compatible', $pro['apple_intelligence']);
        $this->assertSame('Sí', $pro['boton_accion']);
        $this->assertSame('Sí', $pro['thread']);
        $this->assertSame('USB-C (USB 3 hasta 10 Gb/s)', $pro['puerto']);
        $this->assertStringEndsWith('Fi 6E', $pro['wifi']);
        $this->assertSame('Titanio con frente Ceramic Shield y dorso de vidrio mate texturizado', $pro['material']);
        $this->assertStringContainsString('Fotos espaciales', $pro['funciones_foto']);
        $this->assertStringContainsString('ProRes hasta 4K a 60 fps con grabación externa · video espacial (1080p a 30 fps) · Apple Log · ACES', $pro['video']);

        $max = TextosCelular::desde($this->modelo('iphone-15-pro-max')['datos']);
        $this->assertSame('0,5x, 1x, 2x y 5x', $max['zoom_optico']);
        $this->assertSame('12 MP · zoom óptico 5x', $max['teleobjetivo']);
        $this->assertSame(['256 GB', '512 GB', '1 TB'], $max['capacidades_disponibles']);

        // Confirmado con la comparación 15 Pro Max / 16e / 16 Plus: le quedan los mismos pendientes que al 15 Pro.
        $campos = fn (string $slug) => collect($this->modelo($slug)['pendientes'])->pluck('campo')->sort()->values()->all();
        $this->assertSame($campos('iphone-15-pro'), $campos('iphone-15-pro-max'));
    }

    public function test_la_generacion_16_suma_control_de_camara_magsafe_de_25_w_y_el_16e_con_una_camara(): void
    {
        $plus = TextosCelular::desde($this->modelo('iphone-16-plus')['datos']);
        $this->assertSame('A18', $plus['chip']);
        $this->assertSame('5 núcleos con trazado de rayos por hardware', $plus['gpu_cores']);
        $this->assertSame('Doble con principal Fusion de 48 MP (ultra gran angular de 12 MP)', $plus['sistema_camaras']);
        $this->assertSame('1.000 nits (1.600 nits en HDR · 2.000 nits en exteriores · mínimo de 1 nit)', $plus['brillo']);
        $this->assertSame('MagSafe hasta 25 W · Qi2 · Qi', $plus['carga_inalambrica']);
        $this->assertSame('Carga rápida: 50 % en 35 min con un adaptador de 20 W o superior por cable, o con MagSafe y un adaptador de 30 W o superior', $plus['carga']);
        $this->assertSame('Sí', $plus['control_camara']);
        $this->assertSame('Sí', $plus['boton_accion']);
        $this->assertStringContainsString('Estilos Fotográficos 2', $plus['funciones_foto']);
        $this->assertStringContainsString('Fotografía macro', $plus['funciones_foto']);
        $this->assertStringContainsString('audio espacial · reducción de ruido del viento · Mezcla de Audio', $plus['video']);
        $this->assertStringEndsWith('Fi 7', $plus['wifi']);
        $this->assertArrayNotHasKey('lidar', $plus);

        $e = TextosCelular::desde($this->modelo('iphone-16e')['datos']);
        $this->assertSame('Una cámara Fusion de 48 MP', $e['sistema_camaras']);
        $this->assertSame('1x y 2x', $e['zoom_optico']);
        $this->assertSame('4 núcleos con trazado de rayos por hardware', $e['gpu_cores']);
        $this->assertSame('Qi hasta 7,5 W', $e['carga_inalambrica']);
        $this->assertSame('True Tone · Gama cromática amplia (P3)', $e['funciones_pantalla']);
        $this->assertSame('800 nits (1.200 nits en HDR)', $e['brillo']);
        $this->assertSame('Compatible', $e['apple_intelligence']);
        $this->assertArrayNotHasKey('camara_ultra', $e);
        $this->assertArrayNotHasKey('banda_ultraancha', $e);
        $this->assertArrayNotHasKey('control_camara', $e);
        $this->assertStringNotContainsString('Modo Cine', $e['video']);
        // En el 16e los 7,5 W de Qi sí salen de la página: no quedan por verificar.
        $this->assertNotContains('bateria.qi_w', collect($this->modelo('iphone-16e')['pendientes'])->pluck('campo')->all());
    }

    public function test_el_16_pro_suma_ultra_de_48_mp_video_4k_a_120_y_microfonos_de_estudio(): void
    {
        $dieciseis = TextosCelular::desde($this->modelo('iphone-16')['datos']);
        $this->assertSame('Doble con principal Fusion de 48 MP (ultra gran angular de 12 MP)', $dieciseis['sistema_camaras']);
        $this->assertSame('MagSafe hasta 25 W · Qi2 · Qi', $dieciseis['carga_inalambrica']);
        $this->assertSame('Sí', $dieciseis['control_camara']);
        $this->assertStringNotContainsString('micrófonos', $dieciseis['video']);
        $this->assertArrayNotHasKey('teleobjetivo', $dieciseis);

        $pro = TextosCelular::desde($this->modelo('iphone-16-pro')['datos']);
        $this->assertSame('6,3 pulgadas', $pro['tamano_pantalla']);
        $this->assertSame('A18 Pro', $pro['chip']);
        $this->assertSame('Triple con principal Fusion de 48 MP (ultra gran angular de 48 MP y teleobjetivo de 12 MP)', $pro['sistema_camaras']);
        $this->assertSame('48 MP · 0,5x', $pro['camara_ultra']);
        $this->assertSame('12 MP · zoom óptico 5x · estabilización óptica por desplazamiento del sensor en 3D', $pro['teleobjetivo']);
        $this->assertStringStartsWith('4K hasta 120 fps (cámara principal Fusion) y hasta 60 fps (ultra gran angular y teleobjetivo) con Dolby Vision · Modo Cine', $pro['video']);
        $this->assertStringContainsString('ProRes hasta 4K a 120 fps con grabación externa', $pro['video']);
        $this->assertStringContainsString('audio espacial · cuatro micrófonos con calidad de estudio', $pro['video']);
        $this->assertSame('MagSafe hasta 25 W · Qi2 · Qi hasta 7,5 W', $pro['carga_inalambrica']);

        $max = TextosCelular::desde($this->modelo('iphone-16-pro-max')['datos']);
        $this->assertSame('6,9 pulgadas', $max['tamano_pantalla']);
        $this->assertSame('2.868 × 1.320 px a 460 ppi', $max['resolucion']);
        $this->assertSame('Hasta 33 h de reproducción de video (29 h en streaming)', $max['autonomia']);
        $this->assertSame('MagSafe hasta 25 W · Qi2 · Qi hasta 7,5 W', $max['carga_inalambrica']);
        $this->assertSame(['256 GB', '512 GB', '1 TB'], $max['capacidades_disponibles']);
    }

    public function test_la_generacion_17_suma_center_stage_captura_dual_y_el_air_solo_con_esim(): void
    {
        $diecisiete = TextosCelular::desde($this->modelo('iphone-17')['datos']);
        $this->assertSame('A19', $diecisiete['chip']);
        $this->assertSame('5 núcleos con Neural Accelerators y trazado de rayos por hardware', $diecisiete['gpu_cores']);
        $this->assertSame('ProMotion hasta 120 Hz', $diecisiete['tasa_refresco']);
        $this->assertSame('1.000 nits (1.600 nits en HDR · 3.000 nits en exteriores · mínimo de 1 nit)', $diecisiete['brillo']);
        $this->assertSame('Doble Fusion de 48 MP (principal y ultra gran angular)', $diecisiete['sistema_camaras']);
        $this->assertSame('48 MP Fusion · 0,5x', $diecisiete['camara_ultra']);
        $this->assertStringStartsWith('18 MP Center Stage · Encuadre Centrado para fotos y videollamadas', $diecisiete['camara_frontal']);
        $this->assertStringContainsString('Captura Dual (hasta 4K a 30 fps con Dolby Vision)', $diecisiete['video']);
        $this->assertStringContainsString('video ultraestabilizado', $diecisiete['video_frontal']);
        $this->assertSame('Carga rápida: 50 % en 20 min con un adaptador de 40 W o superior por cable; 50 % en 30 min con MagSafe y un adaptador de 30 W o superior',
            $diecisiete['carga']);
        $this->assertSame('Aluminio con frente Ceramic Shield 2 y dorso de vidrio tintado en masa', $diecisiete['material']);   // «Color-infused glass back» (support.apple.com/en-us/125089)
        $this->assertSame('6', $diecisiete['bluetooth']);

        $air = TextosCelular::desde($this->modelo('iphone-air')['datos']);
        $this->assertSame('A19 Pro', $air['chip']);
        $this->assertSame('Una cámara Fusion de 48 MP', $air['sistema_camaras']);
        $this->assertSame('Doble eSIM (dos eSIM activas; no admite tarjetas SIM físicas)', $air['sim']);
        $this->assertSame('Titanio con frente Ceramic Shield 2 y dorso Ceramic Shield', $air['material']);
        $this->assertSame('156,2 × 74,7 × 5,64 mm', $air['dimensiones']);
        $this->assertStringNotContainsString('Modo Cine', $air['video']);
        $this->assertStringNotContainsString('Modo Cine', $air['video_frontal']);
        $this->assertArrayNotHasKey('camara_ultra', $air);
        $this->assertContains('1 TB', $air['capacidades_disponibles']);

        $e = TextosCelular::desde($this->modelo('iphone-17e')['datos']);
        $this->assertSame('MagSafe hasta 15 W · Qi2 · Qi', $e['carga_inalambrica']);   // Apple ya no publica la potencia de Qi
        $this->assertSame('Carga rápida: 50 % en 30 min con un adaptador de 20 W o superior', $e['carga']);
        $this->assertSame('4 núcleos con Neural Accelerators y trazado de rayos por hardware', $e['gpu_cores']);
        $this->assertStringStartsWith('12 MP TrueDepth · Modo Noche', $e['camara_frontal']);
        $this->assertStringNotContainsString('Captura Dual', $e['video']);
        $this->assertArrayNotHasKey('banda_ultraancha', $e);
        $this->assertArrayNotHasKey('control_camara', $e);
        $this->assertArrayNotHasKey('thread', $e);

        // El grosor en milímetros lo confirmaron las fichas técnicas en inglés (2026-09-15). El informe cerró la carga rápida con
        // MagSafe del Air, y la potencia de Qi, que Apple ya no publica desde el 17, queda vacía (null) en lugar de 7,5 W.
        $pendientes = fn (string $slug) => collect($this->modelo($slug)['pendientes'])->pluck('tipo', 'campo');
        $this->assertArrayNotHasKey('diseno.grosor_mm', $pendientes('iphone-17')->all());
        $this->assertArrayNotHasKey('diseno.grosor_mm', $pendientes('iphone-air')->all());
        $this->assertArrayNotHasKey('bateria.carga_rapida_magsafe_w', $pendientes('iphone-air')->all());
        $this->assertArrayNotHasKey('bateria.qi_w', $pendientes('iphone-17e')->all());
        $this->assertNull($this->modelo('iphone-17e')['datos']['bateria']['qi_w']);
        $this->assertArrayNotHasKey('diseno.dorso', $pendientes('iphone-air')->all());   // «Parte trasera con Ceramic Shield» sale de la página
    }

    public function test_el_17_pro_y_el_18_pro_suman_teleobjetivo_fusion_apertura_variable_y_supernucleos(): void
    {
        $pro = TextosCelular::desde($this->modelo('iphone-17-pro')['datos']);
        $this->assertSame('Triple Fusion de 48 MP (principal, ultra gran angular y teleobjetivo)', $pro['sistema_camaras']);
        $this->assertSame('48 MP Fusion · zoom óptico 8x · estabilización óptica por desplazamiento del sensor en 3D', $pro['teleobjetivo']);
        $this->assertSame('0,5x, 1x, 2x, 4x y 8x', $pro['zoom_optico']);
        $this->assertSame('Unibody de aluminio con frente Ceramic Shield 2 y dorso Ceramic Shield', $pro['material']);
        $this->assertStringContainsString('ProRes RAW · video espacial (1080p a 30 fps) · Apple Log 2 · ACES · Genlock', $pro['video']);
        $this->assertStringNotContainsString('apertura variable', $pro['camara_principal']);
        $this->assertSame(['256 GB', '512 GB', '1 TB', '2 TB'], TextosCelular::desde($this->modelo('iphone-17-pro-max')['datos'])['capacidades_disponibles']);

        $dieciocho = TextosCelular::desde($this->modelo('iphone-18-pro')['datos']);
        $this->assertSame('6 núcleos (2 supernúcleos y 4 de eficiencia)', $dieciocho['cpu_cores']);
        $this->assertSame('Doble de 16 núcleos', $dieciocho['neural_engine']);
        $this->assertStringContainsString('apertura variable (ƒ/1,48, ƒ/1,8, ƒ/2,8 o ƒ/4,0)', $dieciocho['camara_principal']);
        $this->assertStringContainsString('Controles Pro (apertura del objetivo', $dieciocho['funciones_foto']);
        $this->assertStringContainsString('Estilos Fotográficos 3', $dieciocho['funciones_foto']);
        $this->assertStringContainsString('Modo Cine (hasta 4K a 60 fps con Dolby Vision) · efectos del modo Cine', $dieciocho['video']);
        $this->assertStringContainsString('time-lapse estabilizado (hasta 4K con Dolby Vision)', $dieciocho['video_frontal']);
        $this->assertSame('Carga rápida: 50 % en unos 15 min con un adaptador de 60 W o superior con fuente de voltaje ajustable por cable; '
            . '50 % en 30 min con MagSafe y un adaptador de 35 W o superior', $dieciocho['carga']);

        // El frente Ceramic Shield 2 y el grosor los confirmaron las fichas técnicas; el 18 Pro mide 8,75 mm (la comparación redondea a 0,88 cm).
        $pendientes = collect($this->modelo('iphone-17-pro')['pendientes'])->pluck('tipo', 'campo');
        $this->assertArrayNotHasKey('diseno.frente', $pendientes->all());
        $this->assertArrayNotHasKey('diseno.grosor_mm', $pendientes->all());
        $this->assertSame(8.75, $this->modelo('iphone-18-pro')['datos']['diseno']['grosor_mm']);
    }

    public function test_el_duo_plegable_tiene_dos_pantallas_doble_bateria_y_touch_id(): void
    {
        $duo = TextosCelular::desde($this->modelo('iphone-duo')['datos']);
        $this->assertSame('7,6 pulgadas (interior) y 5,4 pulgadas (exterior)', $duo['tamano_pantalla']);
        $this->assertSame('2.670 × 1.878 px a 430 ppi (interior) · 2.034 × 1.398 px a 460 ppi (exterior)', $duo['resolucion']);
        $this->assertStringStartsWith('Pantalla interior plegable con acabado nanotexturizado', $duo['funciones_pantalla']);
        $this->assertSame('Doble Fusion de 48 MP (principal y ultra gran angular)', $duo['sistema_camaras']);
        $this->assertSame('Doble batería: hasta 31 h de reproducción de video (26 h en streaming) en la pantalla interior '
            . 'y hasta 44 h (37 h en streaming) en la exterior', $duo['autonomia']);
        $this->assertSame('117,8 × 84,1 × 11,3 mm cerrado · 117,8 × 164,6 × 5,2 mm abierto', $duo['dimensiones']);
        $this->assertSame('Touch ID (sensor de huella en el botón lateral)', $duo['biometria']);
        $this->assertStringContainsString('Cámara FaceTime bajo la pantalla', $duo['camara_frontal']);
        $this->assertStringContainsString('Captura Inteligente · Duo Preview', $duo['funciones_foto']);
        $this->assertStringNotContainsString('ProRes', $duo['video']);
        $this->assertArrayNotHasKey('teleobjetivo', $duo);
        $this->assertArrayNotHasKey('boton_accion', $duo);
        $this->assertArrayNotHasKey('lidar', $duo);

        // El Apple Pencil figura con la nota «Disponible este año»: por verificar antes de destacarlo.
        // La segunda ronda cerró números de modelo, iOS 27.1 y Apple Pencil; solo esperan fuente la RAM y la doble batería.
        $this->assertSame(['rendimiento.ram_gb', 'bateria.capacidad_mah'], array_column($this->modelo('iphone-duo')['pendientes'], 'campo'));
    }

    public function test_el_informe_del_2026_09_15_carga_numeros_de_modelo_dorsos_y_la_sos_en_bolivia(): void
    {
        $xr = TextosCelular::desde($this->modelo('iphone-xr')['datos']);
        $this->assertSame('A1984, A2105, A2106, A2107 o A2108 (según el país)', $xr['modelo']);
        $this->assertSame('A1865, A1901 o A1902 (según el país)', TextosCelular::desde($this->modelo('iphone-x')['datos'])['modelo']);

        $this->assertSame('Aluminio con frente Ceramic Shield y dorso de vidrio tintado en masa',
            TextosCelular::desde($this->modelo('iphone-16')['datos'])['material']);
        $this->assertSame('Aluminio con frente Ceramic Shield y dorso de vidrio',
            TextosCelular::desde($this->modelo('iphone-16e')['datos'])['material']);   // el 16e hereda del 16 Plus, pero es de vidrio
        $this->assertSame('Acero inoxidable con frente Ceramic Shield y dorso de vidrio mate texturizado',
            TextosCelular::desde($this->modelo('iphone-12-pro')['datos'])['material']);

        $this->assertStringContainsString('SOS vía satélite (no disponible en Bolivia)',
            TextosCelular::desde($this->modelo('iphone-17')['datos'])['seguridad']);
        $this->assertSame('MagSafe hasta 25 W · Qi2 · Qi', TextosCelular::desde($this->modelo('iphone-16')['datos'])['carga_inalambrica']);

        // El informe tenía cruzados los números del 16 Pro y el 16 Pro Max; estos son los de support.apple.com/108044.
        $this->assertSame(['A3083', 'A3292', 'A3293', 'A3294'], $this->modelo('iphone-16-pro')['datos']['sistema']['numeros_modelo']);
        $this->assertSame(['A3084', 'A3295', 'A3296', 'A3297'], $this->modelo('iphone-16-pro-max')['datos']['sistema']['numeros_modelo']);
    }

    public function test_la_sim_avisa_que_unidades_son_solo_esim(): void
    {
        // Decisión del usuario (2026-09-15): la ficha avisa, sin usar la procedencia del equipo (support.apple.com/es-es/108044).
        $sim = fn (string $slug) => TextosCelular::desde($this->modelo($slug)['datos'])['sim'];
        $this->assertSame('Doble SIM (dos eSIM activas o nano-SIM y eSIM)', $sim('iphone-13'));
        $this->assertSame('Doble SIM (dos eSIM activas o nano-SIM y eSIM); las unidades de EE. UU. son solo eSIM', $sim('iphone-14'));
        $this->assertStringEndsWith('; las unidades de EE. UU. son solo eSIM', $sim('iphone-16e'));
        $this->assertStringEndsWith('; las unidades de EE. UU., Canadá, México, Japón y otros 9 territorios son solo eSIM', $sim('iphone-17-pro-max'));
        $this->assertStringNotContainsString('unidades', $sim('iphone-air'));
        $this->assertStringEndsWith('; las unidades de EE. UU. y Canadá son solo eSIM', $sim('iphone-18-pro'));   // fichas de Apple de EE. UU. y Canadá

        $modelo = $this->modelo('iphone-14');
        $modelo['datos']['conectividad']['esim'] = false;
        [$errores] = EsquemaCelular::revisar($modelo);
        $this->assertContains('Tiene unidades solo eSIM pero no admite eSIM.', $errores);
    }

    public function test_la_red_avisa_que_unidades_admiten_5g_mmwave(): void
    {
        // Decisión del usuario (2026-09-15), como la SIM. Fichas de Apple EE. UU.: «5G (sub-6 GHz and mmWave)».
        $red = fn (string $slug) => TextosCelular::desde($this->modelo($slug)['datos'])['red'];
        $this->assertSame('5G (sub-6 GHz) con MIMO 4x4 · LTE Gigabit; las unidades de EE. UU. también admiten 5G mmWave', $red('iphone-14-plus'));
        foreach (['iphone-12-mini', 'iphone-16-pro', 'iphone-17', 'iphone-17-pro-max', 'iphone-18-pro-max', 'iphone-duo'] as $slug) {
            $this->assertStringEndsWith('; las unidades de EE. UU. también admiten 5G mmWave', $red($slug), $slug);
        }
        foreach (['iphone-11', 'iphone-se-3', 'iphone-16e', 'iphone-air', 'iphone-17e'] as $slug) {
            $this->assertStringNotContainsString('mmWave', $red($slug), $slug);
        }

        $modelo = $this->modelo('iphone-11');
        $modelo['datos']['conectividad']['mmwave_en'] = 'EE. UU.';
        [$errores] = EsquemaCelular::revisar($modelo);
        $this->assertContains('Tiene unidades con 5G mmWave pero no tiene 5G.', $errores);
    }

    public function test_revisa_el_plegable_y_el_teleobjetivo_fusion(): void
    {
        $duo = $this->modelo('iphone-duo');
        $duo['datos']['diseno']['abierto_ancho_mm'] = false;   // plegable sin medidas abierto
        [$errores] = EsquemaCelular::revisar($duo);
        $this->assertContains('Una pantalla plegable necesita los datos de la pantalla exterior y las medidas abierto.', $errores);

        $pro = $this->modelo('iphone-17-pro');
        $pro['datos']['pantalla']['exterior_pulgadas'] = 5.4;   // pantalla exterior sin ser plegable
        $pro['datos']['camaras']['tele_mp'] = 12;               // el teleobjetivo Fusion es de 48 MP
        [$errores] = EsquemaCelular::revisar($pro);
        $this->assertContains('Tiene pantalla exterior o medidas abierto, pero no es plegable.', $errores);
        $this->assertContains('El teleobjetivo Fusion necesita un sensor de 48 MP o más.', $errores);

        $diecisiete = $this->modelo('iphone-17');
        $diecisiete['datos']['bateria']['video_exterior_h'] = 40;   // sin pantalla exterior
        [$errores] = EsquemaCelular::revisar($diecisiete);
        $this->assertContains('Tiene autonomía en la pantalla exterior, pero no tiene pantalla exterior.', $errores);
    }

    public function test_revisa_la_ultra_fusion_la_carga_rapida_con_magsafe_y_el_frente(): void
    {
        $modelo = $this->modelo('iphone-17');
        $modelo['datos']['camaras']['ultra_mp'] = 12;                   // la ultra Fusion es de 48 MP
        $modelo['datos']['bateria']['carga_rapida_magsafe'] = false;    // falta cuánto carga con MagSafe
        $modelo['datos']['diseno']['frente'] = 'Ceramic shield 2';      // mal escrito

        [$errores] = EsquemaCelular::revisar($modelo);

        $this->assertContains('La ultra gran angular Fusion necesita un sensor de 48 MP o más.', $errores);
        $this->assertContains('La carga rápida con MagSafe necesita cuánto carga y con qué adaptador.', $errores);
        $this->assertContains('diseno.frente debe ser vidrio o Ceramic Shield o Ceramic Shield 2.', $errores);
    }

    public function test_revisa_magsafe_rapido_y_camara_fusion(): void
    {
        $modelo = $this->modelo('iphone-16e');
        $modelo['datos']['bateria']['carga_rapida_magsafe_w'] = 30;   // el 16e no tiene MagSafe
        $modelo['datos']['camaras']['principal_mp'] = 12;               // Fusion es de 48 MP
        $modelo['datos']['camaras']['estabilizacion_tele'] = 'Estabilización óptica por desplazamiento del sensor en 3D';   // sin teleobjetivo

        [$errores] = EsquemaCelular::revisar($modelo);

        $this->assertContains('Tiene carga rápida con MagSafe pero no tiene MagSafe.', $errores);
        $this->assertContains('La cámara Fusion necesita un sensor de 48 MP o más.', $errores);
        $this->assertContains('Tiene estabilización del teleobjetivo pero no tiene teleobjetivo.', $errores);
    }

    public function test_revisa_estructura_conector_y_usb(): void
    {
        $modelo = $this->modelo('iphone-15-pro');
        $modelo['datos']['diseno']['estructura'] = 'Titanium';
        $modelo['datos']['conectividad']['conector'] = 'Lightning';

        [$errores] = EsquemaCelular::revisar($modelo);

        $this->assertContains('diseno.estructura debe ser Acero inoxidable o Aluminio o Unibody de aluminio o Titanio.', $errores);
        $this->assertContains('USB 3 solo es posible con conector USB-C.', $errores);
    }

    public function test_revisa_zoom_pantalla_siempre_activa_y_brillo_en_exteriores(): void
    {
        $modelo = $this->modelo('iphone-14-pro');
        $modelo['datos']['pantalla']['promotion'] = false;
        $modelo['datos']['pantalla']['frecuencia_hz'] = 60;
        $modelo['datos']['pantalla']['brillo_exteriores_nits'] = 1000;   // igual al brillo típico
        $modelo['datos']['camaras']['zoom_opciones'] = [0.5, 2.0, 3.0];  // sin 1x
        $modelo['datos']['camaras']['superalta_resolucion_mp'] = [48, 64];

        [$errores] = EsquemaCelular::revisar($modelo);

        $this->assertContains('Tiene pantalla siempre activa pero no ProMotion.', $errores);
        $this->assertContains('El brillo en exteriores debe ser mayor al brillo típico.', $errores);
        $this->assertContains('Las opciones de zoom deben incluir 1x y coincidir con el zoom mínimo y máximo.', $errores);
        $this->assertContains('Las fotos en superalta resolución no pueden superar los megapíxeles de la cámara principal.', $errores);

        $desordenado = $this->modelo('iphone-14-pro');
        $desordenado['datos']['camaras']['zoom_opciones'] = [0.5, 3.0, 2.0, 3.0];
        [$errores] = EsquemaCelular::revisar($desordenado);
        $this->assertContains('camaras.zoom_opciones debe ir de menor a mayor, sin repetir.', $errores);

        // Con sensor de 48 MP, un 2x sin teleobjetivo es válido (sale del centro del sensor).
        $sensor = $this->modelo('iphone-14');
        $sensor['datos']['camaras']['principal_mp'] = 48;
        $sensor['datos']['camaras']['zoom_optico_max'] = 2.0;
        $sensor['datos']['camaras']['zoom_opciones'] = [0.5, 1.0, 2.0];
        [$errores] = EsquemaCelular::revisar($sensor);
        $this->assertSame([], $errores);
    }

    public function test_promotion_exige_120_hz(): void
    {
        $modelo = $this->modelo('iphone-13-pro');
        $modelo['datos']['pantalla']['frecuencia_hz'] = 60;

        [$errores] = EsquemaCelular::revisar($modelo);

        $this->assertContains('Tiene ProMotion pero la frecuencia es menor a 120 Hz.', $errores);
    }

    public function test_el_seeder_guarda_datos_y_textos(): void
    {
        $this->seed(ModelosReferenciaSeeder::class);

        $doce = ModeloReferencia::where('slug', 'iphone-12')->first();
        $this->assertSame(6.1, $doce->datos['pantalla']['pulgadas']);
        $this->assertFalse($doce->datos['camaras']['tele_mp']);
        $this->assertSame('A14 Bionic', $doce->specs['chip']);
        $this->assertSame(17.0, $doce->autonomia_video_horas);
        $this->assertSame(2020, $doce->anio);
    }
}
