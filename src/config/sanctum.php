<?php

/*
 * Sanctum se usa solo para los tokens de la API de integración (Sistema → Integraciones API).
 * Lo que no está acá toma el valor de fábrica del paquete.
 */
return [
    // Ninguna sesión del panel cuenta como token: solo Authorization: Bearer
    'guard' => [],

    // Los tokens vencen solo si se les pone fecha (al rotar, el anterior dura Integracion::HORAS_DE_GRACIA)
    'expiration' => null,

    // Prefijo reconocible para que un escáner de secretos lo detecte si alguien lo sube a un repositorio
    'token_prefix' => 'abi_',
];
