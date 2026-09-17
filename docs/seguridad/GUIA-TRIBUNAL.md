# Guía para el tribunal — regenerar las pruebas de seguridad en vivo

Paso a paso, comando por comando, para reproducir **frente al tribunal** las tres pruebas del reporte:
**caja negra**, **caja blanca** y **carga (k6)** — más una **demo de un hallazgo corregido** (antes/después).

Todo corre contra tu **Docker local** (`http://127.0.0.1:8010`). Nada toca el dominio público ni el túnel, y ninguna prueba usa credenciales reales.

> **Idea para defender:** cada acto responde una pregunta del tribunal.
> - Caja negra → «¿cómo se ve el sistema desde afuera, sin ver el código?»
> - Caja blanca → «¿cómo demostrás que los arreglos están y no rompen nada?»
> - Carga → «¿aguanta y los límites funcionan bajo presión?»

---

## 0. Preparación (una sola vez, antes de entrar)

Abrí una terminal en la carpeta del proyecto:

```bash
cd "/Users/user/Projects/PROYECTO APPLE BOSS/ApplebBoss-Laravel"
```

**0.1 Levantar el sistema** (si no está arriba):

```bash
docker compose up -d
```

**0.2 Verificar que responde** (tiene que decir `200`):

```bash
curl -s -o /dev/null -w "app: %{http_code}\n" http://127.0.0.1:8010/
```

**0.3 Verificar las herramientas** (Python y k6):

```bash
python3 --version && k6 version
```

> Si `k6` no está: `brew install k6` (macOS). Python 3 ya viene en macOS.

---

## 1. Acto 1 — Caja negra (black-box)

**Qué demuestra:** desde afuera, como un atacante que no ve el código, el sistema no filtra datos sensibles, exige sesión donde corresponde, tiene las cabeceras de seguridad y los límites de uso puestos.

**1.1 El sondeo completo (83 comprobaciones).** Prueba cabeceras, cookies, rutas protegidas sin sesión, CSRF, que la API pública no filtre costo/IMEI, etc.

```bash
python3 "docs/seguridad/pruebas/caja-negra-sondeo.py" | tail -n 12
```

Vas a ver algo como `83 pruebas · 6 observaciones`. Las 6 observaciones son cosas de **entorno local** (HSTS y cookie `Secure` solo aplican con HTTPS en producción; la versión de PHP/Apache) — no son fallas explotables, y en el reporte están explicadas en §5.

**1.2 Guardar la evidencia en un archivo** (para adjuntar o mostrar):

```bash
python3 "docs/seguridad/pruebas/caja-negra-sondeo.py" > /tmp/caja-negra-$(date +%H%M).json && echo "guardado"
```

**1.3 Mostrar en vivo que la API pública NO filtra costo, ganancia ni IMEI** (debe salir vacío):

```bash
curl -s -H 'Accept: application/json' http://127.0.0.1:8010/api/v1/products \
  | grep -o -iE 'precio_costo|ganancia|"imei"|procedencia' | sort | uniq -c
echo "(sin salida arriba = la API pública está limpia)"
```

---

## 2. Acto 2 — Caja blanca (white-box)

**Qué demuestra:** con el código a la vista, los arreglos están puestos, hay pruebas automáticas que los bloquean, y **nada se rompió** (la suite entera pasa).

**2.1 Correr TODA la batería de pruebas** (tarda ~2 min; al final dice cuántas pasan):

```bash
docker exec appleboss-app php artisan test
```

Esperado al final: **`Tests: 575 passed`** (o más), **0 fallos**.

**2.2 Correr solo las pruebas de los hallazgos corregidos** (rápido, para señalarlas una por una):

```bash
docker exec appleboss-app php artisan test \
  --filter='registrar_venta_no_le_manda|editar_venta_no_le_manda|reservas_activas_no_le_mandan|olvide_mi_contrasena_no_revela|api_de_stock_no_le_manda'
```

Cada línea verde es un hallazgo cerrado:
- `registrar venta / editar venta / reservas activas no le mandan el costo` → **H2** (el vendedor no ve costo/ganancia/procedencia).
- `olvide mi contrasena no revela si el correo existe` → **H6**.
- `la api de stock no le manda el costo al vendedor` → el ocultamiento de costo que ya existía.

**2.2-bis Token de n8n (H5) y horario del vendedor (H8):**

```bash
docker exec appleboss-app php artisan test --filter=SeguridadHardeningTest
```

Lo que prueba, línea por línea:
- `el token de n8n abre sus endpoints pero no el export financiero` → **H5**: el token de n8n sigue sirviendo para lo suyo, pero **ya no abre** el reporte de costo/ganancia.
- `el export financiero solo abre con su token propio` / `la rotacion mantiene valido el token anterior` → alcance separado y **rotación sin cortar n8n**.
- `el vendedor no entra despues de las 19 / en el corte de mediodia / antes de las 9` y `el admin entra a cualquier hora` → **H8** (horario laboral).

**2.3 Mostrar el código del arreglo de H2** (el que oculta el costo en todos los niveles):

```bash
sed -n '30,75p' "src/app/Support/SinCostos.php"
```

**2.4 Mostrar el código del arreglo de H1** (proxies de confianza por variable de entorno):

```bash
sed -n '24,45p' "src/bootstrap/app.php"
```

