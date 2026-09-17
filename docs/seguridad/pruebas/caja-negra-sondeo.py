#!/usr/bin/env python3
"""Pruebas de caja negra contra el Docker LOCAL del dueño (127.0.0.1:8010). Solo lectura: GET/HEAD/OPTIONS y POST que el
servidor rechaza o descarta (sin credenciales reales, sin envío de correos, sin crear datos). Resultado en JSON."""
import json, re, sys, time, urllib.request, urllib.error, http.cookiejar
BASE = 'http://127.0.0.1:8010'
assert re.match(r'^http://(127\.0\.0\.1|localhost)(:\d+)?$', BASE)
resultados = []

def pedir(metodo, ruta, cuerpo=None, headers=None, seguir=False):
    req = urllib.request.Request(BASE + ruta, data=cuerpo, method=metodo, headers=headers or {})
    class NoRedir(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k): return None
    opener = urllib.request.build_opener() if seguir else urllib.request.build_opener(NoRedir)
    t = time.time()
    try:
        r = opener.open(req, timeout=20)
        return r.status, dict(r.headers), r.read(400000).decode('utf-8', 'replace'), time.time() - t
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read(400000).decode('utf-8', 'replace'), time.time() - t

def anotar(grupo, prueba, ok, detalle):
    resultados.append({'grupo': grupo, 'prueba': prueba, 'resultado': 'pasa' if ok else 'observación', 'detalle': detalle})

# 1. Encabezados de seguridad y cookies en la tienda
s, h, b, _ = pedir('GET', '/')
hl = {k.lower(): v for k, v in h.items()}
for nombre in ['x-frame-options', 'x-content-type-options', 'referrer-policy', 'content-security-policy', 'strict-transport-security', 'permissions-policy']:
    anotar('encabezados', nombre, nombre in hl, hl.get(nombre, 'ausente'))
anotar('encabezados', 'X-Powered-By oculto', 'x-powered-by' not in hl, hl.get('x-powered-by', 'ausente'))
anotar('encabezados', 'Server sin versión', not re.search(r'\d', hl.get('server', '')), hl.get('server', 'ausente'))
galletas = [v for k, v in h.items() if k.lower() == 'set-cookie']
raw = h.get('Set-Cookie', '')
for c in raw.split(', ') if raw else []:
    pass
import http.client
conn = http.client.HTTPConnection('127.0.0.1', 8010, timeout=20)
conn.request('GET', '/')
resp = conn.getresponse(); resp.read()
for k, v in resp.getheaders():
    if k.lower() == 'set-cookie':
        nombre = v.split('=', 1)[0]
        attrs = v.lower()
        anotar('cookies', f'{nombre} HttpOnly', 'httponly' in attrs or nombre == 'XSRF-TOKEN', v.split(';', 1)[1].strip() if ';' in v else v)
        anotar('cookies', f'{nombre} SameSite', 'samesite' in attrs, 'samesite' in attrs)
        anotar('cookies', f'{nombre} Secure (en local es normal que falte)', 'secure' in attrs, 'secure' in attrs)

# 2. Rutas privadas sin sesión
for ruta in ['/admin/dashboard', '/admin/ventas', '/admin/usuarios', '/admin/exportar/celulares', '/admin/reportes/exportar', '/vendedor/dashboard',
             '/api/stock/celulares', '/profile', '/admin/register', '/dashboard', '/admin/trade-in', '/admin/auditoria-inventario']:
    s, h, b, _ = pedir('GET', ruta, headers={'Accept': 'text/html'})
    ok = s in (302, 401, 403) and ('login' in h.get('Location', '') or s != 302)
    anotar('sin sesión', ruta, ok, f'{s} → {h.get("Location", "")}')
    s, h, b, _ = pedir('GET', ruta, headers={'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest'})
    anotar('sin sesión (JSON)', ruta, s in (401, 403, 302), f'{s} {b[:80]!r}')

# 3. Rutas de depuración, archivos sensibles y documentación
for ruta in ['/.env', '/.git/config', '/storage/logs/laravel.log', '/_debugbar/open', '/telescope', '/horizon', '/phpinfo.php', '/composer.json',
             '/composer.lock', '/package.json', '/vendor/autoload.php', '/api/docs', '/api/documentation', '/docs', '/public/.htaccess',
             '/adminer.php', '/server-status', '/up', '/storage/', '/build/manifest.json', '/api-docs/openapi.json', '/mix-manifest.json', '/robots.txt', '/sitemap.xml']:
    s, h, b, _ = pedir('GET', ruta)
    sensible = ruta in ['/.env', '/.git/config', '/storage/logs/laravel.log', '/_debugbar/open', '/telescope', '/horizon', '/phpinfo.php', '/composer.json', '/composer.lock', '/package.json', '/vendor/autoload.php', '/adminer.php', '/server-status']
    anotar('rutas expuestas', ruta, (s >= 400) if sensible else True, f'{s} {len(b)} bytes {b[:60]!r}')

