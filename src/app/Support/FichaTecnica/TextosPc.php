<?php

namespace App\Support\FichaTecnica;

/**
 * Arma los textos de la ficha de una laptop con Windows a partir de sus datos (database/data/modelos_referencia/pc.php).
 * Usa las mismas claves que la ficha de la Mac cuando el dato es el mismo (pantalla, chip, batería, puertos…) y suma
 * las propias: `gpu` (tarjeta gráfica), `ampliacion` y `seguridad`. Nada de Apple: sin Neural Engine, Apple
 * Intelligence ni «última versión de macOS». La memoria, el almacenamiento y el color de cada equipo salen del
 * inventario al publicar; aquí van los de fábrica (`memorias_disponibles`… solo para comparar).
 */
final class TextosPc
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

        $textos = [
            'tamano_pantalla'    => self::num($p['pulgadas']) . ' pulgadas',
            'pantalla'           => $p['tecnologia'] . ($p['antirreflejo'] ? ' antirreflejo' : '') . ($p['tactil'] ? ', táctil' : ', no táctil'),
            'resolucion'         => self::miles($p['px_ancho']) . ' × ' . self::miles($p['px_alto']) . ' px'
                                    . ($p['resolucion_nombre'] ? " ({$p['resolucion_nombre']})" : ''),
            'tasa_refresco'      => self::lista(["{$p['frecuencia_hz']} Hz", $p['sincronizacion'] ?: null]),
            'brillo'             => self::miles($p['brillo_nits']) . ' nits',
            'funciones_pantalla' => self::lista([
                $p['gama'] ? "Gama de colores: {$p['gama']}" : null,
                $p['contraste'] ? "Contraste de {$p['contraste']}" : null,
                $p['atenuacion_dc'] ? 'Atenuación DC contra el parpadeo' : null,
            ]),
            'pantallas_externas' => $r['pantallas_externas'],

            'chip'               => $r['chip'],
            'cpu_cores'          => self::lista([
                "{$r['cpu_nucleos']} núcleos y {$r['cpu_hilos']} hilos",
                self::num($r['cpu_ghz_base']) . ' GHz, hasta ' . self::num($r['cpu_ghz_max']) . ' GHz',
                "{$r['cache_l3_mb']} MB de caché L3",
            ]),
            'gpu'                => $r['gpu']
                ? self::lista([
                    "{$r['gpu']} de {$r['gpu_memoria']}",
                    "Potencia de {$r['gpu_tgp_w']} W (TGP)" . ($r['gpu_dynamic_boost'] ? " con {$r['gpu_dynamic_boost']}" : ''),
                    "Además, gráficos integrados {$r['gpu_integrada']}",
                ])
                : "Gráficos integrados {$r['gpu_integrada']}",
            'ampliacion'         => self::lista([
                "Memoria: {$r['ram_modulos']} SO‑DIMM, " . match ($r['ram_ranuras_libres']) {
                    0       => 'sin ranuras libres',
                    1       => 'una ranura libre',
                    default => "{$r['ram_ranuras_libres']} ranuras libres",
                },
                $r['ranura_ssd_libre'] ? "Segunda ranura {$r['ranura_ssd_libre']} libre para otro SSD" : null,
            ]),

            'autonomia'          => 'Hasta ' . self::num($b['video_h']) . " h de reproducción de {$b['video_prueba']}"
                                    . ($b['uso_h'] ? ' (' . self::num($b['uso_h']) . " h con {$b['uso_prueba']})" : ''),
            'bateria_wh'         => self::num($b['wh']) . " Wh · {$b['celdas']} celdas",
            'cargador'           => "Adaptador de {$b['adaptador_w']} W" . ($b['conector_carga'] ? " con conector {$b['conector_carga']}" : ''),
            'carga'              => $b['carga_rapida'] ?: null,

            'puertos'            => self::lista($n['puertos']),
            'wifi'               => $n['wifi'],
            'bluetooth'          => $n['bluetooth'],
            'ethernet'           => $n['ethernet'] ?: null,

            'camara'             => $m['camara'],
            'audio'              => $m['audio'],
            'microfonos'         => $m['microfonos'],

            'teclado'            => self::lista([$e['teclado'], "Distribución en {$e['idioma_teclado']}"]),
            'trackpad'           => $e['trackpad'],

            'material'           => $x['material'],
            'dimensiones'        => self::num($x['ancho_mm'] / 10) . ' × ' . self::num($x['profundidad_mm'] / 10) . ' cm · '
                                    . self::num($x['grosor_mm'] / 10) . ($x['grosor_max_mm'] ? ' a ' . self::num($x['grosor_max_mm'] / 10) : '')
                                    . ' cm de grosor',
            'peso'               => ($x['peso_desde'] ? 'Desde ' : '') . self::num($x['peso_kg']) . ' kg',

            'lanzamiento_so'     => $s['sistema_operativo'],
            'seguridad'          => self::lista([...$s['seguridad'], $e['huella'] ? 'Lector de huellas' : null]),
            'modelo'             => "{$s['plataforma']} · {$s['numero_parte']}",
            'generacion'         => (string) $s['anio'],

            'memorias_disponibles'        => array_map(fn ($gb) => "{$gb} GB", $r['ram_gb']),
            'almacenamientos_disponibles' => array_map(fn ($gb) => $gb >= 1024 ? self::num($gb / 1024) . ' TB' : "{$gb} GB", $r['almacenamiento_gb']),
            'colores_disponibles'         => $x['colores'],
        ];

        return array_filter($textos, fn ($t) => $t !== null && $t !== '' && $t !== []);
    }

    private static function lista(array $partes): string
    {
        return implode(' · ', array_filter($partes, fn ($p) => $p !== null && $p !== ''));
    }

    /** 15.6 → "15,6"; 60.0 → "60"; 35.96 → "35,96" */
    private static function num(int|float $n): string
    {
        return rtrim(rtrim(number_format((float) $n, 2, ',', '.'), '0'), ',');
    }

    private static function miles(int $n): string
    {
        return number_format($n, 0, ',', '.');
    }
}
