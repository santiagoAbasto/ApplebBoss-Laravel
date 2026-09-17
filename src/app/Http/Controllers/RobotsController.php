<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class RobotsController extends Controller
{
    public function index(): Response
    {
        $base = rtrim(config('app.url'), '/');

        $content = implode("\n", [
            'User-agent: *',
            'Disallow: /admin',
            'Disallow: /login',
            'Disallow: /register',
            'Disallow: /password',
            'Disallow: /profile',
            'Disallow: /dashboard',
            'Disallow: /vendedor',
            'Disallow: /api/',
            'Disallow: /sanctum/',
            'Disallow: /horizon',
            'Disallow: /telescope',
            '',
            "Sitemap: {$base}/sitemap.xml",
        ]);

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
