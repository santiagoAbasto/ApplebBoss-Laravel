# Alineación UI/UX del panel admin

> **Para retomar el trabajo en otra sesión o cuenta:** pegar [`prompt-retomar.md`](prompt-retomar.md) y leer primero [`TRASPASO.md`](TRASPASO.md) (reglas, estado, cómo agregar modelos y lo que sigue). La base de iPhone tiene solo 4 datos «falta»: la RAM y la batería del Duo, y la batería de las unidades solo eSIM del 18 Pro y el 18 Pro Max. Lo verificado y sus fuentes está en [`informes/verificacion-apple-2026-09-15.md`](informes/verificacion-apple-2026-09-15.md) y [`informes/ram-bateria-2026-09-15.md`](informes/ram-bateria-2026-09-15.md). Las reglas y decisiones del proyecto también están en memanto (agente `apple-boss`; ver «Memoria del proyecto»). La base de accesorios (58 fichas, con las comparativas de cargadores y de vidrios) está en [`informes/accesorios-2026-09-15.md`](informes/accesorios-2026-09-15.md).

Estado al 2026-09-16 (actualizado con la comparativa pública, el módulo «Modelos y fotos», el header de la tienda, la base de accesorios y **todos** los módulos de Tienda online, que quedaron alineados y cableados: «Categorías», «Colecciones», «Portada», «Menú», «Páginas», «Preguntas frecuentes», «Servicios», «Ubicaciones», «Novedades», «Trade-In» y «Configuración»). Línea visual única: `src/resources/js/Components/Admin/ui.jsx`.

## Estado por módulo

| Grupo | Módulo | Estado |
|---|---|---|
| Ventas y operación | Ventas, Reservas, Servicio técnico, Cotizaciones, Egresos, Reportes, Clientes | ✅ Alineado |
| Inventario | Celulares, Computadoras, Productos Apple, **Productos generales** | ✅ Alineado |
| Inventario | **Auditoría** | ✅ Alineado |
| Tienda online | **Productos en la tienda** (listado, agregar, editor) | ✅ Alineado |
| Tienda online | **Categorías** (los estantes de la tienda) | ✅ Alineado (2026-09-15) |
| Tienda online | **Colecciones** (vitrinas armadas a mano) | ✅ Alineado y cableado (2026-09-16) |
| Tienda online | **Portada** (el orden del inicio) | ✅ Alineado y cableado (2026-09-16) |
| Tienda online | **Menú** (los tres menús de la tienda) | ✅ Alineado y cableado (2026-09-16) |
| Tienda online | **Páginas** (Nosotros, Garantía, Envíos…) | ✅ Alineado y cableado (2026-09-16) |
| Tienda online | **Preguntas frecuentes** | ✅ Alineado y cableado (2026-09-16) |
| Tienda online | **Servicios** (las tarjetas de «Nuestros servicios») | ✅ Alineado y cableado (2026-09-16) |
| Tienda online | **Ubicaciones** (los locales: dirección, horario, contacto y mapa) | ✅ Alineado y cableado (2026-09-16) |
| Tienda online | **Modelos y fotos** (foto de cada modelo para la comparativa) | ✅ Nuevo (2026-09-15) |
| Tienda pública | **Comparativa de modelos** (`/comparar/iphone`, `/mac`, `/cargadores` y `/vidrios`), header y footer | ✅ iPhone, Mac, cargadores y vidrios templados |
| Tienda online | **Novedades** (publicaciones con fecha: /novedades y la sección del inicio) | ✅ Alineado y cableado (2026-09-16) |
| Tienda online | **Trade-In** (formulario público de cotización y seguimiento de solicitudes) | ✅ Alineado y cableado (2026-09-16) |
| Tienda online | **Configuración** (WhatsApp, nombre, frase del pie y barra de anuncio) | ✅ Alineado y cableado (2026-09-16) |
| Marketing y Google | **Campañas**, **Suscriptores** y **Ajustes del newsletter** | ✅ Alineado y cableado (2026-09-16) |
| Marketing y Google | **Google y redes sociales** | ✅ Alineado y cableado (2026-09-16) |
| Exportar datos | **Exportaciones** y **Exportador** | ✅ Alineado y cableado (2026-09-16) |
| Sistema | **Usuarios y roles** (con permisos por módulo) | ✅ Nuevo (2026-09-16) |
| Sistema | **Panel del vendedor** (`/vendedor`: Mi día, stock, ventas, reservas, cotizaciones, servicios y clientes) | ✅ Alineado y cableado (2026-09-16) |
| Tienda pública | **Botón de WhatsApp que flota** | ✅ Rediseñado (2026-09-16) |

## Patrón para módulos de inventario

Diagrama: [`diagramas/patron-inventario.html`](diagramas/patron-inventario.html)

- **Listado (Index):** PageHeader, 4 tarjetas Stat, avisos (sin condición / bajo el costo), barra de búsqueda y filtros, chips de estado, tabla en escritorio y tarjetas en móvil, selección múltiple para marcar condición y `Paginador`.
- **Formulario (Create/Edit):** `EncabezadoFormulario`, 3 StepCard (Producto → Identificación → Precio y estado) y resumen lateral fijo con la caja azul de precio. Create tiene «Guardar y registrar otro»; Edit suma historial, publicación en la tienda y eliminación protegida.
- **Frontend:** cada tipo aporta un módulo (`celulares.jsx`, `computadoras.jsx`, `productos-apple.jsx`, `productos-generales.jsx`) con `datosDesde`, `validar…`, `payloadDe`, `Campos…` y `Resumen…`. Lo común vive en `inventario.jsx`.
- **Backend:** el controlador usa el trait `EquipoDeInventario` (historial, publicación, bloqueo al eliminar, condición en lote, `return_to` seguro). Rutas extra: `…/condicion` (PATCH, antes del resource) y `…/{id}/habilitar`.

## Registro y edición

Diagrama: [`diagramas/registrar-producto.html`](diagramas/registrar-producto.html)

## Productos Apple (particularidades)

- Sirve para iPad, AirPods, Apple Watch, Pencil y accesorios. La capacidad y la batería son opcionales: si quedan vacías se guardan como `-`, igual que los registros anteriores.
- El IMEI solo se pide cuando «Tiene IMEI» está activado. Sin IMEI, se limpian `imei_1`, `imei_2` y `estado_imei`.
- `estado_imei` usa los valores del enum de la tabla (`Libre`, `Registro seguro`, …); en pantalla se muestran como «Libre», «Registrado», etc.
- La tabla `ventas` no tiene `producto_apple_id`. Por eso el trait acepta `'venta' => null` y el historial sale de `venta_items`, las permutas (`entregado_producto_apple_id`) y las reservas.
- Tests: `src/tests/Feature/ProductosAppleTest.php`.

## Productos generales (particularidades)

Diagrama: [`diagramas/codigo-en-serie.html`](diagramas/codigo-en-serie.html)

- Cada unidad es un registro con su propio **código** (hay unos 2.200). El código se guarda en mayúsculas, es único y se revisa en vivo (`verificar-codigo`, sin distinguir mayúsculas) y en el servidor.
- «Guardar y registrar otro» mantiene el tipo, el nombre, los precios y la procedencia, y propone el siguiente código (`siguienteCodigo`: FUNDACHAV_1 → FUNDACHAV_2, FUNDA-009 → FUNDA-010). Reemplaza el antiguo modal de «duplicar».
- Los tipos son fijos (`ProductoGeneralController::TIPOS`): funda, vidrio templado, vidrio de cámara, cargador 20W o 5W, accesorio y otro. Un producto que llegó en permuta conserva su tipo `permuta` al editarlo.
- En el listado se filtra por tipo y, con un tipo elegido, se exporta el PDF de ese tipo.
- La condición viene como Nuevo por defecto. La selección múltiple para cambiarla existe (`productos-generales/condicion`), pero no se aplicó en masa.
- La tabla `ventas` sí tiene `producto_general_id`, así que el trait se usa completo.
- Tests: `src/tests/Feature/ProductosGeneralesTest.php`.

## Auditoría de inventario (particularidades)

Diagrama: [`diagramas/auditoria-item.html`](diagramas/auditoria-item.html)

- Pantalla única (`InventoryAudits/Index.jsx`): PageHeader con acciones según el estado, 4 tarjetas Stat, panel azul de escaneo con barra de progreso, aviso del último escaneo, búsqueda + categoría + chips de situación, tabla en escritorio y tarjetas en móvil, `Paginador` e historial.
- Situaciones de cada producto: Encontrado, Por escanear (abierta) o Faltante (cerrada), Vendido durante la auditoría e Ingreso posterior.
- Iniciar y finalizar se confirman con `Modal` (antes era `window.confirm`).
- La lógica del backend no cambió: foto de lo disponible al iniciar, escaneo tolerante (S inicial, IMEI o serie corregidos, prefijo único), ingresos posteriores aparte y PDF en caché.
- Corrección: el historial contaba los vendidos durante la auditoría como faltantes. Ahora los muestra en su propia columna.
- Tests: `src/tests/Feature/InventoryAuditTest.php` (10, sin cambios).

## Productos en la tienda (catálogo)

Diagrama: [`diagramas/tienda-publicacion.html`](diagramas/tienda-publicacion.html)

Piezas comunes en `Components/Admin/catalogo.jsx`: categorías, condiciones de la tienda (Nuevo, Seminuevo, Open Box, Reacondicionado), estado de la publicación, `TarjetaTienda`, `faltantesDe`, `slugDe`, `fechaParaCampo` y enlaces al inventario y a la tienda.

- **Listado** (`/admin/catalogo`): PageHeader, 4 Stat (en la tienda, borradores, sin foto, por agregar), aviso de pendientes, búsqueda que se aplica sola, filtro por categoría (antes el servidor lo aceptaba pero la pantalla no lo ofrecía), chips con conteo, tabla y tarjetas en móvil, `Switch` de destacado y `Paginador` con 30, 60 o 100 filas.
- **Agregar** (`/admin/catalogo/importar`): una sola pantalla con 3 StepCard (elegir, condición, visibilidad) y un resumen fijo al costado con el total y el botón. Reemplaza el asistente que ocultaba cada paso.
- **Editor** (`/admin/catalogo/{id}/editar`): 7 StepCard (Producto, Fotos, Descripción, Ficha técnica, Precio y promoción, Compatibilidad, Google) con una barra de secciones fija. Al costado van la vista previa de la tarjeta, el checklist en vivo de lo que falta, los interruptores «En la tienda» y «Destacado», las fechas, el guardado y los datos del inventario.

**Correcciones y mejoras**
- Las fechas (promoción y publicación) no se veían en el formulario: el servidor las manda en ISO y el campo `datetime-local` las dejaba vacías. Ahora se convierten con `fechaParaCampo`.
- MYSKIN con otra categoría desde el editor devuelve un error en el formulario, no una página de error. Al crear por POST sigue respondiendo 422, como exige `PublicCatalogPrivacyTest`.
- El mensaje de «falta información para publicar» ahora es legible.
- Fotos: subida múltiple en paralelo con errores por archivo, flechas para ordenar (además de arrastrar) y confirmación con `Modal`. Los `window.confirm` y `fetch` manuales se reemplazaron por `Modal` y `axios`.
- Compatibilidad: guarda aparte, avisa si hay cambios y se muestra de entrada solo en fundas y accesorios.
- «Posición» solo aparece si está destacado. El enlace a la tienda usa `route('store.product')`.
- Tests nuevos: `src/tests/Feature/CatalogoAdminTest.php` (filas por página, MYSKIN, faltantes, promoción y fechas).

## Ficha técnica y batería

Diagrama: [`diagramas/ficha-tecnica.html`](diagramas/ficha-tecnica.html)

- La configuración está en `resources/js/Components/Store/fichaTecnica.jsx` y la usan el editor del admin y la ficha pública. Tiene grupos por tipo de inventario (pantalla, rendimiento, cámaras, batería y carga, conectividad, diseño, sistema; en accesorios: compatibilidad, material y funciones). Cada característica trae su **ícono SVG propio**, un ejemplo para el admin y una descripción corta para el cliente.
- **Editor** (sección 4, «Ficha técnica»): campos agrupados con su ícono. Se guarda en `atributos` de la publicación.
- **Ficha pública**: hasta 6 tarjetas destacadas (degradado azul marino, ícono, valor y descripción; la batería se dibuja con su nivel y una barra de color) y, abajo, tarjetas por grupo con cada característica y su ícono. `Compare.jsx` también compara pantalla y cámara.
- Se agregaron 27 íconos a `Components/Store/Icons.jsx` (Cpu, HardDrive, Camera, Display, Resolution, Refresh, Aperture, Telephoto, Selfie, Video, Wifi, Bluetooth, SimCard, Droplet, Scale, Plug, Fingerprint, Ruler, Layers, Keyboard, Magnet, Cable, Brush, Collection, Noise, Grid, Gpu, entre otros).

**Batería (corrección)**
- El problema: la salud de batería se copiaba una sola vez al crear la publicación y solo si el inventario tenía un número exacto. «100 SELLADO», «86 %» o «95 - 308 CICLOS» quedaban vacíos, y las publicaciones anteriores no la tenían, así que la API y la ficha no mostraban el porcentaje.
- Ahora: `CatalogoPublicacion::bateriaDe()` interpreta el texto del inventario (salud, ciclos y sellado) y `atributosPublicos()` lo toma **en vivo**, así que un cambio en el inventario se ve de inmediato en la tienda y en la API. Si el inventario no tiene un porcentaje claro, vale el que se escribe a mano en la ficha técnica (el editor habilita ese campo solo en ese caso).
- La API (`/api/v1/products` y el detalle) devuelve `atributos.salud_bateria`, `ciclos_bateria` y `bateria_sellada`; el detalle suma `bateria: {salud, ciclos, sellado}`. El IMEI, el costo y la procedencia siguen filtrados.
- Tests: `src/tests/Feature/FichaTecnicaBateriaTest.php` (6 casos).

**Campos vacíos (revisado el 2026-09-15 con el iPhone 14 Plus)**
- **Lo que el modelo no tiene** (teleobjetivo, escáner LiDAR, Thread, Botón Acción, Control de Cámara…) no se copia a la publicación y la tienda no lo muestra; la comparativa sí lo muestra como «No tiene». En el editor, con un modelo vinculado, esos campos ya no aparecen en blanco: se resumen al pie de su grupo («El iPhone 14 Plus no tiene: Teleobjetivo, Escáner LiDAR…») con «Completar a mano» por si hace falta escribirlos. La lista es `NO_TIENE` de `comparativa.jsx`.
- **Apple Intelligence** es la excepción, porque el cliente lo pregunta aunque la respuesta sea no: `ModeloReferencia::fichaParaPublicacion()` copia «No compatible» a los modelos que no lo soportan (del X al 15 Plus) y la ficha pública lo muestra en gris con un guion, como la comparativa. Los `specs` de la comparativa no cambian (vacío = «No compatible»). A la publicación del 14 Plus se le cargó ese campo con tinker.
- **Memoria RAM y capacidad de batería**: Apple no las publica (las 13 páginas oficiales pegadas no las mencionan). Por decisión del usuario, se cargaron con fuentes externas que coinciden: gsmarena.com y Wikipedia, y una tercera fuente donde no coincidían. Resultado: 37 de 38 modelos de cada una; el Duo y la batería solo eSIM del 18 Pro y el 18 Pro Max quedan pendientes. Informe con cada valor y su fuente: [`informes/ram-bateria-2026-09-15.md`](informes/ram-bateria-2026-09-15.md). La ficha las muestra en Rendimiento («Memoria RAM») y en Batería y carga («Capacidad de batería», con su ícono propio), y el texto de ayuda aclara que Apple no las publica.
- **Sistema operativo** (versión instalada): es de cada equipo, no del modelo, y el inventario no la guarda. El editor indica dónde verla (Ajustes > General > Información).
- Si la base suma datos después de llenar una ficha, el editor avisa bajo «Modelo de referencia» cuántos faltan copiar; «Llenar desde modelo» completa solo los vacíos.
- Test: `ModelosReferenciaTest::test_la_ficha_dice_si_es_compatible_con_apple_intelligence_y_omite_lo_que_no_tiene`.

## Modelos de referencia (fichas por modelo)

Diagrama: [`diagramas/modelos-referencia.html`](diagramas/modelos-referencia.html)

- **Tabla `modelos_referencia`**: tipo (celular, computadora, producto_apple), familia, nombre, slug, año, `alias` (otras formas de escribir el modelo), `specs` (claves de la ficha técnica) y `autonomia_video_horas` (de un equipo nuevo). Las publicaciones guardan `modelo_referencia_id`.
- **Datos** (`src/database/data/modelos_referencia/iphone.php`; las Mac, en `computadora.php`), una sola fuente por modelo en `datos`: números, sí/no y `false` cuando el modelo **no tiene** algo (teleobjetivo, LiDAR, 5G…). `null` solo cuando Apple no publica el dato (horas de streaming de modelos antiguos) o en los campos declarados en `pendientes`. Cada modelo documenta en `pendientes` lo que falta y lo que está por verificar (ver «Pendientes»). Los precios no van aquí: salen del inventario.
- **Esquema y validación** (`App\Support\FichaTecnica\EsquemaCelular`): cerca de 100 campos obligatorios (pantalla, rendimiento, cámaras, video, frontal, batería, conectividad, seguridad, diseño y sistema), con tipos, rangos (detecta errores de tipeo como 1640 g), valores permitidos, claves desconocidas y contradicciones (zoom mayor a 1x sin teleobjetivo, salvo el 2x de un sensor de 48 MP; núcleos de CPU que no suman; ProMotion con menos de 120 Hz; pantalla siempre activa sin ProMotion; brillo en exteriores menor al típico; niveles de zoom que no incluyen 1x o no coinciden con el mínimo y el máximo; USB 3 sin conector USB-C; carga rápida con MagSafe sin MagSafe; cámara Fusion con menos de 48 MP; estabilización del teleobjetivo sin teleobjetivo; ultra gran angular o teleobjetivo Fusion con menos de 48 MP; carga rápida con MagSafe sin su tiempo o sin su adaptador; plegable sin pantalla exterior o sin medidas abierto, y pantalla exterior o autonomía en ella en un equipo que no es plegable; estructura, frente y conector fuera de los valores conocidos). Solo `ios_maximo` y `numeros_modelo` pueden quedar pendientes de fuente.
- **Textos generados** (`TextosCelular`): la ficha de la tienda se arma a partir de `datos`, así nunca se contradicen. Lo que el modelo no tiene no aparece en la ficha; la comparativa sí lo muestra como «no tiene».
- **Comandos**: `php artisan modelos:verificar` (tabla de completas, datos que faltan y por verificar; falla si hay errores), `php artisan modelos:pendientes` (detalle con la fuente de cada pendiente; `--markdown` genera la documentación) y `php artisan db:seed --class=ModelosReferenciaSeeder` (no carga nada si una ficha está incompleta; actualiza por slug, no duplica).
- **Herramientas** (`src/database/data/modelos_referencia/herramientas/`): `generar_iphone.py` arma `iphone.php` (cada generación hereda de la anterior con `mezclar()`; los campos nuevos se agregan en la base del iPhone X como «no tiene») y `auditar_iphone.py pagina.txt "iPhone 16" …` lista los valores que no aparecen en la página de Apple pegada, para anotarlos como pendientes. `extraer_paginas.py carpeta` recupera de las transcripciones de Claude Code las páginas pegadas en conversaciones anteriores (hoy 13, del X al Duo; si un mensaje trae varias páginas, las separa), para volver a auditarlas.
- **Hoy** (38 modelos, todos completos: la lista actual de Apple desde el X): iPhone X, XR, XS, XS Max, 11, 11 Pro, 11 Pro Max, SE (2.ª y 3.ª generación), 12, 12 mini, 12 Pro, 12 Pro Max, 13, 13 mini, 13 Pro, 13 Pro Max, 14, 14 Plus, 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max, 16, 16 Plus, 16 Pro, 16 Pro Max, 16e, 17, Air, 17e, 17 Pro, 17 Pro Max, 18 Pro, 18 Pro Max y Duo. Cada generación suma sus funciones al esquema y los modelos anteriores figuran con «no tiene»: Estilos Fotográficos y Modo Cine (13), fotografía y video macro, ProRes y ProMotion (13 Pro), Photonic Engine, Modo Acción, SOS vía satélite y detección de accidentes (14); Dynamic Island, pantalla siempre activa, brillo en exteriores y cámara principal de 48 MP con fotos en superalta resolución (14 Pro); USB-C (15); titanio, Botón Acción, USB 3, trazado de rayos, Apple Intelligence, fotos y video espaciales, Apple Log, ACES, Thread y Wi‑Fi 6E (15 Pro); A18, Control de Cámara, cámara Fusion, Estilos Fotográficos 2, MagSafe de 25 W con carga rápida, brillo mínimo de 1 nit, Wi‑Fi 7, audio espacial, reducción de ruido del viento y Mezcla de Audio (16, 16 Plus y 16e; el 16e tiene una sola cámara y no tiene Dynamic Island, MagSafe ni banda ultraancha); ultra gran angular de 48 MP, teleobjetivo 5x con estabilización 3D, video 4K a 120 fps, ProRes a 120 fps y cuatro micrófonos con calidad de estudio (16 Pro); A19 y A19 Pro con GPU con Neural Accelerators, frente Ceramic Shield 2, cámara frontal Center Stage de 18 MP con Encuadre Centrado y video ultraestabilizado, Captura Dual, Bluetooth 6 y 3.000 nits en exteriores (17, Air y 17e). El 17 suma ProMotion, pantalla siempre activa, ultra gran angular Fusion de 48 MP y carga del 50 % en 20 min con 40 W. El Air es de titanio, mide 5,64 mm, tiene una sola cámara, dorso Ceramic Shield y solo eSIM. El 17e mantiene una sola cámara y no tiene Dynamic Island ni banda ultraancha, pero suma MagSafe de 15 W. El 17 Pro y el 17 Pro Max pasan a unibody de aluminio con dorso Ceramic Shield, teleobjetivo Fusion de 48 MP (zoom hasta 8x), ProRes RAW, Apple Log 2 y Genlock. El 18 Pro y el 18 Pro Max suman el A20 Pro con supernúcleos y doble Neural Engine, apertura variable, Controles Pro, Estilos Fotográficos 3, enfoque con seguimiento inteligente, efectos del modo Cine, mejores videos con poca luz, time-lapse estabilizado y carga del 50 % en unos 15 min con 60 W (fuente de voltaje ajustable).
- **Plegable (iPhone Duo)**: `pantalla.plegable`, la pantalla exterior (`exterior_pulgadas`, `exterior_px_largo`, `exterior_px_corto`, `exterior_ppi`), las medidas abierto (`diseno.abierto_ancho_mm`, `abierto_grosor_mm`), `bateria.doble` y la autonomía en la pantalla exterior (`video_exterior_h`, `streaming_exterior_h`); en los demás modelos van en `false`. Lo propio del Duo (Captura Inteligente, Duo Preview, Animación Infantil) va en `camaras.otras_funciones` y `frontal.otras_funciones`, y la cámara FaceTime bajo la pantalla, en `frontal.bajo_pantalla`. La autonomía estimada de un seminuevo usa la de la pantalla interior (la más baja). `video.apple_log` guarda la versión («Apple Log» o «Apple Log 2»).
- **Carga rápida con MagSafe**: `bateria.carga_rapida_magsafe` guarda su propio tiempo, además del adaptador (`carga_rapida_magsafe_w`). En la generación 16 es el mismo que por cable (la página lo dice en una sola fila). En el 17 es distinto: 50 % en 20 min por cable con 40 W y en 30 min con MagSafe y 30 W. La ficha lo escribe así.
- **Zoom**: `camaras.zoom_opciones` guarda los niveles que publica Apple (por ejemplo 0,5x, 1x, 2x y 3x en el 14 Pro, donde el 2x sale del sensor de 48 MP) y la ficha los muestra así, en vez de un rango.
- **Pendientes** ([`modelos-referencia-pendientes.md`](modelos-referencia-pendientes.md), generado con `php artisan modelos:pendientes --markdown`): cada pendiente indica el campo, si **falta** (vacío hasta conseguir la fuente: último iOS y números de modelo) o está **por verificar** (cargado y visible, pero no sale de la página oficial pegada), qué hay que confirmar y en qué página de Apple buscarlo. Por verificar hoy: iOS con el que salió, último iOS del X, XR y XS, chip U1, carga Qi de 7,5 W, material del dorso, grosor exacto (13, 14 Pro, 15 Pro, 16 Pro, 17, Air y 17 Pro), el 2x (y el 8x de los Pro con teleobjetivo de 48 MP) de los modelos con cámara de 48 MP, SOS vía satélite en Bolivia, los 256 GB del 11 y el SE (2.ª generación), la carga rápida con MagSafe del Air y el frente Ceramic Shield 2 del 17 Pro y el 17 Pro Max (en los dos casos la comparación se contradice) y el Apple Pencil del Duo (la página dice «Disponible este año»). El esquema rechaza pendientes sin detalle o fuente, repetidos, de campos que no existen, un «falta» con valor o un «por verificar» vacío. Se cierran todos juntos al final, buscando en internet en las fuentes oficiales. El 2026-09-15 se contrastó el informe con las páginas oficiales de Apple y una segunda ronda (Apple EE. UU., fichas de Apple por país y fuentes externas) cerró los últimos ([`informes/verificacion-apple-2026-09-15.md`](informes/verificacion-apple-2026-09-15.md)). Ese mismo día se sumaron la RAM y la capacidad de batería (`rendimiento.ram_gb`, `bateria.capacidad_mah` y `bateria.capacidad_mah_solo_esim`), con fuentes externas porque Apple no las publica. Quedan 4 pendientes, todos «falta»: la RAM y la batería del Duo, y la batería de las unidades solo eSIM del 18 Pro y el 18 Pro Max ([`informes/ram-bateria-2026-09-15.md`](informes/ram-bateria-2026-09-15.md)).
- **SIM, 5G mmWave y SOS vía satélite** (decisiones del 2026-09-15): la SIM avisa qué unidades son solo eSIM según el país de venta (`conectividad.solo_esim_en`; fuente: support.apple.com/es-es/108044), sin usar la procedencia del equipo. La red móvil avisa «las unidades de EE. UU. también admiten 5G mmWave» (`conectividad.mmwave_en`): del 12 al 18 Pro y el Duo, salvo el SE (3.ª generación), el 16e, el Air y el 17e, que no tienen mmWave ni en EE. UU. (fichas técnicas de Apple EE. UU.; en Bolivia no hay redes mmWave). La SOS vía satélite se muestra como «no disponible en Bolivia» (support.apple.com/es-es/101573).
- **Íconos de la ficha del celular** (2026-09-15):
  - **Un SVG propio por característica.** Se sumaron 17 íconos: Pixels, ScreenSize, Sun, Contrast, Haptic, Memory, NeuralEngine, Lens, PhotoMagic, SelfieVideo, Contactless, Precision, FaceId, Cube, SoftwareUpdate, Flag y el nuevo Telephoto.
  - **Dos íconos cambian según el modelo o se reutilizan:** «Desbloqueo» muestra la huella en los modelos con Touch ID, y el zoom óptico usa ZoomIn.
  - **Campo nuevo «Última versión de iOS»:** sale de `sistema.ios_maximo`.
  - **Test** `tests/Feature/FichaTecnicaIconosTest.php`: falla si un dato de la base no tiene campo en la ficha o si dos características comparten ícono.
  - **Revisión visual:** se hizo con una vista previa estática (esbuild + `renderToStaticMarkup`) de la galería y de la ficha del 17 Pro, SE 3, Duo y 11.
