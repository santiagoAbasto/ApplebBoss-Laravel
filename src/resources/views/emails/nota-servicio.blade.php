@extends('emails.layouts.marca')

@section('etiqueta', 'Servicio técnico ' . $servicio->codigo_nota)
@section('titulo', $texto['titulo'])

@section('contenido')
    @include('emails.partials.icono', $texto['icono'])

    @include('emails.partials.pasos', ['pasos' => $pasos, 'actual' => $actual])

    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">{{ $texto['cuerpo'] }}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Nota {{ $servicio->codigo_nota }}</td>
                <td align="right" style="font-size:12px;color:#94a3b8;">{{ $fecha }}</td>
            </tr></table>
            <p style="margin:8px 0 0;font-size:16px;font-weight:800;color:#011446;">{{ $servicio->equipo }}</p>
            @if ($servicio->tecnico)<p style="margin:2px 0 0;font-size:12px;color:#64748b;">Técnico: {{ $servicio->tecnico }}</p>@endif

            @foreach ($trabajos as $trabajo)
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;"><tr>
                    <td style="font-size:14px;line-height:1.5;color:#0f172a;">{{ $trabajo['descripcion'] }}</td>
                    <td align="right" valign="top" style="font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;padding-left:12px;">Bs {{ number_format($trabajo['precio'], 2, ',', '.') }}</td>
                </tr></table>
            @endforeach
            @php($detalleLibre = trim((string) $servicio->detalle_servicio))
            @if ($trabajos->isEmpty() && $detalleLibre !== '' && ! \Illuminate\Support\Str::startsWith($detalleLibre, ['[', '{']))
                {{-- Servicios viejos con el detalle en texto libre; nunca el JSON vacío de un diagnóstico --}}
                <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#0f172a;">{{ strip_tags($detalleLibre) }}</p>
            @endif

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#011446;border-radius:12px;"><tr>
                <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#9aa3c7;">Total del servicio</td>
                <td align="right" style="padding:12px 14px;font-size:18px;font-weight:900;color:#C6CB36;white-space:nowrap;">Bs {{ number_format((float) $servicio->precio_venta, 2, ',', '.') }}</td>
            </tr></table>
        </td></tr>
    </table>

    @if (!empty($enlacePresupuesto))
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-top:20px;">
                <a href="{{ $enlacePresupuesto }}" style="display:inline-block;background:#C6CB36;color:#011446;font-weight:800;font-size:16px;text-decoration:none;padding:15px 30px;border-radius:999px;">Revisar y aprobar el presupuesto</a>
            </td></tr>
        </table>
        <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">En ese mismo enlace puedes aprobarlo o rechazarlo. Empezamos la reparación recién cuando lo apruebas.</p>
    @else
        @include('emails.partials.documento-pdf', ['enlace' => $enlace, 'titulo' => 'La nota de servicio', 'boton' => 'Ver mi nota de servicio'])
    @endif
@endsection

@section('pie')
    Te escribimos por el servicio {{ $servicio->codigo_nota }}. Si tienes una duda, responde este correo y te atendemos desde soporte@appleboss.com.bo.
@endsection
