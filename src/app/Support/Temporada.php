<?php

namespace App\Support;

use App\Models\ConfiguracionTienda;
use App\Models\Role;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;

/**
 * La campaña de Navidad: una capa de temporada que se enciende y se apaga sin tocar plantillas.
 *
 * Este es el único lugar que decide si la campaña está activa y en qué superficie (tienda o panel). El resultado
 * viaja a la página como la prop `temporada` y como `data-season="christmas"` en `<html>`; apagada, vale null, el
 * atributo no se escribe y ningún estilo ni adorno de `resources/css/navidad.css` llega a aplicarse.
 *
 * El modo programado compara el reloj del servidor contra un intervalo [inicio, fin) escrito en hora de Bolivia:
 * no depende de un cron ni de la hora del navegador.
 */
class Temporada
{
    public const ZONA = 'America/La_Paz';
    public const FORMATO = 'Y-m-d\TH:i';
    public const SESION_VISTA_PREVIA = 'navidad_vista_previa';

    public const MODOS = ['apagado', 'manual', 'programado'];
    public const INTENSIDADES = ['festiva', 'discreta'];

    /** Lo que se edita en Tienda online → Campaña de Navidad, con su valor inicial. */
    public const CLAVES = [
        'navidad_modo'                => 'apagado',
        'navidad_publico'             => '1',
        'navidad_admin'               => '1',
        'navidad_inicio'              => null,
        'navidad_fin'                 => null,
        'navidad_intensidad_publico'  => 'festiva',
        'navidad_intensidad_admin'    => 'discreta',
        'navidad_personajes'          => '1',
        'navidad_luces'               => '1',
        'navidad_animaciones'         => '1',
        'navidad_nieve'               => '0',
        'navidad_musica'              => '1',
        'navidad_tapas'               => '1',
        'navidad_documentos'          => '1',
        'navidad_texto'               => null,
        'navidad_enlace'              => null,
    ];

    private const INTERRUPTORES = ['navidad_publico', 'navidad_admin', 'navidad_personajes', 'navidad_luces', 'navidad_animaciones', 'navidad_nieve', 'navidad_musica', 'navidad_tapas', 'navidad_documentos'];

    /** Los ajustes guardados, con sus tipos ya resueltos (los interruptores como booleanos). */
    public static function ajustes(): array
    {
        $ajustes = [];
        foreach (self::CLAVES as $clave => $porDefecto) {
            $ajustes[$clave] = ConfiguracionTienda::get($clave) ?? $porDefecto;
        }

        return self::normalizar($ajustes);
    }

    /** Deja cualquier juego de ajustes (guardado o de vista previa) con valores válidos y tipos fijos. */
    public static function normalizar(array $ajustes): array
    {
        $a = array_merge(self::CLAVES, array_intersect_key($ajustes, self::CLAVES));

        foreach (self::INTERRUPTORES as $clave) {
            $a[$clave] = in_array($a[$clave], [true, 1, '1', 'true'], true);
        }
        if (! in_array($a['navidad_modo'], self::MODOS, true)) {
            $a['navidad_modo'] = 'apagado';
        }
        foreach (['navidad_intensidad_publico' => 'festiva', 'navidad_intensidad_admin' => 'discreta'] as $clave => $porDefecto) {
            if (! in_array($a[$clave], self::INTENSIDADES, true)) {
                $a[$clave] = $porDefecto;
            }
        }

        return $a;
    }

    /** ¿Está encendida la campaña en este instante? El fin es exclusivo: a esa hora exacta ya no se ve. */
    public static function activa(array $ajustes, ?CarbonInterface $ahora = null): bool
    {
        return match ($ajustes['navidad_modo'] ?? 'apagado') {
            'manual'     => true,
            'programado' => self::dentroDelIntervalo($ajustes['navidad_inicio'] ?? null, $ajustes['navidad_fin'] ?? null, $ahora),
            default      => false,
        };
    }

    /** Convierte «2026-12-01T00:00» (hora de Bolivia) en un instante preciso. Null si no se puede leer. */
    public static function instante(?string $local): ?CarbonImmutable
    {
        if (! is_string($local) || trim($local) === '') {
            return null;
        }

        try {
            return CarbonImmutable::createFromFormat('!' . self::FORMATO, $local, self::ZONA) ?: null;
        } catch (\Throwable) {
            return null;
        }
    }

    private static function dentroDelIntervalo(?string $inicio, ?string $fin, ?CarbonInterface $ahora): bool
    {
        $desde = self::instante($inicio);
        $hasta = self::instante($fin);
        if (! $desde || ! $hasta || $hasta->lessThanOrEqualTo($desde)) {
            return false; // un intervalo incompleto o al revés nunca enciende la campaña
        }

        $ahora = CarbonImmutable::instance($ahora ?? now());

        return $ahora->greaterThanOrEqualTo($desde) && $ahora->lessThan($hasta);
    }

