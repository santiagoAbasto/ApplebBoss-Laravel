<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],


    /*
    |--------------------------------------------------------------------------
    | Entrar con Google (clientes de la tienda)
    |--------------------------------------------------------------------------
    |
    | Cliente OAuth propio, separado del que usa Drive: si mañana hay que rotar uno,
    | el otro sigue andando. Va en el mismo proyecto de Google Cloud.
    |
    | Solo sirve para clientes. Al staff no se le deja entrar por acá porque el control
    | de horario del vendedor vive en el login por contraseña (App\Support\HorarioLaboral)
    | y entrar con Google se lo saltaría.
    |
    */
    'google' => [
        'client_id'     => env('GOOGLE_LOGIN_CLIENT_ID'),
        'client_secret' => env('GOOGLE_LOGIN_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_LOGIN_REDIRECT', env('APP_URL') . '/auth/google/callback'),
    ],
];
