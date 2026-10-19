<?php

/**
 * SEO de la tienda pública.
 *
 * `public_url` es EL dominio oficial del sitio: de ahí salen el canonical, og:url y el sitemap.
 * Mientras apunte a localhost o a un túnel temporal, Google no puede indexar nada: por eso
 * `UrlPublica::esPublicable()` lo detecta y las pruebas lo vigilan.
 */
return [
    // Dominio real de la tienda. Ej.: https://appleboss.com.bo
    'public_url' => env('SEO_PUBLIC_URL', env('APP_URL', 'http://localhost')),

    // Imagen por defecto al compartir en WhatsApp/Facebook (ruta dentro de public/ o URL absoluta)
    'og_image_default' => env('SEO_OG_IMAGE', '/images/logo.png'),

    // Identidad del negocio para los datos estructurados (Organization / LocalBusiness).
    // Solo datos verificables: si algo no se sabe, se deja null y NO se publica en el JSON-LD.
    'negocio' => [
        'nombre'      => env('SEO_NEGOCIO_NOMBRE', 'Apple Boss'),
        'tipo'        => 'Store',                       // schema.org/Store
        'descripcion' => 'Equipos Apple nuevos y seminuevos, accesorios y servicio técnico en Cochabamba, Bolivia: buen precio, asesoría en cada paso y una postventa que responde.',
        // El lema de la tienda, elegido por el dueño el 19-10-2026: barra de anuncio, pie de la tienda, cabecera de los correos,
        // página de documentos, tarjeta de WhatsApp y slogan del JSON-LD. La parte con `escudo` lleva el ícono de seguridad
        // (SVG en la web; escudo.png en los correos, porque Gmail no muestra SVG). En texto plano: App\Support\Seo::lema().
        'lema' => [
            ['texto' => 'Garantía real'],
            ['texto' => 'Compra segura y protegida', 'escudo' => true],
            ['texto' => 'Cochabamba, Bolivia'],
        ],
        'telefono'    => env('SEO_NEGOCIO_TELEFONO'),   // se completa desde StoreLocation si existe
        'calle'       => env('SEO_NEGOCIO_CALLE'),
        'ciudad'      => env('SEO_NEGOCIO_CIUDAD', 'Cochabamba'),
        'region'      => env('SEO_NEGOCIO_REGION', 'Cochabamba'),
        'pais'        => env('SEO_NEGOCIO_PAIS', 'BO'),
        // Perfiles oficiales con nombre, para el pie de los correos
        'redes' => array_filter([
            'facebook'  => env('SEO_PERFIL_FACEBOOK'),
            'instagram' => env('SEO_PERFIL_INSTAGRAM'),
            'tiktok'    => env('SEO_PERFIL_TIKTOK'),
        ]),
        // Perfiles oficiales verificados del negocio (sameAs)
        'perfiles' => array_values(array_filter([
            env('SEO_PERFIL_FACEBOOK'),
            env('SEO_PERFIL_INSTAGRAM'),
            env('SEO_PERFIL_TIKTOK'),
            env('SEO_PERFIL_GOOGLE'),
        ])),
    ],
];
