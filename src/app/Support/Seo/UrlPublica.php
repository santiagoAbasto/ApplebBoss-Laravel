<?php

namespace App\Support\Seo;

use Illuminate\Support\Str;

/**
 * El dominio oficial del sitio.
 *
 * Todo lo que Google lee (canonical, og:url, sitemap) tiene que apuntar SIEMPRE acá,
 * nunca al host de la petición: si no, cada túnel o cada IP genera una URL distinta
 * para la misma página y se rompe la indexación.
 */
class UrlPublica
{
    /** Base sin barra final. Ej.: https://appleboss.com.bo */
    public static function base(): string
    {
        return rtrim((string) config('seo.public_url', config('app.url')), '/');
    }

    /** URL absoluta y canónica de una ruta. */
    public static function de(string $ruta = ''): string
    {
        $ruta = trim($ruta, '/');

        return $ruta === '' ? self::base() . '/' : self::base() . '/' . $ruta;
    }

    /** Convierte cualquier valor (ruta o URL) en absoluto sobre el dominio oficial. */
    public static function absoluta(?string $valor): ?string
    {
        if (blank($valor)) {
            return null;
        }

        return Str::startsWith($valor, ['http://', 'https://']) ? $valor : self::de($valor);
    }

    /**
     * ¿Este dominio sirve para que Google indexe?
     *
     * No sirve si es localhost, una IP, o un túnel temporal (*.trycloudflare.com, *.ngrok...):
     * esas URLs cambian y no construyen autoridad.
     */
    public static function esPublicable(): bool
    {
        $host = parse_url(self::base(), PHP_URL_HOST) ?: '';

        if ($host === '' || $host === 'localhost' || filter_var($host, FILTER_VALIDATE_IP)) {
            return false;
        }

        foreach (['trycloudflare.com', 'ngrok.io', 'ngrok-free.app', 'loca.lt', 'serveo.net'] as $temporal) {
            if (Str::endsWith($host, $temporal)) {
                return false;
            }
        }

        return true;
    }

    /** Motivo legible de por qué el dominio no sirve (para el panel y las pruebas). */
    public static function motivoNoPublicable(): ?string
    {
        if (self::esPublicable()) {
            return null;
        }

        $host = parse_url(self::base(), PHP_URL_HOST) ?: '(sin host)';

        return "El sitio se está publicando en «{$host}». Google necesita un dominio propio y estable "
            . '(configúralo en SEO_PUBLIC_URL) para poder indexar la tienda.';
    }
}
