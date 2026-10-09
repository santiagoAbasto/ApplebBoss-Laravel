# APPLE BOSS AI — Handoff de la API de integración

> Documento autónomo para el proyecto «APPLE BOSS AI» (ventas, WhatsApp, CRM) o para otra sesión de Claude Code que
> no tenga acceso al repositorio de la tienda. Última revisión: 09-10-2026.
> **Estado de la API (09-10-2026):** implementada, auditada y guardada en Git en el repositorio de la tienda
> (commit en la sección K), **sin push y sin desplegar**. Antes de conectarse, confirmar con el dueño que ya está
> desplegada: `GET /health` sin token debe responder 401 en JSON, no 404.

## A. Identificación

| | |
|---|---|
| Empresa | **Apple Boss**, Cochabamba, Bolivia. Vende productos Apple nuevos y seminuevos, otros equipos, accesorios (marca propia de fundas: MYSKIN) y servicio técnico |
| Sistema principal | https://appleboss.com.bo — tienda en línea + panel de gestión (inventario, ventas, reservas, pedidos, servicio técnico) |
| Stack | Laravel 13, PHP 8.5, PostgreSQL 18, React 19 + Inertia 3, Docker en un VPS de Hostinger, detrás de Cloudflare |
| Moneda | Bolivianos (BOB). El cobro en USDT usa el dólar paralelo del día |
| Esta API | REST, **solo lectura**, versión v1, base `https://appleboss.com.bo/api/v1/integration` |

El sistema principal es la autoridad sobre **sus propios registros**: qué unidades tiene, a qué precio las publica,
si están disponibles, reservadas o vendidas, y qué fotos y fichas tiene en la tienda. **No** es la autoridad sobre
todo lo que la empresa vende.

## B. Principio multifuente (lo más importante)

**La API de Apple Boss es una fuente de datos entre varias, NO el catálogo comercial completo.**

APPLE BOSS AI también debe usar:

1. El catálogo comercial externo (hoy un PDF en Google Drive): equipos nuevos, seminuevos y a pedido, precios
   referenciales, configuraciones, baterías, accesorios, promociones y modelos de proveedores.
2. Documentación de ventas, políticas, garantías y preguntas frecuentes.
3. Listas de proveedores.
4. Datos cargados a mano por el equipo.
5. Otras fuentes que se autoricen.

Reglas de respuesta que se desprenden:

- Que un producto **no aparezca** en la API **no** quiere decir que la tienda no lo venda. Nunca responder «no lo
  vendemos» por eso. Responder del estilo: «No tengo disponibilidad confirmada en el inventario registrado, pero
  podemos consultar opciones a pedido».
- Un producto que **sí** aparece con `availability.status = "available"` está registrado como disponible. Para
  prometerlo a un cliente, volver a leer `/products/{id}/availability` justo antes.
- Un precio de la API es el precio publicado del inventario (`price_type = "list_price"`, BOB). Un precio del
  catálogo de Drive es referencial y hay que presentarlo como tal.

## C. Endpoints implementados y verificados

Todos con `Authorization: Bearer <TOKEN>`. Solo GET. Verificados con pruebas automáticas y contra una copia de los
datos reales en PostgreSQL. En producción se verifican durante el despliegue (pasos 7 a 14 de
`APPLE_BOSS_API_DEPLOYMENT.md`).

URL de producción: `https://appleboss.com.bo/api/v1/integration`. No hay entorno de pruebas público.

| Ruta | Scope | Para qué |
|---|---|---|
| `GET /health` | cualquiera | Probar la conexión y ver los scopes del token |
| `GET /products` | `integration.products.read` | Buscar y listar (paginado) |
| `GET /products/{id}` | `integration.products.read` | Un producto completo |
| `GET /products/{id}/images` | + `integration.media.read` | Fotos reales |
| `GET /products/{id}/price` | + `integration.pricing.read` | Precio |
| `GET /products/{id}/availability` | + `integration.inventory.read` | Disponibilidad en este momento |
| `GET /categories` | `integration.categories.read` | Categorías y cuántos disponibles |
| `GET /exchange-rates` | `integration.exchange_rates.read` | Tipo de cambio que usa la tienda |
| `GET /changes` | `integration.products.read` | Sincronización incremental |

**No existen:** `/brands` y `/products/{id}/variants`. El sistema no registra marcas ni variantes. Cada equipo es una
unidad con su propia capacidad, color y batería.

