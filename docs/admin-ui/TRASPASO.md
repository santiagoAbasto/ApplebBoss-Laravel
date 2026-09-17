# Traspaso: cómo retomar el trabajo

Estado al 2026-09-16, al cerrar el panel del vendedor (lo último que se hizo). Este archivo es para que otra sesión de Claude continúe sin el historial de la conversación. Leer esto primero y después [`README.md`](README.md). El prompt para arrancar esa sesión está en [`prompt-retomar.md`](prompt-retomar.md).

## Reglas de trabajo del usuario

- Responder en **español de Bolivia, con «tú»** (sin voseo).
- Ejecutar lo pedido sin pedir permiso paso a paso. **No hacer commit** si el usuario no lo pide (hoy nada está commiteado).
- **El vendedor no ve el costo ni la ganancia.** Ve el precio, el descuento que él hizo y lo que cobró. La regla está en `App\Support\SinCostos` y se aplica en el servidor (sus listas, `/api/stock/*` y sus PDF), nunca con CSS.
- **Servicio técnico: el vendedor registra solo lo que cobra y el administrador carga el costo.** Al registrarlo sale la nota; al administrador le llega el aviso «Falta el costo» en el Resumen y la alerta en Servicio técnico. Mientras falta el costo, ese servicio no suma utilidad en ningún reporte. Detalle en «El vendedor no ve el costo ni la ganancia» del README.
- **`Layouts/PanelShell.jsx` y `Components/Panel/*` son de los dos paneles a la vez** (administración y vendedor): cada cambio hay que mirarlo en los dos. El color de cada panel sale de la variable CSS `--ab-acento`, no de un hex escrito a mano. El encabezado del menú lateral usa la silueta del logo (`public/images/logo-appleboss-marca.png`: blanca, sin el texto «APPLE BOSS» de la imagen original) a 36 px pegada a la izquierda, con «Apple Boss» y, en el vendedor, la insignia centrados en el ancho del menú, en un encabezado de 64 px como la barra de arriba (en el celular la X va a la derecha).
- **No iniciar sesión en el panel ni escribir credenciales.** Verificar con `npm run build`, la suite de tests y `tinker`; si hace falta ver la UI, pedir capturas.
- Reglas del ecommerce:
  - El precio nunca se acepta desde el frontend.
  - MYSKIN solo aplica a fundas.
  - Lo público nunca muestra costo, ganancia, IMEI (ni su estado), procedencia o proveedor, notas privadas, datos de clientes ni datos financieros internos. El número de serie sí se puede mostrar.
  - La condición comercial (Nuevo/Seminuevo) es explícita y nunca se inventa.
  - Nada de afirmaciones sin verificar.
- Cada módulo terminado se documenta en `docs/admin-ui/README.md`, con diagramas **archify** en `docs/admin-ui/diagramas/` y el grafo **graphify** en `docs/admin-ui/grafo/`.
- Al cerrar un módulo, revisar si quedaron duplicados de Finder («archivo 2») o componentes sin uso.

## Entorno

- Docker: `appleboss-app` (PHP 8.5 + Laravel 13), `appleboss-db` (PostgreSQL 18) y `appleboss-node` (Node 24, build con Vite 8). El código está en `src/`. Frontend: React 19, Inertia 3 y Tailwind 3.4 (se queda en la 3 por los iPhone con iOS viejo). Stack actualizado el 2026-09-16: [`informes/actualizacion-stack-2026-09-16.md`](informes/actualizacion-stack-2026-09-16.md).
- Tests (corren en SQLite, así que no usar SQL exclusivo de PostgreSQL): `docker exec appleboss-app php artisan test`. Último resultado: 563 pasan (2026-09-16).
- Build: `docker exec appleboss-node npm run build`.
- Diagramas: `node ~/.claude/skills/archify/bin/archify.mjs deliver <tipo> <json> <html> --quality showcase`.
- Memoria: memanto, en modo local. Servidor Moorcheh en Docker en `127.0.0.1:8095` y Ollama de la Mac; el agente del proyecto es `apple-boss`. Antes de una tarea grande: `memanto recall "<tema>" --tool claude-code`. Detalle en la sección «Memoria del proyecto» del README.

## Qué ya está hecho

