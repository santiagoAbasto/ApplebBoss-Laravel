<?php

/**
 * Opciones de entrega de la tienda.
 *
 * Los costos los define la tienda: no se inventa "envío nacional gratis" ni plazos que no se cumplan.
 * Si un departamento no está en la lista, no se ofrece envío ahí (solo retiro en tienda).
 */
return [
    // Ciudad donde el cliente puede retirar
    'retiro' => [
        'habilitado' => env('ENTREGA_RETIRO', true),
        'etiqueta'   => 'Retiro en tienda',
        'ciudad'     => env('ENTREGA_CIUDAD', 'Cochabamba'),
    ],

    'envio' => [
        'habilitado' => env('ENTREGA_ENVIO', true),
        // departamento => [costo en Bs, plazo referencial en días hábiles]
        'destinos' => [
            'Cochabamba'  => ['costo' => 0,  'plazo' => '1 día hábil'],
            'La Paz'      => ['costo' => 35, 'plazo' => '2 a 3 días hábiles'],
            'Santa Cruz'  => ['costo' => 35, 'plazo' => '2 a 3 días hábiles'],
            'Oruro'       => ['costo' => 30, 'plazo' => '2 a 3 días hábiles'],
            'Sucre'       => ['costo' => 35, 'plazo' => '2 a 3 días hábiles'],
            'Potosí'      => ['costo' => 40, 'plazo' => '3 a 4 días hábiles'],
            'Tarija'      => ['costo' => 45, 'plazo' => '3 a 4 días hábiles'],
            'Beni'        => ['costo' => 55, 'plazo' => '4 a 5 días hábiles'],
            'Pando'       => ['costo' => 65, 'plazo' => '4 a 6 días hábiles'],
        ],
    ],

    // Minutos que se le guarda el stock al cliente antes de liberar el pedido sin pagar
    'minutos_para_pagar' => env('CHECKOUT_MINUTOS_PARA_PAGAR', 120),
];
