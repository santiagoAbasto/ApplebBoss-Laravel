<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NewsletterController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // Honeypot: los bots completan el campo oculto. Respuesta idéntica, sin guardar.
        if (filled($request->input('website'))) {
            return response()->json(['ok' => true]);
        }

        $data  = $request->validate(['email' => 'required|email:rfc|max:191']);
        $email = Str::lower(trim($data['email']));

        $subscriber = NewsletterSubscriber::firstOrCreate(['email' => $email], ['source' => 'footer']);
        if ($subscriber->unsubscribed_at) {
            $subscriber->update(['unsubscribed_at' => null]);
        }

        // Misma respuesta exista o no el correo: no revela quién está suscrito.
        return response()->json(['ok' => true]);
    }

    /** Página de baja (link del correo). Pide confirmar para que los escáneres de links no den de baja a nadie. */
    public function unsubscribeShow(string $token): Response
    {
        $sub = $this->findByToken($token);

        return Inertia::render('Store/NewsletterBaja', [
            'token'  => $sub ? $token : null,
            'estado' => ! $sub ? 'invalido' : ($sub->unsubscribed_at ? 'baja' : 'activo'),
            'email'  => $sub ? $this->mask($sub->email) : null,
        ]);
    }

    /** Confirma la baja. También atiende el "baja en un clic" (List-Unsubscribe-Post) de Gmail/Outlook. */
    public function unsubscribe(Request $request, string $token)
    {
        $sub = $this->findByToken($token);
        if ($sub && ! $sub->unsubscribed_at) {
            $sub->update(['unsubscribed_at' => now()]);
        }

        if ($request->input('List-Unsubscribe') === 'One-Click' || $request->expectsJson()) {
            return response()->json(['ok' => true]);
        }

        return redirect()->route('newsletter.baja', $token);
    }

    private function findByToken(string $token): ?NewsletterSubscriber
    {
        return strlen($token) === 48 ? NewsletterSubscriber::where('token', $token)->first() : null;
    }

    private function mask(string $email): string
    {
        [$user, $domain] = array_pad(explode('@', $email, 2), 2, '');
        return Str::substr($user, 0, 1) . str_repeat('•', max(2, Str::length($user) - 1)) . '@' . $domain;
    }
}
