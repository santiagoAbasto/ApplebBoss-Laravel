{{-- El botón al PDF (enlace firmado) y el aviso de que también va adjunto. --}}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0 6px;">
    @if (! empty($enlace))
        <a href="{{ $enlace }}" class="ab-boton" style="display:inline-block;background:#011446;background-image:linear-gradient(135deg,#011446,#1A3A96,#011446);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 34px;border-radius:999px;">{{ $boton ?? 'Descargar el PDF' }}</a>
    @endif
</td></tr></table>
<p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">
    {{ $titulo }} también va adjunta a este correo.
    @if (! empty($enlace))<br>Si el botón no funciona, copia este enlace:<br><span style="color:#64748b;word-break:break-all;">{{ $enlace }}</span>@endif
</p>
