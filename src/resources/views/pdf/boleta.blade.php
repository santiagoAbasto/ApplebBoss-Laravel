<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 30px 28px; }
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
    .brand img { width: 130px; }
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
    .venta-info p { margin: 1px 0; color: #333; }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      margin-top: 14px;
      margin-bottom: 6px;
      color: #003366;
      border-bottom: 1px solid #003366;
      padding-bottom: 3px;
    }
    .info p { margin: 1px 0; }
    table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
  font-size: 10px;
  text-align: center; /* Centrado para todas las celdas */
}

th {
  background-color: #e9f0fa;
  color: #003366;
  text-align: center; /* ✅ Esto centra los encabezados */
  padding: 6px;
  border: 1px solid #d0dce7;
}

    td {
      padding: 6px;
      border: 1px solid #d0dce7;
      vertical-align: top;
    }
    .table-right { text-align: right; }
    .resumen {
      width: 100%;
      margin-top: 14px;
      font-size: 10.5px;
    }
    .resumen td { padding: 3px 5px; }
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
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
    }
    .firma-box {
      text-align: center;
      width: 48%;
    }
    .firma-box img {
      width: 320px;
      position: relative;
      top: 30px;
    }
    .centrado th,
.centrado td {
  text-align: center;
  vertical-align: middle;
}

    .firma-box p { margin: 0; }
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
      <p><strong>BOLETA DE VENTA</strong></p>
      @php $fechaFormateada = \Carbon\Carbon::parse($venta->fecha)->format('d/m/Y H:i'); @endphp
      <p>Fecha: {{ $fechaFormateada }}</p>
      <p>ID Venta: #{{ $venta->id }}</p>
    </div>
  </div>

  <div class="section-title">Datos del Cliente</div>
  <div class="info">
    <p><strong>Cliente:</strong> {{ $venta->nombre_cliente }}</p>
    <p><strong>Teléfono:</strong> {{ $venta->telefono_cliente ?? '-' }}</p>
    <p><strong>Método de pago:</strong> {{ ucfirst($venta->metodo_pago) }}</p>
    <p><strong>Vendedor:</strong> {{ $venta->vendedor->name ?? '---' }}</p>
  </div>

  @php
    $celulares = $venta->items->where('tipo', 'celular');
    $computadoras = $venta->items->where('tipo', 'computadora');
    $productosApple = $venta->items->where('tipo', 'producto_apple');
    $generales = $venta->items->where('tipo', 'producto_general');
@endphp

  @endphp

<!-- El contenido del <head> permanece igual (omitido aquí por brevedad) -->

