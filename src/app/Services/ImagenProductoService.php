<?php

namespace App\Services;

use App\Models\CatalogoImagen;
use App\Models\CatalogoPublicacion;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImagenProductoService
{
    // Variantes generadas
    private const VARIANTES = [
        'thumb'  => ['w' => 120, 'h' => 120, 'q' => 80],
        'card'   => ['w' => 600, 'h' => 600, 'q' => 85],
        'medium' => ['w' => 900, 'h' => 900, 'q' => 85],
        'detail' => ['w' => 1200, 'h' => 1200, 'q' => 90],
    ];

    // Tipos MIME aceptados
    private const MIME_ACEPTADOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    private const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

    /**
     * Sube y procesa una imagen para una publicación.
     * Devuelve el modelo CatalogoImagen creado.
     */
    public function subir(CatalogoPublicacion $publicacion, UploadedFile $archivo, string $alt = ''): CatalogoImagen
    {
        // Validar MIME real (no solo extensión)
        $mime = $archivo->getMimeType();
        if (! in_array($mime, self::MIME_ACEPTADOS, true)) {
            throw new \InvalidArgumentException("Tipo de archivo no permitido: {$mime}");
        }
        if ($archivo->getSize() > self::MAX_BYTES) {
            throw new \InvalidArgumentException('El archivo supera el límite de 10 MB.');
        }

        $prefijo  = "catalogo/{$publicacion->id}";
        $baseName = Str::uuid()->toString();

        // Guardar original
        $rutaOriginal = $archivo->storeAs("{$prefijo}/original", "{$baseName}.{$archivo->extension()}", 'public');

        // Generar variantes
        $variantes = $this->generarVariantes($archivo, $prefijo, $baseName, $mime);

        // Calcular orden
        $orden = CatalogoImagen::where('publicacion_id', $publicacion->id)->max('orden') + 1;

        // Si es la primera imagen, marcarla como principal
        $esPrimera = ! CatalogoImagen::where('publicacion_id', $publicacion->id)->exists();

        $imagen = CatalogoImagen::create([
            'publicacion_id'  => $publicacion->id,
            'nombre_original' => $archivo->getClientOriginalName(),
            'ruta_original'   => $rutaOriginal,
            'ruta_thumb'      => $variantes['thumb'] ?? null,
            'ruta_card'       => $variantes['card'] ?? null,
            'ruta_medium'     => $variantes['medium'] ?? null,
            'ruta_detail'     => $variantes['detail'] ?? null,
            'alt'             => $alt ?: '',
            'orden'           => $orden,
            'es_principal'    => $esPrimera,
            'metadata'        => $this->metadata($archivo),
        ]);

        return $imagen;
    }

    /**
     * Elimina una imagen y sus variantes del disco.
     */
    public function eliminar(CatalogoImagen $imagen): void
    {
        foreach (['ruta_original', 'ruta_thumb', 'ruta_card', 'ruta_medium', 'ruta_detail'] as $campo) {
            if ($imagen->$campo) {
                Storage::disk('public')->delete($imagen->$campo);
            }
        }

        $publicacionId = $imagen->publicacion_id;
        $eraPrincipal  = $imagen->es_principal;

        $imagen->delete();

        // Si era la principal, asignar la siguiente
        if ($eraPrincipal) {
            CatalogoImagen::where('publicacion_id', $publicacionId)
                ->orderBy('orden')
                ->first()
                ?->update(['es_principal' => true]);
        }
    }

    /**
     * Reordena las imágenes de una publicación.
     * $orden = [{ id: 1, orden: 0 }, { id: 2, orden: 1 }, ...]
     */
    public function reordenar(CatalogoPublicacion $publicacion, array $orden): void
    {
        foreach ($orden as $item) {
            CatalogoImagen::where('publicacion_id', $publicacion->id)
                ->where('id', $item['id'])
                ->update(['orden' => $item['orden']]);
        }
    }

    /**
     * Marca una imagen como principal (y desmarca las demás).
     */
    public function marcarPrincipal(CatalogoImagen $imagen): void
    {
        CatalogoImagen::where('publicacion_id', $imagen->publicacion_id)
            ->update(['es_principal' => false]);
        $imagen->update(['es_principal' => true]);
    }

    // ─── Procesamiento de imagen ───────────────────────────────────────────────

    private function generarVariantes(UploadedFile $archivo, string $prefijo, string $baseName, string $mime): array
    {
        $rutas = [];

        // Corregir orientación EXIF antes de procesar
        $gdImage = $this->cargarGD($archivo->getRealPath(), $mime);
        if (! $gdImage) {
            // GD no puede procesar este formato: guardar original como fallback
            return [];
        }

        $gdImage = $this->corregirOrientacionExif($gdImage, $archivo->getRealPath());

        foreach (self::VARIANTES as $nombre => ['w' => $w, 'h' => $h, 'q' => $q]) {
            $resized   = $this->resize($gdImage, $w, $h);
            $extension = $this->outputExtension();
            $ruta      = "{$prefijo}/{$nombre}/{$baseName}.{$extension}";
            $tmpPath   = tempnam(sys_get_temp_dir(), 'img_');

            $this->guardarGD($resized, $tmpPath, $q);
            Storage::disk('public')->put($ruta, file_get_contents($tmpPath));
            @unlink($tmpPath);
            imagedestroy($resized);

            $rutas[$nombre] = $ruta;
        }

        imagedestroy($gdImage);

        return $rutas;
    }

    private function cargarGD(string $path, string $mime): ?\GdImage
    {
        return match (true) {
            in_array($mime, ['image/jpeg', 'image/jpg'], true) && function_exists('imagecreatefromjpeg')
                => @imagecreatefromjpeg($path),
            $mime === 'image/png'
                => @imagecreatefrompng($path),
            $mime === 'image/webp' && function_exists('imagecreatefromwebp')
                => @imagecreatefromwebp($path),
            default => null,
        };
    }

    private function corregirOrientacionExif(\GdImage $img, string $path): \GdImage
    {
        if (! function_exists('exif_read_data')) return $img;
        $exif = @exif_read_data($path);
        $orientacion = $exif['Orientation'] ?? 1;
        return match ((int) $orientacion) {
            3 => imagerotate($img, 180, 0),
            6 => imagerotate($img, -90, 0),
            8 => imagerotate($img, 90, 0),
            default => $img,
        };
    }

    private function resize(\GdImage $src, int $maxW, int $maxH): \GdImage
    {
        $srcW = imagesx($src);
        $srcH = imagesy($src);

        $ratio  = min($maxW / $srcW, $maxH / $srcH, 1.0);
        $dstW   = (int) round($srcW * $ratio);
        $dstH   = (int) round($srcH * $ratio);

        $dst = imagecreatetruecolor($dstW, $dstH);

        // Preservar transparencia PNG
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
        imagefilledrectangle($dst, 0, 0, $dstW, $dstH, $transparent);

        imagecopyresampled($dst, $src, 0, 0, 0, 0, $dstW, $dstH, $srcW, $srcH);
        return $dst;
    }

    private function guardarGD(\GdImage $img, string $path, int $quality): void
    {
        if (function_exists('imagewebp')) {
            imagewebp($img, $path, $quality);
        } elseif (function_exists('imagejpeg')) {
            imagejpeg($img, $path, $quality);
        } else {
            imagepng($img, $path, (int) round((100 - $quality) / 10));
        }
    }

    private function outputExtension(): string
    {
        if (function_exists('imagewebp')) return 'webp';
        if (function_exists('imagejpeg')) return 'jpg';
        return 'png';
    }

    private function metadata(UploadedFile $archivo): array
    {
        $meta = [
            'mime'      => $archivo->getMimeType(),
            'size'      => $archivo->getSize(),
            'extension' => $archivo->extension(),
        ];

        // Dimensiones del original si GD puede leerlo
        $size = @getimagesize($archivo->getRealPath());
        if ($size) {
            $meta['width']  = $size[0];
            $meta['height'] = $size[1];
        }

        return $meta;
    }
}
