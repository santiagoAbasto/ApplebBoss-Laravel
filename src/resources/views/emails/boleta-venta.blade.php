@extends('emails.layouts.marca')

@section('etiqueta', 'Nota de venta ' . $venta->codigo_nota)
@section('titulo', 'Gracias por tu compra, ' . $nombre)

@section('contenido')
    @include('emails.partials.icono', ['icono' => 'check-animado.gif', 'ancho' => 72, 'alto' => 72])

    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">
        Esta es tu nota de venta. Guárdala: con ella haces valer la garantía. El PDF va adjunto y también puedes abrirlo desde el botón.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Nota {{ $venta->codigo_nota }}</td>
                <td align="right" style="font-size:12px;color:#94a3b8;">{{ $fecha }}</td>
            </tr></table>

            @foreach ($items as $item)
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;"><tr>
                    <td style="font-size:14px;line-height:1.5;color:#0f172a;">
                        <strong>{{ $item['nombre'] }}</strong>@if ($item['cantidad'] > 1) <span style="color:#94a3b8;">× {{ $item['cantidad'] }}</span>@endif
                        @if ($item['detalle'])<br><span style="font-size:12px;color:#64748b;">{{ $item['detalle'] }}</span>@endif
                        @if ($item['garantia'])<br><span style="display:inline-block;margin-top:6px;background:#f4f6d9;color:#5a6410;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;">Garantía {{ $item['garantia']['meses'] }} meses · hasta {{ $item['garantia']['vence']->format('d/m/Y') }}</span>@endif
                    </td>
                    <td align="right" valign="top" style="font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;padding-left:12px;">Bs {{ number_format($item['subtotal'], 2, ',', '.') }}</td>
                </tr></table>
            @endforeach

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
                @foreach ($totales['lineas'] as $linea)
                    <tr><td style="padding:2px 0;">{{ $linea['etiqueta'] }}</td><td align="right" style="padding:2px 0;">{{ $linea['monto'] }}</td></tr>
                @endforeach
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;background:#011446;border-radius:12px;"><tr>
                <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#9aa3c7;">Total pagado · {{ $totales['metodo'] }}</td>
                <td align="right" style="padding:12px 14px;font-size:18px;font-weight:900;color:#C6CB36;white-space:nowrap;">Bs {{ number_format($totales['total'], 2, ',', '.') }}</td>
            </tr></table>
        </td></tr>
    </table>

    @include('emails.partials.documento-pdf', ['enlace' => $enlace, 'titulo' => 'La nota de venta', 'boton' => 'Descargar mi nota de venta'])

    <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
        Si algo falla de fábrica, escríbenos con el código <strong style="color:#0f172a;">{{ $venta->codigo_nota }}</strong>: primero reparamos; si no se puede, cambiamos; y si tampoco, devolvemos el dinero.
        <a href="{{ $garantiaUrl }}" style="color:#011446;font-weight:700;">Cómo funciona la garantía</a>.
    </p>
@endsection

@section('pie')
    Recibes este correo porque dejaste tu dirección al comprar en Apple Boss. Responde y te atendemos desde ventas@appleboss.com.bo.
@endsection
