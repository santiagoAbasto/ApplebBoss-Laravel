<?php

namespace App\Support\FichaTecnica;

use Illuminate\Support\Arr;

/**
 * Qué datos debe tener la ficha de un iPhone para poder mostrarla, compararla y recomendarla.
 *
 * Tipos: string, int, float, bool, list, false (= «no tiene»), null (= el fabricante no lo publica).
 * Ningún campo puede faltar. Cada modelo documenta en `pendientes` lo que queda por completar:
 * - `falta`: el campo está en null esperando la fuente (solo los de PENDIENTES_PERMITIDOS).
 * - `verificar`: el dato está cargado pero no sale de la página oficial pegada; hay que confirmarlo.
 * Cada pendiente dice qué hay que confirmar (`detalle`) y dónde buscarlo (`fuente`).
 */
final class EsquemaCelular
{
    public const CAMPOS = [
        'pantalla.pulgadas'            => 'float',
        'pantalla.nombre'              => 'string',
        'pantalla.tecnologia'          => 'string',
        'pantalla.hdr'                 => 'bool',
        'pantalla.px_largo'            => 'int',
        'pantalla.px_corto'            => 'int',
        'pantalla.ppi'                 => 'int',
        'pantalla.contraste'           => 'string',
        'pantalla.true_tone'           => 'bool',
        'pantalla.gama_p3'             => 'bool',
        'pantalla.respuesta_tactil'    => 'string',
        'pantalla.brillo_nits'         => 'int',
        'pantalla.brillo_hdr_nits'     => 'int|null',
        'pantalla.brillo_exteriores_nits' => 'int|false',
        'pantalla.brillo_minimo_nits'  => 'int|false',
        'pantalla.frecuencia_hz'       => 'int',
        'pantalla.promotion'           => 'bool',
        'pantalla.dynamic_island'      => 'bool',
        'pantalla.siempre_activa'      => 'bool',
        'pantalla.plegable'            => 'bool',
        'pantalla.nanotexturizado'     => 'bool',
        'pantalla.exterior_pulgadas'   => 'float|false',
        'pantalla.exterior_px_largo'   => 'int|false',
        'pantalla.exterior_px_corto'   => 'int|false',
        'pantalla.exterior_ppi'        => 'int|false',
        'pantalla.apple_pencil'        => 'string|false',

        'rendimiento.chip'                  => 'string',
        'rendimiento.cpu_nucleos'           => 'int',
        'rendimiento.cpu_rendimiento'       => 'int',
        'rendimiento.cpu_eficiencia'        => 'int',
        'rendimiento.gpu_nucleos'           => 'int',
        'rendimiento.neural_engine_nucleos' => 'int',
        'rendimiento.trazado_rayos'         => 'bool',
        'rendimiento.gpu_neural_accelerators' => 'bool',
        'rendimiento.supernucleos'          => 'bool',
        'rendimiento.neural_engine_doble'   => 'bool',
        'rendimiento.ram_gb'                => 'int',

        'camaras.principal_mp'                => 'int',
        'camaras.fusion'                      => 'bool',
        'camaras.ultra_mp'                    => 'int|false',
        'camaras.ultra_fusion'                => 'bool',
        'camaras.tele_mp'                     => 'int|false',
        'camaras.tele_fusion'                 => 'bool',
        'camaras.apertura_variable'           => 'string|false',
        'camaras.controles_pro'               => 'bool',
        'camaras.enfoque_inteligente'         => 'bool',
        'camaras.otras_funciones'             => 'list|false',
        'camaras.zoom_optico_min'             => 'float',
        'camaras.zoom_optico_max'             => 'float',
        'camaras.zoom_opciones'               => 'list',
        'camaras.superalta_resolucion_mp'     => 'list|false',
        'camaras.estabilizacion'              => 'string',
        'camaras.estabilizacion_tele'         => 'string|false',
        'camaras.flash'                       => 'string',
        'camaras.modo_noche'                  => 'bool',
        'camaras.deep_fusion'                 => 'bool',
        'camaras.proraw'                      => 'bool',
        'camaras.lidar'                       => 'bool',
        'camaras.hdr_fotos'                   => 'string',
        'camaras.retrato'                     => 'string',
        'camaras.iluminacion_retrato_efectos' => 'int',
        'camaras.estilos_fotograficos'        => 'string|false',
        'camaras.macro'                       => 'bool',
        'camaras.photonic_engine'             => 'bool',
        'camaras.fotos_espaciales'            => 'bool',

        'video.resolucion_max'   => 'string',
        'video.dolby_vision_fps' => 'int',
        'video.camara_lenta'     => 'string',
        'video.quicktake'        => 'bool',
        'video.audio_estereo'    => 'bool',
        'video.estabilizacion'   => 'string',
        'video.modo_cine'        => 'string|false',
        'video.modo_accion'      => 'string|false',
        'video.prores'           => 'string|false',
        'video.espacial'         => 'string|false',
        'video.captura_dual'     => 'string|false',
        'video.apple_log'        => 'string|false',
        'video.aces'             => 'bool',
        'video.prores_raw'       => 'bool',
        'video.genlock'          => 'bool',
        'video.efectos_cine'     => 'bool',
        'video.poca_luz'         => 'bool',
        'video.time_lapse'       => 'string|false',
        'video.audio_espacial'   => 'bool',
        'video.microfonos_estudio' => 'bool',
        'video.reduccion_viento' => 'bool',
        'video.mezcla_audio'     => 'bool',

        'frontal.mp'                  => 'int',
        'frontal.nombre'              => 'string',
        'frontal.video'               => 'string',
        'frontal.dolby_vision_fps'    => 'int',
        'frontal.camara_lenta'        => 'string|false',
        'frontal.modo_noche'          => 'bool',
        'frontal.deep_fusion'         => 'bool',
        'frontal.hdr_fotos'           => 'string',
        'frontal.retrato'             => 'string',
        'frontal.quicktake'           => 'bool',
        'frontal.estabilizacion_cine' => 'string|false',
        'frontal.estilos_fotograficos' => 'string|false',
        'frontal.modo_cine'           => 'string|false',
        'frontal.photonic_engine'     => 'bool',
        'frontal.prores'              => 'string|false',
        'frontal.encuadre_centrado'   => 'bool',
        'frontal.video_ultraestabilizado' => 'bool',
        'frontal.enfoque_inteligente' => 'bool',
        'frontal.poca_luz'            => 'bool',
        'frontal.efectos_cine'        => 'bool',
        'frontal.time_lapse'          => 'string|false',
        'frontal.otras_funciones'     => 'list|false',
        'frontal.bajo_pantalla'       => 'string|false',

        'bateria.video_h'         => 'int',
        'bateria.streaming_h'     => 'int|null',
        'bateria.carga_rapida'    => 'string',
        'bateria.carga_rapida_w'  => 'int',
        'bateria.qi'              => 'bool',
        'bateria.qi_w'            => 'float|null',
        'bateria.magsafe_w'       => 'int',
        'bateria.qi2'             => 'bool',
        'bateria.carga_rapida_magsafe'   => 'string|false',
        'bateria.carga_rapida_magsafe_w' => 'int|false',
        'bateria.carga_rapida_voltaje_ajustable' => 'bool',
        'bateria.doble'                  => 'bool',
        'bateria.video_exterior_h'       => 'int|false',
        'bateria.streaming_exterior_h'   => 'int|false',
        'bateria.capacidad_mah'          => 'int',
        'bateria.capacidad_mah_solo_esim' => 'int|false',

        'conectividad.cinco_g'         => 'string|false',
        'conectividad.lte'             => 'string',
        'conectividad.wifi'            => 'string',
        'conectividad.bluetooth'       => 'string',
        'conectividad.nfc'             => 'string',
        'conectividad.uwb'             => 'string|false',
        'conectividad.gnss'            => 'string',
        'conectividad.volte'           => 'bool',
        'conectividad.llamadas_wifi'   => 'bool',
        'conectividad.sim'             => 'string',
        'conectividad.esim'            => 'bool',
        'conectividad.solo_esim_en'    => 'string|false',
        'conectividad.mmwave_en'       => 'string|false',
        'conectividad.conector'        => 'string',
        'conectividad.usb'             => 'string',
        'conectividad.tarjetas_expres' => 'string',
        'conectividad.thread'          => 'bool',

        'seguridad.biometria'      => 'string',
        'seguridad.emergencia_sos' => 'bool',
        'seguridad.sos_satelite'   => 'bool',
        'seguridad.deteccion_accidentes' => 'bool',

        'diseno.estructura'    => 'string',
        'diseno.frente'        => 'string',
        'diseno.dorso'         => 'string',
        'diseno.ip'            => 'string',
        'diseno.ip_metros'     => 'int',
        'diseno.ip_minutos'    => 'int',
        'diseno.alto_mm'       => 'float',
        'diseno.ancho_mm'      => 'float',
        'diseno.grosor_mm'     => 'float',
        'diseno.abierto_ancho_mm'  => 'float|false',
        'diseno.abierto_grosor_mm' => 'float|false',
        'diseno.peso_g'        => 'int',
        'diseno.colores'       => 'list',
        'diseno.capacidades_gb' => 'list',
        'diseno.boton_accion'  => 'bool',
        'diseno.control_camara' => 'bool',

        'sistema.anio'            => 'int',
        'sistema.ios_lanzamiento' => 'string',
        'sistema.ios_maximo'      => 'string',
        'sistema.numeros_modelo'  => 'list',
        'sistema.apple_intelligence' => 'bool',
    ];

