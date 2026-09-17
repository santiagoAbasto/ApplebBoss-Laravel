<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Inertia\Inertia;
use Inertia\Response;

class PublicPageController extends Controller
{
    public function show(string $slug): Response
    {
        $page = Page::active()->where('slug', $slug)->firstOrFail();

        // El mismo título en Google que las categorías y las colecciones: «Nombre — Apple Boss Cochabamba»
        app(\App\Support\Seo::class)->context([
            'titulo'          => $page->title,
            'seo_title'       => $page->tituloGoogle(),
            'seo_description' => $page->meta_description,
        ]);

        return Inertia::render('Store/Page', [
            'page' => [
                'title'            => $page->title,
                'content'          => $page->content,
                'meta_title'       => $page->meta_title ?: $page->title,
                'meta_description' => $page->meta_description,
            ],
        ]);
    }
}
