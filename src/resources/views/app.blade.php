<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- SEO renderizado en el servidor: WhatsApp, Facebook y Google leen estas etiquetas sin ejecutar JS.
         El atributo "data-inertia" (Inertia 3) permite que <SeoHead> las reemplace al navegar. --}}
    @php($seo = $page['props']['seo'] ?? null)
    @if($seo)
        <title data-inertia>{{ $seo['title'] }}</title>
        @if($seo['description'])
            <meta name="description" content="{{ $seo['description'] }}" head-key="description" data-inertia>
        @endif
        <meta name="robots" content="{{ $seo['robots'] }}" head-key="robots" data-inertia>
        <link rel="canonical" href="{{ $seo['canonical'] }}" head-key="canonical" data-inertia>
        <meta property="og:site_name" content="{{ $seo['site_name'] }}" head-key="og:site_name" data-inertia>
        <meta property="og:locale" content="es_BO" head-key="og:locale" data-inertia>
        <meta property="og:type" content="{{ $seo['type'] }}" head-key="og:type" data-inertia>
        <meta property="og:title" content="{{ $seo['title'] }}" head-key="og:title" data-inertia>
        @if($seo['description'])
            <meta property="og:description" content="{{ $seo['description'] }}" head-key="og:description" data-inertia>
        @endif
        <meta property="og:url" content="{{ $seo['url'] }}" head-key="og:url" data-inertia>
        @if($seo['image'])
            <meta property="og:image" content="{{ $seo['image'] }}" head-key="og:image" data-inertia>
        @endif
        <meta name="twitter:card" content="{{ $seo['image'] ? 'summary_large_image' : 'summary' }}" head-key="twitter:card" data-inertia>
        <meta name="twitter:title" content="{{ $seo['title'] }}" head-key="twitter:title" data-inertia>
        @if($seo['description'])
            <meta name="twitter:description" content="{{ $seo['description'] }}" head-key="twitter:description" data-inertia>
        @endif
        @if($seo['image'])
            <meta name="twitter:image" content="{{ $seo['image'] }}" head-key="twitter:image" data-inertia>
        @endif
    @else
        <title data-inertia>{{ config('app.name', 'Laravel') }}</title>
    @endif

    {{-- Datos estructurados: se imprimen en el servidor para que Google los lea sin ejecutar JS --}}
    @php($jsonLd = \App\Support\Seo\DatosEstructurados::json($seo ?? null, request()))
    @if($jsonLd)
        <script type="application/ld+json">{!! $jsonLd !!}</script>
    @endif

    @php($faviconVersion = file_exists(public_path('favicon.ico')) ? filemtime(public_path('favicon.ico')) : time())
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="shortcut icon" type="image/x-icon" href="{{ asset('favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('favicon/favicon.svg') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="96x96" href="{{ asset('favicon/favicon-96x96.png') }}?v={{ $faviconVersion }}">
    <link rel="apple-touch-icon" href="{{ asset('favicon/apple-touch-icon.png') }}?v={{ $faviconVersion }}">
    <link rel="manifest" href="{{ asset('favicon/site.webmanifest') }}?v={{ $faviconVersion }}">

    <!-- Fonts: se cargan una sola vez para toda la app (tienda, acceso y panel), así no parpadean al navegar -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

    <!-- Ziggy: exportar todas las rutas -->
    @routes(['only' => null])

    <!-- Vite + React -->
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])

    <!-- Inertia Head -->
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
