<?php

/*
|--------------------------------------------------------------------------
| Ziggy — qué rutas se publican en el HTML
|--------------------------------------------------------------------------
|
| Ziggy imprime la lista de rutas con nombre dentro del HTML para que el
| frontend pueda armar URLs. Por defecto publica TODAS, y eso incluía las
| 206 rutas de `admin.*` y las 33 de `vendedor.*` en cada página pública.
|
| Las rutas están protegidas por middleware, así que conocerlas no da acceso.
| Pero le entrega a cualquier visitante el mapa completo del panel —dónde se
| borran usuarios, dónde se exportan reportes, dónde vive la automatización—
| y son 34 KB de peso muerto en cada carga de la tienda.
|
| El grupo «publico» las saca. Los patrones que empiezan con «!» se descartan.
| Una vez que la persona inicia sesión, `app.blade.php` publica la lista
| completa, así que el panel sigue funcionando exactamente igual.
|
*/

return [

    'groups' => [
        'publico' => [
            '!admin.*',
            '!vendedor.*',
            '!automation.*',
        ],
    ],

];
