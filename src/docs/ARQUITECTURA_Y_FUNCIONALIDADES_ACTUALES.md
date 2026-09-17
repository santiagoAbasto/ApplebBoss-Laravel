# Apple Boss — Arquitectura y funcionalidades actuales

> Documento técnico-funcional del estado actual del proyecto.
>
> Última revisión: 29 de julio de 2026.

## 1. Resumen ejecutivo

Apple Boss es un sistema interno de gestión comercial orientado a la venta de equipos y productos Apple, reservas, cotizaciones, servicio técnico, clientes, egresos y análisis financiero.

El proyecto es una aplicación monolítica moderna:

- Laravel recibe las solicitudes, valida permisos, ejecuta la lógica comercial y accede a PostgreSQL.
- Inertia conecta Laravel con las páginas React sin mantener una API REST separada para cada pantalla.
- React construye la interfaz del administrador, vendedor, autenticación y página inicial.
- PostgreSQL almacena inventario, ventas, reservas, clientes, servicios, reportes y automatizaciones.
- Dompdf genera comprobantes, cotizaciones, inventarios y reportes PDF.
- n8n ejecuta automatizaciones, copias de seguridad y reportes inteligentes.
- Docker Compose levanta la aplicación, base de datos, frontend, cola, n8n, túneles y Adminer.

Actualmente la única página pública de negocio es `/`. Es una presentación del sistema y acceso al inicio de sesión; todavía no existe un catálogo público de productos.

## 2. Tecnologías principales

### Backend

- PHP 8.2 o superior.
- Laravel 12.
- Inertia Laravel 2.
- Laravel Sanctum.
- Laravel Breeze para autenticación.
- Ziggy para utilizar rutas Laravel desde React.
- Dompdf para generación de PDF.
- Google API Client y Flysystem Google Drive.
- PostgreSQL 15.

### Frontend

- React 18.
- Inertia React 2.
- Vite 6.
- Tailwind CSS.
- Bootstrap 5 y Bootstrap Icons.
- Framer Motion.
- Lucide React, Heroicons y React Icons.
- ApexCharts, Chart.js, Recharts y sus adaptadores React.
- Styled Components.
- Day.js.
- React Toastify y componentes propios de notificación.
- Soporte de números telefónicos y banderas.

### Infraestructura

- Docker y Docker Compose.
- Apache/PHP para la aplicación Laravel.
- Contenedor Node para desarrollo o compilación Vite.
- Contenedor de cola Laravel.
- PostgreSQL.
- n8n.
- Cloudflare Tunnel normal y túnel rápido opcional.
- Adminer.

## 3. Estructura general del repositorio

```text
ApplebBoss-Laravel/
├── Dockerfile
├── docker-compose.yml
├── docker/
│   └── n8n/
│       └── Dockerfile
├── n8n/
│   └── workflows/
│       ├── database-backup-daily.json
│       └── intelligent-weekly-report.json
├── backups/
│   └── database/
└── src/
    ├── app/
    │   ├── Console/Commands/
    │   ├── Http/
    │   │   ├── Controllers/
    │   │   ├── Middleware/
    │   │   └── Requests/
    │   ├── Mail/
    │   ├── Models/
    │   ├── Providers/
    │   └── Services/
    ├── bootstrap/
    ├── config/
    ├── database/
    │   ├── factories/
    │   ├── migrations/
    │   └── seeders/
    ├── docs/
    ├── public/
    ├── resources/
    │   ├── css/
    │   ├── js/
    │   │   ├── Components/
    │   │   ├── Hooks/
    │   │   ├── Layouts/
    │   │   └── Pages/
    │   └── views/
    │       ├── emails/
    │       └── pdf/
    ├── routes/
    ├── storage/
    └── tests/
```

## 4. Arquitectura de una solicitud

```text
Navegador
   ↓
Ruta Laravel
   ↓
Middleware de sesión, verificación y rol
   ↓
Controlador
   ↓
Modelos Eloquent / PostgreSQL
   ↓
Inertia::render(página, propiedades)
   ↓
Página React
```

