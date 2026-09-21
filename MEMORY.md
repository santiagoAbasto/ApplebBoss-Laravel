# Memory — apple-boss

> Generated: 2026-09-21 15:49:31  
> Total memories: **110**  
> Breakdown: instruction: 23, fact: 11, decision: 25, goal: 2, preference: 14, context: 4, learning: 25, artifact: 3, error: 3

---

## Instructions

*Standing rules, constraints, and guidelines to always follow.*

### Skills sin romper el proyecto

> Las skills (archify, graphify, memanto) no deben romper nada del proyecto. Memanto guarda solo decisiones y datos que ahorran tokens, nunca bitácoras. La documentación final va a docs/admin-ui/README.md y al README raíz.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:41:28 | Tags: `skills`, `memanto`, `archify`, `graphify`*

### En Apple Boss (repositorio público) nunca se escri...

> En Apple Boss (repositorio público) nunca se escriben contraseñas, tokens ni correos de personas en el código, seeders y tests incluidos. La primera cuenta de administrador sale de SEED_ADMIN_NAME, SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en .env (UserSeeder), el seeder nunca cambia la contraseña de una cuenta que ya existe y los vendedores se crean desde Usuarios y roles. Antes de un push, revisar lo versionado con git grep buscando credenciales y correos personales.

*Confidence: 1.0 | Status: active | Created: 2026-09-17T04:39:17 | Tags: `seguridad`, `credenciales`, `seeders`, `git`, `apple-boss`*

### Condición comercial y afirmaciones verificables

> La condición comercial (Nuevo, Seminuevo…) debe ser explícita y verificable; nunca se inventa ni se actualiza en masa. La tienda no muestra afirmaciones no verificadas (Apple Authorized, el mejor precio, garantía oficial, envío nacional, etc.).

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `condicion-comercial`, `contenido-tienda`, `verificacion`*

### WhatsApp y SMTP

> La configuración de WhatsApp queda como está (null hasta que el usuario la configure) y las credenciales SMTP van solo en .env. A Inertia solo se comparte una lista blanca de configuracion_tienda.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `configuracion`, `smtp`, `whatsapp`*

### MYSKIN solo para fundas

> MYSKIN es una marca solo para fundas/cases; no es un fabricante y no se asigna a otras categorías.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `myskin`, `catalogo`, `marcas`*

### Un agente de memoria por proyecto: 'apple-boss' es solo de PROYECTO APPLE BOSS

> Memanto usa un agente por proyecto y solo uno esta activo a la vez en toda la Mac. El agente 'apple-boss' pertenece unicamente a la carpeta /Users/user/Projects/PROYECTO APPLE BOSS. Antes de leer o guardar memorias, comprobar con 'memanto status' que el agente activo es el de la carpeta donde corre la sesion; si no coincide, activarlo con 'memanto agent activate <id>' (lista en 'memanto agent list'). Si el proyecto todavia no tiene agente, crearlo con 'memanto agent create <nombre> --pattern project', donde <nombre> es la carpeta sin la palabra PROYECTO, en minusculas y con guiones, y copiarle las preferencias con tag global. Despues regenerar MEMORY.md con 'memanto memory sync'. Si este MEMORY.md aparece en otra carpeta, no corresponde a ese proyecto.

*Confidence: 1.0 | Status: active | Created: 2026-09-20T14:19:05 | Tags: `memanto`, `agentes`, `proyectos`, `separacion`*

### Sin migraciones ni refactors masivos

> No migrar framework, base de datos, CSS, JS a TypeScript ni la arquitectura; nada de refactors masivos ajenos al ecommerce.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `arquitectura`, `alcance`, `refactor`*

### Alcance de las correcciones de la tesis

> En el documento de grado se subsana unicamente lo que el informe del revisor observa: nada de renombrar capitulos, actualizar cifras del sistema ni corregir apartados que el informe no menciona, aunque esten desactualizados o mal. Lo que se detecte de mas se informa aparte y se deja a decision del usuario.

*Confidence: 1.0 | Status: active | Created: 2026-09-18T21:15:13 | Tags: `tesis`, `alcance`, `revisor`*

### Ejecutar sin pedir permiso y sin commits

> Ejecutar los pedidos sin pedir permiso para cada paso. No hacer commit salvo que el usuario lo pida explícitamente.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `flujo-de-trabajo`, `git`, `commits`, `global`*

### Fuentes de los datos de iPhone

> En la base de modelos de iPhone, todo dato que no salga de la página oficial de Apple se anota como pendiente con su fuente. Ante dos fuentes de Apple que no coinciden vale la de EE. UU., porque el negocio importa desde EE. UU.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `modelos-referencia`, `fuentes`, `verificacion`*

### El precio lo decide el backend

> Nunca aceptar un precio desde el frontend: el frontend envía producto y cantidad y el backend busca el precio. Los precios salen siempre del inventario, nunca de Apple.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `precios`, `seguridad`, `backend`*

### Verificar sin iniciar sesión en el panel

> No iniciar sesión en el panel admin ni escribir credenciales. Verificar con la suite de tests, el build y tinker; las pantallas del admin se revisan con un render estático (esbuild + renderToStaticMarkup con los props reales sacados con tinker) que después se borra.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `verificacion`, `admin`, `credenciales`*

### Contenido de accesorios: los genéricos (fundas, vi...

> Contenido de accesorios: los genéricos (fundas, vidrios, cubos certificados, cables sin marca) llevan descripción genérica con solo lo que el producto es por definición o lo que dice su nombre; los originales de marca llevan los datos de su página oficial y lo que sale de terceros queda como pendiente verificar. Un producto de marca con precio de réplica no lleva datos de la marca hasta confirmar que es original.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T21:02:20 | Tags: `accesorios`, `contenido-tienda`, `verificacion`, `replicas`*

### La dirección web (slug) de una categoría o de una ...

> La dirección web (slug) de una categoría o de una colección de la tienda no se edita desde el panel: se muestra en solo lectura. En las categorías agrupa las publicaciones ya publicadas; en las colecciones, los enlaces compartidos y los del menú apuntan ahí. La de una colección se arma con su nombre al crearla, sin repetirse; si quedó mal, se borra la colección y se crea otra.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T04:12:10 | Tags: `slug`, `categorias`, `colecciones`, `panel-admin`*

### Un enlace de menú o del sitemap nunca debe llevar ...

> Un enlace de menú o del sitemap nunca debe llevar a una página pública vacía: si el contenido del módulo no existe (por ejemplo, ninguna novedad publicada), el enlace se oculta en la serialización del menú y la página se marca noindex hasta que haya contenido.

*Confidence: 0.95 | Status: active | Created: 2026-09-16T13:35:14 | Tags: `tienda-publica`, `menu`, `sitemap`, `cableado`*

### El precio que se muestra y el que se cobra tienen ...

> El precio que se muestra y el que se cobra tienen que salir del mismo cálculo del servidor. En Apple Boss, precioPublico() devuelve el precio promocional si la promoción está vigente y, si no, el del inventario: lo usan la tarjeta del catálogo (promo_price, con el precio anterior tachado), la ficha del producto y la sincronización del carrito. Una rebaja que se anuncia y no se cobra es un error de cableado, no un detalle de diseño.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T04:36:16 | Tags: `precios`, `promociones`, `carrito`, `tienda-publica`*

### Nada interno en respuestas públicas

> Ninguna respuesta pública (tienda, API, props de Inertia) incluye costo, ganancia, IMEI ni su estado, procedencia o proveedor, notas privadas, datos de clientes, datos financieros internos ni IDs sensibles. El número de serie sí puede mostrarse. Los atributos cargados a mano pasan por CatalogoPublicacion::atributosPublicos().

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `privacidad`, `api-publica`, `imei`*

### Apple Boss se despliega según docs/DESPLIEGUE.md y...

> Apple Boss se despliega según docs/DESPLIEGUE.md y la llave ssh necesita -o UseKeychain=yes; cambios en .env.production requieren up -d y recachear config

