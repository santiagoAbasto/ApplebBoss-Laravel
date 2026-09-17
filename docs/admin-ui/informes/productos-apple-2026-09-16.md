# Productos Apple en la tienda: fichas, ilustraciones y comparativa (2026-09-16)

## Resumen

- La base de modelos de referencia suma **29 fichas** de tipo `producto_apple` (la categoría «Más Apple» de la tienda):
  9 iPad, 3 Apple Watch, 8 AirPods, 5 accesorios de Apple (Apple Pencil y Magic Mouse) y **4 productos de otras marcas**
  que están cargados en «Productos Apple» (familia `otra_marca`). Son todos los productos del inventario de ese día y,
  cuando el nombre deja dudas, también la otra variante (11 o 13 pulgadas, estuche USB‑C o Lightning).
- **Los iPad son Wi‑Fi, salvo uno** (lo confirmó el usuario el 2026-09-16): el iPad Pro de 11 pulgadas (M5) con IMEI es
  Wi‑Fi + Cellular y tiene su ficha. Un iPad que diga LTE, Cellular o 5G, o que tenga IMEI, toma la ficha Wi‑Fi + Cellular
  si existe; si no, ninguna (su peso, su red y su número de modelo son otros).
- **Otras marcas, solo para estos casos puntuales y fuera de la comparativa:** Samsung Galaxy Tab S9 Ultra Wi‑Fi,
  Samsung Galaxy Tab S10 Lite 5G, el monitor selfie K&F Concept M5 y el ventilador de cuello Torras COOLiTE (FG2). En la
  tienda muestran su marca en lugar de la categoría «Apple» y tienen su propio dibujo (tablet, monitor y ventilador).
- Al publicar un producto Apple, se reconoce por su **nombre** y la publicación sale con la ficha técnica completa, el
  resumen, la descripción, el color con su nombre oficial («BLUE» → «Azul») y, **solo si es Nuevo**, lo que trae la caja
  de Apple. La capacidad, el color y la salud de la batería salen de la unidad; el precio, del inventario.
- **Comparativa nueva:** `/comparar/apple`, hasta 4 productos Apple lado a lado, con el precio y el stock de la tienda.
  Está en el menú «Comparar» del header, en las tarjetas del menú del celular y en el pie.
- Mientras no haya foto, la tienda dibuja cada producto: iPad a escala, Apple Watch, AirPods (Pro con almohadillas o
  abiertos), AirPods Max, Apple Pencil y Magic Mouse. La ficha suma 11 íconos SVG propios.
- Las 770 cifras de las 24 fichas se revisaron con un script contra el texto de las páginas de Apple descargadas (en
  inglés y en español, y las de números de modelo): todas están en su página. Quedan fuera la RAM del iPad (A16) y del
  iPad mini (fuentes externas) y las versiones de sistema (listas de compatibilidad de Apple).

## Cómo funciona

| Pieza | Dónde |
|---|---|
| Datos (se generan, no se editan a mano) | `src/database/data/modelos_referencia/productos_apple.php` ← `herramientas/generar_productos_apple.py` |
| Esquema | `App\Support\FichaTecnica\EsquemaProductoApple` (familias `ipad`, `watch`, `airpods` y `accesorio_apple`) |
| Textos de la ficha | `TextosAccesorio` (pasan tal cual) y, para la comparativa, los colores oficiales (`colores_disponibles`) |
| Descripción de la publicación | `App\Support\FichaTecnica\ContenidoProductoApple` («Qué incluye» solo en Nuevo) |
| Cómo se reconoce | `ModeloReferencia::detectarProductoApple()` |
| Publicación desde el inventario | `InventarioCatalogo::crear()` |
| Campos e íconos de la ficha | `fichaTecnica.jsx` (grupo `producto_apple`, campos por familia) e `Icons.jsx` |
| Ilustraciones | `Components/Store/AccesorioVisual.jsx` (formas `tablet`, `reloj`, `audifonos`, `audifonos_diadema`, `lapiz` y `mouse`) |
| Comparativa | `ComparadorModelosController::FAMILIAS['apple']` y `comparativa.jsx` (`ESENCIAL.producto_apple`) |