React no consume una API independiente para la mayoría de las pantallas. El controlador entrega directamente los datos de la página mediante propiedades Inertia. Las operaciones de formularios utilizan `post`, `put`, `patch` o `delete` de Inertia y reciben errores de validación Laravel.

Existen APIs específicas para stock, permutas, reportes automáticos y n8n.

## 5. Roles, autenticación y seguridad

### Roles

El campo `users.rol` admite:

- `admin`
- `vendedor`

El middleware `rol` verifica que exista una sesión y que el usuario tenga el rol requerido. Las rutas administrativas usan `rol:admin` y las rutas de vendedor usan `rol:vendedor`.

### Autenticación

El proyecto incluye:

- Inicio y cierre de sesión.
- Registro.
- Verificación de correo.
- Recuperación y restablecimiento de contraseña.
- Confirmación de contraseña.
- Edición de perfil.
- Actualización de contraseña.
- Eliminación de cuenta.

La ruta `/dashboard` redirige automáticamente a `admin.dashboard` o `vendedor.dashboard` según el rol.

### Seguridad HTTP

`SecurityHeadersMiddleware` agrega:

- Content Security Policy adaptada a desarrollo o producción.
- `X-Content-Type-Options`.
- `X-Frame-Options`.
- `Referrer-Policy`.
- `Permissions-Policy`.
- `Cross-Origin-Opener-Policy`.
- `Cross-Origin-Resource-Policy`.
- HSTS cuando la aplicación está en producción y usa HTTPS.
- Prevención de caché en páginas protegidas.

En producción Laravel fuerza URLs HTTPS. La política global de contraseñas exige un mínimo de ocho caracteres, mayúsculas, minúsculas, números, símbolos y comprobación contra contraseñas comprometidas.

Las rutas de automatización se protegen mediante `X-AUTOMATION-TOKEN`, comparación segura y límite de solicitudes.

## 6. Backend Laravel

### 6.1 Inventario

El inventario está separado en cuatro entidades.

#### Celulares

Campos principales:

- Modelo.
- Capacidad.
- Color.
- Batería.
- IMEI 1 e IMEI 2.
- Estado de IMEI.
- Procedencia.
- Precio de costo.
- Precio de venta.
- Estado de inventario.

Estados: `disponible`, `vendido` y `permuta`.

El modelo incluye un orden especial de iPhone que normaliza el nombre y ordena las familias X, XS, XR y series 11 a 20 por variante.

El administrador puede listar, crear, editar, eliminar y volver a habilitar celulares.

#### Computadoras

Campos principales:

- Número de serie.
- Nombre.
- Procesador.
- Batería.
- Color.
- RAM.
- Almacenamiento.
- Procedencia.
- Precio de costo.
- Precio de venta.
- Estado.

El administrador dispone de CRUD y rehabilitación de productos.

#### Productos generales

Campos principales:

- Código único.
- Tipo.
- Nombre.
- Procedencia.
- Precio de costo.
- Precio de venta.
- Estado.

Incluye comprobación asíncrona de códigos repetidos y creación rápida de productos provenientes de una permuta.

#### Productos Apple

Campos principales:

- Modelo.
- Capacidad.
- Batería.
- Color.
- Número de serie.
- Procedencia.
- Precio de costo.
- Precio de venta.
- Indicador de IMEI.
- IMEI 1 e IMEI 2 opcionales.
- Estado de IMEI.
- Estado del producto.

El administrador dispone de CRUD. Los productos pueden formar parte de los ítems de una venta o reserva.

### 6.2 Stock disponible

`StockController` expone endpoints autenticados para consultar:

- Celulares.
- Computadoras.
- Productos generales.
- Productos Apple.
- Producto por código.

Antes de ofrecer un producto, se excluyen los artículos comprometidos por reservas activas.

El vendedor tiene una vista consolidada con pestañas para las cuatro categorías, búsqueda local, conteos y paginación.

