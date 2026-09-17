<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionTienda;
use App\Models\StoreLocation;
use App\Models\StoreService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Configuración: los datos generales de la tienda.
 *
 * Solo lo que la tienda lee de verdad y que no es de otro módulo: el WhatsApp con el que le escribe el cliente y la
 * identidad de la tienda (nombre, descripción corta y la frase del pie). Antes se editaban acá el hero del inicio, una
 * barra de anuncio que la tienda nunca dibujó y el SEO del inicio, que ya vive en «Google y redes sociales».
 */
class ConfiguracionTiendaController extends Controller
{
    private const LARGOS = [
        'whatsapp_mensaje'   => 300,
        'tienda_nombre'      => 60,
        'tienda_descripcion' => 200,
        'footer_tagline'     => 160,
        'anuncio_barra'      => 90,
    ];

    public function edit(): Response
    {
        return Inertia::render('Admin/Configuracion/Tienda', [
            'configuracion' => $this->valores(),
            'largos'        => self::LARGOS,
            'contexto'      => $this->contexto(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'whatsapp_enabled'   => ['required', 'boolean'],
            // Solo dígitos, con código de país y sin el «+»: así lo arma wa.me. Bolivia: 591 + 8 dígitos.
            'whatsapp_numero'    => ['nullable', 'string', 'regex:/^[0-9]{8,15}$/', Rule::requiredIf(fn () => $request->boolean('whatsapp_enabled'))],
            'whatsapp_mensaje'   => ['nullable', 'string', 'max:' . self::LARGOS['whatsapp_mensaje']],
            'tienda_nombre'      => ['required', 'string', 'max:' . self::LARGOS['tienda_nombre']],
            'tienda_descripcion' => ['nullable', 'string', 'max:' . self::LARGOS['tienda_descripcion']],
            'footer_tagline'     => ['nullable', 'string', 'max:' . self::LARGOS['footer_tagline']],
            'anuncio_barra'      => ['nullable', 'string', 'max:' . self::LARGOS['anuncio_barra']],
        ], [
            'whatsapp_numero.required' => 'Escribe el número de WhatsApp o apaga el botón: encendido y sin número, la tienda no puede abrir la conversación.',
            'whatsapp_numero.regex'    => 'El número va con el código de país y solo con números, sin «+», espacios ni guiones. Por ejemplo: 59175904313.',
            'tienda_nombre.required'   => 'La tienda necesita un nombre: es el que el cliente ve en el pie de página y el que lee Google.',
            'tienda_nombre.max'        => 'El nombre de la tienda no puede pasar de :max caracteres.',
            'whatsapp_mensaje.max'     => 'El mensaje no puede pasar de :max caracteres.',
            'tienda_descripcion.max'   => 'La descripción no puede pasar de :max caracteres.',
            'footer_tagline.max'       => 'La frase del pie no puede pasar de :max caracteres.',
            'anuncio_barra.max'        => 'La barra de anuncio no puede pasar de :max caracteres: más largo no entra en el celular.',
        ]);

        ConfiguracionTienda::set('whatsapp_enabled', $data['whatsapp_enabled'] ? '1' : '0');
        ConfiguracionTienda::set('whatsapp_numero', $data['whatsapp_numero'] ?: null);

        foreach (['whatsapp_mensaje', 'tienda_nombre', 'tienda_descripcion', 'footer_tagline', 'anuncio_barra'] as $clave) {
            ConfiguracionTienda::set($clave, $this->limpiar($data[$clave] ?? null));
        }

        ConfiguracionTienda::clearAllCache();

        return back()->with('success', 'Configuración guardada.');
    }

    /** Los valores de hoy, con el nombre siempre lleno. */
    private function valores(): array
    {
        $valores = [];
        foreach (ConfiguracionTienda::CLAVES as $clave => $porDefecto) {
            $valores[$clave] = ConfiguracionTienda::get($clave) ?? $porDefecto;
        }

        $valores['whatsapp_enabled'] = ConfiguracionTienda::waEnabled();
        $valores['tienda_nombre']    = ConfiguracionTienda::nombre();

        return $valores;
    }

    /**
     * Dónde se usa cada dato hoy, con la misma cuenta que hace la tienda: para que el panel no prometa de más.
     * Los datos del local (dirección, horario, mapa) no están acá: son de Ubicaciones.
     */
    private function contexto(): array
    {
        $principal = StoreLocation::principal();

        return [
            'servicios_con_whatsapp' => StoreService::where('active', true)->where('accion', 'whatsapp')->count(),
            'locales_con_whatsapp'   => StoreLocation::where('active', true)->whereNotNull('whatsapp')->count(),
            'locales_encendidos'     => StoreLocation::where('active', true)->count(),
            'local_principal'        => $principal?->name,
            'ciudad'                 => $principal?->city,
            'pais'                   => $principal?->country,
        ];
    }

    private function limpiar(?string $valor): ?string
    {
        $v = trim(strip_tags((string) $valor));

        return $v === '' ? null : $v;
    }
}
