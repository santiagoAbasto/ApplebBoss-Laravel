@php
  use App\Support\DatosDeLaTienda;
  use App\Support\TextoEnriquecido;

  $tienda = DatosDeLaTienda::paraPdf();
  $bs     = fn ($n) => 'Bs ' . number_format((float) $n, 2);
  $bat    = fn ($b) => filled($b) ? (is_numeric($b) ? $b . ' %' : $b) : null;
  $imei   = fn ($p) => [
      'IMEI 1'      => $p->imei_1 ?? null,
      'IMEI 2'      => $p->imei_2 ?? null,
      'Estado IMEI' => filled($p->estado_imei ?? null) ? ucfirst($p->estado_imei) : null,
  ];

  // Cada producto, del tipo que sea, se imprime igual: nombre, características e identificadores
  $ficha = fn (string $tipo, $p) => match ($tipo) {
      'celular'        => [$p->modelo, ['Capacidad' => $p->capacidad, 'Color' => $p->color, 'Batería' => $bat($p->bateria)], $imei($p)],
      'computadora'    => [$p->nombre, ['Procesador' => $p->procesador, 'RAM' => $p->ram, 'Almacenamiento' => $p->almacenamiento, 'Color' => $p->color, 'Batería' => $bat($p->bateria)], ['Serie' => $p->numero_serie]],
      'producto_apple' => [$p->modelo, ['Capacidad' => $p->capacidad, 'Color' => $p->color, 'Batería' => $bat($p->bateria)], $p->tiene_imei ? $imei($p) : ['Serie' => $p->numero_serie]],
      default          => [$p->nombre, ['Tipo' => $p->tipo ? str_replace('_', ' ', $p->tipo) : null], ['Código' => $p->codigo]],
  };

  $relacion = ['celular' => 'celular', 'computadora' => 'computadora', 'producto_apple' => 'productoApple', 'producto_general' => 'productoGeneral'];
  $lineas   = [];
  foreach ($venta->items as $item) {
      if ($producto = $item->{$relacion[$item->tipo] ?? 'productoGeneral'} ?? null) {
          $lineas[] = [...$ficha($item->tipo, $producto), $item];
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
  $notas             = TextoEnriquecido::aHtml($venta->notas_adicionales);
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
        <td>{{ $tienda['nombre'] }}@if($tienda['direccion']), {{ $tienda['direccion'] }}@endif @if($tienda['telefono']) &nbsp; Tel. {{ $tienda['telefono'] }}@endif</td>
        <td class="der">NIT 12555473014, Empresa Unipersonal</td>
      </tr>
    </table>
  </div>

  <table>
    <tr>
      <td class="marca">
        <img src="{{ public_path('images/logo-pdf.png') }}" alt="">
        <div class="nombre">{{ mb_strtoupper($tienda['nombre']) }}</div>
      </td>
      <td class="doc der">
        <div class="titulo">Boleta de venta</div>
        <div class="codigo">{{ $venta->codigo_nota ?? ('#' . $venta->id) }}</div>
        <div class="gris">Venta n.º {{ $venta->id }}</div>
      </td>
    </tr>
  </table>
  <div class="filete"></div>

  <table class="datos">
    <tr>
      <td>
        <div class="gris">Cliente</div>
        <div class="valor">{{ $venta->nombre_cliente }}</div>
        <div>{{ $venta->telefono_cliente ?? '' }}</div>
      </td>
      <td>
        <div class="gris">Fecha</div>
        <div class="valor">{{ optional($venta->created_at)->timezone(config('app.timezone'))->format('d/m/Y') }}</div>
        <div>{{ optional($venta->created_at)->timezone(config('app.timezone'))->format('H:i') }}</div>
      </td>
      <td>
        <div class="gris">Forma de pago</div>
        <div class="valor">{{ mb_strlen((string) $venta->metodo_pago) <= 3 ? mb_strtoupper($venta->metodo_pago) : ucfirst($venta->metodo_pago) }}</div>
        @if ($venta->metodo_pago === 'tarjeta')
        <div>{{ $venta->inicio_tarjeta ?? '****' }} **** **** {{ $venta->fin_tarjeta ?? '****' }}</div>
        @endif
      </td>
      <td>
        <div class="gris">Atendido por</div>
        <div class="valor">{{ $venta->vendedor->name ?? '---' }}</div>
      </td>
    </tr>
  </table>

  <div class="seccion">Detalle de la compra</div>
  <table class="lineas">
    <thead>
      <tr>
        <th class="n">N.º</th>
        <th>Producto</th>
        <th class="der">Importe</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($lineas as $i => [$nombre, $caracteristicas, $identificadores, $item])
      <tr>
        <td class="n">{{ $i + 1 }}</td>
        <td>
          <div class="producto">{{ $nombre }}</div>
          @foreach (array_filter($caracteristicas, 'filled') as $rotulo => $valor)
          <span class="par"><span class="gris">{{ $rotulo }}</span> {{ $valor }}</span>
          @endforeach
          <div>
            @foreach (array_filter($identificadores, 'filled') as $rotulo => $valor)
            <span class="par ident"><span class="gris">{{ $rotulo }}</span> <b>{{ $valor }}</b></span>
            @endforeach
          </div>
        </td>
        <td class="importe">
          {{ $bs($item->subtotal) }}
          @if ((float) $item->descuento > 0)
          <div class="gris" style="font-size: 8.5px; font-weight: normal;">Precio {{ $bs($item->precio_venta) }}<br>Descuento - {{ $bs($item->descuento) }}</div>
          @endif
        </td>
      </tr>
      @endforeach
    </tbody>
  </table>

  @if ($permutas)
  <div class="seccion">Equipo recibido en permuta</div>
  <table class="lineas">
    <tbody>
      @foreach ($permutas as [$nombre, $caracteristicas, $identificadores, $equipo])
      <tr>
        <td>
          <div class="producto">{{ $nombre }}</div>
          @foreach (array_filter($caracteristicas, 'filled') as $rotulo => $valor)
          <span class="par"><span class="gris">{{ $rotulo }}</span> {{ $valor }}</span>
          @endforeach
          <div>
            @foreach (array_filter($identificadores, 'filled') as $rotulo => $valor)
            <span class="par ident"><span class="gris">{{ $rotulo }}</span> <b>{{ $valor }}</b></span>
            @endforeach
          </div>
        </td>
        <td class="importe">{{ $bs($equipo->precio_costo) }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <table class="totales">
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
    <tr class="total">
      <td>{{ ($valorPermuta > 0 || $montoReserva > 0) ? 'Diferencia a pagar' : 'Total' }}</td>
      <td class="der nowrap">{{ $bs($totalAPagar) }}</td>
    </tr>
  </table>

  @if ($notas !== '')
  <div class="notas">
    @unless (preg_match('/^\s*<h[2-4]>/', $notas))
    <h3>Notas</h3>
    @endunless
    {!! $notas !!}
  </div>
  @endif

  <table class="firmas">
    <tr>
      <td class="hueco"><img src="{{ public_path('images/firma.png') }}" alt=""></td>
      <td class="hueco"></td>
    </tr>
    <tr>
      <td><div class="raya">{{ $tienda['nombre'] }}</div><div class="gris">Firma autorizada</div></td>
      <td><div class="raya">{{ $venta->nombre_cliente }}</div><div class="gris">Recibí conforme el producto</div></td>
    </tr>
  </table>
</body>

</html>
