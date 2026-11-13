{{-- Saludo de Navidad de los PDF: franja de bastón de caramelo y una línea con el gorro. Solo se dibuja con la
     campaña activa y el interruptor «Correos y documentos» encendido (App\Support\Temporada::enDocumentos); apagada,
     este parcial no escribe nada. `compacto` lo deja en una sola línea fina, para los tickets de 80 mm. --}}
@if(\App\Support\Temporada::enDocumentos())
@php($compacto = $compacto ?? false)
<div style="text-align: center; margin: 0 0 {{ $compacto ? 4 : 10 }}px; padding: 0;">
  <img src="{{ \App\Support\Navidad\AdornoPdf::franja($compacto ? 220 : 560, $compacto ? 5 : 8) }}" alt="" style="width: 100%;">
  <div style="margin-top: {{ $compacto ? 2 : 4 }}px; font-size: {{ $compacto ? 7 : 8.5 }}px; font-weight: bold; letter-spacing: 1.2px; color: #A42635;">
    <img src="{{ \App\Support\Navidad\AdornoPdf::gorro() }}" alt="" style="height: {{ $compacto ? 8 : 11 }}px; vertical-align: -2px; margin-right: 4px;">FELICES FIESTAS DE PARTE DE APPLE BOSS
  </div>
</div>
@endif
