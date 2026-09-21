# Desplegar a producción — Apple Boss

**Producción:** VPS Hostinger · `appleboss@2.25.232.34` · carpeta `~/apps/appleboss`
**Dominio:** `https://appleboss.com.bo` (Cloudflare → Caddy → app)
**Stack:** `docker-compose.production.yml` (app · queue · scheduler · postgres 18 · caddy)
**Sin CI/CD:** el despliegue es manual y en este orden.

> El código de producción **viene de la imagen Docker**, no de un volumen. Si no reconstruyes la imagen, tus cambios no se aplican aunque hayas hecho `git pull`.

---

## ⚠️ Antes de nada: dos variables que hay que agregar sí o sí

### 1. `TRUSTED_PROXIES` — si no la pones, el sitio se degrada

La auditoría de seguridad cambió `trustProxies` de `'*'` (inseguro) a **lo que declares**. Con la variable vacía, la app no confía en nadie y toma como IP del cliente la de **Caddy**, que es la misma para todo el mundo.

**Consecuencia:** todos los visitantes comparten un solo cupo de límite de uso. El `throttle:60,1` del buscador pasaría a ser 60 búsquedas por minuto **para todo el sitio**, no por persona.

```
TRUSTED_PROXIES=172.16.0.0/12
```

Esa es la red interna de Docker donde vive Caddy. Así la app confía en Caddy, lee la IP real que viene de Cloudflare, y **sigue sin poder falsearse** desde afuera (una IP pública nunca está en ese rango).

### 2. `SEO_PUBLIC_URL` — para el canonical y el sitemap

```
SEO_PUBLIC_URL=https://appleboss.com.bo
```

### Variables completas a revisar en `~/apps/appleboss/.env.production`

```bash
APP_ENV=production
APP_DEBUG=false
APP_URL=https://appleboss.com.bo

# Seguridad
TRUSTED_PROXIES=172.16.0.0/12
SESSION_SECURE_COOKIE=true

# SEO
SEO_PUBLIC_URL=https://appleboss.com.bo
SEO_OG_IMAGE=/images/logo.png

# Checkout (opcional: si están vacías, se cobra por transferencia y pago en tienda)
PAGO_TITULAR=
PAGO_CUENTA=
BNB_QR_HABILITADO=false
```

---

## Paso a paso

### 1 · En tu Mac — subir el código

```bash
cd "/Users/user/Projects/PROYECTO APPLE BOSS/ApplebBoss-Laravel" && git add . && git status --short
```

Revisa que **no** aparezca `.env`, `.env.production` ni ningún `.sql`/`.dump`. Si está limpio:

```bash
git commit -m "feat: checkout en línea, seguimiento de pedidos y SEO técnico" && git push origin main
```

### 2 · En el servidor — entrar y traer el código

```bash
ssh -i ~/.ssh/appleboss_hostinger appleboss@2.25.232.34
```

```bash
cd ~/apps/appleboss && git pull --ff-only origin main
```

### 3 · Respaldar la base ANTES de migrar

Esta versión crea tablas nuevas (`pedidos`, `pedido_items`, `pedido_eventos`). Respalda primero:

```bash
docker compose -f docker-compose.production.yml exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > ~/respaldo-$(date +%Y%m%d-%H%M).sql
```

> Guarda ese archivo **fuera del repo**. Nunca lo subas a git.

### 4 · Agregar las variables nuevas al `.env.production`

```bash
nano ~/apps/appleboss/.env.production
```

Agrega `TRUSTED_PROXIES`, `SEO_PUBLIC_URL`, `SESSION_SECURE_COOKIE` (ver arriba) y guarda.

### 5 · Reconstruir la imagen y levantar

El build compila el frontend dentro de la imagen, así que tarda unos minutos.

```bash
cd ~/apps/appleboss && docker compose -f docker-compose.production.yml build app && docker compose -f docker-compose.production.yml up -d
```

### 6 · Migrar la base y refrescar cachés

```bash
docker compose -f docker-compose.production.yml exec app php artisan migrate --force
```

