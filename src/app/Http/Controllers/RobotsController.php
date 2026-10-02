<?php

namespace App\Http\Controllers;

use App\Support\Seo\UrlPublica;
use Illuminate\Http\Response;

/**
 * robots.txt generado.
 *
 * Deja rastrear todo lo público (incluidos CSS y JS, que Google necesita para renderizar)
 * y cierra solo lo que de verdad no debe indexarse: panel, cuentas y el flujo de compra
 * privado de cada cliente. Declara el sitemap sobre el dominio oficial.
 */
class RobotsController extends Controller
{
    public function index(): Response
    {
        $lineas = [
            'User-agent: *',
            // Panel y cuentas
            'Disallow: /admin',
            'Disallow: /vendedor',
            'Disallow: /dashboard',
            'Disallow: /login',
            'Disallow: /register',
            'Disallow: /password',
            'Disallow: /profile',
            // Flujo de compra: privado de cada cliente, nunca indexable
            'Disallow: /checkout',
            'Disallow: /pedido/',
            'Disallow: /seguimiento/',
            // APIs y utilidades
            'Disallow: /api/',
            'Disallow: /sanctum/',
            'Disallow: /horizon',
            'Disallow: /telescope',
            // Búsqueda interna: no genera páginas útiles para Google
            'Disallow: /*?q=',
            '',
            'Sitemap: ' . UrlPublica::de('sitemap.xml'),
        ];

        return response(implode("\n", $lineas) . "\n", 200, [
            'Content-Type'  => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * llms.txt: la guía del sitio para los buscadores de IA (ChatGPT, Claude, Perplexity), en Markdown.
     * Dice qué es la tienda, dónde está, qué vende hoy y con qué precio, y adónde ir por cada tema.
     * Sale de los mismos datos que la tienda: lo vendido deja de figurar solo.
     */
    public function llms(): Response
    {
        $negocio  = \App\Support\Seo\DatosEstructurados::negocio();
        $u        = fn (string $ruta = '') => UrlPublica::de($ruta);
        $bs       = fn ($n) => 'Bs ' . number_format((float) $n, 0, ',', '.');
        $direccion = implode(', ', array_filter([
            $negocio['address']['streetAddress'] ?? null, $negocio['address']['addressLocality'] ?? null, 'Bolivia',
        ]));

        $lineas = [
            '# ' . ($negocio['name'] ?? 'Apple Boss'),
            '',
            '> ' . ($negocio['description'] ?? 'Tienda de tecnología Apple en Cochabamba, Bolivia.')
                . ' Los precios están en bolivianos (Bs) y salen del inventario real: lo que se vende deja de publicarse.',
            '',
            '- Sitio: ' . $u(),
            '- Ubicación: ' . $direccion,
        ];
        if (! empty($negocio['telephone'])) {
            $lineas[] = '- Teléfono: ' . $negocio['telephone'];
        }
        if (! empty($negocio['hasMap'])) {
            $lineas[] = '- Mapa: ' . $negocio['hasMap'];
        }

        $lineas = array_merge($lineas, [
            '',
            '## Comprar',
            '- [Catálogo completo](' . $u('catalogo') . '): todo lo disponible hoy, con precio.',
            '- [iPhone](' . $u('iphone') . '): nuevos y seminuevos revisados.',
            '- [Mac](' . $u('mac') . '): MacBook Air, MacBook Pro y más.',
            '- [Seminuevos](' . $u('seminuevos') . '): equipos revisados, con la salud de batería a la vista.',
            '- [Fundas MYSKIN](' . $u('myskin') . ')',
            '- [Trade-In](' . $u('trade-in') . '): cotiza tu equipo usado como parte de pago.',
        ]);

        $publicaciones = \App\Models\CatalogoPublicacion::publicadoAhora()->orderByDesc('updated_at')->limit(200)->get();
        \App\Models\CatalogoPublicacion::precargarInventario($publicaciones);
        $disponibles = $publicaciones->filter(fn ($pub) => $pub->productoDisponible());

        if ($disponibles->isNotEmpty()) {
            $lineas[] = '';
            $lineas[] = '## Disponible hoy';
            foreach ($disponibles as $pub) {
                $precio   = $pub->precioPublico();
                $detalle  = implode(', ', array_filter([$precio > 0 ? $bs($precio) : null, $pub->condicion]));
                $lineas[] = '- [' . $pub->titulo . '](' . $u('productos/' . $pub->slug) . ')' . ($detalle ? ': ' . $detalle : '');
            }
        }

        $lineas[] = '';
        $lineas[] = '## Comparar modelos';
        foreach (ComparadorModelosController::FAMILIAS as $slug => $familia) {
            $lineas[] = '- [Comparar ' . ($familia['nombre'] ?? $slug) . '](' . $u('comparar/' . $slug) . '): fichas técnicas lado a lado, con precio y stock de la tienda.';
        }

        $paginas = \App\Models\Page::active()->orderBy('sort_order')->get(['slug', 'title']);
        if ($paginas->isNotEmpty()) {
            $lineas[] = '';
            $lineas[] = '## Información';
            foreach ($paginas as $pagina) {
                $lineas[] = '- [' . $pagina->title . '](' . $u('paginas/' . $pagina->slug) . ')';
            }
        }

        $preguntas = \App\Models\Faq::deLugar('general');
        if ($preguntas) {
            $lineas[] = '';
            $lineas[] = '## Preguntas frecuentes';
            foreach (array_slice($preguntas, 0, 12) as $f) {
                $lineas[] = '- **' . trim((string) ($f['question'] ?? '')) . '** '
                    . \App\Support\TextoEnriquecido::aTexto(str_replace("\n", ' ', (string) ($f['answer'] ?? '')));
            }
        }

        return response(implode("\n", $lineas) . "\n", 200, [
            'Content-Type'  => 'text/markdown; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
            'X-Robots-Tag'  => 'noindex',
        ]);
    }
}
