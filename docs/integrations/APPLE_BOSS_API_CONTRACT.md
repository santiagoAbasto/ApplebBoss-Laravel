# Contrato de la API de integración Apple Boss — v1

> Base: `https://appleboss.com.bo/api/v1/integration` · Solo lectura (GET) · JSON UTF-8 · Fechas ISO 8601 con zona
> (America/La_Paz, `-04:00`) · Especificación formal: [APPLE_BOSS_API_OPENAPI.yaml](APPLE_BOSS_API_OPENAPI.yaml).
> Código: `src/routes/api.php` (grupo `v1/integration`), `src/app/Http/Controllers/Api/Integracion/IntegracionController.php`,
> `src/app/Support/Integracion/InventarioIntegracion.php`. Pruebas: `src/tests/Feature/IntegracionApiTest.php`.

## Reglas del contrato

1. Los nombres de campos y sus tipos no cambian dentro de v1. Un campo nuevo puede aparecer; ninguno desaparece.
2. Un campo que no corresponde o que el sistema no tiene va en `null`, nunca se omite ni se rellena.
3. Los ids son estables y no se reutilizan para otro producto.
4. Los importes son cadenas con dos decimales (`"4500.00"`) para no perder precisión.
5. Ningún endpoint devuelve costo, ganancia, IMEI ni su estado, número de serie, procedencia o proveedor, códigos
   internos, notas privadas ni datos de clientes.
6. Un cambio incompatible sería v2, con convivencia de las dos versiones y aviso previo.

## Autenticación

`Authorization: Bearer <token>`. Cada endpoint pide un permiso (scope) de la integración. Ver
[APPLE_BOSS_API_SECURITY.md](APPLE_BOSS_API_SECURITY.md).

| Scope | Habilita |
|---|---|
| `integration.products.read` | `/products`, `/products/{id}`, `/changes` |
| `integration.categories.read` | `/categories` |
| `integration.inventory.read` | bloque `availability`, `/products/{id}/availability`, filtro `availability` |
| `integration.pricing.read` | bloque `pricing`, `/products/{id}/price`, filtros y orden por precio |
| `integration.media.read` | bloque `images`, `/products/{id}/images` |
| `integration.exchange_rates.read` | `/exchange-rates` |

Sin el scope de un bloque, ese bloque llega en `null`. Filtrar u ordenar por algo sin su scope responde 403.

`products.read` por sí solo ya deja saber si un producto sigue a la venta: la lista muestra por defecto lo que está
en stock y `/changes` marca como `tombstone` lo vendido. El estado exacto, las cantidades y el motivo de una reserva
piden `inventory.read`.

## Cómo se cuentan los productos

Un producto de la API es una de dos cosas, nunca las dos a la vez:

1. **Una unidad de equipo** (`kind = "unit"`): una fila de `celulares`, `computadoras` o `productos_apple`, en
   cualquier estado. Cada equipo físico es un producto.
2. **Un artículo de accesorios** (`kind = "article"`): todas las filas de `productos_generales` con el mismo nombre
   (sin mayúsculas ni espacios de más) y el mismo precio. Mil vidrios iguales son **un** producto con su cantidad.

Las publicaciones de la tienda no suman productos: se cuelgan de la unidad o del artículo que publican. No hay
duplicados: un id aparece una sola vez en un recorrido completo.

Medido con consultas de solo lectura el 09-10-2026:

| | Producción | Copia local |
|---|---|---|
| Unidades de equipo, todos los estados | 318: 220 celulares, 49 computadoras, 49 otros Apple | 297 |
| … en stock | 60 | 62 |
| Artículos de accesorios, con historial | 329 | 327 |
| … con unidades en stock | 242 (1.536 unidades) | 247 (1.569 unidades) |
| **`/products?availability=all`** | **647** | **624** |
| **`/products` (en stock, por defecto)** | **302** | **309** |

Un mismo nombre de accesorio con dos precios es dos artículos: son ofertas distintas, no duplicados. En la copia
local había 19 nombres así. Una unidad con estado `permuta` sale como `unavailable` (2 celulares en producción).

## Endpoints

