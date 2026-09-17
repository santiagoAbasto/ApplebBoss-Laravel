<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Ficha técnica de un modelo (iPhone X, iPhone XR…). Se detecta por el nombre del inventario
 * y llena la publicación; la capacidad, el color y la batería salen siempre del equipo real.
 */
class ModeloReferencia extends Model
{
    protected $table = 'modelos_referencia';

    // La foto (foto_*) la sube el admin y la guarda FotoModeloService; el seeder de modelos no la toca.
    protected $fillable = ['tipo', 'familia', 'nombre', 'slug', 'anio', 'alias', 'specs', 'datos', 'autonomia_video_horas', 'orden', 'activo'];

    protected $casts = [
        'alias'                 => 'array',
        'specs'                 => 'array',
        'datos'                 => 'array',
        'autonomia_video_horas' => 'float',
        'anio'                  => 'integer',
        'activo'                => 'boolean',
        'foto_meta'             => 'array',
        'foto_actualizada_at'   => 'datetime',
    ];

    public function publicaciones(): HasMany
    {
        return $this->hasMany(CatalogoPublicacion::class, 'modelo_referencia_id');
    }

    public function tieneFoto(): bool
    {
        return filled($this->foto_card);
    }

    /** URL pública de la foto: 'card' (comparativa y listados) o 'detalle' (pantallas grandes). */
    public function urlFoto(string $variante = 'card'): ?string
    {
        $ruta = $variante === 'detalle' ? ($this->foto_detalle ?: $this->foto_card) : $this->foto_card;

        return $ruta ? asset('storage/' . $ruta) : null;
    }

    /** Medidas (y cámaras, en celulares) para dibujar la ilustración a escala mientras no haya foto. */
    public function visual(): ?array
    {
        $d = $this->datos ?? [];
        // Un producto Apple se dibuja por su forma (iPad, reloj, AirPods…), con sus medidas de frente o su variante
        if ($this->tipo === 'producto_apple') {
            return ['forma' => $d['sistema']['forma'] ?? 'otro', 'etiqueta' => null, ...(is_array($d['visual'] ?? null) ? $d['visual'] : [])];
        }
        // Un accesorio se dibuja por su forma (cargador, vidrio, funda…); el cargador lleva su potencia («20W»)
        if ($this->tipo === 'producto_general') {
            return [
                'forma'    => $d['sistema']['forma'] ?? 'otro',
                'etiqueta' => is_array($d['visual'] ?? null) ? ($d['visual']['etiqueta'] ?? null) : null,
            ];
        }
        if ($this->tipo === 'computadora') {
            return empty($d['diseno']['ancho_mm']) ? null : [
                'formato'        => $d['diseno']['formato'],                  // portatil o escritorio
                'ancho_mm'       => $d['diseno']['ancho_mm'],
                'profundidad_mm' => $d['diseno']['profundidad_mm'],
                'alto_mm'        => ($d['diseno']['alto_mm'] ?? false) ?: null, // solo la iMac
                'pulgadas'       => $d['pantalla']['pulgadas'] ?? null,
                // La cámara en muesca: MacBook Air con M2 o posterior y MacBook Pro de 14 y 16 pulgadas. Sin muesca, las
                // Intel y la Neo (Apple no la describe): la ilustración es referencial.
                'muesca'         => $d['diseno']['formato'] === 'portatil' && ($d['rendimiento']['arquitectura'] ?? null) === 'apple'
                    && ! str_contains((string) ($d['rendimiento']['chip'] ?? ''), 'A18'),
            ];
        }
        if ($this->tipo !== 'celular' || empty($d['diseno']['alto_mm']) || empty($d['diseno']['ancho_mm'])) {
            return null;
        }

        return [
            'alto_mm'  => $d['diseno']['alto_mm'],
            'ancho_mm' => $d['diseno']['ancho_mm'],
            'ultra'    => (bool) ($d['camaras']['ultra_mp'] ?? false),
            'tele'     => (bool) ($d['camaras']['tele_mp'] ?? false),
            'lidar'    => (bool) ($d['camaras']['lidar'] ?? false),
            'plegable' => (bool) ($d['pantalla']['plegable'] ?? false),
        ];
    }

