<?php

namespace App\Support\FichaTecnica;

use Illuminate\Support\Arr;

/**
 * Esquema de las fichas de productos Apple (database/data/modelos_referencia/productos_apple.php, tipo «producto_apple»,
 * la categoría «Más Apple» de la tienda): iPad, Apple Watch, AirPods y accesorios de Apple (Apple Pencil, Magic Mouse).
 *
 * Una ficha es un modelo con su variante (iPad Wi‑Fi o Wi‑Fi + Cellular, Apple Watch de aluminio o de titanio). La unidad
 * del inventario pone la capacidad, el color y la salud de la batería. Tiene cuatro partes:
 * - `sistema`: cómo se reconoce en el inventario (`detectar` y `excluir`, expresiones regulares sobre el nombre en
 *   minúsculas, sin tildes y con las unidades pegadas), si la variante tiene red celular (`celular`: true, false o null si
 *   el modelo no tiene las dos), su categoría, la forma de su ilustración, las horas de video para estimar la autonomía
 *   con la salud de la batería (`video_h`) y sus colores oficiales.
 * - `ficha`: los textos de la ficha técnica, con las claves de fichaTecnica.jsx (grupo producto_apple).
 * - `contenido`: la descripción de la publicación (resumen, párrafos, puntos y lo que trae la caja).
 * - `visual`: `false`, las medidas de frente (`alto_mm` y `ancho_mm`) o la `variante` del dibujo (AirPods).
 *
 * `pendientes`: `ficha.<clave>` o `sistema.anio` con tipo «falta» o «verificar», igual que en los accesorios.
 */
final class EsquemaProductoApple
{
    /** `otra_marca`: productos de otras marcas cargados en «Productos Apple» (casos puntuales); no entran en la comparativa. */
    public const FAMILIAS = ['ipad', 'watch', 'airpods', 'accesorio_apple', 'otra_marca'];

    /** Formas de la ilustración de la tienda (Components/Store/AccesorioVisual.jsx). */
    public const FORMAS = ['tablet', 'reloj', 'audifonos', 'audifonos_diadema', 'lapiz', 'mouse', 'monitor', 'ventilador_cuello', 'otro'];

    /** Lo que dice el nombre de una unidad con red celular (también cuenta que tenga IMEI en el inventario). */
    public const CELULAR = '\\b(lte|cellular|celular|5g|4g)\\b';

    /** Variantes del dibujo de los AirPods. */
    public const VARIANTES = ['pro', 'abiertos'];

    /** Claves de la ficha: las del grupo producto_apple de fichaTecnica.jsx, en el orden en que se muestran. */
    public const FICHA = [
        'tamano_pantalla', 'tamano_caja', 'pantalla', 'resolucion', 'brillo', 'funciones_pantalla', 'lapiz',
        'chip', 'cpu_cores', 'gpu_cores', 'neural_engine', 'ram', 'capacidad', 'ancho_banda', 'apple_intelligence',
        'camara_principal', 'video', 'camara_frontal',
        'audio', 'cancelacion_ruido', 'audio_espacial', 'microfonos', 'funciones', 'traduccion', 'controles', 'sensores',
        'salud', 'salud_auditiva', 'seguridad', 'resistencia',
        'autonomia', 'bateria_wh', 'carga', 'estuche',
        'red', 'sim', 'wifi', 'bluetooth', 'banda_ultraancha', 'thread', 'puerto', 'pantalla_externa', 'gps', 'compatibilidad',
        'biometria', 'material', 'dimensiones', 'peso', 'talla',
        'lanzamiento_so', 'ultimo_so', 'modelo', 'generacion', 'fabricante',
    ];

    /** Lo que cada familia necesita sí o sí. */
    private const OBLIGATORIOS = [
        'ipad'            => ['tamano_pantalla', 'pantalla', 'chip', 'autonomia', 'puerto', 'dimensiones', 'peso', 'modelo', 'generacion'],
        'watch'           => ['tamano_caja', 'pantalla', 'chip', 'capacidad', 'autonomia', 'material', 'dimensiones', 'peso', 'modelo'],
        'airpods'         => ['chip', 'autonomia', 'carga', 'modelo', 'generacion'],
        'accesorio_apple' => ['funciones', 'compatibilidad', 'generacion'],
        'otra_marca'      => ['fabricante', 'funciones'],
    ];

    private const SISTEMA = [
        'anio'      => 'int|null',
        'categoria' => 'string',
        'forma'     => 'string',
        'detectar'  => 'list',
        'excluir'   => 'list|false',
        'celular'   => 'bool|null',
        'video_h'   => 'int|false',
        'colores'   => 'list|false',
    ];

