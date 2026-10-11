<?php

namespace App\Support\Trafico;

use App\Models\CatalogoPublicacion;
use App\Models\EventoWeb;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Lo que muestra Tienda online → Tráfico, sacado de `eventos_web`. Solo tráfico humano, salvo el conteo de bots.
 * Todo agrupa por `dia` y `hora`, que se guardan ya en hora de La Paz: así sirve igual en PostgreSQL y en SQLite.
 */
class Panel
{
    public function __construct(private int $dias)
    {
    }

    public function datos(): array
    {
        $visitas = $this->paginas()->count();

        return [
            'resumen'   => $this->resumen($visitas),
            'serie'     => $this->serie(),
            'horas'     => $this->horas(),
            'paginas'   => $this->top($this->paginas(), 'ruta', 12),
            'origenes'  => $this->origenes(),
            'paises'    => $this->paises(),
            'dispositivos' => $this->etiquetadas('dispositivo', ['movil' => 'Celular', 'escritorio' => 'Computadora', 'tablet' => 'Tablet']),
            'navegadores'  => $this->etiquetadas('navegador', ['chrome' => 'Chrome', 'safari' => 'Safari', 'edge' => 'Edge', 'firefox' => 'Firefox', 'samsung' => 'Samsung', 'opera' => 'Opera', 'otro' => 'Otro']),
            'embudo'    => $this->embudo($visitas),
            'productos' => $this->productosVistos(),
            'agregados' => $this->top($this->evento('carrito_agregar'), 'etiqueta', 8),
            'busquedas' => $this->top($this->evento('busqueda'), 'etiqueta', 10),
            'sin_resultados' => $this->top($this->evento('busqueda_sin_resultados'), 'etiqueta', 10),
        ];
    }

    private function desde(): string
    {
        return now(Medicion::ZONA)->subDays($this->dias - 1)->toDateString();
    }

    private function base(): Builder
    {
        return DB::table('eventos_web')->where('bot', false)->where('dia', '>=', $this->desde());
    }

    private function paginas(): Builder
    {
        return $this->base()->where('nombre', 'pagina');
    }

    private function evento(string $nombre): Builder
    {
        return $this->base()->where('nombre', $nombre);
    }

    private function resumen(int $visitas): array
    {
        $antesDesde = now(Medicion::ZONA)->subDays(2 * $this->dias - 1)->toDateString();
        $anteriores = DB::table('eventos_web')->where('bot', false)->where('nombre', 'pagina')
            ->where('dia', '>=', $antesDesde)->where('dia', '<', $this->desde());

        return [
            'visitas'             => $visitas,
            'visitantes'          => $this->paginas()->distinct()->count('visitante'),
            'visitas_antes'       => (clone $anteriores)->count(),
            'visitantes_antes'    => (clone $anteriores)->distinct()->count('visitante'),
            'whatsapp'            => $this->evento('whatsapp')->count(),
            'pedidos'             => $this->evento('pedido_creado')->count(),
            'solicitudes'         => $this->base()->whereIn('nombre', ['solicitud_servicio', 'solicitud_tradein'])->count(),
            'bots'                => DB::table('eventos_web')->where('bot', true)->where('nombre', 'pagina')->where('dia', '>=', $this->desde())->count(),
        ];
    }

    /** Un punto por día, con ceros donde no hubo visitas, terminando hoy. */
    private function serie(): array
    {
        $filas = $this->paginas()->selectRaw('dia, count(*) as visitas, count(distinct visitante) as visitantes')
            ->groupBy('dia')->get()->keyBy(fn ($f) => substr((string) $f->dia, 0, 10));

        return collect(range($this->dias - 1, 0))->map(function ($atras) use ($filas) {
            $dia = now(Medicion::ZONA)->subDays($atras)->toDateString();
            $f = $filas->get($dia);

            return ['dia' => $dia, 'visitas' => (int) ($f->visitas ?? 0), 'visitantes' => (int) ($f->visitantes ?? 0)];
        })->values()->all();
    }