**Alineados con `Components/Admin/ui.jsx`:**
- Ventas y operación: servicios, cotizaciones, egresos, reportes y clientes.
- Inventario: celulares, computadoras, productos Apple, productos generales y auditoría.
- Tienda online → «Productos en la tienda»: listado, importar y editor, con la ficha técnica con íconos SVG y la batería leída en vivo del inventario.
- Tienda online → «Categorías»: los estantes de la tienda. Dice de qué inventario sale cada una, dónde se muestra (inicio, catálogo, menús y carrusel), la portada de su página y su título en Google. Accesorios pasó al inicio y sus tipos (cargadores, vidrios, protectores, fundas y cables) filtran el catálogo. Detalle en la sección «Categorías (admin)» del README.
- Tienda online → «Colecciones»: las vitrinas que se arman a mano, para una campaña. Estaban desconectadas (no las mostraba ninguna página y el carrusel del inicio ignoraba cuál se había elegido); el 2026-09-16 se cablearon: cada colección tiene su página `/coleccion/{slug}`, sale en el inicio con la sección «Colección de productos», aparece como destino en «Menú», lleva su título en Google con URL canónica y entra en el sitemap. En la tienda solo se muestra lo que sigue a la venta. Detalle en la sección «Colecciones (admin)» del README.
- Tienda online → «Portada»: el orden del inicio. Las secciones no se crean ni se borran; acá se encienden, se mueven y se editan. El panel dice qué muestra hoy cada una y por qué una queda fuera, con la misma cuenta que hace la tienda (`HomeSection::filtrar()`, la regla única). El 2026-09-16 se cableó «Ofertas» (publicaciones con precio promocional vigente), «Nuevos ingresos» pasó a resolverse en el backend, se quitaron dos tipos fantasma, se expusieron las fechas de publicación y el precio rebajado empezó a verse en las tarjetas y a cobrarse en el carrito (`precioPublico()`). Detalle en la sección «Portada (admin)» del README.
- Tienda online → «Menú»: los tres menús de la tienda (barra de arriba, lista del celular y pie de página), que se editan por separado. La pantalla muestra una vista previa real de cada uno y avisa cuando a la computadora y al celular les faltan enlaces del otro, con un botón para copiarlos. El 2026-09-16 se arreglaron los enlaces a otros sitios (se rompían con el Link de Inertia), «abrir en otra pestaña» en los tres menús, el verde de MYSKIN en el pie y el enlace sin dirección del menú de arriba. Detalle en la sección «Menú (admin)» del README.
- Tienda online → «Páginas»: las páginas de solo texto (Nosotros, Garantía, Envíos…). El 2026-09-16 se pudieron por fin crear, ordenar, encender y borrar desde el listado (antes solo se editaba lo que dejó el seeder); el panel avisa cuál está encendida y sin texto, dice dónde figura cada una y al borrarla oculta los enlaces del menú que llevaban a ella. Detalle en la sección «Páginas (admin)» del README.
- Tienda online → «Preguntas frecuentes»: cada pregunta se muestra en un solo lugar de la tienda (el final del inicio, la ficha de todos los productos, /iphone o /seminuevos). El 2026-09-16 se descubrió que los alcances «categoría» y «producto» del panel no los leía nadie y que la ficha del producto y los dos hubs mostraban preguntas escritas dentro del código: una migración las pasó a la base y ahora todo lo que lee el cliente se edita desde el panel. Detalle en la sección «Preguntas frecuentes (admin)» del README.
- Tienda online → «Servicios»: las tarjetas de «Nuestros servicios» del inicio. El 2026-09-16 se descubrió que la tienda mostraba cuatro servicios escritos en el código cuando no había ninguno encendido y que Portada decía «Se ve» igual. Se quitaron; ahora cada tarjeta puede solo informar, abrir WhatsApp con un mensaje sobre ese servicio o llevar a una página (también las páginas informativas, que se sumaron como destino en todo el panel), el título de la sección se cambia en Portada y la pantalla trae una guía para escribirlas sin prometer de más. Detalle en la sección «Servicios (admin)» del README.
- Tienda online → «Ubicaciones»: los locales, único lugar de la dirección, el horario (día por día, con «Abierto ahora»), el contacto y el mapa. El 2026-09-16 se descubrió que la tienda mezclaba esos datos con Configuración y que el horario que se veía y leía Google era el valor de ejemplo de la instalación: se quitaron las claves repetidas de Configuración, el inicio muestra todos los locales encendidos (el primero es el principal: da la ciudad, la dirección del pie y los datos para Google) y el formulario trae los pasos exactos para copiar el mapa de Google Maps. **Falta que el usuario cargue el horario real y la dirección con calle.** Detalle en la sección «Ubicaciones (admin)» del README.
- Tienda online → «Novedades»: las publicaciones con fecha (un equipo que llegó, una guía, un aviso). El 2026-09-16 se descubrió que no había ninguna y aun así el pie y el sitemap llevaban a una `/novedades` vacía, que la tienda las dibujaba con un tema oscuro propio y que el panel pedía una «Posición» que nadie usaba. Ahora se crean como borrador, se publican o se programan con fecha y hora, la dirección queda fija al publicarlas y la foto se guarda con sus variantes. El inicio suma la sección «Novedades» de Portada; la sección, el enlace del pie y el sitemap aparecen solos con la primera publicada. **Falta que el usuario escriba la primera.** Detalle en la sección «Novedades (admin)» del README.
- Tienda online → «Trade-In» y el formulario público `/trade-in`: el cliente cuenta cómo está el equipo que quiere entregar y recibe un valor estimado por WhatsApp. El 2026-09-16, a pedido del usuario, el formulario pasó a un cuestionario profesional de seis pasos (`App\Support\TradeIn\Cuestionario`: cuenta, bypass, IMEI, cada pieza, estado físico, batería, historial de piezas, reparaciones, accesorios y fotos) para que la cotización se acerque al valor de la revisión. **Se recibe de todo:** además de Apple, Celular Android, Laptop, PC de escritorio, Consola y Otro, cada uno con sus preguntas (marca, procesador y gráfica, cuenta de Google, contraseña de BIOS, baneo, lectora, controles…). El hero deja el contenido en 1224 px, con siluetas animadas en los márgenes de afuera y, a la derecha del texto, un equipo en revisión que va pasando por iPhone, Android, laptop y consola (`FloatingDevices.jsx`). Se corrigió que la confirmación mostraba el nombre y el teléfono a cualquiera con el código correlativo y que su botón de WhatsApp estaba roto. En el panel, cada solicitud trae un grado sugerido y alertas, se le escribe por WhatsApp con el mensaje listo, se sigue por etapas con historial y avisa en el Resumen y en el menú. Detalle en la sección «Trade-In (admin)» del README.