Parámetros de `/products`: `search`, `category` (`celulares`, `computadoras`, `productos-apple`, `accesorios`),
`kind` (`unit`, `article`), `condition` (`new`, `used`, `open_box`, `refurbished`, `unknown`), `availability`
(`in_stock` por defecto, `available`, `reserved`, `sold`, `sold_out`, `unavailable`, `all`), `min_price`,
`max_price` (BOB), `currency` (solo `BOB`), `updated_since`, `sort` (`updated_desc` por defecto, `updated_asc`,
`name`, `price_asc`, `price_desc`), `page`, `per_page` (1–100, 25 por defecto). `brand` da 422.

Detalle completo: `APPLE_BOSS_API_CONTRACT.md` y `APPLE_BOSS_API_OPENAPI.yaml`, en la misma carpeta.

## D. Autenticación

- **Cómo se obtiene:** el dueño entra al panel → Sistema → Integraciones API → «Nueva integración», nombre
  `APPLE BOSS AI`, elige los scopes. El token se muestra **una sola vez**.
- **Dónde se guarda:** en el gestor de secretos o en las variables de entorno del servidor de APPLE BOSS AI
  (por ejemplo `APPLEBOSS_API_TOKEN`). Nunca en el código, el repositorio, el frontend, logs ni chats.
- **Cómo se envía:** `Authorization: Bearer <TOKEN>`, solo por HTTPS, solo desde el servidor.
- **Formato:** `<id>|abi_<…>`. Se manda completo, con el `|`.
- **Scopes recomendados para la IA de ventas:** los seis.
- **Rotación:** el dueño pulsa «Rotar token»; el anterior sigue 24 h. Cambiar la variable de entorno dentro de ese plazo.
- **Revocación o desactivación:** corta el acceso al instante (401).
- **Límites:** 120 pedidos/min por integración y 300/min por IP. Pasado eso, 429 con `Retry-After`.

Errores, siempre con esta forma:

```json
{ "error": { "code": "insufficient_scope", "message": "…", "details": { "required_scope": "integration.pricing.read" } } }
```

| HTTP | `code` | Qué hacer |
|---|---|---|
| 401 | `unauthenticated` | Token ausente, revocado, vencido o integración desactivada. Alertar a un humano; no reintentar en bucle |
| 403 | `insufficient_scope` | Pedir al dueño que agregue el scope de `details.required_scope` |
| 404 | `not_found` | El sistema no tiene ese id. **No** concluir que la tienda no lo vende |
| 405 | `method_not_allowed` | La API es de solo lectura |
| 422 | `invalid_parameters` | Corregir parámetros (`details` por campo) |
| 429 | `rate_limited` | Esperar `Retry-After` segundos |
| 500 | `server_error` | Reintentar con espera creciente (2 s, 4 s, 8 s… hasta 5 min) |

## E. Modelos de datos implementados

**Product.** Ejemplo real abreviado. Los valores cambian; la forma no.

```json
{
  "id": "celular-22",
  "kind": "unit",
  "inventory_type": "celular",
  "name": "IPHONE 14 PLUS",
  "display_name": "iPhone 14 Plus 128 GB Celeste",
  "category": { "id": "celulares", "name": "iPhone" },
  "condition": { "value": "used", "label": "Seminuevo" },
  "attributes": {
    "capacity": "128 GB",
    "color": "CELESTE",
    "battery": { "raw": "90", "health_percent": 90, "cycles": null, "sealed": false }
  },
  "availability": { "status": "available", "quantity": 1, "reserved_quantity": 0, "reason": null, "checked_at": "2026-10-09T13:30:02-04:00" },
  "pricing": { "currency": "BOB", "amount": "4500.00", "price_type": "list_price", "promotional_amount": null, "promotion_starts_at": null, "promotion_ends_at": null },
  "publication": {
    "status": "published",
    "title": "iPhone 14 Plus 128 GB Celeste",
    "slug": "iphone-14-plus-128gb-celeste",
    "url": "https://appleboss.com.bo/productos/iphone-14-plus-128gb-celeste",
    "summary": "…", "description": "…", "includes": "…", "warranty": null,
    "attributes": { "chip": "A15 Bionic", "ram": "6 GB", "sim": "Doble SIM (dos eSIM activas o nano-SIM y eSIM)…", "salud_bateria": 90 },
    "updated_at": "2026-09-17T23:46:38-04:00"
  },
  "images": [ { "id": "imagen-1", "url": "https://appleboss.com.bo/storage/catalogo/1/detail/….webp", "sizes": { "thumb": "…", "card": "…", "medium": "…", "detail": "…" }, "alt": "iPhone 14 Plus 128 GB Celeste", "is_primary": true, "position": 1, "updated_at": "…" } ],
  "source": { "system": "appleboss", "source_type": "internal_inventory", "record_id": "celular-22", "retrieved_at": "2026-10-09T13:30:02-04:00" },
  "created_at": "…",
  "updated_at": "2026-09-17T23:46:38-04:00"
}
```