    /** @return array{0: list<string>, 1: list<string>} [errores, campos pendientes] */
    public static function revisar(array $modelo): array
    {
        $errores = [];

        if (($modelo['tipo'] ?? null) !== 'producto_apple') {
            $errores[] = 'El tipo debe ser producto_apple.';
        }
        $familia = $modelo['familia'] ?? null;
        if (! in_array($familia, self::FAMILIAS, true)) {
            $errores[] = 'Familia de producto Apple desconocida.';
        }
        foreach (['nombre', 'slug'] as $campo) {
            if (! self::texto($modelo[$campo] ?? null)) {
                $errores[] = "Falta {$campo}.";
            }
        }
        if (! is_array($modelo['alias'] ?? null) || ! array_is_list($modelo['alias']) || array_filter($modelo['alias'], fn ($a) => ! self::texto($a))) {
            $errores[] = 'alias debe ser una lista de nombres del inventario.';
        }

        $d = $modelo['datos'] ?? null;
        if (! is_array($d)) {
            return [['No tiene datos estructurados.'], []];
        }
        if ($extra = array_diff(array_keys($d), ['sistema', 'ficha', 'contenido', 'visual'])) {
            $errores[] = 'Clave desconocida: ' . implode(', ', $extra) . '.';
        }

        $errores = [
            ...$errores,
            ...self::revisarSistema($d['sistema'] ?? null),
            ...self::revisarFicha($d['ficha'] ?? null, $familia),
            ...self::revisarContenido($d['contenido'] ?? null),
            ...self::revisarVisual($d['visual'] ?? null),
        ];

        [$pendientes, $erroresPendientes] = self::revisarPendientes($modelo['pendientes'] ?? [], $d);

        return [[...$errores, ...$erroresPendientes], $pendientes];
    }

    private static function revisarSistema(mixed $s): array
    {
        if (! is_array($s)) {
            return ['Falta sistema.'];
        }

        $errores = [];
        foreach (self::SISTEMA as $campo => $tipo) {
            if (! array_key_exists($campo, $s)) {
                $errores[] = "Falta sistema.{$campo}.";
            } elseif (! self::cumple($s[$campo], $tipo)) {
                $errores[] = "sistema.{$campo} debe ser {$tipo}.";
            }
        }
        if ($extra = array_diff(array_keys($s), array_keys(self::SISTEMA))) {
            $errores[] = 'Clave desconocida: sistema.' . implode(', sistema.', $extra) . '.';
        }
        if (is_int($s['anio'] ?? null) && ($s['anio'] < 2010 || $s['anio'] > 2035)) {
            $errores[] = "sistema.anio = {$s['anio']} está fuera de rango (2010–2035).";
        }
        if (is_int($s['video_h'] ?? null) && ($s['video_h'] < 1 || $s['video_h'] > 40)) {
            $errores[] = "sistema.video_h = {$s['video_h']} está fuera de rango (1–40).";
        }
        if (isset($s['forma']) && ! in_array($s['forma'], self::FORMAS, true)) {
            $errores[] = 'sistema.forma debe ser ' . implode(', ', self::FORMAS) . '.';
        }
        foreach ([...(is_array($s['detectar'] ?? null) ? $s['detectar'] : []), ...(is_array($s['excluir'] ?? null) ? $s['excluir'] : [])] as $patron) {
            if (! self::texto($patron) || @preg_match(EsquemaAccesorio::regex($patron), '') === false) {
                $errores[] = 'Expresión inválida en sistema.detectar o sistema.excluir: ' . var_export($patron, true) . '.';
            }
        }
        foreach (is_array($s['colores'] ?? null) ? $s['colores'] : [] as $color) {
            if (! self::texto($color)) {
                $errores[] = 'sistema.colores debe ser una lista de nombres de color.';
                break;
            }
        }

        return $errores;
    }

    private static function revisarFicha(mixed $ficha, ?string $familia): array
    {
        if (! is_array($ficha) || $ficha === [] || array_is_list($ficha)) {
            return ['La ficha debe tener al menos un dato con su clave.'];
        }

        $errores = [];
        foreach ($ficha as $clave => $valor) {
            if (! in_array($clave, self::FICHA, true)) {
                $errores[] = "Clave desconocida: ficha.{$clave}.";
            } elseif (! self::texto($valor)) {
                $errores[] = "ficha.{$clave} debe ser un texto: lo que no se sabe, no se escribe.";
            }
        }
        foreach (self::OBLIGATORIOS[$familia] ?? [] as $clave) {
            if (! isset($ficha[$clave])) {
                $errores[] = "A un producto de la familia {$familia} le falta ficha.{$clave}.";
            }
        }

        return $errores;
    }

