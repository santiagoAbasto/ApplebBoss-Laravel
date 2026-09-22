@php
  use App\Support\IconoPdf;
  use App\Support\MontoEnLetras;
  use App\Support\TextoEnriquecido;

  $bs    = fn ($n) => 'Bs ' . number_format((float) $n, 2);
  // La fecha de la cotización no guarda hora: la hora es la del registro
  $fecha = optional($cotizacion->fecha_cotizacion ?? $cotizacion->created_at)->timezone(config('app.timezone'));
  $hora  = optional($cotizacion->created_at)->timezone(config('app.timezone'))?->format('H:i');

  // Los ítems se guardaron como JSON, como colección o como arreglo, según la versión que los creó
  $crudos = $cotizacion->items ?? [];
  $items  = match (true) {
      is_string($crudos)                                       => json_decode($crudos, true) ?: [],
      $crudos instanceof \Illuminate\Support\Collection         => $crudos->toArray(),
      is_array($crudos)                                        => $crudos,
      default                                                  => (array) $crudos,
  };

  // Un importe puede venir como número o como texto escrito a mano («1.250,50»)
  $num = function ($v) {
      if (is_numeric($v)) {
          return (float) $v;
      }
      if (! is_string($v)) {
          return is_bool($v) ? (int) $v : 0;
      }
      $s = preg_replace('/[^0-9,.\-]/', '', $v);
      if (substr_count($s, ',') === 1) {
          $s = str_replace(',', '.', substr_count($s, '.') >= 1 ? str_replace('.', '', $s) : $s);
      }

      return is_numeric($s) ? (float) $s : 0;
  };

  // Mismo cálculo que el formulario: el descuento baja la base y sobre esa base van IVA (13 %) e IT (3 %)
  $lineas = [];
  $suma   = ['base' => 0, 'descuento' => 0, 'iva' => 0, 'it' => 0, 'total' => 0];

  foreach ($items as $it) {
      $it        = is_array($it) ? $it : (array) $it;
      $cantidad  = max(1, (int) $num($it['cantidad'] ?? 1));
      $unitario  = $num($it['precio_sin_factura'] ?? 0);
      $base      = $unitario * $cantidad;
      $descuento = min(max(0, $num($it['descuento'] ?? 0)), $base);
      $neta      = max(0, $base - $descuento);
      $iva       = round($neta * 0.13, 2);
      $it3       = round($neta * 0.03, 2);

      $detalles = [];
      foreach (['modelo' => 'Modelo', 'procesador' => 'Procesador', 'ram' => 'RAM', 'almacenamiento' => 'Almacenamiento',
                'capacidad' => 'Capacidad', 'color' => 'Color', 'bateria' => 'Batería'] as $campo => $rotulo) {
          if (filled($it[$campo] ?? null) && $it[$campo] !== ($it['nombre'] ?? null)) {
              $detalles[] = $rotulo . ': ' . $it[$campo];
          }
      }

      $lineas[] = ['nombre' => $it['nombre'] ?? 'Producto', 'detalles' => implode(' · ', $detalles), 'cantidad' => $cantidad,
          'unitario' => $unitario, 'descuento' => $descuento, 'neta' => $neta];

      $suma['base']      += $base;
      $suma['descuento'] += $descuento;
      $suma['iva']       += $iva;
      $suma['it']        += $it3;
      $suma['total']     += round($neta + $iva + $it3, 2);
  }

  $sinFactura = $suma['base'] - $suma['descuento'];
  $telefono   = $cotizacion->telefono_completo ?? $cotizacion->telefono ?? $cotizacion->telefono_cliente ?? null;
  $notas      = TextoEnriquecido::aHtml($cotizacion->notas_adicionales);
@endphp
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <title>Cotización COT-{{ $cotizacion->id }}</title>
  @include('pdf.partials.estilos')
</head>

