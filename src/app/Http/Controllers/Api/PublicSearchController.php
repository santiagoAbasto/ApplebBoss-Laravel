<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatalogoPublicacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Buscador de la tienda (GET /api/buscar).
 *
 * - `q`: texto a buscar (mínimo 2 letras); se compara sin tildes contra el título, la categoría, la condición y los
 *   atributos públicos.
 * - `categoria`: celulares, computadoras, productos-apple, accesorios o seminuevos (esta última filtra por condición).
 * - `destacados=1` sin `q`: lo que se muestra cuando el buscador está vacío.
 *
 * Solo salen productos publicados y disponibles, con el precio que se cobra (el promocional si está vigente) y sin
 * ningún dato interno.
 */
class PublicSearchController extends Controller
{
    private const CATEGORIAS = ['celulares', 'computadoras', 'productos-apple', 'accesorios', 'seminuevos'];
    private const MAXIMO = 8;

    public function __invoke(Request $request): JsonResponse
    {
        $q = $this->normalizar((string) $request->string('q'));
        $categoria = in_array($request->string('categoria')->toString(), self::CATEGORIAS, true)
            ? $request->string('categoria')->toString()
            : null;
        $destacados = $request->boolean('destacados');

        if (mb_strlen($q) < 2 && ! $destacados) {
            return response()->json(['results' => []]);
        }

        $publicaciones = CatalogoPublicacion::with('imagenes')
            ->publicadoAhora()
            ->when($categoria && $categoria !== 'seminuevos', fn ($query) => $query->where('categoria', $categoria))
            ->when($categoria === 'seminuevos', fn ($query) => $query->where('condicion', 'Seminuevo'))
            ->orderByDesc('destacado')
            ->latest('id')
            ->get();

        if (mb_strlen($q) >= 2) {
            // Primero lo que coincide en el nombre; después lo que solo coincide en la ficha o la categoría.
            $publicaciones = $publicaciones
                ->filter(fn (CatalogoPublicacion $pub) => Str::contains($this->textoDe($pub), $q))
                ->sortByDesc(fn (CatalogoPublicacion $pub) => match (true) {
                    Str::startsWith($this->normalizar($pub->titulo), $q) => 3,
                    Str::contains($this->normalizar($pub->titulo), $q)   => 2,
                    default                                                => 1,
                })
                ->values();
        }

        CatalogoPublicacion::precargarInventario($publicaciones);

        $results = $publicaciones
            ->filter(fn (CatalogoPublicacion $pub) => $pub->productoDisponible())
            ->take($destacados && mb_strlen($q) < 2 ? 6 : self::MAXIMO)
            ->map(fn (CatalogoPublicacion $pub) => $this->resultado($pub))
            ->values();

        return response()->json(['results' => $results]);
    }

    private function resultado(CatalogoPublicacion $pub): array
    {
        $img = $pub->imagenes->firstWhere('es_principal', true) ?? $pub->imagenes->first();
        $precio = $pub->precioPublico();
        $anterior = $pub->promocionActiva() ? $pub->precioVigente() : null;

        return [
            'slug'        => $pub->slug,
            'url'         => route('store.product', $pub->slug),
            'name'        => $pub->titulo,
            'condition'   => $pub->condicion,
            'price'       => $precio,
            'price_before' => $anterior && $anterior > $precio ? (float) $anterior : null,
            'image'       => $img?->urlThumb(),
            'image_large' => $img?->urlCard() ?? $img?->urlThumb(),
            'category'    => match ($pub->categoria) {
                'celulares'       => 'iPhone',
                'computadoras'    => 'Mac',
                'productos-apple' => 'Apple',
                default           => ucfirst($pub->subcategoria ?? $pub->categoria ?? ''),
            },
        ];
    }

    private function textoDe(CatalogoPublicacion $pub): string
    {
        return $this->normalizar(implode(' ', array_filter([
            $pub->titulo, $pub->subcategoria, $pub->categoria, $pub->condicion,
            ...array_values($pub->atributosPublicos()),
        ], fn ($v) => is_scalar($v))));
    }

    /** Minúsculas y sin tildes: «cámara» encuentra «camara» y al revés. */
    private function normalizar(string $texto): string
    {
        return Str::of($texto)->trim()->lower()->ascii()->toString();
    }
}