| Método y ruta | Scopes | Qué devuelve |
|---|---|---|
| `GET /health` | cualquiera | Estado, versión, nombre de la integración y sus scopes |
| `GET /products` | products | Lista paginada de productos |
| `GET /products/{id}` | products | Un producto |
| `GET /products/{id}/images` | products + media | Sus fotos |
| `GET /products/{id}/price` | products + pricing | Su precio |
| `GET /products/{id}/availability` | products + inventory | Su disponibilidad al momento |
| `GET /categories` | categories | Categorías del inventario |
| `GET /exchange-rates` | exchange_rates | Tipo de cambio que usa la tienda |
| `GET /changes` | products | Cambios desde una fecha o un cursor |

**No existen** y responden 404: `/brands` y `/products/{id}/variants`. El sistema no registra marcas ni variantes
(ver «Lo que el sistema no registra»). Cualquier POST, PUT, PATCH o DELETE responde 405.

### `GET /products`

| Parámetro | Tipo | Valores | Notas |
|---|---|---|---|
| `search` | texto ≤ 100 | — | Todas las palabras (hasta 8) deben aparecer en el nombre, el título, la categoría o los atributos. Sin mayúsculas ni tildes |
| `category` | enum | `celulares`, `computadoras`, `productos-apple`, `accesorios` | |
| `kind` | enum | `unit`, `article` | |
| `condition` | enum | `new`, `used`, `open_box`, `refurbished`, `unknown` | `unknown` = sin condición cargada |
| `availability` | enum | `in_stock` (defecto), `available`, `reserved`, `sold`, `sold_out`, `unavailable`, `all` | `in_stock` = disponible + reservado. Otro valor pide `inventory.read` |
| `min_price`, `max_price` | número ≥ 0 | BOB | Sobre el precio que paga hoy el comprador: el promocional si está vigente. Pide `pricing.read` |
| `currency` | enum | `BOB` | El único que existe; otro valor da 422 |
| `updated_since` | fecha ISO 8601 | — | `updated_at` mayor o igual |
| `sort` | enum | `updated_desc` (defecto), `updated_asc`, `name`, `price_asc`, `price_desc` | Desempate siempre por `id`. Por precio pide `pricing.read` |
| `page` | entero ≥ 1 | — | |
| `per_page` | entero 1–100 | 25 por defecto | |
| `brand` | — | — | Prohibido: 422 (no hay marcas) |

Respuesta:

```json
{
  "data": [ { "…": "Product" } ],
  "meta": { "page": 1, "per_page": 25, "total": 309, "last_page": 13, "sort": "updated_desc",
            "availability": "in_stock", "source": "appleboss", "retrieved_at": "2026-10-09T13:30:02-04:00" }
}
```

### `GET /products/{id}` y sus subrecursos

- `/products/{id}` → `{"data": Product, "meta": {"retrieved_at"}}`.
- `/products/{id}/images` → `{"data": [Image], "meta": {"product_id", "publication_status", "retrieved_at"}}`.
  Sin publicación visible: `data = []`.
- `/products/{id}/price` → `{"data": {"product_id", …Pricing, "source"}}`.
- `/products/{id}/availability` → `{"data": {"product_id", …Availability, "source"}}`.
- Un id que no existe → 404 `not_found`. Un producto vendido o agotado sigue respondiendo 200 con su estado.

### `GET /categories`

```json
{ "data": [
  { "id": "celulares", "name": "iPhone", "inventory_type": "celular", "available_items": 22, "subcategories": [] },
  { "id": "accesorios", "name": "Accesorios", "inventory_type": "producto_general", "available_items": 247,
    "subcategories": [ { "id": "vidrio_templado", "name": "Vidrio templado", "available_items": 120 } ] }
] }
```

`available_items` cuenta los productos con `status = available`. Sin `inventory.read` va en `null`. Las cifras del
ejemplo son ilustrativas.

### `GET /exchange-rates`

```json
{ "data": [ { "base": "USD", "quote": "BOB", "rate": "9.87", "rate_type": "parallel_buy", "origin": "live",
              "provider": "dolarbluebolivia.click", "as_of": "2026-10-09T12:41:00-04:00",
              "usage": "Bolivianos por dólar paralelo (lado compra)…" } ],
  "meta": { "available": true, "source": "appleboss", "retrieved_at": "…" } }
```

- Es la misma tasa con la que la tienda cobra en USDT (Binance Pay): el dólar paralelo, lado compra.
- `origin`: `live` (leída de la fuente hace menos de 30 min), `last_known` (la fuente falló; último valor bueno de los
  últimos 7 días) o `manual` (tasa fija configurada en el servidor). `as_of` es `null` para `manual`.
