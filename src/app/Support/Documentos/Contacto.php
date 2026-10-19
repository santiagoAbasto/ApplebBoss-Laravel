<?php

namespace App\Support\Documentos;

use App\Models\Cliente;
use App\Models\NewsletterSubscriber;
use Illuminate\Support\Str;

/**
 * Cuando un cliente deja su correo en una venta, un servicio, una reserva o un diagnóstico, ese dato queda en dos
 * lugares más: en su ficha de Clientes (sin tocar nada de lo demás) y en el newsletter. A quien pidió la baja del
 * newsletter no se lo vuelve a suscribir: la baja es suya.
 */
final class Contacto
{
    public static function recordar(?string $nombre, ?string $telefono, ?string $correo, ?int $userId = null): void
    {
        $correo = Str::lower(trim((string) $correo));
        if ($correo === '') {
            return;
        }

        $cliente = null;
        if (filled($telefono)) {
            $cliente = Cliente::where('telefono', $telefono)->first();
        }
        if (! $cliente && filled($nombre)) {
            $cliente = Cliente::whereRaw('LOWER(nombre) = ?', [Str::lower(trim($nombre))])
                ->when($userId, fn ($q) => $q->orderByRaw('CASE WHEN user_id = ? THEN 0 ELSE 1 END', [$userId]))
                ->first();
        }

        if ($cliente) {
            if ($cliente->correo !== $correo) {
                $cliente->update(['correo' => $correo]); // solo el correo: nombre, teléfono y documento quedan como están
            }

            return;
        }

        if (filled($nombre)) {
            Cliente::create([
                'user_id'  => $userId,
                'nombre'   => Str::title(trim($nombre)),
                'telefono' => $telefono ?: null,
                'correo'   => $correo,
            ]);
        }
    }

    public static function suscribir(?string $correo, ?string $nombre, string $origen): void
    {
        $correo = Str::lower(trim((string) $correo));
        if ($correo === '' || ! filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $suscriptor = NewsletterSubscriber::firstOrCreate(['email' => $correo], [
            'nombre' => filled($nombre) ? Str::title(trim($nombre)) : null,
            'source' => $origen,
        ]);

        if (! $suscriptor->wasRecentlyCreated && blank($suscriptor->nombre) && filled($nombre)) {
            $suscriptor->update(['nombre' => Str::title(trim($nombre))]);
        }
    }
}
