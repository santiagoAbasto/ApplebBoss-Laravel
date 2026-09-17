<?php

namespace App\Support\FichaTecnica;

/**
 * Arma los textos de la ficha de una Mac a partir de sus datos estructurados (una sola fuente: si cambia un dato, cambia
 * el texto). Lo que el modelo no tiene no se escribe: la ficha no lo muestra y la comparativa lo marca como «no tiene».
 * La memoria, el almacenamiento y el color de cada equipo salen del inventario; aquí van las opciones del modelo
 * (`memorias_disponibles`, `almacenamientos_disponibles` y `colores_disponibles`, solo para la comparativa).
 */
final class TextosComputadora
{
    public static function desde(array $d): array
    {
        $p = $d['pantalla'];
        $r = $d['rendimiento'];
        $b = $d['bateria'];
        $n = $d['conectividad'];
        $m = $d['multimedia'];
        $e = $d['entrada'];
        $x = $d['diseno'];
        $s = $d['sistema'];
        $portatil = $x['formato'] === 'portatil';
        $apple = $r['arquitectura'] === 'apple';

        $textos = [
            'tamano_pantalla'    => self::num($p['pulgadas']) . ' pulgadas'
                                    . ($p['diagonal_exacta'] ? ' (' . self::num($p['diagonal_exacta']) . ' en diagonal)' : ''),
            'pantalla'           => $p['nombre'] . ($p['tecnologia'] ? " ({$p['tecnologia']})" : ''),
            'resolucion'         => self::miles($p['px_ancho']) . ' × ' . self::miles($p['px_alto']) . ' px' . ($p['ppi'] ? " a {$p['ppi']} ppi" : ''),
            'tasa_refresco'      => $p['promotion'] ? 'ProMotion, adaptativa hasta 120 Hz' : null,
            'brillo'             => self::brillo($p),
            'funciones_pantalla' => self::lista([
                $p['colores'],
                match ($p['gama']) { 'P3' => 'Gama cromática amplia (P3)', 'sRGB' => 'Gama de colores sRGB', default => null },
                $p['true_tone'] ? 'True Tone' : null,
                $p['contraste'] ? "Contraste de {$p['contraste']}" : null,
                $p['nanotexturizado'] ? 'Acabado nanotexturizado opcional' : null,
            ]),
            'pantallas_externas' => $r['pantallas_externas'],

            'chip'               => $r['chip'],
            'cpu_cores'          => self::lista($r['cpu']),
            'gpu_cores'          => self::lista([
                $apple ? self::opciones($r['gpu']) : self::enumerar($r['gpu'], 'o'),
                $r['neural_accelerators'] ? 'Neural Accelerators' : null,
                $r['trazado_rayos'] ? 'Trazado de rayos por hardware' : null,
            ]),
            'neural_engine'      => $r['neural_engine_nucleos'] ? "{$r['neural_engine_nucleos']} núcleos" : null,
            'ancho_banda'        => $r['ancho_banda_gbs'] ? "{$r['ancho_banda_gbs']} GB/s" : null,
            'apple_intelligence' => $r['apple_intelligence'] ? 'Compatible' : null,

            'autonomia'          => $b['video_h']
                ? "Hasta {$b['video_h']} h de reproducción de video " . self::FUENTE_VIDEO[$b['video_fuente']] . " ({$b['web_h']} h de navegación web)"
                : null,
            'bateria_wh'         => $b['wh'] ? self::num($b['wh']) . ' Wh' : null,
            'cargador'           => str_starts_with($b['adaptador'], 'Adaptador') ? $b['adaptador'] : "Adaptador {$b['adaptador']}",
            'carga'              => $portatil ? self::lista([
                $b['magsafe'] ? "Carga por {$b['magsafe']}" : 'Carga por USB‑C',
                $b['carga_rapida'] ? "Carga rápida {$b['carga_rapida']}" : null,
            ]) : null,

            'puertos'            => self::lista($n['puertos']),
            'wifi'               => $n['wifi'],
            'bluetooth'          => $n['bluetooth'],
            'ethernet'           => $n['ethernet'] ?: null,
            'thread'             => $n['thread'] ? 'Sí' : null,

            'camara'             => $m['camara'],
            'audio'              => $m['audio'],
            'microfonos'         => $m['microfonos'],

            'teclado'            => $e['teclado'],
            'trackpad'           => $e['trackpad'],
            'biometria'          => $e['touch_id'] ?: null,

            'material'           => $x['material'],
            'dimensiones'        => self::dimensiones($x),
            'peso'               => self::num($x['peso_kg']) . ' kg',

            'lanzamiento_so'     => $s['macos_lanzamiento'],
            'ultimo_so'          => $s['macos_maximo'],
            'modelo'             => self::modelo($s),
            'generacion'         => (string) $s['anio'],

            'memorias_disponibles'       => array_map(fn ($gb) => "{$gb} GB", $r['ram_gb']),
            'almacenamientos_disponibles' => array_map(fn ($gb) => $gb >= 1024 ? self::num($gb / 1024) . ' TB' : "{$gb} GB", $r['almacenamiento_gb']),
            'colores_disponibles'        => $x['colores'],
        ];

        return array_filter($textos, fn ($t) => $t !== null && $t !== '' && $t !== []);
    }