Claves para interpretarlo:

- `kind = "unit"`: un equipo físico. Ids `celular-{n}`, `computadora-{n}`, `producto-apple-{n}`. Su batería, color y
  precio son solo suyos; nunca mezclar datos de dos unidades.
- `kind = "article"`: accesorios agrupados por mismo nombre y mismo precio. Id `accesorio-{16 hex}`.
  `availability.quantity` es cuántas unidades libres hay.
- `name` es el texto cargado por el equipo, a veces en mayúsculas. `display_name` es el mismo con formato. Para
  mostrar a un cliente, usar `publication.title` si existe y si no `display_name`.
- `attributes` son datos de la unidad en el inventario. `publication.attributes` es la ficha técnica pública del
  modelo (chip, pantalla, cámaras, SIM…). Son dos procedencias distintas dentro del mismo sistema.
- `condition.value = null` quiere decir que no está cargada. No suponer «nuevo» ni «seminuevo».
- `battery.raw` es el texto original. «100 SELLADO» se interpreta como batería de equipo sellado.
- `availability`, `pricing` o `images` en `null` quieren decir que el token no tiene ese scope, no que falte el dato.

**Availability:** `status` (`available`, `reserved`, `sold`, `sold_out`, `unavailable`), `quantity`,
`reserved_quantity`, `reason` (`reservation`, `pending_order`, `mixed`, null), `checked_at`.

**Pricing:** `currency` (`BOB`), `amount` (cadena, dos decimales), `price_type` (`list_price`), `promotional_amount`
y su vigencia. En una unidad vendida, `amount` es el precio al que estaba publicada.

**Image:** `id`, `url` (HTTPS absoluta), `sizes` (`thumb`, `card`, `medium`, `detail`), `alt`, `is_primary`,
`position`, `updated_at`. Solo existen para publicaciones visibles en la tienda.

**Category:** `id`, `name`, `inventory_type`, `available_items`, `subcategories` (tipos de accesorio).

**ExchangeRate:** `base` (`USD`), `quote` (`BOB`), `rate` (cadena), `rate_type` (`parallel_buy`), `origin` (`live`,
`last_known`, `manual`), `provider`, `as_of`, `usage`.

**Pagination (meta de `/products`):** `page`, `per_page`, `total`, `last_page`, `sort`, `availability`, `source`,
`retrieved_at`.

**ChangeEvent:** `change_type` (`upsert`, `tombstone` = vendido o agotado), `id`, `updated_at`, `product`.
Meta: `next_cursor`, `has_more`.

**Error:** ver la sección D.

**No implementados:** ProductVariant y Brand (el sistema no los registra).

**Cómo se cuentan.** Un producto es una unidad de equipo, en cualquier estado, o un artículo de accesorios, que reúne
todas las unidades con el mismo nombre y precio. Las publicaciones no suman productos. El 09-10-2026, en producción:

| | Cantidad |
|---|---|
| Unidades de equipo, todos los estados | 318 |
| Unidades de equipo en stock | 60 |
| Artículos de accesorios, con historial | 329 |
| Artículos de accesorios en stock | 242, con 1.536 unidades |
| `/products?availability=all` | 647 |
| `/products` por defecto, en stock | 302 |

No hay duplicados. Un mismo nombre con dos precios es dos artículos: son ofertas distintas.

**Observaciones de los datos reales,** que la IA debe tener en cuenta (no se corrigieron, porque la API no cambia datos):

- Hay equipos cargados para repuesto con la palabra en el nombre, por ejemplo «IPHONE 13 REPUESTO», en estado
  disponible. No ofrecerlos como equipo funcional: si `name` dice «REPUESTO», tratarlo como repuesto.
- Algunos accesorios tienen como nombre su código interno («FUNDA_SILIC_7»). Usar `attributes.accessory_type` para
  describirlos y no repetir el nombre al cliente.
- La condición está vacía en casi todos los celulares (`condition.value = null`). No suponer «nuevo» ni «seminuevo»;
  si importa, preguntar o confirmarlo con el equipo.

## F. Fuente y procedencia

Todo producto trae:

```json
"source": { "system": "appleboss", "source_type": "internal_inventory", "record_id": "celular-22", "retrieved_at": "…" }
```

- Todo lo que devuelve esta API viene de appleboss.com.bo. Nada viene del catálogo de Drive ni de proveedores.
- `retrieved_at` es el momento de la lectura. Guardarlo junto a cada dato en APPLE BOSS AI.
- Al combinar con el catálogo de Drive, **no** asignarle `source.system = "appleboss"` a un dato que vino del PDF.

