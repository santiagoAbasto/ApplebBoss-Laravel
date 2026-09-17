<?php

namespace App\Http\Controllers;

use App\Models\Novedad;
use App\Support\Seo;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * /novedades y cada novedad. Solo muestra lo publicado cuya fecha ya llegó (Tienda online → Novedades).
 */
class NovedadPublicController extends Controller
{
    public function index(): Response
    {
        $novedades = Novedad::paraLaTienda();

        // Sin novedades, la página solo muestra un aviso: Google no la indexa (y el pie y el sitemap no la enlazan)
        app(Seo::class)->context(['noindex' => $novedades === []]);

        return Inertia::render('Store/Novedades', [
            'novedades' => $novedades,
        ]);
    }

    public function show(string $slug): Response
    {
        $novedad = Novedad::published()
            ->where('slug', $slug)
            ->firstOrFail();

        app(Seo::class)->context([
            'titulo'          => $novedad->title,
            'seo_title'       => $novedad->seo_title,
            'seo_description' => $novedad->seo_description,
            'descripcion'     => $novedad->excerpt ?: Str::limit($novedad->textoPlano(), 160),
            'imagen'          => $novedad->urlImagen('detalle'),
            'noindex'         => ! $novedad->indexable,
        ]);

        return Inertia::render('Store/Novedad', [
            'novedad'      => $novedad->tarjeta() + [
                'imagen_grande' => $novedad->urlImagen('detalle'),
                'bloques'       => $novedad->content_blocks ?? [],
            ],
            'datosGoogle'  => $novedad->datosParaGoogle(),
            'relacionadas' => Novedad::paraLaTienda(3, $novedad->id),
        ]);
    }
}
