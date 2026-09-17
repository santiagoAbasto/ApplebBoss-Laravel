<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\DispatchNewsletterCampaign;
use App\Models\ConfiguracionTienda;
use App\Support\NewsletterEstado;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Marketing y Google → Ajustes del newsletter: los textos del formulario de la tienda, el remitente de las campañas
 * y la velocidad de envío.
 *
 * La cuenta y la clave del servidor de correo **no se editan acá**: viven en el `.env` del servidor, porque son una
 * credencial. Lo que sí hace esta pantalla es decir si están cargadas y dejar mandar un correo de prueba para
 * confirmarlo, que es lo único que queda por hacer al pasar la tienda a producción.
 */
class NewsletterSettingsController extends Controller
{
    private const KEYS = [
        'newsletter_enabled', 'newsletter_titulo', 'newsletter_subtitulo', 'newsletter_boton',
        'newsletter_remitente_nombre', 'newsletter_responder_a', 'newsletter_pie', 'newsletter_lote_por_minuto',
    ];

    public function edit(): Response
    {
        $values = collect(self::KEYS)->mapWithKeys(fn ($k) => [$k => ConfiguracionTienda::get($k, '')])->all();

        return Inertia::render('Admin/Newsletter/Settings', [
            'settings'     => $values,
            'estado'       => NewsletterEstado::resumen(),
            'maxPorMinuto' => DispatchNewsletterCampaign::MAX_POR_MINUTO,
            'tienda'       => ConfiguracionTienda::nombre(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'newsletter_enabled'          => 'required|boolean',
            'newsletter_titulo'           => 'required|string|max:120',
            'newsletter_subtitulo'        => 'nullable|string|max:200',
            'newsletter_boton'            => 'required|string|max:40',
            'newsletter_remitente_nombre' => 'required|string|max:80',
            'newsletter_responder_a'      => 'nullable|email:rfc|max:191',
            'newsletter_pie'              => 'nullable|string|max:300',
            'newsletter_lote_por_minuto'  => 'required|integer|min:1|max:' . DispatchNewsletterCampaign::MAX_POR_MINUTO,
        ], [
            'newsletter_titulo.required'           => 'El formulario necesita un título: es lo que invita a dejar el correo.',
            'newsletter_boton.required'            => 'El botón necesita un texto.',
            'newsletter_remitente_nombre.required' => 'Escribe con qué nombre llegan los correos a la bandeja del cliente.',
            'newsletter_responder_a.email'         => 'Escribe un correo válido, o déjalo vacío.',
            'newsletter_lote_por_minuto.max'       => 'Más de :max correos por minuto hace que el proveedor corte el envío.',
        ]);

        foreach ($data as $key => $value) {
            $value = is_bool($value) ? ($value ? '1' : '0') : trim(strip_tags((string) ($value ?? '')));
            ConfiguracionTienda::updateOrCreate(
                ['clave' => $key],
                ['valor' => $value, 'grupo' => 'newsletter', 'tipo' => 'texto']
            );
        }
        ConfiguracionTienda::clearAllCache();

        return back()->with('success', 'Ajustes del newsletter guardados.');
    }

    /**
     * Manda un correo de prueba con la configuración del servidor. Es la forma de confirmar, en producción, que la
     * clave del correo quedó bien cargada, sin tener que escribir una campaña.
     */
    public function test(Request $request): RedirectResponse
    {
        $data = $request->validate(
            ['email' => 'required|email:rfc|max:191'],
            ['email.required' => 'Escribe a qué correo mandamos la prueba.', 'email.email' => 'Escribe un correo válido.']
        );

        $correo = NewsletterEstado::correo();
        if (! $correo['listo']) {
            return back()->withErrors(['email' => $correo['falta']]);
        }

        try {
            $nombre = ConfiguracionTienda::get('newsletter_remitente_nombre') ?: ConfiguracionTienda::nombre();

            Mail::raw(
                "Este es un correo de prueba de {$nombre}.\n\n"
                . "Si te llegó, el servidor de correo está bien configurado y las campañas del newsletter van a salir.\n\n"
                . 'Enviado el ' . now()->format('d/m/Y \a \l\a\s H:i') . '.',
                fn ($m) => $m->to($data['email'])->subject("Prueba de correo de {$nombre}")
            );
        } catch (\Throwable $e) {
            report($e);

            return back()->withErrors(['email' => 'No salió: ' . NewsletterEstado::explicarFallo($e)]);
        }

        return back()->with('success', 'Correo de prueba enviado a ' . $data['email'] . '. Si no llega en un minuto, revisa la carpeta de spam.');
    }
}
