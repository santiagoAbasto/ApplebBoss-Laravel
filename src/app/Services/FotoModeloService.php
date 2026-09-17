<?php

namespace App\Services;

use App\Models\ModeloReferencia;
use App\Services\Concerns\ProcesaImagenes;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Foto de un modelo de referencia para la comparativa pública. Guarda el original y dos variantes en WebP (se
 * conserva la transparencia de los PNG) y, al reemplazarla, borra los archivos de la anterior.
 */
class FotoModeloService
{
    use ProcesaImagenes;

    /** Proporción 5:6, la de la tarjeta de la comparativa. */
    public const VARIANTES = [
        'card'    => ['w' => 640, 'h' => 768, 'q' => 88],
        'detalle' => ['w' => 1280, 'h' => 1536, 'q' => 90],
    ];

    public const MIME_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'];
    public const MAX_KB = 10240;
    public const MIN_LADO = 600;

    public function guardar(ModeloReferencia $modelo, UploadedFile $archivo): void
    {
        $mime = (string) $archivo->getMimeType();
        if (! in_array($mime, self::MIME_ACEPTADOS, true)) {
            throw new \InvalidArgumentException('La foto debe ser JPG, PNG o WebP.');
        }

        $prefijo = "modelos/{$modelo->slug}";
        $base = Str::uuid()->toString();
        $original = $archivo->storeAs("{$prefijo}/original", "{$base}.{$archivo->extension()}", 'public');
        $variantes = $this->variantes($archivo, $mime, $prefijo, $base, self::VARIANTES);

        if (! isset($variantes['card'])) {
            Storage::disk('public')->delete($original);
            throw new \InvalidArgumentException('No se pudo leer la imagen. Prueba exportarla de nuevo como PNG o JPG.');
        }

        $anteriores = $this->rutas($modelo);

        $modelo->forceFill([
            'foto_original'       => $original,
            'foto_card'           => $variantes['card'],
            'foto_detalle'        => $variantes['detalle'] ?? null,
            'foto_meta'           => ['nombre' => $archivo->getClientOriginalName()] + $this->metadata($archivo),
            'foto_actualizada_at' => now(),
        ])->save();

        Storage::disk('public')->delete($anteriores);
    }

    public function quitar(ModeloReferencia $modelo): void
    {
        $anteriores = $this->rutas($modelo);

        $modelo->forceFill([
            'foto_original'       => null,
            'foto_card'           => null,
            'foto_detalle'        => null,
            'foto_meta'           => null,
            'foto_actualizada_at' => null,
        ])->save();

        Storage::disk('public')->delete($anteriores);
    }

    private function rutas(ModeloReferencia $modelo): array
    {
        return array_values(array_filter([$modelo->foto_original, $modelo->foto_card, $modelo->foto_detalle]));
    }
}
