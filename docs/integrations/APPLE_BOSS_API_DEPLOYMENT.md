# Plan de despliegue de la API de integración v1

> Preparado el 09-10-2026. **Parte A ejecutada el 09-10-2026** con autorización del dueño (producción en `a0ff8ae`).
> **Parte B sin autorizar.**
> Producción hoy: commit `a2e21c3`, imagen `appleboss-app:production`, PostgreSQL 18, Caddy 2.11.4 detrás de Cloudflare.

## Qué cambia

- Código nuevo de la API y del panel, sin cambios en inventario, precios, fotos ni rutas de la tienda.
- Una migración que **solo crea** `personal_access_tokens`, `integraciones` e `integracion_solicitudes`. Verificado
  en producción, solo leyendo, el 09-10-2026: las tres no existen y la última migración aplicada es
  `2026_10_06_180000_aspectos_de_las_resenas`.
- Sin variables de entorno nuevas. `APP_URL=https://appleboss.com.bo` ya está bien.
- Una tarea programada nueva: `model:prune` del registro de solicitudes a las 03:30.

## Antes de empezar

- Autorización del dueño para: (A) push y despliegue de la API; (B) la corrección de Caddy, aparte y opcional.
- Ventana de poco tráfico. La compilación tarda unos minutos y el `up -d` corta la app unos segundos.
- Conexión: la de `docs/DESPLIEGUE.md` (usuario, servidor y llave del VPS), carpeta `~/apps/appleboss`.
- En el servidor, `git status` muestra cambios propios del VPS: el `Caddyfile` con los sitios de otros proyectos y
  copias `Caddyfile.bak*`. El commit de la API no toca ninguno, así que `git pull --ff-only` no choca.

En los comandos, `dc` es `docker compose -f docker-compose.production.yml`:

```bash
cd ~/apps/appleboss && alias dc='docker compose -f docker-compose.production.yml' && set -a && . ./.env.production && set +a
```

## Parte A: la API

### 1. Respaldo de PostgreSQL

```bash
dc exec -T db pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > ~/respaldo-api-integracion-$(date +%Y%m%d-%H%M).dump
ls -la ~/respaldo-api-integracion-*.dump
```

Sacar una copia fuera del VPS desde la Mac:

```bash
scp <usuario>@<servidor>:'~/respaldo-api-integracion-*.dump' ~/Respaldos/appleboss/
```

### 2. Comprobar que el respaldo se puede recuperar

Se restaura en una base temporal y se comparan conteos con la base viva. No toca la base de la tienda.

```bash
R=$(ls -t ~/respaldo-api-integracion-*.dump | head -1)
dc exec -T db createdb -U "$POSTGRES_USER" verificacion_respaldo
dc exec -T db pg_restore -U "$POSTGRES_USER" -d verificacion_respaldo --no-owner < "$R"
Q="select (select count(*) from celulares), (select count(*) from computadoras), (select count(*) from productos_generales), (select count(*) from ventas), (select count(*) from catalogo_publicaciones)"
dc exec -T db psql -U "$POSTGRES_USER" -d verificacion_respaldo -tAc "$Q"
dc exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "$Q"
dc exec -T db dropdb -U "$POSTGRES_USER" verificacion_respaldo
```

Las dos líneas de conteos tienen que ser iguales. Si no lo son, **parar**.

### 3. Guardar la versión anterior de la aplicación

Hoy solo existe la imagen `appleboss-app:production` y cada compilación la reemplaza. Antes de compilar:

```bash
git log --oneline -1
docker tag appleboss-app:production appleboss-app:antes-api-a2e21c3
```

### 4. Traer el código

Requiere el push autorizado desde la Mac (`git push origin main`).

```bash
git status --short
git pull --ff-only origin main
git log --oneline -3
```

### 5. Compilar y actualizar los contenedores

```bash
dc build app && dc up -d app queue scheduler
dc ps
```

Caddy no se recrea en este paso.

### 6. Aplicar la migración

```bash
dc exec -T app php artisan migrate --force
dc exec -T app php artisan migrate:status | grep integraciones_api
dc exec -T app php artisan config:cache && dc exec -T app php artisan route:cache && dc exec -T app php artisan view:cache
dc restart queue scheduler
```

Debe correr solo `2026_10_09_100000_integraciones_api`.

