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
}
