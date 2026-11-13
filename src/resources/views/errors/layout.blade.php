{{-- Páginas de error estáticas (500, 503, y cualquier otro estado sin página propia). No usan Vite, Inertia ni la
     base: se dibujan aunque la aplicación esté caída. Si la campaña de Navidad está encendida, se visten
     (App\Support\Temporada::paraErrores devuelve null ante cualquier falla). --}}
@php
    $nv = \App\Support\Temporada::paraErrores();
    $codigo = $codigo ?? 500;
    $titulo = $titulo ?? 'Algo salió mal';
    $texto = $texto ?? 'Estamos arreglándolo. Intenta de nuevo en unos minutos.';
@endphp
<!DOCTYPE html>
<html lang="es"@if($nv) data-season="christmas" data-season-intensity="{{ $nv['intensidad'] }}"@if(! $nv['animaciones']) data-season-still @endif @endif>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>{{ $titulo }} — Apple Boss</title>
    <style>
        :root { --navy:#011446; --lime:#C6CB36; --pagina:#FAFAF9; --texto:#0D0D1A; --suave:#55556A; --boton:#011446; --boton-texto:#fff; --acento:#C6CB36; }
        html[data-season] { --navy:#143D2B; --lime:#E2BC72; --pagina:#FFF8EE; --boton:#143D2B; --acento:#E2BC72; }
        html[data-season][data-season-intensity="discreta"] { --navy:#011446; --pagina:#FAFAF9; --boton:#011446; }
        * { box-sizing: border-box; }
        body { margin:0; min-height:100vh; display:grid; place-items:center; padding:2rem 1.25rem; background:var(--pagina); color:var(--texto); font-family: Barlow, system-ui, -apple-system, 'Segoe UI', sans-serif; }
        main { width:100%; max-width:34rem; text-align:center; position:relative; }
        .luces { position:fixed; left:0; right:0; top:0; height:46px; pointer-events:none; display:none; }
        html[data-season] .luces { display:block; }
        .cinta { position:fixed; left:0; right:0; top:0; height:4px; display:none; background:linear-gradient(90deg,#A42635 0 33%,#E2BC72 33% 66%,#143D2B 66%); }
        html[data-season] .cinta { display:block; }
        .marca { display:inline-grid; place-items:center; width:84px; height:84px; border-radius:24px; background:var(--navy); margin-bottom:1.25rem; position:relative; }
        .marca img { width:46px; height:auto; filter:brightness(0) invert(1); }
        .gorro { display:none; position:absolute; width:34px; top:-11px; left:46px; transform:rotate(9deg); }
        html[data-season] .gorro { display:block; }
        .codigo { margin:.25rem auto 0; font-size:clamp(4.5rem, 22vw, 7.5rem); font-weight:900; line-height:1; letter-spacing:-.03em; color:var(--navy); }
        html[data-season] .codigo { background:repeating-linear-gradient(135deg,#A42635 0 .22em,#FFF8EE .22em .44em); -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-stroke:2px #A42635; }
        h1 { margin:.5rem 0 .6rem; font-size:1.6rem; font-weight:800; }
        p { margin:0 auto; max-width:28rem; color:var(--suave); line-height:1.55; }
        .acciones { margin-top:1.6rem; display:flex; gap:.7rem; justify-content:center; flex-wrap:wrap; }
        a.boton { display:inline-flex; align-items:center; min-height:46px; padding:0 1.5rem; border-radius:9999px; background:var(--boton); color:var(--boton-texto); font-weight:800; text-decoration:none; }
        html[data-season] a.boton { box-shadow:inset 0 0 0 1px rgba(226,188,114,.6); }
        a.boton:focus-visible { outline:3px solid var(--acento); outline-offset:3px; }
        a.boton.sec { background:transparent; color:var(--navy); border:2px solid var(--navy); box-shadow:none; }
        .escena { display:none; width:min(260px,70vw); margin:1.4rem auto 0; }
        html[data-season] .escena { display:block; }
        @keyframes brilla { 0%,38%,100% { opacity:1 } 50%,88% { opacity:.3 } }
        html[data-season]:not([data-season-still]) .foco { animation: brilla 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin:center; }
        .foco:nth-child(2n) { animation-delay:-.8s !important; }
        .foco:nth-child(3n) { animation-delay:-1.6s !important; }
        @media (prefers-reduced-motion: reduce) { .foco { animation:none !important; } }
    </style>
</head>
<body>
    <div class="cinta" aria-hidden="true"></div>
    @if($nv && $nv['luces'])
        <svg class="luces" viewBox="0 0 1200 46" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 6Q75 28 150 6T300 6T450 6T600 6T750 6T900 6T1050 6T1200 6" fill="none" stroke="#143D2B" stroke-width="2"/>
            @foreach(range(0, 15) as $i)
                @php($x = 40 + $i * 75)
                <circle class="foco" cx="{{ $x }}" cy="22" r="7" fill="{{ ['#E2BC72','#A42635','#F4F0E6','#1F5A40'][$i % 4] }}"/>
            @endforeach
        </svg>
    @endif
    <main>
        <span class="marca">
            <svg class="gorro" viewBox="0 0 68 60" aria-hidden="true"><path d="M10 43C9 24 22 8 39 8C51 8 60 17 60 31C57 26 52 24 48 27C44 30 45 37 46 43Z" fill="#A42635"/><rect x="4" y="38" width="46" height="14" rx="7" fill="#FFF8EE"/><circle cx="60" cy="34" r="7" fill="#FFF8EE"/></svg>
            <img src="/images/logo-appleboss-marca.png" alt="Apple Boss" width="46" height="53">
        </span>
        <p class="codigo" aria-hidden="true">{{ $codigo }}</p>
        <h1>{{ $titulo }}</h1>
        <p>{{ $texto }}</p>
        <svg class="escena" viewBox="0 0 240 150" aria-hidden="true">
            <ellipse cx="120" cy="138" rx="86" ry="7" fill="#011446" opacity=".1"/>
            <path d="M120 14L152 66H88Z" fill="#143D2B"/><path d="M120 40L164 104H76Z" fill="#1F5A40"/><path d="M120 70L176 134H64Z" fill="#143D2B"/>
            <rect x="113" y="132" width="14" height="10" fill="#6B4A2B"/>
            <circle class="foco" cx="108" cy="62" r="4" fill="#A42635"/><circle class="foco" cx="132" cy="96" r="4.5" fill="#E2BC72"/><circle class="foco" cx="100" cy="120" r="4.5" fill="#A42635"/>
            <path d="M120 2l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#E2BC72"/>
            <rect x="26" y="112" width="40" height="28" rx="4" fill="#A42635"/><rect x="43" y="112" width="6" height="28" fill="#E2BC72"/>
            <rect x="176" y="118" width="36" height="22" rx="4" fill="#fff" stroke="#E2BC72" stroke-width="2"/><rect x="191" y="118" width="6" height="22" fill="#A42635"/>
        </svg>
        <div class="acciones">
            <a class="boton" href="/">Volver al inicio</a>
            <a class="boton sec" href="/catalogo">Ver el catálogo</a>
        </div>
    </main>
</body>
</html>
