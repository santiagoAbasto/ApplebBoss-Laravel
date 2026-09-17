<?php

namespace App\Models;

use App\Support\Seo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Una novedad de la tienda: una publicación con fecha (un equipo que llegó, una guía, un aviso).
 *
 * Vive en /novedades/…, se lista en /novedades y las más nuevas salen en el inicio con la sección «Novedades» de
 * Portada. Se ve cuando está publicada y ya llegó su fecha: con una fecha futura queda programada y se publica sola.
 * Desde que se publica por primera vez, su dirección no cambia: es el enlace que se comparte.
 */
class Novedad extends Model
{
    protected $table = 'novedades';

    /** El mismo sufijo que usan las categorías, las colecciones y las páginas para el título en Google. */
    public const SUFIJO_GOOGLE = CatalogCategory::SUFIJO_GOOGLE;

    /** Para el tiempo de lectura. */
    private const PALABRAS_POR_MINUTO = 200;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content_blocks',
        'author',
        'status',
        'published_at',
        'seo_title',
        'seo_description',
        'indexable',
        'imagen_original',
        'imagen_card',
        'imagen_detalle',
        'imagen_meta',
    ];

    protected $casts = [
        'content_blocks' => 'array',
        'imagen_meta'    => 'array',
        'published_at'   => 'datetime',
        'indexable'      => 'boolean',
    ];

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
                     ->where(fn ($q) => $q->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }

    /** De la más nueva a la más vieja. */
    public function scopeEnOrden(Builder $query): Builder
    {
        return $query->orderByDesc('published_at')->orderByDesc('id');
    }

    public function isPublished(): bool
    {
        return $this->status === 'published'
            && ($this->published_at === null || $this->published_at->lte(now()));
    }

    /** borrador, programada (publicada con fecha futura) o publicada. */
    public function estado(): string
    {
        if ($this->status !== 'published') {
            return 'borrador';
        }

        return $this->published_at?->isFuture() ? 'programada' : 'publicada';
    }

    /** Se publicó alguna vez: desde ahí su dirección no cambia. */
    public function direccionFija(): bool
    {
        return $this->published_at !== null;
    }

    public function urlPublica(): string
    {
        return '/novedades/' . $this->slug;
    }

    public function tituloGoogle(): string
    {
        return $this->seo_title ?: $this->title . self::SUFIJO_GOOGLE;
    }

    /** La foto principal: `card` para las tarjetas, `detalle` para la ficha y Google. */
    public function urlImagen(string $variante = 'card'): ?string
    {
        $ruta = $variante === 'detalle' ? ($this->imagen_detalle ?: $this->imagen_card) : $this->imagen_card;

        return $ruta ? asset('storage/' . $ruta) : null;
    }

    // ─── El cuerpo ───────────────────────────────────────────────────────────

    /** El texto que se edita en el panel: los bloques de texto y títulos, en HTML. */
    public function cuerpoHtml(): string
    {
        return collect($this->content_blocks ?? [])
            ->map(fn ($b) => match ($b['type'] ?? null) {
                'text'    => (string) ($b['content'] ?? ''),
                'heading' => '<h2>' . e($b['content'] ?? '') . '</h2>',
                default   => '',
            })
            ->implode('');
    }

    /**
     * Los bloques con el texto nuevo del editor en lugar de los de texto y títulos. Las imágenes y las citas que ya
     * tenía se quedan donde estaban (el editor no las muestra, pero no se pierden).
     */
    public function bloquesConCuerpo(string $html): array
    {
        $cuerpo = trim(strip_tags($html)) === '' ? [] : [['type' => 'text', 'content' => $html]];
        $bloques = [];
        $puesto = false;

        foreach ($this->content_blocks ?? [] as $bloque) {
            if (in_array($bloque['type'] ?? null, ['text', 'heading'], true)) {
                if (! $puesto) {
                    array_push($bloques, ...$cuerpo);
                    $puesto = true;
                }
                continue;
            }
            $bloques[] = $bloque;
        }

        return $puesto ? $bloques : [...$cuerpo, ...$bloques];
    }

    /** Cuántas imágenes y citas tiene además del texto. */
    public function bloquesExtra(): int
    {
        return collect($this->content_blocks ?? [])->whereIn('type', ['image', 'quote'])->count();
    }

    public function textoPlano(): string
    {
        $html = collect($this->content_blocks ?? [])
            ->map(fn ($b) => match ($b['type'] ?? null) {
                'text'             => (string) ($b['content'] ?? ''),
                'heading', 'quote' => e($b['content'] ?? ''),
                default            => '',
            })
            ->implode(' ');

        // Las etiquetas se cambian por un espacio: si no, «<h2>Llegó</h2><p>El…» quedaría pegado
        $texto = html_entity_decode(strip_tags(preg_replace('/<[^>]+>/', ' ', $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim(preg_replace('/\s+/u', ' ', $texto));
    }

    public function palabras(): int
    {
        $texto = $this->textoPlano();

        return $texto === '' ? 0 : count(preg_split('/\s+/u', $texto));
    }

    public function minutosLectura(): int
    {
        return max(1, (int) ceil($this->palabras() / self::PALABRAS_POR_MINUTO));
    }

    /** Lo que le falta para verse bien. Sin texto no se puede publicar; sin resumen o sin foto, sí. */
    public function faltantes(): array
    {
        return array_values(array_filter([
            $this->palabras() === 0 ? 'texto' : null,
            blank($this->excerpt) ? 'resumen' : null,
            $this->imagen_card ? null : 'foto',
        ]));
    }

    // ─── Lo que ve la tienda ─────────────────────────────────────────────────

    /** La tarjeta de la novedad: la usan el inicio, /novedades, «Otras novedades» y la vista previa del panel. */
    public function tarjeta(): array
    {
        return [
            'id'      => $this->id,
            'titulo'  => $this->title,
            'url'     => $this->urlPublica(),
            'resumen' => $this->excerpt,
            'imagen'  => $this->urlImagen('card'),
            'autor'   => $this->author,
            'fecha'   => $this->published_at?->toIso8601String(),
            'minutos' => $this->minutosLectura(),
        ];
    }

    /** Las novedades que se ven hoy, de la más nueva a la más vieja. Es la única consulta de la tienda. */
    public static function paraLaTienda(?int $limite = null, ?int $excepto = null): array
    {
        return self::published()
            ->enOrden()
            ->when($excepto, fn ($q) => $q->where('id', '!=', $excepto))
            ->when($limite, fn ($q) => $q->limit($limite))
            ->get()
            ->map(fn (self $n) => $n->tarjeta())
            ->values()
            ->all();
    }

    /** Lo que lee Google de la novedad (schema.org BlogPosting). */
    public function datosParaGoogle(): array
    {
        $sitio = ConfiguracionTienda::get('seo_sitio_nombre') ?: 'Apple Boss';
        $imagen = $this->urlImagen('detalle');

        return array_filter([
            '@context'         => 'https://schema.org',
            '@type'            => 'BlogPosting',
            'headline'         => Str::limit($this->title, 110, ''),
            'description'      => $this->seo_description ?: $this->excerpt,
            'image'            => $imagen ? [Seo::absolute($imagen)] : null,
            'datePublished'    => $this->published_at?->toIso8601String(),
            'dateModified'     => $this->updated_at?->toIso8601String(),
            'author'           => $this->author
                ? ['@type' => 'Person', 'name' => $this->author]
                : ['@type' => 'Organization', 'name' => $sitio],
            'publisher'        => [
                '@type' => 'Organization',
                'name'  => $sitio,
                'logo'  => ['@type' => 'ImageObject', 'url' => url('/images/logo-appleboss.png')],
            ],
            'mainEntityOfPage' => url($this->urlPublica()),
        ]);
    }
}
