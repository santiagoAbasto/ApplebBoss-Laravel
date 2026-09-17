# Apple Boss

Sistema web de gestión comercial e inventario con tienda pública para un negocio de productos y servicios tecnológicos.

## Descripción

Apple Boss centraliza ventas, reservas, clientes, cotizaciones, inventario, egresos y servicio técnico. Está orientado a administración y vendedores, y mantiene trazabilidad sobre productos identificados por código, IMEI o número de serie.

También incluye una tienda pública administrable con catálogo, búsqueda, comparación, páginas de contenido y configuración comercial. Es un sistema interno en evolución activa: los flujos principales están implementados y existen pruebas y un entorno Docker, pero no se encontró CI/CD ni evidencia suficiente para afirmar un despliegue productivo.

## Funcionalidades principales

- Autenticación por sesión, verificación de correo, recuperación de contraseña y registro de cuentas restringido a administradores.
- Autorización por roles `admin` y `vendedor`, con paneles y rutas diferenciadas.
- Gestión de celulares, computadoras, productos Apple y productos generales.
- Registro y edición de ventas con actualización de stock, permutas, métodos de pago y comprobantes PDF.
- Reservas con ítems, estados y comprobantes en formato estándar y 80 mm.
- Gestión de clientes, egresos, cotizaciones y servicios técnicos.
- Envío de cotizaciones por correo, publicación opcional de PDF en Google Drive y preparación de enlaces de WhatsApp.
- Reportes comerciales, dashboards, exportaciones PDF y notificaciones internas.
- Auditorías de inventario por escaneo, conciliación de faltantes/novedades y generación asíncrona del PDF final.
- Tienda pública con inicio configurable, catálogo filtrable, búsqueda, fichas de producto, comparación y sincronización de carrito contra precio y disponibilidad del servidor.
- Base de fichas técnicas por modelo (38 iPhone, 16 Mac, una laptop gamer Lenovo y 58 tipos de accesorio) tomadas de las fichas oficiales de cada marca y validadas por esquema. Alimenta las fichas de producto (los accesorios se reconocen por su nombre y salen con descripción, ficha con íconos SVG y compatibilidad) y los comparadores públicos `/comparar/iphone`, `/comparar/mac`, `/comparar/cargadores` y `/comparar/vidrios`, cuyo precio y stock calcula el servidor desde el inventario.
- Administración de publicaciones, imágenes, categorías, colecciones, compatibilidades, menús, páginas, preguntas frecuentes, servicios y ubicaciones.
- SEO técnico básico mediante slugs, metadatos, `robots.txt` y sitemap XML.
- Automatizaciones n8n para respaldo de PostgreSQL y generación de reportes comerciales asistidos por IA.

## Arquitectura

La aplicación sigue una arquitectura monolítica modular. Laravel concentra rutas, seguridad, reglas de negocio, datos e integraciones. Inertia.js conecta los controladores con React sin una API REST independiente para cada pantalla. Eloquent persiste el dominio; Docker usa PostgreSQL 18.

Las APIs JSON se reservan para búsqueda y carrito públicos, consultas privadas de stock y comunicación con automatizaciones. Las colas procesan tareas como la generación de auditorías PDF. n8n funciona como orquestador externo para respaldos y reportes inteligentes. (Nota: el `docker-compose` corre PostgreSQL 18.)

```text
Usuarios públicos                  Admin / Vendedor
       |                                  |
       +---------- Navegador -------------+
                          |
                Laravel + Inertia
                 |       |       |
              React   Eloquent  Colas
                         |       |
                    PostgreSQL  PDF
                         |
            n8n ---- APIs protegidas
             |              |
          OpenAI       correo / Google Drive
```

No se encontró implementación multi-tenant.

## Stack tecnológico

### Backend

