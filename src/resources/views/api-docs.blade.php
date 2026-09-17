<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apple Boss — API Pública v1</title>
    <meta name="robots" content="noindex">
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css">
    <style>
        body { margin: 0; background: #fafafa; }
        .topbar { display: none !important; }
        #swagger-ui { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .swagger-ui .info .title { color: #011446; }
        .swagger-ui .opblock-tag { color: #011446; }
        .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #585E9F; }
    </style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
<script>
    window.onload = function () {
        SwaggerUIBundle({
            url: "/api-docs/openapi.json",
            dom_id: '#swagger-ui',
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: "BaseLayout",
            docExpansion: "list",
            filter: true,
            tryItOutEnabled: true,
            requestInterceptor: function(req) {
                // Never send precio/price from frontend as authority
                return req;
            }
        });
    };
</script>
</body>
</html>
