@extends('emails.layouts.marca')

@section('etiqueta', 'Reserva ' . $reserva->codigo_nota)
@section('titulo', $texto['titulo'])

@section('contenido')
    @include('emails.partials.icono', $texto['icono'])

    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">{{ $texto['cuerpo'] }}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Reserva {{ $reserva->codigo_nota }}</td>
                <td align="right" style="font-size:12px;color:#94a3b8;">{{ $fecha }}</td>
            </tr></table>

            @foreach ($items as $item)
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;"><tr>
                    <td style="font-size:14px;line-height:1.5;color:#0f172a;"><strong>{{ $item['nombre'] }}</strong>@if ($item['detalle'])<br><span style="font-size:12px;color:#64748b;">{{ $item['detalle'] }}</span>@endif</td>
                    <td align="right" valign="top" style="font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;padding-left:12px;">Bs {{ number_format($item['subtotal'], 2, ',', '.') }}</td>
                </tr></table>
            @endforeach

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
                <tr><td style="padding:2px 0;">Total reservado</td><td align="right" style="padding:2px 0;">Bs {{ number_format((float) $reserva->subtotal, 2, ',', '.') }}</td></tr>
                <tr><td style="padding:2px 0;">Abono entregado</td><td align="right" style="padding:2px 0;">Bs {{ number_format((float) $reserva->monto_reserva, 2, ',', '.') }}</td></tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;background:#011446;border-radius:12px;"><tr>
                <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#9aa3c7;">Saldo al retirar</td>
                <td align="right" style="padding:12px 14px;font-size:18px;font-weight:900;color:#C6CB36;white-space:nowrap;">Bs {{ number_format($saldo, 2, ',', '.') }}</td>
            </tr></table>
        </td></tr>
    </table>

    @if ($reserva->terminos_condiciones)
        <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;"><strong style="color:#64748b;">Condiciones:</strong> {{ strip_tags((string) $reserva->terminos_condiciones) }}</p>
    @endif

    @include('emails.partials.documento-pdf', ['enlace' => $enlace, 'titulo' => 'La nota de reserva', 'boton' => 'Ver mi nota de reserva'])
@endsection

@section('pie')
    Te escribimos por la reserva {{ $reserva->codigo_nota }}. Responde este correo y te atendemos desde ventas@appleboss.com.bo.
@endsection