- **Detección** (`ModeloReferencia::detectar`): compara el nombre del inventario completo y normalizado (sin capacidad ni mayúsculas; «IP» = iPhone). «IPHONE XS» no se confunde con «IPHONE XS MAX».
- **Al publicar** (`InventarioCatalogo::crear`): la ficha del modelo más los datos del equipo real (capacidad, color, batería), que siempre mandan. `capacidades_disponibles` y `colores_disponibles` quedan solo para la comparativa.
- **Editor**: arriba de la ficha técnica hay un selector «Modelo de referencia» (sugerido por el nombre del inventario) y el botón «Llenar desde modelo», que completa solo los campos vacíos. Ojo: la publicación guarda una copia de la ficha, así que un cambio posterior en la base no le llega solo. Pasó con el aviso de mmWave: la publicación del iPhone 14 Plus se corrigió con tinker (solo `red`, que tenía el texto anterior de la base).
- **Autonomía en seminuevos**: `atributosPublicos()` calcula `autonomia_estimada_horas = horas × salud %` si el equipo no es nuevo ni está sellado. La ficha muestra «≈ 12 h de video» con la nota «Estimada con su batería al 90 %. Nuevo: hasta 13 h». La API devuelve los dos números.
- **Campos de la ficha de celular**: se sumaron contraste, respuesta táctil, Neural Engine, cámaras traseras, zoom óptico, funciones de foto, video frontal, carga inalámbrica, ubicación, brillo, CPU, GPU, NFC, banda ultraancha, escáner LiDAR, «Salió con», seguridad y funciones de pantalla (Dynamic Island, pantalla siempre activa, True Tone y P3).
- Tests: `src/tests/Feature/ModelosReferenciaTest.php` y `src/tests/Feature/EsquemaFichaCelularTest.php`.

## Computadoras (Mac y PC) en la base de modelos (2026-09-15)

Diagrama: [`diagramas/computadoras-mac.html`](diagramas/computadoras-mac.html). Informe con cada fuente y cada unidad: [`informes/computadoras-2026-09-15.md`](informes/computadoras-2026-09-15.md).

- **Pedido del usuario:** fichas profesionales solo de las computadoras que hay en stock, primero con la ficha oficial de la marca y después con otras fuentes. Si una unidad se vende, su ficha no se borra.
- **16 modelos** en `src/database/data/modelos_referencia/computadora.php` (lo genera `herramientas/generar_computadoras.py`; no editar a mano):
  - MacBook Air de 13 y 15 pulgadas con M5 y con M4 (2025), y de 13 con M3 (2024).
  - MacBook Pro de 14 pulgadas con M5 y con M5 Pro, y de 14 y 16 con M3 Pro (2023).
  - MacBook Neo (A18 Pro) e iMac de 24 pulgadas (2024) de dos y de cuatro puertos.
  - Con Intel: MacBook Pro de 13 pulgadas 2019 y 2017 (dos puertos Thunderbolt 3), MacBook Retina de 12 pulgadas 2017 y MacBook Air de 13 pulgadas de principios de 2014.
  - Cuando el inventario no alcanza para elegir, se cargaron los dos modelos posibles: 14 o 16 pulgadas con M3 Pro, Air M5 de 13 o 15, iMac de dos o cuatro puertos.
- **Fuentes:**
  - La ficha técnica de Apple en español (`support.apple.com/es-lamr/<id>`), cotejada con la versión en inglés.
  - El último macOS sale de las listas oficiales de compatibilidad (macOS 27 Golden Gate: solo Mac con chip de Apple). El identificador, de «Identificar el modelo».
  - Lo que Apple no publica: everymac.com (sistema de fábrica y número de modelo de las Intel) y macrumors.com con Apple Newsroom (el Touch ID del Neo, solo en el de 512 GB).
  - Qué Mac es cada Intel se confirmó con el código de modelo de su número de serie (tabla de OpenCore).
  - Nada inventado: el grosor del iMac y los colores del Air 2014 quedan vacíos porque Apple no los publica.
- **Esquema** (`App\Support\FichaTecnica\EsquemaComputadora`):
  - 8 secciones (pantalla, rendimiento, batería, conectividad, multimedia, entrada, diseño y sistema), con tipos, rangos y valores permitidos.
  - Contradicciones que detecta: RAM y almacenamiento desordenados o repetidos; chip de Apple sin Neural Engine o sin ancho de banda; Intel con Neural Engine o Apple Intelligence; portátil sin batería o sin grosor; escritorio con batería o sin alto; Touch Bar fuera de Intel; XDR sin brillo HDR.
  - Solo `sistema.identificador` puede quedar pendiente (hoy, el del MacBook Neo).
  - La revisión común (campos, tipos, rangos y pendientes) está en el trait `Concerns\RevisaEsquema`, listo para los próximos esquemas. `ModelosReferenciaSeeder::revisar()` elige el esquema según el tipo.
- **Textos** (`TextosComputadora`): los de la ficha y la comparativa, por ejemplo «2.560 × 1.664 px a 224 ppi», «ProMotion, adaptativa hasta 120 Hz» o «Hasta 18 h de reproducción de video en la app Apple TV (15 h de navegación web)». Las memorias, los almacenamientos y los colores disponibles van solo a la comparativa.
- **Detección en el inventario** (`ModeloReferencia::deInventario`): cruza la línea, el chip, las pulgadas y el año del nombre y del procesador, y confirma que la RAM y el almacenamiento existan en ese modelo. Si queda más de uno, no elige: lo decide el admin en el editor. Hoy reconoce solas 15 de las 20 unidades en stock.
- **Al publicar** (`InventarioCatalogo::atributos`):
  - el chip con su nombre oficial («Apple M3»; en las Intel, la CPU que coincide, como «Intel Core i7 de doble núcleo a 1.7 GHz (Turbo Boost hasta 3.3 GHz)»);
  - la memoria («16 GB de memoria unificada» o «8 GB LPDDR3 a 1600 MHz») y el almacenamiento normalizado («1 TB»);
  - el color con el nombre de Apple («SPACE BLACK» → «Negro espacial»);
  - Apple Intelligence «No compatible» en las Intel.
- **Ficha y comparativa** (`fichaTecnica.jsx`): 41 campos, cada uno con su ícono SVG. Se sumaron 9 íconos: ExternalDisplay, Bandwidth, BatteryCycle, Ports, Ethernet, Webcam, Speaker, Mic y Trackpad. `campoDe(key, tipo)` busca primero en los grupos del tipo, así las claves que comparten celular y Mac (chip, pantalla, autonomía, modelo) toman la etiqueta y el ícono de la Mac.
- **Las fichas prevalecen:**
  - La base no depende del stock: el seeder crea o actualiza por slug y nunca borra.
  - La comparativa muestra los 16 modelos haya o no equipos.
  - La publicación guarda su copia de la ficha y la conserva aunque el equipo se venda.