- Si no hay ninguna: `data = []` y `meta.available = false`. Nunca se inventa ni se cae al oficial.
- Los precios del inventario están en BOB y la API **no** los convierte.

### `GET /changes`

| Parámetro | Notas |
|---|---|
| `since` | Fecha ISO 8601. Cambios con `updated_at` mayor o igual. Obligatorio si no hay `cursor` |
| `cursor` | El `meta.next_cursor` del lote anterior. Cambios estrictamente posteriores |
| `limit` | 1–200, 100 por defecto |

```json
{ "data": [ { "change_type": "upsert", "id": "celular-22", "updated_at": "…", "product": { "…": "Product" } },
            { "change_type": "tombstone", "id": "celular-15", "updated_at": "…", "product": { "…": "status sold" } } ],
  "meta": { "next_cursor": "WzE3NjAwMDAwMDAsImNlbHVsYXItMjIiXQ", "has_more": false, "retrieved_at": "…" } }
```

- Orden: `updated_at` ascendente y después `id`. El cursor es opaco; no se arma a mano.
- `tombstone` = vendido (`sold`) o agotado (`sold_out`): ya no se puede vender. El producto sigue consultable.
- Mueven `updated_at`: cambios en la unidad o en sus unidades (accesorios), en su publicación, en sus fotos, y en
  reservas o pedidos que la incluyen.
- **No** se informa un registro borrado del inventario. Para detectarlo: sincronización completa de `/products?availability=all`
  una vez al día y comparar ids.
- Sincronización recomendada: completa con `/products?availability=all` → guardar la hora de inicio → cada pocos minutos
  `/changes?since=<esa hora>` y luego seguir con `cursor` mientras `has_more` sea `true`.

## Esquemas

### Product

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | `celular-{n}`, `computadora-{n}`, `producto-apple-{n}` (una unidad) o `accesorio-{16 hex}` (un artículo) |
| `kind` | `unit` \| `article` | `unit`: un equipo físico con datos propios. `article`: accesorios con el mismo nombre y precio |
| `inventory_type` | `celular` \| `computadora` \| `producto_apple` \| `producto_general` | Tabla de origen |
| `name` | string \| null | El nombre tal como se cargó (a veces en mayúsculas) |
| `display_name` | string | El mismo nombre con el formato de la tienda («iPhone 14 Plus 128 GB Celeste») |
| `category` | `{id, name}` | Ver `/categories` |
| `condition` | `{value, label}` | `value`: `new` \| `used` \| `open_box` \| `refurbished` \| null. `label`: lo cargado («Seminuevo») o null. Vacío no se supone |
| `attributes` | objeto | Datos de la unidad cargados en el inventario. Ver abajo |
| `availability` | Availability \| null | null sin `inventory.read` |
| `pricing` | Pricing \| null | null sin `pricing.read` |
| `publication` | Publication | Su ficha en la tienda, si la tiene |
| `images` | [Image] \| null | null sin `media.read`; `[]` sin publicación visible |
| `source` | Source | Procedencia |
| `created_at` | fecha \| null | Alta en el inventario (en artículos, la unidad más vieja) |
| `updated_at` | fecha \| null | El último cambio que afecta al producto (ver `/changes`) |

`attributes` según el tipo. Todo es texto tal como se cargó, o null:

- `celular`, `producto_apple`: `capacity`, `color`, `battery`.
- `computadora`: `processor`, `ram` (suele ser el número de GB sin unidad), `storage`, `color`, `battery`.
- `producto_general`: `accessory_type` = `{id, name}` (`funda`, `cargador_20w`, `cargador_5w`, `vidrio_templado`,
  `vidrio_camara`, `accesorio`, `otro`) o null.
- `battery` = `{raw, health_percent, cycles, sealed}` o null. `raw` es el texto cargado («90», «100 SELLADO»,
  «149 CICLOS»). `health_percent` es el número de ese texto; si dice «sellado» sin número, la tienda lo toma como 100.

### Availability

