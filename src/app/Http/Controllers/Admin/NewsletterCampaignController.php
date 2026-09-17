<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\DispatchNewsletterCampaign;
use App\Mail\NewsletterCampaignMail;
use App\Models\CatalogoPublicacion;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use App\Support\NewsletterContent;
use App\Support\NewsletterEstado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Marketing y Google → Campañas: los correos que se les mandan a los suscriptores.
 *
 * El envío no sale de esta pantalla: la campaña pasa a «enviando» y la manda la cola por lotes
 * (`DispatchNewsletterCampaign`), para no colgar el navegador ni pasarse del límite del proveedor de correo.
 * Lo que hace falta para poder enviar (el correo del servidor y la cola) lo dice `App\Support\NewsletterEstado`.
 */
class NewsletterCampaignController extends Controller
{
    public function index(): Response
    {
        $campaigns = NewsletterCampaign::latest()->paginate(20)
            ->through(fn (NewsletterCampaign $c) => $c->paraElPanel());

        return Inertia::render('Admin/Newsletter/Campaigns', [
            'campaigns' => $campaigns,
            'stats'     => [
                'borradores' => NewsletterCampaign::where('estado', 'borrador')->count(),
                'enviadas'   => NewsletterCampaign::enviadas()->count(),
                'correos'    => (int) NewsletterCampaign::enviadas()->sum('enviados'),
            ],
            // Si falta algo para poder enviar, la pantalla lo dice antes de que escriban la campaña
            'estado' => NewsletterEstado::resumen(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $campaign = NewsletterCampaign::create([
            'asunto'     => 'Nueva campaña',
            'bloques'    => [
                ['tipo' => 'titulo', 'texto' => 'Título de tu campaña'],
                ['tipo' => 'texto',  'texto' => 'Escribe aquí el mensaje para tus suscriptores.'],
                ['tipo' => 'boton',  'texto' => 'Ver catálogo', 'url' => '/catalogo'],
            ],
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->route('admin.newsletter.campaigns.edit', $campaign);
    }

    public function edit(NewsletterCampaign $campaign): Response
    {
        $seleccion = $campaign->seleccion
            ? NewsletterSubscriber::active()->whereIn('id', $campaign->seleccion)->get(['id', 'email', 'nombre'])
            : collect();

        $resumen = $campaign->recipients()->selectRaw('estado, count(*) as total')->groupBy('estado')->pluck('total', 'estado');

        return Inertia::render('Admin/Newsletter/CampaignEdit', [
            'campaign' => [
                'id'                => $campaign->id,
                'asunto'            => $campaign->asunto,
                'preheader'         => $campaign->preheader,
                'bloques'           => $campaign->bloques ?? [],
                'destino'           => $campaign->destino,
                'adjuntar_imagenes' => $campaign->adjuntar_imagenes,
                'estado'            => $campaign->estado,
                'total'             => $campaign->total,
                'enviados'          => $campaign->enviados,
                'fallidos'          => $campaign->fallidos,
                'iniciada_at'       => $campaign->iniciada_at?->toIso8601String(),
                'finalizada_at'     => $campaign->finalizada_at?->toIso8601String(),
            ],
            'seleccion'      => $seleccion,
            'activos'        => NewsletterSubscriber::active()->count(),
            'resumen'        => $resumen,
            'fallidosDetalle'=> $campaign->recipients()->where('estado', 'fallido')->limit(50)->get(['email', 'error']),
            'productosInfo'  => $this->productosDeBloques($campaign->bloques ?? []),
            'remitente'      => config('mail.from.address'),
            // La misma regla del listado: por qué todavía no se puede enviar
            'motivo'         => $campaign->porQueNoSePuedeEnviar(),
            'estado'         => NewsletterEstado::resumen(),
        ]);
    }

    public function update(Request $request, NewsletterCampaign $campaign): JsonResponse
    {
        abort_unless($campaign->editable(), 422, 'La campaña ya fue enviada y no se puede editar.');

        $data = $this->validateCampaign($request);
        $campaign->update($data);

        return response()->json(['ok' => true, 'bloques' => $campaign->bloques]);
    }

    /** Vista previa en vivo con lo que hay en el editor (sin guardar). */
    public function preview(Request $request): HttpResponse
    {
        $data = $request->validate([
            'asunto'    => 'nullable|string|max:191',
            'preheader' => 'nullable|string|max:191',
            'bloques'   => 'array|max:' . NewsletterContent::MAX_BLOQUES,
        ]);

        $campaign = new NewsletterCampaign([
            'asunto'    => $data['asunto'] ?? '',
            'preheader' => $data['preheader'] ?? null,
            'bloques'   => NewsletterContent::sanitize($data['bloques'] ?? []),
        ]);

        $mail = new NewsletterCampaignMail($campaign, NewsletterContent::forView($campaign->bloques), '#');

        return response($mail->render(), 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'imagen' => 'required|file|mimes:jpg,jpeg,png,gif,webp|max:5120',
        ]);

        $file = $request->file('imagen');
        $path = $file->storeAs(
            'newsletter/' . now()->format('Y/m'),
            Str::uuid() . '.' . strtolower($file->getClientOriginalExtension() ?: $file->extension()),
            'public'
        );

        return response()->json(['url' => '/storage/' . $path]);
    }

    public function sendTest(Request $request, NewsletterCampaign $campaign): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email:rfc|max:191']);

        $correo = NewsletterEstado::correo();
        if (! $correo['listo']) {
            return response()->json(['message' => $correo['falta']], 422);
        }

        try {
            Mail::to($data['email'])->send(new NewsletterCampaignMail(
                $campaign,
                NewsletterContent::forView($campaign->bloques ?? []),
                route('newsletter.baja', 'prueba'),
                esPrueba: true,
            ));
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'No se pudo enviar la prueba: ' . NewsletterEstado::explicarFallo($e),
            ], 422);
        }

        return response()->json(['ok' => true]);
    }

    public function send(NewsletterCampaign $campaign): JsonResponse
    {
        if ($motivo = $campaign->porQueNoSePuedeEnviar()) {
            return response()->json(['message' => $motivo], 422);
        }

        $correo = NewsletterEstado::correo();
        if (! $correo['listo']) {
            return response()->json(['message' => $correo['falta']], 422);
        }

        $destinatarios = $campaign->destinatarios();
        $campaign->update(['estado' => 'enviando', 'iniciada_at' => now(), 'total' => $destinatarios]);
        DispatchNewsletterCampaign::dispatch($campaign->id);

        return response()->json(['ok' => true, 'total' => $destinatarios]);
    }

    public function cancel(NewsletterCampaign $campaign): JsonResponse
    {
        if ($campaign->estado === 'enviando') {
            $campaign->update(['estado' => 'cancelada', 'finalizada_at' => now()]);
        }

        return response()->json(['ok' => true, 'estado' => $campaign->estado]);
    }

    /** Estado en vivo durante el envío. */
    public function status(NewsletterCampaign $campaign): JsonResponse
    {
        return response()->json($campaign->only(['estado', 'total', 'enviados', 'fallidos']) + ['progreso' => $campaign->progreso()]);
    }

    public function duplicate(Request $request, NewsletterCampaign $campaign): RedirectResponse
    {
        $copy = NewsletterCampaign::create([
            'asunto'            => Str::limit('Copia de ' . $campaign->asunto, 191, ''),
            'preheader'         => $campaign->preheader,
            'bloques'           => $campaign->bloques,
            'destino'           => $campaign->destino,
            'seleccion'         => $campaign->seleccion,
            'adjuntar_imagenes' => $campaign->adjuntar_imagenes,
            'created_by'        => $request->user()?->id,
        ]);

        return redirect()->route('admin.newsletter.campaigns.edit', $copy);
    }

    public function destroy(NewsletterCampaign $campaign): RedirectResponse
    {
        abort_if($campaign->estado === 'enviando', 422, 'Cancela el envío antes de eliminar la campaña.');
        $campaign->delete();

        return redirect()->route('admin.newsletter.campaigns.index')->with('success', 'Campaña eliminada.');
    }

    /** Buscador de publicaciones para el bloque "Producto". */
    public function products(Request $request): JsonResponse
    {
        $q = trim((string) $request->string('q'));

        $items = CatalogoPublicacion::with('imagenes')
            ->publicadoAhora()
            ->when($q !== '', fn ($qb) => $qb->whereRaw('LOWER(titulo) LIKE ?', ['%' . self::escaparLike($q) . '%']))
            ->orderByDesc('id')
            ->limit(12)
            ->get();

        return response()->json($items->map(fn ($p) => $this->productoInfo($p))->values());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /** Búsqueda que funciona igual en PostgreSQL, MySQL y SQLite (los tests corren en SQLite). */
    public static function escaparLike(string $q): string
    {
        return \App\Support\Busqueda::escapar($q);
    }

    private function validateCampaign(Request $request): array
    {
        $data = $request->validate([
            'asunto'            => 'required|string|max:191',
            'preheader'         => 'nullable|string|max:191',
            'bloques'           => 'array|max:' . NewsletterContent::MAX_BLOQUES,
            'destino'           => 'required|in:todos,seleccion',
            'seleccion'         => 'array|max:5000',
            'seleccion.*'       => 'integer',
            'adjuntar_imagenes' => 'boolean',
        ]);

        return [
            'asunto'            => strip_tags($data['asunto']),
            'preheader'         => isset($data['preheader']) ? strip_tags($data['preheader']) : null,
            'bloques'           => NewsletterContent::sanitize($data['bloques'] ?? []),
            'destino'           => $data['destino'],
            'seleccion'         => $data['destino'] === 'seleccion' ? array_values(array_unique($data['seleccion'] ?? [])) : null,
            'adjuntar_imagenes' => (bool) ($data['adjuntar_imagenes'] ?? false),
        ];
    }

    private function productosDeBloques(array $bloques): array
    {
        $slugs = collect($bloques)->where('tipo', 'producto')->pluck('slug')->unique()->all();
        if (! $slugs) return [];

        return CatalogoPublicacion::with('imagenes')->whereIn('slug', $slugs)->get()
            ->mapWithKeys(fn ($p) => [$p->slug => $this->productoInfo($p)])
            ->all();
    }

    private function productoInfo(CatalogoPublicacion $p): array
    {
        $img = $p->imagenes->firstWhere('es_principal', true) ?? $p->imagenes->first();

        return [
            'slug'       => $p->slug,
            'titulo'     => $p->titulo,
            'precio'     => $p->precioVigente(),
            'disponible' => $p->productoDisponible(),
            'imagen'     => $img?->urlThumb(),
        ];
    }
}
