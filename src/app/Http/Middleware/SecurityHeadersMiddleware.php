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
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // ── Deshabilitar APIs sensibles no usadas ────────────────────────
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
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
        return implode('; ', [
            // Solo recursos del propio dominio por defecto
            "default-src 'self'",

            // Scripts: solo self + inline (Inertia/React necesita inline en el <head>)
            "script-src 'self' 'unsafe-inline'",

            // Estilos: self + inline (Tailwind genera estilos inline) + bunny fonts
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net",

            // Fuentes: self + bunny.net (Figtree) + data URIs (FontAwesome local inline)
            "font-src 'self' https://fonts.bunny.net data:",

            // Imágenes: self + data URIs + blob (avatares, logos inline)
            "img-src 'self' data: blob:",

            // Fetch/XHR: solo self
            "connect-src 'self'",

            // Workers (service worker, etc.)
            "worker-src 'self' blob:",

            // Embeds → bloqueado
            "object-src 'none'",

            // Base href → solo self
            "base-uri 'self'",

            // Formularios → solo self
            "form-action 'self'",

            // iframes → solo self (refuerza X-Frame-Options)
            "frame-ancestors 'self'",
        ]);
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

            // Estilos: self + inline + bunny fonts + vite dev server
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net http://localhost:5173 http://127.0.0.1:5173 http://localhost:5174 http://127.0.0.1:5174",

            // Fuentes: self + bunny.net + data URIs + fuentes servidas por Vite.
            "font-src 'self' https://fonts.bunny.net data: http://localhost:5173 http://127.0.0.1:5173 http://localhost:5174 http://127.0.0.1:5174",

            // Imágenes
            "img-src 'self' data: blob:",

            // WebSocket de Vite HMR (ws://) + fetch normal
            "connect-src 'self' http://localhost:5173 ws://localhost:5173 http://127.0.0.1:5173 ws://127.0.0.1:5173 http://localhost:5174 ws://localhost:5174 http://127.0.0.1:5174 ws://127.0.0.1:5174",

            // Workers
            "worker-src 'self' blob:",

            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ]);
    }
}
