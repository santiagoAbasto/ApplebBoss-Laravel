<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionTienda;
use App\Models\HomeSection;
use App\Models\StoreLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Ubicaciones: los locales de la tienda, con su dirección, horario, contacto y mapa.
 *
 * Es el único lugar de esos datos (antes se repetían en Configuración y la tienda mezclaba las dos fuentes). La
 * sección «Dónde estamos» del inicio muestra todos los locales encendidos, en el orden de la lista; el primero es el
 * principal: da la ciudad de la tienda, la dirección del pie de página y los datos que lee Google.
 */
class LocationController extends Controller
{
    public function index(): Response
    {
        $whatsapp = StoreLocation::whatsappDeLaTiendaActivo();
        $locales = StoreLocation::orderBy('sort_order')->orderBy('id')->get();
        $principal = $locales->firstWhere('active', true);

        return Inertia::render('Admin/Locations/Index', [
            'ubicaciones' => $locales->map(fn (StoreLocation $l) => $this->fila($l, $principal?->id, $whatsapp))->values(),
            'seccion'     => $this->seccionDelInicio(),
            'contacto'    => $this->contactoDeLaTienda($whatsapp),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Locations/Edit', [
            'ubicacion'      => null,
            'seraPrincipal'  => ! StoreLocation::active()->exists(),
            'contacto'       => $this->contactoDeLaTienda(StoreLocation::whatsappDeLaTiendaActivo()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validar($request, parcial: false);
        $validated['sort_order'] = (int) StoreLocation::max('sort_order') + 1;

        StoreLocation::create($validated);

        return redirect()->route('admin.locations.index')->with('success', 'Ubicación agregada.');
    }

    public function edit(StoreLocation $location): Response
    {
        $whatsapp = StoreLocation::whatsappDeLaTiendaActivo();

        return Inertia::render('Admin/Locations/Edit', [
            'ubicacion'     => $this->fila($location, StoreLocation::principal()?->id, $whatsapp),
            'seraPrincipal' => false,
            'contacto'      => $this->contactoDeLaTienda($whatsapp),
        ]);
    }

    public function update(Request $request, StoreLocation $location): RedirectResponse
    {
        $validated = $this->validar($request, parcial: true);
        $location->update($validated);

        $mensaje = array_key_exists('active', $validated) && count($validated) === 1
            ? ($validated['active'] ? 'La ubicación se ve en la tienda.' : 'La ubicación quedó oculta.')
            : 'Ubicación guardada.';

        return back()->with('success', $mensaje);
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'orden'         => 'required|array',
            'orden.*.id'    => 'required|integer|exists:store_locations,id',
            'orden.*.orden' => 'required|integer|min:0',
        ]);

        foreach ($validated['orden'] as $fila) {
            StoreLocation::where('id', $fila['id'])->update(['sort_order' => $fila['orden']]);
        }

        return back();
    }

    public function destroy(StoreLocation $location): RedirectResponse
    {
        $location->delete();

        return redirect()->route('admin.locations.index')->with('success', 'Se borró la ubicación.');
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private function fila(StoreLocation $l, ?int $principalId, bool $whatsapp): array
    {
        return [
            'id'            => $l->id,
            'name'          => $l->name,
            'address'       => $l->address,
            'city'          => $l->city,
            'country'       => $l->country,
            'phone'         => $l->phone,
            'whatsapp'      => $l->whatsapp,
            'hours'         => $l->hours,
            'horarios'      => $l->horariosAbiertos(),
            'map_embed_url' => $l->map_embed_url,
            'map_link_url'  => $l->map_link_url,
            'description'   => $l->description,
            'active'        => $l->active,
            'principal'     => $l->id === $principalId,
            // Lo mismo que recibe la tienda, para la vista previa
            'publico'       => $l->publico($whatsapp, conGoogle: false),
        ];
    }

    /** El WhatsApp general de la tienda, que usan los locales sin número propio. */
    private function contactoDeLaTienda(bool $whatsapp): array
    {
        return [
            'whatsapp_activo' => $whatsapp,
            'whatsapp_numero' => $whatsapp ? ConfiguracionTienda::waNumber() : null,
        ];
    }

    /** La sección del inicio donde salen los locales: está en Portada y ahí se enciende y se titula. */
    private function seccionDelInicio(): array
    {
        $seccion = HomeSection::where('type', 'location')->first();

        if ($seccion === null) {
            return ['estado' => 'no_existe', 'titulo' => null, 'subtitulo' => null, 'fecha' => null];
        }

        $ahora = Carbon::now();
        $estado = match (true) {
            ! $seccion->active => 'apagada',
            $seccion->publicar_desde !== null && $seccion->publicar_desde->gt($ahora) => 'programada',
            $seccion->publicar_hasta !== null && $seccion->publicar_hasta->lt($ahora) => 'vencida',
            default => 'encendida',
        };

        return [
            'estado'    => $estado,
            'titulo'    => ($seccion->settings['titulo'] ?? '') ?: null,
            'subtitulo' => ($seccion->settings['subtitle'] ?? '') ?: null,
            'fecha'     => $estado === 'programada' ? $seccion->publicar_desde->format('d/m/Y') : null,
        ];
    }

    /**
     * Valida y deja limpio lo que se guarda. `parcial` es para el interruptor y los cambios de un solo campo.
     * El mapa acepta el código completo de «Insertar un mapa» (se queda solo con la dirección del mapa).
     */
    private function validar(Request $request, bool $parcial): array
    {
        $embed = (string) $request->input('map_embed_url', '');
        if (preg_match('/src=["\']([^"\']+)["\']/i', $embed, $m)) {
            $request->merge(['map_embed_url' => html_entity_decode($m[1])]);
        }

        $a = fn (string $reglas) => ($parcial ? 'sometimes|' : '') . $reglas;

        $validated = $request->validate([
            'name'                     => $a('required|string|max:120'),
            'address'                  => $a('nullable|string|max:300'),
            'city'                     => $a('required|string|max:100'),
            'country'                  => $a('required|string|max:100'),
            'phone'                    => [...($parcial ? ['sometimes'] : []), 'nullable', 'string', 'max:50', 'regex:/^[\d\s+().\-]+$/'],
            'whatsapp'                 => $a('nullable|string|max:30'),
            'hours'                    => $a('nullable|string|max:200'),
            'horarios'                 => $a('nullable|array|size:7'),
            'horarios.*.dia'           => 'required_with:horarios|integer|between:1,7|distinct',
            'horarios.*.abierto'       => 'required_with:horarios|boolean',
            'horarios.*.tramos'        => 'nullable|array|max:2',
            'horarios.*.tramos.*.abre'   => 'nullable|string',
            'horarios.*.tramos.*.cierra' => 'nullable|string',
            'map_embed_url'            => [...($parcial ? ['sometimes'] : []), 'nullable', 'url', 'max:1000', 'regex:#^https://(www\.)?google\.[a-z.]+/maps/embed#i'],
            'map_link_url'             => [...($parcial ? ['sometimes'] : []), 'nullable', 'url', 'max:500', 'regex:#^https://#i'],
            'description'              => $a('nullable|string|max:1000'),
            'active'                   => $a('boolean'),
        ], [
            'name.required'        => 'Escribe el nombre del local.',
            'city.required'        => 'Escribe la ciudad: se usa en el título «Estamos en…».',
            'country.required'     => 'Escribe el país.',
            'phone.regex'          => 'El teléfono solo puede tener números, espacios, + y guiones.',
            'map_embed_url.url'    => 'Eso no es un mapa de Google. Copia el código de «Insertar un mapa».',
            'map_embed_url.regex'  => 'Eso no es un mapa de Google. Copia el código de «Insertar un mapa».',
            'map_link_url.url'     => 'Pega el enlace completo de Google Maps: empieza con https://',
            'map_link_url.regex'   => 'Pega el enlace completo de Google Maps: empieza con https://',
            'horarios.size'        => 'El horario tiene que traer los siete días.',
        ]);

        foreach (['name', 'address', 'city', 'country', 'phone', 'hours', 'description'] as $campo) {
            if (array_key_exists($campo, $validated)) {
                $validated[$campo] = trim(strip_tags((string) $validated[$campo])) ?: null;
            }
        }

        foreach (['name' => 'Escribe el nombre del local.', 'city' => 'Escribe la ciudad.', 'country' => 'Escribe el país.'] as $campo => $mensaje) {
            if (array_key_exists($campo, $validated) && $validated[$campo] === null) {
                throw ValidationException::withMessages([$campo => $mensaje]);
            }
        }

        if (array_key_exists('whatsapp', $validated)) {
            $validated['whatsapp'] = $this->whatsapp($validated['whatsapp']);
        }

        if (array_key_exists('horarios', $validated)) {
            $validated['horarios'] = $this->horarios($validated['horarios']);
        }

        return $validated;
    }

    /** Solo los números, con el código de país: así funciona el enlace de WhatsApp. */
    private function whatsapp(?string $numero): ?string
    {
        $digitos = preg_replace('/\D/', '', (string) $numero);

        if ($digitos === '') {
            return null;
        }

        if (strlen($digitos) < 10 || strlen($digitos) > 15) {
            throw ValidationException::withMessages([
                'whatsapp' => 'Escribe el WhatsApp con el código de país, sin + ni espacios. Por ejemplo: 59170000000.',
            ]);
        }

        return $digitos;
    }

    /**
     * El horario día por día. Cada día abierto necesita al menos un tramo, con la hora de cierre después de la de
     * apertura, y el segundo tramo (la tarde) empieza después de que termina el primero. Sin ningún día abierto se
     * guarda vacío: el local no tiene horario cargado.
     */
    private function horarios(?array $horarios): ?array
    {
        if ($horarios === null) {
            return null;
        }

        $errores = [];
        $limpio = [];

        foreach ($horarios as $i => $dia) {
            $numero = (int) $dia['dia'];
            $nombre = mb_strtolower(StoreLocation::DIAS[$numero]);
            $abierto = filter_var($dia['abierto'], FILTER_VALIDATE_BOOLEAN);
            $tramos = [];

            if ($abierto) {
                foreach (array_values($dia['tramos'] ?? []) as $t) {
                    $abre = $this->hora($t['abre'] ?? null);
                    $cierra = $this->hora($t['cierra'] ?? null);

                    if ($abre === null || $cierra === null) {
                        $errores["horarios.{$i}"] = "Completa las horas del {$nombre}.";
                        continue 2;
                    }

                    if ($cierra <= $abre) {
                        $errores["horarios.{$i}"] = "El {$nombre}, la hora de cierre tiene que ser después de la de apertura.";
                        continue 2;
                    }

                    if ($tramos !== [] && $abre < end($tramos)['cierra']) {
                        $errores["horarios.{$i}"] = "El {$nombre}, la tarde tiene que empezar después de que termina la mañana.";
                        continue 2;
                    }

                    $tramos[] = ['abre' => $abre, 'cierra' => $cierra];
                }

                if ($tramos === []) {
                    $errores["horarios.{$i}"] = "Completa las horas del {$nombre} o márcalo como cerrado.";
                }
            }

            $limpio[$numero] = ['dia' => $numero, 'abierto' => $abierto && $tramos !== [], 'tramos' => $tramos];
        }

        if ($errores !== []) {
            throw ValidationException::withMessages($errores);
        }

        ksort($limpio);

        return collect($limpio)->contains('abierto', true) ? array_values($limpio) : null;
    }

    /** «9:00» o «09:00» → «09:00». Cualquier otra cosa no es una hora. */
    private function hora(mixed $valor): ?string
    {
        if (! is_string($valor) || ! preg_match('/^([01]?\d|2[0-3]):([0-5]\d)$/', trim($valor), $m)) {
            return null;
        }

        return str_pad($m[1], 2, '0', STR_PAD_LEFT) . ':' . $m[2];
    }
}
