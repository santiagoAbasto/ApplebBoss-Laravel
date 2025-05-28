<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 30px 28px;
    }

    body {
      font-family: 'DejaVu Sans', sans-serif;
      font-size: 10.5px;
      color: #1e1e1e;
      background-color: #fff;
    }

    .header-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #003366;
      margin-bottom: 10px;
    }

    .brand img {
      width: 130px;
    }

    .title-top {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #003366;
      text-transform: uppercase;
      margin-top: -75px;
      margin-bottom: -1px;
    }

    .cotizacion-info {
      text-align: right;
      font-size: 10px;
    }

    .cotizacion-info p {
      margin: 1px 0;
      color: #333;
    }

    .section-title {
      font-size: 12px;
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 5px;
      color: #003366;
      border-bottom: 1px solid #003366;
      padding-bottom: 3px;
    }

    .info p {
      margin: 1px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 10px;
    }

    th {
      background-color: #e9f0fa;
      color: #003366;
      text-align: left;
      padding: 5px;
      font-weight: bold;
      border: 1px solid #d0dce7;
    }

    td {
      padding: 5px;
      border: 1px solid #d0dce7;
    }

    .table-right {
      text-align: right;
    }

    .resumen {
      width: 100%;
      margin-top: 14px;
      font-size: 10.5px;
    }

    .resumen td {
      padding: 3px 5px;
    }

    .resumen tr td:first-child {
      text-align: right;
      font-weight: bold;
      width: 85%;
    }

    .resumen tr td:last-child {
      text-align: right;
      width: 15%;
      color: #003366;
    }

    .notas {
      margin-top: 14px;
      font-size: 10px;
      border-left: 4px solid #003366;
      padding-left: 10px;
      color: #333;
    }

    .firma {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }

    .firma-box {
      text-align: center;
    }

    .firma-box img {
      width: 360px;
      position: relative;
      top: 30px;
    }

    .firma-box p {
      margin: 0;
    }

    footer {
      margin-top: 18px;
      font-size: 9.5px;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #ccc;
      padding-top: 5px;
      color: #444;
    }

    .footer-left p {
      margin: 2px 0;
      display: flex;
      align-items: center;
    }

    .footer-left img {
      width: 11px;
      height: 11px;
      margin-right: 4px;
      vertical-align: middle;
    }

    .footer-right {
      text-align: right;
      font-size: 8px;
      /* letras más pequeñas */
      margin-top: -5px;
      /* sube el bloque hacia arriba */
      line-height: 1.3;
    }
  </style>
</head>