*Confidence: 1.0 | Status: active | Created: 2026-09-21T18:35:36 | Tags: `despliegue`, `produccion`, `ssh`, `docker`*

### En Apple Boss, APP_URL es de donde salen las URL c...

> En Apple Boss, APP_URL es de donde salen las URL canónicas, las del sitemap y las de las imágenes que se comparten: con la dirección de prueba (localhost) Google recibiría direcciones inservibles. App\Support\SeoEstado::sitio() lo detecta y la pantalla «Google y redes sociales» lo avisa arriba. Al publicar en producción hay que cambiarlo por el dominio real, con https.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T17:35:52 | Tags: `seo`, `produccion`, `entorno`*

### Indicadores medidos, nunca inventados

> Los indicadores cuantitativos de la tesis se miden, no se estiman: la prueba repetible vive en src/tests/Rendimiento/IndicadoresRendimientoTest.php y se ejecuta con 'vendor/bin/phpunit -c phpunit.rendimiento.xml' contra PostgreSQL en la base appleboss_bench; queda fuera de 'php artisan test' para no alterar el conteo de la bateria. Nunca se compara contra el proceso manual anterior porque la empresa no registro esos tiempos.

*Confidence: 1.0 | Status: active | Created: 2026-09-18T20:46:42 | Tags: `tesis`, `rendimiento`, `pruebas`, `metricas`*

### Fuentes para fichas de computadoras

> Fichas de computadoras: cargar solo los modelos que haya en stock. Primero la ficha oficial del fabricante (Apple: support.apple.com/es-lamr/<id>; ASUS: asus.com; Lenovo: psref.lenovo.com) y después otras fuentes (everymac.com, macrumors.com). Lo que ninguna fuente confirma queda pendiente.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:41:28 | Tags: `computadoras`, `fuentes`, `fichas`, `mac`*

### Documento y sistema unificados

> El documento de grado y el sistema se mantienen unificados: cuando el sistema gana una capacidad (por ejemplo la compra en linea con checkout, pago y seguimiento), se actualiza en todos los capitulos que la mencionan (resumen, alcance, limites, marco teorico, requerimientos, matriz, glosario, actores, sprints, manual tecnico, casos de prueba y conclusiones), no solo en uno. Los diagramas del documento se rehacen con PlantUML, que es la herramienta con la que estan hechos los originales.

*Confidence: 1.0 | Status: active | Created: 2026-09-18T21:49:06 | Tags: `tesis`, `documento-de-grado`, `plantuml`, `checkout`*

### En Apple Boss, el título y las metaetiquetas de ca...

> En Apple Boss, el título y las metaetiquetas de cada página pública los resuelve App\Support\Seo en el servidor y se escriben en app.blade.php: la prop title de StoreLayout no la usa nadie y no se debe volver a pasar. El valor de una página se edita en Marketing y Google → «Google y redes sociales» (tabla seo_pages), nunca en Configuración.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T16:26:47 | Tags: `seo`, `tienda-online`, `arquitectura`, `frontend`*

---

## Facts

*Verified information, project status, and established truths.*

### Las publicaciones copian la ficha

> Cada publicación guarda una copia de la ficha del modelo de referencia; «Llenar desde modelo» solo completa campos vacíos, así que un cambio en la base no llega solo a las publicaciones existentes (el editor avisa cuántos datos faltan copiar).

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `catalogo`, `ficha-tecnica`, `publicaciones`*

### Apple Boss: Search Console confirmo el 18-sep-2026...

> Apple Boss: Search Console confirmo el 18-sep-2026 que Google renderiza e indexa el SPA (home indexada, HTML rastreado completo). El SSR deja de ser bloqueante de indexacion y pasa a mejora: velocidad de entrada al indice, resistencia si el JS falla, y redes sociales/buscadores de IA que no ejecutan JavaScript.

*Confidence: 0.8 | Status: active | Created: 2026-09-18T12:03:59 | Tags: `seo`, `ssr`, `appleboss`, `search-console`*

### Un ícono SVG propio por característica

> Cada característica de la ficha del celular necesita su propio ícono SVG en Components/Store/Icons.jsx; FichaTecnicaIconosTest falla si falta o se repite.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `iconos`, `ficha-tecnica`, `tests`*

### Comparativa sin publicaciones dice sin stock

> La comparativa pública solo cuenta publicaciones vigentes con equipo disponible (publicadoAhora, productoDisponible, precioVigente). Una Mac en inventario sin publicación aparece como «Sin stock ahora»: hay que publicarla desde Tienda online → Productos en la tienda.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:41:28 | Tags: `comparador`, `stock`, `publicaciones`, `mac`*

### Comparativa de modelos y Mac

> La comparativa pública /comparar/{familia} existe para iphone y mac (ComparadorModelosController::FAMILIAS). Usa los datos de la base de modelos y el precio y stock del inventario, calculados por el servidor; nunca costo, IMEI ni procedencia.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `comparador`, `mac`, `roadmap`*

### Los menús de la tienda (arriba, celular y pie) sal...

> Los menús de la tienda (arriba, celular y pie) salen de nav_menu_items en el módulo Menú: el módulo Categorías solo informa en cuáles figura cada categoría, y la columna show_navigation quedó sin uso.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T23:38:11 | Tags: `menus`, `categorias`, `navegacion`*

### Los iPad que vende Apple Boss son solo Wi-Fi (conf...

> Los iPad que vende Apple Boss son solo Wi-Fi (confirmado por el usuario el 2026-09-16): la base de productos Apple no lleva fichas Wi-Fi + Cellular de iPad, y un iPad con LTE/Cellular/5G o IMEI no debe tomar la ficha Wi-Fi.

*Confidence: 0.95 | Status: active | Created: 2026-09-16T21:48:37 | Tags: `apple-boss`, `ipad`, `inventario`*

### Los accesorios se ordenan por tipo con la familia ...

> Los accesorios se ordenan por tipo con la familia de su ficha (cargador, vidrio, protector, funda, cable y otros); ese tipo filtra el catálogo con ?tipo= y el panel muestra cuántos hay en tienda y por publicar.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T23:38:10 | Tags: `accesorios`, `categorias`, `fichas`*

### Stack y entorno de desarrollo

> Apple Boss (desde 2026-09-16): PHP 8.5 en Docker + Laravel 13 + Inertia 3 + React 19 + Vite 8 + PHPUnit 12 + PostgreSQL 18 + n8n 2.39; Tailwind se queda en 3.4 a propósito. Código en src/. Contenedores: appleboss-app (php artisan test, SQLite), appleboss-node (npm run build, Node 24), appleboss-db (PostgreSQL 18, volumen appleboss_db_data_pg18 en /var/lib/postgresql), appleboss-queue, appleboss-n8n. Detalle en docs/admin-ui/informes/actualizacion-stack-2026-09-16.md.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `stack`, `docker`, `laravel`*

### Memanto local en esta Mac

> Memanto corre en modo local: servidor Moorcheh en Docker en http://localhost:8095 (solo 127.0.0.1; el 8080 lo usa otro proyecto), con Ollama del host (nomic-embed-text para búsqueda y qwen2.5-coder:7b como modelo). La CLI está en ~/.local/bin/memanto (pipx) y el agente del proyecto es apple-boss.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `memanto`, `entorno`, `puertos`*

### Caminos de Apple verificados en support.apple.com/...

> Caminos de Apple verificados en support.apple.com/es-lamr (2026-09-16) para textos al cliente: iPhone Configuración > Batería > Condición de la batería («Capacidad máxima», 101575); Apple Watch Configuración > Batería > Condición; Configuración > General > Información para «Número de modelo» (106343) e «Historial de piezas y servicios» con Original/Desconocida/Sin verificar/Usada (102658); ciclos de Mac portátil con Opción + menú Apple > Información del Sistema > Alimentación (102888); antes de entregar, cerrar sesión y General > Transferir o restablecer > Borrar contenido y configuración (109511).

