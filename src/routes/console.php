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
