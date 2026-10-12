@extends('emails.layouts.marca')

@section('etiqueta', 'Bienvenida')
@section('titulo', "Tu cuenta está lista, {$nombre}")

@section('contenido')
    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">Gracias por crear tu cuenta en appleboss.com.bo. Desde ahora, con ella puedes:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
        @foreach ([
            ['Comprar en dos pasos', 'tus datos quedan guardados y cada pedido queda a tu nombre.'],
            ['Seguir cada pedido', 'el pago, la preparación y el envío, con el IMEI y la serie de tu equipo apenas confirmemos el pago.'],
            ['Retomar tu carrito', 'si dejas algo a medias, te lo guardamos.'],
            ['Calificar tu compra', 'cuando recibas tu pedido, tu opinión se publica en la tienda.'],
        ] as [$titulo, $texto])
            <tr>
                <td style="padding:7px 0;vertical-align:top;width:22px;"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#C6CB36;margin-top:7px;"></span></td>
                <td style="padding:7px 0;font-size:14px;line-height:1.55;color:#334155;"><strong style="color:#0f172a;">{{ $titulo }}:</strong> {{ $texto }}</td>
            </tr>
        @endforeach
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:22px 0 6px;">
        <a href="{{ $tienda }}" class="ab-boton" style="display:inline-block;background:#011446;background-image:linear-gradient(135deg,#011446,#1A3A96,#011446);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 34px;border-radius:999px;">Ver lo que hay hoy →</a>
    </td></tr></table>
    <p style="margin:6px 0 0;text-align:center;font-size:13px;color:#64748b;"><a href="{{ $cuenta }}" style="color:#011446;font-weight:700;">Mi cuenta</a>@if ($whatsapp) · ¿Dudas? <a href="{{ $whatsapp }}" style="color:#011446;font-weight:700;">Escríbenos por WhatsApp</a>@endif</p>
@endsection

@section('pie')
    Recibes este correo porque acabas de crear tu cuenta en appleboss.com.bo.
@endsection
