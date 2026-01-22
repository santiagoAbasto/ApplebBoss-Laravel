<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">

    <style>
        /* =====================
   PAGE CONFIG
===================== */
        @page {
            margin: 0;
        }

        /* =====================
   BASE
===================== */
        html,
        body {
            width: 80mm;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9px;
            color: #111;
        }

        /* =====================
   WRAPPER (CENTRADO REAL)
===================== */
        .wrapper {
            width: 72mm;
            margin: 0 auto;
            padding: 22px 8px 10px 8px;
            /* 👈 baja logo + márgenes iguales */
            box-sizing: border-box;
        }

        /* =====================
   UTIL
===================== */
        .center {
            text-align: center;
        }

        .right {
            text-align: right;
        }

        .bold {
            font-weight: bold;
        }

        /* =====================
   HEADER
===================== */
        .logo {
            text-align: center;
            margin-bottom: 6px;
        }

        .logo img {
            width: 95px;
            /* 👈 logo más contenido */
        }

        .brand {
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }

        .brand-sub {
            font-size: 8px;
            line-height: 1.4;
        }

        /* =====================
   DIVIDER
===================== */
        .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
        }

        /* =====================
   SECTION TITLES
===================== */
        .section-title {
            font-size: 10px;
            font-weight: bold;
            margin: 6px 0 4px;
            text-transform: uppercase;
        }

        /* =====================
   INFO
===================== */
        .info p {
            margin: 2px 0;
        }

        /* =====================
   ITEMS
===================== */
        .item {
            margin-bottom: 6px;
        }

        .item-name {
            font-weight: bold;
            text-transform: uppercase;
        }

        .item-meta {
            font-size: 8px;
            line-height: 1.3;
            margin-top: 2px;
        }

        .price-line {
            display: flex;
            justify-content: space-between;
            margin-top: 2px;
            font-weight: bold;
        }

        /* =====================
   PERMUTA
===================== */
        .permuta {
            font-size: 8px;
            margin-top: 2px;
            color: #444;
        }


        /* =====================
   TOTAL (APPLE BOSS)
===================== */
        .total-box {
            margin-top: 10px;
            padding-top: 2px;
            /* solo aire, sin línea */
            text-align: right;
        }

        .total-label {
            font-size: 9px;
            font-weight: 600;
            color: #1f3a5f;
            /* azul marino suave */
            letter-spacing: 0.4px;
        }

        .total-amount {
            font-size: 17px;
            font-weight: bold;
            color: #0f2f5c;
            /* azul marino Apple Boss */
            letter-spacing: 0.6px;
        }



        /* =====================
   NOTES
===================== */
        .notes {
            margin-top: 6px;
            font-size: 9px;
        }

        /* =====================
   FOOTER
===================== */
        .footer {
            margin-top: 12px;
            text-align: center;
            font-size: 8px;
            line-height: 1.4;
        }
    </style>
</head>

