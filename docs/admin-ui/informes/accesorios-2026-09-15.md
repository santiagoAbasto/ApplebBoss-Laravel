# Accesorios en la tienda: fichas, descripciones y comparativas (2026-09-15)

## Resumen

- La base de modelos de referencia suma **58 fichas de accesorios** (tipo `producto_general`), una por cada tipo de
  producto que hay disponible en el inventario: cargadores, vidrios, protectores, fundas, cables y accesorios de marca.
  Solo 3 artículos quedan sin ficha porque no hay datos que se puedan comprobar (ver [Revisar en el inventario](#revisar-en-el-inventario)).
- Al publicar un accesorio (Tienda online → Productos en la tienda → Agregar productos), se reconoce por su **nombre**
  y la publicación sale completa: resumen, descripción, «Qué incluye», ficha técnica con íconos, categoría y los
  modelos de iPhone con los que es compatible. El precio y el stock siguen saliendo del inventario.
- Dos comparativas nuevas en la tienda:
  - **/comparar/cargadores**: el adaptador USB‑C de 20 W de Apple, el cargador de 20 W certificado y el adaptador
    dinámico de 40 W de Apple, lado a lado (y el resto de los cubos del inventario para elegir).
  - **/comparar/vidrios**: el vidrio templado Gorilla Glass y el tradicional (y los vidrios con filtro).
- Mientras un accesorio no tenga foto, la tienda dibuja una ilustración de su tipo (cargador, vidrio, protector de
  cámara, funda, cable, parlante o control). La ficha suma 18 íconos SVG propios.
- Si una unidad se vende, su ficha queda: la base no depende del stock.

## Cómo funciona

| Pieza | Dónde |
|---|---|
| Datos (se generan, no se editan a mano) | `src/database/data/modelos_referencia/accesorios.php` ← `herramientas/generar_accesorios.py` |
| Esquema (qué puede tener cada ficha) | `App\Support\FichaTecnica\EsquemaAccesorio` |
| Textos de la ficha | `App\Support\FichaTecnica\TextosAccesorio` |
| Descripción de la publicación | `App\Support\FichaTecnica\ContenidoAccesorio` |
| Cómo se reconoce en el inventario | `ModeloReferencia::detectarAccesorio()` y `textoAccesorio()` |
| Publicación desde el inventario | `InventarioCatalogo::crear()` |
| Comparativas | `ComparadorModelosController::FAMILIAS` (`cargadores` y `vidrios`) |
| Campos e íconos de la ficha | `fichaTecnica.jsx` (grupo `producto_general`) e `Icons.jsx` |
| Ilustraciones | `Components/Store/AccesorioVisual.jsx` |

**Cada ficha es un tipo de accesorio, no una unidad.** Todos los «CUBO 20 W ORIGINAL» usan la ficha del adaptador de
20 W de Apple, y todas las fundas de silicona, la de la funda de silicona. Lo que cambia de un artículo a otro sale del
nombre del inventario: en los textos, `{modelo}` pasa a ser el equipo que dice ese nombre («iPhone 12 y iPhone 12 Pro»,
«Apple Watch de 41 mm», «MacBook Pro de 16 pulgadas») o, si no dice ninguno, lo que indica la ficha («tu iPhone»).

**Cómo se reconoce.** El nombre se pasa a minúsculas, sin tildes y con las unidades pegadas («CUBO 20 W ORIGINAL» →
«cubo 20w original»), y se prueba contra las expresiones `sistema.detectar` de cada ficha, en el orden del archivo (de
lo más específico a lo más general). Gana la primera que coincide y no cae en `sistema.excluir`. Así:

- «CUBO 20 W ORIGINAL» toma el adaptador de Apple, pero «CUBO 20W Calidad Origen» y «CUBO 35 W CALIDAD ORIGINAL» no:
  «calidad original» u «origen» no es un original de Apple.
- «VIDRIO TEMPLADO CAMARA IP 11 PRO» es un protector de cámara, no un vidrio de pantalla.
- «PROTECTOR CUBO 20W + PROTECTOR CABLE» es un protector, no un cargador.
- Un cable cargado en el inventario como «cargador 20 W» sale como cable, con su categoría y su tipo.

**Qué lleva la publicación.** `InventarioCatalogo::crear()` copia la ficha (sin los datos que son solo para comparar:
`normas` y `pruebas`), arma el resumen, la descripción (HTML con párrafos y viñetas, solo `<p>`, `<ul>` y `<li>`) y
«Qué incluye», pone la categoría de la ficha («Cargador», «Vidrio templado», «Cable»…) y vincula la publicación con la
ficha (`modelo_referencia_id`). Nunca se copia costo, procedencia ni proveedor.

**En el panel.**

- *Agregar productos a la tienda*: cada accesorio dice con qué ficha se va a publicar («Ficha: Funda de silicona para
  iPhone») o «Sin ficha». La búsqueda también encuentra por ficha: «certificado», «gorilla», «silicona».
- *Editar publicación*: «Llenar desde modelo» completa la ficha y, en los accesorios, el resumen, la descripción y «Qué
  incluye» si están vacíos. El editor muestra los campos de la familia del accesorio (un cargador no ve «Dureza»).
- *Modelos y fotos*: los accesorios aparecen agrupados por familia, con su foto opcional para la comparativa.

**En la tienda.** La ficha del producto muestra «Lo más importante» (potencia y carga rápida en un cargador; material y
protección en un vidrio; sonido y hub en una Alexa), los datos clave junto al botón de compra, la descripción, «Qué
incluye», la compatibilidad y, en cargadores y vidrios, la invitación a comparar («¿Original o certificado?»).

## Reglas del contenido

- **Originales de marca**: primero la página oficial (Apple, Amazon, Sony, Spigen, Rapoo, Satechi). Lo que la marca no
  publica sale de otras fuentes y queda como «verificar» en `pendientes` (se lista con `php artisan modelos:pendientes`).
- **Genéricos** (fundas, vidrios, cubos certificados, cables y accesorios sin marca): descripción genérica, solo lo que
  el producto es por definición o lo que dice su nombre. Nada de durezas, normas, garantías ni «calidad original».
- **Posibles réplicas**: «Galaxy Buds2 Pro» (Bs 280) y los «Mando Dualshock 4» (Bs 350) cuestan mucho menos que el
  original. Llevan descripción genérica, sin los datos de Samsung ni de Sony, hasta que se confirme que son originales.
- Nada de afirmaciones que no se puedan comprobar: el certificado dice «Otra marca (no es de Apple)» y la comparativa
  muestra «No lo informa» donde el fabricante no publica el dato.

## Fichas por familia

| Familia | Fichas | Se reconocen en el inventario (ejemplos) |
|---|---|---|
| Cargadores (8) | Adaptador USB‑C de 20 W de Apple · Adaptador dinámico de 40 W de Apple · Cargador USB‑C de 20 W certificado · Cargador USB‑C de 25 W certificado · Cargador de pared de 35 W · Cargador Gerlax de 45 W · Cargador USB de 5 W · Cargador de pared con pantalla LED | CUBO 20 W ORIGINAL (186 u.) · CUBO 40 W ORIGINAL (54) · CUBO CERTIFICADO APPLE 20 W POWER ADAPTER · CUBO 20W Calidad Origen · CUBO 5W USB POWE ADAPTER |
| Vidrios (6) | Gorilla Glass · Spigen Glas.tR EZ Fit · Antiespía · Mate antirreflejo · Filtro de luz azul · Tradicional | VIDRIO TEMPLADO (43) · Vidrio Templado IP 12/12PRO · VIDRIO TEMPLADO ANTIESPIA · Vidrio Templado Anti-Glare… · GLASS TR EZ FIT |
| Protectores (4) | Protector de cámara · Protector de pantalla para Apple Watch · para iPad · para MacBook | VIDRIO CAMARA 14 PRO MAX · Vidrio Protecto IWach for 41 mm · VIDRIO IPAD · VIDRIO MACBOOK |
| Fundas (7) | Silicona · MagSafe · Con diseño · iPad · iPad Pro con teclado · MacBook · AirPods | FUNDA SILICONA IP 15 PRO · FUNDA MAGSAFE IP 14 PRO MAX · Funda de Diseño IP 14 PRO MAX · Fundas Airpods |
| Cables (5) | USB‑C a Lightning (1 m) · Lightning a USB · USB‑C a USB‑C (1 m) · Adaptador de Lightning a 3,5 mm · Cable de carga rápida | Cable USB C - to Lightning 1m · CABLE C A C 1 METRO · Lighning to Headphone Jack |
| Accesorios (28) | Echo Dot Max · Echo Dot · Echo Auto · Fire TV Stick 4K Select · DualSense · Control para PS4 · Astro Bot · Gran Turismo · Gamefitz 10 en 1 · Rapoo Ralemo Pre 5 · Satechi OntheGo · teclados · baterías externas · cargador inalámbrico magnético · cargador y soporte para auto · protector de cubo · correas de Apple Watch · micrófono · parlante RGB · llavero ACEFAST · audífonos · juguetes Cars | ALEXA ECHO DOT MAX · FIRE TV STICK 4K SELECT · PLAYSTATION PS5 BLACK CONTROLLER · ASTRO BOT · SATECHI ONTHEGO MOUSE · PARLANTE SQUISHY RGB |

La lista completa, con sus expresiones de detección y fuentes, está en `generar_accesorios.py`.

## Comparativa de cargadores (/comparar/cargadores)

Entra con el **original de 20 W**, el **certificado de 20 W** y el **original de 40 W**. Lo esencial arriba: fabricante,
potencia (con la máxima), carga rápida y conector. Después, por secciones:

| Dato | Adaptador USB‑C de 20 W de Apple | Cargador USB‑C de 20 W certificado | Adaptador dinámico de 40 W de Apple |
|---|---|---|---|
| Fabricante | Apple (original) | Otra marca (no es de Apple) | Apple (original) · modelo A3351 |
| Potencia | 20 W | 20 W | 40 W, hasta 60 W por momentos |
| Carga rápida | Hasta 50 % en unos 35 min (iPhone 8 o posterior) | Carga rápida por USB‑C para iPhone 8 o posterior | Hasta 50 % en 20 min (iPhone 17), en unos 15 min (iPhone 18 Pro) |
| Salidas | 5 V ⎓ 3 A · 9 V ⎓ 2,22 A | No lo informa | 5 V ⎓ 3 A · 9 V ⎓ 3 A · 9–15 V ⎓ 2,67 A · 15–20 V ⎓ 2 A (AVS) |
| Tecnología de carga | USB Power Delivery | No lo informa | USB Power Delivery con AVS |
| Corriente | 100 a 240 V (sirve con 220 V) | No lo informa | 100 a 240 V (sirve con 220 V) |
| Cable | Se vende por separado | No lo informa | Por separado; para la carga más rápida, uno de 60 W |
| Normas de seguridad | Certificado para las normas de los países donde Apple lo vende | Apple pide que los de otras marcas cumplan normas como IEC 62368‑1 | Igual que el de 20 W |
| Pruebas independientes | Eficiencia de 85,5 % a 89,7 % y hasta 49,5 °C con 220 V (ChargerLAB) | Sin pruebas publicadas | Cargó una MacBook Air a casi 56 W (ChargerLAB) |

- Los tiempos de carga son los de Apple (página de cada adaptador en apple.com, EE. UU.). La página del de 20 W dice
  «unos 35 minutos»; el soporte de Apple dice «unos 30 minutos» para iPhone 15 o posterior con 18 W o más. Vale la del
  producto.
- Las salidas y las pruebas no las publica Apple: salen de ChargerLAB (versiones A2940 y A3365) y quedan «verificar»
  hasta confirmarlas con la etiqueta de las unidades.
- El certificado no lleva datos que no se puedan comprobar: la comparativa dice «No lo informa».

## Comparativa de vidrios (/comparar/vidrios)

Entra con el **Gorilla Glass** y el **tradicional**:

| Dato | Vidrio templado Gorilla Glass | Vidrio templado tradicional |
|---|---|---|
| Material | Vidrio de aluminosilicato Corning Gorilla Glass | Vidrio templado común |
| Cómo se endurece | Por intercambio iónico: un baño de sales de potasio caliente deja la superficie en compresión | Templado: calor y enfriado rápido, o un tratamiento químico, que dejan la superficie en compresión |
| Protección | Diseñado por Corning para resistir mejor los rayones y los golpes que el vidrio común | Protege la pantalla de rayones y golpes del día a día |
| Filtro | Sin filtro | Sin filtro |

**En el inventario no hay ningún vidrio con «Gorilla» en el nombre**, así que la ficha del Gorilla Glass está lista pero
sin artículos vinculados («Sin stock ahora» en la comparativa). El tradicional reúne los «VIDRIO TEMPLADO» y los
«Vidrio Templado IP …» (de GZ STORES, CARLOS EEUU y MIGUEL CHAVEZ).

## Pendientes de la base

`php artisan modelos:pendientes` los lista con su fuente. De los accesorios:

- **Verificar** (cargado, de una fuente que no es la marca): salidas de los adaptadores de 20 W y 40 W; Wi‑Fi,
  Bluetooth, medidas y peso del Echo Dot Max; el control del Fire TV Stick 4K Select.
- **Falta** (el nombre del inventario no lo dice): conectores del cargador de 35 W, del Gerlax de 45 W y del cable de
  carga rápida; potencia del cargador con pantalla LED; para qué iPhone es el Spigen EZ Fit; para qué iPad y qué
  MacBook son los vidrios y las fundas; generación del Echo Dot y del Echo Auto; si los Dualshock 4 son de Sony; edición
  de Gran Turismo; contenido del pack Gamefitz; capacidad del power bank; conexión del parlante RGB y de los audífonos
  Core Headset; modelo del llavero ACEFAST; contenido del set de Cars.

## Revisar en el inventario

- **Gorilla Glass**: si los «VIDRIO TEMPLADO» de FJ IMPORTACIONES (Bs 250, 4 unidades) o el «VIDRIO TEMPLADO ANTIESPIA»
  (Bs 270) son Gorilla Glass, hay que agregar «GORILLA» a su nombre en el inventario; así se vinculan solos a su ficha.
  Hoy el de Bs 250 se reconoce como tradicional porque su nombre es igual al de GZ STORES.
- **Sin ficha** (no hay datos que se puedan comprobar): «Rayban Wayfarer» (Bs 3.000: ¿son los Ray‑Ban Meta?),
  «ULTRA 2 IVV9» y «VV9 PRO + Watch». Se publican solo con el nombre hasta tener la marca y el modelo.
- **Nombres que dicen Apple sin serlo**: «CUBO CERTIFICADO APPLE 20 W / 25 W POWER ADAPTER». La ficha aclara que son de
  otra marca, pero el título de la publicación sale del inventario.
- **«CUBO 20W Calidad Origen»** se trata como certificado (misma ficha genérica).
- **El teclado Rapoo** figura en el inventario como funda; la ficha lo reconoce por el nombre.

## Cómo agregar o corregir un accesorio

1. Editar `herramientas/generar_accesorios.py`: agregar la ficha en su lista (CARGADORES, VIDRIOS, PROTECTORES,
   FUNDAS, CABLES o ACCESORIOS) con `detectar`, la ficha, el contenido y su fuente en `FUENTES`. Lo específico va antes
   que lo general.
2. `python3 herramientas/generar_accesorios.py` y `php artisan modelos:verificar`.
3. `php artisan db:seed --class=ModelosReferenciaSeeder` (no toca las fotos ni borra nada).
4. `php artisan modelos:pendientes --markdown > ../docs/admin-ui/modelos-referencia-pendientes.md` (desde el host,
   con la salida redirigida desde `src/`).

Las publicaciones que ya existen conservan su copia: «Llenar desde modelo» completa lo que falte.

## Arreglos de paso

- La ficha pública de un producto con compatibilidades (fundas y vidrios) fallaba al abrirse: cada modelo compatible
  llega como objeto `{ id, name, slug }` y se mostraba el objeto (error de React #31). No se había visto porque todavía
  no había accesorios publicados.
- Las ilustraciones de «Más Apple» y de accesorios sin foto no se usaban: las claves decían `producto-apple` y
  `producto-general` en vez del tipo real (`producto_apple`, `producto_general`).

## Fuentes

- Apple: [20W USB‑C Power Adapter](https://www.apple.com/shop/product/mwvv3am/a/20w-usb-c-power-adapter) ·
  [40W Dynamic Power Adapter with 60W Max](https://www.apple.com/shop/product/mgkn4am/a/40w-dynamic-power-adapter-with-60w-max) ·
  [Fast charge your iPhone](https://support.apple.com/en-us/102574) ·
  [About Apple USB power adapters](https://support.apple.com/en-us/120548) ·
  [How to wirelessly charge your iPhone](https://support.apple.com/en-us/108377) ·
  [About iPhone charge speeds](https://support.apple.com/en-us/120619)
- ChargerLAB: [Apple 20W (A2940)](https://www.chargerlab.com/review-of-new-apple-20w-charger-for-iphone-15-a2940) ·
  [Apple 40W Dynamic (A3365)](https://www.chargerlab.com/teardown-of-apple-40w-dynamic-power-adapter-with-60w-max-a3365) ·
  MacRumors: [el cargador de 40 a 60 W](https://www.macrumors.com/2025/09/17/apple-40w-to-60w-charger-key-advantage/)
- Vidrios: Wikipedia [Gorilla Glass](https://en.wikipedia.org/wiki/Gorilla_Glass) y
  [Tempered glass](https://en.wikipedia.org/wiki/Tempered_glass) ·
  [9to5Mac: OtterBox y Corning](https://9to5mac.com/2019/01/08/otterbox-gorilla-glass-screen-protector/) ·
  [Digital Trends: Amplify](https://www.digitaltrends.com/phones/otterbox-corning-partnership-amplify-screen-protector/) ·
  [Spigen GLAS.tR EZ Fit](https://www.spigen.com/products/iphone-13-series-screen-protector-glas-tr-ez-fit)
- Amazon: [Echo Dot Max y Echo Studio](https://www.aboutamazon.com/news/devices/amazon-new-echo-devices-alexa-plus) ·
  [nota de prensa (India)](https://press.aboutamazon.com/in/2026/6/amazon-launches-echo-dot-max-and-echo-studio-featuring-premium-audio-and-new-modern-design) ·
  [SoundGuys](https://www.soundguys.com/amazon-echo-dot-max-review-bigger-dot-better-hub-152545/) ·
  [Tom's Guide](https://www.tomsguide.com/audio/smart-speakers/amazon-echo-dot-max-review) ·
  [Matter Alpha](https://www.matteralpha.com/amazon/echo-dot-max-p3468) ·
  [Fire TV: especificaciones para desarrolladores](https://developer.amazon.com/docs/device-specs/device-specifications-comparison-table.html) ·
  [Tom's Guide: Fire TV Stick 4K Select](https://www.tomsguide.com/tvs/amazon-fire-tv-stick-4k-select-streaming-stick-review) ·
  [CNX Software: Vega OS](https://www.cnx-software.com/2025/10/03/linux-based-vega-os-replaces-android-based-fire-os-in-amazon-fire-tv-stick-4k-select/) ·
  [TechCrunch: Echo Auto (2.ª gen.)](https://techcrunch.com/2022/09/28/amazons-second-gen-echo-auto-get-smaller-and-adds-roadside-assistance/)
- PlayStation: [DualSense](https://www.playstation.com/en-us/accessories/dualsense-wireless-controller/) ·
  [DualSense (Japón)](https://www.playstation.com/ja-jp/accessories/dualsense-wireless-controller/) ·
  [Astro Bot](https://www.playstation.com/en-us/games/astro-bot/) · Wikipedia [Astro Bot](https://en.wikipedia.org/wiki/Astro_Bot)
- Otros: [Rapoo Ralemo Pre 5](https://www.rapoo-eu.com/product/ralemopre5/) ·
  [Satechi OntheGo Bluetooth Mouse](https://satechi.com/products/onthego-bluetooth-mouse/Z2lkOi8vc2hvcGlmeS9Qcm9kdWN0VmFyaWFudC80MzExODc5OTc0OTIwOA==)