# 4. Errores: 404, método no permitido, parámetro malformado
for metodo, ruta in [('GET', '/no-existe-' + str(int(time.time()))), ('DELETE', '/'), ('GET', '/productos/%00%27%22<x>'), ('GET', '/api/v1/products?page=-1&per_page=99999999'),
                     ('GET', '/api/buscar?q=' + 'a' * 5000), ('GET', "/catalogo?orden=precio;drop&categoria[]=x")]:
    s, h, b, _ = pedir(metodo, ruta, headers={'Accept': 'application/json'})
    fuga = re.search(r'(Stack trace|/var/www/html|vendor/laravel|SQLSTATE|Whoops|exception)', b, re.I)
    anotar('errores', f'{metodo} {ruta[:60]}', not fuga, f'{s} {"FUGA: " + fuga.group(0) if fuga else "sin detalles internos"}')

# 5. Host y encabezados reenviados (trustProxies=*)
s, h, b, _ = pedir('GET', '/catalogo', headers={'X-Forwarded-Host': 'atacante.example', 'X-Forwarded-Proto': 'https'})
refleja = 'atacante.example' in b
anotar('host', 'X-Forwarded-Host reflejado en canonical/og:url', not refleja, 'reflejado' if refleja else 'no reflejado')
s, h, b, _ = pedir('GET', '/', headers={'Host': 'atacante.example'})
anotar('host', 'Host arbitrario reflejado', 'atacante.example' not in b, 'reflejado' if 'atacante.example' in b else 'no reflejado')

# 6. CORS
s, h, b, _ = pedir('OPTIONS', '/api/v1/products', headers={'Origin': 'https://atacante.example', 'Access-Control-Request-Method': 'GET'})
hl = {k.lower(): v for k, v in h.items()}
anotar('cors', 'API pública OPTIONS desde origen ajeno', not (hl.get('access-control-allow-origin') in ('*', 'https://atacante.example') and hl.get('access-control-allow-credentials') == 'true'), f'{s} ACAO={hl.get("access-control-allow-origin")} ACAC={hl.get("access-control-allow-credentials")}')
s, h, b, _ = pedir('GET', '/api/stock/celulares', headers={'Origin': 'https://atacante.example', 'Accept': 'application/json'})
hl = {k.lower(): v for k, v in h.items()}
anotar('cors', 'API privada con origen ajeno', hl.get('access-control-allow-credentials') != 'true', f'{s} ACAO={hl.get("access-control-allow-origin")} ACAC={hl.get("access-control-allow-credentials")}')

# 7. CSRF: POST sin token desde otro sitio (descartado por el servidor, no guarda)
s, h, b, _ = pedir('POST', '/newsletter', cuerpo=b'{"email":"csrf-prueba@example.com","website":"bot"}', headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'Sec-Fetch-Site': 'cross-site'})
anotar('csrf', 'POST /newsletter desde otro sitio sin token', s == 419, str(s))
s, h, b, _ = pedir('POST', '/api/carrito/sync', cuerpo=b'{"items":[]}', headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'Sec-Fetch-Site': 'cross-site'})
anotar('csrf', 'POST /api/carrito/sync desde otro sitio sin token', s == 419, str(s))

# 8. Automatización (token de n8n): sin token, token falso, token en query
for desc, hdr, q in [('sin token', {}, ''), ('token falso', {'Authorization': 'Bearer falso-123', 'X-Automation-Token': 'falso-123'}, ''), ('token en query', {}, '?token=falso-123')]:
    s, h, b, _ = pedir('GET', '/api/automation/top-products' + q, headers={'Accept': 'application/json', **hdr})
    anotar('automatización', f'/api/automation/top-products {desc}', s in (401, 403), f'{s} {b[:80]!r}')
s, h, b, _ = pedir('POST', '/automation/store', cuerpo=b'{}', headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
anotar('automatización', 'POST /automation/store sin token', s in (401, 403, 419), f'{s} {b[:80]!r}')

# 9. Confirmación de Trade-In: códigos adivinables
for codigo in ['1', 'TI-0001', 'AAAAAA', '../../etc/passwd']:
    s, h, b, _ = pedir('GET', '/trade-in/confirmacion/' + urllib.request.quote(codigo, safe=''))
    anotar('trade-in', f'confirmación con código inventado {codigo!r}', s in (404, 403, 302), str(s))

# 10. Enlaces de baja del newsletter con token inventado
s, h, b, _ = pedir('GET', '/newsletter/baja/token-inventado-123')
anotar('newsletter', 'baja con token inventado', s in (404, 403, 410, 200) and 'suscri' not in b.lower()[:0], f'{s}')

json.dump(resultados, open(sys.argv[1] if len(sys.argv) > 1 else '/dev/stdout', 'w'), ensure_ascii=False, indent=1)
obs = [r for r in resultados if r['resultado'] != 'pasa']
print(f'{len(resultados)} pruebas · {len(obs)} observaciones', file=sys.stderr)
for r in obs: print(' -', r['grupo'], '|', r['prueba'], '|', r['detalle'], file=sys.stderr)
