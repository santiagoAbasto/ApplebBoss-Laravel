<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionTienda;
use App\Models\SeoPage;
use App\Support\Seo;
use App\Support\SeoEstado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Marketing y Google → «Google y redes sociales»: el título y la frase con que cada página de la tienda aparece en
 * Google, y la imagen que se ve cuando alguien comparte un enlace por WhatsApp o Facebook.
 *
 * El texto que sale de verdad lo resuelve `App\Support\Seo` en el servidor (se escribe en el HTML, sin JavaScript,
 * para que los buscadores y WhatsApp lo lean). Acá se edita lo de cada página y `App\Support\SeoEstado` dice qué le
 * falta o le sobra con las mismas medidas que usa Google.
 */
class SeoController extends Controller
{
    public function index(): Response
    {
        $pages     = SeoPage::orderBy('orden')->get()->map(fn (SeoPage $p) => SeoEstado::paraElPanel($p))->values()->all();
        $ogDefault = ConfiguracionTienda::get('seo_og_imagen_default');

        return Inertia::render('Admin/Seo/Index', [
            'pages'   => $pages,
            'global'  => [
                'seo_sitio_nombre'        => ConfiguracionTienda::get('seo_sitio_nombre') ?: ConfiguracionTienda::nombre(),
                'seo_descripcion_default' => ConfiguracionTienda::get('seo_descripcion_default', ''),
                'seo_og_imagen_default'   => $ogDefault,
                'og_default_url'          => $ogDefault ? Seo::absolute($ogDefault) : null,
            ],
            'baseUrl' => rtrim(config('app.url'), '/'),
            'sitio'   => SeoEstado::sitio(),
            'resumen' => SeoEstado::resumen($pages),
            'limites' => ['titulo' => SeoEstado::TITULO_MAX, 'desc_min' => SeoEstado::DESC_MIN, 'desc_max' => SeoEstado::DESC_MAX],
        ]);
    }

    public function update(Request $request, SeoPage $seoPage): RedirectResponse
    {
        $data = $request->validate([
            'title'       => 'nullable|string|max:191',
            'description' => 'nullable|string|max:320',
            'og_image'    => ['nullable', 'string', 'max:255', 'regex:#^seo/[A-Za-z0-9/_\-.]+$#'],
            'noindex'     => 'boolean',
            'canonical'   => ['nullable', 'string', 'max:255', 'regex:#^(https?://|/)[^\s<>"\']*$#'],
        ], [
            'title.max'       => 'El título no puede pasar de :max caracteres.',
            'description.max' => 'La descripción no puede pasar de :max caracteres.',
            'canonical.regex' => 'La dirección principal tiene que empezar con https:// o con /.',
        ]);

        $seoPage->update([
            'title'       => $this->clean($data['title'] ?? null),
            'description' => $this->clean($data['description'] ?? null),
            'og_image'    => $data['og_image'] ?? null,
            'noindex'     => (bool) ($data['noindex'] ?? false),
            'canonical'   => $data['canonical'] ?? null,
        ]);

        return back()->with('success', "SEO de \"{$seoPage->label}\" guardado.");
    }

    public function updateGlobal(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'seo_sitio_nombre'        => 'required|string|max:80',
            'seo_descripcion_default' => 'nullable|string|max:320',
            'seo_og_imagen_default'   => ['nullable', 'string', 'max:255', 'regex:#^seo/[A-Za-z0-9/_\-.]+$#'],
        ], [
            'seo_sitio_nombre.required' => 'El nombre del sitio es el que Google y las redes muestran junto a cada página.',
        ]);

        foreach ($data as $key => $value) {
            ConfiguracionTienda::updateOrCreate(
                ['clave' => $key],
                ['valor' => $this->clean($value) ?? '', 'grupo' => 'seo', 'tipo' => 'texto']
            );
        }
        ConfiguracionTienda::clearAllCache();

        return back()->with('success', 'Ajustes generales de SEO guardados.');
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate(
            ['imagen' => 'required|file|mimes:jpg,jpeg,png,webp|max:4096'],
            ['imagen.mimes' => 'La imagen tiene que ser JPG, PNG o WEBP.', 'imagen.max' => 'La imagen no puede pesar más de 4 MB.']
        );

        $file = $request->file('imagen');
        $path = $file->storeAs('seo', Str::uuid() . '.' . strtolower($file->getClientOriginalExtension() ?: $file->extension()), 'public');

        return response()->json(['path' => $path, 'url' => Storage::disk('public')->url($path)]);
    }

    private function clean(?string $value): ?string
    {
        $v = trim(strip_tags((string) $value));
        return $v === '' ? null : $v;
    }
}
