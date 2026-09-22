@php
  use App\Models\ServicioTecnico;
  use App\Support\DatosDeLaTienda;
  use App\Support\IconoPdf;
  use App\Support\MontoEnLetras;
  use App\Support\RecepcionDeEquipo;
  use App\Support\TextoEnriquecido;

  $tienda   = DatosDeLaTienda::paraPdf();
  // Cómo entró el equipo: la revisión y el código de desbloqueo que se anotaron en el mostrador
  $revision   = $servicio->recepcion['revision'] ?? [];
  $desbloqueo = RecepcionDeEquipo::textoDesbloqueo($servicio->recepcion['desbloqueo'] ?? null);
  $marca      = ServicioTecnico::MARCAS[$servicio->marca] ?? null;
  $bs       = fn ($n) => 'Bs ' . number_format((float) $n, 2);
  $fecha    = $servicio->fecha ?? $servicio->created_at;
  $fecha    = $fecha ? $fecha->timezone(config('app.timezone')) : null;
  $hora     = optional($servicio->created_at)->timezone(config('app.timezone'))?->format('H:i');
  // Lo que paga el cliente por cada trabajo. El costo interno nunca sale en este documento.
  $trabajos = collect($servicios_cliente)->map(fn ($t) => ['descripcion' => $t['descripcion'] ?? '', 'precio' => (float) ($t['precio'] ?? 0)])
      ->filter(fn ($t) => $t['descripcion'] !== '')->values();
  $notas    = TextoEnriquecido::aHtml($servicio->notas_adicionales);
@endphp
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <title>Boleta de servicio técnico {{ $servicio->codigo_nota }}</title>
  @include('pdf.partials.estilos')
</head>

<body>
  @include('pdf.partials.membrete', ['tipo' => 'SERVICIO TÉCNICO', 'codigo' => $servicio->codigo_nota,
      'cuando' => $fecha?->format('d/m/Y') . ($hora ? ' &nbsp; ' . $hora : '') . ' &nbsp;|&nbsp; Servicio n.º ' . $servicio->id])

  {{-- Datos del servicio --}}
  <table class="tarjetas">
    <tr>
      @foreach ([
        ['cliente', 'Cliente', $servicio->cliente, $servicio->telefono],
        ['herramienta', 'Técnico', $servicio->tecnico ?: '---', null],
        ['vendedor', 'Registrado por', $servicio->vendedor->name ?? '---', null],
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

  {{-- El equipo y lo que se le hizo --}}
  <div class="pildora">EQUIPO Y TRABAJOS REALIZADOS</div>
  <div class="ficha-producto">
    <table>
      <tr>
        <td style="width: 46px;"><div class="cuadro"><img src="{{ IconoPdf::uri('herramienta', '#0d0d0d') }}" alt=""></div></td>
        <td style="vertical-align: middle;">
          <div class="producto">{{ $servicio->equipo }}</div>
          @if ($marca)<div class="gris" style="font-size: 8.8px;">{{ $marca }}</div>@endif
        </td>
        <td class="importe">{{ $bs($servicio->precio_venta) }}<div class="detalle">{{ $trabajos->count() }} {{ $trabajos->count() === 1 ? 'trabajo' : 'trabajos' }}</div></td>
      </tr>
    </table>

    <table class="cobertura" style="margin-top: 9px;">
      <thead>
      <tr>
        <th>Trabajo realizado</th>
        <th class="der" style="width: 110px;">Importe</th>
      </tr>
      </thead>
      @forelse ($trabajos as $trabajo)
      <tr class="{{ $loop->last ? 'ultima' : '' }}">
        <td>{{ $trabajo['descripcion'] }}</td>
        <td class="der nowrap"><b>{{ $bs($trabajo['precio']) }}</b></td>
      </tr>
      @empty
      <tr class="ultima">
        <td colspan="2" class="gris">{{ TextoEnriquecido::aTexto($servicio->detalle_servicio) ?: 'Sin detalle cargado.' }}</td>
      </tr>
      @endforelse
    </table>
  </div>

  {{-- Cómo entró el equipo: lo que se revisó delante del cliente y el código de desbloqueo --}}
  @if ($revision || $desbloqueo)
  <div class="pildora"><img class="ico" src="{{ IconoPdf::uri('revision', '#c8f902') }}" alt="">CÓMO ENTRÓ EL EQUIPO</div>

  @if ($desbloqueo)
  <div class="banda lima" style="margin-bottom: 8px;">
    <img class="ico" src="{{ IconoPdf::uri('llave', '#0d0d0d') }}" alt=""><b>Desbloqueo:</b> {{ $desbloqueo }}
  </div>
  @endif

  @if ($revision)
  @php $mitad = (int) ceil(count($revision) / 2); @endphp
  <table>
    <tr>
      @foreach (array_chunk($revision, max($mitad, 1)) as $n => $grupo)
      <td class="columna" style="padding-{{ $n ? 'left' : 'right' }}: 8px;">
        <table class="cobertura">
          @foreach ($grupo as $punto)
          <tr class="{{ $loop->last ? 'ultima' : '' }}">
            <td>{{ $punto['etiqueta'] }}</td>
            <td class="der nowrap" style="width: 86px;">
              @if ($punto['estado'] === 'nc')
              <span class="gris">No probado</span>
              @else
              <b>{{ RecepcionDeEquipo::ETIQUETAS_ESTADO[$punto['estado']] ?? $punto['estado'] }}</b>
              @endif
            </td>
          </tr>
          @endforeach
        </table>
      </td>
      @endforeach
      @if (count($revision) <= 1) <td class="columna"></td> @endif
    </tr>
  </table>
  <p class="gris" style="margin-top: 6px; font-size: 8.6px;">Se revisó con el cliente presente al recibir el equipo.</p>
  @endif
  @endif

  {{-- Total --}}
  <table class="cierre">
    <tr>
      <td class="letras">
        <div class="gris">Son</div>
        <div><b>{{ MontoEnLetras::bolivianos($servicio->precio_venta) }}</b></div>
        <div class="gris" style="margin-top: 5px;">Documento interno sin valor fiscal.</div>
      </td>
      <td class="totales">
        <div class="total">
          <table>
            <tr>
              <td>TOTAL DEL SERVICIO</td>
              <td class="monto">{{ $bs($servicio->precio_venta) }}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  @if ($notas !== '')
  <div class="pildora">NOTAS DEL SERVICIO</div>
  <div class="texto">{!! $notas !!}</div>
  @endif

  <table class="firmas">
    <tr>
      <td class="trazo"><img src="{{ public_path('images/firma.png') }}" alt=""></td>
      <td class="trazo"></td>
    </tr>
    <tr>
      <td><div class="raya">{{ $tienda['nombre'] }}</div><div class="gris">Firma autorizada</div></td>
      <td><div class="raya">{{ $servicio->cliente }}</div><div class="gris">Recibí conforme el equipo</div></td>
    </tr>
  </table>
</body>

</html>
