<?php

namespace App\Support;

use App\Models\CatalogoPublicacion;
use Illuminate\Support\Str;

/**
 * Contenido de campañas por bloques.
 * El admin nunca envía HTML: envía bloques que se validan aquí y el servidor arma el correo.
 * Así no hay forma de inyectar scripts ni links peligrosos, y los precios salen del backend.
 */
class NewsletterContent
{
    public const TIPOS = ['titulo', 'texto', 'imagen', 'boton', 'producto', 'separador'];
    public const MAX_BLOQUES = 60;

    /** Valida y normaliza los bloques recibidos. Descarta silenciosamente lo inválido. */
    public static function sanitize(array $bloques): array
    {
        $out = [];

        foreach (array_slice(array_values($bloques), 0, self::MAX_BLOQUES) as $b) {
            if (! is_array($b)) continue;

            switch ($b['tipo'] ?? null) {
                case 'titulo':
                    $t = self::plain($b['texto'] ?? '', 200);
                    if ($t !== '') $out[] = ['tipo' => 'titulo', 'texto' => $t];
                    break;

                case 'texto':
                    $t = self::plain($b['texto'] ?? '', 5000, keepNewlines: true);
                    if ($t !== '') $out[] = ['tipo' => 'texto', 'texto' => $t];
                    break;

                case 'imagen':
                    $url = self::imagePath($b['url'] ?? '');
                    if ($url) {
                        $out[] = [
                            'tipo'   => 'imagen',
                            'url'    => $url,
                            'alt'    => self::plain($b['alt'] ?? '', 150),
                            'enlace' => self::linkUrl($b['enlace'] ?? ''),
                        ];
                    }
                    break;

                case 'boton':
                    $label = self::plain($b['texto'] ?? '', 60);
                    $url   = self::linkUrl($b['url'] ?? '');
                    if ($label !== '' && $url) $out[] = ['tipo' => 'boton', 'texto' => $label, 'url' => $url];
                    break;

                case 'producto':
                    $slug = Str::slug((string) ($b['slug'] ?? ''));
                    if ($slug !== '') $out[] = ['tipo' => 'producto', 'slug' => $slug];
                    break;

                case 'separador':
                    $out[] = ['tipo' => 'separador'];
                    break;
            }
        }

        return $out;
    }

    /**
     * Datos listos para la vista del correo (URLs absolutas, productos resueltos).
     * Los productos se buscan al enviar: precio vigente desde el backend y solo si siguen disponibles.
     */
    public static function forView(array $bloques): array
    {
        $slugs = collect($bloques)->where('tipo', 'producto')->pluck('slug')->unique()->all();
        $pubs  = $slugs
            ? CatalogoPublicacion::with('imagenes')->publicadoAhora()->whereIn('slug', $slugs)->get()->keyBy('slug')
            : collect();

        $view = [];
        foreach ($bloques as $b) {
            switch ($b['tipo']) {
                case 'imagen':
                    $view[] = [...$b, 'url' => Seo::absolute($b['url']), 'enlace' => $b['enlace'] ? Seo::absolute($b['enlace']) : null];
                    break;

                case 'boton':
                    $view[] = [...$b, 'url' => Seo::absolute($b['url'])];
                    break;

                case 'producto':
                    $pub = $pubs[$b['slug']] ?? null;
                    if (! $pub || ! $pub->productoDisponible()) break; // vendido o despublicado: no se anuncia
                    $img = $pub->imagenes->firstWhere('es_principal', true) ?? $pub->imagenes->first();
                    $view[] = [
                        'tipo'      => 'producto',
                        'nombre'    => $pub->titulo,
                        'resumen'   => $pub->resumen,
                        'condicion' => $pub->condicion,
                        'precio'    => $pub->precioVigente(),
                        'imagen'    => $img ? Seo::absolute($img->urlCard()) : null,
                        'url'       => route('store.product', $pub->slug),
                    ];
                    break;

                default:
                    $view[] = $b;
            }
        }

        return $view;
    }

    /** Rutas en disco public de las imágenes subidas (para adjuntarlas si se pidió). */
    public static function imageDiskPaths(array $bloques): array
    {
        return collect($bloques)
            ->where('tipo', 'imagen')
            ->pluck('url')
            ->filter(fn ($u) => Str::startsWith($u, '/storage/newsletter/'))
            ->map(fn ($u) => Str::after($u, '/storage/'))
            ->unique()
            ->values()
            ->all();
    }

    private static function plain(mixed $value, int $max, bool $keepNewlines = false): string
    {
        $text = strip_tags((string) $value);
        $text = $keepNewlines
            ? preg_replace("/[ \t]+/", ' ', str_replace("\r", '', $text))
            : preg_replace('/\s+/', ' ', $text);

        return Str::limit(trim($text), $max, '');
    }

    /** Solo imágenes alojadas en este sitio (subidas al newsletter o del catálogo). */
    private static function imagePath(mixed $value): ?string
    {
        $url  = trim((string) $value);
        $base = rtrim((string) config('app.url'), '/');
        if (Str::startsWith($url, $base . '/storage/')) {
            $url = Str::after($url, $base);
        }

        return Str::startsWith($url, '/storage/') && ! Str::contains($url, '..') ? Str::limit($url, 255, '') : null;
    }

    /** Enlaces http(s) o rutas internas. Nunca javascript:, data:, etc. */
    private static function linkUrl(mixed $value): ?string
    {
        $url = trim((string) $value);
        if ($url === '' || strlen($url) > 500) return null;
        if (Str::startsWith($url, '/') && ! Str::startsWith($url, '//')) return $url;

        return filter_var($url, FILTER_VALIDATE_URL) && preg_match('#^https?://#i', $url) ? $url : null;
    }
}
