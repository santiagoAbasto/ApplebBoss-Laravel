<?php

namespace App\Services;

use App\Models\CatalogoImagen;
use App\Models\CatalogoPublicacion;
use App\Services\Concerns\ProcesaImagenes;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImagenProductoService
{
    use ProcesaImagenes;

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

    // ─── Procesamiento de imagen (GD: trait ProcesaImagenes) ──────────────────

    private function generarVariantes(UploadedFile $archivo, string $prefijo, string $baseName, string $mime): array
    {
        return $this->variantes($archivo, $mime, $prefijo, $baseName, self::VARIANTES);
    }
}
