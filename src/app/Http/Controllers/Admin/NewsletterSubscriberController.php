<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use App\Support\NewsletterEstado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Marketing y Google → Suscriptores: la lista de quienes reciben las campañas.
 *
 * Se llena sola con el formulario del final de la tienda; también se agregan a mano o se importa una lista.
 * La baja nunca se pisa: quien se dio de baja desde un correo queda de baja, y solo se reactiva a pedido suyo.
 */
class NewsletterSubscriberController extends Controller
{
    public function index(Request $request): Response
    {
        $q      = trim((string) $request->string('q'));
        $filtro = (string) $request->string('filtro', 'activos');

        $subs = $this->query($q, $filtro)
            ->latest('id')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (NewsletterSubscriber $s) => [
                'id'              => $s->id,
                'email'           => $s->email,
                'nombre'          => $s->nombre,
                'source'          => $s->source,
                'created_at'      => $s->created_at?->toIso8601String(),
                'unsubscribed_at' => $s->unsubscribed_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Newsletter/Subscribers', [
            'subscribers' => $subs,
            'filters'     => ['q' => $q, 'filtro' => $filtro],
            'counts'      => [
                'activos'   => NewsletterSubscriber::active()->count(),
                'bajas'     => NewsletterSubscriber::whereNotNull('unsubscribed_at')->count(),
                'todos'     => NewsletterSubscriber::count(),
                // De dónde salieron: el formulario de la tienda es el que interesa que crezca
                'del_sitio' => NewsletterSubscriber::where('source', 'footer')->count(),
                'del_mes'   => NewsletterSubscriber::where('created_at', '>=', now()->startOfMonth())->count(),
            ],
            'estado' => NewsletterEstado::resumen(),
        ]);
    }

    /** Búsqueda JSON (selector de destinatarios en campañas). Solo activos. */
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->string('q'));

        return response()->json(
            $this->query($q, 'activos')->orderBy('email')->limit(50)->get(['id', 'email', 'nombre'])
        );
    }

    public function store(Request $request): RedirectResponse
    {
        $data  = $request->validate([
            'email'  => 'required|email:rfc|max:191',
            'nombre' => 'nullable|string|max:120',
        ]);
        $email = Str::lower(trim($data['email']));

        $sub = NewsletterSubscriber::firstOrCreate(['email' => $email], [
            'nombre' => isset($data['nombre']) ? strip_tags($data['nombre']) : null,
            'source' => 'admin',
        ]);
        if ($sub->unsubscribed_at) {
            $sub->update(['unsubscribed_at' => null]);
        }

        return back()->with('success', 'Suscriptor agregado.');
    }

    /** Importa una lista pegada (separada por comas, espacios o saltos de línea). */
    public function import(Request $request): RedirectResponse
    {
        $data = $request->validate(['emails' => 'required|string|max:200000']);

        $candidatos = collect(preg_split('/[\s,;]+/', Str::lower($data['emails'])))
            ->map(fn ($e) => trim($e, " \t\n\r\0\x0B<>\"'"))
            ->filter()
            ->unique();

        $validos   = $candidatos->filter(fn ($e) => strlen($e) <= 191 && filter_var($e, FILTER_VALIDATE_EMAIL))->take(5000);
        $invalidos = $candidatos->count() - $validos->count();
        $existentes = NewsletterSubscriber::whereIn('email', $validos->all())->pluck('email');
        $nuevos    = $validos->diff($existentes);

        $now = now();
        foreach ($nuevos->chunk(500) as $chunk) {
            NewsletterSubscriber::insertOrIgnore($chunk->map(fn ($email) => [
                'email'      => $email,
                'token'      => Str::random(48),
                'source'     => 'importacion',
                'created_at' => $now,
                'updated_at' => $now,
            ])->values()->all());
        }

        return back()->with('success', sprintf(
            'Importación lista: %d %s, %d ya %s en la lista y %d %s mal escrito%s. A los que estaban de baja no se los reactivó.',
            $nuevos->count(), $nuevos->count() === 1 ? 'correo nuevo' : 'correos nuevos',
            $existentes->count(), $existentes->count() === 1 ? 'estaba' : 'estaban',
            $invalidos, $invalidos === 1 ? 'estaba' : 'estaban', $invalidos === 1 ? '' : 's'
        ));
    }

    public function update(Request $request, NewsletterSubscriber $subscriber): RedirectResponse
    {
        $data = $request->validate(['baja' => 'required|boolean']);
        $subscriber->update(['unsubscribed_at' => $data['baja'] ? now() : null]);

        return back()->with('success', $data['baja']
            ? $subscriber->email . ' ya no va a recibir campañas.'
            : $subscriber->email . ' vuelve a recibir campañas. Hazlo solo si te lo pidió.');
    }

    public function destroy(NewsletterSubscriber $subscriber): RedirectResponse
    {
        $email = $subscriber->email;
        $subscriber->delete();

        return back()->with('success', $email . ' se borró de la lista.');
    }

    public function export(Request $request): StreamedResponse
    {
        $filtro = (string) $request->string('filtro', 'todos');

        return response()->streamDownload(function () use ($filtro) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // BOM para que Excel respete acentos
            fputcsv($out, ['email', 'nombre', 'estado', 'origen', 'fecha_alta']);
            $this->query('', $filtro)->orderBy('id')->chunk(1000, function ($rows) use ($out) {
                foreach ($rows as $s) {
                    fputcsv($out, [
                        $s->email,
                        $s->nombre,
                        $s->unsubscribed_at ? 'baja' : 'activo',
                        $s->source,
                        $s->created_at?->format('Y-m-d H:i'),
                    ]);
                }
            });
            fclose($out);
        }, 'suscriptores-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function query(string $q, string $filtro)
    {
        return NewsletterSubscriber::query()
            ->when($filtro === 'activos', fn ($qb) => $qb->whereNull('unsubscribed_at'))
            ->when($filtro === 'bajas', fn ($qb) => $qb->whereNotNull('unsubscribed_at'))
            ->when($q !== '', function ($qb) use ($q) {
                $like = '%' . NewsletterCampaignController::escaparLike($q) . '%';
                $qb->where(fn ($w) => $w
                    ->whereRaw('LOWER(email) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(COALESCE(nombre, \'\')) LIKE ?', [$like]));
            });
    }
}
