<?php

namespace App\Support\Proveedor;

use PhpOffice\PhpSpreadsheet\IOFactory;
use Smalot\PdfParser\Parser as PdfParser;

/**
 * Lee la lista de un proveedor (Excel de Apple Land o PDF de Planet) y la convierte en los mismos items que usan los
 * .json de database/data/proveedores ({tipo, modelo, capacidad, sim, colores, usd}). No publica nada: devuelve lo que
 * entendió para que la pantalla lo muestre en vista previa y el dueño confirme. Lo que no reconoce queda en `errores`.
 */
final class LectorLista
{
    /** @return array{items: list<array>, errores: list<string>} */
    public static function leer(string $ruta): array
    {
        $ext = strtolower(pathinfo($ruta, PATHINFO_EXTENSION));

        return match ($ext) {
            'xlsx', 'xls' => self::excel($ruta),
            'pdf'         => self::pdf($ruta),
            default       => ['items' => [], 'errores' => ["Formato no soportado: .{$ext} (sube un Excel o un PDF)"]],
        };
    }

    // ─── Excel (Apple Land) ──────────────────────────────────────────────────────

    /** @return array{items: list<array>, errores: list<string>} */
    private static function excel(string $ruta): array
    {
        $hoja = IOFactory::load($ruta)->getActiveSheet()->toArray(null, true, false, false);
        $items = [];
        $errores = [];
        $modo = 'simple';        // simple | colores
        $cols = [];              // en modo colores: [indiceColumna => nombreColorCrudo]
        $empezo = false;

        foreach ($hoja as $fila) {
            $modelo = trim((string) ($fila[1] ?? ''));            // columna B
            if ($modelo === '') {
                continue;
            }
            $low = mb_strtolower($modelo);

            if (! $empezo) {
                $empezo = str_contains($low, 'solo $us') || str_contains($low, 'solo $us o udt');
                continue; // antes de la sección de precios no hay nada que leer
            }
            if (str_contains($low, 'precio por colores')) {
                $cols = [];
                foreach ([3, 4, 5] as $c) {
                    $nombre = trim((string) ($fila[$c] ?? ''));
                    if ($nombre !== '') {
                        $cols[$c] = $nombre;
                    }
                }
                $modo = $cols ? 'colores' : 'simple';
                continue;
            }
            if (self::esTitulo($low)) {       // IPHONES, APPLE WATCH, AIRPODS, MACBOOK, IPAD, IPHONE LINEA 18…
                $modo = 'simple';
                $cols = [];
                continue;
            }

            $map = MapaModelo::de($modelo, 'fisico'); // en el Excel de Apple Land, un 17/18 sin rótulo es chip físico
            if ($map === null) {
                $errores[] = $modelo;
                continue;
            }

            if ($modo === 'colores' && $cols) {
                $porPrecio = [];   // usd => list<color>
                foreach ($cols as $c => $nombreColor) {
                    $usd = self::numero($fila[$c] ?? null);
                    if ($usd === null) {
                        continue;
                    }
                    foreach (Colores::deColumna($nombreColor) as $color) {
                        $porPrecio[(string) $usd][] = $color;
                    }
                }
                foreach ($porPrecio as $usd => $colores) {
                    $items[] = $map + ['colores' => array_values(array_unique($colores)), 'usd' => (float) $usd];
                }
                continue;
            }

            $usd = self::numero($fila[3] ?? null) ?? self::numero($fila[4] ?? null) ?? self::numero($fila[5] ?? null);
            if ($usd === null) {
                $errores[] = $modelo;
                continue;
            }
            $items[] = $map + ['colores' => [], 'usd' => (float) $usd];
        }

        return ['items' => $items, 'errores' => $errores];
    }

    private static function esTitulo(string $low): bool
    {
        foreach (['iphones', 'iphone linea', 'apple watch', 'airpods', 'accesorios', 'macbook', 'ipad', 'precios', 'solo $us'] as $t) {
            if ($low === $t || $low === rtrim($t) || str_starts_with($low, $t) && mb_strlen($low) < mb_strlen($t) + 4) {
                return true;
            }
        }

        return false;
    }

    // ─── PDF (Planet Cell) ───────────────────────────────────────────────────────

    /** @return array{items: list<array>, errores: list<string>} */
    private static function pdf(string $ruta): array
    {
        $texto = (new PdfParser())->parseFile($ruta)->getText();
        $items = [];
        $errores = [];
        $buffer = '';        // nombre de modelo que viene partido en varias líneas
        $ultimo = null;      // índice del último item, para pegarle colores que siguen abajo

        foreach (preg_split('/\r\n|\r|\n/u', $texto) as $linea) {
            $linea = trim(preg_replace('/\s+/u', ' ', $linea));
            if ($linea === '' || preg_match('/lista por mayor|^modelo\b|precio.*colores/iu', $linea)) {
                continue;
            }

            // El precio es un número suelto de 3 o 4 dígitos que NO sea una capacidad (256GB, 1TB, 46MM, 4K).
            if (preg_match('/(?<![\d.])(\d{3,4})(?!\s*(?:gb|tb|tera|mm|inch|k)\b)(?![\d.])/iu', $linea, $m, PREG_OFFSET_CAPTURE)) {
                $usd = (float) $m[1][0];
                $modelo = trim($buffer . ' ' . substr($linea, 0, $m[1][1]));
                $coloresTxt = trim(substr($linea, $m[1][1] + strlen($m[1][0])));
                $buffer = '';

                $map = MapaModelo::de($modelo, 'esim'); // en el PDF de Planet, un 17/18 sin rótulo es eSIM
                if ($map === null) {
                    $errores[] = trim($modelo);
                    $ultimo = null;
                    continue;
                }
                $items[] = $map + ['colores' => Colores::deTexto($coloresTxt, $map['modelo']), 'usd' => $usd];
                $ultimo = array_key_last($items);
                continue;
            }

            // Línea sin precio: o son colores que siguen del item anterior, o es el nombre de un modelo que viene
            // partido en varias líneas (p. ej. «IPAD PRO 11-INCH M4» + «256GB» + «950»). Si arranca con una palabra de
            // modelo, es un modelo nuevo (se guarda en el buffer); si no, son colores del último item.
            $esModelo = (bool) preg_match('/^(ipad|iphone|apple|watch|macbook|airpod|mouse|magic|tv|1[3-8]\b)/iu', $linea);
            if ($ultimo !== null && ! $esModelo) {
                $items[$ultimo]['colores'] = array_values(array_unique(array_merge(
                    $items[$ultimo]['colores'],
                    Colores::deTexto($linea, $items[$ultimo]['modelo'])
                )));
            } else {
                $ultimo = null;
                $buffer = trim($buffer . ' ' . $linea);
            }
        }

        return ['items' => $items, 'errores' => $errores];
    }

    /** Un número de dinero de una celda ("640$", "930$us", "1 730", 1450) → float, o null si no hay. */
    private static function numero(mixed $celda): ?float
    {
        if ($celda === null || $celda === '') {
            return null;
        }
        $t = str_replace([' ', ','], '', (string) $celda);
        if (! preg_match('/(\d+(?:\.\d+)?)/', $t, $m)) {
            return null;
        }
        $n = (float) $m[1];

        return $n >= 50 && $n <= 99999 ? $n : null;   // un precio razonable (evita tomar "4K", "2026", etc.)
    }
}
