<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Contexto SEO por request (lo completan los controladores de páginas dinámicas)
        $this->app->scoped(\App\Support\Seo::class);
    }

    /**
     * Bootstrap any application services.
     *
     * Seguridad aplicada:
     *  - Password::defaults() → mínimo 8 chars, mayúscula, minúscula, número, símbolo, no comprometida.
     *  - forceScheme('https') → en producción todas las URLs generadas usan HTTPS.
     *  - Vite prefetch con concurrencia controlada.
     */
    public function boot(): void
    {
        \App\Models\Pedido::observe(\App\Observers\PedidoObserver::class);

        // ── API de integración ─────────────────────────────────────────────
        // Un token solo sirve si su integración sigue activa (desactivarla corta todos sus tokens al instante)
        \Laravel\Sanctum\Sanctum::authenticateAccessTokensUsing(fn ($token, bool $valido) => $valido
            && (! $token->tokenable instanceof \App\Models\Integracion || $token->tokenable->activa));
        // Antes de mirar el token, por IP (frena a quien prueba tokens); después, por integración
        \Illuminate\Support\Facades\RateLimiter::for('integracion-ip', fn (\Illuminate\Http\Request $r) => \Illuminate\Cache\RateLimiting\Limit::perMinute(300)->by('integracion-ip:' . $r->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('integracion', fn (\Illuminate\Http\Request $r) => \Illuminate\Cache\RateLimiting\Limit::perMinute(\App\Models\Integracion::LIMITE_POR_MINUTO)
            ->by('integracion:' . ($r->user()?->getKey() ?? $r->ip())));

        if ($this->shouldUseBuiltAssetsInLocal()) {
            Vite::useHotFile(storage_path('framework/vite-disabled.hot'));
        }

        // ── Política de contraseñas global ────────────────────────────────
        Password::defaults(function () {
            $rule = Password::min(8)->mixedCase()->numbers()->symbols();
            // uncompromised() requiere HTTP externo — solo en producción
            if (app()->isProduction()) {
                $rule = $rule->uncompromised();
            }
            return $rule;
        });

        // ── Forzar HTTPS y fijar el dominio en producción ─────────────────
        // forceRootUrl ata las URLs generadas (ej.: el enlace de restablecer contraseña)
        // a APP_URL, así un Host falso en la petición no puede envenenar esos enlaces.
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
            if ($raiz = config('app.url')) {
                URL::forceRootUrl($raiz);
            }
        }

        // ── Vite prefetch ─────────────────────────────────────────────────
        Vite::prefetch(concurrency: 3);

        // ── La tienda solo muestra lo que está en stock ───────────────────
        // Lo que se vende (o se borra del inventario) deja de estar publicado en ese momento.
        foreach ([\App\Models\Celular::class, \App\Models\Computadora::class, \App\Models\ProductoApple::class, \App\Models\ProductoGeneral::class] as $clase) {
            $clase::updated(function ($producto) {
                if ($producto->wasChanged('estado') && $producto->estado === \App\Support\TiendaSoloDisponible::VENDIDO) {
                    \App\Support\TiendaSoloDisponible::revisar($producto);
                }
            });
            $clase::deleted(fn ($producto) => \App\Support\TiendaSoloDisponible::revisar($producto, eliminado: true));
        }
    }

    private function shouldUseBuiltAssetsInLocal(): bool
    {
        if (! app()->environment('local')) {
            return false;
        }

        return ! filter_var(env('VITE_HMR', false), FILTER_VALIDATE_BOOLEAN);
    }
}