    /**
     * Campos que pueden esperar su fuente: la lista de compatibilidad de iOS, los números de modelo y lo que Apple no publica
     * (RAM y capacidad de batería), que se carga cuando lo confirman fuentes externas.
     */
    public const PENDIENTES_PERMITIDOS = [
        'sistema.ios_maximo', 'sistema.numeros_modelo', 'rendimiento.ram_gb', 'bateria.capacidad_mah', 'bateria.capacidad_mah_solo_esim',
    ];

    public const TIPOS_PENDIENTE = [
        'falta'     => 'Falta el dato',
        'verificar' => 'Por verificar',
    ];

    /** Rangos razonables: detectan errores de tipeo (1640 g, 61 pulgadas…). */
    private const RANGOS = [
        'pantalla.pulgadas'        => [3.5, 8],
        'pantalla.ppi'             => [250, 600],
        'pantalla.exterior_pulgadas' => [3.5, 8],
        'pantalla.exterior_ppi'    => [250, 600],
        'pantalla.brillo_nits'     => [400, 3000],
        'pantalla.brillo_exteriores_nits' => [1000, 3000],
        'camaras.zoom_optico_min'  => [0.5, 1],
        'camaras.zoom_optico_max'  => [1, 15],
        'bateria.video_h'          => [8, 45],
        'bateria.video_exterior_h' => [8, 60],
        'bateria.carga_rapida_w'   => [5, 60],
        'bateria.capacidad_mah'    => [1500, 7000],
        'bateria.capacidad_mah_solo_esim' => [1500, 7000],
        'rendimiento.ram_gb'       => [2, 24],
        'diseno.alto_mm'           => [110, 180],
        'diseno.ancho_mm'          => [55, 85],
        'diseno.grosor_mm'         => [5, 12],
        'diseno.abierto_ancho_mm'  => [100, 200],
        'diseno.abierto_grosor_mm' => [3, 12],
        'diseno.peso_g'            => [100, 260],
        'sistema.anio'             => [2007, 2035],
    ];

