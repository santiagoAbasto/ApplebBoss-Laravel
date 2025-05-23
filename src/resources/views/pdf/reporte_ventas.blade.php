<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
    th { background-color: #f0f0f0; }
    h2 { text-align: center; }
  </style>
</head>
<body>
  <h2>Reporte de Ventas</h2>
  @if($fecha_inicio && $fecha_fin)
    <p>Del {{ $fecha_inicio }} al {{ $fecha_fin }}</p>
  @endif

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Cliente</th>
        <th>Producto Vendido</th>
        <th>Cantidad</th>
        <th>Subtotal</th>
        <th>Permuta</th>
        <th>Vendedor</th>
      </tr>
    </thead>
    <tbody>
      @php $totalSubtotal = 0; @endphp
      @foreach ($ventas as $v)
        @php $totalSubtotal += $v->subtotal; @endphp
        <tr>
          <td>{{ $v->fecha }}</td>
          <td>{{ $v->nombre_cliente }}</td>
          <td>
            @if ($v->celular)
              Celular: {{ $v->celular->modelo }} (IMEI: {{ $v->celular->imei_1 }})
            @elseif ($v->computadora)
              Computadora: {{ $v->computadora->nombre }}
            @elseif ($v->productoGeneral)
              Producto: {{ $v->productoGeneral->nombre }}
            @else
              Servicio Técnico
            @endif
          </td>
          <td>{{ $v->cantidad }}</td>
          <td>{{ number_format($v->subtotal, 2) }} Bs</td>
          <td>
            @if ($v->es_permuta && is_array($v->permuta))
              @if ($v->tipo_permuta == 'celular' && isset($v->permuta['modelo']))
                Celular: {{ $v->permuta['modelo'] }} ({{ $v->permuta['imei_1'] ?? '-' }})<br>
                Precio Ref: {{ number_format($v->permuta['precio_costo'] ?? 0, 2) }} Bs
              @elseif ($v->tipo_permuta == 'computadora' && isset($v->permuta['nombre']))
                PC: {{ $v->permuta['nombre'] }}<br>
                Precio Ref: {{ number_format($v->permuta['precio_costo'] ?? 0, 2) }} Bs
              @elseif ($v->tipo_permuta == 'producto_general' && isset($v->permuta['nombre']))
                Producto: {{ $v->permuta['nombre'] }}<br>
                Precio Ref: {{ number_format($v->permuta['precio_costo'] ?? 0, 2) }} Bs
              @endif
            @else
              —
            @endif
          </td>
          <td>{{ $v->vendedor->name ?? 'Sin asignar' }}</td>
        </tr>
      @endforeach
    </tbody>
    <tfoot>
      <tr>
        <th colspan="4">Total</th>
        <th>{{ number_format($totalSubtotal, 2) }} Bs</th>
        <th colspan="2"></th>
      </tr>
    </tfoot>
  </table>
</body>
</html>
