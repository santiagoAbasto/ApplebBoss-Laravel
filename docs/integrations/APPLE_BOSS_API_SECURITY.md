# Seguridad de la API de integración Apple Boss

> Última revisión: 09-10-2026. Estado: implementada y probada en local, **sin desplegar**.

## Credenciales

- **Mecanismo:** tokens de Laravel Sanctum (ya instalado; hasta ahora sin usar) emitidos para una **integración**
  (`App\Models\Integracion`, tabla `integraciones`). No son usuarios del panel y no abren ninguna pantalla.
- **Formato:** `<id>|abi_<40 caracteres aleatorios><control>`. El prefijo `abi_` permite que un escáner de secretos
  lo reconozca si alguien lo sube a un repositorio.
- **Almacenamiento:** en la base queda solo el SHA-256 del token (`personal_access_tokens.token`). El texto plano se
  muestra **una vez**, en el pedido que sigue a crearlo, y no se puede recuperar.
- **Envío:** solo por cabecera `Authorization: Bearer <token>`, solo por HTTPS, solo desde un servidor. Nunca en la
  URL, en el navegador, en una app móvil, en el código ni en un chat.
- **Sesiones:** `config/sanctum.php` deja `guard = []`: una sesión del panel no cuenta como token y un token no abre el
  panel.

## Permisos (scopes)

Viven en la integración, no en el token: al cambiarlos rigen al instante para todos sus tokens.

| Scope | Qué deja leer |
|---|---|
| `integration.products.read` | Productos del inventario y sus publicaciones; cambios incrementales |
| `integration.categories.read` | Categorías |
| `integration.inventory.read` | Disponibilidad, reservas (sin datos de quién reservó) y cantidades |
| `integration.pricing.read` | Precios de venta y promociones |
| `integration.media.read` | Fotos de publicaciones visibles |
| `integration.exchange_rates.read` | Tipo de cambio de la tienda |

Todo es de solo lectura. No hay rutas POST, PUT, PATCH ni DELETE: responden 405.

## Ciclo de vida (Sistema → Integraciones API)

| Acción | Efecto |
|---|---|
| Nueva integración | Se crea con nombre y scopes, y se emite su primer token |
| Otro token | Token adicional; los anteriores siguen |
| Rotar token | Token nuevo; los vigentes vencen en 24 h (`Integracion::HORAS_DE_GRACIA`) para cambiarlo sin cortar el servicio |
| Revocar | Ese token deja de servir en el acto |
| Desactivar | Ningún token de la integración entra (`Sanctum::authenticateAccessTokensUsing` en `AppServiceProvider`) |

Emergencia sin panel (en el servidor): desactivar todas las integraciones.

```bash
docker compose -f docker-compose.production.yml exec -T app php artisan tinker --execute='App\Models\Integracion::query()->update(["activa" => false]);'
```

La pantalla pertenece al módulo de permisos `integraciones` (grupo Sistema). Por defecto solo lo tiene el rol admin.

## Límites

| Límite | Valor | Dónde |
|---|---|---|
| Por IP, antes de mirar el token | 300 pedidos/min | `RateLimiter::for('integracion-ip')` |
| Por integración | 120 pedidos/min | `Integracion::LIMITE_POR_MINUTO` |
| Página | máx. 100 productos | validación de `per_page` |
| Búsqueda | 100 caracteres, 8 palabras | validación de `search` |
| Cambios | máx. 200 por lote | validación de `limit` |

Superado un límite: 429 `rate_limited` con `Retry-After`. Los filtros son listas cerradas: no hay SQL arbitrario.

## Registro de accesos

Tabla `integracion_solicitudes`: integración (o vacío si el token no sirvió), id del token, método, ruta, código HTTP,
duración en ms, IP y fecha. **No** guarda el token, cabeceras, cuerpos ni parámetros de búsqueda. Se borra lo que tiene
más de 90 días (`model:prune` a las 03:30). El panel muestra las 60 últimas y los pedidos y errores de las últimas 24 h.

## Qué nunca sale

