<?php

/**
 * Formas de cobro de la tienda.
 *
 * El QR del BNB necesita credenciales que entrega el banco (accountId / authorizationId).
 * Mientras no estén cargadas, la tienda cobra igual por transferencia/QR manual con
 * confirmación del administrador: el checkout nunca queda inutilizable.
 */
return [
    'bnb' => [
        'habilitado'       => env('BNB_QR_HABILITADO', false),
        // Sandbox del BNB; en producción el banco entrega la URL definitiva
        'base_url'         => env('BNB_QR_BASE_URL', 'https://qrsimpleapiv2.azurewebsites.net/api/v1/'),
        'account_id'       => env('BNB_ACCOUNT_ID'),
        'authorization_id' => env('BNB_AUTHORIZATION_ID'),
        'moneda'           => env('BNB_MONEDA', 'BOB'),
        // minutos que vive el QR antes de caducar
        'vigencia_minutos' => env('BNB_QR_VIGENCIA', 120),
    ],

    /*
    | Libélula — pasarela boliviana que trae tarjetas, QR Simple y Tigo Money en una sola
    | integración. El `appkey` es el secreto compartido y NUNCA sale del servidor.
    |
    | Importante: el aviso de pago de Libélula llega como un GET sin firma ni secreto
    | (manual v2.145, pág. 15). Por eso jamás se confirma un pedido con solo recibirlo:
    | se le vuelve a preguntar a Libélula con `consultar_pagos`. Ver App\Support\Pagos\Libelula.
    */
    'libelula' => [
        'habilitado' => env('LIBELULA_HABILITADO', false),
        'appkey'     => env('LIBELULA_APPKEY'),
        'base_url'   => env('LIBELULA_BASE_URL', 'https://api.libelula.bo/rest/'),
    ],

    /*
    | Binance Pay — cobro en cripto (USDT).
    |
    | Legal en Bolivia desde la Resolución 082/2024 del BCB, que derogó la prohibición.
    |
    | OJO CON EL TIPO DE CAMBIO: el precio está en Bs y Binance cobra en USDT. La tasa sale del
    | dólar PARALELO (App\Support\Pagos\TipoDeCambio), nunca del oficial: usar el equivocado es
    | perder plata en cada venta. Sin tipo de cambio, el método no se ofrece.
    |
    | DOS MODOS:
    | - Automático: con API key y secret, se crea la orden en Binance y se confirma sola.
    | - Manual: con el Pay ID, el cliente manda los USDT desde su app y sube la captura; el
    |   equipo confirma en el panel. Es el modo que queda cuando la API no responde (desde un
    |   servidor en EE. UU., Binance contesta 451 y no atiende).
    */
    'binance' => [
        'habilitado' => env('BINANCE_PAY_HABILITADO', false),
        'api_key'    => env('BINANCE_PAY_API_KEY'),
        'api_secret' => env('BINANCE_PAY_API_SECRET'),
        'base_url'   => env('BINANCE_PAY_BASE_URL', 'https://bpay.binanceapi.com'),
        'moneda'     => env('BINANCE_PAY_MONEDA', 'USDT'),
        // El Binance Pay ID de la cuenta de la tienda. No es secreto: se le muestra al cliente.
        'pay_id'     => env('BINANCE_PAY_ID'),
        // Respaldo si la fuente del paralelo no responde (cuántos Bs vale 1 USDT)
        'tasa_bob'   => env('BINANCE_PAY_TASA_BOB'),
    ],

    // Datos para pagar por transferencia / QR estático (los carga la tienda)
    'transferencia' => [
        'habilitado' => env('PAGO_TRANSFERENCIA', true),
        'banco'      => env('PAGO_BANCO', 'Banco Nacional de Bolivia'),
        'titular'    => env('PAGO_TITULAR'),
        'cuenta'     => env('PAGO_CUENTA'),
        'documento'  => env('PAGO_DOCUMENTO'),
    ],

    // Pagar al retirar en la tienda
    'efectivo_en_tienda' => [
        'habilitado' => env('PAGO_EFECTIVO_TIENDA', true),
    ],
];
