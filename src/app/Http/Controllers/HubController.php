<?php

namespace App\Http\Controllers;

use App\Models\CatalogoPublicacion;
use App\Models\Faq;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class HubController extends Controller
{
    public function iphone(): Response
    {
        $all      = $this->publicaciones();
        $nuevos   = $all->where('category', 'celulares')->where('condition', 'Nuevo')->values();
        $usados   = $all->where('category', 'celulares')->whereIn('condition', ['Seminuevo', 'Open Box'])->values();
        $myskin   = $all->where('is_myskin', true)->take(4)->values();

        $modelos = $nuevos->merge($usados)
            ->pluck('name')
            ->map(fn ($n) => preg_match('/(iPhone\s+\d+(?:\s+\w+)*)/i', $n, $m) ? $m[1] : null)
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('Store/Hubs/IPhone', [
            // Las preguntas del final salen del panel (Tienda online → Preguntas frecuentes)
            'faqs'      => Faq::deLugar('iphone'),
            'nuevos'    => $nuevos->take(8)->values(),
            'usados'    => $usados->take(8)->values(),
            'myskin'    => $myskin,
            'modelos'   => $modelos->all(),
            'totalNuevos' => $nuevos->count(),
            'totalUsados' => $usados->count(),
        ]);
    }

    public function myskin(): Response
    {
        $all    = $this->publicaciones();
        $fundas = $all->where('is_myskin', true)->values();

        $series = $fundas
            ->groupBy(fn ($p) => $this->extraerSerie($p['name'] . ' ' . implode(' ', $p['specs'])))
            ->map(fn ($items, $serie) => ['serie' => $serie, 'items' => $items->take(4)->values()->all()])
            ->filter(fn ($g) => $g['serie'] !== 'Otras')
            ->sortByDesc(fn ($g) => count($g['items']))
            ->values();

        $otras = $fundas
            ->filter(fn ($p) => $this->extraerSerie($p['name'] . ' ' . implode(' ', $p['specs'])) === 'Otras')
            ->take(4)
            ->values();

        return Inertia::render('Store/Hubs/MySkin', [
            'series'  => $series->all(),
            'otras'   => $otras,
            'total'   => $fundas->count(),
        ]);
    }

    public function seminuevos(): Response
    {
        $all      = $this->publicaciones();
        $sem      = $all->whereIn('condition', ['Seminuevo', 'Open Box'])->values();
        $celulares = $sem->where('category', 'celulares')->take(8)->values();
        $mac       = $sem->where('category', 'computadoras')->take(4)->values();
        $otros     = $sem->whereNotIn('category', ['celulares', 'computadoras'])->take(4)->values();

        return Inertia::render('Store/Hubs/Seminuevos', [
            'faqs'       => Faq::deLugar('seminuevos'),
            'celulares'  => $celulares,
            'mac'        => $mac,
            'otros'      => $otros,
            'total'      => $sem->count(),
        ]);
    }

    public function mac(): Response
    {
        $all  = $this->publicaciones();
        $macs = $all->where('category', 'computadoras')->values();

        return Inertia::render('Store/Hubs/Mac', [
            'nuevas'  => $macs->where('condition', 'Nuevo')->take(8)->values(),
            'usadas'  => $macs->whereIn('condition', ['Seminuevo', 'Open Box'])->take(8)->values(),
            'total'   => $macs->count(),
        ]);
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private function publicaciones(): Collection
    {
        return CatalogoPublicacion::with('imagenes')
            ->publicadoAhora()
            ->orderByDesc('destacado')
            ->orderBy('orden')
            ->orderByDesc('id')
            ->get()
            ->tap(fn ($pubs) => CatalogoPublicacion::precargarInventario($pubs))
            ->map(function (CatalogoPublicacion $pub) {
                $price     = $pub->precioVigente();
                $available = $pub->productoDisponible();
                return $this->serialize($pub, $price, $available);
            });
    }

    private function serialize(CatalogoPublicacion $pub, ?float $price, bool $available): array
    {
        return [
            'key'         => "{$pub->producto_tipo}:{$pub->producto_id}",
            'id'          => $pub->id,
            'name'        => $pub->titulo,
            'slug'        => $pub->slug,
            'url'         => route('store.product', $pub->slug),
            'price'       => (float) ($price ?? 0),
            'promo_price' => $pub->promocionActiva() ? (float) $pub->precio_promocional : null,
            'badge'       => $pub->badge,
            'category'    => $pub->categoria,
            'condition'   => $pub->condicion,
            'garantia'    => $pub->garantia,
            'is_myskin'   => $pub->esMyskin(),
            'is_featured' => $pub->destacado,
            'available'   => $available,
            'summary'     => $pub->resumen,
            'specs'       => $this->buildSpecs($pub),
            'images'      => $pub->imagenes->map(fn ($img) => [
                'url_card'  => $img->urlCard(),
                'url_thumb' => $img->urlThumb(),
                'alt'       => $img->alt ?: $pub->titulo,
            ])->toArray(),
            // NUNCA incluir: precio_costo, imei, serial, procedencia, ganancia
        ];
    }

    private function buildSpecs(CatalogoPublicacion $pub): array
    {
        $a = $pub->atributos ?? [];
        $specs = [];
        foreach (['capacidad', 'color', 'almacenamiento', 'chip', 'material', 'modelo_compatible'] as $k) {
            if (! empty($a[$k])) $specs[] = $a[$k];
        }
        return array_slice($specs, 0, 3);
    }

    private function extraerSerie(string $texto): string
    {
        $series = ['iPhone 16', 'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone X', 'iPhone SE'];
        foreach ($series as $s) {
            if (str_contains($texto, $s)) return $s;
        }
        return 'Otras';
    }
}