### 6.3 Ventas

La venta es el núcleo transaccional del sistema.

Funcionalidades:

- Venta con uno o varios ítems.
- Productos de cualquiera de los inventarios.
- Servicios técnicos como concepto de venta.
- Descuentos.
- Métodos de pago: efectivo, QR y tarjeta.
- Datos parciales de tarjeta.
- Permutas.
- Aplicación de anticipos provenientes de reservas.
- Cálculo de subtotal, precio invertido y ganancia neta.
- Código de nota.
- Notas adicionales.
- Asociación al vendedor.
- Edición controlada de ventas.
- Búsqueda por nota, cliente, teléfono o producto.
- Boleta estándar y boleta de 80 mm.
- Exportación de ventas del vendedor.

`VentaItem` conserva una instantánea del producto vendido:

- Categoría y nombre.
- Modelo, capacidad, color y batería.
- Procesador, RAM y almacenamiento.
- Precio de venta, costo, descuento y subtotal.

Esta instantánea mantiene el historial aunque el producto original cambie después y también alimenta los reportes analíticos.

Al editar una venta se comparan los valores anteriores y posteriores. El sistema puede crear una notificación administrativa con el detalle de los cambios.

### 6.4 Reservas

Las reservas permiten bloquear temporalmente productos disponibles.

Datos principales:

- Código `AT-R...`.
- Cliente y teléfono.
- Fecha.
- Subtotal.
- Monto de reserva.
- Términos y condiciones.
- Estado.
- Vendedor.
- Venta asociada.

Estados:

- `activa`
- `vendida`
- `cancelada`
- `vencida`

Una reserva contiene uno o más ítems y guarda una instantánea de cada producto. El backend impide reservar un producto inexistente, no disponible o ya incluido en otra reserva activa.

Una reserva activa puede convertirse en venta. El anticipo se aplica a la venta y las relaciones quedan registradas.

Se generan comprobantes estándar y de 80 mm.

### 6.5 Servicio técnico

El módulo registra:

- Código `AT-ST...`.
- Cliente y teléfono.
- Equipo.
- Detalle del servicio.
- Notas adicionales.
- Precio de costo y precio de venta.
- Técnico.
- Fecha.
- Vendedor.
- Cliente asociado.
- Venta opcional.

Incluye:

- Listado y filtros.
- Registro de servicios.
- Restricción de acceso por rol/propietario.
- Boleta.
- Recibo de 80 mm.
- Exportaciones filtradas.
- Resumen técnico.
- Reportes por día, semana, mes y año.

### 6.6 Cotizaciones

Las cotizaciones pertenecen a un usuario y pueden asociarse a un cliente.

Guardan:

- Instantánea de nombre, teléfono y correo del cliente.
- Ítems en formato JSON.
- Descuento y total.
- Notas.
- Fecha.
- URL de Google Drive.
- Estado de envío por correo y WhatsApp.

Funciones:

- Crear y listar cotizaciones para administrador o vendedor.
- Generar PDF.
- Guardar o enlazar PDF.
- Visualizar PDF.
- Enviar por correo.
- Preparar envío por WhatsApp.
- Reenvío.
- Envío por lote.

Los correos utilizan clases `CotizacionMailable` y `CotizacionEnviada`, con una plantilla Blade dedicada.

### 6.7 Clientes y promociones

Cada cliente registra:

- Usuario que lo creó.
- Nombre.
- Teléfono.
- Correo.
- Documento.

El administrador puede consultar todos los clientes. El vendedor trabaja con los clientes permitidos por su contexto. Ambos cuentan con:

- Listado.
- Búsqueda/sugerencias.
- Edición.
- Envío de promociones.

`promociones_enviadas` registra el cliente, mensaje, canal y fecha de envío. Los canales definidos son WhatsApp, correo y SMS.

### 6.8 Egresos

El administrador puede crear, listar, filtrar y exportar egresos.

Datos:

