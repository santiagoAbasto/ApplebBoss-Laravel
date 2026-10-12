<?php

return [

    'default' => env('MAIL_MAILER', 'smtp'),

    'mailers' => [

        'smtp' => [
            'transport' => 'smtp',
            'host' => env('MAIL_HOST', 'smtp.gmail.com'),
            'port' => env('MAIL_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', 'localhost'),
        ],

        'ses' => [
            'transport' => 'ses',
        ],

        'postmark' => [
            'transport' => 'postmark',
        ],

        'resend' => [
            'transport' => 'resend',
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs -i'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'smtp',
                'log',
            ],
            'retry_after' => 60,
        ],

        'roundrobin' => [
            'transport' => 'roundrobin',
            'mailers' => [
                'ses',
                'postmark',
            ],
            'retry_after' => 60,
        ],
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'ventas@appleboss.com.bo'),
        'name' => env('MAIL_FROM_NAME', 'Apple Boss'),
    ],

    // Si los automáticos salen de una casilla que nadie lee (no-reply@), las respuestas van a esta
    'reply_to' => [
        'address' => env('MAIL_REPLY_TO_ADDRESS'),
        'name' => env('MAIL_REPLY_TO_NAME', env('MAIL_FROM_NAME', 'Apple Boss')),
    ],

    // Casillas por área (alias de Google Workspace que caen en la misma bandeja). Lo automático sale de `from`;
    // cada correo dice a cuál de estas se responde, y las páginas públicas muestran la que corresponde.
    'casillas' => [
        'info'       => env('MAIL_CASILLA_INFO', 'info@appleboss.com.bo'),
        'ventas'     => env('MAIL_CASILLA_VENTAS', 'ventas@appleboss.com.bo'),
        'pedidos'    => env('MAIL_CASILLA_PEDIDOS', 'pedidos@appleboss.com.bo'),
        'soporte'    => env('MAIL_CASILLA_SOPORTE', 'soporte@appleboss.com.bo'),
        'privacidad' => env('MAIL_CASILLA_PRIVACIDAD', 'privacidad@appleboss.com.bo'),
        'novedades'  => env('MAIL_CASILLA_NOVEDADES', 'novedades@appleboss.com.bo'),
        'seguridad'  => env('MAIL_CASILLA_SEGURIDAD', 'seguridad@appleboss.com.bo'),
    ],

];
