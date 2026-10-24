<?php

namespace App\Support\Catalogo;

use App\Models\CatalogoPublicacion;
use Illuminate\Support\Str;

/**
 * Arma la descripción larga (en prosa, HTML) de un producto, con lo que ya se sabe de él: su nombre, condición, la
 * prosa de su ficha si la tiene (o un resumen de sus specs si no), la garantía derivada de su condición y el cierre
 * de la tienda. Mismas etiquetas que permite TextoEnriquecido (p, h3, ul, li, strong). No inventa datos.
 */
final class GeneradorDescripcion
{
    public static function para(CatalogoPublicacion $pub): string
    {
        $nombre = trim((string) $pub->titulo);
        $cond = (string) $pub->condicion;
        $esNuevo = $cond === '' || $cond === 'Nuevo';
        $estado = $esNuevo ? 'nuevo y sellado' : 'seminuevo en excelente estado, revisado por nuestros técnicos';

        $p = [];
        $p[] = '<p><strong>' . e($nombre) . "</strong> {$estado}, disponible en Cochabamba y listo para entrega inmediata.</p>";

        $contenido = $pub->modeloReferencia?->datos['contenido'] ?? null;
        if (! empty($contenido['parrafos'])) {
            // La ficha ya trae prosa (Apple Watch, AirPods, iPad…): se usa tal cual.
            foreach (array_slice($contenido['parrafos'], 0, 2) as $parrafo) {
                $p[] = '<p>' . e($parrafo) . '</p>';
            }
            if (! empty($contenido['puntos'])) {
                $p[] = '<h3>Lo que lo destaca</h3>';
                $p[] = '<ul>';
                foreach (array_slice($contenido['puntos'], 0, 6) as $punto) {
                    $p[] = '  <li>' . e($punto) . '</li>';
                }
                $p[] = '</ul>';
            }
        } else {
            // Sin prosa en la ficha (iPhone, Mac, Pixel): se arma un resumen con sus specs clave.
            $frase = self::destacados((string) $pub->producto_tipo, (array) ($pub->modeloReferencia?->specs ?? []));
            if ($frase !== '') {
                $p[] = '<p>' . $frase . '</p>';
            }
        }

        $cierre = [];
        if ($g = $pub->garantiaCobertura()) {
            $cierre[] = 'Garantía de ' . $g['meses'] . ' meses por el negocio' . ($g['extendida'] ? ' (extendida)' : '') . '.';
        }
        $cierre[] = 'Equipo revisado y stock confirmado. Recojo en Cochabamba sin costo y envíos a todo el país; atención directa por WhatsApp.';
        $p[] = '<p>' . e(implode(' ', $cierre)) . '</p>';

        return implode("\n", $p);
    }

    /** Una frase con las specs más vistosas según el tipo (los valores de la ficha ya son legibles). */
    private static function destacados(string $tipo, array $specs): string
    {
        $v = fn (string ...$claves) => collect($claves)->map(fn ($k) => $specs[$k] ?? null)->filter()->first();

        $frases = [];
        if ($tipo === 'celular') {
            if ($x = self::limpio($v('tamano_pantalla'))) $frases[] = 'pantalla de ' . $x;
            if ($x = self::limpio($v('chip'))) $frases[] = 'chip ' . $x;
            if ($x = self::limpio($v('camara_principal', 'sistema_camaras'))) $frases[] = 'cámara de ' . $x;
            if ($x = self::limpio($v('bateria_mah', 'autonomia'))) $frases[] = 'batería de ' . $x;
        } elseif ($tipo === 'computadora') {
            if ($x = self::limpio($v('chip', 'procesador'))) $frases[] = 'chip ' . $x;
            if ($x = self::limpio($v('tamano_pantalla', 'pantalla'))) $frases[] = 'pantalla ' . $x;
            if ($x = self::limpio($v('ram', 'memoria'))) $frases[] = $x . ' de memoria';
            if ($x = self::limpio($v('almacenamiento'))) $frases[] = $x . ' de almacenamiento';
        } elseif ($tipo === 'producto_apple') {
            if ($x = self::limpio($v('chip'))) $frases[] = 'chip ' . $x;
            if ($x = self::limpio($v('tamano_pantalla', 'pantalla'))) $frases[] = 'pantalla ' . $x;
            if ($x = self::limpio($v('capacidad', 'almacenamiento'))) $frases[] = $x;
            if ($x = self::limpio($v('autonomia'))) $frases[] = $x . ' de autonomía';
        }

        if (! $frases) {
            return '';
        }

        return 'Destaca por su ' . self::unir($frases) . '.';
    }

    /** Toma el primer segmento legible de una spec (antes de · , ( o ;) y lo acorta, para que la frase no quede larga. */
    private static function limpio(?string $x): ?string
    {
        if (! $x) {
            return null;
        }
        // Corta en · ( o ; pero NO en coma: en español la coma es decimal ("6,9 pulgadas", "ƒ/1,48").
        $x = trim((string) preg_split('/\s*[·(;]/u', $x)[0]);
        $x = rtrim($x, " \t.·-");

        return $x !== '' ? Str::limit($x, 36, '') : null;
    }

    private static function unir(array $frases): string
    {
        if (count($frases) === 1) {
            return $frases[0];
        }
        $ultima = array_pop($frases);

        return implode(', ', $frases) . ' y ' . $ultima;
    }
}
