{{--
    La página que abre el cliente desde el correo del presupuesto. Ve el monto y aprueba o rechaza, sin iniciar sesión:
    la clave del enlace es la credencial. No se indexa (meta robots + cabeceras de ServicioTecnicoController).
--}}
@php($base = rtrim((string) config('seo.public_url', config('app.url')), '/'))
@php($estado = $servicio->estado)
@php($total = number_format($total, 2, ',', '.'))
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<title>Presupuesto {{ $servicio->codigo_nota }} · Apple Boss</title>
<meta name="theme-color" content="#011446">
<link rel="icon" href="{{ $base }}/favicon.ico">
<style>
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#011446;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a}
    .tarjeta{width:100%;max-width:440px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.35);animation:entra .6s cubic-bezier(.2,.8,.2,1) both}
    .cabeza{background:#011446;padding:26px 26px 22px;color:#fff;border-bottom:4px solid #C6CB36}
    .marca{display:flex;align-items:center;gap:12px}
    .marca img{width:52px;height:52px;border-radius:14px;display:block}
    .marca b{display:block;font-size:19px;font-weight:900;letter-spacing:-.3px}
    .marca .lema{display:block;margin-top:5px;font-size:12px;line-height:1.5;color:#9aa3c7}
    .cuerpo{padding:26px}
    h1{margin:0 0 8px;font-size:23px;line-height:1.2;letter-spacing:-.3px;color:#011446}
    p{margin:0;font-size:15px;line-height:1.6;color:#475569}
    .linea{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #f1f5f9;font-size:14px}
    .linea:first-of-type{border-top:0}
    .linea .n{color:#0f172a}
    .linea .m{font-weight:700;color:#0f172a;white-space:nowrap}
    .total{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px;background:#011446;border-radius:14px;padding:14px 18px}
    .total span{font-size:13px;font-weight:700;color:#9aa3c7}
    .total b{font-size:24px;font-weight:900;color:#C6CB36}
    .boton{display:block;width:100%;border:0;cursor:pointer;margin-top:14px;padding:16px 20px;border-radius:999px;text-align:center;text-decoration:none;font-weight:800;font-size:16px;font-family:inherit}
    .aprobar{background:#C6CB36;color:#011446}
    .rechazar{background:#fff;color:#64748b;border:1px solid #e2e8f0;font-size:14px;margin-top:10px}
    .nota{margin-top:18px;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center}
    .ok{display:inline-block;margin-bottom:10px;font-size:40px}
    @keyframes entra{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){.tarjeta{animation:none}}
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
        @if ($estado === \App\Models\ServicioTecnico::PRESUPUESTO && ! $vencido)
            <h1>Presupuesto de tu {{ $servicio->equipo }}</h1>
            <p>Revisamos tu equipo. Esto es lo que haríamos y cuánto cuesta. Empezamos recién cuando lo apruebas.</p>
            <div style="margin-top:18px;">
                @forelse ($trabajos as $t)
                    <div class="linea"><span class="n">{{ $t['descripcion'] }}</span><span class="m">Bs {{ number_format($t['precio'], 2, ',', '.') }}</span></div>
                @empty
                    <div class="linea"><span class="n">Reparación de {{ $servicio->equipo }}</span><span class="m">Bs {{ $total }}</span></div>
                @endforelse
            </div>
            <div class="total"><span>Total a pagar</span><b>Bs {{ $total }}</b></div>
            <form method="POST" action="{{ route('servicios.presupuesto.aprobar', $token) }}">
                @csrf
                <button type="submit" class="boton aprobar">Apruebo el presupuesto</button>
            </form>
            <form method="POST" action="{{ route('servicios.presupuesto.rechazar', $token) }}" onsubmit="return confirm('¿Seguro que no quieres la reparación?');">
                @csrf
                <button type="submit" class="boton rechazar">No, gracias</button>
            </form>
            <p class="nota">Código {{ $servicio->codigo_nota }}. Este enlace es personal: no lo compartas. Si tienes dudas, escríbenos por WhatsApp antes de decidir.</p>
        @elseif ($estado === \App\Models\ServicioTecnico::RECHAZADO)
            <span class="ok">✓</span>
            <h1>Listo, no haremos la reparación</h1>
            <p>Puedes pasar a recoger tu {{ $servicio->equipo }} por la tienda. Si cambias de idea, escríbenos y lo retomamos.</p>
        @elseif ($vencido && $estado === \App\Models\ServicioTecnico::PRESUPUESTO)
            <h1>Este enlace venció</h1>
            <p>Por seguridad el enlace vale unos días. Escríbenos por WhatsApp y te mandamos el presupuesto de nuevo.</p>
        @else
            <span class="ok">✓</span>
            <h1>¡Gracias! Ya tomamos tu respuesta</h1>
            <p>Tu {{ $servicio->equipo }} está en marcha. Te avisamos por correo en cada paso hasta que esté listo.</p>
        @endif
    </div>
</main>
</body>
</html>
