<?php

namespace App\Support;

use App\Models\CatalogoCompatibilidad;
use App\Models\CatalogoPublicacion;
use App\Models\CompatibilityTarget;

/**
 * Detecta para qué modelos sirve un accesorio a partir de su nombre en el inventario.
 *
 *   "Funda de Diseño IP 14 PRO MAX"   → iPhone 14 Pro Max
 *   "FUNDA SILICONA IP 12/12 PRO"     → iPhone 12, iPhone 12 Pro
 *   "FUNDA DE SILICONA IP 7/8 PLUS"   → iPhone 7 Plus, iPhone 8 Plus
 *   "Funda de Diseño IP 13/14"        → iPhone 13, iPhone 14
 *
 * Así una funda de diseño, de silicona o MagSafe para el mismo modelo aparece junta al filtrar por modelo.
 */
class ModelosCompatibles
{
    private const BASE     = '(\d{1,2}S?|XS|XR|X|SE)';
    private const VARIANTE = '(PRO\s*MAX|PRO|PLUS|MINI|MAX|AIR)';

    /** @return array<string, array{nombre: string, generacion: string, familia: string}> slug => datos */
    public static function detectar(?string $nombre): array
    {
        $t = mb_strtoupper(str_replace('_', ' ', (string) $nombre));
        $t = preg_replace('/\s+/', ' ', $t);

        $out = [];

        if (preg_match('/AIRPODS\s+PRO\s*2/', $t)) {
            $out['airpods-pro-2a-gen'] = ['nombre' => 'AirPods Pro (2.ª gen.)', 'generacion' => 'AirPods Pro', 'familia' => 'airpods'];
        }

        if (preg_match('/\b(?:IPHONE|IP)\s*(\d|X|SE)(.*)$/u', $t, $m)) {
            $texto = $m[1] . $m[2];
        } elseif (preg_match('/\b(FUNDA|VIDRIO|PROTECTOR|CASE)\b/u', $t)
            && preg_match('/\s(\d{1,2}S?|XS|XR|X)\s*(PRO\s*MAX|PRO|PLUS|MINI|MAX|AIR)?\s*$/u', $t, $m)) {
            // "VIDRIO CAMARA 14 PRO MAX", "FUNDA SILIC 7": el modelo va al final, sin "IP"
            $texto = $m[1] . (isset($m[2]) ? ' ' . $m[2] : '');
        } else {
            return $out;
        }

        $segmentos = [];
        foreach (explode('/', $texto) as $parte) {
            if (! preg_match('/^\s*' . self::BASE . '\s*' . self::VARIANTE . '?/', $parte, $s)) break;
            $segmentos[] = ['base' => $s[1], 'variante' => isset($s[2]) ? preg_replace('/\s+/', ' ', $s[2]) : null];
        }
        if (! $segmentos) return $out;

        // "7/8 PLUS" → la variante del último se aplica a los anteriores ("12/12 PRO" no: es el mismo modelo base)
        $ultimo = end($segmentos);
        if (count($segmentos) > 1 && $ultimo['variante']) {
            foreach ($segmentos as $i => $seg) {
                if ($seg['variante'] === null && $seg['base'] !== $ultimo['base'] && $i < count($segmentos) - 1) {
                    $segmentos[$i]['variante'] = $ultimo['variante'];
                }
            }
        }

        foreach ($segmentos as $seg) {
            foreach (self::modelos($seg['base'], $seg['variante']) as $slug => $datos) {
                $out[$slug] = $datos;
            }
        }

        return $out;
    }

    /** Los modelos que nombra el accesorio, para leer: «iPhone 12 y iPhone 12 Pro». Null si no nombra ninguno. */
    public static function nombres(?string $nombre): ?string
    {
        $nombres = array_column(self::detectar($nombre), 'nombre');
        if (! $nombres) {
            return null;
        }
        $ultimo = array_pop($nombres);

        return $nombres ? implode(', ', $nombres) . " y {$ultimo}" : $ultimo;
    }

    /** Vincula la publicación con los modelos detectados. Devuelve cuántos modelos quedaron vinculados. */
    public static function sincronizar(CatalogoPublicacion $pub, ?string $nombre): int
    {
        $modelos = self::detectar($nombre);

        foreach ($modelos as $slug => $d) {
            $target = CompatibilityTarget::firstOrCreate(
                ['slug' => $slug],
                ['family' => $d['familia'], 'name' => $d['nombre'], 'generation' => $d['generacion'], 'active' => true, 'sort_order' => 0],
            );
            CatalogoCompatibilidad::firstOrCreate(['publicacion_id' => $pub->id, 'target_id' => $target->id]);
        }

        return count($modelos);
    }

    /**
     * Convierte lo que escribe el cliente en slugs de modelo.
     * Acepta "iphone-14-pro-max", "iPhone 14 Pro Max" o "14 pro max".
     *
     * @return string[]
     */
    public static function slugsDesdeTexto(string $texto): array
    {
        $texto = trim(mb_strtolower($texto));
        if ($texto === '') return [];

        if (preg_match('/^[a-z0-9]+(-[a-z0-9]+)+$/', $texto) && CompatibilityTarget::where('slug', $texto)->exists()) {
            return [$texto];
        }

        $limpio = preg_replace('/^(apple\s+)?(iphone|ip)[\s-]*/', '', str_replace('-', ' ', $texto));
        $slugs  = array_keys(self::detectar('IP ' . $limpio));
        if (! $slugs && str_contains($texto, 'airpods')) {
            $slugs = array_keys(self::detectar($texto));
        }

        return $slugs;
    }

    /** @return array<string, array{nombre: string, generacion: string, familia: string}> */
    private static function modelos(string $base, ?string $variante): array
    {
        $base = mb_strtolower($base);

        // El SE de 2.ª y 3.ª generación usa las mismas fundas que el iPhone 7/8
        if ($base === 'se') {
            return [
                'iphone-se-2a-gen' => ['nombre' => 'iPhone SE (2.ª gen.)', 'generacion' => 'iPhone SE', 'familia' => 'iphone'],
                'iphone-se-3a-gen' => ['nombre' => 'iPhone SE (3.ª gen.)', 'generacion' => 'iPhone SE', 'familia' => 'iphone'],
            ];
        }

        $baseNombre = ctype_alpha($base) ? mb_strtoupper($base) : $base; // XS, XR, X · 14, 6s
        $var        = $variante ? mb_strtolower($variante) : null;
        $varNombre  = $var ? implode(' ', array_map(fn ($w) => $w === 'mini' ? 'mini' : ucfirst($w), explode(' ', $var))) : null;

        $slug   = 'iphone-' . $base . ($var ? '-' . str_replace(' ', '-', $var) : '');
        $nombre = trim("iPhone {$baseNombre} {$varNombre}");

        return [$slug => ['nombre' => $nombre, 'generacion' => "iPhone {$baseNombre}", 'familia' => 'iphone']];
    }
}
