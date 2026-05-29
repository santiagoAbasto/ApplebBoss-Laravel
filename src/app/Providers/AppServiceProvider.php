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
        //
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
        if ($this->shouldUseBuiltAssetsInLocal()) {
            Vite::useHotFile(storage_path('framework/vite-disabled.hot'));
        }

        // ── Política de contraseñas global ────────────────────────────────
        Password::defaults(function () {
            return Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()
                ->uncompromised();
        });

        // ── Forzar HTTPS en producción ────────────────────────────────────
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // ── Vite prefetch ─────────────────────────────────────────────────
        Vite::prefetch(concurrency: 3);
    }

    private function shouldUseBuiltAssetsInLocal(): bool
    {
        if (! app()->environment('local')) {
            return false;
        }

        return ! filter_var(env('VITE_HMR', false), FILTER_VALIDATE_BOOLEAN);
    }
}