- **Falta, del lado del usuario:** revisar la #26, que figura como MacBook Pro «M5 Pro» con 512 GB, una configuración que no existe. La ASUS ROG Strix (#13) está vendida y no hace falta su ficha.
- **PC con Windows (familia «pc»):**
  - **Lenovo IdeaPad Gaming 3 15ARH7, MTM 82SB00K9US** (la #10). El MTM salió de la foto de la etiqueta que pasó el usuario.
  - **Una ficha por configuración exacta** (el MTM), no por familia: la 15ARH7 tuvo cuatro procesadores, cinco gráficas, tres pantallas y dos baterías.
  - **Dónde está cada pieza:**
    - datos en `pc.php`, que genera `herramientas/generar_pc.py`;
    - esquema `EsquemaPc`, con el trait `RevisaEsquema`;
    - textos `TextosPc`;
    - el seeder elige el esquema y los textos por tipo y familia (`ModelosReferenciaSeeder::revisar()` y `textos()`).
  - **Fuentes:**
    - la configuración, de lenovo.com (EE. UU.), en la página del número de parte;
    - la plataforma, del PDF de PSREF;
    - la confirmación, de laptoparena.net y mundolaptops.com.
    - Detalle en el informe.
  - **Detección:**
    - `lineaDe()` suma «ideapad gaming» y `chipDe()` reconoce «Ryzen 7»;
    - `chipDelEquipo()` devuelve el procesador de la ficha;
    - al publicar, el almacenamiento lleva el tipo de disco: «512 GB (SSD NVMe M.2 2242 PCIe 4.0, QLC)».
  - **Ficha:**
    - claves propias: `gpu` («Tarjeta gráfica», ícono `GraphicsCard`), `ampliacion` (ícono `Upgrade`) y `seguridad`;
    - nada de Apple: sin Neural Engine, Apple Intelligence, Touch ID ni «última versión de macOS»;
    - la tarjeta gráfica va entre los datos destacados.
  - **Campos por familia:** en `fichaTecnica.jsx`, los campos solo de Mac o solo de PC llevan `familias`. `camposDeFamilia()` los filtra en dos lugares:
    - en el editor de publicaciones, según el modelo vinculado o, si no hay, el título;
    - en la comparativa.
    - Así la Mac no muestra «Tarjeta gráfica» vacía ni la Lenovo «Neural Engine».
  - **Comparativa:** no entra en `/comparar/mac`, que filtra por familia.
- **Tests:**
  - `EsquemaFichaComputadoraTest` (5 casos): fichas completas, errores, textos, detección y atributos de la publicación.
  - `FichaTecnicaIconosTest`: cada dato de la Mac tiene su campo y su propio ícono.
  - `ComparadorModelosTest`: la comparativa de Mac y la ficha que se conserva al vender.
  - `EsquemaFichaPcTest` (4 casos): la ficha de la Lenovo, contradicciones, textos, detección, atributos de la publicación y que no entra en la comparativa de Mac.

## Accesorios en la base de modelos (2026-09-15)

Informe con fuentes: [`informes/accesorios-2026-09-15.md`](informes/accesorios-2026-09-15.md). Diagrama: [`diagramas/accesorios.html`](diagramas/accesorios.html).

- **Qué es:** 58 fichas de tipo `producto_general`, una por cada tipo de accesorio que había disponible el 2026-09-15: 8 cargadores, 6 vidrios, 4 protectores, 7 fundas, 5 cables y 28 accesorios de marca o genéricos. Solo quedan sin ficha 3 artículos sin datos comprobables (Rayban Wayfarer, ULTRA 2 IVV9 y VV9 PRO + Watch).
- **Piezas:**
  - Datos: `accesorios.php`, generado con `herramientas/generar_accesorios.py` (no se edita a mano).
  - Esquema: `EsquemaAccesorio`, con cuatro partes: `sistema` (cómo se reconoce, categoría, forma de la ilustración y para quién es), `ficha` (las mismas claves que `fichaTecnica.jsx`), `contenido` (resumen, párrafos, puntos y qué incluye) y `visual`.
  - Textos: `TextosAccesorio` (la ficha pasa tal cual) y `ContenidoAccesorio` (la descripción de la publicación, con `{modelo}` = el equipo que dice el nombre del inventario).
  - Detección: `ModeloReferencia::detectarAccesorio()`, sobre el nombre normalizado por `textoAccesorio()` («CUBO 20 W ORIGINAL» → «cubo 20w original»).
- **Cómo se reconoce:** expresiones `sistema.detectar` y `sistema.excluir`, en el orden del archivo (lo específico primero). «CUBO 20 W ORIGINAL» es el de Apple; «CUBO 20W Calidad Origen», el certificado; «VIDRIO TEMPLADO CAMARA…», un protector de cámara; un cable cargado como «cargador 20 W» sale como cable.
- **Publicación** (`InventarioCatalogo::crear`): la ficha (sin `normas` ni `pruebas`, que son solo para comparar), el resumen, la descripción, «Qué incluye», la categoría de la ficha y «Compatible con», que sale del nombre (`ModelosCompatibles::nombres`). Sin ficha, sale solo con el nombre, como antes.
- **Ficha pública:** grupo `producto_general` de `fichaTecnica.jsx` con campos por familia (`familias`) y 18 íconos nuevos en `Icons.jsx`. «Lo más importante» toma los seis primeros datos que tenga (una lista muestra su primera parte y el resto como detalle). Los datos clave junto al botón de compra suman potencia, conector, protección, sonido, asistente, casa inteligente, conexión, «Funciona con» y fabricante.
- **Ilustraciones** (`Components/Store/AccesorioVisual.jsx`): cargador con su potencia, vidrio, protector de cámara, funda (con el anillo si es MagSafe), cable, parlante y control; el resto, su ícono. Las usan la comparativa, «Modelos y fotos» y la tienda (`ProductVisual`) mientras no haya foto.
- **Panel:** el importador dice con qué ficha sale cada accesorio y también busca por ficha; el editor muestra los campos de la familia y «Llenar desde modelo» completa además el resumen, la descripción y «Qué incluye» vacíos; «Modelos y fotos» agrupa los accesorios por familia.
- **Comparativas:** `cargadores` y `vidrios` en `ComparadorModelosController::FAMILIAS`, con título, bajada, fuentes, los modelos con que entran (`inicio`) y la invitación de la ficha («¿Original o certificado?», «¿Gorilla Glass o tradicional?»). En los accesorios cuentan las unidades en stock, no las publicaciones.
- **Tests:** `FichasAccesoriosTest` (9 casos: esquema, errores, detección, publicación, invitación a comparar, las dos comparativas, el importador y la ficha que queda al vender) y `FichaTecnicaIconosTest` (cada dato de accesorio con su campo y su propio ícono).

## Productos Apple en la base de modelos (2026-09-16)

Informe con fuentes: [`informes/productos-apple-2026-09-16.md`](informes/productos-apple-2026-09-16.md). Pedido del usuario: «arma las fichas, busca y consulta en las fuentes, con svg profesionales», y después «añade en comparar también… es comparar productos Apple» y «¿nuestros productos Apple todos quedaron con ficha?».

- **Qué es:** 29 fichas de tipo `producto_apple` (categoría «Más Apple»): 9 iPad (A16, mini A17 Pro, Air M4 de 11 y 13, Pro M4 y M5 de 11 y 13 Wi‑Fi, y el Pro M5 de 11 Wi‑Fi + Cellular), 3 Apple Watch Series 10 de 46 mm, 8 AirPods (Pro 3, Pro 2 USB‑C y Lightning, 4, 4 con cancelación, Max 2, Max USB‑C y 1.ª generación), 5 accesorios (Apple Pencil USB‑C, Pro y 2.ª generación; Magic Mouse USB‑C y Lightning) y 4 de **otras marcas** cargadas en «Productos Apple» (familia `otra_marca`: Samsung Galaxy Tab S9 Ultra y S10 Lite 5G, monitor selfie K&F Concept M5 y ventilador Torras COOLiTE). **Los iPad son Wi‑Fi, salvo el iPad Pro M5 de 11 pulgadas con IMEI** (el usuario lo confirmó).
- **Otras marcas (casos puntuales, pedido del usuario):** tienen su ficha con la fuente de la marca (Samsung, y la publicación oficial en Amazon de K&F Concept y de Torras), pero **no entran en `/comparar/apple`** ni invitan a comparar (`FAMILIAS['apple']['excluir']` y `ComparadorModelosController::familiaDe()`). En la tienda muestran su marca en vez de la categoría (`marca` en la publicación) y tienen sus dibujos (`monitor` y `ventilador_cuello`). El recuadro «Capacidad» solo aparece si es almacenamiento (GB o TB).
- **Inventario corregido (2026-09-16):** a pedido del usuario se corrigieron 41 nombres de «Productos Apple» (tipeo, nombres oficiales, formato y colores en español) y el número de serie del Torras; detalle en el informe.
- **Piezas:**
  - Datos: `productos_apple.php`, generado con `herramientas/generar_productos_apple.py` (no se edita a mano). Cada ficha cita su página de Apple en `FUENTES` y el generador no escribe una sin fuente.
  - Esquema: `EsquemaProductoApple` (familias `ipad`, `watch`, `airpods` y `accesorio_apple`): `sistema` (cómo se reconoce, si la variante tiene red celular, categoría, forma de la ilustración, horas de video y colores), `ficha`, `contenido` (sin marcas) y `visual` (medidas de frente o variante de los AirPods).
  - Textos: `TextosAccesorio` (la ficha pasa tal cual) más `colores_disponibles` para la comparativa. Descripción: `ContenidoProductoApple`, con «Qué incluye» **solo en una publicación Nuevo** (lo que trae la caja de Apple).
  - Detección: `ModeloReferencia::detectarProductoApple()`. Si la ficha tiene variante con red celular, cuenta que la unidad tenga IMEI o que su nombre diga LTE, Cellular o 5G. Si coinciden dos fichas, no elige.
- **Publicación** (`InventarioCatalogo::crear`): la ficha completa, el resumen y la descripción de Apple, el color con su nombre oficial en el título y en la ficha («IPAD A16 128 GB BLUE» → «iPad A16 128 GB Azul») y las horas de video para estimar la autonomía con la salud de la batería. La capacidad y la batería salen de la unidad.
- **Ficha pública:** grupo `producto_apple` de `fichaTecnica.jsx` en nueve secciones (Pantalla, Rendimiento, Cámaras, Sonido, Funciones, Batería y carga, Conexiones, Diseño, Sistema y modelo), con campos por familia y un ícono propio por dato: 11 SVG nuevos en `Icons.jsx` (`WatchCase`, `ApplePencil`, `CpuCores`, `SpatialAudio`, `Translate`, `Controls`, `HeartPulse`, `Ear`, `ChargingCase`, `UltraWideband` y `WristSize`). Los datos clave junto al botón de compra muestran el valor en corto (`valorCorto`: «6 GB» sin la nota de la fuente).
- **Ilustraciones** (`AccesorioVisual.jsx`): iPad con sus proporciones reales, Apple Watch con correa, Digital Crown y botón, AirPods Pro (con almohadillas hacia afuera) y abiertos, AirPods Max, Apple Pencil y Magic Mouse. Las usan la tienda (`ProductVisual`), la comparativa y «Modelos y fotos» mientras no haya foto.
- **Panel:** el importador dice con qué ficha sale cada producto Apple («Sin ficha: la eliges al editar la publicación»); el editor muestra los campos de la familia (por la ficha vinculada o por el título) y «Llenar desde modelo» completa también el resumen, la descripción y «Qué incluye»; «Modelos y fotos» filtra por iPad, Apple Watch, AirPods y Accesorios Apple.
- **Comparativa `/comparar/apple`:** ver la sección siguiente.
- **Lo que Bolivia no tiene se dice así:** la App ECG y los avisos de ritmo irregular y de apnea del sueño del Apple Watch, y la salud auditiva de los AirPods Pro (fuente: las páginas de disponibilidad de Apple).
- **Revisado en la tienda real** con cinco publicaciones temporales (iPad A16, Apple Watch LTE, AirPods Pro 3, AirPods Max 2 y Apple Pencil USB‑C), borradas después: catálogo, ficha completa a 1440 y 390 px y comparativa. Se corrigió el color en inglés del título, la nota de la RAM que se veía entera en los datos clave y las almohadillas de los AirPods Pro.
- **Tests:** `FichasProductosAppleTest` (9 casos: fichas completas y con fuente, errores del esquema, detección con los nombres reales del inventario, publicación con ficha y descripción y «Qué incluye» solo en Nuevo, ilustración en la tienda, importador, un ícono por dato, la comparativa y la ficha que queda al vender).

## Comparativa pública de modelos

Diagrama: [`diagramas/modelos-referencia.html`](diagramas/modelos-referencia.html) (nodo «Comparar»)

- **Ruta**: `/comparar/{familia}?modelos=slug1,slug2` (`store.compare.modelos`). Familias: `iphone`, `mac`, `apple` (productos Apple, desde el 2026-09-16), `cargadores` y `vidrios`; otra familia da 404. **Productos Apple** es una sola comparativa sin familia de base (`familia` null en `FAMILIAS`): se pueden elegir hasta 4 de cualquier tipo, el selector los agrupa por iPad, Apple Watch, AirPods y Accesorios Apple, entra con los tres iPad que hay en stock y «Lo esencial» muestra chip, batería, carga, peso y año. Muestra hasta 4 modelos en el orden pedido, ignora los slugs que no existen y los repetidos. Sin `modelos`, propone primero los que hay en tienda y completa con los más nuevos (3 en total); cargadores y vidrios entran con los que indica su familia (`inicio`). La comparación vieja de publicaciones (`/comparar?slugs=`, `Compare.jsx`) sigue igual.
- **Servidor** (`ComparadorModelosController`):
  - Datos técnicos: los `specs` de `modelos_referencia`, los mismos textos de la ficha.
  - Precio y stock: los calcula el servidor desde las publicaciones vigentes con equipo disponible (`publicadoAhora`, `productoDisponible`, `precioVigente`, promoción activa). Manda cuántos equipos hay, el precio «desde», las condiciones y el enlace: con un equipo, a su publicación; con varios, al catálogo filtrado por modelo (`/catalogo?categoria=celulares&modelo=slug`).
  - Nunca se envía costo, IMEI ni procedencia. El test lo revisa en la respuesta completa.
  - `version_actual`: la versión de iOS más nueva de la base (hoy iOS 27). Con ella, «Lo esencial» dice «Recibe iOS 27, la versión actual» o «Se quedó en iOS 16». En Mac se compara con la macOS más nueva (hoy macOS 27 Golden Gate).
  - `visual`: para la ilustración. En iPhone, alto, ancho y cámaras; en Mac, formato, medidas, pulgadas y muesca.
- **Página** (`Pages/Store/CompararModelos.jsx`):
  - Arriba, cada columna trae un selector (con el grupo «En tienda ahora» y los modelos por año), la imagen con el botón para quitar, el año, las muestras de color, las capacidades y la caja de tienda (precio y «Ver equipo», o «Sin stock ahora» con «Consultar» por WhatsApp). **Los botones de esas cajas van siempre en una misma línea** (pedido del usuario, 2026-09-16): cada caja ocupa hasta el final de su columna y el botón va al fondo (`mt-auto`), con el mismo alto en «Ver equipo» y «Consultar» (borde transparente), aunque un título ocupe dos líneas o un modelo no tenga capacidades; en celular también.
  - El espacio libre ofrece «Sugeridos»: primero lo que hay en tienda, después la misma línea del primer modelo (del 14 Plus: 16 Plus y 15 Plus) y después lo más nuevo.
  - Debajo van «Lo esencial» (en una tarjeta blanca: pantalla, chip, cámaras, batería, desbloqueo, actualizaciones y Apple Intelligence; en Mac, pantalla, chip, memoria RAM, batería, peso, actualizaciones y Apple Intelligence) y la tabla por grupos, con el interruptor «Solo diferencias» y accesos a cada grupo.
  - **Lectura de la tabla** (rediseño del 2026-09-15, a pedido del usuario: «los títulos no se entienden»):
    - Cada fila tiene su título en una sola línea: ícono y nombre en 15-16 px. La explicación va al lado, en gris, desde pantallas grandes, y se recorta con el texto completo al pasar el mouse. En celular y tablet queda detrás de un botón «i» que la abre debajo del título. Antes iba en una segunda línea y descuadraba la fila.
    - Debajo del título, con 24 px de aire (20 px en celular), cada valor cuelga de una línea vertical alineada con la columna de su modelo y con la barra fija.
    - Los valores van en 15 px. Las listas llevan viñetas y empiezan con mayúscula. «IP68» lleva el detalle debajo (formato `principal`). «No tiene» se muestra con un guion.
    - Las listas de más de 6 puntos (video, fotos, cámara frontal) muestran 6 y «y N más», con el botón «Ver la lista completa».
  - **Colores**: en la cabecera, una fila de muestras; en «Diseño», una lista con un color por línea (muestra y nombre), alineada como las demás listas de la tabla (`Components/Store/tonosColor.js`). Apple no publica códigos de color, así que los tonos son aproximados y la nota al pie lo dice. Los nombres que se repiten entre generaciones con otro tono («Azul» del 12 y del 15) tienen su tono por generación.
  - Solo en celulares la tabla se desliza de costado. Desde tablet, el contenedor no tiene scroll (`md:overflow-visible`): antes la tarjeta de «Lo esencial», que sobresale a los costados, activaba una barra de desplazamiento horizontal en computadora.
  - Una barra fija bajo el header muestra los modelos elegidos al bajar (miniatura, nombre y precio o «Sin stock ahora»). Mide el header en vivo porque cambia de alto según la pantalla, y se oculta si el menú del celular está abierto.
- **Diseño responsive**:
  - Desde pantallas medianas siempre hay 4 columnas del mismo ancho, aunque se compare un solo modelo. Antes, con un solo modelo, cada columna ocupaba media pantalla.
  - En celulares, cada columna mide 40 % del ancho: se ven dos y asoma la tercera. La tabla se desliza de costado con imán a cada columna, la barra fija se mueve con ella y los títulos quedan a la izquierda.
- **Qué se muestra** (`Components/Store/comparativa.jsx`):
  - Sale de `gruposFicha`: mismos grupos, etiquetas, íconos y ayudas que la ficha del producto.
  - Se quitan los datos de la unidad (salud y ciclos de batería). La capacidad y el color pasan a ser «Capacidades» y «Colores» con los que salió el modelo.
  - Una celda vacía dice «No tiene» cuando el modelo carece de algo (teleobjetivo, LiDAR, banda ultraancha…).
  - Los textos con « · » se ven como lista, sin partir lo que va entre paréntesis (el brillo del 16 y el 18 Pro). Lo que va después de «; » (SIM, mmWave) se ve como nota.
- **Imagen** (`Components/Store/ModeloVisual.jsx`): la foto que se sube en «Modelos y fotos» (sección de abajo). Mientras no haya, se dibuja el dorso a escala con las medidas reales (un mini se ve más chico que un Pro Max) y sus cámaras, flash y LiDAR. En Mac (`MacFrente`) se dibuja de frente y a escala por su ancho: la portátil abierta, con la muesca de la cámara si la tiene, o el iMac con su mentón y su pie. La nota al pie aclara que las ilustraciones son referenciales. Los accesorios usan `AccesorioVisual` (cargador con su potencia, vidrio, protector de cámara, funda, cable, parlante o control).
- **Entradas**:
  - **Header:** en la barra de categorías, el menú «Comparar» (con «Comparar iPhone», «Comparar Mac», «Comparar productos Apple», «Comparar cargadores» y «Comparar vidrios templados»), junto al Trade-In; así la barra entra en una línea desde 1024 px. Hay otro enlace dentro del menú «iPhone» y «Comparar modelos» dentro de «Mac» (migraciones `2026_09_15_130000_add_comparar_nav_menu_items` y `2026_09_15_150000_add_comparar_mac_nav_menu_items`). En el menú del celular son tarjetas de acceso rápido.
  - **Footer:** «Comparar iPhone» y «Comparar Mac» en la columna «Comprar».
  - **Otras entradas:** el banner del hub `/iphone` y, en la ficha de un producto con modelo de referencia, «¿Dudas entre modelos?», que abre la comparativa con ese modelo.
  - **Ojo:** los menús del header y del footer salen de la base de datos (Tienda online → Menú). El menú fijo del código solo se usa si la base no tiene ítems.
- **SEO**: título «Comparar modelos de iPhone — Apple Boss Cochabamba» (`Seo::DEFAULTS`), editable desde SEO por página como plantilla (migración `2026_09_15_120000_add_comparar_modelos_seo_page`). La URL canónica va sin `?modelos`; `/comparar/iphone` y `/comparar/mac` están en el sitemap. La misma plantilla da «Comparar modelos de Mac — Apple Boss Cochabamba».
- **Mac** (2026-09-15): ver «Computadoras (Mac) en la base de modelos». Para sumar otra familia (iPad, productos Apple): su base con esquema propio, la familia en `ComparadorModelosController::FAMILIAS` y sus `DEL_MODELO`, `NO_TIENE` y `ESENCIAL` en `comparativa.jsx`.
- Tests: `src/tests/Feature/ComparadorModelosTest.php` (orden y tope de 4, propuesta sin elección, precio y stock desde el inventario sin datos internos, enlaces desde la ficha y el catálogo, 404 sin base, SEO y sitemap, la comparativa de Mac con su ilustración y la ficha de Mac que se conserva al vender). La foto subida en el admin la cubre `ModelosFotosAdminTest`.

## Modelos y fotos (admin)

Tienda online → **Modelos y fotos** (`/admin/modelos`). Guía para el equipo: [`guia-fotos-modelos.md`](guia-fotos-modelos.md).

- **Listado** (`Pages/Admin/Modelos/Index.jsx`):
  - PageHeader con un botón por comparativa («Comparativa iPhone» y «Comparativa Mac») y 4 Stat (modelos, con cuántos son iPhone, Mac y PC; con foto con su porcentaje; sin foto y en tienda).
  - Aviso de los modelos que están en tienda sin foto, `AdminGuide` y búsqueda por nombre o alias.
  - Chips de familia (Todos los tipos, iPhone, Mac y PC; los conteos de estado siguen a la familia elegida) y de estado: Todos, Sin foto, Con foto y En tienda.
  - Tarjetas por año, cada una con la foto o la ilustración, la etiqueta «Con foto» o «Sin foto» y el botón «Subir foto» o «Cambiar foto».
- **Pantalla del modelo** (`Pages/Admin/Modelos/Show.jsx`, `/admin/modelos/{slug}`):
  1. **Foto:** se arrastra o se elige. Antes de guardar, el navegador la revisa (`Components/Admin/modelos.jsx`):
     - Formato, peso, medidas y proporción 5:6.
     - El fondo: mira las esquinas para saber si es transparente o blanco.
     - Verde está bien, amarillo es un aviso y rojo impide guardar.
     - Hay barra de progreso y la opción «Quitar foto», que pide confirmación.
  2. **Guía:** 4 ejemplos dibujados («Así sí», «Inclinada», «Con fondo o texto», «Recortada») y los 6 requisitos. El primero cambia según el tipo: el iPhone, de dorso; la computadora, de frente y abierta.
  3. **Ficha (solo lectura):** lo esencial y los nombres con que se reconoce el modelo en el inventario.
  4. **Publicaciones del modelo:** estado, condición y precio, con enlace al editor.
  - **Al costado:** «Así se ve en la comparativa», la caja azul «Fotos cargadas N de 55» y «Siguiente sin foto», para subir varias seguidas. Arriba, «Anterior» y «Siguiente».
- **Servidor** (`Admin\ModeloReferenciaController`):
  - Rutas `admin.modelos.index`, `show`, `foto` (POST, con throttle) y `foto.quitar` (DELETE), con enlace por slug.
  - Valida JPG, PNG o WebP, hasta 10 MB y al menos 600 px por lado, con mensajes en español.
- **Guardado** (`App\Services\FotoModeloService`):
  - Guarda el original y dos WebP: `card` de 640 × 768 como máximo y `detalle` de 1280 × 1536.
  - Conserva la transparencia y no deforma ni agranda.
  - Guarda en `foto_meta` el nombre, el tipo, el peso y las medidas.
  - Al reemplazar o quitar la foto, borra los archivos anteriores.
- **Columnas y seeder:** migración `2026_09_15_140000_add_foto_to_modelos_referencia_table`, con las columnas `foto_original`, `foto_card`, `foto_detalle`, `foto_meta` y `foto_actualizada_at`. El seeder de modelos no las toca.
- **Procesamiento:** el código GD de las fotos de publicaciones pasó al trait `App\Services\Concerns\ProcesaImagenes`, que usan `ImagenProductoService` y `FotoModeloService`. El trait también corrige un caso: si GD no podía leer un archivo, el servicio fallaba con un error de tipo.
- **Modelo:** `ModeloReferencia` suma `publicaciones()`, `tieneFoto()`, `urlFoto('card'|'detalle')` y `visual()`. `visual()` son las medidas para la ilustración y lo usan la comparativa y el admin.
- **Tests:**
  - `src/tests/Feature/ModelosFotosAdminTest.php`: listado, solo admin, subir y ver en la comparativa, reemplazar y quitar borrando archivos, rechazos, que el seeder no borre las fotos y «Siguiente sin foto».
  - `CatalogoAdminTest`: las variantes de las fotos de publicaciones, que quedan cubiertas tras el cambio al trait.
- **Revisión visual:** se hizo con una vista previa estática de las dos pantallas (esbuild + `renderToStaticMarkup` con los datos reales), sin iniciar sesión en el panel.

## Categorías (admin)

Tienda online → **Categorías** (`/admin/sitio/categorias`). Diagrama: [`diagramas/categorias.html`](diagramas/categorias.html).

**Para qué sirve.** Las categorías son los estantes de la tienda. No se crean ni se borran y su dirección no cambia: al publicar, cada producto cae solo en la suya según el inventario del que sale (`InventarioCatalogo::GRUPOS`): celulares → iPhone, computadoras → Mac, productos Apple → Apple y productos generales → Accesorios. Las fundas que se marcan como MYSKIN al publicarlas van a Fundas MYSKIN. El módulo controla el nombre, la descripción, el orden, dónde se muestra cada una, la portada de su página y cómo aparece en Google.

**Dónde se ve cada categoría**

| Lugar | Qué la muestra |
|---|---|
| Inicio, bloque «¿Qué estás buscando?» | Activa, marcada «En el inicio» y con productos, con el bloque encendido en Portada. Necesita dos o más. |
| Catálogo, filtro «Categoría» | Las activas con productos a la venta (antes solo las del inicio, así que Accesorios no aparecía). |
| Su página (`/catalogo?categoria=…`) | La portada: título, texto y botón. En Accesorios, además los chips por tipo. |
| Google y WhatsApp | Su título y su descripción; la URL canónica es la de la categoría y entra en el sitemap. |
| Menús de arriba, del celular y del pie | Se arman en «Menú» (`nav_menu_items`). Esta pantalla solo dice en cuáles figura. |
| Carrusel de productos del inicio | Se arma en «Portada» (secciones `category_products` y `myskin`). |

**Listado** (`Pages/Admin/Categories/Index.jsx`): PageHeader, 4 Stat (categorías, productos en la tienda, por publicar y accesos en el inicio), avisos (una categoría con productos fuera del inicio, con el botón que la enciende; el bloque del inicio apagado en Portada), `AdminGuide`, la lista con arrastrar o flechas para ordenar (se guarda solo), dos `Switch` por fila (Catálogo e Inicio) y, al costado, las vistas previas del inicio y del filtro del catálogo más los accesos a «Menú» y «Portada».

**Pantalla de la categoría** (`Pages/Admin/Categories/Edit.jsx`): 5 StepCard —nombre y descripción (con la dirección web en solo lectura), portada, Google con su vista previa, qué va en esta categoría (de qué inventario sale, cuántos hay, la tabla de tipos de accesorio y los accesos a sus productos y al importador) y dónde más figura (menús y carrusel)—. Al costado, el acceso del inicio en vivo, los interruptores, el guardado y la vista previa de la portada.

**Dónde van los accesorios.** Todo lo de «Productos generales» cae en Accesorios y adentro se ordena por **tipo**, que sale de la familia de su ficha («Modelos y fotos»): cargadores, vidrios templados, protectores, fundas, cables y otros accesorios. En la tienda esos tipos son los chips de la portada (`?tipo=cargador`); en el panel, la tabla dice cuántos hay de cada uno en la tienda y cuántos faltan publicar. Un accesorio sin ficha sale con su nombre, dentro de «Otros accesorios». Las fundas marcadas como MYSKIN no entran acá: van a Fundas MYSKIN.

**Cambios en la tienda**
- **Accesorios ahora va en el inicio** (migración `2026_09_15_160000_mostrar_accesorios_en_el_inicio`, solo si la categoría seguía como la dejó el seeder) y su descripción nombra lo que tiene. Con 4 accesorios y 1 iPhone publicados, el bloque del inicio pasa a mostrarse: necesita dos categorías con productos.
- El filtro del catálogo ya no usa `forHome()`: lista las categorías activas con productos (`categoriasCatalogo`).
- Los accesos del inicio cuentan solo lo que está a la venta; antes contaban también lo vendido.
- `Components/Store/TarjetaCategoria.jsx`: la tarjeta del inicio, que comparten la tienda y la vista previa del panel.
- La página de una categoría manda su título y su descripción a `Seo::context` y fija su propia URL canónica (`Seo` acepta la clave `canonical`); el sitemap suma las categorías con productos.
- Se quitó el interruptor «Mostrar en navegación»: no hacía nada, porque los menús salen de `nav_menu_items`. La columna `show_navigation` queda sin uso.
- La dirección web dejó de ser editable: cambiarla dejaba a los productos publicados sin categoría.
- El botón de la portada exige texto y destino, y rechaza `javascript:`, `data:` y `vbscript:`.
- «Agregar productos» acepta `?grupo=` para abrir en el inventario correcto.
- Tests: `src/tests/Feature/CategoriasAdminTest.php` (11 casos: permisos, el listado con su origen y sus conteos, la dirección fija, el botón de la portada, visibilidad, orden, el filtro del catálogo, el conteo del inicio, la portada con su SEO, el filtro por tipo y una categoría oculta).
- **Revisión visual:** vista previa estática de las dos pantallas (esbuild + `renderToStaticMarkup` con los datos reales), sin iniciar sesión en el panel.

## Colecciones (admin)

Tienda online → **Colecciones** (`/admin/sitio/colecciones`). Diagrama: [`diagramas/colecciones.html`](diagramas/colecciones.html).

**Para qué sirve.** Una colección es una **vitrina armada a mano**: tú eliges qué publicaciones entran y en qué orden, mezclando categorías si quieres. Es lo contrario de una categoría, que se llena sola con el inventario del que sale cada producto y no se crea ni se borra. Sirve para una campaña: «Ofertas de la semana», «Regreso a clases», «Lo más pedido». Se crea y se borra cuando quieras; las publicaciones no se tocan.

**Estaba desconectada.** Antes del 2026-09-16 se podía armar una colección y no se veía en ningún lado: `CatalogCollection` no lo consultaba ningún controlador público, la sección `product_collection` del inicio ignoraba su `collection_id` y mostraba las 8 publicaciones más nuevas, y el slug que el panel mostraba como dirección no llevaba a ninguna página. Esta vuelta cableó todo eso.

**Dónde se ve cada colección**

| Lugar | Qué la muestra |
|---|---|
| Su página (`/coleccion/{slug}`) | Activa. Encabezado con el nombre y la descripción, y sus productos en el orden elegido. |
| Inicio, carrusel | Una sección «Colección de productos» encendida en Portada con esa colección elegida (`settings.collection_id`). El título del carrusel es el suyo si no se le pone otro, y el botón lleva a su página. |
| Menús de arriba, del celular y del pie | Se arman en «Menú»: las colecciones activas aparecen como destino en «¿A dónde lleva?», junto a las páginas del sitio. |
| Google y WhatsApp | Su título y su descripción (`meta_title`, `meta_description`), con URL canónica propia; el sitemap suma las que tienen algo a la venta. |

En la tienda **solo se muestran los productos que siguen a la venta**. Los vendidos o reservados quedan guardados en la colección —su ficha no se borra— pero no se ven; si no queda ninguno, la sección del inicio no se muestra y la página queda con su estado vacío.

**Listado** (`Pages/Admin/Collections/Index.jsx`): PageHeader con «Nueva colección» (un `Modal`: nombre y descripción; la dirección se arma con el nombre y no se repite), 4 Stat (colecciones, cuántas están en el inicio, productos a la venta y publicados), avisos (un carrusel del inicio encendido sin colección elegida, una colección sin nada a la venta, una que no está ni en el inicio ni en el menú), `AdminGuide`, la lista con arrastrar o flechas para ordenar (se guarda solo), un `Switch` por fila y, al costado, qué muestra cada sección de la portada, la diferencia entre colección y categoría y los accesos a «Portada» y «Menú».

**Pantalla de la colección** (`Pages/Admin/Collections/Edit.jsx`): 4 StepCard —nombre y descripción (con la dirección web en solo lectura), qué productos van adentro (el selector: lo elegido con su orden y su estado a un lado, la búsqueda de lo publicado al otro, y su propio botón «Guardar productos»), Google con su vista previa y dónde se muestra (inicio y menús, con sus accesos)—. Al costado, el interruptor de visibilidad, el guardado, la vista previa del encabezado de su página y el borrado con confirmación.

**Cómo funciona por dentro**
- `CatalogCollection`: `urlPublica()`, `tituloGoogle()`, `descripcionGoogle()` y `paraEnlaces()` (las activas como destino de los selectores del panel). Migración `2026_09_15_180000_colecciones_con_portada_y_google` (suma `meta_title` y `meta_description`).
- `PublicCatalogController::coleccion()` → `Store/Coleccion.jsx`, ruta `store.collection` (`/coleccion/{collection:slug}`); 404 si está oculta. `Seo::DEFAULTS` suma `store.collection`.
- `PublicCatalogController::home()`: `coleccionesDeSecciones()` resuelve en una consulta las colecciones que usan las secciones visibles y `productosDeColeccion()` devuelve sus productos a la venta, en orden. La sección viaja al front con `coleccion: {nombre, url}`.
- `HomeSectionController` pasa las colecciones al constructor de portada, que ahora tiene un selector; la sección dejó de llamarse «Disponibles ahora» y se llama «Colección de productos».
- En el inicio, un producto sigue saliendo una sola vez, pero **la vitrina se reserva los suyos antes que nadie**: se eligieron a mano para ahí, así que un carrusel de más arriba (iPhone, Accesorios…) ya no se los come.
- `LinkPicker` acepta destinos propios: sin `extra`, usa las colecciones que comparta la pantalla (Menú, Portada y la portada de una categoría).
- Al borrar una colección se apagan la sección de la portada que la mostraba (y se le quita el `collection_id`) y los enlaces del menú que llevaban a ella, para no dejar enlaces rotos. El flash lo dice.
- La dirección web no se edita: los enlaces compartidos y los del menú apuntan ahí. Si el nombre quedó mal, se borra la colección y se crea otra.
- Se quitó la pantalla «Crear» (`Collections/Create.jsx` y la ruta `collections.create`): se crea desde el listado. `syncPublicaciones` y `reorder` dejaron de devolver JSON y vuelven con `back()`.
- Tests: `src/tests/Feature/ColeccionesAdminTest.php` (13 casos: permisos, el listado con sus conteos y dónde se ve, el aviso del carrusel sin colección, el alta con dirección única, la dirección fija y el texto limpio, el orden de los productos, el interruptor, el borrado que no borra publicaciones y apaga lo que llevaba a ella, las colecciones como destino del menú, la página pública con su orden y sin lo vendido, el título en Google y la canónica, el inicio con la colección elegida y el sitemap).
- **Revisión visual:** vista previa estática de las dos pantallas (esbuild + `renderToStaticMarkup`) a 1440 y a 390 px, sin iniciar sesión en el panel.

**Qué queda por hacer.** La sección «Disponibles ahora» del inicio quedó encendida sin colección elegida: hasta que se cree una y se elija en Portada, ese espacio del inicio no muestra nada (el listado lo avisa).

## Portada (admin)

Tienda online → **Portada** (`/admin/home-builder`). Diagrama: [`diagramas/portada.html`](diagramas/portada.html).

**Para qué sirve.** Es el orden de la página de inicio. Las secciones no se crean ni se borran: son las piezas que sabe dibujar la tienda. Acá se enciende cada una, se mueve y se editan sus títulos, textos, botones y cuántos productos muestra. El contenido sale de otros módulos, y **una sección que hoy no tiene nada que mostrar no se dibuja**: la portada nunca queda con un título y un hueco debajo.

**Qué estaba flojo antes del 2026-09-16**
- La sección «Ofertas» estaba encendida y **no mostraba nada**: no tenía renderer. Ahora muestra las publicaciones con precio promocional vigente.
- «Nuevos ingresos» repetía la misma lista que «Productos destacados» (las 8 más nuevas) en vez de resolverse en el backend como las demás.
- Sobraban dos tipos fantasma, `editorial_split` y `recently_viewed`: estaban permitidos pero la tienda no sabía dibujarlos y no había ninguna fila en la base. Se quitaron.
- El precio promocional no llegaba a las tarjetas del inicio ni del catálogo (solo a la ficha del producto), y **el carrito cobraba el precio sin la rebaja**. Ahora `serialize()` manda `promo_price`, la tarjeta lo muestra tachando el anterior y `syncCart` usa `precioPublico()`: el servidor sigue siendo la única autoridad del precio.
- El panel no decía qué mostraba cada sección ni por qué una quedaba fuera.
- Las fechas de publicación (`publicar_desde` / `publicar_hasta`) existían en la base y en el modelo, pero no había forma de cargarlas desde el panel.

**Cómo se reparten los productos.** Cada sección de productos trae su listado ya filtrado y limitado por el backend, con una sola regla compartida: `HomeSection::filtrar()`. En el inicio, un producto sale **una sola vez**; la vitrina de una colección se reserva los suyos antes que nadie (se eligieron a mano para ahí) y los demás carruseles toman lo que queda. El panel hace exactamente la misma cuenta, así que lo que dice el listado es lo que se ve en la tienda.

**Qué muestra cada sección**

| Sección | De dónde sale | Cuándo no se dibuja |
|---|---|---|
| Portada grande (`hero`) | Las publicaciones más nuevas, con sus fotos | Siempre se dibuja |
| Franja de confianza (`trust`) | Texto fijo de la tienda | Siempre se dibuja |
| Productos destacados (`featured`) | Publicaciones marcadas «Destacado» | Sin ninguna destacada a la venta |
| Accesos a las categorías (`category_rail`) | Categorías marcadas para el inicio | Con menos de dos categorías con productos |
| Productos de una categoría (`category_products`) | La categoría elegida | Sin productos a la venta en esa categoría |
| Fundas MYSKIN (`myskin`) | Publicaciones marcadas MYSKIN | Sin fundas a la venta |
| Seminuevos (`semiused`) | Condición Seminuevo u Open Box | Sin equipos de esa condición |
| Trade-In (`trade_in`) | Texto editable | Siempre se dibuja |
| Colección de productos (`product_collection`) | La colección elegida | Sin colección elegida o sin nada a la venta |
| Nuevos ingresos (`new_arrivals`) | Las últimas publicaciones | Sin productos a la venta |
| Ofertas (`offers`) | Publicaciones con precio promocional vigente | Sin promociones vigentes |
| Servicios, Dónde estamos, Preguntas (`services`, `location`, `faq`) | Sus módulos; si están vacíos, la tienda muestra unos de ejemplo | Siempre se dibujan |

**Pantalla** (`Pages/Admin/HomeBuilder/Index.jsx` + `Components/Admin/portada.jsx` + `Components/Admin/PortadaModal.jsx`): PageHeader con «Ordenar como el menú» y «Ver la tienda», 4 Stat (secciones, las que se ven ahora, las encendidas sin contenido y los productos a la venta), un aviso cuando hay secciones encendidas que no muestran nada, `AdminGuide`, y la lista con arrastrar o flechas (se guarda solo). Cada fila dice el tipo, de qué módulo sale su contenido (con enlace), cuántos productos muestra, su estado (`Se ve`, `Sin contenido`, `Apagada`, `Fuera de fecha`) y, si no se ve, por qué en una línea. Al costado, «Así queda el inicio» —la lista real de lo que el cliente ve hoy, en orden— y los accesos a los módulos que llenan la portada.

**Editor de una sección** (`Modal`): título y bajada, campos propios de cada tipo (la categoría con cuántos tiene a la venta, la colección, el local, los botones del hero con `LinkPicker` y su tema de color), cuántos productos muestra (1 a 12) y las fechas entre las que se muestra.

**Portada grande cableada (2026-09-16, pedido del usuario).** Antes la portada del inicio solo usaba el botón principal: la volanta, el título, el texto, el segundo botón y los colores que ofrece la ventana se guardaban y no se veían. Ahora (`Hero` en `Pages/Store/Home.jsx`):
- **Texto:** desde 1280 px, la volanta, el título (`h1`, hasta 3 líneas) y el texto (hasta 3 líneas) van arriba a la izquierda, en el espacio libre entre el borde y el equipo, con el ancho calculado para no tocarlo nunca. Por debajo de 1280 px van arriba, a lo ancho, y el equipo se achica y baja (se mide el alto del texto con `ResizeObserver`). Sin texto cargado, la portada queda como siempre.
- **Segundo botón:** va al lado de «Ver catálogo»; en pantallas angostas, como enlace debajo del texto. Un enlace a otro sitio se abre en otra pestaña.
- **Colores:** «Azul Apple Boss» deja a cada lámina con su tono; «Verde MYSKIN» usa el morado y el lima de la sub-marca en todas; «Claro» pasa a fondo claro con letras azules y sombras suaves.
- **De paso:**
  - la portada tiene `isolation: isolate`: el grano, los puntos y la barra de abajo ya no se dibujan encima del encabezado fijo al bajar;
  - una lámina sin foto de producto (por ejemplo Mac sin una destacada) muestra el dibujo entero en la pantalla del equipo, en vez de recortarlo hasta dejarla vacía.
- **Verificación:** se revisó con textos de prueba a 1440, 1024 y 390 px en los tres colores (midiendo que el texto no toque el equipo ni las tarjetas) y después se dejó la configuración como estaba. Test: `PortadaGrandeTest`.

**Cambios técnicos**
- `HomeSection`: `TIPOS_CON_PRODUCTOS`, `LIMITES`, `limite()` y `filtrar()` —la regla única que comparten la tienda y el panel—. `TYPES` quedó sin los dos tipos fantasma.
- `HomeSectionController`: `update()` y `reorder()` dejaron de devolver JSON y vuelven con `back()` (como Categorías y Colecciones); `update()` valida que la fecha de fin sea posterior a la de inicio; `sanitizeSettings` recorta el límite a 12 y rechaza `javascript:`, `data:` y `vbscript:`.
- `PublicCatalogController::home()` ya no arma listas sueltas de seminuevos ni de MYSKIN: cada sección resuelve la suya. `Store/Home.jsx` perdió el mapa `PRODUCT_SOURCE` y usa `section.products`.
- Tests: `src/tests/Feature/PortadaAdminTest.php` (15 casos) y los dos archivos que ya existían, adaptados al contrato de Inertia.
- **Revisión visual:** vista previa estática de la pantalla y del modal con los datos reales (esbuild + `renderToStaticMarkup`) a 1440 y a 390 px, sin iniciar sesión en el panel.

## Menú (admin)

Tienda online → **Menú** (`/admin/sitio/menus`, con `?menu=header|mobile|footer` para abrir uno directo). Diagrama: [`diagramas/menus.html`](diagramas/menus.html).

**Para qué sirve.** Son los enlaces con los que el cliente se mueve por la tienda. Hay **tres menús independientes**, porque no se ven en el mismo lugar, y cada uno admite cosas distintas:

| Menú | Dónde se ve | Opciones adentro | Columnas | Verde MYSKIN |
|---|---|---|---|---|
| Arriba, en la computadora (`header`) | La barra de arriba | ✅ se abren al pasar el mouse | — | ✅ |
| En el celular (`mobile`) | La lista del botón del menú | — (es plana) | — | ✅ |
| Abajo, en el pie (`footer`) | El final de la página | — | ✅ por nombre de columna | ✅ (nuevo) |

Si un menú se queda sin enlaces visibles, **la tienda muestra uno armado de fábrica** para que el cliente igual pueda moverse. La pantalla lo avisa, porque desde el panel parece que se hubiera vaciado.

**Qué estaba flojo antes del 2026-09-16**
- **Los enlaces fuera de la tienda se rompían.** El panel invitaba a pegar una dirección propia (`https://wa.me/…`, Instagram) y la tienda los dibujaba con el `<Link>` de Inertia, que solo sabe navegar dentro del sitio. Ahora hay un único `EnlaceMenu` que usa `<a>` para lo de afuera (y para `mailto:` y `tel:`) y `<Link>` para lo de adentro.
- **«Abrir en otra pestaña» solo funcionaba en el pie.** Arriba y en el celular se ignoraba. Ahora vale en los tres.
- **El verde de MYSKIN no llegaba al pie.** Ahora sí.
- **Un enlace sin dirección quedaba roto**: en el menú de arriba, un título que solo abre sus opciones se dibujaba como un enlace a ninguna parte. Ahora se dibuja como texto.
- El panel dejaba colgar «opciones adentro» sin decir que **solo el menú de arriba las muestra**; ahora el backend lo rechaza (422) y la pantalla solo ofrece esa acción donde sirve.
- La columna del pie era texto libre: un error de tipeo creaba una columna nueva sin avisar. Ahora se elige de una lista, con la opción «Crear una columna nueva…».
- No había forma de **reordenar** desde la pantalla (la ruta existía), ni de esconder un enlace sin borrarlo desde la fila, y el borrado usaba el `confirm()` del navegador.

**Pantalla** (`Pages/Admin/Menus/Index.jsx` + `Components/Admin/menus.jsx`): PageHeader con «Ver la tienda», tres tarjetas (una por menú, que sirven de acceso), `AdminGuide` con los tres pasos, un `Segmented` para cambiar de menú y, debajo, la lista de ese menú con arrastrar o flechas (se guarda solo), un interruptor por fila, «Editar», «Quitar» con confirmación y, en el de arriba, las opciones de cada enlace con su propio control y «Agregar una opción dentro de…». Cada fila dice **a dónde lleva en palabras** (no la dirección cruda) y tiene etiquetas para lo que no se ve a simple vista: «Oculto», «Verde MYSKIN», «Se abre aparte», «Fuera de la tienda» y la columna del pie.

**Al costado**, tres cajas: **«Así se ve en la tienda»** —una vista previa real del menú que estás editando: la barra del navegador con su submenú, el celular con la lista o el pie azul con sus columnas—, **«Esto sale siempre»** (los accesos que la tienda agrega sola: las comparativas y, en el pie, las páginas informativas y el WhatsApp) y **«Copiar de otro menú»**.

**Copiar entre menús.** Los tres se editan por separado, así que es fácil que queden distintos. La pantalla compara **solo la computadora con el celular** —son la misma navegación en dos pantallas— y avisa cuántos enlaces le faltan a uno respecto del otro, con un botón que los trae de una vez. No copia las opciones de adentro (el celular no las muestra) ni repite lo que ya está, y al copiar al pie los deja en la primera columna. El pie no se compara con nadie: lleva otros enlaces a propósito.

**Cambios técnicos**
- `MenuController`: payload con `menus`, `resumen`, `faltantes`, `columnas`, `colecciones` y `slotInicial`; `store` rechaza una opción adentro que no cuelgue del menú de arriba; `update` acepta cambios parciales (el interruptor manda solo `active`); `reorder` devuelve `back()` en vez de JSON; nuevo `copiar`. El texto se guarda sin etiquetas HTML y se rechazan `javascript:`, `data:` y `vbscript:`.
- `StoreLayout.jsx`: `EnlaceMenu` (interno/externo/sin enlace y «abrir aparte») en la barra de arriba, sus opciones, la lista del celular y el pie.
- Tests: `src/tests/Feature/MenusAdminTest.php` (13 casos).
- **Revisión visual:** vista previa estática de los tres menús con los datos reales (esbuild + `renderToStaticMarkup`) a 1440 px, sin iniciar sesión en el panel. El enlace de afuera se probó en la tienda real: sale como `<a target="_blank" rel="noreferrer">`.

## Páginas (admin)

Tienda online → **Páginas** (`/admin/sitio/paginas`). Diagrama: [`diagramas/paginas.html`](diagramas/paginas.html).

**Para qué sirve.** Son las páginas de **solo texto** de la tienda: Nosotros, Garantía, Envíos, Política de privacidad, Términos. Sirven para explicarle algo al cliente; no llevan productos ni formularios. Cada una vive en `/paginas/…` y, si está encendida, **aparece sola en la columna «Información» del pie de página**, en el orden del listado. Si le pones un enlace propio en «Menú» (en el pie), deja de listarse sola para no repetirse.

**Qué faltaba antes del 2026-09-16**
- **No se podían crear ni borrar páginas.** Solo se editaban las cinco que dejó el seeder: para agregar «Cómo comprar» o «Cambios y devoluciones» había que tocar la base. Ahora se crean desde el listado (nacen apagadas, para escribir con calma) y se borran con confirmación.
- No había forma de **ordenarlas** desde el listado —solo un campo «Posición» escondido en una pestaña— ni de **encenderlas y apagarlas** sin entrar a editar. Ese orden es el que se ve en el pie.
- El listado no decía **dónde aparece cada página** ni cuáles estaban **encendidas y sin texto** (quien entraba veía la página en blanco).
- Al borrar una página, los enlaces del menú que llevaban a ella quedaban apuntando a un 404. Ahora se ocultan solos y el aviso lo dice.
- El título en Google era «Nosotros — Apple Boss»; ahora usa el mismo sufijo que las categorías y las colecciones: **«Nosotros — Apple Boss Cochabamba»**.
- En el resumen del listado, el texto salía pegado («Sobre Apple BossSomos una tienda…») porque al quitar las etiquetas no quedaba espacio entre el título y el párrafo.

**Listado** (`Pages/Admin/Pages/Index.jsx`): PageHeader con «Nueva página» (un `Modal` que solo pide el título; la dirección se arma con él), 3 Stat (páginas, cuántas salen en el pie y cuántas están encendidas sin texto), un aviso por cada página encendida y vacía, `AdminGuide`, y la lista con arrastrar o flechas (se guarda solo), interruptor, «Ver», «Editar» y «Borrar». Cada fila muestra el comienzo del texto y dónde figura. Al costado, la vista previa de la columna «Información» del pie y el acceso a «Menú».

**Pantalla de la página** (`Pages/Admin/Pages/Edit.jsx`): 4 StepCard —título y dirección (en solo lectura), el texto con el editor sencillo (`SimpleEditor`: títulos, negrita, cursiva, listas y enlaces; al pegar desde Word entra sin formatos raros), Google con su vista previa y dónde figura—. Al costado, el interruptor, el guardado, la vista previa del encabezado de la página y el borrado.

**Qué se guarda del texto.** El servidor limpia siempre: solo quedan `p`, `br`, `strong`, `b`, `em`, `i`, `ul`, `ol`, `li`, `h2`, `h3`, `h4` y `a`; los atributos se descartan salvo el `href` del enlace (y `target="_blank"`, que se guarda con `rel="noopener noreferrer"`). Un `href` con `javascript:`, `data:` o `vbscript:` pierde la dirección. Si se pega texto sin ninguna etiqueta, cada bloque separado por una línea en blanco se convierte en un párrafo. Si al final no queda texto, el contenido se guarda vacío y el panel avisa.

**Cambios técnicos**
- `Page`: `SUFIJO_GOOGLE`, `urlPublica()` y `tituloGoogle()`, como en `CatalogCategory` y `CatalogCollection`.
- `PageController`: `store`, `visibilidad`, `reorder` y `destroy` nuevos; `update` ya no recibe `slug` ni `sort_order`; el payload dice dónde figura cada página (`en_informacion` y los menús que la enlazan).
- `PublicPageController` manda `seo_title` con `tituloGoogle()`.
- Tests: `src/tests/Feature/PaginasAdminTest.php` (12 casos).
- **Revisión visual:** vista previa estática de las dos pantallas con los datos reales (esbuild + `renderToStaticMarkup`) a 1440 px, sin iniciar sesión en el panel.

## Preguntas frecuentes (admin)

Tienda online → **Preguntas frecuentes** (`/admin/sitio/faq`). Diagrama: [`diagramas/preguntas.html`](diagramas/preguntas.html).

**Para qué sirve.** Es lo que más te consultan antes de comprar, escrito una vez. Cada pregunta se muestra en **un solo lugar**, y esos lugares son los cuatro que la tienda dibuja de verdad (`Faq::LUGARES`):

| Lugar (`scope`) | Dónde se ve |
|---|---|
| `general` | La sección «Preguntas frecuentes» del final del inicio |
| `producto` | Al final de **todas** las publicaciones, en la sección «Preguntas» |
| `iphone` | El final de `/iphone` |
| `seminuevos` | El final de `/seminuevos` |

Si un lugar se queda sin preguntas encendidas, **esa sección no se dibuja**: la tienda no muestra un título con un hueco debajo.

**Qué estaba mal antes del 2026-09-16**
- El panel ofrecía tres alcances —general, **categoría** y **producto**— y pedía «Slug de categoría» o «ID de publicación». Los scopes `categoria` y `producto` **no los leía nadie**: `scopeForCategoria` y `scopeForProducto` no se usaban en ninguna parte, así que lo que se cargara ahí no se veía nunca.
- Al mismo tiempo, **la ficha del producto, `/iphone` y `/seminuevos` mostraban preguntas escritas dentro del código** (`FAQ_ITEMS` y dos arreglos en los hubs): se veían en la tienda y no se podían editar. La migración `2026_09_16_100000_preguntas_de_producto_y_hubs` las pasó a la base tal cual estaban y borró el alcance `categoria`, que no tenía filas.
- El inicio tenía un `FAQ_FALLBACK` de cuatro preguntas inventadas que aparecía si borrabas todas: el panel decía «0» y la tienda mostraba cuatro. Se quitó; ahora el administrador es dueño de todo lo que lee el cliente.
- La respuesta se guardaba admitiendo algunas etiquetas HTML, pero la tienda la muestra como **texto plano**: quien escribiera `<b>` veía las etiquetas en la tienda. Ahora se guarda como texto simple.
- No se podía ordenar desde la pantalla (la ruta existía), ni esconder una pregunta sin borrarla, y el borrado usaba el `confirm()` del navegador. `reorder` devolvía JSON.

**Pantalla** (`Pages/Admin/Faqs/Index.jsx` + `Components/Admin/faqs.jsx`): PageHeader, cuatro tarjetas (una por lugar, que sirven de acceso y muestran cuántas preguntas se ven), `AdminGuide`, un `Segmented` para cambiar de lugar y la lista de ese lugar con arrastrar o flechas (se guarda solo), interruptor por fila, «Editar» y «Borrar» con confirmación. «Agregar pregunta» abre un `Modal` con la pregunta y la respuesta. Al costado, **«Así se ve en la tienda»** —el acordeón tal cual queda, con la primera abierta— y **«Copiar de otro lugar»**, que trae las que faltan sin repetir.

Cuando el lugar elegido es el inicio y la sección «Preguntas frecuentes» está apagada en Portada, la pantalla lo avisa: esas preguntas no se ven aunque estén encendidas acá.

**Cambios técnicos**
- `Faq`: `LUGARES` (las cuatro claves con su nombre, dónde se ven y su URL) y `deLugar()`, el único lugar donde se consultan; se quitaron `scopeForCategoria` y `scopeForProducto`, que no usaba nadie.
- `PublicCatalogController::show()` manda `faqs`; `HubController::iphone()` y `seminuevos()` también; el inicio usa `Faq::deLugar('general')`.
- `Store/Product.jsx`, `Hubs/IPhone.jsx` y `Hubs/Seminuevos.jsx` dejaron de tener preguntas escritas a mano; si no hay ninguna, no dibujan la sección (en la ficha, además, desaparece del índice lateral).
- Portada: la sección `faq` ahora cuenta como «sin contenido» cuando no hay preguntas del inicio, con su motivo en el listado.
- `FaqController`: `copiar` nuevo; `reorder` devuelve `back()`; `update` acepta cambios parciales (el interruptor manda solo `active`); la pregunta y la respuesta se guardan como texto simple.
- Tests: `src/tests/Feature/PreguntasAdminTest.php` (11 casos).
- **Revisión visual:** vista previa estática de la pantalla con los datos reales (esbuild + `renderToStaticMarkup`) a 1440 px, y las preguntas de la ficha del producto comprobadas en la tienda real, sin iniciar sesión en el panel.

## Servicios (admin)

Tienda online → **Servicios** (`/admin/sitio/servicios`). Diagrama: [`diagramas/servicios.html`](diagramas/servicios.html).

**Para qué sirve.** Son las tarjetas de «Nuestros servicios» del inicio: lo que la tienda ofrece además de vender equipos (diagnóstico, envíos, Trade-In, garantía…). Cada tarjeta tiene ícono, título y una frase, y puede hacer una de tres cosas cuando el cliente la toca (`StoreService::ACCIONES`):

| Acción (`accion`) | Qué hace en la tienda | Botón por defecto |
|---|---|---|
| `ninguna` | Solo informa: la tarjeta no lleva a ningún lado | — |
| `whatsapp` | Abre WhatsApp con «Hola Apple Boss, quiero consultar por: {título}» | «Consultar por WhatsApp» |
| `enlace` | Lleva a una página: de la tienda, una colección, una página informativa u otra dirección | «Ver más» |

La sección se enciende, se mueve y se le cambia el título y la bajada en **Portada** (antes decía siempre «Nuestros servicios»). Sin tarjetas encendidas **no se dibuja**. No es «Servicio técnico» (las órdenes de reparación, `ServicioTecnicoController`): son módulos distintos con nombres parecidos, y la guía de la pantalla lo aclara.

**Qué estaba mal antes del 2026-09-16**
- El inicio tenía un `SERVICES_FALLBACK` con cuatro servicios escritos en el código («Diagnóstico gratuito», «Servicio técnico»…): si ocultabas todos, el panel decía que no había nada y la tienda igual mostraba esas promesas. Se quitó.
- Portada decía «Se ve» aunque no hubiera ningún servicio encendido (contaba los servicios, pero no los usaba para decidir).
- Las tarjetas no llevaban a ningún lado ni podían abrir WhatsApp, y el título de la sección no se podía cambiar.
- La pantalla usaba `axios` sin avisos, `confirm()` para borrar, un `<select>` con la lista de íconos y `reorder` devolvía JSON. El ícono no se validaba: se podía guardar cualquier texto.
- El seeder (`StoreServiceSeeder`) hacía `updateOrCreate` por título: volver a correrlo pisaba lo escrito en el panel y volvía a encender lo que estaba oculto. Ahora solo carga los ejemplos con la tabla vacía.

**Pantalla** (`Pages/Admin/Services/Index.jsx` + `Components/Admin/servicios.jsx`): PageHeader con «Ver en la tienda» (abre `/#servicios`), cuatro tarjetas (en la tienda, ocultos, con botón y el estado de la sección del inicio), `AdminGuide` y la lista en el orden del inicio, con arrastrar o flechas, interruptor, «Editar» y «Borrar» con confirmación. Cada fila dice qué hace la tarjeta, a dónde lleva y qué dice su botón, y avisa si el botón no se va a ver. Debajo, **«Cómo escribir un buen servicio»**: tres consejos con un ejemplo bueno y uno a evitar (título que se entienda solo, frase con lo que gana el cliente, solo lo que se cumple siempre) y cuántas tarjetas conviene tener (3, 4 o 6: las filas quedan completas). Al costado y fijo, **«Así se ve en el inicio»** con las mismas tarjetas que dibuja la tienda.

«Agregar servicio» y «Editar» abren un `Modal` ancho: los 12 íconos para elegir tocando, título y descripción con contador sugerido (30 y 110), «Cuando el cliente toca la tarjeta» con las tres opciones explicadas, el destino con `LinkPicker` y el texto del botón. A la derecha, **la tarjeta tal cual queda**, que cambia mientras se escribe.

Avisos: la sección apagada, programada, vencida o inexistente en Portada; ningún servicio encendido; y el WhatsApp de la tienda apagado con tarjetas que lo usan (con acceso a Configuración de la tienda).

**Cambios técnicos**
- Migración `2026_09_16_120000_servicios_con_boton`: columnas `accion` (por defecto `ninguna`), `enlace` y `boton` en `store_services`.
- `StoreService`: `ICONOS` (los de `SERVICE_ICONS` en `Components/Store/Icons.jsx`; un test compara las dos listas), `ACCIONES`, `accionEnTienda()` (un botón de WhatsApp con el WhatsApp apagado, o un enlace sin dirección, queda en `ninguna`), `textoBoton()`, `mensajeWhatsapp()`, `whatsappActivo()` (la misma regla que comparte `HandleInertiaRequests`) y `paraLaTienda()`, la única consulta de la tienda.
- `ServiceController`: redirecciones con mensaje en vez de JSON; `update` parcial (el interruptor manda solo `active`); valida el ícono y la acción, limpia los textos, rechaza direcciones `javascript:`/`data:`/`vbscript:` y no guarda botón ni dirección que no se usen; manda el estado de la sección del inicio, si el WhatsApp está activo y las colecciones como destino.
- `PublicCatalogController::home()` usa `StoreService::paraLaTienda()`. `Store/Home.jsx`: la sección tiene `id="servicios"`, usa el título y la bajada de Portada, reparte las columnas según la cantidad (`columnasServicios`) y no se dibuja sin tarjetas. La tarjeta vive en `Components/Store/TarjetaServicio.jsx` y la comparten la tienda y el panel. WhatsApp y los otros sitios se abren en otra pestaña; una página de la tienda, en la misma (`esExterno`, que ahora vive en `Components/Store/enlaces.js` y usa también el menú).
- Portada (`HomeSectionController` y `PortadaModal`): la sección `services` acepta `titulo` y `subtitle`, y cuenta como «sin contenido» sin servicios encendidos, con el motivo «No hay servicios encendidos.».
- De paso, en otros módulos:
  - `LinkPicker` ofrece también las **páginas informativas** encendidas (Nosotros, Garantía, Envíos…) en su propio grupo, en Menú, Portada, Categorías y Servicios; el menú las nombra por su título.
  - Las secciones del inicio con `id` (`#servicios`, `#faq`) tienen margen de desplazamiento: al abrirlas desde otra página, el título ya no queda tapado por el encabezado fijo (se midió a 390 y 1440 px).
  - `ModalEliminar` acepta `advertencia`: en Preguntas, Menú, Colecciones y Páginas decía «Se borra del inventario», que no es cierto ahí, y el detalle largo se cortaba en una línea.
- Tests: `src/tests/Feature/ServiciosTiendaAdminTest.php` (16 casos). No confundir con `AdminServiciosTest` (Servicio técnico).
- **Revisión visual:** vista previa interactiva de la pantalla con los datos reales (esbuild con la pantalla y los props sacados con tinker) a 1440 y 390 px, con el modal abierto; y la tienda real con dos botones puestos por un momento (WhatsApp y `/seminuevos`), que después se dejaron como estaban. Sin iniciar sesión en el panel.

## Ubicaciones (admin)

Tienda online → **Ubicaciones** (`/admin/sitio/ubicaciones`). Diagrama: [`diagramas/ubicaciones.html`](diagramas/ubicaciones.html).

**Para qué sirve.** Son los locales de la tienda: dirección, horario, contacto y mapa. Desde el 2026-09-16 es **el único lugar** de esos datos:

| Dónde se usa | Qué toma |
|---|---|
| Inicio, sección «Dónde estamos» (`#contacto`) | Todos los locales encendidos, en el orden de la lista; con más de uno, se eligen con botones |
| Pie de página | La dirección del local principal (con enlace a «Cómo llegar») |
| Franja de confianza, ficha del producto | La ciudad del local principal («Visítanos en…», «punto de entrega en…») |
| Google (JSON-LD `Store` en el inicio) | Cada local con su dirección, teléfono, mapa y horario día por día (`openingHoursSpecification`) |

El **principal** es el primero encendido de la lista: se cambia arrastrando. El título y la bajada de «Dónde estamos» se cambian en Portada.

**Qué estaba mal antes del 2026-09-16**
- **Dos fuentes para lo mismo.** La dirección, la ciudad, el país y el horario estaban en Ubicaciones y también en Configuración, y la tienda las mezclaba: si el local no tenía horario, el inicio mostraba el de Configuración; Google, el pie, la franja y la ficha solo leían Configuración.
- **Datos de ejemplo presentados como reales.** El horario que se veía en el inicio y que leía Google («Lunes a sábado de 9:00 a 19:00») y la dirección «Cochabamba, Bolivia» eran los valores que cargó la instalación el 2026-08-25 y nunca se editaron. La migración `2026_09_16_140000_ubicaciones_fuente_unica` pasa al local principal solo lo que el administrador escribió en Configuración (no había nada) y borra esas cuatro claves. **Hay que cargar el horario real.**
- El inicio mostraba un texto fijo («Puedes venir a ver los equipos en persona…») si el local no tenía descripción, y «Consultar en tienda» si no había WhatsApp. Sin locales encendidos, la sección se dibujaba igual con los datos de Configuración y un recuadro gris.
- El **teléfono** se pedía en el panel y no se mostraba en ningún lado. El WhatsApp del local se usaba tal cual se escribía (con `+` o espacios el enlace no abría).
- Solo se veía **un** local (el elegido en Portada o el primero): un segundo local encendido no salía en ninguna parte. El `titulo` de la sección se guardaba y no lo usaba nadie.
- Borrar la ciudad rompía el guardado (la columna no acepta vacío), el borrado usaba `confirm()`, «Crear» dejaba el formulario en blanco después de guardar y no se podía ordenar ni ocultar desde el listado.
- `StoreLocationSeeder` hacía `updateOrCreate` y pisaba lo cargado en el panel.

**Pantallas**
- **Listado** (`Pages/Admin/Locations/Index.jsx`): PageHeader con «Ver en la tienda» y «Agregar ubicación», cuatro tarjetas (en la tienda, principal, datos completos y la sección del inicio), `AdminGuide`, avisos (sección apagada o programada en Portada, ningún local encendido, qué le falta al principal) y la lista para arrastrar con interruptor, «Editar» y «Borrar». Cada fila dice su dirección, su horario y qué le falta. Debajo, **«Cómo cargar un local que dé confianza»**: una dirección para llegar sin preguntar, el horario real día por día e igual que en Google Maps, cada uno con un ejemplo bueno y uno a evitar, y el dato de que la ficha de Google Maps se crea gratis en el Perfil de Empresa de Google. Al costado y fijo, **«Así se ve en el inicio»**.
- **Formulario** (`Pages/Admin/Locations/Edit.jsx`), en cuatro pasos: el local (nombre, dirección con aviso si solo dice la ciudad, ciudad, país y descripción), el **horario día por día** (abierto o cerrado, uno o dos tramos, «Copiar el lunes de martes a viernes», aviso en el momento si una hora no cierra, y una aclaración como «Feriados: cerrado»), el contacto (teléfono y WhatsApp del local, con aviso si el WhatsApp de la tienda está apagado) y el mapa (**los pasos exactos de Google Maps**, sacados de su ayuda oficial: «Compartir» → «Insertar un mapa» → «Copiar HTML», y «Enviar un enlace» → «Copiar enlace», con la vista previa del mapa). Al costado: el interruptor, **«Lo que ve el cliente»** (dirección con calle, horario, teléfono o WhatsApp, mapa y «Cómo llegar», cada uno con «Listo» o «Falta») y la vista previa de «Dónde estamos», que cambia mientras se escribe.

**Cambios técnicos**
- Migración `2026_09_16_140000_ubicaciones_fuente_unica`: columna `horarios` (JSON, siete días con `abierto` y hasta dos `tramos`); `hours` queda como aclaración en texto. Pasa a la ubicación principal lo escrito a mano en Configuración (compara `updated_at` con `created_at`) y borra `tienda_direccion`, `tienda_ciudad`, `tienda_pais` y `tienda_horario`. El `down()` las vuelve a crear con los datos del principal.
- `StoreLocation`: `principal()`, `paraLaTienda()` (la única consulta pública), `publico()`, `horariosAbiertos()` (normaliza «9:00» a «09:00»; sin días abiertos, lista vacía), `telefonoUrl()` (formato internacional; un número boliviano de 8 dígitos se completa con +591) y `datosParaGoogle()`. El WhatsApp de cada local sigue al interruptor de WhatsApp de la tienda.
- `LocationController`: validación del horario día por día con mensajes por día, WhatsApp solo con dígitos y código de país, mapa solo de Google (acepta el `<iframe>` completo), «Cómo llegar» con `https://`, ciudad y país obligatorios; `update` parcial (interruptor), `reorder` nuevo (ruta `admin.locations.reorder`) y redirecciones con mensaje.
- `HandleInertiaRequests`: `tienda_ciudad`, `tienda_pais`, `tienda_direccion`, `tienda_mapa` y `tienda_local` salen del local principal; `tienda_horario` ya no existe.
- Tienda: `PublicCatalogController::home()` manda `locations` (también con la sección apagada, porque alimentan los datos para Google). `Components/Store/Ubicacion.jsx` (`FichaUbicacion`, `MapaUbicacion`, `SelectorLocales`, `direccionCompleta`) y `Components/Store/horario.js` (`lineasHorario`, `estadoAhora` con la hora de Bolivia —«Abierto ahora · cierra a las 19:00», «Cerrado ahora · abre mañana a las 9:00»—) los comparten la tienda y el panel. Sin mapa, «Dónde estamos» va a una columna con el botón «Ver en Google Maps». La franja de confianza solo dice «Visítanos en…» si hay un local. Ícono `Phone` nuevo en `Icons.jsx`.
- Portada: la sección `location` ya no elige local (`location_id` se quitó); acepta `titulo` y `subtitle`, y sin locales encendidos dice «No hay ubicaciones encendidas.». El texto de Configuración ahora aclara que la dirección y el horario se cargan en Ubicaciones.
- Tests: `src/tests/Feature/UbicacionesAdminTest.php` (14 casos). El formato del horario y «Abierto ahora» se probaron con Node (lunes a viernes, horario cortado, fin de semana y días siguientes).
- **Revisión visual:** vista previa interactiva del listado y del formulario con los datos reales, a 1440 y 390 px (en celular las horas se salían de la tarjeta y se corrigió). En la tienda real se cargaron por un momento un horario, un teléfono y un segundo local: se vio el cambio entre locales, «Cerrado ahora · abre hoy a las 9:00», el teléfono y los datos para Google con los dos locales. Después se dejó todo como estaba. Sin iniciar sesión en el panel.

## Novedades (admin)

Tienda online → **Novedades** (`/admin/novedades`). Diagrama: [`diagramas/novedades.html`](diagramas/novedades.html).

**Para qué sirve.** Son las publicaciones con fecha de la tienda: un equipo que llegó, una guía corta o un aviso. Cada una tiene título, resumen, foto, texto y su título en Google, y se ve en estos lugares:

| Dónde | Qué muestra |
|---|---|
| `/novedades` | Todas las publicadas, de la más nueva a la más vieja; la más nueva va grande arriba |
| `/novedades/{dirección}` | La novedad completa: fecha, autor, tiempo de lectura, foto, texto, «Compartir por WhatsApp» y «Otras novedades» |
| Inicio, sección «Novedades» de Portada | Las más nuevas (3 por defecto); el título y la cantidad se cambian en Portada |
| Menús y sitemap | El enlace a `/novedades` aparece solo cuando hay alguna publicada |
| Google | Título con el sufijo común, descripción, foto y datos `BlogPosting` |

**Estados** (`Novedad::estado()`):
- **Borrador:** nadie la ve. Su dirección se puede cambiar.
- **Publicada:** se ve desde su fecha (vacía: desde que se guarda). Desde la primera publicación la dirección queda fija (`direccionFija()`: ya tiene `published_at`), porque es el enlace que se compartió.
- **Programada:** publicada con fecha futura; se publica sola a esa hora (hora de Bolivia).

Sin texto no se puede publicar, ni desde el editor ni desde el interruptor del listado.

**Qué estaba mal antes del 2026-09-16**
- **Una página vacía enlazada.** No había ninguna novedad, pero el pie tenía el enlace «Novedades» encendido y el sitemap listaba `/novedades`: el cliente y Google llegaban a «No hay novedades publicadas aún».
- **Otra estética.** `/novedades` y cada novedad usaban un tema oscuro propio (fondo `#060D1F`, texto blanco), distinto del resto de la tienda, y un subtítulo fijo («Lanzamientos, guías, comparativas y noticias…») que el panel no controlaba. El inicio no mostraba novedades.
- **Campos engañosos.** El panel pedía una «Posición» (`sort_order`) que la tienda ignoraba (ordena por fecha) y decía «Fecha vacía = hoy», pero la guardaba vacía. `og_image` no se podía cargar en ningún lado.
- **Foto sin procesar.** Se subía aparte con `axios` a una ruta que devolvía JSON, sin achicarla, y nunca se borraba (al cambiarla o borrar la novedad quedaba en el disco).
- **Al editar se desordenaba el cuerpo:** el formulario juntaba los bloques de texto y mandaba las imágenes y citas al final.
- Diseño anterior (Bootstrap), `confirm()` para borrar, sin vista previa ni forma de saber dónde se veía. El título en Google usaba «| Apple Boss Bolivia» en vez del sufijo común, y `Novedad.jsx` armaba un título que no usaba.

**Pantallas**
- **Listado** (`Pages/Admin/Novedades/Index.jsx`):
  - PageHeader con «Nueva novedad» (un `Modal` con el título: se crea como borrador y abre el editor) y «Ver en la tienda».
  - Cuatro tarjetas: publicadas, programadas (con la próxima fecha), borradores y lo que muestra hoy el inicio.
  - Avisos: novedades publicadas o programadas sin foto, y la sección del inicio apagada con novedades publicadas.
  - `AdminGuide` y la lista: arriba las programadas (la más próxima primero), después los borradores y al final las publicadas. Buscador por título, filtros (publicadas, programadas, borradores, sin foto), miniatura, fecha, tiempo de lectura, lo que le falta (texto, resumen, foto), interruptor Publicada/Borrador, «Ver», «Editar» y «Borrar» con `ModalEliminar`.
  - Debajo, **«Cómo escribir una buena novedad»**: cuatro consejos con un ejemplo bueno y uno a evitar.
  - Al costado, **«Así se ven en el inicio»** con la tarjeta real y **«Dónde se ven»**: la página, el inicio y los menús, cada uno con «Se ve» o el motivo, y acceso a Portada y Menú.
- **Editor** (`Pages/Admin/Novedades/Edit.jsx`), en cuatro pasos:
  1. Título, dirección (editable mientras sea borrador; con candado después), resumen y autor.
  2. Foto principal: vista previa 16:9, aviso si mide menos de 1200 px o es vertical, «Quitar foto».
  3. Texto con `SimpleEditor`, con palabras y minutos de lectura.
  4. Google: título, descripción, «Mostrarla en Google» y cómo se vería.

  Al costado: **Publicación** (Borrador o Publicada, fecha y hora para programar, qué pasa al guardar y la lista Texto, Resumen, Foto y Google con Listo o Falta), **«Así se ve la tarjeta»** con `TarjetaNovedad`, «Dónde se ven las novedades» y «Borrar esta novedad».

**Cambios técnicos**
- Migración `2026_09_16_160000_novedades_cableadas`:
  - columnas `imagen_original`, `imagen_card`, `imagen_detalle` e `imagen_meta` (una foto que ya estuviera en `/storage` se conserva);
  - quita `featured_image`, `og_image` y `sort_order`;
  - suma la sección `news` («Novedades») del inicio antes de las preguntas frecuentes, encendida. `HomeSectionSeeder` también la tiene.
- `Novedad`: `estado()`, `direccionFija()`, `urlPublica()`, `urlImagen()`, `cuerpoHtml()`, `bloquesConCuerpo()` (el texto del editor reemplaza los bloques de texto y títulos; las imágenes y citas quedan donde estaban), `textoPlano()`, `palabras()`, `minutosLectura()` (200 palabras por minuto), `faltantes()`, `tarjeta()`, `paraLaTienda()` (la única consulta de la tienda) y `datosParaGoogle()` (`BlogPosting`: autor como persona si se escribió, si no la tienda).
- `ImagenNovedadService` (trait `ProcesaImagenes`): guarda el original y dos variantes WebP (`card` hasta 960 px y `detalle` hasta 1920 px) y borra los archivos al reemplazar, quitar o borrar. Acepta JPG, PNG o WebP de al menos 1200 px de ancho y hasta 10 MB.
- `NovedadController`:
  - `store`: borrador con dirección libre;
  - `update`: la foto va en el mismo formulario (`forceFormData` y `_method=patch`); el texto se limpia con una lista blanca de etiquetas y enlaces seguros; el texto pegado sin formato se parte en párrafos; mensajes en español;
  - `publicacion`: el interruptor del listado (ruta `admin.novedades.publicacion`);
  - `destroy` borra también la foto.
  - Se quitaron `create`, `uploadImage` y sus rutas, y las pantallas `Create.jsx` y `NovedadForm.jsx`.
- `NovedadPublicController`: `index` (con `noindex` si no hay publicadas) y `show` (título, descripción, foto y `noindex` para Google, `datosGoogle` y tres relacionadas).
- Tienda: `Components/Store/TarjetaNovedad.jsx` la comparten el inicio, `/novedades`, «Otras novedades» y el panel. `Pages/Store/Novedades.jsx` y `Novedad.jsx` pasaron a la estética del resto (encabezado azul con los círculos de la marca, fondo claro). `Home.jsx` dibuja la sección `news` solo con novedades.
- Portada: tipo `news` en `HomeSection::TYPES` (3 por defecto), con título, bajada y «Cuántas novedades muestra» en el modal, y el motivo «No hay novedades publicadas.».
- Enlaces y Google:
  - `NavMenuItem::serializeSlot()` oculta los enlaces a `/novedades` mientras no haya ninguna publicada;
  - el sitemap lista `/novedades` solo con alguna publicada e indexable;
  - el pie de respaldo del layout ya no la enlaza fija;
  - títulos: «Novedades — Apple Boss Cochabamba» y «{título} — Apple Boss Cochabamba».
- Tests: `src/tests/Feature/NovedadesAdminTest.php` (13 casos).
- **Revisión visual:** vista previa interactiva del listado y del editor (publicada y borrador) con los props reales, a 1440 y 375 px. En la tienda real se cargaron cinco novedades temporales (dos con foto de prueba, una programada y un borrador) para ver `/novedades`, la ficha, el inicio y el celular. Se corrigieron la fila del listado, que quedaba apretada a 1440 px, y la foto de la ficha, que quedaba debajo del encabezado (el encabezado es `relative`: la foto necesita `relative z-10`). Después se borraron las novedades y sus archivos. Sin iniciar sesión en el panel.

**Lo que tiene que hacer el usuario:** escribir y publicar la primera novedad. Hasta entonces, la sección del inicio, el enlace del pie y el sitemap no llevan a `/novedades`.

## Trade-In (admin)

Tienda online → **Trade-In** (`/admin/trade-in`) y el formulario público `/trade-in`. Diagrama: [`diagramas/tradein.html`](diagramas/tradein.html).

**Para qué sirve.** El cliente cuenta cómo está el equipo que quiere entregar como parte de pago y recibe por WhatsApp un valor estimado. **Se recibe de todo:** equipos Apple y también celulares Android, laptops, PC de escritorio (gamer o armadas), consolas y otros equipos (pedido del usuario, 2026-09-16). Pedido del usuario (2026-09-16): que el formulario sea profesional y completo, con el bypass y todo lo que cambia el valor, para que la cotización se acerque al valor que se confirma al revisar el equipo en la tienda.

**Cómo llega el cliente** (el panel lo muestra en «Por dónde llega el cliente»):
- **Siempre:** el acceso «Trade-In» de la barra de arriba y de los accesos rápidos del celular.
- La sección «Trade-In» del inicio (Portada), los enlaces de «Menú» y las tarjetas de «Servicios» que lleven a `/trade-in`.

**Arriba del formulario**, el hero azul («Cotiza tu equipo») deja el contenido dentro del contenedor de 1224 px y se anima en dos lugares (`Components/Store/FloatingDevices.jsx`, pedido del usuario):
- **En los márgenes de afuera** del contenedor, desde 1500 px de ancho: siluetas de equipos Apple y de otras marcas (celular Android, laptop gamer, PC y control de consola, con formas genéricas) que se dibujan al entrar, flotan, siguen un poco al puntero, y un punto va y vuelve entre dos equipos pasando por el ícono de canje.
- **A la derecha del texto**, dentro del contenedor, desde 1280 px (`EquipoEnRevision`): un equipo que se dibuja, una línea que lo recorre y seis etiquetas que se marcan con los puntos que revisa el formulario para ese tipo. Cada 8 segundos pasa al siguiente: iPhone, celular Android, laptop y consola. Las etiquetas tienen fondo sólido para que las órbitas no crucen el texto.
- Con menos ancho solo se mueven dos luces suaves y una trama de puntos; con «reducir movimiento» todo queda quieto y con las etiquetas marcadas.

**El formulario** (`Pages/Store/TradeIn.jsx`), en seis pasos. Las preguntas salen de `App\Support\TradeIn\Cuestionario`, la única fuente: el formulario las recibe, el servidor valida con ellas y el panel arma el resumen con las mismas palabras. Los tipos van en dos grupos, **Apple** (iPhone, iPad, MacBook, Mac, Apple Watch y AirPods) y **Otras marcas** (Celular Android, Laptop, PC de escritorio, Consola y Otro), y cada uno ve solo lo que le corresponde. En otras marcas se pide la marca, con sugerencias (`Cuestionario::MARCAS`).

| Paso | Qué pregunta |
|---|---|
| Tu equipo | Tipo, marca (otras marcas), modelo (sugiere los nombres de la base de modelos y, si coincide, ofrece sus capacidades, memorias y colores reales), almacenamiento, memoria RAM (Mac, Android, laptop y PC), **procesador** (obligatorio) y **tarjeta gráfica** (laptop y PC) y color |
| Cuenta y bloqueos | Apple: cuenta de Apple y **bypass**. Android: cuenta de Google o de la marca y bypass («quitar FRP»). Celulares: si está liberado y bloqueo de IMEI. Laptop y PC: contraseña de BIOS o bloqueo. Consola: cuenta desvinculada, **baneo en línea** y si está modificada. Otro: cuenta o bloqueo. Si fue de una empresa (administración remota) en celulares, iPad y computadoras |
| Funcionamiento | Cada pieza, con «Funciona», «Falla» o «No lo probé»: pantalla táctil, imagen, Face ID, Touch ID o huella, cámaras, sonido, señal, Wi‑Fi, carga, MagSafe, botones, vibración; teclado, trackpad o touchpad y puertos en computadoras; ventiladores y estabilidad con juegos en laptop, PC y consola; controles (drift) en consola; Digital Crown y sensores en Apple Watch; auriculares y estuche en AirPods. En consola, además, la lectora de discos (o «No tiene lectora») |
| Estado físico | Pantalla (o «No tiene pantalla» en Mac mini, PlayStation, Xbox u otro), bordes, carcasa o gabinete, parte de atrás, vidrios de las cámaras y si se mojó o le cayó líquido, cada uno con una descripción para elegir bien |
| Batería y reparaciones | Capacidad máxima (iPhone y Apple Watch), ciclos (MacBook), cuánto dura (Android y laptop), historial de piezas (iPhone), qué se reparó o mejoró (RAM, disco, gráfica), garantía de Apple o de la marca, cuántos controles entrega (consola), qué entrega con el equipo y un comentario libre |
| Fotos y contacto | Hasta 6 fotos (se achican en el navegador a 1600 px), nombre, WhatsApp, correo, ciudad, qué equipo quiere llevar y la declaración de que el equipo es suyo |

Los caminos de menú que se le dan al cliente salen de la ayuda de Apple para Latinoamérica (support.apple.com/es-lamr), verificada el 2026-09-16: Configuración > Batería > Condición de la batería, «Capacidad máxima» (101575); en Apple Watch, Configuración > Batería > Condición; Configuración > General > Información, «Historial de piezas y servicios», con «Original», «Desconocida», «Sin verificar» y «Usada» (102658); el número de modelo en Configuración > General > Información (106343); los ciclos de una Mac portátil con la tecla Opción, menú Apple > Información del Sistema > Alimentación (102888); y, en la confirmación, cerrar sesión y Transferir o restablecer > Borrar contenido y configuración (109511). El procesador de una computadora con Windows 11 está en Configuración > Sistema > Acerca de, «Especificaciones del dispositivo» (support.microsoft.com, verificada el 2026-09-16). En Android no se da un camino de menú: cambia según la marca y la ayuda de Google no publica uno único.

Lo respondido queda guardado en el navegador (sin fotos) por si se cierra la página, con «Empezar de nuevo». Un campo oculto frena a los robots.

**La confirmación** (`Pages/Store/TradeInConfirmacion.jsx`) muestra el código, qué sigue y cómo preparar el equipo según el tipo (iPhone o iPad con los caminos de Apple; Android, computadora, consola u otro con pasos generales), con el WhatsApp de la tienda. **Solo la ve el navegador que envió la solicitud** (la sesión recuerda las últimas cinco) y no se indexa.

**En el panel**
- **Listado** (`Pages/Admin/TradeIn/Index.jsx`): cuatro tarjetas (nuevas con las demoradas, en curso, completadas este mes y llegadas este mes), avisos (nuevas con más de 24 h sin respuesta, aceptadas sin recibir), `AdminGuide`, buscador (código, cliente, equipo o teléfono), filtros por etapa y cada solicitud con su etapa, su **grado sugerido**, lo crítico (por ejemplo «Tiene bypass»), cuántos puntos hay que revisar, las fotos, el valor y los botones «WhatsApp» y «Ver solicitud». Debajo, «Cómo responder una solicitud» (cuatro consejos con ejemplo bueno y a evitar). Al costado, «Por dónde llega el cliente» y «Al recibir un iPhone o iPad».
- **Detalle** (`Pages/Admin/TradeIn/Show.jsx`): «Antes de cotizar» con el grado y las alertas en tres grupos («Puede que no se reciba», «Baja el valor o hay que confirmarlo», «No lo probó»), el equipo (marca, modelo, almacenamiento, memoria, procesador y gráfica si los hay) con el enlace a la ficha del modelo en la comparativa, las respuestas por paso, el comentario del cliente, las fotos (privadas; las HEIC se descargan) y el historial. Al costado: el cliente con el **mensaje de WhatsApp editable**, el seguimiento (etapa con su explicación, valor estimado, nota para el cliente y notas internas), «Registrar el equipo» en el inventario al aceptarse o completarse, la revisión al recibirlo y «Borrar la solicitud».
- **Etapas:** Nueva → Esperando respuesta → En conversación → En revisión → Cotizada → Aceptada → Completada, o Cerrada sin acuerdo. Abrir WhatsApp desde el panel deja constancia y pasa una nueva a «Esperando respuesta».
- **Grado sugerido** (`Cuestionario::grado()`): «Revisar antes de cotizar» con una cuenta que no se puede quitar, bypass, reporte de IMEI, contraseña de BIOS, baneo, placa reparada o si no enciende; «Con fallas o daños» si algo falla (también la lectora) o está roto; «Buen estado, con uso visible» con rayas o golpes visibles, batería bajo 80 % o que dura muy poco; «Muy buen estado» con marcas leves, batería entre 80 y 89 % o que dura menos de un día; y «Como nuevo». Sale solo de lo que declaró el cliente.
- **Avisos:** cada solicitud crea un aviso en el Resumen («Nueva solicitud de Trade-In», lleva a la solicitud) y el menú del panel muestra junto a «Trade-In» cuántas hay sin responder.

**Qué estaba mal antes del 2026-09-16**
- **Datos del cliente expuestos:** `/trade-in/confirmacion/{código}` mostraba el nombre y el teléfono a cualquiera, y el código es correlativo (AB-TI-000001, 000002…).
- **El botón de WhatsApp de la confirmación estaba roto:** armaba `wa.me/[object Object]` y aparecía aunque el WhatsApp de la tienda estuviera apagado.
- **Formulario corto y ambiguo:** un estado físico general, siete interruptores de sí o no (con preguntas de pantalla y cámara también para AirPods), la batería con «Encontralo en Ajustes → Batería → Salud de la batería» (voseo y nombres que no son los de Apple para Latinoamérica), sin cuenta, bypass, IMEI, operador, reparaciones, piezas, humedad ni fotos. El teléfono aceptaba cualquier texto.
- **Solo equipos Apple:** el título decía «Cotiza tu equipo Apple» y los tipos eran de Apple, pero la tienda recibe de todo (celulares Android, PC gamer, consolas…).
- **El panel no avisaba** que llegó una solicitud, no había forma de escribirle al cliente, ni historial, ni borrado (solicitudes falsas o pedido del cliente), y el buscador usaba `ilike` (solo PostgreSQL). Diseño anterior (Bootstrap), con ocho etapas sin explicar.

**Cambios técnicos**
- Migración `2026_09_16_180000_trade_in_cuestionario_y_seguimiento`: `respuestas`, `fotos` e `historial` (JSON), `ciudad` e `interes`; convierte y quita las columnas sueltas de antes (enciende, pantalla_rota, estado_fisico, salud_bateria…); `system_notifications.trade_in_id`.
- `App\Support\TradeIn\Cuestionario`: `APPLE`, `OTRAS_MARCAS`, `MARCAS`, capacidades y memorias por tipo; preguntas de tipo `opcion`, `multiple`, `numero`, `componentes` y `texto` (procesador y gráfica, en el paso «Tu equipo»); `preguntas()`, `paraTipo()`, `paraFormulario()` (sin los niveles internos), `reglas()` y `mensajes()` (en español, por pregunta), `limpiar()` (solo lo del tipo; «Nunca se reparó» no va con otra opción), `alertas()`, `grado()` y `resumen()`.
- `TradeInSolicitud`: etapas con `ETIQUETAS` y `ABIERTAS`, `demorada()` (24 h), `dispositivo()` (suma la marca si el modelo no la nombra: «Samsung Galaxy S23», pero «Xbox Series X»), `whatsapp()` (un celular boliviano de 8 dígitos suma 591; un fijo queda sin WhatsApp), `mensajeWhatsapp()` (con el valor estimado y la nota si ya se cargaron) y `registrar()` para el historial.
- `FotosTradeInService`: disco privado `local`, carpeta `trade-in/{código}`, hasta 6 fotos de 10 MB (JPG, PNG, WebP o HEIC); se sirven con la ruta `admin.trade-in.foto` y se borran con la solicitud.
- `TradeInController` (público) y `TradeInAdminController`: `contacto`, `foto` y `destroy` nuevos; `update` registra etapa, valor y quién la atiende. La marca es obligatoria fuera de Apple (en Apple se guarda «Apple») y la memoria se guarda para todo tipo con `MEMORIAS`. «Registrar el equipo» solo lleva al inventario en tipos Apple.
- `HandleInertiaRequests` comparte `avisosAdmin` (solo para administradores); `AdminLayout` dibuja el número; el Resumen conoce el tipo `trade_in`. Íconos `Tablet` y `PcTower` en `Icons.jsx` (el control usa `Gamepad`, que ya estaba). Título en Google «Trade-In: cotiza tu equipo — Apple Boss Cochabamba», con una descripción que nombra todas las marcas; el texto por defecto de la sección del inicio también.
- Tests: `src/tests/Feature/TradeInTest.php` (13 casos, uno con una consola, una laptop y un celular Android).
- **Revisión visual:** el formulario real a 1440 y 375 px con borradores cargados en el navegador, y **un envío real** con una foto de 3,2 MB (quedó en 28 KB, en el disco privado, con el aviso del Resumen y la confirmación). Vista previa del listado y del detalle del panel con esa solicitud y otra con bypass, pantalla rota y batería al 76 %. Se corrigieron los pasos que se veían hechos sin tipo de equipo, el contador de respuestas, la confirmación que abría abajo y la ubicación del grado. Después se borraron las solicitudes, sus fotos y sus avisos. Sin iniciar sesión en el panel.
- **Segunda vuelta (todas las marcas y hero animado):** capturas de Chrome sin interfaz a 1920, 1728, 1536, 1440, 1280 y 390 px, en distintos momentos del ciclo (iPhone, Android, laptop y consola) y durante el dibujo de las siluetas; el paso «Tu equipo» con Laptop a 1440 y con Consola a 390; y un envío real de una laptop Lenovo cargando el borrador en el navegador y pulsando «Enviar solicitud» (llegó con marca, procesador, memoria, grado «Con fallas o daños», alertas y aviso; la confirmación mostró los pasos para computadoras). Se corrigió que las órbitas se veían a través de las etiquetas. Después se borró la solicitud.

## Configuración (admin)

Tienda online → **Configuración** (`/admin/configuracion/tienda`). Diagrama: [`diagramas/configuracion.html`](diagramas/configuracion.html).

**Para qué sirve.** Los datos generales de la tienda: el WhatsApp con el que le escribe el cliente y la identidad que acompaña a todas las páginas. Desde el 2026-09-16 tiene solo lo que la tienda lee de verdad y que no es de otro módulo:

| Dato | Dónde se ve |
|---|---|
| **WhatsApp** (interruptor, número y mensaje) | El botón verde que flota en toda la tienda, el botón de «Cotizar por WhatsApp» del carrito, el de cada ficha de producto, los de las tarjetas de Servicios y los de cada local |
| **Nombre de la tienda** | El encabezado, el pie de página, el copyright, cada mensaje de WhatsApp («Hola Apple Boss, …»), las volantas de los hubs y la comparativa, y los datos del negocio que lee Google |
| **Frase del pie** | Debajo del nombre, al final de todas las páginas |
| **Barra de anuncio** | La franja de arriba de todas las páginas. Vacía, no se dibuja |
| **Descripción corta** | Solo los datos para Google (`Store`) cuando todavía no hay ningún local cargado |

El resto se carga en su propia pantalla, y la de Configuración lo dice con un botón para ir: la dirección, el horario, el teléfono y el mapa en **Ubicaciones**; el título y la descripción de cada página en Google en **Google y redes sociales**; el texto del inicio y el orden de sus secciones en **Portada**.

**Qué estaba mal antes del 2026-09-16**
- **El nombre de la tienda no lo usaba casi nadie.** Se pedía en el panel, pero «Apple Boss» estaba escrito a mano en unos 30 lugares de la tienda: el encabezado, el pie, el copyright, todos los mensajes de WhatsApp, las volantas de los hubs, la franja de confianza, la tarjeta de novedades y el texto de la comparativa. Cambiarlo en el panel solo cambiaba un dato de Google. Ahora sale de un solo lugar (`Components/Store/tienda.js`).
- **La barra de anuncio tenía el texto escrito en el código.** La tienda dibujaba siempre «Equipos revisados · Stock real · Atención en Bolivia» y lo que se escribía en el panel no llegaba a ningún lado. Ahora manda el panel y, sin texto, la barra no se dibuja.
- **Dos campos del «Texto del home» que nadie mostraba.** `hero_titulo` y `hero_subtitulo` se editaban acá, pero el hero del inicio es el carrusel de productos y su botón se configura en Portada. Se quitaron.
- **El SEO del inicio, repetido.** `seo_titulo_home` y `seo_descripcion_home` seguían en Configuración aunque la migración de `seo_pages` ya los había pasado a «Google y redes sociales», que es de donde los lee `App\Support\Seo`. Lo que se escribía acá no cambiaba ni el título ni la metaetiqueta: el título iba a una prop `title` de `StoreLayout` **que el layout nunca usó** (ocho páginas se la pasaban). Se quitaron las dos claves y la prop muerta. Los otros tres ajustes de SEO (`seo_sitio_nombre`, `seo_descripcion_default` y `seo_og_imagen_default`) siguen en la base, pero se editan solo en «Google y redes sociales», que además sube la imagen.
- **Guardar no validaba nada.** El `update` recorría `$request->all()` y escribía cualquier valor de cualquier clave existente: el interruptor de WhatsApp era un campo de texto donde se podía escribir cualquier cosa, el número aceptaba «+591 759-04313» (con eso `wa.me` no abre), nada tenía largo máximo y no se limpiaba el HTML.
- **La pantalla no seguía la línea del panel:** dibujaba los campos sola a partir del `grupo` y la `etiqueta` de la base, con emojis por título y un `textarea` si el texto pasaba de 80 caracteres. Sin guía, sin avisos, sin vista previa y sin decir dónde se ve cada dato.

**Pantalla** (`Pages/Admin/Configuracion/Tienda.jsx` + `Components/Admin/configuracion.jsx`): PageHeader con «Ver la tienda», cuatro tarjetas (WhatsApp con el número, nombre de la tienda, barra de anuncio y cuántos botones de servicios y locales usan el WhatsApp), `AdminGuide` y avisos (el WhatsApp apagado con botones que lo usan; ningún local encendido, con acceso a Ubicaciones). El formulario va en dos `StepCard`: **WhatsApp** (interruptor en la cabecera, número que solo acepta dígitos, el enlace `wa.me/…` armado al lado y el mensaje del botón verde) y **La tienda** (nombre, frase del pie, barra de anuncio y descripción corta), cada campo con su contador y una nota de dónde se ve. Debajo, **«Cómo escribir estos datos»** (tres consejos con un ejemplo bueno y uno a evitar, y cómo probar el número en wa.me) y **«Esto se carga en otra pantalla»**, con el botón a cada módulo. Al costado y fijo, **«Así se ve en la tienda»**: la barra de anuncio, la columna de marca del pie con el copyright y el botón de WhatsApp con su mensaje, que cambian mientras se escribe. La barra de abajo dice «Hay cambios sin guardar» y el botón se apaga cuando no hay nada que guardar.

**Cambios técnicos**
- Migración `2026_09_16_170000_configuracion_solo_lo_que_usa_la_tienda`: borra `hero_titulo`, `hero_subtitulo`, `seo_titulo_home` y `seo_descripcion_home` (lo escrito a mano en las dos de SEO pasa antes a la fila `store.home` de `seo_pages` si ahí estaba vacío) y mueve `anuncio_barra` al grupo `tienda`. El `down()` las vuelve a crear.
- `ConfiguracionTienda`: `CLAVES` (lo que se edita en esta pantalla, con su valor por defecto), `nombre()` (nunca vacío), `saludoWhatsapp()` y `paraLaTienda()`, la única consulta que hace el middleware.
- `ConfiguracionTiendaController`: validación con mensajes en español (número de 8 a 15 dígitos y obligatorio con el WhatsApp encendido, nombre obligatorio, largos máximos), textos limpios con `strip_tags`, y manda a la pantalla los valores, los largos y el contexto (cuántos servicios y locales usan el WhatsApp, y la ciudad del local principal).
- `Components/Store/tienda.js`: `nombreTienda()`, `useNombreTienda()` y `saludoWhatsapp()`. `useWhatsApp()` suma `saludo`. `StoreService::mensajeWhatsapp()` y `App\Support\Seo` usan el nombre del panel. Se quitó `AppleBossLogo`, un componente de `StoreLayout` que no usaba nadie.
- `HandleInertiaRequests` comparte `anuncio_barra` y ya no comparte `hero_titulo`, `hero_subtitulo`, `seo_titulo_home` ni `seo_descripcion_home`.
- La vista previa de Ubicaciones y el mensaje de ejemplo de Servicios también muestran el nombre del panel (`ServiceController` manda `saludo`).
- Tests: `src/tests/Feature/ConfiguracionTiendaAdminTest.php` (14 casos).
- **Revisión visual:** vista previa interactiva de la pantalla con los datos reales (esbuild + `createRoot` con stubs de Inertia) a 1440 y 390 px, escribiendo en los campos para ver cambiar la vista previa; en celular las filas de «Esto se carga en otra pantalla» dejaban el texto en una columna de una palabra y se corrigió. En la tienda real se cambiaron por un momento el nombre y la barra de anuncio: sin texto la barra desaparece, y el nombre nuevo salió en el pie, en el copyright y en todos los enlaces de WhatsApp. Después se dejó todo como estaba. Sin iniciar sesión en el panel.

## Newsletter (admin)

Marketing y Google → **Campañas** (`/admin/newsletter/campanas`), **Suscriptores** (`/admin/newsletter/suscriptores`) y **Ajustes del newsletter** (`/admin/newsletter/ajustes`). Diagrama: [`diagramas/newsletter.html`](diagramas/newsletter.html).

**Para qué sirve.** Juntar los correos de los clientes desde la tienda y mandarles campañas: novedades, ofertas y avisos. Son tres pantallas de un mismo circuito:

| Pantalla | Qué hace |
|---|---|
| **Campañas** | Se escribe el correo con bloques (título, texto, foto, botón, producto del catálogo y separador), se manda una prueba y se envía |
| **Suscriptores** | La lista: se llena sola con el formulario del final de la tienda, y también a mano o importando |
| **Ajustes** | Los textos de ese formulario, con qué nombre llegan los correos, a qué velocidad salen y si el servidor puede enviarlos |

**Cómo sale un correo.** La pantalla no manda nada: la campaña pasa a «enviando» y la reparte la cola (`DispatchNewsletterCampaign` arma la lista de destinatarios; `SendNewsletterBatch` manda un lote por minuto, con el máximo de la pantalla de Ajustes). Cada destinatario se marca al salir, así un reintento nunca manda dos veces el mismo correo. Se puede cerrar la pantalla y hasta detener el envío a mitad de camino.

**Lo único que hay que cargar en producción** es la clave de la cuenta de correo (`MAIL_PASSWORD` en el `.env` del servidor; en Gmail, una «contraseña de aplicación»). El panel lo dice solo: hay una tarjeta «¿Está todo listo para enviar?» y un botón para mandarse un correo de prueba.

**Qué estaba mal antes del 2026-09-16**
- **El panel no decía si los correos podían salir.** Con el correo del servidor sin configurar (o en modo prueba, que escribe los correos en un archivo), se podía escribir una campaña entera, tocar «Enviar» y quedarse mirando una barra que nunca avanzaba. Lo mismo si el proceso de la cola estaba detenido: la campaña se quedaba en «enviando» para siempre. Ahora lo revisa `App\Support\NewsletterEstado` y las tres pantallas lo avisan antes.
- **Los errores del correo eran ilegibles.** La prueba fallaba con «No se pudo enviar la prueba. Revisa la configuración» o con el mensaje del proveedor en inglés. Ahora se traducen los tres que pasan de verdad (cuenta o clave rechazada, no se pudo conectar, no respondió a tiempo).
- **La búsqueda de suscriptores era solo de PostgreSQL** (`ilike`): en otra base, o en los tests, se rompía. Pasó a `LOWER(...) LIKE ?`, igual que el resto del proyecto.
- **La regla de «no se puede enviar» estaba repartida** entre el controlador (bloques vacíos, sin suscriptores) y la pantalla (botón apagado), y ninguna de las dos explicaba el motivo. Ahora es una sola, `NewsletterCampaign::porQueNoSePuedeEnviar()`, y el panel muestra el texto.
- **Las tres pantallas tenían su propia línea visual:** tarjetas `Stat` escritas a mano, tablas HTML, `confirm()` para borrar, paginación con dos botones «Anterior/Siguiente» y ninguna guía. El importador no aclaraba que a los que estaban de baja no se los reactiva.

**Pantallas**
- **Campañas** (`Pages/Admin/Newsletter/Campaigns.jsx`): PageHeader con «Nueva campaña», cuatro tarjetas (suscriptores activos, borradores, campañas enviadas con el total de correos entregados y el estado del correo del servidor), `AdminGuide`, avisos (el correo sin configurar, la cola detenida, sin suscriptores, campañas saliendo ahora) y la lista con el estado de cada una, a cuántos le llegaría hoy, la barra de lo que ya salió y `ModalEliminar`. Debajo, **«Cómo escribir una campaña que se abra»** (tres consejos con un ejemplo bueno y uno a evitar, y cada cuánto conviene mandar). Al costado y fijo, **«¿Está todo listo para enviar?»**.
- **El editor** (`Pages/Admin/Newsletter/CampaignEdit.jsx`) conserva su editor de bloques y su vista previa en vivo (la arma el servidor con la plantilla del envío), y se le puso la cabecera del panel, el motivo por el que todavía no se puede enviar y un modal para detener el envío en vez de `confirm()`.
- **Suscriptores** (`Pages/Admin/Newsletter/Subscribers.jsx`): cuatro tarjetas (reciben campañas, de baja, los que llegaron desde la tienda y los del mes), `AdminGuide`, buscador, chips de estado, la lista con el origen de cada uno y «Dar de baja» / «Reactivar», `ModalEliminar` que explica la diferencia entre dar de baja y borrar, `Paginador`, e importación en un `Modal` que cuenta los correos pegados. Al costado, **«Agregar a mano»**; debajo, **«Cómo cuidar tu lista»**.
- **Ajustes** (`Pages/Admin/Newsletter/Settings.jsx`): cuatro tarjetas (el formulario de la tienda, el servidor de correo, el proceso de envío y la velocidad) y tres `StepCard`: el formulario de la tienda (con interruptor), cómo llegan los correos (nombre del remitente, correo para las respuestas y pie) y a qué velocidad salen (con la cuenta real: «tus N suscriptores la reciben en unos X minutos»). Al costado, la **vista previa del formulario tal como se ve en la tienda** y **«¿Salen los correos?»**, con el botón para mandarse una prueba.

**Cambios técnicos**
- `App\Support\NewsletterEstado`: `correo()` (servicio, servidor, si hay cuenta y clave —**nunca la clave**—, y qué falta), `cola()` (conexión, pendientes, fallidos y si hay alguien atendiéndola: un trabajo que espera más de 3 minutos significa que `queue:work` está detenido), `resumen()` y `explicarFallo()`.
- `NewsletterCampaign`: `ESTADOS`, `destinatarios()`, `porQueNoSePuedeEnviar()` (la regla única), `progreso()`, `paraElPanel()` y el scope `enviadas()`.
- `NewsletterCampaignController`: el listado usa `paraElPanel()`; `send()` y `sendTest()` revisan el estado del correo antes de intentar; el buscador de productos del bloque «Producto» dejó de usar `ilike`.
- `NewsletterSubscriberController`: búsqueda portable, cuentas por origen y por mes, y mensajes que nombran el correo afectado.
- `NewsletterSettingsController`: mensajes de validación en español y **`test()`**, que manda un correo de prueba con la configuración del servidor (ruta `admin.newsletter.settings.test`, con límite de 10 por minuto). Es lo que confirma, en producción, que la clave quedó bien cargada.
- `Components/Admin/newsletter.jsx`: `EstadoCampana`, `Progreso`, `EstadoDelServidor`, `Consejos` y los textos de las dos guías.
- Tests: `src/tests/Feature/NewsletterPanelTest.php` (19 casos). Siguen los que ya había: `NewsletterCampaignTest` y `NewsletterTest`.
- **Revisión visual:** vista previa interactiva de las tres pantallas y del editor con los datos reales a 1440 px, con campañas y suscriptores temporales (una enviada con fallidos, una saliendo y un borrador sin asunto) que después se borraron.

## Google y redes sociales (admin)

Marketing y Google → **Google y redes sociales** (`/admin/seo`). Diagrama: [`diagramas/seo.html`](diagramas/seo.html).

**Para qué sirve.** El título y la frase con que cada página de la tienda aparece en Google, y la foto que se ve cuando alguien pega un enlace en WhatsApp o Facebook. El texto que sale de verdad lo resuelve `App\Support\Seo` **en el servidor** y se escribe en el HTML (`app.blade.php`), para que Google y WhatsApp lo lean sin ejecutar JavaScript.

| Lo que se edita | Dónde manda |
|---|---|
| **Páginas de la tienda** (inicio, catálogo, hubs, Trade-In, novedades…) | Cada una con su título, su frase, su imagen y si se oculta de Google |
| **Plantillas** (producto, novedad, página informativa, colección) | Valen para todos los de ese tipo; `{titulo}` se reemplaza por el nombre de cada uno |
| **Para toda la tienda** | El nombre del sitio, la frase por defecto y la imagen que se usa cuando una página no tiene la suya |

**Qué estaba mal antes del 2026-09-16**
- **La página de una colección no se podía editar:** `/coleccion/{slug}` resolvía su título con `Seo`, pero no tenía fila en `seo_pages`. La migración `2026_09_16_190000_seo_pagina_de_coleccion` la suma.
- **El panel no decía qué estaba mal.** Mostraba el título de cada página y nada más: ni que una descripción tenía 179 caracteres (Google corta en 160), ni que otra tenía 51 (muy corta para convencer), ni cuántas seguían con el texto automático.
- **No avisaba de la dirección del sitio.** `APP_URL` es de donde salen las URL canónicas, las del sitemap y las de las imágenes que se comparten. Con la dirección de prueba, Google recibiría `localhost`. Ahora `SeoEstado::sitio()` lo detecta y la pantalla lo avisa arriba.
- **La vista previa era solo de Google.** El módulo se llama «Google y redes sociales» y no había forma de ver la tarjeta de WhatsApp, que es justo la que se puede comprobar el mismo día.
- La pantalla usaba `Card` y `Button` sueltos, sin tarjetas de resumen, sin guía y sin avisos.

**Pantalla** (`Pages/Admin/Seo/Index.jsx` + `Components/Admin/seo.jsx`): PageHeader con accesos al sitemap y al robots.txt, cuatro tarjetas (páginas en Google, escritas a mano, para revisar y la dirección del sitio), `AdminGuide`, avisos (dirección de prueba, páginas para revisar, o «todo en orden») y las dos listas, cada fila con el título y la frase **que salen hoy** y lo que le falta. El formulario abre en un `Modal` con **las dos vistas previas al costado**: el resultado de Google y la tarjeta de WhatsApp, con los contadores en verde dentro de la medida y en ámbar fuera. Debajo, **«Cómo escribir para Google»** (tres consejos con un ejemplo bueno y uno a evitar, y cómo dar de alta el sitio en Search Console). Al costado, «Para toda la tienda» y «Lo que lee Google» (el sitemap y el robots.txt, con su explicación y su enlace).

**Cambios técnicos**
- `App\Support\SeoEstado`: `paraElPanel()` (lo que sale de verdad, con la plantilla resuelta), `problemas()` (las medidas de Google: 60 el título, de 70 a 160 la descripción; una página oculta a propósito no tiene problemas), `sitio()` (la dirección del sitio, si es de prueba y si usa https) y `resumen()`.
- `SeoController`: el listado usa `SeoEstado`, el nombre del sitio cae al nombre de la tienda de Configuración y la validación tiene mensajes en español.

## Exportaciones y Exportador (admin)

Exportar datos → **Exportaciones** (`/admin/exportar`) y **Exportador** (`/admin/exportar/personalizado`). Diagrama: [`diagramas/exportaciones.html`](diagramas/exportaciones.html).

**Para qué sirve.** El inventario en PDF, para imprimir o mandarle a tu equipo: un listado por inventario, uno por cada tipo de producto general y uno armado a mano con lo que busques. Todos traen el costo, el precio de venta y la ganancia esperada, así que **son documentos internos**.

**Qué estaba mal antes del 2026-09-16**
- **El pie del PDF tenía los datos escritos en el código:** el teléfono `+591 75904313` y la dirección «Av. Melchor Urquidi, entre Fidel Anze y Av. Julio Rodríguez». Si cambiaba el local, el PDF seguía con lo viejo. Ahora salen de Configuración y de Ubicaciones (`ExportController::datosTienda()`), y si faltan, esa línea no se dibuja.
- **Se podía pedir un PDF vacío.** Los tipos sin stock se ofrecían igual y respondían con un `back()` que, al abrirse en otra pestaña, no muestra el aviso en ningún lado. Ahora cada tarjeta dice cuántos hay y la de un tipo sin stock queda apagada.
- **El exportador era a ciegas:** se escribía un nombre y se abría el PDF a ver qué salía. Ahora una consulta en vivo (`admin.exportar.contar`) dice cuántos productos coinciden y muestra los primeros, y el botón solo se enciende si hay algo.
- **El buscador de productos usaba `ilike`** (solo PostgreSQL). Pasó a `LOWER(...) LIKE ?`.
- Las dos pantallas eran del diseño viejo (`Components/CrudUI` con estilos en línea) y el selector de inventario del exportador se dibujaba en una columna porque `Segmented` recibía `cols={4}` (espera una clase, no un número).

**Pantallas**
- **Exportaciones** (`Pages/Admin/Exportaciones/Index.jsx`): cuatro tarjetas con lo disponible en cada inventario, `AdminGuide`, avisos (faltan los datos del pie, o no hay nada disponible) y dos bloques de tarjetas: por inventario y por tipo de producto general, cada una con su cuenta.
- **Exportador** (`Pages/Admin/Exportaciones/Personalizado.jsx`): cuatro tarjetas (inventario, dónde busca, cuántos coinciden y si el PDF está listo), `AdminGuide`, dos `StepCard` (dónde busco, con el interruptor de «solo lo disponible»; y qué busco, con ejemplos que se pueden tocar) y, al costado, **«Lo que va a salir»** con la cuenta, los primeros seis y el botón. Debajo, **«Cómo buscar bien»**.

**Cambios técnicos**
- `ExportController`: `INVENTARIOS`, `datosTienda()`, `resumenInventarios()`, `contar()` (la cuenta en vivo) y el buscador portable. La plantilla `pdf.exportar_productos` recibe `tienda` y dibuja el pie con eso.
- Tests: `src/tests/Feature/ExportacionesTest.php` (12 casos; los PDF se piden de verdad y se comprueba que el archivo empiece con `%PDF`).

## Usuarios y roles (admin)

Sistema → **Usuarios y roles** (`/admin/usuarios`). Diagrama: [`diagramas/usuarios-roles.html`](diagramas/usuarios-roles.html).

**Para qué sirve.** Quién entra al panel y a qué parte. Cada persona tiene su cuenta (su correo y su contraseña) y su rol; el rol dice qué módulos del panel abre.

**Cómo funciona el permiso.** Un permiso es un **módulo del panel**, no una acción suelta: es lo que el administrador entiende y lo que se puede cumplir de verdad. El catálogo está en `App\Support\Permisos`, con los nombres de ruta que le pertenecen a cada módulo, y esa misma lista la usan:

| Quién | Para qué |
|---|---|
| `PermisoMiddleware` | Corta el acceso en el servidor: lo que el rol no tiene marcado devuelve 403, aunque escriban la dirección a mano |
| El menú del panel (`AdminLayout`) | Esconde lo que el rol no puede abrir, con los permisos que llegan en `auth.permisos` |
| La pantalla de roles | Dibuja los módulos agrupados para marcarlos |

Lo que está dentro del panel y **no pertenece a ningún módulo queda solo para administradores**, así una ruta nueva nunca queda abierta por olvidarse de sumarla al catálogo.

**Los dos roles del sistema** (no se borran):
- **Administrador**: entra a todo, siempre. Sus permisos no se editan: es la forma de que nadie quede afuera de la configuración de la tienda.
- **Vendedor**: entra a **su propio panel**, en `/vendedor`, igual que antes. No tiene módulos del panel de administración marcados, así que nada cambió para quien ya lo usaba; si hace falta, se le pueden sumar.

**Barandas** (probadas):
- Nadie se cambia el rol a sí mismo ni se borra a sí mismo.
- Siempre queda al menos un administrador: no se le puede bajar el rol al último ni borrarlo.
- Un rol con gente asignada no se borra ni se apaga.
- Una cuenta con un rol que ya no existe no abre nada.
- La contraseña se guarda cifrada y no se puede volver a ver, ni desde el panel.

**Pantalla** (`Pages/Admin/Usuarios/Index.jsx` + `Components/Admin/usuarios.jsx`): PageHeader con «Nuevo rol» y «Nuevo usuario», cuatro tarjetas (usuarios, administradores, roles y módulos del panel), `AdminGuide`, avisos (un solo administrador; un rol sin módulos), la lista de usuarios con su rol, buscador y chips por rol, y al costado la lista de roles con lo que abre cada uno. Los dos formularios abren en `Modal`: el de usuario muestra al costado a qué entra con el rol elegido; el de rol trae el **selector de módulos agrupado**, con «Marcar todo» por grupo. Debajo, **«Cómo dar acceso sin perder el control»**.

**El ícono** (`Components/Admin/IconoUsuarios.jsx`) se dibujó para este panel: dos personas y, delante, la credencial con la banda del rol y el visto del permiso. Usa el trazo de los íconos del menú (caja de 24, grosor 1,8, puntas redondeadas) y `currentColor`, así toma el color del estado activo. Se comprobó legible a 200, 44, 22 y 18 px.

**Cambios técnicos**
- Migración `2026_09_16_200000_crear_roles`: tabla `roles` (`clave`, `nombre`, `descripcion`, `permisos` JSON, `del_sistema`, `panel_propio`, `activo`, `orden`) con `admin` y `vendedor` cargados.
- Migración `2026_09_16_200100_users_rol_libre`: `users.rol` era `enum('admin','vendedor')`, así que **la base rechazaba cualquier rol nuevo**. Pasa a texto; lo que vale como rol lo controlan la tabla `roles` y la validación.
- `App\Support\Permisos`: `MODULOS` (14), `porGrupo()`, `moduloDeRuta()` y `limpiar()`.
- `App\Models\Role`: `permisosReales()` (el administrador siempre `*`), `puede()`, `mapa()` (cacheado, el que consulta el middleware) y `permite()`, la regla única.
- `App\Http\Middleware\PermisoMiddleware`, registrado como `permiso` y puesto en el grupo del panel en vez de `rol:admin`.
- `HandleInertiaRequests` comparte `auth.permisos`; `AdminLayout` filtra el menú con eso y suma el grupo «Sistema».
- Tests: `src/tests/Feature/UsuariosRolesTest.php` (25 casos).

## Panel del vendedor (2026-09-16)

`/vendedor`. Diagrama: [`diagramas/panel-vendedor.html`](diagramas/panel-vendedor.html).

**Qué pasaba.** El panel del vendedor era otra aplicación: Bootstrap + SB Admin 2 + Font Awesome, sidebar verde, botones de `styled-components` y tablas propias. Nada de la línea visual del panel de administración llegaba hasta ahí, y varias pantallas arrastraban defectos que no se veían desde afuera.

**El armazón ahora es uno solo.** `Layouts/PanelShell.jsx` tiene el menú lateral, la barra de arriba con migas y menú de cuenta, el cajón de celular, la transición de página y la confirmación de salida. `AdminLayout` y `VendedorLayout` son dos listas de menú sobre ese mismo armazón, así que lo que se arregle en uno vale para los dos. El del vendedor lleva la insignia **VENDEDOR** en lima debajo de la marca.

**Cada panel tiene su color.** El acento viaja como variable CSS (`--ab-acento` y `--ab-acento-rgb`, que la pone `PanelShell` en `:root`), así que las piezas compartidas toman el color del panel donde están montadas: **#585E9F** en administración y **#5C5E99** en el del vendedor. El menú del vendedor es un degradado de morado fuerte arriba a morado suave abajo (`#2B2C52 → #3C3E74 → #52548E → #64669F`): arriba la marca blanca se lee de lejos y abajo el color acompaña sin pesar. Para las transparencias se usa `rgb(var(--ab-acento-rgb) / 0.10)`, que es la forma que entiende Tailwind con una variable.

**Las pantallas también son una sola.** Reservas, clientes, servicios, cotizaciones y el formulario de venta ya estaban alineados en el panel de administración: se movieron a `Components/Panel/` y ahora las usan los dos paneles, con un `prefijo` (`admin` o `vendedor`) que arma los nombres de ruta y un `Layout` que decide el menú. Los 28 nombres de ruta que usan esas piezas existen en los dos paneles (se comprueba en el test). Las páginas de `Pages/Admin/…` y `Pages/Vendedor/…` quedaron de 5 líneas.

| Pieza compartida | La usan |
|---|---|
| `Components/Panel/ReservasIndex` / `ReservasForm` | Reservas de los dos paneles |
| `Components/Panel/ClientesIndex` / `ClienteForm` | Clientes de los dos paneles |
| `Components/Panel/ServiciosIndex` / `ServiciosForm` | Servicio técnico de los dos paneles |
| `Components/Panel/CotizacionesIndex` / `CotizacionesForm` / `CotizacionesLote` | Cotizaciones de los dos paneles |
| `Components/Panel/VentaForm` | «Nueva venta» de los dos paneles |

**Mi día** (`Pages/Vendedor/Dashboard.jsx` + `Components/Vendedor/dia.jsx`): una línea que dice cómo viene el día, cuatro tarjetas (ventas de hoy, cobrado, descuentos que hizo y reservas activas), el resumen del día, la **meta del mes** en morado y a lo último lo que registró recién.

La tarjeta de la meta se inclina siguiendo al puntero con perspectiva real, tiene una aurora que respira detrás, un brillo y un borde de luz que siguen al mouse, el arco de progreso en lima con marcas en cada cuarto, y los números cuentan desde cero. Al llegar al 100 % aparece la insignia «Cumplida» y cae un confeti discreto. Las tarjetas y los accesos rápidos entran escalonados y levantan al pasar el mouse, con un barrido de luz.

**Lo animado no puede romper lo que se lee.** Todo lo que se mueve se apaga con «reducir movimiento» del sistema y en pantallas táctiles. Además, una entrada que arranca en opacidad 0 dejaría la pantalla en blanco si el navegador frena las animaciones (pestaña en segundo plano), así que `useEntrada()` decide al montar: si la pestaña no está a la vista, todo se dibuja ya visible y sin animación. Los contadores tienen un temporizador de respaldo que deja el número real, y el arco se dibuja directo en su valor cuando no se anima: nunca se queda mostrando 0 %.

**La meta dejó de ser inventada.** Estaba escrita a mano en el controlador: 10.000 Bs para todos. Ahora es un dato de cada cuenta (`users.meta_mensual`, migración `2026_09_16_210000_meta_mensual_del_vendedor`) que el administrador carga en **Sistema → Usuarios y roles**, en el formulario del usuario, solo para los roles con panel propio. En 0 la tarjeta dice que todavía no le pusieron meta en vez de mostrar un porcentaje falso.

**Productos en stock** (`Pages/Vendedor/Productos/Index.jsx` + `Components/Vendedor/stock.jsx`): pestañas por tipo con su cuenta real, buscador y paginador. Se envía **una sola lista por vez**, la de la pestaña abierta.

## El vendedor no ve el costo ni la ganancia

Decisión del 2026-09-16: **el vendedor ve el precio, el descuento que él hizo y lo que cobró. El costo de la tienda y la ganancia no son asunto suyo.** No se ocultan con CSS: no salen del servidor, así que tampoco están en el JSON de la página ni en la respuesta de la API.

La regla vive en `App\Support\SinCostos`: `OCULTOS` (`precio_costo`, `precio_invertido`, `ganancia_neta`, `procedencia` y, de un servicio técnico, `costo_pendiente`, `costo_cargado_por`, `costo_cargado_en` y `quien_cargo_el_costo`), `aplica($usuario)` (solo el administrador los ve), `deColeccion()` y `detalleDeServicio()`, que saca el costo de cada trabajo del JSON de un servicio.

| Dónde | Qué se sacó |
|---|---|
| Mi día | «Ganancia de hoy». En su lugar, **«Descuentos que hiciste»**, que sí es información suya |
| Mis ventas | Las columnas «Costo» y «Ganancia», las tarjetas de ganancia y pérdida y el total de ganancia. Quedan Precio, Descuentos y Cobrado, y las tarjetas Ventas, Precio de lista, Descuentos y permutas, y Total cobrado |
| Servicio técnico (lista) | Las columnas «Costo» y «Ganancia» y sus dos tarjetas, reemplazadas por «Trabajos hechos» y «Equipos distintos». El JSON del detalle tampoco lleva el costo de cada trabajo |
| Servicio técnico (registrar) | La columna «Costo» de cada trabajo, el resumen de costo y ganancia, y el aviso «se cobra menos de lo que cuesta». Registra solo lo que paga el cliente |
| PDF de sus ventas | Las columnas «Capital» y «Ganancia» y sus totales. Queda «Cobrado» |
| PDF de servicios | La columna «Costo» y las filas «Total Costo Invertido» y «Ganancia Neta» (con `$conCostos` en la plantilla, así el administrador las sigue viendo) |
| API de stock (`/api/stock/*`) | `precio_costo` y `procedencia` en las cuatro listas y en la búsqueda por código |
| `GET /api/permuta/{tipo}` | La ruta entera: devolvía modelos completos con costo y procedencia y **no la llamaba nadie** |

**Servicio técnico: el costo lo carga el administrador (2026-09-16, pedido del usuario).** Antes el vendedor escribía lo que costaba cada trabajo porque no había dónde completarlo después. Ahora el circuito es este:

1. **El vendedor registra solo lo que paga el cliente.** El formulario ya no tiene la columna «Costo». Al guardar sale la nota y el recibo térmico en el momento, con los trabajos y lo cobrado. Aunque el navegador mande costos, el servidor no los guarda: el servicio queda con `costo_pendiente = true` y `precio_costo = 0`.
2. **Al administrador le llega el aviso en el momento:**
   - en el Resumen, una notificación «Falta el costo» (`SystemNotification` de tipo `servicio_sin_costo`, con `servicio_tecnico_id`) que abre la lista con los pendientes;
   - en Servicio técnico, una alerta fija «Falta el costo de N servicios técnicos» con «Ver cuáles» (`?pendientes=1`).
3. **El administrador carga el costo** con «Cargar costo» en la fila (`PATCH admin/servicios/{servicio}/costo`, `ServicioTecnicoController::cargarCosto`, solo el administrador). Una ventana muestra cada trabajo con lo que paga el cliente, calcula la utilidad mientras escribe y, al guardar, completa el costo de cada trabajo del JSON, suma `precio_costo`, marca quién y cuándo (`costo_cargado_por`, `costo_cargado_en`) y deja el aviso del Resumen como leído. **La nota no cambia:** la descripción y lo cobrado quedan iguales, así las boletas ya entregadas siguen cuadrando. El lápiz junto al costo sirve para corregirlo.
4. **Mientras falta el costo no se inventa utilidad.** En la lista, en Reportes (pantalla y PDF), en el Resumen y en el reporte automático, el servicio pendiente suma a lo cobrado pero no suma costo ni ganancia (`ServicioTecnico::costoParaReportes()` y `gananciaParaReportes()`). Aparece como «Costo pendiente», y cada pantalla avisa cuántos faltan. Sumar el cobro entero como ganancia la habría inflado.

El administrador también puede registrar un servicio con un costo vacío: queda pendiente igual, sin aviso en el Resumen porque ya está en la lista. El total que cobra el servicio sale de la suma de sus trabajos, no del número que manda el navegador. Migración `2026_09_16_220000_costo_pendiente_de_servicio_tecnico`; la venta de tipo servicio técnico (`VentaController`) sigue la misma regla.

**Fugas al vendedor que se corrigieron en el camino:** la búsqueda rápida de la lista de servicios (`?buscar=`) devolvía el costo del servicio y de cada trabajo sin pasar por `SinCostos`, y en computadora la tabla le dibujaba una columna «Ganancia» (el cobro entero con signo + y sin encabezado). Además se quitaron dos `Log::info` que escribían en el log los datos del cliente de cada servicio.

**No hacía falta para vender.** El costo real de cada venta lo vuelve a calcular el servidor desde el producto (`VentaController::buildValidatedSaleItems`), así que aunque el navegador mande `precio_invertido: 0`, la venta se guarda con el costo verdadero. Hay un test que lo comprueba.

**Defectos reales que se corrigieron**

| Dónde | Qué pasaba |
|---|---|
| Mi día | La permuta se restaba **una vez por producto**: una venta de tres equipos con permuta la descontaba tres veces |
| Mi día | El total del mes usaba `whereMonth` sin año: sumaba septiembre de otros años |
| Mi día | «Egresos del día» traía los gastos de **toda la tienda**, no los del vendedor (que además no puede registrar ninguno). Se sacaron esa fila y «Disponible» |
| Mi día | `Inertia::render` pisaba el `auth` compartido, así que la página perdía `auth.permisos` |
| Productos en stock | Cuatro listas paginadas compartían el parámetro `page`: pasar de página en una las movía todas |
| Productos en stock | La búsqueda filtraba en el navegador **solo las 25 filas visibles**: un IMEI de la página 3 no aparecía |
| Productos en stock | Celulares mostraba equipos vendidos; los demás tipos, solo disponibles |
| Productos en stock | El JSON de la página llevaba `precio_costo` y `procedencia` de todo el inventario. Ahora no salen del servidor |
| Mis clientes | «Enviar promoción» abría una pestaña de WhatsApp por cliente cada segundo: el navegador las bloquea. Ahora usa el modal del panel de administración, que abre un chat a la vez |
| PDF de sus ventas | El teléfono y la dirección estaban escritos en la plantilla. Ahora salen de Configuración y Ubicaciones, con `App\Support\DatosDeLaTienda` (que también usa el Exportador) |
| Clientes y ventas | `ILIKE` es solo de PostgreSQL. Pasaron a `LOWER(columna) LIKE ?` con `App\Support\Busqueda` |
| Servicio técnico | La ruta `vendedor.servicios.buscar` apuntaba a un método que no existe. Se quitó |
| Servicio técnico | `exportarResumen` reventaba sin fechas y no estaba enlazada en ninguna pantalla. Ahora toma el mes en curso por defecto y tiene su botón «Resumen» en los dos paneles |
| Cotizaciones | El vendedor tenía nombres de ruta distintos (`whatsapp-lote`, `whatsapp/{id}`, `ver-pdf`) y `ver-pdf` era un duplicado exacto de `pdf`. Se unificaron con los del panel de administración |
| Clientes (los dos paneles) | `enviarPromocionMasiva` escribía filas en `promociones_enviadas` y respondía «Promoción enviada» **sin enviar nada**, y ninguna pantalla la llamaba. Se quitaron las dos rutas y los dos métodos |
| Reservas (los dos paneles) | La fecha se leía como UTC: una reserva del 14 se mostraba como 13 en Bolivia |
| Venta (los dos paneles) | `VentaEditForm` recibía un `accent` que ya no usaba nadie |

**Lo que se sacó por quedar sin uso:** `InventoryTable`, `Ui3DCard`, `AnimatedButton`, `QuickActionCards`, `UiversePanelCard`, `FancyButton`, `NeonBox`, `NeonField`, `NeonInput`, `ReservaIndex`, `ReservaForm`, las dos `Cotizaciones/EnviarWhatsapp.jsx` (no las renderizaba nadie) y tres huérfanos viejos (`CrudUI`, `FormUI2`, `Toast`).

**Tests:** `src/tests/Feature/PanelVendedorTest.php` (28 casos): abre las once pantallas del vendedor, comprueba que no entra a las del administrador, que el costo y la ganancia no viajan en ninguna de sus pantallas ni en la API, que el administrador sí los sigue viendo, y que la venta guarda el costo real aunque el navegador no lo conozca.

## Botón de WhatsApp que flota (2026-09-16)

`resources/js/Components/Store/WhatsAppFlotante.jsx` y sus estilos en `resources/css/app-vite.css` (clases `ab-wa-*`). Lo dibuja `StoreLayout` con el número y el mensaje de Tienda online → Configuración; sin WhatsApp encendido no se dibuja.

**Qué estaba mal**
- **Las ondas nunca se movieron.** El botón pedía la animación `wa-ring`, que estaba escrita en `resources/css/app.css`… un archivo que **no entra en el build** (el que se compila es `app-vite.css`). Las tres «ondas» eran tres círculos verdes quietos, escondidos debajo del botón.
- **La marca estaba dibujada como contorno**: a 28 px la burbuja se veía delgada y el auricular, sucio.
- **Se montaba sobre el pie de página**: al llegar al final tapaba el texto del copyright, y con la barra de comparar abierta quedaba debajo de ella.

**Cómo quedó**
- **La marca, sólida:** una sola figura con la burbuja llena en blanco y el auricular calado con `fill-rule="evenodd"`, así el auricular deja ver el degradado del botón (en vez de pintarse con un verde plano que nunca coincide). Es el ícono oficial.
- **Más presencia:** 62 px (56 en el celular), degradado radial, brillo interior, sombra en dos capas y un «1» de mensaje sin leer.
- **Se mueve, sin molestar:** entra con un rebote a los 1,2 s, dos ondas que respiran, un brillo que lo cruza cada 5,5 s, un guiño cada 9 s que se apaga apenas el cliente lo apunta o lo toca, y **una burbuja de saludo** que se abre una sola vez por visita (se recuerda en `sessionStorage`), se cierra sola a los 11 s y también aparece al pasar el mouse.
- **Se frena en la línea del copyright:** el componente mide los elementos marcados con `data-tope-flotante` (el subpie de la tienda y la barra de comparar) y se sube lo justo para apoyarse arriba de esa línea, con `requestAnimationFrame` y escuchas pasivas.
- Con «reducir movimiento» del sistema queda quieto y sin ondas, pero se ve y se usa igual. La animación de entrada no usa `fill-mode`, para que el botón nunca quede encogido si no llega a correr (por ejemplo, con la pestaña en segundo plano).

## Ficha del producto: parte de arriba (rediseño del 2026-09-15)

`Pages/Store/Product.jsx`, parte de arriba de la ficha de cada publicación.

- **Ruta:** «Catálogo › categoría › producto», en vez de solo «← Catálogo».
- **Galería:**
  - Marco blanco con borde. El marco toma el color de la esquina de la foto, así una foto con fondo casi blanco no deja un recuadro, como pasaba sobre el gris.
  - Flechas al pasar el mouse, contador «1 / N», lupa siempre visible y miniaturas de 72 px.
  - Desde tablet, la foto ocupa todo el alto de la caja de compra y las miniaturas van en una columna al costado. Así los botones de compra terminan siempre a la altura del final de la foto, pedido del usuario; se midió en 820, 1024 y 1440 px con diferencia 0. En celular, la foto es cuadrada y las miniaturas van debajo.
- **Caja de compra, en este orden:**
  1. Condición siempre visible: Nuevo (azul), Seminuevo, Open Box o Reacondicionado. Antes el «Nuevo» no se mostraba.
  2. Disponibilidad y categoría.
  3. Nombre.
  4. Precio. Con promoción, se tacha el anterior y se muestra «Ahorras Bs …»; los dos precios vienen del servidor.
  5. Resumen.
  6. **Datos clave:** hasta 4 tarjetas con ícono (capacidad, chip, pantalla, color o memoria según el producto) y la salud de batería con su nivel dibujado.
  7. Los botones de compra, al final de la caja, alineados con el final de la foto. Van uno al lado del otro en pantallas grandes y apilados en tablet, para que «Consultar por WhatsApp» no se corte.
- **Debajo del hero, a lo ancho:**
  - El recuadro «Compra con confianza»: equipo revisado, stock confirmado, atención directa, garantía si la publicación la tiene, recojo sin costo en la ciudad de la tienda y envío por consultar.
  - Al lado, «¿Dudas entre modelos?», que lleva a la comparativa.
- **WhatsApp:** el mensaje lleva el precio que se ve (con promoción, el de la promoción).
- **Especificaciones técnicas** (`FichaTecnica` en `Components/Store/fichaTecnica.jsx`, rediseño del 2026-09-15):
  - **Lo más importante** (con las guías de color y movimiento de la skill *impeccable*):
    - **Rotación:** es un carrusel que rota solo y sin fin, sin que haya que tocar nada. Cada 1,5 s se desliza una tarjeta en 600 ms (curva `cubic-bezier(0.16, 1, 0.3, 1)`).
    - **Vuelta sin salto:** la lista se dibuja tres veces y, al llegar a una copia, se reubica en la del medio sin animación, así nunca «rebobina». Se midió un ritmo parejo de unos 1.500 ms, también al dar la vuelta.
    - **Cuándo se detiene:** no se detiene al pasar el mouse, solo fuera de la pantalla, con la pestaña oculta o con el botón de pausa (accesibilidad, WCAG 2.2.2). Con «reducir movimiento» del sistema, cambia sin deslizarse.
    - **Controles:** el punto activo se llena mientras dura cada tarjeta y hay flechas; en celular se desliza con el dedo.
    - **Tarjetas:** superficie lila sólida de la marca (#E3E6F8), sin degradés ni manchas, radio de 16 px y el ícono sobre azul marino. La etiqueta (#454B8A) y la nota (#4A4F75) salen del mismo tono y tienen un contraste de 6,4:1. El valor va en azul marino.
  - **Detalle:** cada grupo va como una tabla. El título del grupo queda a la izquierda y fijo al bajar en pantallas grandes. A la derecha, cada fila tiene el ícono, el nombre y qué significa, y después el dato.
    - Las listas llevan viñetas y, si tienen más de 6 puntos, van en dos columnas.
    - Los avisos («; …»), como el de la SIM o el de mmWave, van como nota.
    - «IP68» lleva su detalle debajo y la batería, su nivel dibujado.
    - Los helpers de texto (`partir`, `partesDe`, `conMayuscula`, `formatoDe`) pasaron a `Components/Store/textoFicha.js`; los comparte la comparativa.
- **Entrega y recojo:** las tres opciones van en una fila, del mismo tamaño y con 24 px de separación (una debajo de otra en celular). Usan íconos nuevos con relleno suave (`StorePickup`, `DeliveryTruck` y `SecureBox` en `Icons.jsx`), y la ciudad sale de la configuración de la tienda.
- **Barra de secciones** (Descripción, Especificaciones…): quedaba escondida detrás del header al bajar. Ahora se ubica con `--alto-header`, que StoreLayout calcula en vivo, y los saltos a cada sección caen justo debajo.

## Header de la tienda (2026-09-15)

- **Celular:** el logo va a la izquierda y buscar, carrito y menú a la derecha. El header mide 76 px en vez de 100 y el aviso superior va en una sola línea. El botón del menú cambia a ✕ al abrirlo.
- **Menú del celular:** categorías con flecha y, abajo, tarjetas de acceso rápido: «Comparar iPhone», «Comparar Mac» y «Trade-In» (la última, a lo ancho).
- **Parpadeo blanco al hacer scroll:** el header usaba `bg-white/95 backdrop-blur-lg` con el logo animado adentro, así que Chrome lo repintaba en cada cuadro. Ahora el fondo es blanco sólido, igual que la barra fija de la comparativa.
- **Fuentes:** Barlow se cargaba con un `<link>` dentro de StoreLayout, AdminLayout y AuthShell, que se volvía a montar en cada cambio de página y hacía parpadear el texto. Ahora se carga una sola vez en `app.blade.php`.
- **Carrusel del inicio:** los globos de «Especificaciones» decían textos fijos, como «A17 Pro · Dynamic Island» sobre el iPhone 14 Plus o «M3 Pro» sobre cualquier equipo. Ahora:
  - Cada lámina toma un destacado de su categoría.
  - El globo muestra el chip y la capacidad reales del producto.
  - Sin producto, la lámina dice algo general de la categoría.

## Limpieza del código (2026-09-14)

- Se eliminaron del repositorio los duplicados que crea Finder («archivo 2»): `Components/InventoryTable 2.jsx` (versión anterior, sin la columna Condición) y `public/hot 2…10`.
- Se eliminaron 11 componentes sin uso (no los importa nadie ni se nombran en vistas, PHP o rutas): `AnimatedActionButton`, `AutomationAlert`, `Checkbox`, `DashboardActions`, `EconomicCharts`, `FormUI`, `QuickDateFilter`, `SalesChart`, `ToastNotification`, `UIProvider` y `Layouts/GuestLayout`.
- Fuera de git: se borraron 13 `.DS_Store` y 547 copias « 2» dentro de `public/build` (salida del build, se regenera).
- Verificado: ningún import roto, `php -l` limpio, el build compila y pasaban 230 tests (hoy 266).
- `InventoryTable.jsx` y `CrudUI.jsx` siguen en uso (Exportaciones y la pantalla de productos del vendedor).

Para detectar duplicados de nuevo:

```bash
find . -path ./src/vendor -prune -o -path ./src/node_modules -prune -o -name "* [0-9]*.*" -print
```

## Memoria del proyecto (memanto)

Diagrama: [`diagramas/memoria-proyecto.html`](diagramas/memoria-proyecto.html). Instalado el 2026-09-15, a pedido del usuario, para documentar y guardar junto con archify y graphify.

**Qué es y dónde está**
- **CLI:** [memanto](https://github.com/moorcheh-ai/memanto), versión 0.2.22 (commit `51b1b01`), instalada con pipx en `~/.local/bin/memanto`, más `moorcheh-client` (`pipx inject`).
- **Modo local, sin cuenta ni nube:** servidor Moorcheh Community Edition en Docker (contenedor `moorcheh-onprem-server`).
  - Escucha solo en `127.0.0.1:8095`, porque el 8080 lo usa otro proyecto.
  - Arranca solo con Docker (`restart: unless-stopped`).
  - Usa el Ollama de la Mac: `nomic-embed-text` (búsqueda, 274 MB) y `qwen2.5-coder:7b` (respuestas, ya estaba descargado).
  - Configuración en `~/.memanto/on-prem/state.json` y `~/.moorcheh/config.json`; memorias en `~/.moorcheh/data`.
- **Agente del proyecto:** `apple-boss`. Arrancó con 27 memorias (reglas del usuario, decisiones de datos, entorno, documentación y lo que sigue); con la base de Mac tiene 36. Solo guarda decisiones, reglas y datos que ahorran tokens, redactados como principio; nunca bitácoras.
- **Conexión global con Claude Code** (`memanto connect claude-code --global`):
  - skill en `~/.claude/skills/memanto/`;
  - sección MEMANTO en `~/.claude/CLAUDE.md`, más una entrada junto a archify y graphify con el disparador `/memanto`;
  - hooks en `~/.claude/settings.json`: al iniciar sesión regenera `MEMORY.md` en la raíz del proyecto; también corre antes de compactar y después de cada comando `memanto`;
  - permiso `Bash(memanto:*)` en `~/.claude/settings.local.json`;
  - una línea de estado, que se instala en la primera sesión.

**Uso**

```bash
memanto recall "de dónde sale el precio" --tool claude-code
memanto remember "Regla como principio" --type instruction --tags "precios,backend" --confidence 1.0 --provenance explicit_statement --source claude-code
memanto memory sync --project-dir .
memanto status
memanto ui
```

- `recall` busca por significado.
- `remember` guarda una memoria: siempre con tipo, etiquetas, confianza y procedencia, redactada como principio y no como bitácora.
- `memory sync` regenera `MEMORY.md`.
- `ui` abre el panel web.

**Pendientes y notas**
- **Hooks sin corregir:** el filtro de modo automático no me dejó corregir tres detalles en `~/.claude/settings.json`; queda a decisión del usuario.
  - Las entradas con `python` fallan porque en esta Mac solo existe `python3`.
  - El hook de antes de compactar quedó apuntando fijo a esta carpeta, en vez de a `$CLAUDE_PROJECT_DIR`.
  - Conviene anteponer `PATH="$HOME/.local/bin:$PATH"` para que los hooks encuentren `memanto`.
- **`MEMORY.md` en la raíz del repo:** se regenera en cada sesión; falta decidir si se versiona o se ignora.
- **Licencia:** Docker Hub describe la imagen como gratuita para despliegues de un solo nodo y no comerciales; aquí corre en un solo nodo y para uso interno.
- **Si el servidor no está arriba:** `docker start moorcheh-onprem-server`.
- **Para quitar todo:**
  - `memanto connect remove claude-code --global`;
  - `docker rm -f moorcheh-onprem-server`;
  - `pipx uninstall memanto`;
  - opcional: `ollama rm nomic-embed-text` y borrar `~/.memanto` y `~/.moorcheh`.

## Grafo del código (graphify)

`grafo/graphify-out/` contiene `graph.html` (interactivo), `graph.json` y `GRAPH_REPORT.md`. El grafo cubre las páginas alineadas, los componentes Admin y los controladores de inventario (incluye auditoría, catálogo, ficha técnica, API, modelos de referencia con su esquema, textos, comandos y herramientas, la comparativa pública, el header de la tienda, «Modelos y fotos» con su servicio de fotos la base de Mac y PC con sus esquemas, textos, trait común y generadores, la base de accesorios con su esquema, textos, descripción, ilustraciones y generador, el módulo de categorías con su controlador, su modelo, sus dos pantallas, el catálogo público y la tarjeta que comparten, el de colecciones con su controlador, su modelo, sus dos pantallas del panel y su página pública, el de portada con su controlador, su modelo, su pantalla, su modal y el inicio de la tienda, el de menú con su controlador, su modelo, su pantalla y el layout de la tienda, el de páginas con sus dos controladores, su modelo y sus dos pantallas, el de preguntas frecuentes con su controlador, su modelo, su pantalla, los hubs y la ficha del producto, el de servicios con su controlador, su modelo, su pantalla, sus piezas y la tarjeta que comparten tienda y panel, el de ubicaciones con su controlador, su modelo, sus dos pantallas, sus piezas, la ficha del local y el horario que comparten tienda y panel, y el de novedades con sus dos controladores, su modelo, su servicio de fotos, sus dos pantallas, sus piezas, la tarjeta que comparten tienda y panel, sus dos páginas públicas y el modelo del menú, el de Trade-In con su cuestionario, su modelo, sus dos controladores, su servicio de fotos, sus dos pantallas del panel, sus piezas, sus dos páginas públicas y las animaciones del hero, el de configuración con su controlador, su modelo, su pantalla, sus piezas y el nombre de la tienda que comparte toda la tienda, el de SEO con su controlador, su modelo y su resolutor, el del newsletter con sus tres controladores, sus dos modelos, su estado del servidor, sus dos trabajos de cola, su correo, sus cuatro pantallas y sus piezas, el botón de WhatsApp que flota, el de «Google y redes sociales» con su estado, su resolutor y el sitemap, el de exportaciones con su controlador y sus dos pantallas, el de usuarios y roles con su catálogo de permisos, su modelo, sus dos controladores, su middleware, su pantalla, sus piezas y su ícono, el **panel del vendedor** con el armazón compartido (`PanelShell`), su menú, las cinco pantallas que usan los dos paneles (`Components/Panel/`), «Mi día» con su tarjeta de meta, «Productos en stock» con su tabla, sus tres controladores y los cuatro soportes nuevos (`Busqueda`, `ActividadDelCliente`, `SinCostos` y `DatosDeLaTienda`) con la API de stock, la **base de productos Apple** con su esquema, su descripción, su generador y las ilustraciones, y el middleware de datos compartidos: 233 archivos, 2.341 nodos y 3.995 aristas; actualizado el 2026-09-16). Se regenera sin gastar tokens con un solo comando, desde la raíz del repo:

```bash
python3 docs/admin-ui/grafo/regenerar.py
```

- `grafo/mapa-fuentes.json` lista cada archivo del grafo con su ruta corta (la de `source_file` en `graph.json`, por ejemplo `Support/EsquemaCelular.php` o `Data/generar_iphone.py`) y su ruta real. Para sumar un archivo, agregarlo ahí.
- El script copia los archivos a `grafo/fuente/`, corre `graphify update fuente` y deja el resultado en `grafo/graphify-out/`, sin `fuente/`, `manifest.json` ni cachés. Si graphify falla, deja el grafo anterior. No toca nada fuera de `docs/admin-ui/grafo/`.
- Lo mismo a mano: copiar a `fuente/` con la ruta corta, mover `graphify-out` a `fuente/graphify-out`, correr `graphify update fuente`, borrar el `graphify-out` que deja graphify con solo su caché y devolver el resultado.

Los diagramas se regeneran con archify:

```bash
node ~/.claude/skills/archify/bin/archify.mjs deliver <tipo> <json> <html> --quality showcase
```