*Confidence: 0.9 | Status: active | Created: 2026-09-16T15:10:10 | Tags: `apple-boss`, `apple`, `soporte`, `trade-in`*

---

## Decisions

*Architectural choices, approach selections, and their rationale.*

### Apple Boss: un dato impreso en la caja o etiqueta ...

> Apple Boss: un dato impreso en la caja o etiqueta del producto que lee el usuario vale como fuente para una ficha (ej. peso del Torras COOLiTE FG2: 321 g de la caja), y resuelve contradicciones de la publicación online.

*Confidence: 0.8 | Status: active | Created: 2026-09-16T22:31:16 | Tags: `apple-boss`, `fichas`, `fuentes`*

### Apple Boss recibe en Trade-In equipos de todas las...

> Apple Boss recibe en Trade-In equipos de todas las marcas, no solo Apple: celulares Android, laptops, PC de escritorio (gamer o armadas), consolas (PlayStation, Xbox, Nintendo) y otros. Cuestionario::APPLE y OTRAS_MARCAS agrupan los tipos; fuera de Apple la marca es obligatoria, y cada tipo tiene sus preguntas (procesador y gráfica, contraseña de BIOS, cuenta de Google, baneo, lectora, controles). Los textos públicos de Trade-In no deben decir «equipo Apple».

*Confidence: 0.95 | Status: active | Created: 2026-09-16T15:43:23 | Tags: `apple-boss`, `trade-in`, `marcas`*

### En Apple Boss cada pregunta frecuente se muestra e...

> En Apple Boss cada pregunta frecuente se muestra en un solo lugar de la tienda, y esos lugares son los cuatro que la tienda dibuja de verdad (Faq::LUGARES): el final del inicio, la ficha de todos los productos, /iphone y /seminuevos. Si un lugar se queda sin preguntas encendidas, esa sección no se dibuja. La pregunta y la respuesta se guardan como texto simple porque la tienda las muestra tal cual.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T05:17:00 | Tags: `faq`, `preguntas-frecuentes`, `tienda-online`, `dominio`*

### Actualización del documento de grado de Apple Boss...

> Actualización del documento de grado de Apple Boss (UCATEC, «apple boss Proyecto final.docx», 8 capítulos): se mantienen el título y los objetivos aprobados; se actualizan resumen, introducción, alcance, límites, requerimientos, diseño, desarrollo, pruebas, costos, conclusiones y bibliografía con la versión actual del sistema; la portada pasa a «Cochabamba, septiembre de 2026»; se rehacen solo los diagramas (los mockups quedan); se entregan dos Word nuevos, uno limpio y otro con control de cambios, sin tocar el original.

*Confidence: 1.0 | Status: active | Created: 2026-09-17T04:59:10 | Tags: `tesis`, `documento-de-grado`, `apple-boss`, `docx`*

### En Apple Boss los roles son datos, no texto en el ...

> En Apple Boss los roles son datos, no texto en el código: tabla roles (clave = lo que guarda users.rol, nombre, permisos JSON, del_sistema, panel_propio, activo). El administrador siempre puede todo aunque le borren los permisos; el vendedor tiene panel_propio y entra a /vendedor, no al panel de administración. users.rol era un enum('admin','vendedor') y por eso ningún rol nuevo entraba: la migración 2026_09_16_200100_users_rol_libre lo pasó a texto.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T17:35:51 | Tags: `usuarios`, `roles`, `base-de-datos`, `migracion`*

### Los accesorios viven en la base de modelos de refe...

> Los accesorios viven en la base de modelos de referencia como tipo producto_general (accesorios.php generado por herramientas/generar_accesorios.py, validado por EsquemaAccesorio): una ficha por TIPO de accesorio, reconocida por expresiones regulares sobre el nombre del inventario (sistema.detectar, de lo más específico a lo más general). La publicación copia la ficha y arma resumen, descripción y qué incluye con {modelo} = el iPhone que dice el nombre. Las comparativas de accesorios se suman en ComparadorModelosController::FAMILIAS con familia de la base, inicio e invitacion; el front usa familia.base.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T21:02:20 | Tags: `accesorios`, `modelos-referencia`, `comparador`, `deteccion`*

### Qué muestra la ficha pública

> La ficha pública del producto no muestra lo que el modelo no tiene (teleobjetivo, LiDAR, Thread, Botón Acción, Control de Cámara); la excepción es Apple Intelligence, que se muestra como «No compatible». La comparativa pública sí muestra «No tiene».

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `ficha-tecnica`, `apple-intelligence`, `comparativa`*

### En Apple Boss, el newsletter manda los correos por...

> En Apple Boss, el newsletter manda los correos por la cola (DispatchNewsletterCampaign arma la lista y SendNewsletterBatch manda un lote por minuto), nunca desde la pantalla. App\Support\NewsletterEstado revisa antes si se puede enviar: el correo del .env (servicio, servidor, cuenta y si hay clave, nunca la clave) y si alguien atiende la cola (un trabajo esperando más de 3 minutos = queue:work detenido). La única regla de por qué una campaña no se puede enviar es NewsletterCampaign::porQueNoSePuedeEnviar(). En producción lo único que falta es MAIL_PASSWORD, y se comprueba con «Enviar prueba» en Ajustes del newsletter.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T16:44:03 | Tags: `newsletter`, `correo`, `cola`, `produccion`, `arquitectura`*

### En Apple Boss una colección es una vitrina armada ...

> En Apple Boss una colección es una vitrina armada a mano para una campaña: el administrador elige qué publicaciones entran y en qué orden, mezclando categorías. Es lo contrario de una categoría, que se llena sola con el inventario del que sale cada producto y no se crea ni se borra. Cada colección tiene su página /coleccion/{slug}, puede salir en el inicio con una sección product_collection de Portada y como enlace en los menús. En la tienda solo se muestran los productos que siguen a la venta; los vendidos quedan guardados en la colección pero no se ven. Al borrarla no se tocan las publicaciones: se apagan la sección de la portada y los enlaces del menú que llevaban a ella.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T04:12:03 | Tags: `colecciones`, `tienda-online`, `vitrina`, `dominio`*

### La meta mensual del vendedor es un dato de la cuenta

> Apple Boss: la meta de ventas del mes del vendedor estaba escrita a mano en DashboardVendedorController (10.000 Bs para todos). Ahora es la columna users.meta_mensual (migración 2026_09_16_210000_meta_mensual_del_vendedor, decimal 12,2 con default 0) que el administrador carga en Sistema → Usuarios y roles, en el formulario del usuario, y solo se muestra para los roles con panel_propio. En 0 significa 'sin meta': la tarjeta del panel lo dice en vez de mostrar un porcentaje inventado. El helper es User::metaMensual().

*Confidence: 0.95 | Status: active | Created: 2026-09-16T19:22:31 | Tags: `apple-boss`, `vendedor`, `meta`, `usuarios`*

### Apple Boss, portada grande del inicio (hero): la v...

> Apple Boss, portada grande del inicio (hero): la volanta, el título, el texto, el segundo botón y los colores de Portada se dibujan en la tienda (pedido del usuario, 2026-09-16). Desde 1280 px el texto va arriba a la izquierda en el espacio libre, con ancho calculado para no tocar el equipo; debajo de 1280 px va arriba a lo ancho y el equipo se achica. Colores: azul (cada lámina con su tono), MYSKIN (morado y lima) y claro (fondo claro, letras azules). La sección lleva isolation: isolate para no dibujarse sobre el encabezado fijo.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T20:42:28 | Tags: `portada`, `hero`, `inicio`, `tienda-publica`*

### En Apple Boss, Tienda online → Novedades (modelo N...

> En Apple Boss, Tienda online → Novedades (modelo Novedad) son publicaciones con fecha: borrador, publicada o programada (publicada con fecha futura, se publica sola en hora de Bolivia). Sin texto no se publica. La dirección queda fija desde la primera publicación (published_at no nulo). Novedad::paraLaTienda() es la única consulta pública; se ven en /novedades, en la sección 'news' de Portada (3 por defecto) y en Google como BlogPosting. Mientras no haya ninguna publicada, NavMenuItem::serializeSlot oculta los enlaces a /novedades y el sitemap no la lista. La foto se guarda con ImagenNovedadService (variantes WebP, mínimo 1200 px de ancho) y se borra al reemplazarla o borrar la novedad.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T13:35:14 | Tags: `novedades`, `tienda-online`, `portada`, `seo`*

