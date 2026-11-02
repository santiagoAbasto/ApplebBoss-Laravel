<?php

namespace App\Support\Catalogo;

use Illuminate\Support\Str;

/**
 * Búsqueda del catálogo por PALABRAS, no por frase exacta. Un producto coincide si su texto contiene TODAS las palabras
 * de la búsqueda, en cualquier orden y sin tildes: así «magic keyboard 12.9» encuentra «Magic Keyboard para iPad Pro
 * 12.9 White Gray». Antes se exigía la frase completa como substring contiguo (Str::contains), y una búsqueda con las
 * palabras sueltas o en otro orden no traía nada, aunque el producto estuviera publicado.
 *
 * La usan los dos buscadores (la página /catalogo y el ⌘K de /api/buscar) para que se comporten igual.
 */
final class Busqueda
{
    public static function coincide(string $texto, string $consulta): bool
    {
        $heno = self::normalizar($texto);

        foreach (self::terminos($consulta) as $termino) {
            if (! str_contains($heno, $termino)) {
                return false;
            }
        }

        return true;
    }

    /** Las palabras de la búsqueda, en minúsculas, sin tildes y sin vacíos. @return list<string> */
    public static function terminos(string $consulta): array
    {
        return array_values(array_filter(preg_split('/\s+/u', self::normalizar($consulta)) ?: []));
    }

    /** Minúsculas y sin tildes: «cámara» encuentra «camara» y al revés. */
    private static function normalizar(string $texto): string
    {
        return (string) Str::of($texto)->trim()->lower()->ascii();
    }
}