@if ($celulares->count())
  <div class="section-title">Celulares Vendidos</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: center;">
  <thead>
      <tr>
        <th>#</th>
        <th>Modelo</th>
        <th>Capacidad</th>
        <th>Color</th>
        <th>IMEI 1</th>
        <th>IMEI 2</th>
        <th>Batería</th>
        <th>Estado IMEI</th>
        <th class="table-right">Precio</th>
        <th class="table-right">Descuento</th>
        <th class="table-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($celulares as $i => $item)
        <tr>
          <td>{{ $i + 1 }}</td>
          <td>{{ $item->celular->modelo }}</td>
          <td>{{ $item->celular->capacidad }}</td>
          <td>{{ $item->celular->color }}</td>
          <td>{{ $item->celular->imei_1 }}</td>
          <td>{{ $item->celular->imei_2 }}</td>
          <td>{{ $item->celular->bateria }}</td>
          <td>{{ $item->celular->estado_imei }}</td>
          <td class="table-right">Bs {{ number_format($item->precio_venta, 2) }}</td>
          <td class="table-right">Bs {{ number_format($item->descuento, 2) }}</td>
          <td class="table-right">Bs {{ number_format($item->subtotal, 2) }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  @if ($computadoras->count())
  <div class="section-title">Computadoras Vendidas</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Nombre</th>
        <th>Procesador</th>
        <th>RAM</th>
        <th>Almacenamiento</th>
        <th>Batería</th>
        <th>Color</th>
        <th>Serie</th>
        <th class="table-right">Precio</th>
        <th class="table-right">Descuento</th>
        <th class="table-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($computadoras as $i => $item)
        <tr>
          <td>{{ $i + 1 }}</td>
          <td>{{ $item->computadora->nombre }}</td>
          <td>{{ $item->computadora->procesador }}</td>
          <td>{{ $item->computadora->ram }}</td>
          <td>{{ $item->computadora->almacenamiento }}</td>
          <td>{{ $item->computadora->bateria }}</td>
          <td>{{ $item->computadora->color }}</td>
          <td>{{ $item->computadora->numero_serie }}</td>
          <td class="table-right">Bs {{ number_format($item->precio_venta, 2) }}</td>
          <td class="table-right">Bs {{ number_format($item->descuento, 2) }}</td>
          <td class="table-right">Bs {{ number_format($item->subtotal, 2) }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  @if ($productosApple->count())
  <div class="section-title">Productos Apple Vendidos</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Modelo</th>
        <th>Capacidad</th>
        <th>Batería</th>
        <th>Color</th>
        <th>Serie / IMEI</th>
        <th>Tiene IMEI</th>
        <th>Estado IMEI</th>
        <th class="table-right">Precio</th>
        <th class="table-right">Descuento</th>
        <th class="table-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($productosApple as $i => $item)
        <tr>
          <td>{{ $i + 1 }}</td>
          <td>{{ $item->productoApple->modelo }}</td>
          <td>{{ $item->productoApple->capacidad }}</td>
          <td>{{ $item->productoApple->bateria }}</td>
          <td>{{ $item->productoApple->color }}</td>
          <td>
            @if($item->productoApple->tiene_imei)
              IMEI 1: {{ $item->productoApple->imei_1 }}<br>
              IMEI 2: {{ $item->productoApple->imei_2 }}
            @else
              {{ $item->productoApple->numero_serie }}
            @endif
          </td>
          <td>{{ $item->productoApple->tiene_imei ? 'Sí' : 'No' }}</td>
          <td>{{ $item->productoApple->estado_imei ?? '-' }}</td>
          <td class="table-right">Bs {{ number_format($item->precio_venta, 2) }}</td>
          <td class="table-right">Bs {{ number_format($item->descuento, 2) }}</td>
          <td class="table-right">Bs {{ number_format($item->subtotal, 2) }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
@endif

  @if ($generales->count())
  <div class="section-title">Productos Generales Vendidos</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Nombre</th>
        <th>Tipo</th>
        <th>Código</th>
        <th class="table-right">Precio</th>
        <th class="table-right">Descuento</th>
        <th class="table-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($generales as $i => $item)
        <tr>
          <td>{{ $i + 1 }}</td>
          <td>{{ $item->productoGeneral->nombre }}</td>
          <td>{{ $item->productoGeneral->tipo }}</td>
          <td>{{ $item->productoGeneral->codigo }}</td>
          <td class="table-right">Bs {{ number_format($item->precio_venta, 2) }}</td>
          <td class="table-right">Bs {{ number_format($item->descuento, 2) }}</td>
          <td class="table-right">Bs {{ number_format($item->subtotal, 2) }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  @if ($venta->entregadoCelular || $venta->entregadoComputadora || $venta->entregadoProductoGeneral || $venta->entregadoProductoApple)
  <div class="section-title">Producto Entregado en Permuta</div>

  @if ($venta->entregadoCelular)
    <table>
      <thead>
        <tr>
          <th>Modelo</th>
          <th>Capacidad</th>
          <th>Color</th>
          <th>IMEI 1</th>
          <th>IMEI 2</th>
          <th>Batería</th>
          <th>Estado IMEI</th>
          <th class="table-right">Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ $venta->entregadoCelular->modelo }}</td>
          <td>{{ $venta->entregadoCelular->capacidad }}</td>
          <td>{{ $venta->entregadoCelular->color }}</td>
          <td>{{ $venta->entregadoCelular->imei_1 }}</td>
          <td>{{ $venta->entregadoCelular->imei_2 }}</td>
          <td>{{ $venta->entregadoCelular->bateria }}</td>
          <td>{{ $venta->entregadoCelular->estado_imei }}</td>
          <td class="table-right">Bs {{ number_format($venta->entregadoCelular->precio_costo, 2) }}</td>
        </tr>
      </tbody>
    </table>
  @endif

  @if ($venta->entregadoComputadora)
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Procesador</th>
          <th>RAM</th>
          <th>Almacenamiento</th>
          <th>Batería</th>
          <th>Color</th>
          <th>Serie</th>
          <th class="table-right">Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ $venta->entregadoComputadora->nombre }}</td>
          <td>{{ $venta->entregadoComputadora->procesador }}</td>
          <td>{{ $venta->entregadoComputadora->ram }}</td>
          <td>{{ $venta->entregadoComputadora->almacenamiento }}</td>
          <td>{{ $venta->entregadoComputadora->bateria }}</td>
          <td>{{ $venta->entregadoComputadora->color }}</td>
          <td>{{ $venta->entregadoComputadora->numero_serie }}</td>
          <td class="table-right">Bs {{ number_format($venta->entregadoComputadora->precio_costo, 2) }}</td>
        </tr>
      </tbody>
    </table>
  @endif

  @if ($venta->entregadoProductoGeneral)
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Código</th>
          <th class="table-right">Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ $venta->entregadoProductoGeneral->nombre }}</td>
          <td>{{ $venta->entregadoProductoGeneral->tipo }}</td>
          <td>{{ $venta->entregadoProductoGeneral->codigo }}</td>
          <td class="table-right">Bs {{ number_format($venta->entregadoProductoGeneral->precio_costo, 2) }}</td>
        </tr>
      </tbody>
    </table>
  @endif
  @if ($venta->entregadoProductoApple)
  <table>
    <thead>
      <tr>
        <th>Modelo</th>
        <th>Capacidad</th>
        <th>Batería</th>
        <th>Color</th>
        <th>IMEI 1</th>
        <th>IMEI 2</th>
        <th>Serie</th>
        <th>Estado IMEI</th>
        <th class="table-right">Valor</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ $venta->entregadoProductoApple->modelo }}</td>
        <td>{{ $venta->entregadoProductoApple->capacidad }}</td>
        <td>{{ $venta->entregadoProductoApple->bateria }}</td>
        <td>{{ $venta->entregadoProductoApple->color }}</td>
        <td>{{ $venta->entregadoProductoApple->imei_1 }}</td>
        <td>{{ $venta->entregadoProductoApple->imei_2 }}</td>
        <td>{{ $venta->entregadoProductoApple->numero_serie }}</td>
        <td>{{ $venta->entregadoProductoApple->estado_imei }}</td>
        <td class="table-right">Bs {{ number_format($venta->entregadoProductoApple->precio_costo, 2) }}</td>
      </tr>
    </tbody>
  </table>