### Fichas de modelos prevalecen al vender

> Las fichas de la base de modelos de referencia (iPhone y Mac) nunca se borran cuando se vende una unidad: la base no depende del stock (ModelosReferenciaSeeder solo hace updateOrCreate por slug), la comparativa lista todos los modelos y cada publicación conserva su copia de la ficha.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:41:28 | Tags: `modelos-referencia`, `mac`, `stock`, `publicaciones`*

### Criterios de aceptacion y conclusiones por objetivo

> El documento de grado se revisa contra el informe del revisor: los resultados de pruebas se contrastan con criterios de aceptacion derivados de los requerimientos no funcionales (CA-01 a CA-08 en el capitulo VII), y las conclusiones se escriben un parrafo por cada objetivo especifico con su evidencia.

*Confidence: 1.0 | Status: active | Created: 2026-09-18T20:46:42 | Tags: `tesis`, `documento-de-grado`, `pruebas`, `conclusiones`*

### En Apple Boss, la portada de la tienda se arma con...

> En Apple Boss, la portada de la tienda se arma con secciones fijas que el administrador enciende, ordena y edita en Tienda online → Portada: no se crean ni se borran. Una sola regla decide qué productos le tocan a cada sección (HomeSection::filtrar), y la comparten la tienda y el panel, así que el panel puede decir qué muestra hoy cada sección y por qué queda fuera. En el inicio cada producto sale una sola vez: la vitrina de una colección se reserva los suyos y los demás carruseles toman lo que queda. Una sección de productos sin nada que mostrar no se dibuja: la portada nunca queda con un título y un hueco debajo.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T04:36:08 | Tags: `portada`, `home-sections`, `tienda-online`, `dominio`*

### El módulo Categorías de la tienda no crea ni borra...

> El módulo Categorías de la tienda no crea ni borra categorías: al publicar, cada producto cae en la suya según el inventario del que sale (celulares→iPhone, computadoras→Mac, productos Apple→Apple, productos generales→Accesorios, fundas marcadas MYSKIN→Fundas MYSKIN) y el slug nunca se edita porque agrupa las publicaciones.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T23:38:10 | Tags: `categorias`, `tienda`, `admin`, `catalogo`*

### La página de una categoría (/catalogo?categoria=sl...

> La página de una categoría (/catalogo?categoria=slug) tiene portada propia (título, texto y botón), título y descripción para Google, URL canónica propia y entra en el sitemap si tiene productos.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T23:38:11 | Tags: `categorias`, `seo`, `catalogo`*

### Apple Boss: los productos de otras marcas cargados...

> Apple Boss: los productos de otras marcas cargados en el inventario «Productos Apple» (Samsung Galaxy Tab S9 Ultra y S10 Lite 5G, monitor K&F Concept M5, ventilador Torras COOLiTE FG2) tienen ficha en la base producto_apple con familia otra_marca, pero NUNCA entran en la comparativa /comparar/apple (decisión del usuario: sería poco serio). En la tienda muestran su marca en vez de la categoría. Los iPad son Wi-Fi salvo un iPad Pro 11 M5 Wi-Fi + Cellular (el que tiene IMEI).

*Confidence: 0.95 | Status: active | Created: 2026-09-16T22:16:08 | Tags: `apple-boss`, `productos-apple`, `comparativa`, `otras-marcas`*

### En Apple Boss la tienda tiene tres menús independi...

> En Apple Boss la tienda tiene tres menús independientes y no uno: la barra de arriba (computadora, único con opciones adentro), la lista que se abre en el celular (plana) y el pie de página (agrupado en columnas). Se editan por separado, así que el panel compara la computadora con el celular —son la misma navegación en dos pantallas— y ofrece copiar los enlaces que le faltan a uno. Si un menú se queda sin enlaces visibles, la tienda muestra uno de fábrica para que el cliente igual pueda moverse.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T04:50:01 | Tags: `menu`, `navegacion`, `tienda-online`, `dominio`*

### En Apple Boss, Tienda online → Servicios (modelo S...

> En Apple Boss, Tienda online → Servicios (modelo StoreService) arma las tarjetas de «Nuestros servicios» del inicio. Cada tarjeta puede solo informar, abrir WhatsApp con «Hola Apple Boss, quiero consultar por: {título}» o llevar a una página (de la tienda, una colección o una página informativa). StoreService::paraLaTienda() es la única consulta pública: un botón de WhatsApp con el WhatsApp de la tienda apagado, o un enlace sin dirección, queda como solo informa. Sin tarjetas encendidas la sección no se dibuja y Portada lo informa; el título y la bajada de la sección se editan en Portada. No confundir con Servicio técnico (órdenes de reparación).

*Confidence: 1.0 | Status: active | Created: 2026-09-16T12:25:22 | Tags: `servicios`, `tienda-online`, `portada`, `whatsapp`*

### En Apple Boss, un permiso es un MÓDULO del panel, ...

> En Apple Boss, un permiso es un MÓDULO del panel, no una acción suelta. El catálogo vive en App\Support\Permisos (14 módulos con los prefijos de nombre de ruta que le pertenecen a cada uno) y lo hacen cumplir tres piezas con la misma regla (Role::permite): PermisoMiddleware corta con 403 en el servidor, AdminLayout esconde lo mismo en el menú con auth.permisos, y la pantalla de roles dibuja los módulos agrupados. Lo que está dentro de /admin y no pertenece a ningún módulo queda solo para administradores, así una ruta nueva nunca queda abierta por olvido.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T17:35:45 | Tags: `usuarios`, `roles`, `permisos`, `seguridad`, `arquitectura`*

### En Apple Boss, Tienda online → Configuración (tabl...

> En Apple Boss, Tienda online → Configuración (tabla configuracion_tienda) guarda solo lo que la tienda lee de verdad y que no es de otro módulo: el WhatsApp (interruptor, número y mensaje), el nombre de la tienda, la frase del pie, la barra de anuncio y la descripción corta para Google. El nombre sale de un solo lugar (ConfiguracionTienda::nombre() en el backend y Components/Store/tienda.js en el frontend) y manda en el encabezado, el pie, el copyright, todos los mensajes de WhatsApp («Hola <nombre>,» con saludoWhatsapp()) y los datos del negocio para Google; antes estaba escrito a mano en unos 30 lugares. La barra de anuncio la escribe el panel y, vacía, no se dibuja. La dirección y el horario viven en Ubicaciones, el título y la descripción de cada página en «Google y redes sociales» (seo_pages), y el texto y el orden del inicio en Portada.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T16:26:41 | Tags: `configuracion`, `tienda-online`, `whatsapp`, `nombre-tienda`, `dominio`*

### En Apple Boss las páginas de Tienda online → Págin...

> En Apple Boss las páginas de Tienda online → Páginas son de solo texto (Nosotros, Garantía, Envíos, Términos): explican algo al cliente y no llevan productos ni formularios. Viven en /paginas/{slug}, su dirección se arma con el título al crearlas y no cambia, y cada página encendida aparece sola en la columna «Información» del pie; si tiene su propio enlace en el menú del pie, deja de listarse sola para no repetirse. El texto se limpia siempre en el servidor: solo quedan p, br, strong, b, em, i, ul, ol, li, h2, h3, h4 y a, y un href con javascript:, data: o vbscript: pierde la dirección.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T05:04:14 | Tags: `paginas`, `contenido`, `tienda-online`, `dominio`*

### Apple Boss debe seguir funcionando en iPhone con i...