- Concepto.
- Precio invertido.
- Tipo de gasto.
- Frecuencia.
- Cuotas pendientes.
- Comentario.
- Usuario responsable.

Tipos configurados:

- Servicio básico.
- Cuota bancaria.
- Gasto personal.
- Sueldos.

### 6.9 Dashboards y reportes

#### Dashboard administrativo

Consolida indicadores comerciales y económicos, inventario, ventas, ganancias, métodos de pago y alertas del sistema. La interfaz utiliza tarjetas, gráficos, filtros rápidos por fecha y alertas de automatización.

#### Dashboard de vendedor

Presenta información centrada en la operación del vendedor y sus resultados.

#### Reportes

`ReporteController` reúne ventas e indicadores y soporta:

- Filtros por rango.
- Reporte general.
- Exportación PDF.
- Reportes por día.
- Reportes por semana.
- Reportes por mes.
- Reportes por año.

Los snapshots de `ventas_items` permiten agrupar productos por categoría, modelo y especificaciones sin depender del estado actual del inventario.

### 6.10 Exportaciones de inventario

El administrador puede exportar:

- Celulares.
- Computadoras.
- Productos Apple.
- Productos generales.
- Productos generales por tipo.
- Productos filtrados por nombre.
- Selecciones personalizadas.
- Reporte especializado de fundas MagSafe para iPhone 14 Pro Max.

Las exportaciones se generan como PDF y pueden mostrarse en un visor interno.

### 6.11 Notificaciones

`system_notifications` soporta notificaciones de:

- Ventas.
- Reportes.
- Stock.
- Servicios.

Una notificación puede relacionarse con un reporte automático o una venta. El administrador puede listarlas y marcarlas como leídas.

### 6.12 Automatización e inteligencia

El sistema acepta reportes generados externamente por n8n.

`automation_reports` guarda:

- Periodo.
- Fecha inicial y final.
- Contenido JSONB.
- Versión del motor.
- Versión del prompt.
- Fecha de generación.
- Estado de lectura.

`automation_report_views` registra qué usuario visualizó cada reporte.

Endpoints protegidos por token:

- Prueba de conexión.
- Resumen de productos principales.
- Recepción de reportes automáticos.
- Exportación de reporte de ventas.

El controlador de productos principales calcula facturación, rentabilidad y rankings por categoría o atributos.

Workflows incluidos:

- `database-backup-daily.json`: copia diaria de la base de datos.
- `intelligent-weekly-report.json`: generación del informe semanal inteligente.

### 6.13 Códigos secuenciales

La tabla `secuencias` mantiene el último número de cada familia documental. `GeneradorCodigos` evita colisiones y sincroniza secuencias para ventas, reservas y servicios técnicos.

Existen comandos de consola para:

- Actualizar fechas históricas de ventas.
- Reconstruir snapshots de ventas.

### 6.14 Google Drive

El proyecto registra un disco personalizado de Google Drive. Incluye un controlador OAuth para:

- Redirigir al consentimiento de Google.
- Procesar el callback.

La integración se utiliza principalmente alrededor del almacenamiento o enlace de cotizaciones.

## 7. Rutas

### Públicas y de autenticación

- `/`: presentación pública actual.
- `/login`, `/register` y rutas de recuperación/verificación.
- `/up`: comprobación de salud Laravel.

### Administrador

Todas usan prefijo `/admin`, autenticación, correo verificado y rol `admin`.

- `/admin/dashboard`
- `/admin/celulares`
- `/admin/computadoras`
- `/admin/productos-generales`
- `/admin/productos-apple`
- `/admin/ventas`
- `/admin/reservas`
- `/admin/servicios`
- `/admin/reportes`
- `/admin/cotizaciones`
- `/admin/clientes`
- `/admin/egresos`
- `/admin/exportar`
- `/admin/notifications`
- `/admin/automation`

### Vendedor

Todas usan prefijo `/vendedor`, autenticación, correo verificado y rol `vendedor`.

