<?php

namespace App\Http\Controllers;

use App\Models\Carrito;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * El enlace del correo de carrito abandonado. Se abre sin sesión (como el seguimiento): el token es el control.
 * No pasa `seo`, así que la página sale con noindex.
 */
class CarritoController extends Controller
{
    public function recuperar(string $token): Response
    {
        $carrito = Carrito::with('user')->where('token', $token)->firstOrFail();
        $disponibles = $carrito->disponibles();
        $guardados = collect($carrito->items);
        $agotados = $guardados->pluck('key')->diff($disponibles->pluck('key'))
            ->map(fn ($key) => $guardados->firstWhere('key', $key)['nombre'] ?? null)->filter()->values();

        return Inertia::render('Store/CarritoRecuperado', [
            'nombre'     => $this->nombre($carrito),
            'items'      => $disponibles,
            'agotados'   => $agotados,
            'total'      => $disponibles->sum('precio'),
            'recuperado' => $carrito->recuperado_en !== null,
            'baja'       => false,
        ]);
    }

    public function sinRecordatorios(string $token): Response
    {
        $carrito = Carrito::with('user')->where('token', $token)->firstOrFail();
        $carrito->user->forceFill(['sin_recordatorios' => true])->save();

        return Inertia::render('Store/CarritoRecuperado', [
            'nombre'     => $this->nombre($carrito),
            'items'      => [],
            'agotados'   => [],
            'total'      => 0,
            'recuperado' => false,
            'baja'       => true,
        ]);
    }

    private function nombre(Carrito $carrito): string
    {
        return (string) Str::of((string) $carrito->user?->name)->before(' ')->title();
    }
}