<body>
    <div class="wrapper">

        <!-- LOGO -->
        <div class="logo">
            <img src="{{ public_path('images/LOGO.png') }}" alt="Apple Boss">
        </div>

        <!-- BRAND -->
        <div class="center">
            <div class="brand">APPLE BOSS</div>
            <div class="brand-sub">
                Av. Melchor Urquidi entre Calle Fidel Anze<br>
                y Av. Julio Rodriguez · Cochabamba<br>
                <strong>WhatsApp: +591 75 90 4313</strong>
            </div>
        </div>

        <div class="divider"></div>

        <!-- INFO -->
        <div class="info">
            <p><strong>Fecha:</strong> {{ optional($venta->created_at)->timezone(config('app.timezone'))->format('d/m/Y H:i') }}</p>
            <p><strong>N° Nota:</strong> {{ $venta->codigo_nota }}</p>
            <p><strong>Cliente:</strong> {{ $venta->nombre_cliente }}</p>
            <p><strong>Tel:</strong> {{ $venta->telefono_cliente ?? '—' }}</p>
            <p><strong>Vendedor:</strong> {{ $venta->vendedor->name ?? '—' }}</p>
        </div>

        <div class="divider"></div>

        <!-- ITEMS -->
        @foreach($venta->items as $item)
        <div class="item">
            <div class="name">{{ strtoupper($item->tipo) }}</div>

            <div class="meta">
                @if($item->tipo === 'celular' && $item->celular)
                {{ $item->celular->modelo }} · {{ $item->celular->capacidad }} · {{ $item->celular->color }}<br>
                IMEI 1: {{ $item->celular->imei_1 }}<br>
                IMEI 2: {{ $item->celular->imei_2 }}<br>
                Batería: {{ $item->celular->bateria }} · Estado IMEI: {{ $item->celular->estado_imei }}
                @elseif($item->tipo === 'computadora' && $item->computadora)
                {{ $item->computadora->nombre }} · {{ $item->computadora->procesador }}<br>
                {{ $item->computadora->ram }} / {{ $item->computadora->almacenamiento }}
                @elseif($item->tipo === 'producto_apple' && $item->productoApple)
                {{ $item->productoApple->modelo }} · {{ $item->productoApple->capacidad }}<br>
                {{ $item->productoApple->color }} · Batería: {{ $item->productoApple->bateria }}
                @elseif($item->productoGeneral)
                {{ $item->productoGeneral->nombre }} · {{ $item->productoGeneral->codigo }}
                @endif
            </div>

            <div class="price-line">
                <span>Subtotal</span>
                <span>Bs {{ number_format($item->subtotal, 2) }}</span>
            </div>
        </div>
        @endforeach

        {{-- =====================
     PERMUTA DETALLADA
===================== --}}
        @if(
        $venta->entregadoCelular ||
        $venta->entregadoComputadora ||
        $venta->entregadoProductoApple
        )
        <div class="divider"></div>

        <div class="info">
            <p><strong>Producto entregado en permuta</strong></p>

            {{-- CELULAR --}}
            @if($venta->entregadoCelular)
            <p>
                <strong>Tipo:</strong> Celular<br>
                {{ $venta->entregadoCelular->modelo }} · {{ $venta->entregadoCelular->color }}<br>
                Batería: {{ $venta->entregadoCelular->bateria }}<br>
                Estado IMEI: {{ $venta->entregadoCelular->estado_imei }}<br>
                IMEI 1: {{ $venta->entregadoCelular->imei_1 }}<br>
                IMEI 2: {{ $venta->entregadoCelular->imei_2 }}
            </p>
            <p>
                <strong>Valor aplicado:</strong>
                - Bs {{ number_format($venta->entregadoCelular->precio_costo, 2) }}
            </p>
            @endif

            {{-- COMPUTADORA --}}
            @if($venta->entregadoComputadora)
            <p>
                <strong>Tipo:</strong> Computadora<br>
                {{ $venta->entregadoComputadora->nombre }}<br>
                {{ $venta->entregadoComputadora->procesador }} ·
                {{ $venta->entregadoComputadora->ram }} /
                {{ $venta->entregadoComputadora->almacenamiento }}<br>
                Serie: {{ $venta->entregadoComputadora->numero_serie }}
            </p>
            <p>
                <strong>Valor aplicado:</strong>
                - Bs {{ number_format($venta->entregadoComputadora->precio_costo, 2) }}
            </p>
            @endif

            {{-- PRODUCTO APPLE --}}
            @if($venta->entregadoProductoApple)
            <p>
                <strong>Tipo:</strong> Producto Apple<br>
                {{ $venta->entregadoProductoApple->modelo }} · {{ $venta->entregadoProductoApple->capacidad }}<br>
                Color: {{ $venta->entregadoProductoApple->color }}<br>
                Batería: {{ $venta->entregadoProductoApple->bateria }}<br>
                Serie / IMEI: {{ $venta->entregadoProductoApple->numero_serie ?? $venta->entregadoProductoApple->imei_1 }}
            </p>
            <p>
                <strong>Valor aplicado:</strong>
                - Bs {{ number_format($venta->entregadoProductoApple->precio_costo, 2) }}
            </p>
            @endif
        </div>
        @endif

        <div class="divider"></div>

        <!-- TOTAL -->
        <div class="total-box">
            <div class="total-label">TOTAL A PAGAR</div>
            <div class="total-amount">Bs {{ number_format($totalAPagar, 2) }}</div>
        </div>

        <!-- NOTES -->
        @if($venta->notas_adicionales)
        <div class="notes">
            <div class="section-title">Notas</div>
            {{ $venta->notas_adicionales }}
        </div>
        @endif

        <div class="divider"></div>

        <!-- FOOTER -->
        <div class="footer">
            Documento interno sin valor fiscal<br>
            Gracias por su preferencia
        </div>

    </div>
</body>

</html>