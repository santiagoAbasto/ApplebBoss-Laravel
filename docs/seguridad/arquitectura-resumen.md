# Architecture summary — ApplebBoss-Laravel run-1

## 1. Product, principals, authority, protected resources
Internal sales/inventory/repair/quotation system for one retail store (Apple Boss, Bolivia) plus a public storefront managed by staff (`README.md:3-9`). Single business, no multi-tenant model.
- **Anonymous visitor**: store pages, `/api/v1/*`, `/api/buscar`, `POST /api/carrito/sync`, `POST /trade-in` (≤6 photos), `/trade-in/confirmacion/{codigo}` (session-bound), `POST /newsletter`, login and password reset (`src/routes/web.php:55-106`, `src/routes/api.php:13-20`, `src/routes/auth.php:39-60`).
- **Newsletter link holder**: `/newsletter/baja/{token}` (48-char random, CSRF-exempt, `src/bootstrap/app.php:28`).
- **vendedor**: `/vendedor/*` (`rol:vendedor`) plus `/api/stock/*`, `/api/permuta/*` (`rol:admin|vendedor`); ownership checks live in controllers (`VentaController.php:31-36`, `ReservaController.php:22-27`, `ServicioTecnicoController.php:19-24`, `CotizacionController` user_id comparisons, `ClienteVendedorController`). Must never see cost/profit/source (`src/app/Support/SinCostos.php:18-41`).
- **Custom roles**: `/admin/*` modules via `permiso` (`PermisoMiddleware.php:29-44`, `Permisos.php:24-88`, `Role.php:81-103`); ownership checks only test `rol === 'vendedor'`.
- **admin**: everything, including users/roles (`UsuarioController`, `RolController`), exports, newsletter, SEO, Google Drive OAuth (`GoogleDriveController.php:12-41`).
- **n8n token holder**: `/api/automation/*` with `X-AUTOMATION-TOKEN` + `hash_equals`, fail-closed (`AutomationTokenMiddleware.php:22-33`); also `POST /automation/store` in the web group (`web.php:652-655`).
- **OpenAI output** (via n8n) stored as automation reports and shown to panel users.
Protected resources: inventory cost/profit/IMEI/source, sales and client PII, user accounts and roles, quote PDFs, trade-in photos, subscriber list, automation token, DB credentials, Google Drive token (`storage/app/google/token.json`).

## 2. Comparable baseline
Laravel Breeze (Inertia/React) auth scaffolding with registration moved behind admin (`src/routes/auth.php:14-36`). Breeze accepts account-existence disclosure on password reset and does not revoke sessions on password change by default; use only as calibration.

## 3. Stack, deployment, offline limits
Laravel 13.32 / PHP 8.5 (Apache image `Dockerfile:2`), Inertia 3, React 19, Vite 8, PostgreSQL 18, database queue worker, n8n 2.39, cloudflared tunnel, Adminer (`docker-compose.yml`). Session guard only; Sanctum installed but unused. `trustProxies(at: '*')` (`src/bootstrap/app.php:25`). CSP/HSTS/forced https depend on `APP_ENV` (`SecurityHeadersMiddleware.php:56-68`, `AppServiceProvider.php:36-47`). dompdf `enable_remote => true` (`src/config/dompdf.php:270`). `src/routes/automation.php` is not loaded.
Offline execution: PHPUnit 12 on SQLite `:memory:` inside the parent sandbox (`tools/sandbox-run.sh`: no network, allowlisted dummy env, read-only src/vendor, hidden `.env`/storage, scratch-only writes on a 256 MiB image, CPU/memory/pid/file/time limits); a loopback `php -S` inside the same container is possible for CSRF/429/header checks. PostgreSQL-only paths (ILIKE, jsonb) are not exercised by SQLite. Prohibited: live stack (127.0.0.1:8010/5434/5680/8082), docker compose build/up, composer/npm installs, Google Drive, SMTP, OpenAI, n8n workflows, tunnels.

