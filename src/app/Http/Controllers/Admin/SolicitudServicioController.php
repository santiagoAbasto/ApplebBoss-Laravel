<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SolicitudServicio;
use App\Models\SystemNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tienda online → Solicitudes de servicio: lo que llega desde /servicio-tecnico. Acá se le escribe al cliente por
 * WhatsApp y se sigue hasta que el equipo llega a la tienda; ahí se registra en Servicio técnico, con su recepción.
 */
class SolicitudServicioController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/SolicitudesServicio/Index', [
            'solicitudes' => SolicitudServicio::with('atendidoPor:id,name')->latest()->get()->map(fn (SolicitudServicio $s) => [
                'id'           => $s->id,
                'codigo'       => $s->codigo,
                'tipo'         => $s->tipo_equipo,
                'equipo'       => $s->equipo(),
                'problemas'    => $s->problemasTexto(),
                'descripcion'  => $s->descripcion,
                'cliente'      => $s->nombre_contacto,
                'telefono'     => $s->telefono_contacto,
                'whatsapp'     => $s->whatsapp(),
                'mensaje'      => $s->mensajeWhatsapp(),
                'estado'       => $s->estado,
                'notas'        => $s->notas_internas,
                'creada_hace'  => $s->created_at?->diffForHumans(),
                'atendida_por' => $s->atendidoPor?->name,
            ])->values(),
            'estados' => SolicitudServicio::ETIQUETAS,
        ]);
    }

    public function update(Request $request, SolicitudServicio $solicitud): RedirectResponse
    {
        $validated = $request->validate([
            'estado'         => ['required', Rule::in(array_keys(SolicitudServicio::ETIQUETAS))],
            'notas_internas' => ['nullable', 'string', 'max:2000'],
        ], [
            'estado.required'    => 'Elige el estado de la solicitud.',
            'estado.in'          => 'Elige uno de los estados.',
            'notas_internas.max' => 'Las notas pueden tener hasta 2000 letras.',
        ]);

        $solicitud->update([
            'estado'         => $validated['estado'],
            // Sin el campo (el botón de WhatsApp solo cambia el estado) las notas quedan como estaban
            'notas_internas' => $request->has('notas_internas') ? (trim(strip_tags((string) $validated['notas_internas'])) ?: null) : $solicitud->notas_internas,
            'atendido_por'   => $request->user()->id,
        ]);

        // Ya la vio alguien: el aviso del Resumen se apaga
        SystemNotification::where('solicitud_servicio_id', $solicitud->id)->update(['read' => true]);

        return back()->with('success', "La solicitud {$solicitud->codigo} quedó en «" . SolicitudServicio::ETIQUETAS[$solicitud->estado] . '».');
    }

    /** Borra la solicitud con los datos del cliente y sus avisos (solicitudes falsas o si el cliente lo pide). */
    public function destroy(SolicitudServicio $solicitud): RedirectResponse
    {
        $codigo = $solicitud->codigo;

        SystemNotification::where('solicitud_servicio_id', $solicitud->id)->delete();
        $solicitud->delete();

        return back()->with('success', "Se borró la solicitud {$codigo} con los datos del cliente.");
    }
}