## G. Casos de uso

Variables usadas abajo (en el servidor, nunca en el código):

```bash
export APPLEBOSS_API="https://appleboss.com.bo/api/v1/integration"
export APPLEBOSS_API_TOKEN="<TOKEN>"
```

**Probar la conexión**

```bash
curl -s -H "Authorization: Bearer $APPLEBOSS_API_TOKEN" "$APPLEBOSS_API/health"
```

**Buscar un iPhone** (todas las palabras deben aparecer, sin importar tildes ni mayúsculas)

```bash
curl -s -H "Authorization: Bearer $APPLEBOSS_API_TOKEN" "$APPLEBOSS_API/products?category=celulares&search=iphone%2015%20pro&sort=price_asc"
```

Si `meta.total` es 0, el inventario registrado no lo tiene. Consultar el catálogo de Drive y ofrecer «a pedido».

**Buscar una MacBook**

```bash
curl -s -H "Authorization: Bearer $APPLEBOSS_API_TOKEN" "$APPLEBOSS_API/products?category=computadoras&search=macbook%20air"
```

Comparar `attributes.processor`, `attributes.ram` y `attributes.storage` de cada unidad.

**Consultar disponibilidad antes de confirmar a un cliente**

```bash
curl -s -H "Authorization: Bearer $APPLEBOSS_API_TOKEN" "$APPLEBOSS_API/products/celular-22/availability"
```

`available`: se puede ofrecer. `reserved`: está apartado y puede liberarse; no prometerlo. `sold` o `sold_out`: ya no.

**Obtener fotografías para enviar por WhatsApp**

```bash
curl -s -H "Authorization: Bearer $APPLEBOSS_API_TOKEN" "$APPLEBOSS_API/products/celular-22/images"
```

Usar `sizes.medium` o `url`. Si `data` está vacío, el producto no tiene fotos publicadas: no generar ni inventar una.

**Consultar el precio**

```bash
curl -s -H "Authorization: Bearer $APPLEBOSS_API_TOKEN" "$APPLEBOSS_API/products/celular-22/price"
```

Mostrar `promotional_amount` si no es null; si no, `amount`. Siempre en BOB.

**«Variantes»: el mismo modelo en otras capacidades o colores.** No hay endpoint. Buscar el modelo y comparar unidades:

```bash
curl -s -H "Authorization: Bearer $APPLEBOSS_API_TOKEN" "$APPLEBOSS_API/products?search=iphone%2014%20plus"
```

Cada resultado es una unidad con su capacidad, color, batería y precio. No agruparlas como si fueran intercambiables.

**Tipo de cambio**

```bash
curl -s -H "Authorization: Bearer $APPLEBOSS_API_TOKEN" "$APPLEBOSS_API/exchange-rates"
```

Si `meta.available` es `false`, no hay tasa: no inventar una. Los precios del inventario no se convierten; si se
informa un equivalente en dólares, decir que es aproximado y con qué tasa.

**Sincronizar**

1. Sincronización completa: recorrer `/products?availability=all&per_page=100&sort=updated_asc` página por página y
   guardar la hora de inicio.
2. Cada 2 a 5 minutos: `/changes?since=<hora de inicio>&limit=200`, y seguir con `cursor=<meta.next_cursor>` mientras
   `has_more` sea `true`. Guardar el último `next_cursor`.
3. `upsert`: actualizar el producto. `tombstone`: marcarlo como vendido o agotado (no borrarlo del historial).
4. Una vez al día, repetir la completa con `availability=all`. Un id que no vuelve en **dos** completas seguidas se
   marca como «ya no registrado»: lo borraron del inventario. `/changes` no informa borrados, y un producto vendido no
   desaparece (queda como `sold` o `sold_out`). Si un id «no registrado» vuelve a aparecer, se reactiva.
5. Antes de prometer stock, leer `/availability` en vivo; las reservas pueden cambiar entre sincronizaciones.

**Manejar caídas de la API**

- Timeout de 10 s por pedido. Reintentos con espera creciente en 429 (respetando `Retry-After`) y en 5xx.
- Si la API no responde, usar la última copia sincronizada con su `retrieved_at` y responder como dato no confirmado:
  «según nuestro último registro…, lo confirmo con el equipo».
- Nunca afirmar stock con datos de más de unos minutos. Nunca inventar un precio si no hay ninguno guardado.
- 401 o 403 no se arreglan reintentando: avisar a una persona.

**Procedimiento de conexión desde APPLE BOSS AI, en orden**