> Apple Boss debe seguir funcionando en iPhone con iOS 14 y 15 (clientes con equipos viejos): no migrar a Tailwind 4 (exige Safari 16.4); Vite 8 lleva build.target fijo en es2020/safari14/chrome87/firefox78/edge88 y cssMinify 'esbuild' (Lightning CSS reescribe fuentes); resources/js/polyfills.js agrega Object.hasOwn porque Inertia 3 usa es-toolkit. Antes de subir una librería, contar APIs modernas del build (structuredClone, Object.hasOwn, .at, lookbehind).

*Confidence: 0.8 | Status: active | Created: 2026-09-17T02:14:14 | Tags: `apple-boss`, `navegadores`, `tailwind`, `vite`, `compatibilidad`*

### H5 (token n8n con ámbito+rotación) y H8 (horario del vendedor) implementados

> Apple Boss (Laravel): H5 corregido sin romper n8n. Se comprobó que n8n SOLO llama /api/automation/reports y /api/automation/top-products; el export financiero no lo usa nadie de n8n y el admin exporta desde el panel (ruta web con sesión). Fix: /api/automation/reportes/exportar pasó a ámbito 'automation:export' con AUTOMATION_EXPORT_TOKEN aparte (vacío=cerrado por defecto). AutomationTokenMiddleware ahora acepta varios tokens (AUTOMATION_TOKEN + AUTOMATION_TOKENS_PREVIOS) para rotar sin cortar n8n; comando 'php artisan automation:token'. El backup diario 20:00 es scheduleTrigger (dump PostgreSQL), no usa la API. H8 (nuevo): el vendedor no inicia sesión fuera de 09:00-13:00 y 14:00-19:00 (America/La_Paz); se hace en LoginRequest con App\Support\HorarioLaboral (config/horario.php), NO en n8n porque n8n no intercepta un login en tiempo real; el admin no se restringe. 575 tests verdes.

*Confidence: 0.9 | Status: active | Created: 2026-09-17T04:03:14 | Tags: `seguridad`, `n8n`, `token`, `horario`, `vendedor`, `apple-boss`, `tesis`*

---

## Goals

*Objectives, targets, and milestones to track progress.*

### Apple Boss, plan de cierre del sistema (decisiones...

> Apple Boss, plan de cierre del sistema (decisiones del usuario, 2026-09-16): producción en Hostinger; antes de cerrar entran la base de productos Apple (iPad, Apple Watch, AirPods y demás, con fuentes verificadas e íconos SVG profesionales) y el recomendador con IA; al final se hacen commits ordenados. El usuario quiere que se le vaya preguntando lo que haga falta decidir durante el cierre.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T20:42:29 | Tags: `cierre`, `produccion`, `hostinger`, `productos-apple`, `recomendador-ia`*

### Lo que sigue en el roadmap

> Plan de cierre de Apple Boss: 1) base de productos Apple con fuentes y SVG profesionales, 2) recomendador con IA por presupuesto y uso (precios del inventario; la IA no inventa características; preguntar proveedor y clave), 3) lista de producción para Hostinger, 4) commits ordenados. Tienda online, panel del vendedor y servicio técnico con costo pendiente ya están cerrados (2026-09-16).

*Confidence: 0.9 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `roadmap`, `recomendador-ia`, `tradein`*

---

## Commitments

*Promises, obligations, and TODOs that need follow-through.*

*No memories of this type.*

---

## Preferences

*User and entity preferences for personalization.*

### Carrusel de lo más importante

> El carrusel «Lo más importante» de la ficha del producto rota solo cada 1,5 s y no se pausa al pasar el mouse; solo se detiene fuera de la pantalla, con la pestaña oculta o con el botón de pausa.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `carrusel`, `pdp`, `animacion`*

### Idioma y tono de las respuestas

> Responder siempre en español de Bolivia, tuteando (tú), sin voseo ni expresiones argentinas; claro y directo.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `idioma`, `comunicacion`, `espanol-bolivia`, `global`*

### Respuestas directas sin razonamiento

> Responder directo con la conclusión: no exponer razonamiento ni proceso interno en las respuestas, salvo que el usuario lo pida explícitamente.

*Confidence: 0.95 | Status: active | Created: 2026-09-20T14:00:09 | Tags: `estilo-respuesta`, `comunicacion`, `usuario`, `global`*

### Cada módulo del panel alineado lleva una guía prof...

> Cada módulo del panel alineado lleva una guía profesional: AdminGuide con pasos concretos y un consejo, más una sección de consejos con un ejemplo bueno y uno a evitar, y cuando hay pasos en otra herramienta (por ejemplo Google Maps) los nombres exactos de sus botones confirmados en la ayuda oficial.

*Confidence: 0.9 | Status: active | Created: 2026-09-16T13:06:56 | Tags: `panel-admin`, `guia-profesional`, `ux-copy`*

### Sin rayas en el documento de grado

> El documento de grado no lleva rayas (em dash) en ninguna parte: el usuario las rechaza. Cuando haga falta un inciso se usan comas o parentesis. Ademas, cuando se editen frases con incisos hay que revisar que la frase quede bien construida sin la raya, porque al borrarlas a mano quedan oraciones sin sentido.

*Confidence: 1.0 | Status: active | Created: 2026-09-20T03:34:27 | Tags: `tesis`, `estilo`, `redaccion`*

### Apple Boss: en el menú lateral de los paneles admi...

> Apple Boss: en el menú lateral de los paneles admin y vendedor el logo es solo la silueta de la marca (public/images/logo-appleboss-marca.png, blanca, sin el texto APPLE BOSS de la imagen), a 36 px de alto y pegado a la izquierda (left 20px). El texto «Apple Boss» (22 px) y la insignia del vendedor van centrados en el ancho del menú, no el logo: el usuario lo pidió así después de probar el bloque entero centrado. Encabezado de 64 px alineado con la barra de arriba; en el celular la X de cerrar va a la derecha. A 48 px el logo le pareció demasiado grande. Es su logo propio, no el de Apple.

*Confidence: 0.8 | Status: active | Created: 2026-09-16T22:31:16 | Tags: `apple-boss`, `panel`, `logo`, `diseño`*

### Preferencia de diseño del usuario para la tienda A...

> Preferencia de diseño del usuario para la tienda Apple Boss: el contenido queda centrado en el contenedor de 1224 px y las animaciones decorativas (siluetas, órbitas, destellos) van en los márgenes de afuera de ese contenedor o en el espacio libre al lado del texto, nunca encima del texto. Le gustan las animaciones ricas (dibujo del trazo al entrar, flotación, parallax con el puntero, escaneo con etiquetas que se marcan), siempre quietas con prefers-reduced-motion.

*Confidence: 0.9 | Status: active | Created: 2026-09-16T15:43:24 | Tags: `apple-boss`, `diseno`, `animaciones`, `tienda`*

### Apple Boss: el usuario quiere el inventario con no...

> Apple Boss: el usuario quiere el inventario con nombres profesionales: se corrigen errores de tipeo, se usan nombres oficiales (APPLE WATCH SERIES, APPLE PENCIL), un mismo formato (USB-C, 3RA GEN) y colores en español, cambiando solo modelo, capacidad y color y guardando antes un respaldo de los valores.

*Confidence: 0.9 | Status: active | Created: 2026-09-16T22:16:08 | Tags: `apple-boss`, `inventario`, `nombres`*

### Los documentos PDF de Apple Boss siguen la línea d...

> Los documentos PDF de Apple Boss siguen la línea de la marca: negro con verde lima #c8f902, títulos en píldora negra, cajas redondeadas con borde, iconos de trazo y los datos de la tienda arriba; un diseño sobrio el usuario lo rechaza por básico

*Confidence: 1.0 | Status: active | Created: 2026-09-21T18:35:35 | Tags: `pdf`, `diseno`, `marca`, `boleta`*

### Línea visual de la tienda

> Tienda prolija y profesional: paleta navy #011446, periwinkle #585E9F, lime #C6CB36 y fondo #F5F6FA; tarjetas con radio de 12 a 16 px, sin manchas decorativas ni glass; respetar prefers-reduced-motion y contraste WCAG AA (--text-muted #8E8EA0 no alcanza AA para texto).