- PHP 8.5 en Docker y Laravel 13 (13.32.0 en `composer.lock`). `composer.json` pide PHP `^8.3` y fija la plataforma en 8.3.0, así que las dependencias sirven desde PHP 8.3 (ver «Actualización del stack»).
- Eloquent ORM, autenticación por sesión y Laravel Breeze.
- Inertia Laravel 3, Ziggy y Laravel Sanctum instalado.
- Dompdf para comprobantes, cotizaciones, auditorías y reportes.
- Colas de Laravel y comandos Artisan.

### Frontend

- React 19.3, Inertia React 3 y Vite 8 (Rolldown).
- Tailwind CSS 3.4 (se queda en la 3 a propósito: la 4 no funciona en iPhone con iOS anterior a 16.4). Bootstrap Icons y flag-icons para íconos; Bootstrap, React Bootstrap y Styled Components están instalados pero el código no los usa.
- Framer Motion 13 para interacción visual e íconos lucide-react 1.
- Los gráficos del panel son SVG propios (`Components/Admin/charts`); Chart.js, ApexCharts y Recharts están instalados pero sin uso.

### Base de datos

- PostgreSQL 18 en Docker Compose.
- SQLite en memoria para el entorno de pruebas.

### Testing

- PHPUnit 12.5 mediante la integración de pruebas de Laravel.
- Pruebas unitarias y, principalmente, pruebas feature con base aislada en memoria.

### DevOps / Infraestructura

- Docker y Docker Compose.
- Apache con PHP 8.5, contenedor de aplicación y worker de colas.
- PostgreSQL, Node 24/Vite, Adminer, n8n 2.39 y Cloudflare Tunnel.

### IA

- API de OpenAI Chat Completions, invocada desde un workflow de n8n.
- Salida JSON estructurada para reportes comerciales.

### Integraciones

- Google Drive mediante Google API Client y Flysystem.
- Correo mediante Laravel Mail y trabajos en cola.
- WhatsApp mediante enlaces de envío; no se observó una integración directa con la API oficial.
- n8n para orquestación y Cloudflare Tunnel para exposición controlada del entorno.

## Modelo de datos

El dominio usa Eloquent ORM. Sus entidades principales son usuarios, clientes, ventas e ítems, reservas e ítems, servicios técnicos, cotizaciones, egresos y cuatro familias de inventario. La capa pública usa publicaciones, imágenes, categorías jerárquicas, colecciones, compatibilidades, páginas, menús, FAQ, servicios, ubicaciones y secciones del inicio.

Los ítems de venta conservan snapshots de nombre, categoría, costo y precio. Existen restricciones únicas para correos, códigos, IMEI, números de serie, slugs y períodos de reporte, además de claves foráneas e índices para catálogo, navegación, auditorías y consultas por usuario/fecha.

Ventas, reservas y auditorías usan transacciones; la selección de inventario emplea `lockForUpdate()` para reducir carreras. Los reportes automáticos guardan JSONB y metadatos de motor, prompt y período. No se observó borrado lógico general ni auditoría transversal; la auditoría de inventario sí registra quién inicia, cierra y escanea.

## Seguridad

