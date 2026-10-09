# API de integración Apple Boss — visión general

> v1 · solo lectura · implementada, auditada y guardada en Git el 09-10-2026 · **sin push ni despliegue**.

## Para qué existe

Para que otro sistema autorizado de Apple Boss, empezando por la futura plataforma de ventas con IA (WhatsApp, CRM),
lea desde su servidor lo que el sistema Apple Boss tiene registrado: inventario, precios, disponibilidad, publicaciones,
fotos y tipo de cambio. No escribe nada, no reserva stock, no crea pedidos.

Es **una** fuente. El catálogo comercial de Google Drive, los proveedores y otros documentos son fuentes aparte que
une el segundo proyecto. Ver [APPLE_BOSS_DATA_SOURCES.md](APPLE_BOSS_DATA_SOURCES.md).

## Arquitectura

```
                 appleboss.com.bo  (Laravel 13 · PHP 8.5 · PostgreSQL 18 · Docker en Hostinger, detrás de Cloudflare)
                        │
   inventario (celulares, computadoras, productos_apple, productos_generales)
   publicaciones de la tienda (catalogo_publicaciones + catalogo_imagenes)
   reservas, pedidos en línea, tipo de cambio (TipoDeCambio)
                        │   solo lectura, columnas elegidas una por una
                        ▼
        InventarioIntegracion  ──  arma Product con su procedencia (source)
                        │
   /api/v1/integration  ──  Bearer (Sanctum) · scopes · límites · registro de solicitudes
                        │   HTTPS, de servidor a servidor
                        ▼
              FUTURO SISTEMA APPLE BOSS AI  ◄── catálogo Google Drive, proveedores, documentos, datos manuales
                        │                       (fuentes que esta API no conoce)
                        ▼
                 WhatsApp · CRM · ventas
```

La unión de fuentes, la resolución de conflictos y las reglas comerciales van en el segundo proyecto, no acá.

## Qué hay en este repositorio

| Pieza | Archivo (bajo `src/`) |
|---|---|
| Rutas | `routes/api.php` (grupo `v1/integration`) |
| Controlador de la API | `app/Http/Controllers/Api/Integracion/IntegracionController.php` |
| Armado de productos desde el inventario | `app/Support/Integracion/InventarioIntegracion.php` |
| Formato de errores | `app/Support/Integracion/ErrorApi.php` y `bootstrap/app.php` (`withExceptions`) |
| Permisos por ruta | `app/Http/Middleware/IntegracionScope.php` |
| Registro de solicitudes | `app/Http/Middleware/RegistrarSolicitudIntegracion.php`, `app/Models/IntegracionSolicitud.php` |
| Integraciones y tokens | `app/Models/Integracion.php` (Sanctum `HasApiTokens`), `config/sanctum.php` |
| Límites y regla de integración activa | `app/Providers/AppServiceProvider.php` |
| Tipo de cambio | `app/Support/Pagos/TipoDeCambio.php` (`detalle()`) |
| Tablas | `database/migrations/2026_10_09_100000_integraciones_api.php` |
| Panel | `app/Http/Controllers/Admin/IntegracionController.php`, `resources/js/Pages/Admin/Integraciones/Index.jsx`, módulo `integraciones` en `app/Support/Permisos.php` |
| Pruebas | `tests/Feature/IntegracionApiTest.php`, `tests/Feature/IntegracionesAdminTest.php` |

No se tocaron el inventario, los precios, las fotos, el catálogo público ni la API pública `/api/v1/products`.

## Documentos

| Documento | Para qué |
|---|---|
| [APPLE_BOSS_AI_HANDOFF.md](APPLE_BOSS_AI_HANDOFF.md) | **El principal** para el segundo proyecto: todo lo necesario sin ver este repositorio |
| [APPLE_BOSS_API_CONTRACT.md](APPLE_BOSS_API_CONTRACT.md) | Endpoints, parámetros, esquemas, errores y lo que el sistema no registra |
| [APPLE_BOSS_API_OPENAPI.yaml](APPLE_BOSS_API_OPENAPI.yaml) | Especificación OpenAPI 3.0 |
| [APPLE_BOSS_API_SECURITY.md](APPLE_BOSS_API_SECURITY.md) | Tokens, scopes, rotación, límites, registro, riesgos y la auditoría del 09-10-2026 |
| [APPLE_BOSS_API_DEPLOYMENT.md](APPLE_BOSS_API_DEPLOYMENT.md) | Plan de despliegue verificable y reversible, y la corrección de IP real en Caddy |
| [APPLE_BOSS_DATA_SOURCES.md](APPLE_BOSS_DATA_SOURCES.md) | Las fuentes de información y qué garantiza cada una |

## Cómo se prueba

```bash
docker compose exec -T app php artisan test --filter='IntegracionApiTest|IntegracionesAdminTest'
```
