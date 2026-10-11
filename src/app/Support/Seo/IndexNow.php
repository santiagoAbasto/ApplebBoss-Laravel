<?php

namespace App\Support\Seo;

use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * IndexNow: le avisa a Bing (y a Yandex, Seznam y Naver, que comparten el protocolo) qué direcciones cambiaron.
 *
 * Importa porque ChatGPT y Copilot buscan sobre el índice de Bing: si Bing no conoce una página, para ellos no
 * existe. El aviso sale del sitemap, que es la única lista de lo publicable: lo que cambió de fecha desde el último
 * aviso, lo nuevo y lo que dejó de estar (un equipo vendido), para que Bing lo retire. Lo corre el programador.
 *
 * La clave no es secreta (se publica en /indexnow.txt para probar que el sitio es nuestro); sale de APP_KEY para no
 * pedir otra variable de entorno.
 */
class IndexNow
{
    public const ENDPOINT = 'https://api.indexnow.org/indexnow';

    private const ESTADO = 'seo.indexnow.estado';

    private const ULTIMO = 'seo.indexnow.ultimo';

    /** El último aviso que Bing aceptó, para Tienda online → Tráfico. */
    public static function ultimoAviso(): ?array
    {
        return Cache::get(self::ULTIMO);
    }

    /** Cuántas direcciones tiene el sitemap que se le avisa a Bing. */
    public static function direccionesDelSitemap(): int
    {
        return count(self::delSitemap());
    }

    public static function clave(): string
    {
        return substr(hash('sha256', 'indexnow|' . config('app.key')), 0, 32);
    }

    /**
     * Avisa lo que cambió desde la vez anterior. Con $todo avisa el sitemap entero (la primera vez, o para forzar).
     * Devuelve cuántas direcciones avisó; null si no correspondía avisar (dominio de prueba) o si IndexNow falló.
     */
    public static function avisarCambios(bool $todo = false): ?int
    {
        if (! UrlPublica::esPublicable()) {
            return null;
        }

        $actuales = self::delSitemap();
        $antes = $todo ? null : Cache::get(self::ESTADO);

        $cambiadas = $antes === null
            ? array_keys($actuales)
            : array_merge(
                array_keys(array_filter($actuales, fn ($fecha, $url) => ($antes[$url] ?? null) !== $fecha, ARRAY_FILTER_USE_BOTH)),
                array_keys(array_diff_key($antes, $actuales)), // ya no están: que Bing las retire
            );

        if ($cambiadas !== [] && ! self::enviar($cambiadas)) {
            return null; // se reintenta en la próxima vuelta con el mismo estado
        }

        Cache::forever(self::ESTADO, $actuales);
        if ($cambiadas !== []) {
            Cache::forever(self::ULTIMO, ['fecha' => now()->toIso8601String(), 'direcciones' => count($cambiadas)]);
        }

        return count($cambiadas);
    }

    /** url => lastmod del sitemap público. */
    private static function delSitemap(): array
    {
        $xml = simplexml_load_string(app(SitemapController::class)->index()->getContent());
        $urls = [];
        foreach ($xml->url as $u) {
            $urls[(string) $u->loc] = (string) $u->lastmod;
        }

        return $urls;
    }

    private static function enviar(array $urls): bool
    {
        $base = UrlPublica::base();

        foreach (array_chunk($urls, 10000) as $lote) {
            try {
                $r = Http::timeout(20)->acceptJson()->post(self::ENDPOINT, [
                    'host'        => parse_url($base, PHP_URL_HOST),
                    'key'         => self::clave(),
                    'keyLocation' => $base . '/indexnow.txt',
                    'urlList'     => array_values($lote),
                ]);
            } catch (\Throwable $e) {
                Log::warning('IndexNow no respondió: ' . $e->getMessage());

                return false;
            }

            if (! $r->successful()) {
                Log::warning("IndexNow rechazó el aviso ({$r->status()}): " . mb_substr($r->body(), 0, 300));

                return false;
            }
        }

        return true;
    }
}
