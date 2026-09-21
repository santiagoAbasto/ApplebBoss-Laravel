@php
  use App\Support\DatosDeLaTienda;
  use App\Support\GarantiaDeVenta;
  use App\Support\IconoPdf;
  use App\Support\MontoEnLetras;
  use App\Support\TextoEnriquecido;

  $tienda = DatosDeLaTienda::paraPdf();
  $doc    = config('documentos');
  $fecha  = optional($venta->created_at)->timezone(config('app.timezone'));
  $bs     = fn ($n) => 'Bs ' . number_format((float) $n, 2);
  $bat    = fn ($b) => filled($b) ? (is_numeric($b) ? $b . ' %' : $b) : null;
  // Un guion cargado a mano en el inventario cuenta como dato vacío
  $conDato = fn (array $pares) => array_filter($pares, fn ($v) => filled($v) && trim((string) $v) !== '-');
  $imei   = fn ($p) => [
      'IMEI 1'      => $p->imei_1 ?? null,
      'IMEI 2'      => $p->imei_2 ?? null,
      'Estado IMEI' => filled($p->estado_imei ?? null) ? ucfirst($p->estado_imei) : null,
  ];

  // Cada producto, del tipo que sea, se imprime igual: icono, nombre, características e identificadores
  $ficha = fn (string $tipo, $p) => match ($tipo) {
      'celular'        => ['celular', $p->modelo, [$p->capacidad, $p->color, $bat($p->bateria) ? 'Batería ' . $bat($p->bateria) : null, $p->condicion ?? null], $imei($p)],
      'computadora'    => ['computadora', $p->nombre, [$p->procesador, $p->ram ? 'RAM ' . $p->ram : null, $p->almacenamiento, $p->color, $bat($p->bateria) ? 'Batería ' . $bat($p->bateria) : null, $p->condicion ?? null], ['Serie' => $p->numero_serie]],
      'producto_apple' => ['tablet', $p->modelo, [$p->capacidad, $p->color, $bat($p->bateria) ? 'Batería ' . $bat($p->bateria) : null, $p->condicion ?? null], $p->tiene_imei ? $imei($p) : ['Serie' => $p->numero_serie]],
      default          => ['caja', $p->nombre, [$p->tipo ? ucfirst(str_replace('_', ' ', $p->tipo)) : null], ['Código' => $p->codigo]],
  };

  // Una venta anterior puede traer sus propias condiciones de garantía escritas en la nota: esas son las que
  // se pactaron, así que se imprimen tal cual y no se les agrega la hoja ni los plazos de hoy.
  $notas           = TextoEnriquecido::aHtml($venta->notas_adicionales);
  $garantiaEnNota  = (bool) preg_match('/condiciones de garant/iu', strip_tags($notas));

  $relacion = ['celular' => 'celular', 'computadora' => 'computadora', 'producto_apple' => 'productoApple', 'producto_general' => 'productoGeneral'];
  $lineas   = [];
  foreach ($venta->items as $item) {
      if ($producto = $item->{$relacion[$item->tipo] ?? 'productoGeneral'} ?? null) {
          $lineas[] = [...$ficha($item->tipo, $producto), $item, $garantiaEnNota ? null : GarantiaDeVenta::cobertura($item->tipo, $producto, $fecha)];
      }
  }

  $permutas = [];
  foreach (['celular' => 'entregadoCelular', 'computadora' => 'entregadoComputadora', 'producto_apple' => 'entregadoProductoApple', 'producto_general' => 'entregadoProductoGeneral'] as $tipo => $rel) {
      if ($venta->{$rel}) {
          $permutas[] = [...$ficha($tipo, $venta->{$rel}), $venta->{$rel}];
      }
  }

  $sumaSubtotalItems = $sumaSubtotalItems ?? $venta->items->sum('subtotal');
  $valorPermuta      = $valorPermuta ?? ($venta->valor_permuta ?? 0);
  $montoReserva      = $montoReserva ?? ($venta->monto_reserva_aplicado ?? 0);
  $totalAPagar       = $totalAPagar ?? ($sumaSubtotalItems - $valorPermuta - $montoReserva);
  $pago              = mb_strlen((string) $venta->metodo_pago) <= 3 ? mb_strtoupper($venta->metodo_pago) : ucfirst($venta->metodo_pago);
  $cubiertos         = array_values(array_filter($lineas, fn ($l) => $l[5]));
  $secciones         = $doc['garantia']['secciones'];
@endphp
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <title>Boleta de venta {{ $venta->codigo_nota ?? $venta->id }}</title>
  @include('pdf.partials.estilos')
</head>

