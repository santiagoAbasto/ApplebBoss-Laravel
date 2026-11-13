{{-- Franja de Navidad de los correos (una fila de la tabla del marco). Solo con la campaña activa y el interruptor
     «Correos y documentos» encendido; apagada no escribe nada. Estilos en línea y color de respaldo: los clientes
     que no dibujan el degradado ven la franja burdeos lisa. --}}
@if(\App\Support\Temporada::enDocumentos())
<tr><td style="height:8px;line-height:8px;font-size:0;background-color:#A42635;background-image:repeating-linear-gradient(135deg,#A42635 0,#A42635 10px,#FFF8EE 10px,#FFF8EE 20px);">&nbsp;</td></tr>
<tr><td align="center" style="background:#A42635;color:#ffffff;font-size:12px;font-weight:800;letter-spacing:0.6px;padding:8px 12px;">
    <span style="color:#E2BC72;">&#10022;</span>&nbsp; Felices fiestas de parte de Apple Boss &nbsp;<span style="color:#E2BC72;">&#10022;</span>
</td></tr>
{{-- Banner animado: el trineo con los renos cruza el paisaje y las luces parpadean. Es un GIF (lo único que animan
     Gmail, Outlook y Apple Mail por igual); quien tenga las imágenes bloqueadas ve solo la franja y el saludo.
     Lo genera scripts/generar-gif-navidad.py. --}}
<tr><td style="background:#FFF8EE;padding:0;line-height:0;font-size:0;">
    <img src="{{ rtrim((string) config('seo.public_url', config('app.url')), '/') }}/images/correo/navidad-trineo.gif" width="560" alt="Un trineo con renos cruza un paisaje de pinos con luces" style="display:block;width:100%;max-width:100%;height:auto;border:0;">
</td></tr>
@endif
