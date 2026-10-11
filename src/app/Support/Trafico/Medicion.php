<?php

namespace App\Support\Trafico;

use App\Models\EventoWeb;
use App\Support\Seo\UrlPublica;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * La medición propia de la tienda: cuenta páginas y acciones sin cookies y sin guardar la IP ni el navegador.
 *
 * El visitante es un seudónimo: hmac(fecha en La Paz | IP | navegador) con APP_KEY, 16 hex, que cambia cada día.
 * Sirve para contar visitantes del día; no deja seguir a nadie entre días ni recuperar la IP. Lo describe la
 * política de privacidad («Estadísticas propias»): si cambia algo acá, cambia allá.
 */
class Medicion
{
    public const ZONA = 'America/La_Paz';

    // ponytail: heurística por texto del navegador, alcanza para separar bots en un gráfico.
    private const BOT = '/bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp\/|python|curl|wget|java\/|go-http|okhttp|libwww|scrapy|phantom|puppeteer|playwright|httpclient|axios/i';

    /** Ruta interna: una sola «/» al comienzo, sin query ni «//» ni «\» (se resolverían como otro dominio). */
    private const RUTA = '/^\/(?![\/\\\\])[^?#\\\\\s\p{Cc}]*$/u';

    /** Las rutas que llevan un código privado (pedido, seguimiento, enlaces de correo) se guardan sin él. */
    private const ACORTAR = ['/pedido/', '/seguimiento/', '/reset-password/', '/newsletter/baja/', '/verify-email/'];

    public static function registrar(Request $request, string $nombre, string $ruta, ?string $etiqueta = null, ?string $referente = null): void
    {
        $ruta = self::ruta($ruta);
        if ($ruta === null) {
            return;
        }

        $navegador = trim((string) $request->userAgent());
        $ahora = now(self::ZONA);

        EventoWeb::create([
            'nombre'      => $nombre,
            'ruta'        => $ruta,
            'etiqueta'    => $etiqueta !== null && $etiqueta !== '' ? mb_substr($etiqueta, 0, 120) : null,
            'visitante'   => self::visitante($request, $navegador, $ahora),
            'pais'        => self::pais($request),
            'dispositivo' => self::dispositivo($navegador),
            'navegador'   => self::navegador($navegador),
            'referente'   => self::referente($referente, $request),
            'idioma'      => self::idioma($request),
            'bot'         => $navegador === '' || (bool) preg_match(self::BOT, $navegador),
            'dia'         => $ahora->toDateString(),
            'hora'        => $ahora->hour,
        ]);
    }

    public static function ruta(string $ruta): ?string
    {
        $ruta = mb_substr($ruta, 0, 300);
        if (! preg_match(self::RUTA, $ruta)) {
            return null;
        }
        foreach (self::ACORTAR as $prefijo) {
            if (str_starts_with($ruta, $prefijo)) {
                return rtrim($prefijo, '/');
            }
        }

        return $ruta;
    }

    /** Lo que se buscó, sin nada que parezca un dato personal (un correo o un número de teléfono). */
    public static function busqueda(?string $texto): ?string
    {
        $texto = mb_strtolower(trim(preg_replace('/\s+/u', ' ', (string) $texto)));

        return $texto === '' || mb_strlen($texto) > 60 || str_contains($texto, '@') || preg_match('/\d{7,}/', $texto) ? null : $texto;
    }

    /**
     * La IP de la visita. Detrás de Cloudflare, Laravel ve la del borde de Cloudflare hasta que Caddy lo reconozca
     * (parte B del despliegue de la API), así que se usa la que informa Cloudflare.
     * ponytail: CF-Connecting-IP se puede falsificar si alguien entra sin pasar por Cloudflare; solo afecta su propio
     * conteo de visitantes, no la seguridad.
     */
    public static function ip(Request $request): string
    {
        return (string) ($request->header('CF-Connecting-IP') ?: $request->ip());
    }

    private static function visitante(Request $request, string $navegador, Carbon $ahora): string
    {
        return substr(hash_hmac('sha256', $ahora->toDateString() . '|' . self::ip($request) . '|' . $navegador, (string) config('app.key')), 0, 16);
    }

    /** País que informa Cloudflare (dos letras). XX es «desconocido» y T1 es Tor. */
    private static function pais(Request $request): ?string
    {
        $pais = strtoupper(trim((string) $request->header('CF-IPCountry')));

        return preg_match('/^[A-Z]{2}$/', $pais) && ! in_array($pais, ['XX', 'T1'], true) ? $pais : null;
    }

    // ponytail: el iPad se presenta como Mac y cuenta como escritorio; para un gráfico de torta alcanza.
    private static function dispositivo(string $ua): ?string
    {
        return match (true) {
            $ua === '' => null,
            (bool) preg_match('/ipad|tablet|kindle|silk|playbook/i', $ua), (preg_match('/android/i', $ua) && ! preg_match('/mobile/i', $ua)) => 'tablet',
            (bool) preg_match('/mobi|iphone|ipod|android|windows phone|blackberry|opera mini/i', $ua) => 'movil',
            default => 'escritorio',
        };
    }

    // El orden importa: Edge, Opera y Samsung también dicen «Chrome», y Chrome también dice «Safari».
    private static function navegador(string $ua): ?string
    {
        return match (true) {
            $ua === '' => null,
            (bool) preg_match('/edg(e|a|ios)?\//i', $ua) => 'edge',
            (bool) preg_match('/opr\/|opera/i', $ua) => 'opera',
            (bool) preg_match('/samsungbrowser/i', $ua) => 'samsung',
            (bool) preg_match('/firefox|fxios/i', $ua) => 'firefox',
            (bool) preg_match('/chrome|crios|chromium/i', $ua) => 'chrome',
            (bool) preg_match('/safari/i', $ua) => 'safari',
            default => 'otro',
        };
    }

    /** Solo el dominio de donde llegó, sin «www.» ni los prefijos de Facebook; vacío si es la propia tienda. */
    private static function referente(?string $url, Request $request): ?string
    {
        $host = strtolower((string) parse_url((string) $url, PHP_URL_HOST));
        $host = preg_replace('/^(www|m|l|lm|mobile)\./', '', $host);
        $propios = array_filter([
            preg_replace('/^www\./', '', strtolower((string) parse_url(UrlPublica::base(), PHP_URL_HOST))),
            preg_replace('/^www\./', '', strtolower($request->getHost())),
        ]);

        return $host === '' || in_array($host, $propios, true) ? null : mb_substr($host, 0, 120);
    }

    private static function idioma(Request $request): ?string
    {
        $primero = strtolower(substr(trim(explode(',', (string) $request->header('Accept-Language'))[0]), 0, 2));

        return preg_match('/^[a-z]{2}$/', $primero) ? $primero : null;
    }
}