- `/vendedor/dashboard`
- `/vendedor/productos`
- `/vendedor/celulares`
- `/vendedor/computadoras`
- `/vendedor/productos-generales`
- `/vendedor/ventas`
- `/vendedor/reservas`
- `/vendedor/servicios`
- `/vendedor/cotizaciones`
- `/vendedor/clientes`

### API interna autenticada

- `/api/stock/celulares`
- `/api/stock/computadoras`
- `/api/stock/productos-generales`
- `/api/stock/productos-apple`
- `/api/stock/buscar`
- `/api/permuta/{tipo}`
- Endpoints de creación rápida de productos de permuta.
- Consulta y lectura de reportes automáticos desde el dashboard.

### API de automatización

Usa prefijo `/api/automation`, token y limitación de solicitudes.

- Conectividad.
- Productos principales.
- Recepción de reportes.
- Exportación de reportes.

## 8. Frontend React

### 8.1 Arranque

`resources/js/app.jsx`:

- Carga CSS global, Bootstrap Icons, estilos telefónicos y banderas.
- Inicia Inertia.
- Resuelve automáticamente páginas dentro de `Pages/**/*.jsx`.
- Monta React con `createRoot`.
- Configura el indicador de navegación.
- Integra Ziggy.

La plantilla raíz es `resources/views/app.blade.php`.

### 8.2 Layouts

#### `AdminLayout`

Contiene la estructura principal del administrador:

- Navegación administrativa.
- Encabezado.
- Acceso a módulos.
- Área de contenido.
- Gestión de sesión y cierre de sesión.
- Notificaciones y adaptación responsive.

#### `VendedorLayout`

Presenta una navegación más limitada y orientada a ventas, productos, reservas, servicios, cotizaciones y clientes.

#### `GuestLayout`

Envuelve las pantallas de autenticación.

#### `AuthenticatedLayout`

Layout base autenticado conservado para páginas generales y perfil.

### 8.3 Páginas administrativas

Existen páginas React para:

- Dashboard.
- Automatización y detalle del reporte.
- CRUD de celulares.
- CRUD de computadoras.
- CRUD de productos generales.
- CRUD de productos Apple.
- Crear, editar y listar ventas.
- Crear y listar reservas.
- Crear y listar servicios.
- Crear, listar y enviar cotizaciones.
- Listar y editar clientes.
- Crear y listar egresos.
- Reportes.
- Exportaciones.

### 8.4 Páginas de vendedor

Existen páginas para:

- Dashboard.
- Inventario consolidado.
- Ventas.
- Reservas.
- Servicios técnicos.
- Cotizaciones.
- Clientes.

El inventario consolidado utiliza pestañas, búsqueda con debounce, actualización automática, resumen de disponibilidad y paginación.

### 8.5 Componentes compartidos

Los componentes más relevantes son:

- `CrudUI`: primitivas visuales para pantallas CRUD.
- `FormUI` y `FormUI2`: elementos de formularios.
- `InventoryTable`: tabla reutilizable para las familias de inventario.
- `ReservaForm` y `ReservaIndex`: interfaz reutilizable de reservas.
- `VentaEditForm`: formulario complejo de edición de venta.
- `CardPaymentFields`: campos de pago con tarjeta.
- `ModalPermutaComponent`: captura de productos entregados en permuta.
- `EconomicCharts`, `SalesChart`: visualizaciones financieras.
- `AutomationAlert`: alerta de informes automáticos.
- `DashboardActions`, `QuickActionCards`, `QuickDateFilter`: acciones y filtros del dashboard.
- `Toast`, `ToastNotification`, `IosNotification`: retroalimentación de acciones.
- `Modal`, `ConfirmLogoutModal`, `Dropdown`: interacción general.
- Botones animados y componentes visuales reutilizables.
- Componentes estándar de inputs, labels, errores, checkbox y navegación.

`useAutoRefresh` actualiza periódicamente propiedades Inertia seleccionadas sin recargar toda la página.

### 8.6 Diseño

La interfaz combina Tailwind con estilos de SB Admin 2, Bootstrap y componentes propios. Utiliza:

