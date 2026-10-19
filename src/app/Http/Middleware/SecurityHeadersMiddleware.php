<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Agrega cabeceras de seguridad HTTP a TODAS las respuestas web.
     *
     * La CSP se adapta automáticamente al entorno:
     *  - LOCAL / STAGING : permite Vite HMR (localhost:5173/5174) y fuentes externas.
     *  - PRODUCCIÓN       : política estricta sin orígenes externos de desarrollo.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $isProduction = config('app.env') === 'production';

        // ── Anti-MIME sniffing ───────────────────────────────────────────
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // ── Anti-Clickjacking ────────────────────────────────────────────
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // ── Referrer controlado ──────────────────────────────────────────
        // Una respuesta puede pedir una política más estricta (los enlaces de documentos: no-referrer)
        if (! $response->headers->has('Referrer-Policy')) {
            $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        }

        // ── Deshabilitar APIs sensibles no usadas ────────────────────────
        // `interest-cohort` salió de Chrome: hoy solo ensucia la consola con «Unrecognized feature».
        // La ubicación sí se usa: el delivery en Cochabamba ubica al cliente en el mapa. Solo para
        // este mismo sitio (ningún iframe de afuera) y el navegador igual le pide permiso a la persona.
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(self), payment=(), usb=()'
        );

        // ── Aislamiento de ventana cross-origin ──────────────────────────
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');

        // ── Bloquear carga de recursos cross-origin ──────────────────────
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');

        // ── Flash / Acrobat ──────────────────────────────────────────────
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');

        // ── No cachear páginas protegidas ────────────────────────────────
        if ($request->is('admin/*') || $request->is('vendedor/*') || $request->is('profile*')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            $response->headers->set('Pragma', 'no-cache');
        }

        // ── Content Security Policy ───────────────────────────────────────
        $csp = $isProduction
            ? $this->cspProduction()
            : $this->cspDevelopment();

        $response->headers->set('Content-Security-Policy', $csp);

        // ── HSTS — solo en HTTPS real (producción) ────────────────────────
        if ($isProduction && $request->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=63072000; includeSubDomains; preload'
            );
        }

        return $response;
    }

    /* ──────────────────────────────────────────────────────────────────
     * CSP PRODUCCIÓN
     * Política estricta. Ajustá los dominios si usás CDN propio.
     * ────────────────────────────────────────────────────────────────── */
    private function cspProduction(): string
    {
        $m = $this->medicionDeTerceros();

        return implode('; ', [
            // Solo recursos del propio dominio por defecto
            "default-src 'self'",

            // Scripts: self + inline (Inertia/React necesita inline en el <head>) + la medición de Cloudflare,
            // que el proxy inyecta solo en producción.
            "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com" . $m['script'],

            // Estilos: self + inline (Tailwind genera estilos inline) + bunny fonts + google fonts
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com",

            // Fuentes: self + bunny.net (Figtree) + google fonts + data URIs
            "font-src 'self' https://fonts.bunny.net https://fonts.gstatic.com data:",

            // Imágenes: self + data URIs + blob (avatares, logos inline)
            "img-src 'self' data: blob: https://tile.openstreetmap.org" . $m['img'],

            // Fetch/XHR: self + el envío de la medición de Cloudflare
            "connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com" . $m['connect'],

            // Workers (service worker, etc.)
            "worker-src 'self' blob:",

            // Embeds → bloqueado
            "object-src 'none'",

            // iframes embebidos → solo el mapa de Google Maps de la sección de ubicación
            "frame-src 'self' https://www.google.com https://maps.google.com",

            // Base href → solo self
            "base-uri 'self'",

            // Formularios → solo self
            "form-action 'self'",

            // iframes → solo self (refuerza X-Frame-Options)
            "frame-ancestors 'self'",
        ]);
    }

    /**
     * Google Analytics y Microsoft Clarity se habilitan solo si su código está cargado en Tienda online → Tráfico
     * (y aun así cargan recién cuando el visitante acepta las cookies). Sin código, la política no les abre nada.
     */
    private function medicionDeTerceros(): array
    {
        $m = ['script' => '', 'connect' => '', 'img' => ''];
        try {
            if (filled(\App\Models\ConfiguracionTienda::get('medicion_ga4'))) {
                $m['script']  .= ' https://www.googletagmanager.com';
                $m['connect'] .= ' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com';
                $m['img']     .= ' https://*.google-analytics.com https://www.googletagmanager.com';
            }
            if (filled(\App\Models\ConfiguracionTienda::get('medicion_clarity'))) {
                $m['script']  .= ' https://www.clarity.ms https://*.clarity.ms';
                $m['connect'] .= ' https://*.clarity.ms https://c.bing.com';
                $m['img']     .= ' https://*.clarity.ms https://c.bing.com';
            }
        } catch (\Throwable) {
            // Sin base (por ejemplo, durante una migración) la política queda cerrada
        }

        return $m;
    }

    /* ──────────────────────────────────────────────────────────────────
     * CSP DESARROLLO / LOCAL
     * Permisiva para que Vite HMR funcione en localhost.
     * ────────────────────────────────────────────────────────────────── */
    private function cspDevelopment(): string
    {
        return implode('; ', [
            "default-src 'self'",

            // Vite HMR carga scripts desde localhost:5173, o 5174 si 5173 ya esta ocupado.
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 http://127.0.0.1:5173 http://localhost:5174 http://127.0.0.1:5174",

            // Estilos: self + inline + bunny fonts + google fonts + vite dev server
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com http://localhost:5173 http://127.0.0.1:5173 http://localhost:5174 http://127.0.0.1:5174",

            // Fuentes: self + bunny.net + google fonts + data URIs + fuentes servidas por Vite.
            "font-src 'self' https://fonts.bunny.net https://fonts.gstatic.com data: http://localhost:5173 http://127.0.0.1:5173 http://localhost:5174 http://127.0.0.1:5174",

            // Imágenes
            "img-src 'self' data: blob: https://tile.openstreetmap.org",

            // WebSocket de Vite HMR (ws://) + fetch normal
            "connect-src 'self' http://localhost:5173 ws://localhost:5173 http://127.0.0.1:5173 ws://127.0.0.1:5173 http://localhost:5174 ws://localhost:5174 http://127.0.0.1:5174 ws://127.0.0.1:5174",

            // Workers
            "worker-src 'self' blob:",

            "object-src 'none'",
            "frame-src 'self' https://www.google.com https://maps.google.com",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ]);
    }
}