    private static function revisarContenido(mixed $c): array
    {
        if (! is_array($c)) {
            return ['Falta contenido.'];
        }

        $errores = [];
        if ($extra = array_diff(array_keys($c), ['resumen', 'parrafos', 'puntos', 'incluye'])) {
            $errores[] = 'Clave desconocida: contenido.' . implode(', contenido.', $extra) . '.';
        }
        if (! self::texto($c['resumen'] ?? null) || mb_strlen($c['resumen']) > 240) {
            $errores[] = 'contenido.resumen debe ser un texto de hasta 240 caracteres.';
        }
        foreach (['parrafos' => [1, 4], 'puntos' => [1, 6], 'incluye' => [1, 6]] as $campo => [$min, $max]) {
            $lista = $c[$campo] ?? null;
            if (! is_array($lista) || ! array_is_list($lista) || count($lista) < $min || count($lista) > $max || array_filter($lista, fn ($t) => ! self::texto($t))) {
                $errores[] = "contenido.{$campo} debe ser una lista de {$min} a {$max} textos.";
            }
        }
        foreach (Arr::flatten($c) as $texto) {
            if (preg_match('/\{[^}]*\}/', (string) $texto, $m)) {
                $errores[] = "El contenido de un producto Apple no lleva marcas: {$m[0]}.";
            }
        }

        return $errores;
    }

    private static function revisarVisual(mixed $v): array
    {
        if ($v === false) {
            return [];
        }
        $medidas = is_array($v) && array_keys($v) === ['alto_mm', 'ancho_mm']
            && is_numeric($v['alto_mm']) && is_numeric($v['ancho_mm']) && $v['alto_mm'] > 0 && $v['ancho_mm'] > 0;
        $variante = is_array($v) && array_keys($v) === ['variante'] && in_array($v['variante'], self::VARIANTES, true);

        return $medidas || $variante
            ? []
            : ["visual debe ser false, ['alto_mm' => n, 'ancho_mm' => n] o ['variante' => " . implode('|', self::VARIANTES) . '].'];
    }

    /** @return array{0: list<string>, 1: list<string>} [campos que faltan, errores] */
    private static function revisarPendientes(mixed $items, array $datos): array
    {
        if (! is_array($items) || ! array_is_list($items)) {
            return [[], ['pendientes debe ser una lista.']];
        }

        $faltan = [];
        $errores = [];
        foreach ($items as $i => $item) {
            $campo = is_array($item) ? ($item['campo'] ?? null) : null;
            $valido = is_string($campo) && (
                (str_starts_with($campo, 'ficha.') && in_array(substr($campo, 6), self::FICHA, true))
                || $campo === 'sistema.anio'
            );
            if (! $valido) {
                $errores[] = 'Pendiente ' . ($i + 1) . ': el campo ' . (is_string($campo) ? "«{$campo}» " : '') . 'no existe en el esquema.';
                continue;
            }
            foreach (['detalle', 'fuente'] as $clave) {
                if (! self::texto($item[$clave] ?? null)) {
                    $errores[] = "{$campo}: el pendiente necesita {$clave}.";
                }
            }
            if (array_diff(array_keys($item), ['campo', 'tipo', 'detalle', 'fuente'])) {
                $errores[] = "{$campo}: el pendiente solo lleva campo, tipo, detalle y fuente.";
            }

            $valor = Arr::get($datos, $campo);
            match ($item['tipo'] ?? null) {
                'falta'     => $valor !== null
                    ? $errores[] = "{$campo} figura como pendiente pero ya tiene valor: quítalo de la lista o márcalo para verificar."
                    : $faltan[] = $campo,
                'verificar' => $valor === null ? $errores[] = "{$campo} está por verificar pero no tiene valor: márcalo como falta." : null,
                default     => $errores[] = "{$campo}: el tipo de pendiente debe ser falta o verificar.",
            };
        }

        return [$faltan, $errores];
    }

    private static function cumple(mixed $valor, string $tipo): bool
    {
        foreach (explode('|', $tipo) as $t) {
            $ok = match ($t) {
                'string' => self::texto($valor),
                'int'    => is_int($valor),
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

    private static function texto(mixed $valor): bool
    {
        return is_string($valor) && trim($valor) !== '';
    }
}
