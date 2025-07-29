<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Resumen de Servicios Técnicos</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            margin: 30px;
            color: #222;
        }

        .brand {
            text-align: center;
            margin-bottom: 10px;
        }

        .brand img {
            height: 80px;
        }

        .title-top {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            color: #003366;
            margin-bottom: 8px;
        }

        .subtitle {
            text-align: center;
            font-size: 14px;
            color: #555;
            margin-bottom: 30px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        table thead {
            background-color: #003366;
            color: white;
        }

        table th,
        table td {
            border: 1px solid #ccc;
            padding: 6px 8px;
            text-align: left;
        }

        .summary-table {
            margin-top: 40px;
            font-size: 12px;
            width: 60%;
            margin-left: auto;
            margin-right: auto;
            border: 1px solid #ccc;
        }

        .summary-table td {
            padding: 8px;
            border: 1px solid #ccc;
        }

        .summary-table .label {
            font-weight: bold;
            color: #003366;
        }

        .firma-container {
            margin-top: 60px;
            width: 100%;
            text-align: center;
            font-size: 10px;
        }

        .firma-container img {
            height: 60px;
            opacity: 0.95;
        }

        .firma-label {
            margin-top: 4px;
            color: #003366;
            font-weight: bold;
        }

        .resumen-footer {
            font-size: 10px;
            color: #555;
            text-align: center;
            margin-top: 40px;
        }
    </style>
</head>

<body>

    <div class="brand">
        <img src="{{ public_path('images/LOGO.png') }}" alt="Apple Boss">
    </div>

    <h1 class="title-top">APPLE BOSS</h1>
    <div class="subtitle">Resumen de Servicios Técnicos</div>

    <table>
        <thead>
            <tr>
                <th>Código Nota</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Servicio</th>
                <th>Técnico</th>
                <th>Registrado por</th>
                <th>Precio</th>
                <th>Fecha</th>
            </tr>
        </thead>
        <tbody>
            @php
            $totalCosto = 0;
            $totalVenta = 0;
            @endphp

            @foreach ($servicios as $s)
            @php
            $totalCosto += $s->precio_costo;
            $totalVenta += $s->precio_venta;
            @endphp
            <tr>
                <td>{{ $s->codigo_nota }}</td>
                <td>{{ $s->cliente }}</td>
                <td>{{ $s->equipo }}</td>
                <td>{{ $s->detalle_servicio }}</td>
                <td>{{ $s->tecnico }}</td>
                <td>{{ $s->vendedor->name ?? '—' }}</td>
                <td>{{ number_format($s->precio_venta, 2) }} Bs</td>
                <td>{{ \Carbon\Carbon::parse($s->fecha)->format('d/m/Y') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Tabla resumen económico --}}
    <table class="summary-table">
        <tr>
            <td class="label">📦 Total Costo Invertido:</td>
            <td>{{ number_format($totalCosto, 2) }} Bs</td>
        </tr>
        <tr>
            <td class="label">💰 Total Ingresos por Ventas:</td>
            <td>{{ number_format($totalVenta, 2) }} Bs</td>
        </tr>
        <tr>
            <td class="label">📈 Ganancia Neta:</td>
            <td><strong style="color: green;">{{ number_format($totalVenta - $totalCosto, 2) }} Bs</strong></td>
        </tr>
    </table>

    <div class="firma-container">
        <img src="{{ public_path('images/firma.png') }}" alt="Firma">
        <div class="firma-label">Firma autorizada - Apple Boss</div>
    </div>

    <div class="resumen-footer">
        Este documento es un resumen consolidado de todos los servicios técnicos registrados.
    </div>

</body>

</html>