- Tienda online → «Configuración»: los datos generales de la tienda. El 2026-09-16 se descubrió que el nombre de la tienda estaba escrito a mano en unos 30 lugares de la tienda (el encabezado, el pie, el copyright, todos los mensajes de WhatsApp, las volantas de los hubs y la comparativa), que la barra de anuncio tenía el texto dentro del código y que el hero y el SEO del inicio se pedían acá aunque se editan en Portada y en «Google y redes sociales». Ahora manda el panel, la barra vacía no se dibuja, el guardado valida de verdad y la pantalla dice qué se carga en cada otro módulo. Detalle en la sección «Configuración (admin)» del README.

- Marketing y Google → «Campañas», «Suscriptores» y «Ajustes del newsletter»: el circuito para juntar correos en la tienda y mandarles campañas. El 2026-09-16 se descubrió que el panel no decía si los correos podían salir (con el correo del servidor sin configurar o la cola detenida, la campaña se quedaba «enviando» para siempre), que los errores del proveedor llegaban en inglés, que la búsqueda de suscriptores era solo de PostgreSQL y que la regla de «no se puede enviar» estaba repartida sin explicar el motivo. Ahora hay una tarjeta «¿Está todo listo para enviar?», un botón para mandarse un correo de prueba y las tres pantallas siguen la línea del panel. **En producción lo único que queda por cargar es la clave de la cuenta de correo (`MAIL_PASSWORD`).** Detalle en la sección «Newsletter (admin)» del README.
- Tienda pública → el **botón de WhatsApp que flota** se rehízo el 2026-09-16: la marca sólida (burbuja llena con el auricular calado), más presencia, entrada con rebote, ondas, guiño, burbuja de saludo una vez por visita y **tope en la línea del copyright**. Sus animaciones estaban escritas en `resources/css/app.css`, que no entra en el build: nunca se movieron. Detalle en la sección «Botón de WhatsApp que flota» del README.

