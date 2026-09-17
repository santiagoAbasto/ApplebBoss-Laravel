<?php

namespace App\Support\FichaTecnica;

use Illuminate\Support\Arr;

/**
 * Esquema de las fichas de accesorios (database/data/modelos_referencia/accesorios.php, tipo «producto_general»).
 *
 * Una ficha de accesorio es un TIPO de producto (el adaptador de 20 W de Apple, la funda de silicona, el vidrio
 * templado tradicional…). Tiene cuatro partes:
 * - `sistema`: cómo se reconoce en el inventario (`detectar` y `excluir`, expresiones regulares sobre el nombre en
 *   minúsculas y sin tildes), su categoría en la tienda, la forma de su ilustración y para quién es (`para`).
 * - `ficha`: los textos de la ficha técnica, con las mismas claves que fichaTecnica.jsx (grupo producto_general).
 *   Lo que no se sabe no se escribe: la ficha no lo muestra y la comparativa dice «No lo informa».
 * - `contenido`: la descripción de la publicación (resumen, párrafos, puntos y qué incluye). {modelo} se reemplaza
 *   por el equipo que dice el nombre del inventario («iPhone 13 Pro») o, si no dice, por `sistema.para`.
 * - `visual`: `false` o la etiqueta de la ilustración («20W»).
 *
 * `pendientes`: `ficha.<clave>` o `sistema.<campo>` con tipo «falta» (vacío a propósito, espera su fuente) o
 * «verificar» (cargado, pero de una fuente que no es la marca).
 */
final class EsquemaAccesorio
{
    public const FAMILIAS = ['cargador', 'vidrio', 'protector', 'funda', 'cable', 'accesorio'];

    /** Formas de la ilustración de la tienda (Components/Store/AccesorioVisual.jsx). */
    public const FORMAS = [
        'cargador', 'vidrio', 'protector_camara', 'funda', 'cable', 'parlante', 'control', 'teclado', 'mouse', 'audifonos',
        'reloj', 'bateria', 'auto', 'streaming', 'juego', 'otro',
    ];

    /** Claves de la ficha: las del grupo producto_general de fichaTecnica.jsx. */
    public const FICHA = [
        'compatibilidad', 'tipo', 'fabricante',
        'potencia', 'potencia_maxima', 'carga_rapida', 'puerto', 'salidas', 'protocolos', 'entrada', 'cable', 'largo_cable',
        'normas', 'pruebas', 'bateria', 'autonomia',
        'material', 'endurecido', 'proteccion', 'dureza', 'filtro', 'recubrimiento', 'instalacion', 'magsafe', 'acabado',
        'funciones', 'asistente', 'casa_inteligente', 'audio', 'microfonos', 'sensores', 'haptica', 'gatillos', 'resolucion',
        'control', 'procesador', 'memoria', 'teclado', 'precision', 'iluminacion', 'juego',
        'conectividad', 'wifi', 'bluetooth', 'dimensiones', 'peso',
    ];

    /** Lo que cada familia necesita sí o sí. */
    private const OBLIGATORIOS = [
        'cargador'  => ['tipo', 'fabricante'],
        'vidrio'    => ['tipo', 'material', 'proteccion'],
        'protector' => ['tipo', 'proteccion'],
        'funda'     => ['tipo', 'proteccion'],
        'cable'     => ['tipo'],
        'accesorio' => ['tipo'],
    ];

    private const SISTEMA = [
        'anio'      => 'int|null',
        'marca'     => 'string|null',
        'modelo'    => 'string|null',
        'categoria' => 'string',
        'forma'     => 'string',
        'grupo'     => 'string',
        'para'      => 'string',
        'detectar'  => 'list',
        'excluir'   => 'list|false',
    ];

    private const PLACEHOLDERS = ['{modelo}'];

    /** @return array{0: list<string>, 1: list<string>} [errores, campos pendientes] */
    public static function revisar(array $modelo): array
    {
        $errores = [];

        if (($modelo['tipo'] ?? null) !== 'producto_general') {
            $errores[] = 'El tipo debe ser producto_general.';
        }
        $familia = $modelo['familia'] ?? null;
        if (! in_array($familia, self::FAMILIAS, true)) {
            $errores[] = 'Familia de accesorio desconocida.';
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

    /** La expresión con la que se busca en el nombre del inventario (ya normalizado, ver ModeloReferencia::textoAccesorio). */
    public static function regex(string $patron): string
    {
        return '~' . $patron . '~u';
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
        if (is_int($s['anio'] ?? null) && ($s['anio'] < 2000 || $s['anio'] > 2035)) {
            $errores[] = "sistema.anio = {$s['anio']} está fuera de rango (2000–2035).";
        }
        if (isset($s['forma']) && ! in_array($s['forma'], self::FORMAS, true)) {
            $errores[] = 'sistema.forma debe ser ' . implode(', ', self::FORMAS) . '.';
        }
        foreach ([...(is_array($s['detectar'] ?? null) ? $s['detectar'] : []), ...(is_array($s['excluir'] ?? null) ? $s['excluir'] : [])] as $patron) {
            if (! self::texto($patron) || @preg_match(self::regex($patron), '') === false) {
                $errores[] = 'Expresión inválida en sistema.detectar o sistema.excluir: ' . var_export($patron, true) . '.';
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
                $errores[] = "A un accesorio de la familia {$familia} le falta ficha.{$clave}.";
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
        foreach (['parrafos' => [1, 3], 'puntos' => [1, 6], 'incluye' => [1, 4]] as $campo => [$min, $max]) {
            $lista = $c[$campo] ?? null;
            if (! is_array($lista) || ! array_is_list($lista) || count($lista) < $min || count($lista) > $max || array_filter($lista, fn ($t) => ! self::texto($t))) {
                $errores[] = "contenido.{$campo} debe ser una lista de {$min} a {$max} textos.";
            }
        }
        foreach (Arr::flatten($c) as $texto) {
            preg_match_all('/\{[^}]*\}/', (string) $texto, $m);
            foreach (array_diff($m[0], self::PLACEHOLDERS) as $marca) {
                $errores[] = "Marca desconocida en el contenido: {$marca}.";
            }
        }

        return $errores;
    }

    private static function revisarVisual(mixed $v): array
    {
        if ($v === false) {
            return [];
        }
        if (! is_array($v) || array_keys($v) !== ['etiqueta'] || ! self::texto($v['etiqueta']) || mb_strlen($v['etiqueta']) > 8) {
            return ['visual debe ser false o [\'etiqueta\' => texto de hasta 8 caracteres].'];
        }

        return [];
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
                || (str_starts_with($campo, 'sistema.') && in_array(substr($campo, 8), ['anio', 'marca', 'modelo'], true))
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
