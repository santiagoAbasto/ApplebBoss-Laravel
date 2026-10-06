@php
  use App\Models\Diagnostico;
  use App\Support\DatosDeLaTienda;
  use App\Support\IconoPdf;

  $tienda  = DatosDeLaTienda::paraPdf();
  $listo   = $diagnostico->listo();
  $pruebas = $diagnostico->pruebasHechas();
  $fecha   = ($diagnostico->fecha ?? $diagnostico->created_at)?->format('d/m/Y');
  $parrafo = fn (?string $t) => nl2br(e((string) $t));
  $contacto = collect([$diagnostico->cliente_telefono, $diagnostico->cliente_correo])->filter()->implode(' · ');
@endphp
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <title>Informe técnico {{ $diagnostico->codigo }}</title>
  @include('pdf.partials.estilos')
  <style>
    .resultado-falla { color: #b3261e; font-weight: bold; }
    .firmas td { width: 33%; padding: 0 12px; }
    .firmas .sello { margin: 0 auto; }
  </style>
</head>

<body>
  @include('pdf.partials.membrete', ['tipo' => 'INFORME TÉCNICO', 'codigo' => $diagnostico->codigo, 'cuando' => 'Fecha de revisión: ' . $fecha])

  {{-- La firma certifica lo que vio el técnico: sin pruebas, conclusión y técnico el informe es un borrador --}}
  @unless ($listo)
  <div class="banda" style="margin-top: 14px;">
    <img class="ico" src="{{ IconoPdf::uri('alerta', '#0d0d0d') }}" alt=""><b>BORRADOR SIN VALIDEZ.</b>
    {{ $diagnostico->queFalta() }}. Se entrega firmado y sellado cuando el técnico termina la revisión.
  </div>
  @endunless

  <table class="tarjetas">
    <tr>
      @foreach ([
        ['cliente', 'Cliente', $diagnostico->cliente_nombre, $contacto],
        ['celular', 'Equipo', $diagnostico->equipo, $diagnostico->identificador ? 'IMEI / serie: ' . $diagnostico->identificador : null],
        ['herramienta', 'Técnico responsable', $diagnostico->tecnico ?: '---', null],
      ] as $n => [$ic, $rotulo, $valor, $extra])
      @if ($n) <td class="hueco-col"></td> @endif
      <td style="width: {{ $n === 2 ? '26%' : '36%' }};">
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

  <div class="pildora">FALLA REPORTADA POR EL CLIENTE</div>
  <div class="texto">{!! $parrafo($diagnostico->falla_reportada) !!}</div>
  <p class="gris" style="margin-top: 4px; font-size: 8.4px;">Es lo que declaró el cliente al entregar el equipo, no un resultado de la revisión.</p>

  <div class="pildora"><img class="ico" src="{{ IconoPdf::uri('revision', '#c8f902') }}" alt="">PRUEBAS REALIZADAS</div>
  @if ($pruebas)
  <table class="cobertura">
    <thead>
    <tr>
      <th style="width: 34%;">Prueba</th>
      <th style="width: 20%;">Resultado</th>
      <th>Observación</th>
    </tr>
    </thead>
    @foreach ($pruebas as $p)
    <tr class="{{ $loop->last ? 'ultima' : '' }}">
      <td><b>{{ $p['prueba'] }}</b></td>
      <td class="{{ $p['resultado'] === 'falla' ? 'resultado-falla' : '' }}">{{ Diagnostico::RESULTADOS[$p['resultado']] }}</td>
      <td>{{ $p['detalle'] ?? '' }}</td>
    </tr>
    @endforeach
  </table>
  @else
  <p class="gris">Todavía no se registraron pruebas.</p>
  @endif

  <div class="pildora">CONCLUSIÓN DEL TÉCNICO</div>
  @if (filled($diagnostico->conclusion))
  <div class="texto">{!! $parrafo($diagnostico->conclusion) !!}</div>
  @else
  <p class="gris">Pendiente de la revisión técnica.</p>
  @endif

  @if (filled($diagnostico->recomendacion))
  <div class="pildora">RECOMENDACIÓN</div>
  <div class="texto">{!! $parrafo($diagnostico->recomendacion) !!}</div>
  @endif

  <p class="gris" style="margin-top: 12px; font-size: 8.4px;">
    Este informe describe el estado del equipo en la fecha de la revisión y se limita a las pruebas detalladas arriba.
  </p>

  <table class="firmas holgada">
    <tr>
      <td class="trazo">@if ($listo)<img src="{{ public_path('images/firma.png') }}" alt="">@endif</td>
      <td class="trazo">@if ($listo)<div class="sello"><img src="{{ public_path('images/logo-pdf.png') }}" alt=""></div>@endif</td>
      <td class="trazo"></td>
    </tr>
    <tr>
      <td><div class="raya">{{ $tienda['nombre'] }}</div><div class="gris">Firma autorizada</div></td>
      <td><div class="raya">Sello</div><div class="gris">{{ $tienda['nombre'] }}</div></td>
      <td><div class="raya">{{ $diagnostico->tecnico ?: 'Técnico' }}</div><div class="gris">Técnico responsable</div></td>
    </tr>
  </table>
</body>

</html>
