{{-- Navidad en las páginas sueltas de documentos (la del enlace del documento y la del presupuesto): franja de
     caramelo, saludo y cabecera en verde pino. Solo con la campaña activa y «Correos y documentos» encendido. --}}
@if(\App\Support\Temporada::enDocumentos())
<style>
    .nv-franja{height:8px;background:repeating-linear-gradient(135deg,#A42635 0 10px,#FFF8EE 10px 20px)}
    .nv-saludo{background:#A42635;color:#fff;text-align:center;font-size:12px;font-weight:800;letter-spacing:.5px;padding:8px 12px}
    .nv-saludo b{color:#E2BC72;font-weight:800}
    .cabeza{background:linear-gradient(135deg,#143D2B,#1F5A40) !important}
</style>
<div class="nv-franja" aria-hidden="true"></div>
<p class="nv-saludo"><b>&#10022;</b>&nbsp; Felices fiestas de parte de Apple Boss &nbsp;<b>&#10022;</b></p>
@endif