<body>

  <div class="brand">
    <img src="{{ public_path('images/LOGO.png') }}" alt="Apple Boss">
  </div>

  <h1 class="title-top">APPLE BOSS</h1>

  <div class="empresa-legal" style="text-align: left; font-size: 9.8px; color: #333; margin-top: 2px; margin-bottom: 8px; line-height: 1.4;">
    <p><strong>NIT:</strong> 12555473014 </p>
    <p><strong>Tipo Contribuyente:</strong> Empresa Unipersonal</p>
  </div>



  <div class="header-wrap">
    <div></div>
    <div class="cotizacion-info">
      <p><strong>COTIZACIÓN</strong></p>
      <p>Fecha: {{ \Carbon\Carbon::parse($cotizacion->fecha_cotizacion)->format('d/m/Y') }}</p>
      <p>Código: #COT-{{ $cotizacion->id }}</p>
    </div>
  </div>

  <div class="section-title">Datos del Cliente</div>
  <div class="info">
    <p><strong>Nombre:</strong> {{ $cotizacion->nombre_cliente }}</p>
    <p><strong>Teléfono:</strong> {{ $cotizacion->telefono ?? '-' }}</p>
    <p><strong>Correo:</strong> {{ $cotizacion->correo_cliente }}</p>
  </div>

  <div class="section-title">Detalle de Productos/Servicios</div>
  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th class="table-right">Cantidad</th>
        <th class="table-right">P. Neto</th>
        <th class="table-right">IVA</th>
        <th class="table-right">IT</th>
        <th class="table-right">P. c/Factura</th>
        <th class="table-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      @php
      $totalNeto = $totalIVA = $totalIT = $totalFinal = 0;
      @endphp
      @foreach ($cotizacion->items as $item)
      @php
      $base = $item['precio_base'] ?? 0;
      $iva = $base * 0.13;
      $it = $base * 0.03;
      $con_factura = $item['precio_con_factura'] ?? ($base + $iva + $it);
      $subtotal = $con_factura * $item['cantidad'];

      $totalNeto += $base * $item['cantidad'];
      $totalIVA += $iva * $item['cantidad'];
      $totalIT += $it * $item['cantidad'];
      $totalFinal += $subtotal;
      @endphp
      <tr>
        <td>{{ $item['nombre'] }}</td>
        <td class="table-right">{{ $item['cantidad'] }}</td>
        <td class="table-right">Bs {{ number_format($base, 2) }}</td>
        <td class="table-right">Bs {{ number_format($iva, 2) }}</td>
        <td class="table-right">Bs {{ number_format($it, 2) }}</td>
        <td class="table-right">Bs {{ number_format($con_factura, 2) }}</td>
        <td class="table-right">Bs {{ number_format($subtotal, 2) }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  @php
  $descuento = $cotizacion->descuento ?? 0;
  $subtotalConFactura = $totalNeto + $totalIVA + $totalIT;
  $totalSinFacturaConDescuento = max(0, $totalNeto - $descuento);
  $totalConFacturaConDescuento = max(0, $subtotalConFactura - $descuento);
  @endphp

  <table class="resumen">
    <tr>
      <td>SUBTOTAL:</td>
      <td>Bs {{ number_format($totalNeto, 2) }}</td>
    </tr>
    <tr>
      <td>IVA (13%):</td>
      <td>Bs {{ number_format($totalIVA, 2) }}</td>
    </tr>
    <tr>
      <td>IT (3%):</td>
      <td>Bs {{ number_format($totalIT, 2) }}</td>
    </tr>
    @if($descuento > 0)
    <tr>
      <td>DESCUENTO APLICADO:</td>
      <td>- Bs {{ number_format($descuento, 2) }}</td>
    </tr>
    @endif
    <tr>
      <td><strong>TOTAL SIN FACTURA (con descuento):</strong></td>
      <td><strong>Bs {{ number_format($totalSinFacturaConDescuento, 2) }}</strong></td>
    </tr>
    <tr>
      <td><strong>TOTAL CON FACTURA (con descuento):</strong></td>
      <td><strong>Bs {{ number_format($totalConFacturaConDescuento, 2) }}</strong></td>
    </tr>
  </table>

  <div class="notas">
    <strong>Nota:</strong>
    {{ $cotizacion->notas_adicionales ?? 'La cotización es válida por 7 días. La fecha de ejecución se coordinará según disponibilidad.' }}
  </div>

  <div class="firma" style="margin-top: 10px; display: flex; justify-content: flex-end;">
    <div class="firma-box" style="text-align: center;">
      <img src="{{ public_path('images/firma.png') }}"
        alt="Firma Apple Boss"
        style="width: 450px; margin-top: -80px; margin-bottom: -60px;">
      <p style="margin: 2px 0 0; font-size: 12px; color: #003366;">-------------------------------</p>
      <p style="margin: 0; font-style: italic; font-size: 10.5px; font-weight: bold; color: #003366;">
        Firma autorizada - Apple Boss
      </p>
    </div>
  </div>

  <footer>
    <div class="footer-left">
      <p><img src="{{ public_path('images/icon-phone.png') }}" alt=""> +591 75904313</p>
      <p><img src="{{ public_path('images/icon-instagram.png') }}" alt=""> @apple_boss_bol</p>
      <p><img src="{{ public_path('images/icon-facebook.png') }}" alt=""> Apple Boss</p>
      <p><img src="{{ public_path('images/icon-tiktok.png') }}" alt=""> @apple_boss_bo</p>
      <p><img src="{{ public_path('images/icon-location.png') }}" alt=""> Av. Melchor Urquidi, entre Calle Fidel Anze y Av. Julio Rodríguez, Edificio Fidel Anze</p>
    </div>
    <div class="footer-right">
      <p><strong>Validez:</strong><br>Esta cotización tiene validez por 3 días hábiles.</p>
    </div>
  </footer>


</body>

</html>