<?php

namespace App\Support\FichaTecnica;

/**
 * Arma los textos de la ficha que se leen en la tienda a partir de los datos estructurados de un iPhone.
 * Una sola fuente: si cambia un dato, el texto cambia con él. Lo que el modelo no tiene no se muestra
 * en la ficha (la comparativa usa los datos, donde sí figura como «no tiene»). La excepción, Apple
 * Intelligence «No compatible», la agrega ModeloReferencia::fichaParaPublicacion().
 */
final class TextosCelular
{
    public static function desde(array $d): array
    {
        $p = $d['pantalla'];
        $r = $d['rendimiento'];
        $c = $d['camaras'];
        $v = $d['video'];
        $f = $d['frontal'];
        $b = $d['bateria'];
        $n = $d['conectividad'];
        $s = $d['seguridad'];
        $x = $d['diseno'];
        $o = $d['sistema'];

        $brilloExtra = self::lista([
            $p['brillo_hdr_nits'] ? self::miles($p['brillo_hdr_nits']) . ' nits en HDR' : null,
            $p['brillo_exteriores_nits'] ? self::miles($p['brillo_exteriores_nits']) . ' nits en exteriores' : null,
            $p['brillo_minimo_nits'] ? 'mínimo de ' . self::miles($p['brillo_minimo_nits']) . ($p['brillo_minimo_nits'] === 1 ? ' nit' : ' nits') : null,
        ]);

        $textos = [
            'tamano_pantalla'  => self::num($p['pulgadas']) . ' pulgadas'
                                  . ($p['exterior_pulgadas'] ? ' (interior) y ' . self::num($p['exterior_pulgadas']) . ' pulgadas (exterior)' : ''),
            'pantalla'         => "{$p['nombre']} ({$p['tecnologia']})" . ($p['hdr'] ? ' con HDR' : ''),
            'resolucion'       => self::resolucion($p['px_largo'], $p['px_corto'], $p['ppi'])
                                  . ($p['exterior_pulgadas']
                                      ? ' (interior) · ' . self::resolucion($p['exterior_px_largo'], $p['exterior_px_corto'], $p['exterior_ppi']) . ' (exterior)'
                                      : ''),
            'tasa_refresco'    => $p['promotion'] ? 'ProMotion hasta 120 Hz' : "{$p['frecuencia_hz']} Hz",
            'funciones_pantalla' => self::lista([
                $p['plegable'] ? 'Pantalla interior plegable' . ($p['nanotexturizado'] ? ' con acabado nanotexturizado' : '')
                               : ($p['nanotexturizado'] ? 'Acabado nanotexturizado' : null),
                $p['dynamic_island'] ? 'Dynamic Island' : null,
                $p['siempre_activa'] ? 'Pantalla siempre activa' : null,
                $p['true_tone'] ? 'True Tone' : null,
                $p['gama_p3'] ? 'Gama cromática amplia (P3)' : null,
                $p['apple_pencil'] ? "Compatible con el {$p['apple_pencil']}" : null,
            ]),
            'brillo'           => self::miles($p['brillo_nits']) . ' nits' . ($brilloExtra ? " ({$brilloExtra})" : ''),
            'contraste'        => "{$p['contraste']} (típico)",
            'respuesta_tactil' => $p['respuesta_tactil'],

            'chip'          => $r['chip'],
            'ram'           => $r['ram_gb'] ? "{$r['ram_gb']} GB" : null,   // null mientras ninguna fuente la confirme
            'cpu_cores'     => "{$r['cpu_nucleos']} núcleos ({$r['cpu_rendimiento']} " . ($r['supernucleos'] ? 'supernúcleos' : 'de rendimiento')
                               . " y {$r['cpu_eficiencia']} de eficiencia)",
            'gpu_cores'     => "{$r['gpu_nucleos']} núcleos" . self::con([
                $r['gpu_neural_accelerators'] ? 'Neural Accelerators' : null,
                $r['trazado_rayos'] ? 'trazado de rayos por hardware' : null,
            ]),
            'neural_engine' => ($r['neural_engine_doble'] ? 'Doble de ' : '') . "{$r['neural_engine_nucleos']} núcleos",
            'apple_intelligence' => $o['apple_intelligence'] ? 'Compatible' : null,

            'sistema_camaras'  => self::sistemaCamaras($c),
            'camara_principal' => "{$c['principal_mp']} MP" . ($c['fusion'] ? ' Fusion' : '')
                                  . ($c['apertura_variable'] ? " · apertura variable ({$c['apertura_variable']})" : '') . ' · '
                                  . self::minuscula(str_replace(' (cámara principal)', '', $c['estabilizacion'])),
            'camara_ultra'     => $c['ultra_mp'] ? "{$c['ultra_mp']} MP" . ($c['ultra_fusion'] ? ' Fusion' : '') . ' · ' . self::num($c['zoom_optico_min']) . 'x' : null,
            'teleobjetivo'     => $c['tele_mp'] ? "{$c['tele_mp']} MP" . ($c['tele_fusion'] ? ' Fusion' : '') . ' · zoom óptico ' . self::num($c['zoom_optico_max']) . 'x'
                                  . ($c['estabilizacion_tele'] ? ' · ' . self::minuscula($c['estabilizacion_tele']) : '') : null,
            'zoom_optico'      => self::enumerar(array_map(fn ($z) => self::num($z) . 'x', $c['zoom_opciones'])),
            'lidar'            => $c['lidar'] ? 'Sí' : null,
            'funciones_foto'   => self::lista([
                $c['superalta_resolucion_mp'] ? 'Fotos en superalta resolución (' . self::enumerar($c['superalta_resolucion_mp']) . ' MP)' : null,
                ...($c['otras_funciones'] ?: []),
                $c['controles_pro'] ? 'Controles Pro (apertura del objetivo, velocidad del obturador, balance de blancos e histograma)' : null,
                $c['enfoque_inteligente'] ? 'Enfoque con seguimiento inteligente' : null,
                $c['modo_noche'] ? 'Modo Noche' : null,
                $c['deep_fusion'] ? 'Deep Fusion' : null,
                $c['photonic_engine'] ? 'Photonic Engine' : null,
                $c['proraw'] ? 'ProRAW' : null,
                $c['macro'] ? 'Fotografía macro' : null,
                $c['fotos_espaciales'] ? 'Fotos espaciales' : null,
                $c['estilos_fotograficos'] ?: null,
                $c['hdr_fotos'],
                $c['retrato'] . ($c['iluminacion_retrato_efectos'] ? " (Iluminación de Retratos con {$c['iluminacion_retrato_efectos']} efectos)" : ''),
                "Flash {$c['flash']}",
            ]),
            'video'            => $v['resolucion_max'] . self::dolbyVision($v['resolucion_max'], $v['dolby_vision_fps'])
                                  . ($v['modo_cine'] ? " · Modo Cine ({$v['modo_cine']})" : '')
                                  . ($v['efectos_cine'] ? ' · efectos del modo Cine' : '')
                                  . ($v['modo_accion'] ? " · Modo Acción ({$v['modo_accion']})" : '')
                                  . ($v['captura_dual'] ? " · Captura Dual ({$v['captura_dual']})" : '')
                                  . ($v['prores'] ? " · ProRes {$v['prores']}" : '')
                                  . ($v['prores_raw'] ? ' · ProRes RAW' : '')
                                  . ($v['espacial'] ? " · video espacial ({$v['espacial']})" : '')
                                  . ($v['apple_log'] ? " · {$v['apple_log']}" : '')
                                  . ($v['aces'] ? ' · ACES' : '')
                                  . ($v['genlock'] ? ' · Genlock' : '')
                                  . ($c['macro'] ? ' · video macro' : '')
                                  . ($v['time_lapse'] ? " · time-lapse estabilizado ({$v['time_lapse']})" : '')
                                  . " · cámara lenta {$v['camara_lenta']}"
                                  . ($v['quicktake'] ? ' · QuickTake' : '')
                                  . ($c['controles_pro'] ? ' · Controles Pro' : '')
                                  . ($c['enfoque_inteligente'] ? ' · enfoque con seguimiento inteligente' : '')
                                  . ($v['poca_luz'] ? ' · mejores videos con poca luz' : '')
                                  . ($v['audio_estereo'] ? ' · grabación en estéreo' : '')
                                  . ($v['audio_espacial'] ? ' · audio espacial' : '')
                                  . ($v['microfonos_estudio'] ? ' · cuatro micrófonos con calidad de estudio' : '')
                                  . ($v['reduccion_viento'] ? ' · reducción de ruido del viento' : '')
                                  . ($v['mezcla_audio'] ? ' · Mezcla de Audio' : '')
                                  . ' · ' . self::minuscula($v['estabilizacion']),
            'camara_frontal'   => self::lista([
                "{$f['mp']} MP {$f['nombre']}",
                $f['encuadre_centrado'] ? 'Encuadre Centrado para fotos y videollamadas' : null,
                ...($f['otras_funciones'] ?: []),
                $f['enfoque_inteligente'] ? 'Enfoque con seguimiento inteligente' : null,
                $f['modo_noche'] ? 'Modo Noche' : null,
                $f['photonic_engine'] ? 'Photonic Engine' : null,
                $f['deep_fusion'] ? 'Deep Fusion' : null,
                $f['estilos_fotograficos'] ?: null,
                $f['hdr_fotos'],
                $f['retrato'],
                $f['bajo_pantalla'] ? "Cámara FaceTime bajo la pantalla ({$f['bajo_pantalla']})" : null,
            ]),
            'video_frontal'    => $f['video'] . self::dolbyVision($f['video'], $f['dolby_vision_fps'])
                                  . ($f['modo_cine'] ? " · Modo Cine ({$f['modo_cine']})" : '')
                                  . ($f['efectos_cine'] ? ' · efectos del modo Cine' : '')
                                  . ($f['prores'] ? " · ProRes {$f['prores']}" : '')
                                  . ($f['camara_lenta'] ? " · cámara lenta {$f['camara_lenta']}" : '')
                                  . ($f['time_lapse'] ? " · time-lapse estabilizado ({$f['time_lapse']})" : '')
                                  . ($f['quicktake'] ? ' · QuickTake' : '')
                                  . ($f['poca_luz'] ? ' · mejores videos con poca luz' : '')
                                  . ($f['video_ultraestabilizado'] ? ' · video ultraestabilizado' : '')
                                  . ($f['estabilizacion_cine'] ? " · estabilización de calidad cine ({$f['estabilizacion_cine']})" : ''),

            'autonomia'         => ($b['doble'] ? 'Doble batería: hasta ' : 'Hasta ') . "{$b['video_h']} h de reproducción de video"
                                   . ($b['streaming_h'] ? " ({$b['streaming_h']} h en streaming)" : '')
                                   . ($b['video_exterior_h']
                                       ? " en la pantalla interior y hasta {$b['video_exterior_h']} h"
                                         . ($b['streaming_exterior_h'] ? " ({$b['streaming_exterior_h']} h en streaming)" : '') . ' en la exterior'
                                       : ''),
            'bateria_mah'       => $b['capacidad_mah']
                                   ? self::miles($b['capacidad_mah']) . ' mAh'
                                     . ($b['capacidad_mah_solo_esim'] ? '; ' . self::miles($b['capacidad_mah_solo_esim']) . ' mAh en las unidades solo eSIM' : '')
                                   : null,
            'carga'             => "Carga rápida: {$b['carga_rapida']} con un adaptador de {$b['carga_rapida_w']} W o superior"
                                   . ($b['carga_rapida_voltaje_ajustable'] ? ' con fuente de voltaje ajustable' : '') . self::cargaMagSafe($b),
            'carga_inalambrica' => self::lista([
                $b['magsafe_w'] ? "MagSafe hasta {$b['magsafe_w']} W" : null,
                $b['qi2'] ? 'Qi2' : null,
                $b['qi'] ? 'Qi' . ($b['qi_w'] ? ' hasta ' . self::num($b['qi_w']) . ' W' : '') : null,
            ]),
            'puerto'            => "{$n['conector']} ({$n['usb']})",

            'red'              => self::lista([$n['cinco_g'] ?: null, $n['lte']])
                                  . ($n['mmwave_en'] ? "; las unidades de {$n['mmwave_en']} también admiten 5G mmWave" : ''),
            'sim'              => $n['sim'] . ($n['solo_esim_en'] ? "; las unidades de {$n['solo_esim_en']} son solo eSIM" : ''),
            'wifi'             => $n['wifi'],
            'bluetooth'        => $n['bluetooth'],
            'nfc'              => $n['nfc'],
            'banda_ultraancha' => $n['uwb'] ?: null,
            'thread'           => $n['thread'] ? 'Sí' : null,
            'gps'              => $n['gnss'],
            'biometria'        => $s['biometria'],
            'seguridad'        => self::lista([
                $s['emergencia_sos'] ? 'Emergencia SOS' : null,
                // Apple no la ofrece en Bolivia ni en el resto de Sudamérica (support.apple.com/es-es/101573, verificado el 2026-09-15).
                $s['sos_satelite'] ? 'SOS vía satélite (no disponible en Bolivia)' : null,
                $s['deteccion_accidentes'] ? 'Detección de accidentes' : null,
            ]),

            'material'    => "{$x['estructura']} con frente " . self::material($x['frente']) . ' y dorso ' . self::material($x['dorso']),
            'resistencia' => "{$x['ip']} · hasta {$x['ip_metros']} m durante {$x['ip_minutos']} min",
            'dimensiones' => self::num($x['alto_mm']) . ' × ' . self::num($x['ancho_mm']) . ' × ' . self::num($x['grosor_mm']) . ' mm'
                             . ($x['abierto_ancho_mm']
                                 ? ' cerrado · ' . self::num($x['alto_mm']) . ' × ' . self::num($x['abierto_ancho_mm']) . ' × '
                                   . self::num($x['abierto_grosor_mm']) . ' mm abierto'
                                 : ''),
            'peso'        => "{$x['peso_g']} g",
            'boton_accion' => $x['boton_accion'] ? 'Sí' : null,
            'control_camara' => $x['control_camara'] ? 'Sí' : null,

            'lanzamiento_so' => $o['ios_lanzamiento'],

            'ultimo_ios' => $o['ios_maximo'] ?: null,
            'generacion'     => (string) $o['anio'],
            'modelo'         => $o['numeros_modelo']
                                ? self::enumerar($o['numeros_modelo'], 'o') . (count($o['numeros_modelo']) > 1 ? ' (según el país)' : '')
                                : null,

            'capacidades_disponibles' => array_map(fn ($gb) => $gb >= 1024 ? self::num($gb / 1024) . ' TB' : "{$gb} GB", $x['capacidades_gb']),
            'colores_disponibles'     => $x['colores'],
        ];

        return array_filter($textos, fn ($t) => $t !== null && $t !== '' && $t !== []);
    }

