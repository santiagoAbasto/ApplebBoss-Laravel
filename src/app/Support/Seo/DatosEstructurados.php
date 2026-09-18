<?php

namespace App\Support\Seo;

use App\Models\CatalogoPublicacion;
use App\Models\StoreLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Datos estructurados (JSON-LD) de las páginas públicas.
 *
 * Regla: solo se publica lo que se puede verificar. Si no hay teléfono, dirección o precio,
 * ese campo NO sale en el JSON-LD — nunca se inventa una calificación, un stock ni una reseña.
 *
 * Se imprime en el servidor (app.blade.php) para que Google lo lea sin ejecutar JavaScript.
 */
class DatosEstructurados
{
    /** Grafo JSON-LD para la ruta actual. Devuelve [] si no hay nada verificable que decir. */
    public static function paraLaPagina(?array $seo, Request $request): array
    {
        if (! $seo) {
            return [];
        }

        $ruta = $request->route()?->getName();
        $grafo = [self::negocio(), self::sitio()];

        if ($ruta === 'store.product') {
            $producto = self::producto($request->route('slug') ?? $request->segment(2), $seo);
            if ($producto) {
                $grafo[] = $producto;
            }
        }

        if ($migas = self::migas($request, $seo)) {
            $grafo[] = $migas;
        }

        return array_values(array_filter($grafo));
    }

    /** La tienda: Store (es un LocalBusiness) con el NAP real. */
    public static function negocio(): array
    {
        $cfg = (array) config('seo.negocio', []);
        $sede = Cache::remember('seo.sede', 600, fn () => StoreLocation::where('active', true)->first());

        $telefono  = $cfg['telefono'] ?: ($sede->phone ?? null);
        $ciudad    = $cfg['ciudad'] ?: ($sede->city ?? null);
        $mapa      = $sede->map_link_url ?? null;
        $calle     = $cfg['calle'] ?: self::calleReal($sede, $ciudad);

        $datos = [
            '@type'       => $cfg['tipo'] ?? 'Store',
            '@id'         => UrlPublica::de() . '#tienda',
            'name'        => $cfg['nombre'] ?? 'Apple Boss',
            'url'         => UrlPublica::de(),
            'description' => $cfg['descripcion'] ?? null,
            'image'       => UrlPublica::absoluta(config('seo.og_image_default')),
        ];

        // La dirección solo se publica si hay algo concreto que decir
        if ($calle || $ciudad) {
            $datos['address'] = array_filter([
                '@type'           => 'PostalAddress',
                'streetAddress'   => $calle,
                'addressLocality' => $ciudad,
                'addressRegion'   => $cfg['region'] ?? null,
                'addressCountry'  => $cfg['pais'] ?? 'BO',
            ]);
        }

        if ($telefono) {
            $datos['telephone'] = $telefono;
        }

        if ($mapa) {
            $datos['hasMap'] = $mapa;
        }

        // El horario lo carga la tienda en el panel (Tienda online → Ubicaciones). Es dato propio
        // y verificable, así que se publica. Si no hay horario cargado, no se inventa ninguno.
        if ($sede && ($horario = $sede->horarioParaGoogle())) {
            $datos['openingHoursSpecification'] = $horario;
        }

        $perfiles = array_values(array_filter((array) ($cfg['perfiles'] ?? [])));
        if ($perfiles) {
            $datos['sameAs'] = $perfiles;
        }

        return array_filter($datos, fn ($v) => $v !== null && $v !== []);
    }

    /**
     * La dirección del local, solo si de verdad es una dirección.
     *
     * En la base hoy dice «Cochabamba, Bolivia»: eso es la ciudad y el país, no una calle.
     * Publicarlo como `streetAddress` sería darle a Google un dato falso, así que se descarta.
     * Cuando la tienda cargue la dirección real, esta misma función la deja pasar sola.
     */
    private static function calleReal(?StoreLocation $sede, ?string $ciudad): ?string
    {
        $direccion = trim((string) ($sede->address ?? ''));

        if ($direccion === '') {
            return null;
        }

        $sobrante = str_ireplace(
            array_filter([$ciudad, $sede->city ?? null, $sede->country ?? null, 'Bolivia']),
            ' ',
            $direccion
        );

        // Si al sacarle la ciudad y el país no queda nada, no había dirección de calle
        return trim($sobrante, " \t\n\r,.-") === '' ? null : $direccion;
    }

