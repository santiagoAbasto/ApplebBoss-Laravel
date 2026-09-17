<?php

namespace App\Http\Controllers;

use App\Models\CatalogCategory;
use App\Models\CatalogoPublicacion;
use App\Models\Page;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $base = rtrim(config('app.url'), '/');

        // Publicaciones activas — solo slug + updated_at, mínima query
        $products = CatalogoPublicacion::publicadoAhora()
            ->select('slug', 'updated_at')
            ->orderByDesc('updated_at')
            ->get();

        // Páginas CMS activas
        $pages = Page::active()
            ->select('slug', 'updated_at')
            ->get();

        $urls = collect();

        // Home
        $urls->push(['loc' => $base . '/', 'priority' => '1.0', 'changefreq' => 'daily',   'lastmod' => now()->toAtomString()]);

        // Catálogo
        $urls->push(['loc' => $base . '/catalogo', 'priority' => '0.9', 'changefreq' => 'daily', 'lastmod' => now()->toAtomString()]);

        // Hubs fijos + Trade-In
        foreach (['/iphone', '/mac', '/seminuevos', '/myskin', '/trade-in'] as $hub) {
            $urls->push(['loc' => $base . $hub, 'priority' => '0.8', 'changefreq' => 'weekly', 'lastmod' => now()->toAtomString()]);
        }

        // Novedades: solo con alguna publicada e indexable (sin ellas, la página es un aviso)
        if (\App\Models\Novedad::published()->where('indexable', true)->exists()) {
            $urls->push(['loc' => $base . '/novedades', 'priority' => '0.7', 'changefreq' => 'weekly', 'lastmod' => now()->toAtomString()]);
        }

        // Comparativas de modelos (una por familia con base de modelos de referencia)
        foreach (array_keys(ComparadorModelosController::FAMILIAS) as $familia) {
            $urls->push(['loc' => $base . '/comparar/' . $familia, 'priority' => '0.7', 'changefreq' => 'weekly', 'lastmod' => now()->toAtomString()]);
        }

        // Páginas de las categorías con productos publicados: su portada y su título en Google (Tienda online → Categorías)
        $categoriasConProductos = CatalogoPublicacion::publicadoAhora()->distinct()->pluck('categoria')->flip();
        foreach (CatalogCategory::active()->orderBy('sort_order')->get() as $categoria) {
            if (isset($categoriasConProductos[$categoria->slug])) {
                $urls->push(['loc' => $base . $categoria->urlCatalogo(), 'priority' => '0.8', 'changefreq' => 'daily', 'lastmod' => now()->toAtomString()]);
            }
        }

        // Colecciones activas con al menos un producto a la venta (Tienda online → Colecciones)
        foreach (\App\Models\CatalogCollection::active()->orderBy('sort_order')->get() as $coleccion) {
            $enVenta = $coleccion->publicaciones()->publicadoAhora()->get();
            CatalogoPublicacion::precargarInventario($enVenta);
            if ($enVenta->contains(fn (CatalogoPublicacion $pub) => $pub->productoDisponible())) {
                $urls->push(['loc' => $base . $coleccion->urlPublica(), 'priority' => '0.7', 'changefreq' => 'daily', 'lastmod' => Carbon::parse($coleccion->updated_at)->toAtomString()]);
            }
        }

        // Novedades publicadas e indexables
        foreach (\App\Models\Novedad::published()->where('indexable', true)->get(['slug', 'updated_at']) as $nov) {
            $urls->push([
                'loc'        => $base . '/novedades/' . $nov->slug,
                'priority'   => '0.6',
                'changefreq' => 'monthly',
                'lastmod'    => Carbon::parse($nov->updated_at)->toAtomString(),
            ]);
        }

        // Páginas CMS
        foreach ($pages as $page) {
            $urls->push([
                'loc'        => $base . '/paginas/' . $page->slug,
                'priority'   => '0.5',
                'changefreq' => 'monthly',
                'lastmod'    => Carbon::parse($page->updated_at)->toAtomString(),
            ]);
        }

        // Productos (PDP)
        foreach ($products as $pub) {
            $urls->push([
                'loc'        => $base . '/productos/' . $pub->slug,
                'priority'   => '0.7',
                'changefreq' => 'weekly',
                'lastmod'    => Carbon::parse($pub->updated_at)->toAtomString(),
            ]);
        }

        // Respeta "Ocultar de Google" del admin (SEO por página): páginas fijas por ruta y plantillas por prefijo
        $noindex = collect(\App\Models\SeoPage::map())->filter(fn ($p) => ! empty($p['noindex']))->keys();
        $prefijos = ['store.product' => '/productos/', 'novedades.show' => '/novedades/', 'store.page' => '/paginas/', 'store.compare.modelos' => '/comparar/', 'store.catalog' => '/catalogo?', 'store.collection' => '/coleccion/'];
        $fijas = \App\Models\SeoPage::whereIn('page_key', $noindex)->where('tipo', 'pagina')->pluck('path')->all();
        $urls = $urls->reject(function (array $u) use ($base, $noindex, $prefijos, $fijas) {
            $path = substr($u['loc'], strlen($base)) ?: '/';
            if (in_array($path, $fijas, true)) return true;
            foreach ($prefijos as $key => $prefijo) {
                if ($noindex->contains($key) && str_starts_with($path, $prefijo) && $path !== rtrim($prefijo, '/')) return true;
            }
            return false;
        });

        $rows = $urls->map(function (array $u) {
            $lastmod = isset($u['lastmod']) ? "\n        <lastmod>{$u['lastmod']}</lastmod>" : '';
            return
                "    <url>\n" .
                "        <loc>" . htmlspecialchars($u['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</loc>\n" .
                "        <changefreq>{$u['changefreq']}</changefreq>\n" .
                "        <priority>{$u['priority']}</priority>" .
                $lastmod . "\n" .
                "    </url>";
        })->implode("\n");

        $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" .
               "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" .
               $rows . "\n" .
               "</urlset>\n";

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'X-Robots-Tag' => 'noindex',
        ]);
    }
}
