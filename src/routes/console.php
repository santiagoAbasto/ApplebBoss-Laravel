<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Reseñas del perfil de Google: una vez al día, solo si la cuenta dueña del perfil ya se conectó en el panel
Artisan::command('resenas:google', function () {
    if (! \App\Support\ResenasDeGoogle::conectado()) {
        $this->info('Google no está conectado: no hay nada que traer.');

        return;
    }

    $n = \App\Support\ResenasDeGoogle::importar();
    $this->info("Reseñas de Google: {$n['nuevas']} nuevas, {$n['actualizadas']} actualizadas, {$n['borradas']} borradas.");
})->purpose('Trae las reseñas del perfil de Google de la tienda');

\Illuminate\Support\Facades\Schedule::command('resenas:google')->dailyAt('07:00')->withoutOverlapping();

// API de integración: el registro de solicitudes se guarda 90 días. Medición de la tienda: 14 meses (política de privacidad)
\Illuminate\Support\Facades\Schedule::command('model:prune', ['--model' => [\App\Models\IntegracionSolicitud::class, \App\Models\EventoWeb::class]])->dailyAt('03:30');

// Dólar paralelo para cobrar en USDT: se mueve minuto a minuto, así que se lee cada 30 segundos (la fuente lo mide cada 1 a 2)
Artisan::command('tipo-cambio:actualizar', function () {
    $tasa = \App\Support\Pagos\TipoDeCambio::actualizar();
    $tasa ? $this->info("Bs {$tasa} por USDT.") : $this->warn('La fuente no respondió: queda el último valor bueno.');
})->purpose('Lee el dólar paralelo con el que se cobra en USDT');

\Illuminate\Support\Facades\Schedule::command('tipo-cambio:actualizar')->everyThirtySeconds()->withoutOverlapping(1);

// Pedidos sin pago: al vencer el plazo se cancelan y el equipo vuelve a la tienda. También acota cuánto vale un monto en USDT ya cotizado.
Artisan::command('pedidos:liberar-vencidos', function () {
    $this->info(\App\Support\Checkout\StockDePedidos::liberarVencidos() . ' pedidos vencidos liberados.');
})->purpose('Cancela los pedidos que vencieron sin pago y devuelve los equipos a la tienda');

\Illuminate\Support\Facades\Schedule::command('pedidos:liberar-vencidos')->everyMinute()->withoutOverlapping(5);

// IndexNow: Bing (y con él ChatGPT y Copilot) se entera de lo nuevo, lo que cambió y lo vendido sin esperar a rastrear
Artisan::command('seo:indexnow {--todo : Avisa el sitemap entero}', function () {
    $n = \App\Support\Seo\IndexNow::avisarCambios((bool) $this->option('todo'));
    $n === null ? $this->warn('No se avisó: dominio de prueba o IndexNow no respondió.') : $this->info("IndexNow: {$n} direcciones avisadas.");
})->purpose('Avisa a Bing por IndexNow qué direcciones del sitemap cambiaron');

\Illuminate\Support\Facades\Schedule::command('seo:indexnow')->everyFifteenMinutes()->withoutOverlapping(10);
