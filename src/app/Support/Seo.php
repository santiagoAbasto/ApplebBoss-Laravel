<?php

namespace App\Support;

use App\Models\ConfiguracionTienda;
use App\Models\SeoPage;
use App\Support\Seo\UrlPublica;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Resuelve las metaetiquetas SEO de cada página pública.
 *
 * Prioridad del título:       SEO propio del ítem (producto/novedad) > admin (SEO por página) > valor por defecto.
 * Prioridad de la descripción: SEO propio del ítem > admin > resumen del ítem > por defecto > descripción global.
 * En plantillas, {titulo} se reemplaza por el nombre del ítem.
 *
 * Se renderiza en el servidor (app.blade.php) para que WhatsApp/Facebook/Google lean
 * las etiquetas sin ejecutar JavaScript, y el cliente las actualiza al navegar.
 */
class Seo
{
    /** Valores por defecto (español de Bolivia, sin afirmaciones no verificadas). */
    public const DEFAULTS = [
        'store.home'            => ['title' => 'Apple Boss — Tecnología Apple en Cochabamba', 'description' => 'iPhone, Mac, iPad y accesorios Apple disponibles en Cochabamba. Equipos revisados, precios reales, atención personalizada.'],
        'store.catalog'         => ['title' => 'Catálogo — Apple Boss Cochabamba', 'description' => 'Catálogo de equipos Apple disponibles en Apple Boss Cochabamba: iPhone, Mac, iPad, accesorios y fundas MYSKIN.'],
        'hub.iphone'            => ['title' => 'iPhone — Apple Boss Cochabamba', 'description' => 'Compra tu iPhone en Apple Boss. Equipos nuevos y seminuevos, revisados antes de la entrega. Cochabamba, Bolivia.'],
        'hub.mac'               => ['title' => 'Mac — Apple Boss Cochabamba', 'description' => 'MacBook y Mac en Apple Boss. Nuevas y seminuevas. Cochabamba, Bolivia.'],
        'hub.myskin'            => ['title' => 'Fundas MYSKIN — Apple Boss Cochabamba', 'description' => 'Fundas MYSKIN para iPhone en Apple Boss. Protección con diseño. Encuentra la funda para tu modelo.'],
        'hub.seminuevos'        => ['title' => 'Seminuevos — Apple Boss Cochabamba', 'description' => 'iPhone y Mac seminuevos en Apple Boss. Equipos revisados, con condición y estado de batería informados. Cochabamba, Bolivia.'],
        'trade-in.index'        => ['title' => 'Trade-In: cotiza tu equipo — Apple Boss Cochabamba', 'description' => 'Usa tu equipo actual como parte de pago en Apple Boss: iPhone, Mac y todo Apple, celulares Android, laptops, PC gamer, consolas y más. Cotiza en línea, sin costo y sin compromiso.'],
        'novedades.index'       => ['title' => 'Novedades — Apple Boss Cochabamba', 'description' => 'Lo último que publicamos en Apple Boss, Cochabamba.'],
        'store.compare'         => ['title' => 'Comparar productos — Apple Boss'],
        'store.compare.modelos' => ['title' => 'Comparar {titulo} — Apple Boss Cochabamba', 'description' => 'Compara hasta 4 modelos lado a lado: pantalla, chip, cámaras, batería y más, con los datos técnicos de Apple y el precio y stock de Apple Boss.'],
        'trade-in.confirmacion' => ['title' => 'Solicitud de Trade-In recibida — Apple Boss Cochabamba'],
        'newsletter.baja'       => ['title' => 'Darse de baja del newsletter — Apple Boss'],
        'store.product'         => ['title' => '{titulo} — Apple Boss Cochabamba', 'type' => 'product'],
        'novedades.show'        => ['title' => '{titulo} — Apple Boss Cochabamba', 'type' => 'article'],
        'store.page'            => ['title' => '{titulo} — Apple Boss'],
        'store.collection'      => ['title' => '{titulo} — Apple Boss Cochabamba'],
    ];

    private array $context = [];

    /**
     * Datos del ítem que se está mostrando (lo llaman los controladores de páginas dinámicas).
     * Claves: titulo, descripcion, seo_title, seo_description, imagen, noindex y canonical (las páginas de una categoría y de una colección).
     */
    public function context(array $data): void
    {
        $this->context = array_merge(
            $this->context,
            array_filter($data, fn ($v) => $v !== null && $v !== '')
        );
    }

    public static function isPublicRoute(?string $name): bool
    {
        return $name !== null && array_key_exists($name, self::DEFAULTS);
    }

    public function resolve(Request $request): ?array
    {
        $route = $request->route()?->getName();
        if (! self::isPublicRoute($route)) {
            return null;
        }

        $row     = SeoPage::map()[$route] ?? [];
        $default = self::DEFAULTS[$route];
        $ctx     = $this->context;
        $site    = ConfiguracionTienda::get('seo_sitio_nombre') ?: ConfiguracionTienda::nombre();
        $item    = (string) ($ctx['titulo'] ?? '');
        $fill    = fn (?string $tpl) => $tpl === null || trim($tpl) === '' ? null : trim(str_replace('{titulo}', $item, $tpl));

        $title = $ctx['seo_title']
            ?? $fill($row['title'] ?? null)
            ?? $fill($default['title'] ?? null)
            ?? $site;

        $description = $ctx['seo_description']
            ?? $fill($row['description'] ?? null)
            ?? ($ctx['descripcion'] ?? null)
            ?? ($default['description'] ?? null)
            ?? ConfiguracionTienda::get('seo_descripcion_default');

        $image = $ctx['imagen']
            ?? ($row['og_image'] ?? null)
            ?: (ConfiguracionTienda::get('seo_og_imagen_default') ?: config('seo.og_image_default') ?: null);

        // La URL oficial siempre sale del dominio configurado, no del host de la petición:
        // si no, cada túnel/IP genera otra URL para la misma página y se rompe la indexación.
        $propia = UrlPublica::de($request->path());

        // Sin query string: los filtros no crean duplicados. Las páginas de una categoría y de una colección son la excepción (su propia URL).
        $canonical = match (true) {
            ! empty($ctx['canonical']) => self::absolute($ctx['canonical']),
            ! empty($row['canonical']) => self::absolute($row['canonical']),
            default                    => $propia,
        };

        $noindex = ! empty($row['noindex']) || ! empty($ctx['noindex']);

        return [
            'title'       => Str::limit(strip_tags($title), 120, ''),
            'description' => $description ? Str::limit(trim(preg_replace('/\s+/', ' ', strip_tags($description))), 300, '…') : null,
            'image'       => $image ? self::absolute($image) : null,
            'url'         => $propia,
            'canonical'   => $canonical,
            'robots'      => $noindex ? 'noindex,nofollow' : 'index,follow',
            'type'        => $default['type'] ?? 'website',
            'site_name'   => $site,
        ];
    }

    /** Convierte rutas relativas o del disco public en URL absoluta. */
    public static function absolute(string $value): string
    {
        if (Str::startsWith($value, ['http://', 'https://'])) {
            return $value;
        }
        if (Str::startsWith($value, '/')) {
            return UrlPublica::de($value);
        }
        return Storage::disk('public')->url($value);
    }
}