<body>
  @include('pdf.partials.membrete', ['tipo' => 'COTIZACIÓN', 'codigo' => 'COT-' . $cotizacion->id,
      'cuando' => $fecha?->format('d/m/Y') . ($hora ? ' &nbsp; ' . $hora : '') . ' &nbsp;|&nbsp; Precios en bolivianos'])

  {{-- Datos del cliente --}}
  <table class="tarjetas">
    <tr>
      @foreach ([
        ['cliente', 'Cliente', $cotizacion->nombre_cliente ?: 'Consumidor final', $telefono],
        ['documento', 'Correo', $cotizacion->correo_cliente ?: '---', null],
        ['vendedor', 'Atendido por', $cotizacion->usuario->name ?? '---', null],
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

  {{-- Detalle: precios sin factura, que son la base del cálculo --}}
  <div class="pildora">DETALLE DE LA COTIZACIÓN</div>
  <table class="cobertura">
    <thead>
    <tr>
      <th style="width: 24px;">#</th>
      <th>Producto o servicio</th>
      <th class="der" style="width: 46px;">Cant.</th>
      <th class="der" style="width: 92px;">P. unitario</th>
      <th class="der" style="width: 86px;">Descuento</th>
      <th class="der" style="width: 96px;">Subtotal</th>
    </tr>
    </thead>
    @forelse ($lineas as $n => $linea)
    <tr class="{{ $loop->last ? 'ultima' : '' }}">
      <td>{{ $n + 1 }}</td>
      <td>
        <b>{{ $linea['nombre'] }}</b>
        @if ($linea['detalles'])<div class="gris" style="font-size: 8.6px;">{{ $linea['detalles'] }}</div>@endif
      </td>
      <td class="der">{{ $linea['cantidad'] }}</td>
      <td class="der nowrap">{{ $bs($linea['unitario']) }}</td>
      <td class="der nowrap">{{ $linea['descuento'] > 0 ? '- ' . $bs($linea['descuento']) : '---' }}</td>
      <td class="der nowrap"><b>{{ $bs($linea['neta']) }}</b></td>
    </tr>
    @empty
    <tr class="ultima">
      <td colspan="6" class="gris">Esta cotización todavía no tiene productos cargados.</td>
    </tr>
    @endforelse
  </table>

  {{-- Totales: el precio sin factura y el mismo importe con factura (IVA 13 % + IT 3 %) --}}
  <table class="cierre">
    <tr>
      <td class="letras">
        <div class="gris">Son</div>
        <div><b>{{ MontoEnLetras::bolivianos($suma['total']) }}</b></div>
        <div class="gris" style="margin-top: 5px;">Precio sin factura: <b>{{ $bs($sinFactura) }}</b>. Documento sin valor fiscal, cotización referencial.</div>
      </td>
      <td class="totales">
        <table>
          <tr>
            <td class="gris">Subtotal</td>
            <td class="der nowrap">{{ $bs($suma['base']) }}</td>
          </tr>
          @if ($suma['descuento'] > 0)
          <tr>
            <td class="gris">Descuento</td>
            <td class="der nowrap">- {{ $bs($suma['descuento']) }}</td>
          </tr>
          @endif
          <tr>
            <td class="gris">Importe sin factura</td>
            <td class="der nowrap">{{ $bs($sinFactura) }}</td>
          </tr>
          <tr>
            <td class="gris">IVA 13 %</td>
            <td class="der nowrap">{{ $bs($suma['iva']) }}</td>
          </tr>
          <tr>
            <td class="gris">IT 3 %</td>
            <td class="der nowrap">{{ $bs($suma['it']) }}</td>
          </tr>
        </table>
        <div class="total">
          <table>
            <tr>
              <td>TOTAL CON FACTURA</td>
              <td class="monto">{{ $bs($suma['total']) }}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  @if ($notas !== '')
  <div class="pildora">NOTAS DE LA COTIZACIÓN</div>
  <div class="texto">{!! $notas !!}</div>
  @endif
</body>

</html>