*Confidence: 0.95 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `diseno`, `paleta`, `accesibilidad`*

### En los PDF de Apple Boss el usuario quiere que las...

> En los PDF de Apple Boss el usuario quiere que las propiedades del producto tengan protagonismo (mosaicos con icono, serie destacada, garantía en banda verde) y que la hoja no quede con grandes espacios en blanco; la garantía se detecta sola: nuevo 12 meses, seminuevo 4, cargador original 12, certificado 3

*Confidence: 1.0 | Status: active | Created: 2026-09-21T19:43:16 | Tags: `pdf`, `boleta`, `garantia`, `diseno`*

### Para trabajos grandes de varios módulos el usuario...

> Para trabajos grandes de varios módulos el usuario quiere subagentes en paralelo: organizarlos por olas según dependencias, con archivos y bases de datos de test separados por agente, y vigilar que ninguno quede trabado. Fuera de ese caso, sigue sin querer tareas colgadas en segundo plano.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T18:27:43 | Tags: `subagentes`, `paralelismo`, `flujo-de-trabajo`, `olas`, `global`*

### Botones de compra alineados con la foto

> En la ficha del producto, los botones Agregar al carrito y Consultar por WhatsApp se alinean siempre con el borde inferior de la imagen; la comparativa no debe tener scroll horizontal en escritorio.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `pdp`, `layout`, `botones`*

### No dejar tareas en segundo plano ni subagentes cor...

> No dejar tareas en segundo plano ni subagentes corriendo: ejecutar builds, tests, extracciones (incluida la semántica de Graphify) y verificaciones en primer plano dentro de la sesión, y detener de inmediato cualquier tarea trabada.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T17:23:42 | Tags: `flujo-de-trabajo`, `tareas-en-segundo-plano`, `subagentes`, `graphify`, `global`*

---

## Relationships

*Entity connections, team context, and collaboration patterns.*

*No memories of this type.*

---

## Context

*Session summaries, status updates, and conversation state.*

### Pendientes del usuario en accesorios (2026-09-15):...

> Pendientes del usuario en accesorios (2026-09-15): ningún vidrio del inventario dice Gorilla (si los VIDRIO TEMPLADO de FJ IMPORTACIONES a Bs 250 lo son, hay que agregar GORILLA al nombre); Rayban Wayfarer, ULTRA 2 IVV9 y VV9 PRO + Watch quedan sin ficha; falta confirmar si Galaxy Buds2 Pro y Mando Dualshock 4 son originales. La procedencia que el usuario llama Jeizon Store se interpretó como GZ STORES.

*Confidence: 0.85 | Status: active | Created: 2026-09-15T21:02:21 | Tags: `accesorios`, `pendientes`, `gorilla-glass`, `inventario`*

### Pendientes de la base de iPhone

> Al 2026-09-15 la base tiene 38 iPhone completos y 4 datos «falta»: RAM y batería del iPhone Duo, y batería de las unidades solo eSIM del iPhone 18 Pro y 18 Pro Max. Se listan con php artisan modelos:pendientes.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `modelos-referencia`, `pendientes`, `iphone-duo`*

### Hooks de memanto por ajustar

> Hooks de memanto en ~/.claude/settings.json: desde 2026-09-20 las memorias van separadas por proyecto (un agente por carpeta de ~/Projects). Siguen pendientes, a decision del usuario: usar solo python3 (en esta Mac no existe python) y anteponer PATH=$HOME/.local/bin para que los hooks encuentren memanto. No hay hook que active solo el agente del proyecto: se comprueba con memanto status y se activa a mano.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:23:22 | Tags: `memanto`, `hooks`, `claude-code`*

### Pendientes del usuario en computadoras

> Pendientes del usuario en computadoras (2026-09-15): la #26 figura como MacBook Pro M5 Pro con 512 GB, una configuración que no existe; hay que revisarla. La Lenovo IdeaPad Gaming 3 (#10) ya tiene ficha (MTM 82SB00K9US) y la ASUS ROG Strix (#13) está vendida: el usuario dijo que no hace falta su ficha. El identificador del MacBook Neo espera que Apple lo publique.

*Confidence: 0.95 | Status: active | Created: 2026-09-15T13:41:28 | Tags: `computadoras`, `pendientes`, `gamer`, `inventario`*

---

## Events

*Important conversations, milestones, and temporal occurrences.*

*No memories of this type.*

---

## Learnings

*Knowledge acquired from experience, corrections, and insights.*

### Las secciones del inicio de la tienda que se abren...

