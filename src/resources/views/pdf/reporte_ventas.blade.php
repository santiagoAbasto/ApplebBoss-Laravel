<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 40px 35px; }
    body {
      font-family: 'DejaVu Sans', sans-serif;
      font-size: 10.5px;
      color: #333;
    }
    header { text-align: center; margin-bottom: 20px; }
    header img { width: 130px; margin-bottom: 5px; }
    h1 { font-size: 20px; color: #0b2c4d; margin: 0; }
    .subtitulo { font-size: 13px; font-weight: 500; color: #555; }
    .fecha-reporte { text-align: right; font-size: 10px; margin-bottom: 10px; }
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
    th { background-color: #f8f9fa; font-weight: 600; }
    .col-cantidad { width: 28px !important; white-space: nowrap !important; }
    .text-right { text-align: right; white-space: nowrap; }
    .text-success { color: #198754; font-weight: bold; }
    .text-danger { color: #dc3545; font-weight: bold; }
    .text-muted { color: #6c757d; }
    .small-note { font-size: 8px; line-height: 1; }
    .divider { border-top: 2px solid #0b2c4d; margin: 30px 0 20px; }
    .resumen-final {
      font-size: 12px;
      font-weight: 600;
      text-align: right;
    }
    .resumen-final .label { color: #000; font-weight: bold; margin-right: 10px; }
    .resumen-final .value { color: #198754; }
    .firma {
      margin-top: 50px;
      text-align: center;
    }
    .firma img {
      width: 220px;
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
  <h1>REPORTE DE VENTAS</h1>
  <p class="subtitulo">Apple Boss · Productos y Servicios</p>
</header>

<div class="fecha-reporte">
  Fecha del Reporte: {{ now()->format('d/m/Y') }}
</div>

<table>
  <thead>
    <tr>
      <th>Fecha</th>
      <th>Producto</th>
      <th>Tipo</th>
      <th class="col-cantidad">Cant.</th>
      <th>Precio Costo</th>
      <th>Precio Venta</th>
      <th>Descuento</th>
      <th>Permuta</th>
      <th>Subtotal</th>
      <th>Ganancia Final</th>
      <th>Vendedor</th>
    </tr>
  </thead>
  <tbody>
    @php
      $total = 0; $gananciaTotal = 0;
    @endphp
    @foreach($ventas->sortBy('fecha') as $v)
    @php
        $precioCosto = $v->precio_invertido ?? 0;
        $descuento = $v->descuento ?? 0;
        $precioVenta = $v->precio_venta ?? 0;
        $permuta = $v->permuta ?? 0;
        $subtotal = $precioVenta - $descuento - $permuta;
        $ganancia = $subtotal - $precioCosto;
        $total += $subtotal;
        $gananciaTotal += $ganancia;

        $tipo = $v->tipo ?? '—';
        $producto = $v->producto ?? '—';
      @endphp
      <tr>
        <td>{{ \Carbon\Carbon::parse($v->fecha ?? now())->format('d/m/Y') }}</td>
        <td>{{ $producto }}</td>
        <td>{{ $tipo }}</td>
        <td>{{ $v->cantidad ?? 1 }}</td>
        <td class="text-right">{{ number_format($precioCosto, 2) }} Bs</td>
        <td class="text-right">{{ number_format($precioVenta, 2) }} Bs</td>
        <td class="text-right">-{{ number_format($descuento, 2) }} Bs</td>
        <td class="text-right">-{{ number_format($permuta, 2) }} Bs</td>
        <td class="text-right">{{ number_format($subtotal, 2) }} Bs</td>
        <td class="text-right">
          @if($ganancia < 0)
            <span class="text-danger">
              -{{ number_format(abs($ganancia), 2) }} Bs<br>
              <span class="small-note">(Se invirtió)</span>
            </span>
          @else
            <span class="text-success">{{ number_format($ganancia, 2) }} Bs</span>
          @endif
        </td>
        <td>{{ $v->vendedor ?? '—' }}</td>
      </tr>
    @endforeach
  </tbody>
</table>

<div class="divider"></div>

<div class="resumen-final">
  <div><span class="label">Total de Ventas:</span> <span class="value">{{ number_format($total, 2) }} Bs</span></div>
  <div><span class="label">Ganancia Neta Total:</span>
    @if($gananciaTotal > 0)
      <span class="value">{{ number_format($gananciaTotal, 2) }} Bs</span>
    @else
      <span class="text-muted">Se invirtió</span>
    @endif
  </div>
</div>

<div class="firma">
  <p>Firma autorizada:</p>
  <img src="{{ public_path('images/firma.png') }}" alt="Firma Gerente">
  <p><strong>Santiago Abasto</strong><br>Gerente General · Apple Boss</p>
</div>

</body>
</html>