    /**
     * "Una cámara de 12 MP", "Triple de 12 MP (principal, ultra gran angular y teleobjetivo)",
     * "Doble Fusion de 48 MP (principal y ultra gran angular)" si todas son Fusion o, si la principal tiene
     * más megapíxeles, "Triple con principal de 48 MP (ultra gran angular y teleobjetivo de 12 MP)".
     */
    private static function sistemaCamaras(array $c): string
    {
        $otras = array_filter(['ultra gran angular' => $c['ultra_mp'], 'teleobjetivo' => $c['tele_mp']]);
        if ($otras === []) {
            return 'Una cámara' . ($c['fusion'] ? ' Fusion' : '') . " de {$c['principal_mp']} MP";
        }

        $principal = $c['fusion'] ? 'principal Fusion' : 'principal';
        $cantidad = count($otras) === 1 ? 'Doble' : 'Triple';
        $mpOtras = array_values(array_unique($otras));
        $esFusion = array_intersect_key(['ultra gran angular' => $c['ultra_fusion'], 'teleobjetivo' => $c['tele_fusion']], $otras);
        $lente = fn (string $nombre) => $esFusion[$nombre] ? "{$nombre} Fusion" : $nombre;

        if ($mpOtras === [$c['principal_mp']]) {
            if ($c['fusion'] && ! in_array(false, $esFusion, true)) {
                return "{$cantidad} Fusion de {$c['principal_mp']} MP (" . self::enumerar(['principal', ...array_keys($otras)]) . ')';
            }

            return "{$cantidad} de {$c['principal_mp']} MP (" . self::enumerar([$principal, ...array_map($lente, array_keys($otras))]) . ')';
        }

        $detalle = count($mpOtras) === 1
            ? self::enumerar(array_map($lente, array_keys($otras))) . " de {$mpOtras[0]} MP"
            : self::enumerar(array_map(fn ($nombre, $mp) => $lente($nombre) . " de {$mp} MP", array_keys($otras), $otras));

        return "{$cantidad} con {$principal} de {$c['principal_mp']} MP ({$detalle})";
    }

