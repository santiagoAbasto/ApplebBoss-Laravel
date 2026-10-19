# Apple Boss — Arquitectura Actual
> Generado: 2026-09-13 — inspección completa del repositorio

> **Documento histórico.** Es la foto del repositorio del 13-09-2026, antes de la tienda en línea con checkout, la API
> y los correos al cliente. No describe el sistema de hoy. Lo vigente está en [README.md](README.md),
> [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md), [docs/integrations/APPLE_BOSS_API.md](docs/integrations/APPLE_BOSS_API.md) y
> [docs/seguridad/arquitectura-resumen.md](docs/seguridad/arquitectura-resumen.md).

## Qué cambió desde entonces (verificado el 19-10-2026)

| Tema | En este documento | Hoy |
|------|-------------------|-----|
| Backend | PHP 8.2 + Laravel 12 | Laravel 13.32; PHP 8.4 en producción (imagen `php:8.4-apache`) y 8.5 en el Docker de desarrollo; `composer.json` admite desde PHP 8.3 |
| Frontend | React 18 + Inertia v2, Vite 6 | React 19.3, Inertia 3.7, Vite 8.3; Tailwind sigue en 3.4 a propósito (la 4 no funciona en iOS anterior a 16.4) |
| Base de datos | PostgreSQL 15 | PostgreSQL 18 |
| Panel | SB Admin 2 (Bootstrap) | `PanelShell` con Tailwind, compartido por el administrador y el vendedor |
| Roles | admin y vendedor, sin RBAC formal | Roles como datos (tabla `roles`, `App\Models\Role`) con permisos por módulo (`App\Support\Permisos`); al vendedor nunca le llegan costo ni ganancia (`App\Support\SinCostos`) |
| Trade-In | No existe | `/trade-in` (cotizador público) y su bandeja en el panel |
| Novedades | No existe | `/novedades` y Tienda online → Novedades |
| API v1 | Incompleta | `/api/v1/integration`: solo lectura, tokens por scope, en producción desde el 09-10-2026 |
| Reseñas de Google | No existe | `resenas:google` todos los días a las 07:00 (Google Business Profile) |
| schema.org | Parcial | `App\Support\Seo\DatosEstructurados` (Store, Product, migas y slogan) |
| Ofertas con fechas | Parcial | `promocion_desde` y `promocion_hasta` en la publicación |
| Tests E2E | No existen | Siguen sin existir; 827 pruebas feature y unitarias con PHPUnit |
| Producción | — | appleboss.com.bo, VPS con Docker detrás de Cloudflare y Caddy; despliegue, vuelta atrás y respaldos en `docs/DESPLIEGUE.md` |

---

*Lo que sigue es el documento original del 13-09-2026, sin cambios.*

## Stack verificado

| Capa | Tecnología |
|------|-----------|
| Backend | PHP 8.2 + Laravel 12 |
| Frontend | React 18 + Inertia.js v2 |
| CSS | Tailwind CSS v3 + SB Admin 2 (Bootstrap 5) en admin |
| Build | Vite 6 |
| DB | PostgreSQL 15 |
| Queue | Laravel Queue (sync en dev, database en prod) |
| PDF | Dompdf / barryvdh |
| Storage | Google Drive (flysystem-google-drive-ext) |
| Motion | Framer Motion v12.15.0 |
| Charts | ApexCharts, Chart.js, Recharts |
| Icons | Lucide, Heroicons, React Icons, Bootstrap Icons, FontAwesome 5 |
| Auth | Laravel Breeze (Inertia) + roles custom (RolMiddleware) |
| API client | ziggy-js para rutas desde JS |
| Infrastructure | Docker Compose (app, node, queue, postgres, n8n, adminer, cloudflare tunnels) |
| Automation | n8n (reportes, backups) |

## Roles existentes

- `admin` — acceso total
- `vendedor` — operaciones de venta y cotizaciones
- Sin RBAC formal (Policies/Gates no implementadas aún)

## Modelos principales

### Inventario interno (ERP)
- `Celular` — equipo celular (con numero_serie, IMEI, precio_costo, precio_venta)
- `Computadora` — computadoras/MacBook
- `ProductoApple` — accesorios/productos Apple
- `ProductoGeneral` — productos genéricos
- `InventoryAudit` / `InventoryAuditItem` — auditorías de inventario