```bash
docker compose -f docker-compose.production.yml exec app sh -c "php artisan config:cache && php artisan route:cache && php artisan view:cache"
```

### 7 · Reiniciar la cola (toma el código nuevo)

```bash
docker compose -f docker-compose.production.yml restart queue scheduler
```

---

## Verificación posterior (hazla siempre)

```bash
curl -s https://appleboss.com.bo/robots.txt | head -5
```
Debe decir `Disallow: /admin` y traer la línea `Sitemap: https://appleboss.com.bo/sitemap.xml`.

```bash
curl -s https://appleboss.com.bo/sitemap.xml | grep -c "<loc>"
```
Debe dar 24 o más, y **ninguna** URL con `localhost`.

```bash
curl -s https://appleboss.com.bo/ | grep -o 'application/ld+json' | head -1
```
Debe aparecer (son los datos estructurados).

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://appleboss.com.bo/checkout
```
Debe dar `200` (la tienda en línea ya funciona).

**Y a ojo:** abre la tienda, agrega un producto al carrito y llega hasta la pantalla de pago. No completes un pago real.

---

## Si algo sale mal — volver atrás

```bash
cd ~/apps/appleboss && git reset --hard HEAD~1 && docker compose -f docker-compose.production.yml build app && docker compose -f docker-compose.production.yml up -d
```

Las migraciones de esta versión **solo crean tablas nuevas**: no tocan ni borran datos existentes, así que volver atrás el código es seguro. Si además necesitas deshacer las tablas:

```bash
docker compose -f docker-compose.production.yml exec app php artisan migrate:rollback --step=1 --force
```

---

## Qué incluye este despliegue

- **Tienda en línea completa:** checkout, pedidos, pago (transferencia / QR / pago en tienda), seguimiento con línea de tiempo.
- **Regla de stock:** solo se publica lo disponible; lo vendido se despublica solo; el IMEI y la serie se muestran al comprador **recién con el pago confirmado**.
- **Buscador rediseñado** y botón de WhatsApp separado de los botones de compra en celular.
- **SEO técnico:** canonical y sitemap sobre el dominio oficial, `robots.txt` correcto, datos estructurados (Store, WebSite, Product, BreadcrumbList).
- **Seguridad:** proxies de confianza acotados, costo oculto al vendedor, OAuth con `state`, sin SSRF en PDF.

## Cobro manual mientras el banco no dé las credenciales

El QR automático del BNB necesita credenciales que entrega el banco. Mientras tanto el cobro es
manual y **está completo**:

1. El cliente elige transferencia, ve los datos de la cuenta y **sube su comprobante**.
2. El pedido pasa a **«pago en revisión»** y el equipo queda apartado.
3. En **Panel → Pedidos de la tienda** se abre el comprobante y se confirma el pago.
4. Confirmar es lo que **vende la unidad, la despublica** y le revela al comprador el IMEI y la serie.
5. Después el pedido avanza: preparando → enviado (con courier y código) → entregado.

Cada paso queda en la línea de tiempo **con su autor y su fecha**. Las notas internas nunca llegan
al seguimiento del cliente, y el comprobante vive en disco privado: solo se abre desde el panel.

> Para que la transferencia se ofrezca hay que cargar `PAGO_TITULAR` y `PAGO_CUENTA` en
> `.env.production`. Sin esos datos el checkout solo ofrece retiro y pago en tienda.

## Pendientes que NO entran acá

- **SSR** — **ya no es urgente**: Search Console confirma que Google renderiza e indexa la home. Queda como mejora (velocidad de indexación y vista previa al compartir en redes).
- **GA4** (falta el ID de medición `G-XXXXXXX`). Search Console **ya está conectado**: sitemap aceptado, 24 páginas descubiertas.
- **NAP**: falta la dirección de calle y el teléfono en el panel (Tienda online → Ubicaciones). Sin eso, Google no recibe ni `streetAddress` ni `telephone`.
- **Credenciales del BNB** para el QR automático.
- **`apple-boss.com.bo`**: queda para otro proyecto. Asegúrate de que **no** apunte a este sitio, para no crear contenido duplicado.