    /** "Carga rápida: … por cable, o con MagSafe…" (mismo tiempo) o "…por cable; 50 % en 30 min con MagSafe…" (distinto). */
    private static function cargaMagSafe(array $b): string
    {
        if (! $b['carga_rapida_magsafe_w']) {
            return '';
        }

        return $b['carga_rapida_magsafe'] === $b['carga_rapida']
            ? " por cable, o con MagSafe y un adaptador de {$b['carga_rapida_magsafe_w']} W o superior"
            : " por cable; {$b['carga_rapida_magsafe']} con MagSafe y un adaptador de {$b['carga_rapida_magsafe_w']} W o superior";
    }

    /** 2868, 1320, 460 → "2.868 × 1.320 px a 460 ppi" */
    private static function resolucion(int $largo, int $corto, int $ppi): string
    {
        return self::miles($largo) . ' × ' . self::miles($corto) . " px a {$ppi} ppi";
    }

    /** "vidrio" → "de vidrio"; los nombres propios van tal cual: "Ceramic Shield 2". */
    private static function material(string $m): string
    {
        return preg_match('/^\p{Lu}/u', $m) ? $m : "de {$m}";
    }

    /** ['Neural Accelerators', 'trazado de rayos'] → " con Neural Accelerators y trazado de rayos"; [] → "" */
    private static function con(array $partes): string
    {
        $partes = array_values(array_filter($partes));

        return $partes === [] ? '' : ' con ' . self::enumerar($partes);
    }

