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
    | OJO CON EL TIPO DE CAMBIO: el precio está en Bs y Binance cobra en USDT. La tasa la
    | fija la tienda a mano (`BINANCE_PAY_TASA_BOB` = cuántos Bs vale 1 USDT). No se saca de
    | ninguna API a propósito: en Bolivia el oficial y el real no coinciden, y usar el
    | equivocado es perder plata en cada venta. Sin tasa cargada, el método no se ofrece.
    */
    'binance' => [
        'habilitado' => env('BINANCE_PAY_HABILITADO', false),
        'api_key'    => env('BINANCE_PAY_API_KEY'),
        'api_secret' => env('BINANCE_PAY_API_SECRET'),
        'base_url'   => env('BINANCE_PAY_BASE_URL', 'https://bpay.binanceapi.com'),
        'moneda'     => env('BINANCE_PAY_MONEDA', 'USDT'),
        // Cuántos bolivianos vale 1 USDT. La pone la tienda; si falta, no se cobra por acá.
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
