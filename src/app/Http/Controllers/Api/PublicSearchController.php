<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatalogoPublicacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = Str::lower(trim((string) $request->string('q')));

        if (mb_strlen($q) < 2) {
            return response()->json(['results' => []]);
        }

        $results = CatalogoPublicacion::with('imagenes')
            ->publicadoAhora()
            ->get()
            ->filter(function (CatalogoPublicacion $pub) use ($q) {
                $hay = Str::lower(implode(' ', array_filter([
                    $pub->titulo, $pub->subcategoria, $pub->categoria,
                    $pub->condicion,
                    ...array_values($pub->atributosPublicos()),
                ])));
                return Str::contains($hay, $q);
            })
            ->sortByDesc('destacado')
            ->take(8)
            ->tap(fn ($c) => CatalogoPublicacion::precargarInventario($c))
            ->map(function (CatalogoPublicacion $pub) {
                $price = $pub->precioVigente();
                $img   = $pub->imagenes->firstWhere('es_principal', true) ?? $pub->imagenes->first();
                return [
                    'slug'      => $pub->slug,
                    'url'       => route('store.product', $pub->slug),
                    'name'      => $pub->titulo,
                    'condition' => $pub->condicion,
                    'price'     => (float) ($price ?? 0),
                    'image'     => $img?->urlThumb(),
                    'category'  => match ($pub->categoria) {
                        'celulares'       => 'iPhone',
                        'computadoras'    => 'Mac',
                        'productos-apple' => 'Apple',
                        default           => ucfirst($pub->subcategoria ?? $pub->categoria),
                    },
                ];
            })
            ->values();

        return response()->json(['results' => $results]);
    }
}
