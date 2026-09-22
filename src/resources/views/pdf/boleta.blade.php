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

  // Cada producto, del tipo que sea, se imprime igual: icono, nombre, propiedades [icono, rótulo, valor] e identificadores
  $equipo = fn ($p, string $capacidad = 'Capacidad') => [
      ['disco', $capacidad, $p->capacidad ?? $p->almacenamiento ?? null], ['color', 'Color', $p->color ? ucfirst(mb_strtolower($p->color)) : null],
      ['bateria', 'Batería', $bat($p->bateria)], ['etiqueta', 'Condición', $p->condicion ?? null],
  ];
  $ficha = fn (string $tipo, $p) => match ($tipo) {
      'celular'        => ['celular', $p->modelo, $equipo($p), $imei($p)],
      'computadora'    => ['computadora', $p->nombre, [['chip', 'Procesador', $p->procesador], ['memoria', 'Memoria RAM', $p->ram], ...$equipo($p, 'Almacenamiento')], ['N.º de serie' => $p->numero_serie]],
      'producto_apple' => ['tablet', $p->modelo, $equipo($p), $p->tiene_imei ? $imei($p) : ['N.º de serie' => $p->numero_serie]],
      default          => ['caja', $p->nombre, [['etiqueta', 'Tipo', $p->tipo ? ucfirst(str_replace('_', ' ', $p->tipo)) : null], ['etiqueta', 'Condición', $p->condicion ?? null]], ['Código' => $p->codigo]],
  };
  $conValor = fn (array $props) => array_values(array_filter($props, fn ($x) => filled($x[2]) && trim((string) $x[2]) !== '-'));

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
  $hayLugar          = ! $garantiaEnNota && (count($lineas) + count($permutas)) <= 2 && mb_strlen(strip_tags($notas)) < 220;
@endphp
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <title>Boleta de venta {{ $venta->codigo_nota ?? $venta->id }}</title>
  @include('pdf.partials.estilos')
</head>

<body>
  @include('pdf.partials.membrete', ['tipo' => 'BOLETA DE VENTA', 'codigo' => $venta->codigo_nota ?? ('N.º ' . $venta->id),
      'cuando' => $fecha?->format('d/m/Y') . ' &nbsp; ' . $fecha?->format('H:i') . ' &nbsp;|&nbsp; Venta n.º ' . $venta->id])

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

  {{-- Productos: una ficha por cada uno --}}
  <div class="pildora">DETALLE DE LA COMPRA</div>
  @foreach ($lineas as [$ic, $nombre, $propiedades, $identificadores, $item, $cobertura])
  @include('pdf.partials.ficha_producto', ['ic' => $ic, 'nombre' => $nombre, 'propiedades' => $conValor($propiedades),
      'identificadores' => $conDato($identificadores), 'cobertura' => $cobertura, 'importe' => $bs($item->subtotal),
      'detalle' => (float) $item->descuento > 0 ? 'Precio ' . $bs($item->precio_venta) . ' | Descuento - ' . $bs($item->descuento) : null])
  @endforeach

  @if ($permutas)
  <div class="pildora">EQUIPO RECIBIDO EN PERMUTA</div>
  @foreach ($permutas as [$ic, $nombre, $propiedades, $identificadores, $equipoRecibido])
  @include('pdf.partials.ficha_producto', ['ic' => 'permuta', 'nombre' => $nombre, 'propiedades' => $conValor($propiedades),
      'identificadores' => $conDato($identificadores), 'cobertura' => null, 'importe' => $bs($equipoRecibido->precio_costo), 'detalle' => 'Valor reconocido'])
  @endforeach
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

  @if ($hayLugar)
  <div class="pildora"><img class="ico" src="{{ IconoPdf::uri('garantia', '#c8f902') }}" alt="">TU GARANTÍA EN CORTO</div>
  <table class="resumen">
    <tr>
      @foreach ([['garantia', 'Qué cubre', $secciones[1]['lista'], null], ['alerta', 'Qué no cubre', array_slice($secciones[3]['lista'], 0, 4), 'La lista completa está en la hoja de garantía.'], ['documento', 'Para hacerla efectiva', $secciones[2]['lista'], 'La revisión la hace nuestro Servicio Técnico.']] as $n => [$ic, $titulo, $lista, $cierre])
      @if ($n) <td class="hueco-col"></td> @endif
      <td style="width: 32%;">
        <div class="bloque">
          <div class="bloque-titulo"><img class="ico" src="{{ IconoPdf::uri($ic, '#0d0d0d') }}" alt="">{{ $titulo }}</div>
          <ul>@foreach ($lista as $li)<li>{{ $li }}</li>@endforeach</ul>
          @if ($cierre)<p class="gris">{{ $cierre }}</p>@endif
        </div>
      </td>
      @endforeach
    </tr>
  </table>
  @endif

  @if ($notas !== '')
  <div class="pildora">{{ $garantiaEnNota ? 'GARANTÍA Y NOTAS DE ESTA VENTA' : 'NOTAS DE LA VENTA' }}</div>
  <div class="texto">{!! $notas !!}</div>
  @endif

  <table class="firmas {{ $hayLugar ? 'holgada' : '' }}">
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
      <td style="width: 74px;"><div class="sello"><img src="{{ public_path('images/logo-pdf.png') }}" alt=""></div></td>
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