## 4. Entry surfaces and key paths
- Admin rich HTML → `strip_tags`+regex sanitizers (`CatalogoPublicacionController.php:482-500`, `PageController.php:98-99,217-252`, `NovedadController.php:306-308`, `Novedad.php:106-153`) → `dangerouslySetInnerHTML` (`Pages/Store/{Page,Product,Novedad}.jsx`, `Admin/Catalogo/Edit.jsx:75`).
- Quote notes Markdown → `{!! $notesHtml !!}` in `resources/views/pdf/cotizacion.blade.php:418`; quote PDFs uploaded to Drive with `anyone/reader` (`CotizacionController.php:202-258`).
- Public cart and sales: server price authority (`PublicCatalogController.php:293-335`, `VentaController.php:124-158`); vendedor edit of sale item prices/costs (`VentaController.php:949-1100`); permuta creates stock with client-chosen cost/price (`CelularController.php:129-153` and siblings).
- Uploads: trade-in photos to private disk (`FotosTradeInService.php:16-27`), admin images with mime + `getMimeType` + UUID names (`ImagenProductoService.php:32-73`).
- Raw SQL fragments with bindings/escaping (`Support/Busqueda.php`, `ProductApiController.php:195-222`, `Celular.php:75-77`, `CatalogoPublicacion.php:327,365`).
- Exports: `ExportController`, `ReporteController@exportar` (also via automation token with any `vendedor_id`), subscriber CSV (`NewsletterSubscriberController.php:138-150`), inventory audit PDF job.
- Automation reports: `report` accepted as any array (`AutomationReportController.php:39-84`), rendered in `Admin/Automation/Show.jsx`.
- Browser: Inertia shared props (full `User` minus hidden fields, permissions), Ziggy publishes all routes (`app.blade.php:56`), Inertia history state.

## 5. Trust boundaries and strongest control
Anonymous→store: public-field serializers + throttles + CSRF. Anonymous→trade-in confirmation: session code list. Anonymous→auth: guest middleware, email+IP lockout (IP from trusted-proxy headers). vendedor→records: per-controller ownership. vendedor→cost data: `SinCostos` (not applied in `VentaController::create/edit`, `CotizacionController::vistaCreate`, `ReservaController::activas`; strips only top-level keys). Custom role→`/admin`: module map; `usuarios` module can create admins. Admin→public HTML: sanitizers. n8n→Laravel: static token. Admin browser→Google OAuth: no `state`. n8n container: env access enabled, same DB user, Execute Command node. Deployment: tunnel ingress, `APP_ENV`, cookie `Secure`, bind IP are not source-visible.

## 6. Starting paths
`src/routes/{web,api,auth}.php`, `src/bootstrap/app.php`, `src/app/Http/Middleware/`, `src/app/Support/{Permisos,SinCostos,Busqueda,NewsletterContent}.php`, `src/app/Http/Controllers/` (Public*, TradeIn*, Newsletter*, Auth/, Admin/, Vendedor/, Api/, Automation/, Venta/Reserva/ServicioTecnico/Celular/Computadora/ProductoGeneral/Reporte), `src/app/Services/`, `src/app/Jobs/`, `src/resources/views/{pdf,emails}`, `src/resources/js/Pages/`, `src/config/{session,dompdf,filesystems,l5-swagger}.php`, `docker-compose.yml`, `Dockerfile`, `docker/`, `n8n/workflows/`, `src/database/seeders/UserSeeder.php`.

## 7. Prior coverage
No prior run or ledger exists; nothing carried or excluded.

## 8. Companion selection
- `WEB-PROTOCOL-AND-AUTH.md`: sessions, CSRF exemption, trusted forwarded headers, password reset, Google OAuth callback, static automation API key.
- `CLIENT-SIDE.md`: sanitizer-dependent `dangerouslySetInnerHTML`, Inertia history props, redirect/return parameters.
- `DATA-ISOLATION-AND-LIFECYCLE.md`: vendedor ownership, cost hiding, exports, public Drive links, reset/account oracles, stale sessions.
- `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md`: unauthenticated uploads/image processing, public search/catalog queries, IP-keyed throttles.
- `PROTOCOLS-RPC-AND-MESSAGING.md`: automation producer (n8n) and queued newsletter delivery.
- `AI-AND-LLM.md`: model output stored and rendered; inventory text in prompts.
- `CLOUD-AND-DEPLOYMENT.md`: trusted proxies, tunnel/Adminer/n8n reachability, n8n env/secret exposure, APP_ENV-dependent controls.
- `SUPPLY-CHAIN-AND-RELEASE.md`: unpinned images and build context.
- Not selected: `MEMORY-SAFETY-AND-BINARY.md` (no native code), `DESKTOP-MOBILE-AND-LOCAL-IPC.md` (no native/mobile/IPC surface).
