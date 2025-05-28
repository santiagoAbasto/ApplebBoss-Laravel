<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      background: #f4f4f4;
      padding: 20px;
    }

    .card {
      background: #ffffff;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
      max-width: 600px;
      margin: auto;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header img {
      width: 130px;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      margin-bottom: 10px;
    }

    .header h2 {
      font-size: 22px;
      color: #003366;
      margin-top: 12px;
    }

    .info {
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }

    .info p {
      margin: 6px 0;
    }

    .footer {
      margin-top: 30px;
      font-size: 13px;
      color: #555;
      text-align: center;
    }

    .social-icons {
      margin-top: 10px;
    }

    .social-icons a {
      margin: 0 8px;
      text-decoration: none;
      display: inline-block;
    }

    .social-icons img {
      width: 24px;
      height: 24px;
      vertical-align: middle;
    }
  </style>
</head>

<body>
  <div class="card">
    <div class="header">
      <img src="https://i.imgur.com/7MORsIZ.png" alt="Apple Boss">
      <h2>Tu cotización ha sido generada</h2>
    </div>

    <div class="info">
      <p><strong>Cliente:</strong> {{ $cotizacion->nombre_cliente }}</p>
      <p><strong>Teléfono:</strong>
        {{ $cotizacion->codigo_pais ?? '' }}
        {{ $cotizacion->codigo_area ?? '' }}
        {{ $cotizacion->telefono_cliente ?? '' }}
      </p>

      <p><strong>Correo:</strong> {{ $cotizacion->correo_cliente }}</p>
      <p><strong>Fecha:</strong> {{ \Carbon\Carbon::parse($cotizacion->fecha_cotizacion)->format('d/m/Y') }}</p>
    </div>

    <div class="footer">
      <p>Apple Boss | Av. Melchor Urquidi</p>
      <div class="social-icons">
        <a href="https://wa.me/59175904313" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp"></a>
        <a href="https://www.instagram.com/apple_boss_bol/" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram"></a>
        <a href="https://www.facebook.com/Applebossbo" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook"></a>
        <a href="https://www.tiktok.com/@apple_boss_bo" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok"></a>
      </div>
    </div>
  </div>
</body>

</html>