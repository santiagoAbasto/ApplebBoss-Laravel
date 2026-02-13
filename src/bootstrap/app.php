<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))

    /*
    |--------------------------------------------------------------------------
    | Routing
    |--------------------------------------------------------------------------
    */
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    /*
    | Middleware
    |--------------------------------------------------------------------------
    */
    ->withMiddleware(function (Middleware $middleware) {

        // Middlewares WEB
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Alias de middlewares (Laravel 12)
        $middleware->alias([
            'rol' => \App\Http\Middleware\RolMiddleware::class,
            'automation' => \App\Http\Middleware\AutomationTokenMiddleware::class,
        ]);
    })

    /*
    |--------------------------------------------------------------------------
    | Exceptions
    |--------------------------------------------------------------------------
    */
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })

    ->create();