    /** El sitio, para que Google entienda la entidad y el buscador interno. */
    public static function sitio(): array
    {
        return [
            '@type' => 'WebSite',
            '@id'   => UrlPublica::de() . '#sitio',
            'url'   => UrlPublica::de(),
            'name'  => config('seo.negocio.nombre', 'Apple Boss'),
            'inLanguage' => 'es-BO',
            'publisher'  => ['@id' => UrlPublica::de() . '#tienda'],
            'potentialAction' => [
                '@type'       => 'SearchAction',
                'target'      => ['@type' => 'EntryPoint', 'urlTemplate' => UrlPublica::de('catalogo') . '?q={search_term_string}'],
                'query-input' => 'required name=search_term_string',
            ],
        ];
    }

    /**
     * Un producto publicado, con precio y disponibilidad reales del inventario.
     * Si el producto no existe o no está publicado, no se emite nada.
     */
    public static function producto(?string $slug, array $seo): ?array
    {
        if (blank($slug)) {
            return null;
        }

        $pub = CatalogoPublicacion::publicadoAhora()->where('slug', $slug)->first();
        if (! $pub) {
            return null;
        }

        $precio      = $pub->precioPublico();
        $disponible  = $pub->productoDisponible();

        $datos = [
            '@type'       => 'Product',
            '@id'         => UrlPublica::de('productos/' . $pub->slug) . '#producto',
            'name'        => $pub->titulo,
            'url'         => UrlPublica::de('productos/' . $pub->slug),
            'description' => $seo['description'] ?? $pub->resumen,
            'image'       => $seo['image'] ?? null,
            'brand'       => $pub->marca ? ['@type' => 'Brand', 'name' => $pub->marca] : null,
            'category'    => $pub->categoria,
            // Nuevo vs seminuevo: es un dato comercial verificable y a Google le importa
            'itemCondition' => match (mb_strtolower((string) $pub->condicion)) {
                'nuevo'      => 'https://schema.org/NewCondition',
                'seminuevo'  => 'https://schema.org/UsedCondition',
                default      => null,
            },
        ];

        if ($precio > 0) {
            $datos['offers'] = array_filter([
                '@type'         => 'Offer',
                'url'           => UrlPublica::de('productos/' . $pub->slug),
                'price'         => number_format((float) $precio, 2, '.', ''),
                'priceCurrency' => 'BOB',
                'availability'  => $disponible
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                'itemCondition' => $datos['itemCondition'],
                'seller'        => ['@id' => UrlPublica::de() . '#tienda'],
            ]);
        }

        return array_filter($datos, fn ($v) => $v !== null && $v !== []);
    }

    /** Migas de pan: ayudan a Google a entender la jerarquía y salen en el resultado. */
    public static function migas(Request $request, array $seo): ?array
    {
        $ruta = $request->route()?->getName();

        $mapa = [
            'store.catalog'  => [['Catálogo', 'catalogo']],
            'hub.iphone'     => [['iPhone', 'iphone']],
            'hub.mac'        => [['Mac', 'mac']],
            'hub.myskin'     => [['Fundas MYSKIN', 'myskin']],
            'hub.seminuevos' => [['Seminuevos', 'seminuevos']],
            'novedades.index'=> [['Novedades', 'novedades']],
            'trade-in.index' => [['Trade-In', 'trade-in']],
        ];

        $ruta_migas = $mapa[$ruta] ?? null;

        if ($ruta === 'store.product') {
            // El nombre del producto, no el título SEO con la marca pegada atrás
            $slug = $request->route('slug') ?? $request->segment(2);
            $nombre = CatalogoPublicacion::publicadoAhora()->where('slug', $slug)->value('titulo')
                ?? $seo['title'] ?? 'Producto';

            $ruta_migas = [
                ['Catálogo', 'catalogo'],
                [$nombre, ltrim($request->path(), '/')],
            ];
        }

        if (! $ruta_migas) {
            return null;
        }

        $items = [[
            '@type'    => 'ListItem',
            'position' => 1,
            'name'     => 'Inicio',
            'item'     => UrlPublica::de(),
        ]];

        foreach ($ruta_migas as $i => [$nombre, $path]) {
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $i + 2,
                'name'     => $nombre,
                'item'     => UrlPublica::de($path),
            ];
        }

        return ['@type' => 'BreadcrumbList', 'itemListElement' => $items];
    }

    /** El JSON listo para imprimir dentro de <script type="application/ld+json">. */
    public static function json(?array $seo, Request $request): ?string
    {
        $grafo = self::paraLaPagina($seo, $request);

        if ($grafo === []) {
            return null;
        }

        return json_encode(
            ['@context' => 'https://schema.org', '@graph' => $grafo],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
    }
}
