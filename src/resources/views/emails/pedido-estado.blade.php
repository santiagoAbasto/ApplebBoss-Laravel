{{-- Correo de estado del pedido. Tabla y estilos en línea: es lo único que respetan los clientes de correo. --}}
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
<tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr><td style="background:#011446;padding:22px 28px;">
            <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">Apple Boss</span>
        </td></tr>

        <tr><td style="padding:30px 28px 8px;">
            <h1 style="margin:0 0 10px;font-size:21px;line-height:1.3;color:#0f172a;">{{ $texto['titulo'] }}</h1>
            <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">{{ $texto['cuerpo'] }}</p>
        </td></tr>

        <tr><td style="padding:22px 28px 6px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;">
                <tr><td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Pedido</p>
                    <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#011446;">{{ $pedido->codigo }}</p>

                    @foreach ($pedido->items as $item)
                        <p style="margin:0 0 5px;font-size:14px;color:#334155;">
                            {{ $item->cantidad }} × {{ $item->nombre }}
                            <span style="color:#94a3b8;">· Bs {{ number_format((float) $item->subtotal, 0, ',', '.') }}</span>
                        </p>
                    @endforeach

                    <p style="margin:12px 0 0;padding-top:10px;border-top:1px solid #e2e8f0;font-size:15px;font-weight:700;color:#0f172a;">
                        Total: Bs {{ number_format((float) $pedido->total, 0, ',', '.') }}
                    </p>
                </td></tr>
            </table>
        </td></tr>

        <tr><td align="center" style="padding:24px 28px 6px;">
            <a href="{{ $enlace }}" style="display:inline-block;background:#011446;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 30px;border-radius:999px;">
                {{ $texto['boton'] }}
            </a>
        </td></tr>

        <tr><td style="padding:16px 28px 30px;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                Si el botón no funciona, copia este enlace:<br>
                <span style="color:#64748b;word-break:break-all;">{{ $enlace }}</span>
            </p>
        </td></tr>

        <tr><td style="background:#f8fafc;padding:18px 28px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
                Apple Boss · Cochabamba, Bolivia<br>
                Este correo es por tu pedido. No respondas a esta dirección.
            </p>
        </td></tr>

    </table>
</td></tr>
</table>
</body>
</html>