**2.5 Demostrar en runtime que el costo se va y el precio queda** (sin abrir el navegador):

```bash
docker exec appleboss-app php artisan tinker --execute="
\$c = App\Models\Celular::where('estado','disponible')->first();
\$limpio = App\Support\SinCostos::purgar(['celulares' => collect([\$c])]);
\$j = json_encode(\$limpio);
echo 'precio_costo: '.(strpos(\$j,'precio_costo')!==false?'PRESENTE':'quitado').PHP_EOL;
echo 'procedencia: '.(strpos(\$j,'procedencia')!==false?'PRESENTE':'quitado').PHP_EOL;
echo 'precio_venta: '.(strpos(\$j,'precio_venta')!==false?'presente':'quitado').PHP_EOL;
"
```

Esperado: `precio_costo: quitado`, `procedencia: quitado`, `precio_venta: presente`.

---

## 3. Acto 3 — Carga (k6)

**Qué demuestra:** el sistema aguanta usuarios concurrentes sin errores y los **límites de uso** funcionan bajo presión.

Las 4 pruebas están en `docs/seguridad/pruebas/k6/`. Corré desde esa carpeta:

```bash
cd "/Users/user/Projects/PROYECTO APPLE BOSS/ApplebBoss-Laravel/docs/seguridad/pruebas/k6"
```

**3.1 Humo** — 1 usuario recorre todas las páginas y la API pública (rápido, ~10 s):

```bash
k6 run 01-humo.js
```

Mirá: `checks_succeeded 100%`, `http_req_failed 0%`, `sin costo ni IMEI` en verde.

**3.2 Carga sostenida** — varios usuarios en paralelo un rato:

```bash
k6 run 02-carga.js
```

Mirá: las **páginas** con 0 fallos y la **API** mezclando `200` y `429` (el límite trabajando bajo carga).

**3.3 Pico** — ráfaga de golpe (aguanta y se degrada con gracia):

```bash
k6 run 03-pico.js
```

Mirá: todos `200`, y cómo sube el `p95` sin caerse.

**3.4 Límites de uso** — un cliente supera a propósito el límite de cada ruta:

```bash
k6 run 04-limites.js
```

Mirá el log: `api/buscar: primer 429 en el pedido 61 (límite 60/min)` → el freno salta justo donde debe.

> Al terminar, volvé a la carpeta del proyecto: `cd "/Users/user/Projects/PROYECTO APPLE BOSS/ApplebBoss-Laravel"`

---

## 4. Bonus — Demo «antes / después» de un hallazgo corregido (H1)

**Qué demuestra:** el hallazgo era real y el arreglo lo cierra. El script prende y apaga el fix, prueba las dos veces y **restaura tu `.env` solo** (hace una copia y la vuelve a poner).

```bash
bash "docs/seguridad/pruebas/demo-h1-antes-despues.sh"
```

Tarda ~2,5 min (espera a que se limpien las ventanas de los límites). Al final imprime:

```
ANTES  (confiar en *):   primer 429 = ninguno   ← el límite se BURLA con X-Forwarded-For
DESPUÉS (no confiar):    primer 429 = 61         ← el límite se respeta
```

Eso es la prueba viva: falsear `X-Forwarded-For` antes repartía los pedidos en IPs falsas y saltaba el límite (y el bloqueo de login); con el fix, ya no.

---

## 5. Guion corto de defensa (qué decir en cada punto)

| Si te preguntan… | Respondés… | Comando que lo muestra |
|------------------|------------|------------------------|
| ¿Qué metodología usaste? | Skill `security-audit` de Cloudflare (reconocimiento + 32 unidades de cobertura) + caja blanca + caja negra + carga con k6. | §3 del reporte |
| ¿Cómo sabés que no filtra el costo? | Regla server-side `SinCostos::purgar`, probada con tests y en runtime; el admin sí lo ve. | 2.2, 2.5 |
| ¿El sistema aguanta? | k6: humo 100% OK, pico con todos 200, límites que saltan a 429. | 3.1–3.4 |
| ¿Los arreglos rompieron algo? | No: 567 pruebas en verde. | 2.1 |
| ¿El hallazgo era real? | Sí, lo muestro prendiendo y apagando el fix. | 4 |
| ¿Y en producción? | Checklist de despliegue: `APP_ENV=production`, `SESSION_SECURE_COOKIE=true`, `TRUSTED_PROXIES`, rotar tokens. | §5 y §8 del reporte |

---

## 6. Notas honestas (para que no te agarren en un renuncio)

- La skill lanza 12 agentes de caza en paralelo; en la corrida se cortaron por el **límite de sesión de la cuenta**. Por eso el reconocimiento, la cobertura, la caja negra y k6 quedaron completos, y **la caza de vulnerabilidades se terminó a mano**, revisando el código y confirmando cada hallazgo con una prueba local reproducible.
- Las **6 observaciones** de la caja negra no son fallas: HSTS y cookie `Secure` solo aplican con HTTPS real (producción); la versión de PHP/Apache es fuga de versión (endurecer en despliegue).
- El check de k6 «api sin costo» es un *regex sobre todo el cuerpo* (puede matchear la palabra en un texto de marketing); la prueba fina es la inspección de claves de 1.3 y 2.5.
- **Nada está commiteado**: los arreglos están en el árbol de trabajo. Si el tribunal quiere, se hace el commit en el momento.
