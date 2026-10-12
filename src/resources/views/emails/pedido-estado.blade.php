@extends('emails.layouts.marca')

@section('etiqueta', 'Pedido ' . $pedido->codigo)
@section('titulo', $texto['titulo'])

@section('contenido')
    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">{{ $texto['cuerpo'] }}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Pedido</p>
            <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#011446;">{{ $pedido->codigo }}</p>
            @foreach ($pedido->items as $item)
                <p style="margin:0 0 5px;font-size:14px;color:#334155;">
                    {{ $item->cantidad }} × {{ $item->nombre }}
                    <span style="color:#94a3b8;">· Bs {{ number_format((float) $item->subtotal, 0, ',', '.') }}</span>
                </p>
            @endforeach
            <p style="margin:12px 0 0;padding-top:10px;border-top:1px solid #e2e8f0;font-size:15px;font-weight:700;color:#0f172a;">
                Total: Bs {{ number_format((float) $pedido->total, 0, ',', '.') }}
            </p>
        </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0 6px;">
        <a href="{{ $enlace }}" class="ab-boton" style="display:inline-block;background:#011446;background-image:linear-gradient(135deg,#011446,#1A3A96,#011446);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 34px;border-radius:999px;">{{ $texto['boton'] }}</a>
    </td></tr></table>
    <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">Si el botón no funciona, copia este enlace:<br><span style="color:#64748b;word-break:break-all;">{{ $enlace }}</span></p>
@endsection

@section('pie')
    Este correo es por tu pedido {{ $pedido->codigo }}. Si necesitas algo, responde y te atendemos desde pedidos@appleboss.com.bo.
@endsection
