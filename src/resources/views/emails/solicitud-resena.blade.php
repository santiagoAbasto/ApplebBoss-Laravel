@extends('emails.layouts.marca')

@section('etiqueta', 'Gracias por elegirnos')
@section('titulo', "¿Nos dejas tu opinión, {$nombre}?")

@section('contenido')
    <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">Gracias por confiar en Apple Boss. Si quedaste a gusto con la atención, dejarnos una reseña en Google nos ayuda muchísimo a seguir creciendo. Son 10 segundos.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:22px 0 6px;">
        <a href="{{ $enlace }}" class="ab-boton" style="display:inline-block;background:#011446;background-image:linear-gradient(135deg,#011446,#1A3A96,#011446);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 34px;border-radius:999px;">★ Calificar en Google →</a>
    </td></tr></table>
    <p style="margin:6px 0 0;text-align:center;font-size:13px;color:#64748b;">¿Algo no salió como esperabas? Responde este correo y lo solucionamos.</p>
@endsection

@section('pie')
    Te escribimos una sola vez. Gracias por elegir appleboss.com.bo.
@endsection