**Cómo se reconoce.** El nombre del inventario pasa a minúsculas, sin tildes y con las unidades pegadas («IWATCH SERIE
10 DE 46MM + LTE» → «iwatch serie 10 de 46mm lte») y se prueba contra `sistema.detectar` y `sistema.excluir` de cada
ficha. Si la ficha tiene variante con red celular (`sistema.celular`), la unidad lo es si tiene IMEI o si el nombre dice
LTE, Cellular, 5G o 4G. **Si coincide más de una ficha, no se elige**: la elige quien publica en «Llenar desde modelo».
Sin coincidencias, se prueba el nombre exacto de la ficha y de sus alias.

## Las 24 fichas y sus fuentes

La fuente es la ficha técnica de Apple de EE. UU. (`support.apple.com/en-us/<id>`) con los nombres en español de la de
Latinoamérica (`es-lamr/<id>`). Si no coinciden, vale la de EE. UU. (el usuario importa desde allá).

| Ficha | Página de Apple | Además |
|---|---|---|
| iPad (A16) Wi‑Fi | 122240 | RAM (Apple no la publica): MacRumors, Wikipedia y EveryMac coinciden en 6 GB |
| iPad mini (A17 Pro) Wi‑Fi | 121456 | RAM: MacRumors, Wikipedia, EveryMac y 9to5Mac coinciden en 8 GB |
| iPad Air de 11 y de 13 pulgadas (M4) Wi‑Fi | 126471 · 126472 | — |
| iPad Pro de 11 y de 13 pulgadas (M4) Wi‑Fi | 119892 · 119891 | Apple publica la memoria (8 o 16 GB según el almacenamiento) |
| iPad Pro de 11 y de 13 pulgadas (M5) Wi‑Fi | 125406 · 125407 | Apple publica la memoria (12 o 16 GB) |
| Apple Watch Series 10 (46 mm, aluminio, GPS y GPS + Cellular; titanio) | 121202 | Disponibilidad de funciones en Bolivia: apple.com/watchos/feature-availability |
| AirPods Pro 3 | 125135 | Salud auditiva en Bolivia: apple.com/airpods-pro/feature-availability |
| AirPods Pro 2 (USB‑C) y (Lightning) | 111834 · 111851 | Ídem |
| AirPods 4 y AirPods 4 con cancelación activa de ruido | 121203 · 121204 | — |
| AirPods Max 2 y AirPods Max (USB‑C) | 126620 · 121205 | Peso del Max (USB‑C): 386,2 g en EE. UU. y 384,8 g en es-lamr; vale EE. UU. |
| AirPods (1.ª generación) | 111855 | — |
| iPad Pro de 11 pulgadas (M5) Wi‑Fi + Cellular | 125406 | «Wi-Fi + Cellular models»: módem C1X, eSIM, 446 g, A3358 |
| Samsung Galaxy Tab S9 Ultra Wi‑Fi (SM-X910) | samsung.com/levant … sm-x910nzaamea | Tabla «Specifications», IP68, AKG y Armor Aluminum de la misma página |
| Samsung Galaxy Tab S10 Lite 5G (SM-X406B) | samsung.com/uk … sm-x406bzareub | Exynos 1380, 8 GB con 256 GB, qué trae la caja y actualizaciones: samsung.com/us/tablets/galaxy-tab-s10-lite |
| K&F Concept M5 | amazon.com/dp/B0GGBH368Y | Publicación oficial de K&F CONCEPT (la marca no lo publica en su sitio) |
| Torras COOLiTE (FG2) | amazon.com/dp/B0GM5YCTC5 | Publicación oficial de TORRAS («Model Number: FG2»); en coolify.torraslife.com el FG2 negro es el «COOLiTE - Black» |
| Apple Pencil (USB‑C), Apple Pencil Pro y Apple Pencil (2.ª generación) | 121318 · 120123 · 111889 | Compatibilidad del de USB‑C: 108937 |
| Magic Mouse (USB‑C) y (Lightning) | 121931 · 111885 | — |

