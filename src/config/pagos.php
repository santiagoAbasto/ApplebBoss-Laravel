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
