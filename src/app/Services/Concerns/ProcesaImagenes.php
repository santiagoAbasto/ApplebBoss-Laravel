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
    private function variantes(UploadedFile $archivo, string $mime, string $prefijo, string $baseName, array $variantes, bool $encuadrar = false): array
    {
        return $this->variantesDesdePath($archivo->getRealPath(), $mime, $prefijo, $baseName, $variantes, $encuadrar);
    }

    /**
     * Igual que variantes() pero desde un archivo ya guardado (para reprocesar fotos existentes desde su original).
     * `$encuadrar`: recorta el fondo liso y centra el producto en un cuadro con margen fijo, para que todas las fotos
     * de producto queden con el mismo zoom. No se usa en banners/portadas (ahí la foto va a sangre).
     */
    private function variantesDesdePath(string $realPath, string $mime, string $prefijo, string $baseName, array $variantes, bool $encuadrar = false): array
    {
        $gdImage = $this->cargarGD($realPath, $mime);
        if (! $gdImage) {
            return [];
        }

        $gdImage = $this->corregirOrientacionExif($gdImage, $realPath);
        if ($encuadrar) {
            $gdImage = $this->recortarYEncuadrar($gdImage);
        }

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

    /**
     * Recorta el fondo liso (blanco o transparente) alrededor del producto y lo centra en un lienzo cuadrado con un
     * margen fijo. Así una foto con mucho aire alrededor queda con el mismo zoom que una ajustada. Si las esquinas no
     * son un fondo liso (una foto con escena), no toca nada.
     */
    private function recortarYEncuadrar(\GdImage $src, float $margen = 0.02): \GdImage
    {
        $w = imagesx($src);
        $h = imagesy($src);
        if ($w < 16 || $h < 16) {
            return $src;
        }

        // ¿Las esquinas son un fondo liso? (transparente, o un color parecido entre las cuatro). Si no, hay escena.
        $esquinas = [$this->colorEn($src, 0, 0), $this->colorEn($src, $w - 1, 0), $this->colorEn($src, 0, $h - 1), $this->colorEn($src, $w - 1, $h - 1)];
        $transparentes = count(array_filter($esquinas, fn ($c) => $c[3] > 100));
        $porAlpha = $transparentes >= 2;
        $bg = [
            (int) round(array_sum(array_column($esquinas, 0)) / 4),
            (int) round(array_sum(array_column($esquinas, 1)) / 4),
            (int) round(array_sum(array_column($esquinas, 2)) / 4),
        ];
        if (! $porAlpha) {
            foreach ($esquinas as $c) {
                if (abs($c[0] - $bg[0]) + abs($c[1] - $bg[1]) + abs($c[2] - $bg[2]) > 120) {
                    return $src; // esquinas muy distintas entre sí: la foto tiene escena, no fondo liso
                }
            }
        }

        // Caja del contenido por PERFIL de columnas/filas (no por píxel suelto): una columna/fila cuenta como
        // producto solo si tiene suficientes píxeles visibles. Así el ruido o la sombra tenue del borde deja de
        // inflar la caja en fotos de equipos claros sobre blanco (p. ej. titanio natural), que antes quedaban chicos.
        $tol = 42;
        $paso = max(1, (int) floor(min($w, $h) / 600));
        $colVis = array_fill(0, $w, 0);
        $rowVis = array_fill(0, $h, 0);
        for ($y = 0; $y < $h; $y += $paso) {
            for ($x = 0; $x < $w; $x += $paso) {
                $c = $this->colorEn($src, $x, $y);
                $visible = $porAlpha
                    ? $c[3] < 100
                    : ($c[3] < 100 && abs($c[0] - $bg[0]) + abs($c[1] - $bg[1]) + abs($c[2] - $bg[2]) > $tol);
                if ($visible) { $colVis[$x]++; $rowVis[$y]++; }
            }
        }
        $picoCol = max($colVis);
        $picoRow = max($rowVis);
        if ($picoCol === 0 || $picoRow === 0) {
            return $src; // todo era fondo
        }
        // Umbral: 2.5% del pico. Una columna/fila de ruido tiene 1-2 píxeles; una del producto, muchos.
        $umbralCol = max(2, (int) ceil($picoCol * 0.025));
        $umbralRow = max(2, (int) ceil($picoRow * 0.025));
        $minX = $w; $maxX = -1;
        for ($x = 0; $x < $w; $x++) {
            if ($colVis[$x] >= $umbralCol) { if ($x < $minX) $minX = $x; $maxX = $x; }
        }
        $minY = $h; $maxY = -1;
        for ($y = 0; $y < $h; $y++) {
            if ($rowVis[$y] >= $umbralRow) { if ($y < $minY) $minY = $y; $maxY = $y; }
        }
        if ($maxX < 0 || $maxY < 0) {
            return $src; // todo era fondo
        }

        // Pad de seguridad y recorte
        $minX = max(0, $minX - $paso); $minY = max(0, $minY - $paso);
        $maxX = min($w - 1, $maxX + $paso); $maxY = min($h - 1, $maxY + $paso);
        $cw = $maxX - $minX + 1; $ch = $maxY - $minY + 1;

        // Lienzo cuadrado: el contenido ocupa (1 - 2*margen) del lado, centrado. Fondo transparente.
        $lado = (int) ceil(max($cw, $ch) / max(0.5, 1 - 2 * $margen));
        $dst = imagecreatetruecolor($lado, $lado);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        imagefilledrectangle($dst, 0, 0, $lado, $lado, imagecolorallocatealpha($dst, 255, 255, 255, 127));
        imagecopy($dst, $src, (int) round(($lado - $cw) / 2), (int) round(($lado - $ch) / 2), $minX, $minY, $cw, $ch);

        return $dst;
    }

    /** [r, g, b, alpha(0-127)] de un píxel. */
    private function colorEn(\GdImage $img, int $x, int $y): array
    {
        $rgba = imagecolorat($img, $x, $y);
        return [($rgba >> 16) & 0xFF, ($rgba >> 8) & 0xFF, $rgba & 0xFF, ($rgba >> 24) & 0x7F];
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