    /** "4K hasta 60 fps" + 60 → " con Dolby Vision"; "4K hasta 60 fps" + 30 → " con Dolby Vision hasta 30 fps"; 0 → "" */
    private static function dolbyVision(string $video, int $fps): string
    {
        if (! $fps) {
            return '';
        }

        return str_contains($video, "hasta {$fps} fps") ? ' con Dolby Vision' : " con Dolby Vision hasta {$fps} fps";
    }

    private static function lista(array $partes): string
    {
        return implode(' · ', array_filter($partes, fn ($p) => $p !== null && $p !== ''));
    }

    /** ['0,5x', '1x', '3x'] → "0,5x, 1x y 3x"; con 'o': "A2111, A2221 o A2223" */
    private static function enumerar(array $partes, string $conjuncion = 'y'): string
    {
        $ultima = array_pop($partes);

        return $partes === [] ? (string) $ultima : implode(', ', $partes) . " {$conjuncion} {$ultima}";
    }

    /** 146.7 → "146,7"; 158.0 → "158"; 0.5 → "0,5" */
    private static function num(int|float $n): string
    {
        return rtrim(rtrim(number_format((float) $n, 2, ',', '.'), '0'), ',');
    }

    private static function miles(int $n): string
    {
        return number_format($n, 0, ',', '.');
    }

    private static function minuscula(string $t): string
    {
        return mb_strtolower(mb_substr($t, 0, 1)) . mb_substr($t, 1);
    }
}