    /** Datos del modelo que sirven para comparar, pero no describen a un equipo en particular. */
    public const CAMPOS_SOLO_COMPARATIVA = [
        'capacidades_disponibles', 'colores_disponibles', 'memorias_disponibles', 'almacenamientos_disponibles',
        'normas', 'pruebas',   // de los cargadores: sirven para comparar el original con el certificado
    ];

    /** "IPHONE XS MAX 256GB", "ip xs max" y "iPhone XS Max" → "iphonexsmax" */
    public static function normalizar(?string $texto): string
    {
        $t = Str::ascii(mb_strtolower(trim((string) $texto)));
        $t = preg_replace('/\b\d+\s*(gb|tb)\b/', ' ', $t);
        $t = preg_replace('/^ip(?=\s|\d)/', 'iphone', $t);
        $t = preg_replace('/\b(apple|celular|telefono)\b/', ' ', $t);

        return preg_replace('/[^a-z0-9]+/', '', $t);
    }

    public static function delTipo(string $tipo): Collection
    {
        return self::query()
            ->where('tipo', $tipo)
            ->where('activo', true)
            ->orderByDesc('anio')
            ->orderBy('orden')
            ->orderBy('nombre')
            ->get();
    }

    /** El modelo cuyo nombre o alias coincide exactamente (así "iPhone XS" no se confunde con "iPhone XS Max"). */
    public static function detectarEn(Collection $modelos, ?string $texto): ?self
    {
        $clave = self::normalizar($texto);

        return $clave === '' ? null : $modelos->first(fn (self $m) => in_array($clave, $m->clavesDeteccion(), true));
    }

    public static function detectar(string $tipo, ?string $texto): ?self
    {
        return self::normalizar($texto) === '' ? null : self::detectarEn(self::delTipo($tipo), $texto);
    }

    /**
     * El modelo de un equipo del inventario. Celulares, por nombre exacto; productos Apple, por su nombre y si tiene red
     * celular (ver detectarProductoApple); computadoras, por sus rasgos
     * (línea, chip, pulgadas y año, en el nombre o en el procesador) y solo si su memoria y su almacenamiento existen en
     * ese modelo. Si hay más de un candidato (por ejemplo, «MacBook Pro M3 Pro» de 14 o de 16 pulgadas), no se elige.
     */
    public static function deInventario(string $tipo, mixed $equipo, ?Collection $modelos = null): ?self
    {
        $modelos ??= self::delTipo($tipo);

        return match ($tipo) {
            'computadora' => self::detectarComputadora(
                $modelos,
                trim(($equipo->nombre ?? '') . ' ' . ($equipo->procesador ?? '')),
                self::gb($equipo->ram ?? null),
                self::gb($equipo->almacenamiento ?? null),
            ),
            'celular' => self::detectarEn($modelos, $equipo->modelo ?? null),
            'producto_apple' => self::detectarProductoApple($modelos, $equipo),
            'producto_general' => self::detectarAccesorio($modelos, $equipo->nombre ?? null),
            default => null,
        };
    }

    /**
     * La ficha de un accesorio por su nombre en el inventario: la primera, en el orden de accesorios.php (de lo más
     * específico a lo más general), que coincide con `sistema.detectar` y no con `sistema.excluir`. Así «CUBO 20 W
     * ORIGINAL» toma el adaptador de Apple y «CUBO 20W Calidad Origen», el certificado.
     */
    public static function detectarAccesorio(Collection $modelos, ?string $nombre): ?self
    {
        $texto = self::textoAccesorio($nombre);
        if ($texto === '') {
            return null;
        }
        $coincide = fn (mixed $patrones) => collect(is_array($patrones) ? $patrones : [])
            ->contains(fn (string $patron) => preg_match(\App\Support\FichaTecnica\EsquemaAccesorio::regex($patron), $texto) === 1);

        return $modelos->where('tipo', 'producto_general')->sortBy('orden')->first(function (self $m) use ($coincide) {
            $s = $m->datos['sistema'] ?? [];

            return $coincide($s['detectar'] ?? []) && ! $coincide($s['excluir'] ?? false);
        });
    }