### Operaciones
- `Venta` / `VentaItem` — ventas con snapshot de precio
- `Reserva` / `ReservaItem` — reservas de productos
- `Cotizacion` — cotizaciones (PDF)
- `ServicioTecnico` — órdenes de servicio técnico
- `Egreso` — egresos/gastos
- `Cliente` — cartera de clientes

### Catálogo público (ecommerce capa)
- `CatalogoPublicacion` — publicación pública con slug, SEO, condición, precio, promoción, badge
- `CatalogoImagen` — galería de imágenes por publicación
- `CatalogoCompatibilidad` — compatibilidades entre publicaciones
- `CompatibilityTarget` — catálogo de dispositivos compatibles
- `CatalogCategory` — categorías del catálogo público
- `CatalogCollection` — colecciones (ej. "Novedades", "Más vendidos")

### CMS
- `HomeSection` — secciones administrables de la Home (tipo, configuración JSON, visible, orden)
- `Page` — páginas CMS con slug, SEO, secciones JSON, draft/published
- `Faq` — preguntas frecuentes
- `NavMenuItem` — ítems de menú de navegación
- `StoreService` — servicios técnicos públicos
- `StoreLocation` — sucursales/ubicaciones
- `ConfiguracionTienda` — configuración global (whatsapp, SEO, redes, etc.)

### Reportes/automation
- `AutomationReport` / `AutomationReportView` — reportes semanales IA (n8n)
- `SystemNotification` — notificaciones internas del panel
- `Secuencia` — secuencias de numeración

## Estructura de rutas (resumen)

### Públicas
- `GET /` → `PublicCatalogController@home` → `Store/Home`
- `GET /tienda` → `PublicCatalogController@index` → `Store/Catalog`
- `GET /tienda/{slug}` → `PublicCatalogController@show` → `Store/Product`
- `GET /tienda/comparar` → `Store/Compare`
- `GET /{slug}` → `PublicPageController@show` → `Store/Page`
- `GET /sitemap.xml`, `GET /robots.txt`

### API pública
- `GET /api/stock` → `StockController` (disponibilidad rápida)
- `GET /api/search` → `PublicSearchController`

### Admin (protegidas por auth + rol admin)
- Dashboard, Celulares, Computadoras, ProductosApple, ProductosGenerales
- Ventas, Reservas, ServicioTécnico, Cotizaciones, Egresos, Reportes
- Clientes, Exportaciones
- **Sitio Público**: Home Builder, Menús, Páginas, FAQs, Servicios, Categorías, Colecciones, Ubicaciones, Configuración, Catálogo (publicaciones)

## Páginas React existentes

### Store (públicas)
- `Store/Home` — Hero 3D carousel (Framer Motion) + secciones CMS
- `Store/Catalog` — listado con filtros (categoría, condición, precio, búsqueda)
- `Store/Product` — PDP con galería, variantes, specs, WhatsApp CTA
- `Store/Compare` — comparador de productos
- `Store/Page` — páginas CMS genéricas

### Admin
- Dashboard, Celulares CRUD, Computadoras CRUD, ProductosApple CRUD, ProductosGenerales CRUD
- Ventas, Reservas, ServicioTécnico, Cotizaciones, Egresos, Reportes, Clientes
- Catálogo (Publicaciones), Categorías, Colecciones
- Home Builder (secciones), Menús, Páginas, FAQs, Servicios, Ubicaciones, Configuración
- InventoryAudits

## Layouts
- `AdminLayout` — SB Admin 2 (Bootstrap), sidebar fixed 260px
- `StoreLayout` — Header 100px navy, nav, newsletter bar, footer (Tailwind + CSS vars)
- `AuthenticatedLayout`, `GuestLayout`, `VendedorLayout`

## Gaps críticos (Phase 1)

| Gap | Impacto | Estado |
|-----|---------|--------|
| Trade-In | Alto | ❌ No existe |
| Novedades/blog | Medio | ❌ No existe |
| API interna v1 /api/v1/products | Alto | ❌ Incompleta |
| InventoryProviderInterface | Alto | ❌ No existe (arquitectura futura) |
| Google Reviews (Places API) | Medio | ❌ No existe |
| Admin sidebar reorganización | Medio | Parcial |
| SEO estructurado (schema.org) | Alto | Parcial |
| Ofertas con fechas | Medio | Parcial (precio_promocional existe) |
| PDP enriquecida (content blocks) | Alto | Básico |
| Comparador | Bajo | Existe básico |
| Accesibilidad WCAG | Medio | No auditada |
| Tests E2E | Medio | No existen |