    private const VALORES = [
        'pantalla.tecnologia' => ['OLED', 'LCD'],
        'diseno.ip'           => ['IP67', 'IP68'],
        'diseno.estructura'   => ['Acero inoxidable', 'Aluminio', 'Unibody de aluminio', 'Titanio'],
        'diseno.frente'       => ['vidrio', 'Ceramic Shield', 'Ceramic Shield 2'],
        'conectividad.conector' => ['Lightning', 'USB-C'],
    ];

    /**
     * @return array{0: list<string>, 1: list<string>} [errores, pendientes]
     */
    public static function revisar(array $modelo): array
    {
        $datos = $modelo['datos'] ?? null;
        if (! is_array($datos)) {
            return [['No tiene datos estructurados.'], []];
        }

        [$declarados, $errores] = self::revisarPendientes($modelo['pendientes'] ?? [], $datos);
        $pendientes = [];

        foreach (self::CAMPOS as $ruta => $tipo) {
            if (! Arr::has($datos, $ruta)) {
                $errores[] = "Falta {$ruta}.";
                continue;
            }

            $valor = Arr::get($datos, $ruta);

            if ($valor === null && in_array($ruta, $declarados, true) && in_array($ruta, self::PENDIENTES_PERMITIDOS, true)) {
                $pendientes[] = $ruta;
                continue;
            }

            if (! self::cumple($valor, $tipo)) {
                $errores[] = "{$ruta} debe ser {$tipo}.";
                continue;
            }

            if (isset(self::RANGOS[$ruta]) && is_numeric($valor)) {
                [$min, $max] = self::RANGOS[$ruta];
                if ($valor < $min || $valor > $max) {
                    $errores[] = "{$ruta} = {$valor} está fuera de rango ({$min}–{$max}).";
                }
            }

            if (isset(self::VALORES[$ruta]) && ! in_array($valor, self::VALORES[$ruta], true)) {
                $errores[] = "{$ruta} debe ser " . implode(' o ', self::VALORES[$ruta]) . '.';
            }
        }

        foreach (array_keys(Arr::dot($datos)) as $ruta) {
            $base = preg_replace('/\.\d+$/', '', $ruta);
            if (! isset(self::CAMPOS[$base])) {
                $errores[] = "Clave desconocida: {$base}.";
            }
        }

        $d = $datos;
        if (isset($d['rendimiento']['cpu_nucleos'], $d['rendimiento']['cpu_rendimiento'], $d['rendimiento']['cpu_eficiencia'])
            && $d['rendimiento']['cpu_rendimiento'] + $d['rendimiento']['cpu_eficiencia'] !== $d['rendimiento']['cpu_nucleos']) {
            $errores[] = 'Los núcleos de rendimiento y eficiencia no suman los núcleos de la CPU.';
        }
        // La batería aparte de las unidades solo eSIM: solo si existen y si es más grande (ocupa el lugar de la bandeja SIM).
        $esim = $d['bateria']['capacidad_mah_solo_esim'] ?? false;
        if (is_int($esim)) {
            if (($d['conectividad']['solo_esim_en'] ?? false) === false) {
                $errores[] = 'Tiene batería de unidades solo eSIM, pero no hay unidades solo eSIM.';
            } elseif (is_int($d['bateria']['capacidad_mah'] ?? null) && $esim <= $d['bateria']['capacidad_mah']) {
                $errores[] = 'La batería de las unidades solo eSIM debe ser más grande que la de las unidades con SIM.';
            }
        }
        $c = $d['camaras'] ?? [];
        $p = $d['pantalla'] ?? [];

        // Con un sensor de 48 MP o más, el 2x sale de la parte central del sensor: no necesita teleobjetivo.
        $zoomDelSensor = ($c['principal_mp'] ?? 0) >= 48 && ($c['zoom_optico_max'] ?? 1) <= 2;
        if (($c['tele_mp'] ?? false) === false && ($c['zoom_optico_max'] ?? 1) > 1 && ! $zoomDelSensor) {
            $errores[] = 'Tiene zoom óptico mayor a 1x pero no tiene teleobjetivo.';
        }
        $zoom = $c['zoom_opciones'] ?? null;
        if (is_array($zoom) && $zoom !== [] && array_is_list($zoom)) {
            $crece = true;
            foreach ($zoom as $i => $z) {
                if ((! is_int($z) && ! is_float($z)) || ($i > 0 && $z <= $zoom[$i - 1])) {
                    $crece = false;
                }
            }
            if (! $crece) {
                $errores[] = 'camaras.zoom_opciones debe ir de menor a mayor, sin repetir.';
            } elseif (! in_array(1.0, array_map('floatval', $zoom), true)
                || (float) $zoom[0] !== (float) ($c['zoom_optico_min'] ?? 0)
                || (float) $zoom[count($zoom) - 1] !== (float) ($c['zoom_optico_max'] ?? 0)) {
                $errores[] = 'Las opciones de zoom deben incluir 1x y coincidir con el zoom mínimo y máximo.';
            }
        }
        if (is_array($c['superalta_resolucion_mp'] ?? false) && is_int($c['principal_mp'] ?? null)
            && array_filter($c['superalta_resolucion_mp'], fn ($mp) => ! is_int($mp) || $mp > $c['principal_mp'])) {
            $errores[] = 'Las fotos en superalta resolución no pueden superar los megapíxeles de la cámara principal.';
        }
        $n = $d['conectividad'] ?? [];
        if (str_starts_with((string) ($n['usb'] ?? ''), 'USB 3') && ($n['conector'] ?? null) !== 'USB-C') {
            $errores[] = 'USB 3 solo es posible con conector USB-C.';
        }
        if (($n['solo_esim_en'] ?? false) && ! ($n['esim'] ?? false)) {
            $errores[] = 'Tiene unidades solo eSIM pero no admite eSIM.';
        }
        if (($n['mmwave_en'] ?? false) && ! ($n['cinco_g'] ?? false)) {
            $errores[] = 'Tiene unidades con 5G mmWave pero no tiene 5G.';
        }
        $b = $d['bateria'] ?? [];
        if (($b['carga_rapida_magsafe_w'] ?? false) && ! ($b['magsafe_w'] ?? 0)) {
            $errores[] = 'Tiene carga rápida con MagSafe pero no tiene MagSafe.';
        }
        if (($b['carga_rapida_magsafe'] ?? false) === false xor ($b['carga_rapida_magsafe_w'] ?? false) === false) {
            $errores[] = 'La carga rápida con MagSafe necesita cuánto carga y con qué adaptador.';
        }
        if (($c['fusion'] ?? false) && ($c['principal_mp'] ?? 0) < 48) {
            $errores[] = 'La cámara Fusion necesita un sensor de 48 MP o más.';
        }
        if (($c['ultra_fusion'] ?? false) && (! is_int($c['ultra_mp'] ?? false) || $c['ultra_mp'] < 48)) {
            $errores[] = 'La ultra gran angular Fusion necesita un sensor de 48 MP o más.';
        }
        if (($c['tele_fusion'] ?? false) && (! is_int($c['tele_mp'] ?? false) || $c['tele_mp'] < 48)) {
            $errores[] = 'El teleobjetivo Fusion necesita un sensor de 48 MP o más.';
        }

        // Plegable: pantalla exterior completa y medidas abierto; si no es plegable, nada de eso.
        $x = $d['diseno'] ?? [];
        $delPlegable = [
            $p['exterior_pulgadas'] ?? false, $p['exterior_px_largo'] ?? false, $p['exterior_px_corto'] ?? false,
            $p['exterior_ppi'] ?? false, $x['abierto_ancho_mm'] ?? false, $x['abierto_grosor_mm'] ?? false,
        ];
        if (($p['plegable'] ?? false) && in_array(false, $delPlegable, true)) {
            $errores[] = 'Una pantalla plegable necesita los datos de la pantalla exterior y las medidas abierto.';
        }
        if (! ($p['plegable'] ?? false) && array_filter($delPlegable, fn ($v) => $v !== false)) {
            $errores[] = 'Tiene pantalla exterior o medidas abierto, pero no es plegable.';
        }
        if ((($b['video_exterior_h'] ?? false) !== false || ($b['streaming_exterior_h'] ?? false) !== false)
            && ($p['exterior_pulgadas'] ?? false) === false) {
            $errores[] = 'Tiene autonomía en la pantalla exterior, pero no tiene pantalla exterior.';
        }
        if (($c['estabilizacion_tele'] ?? false) && ($c['tele_mp'] ?? false) === false) {
            $errores[] = 'Tiene estabilización del teleobjetivo pero no tiene teleobjetivo.';
        }
        if (($p['promotion'] ?? false) && ($p['frecuencia_hz'] ?? 0) < 120) {
            $errores[] = 'Tiene ProMotion pero la frecuencia es menor a 120 Hz.';
        }
        if (($p['siempre_activa'] ?? false) && ! ($p['promotion'] ?? false)) {
            $errores[] = 'Tiene pantalla siempre activa pero no ProMotion.';
        }
        if (is_int($p['brillo_exteriores_nits'] ?? false) && is_int($p['brillo_nits'] ?? null)
            && $p['brillo_exteriores_nits'] <= $p['brillo_nits']) {
            $errores[] = 'El brillo en exteriores debe ser mayor al brillo típico.';
        }
        if (($d['camaras']['ultra_mp'] ?? false) === false && ($d['camaras']['zoom_optico_min'] ?? 1) < 1) {
            $errores[] = 'Tiene zoom óptico de 0,5x pero no tiene ultra gran angular.';
        }

        return [array_values(array_unique($errores)), $pendientes];
    }

