<?php

namespace App\Support\FichaTecnica;

use App\Support\FichaTecnica\Concerns\RevisaEsquema;

/**
 * Qué datos debe tener la ficha de una Mac para mostrarla y compararla (database/data/modelos_referencia/computadora.php).
 *
 * Tipos: string, int, float, bool, list, false (= «no tiene») y null (= Apple no lo publica en la ficha, o espera su
 * fuente en `pendientes`). Ningún campo puede faltar. La configuración de cada equipo (chip exacto, memoria,
 * almacenamiento y color) sale del inventario; aquí van las opciones del modelo.
 */
final class EsquemaComputadora
{
    use RevisaEsquema;

    public const CAMPOS = [
        'pantalla.pulgadas'        => 'float',
        'pantalla.diagonal_exacta' => 'float|false',
        'pantalla.nombre'          => 'string',
        'pantalla.tecnologia'      => 'string|false',
        'pantalla.px_ancho'        => 'int',
        'pantalla.px_alto'         => 'int',
        'pantalla.ppi'             => 'int|null',
        'pantalla.brillo_nits'     => 'int|null',
        'pantalla.brillo_xdr_nits' => 'int|false',
        'pantalla.brillo_hdr_nits' => 'int|false',
        'pantalla.contraste'       => 'string|false',
        'pantalla.promotion'       => 'bool',
        'pantalla.colores'         => 'string',
        'pantalla.gama'            => 'string|false',
        'pantalla.true_tone'       => 'bool',
        'pantalla.nanotexturizado' => 'bool',

        'rendimiento.arquitectura'          => 'string',
        'rendimiento.chip'                  => 'string',
        'rendimiento.cpu'                   => 'list',
        'rendimiento.gpu'                   => 'list',
        'rendimiento.neural_engine_nucleos' => 'int|false',
        'rendimiento.neural_accelerators'   => 'bool',
        'rendimiento.trazado_rayos'         => 'bool',
        'rendimiento.ancho_banda_gbs'       => 'int|false',
        'rendimiento.ram_gb'                => 'list',
        'rendimiento.ram_tipo'              => 'string',
        'rendimiento.almacenamiento_gb'     => 'list',
        'rendimiento.pantallas_externas'    => 'string',
        'rendimiento.apple_intelligence'    => 'bool',

        'bateria.wh'           => 'float|false',
        'bateria.video_h'      => 'int|false',
        'bateria.video_fuente' => 'string|false',
        'bateria.web_h'        => 'int|false',
        'bateria.adaptador'    => 'string',
        'bateria.carga_rapida' => 'string|false',
        'bateria.magsafe'      => 'string|false',

        'conectividad.puertos'   => 'list',
        'conectividad.wifi'      => 'string',
        'conectividad.bluetooth' => 'string',
        'conectividad.ethernet'  => 'string|false',
        'conectividad.thread'    => 'bool',

        'multimedia.camara'     => 'string',
        'multimedia.audio'      => 'string',
        'multimedia.microfonos' => 'string',

        'entrada.teclado'    => 'string',
        'entrada.trackpad'   => 'string',
        'entrada.touch_id'   => 'string|false',
        'entrada.touch_bar'  => 'bool',

        'diseno.formato'        => 'string',
        'diseno.material'       => 'string',
        'diseno.colores'        => 'list|null',
        'diseno.grosor_mm'      => 'float|null',
        'diseno.grosor_min_mm'  => 'float|false',
        'diseno.ancho_mm'       => 'float',
        'diseno.profundidad_mm' => 'float',
        'diseno.alto_mm'        => 'float|false',
        'diseno.base_ancho_mm'  => 'float|false',
        'diseno.peso_kg'        => 'float',

        'sistema.anio'              => 'int',
        'sistema.macos_lanzamiento' => 'string',
        'sistema.macos_maximo'      => 'string',
        'sistema.identificador'     => 'list|null',
        'sistema.numero_modelo'     => 'string|null',
    ];

    /** Lo único que puede esperar su fuente: el identificador de un modelo que Apple todavía no lista. */
    public const PENDIENTES_PERMITIDOS = ['sistema.identificador'];

    /** Rangos razonables: detectan errores de tipeo (1640 g, 61 pulgadas…). */
    private const RANGOS = [
        'pantalla.pulgadas'        => [11, 32],
        'pantalla.ppi'             => [100, 300],
        'pantalla.brillo_nits'     => [200, 2000],
        'rendimiento.ancho_banda_gbs' => [30, 1000],
        'bateria.wh'               => [20, 100],
        'bateria.video_h'          => [5, 30],
        'bateria.web_h'            => [5, 30],
        'diseno.grosor_mm'         => [3, 25],
        'diseno.ancho_mm'          => [200, 700],
        'diseno.profundidad_mm'    => [100, 300],
        'diseno.peso_kg'           => [0.5, 8],
        'sistema.anio'             => [2008, 2035],
    ];

    private const VALORES = [
        'rendimiento.arquitectura' => ['apple', 'intel'],
        'bateria.video_fuente'     => ['streaming', 'apple_tv', 'itunes', false],
        'diseno.formato'           => ['portatil', 'escritorio'],
        'pantalla.gama'            => ['P3', 'sRGB', false],
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

        // Chip de Apple: Neural Engine y ancho de banda; Intel: nada de eso ni Apple Intelligence.
        if (($r['arquitectura'] ?? null) === 'apple' && (($r['neural_engine_nucleos'] ?? false) === false || ($r['ancho_banda_gbs'] ?? false) === false)) {
            $errores[] = 'Una Mac con chip de Apple necesita los núcleos del Neural Engine y el ancho de banda de memoria.';
        }
        if (($r['arquitectura'] ?? null) === 'intel' && (($r['apple_intelligence'] ?? false) || ($r['neural_engine_nucleos'] ?? false) !== false)) {
            $errores[] = 'Una Mac con Intel no tiene Neural Engine ni Apple Intelligence.';
        }

        // Portátil: batería completa; escritorio: sin batería, con alto de pie a pantalla.
        $esPortatil = ($x['formato'] ?? null) === 'portatil';
        $conBateria = ($b['wh'] ?? false) !== false && ($b['video_h'] ?? false) !== false && ($b['web_h'] ?? false) !== false
            && ($b['video_fuente'] ?? false) !== false;
        if ($esPortatil && ! $conBateria) {
            $errores[] = 'Una portátil necesita batería (Wh), horas de video y de navegación, y de dónde sale el video.';
        }
        if (! $esPortatil && (($b['wh'] ?? false) !== false || ($x['alto_mm'] ?? false) === false)) {
            $errores[] = 'Una Mac de escritorio no tiene batería y necesita su alto.';
        }
        if ($esPortatil && ($x['grosor_mm'] ?? null) === null) {
            $errores[] = 'Una portátil necesita su grosor.';
        }
        if (($d['entrada']['touch_bar'] ?? false) && ($r['arquitectura'] ?? null) !== 'intel') {
            $errores[] = 'La Touch Bar solo existió en MacBook Pro con Intel.';
        }
        if (($d['pantalla']['brillo_xdr_nits'] ?? false) !== false && ($d['pantalla']['brillo_hdr_nits'] ?? false) === false) {
            $errores[] = 'Una pantalla XDR necesita su pico de brillo en HDR.';
        }

        return [array_values(array_unique($errores)), $pendientes];
    }

    private static function ordenada(array $lista): array
    {
        sort($lista);

        return $lista;
    }
}