@endif
@endif


  <table class="resumen">
  <tr>
    <td>Subtotal:</td>
    <td>Bs {{ number_format($venta->subtotal, 2) }}</td>
  </tr>

  @if ($venta->valor_permuta > 0)
  <tr>
    <td>Valor de producto en permuta:</td>
    <td>- Bs {{ number_format($venta->valor_permuta, 2) }}</td>
  </tr>
  @endif

  <tr>
    <td><strong>Total a pagar:</strong></td>
    <td><strong>Bs {{ number_format($venta->subtotal - $venta->valor_permuta, 2) }}</strong></td>
  </tr>
</table>

  @if ($venta->notas_adicionales)
    <div class="notas">
      <strong>Notas:</strong> {{ $venta->notas_adicionales }}
    </div>
  @endif
  <table style="width: 100%; margin-top: 40px; font-size: 10.5px; text-align: center; border-collapse: collapse;">
  <!-- Fila de firma: imagen (izquierda) y espacio vacío (derecha) -->
  <tr>
    <!-- Columna izquierda: firma Apple Boss con imagen grande y posicionamiento absoluto -->
    <td style="width: 50%; position: relative; height: 80px; padding: 0;">
      <img src="{{ public_path('images/firma.png') }}" alt="Firma AppleBoss"
           style="
             width: 380px;
             height: auto;
             position: absolute;
             top: -60px;
             left: 50%;
             transform: translateX(-50%);
             opacity: 0.95;
           ">
    </td>

    <!-- Columna derecha: espacio vacío para mantener alineación -->
    <td style="width: 50%; height: 80px;"></td>
  </tr>

  <!-- Fila de nombres debajo de la firma -->
  <tr>
    <td style="font-weight: bold; color: #003366; padding-top: 5px;">
      Firma autorizada - Apple Boss
    </td>
    <td style="font-weight: bold; color: #003366; padding-top: 5px;">
      Firma del Cliente
    </td>
  </tr>

  <!-- Fila de aclaración para el cliente -->
  <tr>
    <td></td>
    <td style="font-size: 9px; color: #555; padding-top: 4px;">
      Conforme con la recepción del producto
    </td>
  </tr>
</table>


</body>
</html>
