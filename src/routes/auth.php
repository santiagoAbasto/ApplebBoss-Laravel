<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ⚠️  REGISTRO RESTRINGIDO A ADMINISTRADORES
|--------------------------------------------------------------------------
| El registro público está DESHABILITADO.
| Solo un admin autenticado puede crear nuevas cuentas
| accediendo a /admin/register directamente desde el panel.
|
| Si necesitás habilitar el registro público temporalmente,
| mové las rutas de 'register' al grupo 'guest' de abajo.
|--------------------------------------------------------------------------
*/

// ── Registro de usuario (solo admin autenticado) ────────────────────────
Route::middleware(['auth', 'rol:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('register', [RegisteredUserController::class, 'create'])
            ->name('register');

        Route::post('register', [RegisteredUserController::class, 'store'])
            ->middleware('throttle:5,1');
    });

// ── Rutas de invitados (no autenticados) ────────────────────────────────
Route::middleware('guest')->group(function () {

    // La puerta del equipo no se anuncia en ninguna parte: no hay enlaces, no está en robots.txt ni en la lista de
    // rutas que recibe un visitante, y quien no inició sesión recibe 404 en el panel. Se entra escribiendo la dirección.
    // `/login` ya no existe. La de quien compra es /ingresar (y el modal «Acceder» de la tienda).
    foreach (['admin' => 'login', 'vendedor' => 'vendedor.login'] as $prefijo => $nombre) {
        Route::get("{$prefijo}/login", [AuthenticatedSessionController::class, 'create'])->name($nombre);
        Route::post("{$prefijo}/login", [AuthenticatedSessionController::class, 'store'])
            ->name("{$nombre}.enviar")
            ->middleware('throttle:10,1');
    }

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email')
        ->middleware('throttle:5,1');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store')
        ->middleware('throttle:5,1');
});

// ── Rutas para usuarios autenticados ────────────────────────────────────
Route::middleware('auth')->group(function () {

    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store'])
        ->middleware('throttle:5,1');

    Route::put('password', [PasswordController::class, 'update'])
        ->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
