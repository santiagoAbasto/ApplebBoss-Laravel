<?php

namespace App\Http\Middleware;

use App\Models\ConfiguracionTienda;
use App\Models\NavMenuItem;
use App\Models\StoreLocation;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        if (app()->environment(['local', 'testing'])) {
            return null;
        }

        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    /** Whitelist explícita de settings públicos — NUNCA exponer API keys, tokens, SMTP, secretos internos. */
    private static function publicStoreSettings(): array
    {
        // La ciudad y la dirección salen del local principal (Tienda online → Ubicaciones), no de Configuración
        $local = static::localPrincipal();

        return [
            // El WhatsApp y la identidad de la tienda: Tienda online → Configuración, en una sola consulta
            ...ConfiguracionTienda::paraLaTienda(),
            'tienda_local'       => $local !== null,
            'tienda_direccion'   => $local?->address,
            'tienda_mapa'        => $local?->map_link_url,
            'tienda_ciudad'      => $local?->city ?: 'Cochabamba',
            'tienda_pais'        => $local?->country ?: 'Bolivia',
            // El título y la descripción de cada página los resuelve App\Support\Seo y se escriben en el HTML del
            // servidor (app.blade.php): no salen por acá.
            // Newsletter: solo textos del formulario. Remitente, reply-to y SMTP nunca salen al frontend.
            'newsletter_enabled'    => ConfiguracionTienda::get('newsletter_enabled', '1') !== '0',
            'newsletter_titulo'     => ConfiguracionTienda::get('newsletter_titulo'),
            'newsletter_subtitulo'  => ConfiguracionTienda::get('newsletter_subtitulo'),
            'newsletter_boton'      => ConfiguracionTienda::get('newsletter_boton'),
        ];
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            // El botón de «entrar con Google» solo se dibuja si hay credenciales cargadas
            'googleLogin' => \App\Http\Controllers\Tienda\GoogleLoginController::configurado(),
            'auth' => [
                'user' => $request->user(),
                // Qué módulos del panel abre su rol: el menú esconde lo que el servidor va a rechazar igual
                'permisos' => fn () => $request->user()
                    ? \App\Models\Role::mapa()[$request->user()->rol] ?? ($request->user()->rol === 'admin' ? ['*'] : [])
                    : [],
            ],
            // Para mostrar cada precio en Bs y en USDT. Null si no se pudo saber la tasa:
            // en ese caso la tienda muestra solo bolivianos, nunca una conversión inventada.
            'tipoCambio' => fn () => \App\Support\Pagos\TipoDeCambio::paraLaVista(),
            'tienda'  => fn () => static::publicStoreSettings(),
            'navMenu' => fn () => static::navMenuData(),
            // Contadores del menú del panel (solo para administradores): solicitudes de Trade-In sin responder
            'avisosAdmin' => fn () => $request->user()?->rol === 'admin' ? static::avisosAdmin() : null,
            // Páginas informativas activas (Nosotros, Garantía…) para el pie de página: solo título y dirección
            'paginas' => fn () => static::paginasData(),
            // Metaetiquetas de la página pública actual (null en admin). Se evalúa después del controlador.
            'seo'     => fn () => app(\App\Support\Seo::class)->resolve($request),
            'flash'   => fn () => $request->hasSession() ? [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ] : [],
        ];
    }

    private static function avisosAdmin(): array
    {
        try {
            return ['trade_in' => \App\Models\TradeInSolicitud::where('estado', 'nuevo')->count()];
        } catch (\Throwable) {
            return [];
        }
    }

    private static function localPrincipal(): ?StoreLocation
    {
        try {
            return StoreLocation::principal();
        } catch (\Throwable) {
            return null;
        }
    }

    private static function paginasData(): array
    {
        try {
            return \App\Models\Page::active()->orderBy('sort_order')->get(['slug', 'title'])
                ->map(fn ($p) => ['title' => $p->title, 'href' => '/paginas/' . $p->slug])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private static function navMenuData(): array
    {
        try {
            return [
                'header' => NavMenuItem::serializeSlot('header'),
                'footer' => NavMenuItem::serializeSlot('footer'),
                'mobile' => NavMenuItem::serializeSlot('mobile'),
            ];
        } catch (\Throwable) {
            // Table may not exist yet (first deploy before migration)
            return ['header' => [], 'footer' => [], 'mobile' => []];
        }
    }
}
