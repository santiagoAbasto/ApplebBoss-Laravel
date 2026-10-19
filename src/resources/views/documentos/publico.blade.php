{{--
    La página que abre el cliente desde el correo o el WhatsApp. Tiene las etiquetas Open Graph para que WhatsApp muestre
    la tarjeta de Apple Boss (sin datos del cliente: solo qué documento es) y el botón al PDF. No se indexa: lo dicen la
    meta robots y la cabecera X-Robots-Tag (DocumentoController::CABECERAS).
--}}
@php($base = rtrim((string) config('seo.public_url', config('app.url')), '/'))
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<title>{{ $titulo }} · Apple Boss</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Apple Boss">
<meta property="og:title" content="{{ $titulo }} · Apple Boss">
<meta property="og:description" content="{{ $resumen }}">
<meta property="og:url" content="{{ $url }}">
<meta property="og:image" content="{{ $base }}/images/correo/documento-og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Apple Boss">
<meta property="og:locale" content="es_BO">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#011446">
<link rel="icon" href="{{ $base }}/favicon.ico">
<style>
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#011446;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a}
    .tarjeta{width:100%;max-width:420px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.35);animation:entra .6s cubic-bezier(.2,.8,.2,1) both}
    .cabeza{background:#011446;padding:26px 26px 22px;color:#fff;border-bottom:4px solid #C6CB36}
    .marca{display:flex;align-items:center;gap:12px}
    .marca img{width:52px;height:52px;border-radius:14px;display:block}
    .marca b{display:block;font-size:19px;font-weight:900;letter-spacing:-.3px}
    .marca .lema{display:block;margin-top:5px;font-size:12px;line-height:1.5;color:#9aa3c7}
    .cuerpo{padding:26px}
    h1{margin:0 0 8px;font-size:23px;line-height:1.2;letter-spacing:-.3px;color:#011446}
    p{margin:0;font-size:15px;line-height:1.6;color:#475569}
    .boton{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:22px;padding:15px 20px;border-radius:999px;text-decoration:none;font-weight:800;font-size:16px;transition:transform .15s}
    .boton:active{transform:scale(.98)}
    .pdf{background:linear-gradient(135deg,#011446,#1A3A96,#011446);background-size:200% 100%;color:#fff;animation:brillo 3s ease-in-out infinite alternate}
    .wa{background:#25D366;color:#fff;margin-top:12px}
    .nota{margin-top:18px;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center}
    @keyframes entra{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
    @keyframes brillo{from{background-position:0% 50%}to{background-position:100% 50%}}
    @media (prefers-reduced-motion:reduce){.tarjeta,.pdf{animation:none}}
</style>
</head>
<body>
<main class="tarjeta">
    <div class="cabeza">
        <div class="marca">
            <img src="{{ $base }}/images/correo/logo-animado.gif" alt="Apple Boss" width="52" height="52">
            <div><b>APPLE BOSS</b><span class="lema">@include('partials.lema', ['svg' => true])</span></div>
        </div>
    </div>
    <div class="cuerpo">
        @if ($estado === 'ok')
            <h1>{{ $titulo }}</h1>
            <p>{{ $resumen }}</p>
            <a class="boton pdf" href="{{ $pdf }}">Abrir el PDF</a>
            @if ($whatsapp)<a class="boton wa" href="{{ $whatsapp }}" rel="noopener">Escríbenos por WhatsApp</a>@endif
            <p class="nota">Este enlace es personal: no lo compartas. Vale hasta el {{ $vence->timezone('America/La_Paz')->format('d/m/Y') }}; el PDF también te llegó por correo.</p>
        @elseif ($estado === 'vencido')
            <h1>Este enlace venció</h1>
            <p>Por seguridad, los enlaces a tus documentos valen unos días. Escríbenos y te mandamos uno nuevo al momento.</p>
            @if ($whatsapp)<a class="boton wa" href="{{ $whatsapp }}" rel="noopener">Pedirlo por WhatsApp</a>@endif
        @else
            <h1>No encontramos este documento</h1>
            <p>Revisa que el enlace esté completo. Si el problema sigue, escríbenos y te lo mandamos.</p>
            @if ($whatsapp)<a class="boton wa" href="{{ $whatsapp }}" rel="noopener">Escríbenos por WhatsApp</a>@endif
        @endif
    </div>
</main>
</body>
</html>