    /**
     * Revisa que cada pendiente esté bien documentado y sea coherente con los datos.
     *
     * @return array{0: list<string>, 1: list<string>} [campos que faltan, errores]
     */
    private static function revisarPendientes(mixed $items, array $datos): array
    {
        if (! is_array($items) || ! array_is_list($items)) {
            return [[], ['pendientes debe ser una lista.']];
        }

        $faltan = [];
        $errores = [];
        $vistos = [];

        foreach ($items as $i => $item) {
            $campo = is_array($item) ? ($item['campo'] ?? null) : null;
            if (! is_string($campo) || ! isset(self::CAMPOS[$campo])) {
                $errores[] = 'Pendiente ' . ($i + 1) . ': el campo ' . (is_string($campo) ? "«{$campo}» " : '') . 'no existe en el esquema.';
                continue;
            }

            if (isset($vistos[$campo])) {
                $errores[] = "{$campo} figura dos veces en pendientes.";
            }
            $vistos[$campo] = true;

            foreach (['detalle', 'fuente'] as $clave) {
                if (! is_string($item[$clave] ?? null) || trim($item[$clave]) === '') {
                    $errores[] = "{$campo}: el pendiente necesita {$clave}.";
                }
            }
            if (array_diff(array_keys($item), ['campo', 'tipo', 'detalle', 'fuente'])) {
                $errores[] = "{$campo}: el pendiente solo lleva campo, tipo, detalle y fuente.";
            }

            $tipo = $item['tipo'] ?? null;
            $valor = Arr::get($datos, $campo);

            if ($tipo === 'falta') {
                if (! in_array($campo, self::PENDIENTES_PERMITIDOS, true)) {
                    $errores[] = "{$campo} no puede quedar pendiente.";
                } elseif ($valor !== null) {
                    $errores[] = "{$campo} figura como pendiente pero ya tiene valor: quítalo de la lista o márcalo para verificar.";
                } else {
                    $faltan[] = $campo;
                }
            } elseif ($tipo === 'verificar') {
                if ($valor === null) {
                    $errores[] = "{$campo} está por verificar pero no tiene valor: márcalo como falta.";
                }
            } else {
                $errores[] = "{$campo}: el tipo de pendiente debe ser falta o verificar.";
            }
        }

        return [$faltan, $errores];
    }

    private static function cumple(mixed $valor, string $tipo): bool
    {
        foreach (explode('|', $tipo) as $t) {
            $ok = match ($t) {
                'string' => is_string($valor) && trim($valor) !== '',
                'int'    => is_int($valor),
                'float'  => is_int($valor) || is_float($valor),
                'bool'   => is_bool($valor),
                'list'   => is_array($valor) && $valor !== [] && array_is_list($valor),
                'false'  => $valor === false,
                'null'   => $valor === null,
                default  => false,
            };
            if ($ok) {
                return true;
            }
        }

        return false;
    }
}
