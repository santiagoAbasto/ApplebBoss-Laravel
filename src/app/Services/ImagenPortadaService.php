<?php

namespace App\Services;

use App\Models\HomeSection;
use App\Services\Concerns\ProcesaImagenes;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Las fotos de la MacBook de la portada grande, una por categoría. Se cargan en Tienda online → Portada → «Portada
 * grande» y la tienda usa la misma foto en la ventana de la MacBook, en el ícono del Dock, en el fondo desenfocado y en
 * el cuadrito del destacado. Sin foto cargada, va la que trae la tienda (public/images/hero-mac-1).
 *
 * Se guardan en la sección (settings.pantallas): el original y dos variantes en WebP, con nombre nuevo cada vez, así
 * Cloudflare nunca sirve la anterior. Al reemplazarla o quitarla se borran los archivos de la anterior.
 */
class ImagenPortadaService
{
    use ProcesaImagenes;

    /** Las categorías de la portada grande (las mismas claves que HeroMac.jsx). */
    public const CLAVES = ['iphone' => 'iPhone', 'mac' => 'Mac', 'apple' => 'Más Apple', 'myskin' => 'MYSKIN'];

    /** La ventana de la MacBook es 3:2; la chica sirve para el Dock, el fondo, el destacado y los celulares. */
    public const VARIANTES = [
        'grande' => ['w' => 1500, 'h' => 1000, 'q' => 82],
        'chica'  => ['w' => 760, 'h' => 507, 'q' => 78],
    ];

    public const MAX_KB = 10240;
    /** Más angosta se ve borrosa en la pantalla de la MacBook. */
    public const MIN_ANCHO = 1200;

    public function guardar(HomeSection $hero, string $clave, UploadedFile $archivo): void
    {
        $mime = (string) $archivo->getMimeType();
        if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            throw new \InvalidArgumentException('La foto debe ser JPG, PNG o WebP.');
        }

        $prefijo = "portada/hero/{$clave}";
        $base = Str::uuid()->toString();
        $original = $archivo->storeAs("{$prefijo}/original", "{$base}.{$archivo->extension()}", 'public');
        $variantes = $this->variantes($archivo, $mime, $prefijo, $base, self::VARIANTES);

        if (! isset($variantes['grande'], $variantes['chica'])) {
            Storage::disk('public')->delete(array_filter([$original, ...array_values($variantes)]));
            throw new \InvalidArgumentException('No se pudo leer la foto. Prueba exportarla de nuevo como JPG.');
        }

        $anteriores = $this->rutas($hero, $clave);

        $settings = $hero->settings ?? [];
        $settings['pantallas'][$clave] = [
            'original' => $original,
            'grande'   => $variantes['grande'],
            'chica'    => $variantes['chica'],
            'nombre'   => mb_substr($archivo->getClientOriginalName(), 0, 120),
        ];
        $hero->forceFill(['settings' => $settings])->save();

        Storage::disk('public')->delete($anteriores);
    }

    /** Vuelve a la foto que trae la tienda. */
    public function quitar(HomeSection $hero, string $clave): void
    {
        $anteriores = $this->rutas($hero, $clave);

        $settings = $hero->settings ?? [];
        unset($settings['pantallas'][$clave]);
        if (empty($settings['pantallas'])) {
            unset($settings['pantallas']);
        }
        $hero->forceFill(['settings' => $settings])->save();

        Storage::disk('public')->delete($anteriores);
    }

    /**
     * Lo que ve la tienda: la dirección de la foto grande y la chica de cada categoría que tiene una cargada.
     * Nunca el nombre del archivo ni el original.
     */
    public static function urls(array $settings): array
    {
        return collect($settings['pantallas'] ?? [])
            ->only(array_keys(self::CLAVES))
            ->filter(fn ($p) => ! empty($p['grande']) && ! empty($p['chica']))
            ->map(fn ($p) => ['grande' => '/storage/' . $p['grande'], 'chica' => '/storage/' . $p['chica']])
            ->all();
    }

    private function rutas(HomeSection $hero, string $clave): array
    {
        $p = $hero->settings['pantallas'][$clave] ?? [];

        return array_values(array_filter([$p['original'] ?? null, $p['grande'] ?? null, $p['chica'] ?? null]));
    }
}
