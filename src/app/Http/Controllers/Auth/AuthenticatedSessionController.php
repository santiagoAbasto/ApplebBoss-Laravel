<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * La puerta de quien compra.
     *
     * Son dos puertas distintas a propósito: el panel es para el equipo y su pantalla habla
     * de gestión; esta vive dentro de la tienda, con su carrito y su menú. La comprobación
     * de credenciales es la misma para las dos (mismo `store`), así que el control de horario
     * del vendedor se aplica igual si alguien del equipo entra por acá.
     */
    public function tienda(): Response
    {
        return Inertia::render('Store/Cuenta/Entrar', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): SymfonyResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Quien compra va a su cuenta, no al panel. Y no pasa por /dashboard a propósito:
        // esa ruta exige el correo verificado, y a un cliente recién registrado eso lo
        // dejaría trabado en vez de dejarlo comprar.
        $destino = $request->user()->esCliente()
            ? route('cuenta.index')
            : route('dashboard');

        /*
         * Recarga completa, no una visita de Inertia.
         *
         * La lista de rutas de Ziggy se imprime en el HTML una sola vez, y al invitado se
         * le da una recortada (sin admin.* ni vendedor.*). Si después de entrar Inertia
         * solo cambiara el componente, esa lista quedaría congelada en la de invitado y el
         * panel reventaría con «route 'admin.ventas.create' is not in the route list».
         *
         * Cambió quién sos: se reconstruye la aplicación.
         */
        return Inertia::location(redirect()->intended($destino)->getTargetUrl());
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): SymfonyResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        // Igual que al entrar: cambió la identidad, se reconstruye todo
        return Inertia::location('/');
    }
}
