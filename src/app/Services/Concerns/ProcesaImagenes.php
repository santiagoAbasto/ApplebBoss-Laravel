<?php

namespace App\Services\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Procesamiento de imágenes con GD, compartido por las fotos de las publicaciones (ImagenProductoService) y las de
 * los modelos de referencia (FotoModeloService): corrige la orientación EXIF, genera variantes que caben en un
 * tamaño máximo sin deformar ni agrandar, conserva la transparencia de los PNG y guarda en WebP cuando se puede.
 */
trait ProcesaImagenes
{
    /**
     * Genera las variantes en el disco público y devuelve sus rutas por nombre.
     * $variantes = ['card' => ['w' => 600, 'h' => 600, 'q' => 85], ...]. Si GD no puede leer el archivo, devuelve [].
     *
     * @return array<string, string>
     */
    private function variantes(UploadedFile $archivo, string $mime, string $prefijo, string $baseName, array $variantes): array
    {
        $gdImage = $this->cargarGD($archivo->getRealPath(), $mime);
        if (! $gdImage) {
            return [];
        }

        $gdImage = $this->corregirOrientacionExif($gdImage, $archivo->getRealPath());
        $rutas = [];

        foreach ($variantes as $nombre => ['w' => $w, 'h' => $h, 'q' => $q]) {
            $resized = $this->resize($gdImage, $w, $h);
            $ruta = "{$prefijo}/{$nombre}/{$baseName}.{$this->outputExtension()}";
            $tmpPath = tempnam(sys_get_temp_dir(), 'img_');

            $this->guardarGD($resized, $tmpPath, $q);
            Storage::disk('public')->put($ruta, file_get_contents($tmpPath));
            @unlink($tmpPath);
            unset($resized); // imagedestroy() no hace nada desde PHP 8.0 y es obsoleto en 8.5

            $rutas[$nombre] = $ruta;
        }

        unset($gdImage);

        return $rutas;
    }

    private function cargarGD(string $path, string $mime): ?\GdImage
    {
        return match (true) {
            in_array($mime, ['image/jpeg', 'image/jpg'], true) && function_exists('imagecreatefromjpeg')
                => @imagecreatefromjpeg($path) ?: null,
            $mime === 'image/png'
                => @imagecreatefrompng($path) ?: null,
            $mime === 'image/webp' && function_exists('imagecreatefromwebp')
                => @imagecreatefromwebp($path) ?: null,
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
