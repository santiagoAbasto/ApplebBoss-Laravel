<?php

namespace App\Services;

use App\Models\Novedad;
use App\Services\Concerns\ProcesaImagenes;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Foto principal de una novedad. Guarda el original y dos variantes en WebP (la tarjeta y la ficha) y, al reemplazarla
 * o quitarla, borra los archivos de la anterior.
 */
class ImagenNovedadService
{
    use ProcesaImagenes;

    /** La tienda la muestra en 16:9: las variantes caben en estos tamaños sin recortar ni agrandar. */
    public const VARIANTES = [
        'card'    => ['w' => 960, 'h' => 960, 'q' => 84],
        'detalle' => ['w' => 1920, 'h' => 1920, 'q' => 86],
    ];

    public const MIME_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'];
    public const MAX_KB = 10240;
    /** Más angosta se ve borrosa en la ficha, que ocupa todo el ancho del contenido. */
    public const MIN_ANCHO = 1200;

    public function guardar(Novedad $novedad, UploadedFile $archivo): void
    {
        $mime = (string) $archivo->getMimeType();
        if (! in_array($mime, self::MIME_ACEPTADOS, true)) {
            throw new \InvalidArgumentException('La foto debe ser JPG, PNG o WebP.');
        }

        $prefijo = "novedades/{$novedad->id}";
        $base = Str::uuid()->toString();
        $original = $archivo->storeAs("{$prefijo}/original", "{$base}.{$archivo->extension()}", 'public');
        $variantes = $this->variantes($archivo, $mime, $prefijo, $base, self::VARIANTES);

        if (! isset($variantes['card'])) {
            Storage::disk('public')->delete($original);
            throw new \InvalidArgumentException('No se pudo leer la foto. Prueba exportarla de nuevo como JPG.');
        }

        $anteriores = $this->rutas($novedad);

        $novedad->forceFill([
            'imagen_original' => $original,
            'imagen_card'     => $variantes['card'],
            'imagen_detalle'  => $variantes['detalle'] ?? null,
            'imagen_meta'     => ['nombre' => $archivo->getClientOriginalName()] + $this->metadata($archivo),
        ])->save();

        Storage::disk('public')->delete($anteriores);
    }

    public function quitar(Novedad $novedad): void
    {
        $anteriores = $this->rutas($novedad);

        $novedad->forceFill([
            'imagen_original' => null,
            'imagen_card'     => null,
            'imagen_detalle'  => null,
            'imagen_meta'     => null,
        ])->save();

        Storage::disk('public')->delete($anteriores);
    }

    /** Al borrar la novedad, sus archivos. */
    public function borrarArchivos(Novedad $novedad): void
    {
        Storage::disk('public')->delete($this->rutas($novedad));
    }

    private function rutas(Novedad $novedad): array
    {
        return array_values(array_unique(array_filter([
            $novedad->imagen_original, $novedad->imagen_card, $novedad->imagen_detalle,
        ])));
    }
}