- Marketing y Google → «Google y redes sociales»: el título y la frase de cada página en Google y la foto al compartir. El 2026-09-16 se descubrió que la página de una colección no tenía fila en `seo_pages` (era la única que no se podía editar), que el panel no decía qué página estaba corta, larga o sin texto, que nadie avisaba de que `APP_URL` sigue siendo la de prueba (de ahí salen las URL canónicas y las del sitemap) y que solo había vista previa de Google, no de WhatsApp. Detalle en la sección «Google y redes sociales (admin)» del README.
- Exportar datos → «Exportaciones» y «Exportador»: el inventario en PDF. El 2026-09-16 se descubrió que el pie del PDF tenía el teléfono y la dirección escritos en la plantilla, que se ofrecían PDF de tipos sin stock (y el aviso de «no hay productos» no se veía, porque se abren en otra pestaña), que el buscador usaba `ilike` y que el selector del exportador se dibujaba en una columna. Ahora el pie sale de Configuración y de Ubicaciones, cada tarjeta dice cuántos hay y el exportador cuenta en vivo antes de generar nada. Detalle en la sección «Exportaciones y Exportador (admin)» del README.
- Sistema → «Usuarios y roles» (**módulo nuevo**, 2026-09-16): quién entra al panel y a qué parte. Los roles pasaron a ser datos (tabla `roles`) con permisos por módulo, que hace cumplir `PermisoMiddleware` en el servidor y respeta el menú. `users.rol` era un `enum('admin','vendedor')`, así que la base rechazaba cualquier rol nuevo: ahora es texto. El vendedor quedó igual que siempre (su panel es `/vendedor`). Detalle en la sección «Usuarios y roles (admin)» del README.

**Tienda pública (2026-09-15):**
- **Comparativa** de hasta 4 modelos de iPhone en `/comparar/iphone` y de Mac en `/comparar/mac`.
  - Datos técnicos de la base de modelos de referencia; precio y stock del inventario.
  - Rediseñada para que se lea mejor: títulos de fila visibles, valores alineados a su columna, muestras de color y listas largas resumidas.
  - Está en el header (menú «Comparar»), en el menú del celular y en el footer.
- **Header:** en celular, logo a la izquierda y menú a la derecha. Fondo sólido, sin el parpadeo blanco al hacer scroll. Las fuentes se cargan una sola vez.
- **Carrusel del inicio:** ya no muestra especificaciones fijas.
- **Admin, Tienda online → «Modelos y fotos»:** para subir la foto de cada modelo que usa la comparativa, con la guía [`guia-fotos-modelos.md`](guia-fotos-modelos.md).
- El detalle está en el README, en las secciones «Comparativa pública de modelos», «Modelos y fotos (admin)» y «Header de la tienda».

El detalle de cada módulo está en `README.md`.

## Trabajo en curso: base de modelos de referencia (iPhone y Mac)

El usuario pega páginas de comparación de Apple y con eso se arma una base profesional de fichas. Sirve para:
1. Llenar sola la ficha al publicar un equipo.
2. Estimar la autonomía de un seminuevo según la salud de su batería.
3. Alimentar la comparativa pública (`/comparar/iphone`, ya hecha) y un futuro recomendador con IA.

Hoy hay **38 iPhone**, todos completos: la lista actual del comparador de Apple desde el X, es decir, las generaciones X a 17 (con el 16e, el 17e y el Air), el 18 Pro, el 18 Pro Max y el iPhone Duo (plegable). El comparador también lista el 7, el 7 Plus, el 8 y el 8 Plus, que el usuario dejó fuera al empezar desde el X. Todos los iPhone disponibles del inventario ya tienen ficha. Los precios nunca salen de Apple: vienen del inventario.

