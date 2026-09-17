{{-- Correo de campaña. Todo el contenido llega escapado: los bloques se validan en App\Support\NewsletterContent. --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <title>{{ $asunto }}</title>
</head>
<body style="margin:0;padding:0;background:#F2F2F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0D0D1A;">
    @if($preheader)
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{ $preheader }}</div>
    @endif

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2F2F7;">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;">

                    @if($esPrueba)
                        <tr><td style="background:#C6CB36;color:#0D0D1A;font-size:12px;font-weight:700;text-align:center;padding:8px;">CORREO DE PRUEBA — no se envió a los suscriptores</td></tr>
                    @endif

                    {{-- Cabecera --}}
                    <tr>
                        <td style="background:#011446;padding:22px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="vertical-align:middle;padding-right:12px;">
                                        <img src="{{ asset('images/email-logo.png') }}" width="40" height="40" alt="Apple Boss" style="display:block;border:0;">
                                    </td>
                                    <td style="vertical-align:middle;color:#FFFFFF;font-size:20px;font-weight:800;letter-spacing:-0.2px;">Apple Boss</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Bloques --}}
                    <tr>
                        <td style="padding:28px 32px 8px;">
                            @foreach($bloques as $b)
                                @switch($b['tipo'])
                                    @case('titulo')
                                        <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;color:#011446;">{{ $b['texto'] }}</h1>
                                        @break

                                    @case('texto')
                                        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#33334A;">{!! nl2br(e($b['texto'])) !!}</p>
                                        @break

                                    @case('imagen')
                                        <div style="margin:0 0 18px;">
                                            @if($b['enlace'])<a href="{{ $b['enlace'] }}" target="_blank">@endif
                                            <img src="{{ $b['url'] }}" alt="{{ $b['alt'] }}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:12px;">
                                            @if($b['enlace'])</a>@endif
                                        </div>
                                        @break

                                    @case('boton')
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px;">
                                            <tr>
                                                <td style="background:#C6CB36;border-radius:999px;">
                                                    <a href="{{ $b['url'] }}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#0D0D1A;text-decoration:none;">{{ $b['texto'] }}</a>
                                                </td>
                                            </tr>
                                        </table>
                                        @break

                                    @case('producto')
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;border:1px solid #E6E6EE;border-radius:14px;">
                                            <tr>
                                                @if($b['imagen'])
                                                    <td width="150" style="padding:14px;vertical-align:middle;">
                                                        <a href="{{ $b['url'] }}" target="_blank"><img src="{{ $b['imagen'] }}" alt="{{ $b['nombre'] }}" width="130" style="display:block;width:130px;height:auto;border:0;border-radius:10px;"></a>
                                                    </td>
                                                @endif
                                                <td style="padding:14px;vertical-align:middle;">
                                                    @if($b['condicion'] && $b['condicion'] !== 'Nuevo')
                                                        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#585E9F;margin-bottom:4px;">{{ $b['condicion'] }}</div>
                                                    @endif
                                                    <div style="font-size:16px;font-weight:800;color:#0D0D1A;line-height:1.3;">{{ $b['nombre'] }}</div>
                                                    @if($b['resumen'])
                                                        <div style="font-size:13px;color:#55556A;margin-top:4px;line-height:1.5;">{{ \Illuminate\Support\Str::limit($b['resumen'], 120) }}</div>
                                                    @endif
                                                    @if($b['precio'])
                                                        <div style="font-size:18px;font-weight:800;color:#011446;margin-top:8px;">Bs {{ number_format($b['precio'], 0, ',', '.') }}</div>
                                                    @endif
                                                    <a href="{{ $b['url'] }}" target="_blank" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:700;color:#011446;">Ver producto →</a>
                                                </td>
                                            </tr>
                                        </table>
                                        @break

                                    @case('separador')
                                        <hr style="border:0;border-top:1px solid #E6E6EE;margin:8px 0 22px;">
                                        @break
                                @endswitch
                            @endforeach
                        </td>
                    </tr>

                    {{-- Pie --}}
                    <tr>
                        <td style="background:#F7F7FA;padding:22px 32px;font-size:12px;line-height:1.6;color:#6B6B80;text-align:center;">
                            @if($pie)<div style="margin-bottom:8px;">{{ $pie }}</div>@endif
                            Recibes este correo porque te suscribiste al newsletter de Apple Boss.<br>
                            <a href="{{ $unsubscribeUrl }}" target="_blank" style="color:#585E9F;font-weight:700;">Darme de baja</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
