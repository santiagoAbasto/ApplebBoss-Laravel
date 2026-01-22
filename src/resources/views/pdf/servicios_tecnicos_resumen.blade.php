<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Resumen de Servicios Técnicos</title>

    <style>
        @page { margin: 30px; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10.5px;
            color: #222;
        }

        /* ================= HEADER ================= */
        .brand {
            text-align: center;
            margin-bottom: 10px;
        }

        .brand img {
            height: 70px;
            margin-bottom: 6px;
        }

        .title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #003366;
        }

        .subtitle {
            text-align: center;
            font-size: 11px;
            color: #555;
            margin-bottom: 20px;
        }

        /* ================= TABLA ================= */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }

        thead {
            background-color: #003366;
            color: #fff;
        }

        th {
            text-transform: uppercase;
            font-size: 8.5px;
        }

        th, td {
            border: 1px solid #ccc;
            padding: 6px;
        }

        .text-right {
            text-align: right;
        }

        /* ================= RESUMEN ================= */
        .resumen {
            margin-top: 25px;
            width: 45%;
            float: right;
            font-size: 10px;
        }

        .resumen td {
            padding: 6px;
            border: 1px solid #ccc;
        }

        .label {
            font-weight: bold;
            color: #003366;
        }

        /* ================= FIRMA ================= */
        .firma-container {
            clear: both;
            margin-top: 70px;
            text-align: center;
            font-size: 10px;
        }

        .firma-container img {
            height: 55px;
            opacity: 0.95;
        }

        .firma-label {
            margin-top: 4px;
            font-weight: bold;
            color: #003366;
        }

        .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 9px;
            color: #666;
        }
    </style>
</head>

<body>

    <!-- HEADER -->
    <div class="brand">
        <img src="{{ public_path('images/LOGO.png') }}" alt="Apple Boss">
        <div class="title">APPLE BOSS</div>
        <div class="subtitle">Resumen Consolidado de Servicios Técnicos</div>
    </div>

    <!-- TABLA PRINCIPAL -->
    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Servicio</th>
                <th>Técnico</th>
                <th>Registrado por</th>
                <th class="text-right">Costo (Bs)</th>
                <th class="text-right">Cobro (Bs)</th>
                <th>Fecha</th>
            </tr>
        </thead>
        <tbody>
            @php
                $totalCosto = 0;
                $totalVenta = 0;
            @endphp

            @forelse ($filas as $fila)
                @php
                    $costo = (float) ($fila['costo'] ?? 0);
                    $venta = (float) ($fila['venta'] ?? 0);

                    $totalCosto += $costo;
                    $totalVenta += $venta;
                @endphp
                <tr>
                    <td>{{ $fila['codigo_nota'] }}</td>
                    <td>{{ $fila['cliente'] }}</td>
                    <td>{{ $fila['equipo'] }}</td>
                    <td>{{ strtoupper($fila['servicio']) }}</td>
                    <td>{{ $fila['tecnico'] }}</td>
                    <td>{{ $fila['vendedor'] }}</td>
                    <td class="text-right">{{ number_format($costo, 2) }}</td>
                    <td class="text-right">{{ number_format($venta, 2) }}</td>
                    <td>{{ \Carbon\Carbon::parse($fila['fecha'])->format('d/m/Y') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" style="text-align:center;">
                        No existen registros de servicios técnicos
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- RESUMEN ECONÓMICO -->
    <table class="resumen">
        <tr>
            <td class="label">📦 Total Costo Invertido</td>
            <td class="text-right">{{ number_format($totalCosto, 2) }} Bs</td>
        </tr>
        <tr>
            <td class="label">💰 Total Cobrado</td>
            <td class="text-right">{{ number_format($totalVenta, 2) }} Bs</td>
        </tr>
        <tr>
            <td class="label">📈 Ganancia Neta</td>
            <td class="text-right">
                <strong style="color: {{ ($totalVenta - $totalCosto) >= 0 ? '#198754' : '#dc3545' }}">
                    {{ number_format($totalVenta - $totalCosto, 2) }} Bs
                </strong>
            </td>
        </tr>
    </table>

    <!-- FIRMA -->
    <div class="firma-container">
        <img src="{{ public_path('images/firma.png') }}" alt="Firma">
        <div class="firma-label">Firma autorizada - Apple Boss</div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
        Documento generado automáticamente por el sistema Apple Boss.
    </div>

</body>
</html>