    /** Detalle de la memoria para el equipo: «16 GB de memoria unificada» o «8 GB LPDDR3 a 2133 MHz». */
    public static function memoria(int $gb, array $d): string
    {
        return $d['rendimiento']['arquitectura'] === 'apple' ? "{$gb} GB de memoria unificada" : "{$gb} GB {$d['rendimiento']['ram_tipo']}";
    }

    private const FUENTE_VIDEO = ['streaming' => 'en streaming', 'apple_tv' => 'en la app Apple TV', 'itunes' => 'en iTunes'];

    private static function brillo(array $p): ?string
    {
        if ($p['brillo_xdr_nits']) {
            return self::miles($p['brillo_xdr_nits']) . ' nits constantes en XDR y ' . self::miles($p['brillo_hdr_nits']) . ' de pico en HDR'
                . ($p['brillo_nits'] ? ' · SDR de hasta ' . self::miles($p['brillo_nits']) . ' nits' : '');
        }

        return $p['brillo_nits'] ? self::miles($p['brillo_nits']) . ' nits' : null;
    }

    /** Portátil: «30,41 × 21,5 cm · 1,13 cm de grosor»; escritorio: «54,7 cm de ancho × 46,1 cm de alto · base de 13 × 14,7 cm». */
    private static function dimensiones(array $x): string
    {
        $cm = fn (float $mm) => self::num($mm / 10) . ' cm';
        if ($x['formato'] === 'escritorio') {
            return $cm($x['ancho_mm']) . ' de ancho × ' . $cm($x['alto_mm']) . ' de alto'
                . ($x['base_ancho_mm'] ? ' · base de ' . self::num($x['base_ancho_mm'] / 10) . ' × ' . $cm($x['profundidad_mm']) : '');
        }
        $grosor = $x['grosor_min_mm'] ? self::num($x['grosor_min_mm'] / 10) . ' a ' . $cm($x['grosor_mm']) : $cm($x['grosor_mm']);

        return self::num($x['ancho_mm'] / 10) . ' × ' . $cm($x['profundidad_mm']) . " · {$grosor} de grosor";
    }

    private static function modelo(array $s): ?string
    {
        if (! $s['identificador']) {
            return $s['numero_modelo'];
        }
        $ids = self::enumerar($s['identificador'], 'o') . (count($s['identificador']) > 1 ? ' (según el chip)' : '');

        return $ids . ($s['numero_modelo'] ? " · número de modelo {$s['numero_modelo']}" : '');
    }

    /** ['8 núcleos', '10 núcleos'] → «8 o 10 núcleos, según la configuración»; una sola → tal cual. */
    private static function opciones(array $gpu): string
    {
        if (count($gpu) === 1) {
            return $gpu[0];
        }
        $numeros = array_map(fn ($g) => (int) $g, $gpu);

        return self::enumerar(array_map('strval', $numeros), 'o') . ' núcleos, según la configuración';
    }

    private static function lista(array $partes): string
    {
        return implode(' · ', array_filter($partes, fn ($p) => $p !== null && $p !== ''));
    }

    private static function enumerar(array $partes, string $conjuncion = 'y'): string
    {
        $ultima = array_pop($partes);

        return $partes === [] ? (string) $ultima : implode(', ', $partes) . " {$conjuncion} {$ultima}";
    }

    /** 13.6 → "13,6"; 24.0 → "24"; 30.41 → "30,41" */
    private static function num(int|float $n): string
    {
        return rtrim(rtrim(number_format((float) $n, 2, ',', '.'), '0'), ',');
    }

    private static function miles(int $n): string
    {
        return number_format($n, 0, ',', '.');
    }

}