Desde el 2026-09-15 también hay **16 Mac** y **una PC** (la Lenovo IdeaPad Gaming 3 de la #10, por su MTM): las computadoras que había en stock ese día. Detalle en la sección «Computadoras (Mac y PC)» del README y en [`informes/computadoras-2026-09-15.md`](informes/computadoras-2026-09-15.md).

Y hay **29 fichas de productos Apple (4 de otras marcas cargadas en «Productos Apple», fuera de la comparativa)** (tipo `producto_apple`: iPad Wi‑Fi, Apple Watch, AirPods, Apple Pencil y Magic Mouse), todas con su página técnica de Apple y un ícono SVG por dato; se reconocen por el nombre del inventario, llenan la ficha y la descripción de la publicación y alimentan `/comparar/apple`. Detalle en la sección «Productos Apple en la base de modelos» del README y en [`informes/productos-apple-2026-09-16.md`](informes/productos-apple-2026-09-16.md).

Y hay **58 fichas de accesorios** (tipo `producto_general`): una por cada tipo de accesorio disponible ese día (cargadores, vidrios, protectores, fundas, cables y accesorios de marca). Se reconocen por el nombre del inventario, llenan la descripción y la ficha de la publicación y alimentan las comparativas `/comparar/cargadores` y `/comparar/vidrios`. Detalle en la sección «Accesorios en la base de modelos» del README y en [`informes/accesorios-2026-09-15.md`](informes/accesorios-2026-09-15.md).

| Pieza | Archivo |
|---|---|
| Datos generados (no editar a mano) | `src/database/data/modelos_referencia/iphone.php` |
| Generador de fichas | `src/database/data/modelos_referencia/herramientas/generar_iphone.py` |
| Auditor contra la página pegada | `src/database/data/modelos_referencia/herramientas/auditar_iphone.py` |
| Páginas pegadas antes (se recuperan de las transcripciones) | `src/database/data/modelos_referencia/herramientas/extraer_paginas.py` |
| Esquema y validación | `src/app/Support/FichaTecnica/EsquemaCelular.php` |
| Textos de la ficha | `src/app/Support/FichaTecnica/TextosCelular.php` |
| Carga y detección | `database/seeders/ModelosReferenciaSeeder.php`, `app/Models/ModeloReferencia.php`, `app/Support/InventarioCatalogo.php` |
| Comandos | `php artisan modelos:verificar`, `php artisan modelos:pendientes [--markdown]` |
| Ficha pública y editor | `resources/js/Components/Store/fichaTecnica.jsx` e `Icons.jsx` (un SVG propio por característica; `tests/Feature/FichaTecnicaIconosTest.php` falla si un dato no tiene campo o si un ícono se repite) |
| Mac: datos, generador, esquema y textos | `computadora.php`, `herramientas/generar_computadoras.py`, `EsquemaComputadora.php` (con el trait `Concerns/RevisaEsquema.php`) y `TextosComputadora.php` |
| PC: datos, generador, esquema y textos | `pc.php`, `herramientas/generar_pc.py`, `EsquemaPc.php` y `TextosPc.php`; campos por familia con `camposDeFamilia()` en `fichaTecnica.jsx` |
| Accesorios: datos, generador, esquema, textos y descripción | `accesorios.php`, `herramientas/generar_accesorios.py`, `EsquemaAccesorio.php`, `TextosAccesorio.php` y `ContenidoAccesorio.php`; detección en `ModeloReferencia::detectarAccesorio()`; ilustraciones en `Components/Store/AccesorioVisual.jsx` |
| Pendientes documentados | `docs/admin-ui/modelos-referencia-pendientes.md` (24 «falta» y 7 «verificar»: los 5 de iPhone y Mac —RAM y batería del Duo, batería solo eSIM del 18 Pro y del 18 Pro Max, identificador del MacBook Neo— y los de accesorios, que detalla el informe) |
| Verificación en Apple del primer informe | `docs/admin-ui/informes/verificacion-apple-2026-09-15.md` |
| Prompt de la segunda ronda (ya aplicado; sirve de plantilla) | `docs/admin-ui/prompt-huecos-modelos.md` |
| Comparativa pública | `app/Http/Controllers/ComparadorModelosController.php`, `resources/js/Pages/Store/CompararModelos.jsx`, `Components/Store/comparativa.jsx`, `ModeloVisual.jsx` y `tonosColor.js` |
| Fotos de los modelos (admin) | `app/Http/Controllers/Admin/ModeloReferenciaController.php`, `app/Services/FotoModeloService.php`, `resources/js/Pages/Admin/Modelos/` y `Components/Admin/modelos.jsx`; guía en `docs/admin-ui/guia-fotos-modelos.md` |
| Tests | `tests/Feature/EsquemaFichaCelularTest.php`, `tests/Feature/EsquemaFichaComputadoraTest.php`, `tests/Feature/EsquemaFichaPcTest.php`, `tests/Feature/ModelosReferenciaTest.php`, `tests/Feature/ComparadorModelosTest.php`, `tests/Feature/ModelosFotosAdminTest.php` y `tests/Feature/FichasAccesoriosTest.php` |
| Diagramas | `docs/admin-ui/diagramas/modelos-referencia.html`, `computadoras-mac.html` y `accesorios.html` |
| Grafo del código | `docs/admin-ui/grafo/graphify-out/` (cómo regenerarlo: sección «Grafo» del README) |

### Cómo agregar modelos cuando el usuario pega una comparación

1. Guardar la página pegada en un `.txt` en el scratchpad. Las que se pegaron en conversaciones anteriores se recuperan con `python3 extraer_paginas.py <carpeta>` (si el usuario pega varias páginas en un mismo mensaje, las separa).
2. En `generar_iphone.py`, definir cada modelo heredando del más parecido con `mezclar()` y sumarlo a `MODELOS` con sus alias y pendientes.
3. Si la página trae una función nueva:
   - Sumar el campo a `EsquemaCelular::CAMPOS`, con validación si corresponde.
   - Ponerlo en `False` («no tiene») en la base `X` del generador, para que lo hereden los modelos anteriores.
   - Generar su texto en `TextosCelular`.
   - Si se muestra en la tienda, agregar el campo con un SVG nuevo en `fichaTecnica.jsx` / `Icons.jsx`. `FichaTecnicaIconosTest` falla si falta el campo o si el ícono ya lo usa otra característica.
4. `python3 generar_iphone.py`.
5. `python3 auditar_iphone.py pagina.txt "iPhone 16" "iPhone 16 Pro"`. Cada campo que liste debe quedar en `pendientes` como `verificar`, con detalle y fuente.
   - La página trae varios modelos juntos: un valor puede aparecer por otro modelo. Revisar el contexto con `grep -B3`.
   - También puede marcar un dato que sí está, pero escrito distinto (por ejemplo «adaptador 20 W» sin «de»). Confirmarlo en la página antes de anotarlo y, si hace falta, ajustar el patrón en `auditar_iphone.py`.
6. **Regla del usuario:** todo dato cargado que no salga de la página pegada se anota como pendiente.
   - Solo `sistema.ios_maximo` y `sistema.numeros_modelo` pueden quedar vacíos (`falta`).
   - Si pide un modelo que no está en la página, armarlo desde el modelo hermano, marcar como `verificar` todo lo propio y avisarle.
7. Verificar:
   - `docker exec appleboss-app php artisan modelos:verificar` debe dar 0 errores.
   - Sumar tests de textos y detección.
   - Correr la suite completa y el build.
8. Cargar y documentar (y al final regenerar el grafo y, si cambió el flujo, el diagrama):
   - `docker exec appleboss-app php artisan db:seed --class=ModelosReferenciaSeeder --force`.
   - Desde la raíz del repo: `docker exec appleboss-app php artisan modelos:pendientes --markdown --no-ansi > docs/admin-ui/modelos-referencia-pendientes.md`.
   - Actualizar en `README.md` la línea «Hoy (N modelos…)».

### Cómo agregar una Mac

1. Abrir la ficha oficial: en `support.apple.com/<país>/docs/mac/<id>`, el enlace «Especificaciones técnicas» lleva a `support.apple.com/es-lamr/<id>`. Cotejarla con la versión `en-us`.
2. En `generar_computadoras.py`, armar el modelo con `mac()` (chip de Apple) o `intel()` y sus piezas comunes, y sumarlo a `MODELOS` y a `FUENTES`.
3. El último macOS sale de las listas de compatibilidad de Apple y el identificador, de «Identificar el modelo». Lo que Apple no publica se anota como pendiente o con su fuente externa.
4. `python3 generar_computadoras.py`, `modelos:verificar` (0 errores), tests, seeder y `modelos:pendientes --markdown`, igual que con los iPhone.

### Cómo agregar una PC

1. Pedir el número de parte de la etiqueta de abajo (Lenovo: el MTM).
2. La configuración exacta está en la página del número de parte en lenovo.com: los datos del MTM vienen en la página (curl con user agent de navegador). PSREF se arma con JavaScript y WebFetch la ve vacía; su PDF sí se lee.
3. Sumar el modelo en `generar_pc.py`: una ficha por configuración. Si es otra línea (Legion, LOQ…), agregarla en `ModeloReferencia::lineaDe()`.
4. Igual que con las Mac: generar, `modelos:verificar`, tests, seeder y pendientes.

### Cómo agregar un producto Apple

1. Ver cómo está escrito en el inventario (Productos Apple) y si ya lo reconoce una ficha: el importador lo dice.
2. Buscar su página técnica en `support.apple.com/en-us/docs/ipad` (o `airpods`, `watch`, `accessories`) → el producto → «Tech Specs»; descargar la de EE. UU. y la de `es-lamr`.
3. En `generar_productos_apple.py`, sumar la ficha en IPADS, RELOJES, AIRPODS o ACCESORIOS_APPLE, con `detectar`, la ficha, el contenido (sin superlativos) y su fuente en `FUENTES`. Lo que Apple no publica, con dos fuentes externas que coincidan; si no, pendiente «falta». Los iPad de la tienda son Wi‑Fi.
4. `python3 generar_productos_apple.py`, `modelos:verificar` (0 errores), sumar el nombre a la tabla de `FichasProductosAppleTest`, seeder y tests. Detalle en [`informes/productos-apple-2026-09-16.md`](informes/productos-apple-2026-09-16.md).

### Cómo agregar un accesorio

1. Buscar en el inventario cómo está escrito (Productos generales, por nombre) y si ya lo reconoce una ficha: el importador de la tienda lo dice («Ficha: …» o «Sin ficha»).
2. En `generar_accesorios.py`, sumar la ficha en su lista (CARGADORES, VIDRIOS, PROTECTORES, FUNDAS, CABLES o ACCESORIOS), con `detectar` (y `excluir` si hace falta), la ficha, el contenido y su fuente en `FUENTES`. Lo específico va antes que lo general.
3. Originales de marca: primero la página oficial; lo que la marca no publica va con su fuente como pendiente «verificar». Genéricos: solo lo que el producto es por definición o lo que dice su nombre. Una clave nueva de la ficha necesita su campo y su SVG en `fichaTecnica.jsx` / `Icons.jsx` y su lugar en `EsquemaAccesorio::FICHA`.
4. `python3 generar_accesorios.py`, `modelos:verificar` (0 errores), sumar el nombre a la tabla de `FichasAccesoriosTest`, seeder y pendientes, igual que con las Mac.

## Lo que sigue (en orden)

1. **La base de iPhone está completa** según el comparador actual de Apple. Si Apple suma otro modelo, se agrega igual (paso a paso, arriba).
2. **La base de iPhone no tiene pendientes.** El 2026-09-15 se hicieron dos rondas, con el detalle en [`informes/verificacion-apple-2026-09-15.md`](informes/verificacion-apple-2026-09-15.md):
   - **Primera:** se contrastó un informe hecho con IA contra las páginas oficiales de Apple. El informe tenía errores.
   - **Segunda:** se cerró el resto con Apple EE. UU. (el usuario importa desde allá: ante dos fuentes de Apple, vale la de EE. UU.) y, para el 18 Pro, el 18 Pro Max y el Duo, con las fichas de Apple de cada país y fuentes externas.

   **Antes de cargar un dato, abrir siempre la página citada.**
   - **Decidido con el usuario (2026-09-15):**
     - SIM: la ficha del modelo avisa qué unidades son solo eSIM, sin usar la procedencia del equipo. Campo `conectividad.solo_esim_en`: del 14 al 16e, «EE. UU.»; en la familia 17, «EE. UU., Canadá, México, Japón y otros 9 territorios»; en el 18 Pro y el 18 Pro Max, «EE. UU. y Canadá».
     - SOS vía satélite: se mantiene «SOS vía satélite (no disponible en Bolivia)».
     - 5G mmWave: la red móvil avisa «las unidades de EE. UU. también admiten 5G mmWave» (campo `conectividad.mmwave_en`). Aplica del 12 al 18 Pro y al Duo, salvo el SE (3.ª generación), el 16e, el Air y el 17e.
   - **Ojo con las publicaciones ya creadas:** guardan una copia de la ficha y «Llenar desde modelo» solo completa campos vacíos, así que un cambio en la base no les llega solo. La del iPhone 14 Plus (la única con modelo hoy) se corrigió con tinker para sumar el aviso de mmWave.
3. **Comparativa pública: hecha para iPhone y Mac.**
   - **Fotos:** se suben en Tienda online → «Modelos y fotos». El usuario las va a cargar con la guía `guia-fotos-modelos.md`; mientras tanto se ve la ilustración.
   - **Mac:** hecha el 2026-09-15. Dice «Sin stock ahora» hasta que las Mac se publiquen desde «Productos en la tienda»; la publicación se enlaza sola al modelo cuando no hay dudas. Las fotos de las Mac se suben en la misma pantalla.
4. **Base de Mac: hecha** con las 16 que había en stock. Falta que el usuario revise la #26. La Lenovo (#10) ya tiene ficha por su MTM (`EsquemaPc`) y la ASUS (#13) está vendida: no hace falta. La base de **productos Apple** quedó hecha el 2026-09-16: 29 fichas (4 de otras marcas, fuera de la comparativa), ficha pública con un ícono SVG por dato y la comparativa `/comparar/apple` (ver «Productos Apple en la base de modelos» del README). Los iPad son Wi‑Fi, salvo un iPad Pro M5 Wi‑Fi + Cellular. Sus 49 productos del inventario reconocen su ficha y estas fichas no tienen datos pendientes.
5. **Recomendador con IA** (presupuesto + área de trabajo). Los precios salen del inventario y la IA no inventa características.
6. **Tienda online quedó completo:** Categorías el 2026-09-15, y Colecciones, Portada, Menú, Páginas, Preguntas frecuentes, Servicios, Ubicaciones, Novedades, Trade-In y Configuración el 2026-09-16. No queda ningún módulo con el diseño anterior.
7. **Todo el panel quedó alineado y cableado**, incluidos Marketing y Google, Exportar datos, el módulo nuevo de Usuarios y roles y el **panel del vendedor** (`/vendedor`). No queda ninguna pantalla con el diseño anterior.
   - Los dos paneles comparten el armazón (`Layouts/PanelShell.jsx`) y las pantallas de reservas, clientes, servicios, cotizaciones y «Nueva venta» (`Components/Panel/`), con un `prefijo` que arma los nombres de ruta. Si tocas una de esas piezas, estás tocando los dos paneles: mira los dos.
   - La **meta del mes** del vendedor sale de `users.meta_mensual` y la carga el administrador en Usuarios y roles. En 0 el panel dice que no hay meta.
   - **El vendedor no ve el costo ni la ganancia en ningún lado.** Ve el precio, el descuento que él hizo y lo que cobró. La regla está en `App\Support\SinCostos` y se aplica en el servidor: no viajan en el JSON de sus pantallas, ni en `/api/stock/*`, ni en sus PDF. El costo real de cada venta lo recalcula el servidor desde el producto, así que no hace falta que el navegador lo conozca.
   - En servicio técnico el vendedor ya no escribe ningún costo: registra lo que paga el cliente, sale la nota y el administrador carga el costo desde la lista (le llega el aviso «Falta el costo»). Mientras falta, el servicio no suma utilidad en los reportes.
   - Cada panel tiene su color, y viaja como variable CSS (`--ab-acento`): **#585E9F** en administración, **#5C5E99** en el del vendedor, con el menú en degradado de morado fuerte arriba a morado suave abajo.
8. **Newsletter: listo y cableado.** Falta solo cargar la clave del correo en el servidor de producción y comprobarla con «Enviar prueba» en Ajustes.
9. **Portada grande (hero) cableada el 2026-09-16**, a pedido del usuario: la volanta, el título, el texto, el segundo botón y los colores de Portada ya se ven en la tienda sin tapar el equipo (detalle en «Portada (admin)» del README).
