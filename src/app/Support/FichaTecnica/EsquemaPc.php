<?php

namespace App\Support\FichaTecnica;

use App\Support\FichaTecnica\Concerns\RevisaEsquema;

/**
 * Qué datos debe tener la ficha de una laptop con Windows (familia «pc», database/data/modelos_referencia/pc.php).
 * Cada modelo es una configuración exacta del fabricante (Lenovo: el MTM de la etiqueta), no la familia completa: el
 * procesador, la tarjeta gráfica, la memoria y el disco son los de fábrica. Primero la ficha oficial de la marca; lo
 * que no publica, de otras fuentes que coincidan.
 *
 * Tipos: string, int, float, bool, list, false (= «no tiene») y null (= espera su fuente en `pendientes`). Ningún campo
 * puede faltar.
 */
final class EsquemaPc
{
    use RevisaEsquema;

    public const CAMPOS = [
        'pantalla.pulgadas'          => 'float',
        'pantalla.px_ancho'          => 'int',
        'pantalla.px_alto'           => 'int',
        'pantalla.resolucion_nombre' => 'string|false',
        'pantalla.tecnologia'        => 'string',
        'pantalla.antirreflejo'      => 'bool',
        'pantalla.tactil'            => 'bool',
        'pantalla.frecuencia_hz'     => 'int',
        'pantalla.sincronizacion'    => 'string|false',
        'pantalla.brillo_nits'       => 'int',
        'pantalla.gama'              => 'string|false',
        'pantalla.contraste'         => 'string|false',
        'pantalla.atenuacion_dc'     => 'bool',

        'rendimiento.arquitectura'       => 'string',
        'rendimiento.chip'               => 'string',
        'rendimiento.cpu_nucleos'        => 'int',
        'rendimiento.cpu_hilos'          => 'int',
        'rendimiento.cpu_ghz_base'       => 'float',
        'rendimiento.cpu_ghz_max'        => 'float',
        'rendimiento.cache_l3_mb'        => 'int',
        'rendimiento.gpu'                => 'string|false',
        'rendimiento.gpu_memoria'        => 'string|false',
        'rendimiento.gpu_tgp_w'          => 'int|false',
        'rendimiento.gpu_dynamic_boost'  => 'string|false',
        'rendimiento.gpu_integrada'      => 'string',
        'rendimiento.ram_gb'             => 'list',
        'rendimiento.ram_tipo'           => 'string',
        'rendimiento.ram_modulos'        => 'string',
        'rendimiento.ram_ranuras_libres' => 'int',
        'rendimiento.almacenamiento_gb'  => 'list',
        'rendimiento.ssd'                => 'string',
        'rendimiento.ranura_ssd_libre'   => 'string|false',
        'rendimiento.pantallas_externas' => 'string',

        'bateria.wh'             => 'float',
        'bateria.celdas'         => 'int',
        'bateria.video_h'        => 'float',
        'bateria.video_prueba'   => 'string',
        'bateria.uso_h'          => 'float|false',
        'bateria.uso_prueba'     => 'string|false',
        'bateria.adaptador_w'    => 'int',
        'bateria.conector_carga' => 'string|false',
        'bateria.carga_rapida'   => 'string|false',

        'conectividad.puertos'   => 'list',
        'conectividad.wifi'      => 'string',
        'conectividad.bluetooth' => 'string',
        'conectividad.ethernet'  => 'string|false',

        'multimedia.camara'     => 'string',
        'multimedia.audio'      => 'string',
        'multimedia.microfonos' => 'string',

        'entrada.teclado'        => 'string',
        'entrada.idioma_teclado' => 'string',
        'entrada.trackpad'       => 'string',
        'entrada.huella'         => 'bool',

        'diseno.formato'        => 'string',
        'diseno.material'       => 'string',
        'diseno.colores'        => 'list',
        'diseno.ancho_mm'       => 'float',
        'diseno.profundidad_mm' => 'float',
        'diseno.grosor_mm'      => 'float',
        'diseno.grosor_max_mm'  => 'float|false',
        'diseno.peso_kg'        => 'float',
        'diseno.peso_desde'     => 'bool',

        'sistema.anio'              => 'int',
        'sistema.sistema_operativo' => 'string',
        'sistema.plataforma'        => 'string',
        'sistema.numero_parte'      => 'string',
        'sistema.seguridad'         => 'list',
    ];

    /** Nada puede esperar su fuente: la configuración de fábrica tiene que estar completa. */
    public const PENDIENTES_PERMITIDOS = [];