> Las secciones del inicio de la tienda que se abren con ancla (/#servicios, /#faq) necesitan scroll-margin (scroll-mt-28 lg:scroll-mt-40) porque el encabezado fijo mide 110 px en celular y 174 px en computadora; sin eso el título queda tapado. Inertia sí hace scroll al ancla al cargar la página.

*Confidence: 0.9 | Status: active | Created: 2026-09-16T12:25:23 | Tags: `tienda-publica`, `anclas`, `header-fijo`, `inertia`*

### Un texto de la tienda escrito dentro del código es...

> Un texto de la tienda escrito dentro del código es contenido que el administrador no puede corregir y que el panel no puede contar: hay que pasarlo a la base con una migración que lo copie tal cual y borrar el respaldo del código. En Apple Boss pasó con las preguntas de la ficha del producto y de los hubs, y con el FAQ_FALLBACK del inicio, que mostraba cuatro preguntas inventadas mientras el panel decía cero. Después de migrarlo, si no hay contenido la sección no se dibuja: es preferible a mostrar algo que el dueño no escribió.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T05:17:04 | Tags: `contenido`, `migraciones`, `panel-admin`, `tienda-publica`*

### dompdf no escala SVG con viewBox (el width y heigh...

> dompdf no escala SVG con viewBox (el width y height deben igualar al viewBox y el SVG va como img en data URI), no redondea celdas de tabla y la imagen de producción no trae intl; en Linux el nombre de archivo de una imagen distingue mayúsculas

*Confidence: 0.95 | Status: active | Created: 2026-09-21T18:35:36 | Tags: `dompdf`, `pdf`, `svg`, `produccion`, `linux`*

### Al alinear un módulo de la tienda, buscar contenid...

> Al alinear un módulo de la tienda, buscar contenido escrito en el código que reemplaza lo del panel cuando está vacío (SERVICES_FALLBACK, FAQ_FALLBACK, listas fijas en Home.jsx, Product.jsx o los hubs): muestra promesas que el administrador no controla y hace que Portada informe mal. Se quitan y la sección no se dibuja sin contenido.

*Confidence: 0.95 | Status: active | Created: 2026-09-16T12:25:22 | Tags: `panel-admin`, `tienda-publica`, `cableado`, `fallback`*

### En la tienda de Apple Boss, un elemento que sube s...

> En la tienda de Apple Boss, un elemento que sube sobre un encabezado con margen negativo (-mt) necesita 'relative z-10': los encabezados de página son 'relative' (por los círculos decorativos) y, sin eso, se dibujan encima aunque vengan antes en el HTML.

*Confidence: 0.9 | Status: active | Created: 2026-09-16T13:35:14 | Tags: `css`, `tailwind`, `tienda-publica`, `z-index`*

### Diagrama de modelos más alto que la pantalla

> El diagrama archify docs/admin-ui/diagramas/modelos-referencia.html pasa validate y deliver, pero visual-check falla la contención en escritorio: la página mide cerca de 1,8 veces el alto de la pantalla (6 carriles y 13 nodos). Es un problema previo al 2026-09-15; memoria-proyecto.html sí pasa.

*Confidence: 0.95 | Status: active | Created: 2026-09-15T12:23:23 | Tags: `archify`, `visual-check`, `diagramas`*

### Los menús salen de la base

> Los menús de la tienda (header, móvil y footer) salen de la tabla nav_menu_items; MEGA_MENU_STATIC es solo respaldo. Un enlace nuevo en el menú necesita una migración de nav items.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `menus`, `tienda`, `base-de-datos`*

### ILIKE rompe los tests: usar App\Support\Busqueda

> Apple Boss: los tests corren en SQLite y ILIKE solo existe en PostgreSQL, así que cualquier where('col','ILIKE',...) revienta en los tests. El patrón portable del proyecto es whereRaw('LOWER(col) LIKE ?', [App\Support\Busqueda::contiene($texto)]); Busqueda::escapar() pone el texto en minúsculas y escapa %, _ y \. Se corrigieron así VentaController (buscarNota y buscarSoloVentas), ClienteVendedorController, ClienteAdminController y CatalogoPublicacionController. NewsletterCampaignController::escaparLike ahora delega en Busqueda.

*Confidence: 0.95 | Status: active | Created: 2026-09-16T19:22:31 | Tags: `apple-boss`, `sqlite`, `postgres`, `busqueda`, `tests`*

### Inertia 3: las etiquetas del head renderizadas en ...

> Inertia 3: las etiquetas del head renderizadas en Blade usan el atributo data-inertia (antes inertia) para que <Head> las reemplace sin duplicar; la página inicial va en <script type=application/json> antes de <div id=app>; el cliente XHR propio manda X-XSRF-TOKEN desde la cookie como axios; assertInertia cuenta menos aserciones pero sigue fallando igual.

*Confidence: 0.8 | Status: active | Created: 2026-09-17T02:14:15 | Tags: `inertia-v3`, `laravel`, `react`, `seo`*

### Una entrada animada no puede dejar la pantalla en blanco

> Apple Boss, lección: si el navegador frena las animaciones (pestaña en segundo plano), una entrada de framer-motion que arranca en initial={{opacity:0}} deja la pantalla vacía hasta que alguien la mire, y un arco de progreso que arranca vacío muestra 0 % en vez del valor real. El patrón del proyecto es useEntrada() en Components/Vendedor/dia.jsx: decide al montar si se anima (no hay «reducir movimiento» y document.hidden es falso) y, cuando no, pasa initial={false} para que todo se dibuje ya visible y en su valor. Los contadores además tienen un setTimeout de respaldo que deja el número real. Es la misma lección que el botón de WhatsApp que se quedaba en scale(0.3).

*Confidence: 0.95 | Status: active | Created: 2026-09-16T19:52:57 | Tags: `apple-boss`, `animacion`, `framer-motion`, `robustez`*

### Leer fuentes web de forma exacta

> Para datos técnicos de la web, leer la fuente de forma exacta con curl: gsmarena.com expone los valores en atributos data-spec y Wikipedia devuelve el infobox con action=raw. WebFetch resume mal las tablas grandes y mezcla columnas.

*Confidence: 0.9 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `investigacion-web`, `gsmarena`, `wikipedia`*

### Los valores que sembró la instalación en configura...

> Los valores que sembró la instalación en configuracion_tienda (created_at igual a updated_at, por ejemplo el horario «Lunes a sábado de 9:00 a 19:00») no son datos reales del negocio: antes de mostrarlos o migrarlos, comparar updated_at con created_at y no presentarlos como hechos.

*Confidence: 0.95 | Status: active | Created: 2026-09-16T13:06:57 | Tags: `configuracion-tienda`, `datos-de-ejemplo`, `no-inventar`*

### Antes de dar por alineado un módulo del panel hay ...

> Antes de dar por alineado un módulo del panel hay que verificar que su parte pública esté cableada de punta a punta: página propia, lugar en el inicio, enlace en el menú, título en Google con URL canónica y entrada en el sitemap. En Apple Boss, Colecciones se podía usar entero sin que la tienda mostrara nada (ningún controlador público consultaba CatalogCollection y la sección product_collection del inicio ignoraba su collection_id y mostraba las publicaciones más nuevas).

*Confidence: 1.0 | Status: active | Created: 2026-09-16T04:11:58 | Tags: `panel-admin`, `tienda-publica`, `cableado`, `colecciones`*

### En Apple Boss el directorio src/public/build del h...

> En Apple Boss el directorio src/public/build del host está desactualizado: appleboss-node escribe el build en un volumen. Para una vista previa con el CSS real, leer el manifiesto dentro del contenedor (docker exec appleboss-node node -e 'require("/var/www/html/public/build/manifest.json")'). Un formulario público con archivos se prueba también con un envío real desde el navegador, porque los tests de PHP no pasan por el FormData de Inertia.

*Confidence: 0.9 | Status: active | Created: 2026-09-16T15:10:10 | Tags: `apple-boss`, `docker`, `vite`, `vista-previa`*

### Barrido completo antes de entregar un documento

> Antes de dar por cerrado un documento largo hay que barrerlo entero, no solo lo que el revisor señala: corrector ortografico en español (aspell --lang=es) sobre el texto extraido del docx, mas chequeos automaticos de rotulos contra los indices, lineas 'Fuente' y su formato, tablas sin leyenda, citas narrativas sin año, referencias cruzadas a tablas o figuras inexistentes, espacios dobles y titulos con el numero pegado. En el documento de Apple Boss ese barrido encontro ocho defectos que las revisiones puntuales no habian visto.

*Confidence: 1.0 | Status: active | Created: 2026-09-20T05:49:56 | Tags: `tesis`, `verificacion`, `aspell`, `docx`*

### Laravel 13 PreventRequestForgery acepta POST sin t...

> Laravel 13 PreventRequestForgery acepta POST sin token si el navegador manda Sec-Fetch-Site: same-origin; sin ese encabezado o cross-site exige el token (419). PostgreSQL 18 en la imagen oficial guarda en /var/lib/postgresql/18/docker: montar el volumen en /var/lib/postgresql y migrar con pg_dumpall + psql (errores esperados: rol y base ya existen).

*Confidence: 0.8 | Status: active | Created: 2026-09-17T02:14:15 | Tags: `laravel-13`, `csrf`, `postgresql-18`, `docker`*

### Un enlace que apunta fuera del sitio no puede dibu...

> Un enlace que apunta fuera del sitio no puede dibujarse con el Link de Inertia: solo sabe navegar dentro de la aplicación y el clic se rompe. En Apple Boss, el componente EnlaceMenu de StoreLayout decide solo: <a> para http(s), //, mailto y tel (y cuando se pide abrir en otra pestaña), <Link> para las rutas internas y <span> cuando no hay dirección. Si el panel deja pegar una dirección libre, hay que revisar que el front la dibuje así.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T04:50:06 | Tags: `inertia`, `enlaces-externos`, `menu`, `tienda-publica`*

### Tests en SQLite

> La suite de tests corre en SQLite: no usar SQL exclusivo de PostgreSQL (por ejemplo REGEXP_REPLACE) en código que cubren los tests.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `tests`, `sqlite`, `postgresql`*

### En Apple Boss el CSS que entra en el build es reso...

> En Apple Boss el CSS que entra en el build es resources/css/app-vite.css (lo importa resources/js/app.jsx); resources/css/app.css NO se compila. Cualquier animación o clase escrita ahí no existe en la tienda: así estuvieron muertas las ondas del botón de WhatsApp.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T16:44:08 | Tags: `css`, `build`, `frontend`, `entorno`*

### En una tesis, todo total de una tabla se comprueba...

> En una tesis, todo total de una tabla se comprueba por programa contra las filas que suma antes de afirmar que los valores coinciden; un total redondeado heredado puede esconder una suma mal hecha en otra tabla

*Confidence: 0.95 | Status: active | Created: 2026-09-20T07:38:21 | Tags: `tesis`, `verificacion`, `tablas`, `costos`*

### En un sitio SPA (Inertia/React), el HTML que devue...

> En un sitio SPA (Inertia/React), el HTML que devuelve el servidor no es lo que Google indexa: hay que comparar contra el HTML renderizado de Search Console. Dos bugs de Apple Boss vivian solo en el renderizado: el title terminaba en '- Laravel' porque el build Docker no recibia VITE_APP_NAME y React pegaba la marca de respaldo, y habia dos entidades Store en JSON-LD (una del servidor, otra inyectada por Home.jsx). Las variables VITE_* deben pasarse como ARG/ENV al Dockerfile: la etapa de build no lee el .env del servidor.

*Confidence: 0.8 | Status: active | Created: 2026-09-18T12:03:58 | Tags: `seo`, `spa`, `inertia`, `docker`, `vite`, `schema`*

### El navegador no necesita el costo para vender

> Apple Boss: VentaController::buildValidatedSaleItems vuelve a calcular precio_invertido desde el producto en el servidor e ignora lo que manda el cliente. Por eso se pudo sacar precio_costo de /api/stock/* sin romper el registro de ventas: aunque el navegador mande precio_invertido: 0, la venta se guarda con el costo real. Hay un test que lo comprueba (PanelVendedorTest::test_la_venta_guarda_el_costo_real_aunque_el_navegador_no_lo_sepa). Misma idea para las reservas.

*Confidence: 0.95 | Status: active | Created: 2026-09-16T19:52:57 | Tags: `apple-boss`, `ventas`, `seguridad`, `api`*

### Para la vista previa del panel con esbuild, el plu...

> Para la vista previa del panel con esbuild, el plugin de alias (@/ → resources/js) debe completar la extensión (.jsx, .js, /index.jsx): esbuild no aplica resolveExtensions a las rutas que devuelve un plugin y falla con 'Cannot read file'.

*Confidence: 0.9 | Status: active | Created: 2026-09-16T13:35:15 | Tags: `esbuild`, `vista-previa`, `panel-admin`*

### En módulos del panel que no son de inventario, Mod...

> En módulos del panel que no son de inventario, ModalEliminar necesita la prop advertencia con el texto real de lo que pasa al borrar: sin ella dice «Se borra del inventario y no se puede deshacer», y el detalle se corta en una línea (usar advertencia para explicaciones largas).

*Confidence: 0.95 | Status: active | Created: 2026-09-16T12:25:23 | Tags: `panel-admin`, `modal-eliminar`, `ux-copy`*

### Para verificar una actualización sin iniciar sesió...

> Para verificar una actualización sin iniciar sesión en el panel: guardar el HTML de cada pantalla atendiendo la petición dentro del proceso (guard->setUser, DB::beginTransaction/rollBack, resetear Tighten\Ziggy\BladeRouteGenerator::$generated), servirlo con un servidor local que solo reenvía /build e imágenes, y comparar estilos calculados de cada elemento antes/después con dos capturas 'antes' para medir el ruido. Excluir GET que escriben (admin.catalogo.create). Borrar las copias al terminar.

*Confidence: 0.8 | Status: active | Created: 2026-09-17T02:14:16 | Tags: `apple-boss`, `verificacion`, `panel`, `regresion-visual`*

---

## Observations

*Patterns noticed, behavioral notes, and recurring themes.*

*No memories of this type.*

---

## Artifacts

*Tool outputs, files, reports, and external references.*

### Flujo de la base de modelos de iPhone

> La base de iPhone se edita en src/database/data/modelos_referencia/herramientas/generar_iphone.py, que escribe iphone.php. Después: php artisan modelos:verificar, php artisan db:seed --class=ModelosReferenciaSeeder (no toca las fotos) y php artisan modelos:pendientes --markdown > docs/admin-ui/modelos-referencia-pendientes.md.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `modelos-referencia`, `generador`, `artisan`*

### Documentación del proyecto

> La documentación vive en docs/admin-ui/: README.md, TRASPASO.md, prompt-retomar.md e informes/. Los diagramas se hacen con archify en docs/admin-ui/diagramas y el grafo del código con graphify en docs/admin-ui/grafo/graphify-out. Se actualizan al cerrar cada módulo.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:14:12 | Tags: `documentacion`, `archify`, `graphify`*

### Base de Mac: dónde está cada pieza

> Base de Mac: computadora.php lo genera herramientas/generar_computadoras.py; esquema EsquemaComputadora (trait Concerns/RevisaEsquema), textos TextosComputadora; detección ModeloReferencia::deInventario (línea, chip, pulgadas y año, más RAM y almacenamiento válidos; con dudas devuelve null y elige el admin). Comparativa /comparar/mac por la familia 'mac' de ComparadorModelosController::FAMILIAS. Informe: docs/admin-ui/informes/computadoras-2026-09-15.md.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:41:28 | Tags: `mac`, `modelos-referencia`, `generador`, `comparador`*

---

## Errors

*Failure records, bugs, and lessons learned from mistakes.*

### trustProxies('*') vuelve spoofable todo el rate-limit por IP

> Apple Boss (Laravel): bootstrap/app.php usa trustProxies(at: '*'), asi que la IP del cliente sale de X-Forwarded-For que manda cualquiera. Toda la limitacion por IP (throttle de rutas y el bloqueo de login por email+IP en LoginRequest) se burla rotando XFF. Verificado: /api/buscar 429 al #61 sin cabecera pero nunca con XFF rotando; 25 logins con XFF rotando = 0 bloqueos. Habilita fuerza bruta y envenenamiento del enlace de reset via Host. Arreglo: trustProxies con IP reales del proxy, no '*'.

*Confidence: 0.95 | Status: active | Created: 2026-09-17T03:24:21 | Tags: `seguridad`, `laravel`, `rate-limit`, `trustproxies`, `apple-boss`*

### Dump de BD estuvo en la historia pública; limpiado con filter-repo; rotar credenciales

> Apple Boss (repo público santiagoAbasto/ApplebBoss-Laravel) tuvo dos filtraciones en GitHub. (1) Un dump completo de la base (commit fbc8ea5 «1.4.3») con hashes, clientes, costos, IMEI y sesiones: se limpió la historia con git-filter-repo y force-push, y el 2026-09-17 se borró la rama local claude/fervent-ardinghelli-b52ce4 que todavía lo tenía; filter-repo sobre un mirror de origin no limpia ramas locales, así que hay que verificar con git rev-list --all --objects en el repo de trabajo. GitHub igual sigue sirviendo el commit viejo por su SHA (HTTP 200 el 2026-09-17). (2) src/database/seeders/UserSeeder.php tuvo desde el primer commit (02d5e63, 2025-05-05) las contraseñas en texto plano del admin y de dos vendedores, con sus correos, y además las reponía en cada db:seed. El 2026-09-17 se reescribió para leer SEED_ADMIN_* de .env sin pisar contraseñas (UserSeederTest), pero la historia pública todavía las tiene. Pendiente del dueño: repo privado o purga con GitHub Support, cambiar esas tres contraseñas (y donde se hayan reutilizado), rotar AUTOMATION_TOKEN. .gitignore bloquea *.sql, *.dump, *.bak, __pycache__, *.pyc, /output/ y /tmp/.

*Confidence: 0.97 | Status: active | Created: 2026-09-17T04:23:12 | Tags: `seguridad`, `git`, `filtracion`, `backup-bd`, `apple-boss`, `tesis`*

### SinCostos no cubre crear/editar venta ni reservas activas del vendedor

> Apple Boss (Laravel): el ocultamiento de costo al vendedor (App\Support\SinCostos) tiene huecos. VentaController@create (:554), VentaController@edit (:890) y ReservaController@activas (:263) mandan los modelos completos (Celular/Computadora/ProductoGeneral/ProductoApple) al panel del vendedor SIN pasar por SinCostos. Los modelos no tienen $hidden, asi que precio_costo, procedencia, imei_1 y numero_serie viajan en las props de Inertia (verificado: precio_costo=4000, procedencia con nombre+telefono del proveedor). Rompe la regla dura de negocio. Arreglo: aplicar SinCostos ahi y agregar $hidden/$visible en esos modelos como red de seguridad.

*Confidence: 0.95 | Status: active | Created: 2026-09-17T03:24:30 | Tags: `seguridad`, `vendedor`, `sincostos`, `fuga-costo`, `apple-boss`*

---

*End of memory export.*