| Campo | Tipo | Notas |
|---|---|---|
| `status` | `available` \| `reserved` \| `sold` \| `sold_out` \| `unavailable` | `sold`: unidad vendida. `sold_out`: artículo sin unidades. `unavailable`: otro estado del inventario (por ejemplo, recibido en permuta) |
| `quantity` | entero | Unidades libres. Una unidad: 1 o 0. Un artículo: las unidades en tienda sin reservar |
| `reserved_quantity` | entero | Unidades apartadas |
| `reason` | `reservation` \| `pending_order` \| `mixed` \| null | Por qué está reservado: reserva en el local, pedido en línea sin cerrar, o ambos |
| `checked_at` | fecha | Momento del cálculo. Leer de nuevo antes de prometer stock |

### Pricing

| Campo | Tipo | Notas |
|---|---|---|
| `currency` | `"BOB"` | El inventario solo tiene bolivianos |
| `amount` | string \| null | Precio de venta cargado, dos decimales |
| `price_type` | `"list_price"` | Precio publicado del inventario, no una cotización |
| `promotional_amount` | string \| null | Solo si la publicación está visible y la promoción vigente |
| `promotion_starts_at`, `promotion_ends_at` | fecha \| null | Vigencia de la promoción, si tiene |

En un `unit` vendido, `amount` es el precio al que estaba publicado, no el de la venta.

### Publication

| Campo | Tipo | Notas |
|---|---|---|
| `status` | `published` \| `not_published` \| `not_listed` | Visible hoy en la tienda; con ficha pero oculta (borrador, programada o vencida); sin ficha |
| `title`, `slug`, `url` | string \| null | Solo si `published`. `url` absoluta HTTPS |
| `summary`, `description`, `includes`, `warranty` | string \| null | Textos públicos de la ficha |
| `attributes` | objeto \| null | Ficha técnica pública (chip, pantalla, cámaras…), en español, sin datos internos |
| `updated_at` | fecha \| null | |

### Image

`{ id: "imagen-{n}", url, sizes: {thumb, card, medium, detail}, alt, is_primary, position, updated_at }`. Direcciones
HTTPS absolutas que no vencen por tiempo. Si la tienda reemplaza una foto, la dirección cambia: guiarse por `updated_at`. La principal va primero y luego por `position`. Formato WebP.

### Source

`{ system: "appleboss", source_type: "internal_inventory", record_id: <id>, retrieved_at }`. Todo lo que devuelve esta
API viene del sistema Apple Boss. Nada viene del catálogo de Google Drive ni de proveedores.

### Error

```json
{ "error": { "code": "insufficient_scope", "message": "Este token no tiene el permiso integration.pricing.read.",
             "details": { "required_scope": "integration.pricing.read" } } }
```

| HTTP | `code` | Cuándo |
|---|---|---|
| 401 | `unauthenticated` | Sin token, token falso, revocado o vencido, o integración desactivada |
| 403 | `insufficient_scope` | Falta el permiso (`details.required_scope`) |
| 404 | `not_found` | Ruta o id inexistente |
| 405 | `method_not_allowed` | Cualquier método que no sea GET |
| 422 | `invalid_parameters` | Parámetros inválidos (`details` por campo) |
| 429 | `rate_limited` | Límite superado; esperar `Retry-After` segundos |
| 500 | `server_error` | Falla interna; reintentar con espera creciente |

## Lo que el sistema no registra (y por eso la API no tiene)

| Pedido en el encargo | Situación real | Qué hace la API |
|---|---|---|
| Marcas (`/brands`, filtro `brand`) | No hay entidad ni campo de marca. Los equipos son casi todos Apple; entre los accesorios hay otras marcas (Amazon, PlayStation, genéricos) solo dentro del nombre | Sin endpoint; filtro → 422. La marca no se deduce del nombre |
| Variantes (`/products/{id}/variants`) | No hay entidad de variante. Cada equipo es una unidad con su capacidad, color y batería | Sin endpoint; cada unidad es su propia configuración; no se deducen variantes del nombre |
| SKU | Los accesorios tienen un código interno por unidad, de uso interno | No se expone |
| Stock por sucursal | El inventario no está separado por local | No existe el dato |
| SIM física / eSIM de la unidad | No se registra por unidad | Solo aparece si la ficha pública del modelo lo dice (`publication.attributes.sim`) |
| Precio en USD | Los precios están en BOB | No se convierte |
| «Bajo pedido» | No es un estado del inventario | No existe; corresponde a otras fuentes |
| Historial de borrados | No se registra | `/changes` no los informa |
| Fotos de unidades sin publicar | Las fotos viven en la publicación | `images = []` |
