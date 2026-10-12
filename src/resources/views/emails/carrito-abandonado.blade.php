@extends('emails.layouts.marca')

@section('etiqueta', $ultimo ? 'Último recordatorio' : 'Te lo guardamos')
@section('titulo', $ultimo ? "Última llamada, {$nombre}" : "Tu carrito te está esperando, {$nombre}")

@section('contenido')
    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">
        @if ($pedido)
            Tu pedido <strong style="color:#0f172a;">{{ $pedido }}</strong> se canceló porque no llegó el pago, pero el equipo volvió a estar disponible.
        @else
            Dejaste esto en appleboss.com.bo y sigue disponible al mismo precio.
        @endif
        @if ($ultimo)
            En una tienda con stock real no dura: cuando alguien lo compra, desaparece. Este es el último recordatorio que te mandamos.
        @else
            Lo retomas con un clic: el carrito se arma solo y pasas directo a pagar.
        @endif
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid #e2e8f0;border-radius:14px;">
        @foreach ($items as $item)
            <tr>
                <td style="padding:12px 14px;border-bottom:{{ $loop->last ? '0' : '1px solid #eef2f7' }};width:64px;">
                    @if ($item['imagen'])
                        <img src="{{ $item['imagen'] }}" alt="" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:contain;border-radius:12px;background:#f8fafc;">
                    @else
                        <span style="display:block;width:56px;height:56px;border-radius:12px;background:#f1f5f9;"></span>
                    @endif
                </td>
                <td style="padding:12px 6px;border-bottom:{{ $loop->last ? '0' : '1px solid #eef2f7' }};">
                    <a href="{{ $item['url'] }}" style="font-size:15px;font-weight:700;color:#0f172a;text-decoration:none;">{{ $item['nombre'] }}</a>
                    @if (! empty($item['condicion']))
                        <span style="display:block;margin-top:2px;font-size:12px;color:#94a3b8;">{{ $item['condicion'] }}</span>
                    @endif
                </td>
                <td align="right" style="padding:12px 14px;border-bottom:{{ $loop->last ? '0' : '1px solid #eef2f7' }};white-space:nowrap;font-size:15px;font-weight:800;color:#011446;">
                    Bs {{ number_format((float) $item['precio'], 0, ',', '.') }}
                </td>
            </tr>
        @endforeach
        @if (count($items) > 1)
            <tr><td colspan="3" align="right" style="padding:12px 14px;border-top:1px solid #e2e8f0;font-size:15px;font-weight:800;color:#0f172a;">
                Total: Bs {{ number_format((float) $total, 0, ',', '.') }}
            </td></tr>
        @endif
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0 6px;">
        <a href="{{ $enlace }}" class="ab-boton" style="display:inline-block;background:#011446;background-image:linear-gradient(135deg,#011446,#1A3A96,#011446);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 34px;border-radius:999px;">Retomar mi compra →</a>
    </td></tr></table>
    @if ($whatsapp)
        <p style="margin:6px 0 0;text-align:center;font-size:13px;color:#64748b;">¿Prefieres que te ayude una persona? <a href="{{ $whatsapp }}" style="color:#011446;font-weight:700;">Escríbenos por WhatsApp</a></p>
    @endif
@endsection

@section('pie')
    Recibes este correo porque dejaste productos en tu carrito con tu cuenta de appleboss.com.bo. Te mandamos como máximo dos recordatorios.
    <a href="{{ $baja }}" style="color:#64748b;">No quiero recibir más recordatorios</a>.
@endsection
