{{--
    Marco de marca de todos los correos de la tienda: cabecera navy con el isotipo animado (GIF: Gmail y Apple Mail
    lo muestran; quien no, ve el primer cuadro), título, contenido y pie con dirección, WhatsApp, redes y legales.
    Tabla y estilos en línea: es lo único que respetan los clientes de correo. Las @keyframes solo las honra
    Apple Mail (iPhone y Mac): en el resto no pasa nada.
    Secciones: etiqueta (opcional), titulo, contenido, pie (opcional, la nota legal del final).
--}}
@php
    $base   = rtrim((string) config('seo.public_url', config('app.url')), '/');
    $local  = \App\Models\StoreLocation::principal();
    $wa     = $local?->whatsapp ? 'https://wa.me/' . preg_replace('/\D+/', '', $local->whatsapp) : null;
    $redes  = (array) config('seo.redes', []);
    $nombre = ['facebook' => 'Facebook', 'instagram' => 'Instagram', 'tiktok' => 'TikTok'];
@endphp
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>@yield('titulo') · Apple Boss</title>
<style>
    @keyframes ab-latido { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.25); } }
    @keyframes ab-brillo { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
    .ab-punto { display: inline-block; animation: ab-latido 1.6s ease-in-out infinite; }
    .ab-boton { background-size: 200% 100%; animation: ab-brillo 3s ease-in-out infinite alternate; }
</style>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:24px 12px;">
<tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;">

        {{-- Cabecera de marca --}}
        <tr><td style="background:#011446;padding:26px 28px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="vertical-align:middle;">
                        <img src="{{ $base }}/images/correo/logo-animado.gif" width="72" height="72" alt="Apple Boss" style="display:block;border:0;border-radius:18px;">
                    </td>
                    <td style="vertical-align:middle;padding-left:14px;">
                        <span style="display:block;color:#ffffff;font-size:22px;line-height:1;font-weight:900;letter-spacing:-0.4px;">APPLE BOSS</span>
                        <span style="display:block;margin-top:7px;color:#9aa3c7;font-size:12px;letter-spacing:0.3px;">Equipos revisados · Stock real · Cochabamba</span>
                    </td>
                </tr>
            </table>
            @hasSection('etiqueta')
                <span style="display:inline-block;margin-top:22px;background:rgba(198,203,54,0.16);color:#E3E86A;font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;padding:6px 12px;border-radius:999px;">@yield('etiqueta')</span>
            @endif
            <h1 style="margin:@hasSection('etiqueta') 14px @else 24px @endif 0 0;font-size:26px;line-height:1.2;color:#ffffff;letter-spacing:-0.4px;">@yield('titulo')<span class="ab-punto" style="color:#C6CB36;">.</span></h1>
        </td></tr>

        {{-- Contenido --}}
        <tr><td style="padding:26px 28px 8px;">
            @yield('contenido')
        </td></tr>

        {{-- Pie de marca --}}
        <tr><td style="padding:22px 28px 26px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8ecf3;">
                <tr><td style="padding-top:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="vertical-align:top;padding-right:12px;">
                                <img src="{{ $base }}/images/correo/logo-navy.png" width="40" height="40" alt="" style="display:block;border:0;border-radius:11px;">
                            </td>
                            <td style="vertical-align:top;font-size:12px;line-height:1.6;color:#64748b;">
                                <strong style="color:#0f172a;">Apple Boss</strong> · Cochabamba, Bolivia<br>
                                @if ($local?->address){{ $local->address }}<br>@endif
                                @if ($wa)<a href="{{ $wa }}" style="color:#011446;font-weight:700;text-decoration:none;">WhatsApp +{{ preg_replace('/\D+/', '', $local->whatsapp) }}</a> · @endif<a href="{{ $base }}" style="color:#011446;font-weight:700;text-decoration:none;">appleboss.com.bo</a>
                            </td>
                        </tr>
                    </table>
                </td></tr>
                @if ($wa)
                    <tr><td style="padding-top:16px;">
                        <a href="{{ $wa }}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:11px 18px 11px 12px;border-radius:999px;">
                            <img src="{{ $base }}/images/correo/whatsapp.png" width="22" height="22" alt="" style="display:inline-block;vertical-align:middle;border:0;margin-right:8px;">Escríbenos por WhatsApp
                        </a>
                    </td></tr>
                @endif
                @if ($redes)
                    <tr><td style="padding-top:14px;">
                        @foreach ($redes as $red => $url)
                            <a href="{{ $url }}" style="display:inline-block;margin-right:10px;text-decoration:none;" title="{{ $nombre[$red] ?? $red }}"><img src="{{ $base }}/images/correo/{{ $red }}.png" width="22" height="22" alt="{{ $nombre[$red] ?? $red }}" style="display:block;border:0;border-radius:6px;"></a>
                        @endforeach
                    </td></tr>
                @endif
                <tr><td style="padding-top:14px;font-size:11px;line-height:1.6;color:#94a3b8;">
                    @yield('pie')
                    <span style="display:block;margin-top:6px;"><a href="{{ $base }}/paginas/garantia" style="color:#94a3b8;">Garantía</a> · <a href="{{ $base }}/paginas/privacidad" style="color:#94a3b8;">Privacidad</a> · <a href="{{ $base }}/paginas/terminos" style="color:#94a3b8;">Términos</a></span>
                </td></tr>
            </table>
        </td></tr>

    </table>
</td></tr>
</table>
</body>
</html>
