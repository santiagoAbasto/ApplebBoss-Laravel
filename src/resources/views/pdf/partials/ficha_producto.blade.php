{{-- Un producto de la boleta: nombre e importe, propiedades en mosaicos con icono, identificadores y garantía. --}}
@php use App\Support\IconoPdf; @endphp
<div class="ficha-producto">
  <table>
    <tr>
      <td style="width: 46px;"><div class="cuadro"><img src="{{ IconoPdf::uri($ic, '#0d0d0d') }}" alt=""></div></td>
      <td style="vertical-align: middle;"><div class="producto">{{ $nombre }}</div></td>
      <td class="importe">{{ $importe }}@if ($detalle)<div class="detalle">{{ $detalle }}</div>@endif</td>
    </tr>
  </table>

  {{-- Hasta cuatro propiedades van en un renglón; con más, de a tres, para que cada una se lea grande --}}
  @php $porFila = count($propiedades) > 4 ? 3 : max(count($propiedades), 1); @endphp
  @foreach (array_chunk($propiedades, $porFila) as $fila)
  <table class="mosaicos">
    <tr>
      @foreach ($fila as $n => [$icono, $rotulo, $valor])
      <td style="width: {{ round(100 / $porFila, 2) }}%; @if ($n === $porFila - 1) padding-right: 0; @endif">
        <div class="mosaico">
          <table>
            <tr>
              <td style="width: 34px;"><div class="aro"><img src="{{ IconoPdf::uri($icono, '#0d0d0d') }}" alt=""></div></td>
              <td style="vertical-align: middle;"><div class="rotulo">{{ $rotulo }}</div><div class="valor">{{ $valor }}</div></td>
            </tr>
          </table>
        </div>
      </td>
      @endforeach
      @for ($k = count($fila); $k < $porFila; $k++) <td></td> @endfor
    </tr>
  </table>
  @endforeach

  <table class="bandas">
    <tr>
      <td @if ($cobertura) style="width: 56%; padding-right: 8px;" @endif>
        <div class="banda">
          @foreach ($identificadores as $rotulo => $valor)
          <span class="ident"><img class="ico" src="{{ IconoPdf::uri(str_contains($rotulo, 'IMEI') ? 'sim' : 'codigo', '#0d0d0d') }}" alt=""><span class="gris">{{ $rotulo }}</span> <b>{{ $valor }}</b></span>
          @endforeach
        </div>
      </td>
      @if ($cobertura)
      <td>
        <div class="banda lima">
          <img class="ico" src="{{ IconoPdf::uri('garantia', '#0d0d0d') }}" alt=""><b>Garantía de {{ $cobertura['meses'] }} meses</b>
          <span style="font-size: 9px;">&nbsp; cubierto hasta el {{ $cobertura['vence']->format('d/m/Y') }}</span>
        </div>
      </td>
      @endif
    </tr>
  </table>
</div>
