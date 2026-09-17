# Apple Boss — Arquitectura Actual
> Generado: 2026-09-13 — inspección completa del repositorio

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
