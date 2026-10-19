{{-- Un icono animado (GIF) centrado arriba del contenido: Gmail y Apple Mail lo mueven; el resto ve el primer cuadro. --}}
@php($base = rtrim((string) config('seo.public_url', config('app.url')), '/'))
@if (! empty($icono))
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:2px 0 18px;">
        <img src="{{ $base }}/images/correo/{{ $icono }}" width="{{ $ancho ?? 72 }}" height="{{ $alto ?? 72 }}" alt="" style="display:block;border:0;">
    </td></tr></table>
@endif