    /** 24 valores: visitas por hora del día en La Paz. */
    private function horas(): array
    {
        $porHora = $this->paginas()->selectRaw('hora, count(*) as total')->groupBy('hora')->pluck('total', 'hora');

        return collect(range(0, 23))->map(fn ($h) => (int) ($porHora[$h] ?? 0))->all();
    }

    private function top(Builder $q, string $columna, int $cuantos): array
    {
        return $q->whereNotNull($columna)->selectRaw("{$columna} as etiqueta, count(*) as total")
            ->groupBy($columna)->orderByDesc('total')->limit($cuantos)->get()
            ->map(fn ($f) => ['etiqueta' => (string) $f->etiqueta, 'total' => (int) $f->total])->all();
    }

    /** De dónde llegan: Google, redes, WhatsApp… El tráfico directo es el que no trae referente. */
    private function origenes(): array
    {
        $nombres = [
            'google.' => 'Google', 'bing.com' => 'Bing', 'chatgpt.com' => 'ChatGPT', 'openai.com' => 'ChatGPT',
            'perplexity.ai' => 'Perplexity', 'gemini.google.com' => 'Gemini', 'copilot.microsoft.com' => 'Copilot',
            'facebook.com' => 'Facebook', 'instagram.com' => 'Instagram', 'tiktok.com' => 'TikTok',
            'whatsapp.com' => 'WhatsApp', 'wa.me' => 'WhatsApp', 't.co' => 'X (Twitter)', 'youtube.com' => 'YouTube',
        ];
        $nombre = function (string $host) use ($nombres) {
            foreach ($nombres as $parte => $etiqueta) {
                if (str_contains($host, $parte) && ($parte !== 'google.' || ! str_starts_with($host, 'gemini.'))) {
                    return $etiqueta;
                }
            }

            return $host;
        };

        // Solo la primera página de cada visita trae referente: el resto de sus páginas no cuenta como origen
        $filas = $this->paginas()->selectRaw('referente, count(distinct visitante) as total')->groupBy('referente')->get();

        return $filas->groupBy(fn ($f) => $f->referente === null ? 'Directo o escrito a mano' : $nombre($f->referente))
            ->map(fn ($g, $etiqueta) => ['etiqueta' => $etiqueta, 'total' => (int) $g->sum('total')])
            ->sortByDesc('total')->take(10)->values()->all();
    }

    /** Código de dos letras: el nombre en español lo pone el navegador (Intl.DisplayNames); el servidor no tiene intl. */
    private function paises(): array
    {
        return $this->top($this->paginas(), 'pais', 8);
    }

    private function etiquetadas(string $columna, array $nombres): array
    {
        return collect($this->top($this->paginas(), $columna, 10))
            ->map(fn ($f) => ['etiqueta' => $nombres[$f['etiqueta']] ?? $f['etiqueta'], 'total' => $f['total']])->all();
    }

    /** De la visita al pedido: cuántos llegan a cada paso. */
    private function embudo(int $visitas): array
    {
        return [
            ['paso' => 'Visitas', 'total' => $visitas],
            ['paso' => 'Vieron un producto', 'total' => $this->paginas()->where('ruta', 'like', '/productos/%')->count()],
            ['paso' => 'Agregaron al carrito', 'total' => $this->evento('carrito_agregar')->count()],
            ['paso' => 'Empezaron la compra', 'total' => $this->paginas()->where('ruta', '/checkout')->count()],
            ['paso' => 'Hicieron el pedido', 'total' => $this->evento('pedido_creado')->count()],
        ];
    }

    /** Los productos más vistos, con su nombre en la tienda (el slug solo si ya no está publicado). */
    private function productosVistos(): array
    {
        $top = $this->top($this->paginas()->where('ruta', 'like', '/productos/%'), 'ruta', 10);
        $slugs = array_map(fn ($f) => substr($f['etiqueta'], strlen('/productos/')), $top);
        $titulos = CatalogoPublicacion::whereIn('slug', $slugs)->pluck('titulo', 'slug');

        return array_map(function ($f) use ($titulos) {
            $slug = substr($f['etiqueta'], strlen('/productos/'));

            return ['etiqueta' => $titulos[$slug] ?? $slug, 'ruta' => $f['etiqueta'], 'total' => $f['total']];
        }, $top);
    }
}
