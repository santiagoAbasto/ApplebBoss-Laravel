{{-- Pie fijo y encabezado de los documentos A4 que se entregan al cliente: la marca a la izquierda y la ficha
     del documento (tipo, código y fecha) a la derecha. Lo comparten boleta de venta, cotización y servicio técnico. --}}
@php
  use App\Support\DatosDeLaTienda;
  use App\Support\IconoPdf;

  $datosTienda = DatosDeLaTienda::paraPdf();
  $documentos  = config('documentos');
@endphp
<div class="pie">
  <table>
    <tr>
      <td><img class="ico" src="{{ IconoPdf::uri('web', '#c8f902') }}" alt="">{{ $documentos['web'] }} &nbsp;&nbsp; {{ $documentos['instagram'] }}</td>
      <td style="text-align: center;">{{ $documentos['correo'] }}</td>
      <td class="der">@if($datosTienda['telefono'])<img class="ico" src="{{ IconoPdf::uri('telefono', '#c8f902') }}" alt="">{{ $datosTienda['telefono'] }}@endif</td>
    </tr>
  </table>
</div>

<table>
  <tr>
    <td style="width: 74px;"><div class="sello"><img src="{{ public_path('images/logo-pdf.png') }}" alt=""></div></td>
    <td class="marca">
      <div class="nombre"><b>APPLE</b><br>BOSS</div>
      <div class="dato" style="margin-top: 6px;">NIT {{ $documentos['nit'] }} &nbsp;|&nbsp; {{ $documentos['contribuyente'] }}</div>
      @if($datosTienda['direccion'])
      <div class="dato"><img class="ico" src="{{ IconoPdf::uri('ubicacion', '#0d0d0d') }}" alt="">{{ $datosTienda['direccion'] }}</div>
      @endif
      @if($datosTienda['telefono'])
      <div class="dato"><img class="ico" src="{{ IconoPdf::uri('telefono', '#0d0d0d') }}" alt="">{{ $datosTienda['telefono'] }}</div>
      @endif
    </td>
    <td style="width: 246px;">
      <div class="ficha">
        <div class="tipo">{{ $tipo }}</div>
        <div class="codigo">{{ $codigo }}</div>
        <div class="cuando">{!! $cuando !!}</div>
      </div>
    </td>
  </tr>
</table>