    /** Rangos razonables: detectan errores de tipeo (156 pulgadas, 24 kg…). */
    private const RANGOS = [
        'pantalla.pulgadas'              => [11, 19],
        'pantalla.frecuencia_hz'         => [60, 500],
        'pantalla.brillo_nits'           => [150, 1600],
        'rendimiento.cpu_nucleos'        => [2, 32],
        'rendimiento.cpu_hilos'          => [2, 64],
        'rendimiento.cpu_ghz_base'       => [0.8, 6],
        'rendimiento.cpu_ghz_max'        => [1, 6.5],
        'rendimiento.cache_l3_mb'        => [2, 256],
        'rendimiento.gpu_tgp_w'          => [25, 200],
        'rendimiento.ram_ranuras_libres' => [0, 4],
        'bateria.wh'                     => [30, 100],
        'bateria.celdas'                 => [2, 8],
        'bateria.video_h'                => [2, 30],
        'bateria.uso_h'                  => [1, 30],
        'bateria.adaptador_w'            => [45, 400],
        'diseno.ancho_mm'                => [250, 450],
        'diseno.profundidad_mm'          => [170, 350],
        'diseno.grosor_mm'               => [10, 40],
        'diseno.grosor_max_mm'           => [10, 45],
        'diseno.peso_kg'                 => [0.9, 5],
        'sistema.anio'                   => [2015, 2035],
    ];

    private const VALORES = [
        'rendimiento.arquitectura' => ['x86'],
        'pantalla.tecnologia'      => ['IPS', 'OLED', 'VA', 'TN', 'Mini LED'],
        'diseno.formato'           => ['portatil'],
    ];

    /**
     * @return array{0: list<string>, 1: list<string>} [errores, pendientes]
     */
    public static function revisar(array $modelo): array
    {
        [$errores, $pendientes] = self::revisarCampos($modelo);
        $d = $modelo['datos'] ?? [];
        $r = $d['rendimiento'] ?? [];
        $b = $d['bateria'] ?? [];
        $x = $d['diseno'] ?? [];

        foreach (['ram_gb', 'almacenamiento_gb'] as $clave) {
            $lista = $r[$clave] ?? null;
            if (is_array($lista) && ($lista !== array_values(array_unique($lista)) || $lista !== self::ordenada($lista)
                || array_filter($lista, fn ($v) => ! is_int($v) || $v <= 0))) {
                $errores[] = "rendimiento.{$clave} debe ir de menor a mayor, en GB y sin repetir.";
            }
        }
        if (is_int($r['cpu_hilos'] ?? null) && is_int($r['cpu_nucleos'] ?? null) && $r['cpu_hilos'] < $r['cpu_nucleos']) {
            $errores[] = 'El procesador no puede tener menos hilos que núcleos.';
        }
        if (is_numeric($r['cpu_ghz_base'] ?? null) && is_numeric($r['cpu_ghz_max'] ?? null) && $r['cpu_ghz_max'] < $r['cpu_ghz_base']) {
            $errores[] = 'La frecuencia máxima del procesador no puede ser menor que la base.';
        }

        // Tarjeta gráfica dedicada: con su memoria y su potencia; sin ella, nada de eso.
        $conGpu = ($r['gpu'] ?? false) !== false;
        if ($conGpu && (($r['gpu_memoria'] ?? false) === false || ($r['gpu_tgp_w'] ?? false) === false)) {
            $errores[] = 'Una tarjeta gráfica dedicada necesita su memoria y su potencia (TGP).';
        }
        if (! $conGpu && (($r['gpu_memoria'] ?? false) !== false || ($r['gpu_tgp_w'] ?? false) !== false || ($r['gpu_dynamic_boost'] ?? false) !== false)) {
            $errores[] = 'Sin tarjeta gráfica dedicada no hay memoria de video, TGP ni Dynamic Boost.';
        }

        if ((($b['uso_h'] ?? false) === false) !== (($b['uso_prueba'] ?? false) === false)) {
            $errores[] = 'La autonomía de uso necesita las horas y la prueba que las mide.';
        }
        if (is_numeric($x['grosor_max_mm'] ?? null) && is_numeric($x['grosor_mm'] ?? null) && $x['grosor_max_mm'] < $x['grosor_mm']) {
            $errores[] = 'El grosor máximo no puede ser menor que el mínimo.';
        }

        return [array_values(array_unique($errores)), $pendientes];
    }

    private static function ordenada(array $lista): array
    {
        sort($lista);

        return $lista;
    }
}
