# Apple Boss — Plan de Comercio Público · Fase 1
> Stack real: Laravel 12 + React 18 + Inertia.js v2 + Tailwind CSS v3 + PostgreSQL
> Generado: 2026-09-13

## Principios no negociables
- No landing genérica. Arquitectura de sitio real.
- Nunca precio desde frontend. Backend siempre es la fuente de precios.
- MYSKIN solo para fundas/cases.
- Sin afirmaciones no verificables (Apple Authorized, #1 Bolivia, etc.).
- Sin datos hardcodeados. Todo CMS o DB.
- Sin API keys en frontend.
- Sin datos fake en producción.

## Estado de implementación

### ✅ Completado (sesiones anteriores)
- Hero premium con Framer Motion 3D carousel (IPhoneFrame SVG, MacBook backdrop)
- Header sticky 100px con logo, nav, búsqueda, WhatsApp
- Footer con newsletter bar (NewsletterBar component)
- WhatsApp FAB flotante con mensaje contextual
- Modelo CatalogoPublicacion (slug, SEO, condición, precio, promoción, galería)
- CatalogCategory, CatalogCollection
- HomeSection CMS (tipos, configuración JSON)
- PublicCatalogController (home, index/catálogo, show/PDP, compare)
- Store/Home, Store/Catalog, Store/Product, Store/Compare, Store/Page
- Admin: HomeBuilder, Menús, Páginas, FAQs, Servicios, Ubicaciones, Categorías, Colecciones, Configuración
- ConfiguracionTienda (whatsapp, SEO, redes, footer)
- Sitemap XML, robots.txt
- SecurityHeadersMiddleware

### 🔄 En progreso / Pendiente inmediato

#### Sprint A — Admin UX (esta sesión)
- [ ] Reorganizar sidebar admin: agregar sección "Catálogo" prominente, mover publicaciones
- [ ] Agregar "Sitio Web" como sección separada en sidebar
- [ ] Agregar Catálogo → Publicaciones como ítem principal

#### Sprint B — Trade-In
- [ ] Migración: `trade_in_solicitudes` table
- [ ] Modelo TradeInSolicitud
- [ ] Flujo público: wizard guiado en `/trade-in`
- [ ] Admin: listado + estados del proceso
- [ ] WhatsApp CTA con número de solicitud

#### Sprint C — Novedades / Blog
- [ ] Migración: `novedades` table
- [ ] Modelo Novedad (title, slug, excerpt, content, featured_image, status, published_at, SEO)
- [ ] Rutas: `/novedades`, `/novedades/{slug}`
- [ ] Admin CRUD completo
- [ ] Sección en Home (tipo `novedades` ya puede existir en HomeSection)

#### Sprint D — API Interna v1
- [ ] `GET /api/v1/products` — paginado, filtros, search
- [ ] `GET /api/v1/products/{slug}` — detalle con variantes e imágenes
- [ ] `GET /api/v1/categories` — árbol de categorías
- [ ] Rate limiting en api.php
- [ ] Resources para no exponer campos internos

#### Sprint E — Inventory Provider Architecture
- [ ] Interface `InventoryProviderInterface` (getStock, syncProduct, etc.)
- [ ] `NullInventoryProvider` para local/tests
- [ ] Config `config/inventory.php`
- [ ] Job `SyncInventoryJob`
- [ ] Admin panel de sincronización

#### Sprint F — Google Reviews
- [ ] Config: `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`
- [ ] `GooglePlacesService` — fetch y caché (TTL 6h)
- [ ] Admin: Place ID, última sync, rating, botón sync
- [ ] Fallback: sección no aparece si falla
- [ ] Atribución requerida por Google

#### Sprint G — SEO estructurado
- [ ] Schema.org LocalBusiness en Home
- [ ] Schema.org Product + Offer en PDP
- [ ] Schema.org BreadcrumbList
- [ ] Schema.org Article en Novedades
- [ ] Schema.org FAQPage cuando corresponda

#### Sprint H — Motion polish
- [ ] Scroll reveals en secciones de Home
- [ ] Stagger en product grids
- [ ] Hover microinteractions en ProductCard
- [ ] Page transition sutil (Inertia progress bar)
- [ ] Skeleton loading en Catalog/PDP

#### Sprint I — Quality gates
- [ ] Tests Feature para rutas públicas
- [ ] Tests API v1
- [ ] Responsive audit 320-1920px
- [ ] Lighthouse baseline
- [ ] Security review de uploads y rich text

## Rutas objetivo Fase 1

| Ruta | Controlador | Estado |
|------|------------|--------|
| `/` | PublicCatalogController@home | ✅ |
| `/tienda` | PublicCatalogController@index | ✅ |
| `/tienda/{slug}` | PublicCatalogController@show | ✅ |
| `/tienda/comparar` | PublicCatalogController@compare | ✅ |
| `/trade-in` | TradeInController@index | ❌ |
| `/trade-in/solicitud` | TradeInController@store | ❌ |
| `/novedades` | NovedadController@index | ❌ |
| `/novedades/{slug}` | NovedadController@show | ❌ |
| `/api/v1/products` | Api/ProductController@index | ❌ |
| `/api/v1/products/{slug}` | Api/ProductController@show | ❌ |
| `/{slug}` | PublicPageController@show | ✅ |
| `/sitemap.xml` | SitemapController | ✅ |
| `/robots.txt` | RobotsController | ✅ |

## Design tokens existentes (verificados en app.css)
```css
--ab-navy: #011446
--ab-periwinkle: #585E9F
--ab-lime: #C6CB36
--ms-lime: #A3BD31
--ab-deep-violet: #28224F
```

## Decisiones arquitectónicas

**ADR-001**: Catálogo público es una capa sobre el inventario ERP, no lo reemplaza.
- `CatalogoPublicacion` tiene FK a `celulars.id`, `computadoras.id`, etc. via `producto_tipo` + `producto_id`.
- El precio público viene SIEMPRE del backend (CatalogoPublicacion.precio* o Celular.precio_venta). Nunca del frontend.

**ADR-002**: HomeSection usa JSON para settings por sección (flexible sin migración por tipo).
- No permitir HTML arbitrario en settings. Solo campos tipados conocidos.

**ADR-003**: Trade-In genera leads, no valuaciones automáticas confiables.
- Valor estimado = suma de reglas administrativas. Siempre marcado como "sujeto a revisión física".

**ADR-004**: Google Reviews usa caché Redis/file (TTL 6h) para no exceder quotas.
- Si la API falla, la sección se oculta gracefully. No rompe la Home.

**ADR-005**: API v1 usa Resources de Laravel para whitelist explícita de campos.
- Nunca precio_costo, ganancia, IMEI, serial, notas privadas en respuestas públicas.
