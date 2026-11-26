<?php

/*
| Acceso de demostración para el jurado (defensa de grado).
| Los valores (contraseña y tokens de los QR) se definen en .env y NO se versionan.
| Las cuentas jurado{N}.admin@… y jurado{N}.vendedor@… son de SOLO LECTURA (demo=true),
| así que los tokens solo evitan accesos casuales; no son secretos de alto valor.
*/

return [
    'habilitado' => filter_var(env('JURADO_DEMO', true), FILTER_VALIDATE_BOOLEAN),

    // Contraseña de respaldo de las cuentas demo (el acceso normal es por QR de autologin).
    'password' => env('JURADO_PASS'),

    // Token opaco por jurado, va en la URL del QR: /jurado/{N}/{token}
    'tokens' => [
        1 => env('JURADO_T1'),
        2 => env('JURADO_T2'),
        3 => env('JURADO_T3'),
        4 => env('JURADO_T4'),
        5 => env('JURADO_T5'),
        6 => env('JURADO_T6'),
    ],
];