- Diseño responsive.
- Tablas de inventario.
- Formularios agrupados por secciones.
- Modales.
- Toasts.
- Animaciones Framer Motion.
- Gráficos económicos.
- Navegación diferenciada por rol.

La página pública `Welcome.jsx` tiene fondo oscuro, identidad Apple Boss en rojo, presentación del sistema, funcionalidades y acceso al login.

## 9. Plantillas Blade y PDF

React/Inertia se utiliza para la aplicación interactiva. Blade se conserva para:

- Plantilla raíz de Inertia.
- Correos.
- Documentos PDF.

PDF disponibles:

- Boleta de venta.
- Boleta de venta de 80 mm.
- Boleta de servicio.
- Recibo de servicio de 80 mm.
- Cotización.
- Reserva estándar.
- Reserva de 80 mm.
- Reporte de ventas.
- Ventas del vendedor.
- Exportación de productos.
- Servicios técnicos.
- Resumen de servicios técnicos.
- Visor interno de PDF.

## 10. Modelo de datos

### Tablas operativas

- `users`
- `celulares`
- `computadoras`
- `productos_generales`
- `productos_apple`
- `ventas`
- `ventas_items`
- `reservas`
- `reserva_items`
- `servicio_tecnicos`
- `clientes`
- `cotizaciones`
- `promociones_enviadas`
- `egresos`
- `secuencias`

### Tablas de automatización

- `automation_reports`
- `automation_report_views`
- `system_notifications`

### Tablas de infraestructura Laravel

- `password_reset_tokens`
- `sessions`
- `cache`
- `cache_locks`
- `jobs`
- `job_batches`
- `failed_jobs`

### Relaciones funcionales principales

```text
User
├── Clientes
├── Ventas
├── Reservas
├── Servicios técnicos
├── Cotizaciones
├── Egresos
└── Vistas de reportes automáticos

Venta
├── VentaItems
├── Reserva de origen (opcional)
├── Servicio técnico (opcional)
└── Notificaciones de edición

Reserva
├── ReservaItems
├── Vendedor
└── Venta resultante (opcional)

Cliente
├── Cotizaciones
└── Promociones enviadas

AutomationReport
├── Vistas por usuario
└── Notificaciones
```

`VentaItem` y `ReservaItem` usan `tipo + producto_id` para apuntar lógicamente a una de las cuatro tablas de inventario.

## 11. Flujos funcionales

### Flujo de venta directa

```text
Seleccionar cliente y productos
→ validar disponibilidad y reservas activas
→ calcular precios, descuentos, costo y ganancia
→ registrar Venta y VentaItems
→ marcar productos como vendidos
→ generar boleta
→ reflejar operación en dashboards y reportes
```

### Flujo de reserva

```text
Seleccionar productos disponibles
→ validar que no estén reservados
→ registrar anticipo y condiciones
→ bloquearlos mediante reserva activa
→ emitir comprobante
→ convertir reserva en venta o cancelar/vencer
```

### Flujo de permuta

```text
Registrar producto entregado por el cliente
→ guardarlo en el inventario correspondiente como permuta
→ registrar valor de permuta
→ asociarlo a la venta
→ calcular importe y ganancia final
→ habilitar posteriormente el producto recibido para venta
```

### Flujo de servicio técnico

```text
Registrar cliente, equipo y trabajo
→ asignar técnico, costo y precio
→ asociar vendedor/cliente
→ generar recibo o boleta
→ incluir en filtros, exportaciones y reportes
```

### Flujo de cotización

```text
Seleccionar cliente e ítems
→ calcular descuento y total
→ guardar snapshot
→ generar PDF
→ enviar por correo o preparar WhatsApp
→ registrar estado de envío
```

### Flujo de automatización

```text
n8n consulta métricas protegidas por token
→ procesa información y genera reporte
→ envía JSON a Laravel
→ Laravel guarda el reporte y crea alerta
→ administrador lo visualiza
→ se registra la lectura por usuario
```

