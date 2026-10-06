<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Diagnostico;
use App\Models\Tecnico;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Panel → Diagnósticos: el informe técnico de un equipo, con el membrete, la firma y el sello de la tienda.
 * Se carga lo que reporta el cliente al recibirlo; las pruebas y la conclusión, cuando el técnico lo revisó.
 */
class DiagnosticoController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Diagnosticos/Index', [
            'diagnosticos' => Diagnostico::latest()->get()->map(fn (Diagnostico $d) => [
                'id'               => $d->id,
                'codigo'           => $d->codigo,
                'fecha'            => $d->fecha?->toDateString(),
                'cliente_nombre'   => $d->cliente_nombre,
                'cliente_telefono' => $d->cliente_telefono,
                'cliente_correo'   => $d->cliente_correo,
                'equipo'           => $d->equipo,
                'identificador'    => $d->identificador,
                'falla_reportada'  => $d->falla_reportada,
                'pruebas'          => $d->pruebas ?? [],
                'conclusion'       => $d->conclusion,
                'recomendacion'    => $d->recomendacion,
                'tecnico'          => $d->tecnico,
                'listo'            => $d->listo(),
                'falta'            => $d->queFalta(),
            ])->values(),
            'pruebasSugeridas' => Diagnostico::PRUEBAS,
            'resultados'       => Diagnostico::RESULTADOS,
            'tecnicos'         => Tecnico::where('activo', true)->orderBy('nombre')->pluck('nombre'),
            'hoy'              => now()->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $diagnostico = Diagnostico::create($this->datos($request) + ['user_id' => $request->user()->id]);

        return back()->with('success', "Se guardó el diagnóstico {$diagnostico->codigo}.");
    }

    public function update(Request $request, Diagnostico $diagnostico): RedirectResponse
    {
        $diagnostico->update($this->datos($request));

        return back()->with('success', "Se guardó el diagnóstico {$diagnostico->codigo}.");
    }

    public function destroy(Diagnostico $diagnostico): RedirectResponse
    {
        $diagnostico->delete();

        return back()->with('success', "Se borró el diagnóstico {$diagnostico->codigo}.");
    }

    public function pdf(Diagnostico $diagnostico)
    {
        return Pdf::loadView('pdf.diagnostico', compact('diagnostico'))->stream("informe-tecnico-{$diagnostico->codigo}.pdf");
    }

    private function datos(Request $request): array
    {
        $v = $request->validate([
            'fecha'                => ['required', 'date'],
            'cliente_nombre'       => ['required', 'string', 'max:255'],
            'cliente_telefono'     => ['nullable', 'string', 'max:20'],
            'cliente_correo'       => ['nullable', 'email', 'max:255'],
            'equipo'               => ['required', 'string', 'max:255'],
            'identificador'        => ['nullable', 'string', 'max:60'],
            'falla_reportada'      => ['required', 'string', 'max:5000'],
            'pruebas'              => ['nullable', 'array', 'max:40'],
            'pruebas.*.prueba'     => ['nullable', 'string', 'max:80'],
            'pruebas.*.resultado'  => ['nullable', 'in:' . implode(',', array_keys(Diagnostico::RESULTADOS))],
            'pruebas.*.detalle'    => ['nullable', 'string', 'max:500'],
            'conclusion'           => ['nullable', 'string', 'max:5000'],
            'recomendacion'        => ['nullable', 'string', 'max:5000'],
            'tecnico'              => ['nullable', 'string', 'max:255'],
        ], [
            'cliente_nombre.required'  => 'Escribe el nombre del cliente.',
            'equipo.required'          => 'Escribe el equipo, por ejemplo «iPhone 15».',
            'falla_reportada.required' => 'Escribe la falla que reporta el cliente.',
            'cliente_correo.email'     => 'Revisa el correo del cliente.',
        ]);

        $limpio = fn ($t) => trim(strip_tags((string) $t)) ?: null;

        // Una prueba sin nombre o sin resultado no se guarda: no se hizo
        $pruebas = collect($v['pruebas'] ?? [])
            ->map(fn ($p) => ['prueba' => $limpio($p['prueba'] ?? ''), 'resultado' => $p['resultado'] ?? null, 'detalle' => $limpio($p['detalle'] ?? '')])
            ->filter(fn ($p) => $p['prueba'] && $p['resultado'])
            ->unique(fn ($p) => mb_strtolower($p['prueba']))
            ->values()->all();

        return [
            'fecha'            => $v['fecha'],
            'cliente_nombre'   => $limpio($v['cliente_nombre']),
            'cliente_telefono' => $limpio($v['cliente_telefono'] ?? null),
            'cliente_correo'   => $limpio($v['cliente_correo'] ?? null),
            'equipo'           => $limpio($v['equipo']),
            'identificador'    => $limpio($v['identificador'] ?? null),
            'falla_reportada'  => $limpio($v['falla_reportada']),
            'pruebas'          => $pruebas,
            'conclusion'       => $limpio($v['conclusion'] ?? null),
            'recomendacion'    => $limpio($v['recomendacion'] ?? null),
            'tecnico'          => $limpio($v['tecnico'] ?? null),
        ];
    }
}
