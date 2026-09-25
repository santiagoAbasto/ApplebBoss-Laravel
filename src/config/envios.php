<?php

/**
 * Opciones de entrega de la tienda.
 *
 * Tres, como las definió la tienda (25-09-2026): retiro en el local, envío al interior por
 * courier y delivery propio en Cochabamba el mismo día. Las tres sin costo. Si mañana alguna
 * cobra, se cambia acá y el checkout lo toma solo: el navegador nunca pone un precio.
 */
return [
    // 1) El cliente pasa por la tienda
    'retiro' => [
        'habilitado' => env('ENTREGA_RETIRO', true),
        'etiqueta'   => 'Retiro en tienda',
        'ciudad'     => env('ENTREGA_CIUDAD', 'Cochabamba'),
    ],

    // 2) Courier a los otros ocho departamentos. Cochabamba no va acá: ahí está el delivery.
    'envio' => [
        'habilitado' => env('ENTREGA_ENVIO', true),
        // departamento => [costo en Bs, plazo referencial]
        'destinos' => [
            'La Paz'     => ['costo' => 0, 'plazo' => '2 a 5 días hábiles'],
            'Santa Cruz' => ['costo' => 0, 'plazo' => '2 a 5 días hábiles'],
            'Oruro'      => ['costo' => 0, 'plazo' => '2 a 5 días hábiles'],
            'Sucre'      => ['costo' => 0, 'plazo' => '2 a 5 días hábiles'],
            'Potosí'     => ['costo' => 0, 'plazo' => '2 a 5 días hábiles'],
            'Tarija'     => ['costo' => 0, 'plazo' => '2 a 5 días hábiles'],
            'Beni'       => ['costo' => 0, 'plazo' => '2 a 5 días hábiles'],
            'Pando'      => ['costo' => 0, 'plazo' => '2 a 5 días hábiles'],
        ],
    ],

    // 3) Repartidor propio, solo dentro del área metropolitana de Cochabamba
    'delivery' => [
        'habilitado' => env('ENTREGA_DELIVERY', true),
        'ciudad'     => 'Cochabamba',
        'costo'      => 0,
        'plazo'      => 'El mismo día en que se confirma tu pago',
        // Rectángulo que cubre Cercado, Quillacollo, Sacaba, Tiquipaya, Colcapirhua, Vinto y Sipe Sipe.
        // ponytail: un rectángulo, no el polígono real; si el delivery crece, pasar a polígono.
        'area' => ['lat_min' => -17.60, 'lat_max' => -17.20, 'lng_min' => -66.45, 'lng_max' => -65.90],
    ],

    // Minutos que se le guarda el stock al cliente antes de liberar el pedido sin pagar
    'minutos_para_pagar' => env('CHECKOUT_MINUTOS_PARA_PAGAR', 120),
];