- Las áreas internas requieren autenticación; los paneles administrativos y de vendedor aplican middleware de rol.
- El registro público está deshabilitado y la creación de usuarios exige sesión de administrador.
- Login, registro, recuperación, confirmación y verificación de correo tienen límites de solicitudes específicos.
- La política de contraseña exige al menos ocho caracteres, mayúsculas y minúsculas, números y símbolos; el alta de usuarios comprueba además contraseñas comprometidas.
- Las rutas de automatización requieren `X-AUTOMATION-TOKEN`, comparado con `hash_equals`; si el secreto no está configurado, el middleware rechaza la solicitud. Estas rutas tienen rate limiting. El token de n8n (test, top-products, reports) está separado del export financiero, que usa un token propio (`AUTOMATION_EXPORT_TOKEN`, cerrado por defecto); el middleware acepta varios tokens para rotar sin cortar n8n (`php artisan automation:token`).
- Detrás de un proxy/túnel, los proxies de confianza se declaran en `TRUSTED_PROXIES` (por defecto ninguno), para que nadie falsee la IP con `X-Forwarded-For` y se salte los límites por IP o el bloqueo de login.
- El vendedor nunca recibe costo, ganancia ni procedencia: se quitan en el servidor (`App\Support\SinCostos`) en listados, API de stock, registrar/editar venta y reservas activas. El admin sí los ve.
- El vendedor solo inicia sesión dentro del horario laboral (09:00–13:00 y 14:00–19:00, `America/La_Paz`), configurable en `config/horario.php`; el admin no tiene restricción.
- Las rutas web usan la protección CSRF del grupo `web` de Laravel. Las consultas se realizan principalmente con Eloquent y Query Builder, que utilizan bindings parametrizados.
- Las páginas públicas proyectan campos permitidos y las pruebas verifican que no se expongan costo, IMEI, número de serie ni otros datos internos. El carrito vuelve a consultar precio, publicación y disponibilidad en el servidor.
- El contenido enriquecido del catálogo se limpia con una lista permitida de etiquetas y enlaces; existen pruebas contra `script`, atributos de evento, estilos, iframes y URLs `javascript:`/`data:`.
- Los uploads de catálogo aceptan únicamente JPG, JPEG, PNG o WebP y limitan cada archivo a 10 MB.
- Un middleware añade CSP por entorno, HSTS bajo HTTPS en producción, protección anti-clickjacking/anti-MIME y cabeceras anti-caché para áreas privadas.
- Los secretos se obtienen desde variables de entorno y los patrones de `.gitignore` excluyen entornos locales, credenciales de Google, claves, backups y dependencias.

Se realizó una auditoría de seguridad de extremo a extremo (caja negra + caja blanca + carga con k6) documentada en **[`docs/seguridad/`](docs/seguridad/README.md)**: 6 hallazgos, todos corregidos y verificados, más el blindaje público y el horario del vendedor. Ahí están el reporte, los diagramas y la guía para reproducir las pruebas.

## APIs e integraciones

La mayor parte de la interfaz usa solicitudes Inertia. Los endpoints JSON implementados cubren:

- búsqueda pública y sincronización de carrito, ambas con rate limiting;
- consultas autenticadas de stock por tipo e identificadores;
- lectura y marcado de reportes automáticos para usuarios autenticados;
- endpoints de automatización para obtener datos comerciales, guardar reportes y exportar información, protegidos por token y límite de solicitudes.

Las cotizaciones pueden generar PDF, enviarse por correo en cola y, cuando existe configuración OAuth válida, subirse a Google Drive. Los flujos de WhatsApp construyen mensajes/enlaces para envío individual o por lote sin publicar credenciales ni depender de un SDK de mensajería en el backend.

## Inteligencia Artificial

El workflow `intelligent-weekly-report.json` obtiene datos consolidados desde Laravel y solicita a OpenAI un informe JSON con resumen, análisis por categoría, riesgos, oportunidades, recomendaciones y productos destacados.

La IA se limita a interpretación y redacción: Laravel calcula las cifras y el workflow vuelve a imponer facturación, utilidad, margen y período desde la fuente. Si la respuesta es inválida o incompleta, conserva una estructura factual de respaldo. El reporte guarda motor y prompt, se persiste como JSONB y genera una notificación para revisión humana. No se observan RAG, embeddings ni agentes autónomos.

## Testing y calidad

El repositorio contiene 20 archivos y 115 métodos de test: 19 feature y uno unitario. Cubren autenticación, autorización, ventas, servicios, secuencias, stock, auditorías, configuración, catálogo y privacidad pública, compatibilidades, XSS, SEO y constructor del inicio.

La configuración de PHPUnit usa SQLite en memoria, cache/sesiones en memoria, correo simulado y cola síncrona. El script `composer test` limpia la configuración y ejecuta `php artisan test`. No se ejecutó la suite durante esta actualización para respetar la restricción de no modificar artefactos fuera de `README.md`; por tanto, no se afirma que todos los tests estén pasando. Tampoco se encontraron workflows de GitHub Actions, GitLab CI ni Jenkins.

