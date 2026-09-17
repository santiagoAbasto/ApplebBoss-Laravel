<?php

namespace App\Support;

use App\Models\ConfiguracionTienda;
use App\Models\SeoPage;

/**
 * Cómo está hoy lo que Google y las redes leen de la tienda.
 *
 * Lo usa la pantalla «Google y redes sociales» para decir, página por página, qué texto sale de verdad (el escrito a
 * mano, el de la plantilla o el valor por defecto) y qué le falta o le sobra. Las medidas no son un capricho: un
 * título de más de 60 caracteres Google lo corta, y una descripción de menos de 70 no alcanza para convencer.
 */
class SeoEstado
{
    public const TITULO_MAX = 60;
    public const DESC_MIN   = 70;
    public const DESC_MAX   = 160;

    /** El ejemplo que se usa para ver una plantilla con un nombre de verdad. */
    private const EJEMPLOS = [
        'store.product'         => 'iPhone 15 Pro 256 GB',
        'novedades.show'        => 'Llegaron los iPhone 15',
        'store.page'            => 'Garantía',
        'store.collection'      => 'Vuelta a clases',
        'store.compare.modelos' => 'iPhone',
    ];

    /** Una página con todo lo que la pantalla necesita mostrar. */
    public static function paraElPanel(SeoPage $p): array
    {
        $default  = Seo::DEFAULTS[$p->page_key] ?? [];
        $ejemplo  = self::EJEMPLOS[$p->page_key] ?? 'Ejemplo';
        $llenar   = fn (?string $t) => $t === null ? null : str_replace('{titulo}', $ejemplo, $t);

        $titulo      = $p->title ?: ($default['title'] ?? null);
        $descripcion = $p->description ?: ($default['description'] ?? null) ?: ConfiguracionTienda::get('seo_descripcion_default');

        $propio = (bool) ($p->title || $p->description || $p->og_image || $p->canonical);

        return [
            'id'          => $p->id,
            'page_key'    => $p->page_key,
            'path'        => $p->path,
            'label'       => $p->label,
            'tipo'        => $p->tipo,
            'title'       => $p->title,
            'description' => $p->description,
            'og_image'    => $p->og_image,
            'og_image_url' => $p->og_image ? Seo::absolute($p->og_image) : null,
            'noindex'     => $p->noindex,
            'canonical'   => $p->canonical,
            'default'     => $default,
            'ejemplo'     => $ejemplo,
            // Lo que de verdad sale hoy, con la plantilla ya resuelta
            'titulo_real'      => $llenar($titulo),
            'descripcion_real' => $llenar($descripcion),
            'propio'           => $propio,
            'problemas'        => self::problemas($llenar($titulo), $llenar($descripcion), $p->noindex),
        ];
    }

    /** Qué le falta o le sobra a una página, en palabras del panel. */
    public static function problemas(?string $titulo, ?string $descripcion, bool $noindex = false): array
    {
        if ($noindex) {
            return [];   // una página oculta a propósito no tiene nada que arreglar
        }

        $problemas = [];
        $largoTitulo = mb_strlen((string) $titulo);
        $largoDesc   = mb_strlen((string) $descripcion);

        if ($largoTitulo === 0) {
            $problemas[] = ['tono' => 'falta', 'texto' => 'Sin título: Google inventa uno con lo que encuentre en la página.'];
        } elseif ($largoTitulo > self::TITULO_MAX) {
            $problemas[] = ['tono' => 'largo', 'texto' => "El título tiene {$largoTitulo} caracteres: Google corta cerca de " . self::TITULO_MAX . '.'];
        }

        if ($largoDesc === 0) {
            $problemas[] = ['tono' => 'falta', 'texto' => 'Sin descripción: Google arma la frase con un pedazo suelto de la página.'];
        } elseif ($largoDesc < self::DESC_MIN) {
            $problemas[] = ['tono' => 'corto', 'texto' => "La descripción tiene {$largoDesc} caracteres: con menos de " . self::DESC_MIN . ' no alcanza para convencer.'];
        } elseif ($largoDesc > self::DESC_MAX) {
            $problemas[] = ['tono' => 'largo', 'texto' => "La descripción tiene {$largoDesc} caracteres: Google corta cerca de " . self::DESC_MAX . '.'];
        }

        return $problemas;
    }

    /**
     * Lo que hace falta en el servidor para que Google lea bien la tienda.
     * En producción, lo importante es que la dirección del sitio sea la de verdad: de ahí salen las URL canónicas,
     * las del sitemap y las de las imágenes que se comparten.
     */
    public static function sitio(): array
    {
        $url = rtrim((string) config('app.url'), '/');
        $host = parse_url($url, PHP_URL_HOST) ?: '';
        $esLocal = in_array($host, ['localhost', '127.0.0.1', ''], true) || str_ends_with($host, '.local') || str_ends_with($host, '.test');
        $seguro = str_starts_with($url, 'https://');

        return [
            'url'      => $url,
            'local'    => $esLocal,
            'seguro'   => $seguro,
            'listo'    => ! $esLocal && $seguro,
            'falta'    => match (true) {
                $esLocal  => 'La dirección del sitio todavía es la de prueba (' . $url . '). Google, el sitemap y las imágenes que se comparten usan esa dirección: al publicar hay que cambiar APP_URL en el servidor por el dominio real.',
                ! $seguro => 'La dirección del sitio no usa https. Google prefiere https y algunos navegadores avisan que el sitio no es seguro.',
                default   => null,
            },
            'sitemap'  => $url . '/sitemap.xml',
            'robots'   => $url . '/robots.txt',
        ];
    }

    /** El resumen de arriba de la pantalla. */
    public static function resumen(array $paginas): array
    {
        $visibles = array_filter($paginas, fn ($p) => ! $p['noindex']);

        return [
            'total'         => count($paginas),
            'personalizadas'=> count(array_filter($paginas, fn ($p) => $p['propio'])),
            'con_problemas' => count(array_filter($paginas, fn ($p) => $p['problemas'] !== [])),
            'ocultas'       => count($paginas) - count($visibles),
        ];
    }
}