### 7. Verificación de salud

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://appleboss.com.bo/up
dc exec -T app php artisan route:list --path=api/v1/integration | tail -3
dc logs --since 10m app | grep -iE "error|exception" | tail -5
```

Esperado: `200`, 9 rutas GET y ningún error nuevo.

### 8. Prueba de autorización, sin token

```bash
curl -s https://appleboss.com.bo/api/v1/integration/health
curl -s -H "Authorization: Bearer 1|abi_falso" https://appleboss.com.bo/api/v1/integration/products
curl -s -X POST https://appleboss.com.bo/api/v1/integration/products
```

Esperado: 401 `unauthenticated`, 401 y 405 `method_not_allowed`, todos en JSON, nunca HTML ni un 500.

### 9. Integración de prueba y búsqueda de productos

El dueño entra a Sistema → Integraciones API y crea «Prueba despliegue» con los seis permisos. Copia el token y lo
pega **solo** en la terminal, sin que quede en el historial ni en ningún chat:

```bash
read -rs APPLEBOSS_API_TOKEN && export APPLEBOSS_API_TOKEN
A="https://appleboss.com.bo/api/v1/integration"; H="Authorization: Bearer $APPLEBOSS_API_TOKEN"
curl -s -H "$H" "$A/health"
curl -s -H "$H" "$A/products?search=iphone&per_page=3" | head -c 1500; echo
curl -s -H "$H" "$A/products?availability=all&per_page=1" | grep -o '"total":[0-9]*'
```

Esperado: 200 con los seis scopes. El total con `availability=all` es unidades más artículos. El 09-10-2026 daba
318 unidades más 329 artículos, 647 en total. Con `in_stock` daba 302.

### 10. Precio y disponibilidad

```bash
ID=$(curl -s -H "$H" "$A/products?category=celulares&per_page=1" | grep -o '"id":"celular-[0-9]*"' | head -1 | cut -d'"' -f4)
curl -s -H "$H" "$A/products/$ID/price"
curl -s -H "$H" "$A/products/$ID/availability"
```

Comparar a mano el precio y el estado con la ficha de ese celular en Inventario → Celulares.

### 11. Fotografías

```bash
PUB=$(curl -s -H "$H" "$A/products?availability=all&per_page=100&sort=updated_desc" | python3 -c 'import json,sys; print(next(p["id"] for p in json.load(sys.stdin)["data"] if p["publication"]["status"]=="published"))')
curl -s -H "$H" "$A/products/$PUB/images" | head -c 800; echo
URL=$(curl -s -H "$H" "$A/products/$PUB/images" | python3 -c 'import json,sys; d=json.load(sys.stdin)["data"]; print(d[0]["url"] if d else "")')
[ -n "$URL" ] && curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "$URL"
```

Esperado: direcciones `https://appleboss.com.bo/storage/…` que responden `200 image/webp`. Un producto sin publicación
devuelve `[]`.

### 12. Límite de pedidos

```bash
for i in $(seq 1 125); do curl -s -o /dev/null -w "%{http_code}\n" -H "$H" "$A/health"; done | sort | uniq -c
```

Esperado: 120 respuestas `200` y 5 respuestas `429`. Esa integración queda bloqueada hasta un minuto.

### 13. Panel

En Sistema → Integraciones API:

- Aparecen las llamadas de los pasos 8 a 12 en «Últimas solicitudes», también las rechazadas.
- Recargar la página: el token ya no se muestra.
- «Revocar» el token de prueba y repetir `curl -s -H "$H" "$A/health"`: tiene que dar 401.
- «Editar» → desactivar «Prueba despliegue».
- Después: `unset APPLEBOSS_API_TOKEN`.

La integración real «APPLE BOSS AI» se crea recién cuando el otro proyecto esté listo para guardar el token.

### 14. La tienda sigue funcionando

```bash
SLUG=$(curl -s -H "$H" "$A/products/$PUB" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["publication"]["slug"])')
for u in / /catalogo /iphone /mac /myskin /comparar/apple "/productos/$SLUG"; do curl -s -o /dev/null -w "%{http_code} $u\n" "https://appleboss.com.bo$u"; done
```

Esperado: todo `200`. Además, abrir la portada y una ficha en el navegador y revisar la consola: un 200 no prueba que
la página se dibuje. Entrar al panel y abrir Inventario, Ventas y Catálogo.

## Reversión

Regla: primero se recupera la tienda y se **conservan los datos**. Nunca `migrate:fresh`, nunca `git reset --hard` en el
VPS y nunca borrar las tablas nuevas sin revisar qué tienen: pueden guardar integraciones, tokens y el registro de
auditoría.