Comandos disponibles:

```bash
cd src
composer test
npm run build
```

## DevOps y despliegue

`docker-compose.yml` define aplicación Apache/PHP, worker de colas, PostgreSQL 18, Vite, Adminer, n8n y dos modalidades de Cloudflare Tunnel. Los servicios persistentes usan volúmenes y la base incluye healthcheck. El workflow de respaldo ejecuta una copia programada de PostgreSQL; el workflow inteligente se ejecuta semanalmente y entrega el reporte a Laravel.

El repositorio no aporta manifiestos Kubernetes/Helm ni una canalización CI/CD. Docker Compose evidencia un entorno reproducible de desarrollo y operación, pero no demuestra por sí solo un despliegue productivo, monitoreo o política externa de backups.

### Actualización del stack (2026-09-16)

PHP 8.5, Laravel 13, Inertia 3, React 19, Vite 8, PHPUnit 12, PostgreSQL 18 y n8n 2.39, verificado paso a paso (575 tests, 120 capturas antes/después de la tienda y los dos paneles, 21 interacciones en navegador, CSRF y conteos de la base). Lo que conviene saber al tocar el proyecto:

- **Tailwind sigue en la 3.4** a propósito: la 4 no funciona en iPhone con iOS anterior a 16.4.
- `vite.config.js` fija los navegadores de antes (`safari14`, `chrome87`…) y minifica el CSS con esbuild; `resources/js/polyfills.js` agrega `Object.hasOwn` para iOS 14 y 15.
- Las etiquetas SEO de `app.blade.php` usan `data-inertia` (Inertia 3), no `inertia`.
- `composer.json` fija la plataforma en PHP 8.3: las dependencias sirven en cualquier servidor con PHP 8.3 o más.
- PostgreSQL 18 usa el volumen `appleboss_db_data_pg18` montado en `/var/lib/postgresql`; el de la 15 quedó sin usar como respaldo.

Detalle, respaldos y cómo volver atrás: [`docs/admin-ui/informes/actualizacion-stack-2026-09-16.md`](docs/admin-ui/informes/actualizacion-stack-2026-09-16.md).

## Instalación local

### Con Docker Compose

1. Clonar el repositorio y ubicarse en su raíz.
2. Crear/configurar los archivos de entorno requeridos sin versionar secretos. Docker usa PostgreSQL y exige credenciales para la base y el token de automatización; OpenAI, Google Drive y Cloudflare son opcionales según los servicios utilizados.
3. Construir e iniciar los servicios:

```bash
docker compose up --build
```

4. Ejecutar migraciones dentro del contenedor de aplicación:

```bash
docker compose exec app php artisan migrate
```

### Sin Docker

Requiere PHP 8.3+ (en Docker corre 8.5), Composer, Node.js/npm y una base compatible con las migraciones. La plantilla `src/.env.example` debe revisarse porque sus valores locales de base de datos no coinciden con PostgreSQL de Docker.

```bash
cd src
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
composer run dev
```

`composer run dev` inicia el servidor Laravel, el listener de cola, el visor de logs y Vite. Para compilar assets de producción se usa `npm run build`.

## Estructura del proyecto

```text
.
├── Dockerfile                  # Apache, PHP y extensiones
├── docker-compose.yml          # Entorno multi-servicio
├── docker/n8n/                 # Imagen auxiliar de automatización
├── docs/admin-ui/              # Documentación, diagramas, grafo del código e informes
├── n8n/workflows/              # Backup y reporte con IA
└── src/
    ├── app/
    │   ├── Console/Commands/   # Mantenimiento de datos
    │   ├── Http/               # Controladores, middleware y requests
    │   ├── Jobs/               # Procesamiento asíncrono
    │   ├── Mail/               # Correos de cotización
    │   ├── Models/             # Entidades Eloquent
    │   └── Services/           # Códigos e imágenes de productos
    ├── database/migrations/    # Esquema y restricciones
    ├── docs/                   # Documentación y checklists
    ├── resources/js/           # Páginas, layouts y componentes React
    ├── resources/views/        # Shell Blade, correos y plantillas PDF
    ├── routes/                 # Web, autenticación y API
    ├── scripts/                # Build de frontend
    └── tests/                  # Pruebas unitarias y feature
```

