@extends('emails.layouts.marca')

@section('etiqueta', 'Informe técnico ' . $diagnostico->codigo)
@section('titulo', 'El informe de tu ' . $diagnostico->equipo)

@section('contenido')
    @include('emails.partials.icono', ['icono' => 'check-animado.gif', 'ancho' => 72, 'alto' => 72])

    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">
        Hola {{ $nombre }}: {{ $diagnostico->tecnico ? 'nuestro técnico ' . $diagnostico->tecnico . ' revisó tu equipo' : 'revisamos tu equipo' }}. Este es el resumen; el informe completo, firmado y sellado, va adjunto.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Informe {{ $diagnostico->codigo }}</td>
                <td align="right" style="font-size:12px;color:#94a3b8;">{{ $fecha }}</td>
            </tr></table>
            <p style="margin:8px 0 0;font-size:16px;font-weight:800;color:#011446;">{{ $diagnostico->equipo }}@if ($diagnostico->identificador) <span style="font-size:12px;font-weight:600;color:#64748b;">· {{ $diagnostico->identificador }}</span>@endif</p>

            <p style="margin:14px 0 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Lo que reportaste</p>
            <p style="margin:4px 0 0;font-size:14px;line-height:1.55;color:#334155;">{{ $diagnostico->falla_reportada }}</p>

            <p style="margin:14px 0 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Pruebas</p>
            <p style="margin:4px 0 0;font-size:14px;line-height:1.55;color:#334155;">
                <span style="color:#15803d;font-weight:700;">{{ $pruebas['ok'] }} funcionan</span> · <span style="color:#b91c1c;font-weight:700;">{{ $pruebas['falla'] }} con falla</span>@if ($pruebas['nc']) · {{ $pruebas['nc'] }} sin poder probar @endif
            </p>

            <p style="margin:14px 0 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Conclusión</p>
            <p style="margin:4px 0 0;font-size:14px;line-height:1.55;color:#0f172a;font-weight:600;">{{ $diagnostico->conclusion }}</p>

            @if ($diagnostico->recomendacion)
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#f4f6d9;border-radius:12px;"><tr><td style="padding:12px 14px;">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:1px;color:#5a6410;text-transform:uppercase;">Recomendación</p>
                    <p style="margin:4px 0 0;font-size:14px;line-height:1.55;color:#0f172a;">{{ $diagnostico->recomendacion }}</p>
                </td></tr></table>
            @endif
        </td></tr>
    </table>

    @include('emails.partials.documento-pdf', ['enlace' => $enlace, 'titulo' => 'El informe técnico', 'boton' => 'Descargar el informe firmado'])
@endsection

@section('pie')
    Te escribimos por el informe {{ $diagnostico->codigo }}. Responde este correo y te atendemos desde soporte@appleboss.com.bo.
@endsection