Números de modelo: 108043 (iPad), 108056 (Apple Watch) y 109525 (AirPods). Último iPadOS: la lista de iPad compatibles
con iPadOS 27 (support.apple.com/guide/ipad/ipad213a25b2). Último watchOS: 108926.

**Lo que Apple no ofrece en Bolivia se dice así:** la App ECG y los avisos de ritmo irregular y de apnea del sueño del
Apple Watch, y la Prueba de Audición, la función de audífono y la Protección Auditiva de los AirPods Pro.

## Pendientes

Ninguno en estas fichas. Los dos que quedaban se cerraron el mismo día:

- **Con qué iPadOS salieron los iPad Pro:** Wikipedia (infobox) y everymac.com («Pre-Installed OS») coinciden: los M4
  salieron con iPadOS 17.5 (21F84) y los M5, con iPadOS 26.0 (23A8330). La ficha dice la versión principal, como el
  resto de los iPad: «iPadOS 17» y «iPadOS 26».
- **Peso del Torras COOLiTE (FG2):** 321 g, impreso en la caja de la unidad (lo leyó el usuario). Su publicación de Amazon
  decía 10,4 oz en un lugar y 10,9 oz en otro.

## Inventario corregido (2026-09-16)

El usuario corrigió los tamaños de los iPad Air y Pro y pidió dejar el resto de los nombres profesionales. Se corrigieron
41 productos de «Productos Apple» (solo modelo, capacidad y color; nada de precios ni IMEI): errores de tipeo («LIGTHNING»,
«GRISS», «POWERFULL»), nombres oficiales («IWATCH SERIE 10» → «APPLE WATCH SERIES 10», «PENCIL» → «APPLE PENCIL»), un mismo
formato («USB -C» → «USB-C», «3 GEN» → «3RA GEN», sin puntos al final), colores en español («BLUE» → «AZUL», «MIDNIGHT» →
«MEDIANOCHE») y el número de serie real del Torras (FG2X55805292; antes tenía el código de Amazon X00505T4EJ). Los valores
anteriores quedaron respaldados en el scratchpad de la sesión (`respaldo_productos_apple.json`).

Los dos «IPAD AIR M4» vendidos (#44 y #45) son de 11 pulgadas (lo confirmó el usuario) y pasaron a «IPAD AIR M4 11 INCH».
Con eso, **los 49 productos del inventario de «Productos Apple» reconocen su ficha**, vendidos incluidos. La detección también acepta «LIGTHNING» y «LIGHTING» por si vuelve a escribirse así.

## Cómo agregar un producto Apple

1. Ver cómo está escrito en el inventario (Productos Apple) y si ya lo reconoce una ficha: el importador de la tienda
   lo dice («Ficha: …» o «Sin ficha: la eliges al editar la publicación»).
2. Buscar su página técnica: en `support.apple.com/en-us/docs/ipad`, `…/airpods`, `…/watch` o `…/accessories` está el
   producto, y su página lleva a «Tech Specs». Descargar la de EE. UU. y la de `es-lamr`.
3. En `generar_productos_apple.py`, sumar la ficha en su lista (IPADS, RELOJES, AIRPODS o ACCESORIOS_APPLE) con su
   `detectar`, la ficha, el contenido (sin superlativos ni afirmaciones que no estén en la página) y su fuente en
   `FUENTES`. Lo que Apple no publica, con dos fuentes externas que coincidan; si no, «falta».
4. `python3 generar_productos_apple.py`, `php artisan modelos:verificar` (0 errores), sumar el nombre a la tabla de
   `FichasProductosAppleTest`, `php artisan db:seed --class=ModelosReferenciaSeeder` y los tests.