    /**
     * La ficha de un producto Apple del inventario: la que coincide con `sistema.detectar` y no con `sistema.excluir` en su
     * nombre («IWATCH SERIE 10 DE 46MM + LTE»). Si el modelo tiene variante con red celular, la unidad lo es si tiene IMEI
     * o si su nombre dice LTE, Cellular o 5G. Si coincide más de una ficha («MAGIC MOUSE» sin decir el conector), no se
     * elige: la elige quien publica. Sin coincidencias, se prueba el nombre exacto de la ficha o de sus alias.
     */
    public static function detectarProductoApple(Collection $modelos, mixed $equipo): ?self
    {
        $texto = self::textoAccesorio($equipo->modelo ?? null);
        if ($texto === '') {
            return null;
        }
        $regex = fn (string $patron) => \App\Support\FichaTecnica\EsquemaAccesorio::regex($patron);
        $coincide = fn (mixed $patrones) => collect(is_array($patrones) ? $patrones : [])
            ->contains(fn (string $patron) => preg_match($regex($patron), $texto) === 1);
        $esCelular = (bool) ($equipo->tiene_imei ?? false)
            || preg_match($regex(\App\Support\FichaTecnica\EsquemaProductoApple::CELULAR), $texto) === 1;

        $propios = $modelos->where('tipo', 'producto_apple');
        $candidatos = $propios->filter(function (self $m) use ($coincide, $esCelular) {
            $s = $m->datos['sistema'] ?? [];

            return $coincide($s['detectar'] ?? []) && ! $coincide($s['excluir'] ?? false)
                && (($s['celular'] ?? null) === null || $s['celular'] === $esCelular);
        });

        return match ($candidatos->count()) {
            1       => $candidatos->first(),
            0       => self::detectarEn($propios, $equipo->modelo ?? null),
            default => null,
        };
    }

    /** «CUBO 20 W ORIGINAL» → «cubo 20w original»; «Funda de Diseño IP 14» → «funda de diseno ip 14»; «FUNDA_SILIC_7» → «funda silic 7». */
    public static function textoAccesorio(?string $texto): string
    {
        $t = trim(preg_replace('/[^a-z0-9]+/', ' ', Str::ascii(mb_strtolower((string) $texto))));

        return preg_replace('/\b(\d+) (w|mm|mah|m)\b/', '$1$2', $t);
    }

    public static function detectarComputadora(Collection $modelos, ?string $texto, ?int $ramGb = null, ?int $almacenamientoGb = null): ?self
    {
        $linea = self::lineaDe($texto);
        if ($linea === null) {
            return null;
        }
        [$chip, $pulgadas, $anio] = [self::chipDe($texto), self::pulgadasDe($texto), self::anioDe($texto)];

        $candidatos = $modelos->filter(function (self $m) use ($linea, $chip, $pulgadas, $anio, $ramGb, $almacenamientoGb) {
            $r = $m->rasgos();

            return $r['linea'] === $linea
                && ($chip === null || $r['chip'] === $chip)
                && ($pulgadas === null || $r['pulgadas'] === $pulgadas)
                && ($anio === null || $r['anio'] === $anio)
                && ($ramGb === null || in_array($ramGb, $r['ram'], true))
                && ($almacenamientoGb === null || in_array($almacenamientoGb, $r['almacenamiento'], true));
        });

        return $candidatos->count() === 1 ? $candidatos->first() : null;
    }