## Documentación y memoria del proyecto

- **Guía por módulo:** [`docs/admin-ui/README.md`](docs/admin-ui/README.md), con el traspaso para retomar el trabajo en [`docs/admin-ui/TRASPASO.md`](docs/admin-ui/TRASPASO.md).
- **Diagramas:** HTML interactivos generados con archify en [`docs/admin-ui/diagramas/`](docs/admin-ui/diagramas/), por ejemplo `modelos-referencia.html`, `computadoras-mac.html` y `accesorios.html`.
- **Grafo del código:** generado con graphify en `docs/admin-ui/grafo/graphify-out/` (`graph.html`, `GRAPH_REPORT.md`).
- **Informes de datos:** fuentes y pendientes de cada ficha en [`docs/admin-ui/informes/`](docs/admin-ui/informes/), por ejemplo [`computadoras-2026-09-15.md`](docs/admin-ui/informes/computadoras-2026-09-15.md) y [`accesorios-2026-09-15.md`](docs/admin-ui/informes/accesorios-2026-09-15.md) (cargadores, vidrios, fundas y accesorios de marca, con las comparativas de cargadores y de vidrios).
- **Memoria entre sesiones:** memanto en modo local (servidor Moorcheh en `127.0.0.1:8095`, agente `apple-boss`). Guarda decisiones y reglas, no bitácoras.

## Decisiones técnicas destacables

- Uso de Inertia para mantener una sola aplicación desplegable y compartir rutas, validación y autorización de Laravel con React.
- Separación entre inventario operativo y publicaciones públicas, evitando exponer directamente atributos internos de cada producto.
- Transacciones y bloqueos pesimistas para coordinar cambios de estado en unidades de inventario durante ventas y reservas.
- Snapshots en ítems de venta para que los reportes históricos no dependan de cambios posteriores en productos.
- Cálculo determinístico de indicadores comerciales antes de delegar a IA únicamente el análisis narrativo.
- Fichas técnicas generadas desde datos validados por esquema. Primero va la fuente oficial del fabricante. Lo que no publica se carga solo si lo confirman dos fuentes externas; si no, queda pendiente. La base no depende del stock, así que la ficha de un equipo vendido se conserva.

## Desafíos técnicos resueltos

- **Problema:** evitar dobles ventas o reservas sobre inventario unitario. **Solución:** transacciones, consultas con bloqueo y validación del estado disponible antes de persistir.
- **Problema:** publicar catálogo sin filtrar costos ni identificadores privados. **Solución:** modelo de publicación separado, proyecciones públicas, resincronización del carrito en servidor y pruebas de privacidad.
- **Problema:** conciliar inventario físico mientras ocurren ventas o nuevas recepciones. **Solución:** snapshot al iniciar la auditoría, registro de escaneos y clasificación diferenciada de faltantes, novedades y salidas justificadas.

## Estado del proyecto

**Sistema interno.** Los módulos operativos, la tienda pública, las automatizaciones y una suite de pruebas están implementados. El historial y la estructura muestran evolución continua, pero la ausencia de CI/CD y de evidencia verificable de operación pública impide clasificarlo desde este repositorio como producto en producción.

## Mi contribución

Mi contribución reflejada en el repositorio abarca el diseño e implementación de una aplicación full stack con Laravel, Inertia y React; la modelación de ventas, inventario, reservas y servicio técnico; la separación segura entre datos internos y catálogo público; la autorización por roles; la generación de documentos; y la automatización de reportes y respaldos con n8n. También incluye controles de concurrencia para stock, pruebas feature sobre flujos críticos y una integración de IA donde las métricas permanecen bajo lógica determinística.