Costo, ganancia, IMEI 1 y 2 y su estado, número de serie, procedencia o proveedor, código interno de accesorios, notas
privadas, datos de clientes (nombres, teléfonos, correos de reservas y pedidos) y datos financieros internos. Se cuida
de tres formas:

1. Las columnas del inventario se leen una por una (`InventarioIntegracion::EQUIPOS`); los datos privados ni se cargan.
2. Los atributos públicos de la ficha pasan por `CatalogoPublicacion::atributosPublicos()`, que descarta nombres
   privados y cualquier número de 15 dígitos (un IMEI con otro nombre).
3. `IntegracionApiTest` busca IMEI, serie, procedencia, costo, código interno y datos de clientes en todas las rutas.

Errores: siempre `{"error": {code, message, details}}`, sin trazas, rutas de archivos ni versiones.

## Riesgos que quedan

| Riesgo | Mitigación |
|---|---|
| Robo del token | Revocar o desactivar en el panel; la tabla de solicitudes guarda la IP de cada pedido |
| Quien tiene el token ve stock y precios (información comercial) | Scopes mínimos por integración; no dar `inventory.read` o `pricing.read` si no hace falta |
| Detrás de Cloudflare, Laravel ve la IP del borde de Cloudflare (comprobado) | El límite por IP se comparte entre clientes y el registro guarda la IP de Cloudflare. El límite por integración no cambia. Corrección en Caddy, parte B del plan de despliegue |
| El token recién creado queda en el historial de esa pestaña del navegador | Inertia guarda las propiedades de la página en el historial: volver atrás en la misma pestaña lo muestra de nuevo. Copiarlo, cerrar la pestaña y no crear tokens en equipos compartidos |
| Cada pedido arma el inventario en memoria (~600 productos, ~50 ms hoy) | Límites por minuto; si el inventario pasa de unos miles, filtrar en SQL (marcado con `ponytail:` en el código) |
| El token recién creado pasa una vez por la sesión del servidor | Se borra en el pedido siguiente (flash); la sesión no sale del servidor |
| `/changes` no ve borrados físicos | Sincronización completa diaria |

CORS: no se configura. La API es de servidor a servidor y CORS no es autorización.

## Auditoría del 09-10-2026

Cada punto se comprobó con pruebas automáticas (`IntegracionApiTest`, `IntegracionesAdminTest`) o con consultas de
solo lectura en producción.

| Punto | Resultado |
|---|---|
| Todos los endpoints exigen token | Sí: sin token, con token falso, vencido o revocado, 401 |
| Una sesión del panel no reemplaza al token | Sí: la sesión del administrador recibe 401; un usuario del panel en el guard de tokens también |
| Un token no abre el panel | Sí: redirige al inicio de sesión |
| Cada scope abre solo lo suyo | Sí: matriz de 6 scopes × 8 rutas; los bloques sin permiso van en `null` |
| No se mezclan permisos entre integraciones | Sí: dos integraciones seguidas reciben cada una lo suyo; nada se guarda entre pedidos |
| No salen IMEI, serie, costo, procedencia ni datos personales | Sí: se buscaron los 2.818 valores privados reales de la copia local en todas las respuestas. Hubo 2 coincidencias y las dos eran palabras del propio nombre público del producto |
| Solo lectura | Sí: 9 rutas GET; cualquier otro método da 405 y no cambia nada |
| El token se muestra una sola vez | Sí, del lado del servidor. Ver riesgos |
| Revocar corta al instante | Sí: no hay caché de tokens |
| Integración desactivada | Sí: ningún token suyo entra |
| La gracia de 24 h no revive tokens | Sí: rotar no alarga un token vencido ni puede traer uno revocado, que se borra |
| Credenciales en registros o repositorio | No hay: el registro no guarda tokens y la búsqueda en el código no encontró ninguno |
| IP real detrás de Cloudflare | **No.** Las 20 sesiones de producción tienen IP de Cloudflare. Corrección preparada y validada en `APPLE_BOSS_API_DEPLOYMENT.md`, parte B |

## Despliegue

El plan paso a paso, con respaldo comprobado, pruebas y reversión, está en
[APPLE_BOSS_API_DEPLOYMENT.md](APPLE_BOSS_API_DEPLOYMENT.md).
