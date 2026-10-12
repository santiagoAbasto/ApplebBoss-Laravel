<?php

namespace App\Observers;

use App\Mail\Bienvenida;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/** Un cliente nuevo recibe la bienvenida, venga del formulario, de Google o del panel. El equipo no. */
class UserObserver
{
    public function created(User $user): void
    {
        if ($user->rol !== 'cliente' || blank($user->email)) {
            return;
        }

        try {
            Mail::send(new Bienvenida($user));
        } catch (\Throwable $e) {
            // Que no se caiga un registro porque el correo falló: queda anotado y se sigue.
            Log::warning('No se pudo encolar la bienvenida de ' . $user->id . ': ' . $e->getMessage());
        }
    }
}
