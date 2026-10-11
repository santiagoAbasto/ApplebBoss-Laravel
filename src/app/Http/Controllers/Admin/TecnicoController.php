<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Diagnostico;
use App\Models\ServicioTecnico;
use App\Models\Tecnico;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sistema → Técnicos registrados: los nombres que se eligen al recibir un equipo y al firmar un diagnóstico.
 *
 * Los servicios y diagnósticos guardan el nombre como texto. Por eso corregir un nombre lo corrige también en lo ya
 * registrado: si no, el filtro por técnico partiría a la misma persona en dos. Un técnico no se borra (perdería su
 * historial): se desactiva y deja de aparecer en los formularios.
 */
class TecnicoController extends Controller
{
    public function index(): Response
    {
        $servicios = ServicioTecnico::query()->selectRaw('tecnico, count(*) as total')->groupBy('tecnico')->pluck('total', 'tecnico');
        $diagnosticos = Diagnostico::query()->selectRaw('tecnico, count(*) as total')->groupBy('tecnico')->pluck('total', 'tecnico');

        return Inertia::render('Admin/Tecnicos/Index', [
            'tecnicos' => Tecnico::orderByDesc('activo')->orderBy('nombre')->get()->map(fn (Tecnico $t) => [
                'id'           => $t->id,
                'nombre'       => $t->nombre,
                'especialidad' => $t->especialidad,
                'activo'       => $t->activo,
                'servicios'    => (int) ($servicios[$t->nombre] ?? 0),
                'diagnosticos' => (int) ($diagnosticos[$t->nombre] ?? 0),
            ]),
            'especialidades' => collect(Tecnico::ESPECIALIDADES)->map(fn ($label, $value) => compact('value', 'label'))->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validar($request);
        Tecnico::create($data + ['activo' => true]);

        return back()->with('success', "Técnico «{$data['nombre']}» registrado.");
    }

    public function update(Request $request, Tecnico $tecnico): RedirectResponse
    {
        $data = $this->validar($request, $tecnico) + $request->validate(['activo' => ['required', 'boolean']]);
        $anterior = $tecnico->nombre;
        $corregidos = 0;

        DB::transaction(function () use ($tecnico, $data, $anterior, &$corregidos) {
            $tecnico->update($data);

            if ($anterior !== $data['nombre']) {
                $corregidos = ServicioTecnico::where('tecnico', $anterior)->update(['tecnico' => $data['nombre']])
                    + Diagnostico::where('tecnico', $anterior)->update(['tecnico' => $data['nombre']]);
            }
        });

        return back()->with('success', $corregidos > 0
            ? "Técnico actualizado. El nombre también se corrigió en {$corregidos} " . ($corregidos === 1 ? 'registro.' : 'registros.')
            : 'Técnico actualizado.');
    }

    /** Nombre sin espacios de más y único sin importar mayúsculas: «Miguel Chavez» y «MIGUEL CHAVEZ» son el mismo. */
    private function validar(Request $request, ?Tecnico $tecnico = null): array
    {
        $request->merge(['nombre' => preg_replace('/\s+/u', ' ', trim((string) $request->input('nombre')))]);

        $data = $request->validate([
            'nombre'       => ['required', 'string', 'max:120'],
            'especialidad' => ['required', Rule::in(array_keys(Tecnico::ESPECIALIDADES))],
        ], [
            'nombre.required' => 'Escribe el nombre del técnico.',
        ]);

        $repetido = Tecnico::whereRaw('lower(nombre) = ?', [mb_strtolower($data['nombre'])])
            ->when($tecnico, fn ($q) => $q->whereKeyNot($tecnico->id))
            ->exists();

        if ($repetido) {
            throw ValidationException::withMessages(['nombre' => 'Ya hay un técnico registrado con ese nombre.']);
        }

        return $data;
    }
}