## Resumen para portfolio

### Portfolio Summary

Nombre:
Apple Boss

Tipo:
Sistema interno de gestión comercial con tienda pública

Rol:
Desarrollo full stack y diseño técnico verificable en el repositorio

Descripción corta:
Aplicación para administrar inventario unitario, ventas, reservas, clientes, cotizaciones, servicios técnicos, reportes y publicaciones de una tienda tecnológica.

Stack principal:
PHP 8.5, Laravel 13, React 19, Inertia.js 3, PostgreSQL 18, Tailwind CSS 3.4, Vite 8 y Docker Compose

Arquitectura:
Monolito modular Laravel/Inertia con frontend React, APIs JSON específicas, colas y automatizaciones externas en n8n

Seguridad:
Sesiones, roles, CSRF, rate limiting, validación, sanitización XSS, CSP/cabeceras HTTP, secretos por entorno y control explícito de datos públicos

Testing:
PHPUnit con 312 pruebas unitarias/feature; pasan todas (`php artisan test`, verificado el 2026-09-15)

DevOps:
Docker Compose con Apache/PHP, worker, PostgreSQL, Node/Vite, Adminer, n8n y Cloudflare Tunnel; sin CI/CD detectado

IA:
OpenAI orquestado por n8n para reportes JSON, con KPIs determinísticos, validación/fallback y revisión desde el panel

5 habilidades clave:
1\. Arquitectura full stack Laravel, Inertia y React
2. Modelado relacional con Eloquent y PostgreSQL
3. Seguridad web y autorización basada en roles
4. Transacciones y control de concurrencia de inventario
5. Automatización e integración de IA con n8n

3 logros o aportes verificables:

- Implementación de flujos integrados de ventas, reservas, inventario y servicio técnico con documentos PDF.
- Construcción de una tienda pública desacoplada de los campos privados del inventario y cubierta por pruebas de privacidad.
- Automatización de reportes comerciales con datos determinísticos y salida estructurada de OpenAI.

Nivel de madurez:
Sistema interno funcional en evolución activa

Elementos que no deben publicarse:

- Archivos `.env`, credenciales OAuth, tokens de Google/OpenAI/Cloudflare/n8n y contraseñas de base de datos.
- Logs, sesiones, backups, PDFs generados y datos reales de clientes, ventas o inventario.
- URLs privadas, identificadores de infraestructura y valores internos de configuración.

## Evidencia técnica

| Afirmación | Evidencia |
| ---------- | --------- |
| Laravel 13, PHP 8.3+ (8.5 en Docker), Inertia 3 y dependencias backend | `src/composer.json`, `src/composer.lock` |
| React 19, Vite 8 y librerías frontend | `src/package.json` |
| Rutas públicas, internas, roles y APIs | `src/routes/web.php`, `src/routes/auth.php`, `src/routes/api.php` |
| Dominio y relaciones Eloquent | `src/app/Models/`, `src/database/migrations/` |
| Transacciones y bloqueo de inventario | `src/app/Http/Controllers/VentaController.php`, `src/app/Http/Controllers/ReservaController.php` |
| Privacidad, XSS, autenticación y flujos de negocio probados | `src/tests/Feature/` |
| Cabeceras, roles y token de automatización | `src/app/Http/Middleware/` |
| Docker, PostgreSQL, worker, n8n y túneles | `Dockerfile`, `docker-compose.yml` |
| Automatización e integración OpenAI | `n8n/workflows/intelligent-weekly-report.json` |
| Google Drive, correo y PDFs | `src/app/Http/Controllers/Admin/CotizacionController.php`, `src/app/Mail/`, `src/resources/views/pdf/` |
| Fichas por modelo, esquemas y comparadores | `src/database/data/modelos_referencia/`, `src/app/Support/FichaTecnica/`, `src/app/Http/Controllers/ComparadorModelosController.php` |
