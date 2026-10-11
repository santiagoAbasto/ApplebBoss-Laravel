<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CatalogoPublicacion;
use App\Models\ConfiguracionTienda;
use App\Models\Page;
use App\Support\ResenasDeGoogle;
use App\Support\Seo\IndexNow;
use App\Support\Seo\UrlPublica;
use App\Support\Trafico\Panel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Tráfico: quién visita la tienda, de dónde llega, qué mira y cuánto de eso termina en un pedido.
 * Los datos son de la medición propia (sin cookies). Google Analytics y Clarity son opcionales: se activan pegando
 * su código acá y solo cargan si el visitante acepta el aviso de cookies.
 */
class TraficoController extends Controller
{
    public const PERIODOS = [7, 30, 90];

    public function index(Request $request): Response
    {
        $dias = in_array((int) $request->query('dias'), self::PERIODOS, true) ? (int) $request->query('dias') : 30;

        return Inertia::render('Admin/Trafico/Index', [
            'dias'     => $dias,
            'periodos' => self::PERIODOS,
            'datos'    => (new Panel($dias))->datos(),
            'medicion' => [
                'ga4'     => ConfiguracionTienda::get('medicion_ga4'),
                'clarity' => ConfiguracionTienda::get('medicion_clarity'),
            ],
            'puesta'   => $this->puestaEnMarcha(),
        ]);
    }

    /** Pegar o quitar el código de Google Analytics 4 y de Microsoft Clarity. */
    public function medicion(Request $request): RedirectResponse
    {
        $request->merge([
            'ga4'     => strtoupper(trim((string) $request->input('ga4'))) ?: null,
            'clarity' => strtolower(trim((string) $request->input('clarity'))) ?: null,
        ]);
        $datos = $request->validate([
            'ga4'     => ['nullable', 'regex:/^G-[A-Z0-9]{4,20}$/'],
            'clarity' => ['nullable', 'regex:/^[a-z0-9]{6,20}$/'],
        ], [
            'ga4.regex'     => 'El ID de medición de Google Analytics empieza con «G-», por ejemplo G-AB12CD34EF.',
            'clarity.regex' => 'El ID de proyecto de Clarity son letras y números en minúscula, por ejemplo k8x2abc9de.',
        ]);

        ConfiguracionTienda::set('medicion_ga4', $datos['ga4']);
        ConfiguracionTienda::set('medicion_clarity', $datos['clarity']);

        return back()->with('success', 'Medición guardada. Google Analytics y Clarity cargan solo si el visitante acepta las cookies.');
    }

    /** Lo que falta para que Google, Bing y los buscadores de IA conozcan la tienda. */
    private function puestaEnMarcha(): array
    {
        $dominio = parse_url(UrlPublica::base(), PHP_URL_HOST);

        return [
            'publicados'  => CatalogoPublicacion::publicadoAhora()->count(),
            'sitemap'     => rescue(fn () => IndexNow::direccionesDelSitemap(), 0, false),
            'indexnow'    => IndexNow::ultimoAviso(),
            'resenas'     => ResenasDeGoogle::conectado(),
            'legales'     => Page::whereIn('slug', Page::LEGALES)->get()
                ->map(fn (Page $p) => ['titulo' => $p->title, 'url' => $p->urlPublica(), 'borrador' => $p->esBorrador(), 'activa' => (bool) $p->active])->values(),
            'enlaces'     => [
                'search_console' => "https://search.google.com/search-console?resource_id=sc-domain:{$dominio}",
                'bing'           => 'https://www.bing.com/webmasters/',
                'analytics'      => 'https://analytics.google.com/',
                'clarity'        => 'https://clarity.microsoft.com/',
                'perfil_google'  => 'https://business.google.com/',
            ],
        ];
    }
}