## 12. Docker Compose

Servicios declarados:

| Servicio | Función |
|---|---|
| `app` | Laravel sobre servidor web/PHP |
| `queue` | Procesamiento de trabajos en cola |
| `db` | PostgreSQL 15 |
| `node` | Instalación de dependencias y Vite |
| `tunnel` | Cloudflare Tunnel configurado |
| `tunnel-quick` | Túnel temporal opcional |
| `adminer` | Administración visual de PostgreSQL |
| `n8n` | Automatizaciones y reportes |

Se usan volúmenes persistentes para PostgreSQL, n8n, dependencias PHP/Node, caché de Vite, caché de Laravel y compilación pública.

El contenedor Node puede trabajar en:

- Modo `dev`: servidor Vite con HMR.
- Modo `build`: compila los assets y permanece disponible.

## 13. Almacenamiento

Laravel define:

- Disco local privado.
- Disco público en `storage/app/public`.
- Disco S3 preparado por configuración.
- Enlace público `/storage`.
- Disco Google Drive agregado por proveedor.

Actualmente no existe un módulo de fotografías de productos ni tablas de imágenes.

## 14. Pruebas

La suite utiliza PHPUnit.

Incluye pruebas de:

- Autenticación.
- Registro.
- Verificación de correo.
- Recuperación y actualización de contraseña.
- Confirmación de contraseña.
- Perfil.
- Flujo comercial principal.
- Pruebas base de ejemplo.

El comando Composer `test` limpia la caché de configuración y ejecuta `php artisan test`.

## 15. Estado actual de la parte pública

La ruta `/` renderiza `Welcome.jsx`.

Actualmente muestra:

- Marca Apple Boss.
- Presentación del sistema de gestión.
- Resumen de ventas, inventario y reportes.
- Botón de inicio de sesión o acceso al dashboard.

Actualmente no tiene:

- Catálogo público.
- Fotografías por producto.
- Descripciones comerciales.
- Página de detalle.
- Filtros públicos.
- Carrito.
- Reserva pública.
- Compra o pago en línea.
- Control de publicación por producto.

## 16. Observaciones técnicas actuales

- El sistema está diseñado como herramienta interna y entrega información sensible de inventario a pantallas autenticadas; un futuro catálogo público debe usar consultas específicas que excluyan costo, IMEI y número de serie.
- `ProductoVendedorController` consolida cuatro inventarios, pero el filtrado de búsqueda se realiza en el navegador sobre la página actualmente cargada.
- Existen cuatro modelos de inventario con campos similares y reglas particulares. Esto facilita la operación actual, aunque requiere una capa común si se construye un catálogo.
- `ventas` conserva columnas históricas de producto además de la estructura moderna `ventas_items`. La lógica actual debe considerar ambas por compatibilidad.
- Los snapshots de venta y reserva son una decisión importante: preservan el historial y permiten análisis confiables.
- La migración inicial de productos generales elimina un nombre de tabla incorrecto en `down()` (`producto_generals` en vez de `productos_generales`).
- Hay archivos duplicados o residuales como `.DS_Store`, varios `public/hot ...` e `InventoryTable 2.jsx`; conviene limpiarlos de forma controlada.
- En la ruta resource de Productos Apple aparece una acción `show`, pero el controlador actual no implementa ese método.
- El proyecto ya tenía cambios locales ajenos a esta documentación en `docker-compose.yml` y en una vista PDF. No se alteraron.

## 17. Conclusión

Apple Boss ya cubre el ciclo operativo interno:

```text
Inventario
→ cotización o reserva
→ venta/permuta/servicio
→ comprobantes
→ clientes y seguimiento
→ egresos
→ dashboards y reportes
→ automatización inteligente
```

La arquitectura actual permite agregar una parte pública sin reemplazar el sistema. La opción más segura es mantener estos módulos como fuente operativa y crear una capa pública separada que consuma únicamente precio de venta, disponibilidad y características comerciales autorizadas.

