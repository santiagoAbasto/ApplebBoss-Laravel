<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionTienda;
use App\Support\Temporada;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Campaña de Navidad: enciende, programa, previsualiza y apaga la apariencia navideña.
 *
 * La decisión de si la campaña se ve la toma `App\Support\Temporada`; acá solo se guardan y validan sus ajustes.
 * No se acepta HTML ni un enlace externo: el texto se limpia y el enlace tiene que ser una dirección de la tienda.
 */
class CampanaNavidadController extends Controller
{
    private const LARGO_TEXTO = 90;

    public function edit(Request $request): Response
    {
        $ajustes = Temporada::ajustes();

        return Inertia::render('Admin/Configuracion/Navidad', [
            'ajustes'      => $ajustes,
            'activa'       => Temporada::activa($ajustes),
            'vistaPrevia'  => $request->session()->has(Temporada::SESION_VISTA_PREVIA),
            'zona'         => Temporada::ZONA,
            'ahora'        => now(Temporada::ZONA)->format(Temporada::FORMATO),
            'largoTexto'   => self::LARGO_TEXTO,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $ajustes = $this->validar($request);
        $antes = Temporada::ajustes()['navidad_modo'];

        foreach ($ajustes as $clave => $valor) {
            ConfiguracionTienda::set($clave, is_bool($valor) ? ($valor ? '1' : '0') : $valor);
        }
        ConfiguracionTienda::clearAllCache();
        $request->session()->forget(Temporada::SESION_VISTA_PREVIA);

        Log::info('Campaña de Navidad: ajustes guardados', [
            'usuario' => $request->user()?->id, 'antes' => $antes, 'modo' => $ajustes['navidad_modo'],
            'inicio' => $ajustes['navidad_inicio'], 'fin' => $ajustes['navidad_fin'],
        ]);

        return back()->with('success', 'Campaña de Navidad guardada.');
    }

    /** Guarda los ajustes sin publicar en la sesión de quien los edita: solo esa persona ve la tienda vestida. */
    public function vistaPrevia(Request $request): RedirectResponse
    {
        $request->session()->put(Temporada::SESION_VISTA_PREVIA, $this->validar($request, previa: true));

        return back()->with('success', 'Vista previa encendida: solo tú ves la tienda con estos ajustes.');
    }

    public function salirDeVistaPrevia(Request $request): RedirectResponse
    {
        $request->session()->forget(Temporada::SESION_VISTA_PREVIA);

        return back()->with('success', 'Vista previa apagada.');
    }

    /** El botón de apagado: retira la campaña de toda la web sin perder el resto de los ajustes. */
    public function apagar(Request $request): RedirectResponse
    {
        ConfiguracionTienda::set('navidad_modo', 'apagado');
        ConfiguracionTienda::clearAllCache();
        $request->session()->forget(Temporada::SESION_VISTA_PREVIA);

        Log::info('Campaña de Navidad: apagada', ['usuario' => $request->user()?->id]);

        return back()->with('success', 'Campaña de Navidad apagada. La tienda y el panel volvieron a su aspecto de siempre.');
    }

    private function validar(Request $request, bool $previa = false): array
    {
        $programado = $request->input('navidad_modo') === 'programado';
        $fecha = ['nullable', 'date_format:' . Temporada::FORMATO, Rule::requiredIf($programado && ! $previa)];

        $data = $request->validate([
            'navidad_modo'               => ['required', Rule::in(Temporada::MODOS)],
            'navidad_publico'            => ['required', 'boolean'],
            'navidad_admin'              => ['required', 'boolean'],
            'navidad_inicio'             => $fecha,
            'navidad_fin'                => [...$fecha, function (string $atributo, mixed $valor, \Closure $falla) use ($request) {
                $inicio = Temporada::instante($request->input('navidad_inicio'));
                $fin = Temporada::instante($valor);
                if ($inicio && $fin && $fin->lessThanOrEqualTo($inicio)) {
                    $falla('El fin tiene que ser posterior al inicio.');
                }
            }],
            'navidad_intensidad_publico' => ['required', Rule::in(Temporada::INTENSIDADES)],
            'navidad_intensidad_admin'   => ['required', Rule::in(Temporada::INTENSIDADES)],
            'navidad_personajes'         => ['required', 'boolean'],
            'navidad_luces'              => ['required', 'boolean'],
            'navidad_animaciones'        => ['required', 'boolean'],
            'navidad_nieve'              => ['required', 'boolean'],
            'navidad_musica'             => ['required', 'boolean'],
            'navidad_tapas'              => ['required', 'boolean'],
            'navidad_documentos'         => ['required', 'boolean'],
            'navidad_texto'              => ['nullable', 'string', 'max:' . self::LARGO_TEXTO],
            'navidad_enlace'             => ['nullable', 'string', 'max:200', function (string $atributo, mixed $valor, \Closure $falla) {
                if (! Temporada::esEnlaceInterno($valor)) {
                    $falla('El enlace tiene que ser una dirección de la tienda, por ejemplo /catalogo o /iphone.');
                }
            }],
        ], [
            'navidad_inicio.required'    => 'Para programar la campaña hace falta la fecha y hora de inicio.',
            'navidad_fin.required'       => 'Para programar la campaña hace falta la fecha y hora de fin.',
            'navidad_inicio.date_format' => 'La fecha de inicio no se pudo leer.',
            'navidad_fin.date_format'    => 'La fecha de fin no se pudo leer.',
            'navidad_texto.max'          => 'El texto de campaña no puede pasar de :max caracteres.',
        ]);

        foreach (['navidad_publico', 'navidad_admin', 'navidad_personajes', 'navidad_luces', 'navidad_animaciones', 'navidad_nieve', 'navidad_musica', 'navidad_tapas', 'navidad_documentos'] as $clave) {
            $data[$clave] = (bool) $data[$clave];
        }
        $texto = trim(strip_tags((string) ($data['navidad_texto'] ?? '')));
        $data['navidad_texto'] = $texto === '' ? null : $texto;
        $data['navidad_enlace'] = ($data['navidad_enlace'] ?? '') === '' ? null : $data['navidad_enlace'];
        $data['navidad_inicio'] = $data['navidad_inicio'] ?? null;
        $data['navidad_fin'] = $data['navidad_fin'] ?? null;

        return $data;
    }
}
