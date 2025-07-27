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
    }

    .header-wrap {
      display: flex;
      justify-content: space-between;
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
      margin-top: -75px;
    }

    .venta-info {
      text-align: right;
      font-size: 10px;
    }

    .venta-info p {
      margin: 1px 0;
      color: #333;
    }

    .section-title {
      font-size: 12px;
      font-weight: bold;
      margin-top: 14px;
      margin-bottom: 6px;
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
      text-align: center;
    }

    th,
    td {
      border: 1px solid #d0dce7;
      padding: 6px;
      vertical-align: middle;
    }

    th {
      background-color: #e9f0fa;
      color: #003366;
    }

    .notas {
      margin-top: 14px;
      font-size: 10px;
      border-left: 4px solid #003366;
      padding-left: 10px;
      color: #333;
    }

    .resumen-final {
      margin-top: 20px;
      font-size: 12px;
      font-weight: bold;
      text-align: right;
      color: #003366;
    }

    .firmas {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: flex-start;
    }

    .firma-box {
      width: 48%;
      text-align: center;
    }

    .firma-box img {
      width: 120px;
      margin-bottom: 8px;
    }

    .firma-line {
      border-top: 1px solid #999;
      margin-top: 40px;
      margin-bottom: 4px;
    }

    .firma-text {
      font-size: 10px;
      color: #555;
    }
  </style>
</head>

<body>

  <div class="brand">
    <img src="{{ public_path('images/LOGO.png') }}" alt="Apple Boss">
  </div>

  <h1 class="title-top">APPLE BOSS</h1>

  <div class="header-wrap">
    <div class="empresa-legal" style="font-size: 9.8px; color: #333;">
      <p><strong>NIT:</strong> 12555473014</p>
      <p><strong>Contribuyente:</strong> Empresa Unipersonal</p>
    </div>
    <div class="venta-info">
      <p><strong>BOLETA DE SERVICIO TÉCNICO</strong></p>
      <p>Fecha: {{ \Carbon\Carbon::parse($servicio->fecha)->format('d/m/Y') }}</p>
      <p>Código Nota: {{ $servicio->codigo_nota ?? '---' }}</p>
    </div>
  </div>

  <div class="section-title">Datos del Cliente</div>
  <div class="info">
    <p><strong>Cliente:</strong> {{ strtoupper($servicio->cliente) }}</p>
    <p><strong>Teléfono:</strong> {{ $servicio->telefono ?? '—' }}</p>
  </div>

  <div class="section-title">Detalle del Servicio</div>
  <table>
    <thead>
      <tr>
        <th>Equipo</th>
        <th>Servicio</th>
        <th>Técnico</th>
        <th>Registrado por</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ $servicio->equipo }}</td>
        <td>{{ $servicio->detalle_servicio }}</td>
        <td>{{ $servicio->tecnico }}</td>
        <td>{{ $servicio->vendedor->name ?? '—' }}</td>
      </tr>
    </tbody>
  </table>

  <div class="resumen-final">
    Total a pagar por el cliente: Bs {{ number_format($servicio->precio_venta, 2) }}
  </div>

  <table style="width: 100%; margin-top: 90px; font-size: 10.5px; text-align: center; border-collapse: collapse;">
    <tr>
      <td style="width: 50%; position: relative; height: 80px; padding: 0;">
        <img src="{{ public_path('images/firma.png') }}" alt="Firma AppleBoss"
          style="
          width: 150px;
          height: auto;
          position: absolute;
          top: 0px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0.95;
        ">
      </td>
      <td style="width: 50%; height: 80px;"></td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #003366; padding-top: 5px;">
        Firma autorizada - Apple Boss
      </td>
      <td style="font-weight: bold; color: #003366; padding-top: 5px;">
        Firma del Cliente
      </td>
    </tr>
    <tr>
      <td></td>
      <td style="font-size: 9px; color: #555; padding-top: 4px;">
        Conforme con la recepción del producto
      </td>
    </tr>
  </table>
</body>

</html>