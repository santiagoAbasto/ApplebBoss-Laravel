@extends('emails.layouts.marca')

@section('etiqueta', 'Cotización COT-' . $cotizacion->id)
@section('titulo', 'Tu cotización, ' . $nombre)

@section('contenido')
    @include('emails.partials.icono', ['icono' => 'check-animado.gif', 'ancho' => 72, 'alto' => 72])

    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">
        Gracias por consultarnos. Esta es la cotización que preparamos para ti; el PDF va adjunto y también puedes abrirlo desde el botón. Si quieres ajustar algo, responde este correo o escríbenos por WhatsApp.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Cotización COT-{{ $cotizacion->id }}</td>
                <td align="right" style="font-size:12px;color:#94a3b8;">{{ $fecha }}</td>
            </tr></table>

            @foreach ((array) $cotizacion->items as $item)
                @php($detalle = implode(' · ', array_filter([$item['modelo'] ?? null, $item['capacidad'] ?? ($item['almacenamiento'] ?? null), $item['color'] ?? null, $item['ram'] ?? null])))
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;"><tr>
                    <td style="font-size:14px;line-height:1.5;color:#0f172a;">
                        <strong>{{ $item['nombre'] ?? 'Producto' }}</strong>@if ((int) ($item['cantidad'] ?? 1) > 1) <span style="color:#94a3b8;">× {{ (int) $item['cantidad'] }}</span>@endif
                        @if ($detalle)<br><span style="font-size:12px;color:#64748b;">{{ $detalle }}</span>@endif
                    </td>
                    <td align="right" valign="top" style="font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;padding-left:12px;">{{ $cotizacion->simboloMoneda() }} {{ number_format((float) ($item['total'] ?? 0), 2, ',', '.') }}</td>
                </tr></table>
            @endforeach

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#011446;border-radius:12px;"><tr>
                <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#9aa3c7;">Total cotizado · {{ $cotizacion->moneda === 'USD' ? 'dólares' : 'bolivianos' }}</td>
                <td align="right" style="padding:12px 14px;font-size:18px;font-weight:900;color:#C6CB36;white-space:nowrap;">{{ $cotizacion->simboloMoneda() }} {{ number_format((float) $cotizacion->total, 2, ',', '.') }}</td>
            </tr></table>
        </td></tr>
    </table>

    @if ($cotizacion->notas_adicionales)
        <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;"><strong style="color:#64748b;">Notas:</strong> {{ strip_tags((string) $cotizacion->notas_adicionales) }}</p>
    @endif

    @include('emails.partials.documento-pdf', ['enlace' => $enlace, 'titulo' => 'La cotización', 'boton' => 'Descargar mi cotización'])

    <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Los precios y el stock pueden cambiar: la cotización vale mientras el producto siga disponible.</p>
@endsection

@section('pie')
    Te escribimos por la cotización COT-{{ $cotizacion->id }}. Responde este correo y te atendemos desde ventas@appleboss.com.bo.
@endsection