    /** Lo que distingue a una computadora: línea, chip, pulgadas, año y las memorias y almacenamientos con que se vendió. */
    public function rasgos(): array
    {
        $r = $this->datos['rendimiento'] ?? [];

        return [
            'linea'          => self::lineaDe($this->nombre),
            'chip'           => ($r['arquitectura'] ?? null) === 'intel' ? 'intel' : self::chipDe($r['chip'] ?? null),
            'pulgadas'       => (int) floor((float) ($this->datos['pantalla']['pulgadas'] ?? 0)),
            'anio'           => (int) ($this->datos['sistema']['anio'] ?? 0),
            'ram'            => $r['ram_gb'] ?? [],
            'almacenamiento' => $r['almacenamiento_gb'] ?? [],
        ];
    }

    /**
     * «MacBook Air (13 pulgadas, M5)» → 'macbook air'; «MACBOOK RETINA 2017» → 'macbook'; «IMAC 24» → 'imac';
     * «LENOVO IDEAPAD GAMING 3» → 'ideapad gaming'. Para sumar otra línea de PC, agregarla aquí.
     */
    public static function lineaDe(?string $texto): ?string
    {
        $t = self::textoPlano($texto);

        return match (true) {
            str_contains($t, 'macbook air') => 'macbook air',
            str_contains($t, 'macbook pro') => 'macbook pro',
            str_contains($t, 'macbook neo') => 'macbook neo',
            str_contains($t, 'imac')        => 'imac',
            str_contains($t, 'macbook')     => 'macbook',
            str_contains($t, 'ideapad gaming') => 'ideapad gaming',
            default                         => null,
        };
    }

    /** Chip nombrado en el texto: 'm5 pro', 'm5', 'a18 pro', 'intel' (Core i5, i7, m3…) o 'ryzen 7' (AMD). Null si no dice. */
    public static function chipDe(?string $texto): ?string
    {
        $t = self::textoPlano($texto);
        if (preg_match('/\bryzen\s*([3579])\b/', $t, $z)) {
            return "ryzen {$z[1]}";
        }
        if (preg_match('/\b(intel|core|icore|i[3579])\b/', $t)) {
            return 'intel';
        }
        if (preg_match('/\ba(\d{2})\s*(pro)?\b/', $t, $a)) {
            return 'a' . $a[1] . (($a[2] ?? '') !== '' ? ' pro' : '');
        }

        return preg_match('/\bm([1-9])\s*(pro|max|ultra)?\b/', $t, $m) ? 'm' . $m[1] . (($m[2] ?? '') !== '' ? " {$m[2]}" : '') : null;
    }

    /** «13"», «13 INCH» o «15 PULGADAS» → 13 / 15. */
    public static function pulgadasDe(?string $texto): ?int
    {
        return preg_match('/\b(1[1-7]|2[0-7])\s*pulgadas\b/', self::textoPlano($texto), $p) ? (int) $p[1] : null;
    }

    public static function anioDe(?string $texto): ?int
    {
        return preg_match('/\b(20[0-3]\d)\b/', self::textoPlano($texto), $a) ? (int) $a[1] : null;
    }

    /** «16 RAM», «24 GB» u «8» → 16 / 24 / 8; «1 TB» → 1024. */
    public static function gb(mixed $valor): ?int
    {
        if (! preg_match('/(\d+(?:[.,]\d+)?)\s*(tb|gb)?/i', (string) $valor, $n)) {
            return null;
        }
        $numero = (float) str_replace(',', '.', $n[1]);

        return (int) round(strtolower($n[2] ?? '') === 'tb' ? $numero * 1024 : $numero);
    }

    /** Minúsculas sin tildes; comillas, «inch» y «pulg» pasan a «pulgadas». */
    private static function textoPlano(?string $texto): string
    {
        $t = Str::ascii(mb_strtolower((string) $texto));
        $t = preg_replace('/(\d)\s*(?:"|\'\'|”|inches|inch|pulgadas|pulg|in\b)/u', '$1 pulgadas ', $t);

        return trim(preg_replace('/\s+/', ' ', preg_replace('/[^a-z0-9. ]+/', ' ', $t)));
    }