    /**
     * La campaña para las páginas de error estáticas (errores/*.blade.php), que no pasan por Inertia ni por la
     * prop `temporada`. Si la base o la caché no responden, devuelve null: el error se ve con el aspecto de siempre.
     */
    public static function paraErrores(): ?array
    {
        try {
            $ajustes = self::ajustes();

            return self::activa($ajustes) && $ajustes['navidad_publico']
                ? ['intensidad' => $ajustes['navidad_intensidad_publico'], 'luces' => $ajustes['navidad_luces'], 'animaciones' => $ajustes['navidad_animaciones']]
                : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * ¿Los correos, los PDF y las páginas de documentos se visten de Navidad? Solo con la campaña activa y su
     * interruptor encendido. Se consulta en el momento de armar cada documento (los correos en cola, al enviarse;
     * los PDF, al pedirse): apagar la campaña en el panel los devuelve a su aspecto de siempre desde ese instante.
     * Ante cualquier falla devuelve false: un documento nunca deja de salir por culpa del adorno.
     */
    public static function enDocumentos(): bool
    {
        try {
            $ajustes = self::ajustes();

            return self::activa($ajustes) && $ajustes['navidad_documentos'];
        } catch (\Throwable) {
            return false;
        }
    }

    /** El panel (administrador y vendedor) usa su propia intensidad; todo lo demás es la tienda. */
    public static function superficie(Request $request): string
    {
        $nombre = (string) $request->route()?->getName();

        return str_starts_with($nombre, 'admin.') || str_starts_with($nombre, 'vendedor.')
            || $request->is('admin', 'admin/*', 'vendedor', 'vendedor/*')
            ? 'admin'
            : 'publico';
    }

    /**
     * Lo que la página necesita para vestirse de Navidad, o null si en esta superficie no corresponde.
     *
     * La vista previa vive en la sesión de quien la pidió y solo se respeta si esa persona administra la tienda:
     * no hay parámetro de URL que la active y nunca llega a otro visitante.
     */
    public static function paraLaVista(Request $request): ?array
    {
        try {
            $previa = self::vistaPrevia($request);
            $ajustes = $previa ?? self::ajustes();

            if ($previa === null && ! self::activa($ajustes)) {
                return null;
            }

            $superficie = self::superficie($request);
            if (! $ajustes[$superficie === 'admin' ? 'navidad_admin' : 'navidad_publico']) {
                return null;
            }

            $publico = $superficie === 'publico';

            return [
                'nombre'      => 'christmas',
                'superficie'  => $superficie,
                'intensidad'  => $ajustes[$publico ? 'navidad_intensidad_publico' : 'navidad_intensidad_admin'],
                'personajes'  => $ajustes['navidad_personajes'],
                'luces'       => $ajustes['navidad_luces'],
                'animaciones' => $ajustes['navidad_animaciones'],
                // La nieve nunca cae sobre el panel: es una pantalla de trabajo
                'nieve'       => $publico && $ajustes['navidad_nieve'],
                // La música suena solo en la tienda y cada visitante puede apagarla (se recuerda en su navegador)
                'musica'      => $publico && $ajustes['navidad_musica'],
                // Tapas de regalo sobre las fotos del catálogo: se destapan con el primer clic y quedan abiertas esa visita
                'tapas'       => $publico && $ajustes['navidad_tapas'],
                'texto'       => $publico ? ($ajustes['navidad_texto'] ?: null) : null,
                'enlace'      => $publico ? ($ajustes['navidad_enlace'] ?: null) : null,
                'vistaPrevia' => $previa !== null,
            ];
        } catch (\Throwable) {
            return null; // sin tabla o sin caché, la tienda se ve como siempre
        }
    }

    private static function vistaPrevia(Request $request): ?array
    {
        if (! $request->hasSession() || ! $request->session()->has(self::SESION_VISTA_PREVIA)) {
            return null;
        }

        $user = $request->user();
        if (! $user || ! Role::permite($user->rol, 'tienda')) {
            return null;
        }

        $previa = $request->session()->get(self::SESION_VISTA_PREVIA);

        return is_array($previa) ? self::normalizar($previa) : null;
    }

    /** Un enlace interno de verdad: empieza con una sola barra y no lleva esquema, comillas ni espacios. */
    public static function esEnlaceInterno(?string $enlace): bool
    {
        return is_string($enlace) && preg_match('#^/(?!/)[A-Za-z0-9\-._~/?=&%]*$#', $enlace) === 1;
    }
}
