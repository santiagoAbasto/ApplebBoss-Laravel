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
\Illuminate\Support\Facades\Schedule::command('model:prune', ['--model' => [\App\Models\IntegracionSolicitud::class, \App\Models\EventoWeb::class, \App\Models\Carrito::class]])->dailyAt('03:30');

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

// Carritos abandonados: el primer recordatorio una hora después del último cambio, el segundo un día después del primero
Artisan::command('carritos:recordar', function () {
    $enviados = 0;
    foreach (\App\Support\Carritos\Recuperacion::pendientes() as $carrito) {
        $enviados += (int) \App\Support\Carritos\Recuperacion::recordar($carrito);
    }
    $this->info("Recordatorios enviados: {$enviados}");
})->purpose('Manda el recordatorio a los carritos y pedidos que quedaron sin pagar');
\Illuminate\Support\Facades\Schedule::command('carritos:recordar')->everyFifteenMinutes()->withoutOverlapping(10);

// Una semana después de la entrega se pide la reseña, una sola vez por pedido y nunca a quien pidió no recibir correos
Artisan::command('resenas:pedir', function () {
    $pedidos = \App\Models\Pedido::with('items')
        ->where('estado', \App\Models\Pedido::ENTREGADO)
        ->whereNull('resena_pedida_en')
        ->whereDoesntHave('resena')
        ->whereNotNull('email_cliente')
        ->whereBetween('entregado_en', [now()->subDays(14), now()->subDays(7)])
        ->where(fn ($q) => $q->whereNull('user_id')->orWhereHas('usuario', fn ($u) => $u->where('sin_recordatorios', false)))
        ->get();
    foreach ($pedidos as $pedido) {
        \Illuminate\Support\Facades\Mail::send(new \App\Mail\PedirResena($pedido));
        $pedido->update(['resena_pedida_en' => now()]);
    }
    $this->info("Pedidos de reseña enviados: {$pedidos->count()}");
})->purpose('Pide la reseña a quien recibió su pedido hace una semana');
\Illuminate\Support\Facades\Schedule::command('resenas:pedir')->dailyAt('10:00')->withoutOverlapping();

// Unos días después de cada venta se pide la reseña por correo (una vez por venta y por cliente, nunca a quien pidió no
// recibir correos). El WhatsApp es un botón del panel; esto cubre el correo automático.
Artisan::command('resenas:pedir-ventas', function () {
    $yaPedidos = \App\Support\Resenas\Solicitud::correosYaPedidos();
    $ventas = \App\Models\Venta::with('vendedor')
        ->whereNull('resena_pedida_en')
        ->whereNotNull('correo_cliente')
        ->whereBetween('created_at', [now()->subDays(5), now()->subDays(2)])
        ->orderBy('created_at')
        ->get();
    $n = 0;
    foreach ($ventas as $venta) {
        $correo = \Illuminate\Support\Str::lower(trim((string) $venta->correo_cliente));
        if ($correo === '' || isset($yaPedidos[$correo])) {
            continue;
        }
        if (\App\Support\Resenas\Solicitud::pedir($venta, null, 'auto')) {
            $yaPedidos[$correo] = true;
            $n++;
        }
    }
    $this->info("Pedidos de reseña por venta enviados: {$n}");
})->purpose('Pide reseña por correo unos días después de cada venta');
\Illuminate\Support\Facades\Schedule::command('resenas:pedir-ventas')->dailyAt('10:30')->withoutOverlapping();

// Masivo, a mano: pide reseña a los clientes con correo a los que todavía no se les pidió. Una sola vez por correo.
Artisan::command('resenas:pedir-historico {--limite=200}', function () {
    $limite = max(1, (int) $this->option('limite'));
    $yaPedidos = \App\Support\Resenas\Solicitud::correosYaPedidos();
    $ventas = \App\Models\Venta::with('vendedor')
        ->whereNull('resena_pedida_en')
        ->whereNotNull('correo_cliente')
        ->orderByDesc('created_at')
        ->get();
    $n = 0;
    foreach ($ventas as $venta) {
        $correo = \Illuminate\Support\Str::lower(trim((string) $venta->correo_cliente));
        if ($correo === '' || isset($yaPedidos[$correo])) {
            continue;
        }
        if (\App\Support\Resenas\Solicitud::pedir($venta, null, 'historico')) {
            $yaPedidos[$correo] = true;
            if (++$n >= $limite) {
                break;
            }
        }
    }
    $this->info("Pedidos de reseña a clientes anteriores: {$n} (límite {$limite})");
})->purpose('Pide reseña a los clientes con correo a los que aún no se les pidió (una vez por correo)');
