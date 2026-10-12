@extends('emails.layouts.marca')

@section('etiqueta', 'Un minuto, nada más')
@section('titulo', "¿Cómo te fue con tu {$producto}, {$nombre}?")

@section('contenido')
    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">Hace una semana recibiste tu pedido <strong style="color:#0f172a;">{{ $codigo }}</strong>. Nos encantaría saber qué tal: calificas el producto y la atención, escribes unas líneas y listo. Solo quien compró puede opinar, y tu opinión se publica tal cual en la tienda después de que la revisemos.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:22px 0 6px;">
        <a href="{{ $enlace }}" class="ab-boton" style="display:inline-block;background:#011446;background-image:linear-gradient(135deg,#011446,#1A3A96,#011446);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 34px;border-radius:999px;">Calificar mi compra →</a>
    </td></tr></table>
    <p style="margin:6px 0 0;text-align:center;font-size:13px;color:#64748b;">¿Algo no salió bien? Responde este correo y lo vemos contigo.</p>
@endsection

@section('pie')
    Te escribimos una sola vez por pedido. Gracias por comprar en appleboss.com.bo.
@endsection