<body>
  <div class="pie">
    <table>
      <tr>
        <td><img class="ico" src="{{ IconoPdf::uri('web', '#c8f902') }}" alt="">{{ $doc['web'] }} &nbsp;&nbsp; {{ $doc['instagram'] }}</td>
        <td style="text-align: center;">{{ $doc['correo'] }}</td>
        <td class="der">@if($tienda['telefono'])<img class="ico" src="{{ IconoPdf::uri('telefono', '#c8f902') }}" alt="">{{ $tienda['telefono'] }}@endif</td>
      </tr>
    </table>
  </div>

  {{-- Encabezado: la marca y los datos de la tienda a la izquierda, el documento a la derecha --}}
  <table>
    <tr>
      <td class="sello"><img src="{{ public_path('images/logo-pdf.png') }}" alt=""></td>
      <td class="marca">
        <div class="nombre"><b>APPLE</b><br>BOSS</div>
        <div class="dato" style="margin-top: 6px;">NIT {{ $doc['nit'] }} &nbsp;|&nbsp; {{ $doc['contribuyente'] }}</div>
        @if($tienda['direccion'])
        <div class="dato"><img class="ico" src="{{ IconoPdf::uri('ubicacion', '#0d0d0d') }}" alt="">{{ $tienda['direccion'] }}</div>
        @endif
        @if($tienda['telefono'])
        <div class="dato"><img class="ico" src="{{ IconoPdf::uri('telefono', '#0d0d0d') }}" alt="">{{ $tienda['telefono'] }}</div>
        @endif
      </td>
      <td style="width: 246px;">
        <div class="ficha">
          <div class="tipo">BOLETA DE VENTA</div>
          <div class="codigo">{{ $venta->codigo_nota ?? ('N.º ' . $venta->id) }}</div>
          <div class="cuando">{{ $fecha?->format('d/m/Y') }} &nbsp; {{ $fecha?->format('H:i') }} &nbsp;|&nbsp; Venta n.º {{ $venta->id }}</div>
        </div>
      </td>
    </tr>
  </table>

  {{-- Datos de la venta --}}
  <table class="tarjetas">
    <tr>
      @foreach ([
        ['cliente', 'Cliente', $venta->nombre_cliente, $venta->telefono_cliente],
        ['pago', 'Forma de pago', $pago, $venta->metodo_pago === 'tarjeta' ? ($venta->inicio_tarjeta ?? '****') . ' **** **** ' . ($venta->fin_tarjeta ?? '****') : null],
        ['vendedor', 'Atendido por', $venta->vendedor->name ?? '---', null],
      ] as $n => [$ic, $rotulo, $valor, $extra])
      @if ($n) <td class="hueco-col"></td> @endif
      <td style="width: {{ $n === 0 ? '40%' : '28%' }};">
        <div class="tarjeta">
        <table>
          <tr>
            <td style="width: 30px;"><div class="bola"><img src="{{ IconoPdf::uri($ic, '#0d0d0d') }}" alt=""></div></td>
            <td>
              <div class="rotulo">{{ $rotulo }}</div>
              <div class="valor">{{ $valor }}</div>
              <div style="min-height: 12px;">{{ $extra }}</div>
            </td>
          </tr>
        </table>
        </div>
      </td>
      @endforeach
    </tr>
  </table>

  {{-- Productos --}}
  <div class="pildora">DETALLE DE LA COMPRA</div>
  <div class="caja">
    <table class="lineas">
      @foreach ($lineas as $i => [$ic, $nombre, $caracteristicas, $identificadores, $item, $cobertura])
      <tr class="{{ $loop->last ? 'ultima' : '' }}">
        <td class="ic"><div class="cuadro"><img src="{{ IconoPdf::uri($ic, '#0d0d0d') }}" alt=""></div></td>
        <td>
          <div class="producto">{{ $nombre }}</div>
          @foreach ($conDato($caracteristicas) as $valor)
          <span class="chip">{{ $valor }}</span>
          @endforeach
          @if ($cobertura)
          <span class="chip lima">Garantía {{ $cobertura['meses'] }} meses, hasta el {{ $cobertura['vence']->format('d/m/Y') }}</span>
          @endif
          <div>
            @foreach ($conDato($identificadores) as $rotulo => $valor)
            <span class="ident"><span class="gris">{{ $rotulo }}</span> <b>{{ $valor }}</b></span>
            @endforeach
          </div>
        </td>
        <td class="importe">
          {{ $bs($item->subtotal) }}
          @if ((float) $item->descuento > 0)
          <div class="detalle">Precio {{ $bs($item->precio_venta) }}<br>Descuento - {{ $bs($item->descuento) }}</div>
          @endif
        </td>
      </tr>
      @endforeach
    </table>
  </div>

  @if ($permutas)
  <div class="pildora">EQUIPO RECIBIDO EN PERMUTA</div>
  <div class="caja">
    <table class="lineas">
      @foreach ($permutas as [$ic, $nombre, $caracteristicas, $identificadores, $equipo])
      <tr class="{{ $loop->last ? 'ultima' : '' }}">
        <td class="ic"><div class="cuadro"><img src="{{ IconoPdf::uri('permuta', '#0d0d0d') }}" alt=""></div></td>
        <td>
          <div class="producto">{{ $nombre }}</div>
          @foreach ($conDato($caracteristicas) as $valor)
          <span class="chip">{{ $valor }}</span>
          @endforeach
          <div>
            @foreach ($conDato($identificadores) as $rotulo => $valor)
            <span class="ident"><span class="gris">{{ $rotulo }}</span> <b>{{ $valor }}</b></span>
            @endforeach
          </div>
        </td>
        <td class="importe">{{ $bs($equipo->precio_costo) }}</td>
      </tr>
      @endforeach
    </table>
  </div>
  @endif

  {{-- Monto en letras y totales --}}
  <table class="cierre">
    <tr>
      <td class="letras">
        <div class="gris">Son</div>
        <div><b>{{ MontoEnLetras::bolivianos($totalAPagar) }}</b></div>
        <div class="gris" style="margin-top: 5px;">Pago en {{ mb_strtolower($pago) === 'qr' ? 'QR' : mb_strtolower($pago) }}. Documento interno sin valor fiscal.</div>
      </td>
      <td class="totales">
        <table>
          <tr>
            <td class="gris">Subtotal</td>
            <td class="der nowrap">{{ $bs($sumaSubtotalItems) }}</td>
          </tr>
          @if ($valorPermuta > 0)
          <tr>
            <td class="gris">Equipo en permuta</td>
            <td class="der nowrap">- {{ $bs($valorPermuta) }}</td>
          </tr>
          @endif
          @if ($montoReserva > 0)
          <tr>
            <td class="gris">Reserva aplicada{{ $venta->reserva ? ' (' . $venta->reserva->codigo_nota . ')' : '' }}</td>
            <td class="der nowrap">- {{ $bs($montoReserva) }}</td>
          </tr>
          @endif
        </table>
        <div class="total">
          <table>
            <tr>
              <td>{{ ($valorPermuta > 0 || $montoReserva > 0) ? 'DIFERENCIA A PAGAR' : 'TOTAL' }}</td>
              <td class="monto">{{ $bs($totalAPagar) }}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  @if ($notas !== '')
  <div class="pildora">{{ $garantiaEnNota ? 'GARANTÍA Y NOTAS DE ESTA VENTA' : 'NOTAS DE LA VENTA' }}</div>
  <div class="texto">{!! $notas !!}</div>
  @endif

  <table class="firmas">
    <tr>
      <td class="trazo"><img src="{{ public_path('images/firma.png') }}" alt=""></td>
      <td class="trazo"></td>
    </tr>
    <tr>
      <td><div class="raya">{{ $tienda['nombre'] }}</div><div class="gris">Firma autorizada</div></td>
      <td><div class="raya">{{ $venta->nombre_cliente }}</div><div class="gris">Recibí conforme el producto y acepto la garantía</div></td>
    </tr>
  </table>

  {{-- Hoja de garantía: va siempre, salvo que la venta ya traiga la suya escrita en la nota --}}
  @unless ($garantiaEnNota)
  <div class="salto"></div>
  <table>
    <tr>
      <td class="sello"><img src="{{ public_path('images/logo-pdf.png') }}" alt=""></td>
      <td class="marca" style="vertical-align: middle;">
        <div class="g-titulo">Garantía de productos Apple Boss</div>
        <div class="g-intro">{{ $doc['garantia']['intro'] }}</div>
      </td>
    </tr>
  </table>

  @if ($cubiertos)
  <div class="pildora">TU COBERTURA EN ESTA COMPRA</div>
  <div class="caja">
    <table class="cobertura">
      <tr>
        <th>Producto</th>
        <th>Identificador</th>
        <th>Tipo</th>
        <th>Plazo</th>
        <th class="der">Cubierto hasta</th>
      </tr>
      @foreach ($cubiertos as [$ic, $nombre, $caracteristicas, $identificadores, $item, $cobertura])
      <tr class="{{ $loop->last ? 'ultima' : '' }}">
        <td><b>{{ $nombre }}</b></td>
        <td>{{ collect($conDato($identificadores))->except('Estado IMEI')->first() ?? '-' }}</td>
        <td>{{ $cobertura['etiqueta'] }}</td>
        <td>{{ $cobertura['meses'] }} meses</td>
        <td class="der"><b>{{ $cobertura['vence']->format('d/m/Y') }}</b></td>
      </tr>
      @endforeach
    </table>
  </div>
  @endif

  <table class="garantia" style="margin-top: 2px;">
    <tr>
      @foreach ([array_slice($secciones, 0, 3), array_slice($secciones, 3)] as $n => $grupo)
      <td class="columna" style="padding-{{ $n ? 'left' : 'right' }}: 8px;">
        @foreach ($grupo as $s)
        <div class="pildora"><img class="ico" src="{{ IconoPdf::uri($s['icono'], '#c8f902') }}" alt="">{{ mb_strtoupper($s['titulo']) }}</div>
        <div class="texto">
          @if (! empty($s['texto']))<p>{{ $s['texto'] }}</p>@endif
          @if (! empty($s['numerada']))
          <ol>@foreach ($s['lista'] as $li)<li>{{ $li }}</li>@endforeach</ol>
          @else
          <ul>@foreach ($s['lista'] as $li)<li>{{ $li }}</li>@endforeach</ul>
          @endif
          @if (! empty($s['cierre']))<p>{{ $s['cierre'] }}</p>@endif
        </div>
        @endforeach
      </td>
      @endforeach
    </tr>
  </table>

  <div class="gracias">Gracias por tu compra</div>
  @endunless
</body>

</html>