    /** Colores de Apple escritos en inglés en el inventario. */
    private const COLORES_EN = [
        'silver' => 'Plata', 'space black' => 'Negro espacial', 'black' => 'Negro espacial', 'space gray' => 'Gris espacial',
        'space grey' => 'Gris espacial', 'starlight' => 'Blanco estelar', 'midnight' => 'Medianoche', 'sky blue' => 'Azul cielo',
        'gold' => 'Oro', 'rose gold' => 'Oro rosa', 'white' => 'Blanco', 'blue' => 'Azul', 'pink' => 'Rosa', 'yellow' => 'Amarillo',
        'purple' => 'Morado', 'orange' => 'Naranja', 'jet black' => 'Negro azabache', 'slate' => 'Pizarra', 'natural' => 'Natural',
    ];

    /**
     * El nombre oficial del color del equipo si el inventario lo nombra sin dudas: en inglés («Silver» → «Plata») o por el
     * comienzo de un solo color del modelo («gris» → «Gris espacial»). Si no, null (queda el del inventario).
     */
    public function colorDelEquipo(?string $color): ?string
    {
        $t = self::textoPlano($color);
        // Los productos Apple llevan sus colores en `sistema.colores`
        $colores = $this->datos['diseno']['colores'] ?? (is_array($this->datos['sistema']['colores'] ?? null) ? $this->datos['sistema']['colores'] : []);
        if ($t === '' || ! $colores) {
            return null;
        }
        $oficial = self::COLORES_EN[$t] ?? null;
        if ($oficial && in_array($oficial, $colores, true)) {
            return $oficial;
        }
        $parecidos = array_values(array_filter($colores, fn ($c) => str_starts_with(self::textoPlano($c), $t)));

        return count($parecidos) === 1 ? $parecidos[0] : null;
    }

    /**
     * El chip del equipo con su nombre oficial: el del modelo si tiene uno solo (chips de Apple, y las PC, que son una
     * configuración exacta) o, en las Mac con Intel, la opción del modelo que coincide con lo que dice el inventario
     * (i5, i7…). Null si no se puede saber.
     */
    public function chipDelEquipo(?string $procesador): ?string
    {
        $r = $this->datos['rendimiento'] ?? [];
        if (in_array($r['arquitectura'] ?? null, ['apple', 'x86'], true)) {
            return $r['chip'] ?? null;
        }
        $t = self::textoPlano($procesador);
        $opciones = array_values(array_filter($r['cpu'] ?? [], function (string $cpu) use ($t) {
            $o = self::textoPlano($cpu);
            if (! preg_match('/\b(i[3579]|m3)\b/', $o, $familia) || ! preg_match('/\b' . $familia[1] . '\b/', $t)) {
                return false;
            }

            // Si el inventario dice la frecuencia, tiene que coincidir
            return ! preg_match('/\b(\d\.\d)\s*g/', $t, $ghz) || str_contains($o, $ghz[1]);
        }));

        return count($opciones) === 1 ? $opciones[0] : null;
    }

    public function clavesDeteccion(): array
    {
        return collect([$this->nombre, ...($this->alias ?? [])])
            ->map(fn ($a) => self::normalizar($a))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Lo que se copia a la ficha de la publicación. Lo que el modelo no tiene no se copia (la tienda no lo muestra),
     * salvo lo que el cliente pregunta aunque la respuesta sea no: si es compatible con Apple Intelligence.
     */
    public function fichaParaPublicacion(): array
    {
        $ficha = collect($this->specs ?? [])
            ->except(self::CAMPOS_SOLO_COMPARATIVA)
            ->filter(fn ($v) => filled($v))
            ->all();

        $compatible = match ($this->tipo) {
            'celular'     => $this->datos['sistema']['apple_intelligence'] ?? null,
            'computadora' => $this->datos['rendimiento']['apple_intelligence'] ?? null,
            default       => null,
        };
        if ($compatible === false) {
            $ficha['apple_intelligence'] = 'No compatible';
        }

        if ($this->autonomia_video_horas) {
            $ficha['autonomia_video_horas'] = $this->autonomia_video_horas;
        }

        return $ficha;
    }
}
