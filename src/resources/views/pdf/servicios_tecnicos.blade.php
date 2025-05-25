<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 40px 35px;
    }

    body {
      font-family: 'DejaVu Sans', sans-serif;
      font-size: 10.5px;
      color: #333;
    }

    header {
      text-align: center;
      margin-bottom: 20px;
    }

    header img {
      width: 130px;
      margin-bottom: 5px;
    }

    h1 {
      font-size: 20px;
      color: #0b2c4d;
      margin: 0;
    }

    .subtitulo {
      font-size: 13px;
      font-weight: 500;
      color: #555;
    }

    .fecha-reporte {
      text-align: right;
      font-size: 10px;
      margin-bottom: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-bottom: 10px;
    }

    th, td {
      border: 1px solid #dee2e6;
      padding: 6px 4px;
      text-align: center;
      vertical-align: middle;
      word-wrap: break-word;
    }

    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }

    .text-right {
      text-align: right;
      white-space: nowrap;
    }

    .text-success {
      color: #198754;
      font-weight: bold;
    }

    .divider {
      border-top: 2px solid #0b2c4d;
      margin: 30px 0 20px;
    }

    .resumen-final {
      font-size: 12px;
      font-weight: 600;
      text-align: right;
    }

    .resumen-final .label {
      color: #000;
      font-weight: bold;
      margin-right: 10px;
    }

    .resumen-final .value {
      color: #198754;
    }

    .firma {
      margin-top: 50px;
      text-align: center;
    }

    .firma img {
      width: 380px;
      margin-bottom: 10px;
    }

    .firma p {
      font-size: 14px;
      margin: 0;
      line-height: 1.3;
    }
  </style>
</head>
<body>

<header>
  <img src="{{ public_path('images/logo.png') }}" alt="Apple Boss Logo">
  <h1>REPORTE DE SERVICIO TÉCNICO</h1>
  <p class="subtitulo">Apple Boss · Servicios</p>
</header>

<div class="fecha-reporte">
  Fecha del Reporte: {{ now('America/La_Paz')->format('d/m/Y') }}
</div>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Cliente</th>
      <th>Equipo</th>
      <th>Técnico</th>
      <th>Precio Costo</th>
      <th>Precio Venta</th>
      <th>Ganancia</th>
      <th>Fecha</th>
      <th>Vendedor</th>
    </tr>
  </thead>
  <tbody>
    @php $total = 0; $gananciaTotal = 0; @endphp
    @foreach ($servicios as $i => $s)
      @php
        $costo = $s->precio_costo ?? 0;
        $venta = $s->precio_venta ?? 0;
        $ganancia = max(0, $venta - $costo);
        $total += $venta;
        $gananciaTotal += $ganancia;
      @endphp
      <tr>
        <td>{{ $i + 1 }}</td>
        <td>{{ strtoupper($s->cliente) }}</td>
        <td>{{ $s->equipo }}</td>
        <td>{{ $s->tecnico }}</td>
        <td class="text-right">{{ number_format($costo, 2) }} Bs</td>
        <td class="text-right">{{ number_format($venta, 2) }} Bs</td>
        <td class="text-right text-success">{{ number_format($ganancia, 2) }} Bs</td>
        <td>{{ \Carbon\Carbon::parse($s->fecha)->format('d/m/Y') }}</td>
        <td>{{ $s->vendedor->name ?? '—' }}</td>
      </tr>
    @endforeach
  </tbody>
</table>

<div class="divider"></div>

<div class="resumen-final">
  <div><span class="label">Total de Ventas:</span> <span class="value">{{ number_format($total, 2) }} Bs</span></div>
  <div><span class="label">Ganancia Neta Total:</span> <span class="value">{{ number_format($gananciaTotal, 2) }} Bs</span></div>
</div>

<div class="firma">
  <p>Firma autorizada:</p>
  <img src="{{ public_path('images/firma.png') }}" alt="Firma Gerente">
  <p><strong>Santiago Abasto</strong><br>Gerente General · Apple Boss</p>
</div>

</body>
</html>