| Situación | Qué hacer |
|---|---|
| La API falla pero la tienda anda | Desactivar todas las integraciones y corregir con calma: `dc exec -T app php artisan tinker --execute='App\Models\Integracion::query()->update(["activa" => false]);'` |
| La tienda o el panel fallan por el código nuevo | 1) `docker tag appleboss-app:antes-api-a2e21c3 appleboss-app:production && dc up -d app queue scheduler`: vuelve la imagen anterior. 2) Cachés y reinicio como en el paso 6. Las tres tablas nuevas **se quedan**: el código anterior no las usa. 3) En la Mac, `git revert` de los commits de la API, push y `git pull --ff-only` en el VPS, para que el código vuelva a coincidir con la imagen |
| Hay que quitar las tablas nuevas | Solo después de revisar su contenido y respaldarlo: `pg_dump -t integraciones -t integracion_solicitudes -t personal_access_tokens`, y recién entonces `migrate:rollback --step=1` con el código nuevo todavía puesto |
| Daño en datos (no esperado: la migración solo crea tablas) | Restaurar el respaldo del paso 1 con `pg_restore --clean` en una ventana de mantenimiento, después de guardar un respaldo del estado dañado |

## Parte B: IP real del cliente detrás de Cloudflare (aparte y opcional)

**Problema comprobado el 09-10-2026.** Las 20 sesiones guardadas en producción tienen IP de Cloudflare, ninguna del
cliente. Caddy no reconoce a Cloudflare como intermediario, así que Laravel ve la IP del borde de Cloudflare.
Consecuencias:

- El límite por IP de la API se comparte entre todos los que entran por el mismo nodo de Cloudflare.
- El registro de solicitudes guarda la IP de Cloudflare.
- Ya pasaba antes de la API con el límite de intentos de inicio de sesión.

**Corrección.** Dos cambios en `docker/production/Caddyfile` del VPS. Se validaron con el Caddy 2.11.4 de producción
(`caddy validate`: «Valid configuration»), sin aplicarlos:

```diff
 {
     email {$TLS_EMAIL}
     admin off
+
+    # Cloudflare está delante de appleboss.com.bo: la conexión llega desde su borde, no desde el cliente.
+    # Solo si la conexión viene de un rango de Cloudflare se cree su CF-Connecting-IP; si alguien entra
+    # directo al VPS con esa cabecera inventada, se ignora. Rangos de https://www.cloudflare.com/ips (09-10-2026).
+    servers {
+        trusted_proxies static 173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20 197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 104.24.0.0/14 172.64.0.0/13 131.0.72.0/22 2400:cb00::/32 2606:4700::/32 2803:f800::/32 2405:b500::/32 2405:8100::/32 2a06:98c0::/29 2c0f:f248::/32
+        client_ip_headers CF-Connecting-IP
+    }
 }
@@
 {$APP_DOMAIN} {
     encode zstd gzip
 
-    reverse_proxy app:80
+    # Laravel confía solo en Caddy (TRUSTED_PROXIES=172.16.0.0/12): se le pasa la IP real del cliente
+    reverse_proxy app:80 {
+        header_up X-Forwarded-For {client_ip}
+    }
```

Pasos:

```bash
cp docker/production/Caddyfile docker/production/Caddyfile.bak.$(date +%Y%m%d-%H%M)
# aplicar los dos cambios de arriba con un editor
dc exec -T caddy caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile
docker restart appleboss-production-caddy-1
for d in appleboss.com.bo demo.appleboss.com.bo; do curl -s -o /dev/null -w "%{http_code} $d\n" "https://$d/"; done
# y lo mismo con cada uno de los otros sitios que publica ese Caddy
```

El reinicio corta 1 a 2 segundos **todos** los sitios del VPS. Los otros sitios no cambian de comportamiento: sus
backends siguen viendo lo mismo o mejor.

Verificación, después de que alguien inicie sesión en la tienda:

```bash
dc exec -T app php artisan tinker --execute='$ips = DB::table("sessions")->where("last_activity", ">", now()->subHour()->timestamp)->pluck("ip_address"); echo $ips->count(), " sesiones recientes, ", $ips->filter(fn ($ip) => Symfony\Component\HttpFoundation\IpUtils::checkIp($ip, ["162.158.0.0/15","172.64.0.0/13","104.16.0.0/13","104.24.0.0/14","141.101.64.0/18","108.162.192.0/18","173.245.48.0/20","188.114.96.0/20","190.93.240.0/20","198.41.128.0/17","131.0.72.0/22"]))->count(), " de Cloudflare";'
```

Esperado: 0 de Cloudflare en las sesiones nuevas. Reversión: volver a copiar el `.bak` y reiniciar Caddy.

Cloudflare cambia sus rangos muy de vez en cuando. Revisarlos una vez por trimestre en https://www.cloudflare.com/ips.

## Fuera de este despliegue, pero conviene decidir

- El `Caddyfile` del VPS se separó del repositorio: tiene sitios agregados a mano en el servidor. Conviene llevar esa
  versión al repositorio o pasar cada sitio a su propio archivo importado.
- La política de respaldos de producción se revisa aparte, con el dueño.