1. El dueño confirma que la API está desplegada y crea la integración «APPLE BOSS AI» con los seis permisos.
2. El token va directo al gestor de secretos del servidor de APPLE BOSS AI, como `APPLEBOSS_API_TOKEN`, junto con
   `APPLEBOSS_API=https://appleboss.com.bo/api/v1/integration`. Nunca pasa por un chat ni por un prompt.
3. Primer pedido: `GET /health`. Debe dar 200 con los seis scopes.
4. Sincronización completa y guardado de cada producto con su `source` y su `retrieved_at`.
5. Tarea periódica de `/changes` cada 2 a 5 minutos y completa diaria (pasos de arriba).
6. En la conversación con un cliente: buscar en la copia local; antes de prometer, `GET /products/{id}/availability`
   en vivo; si no aparece, consultar las otras fuentes y ofrecer «a pedido».
7. Alertas: 401 o 403 avisan a una persona; 429 y 5xx se reintentan con espera.

## H. Restricciones del consumidor

APPLE BOSS AI:

- No puede modificar stock, precios ni productos, ni crear pedidos o reservas: la API es de solo lectura.
- No accede al panel ni a datos de clientes. La API no los entrega.
- No debe tratar la ausencia de un dato como prueba de que la tienda no vende algo.
- No debe anunciar stock confirmado si la fuente no lo confirma en ese momento.
- No debe inventar precios, condiciones, baterías ni especificaciones.
- No debe duplicar registros sin conservar su procedencia (`source`).
- No debe deducir marcas ni variantes desde el nombre como si fueran datos del sistema.

## I. Integración con múltiples fuentes (recomendación, no implementado)

Orden de trabajo sugerido para APPLE BOSS AI:

1. Conectar esta API como fuente `internal_api` con su sincronización.
2. Procesar el catálogo de Google Drive como fuente `commercial_catalog`, con fecha de versión del documento.
3. Agregar proveedores (`supplier_list`), documentos internos (`internal_doc`) y datos manuales (`manual`).
4. Guardar cada dato con su fuente, su fecha y su id de origen. No fusionar registros sin conservar eso.

Modelo de procedencia sugerido. Es un ejemplo conceptual, no un producto real:

```json
{
  "item": "iPhone 16 Pro",
  "sources": [
    { "type": "internal_api", "status": "not_found", "checked_at": "2026-10-09T12:00:00-04:00" },
    { "type": "commercial_catalog", "status": "listed", "document_version": "2026-10-01", "price_reference": "a confirmar" }
  ],
  "verified_stock": false,
  "requires_confirmation": true
}
```

## J. Reglas de conflicto para la IA (recomendaciones de arquitectura)

1. Conservar la procedencia por campo, no solo por producto.
2. Comparar fechas de actualización (`updated_at`, `retrieved_at`, versión del documento).
3. Diferenciar precio publicado (`list_price` de la API) de cotización o precio referencial.
4. Distinguir existencia registrada de disponibilidad física.
5. Registrar las contradicciones en lugar de esconderlas.
6. No elegir automáticamente el precio menor ni el mayor.
7. No reemplazar el inventario por documentos desactualizados.
8. No descartar productos que la API no tenga.
9. Ante información contradictoria, pedir verificación humana.
10. No presentar estimaciones como confirmaciones.

## K. Para retomar en otra sesión o cuenta

- **Qué está hecho:** API v1 completa en el repositorio de la tienda (`ApplebBoss-Laravel`, carpeta `src/`), con panel
  de integraciones, 23 pruebas automáticas propias y la suite completa en verde. Auditoría de seguridad y de datos del
  09-10-2026 en `APPLE_BOSS_API_SECURITY.md`.
- **Commit:** COMMIT_PENDIENTE en la rama `main` del repositorio de la tienda, sin push.
- **Qué falta del lado de la tienda:** que el dueño autorice el push y el despliegue
  (`APPLE_BOSS_API_DEPLOYMENT.md`), y después crear la integración «APPLE BOSS AI» para obtener el token.
  Recomendado en el mismo despliegue: la corrección de IP real en Caddy (parte B de ese plan).
- **Qué falta del lado de APPLE BOSS AI:** todo lo de las secciones G, I y J. Nada de eso va en el repositorio de la
  tienda.
- **Contrato estable:** v1 no cambia nombres ni tipos. Si algo no cuadra con este documento, manda el OpenAPI
  (`APPLE_BOSS_API_OPENAPI.yaml`) y las pruebas (`tests/Feature/IntegracionApiTest.php`) del repositorio de la tienda.
- **Prueba rápida de que todo está vivo:** `GET /health` con el token → 200 con `data.status = "ok"` y la lista de
  scopes.
