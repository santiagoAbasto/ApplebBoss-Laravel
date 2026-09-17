# Propuesta mejorada — Catálogo público y ecommerce Apple Boss

> Propuesta funcional y técnica para incorporar una tienda pública tipo marketplace al sistema actual.
>
> Fecha: 29 de julio de 2026.
>
> Documento relacionado: [`ARQUITECTURA_Y_FUNCIONALIDADES_ACTUALES.md`](./ARQUITECTURA_Y_FUNCIONALIDADES_ACTUALES.md)

## 1. Resumen ejecutivo

Apple Boss ya dispone de la parte más difícil de un ecommerce: inventario real, precios, estados de disponibilidad, ventas, reservas, clientes, cotizaciones, vendedores y reportes.

La propuesta consiste en agregar una capa pública sobre el sistema existente, sin duplicar el inventario ni reemplazar los procesos internos.

La nueva parte pública permitirá:

- Mostrar productos con fotografías, precio y descripción.
- Navegar por categorías.
- Buscar y filtrar productos.
- Consultar el detalle de cada artículo.
- Agregar productos a un carrito.
- Convertir el carrito en una cotización calculada en tiempo real.
- Generar, guardar y compartir automáticamente la cotización en PDF.
- Enviar el carrito por WhatsApp o Telegram.
- Registrar consultas y pedidos dentro del sistema.
- Reservar temporalmente stock durante la confirmación.
- Mostrar automáticamente solamente productos publicables y disponibles.
- Administrar el contenido público desde el panel actual.
- Ofrecer un área privada para clientes.
- Administrar el header, footer, datos de contacto y contenido institucional.
- Evolucionar posteriormente hacia pagos en línea y despacho.

La recomendación es construir el ecommerce por etapas. La primera versión debe ser comercialmente útil, segura y sencilla de operar: catálogo, carrito, WhatsApp, Telegram y registro de pedidos. Los pagos en línea pueden incorporarse después de validar el flujo de venta.

## 2. Objetivo

Crear una tienda pública moderna, inspirada en la facilidad de navegación de Amazon, pero adaptada al negocio real de Apple Boss.

“Tipo Amazon” debe interpretarse como:

- Catálogo visual y organizado.
- Búsqueda rápida.
- Filtros útiles.
- Página detallada por producto.
- Carrito persistente.
- Productos destacados y relacionados.
- Experiencia móvil de alta calidad.
- Proceso claro para convertir interés en pedido.

No implica replicar desde el inicio toda la complejidad de Amazon, como logística multinacional, múltiples vendedores, recomendaciones mediante IA o pagos de diversos países.

## 3. Principios de la solución

### 3.1 El inventario actual sigue siendo la fuente de verdad

Los productos continuarán registrándose en:

- `celulares`
- `computadoras`
- `productos_generales`
- `productos_apple`

La tienda no creará copias independientes del precio ni de la disponibilidad.

El precio público base provendrá de `precio_venta` y la disponibilidad dependerá de:

- Estado `disponible`.
- Ausencia de una reserva activa.
- Publicación habilitada.

### 3.2 Separación entre datos operativos y comerciales

El inventario interno contiene información que no debe exponerse:

- Precio de costo.
- IMEI.
- Número de serie.
- Ganancia.
- Procedencia interna.
- Datos de ventas.
- Datos de clientes.

La capa pública tendrá títulos, descripciones, fotografías y configuración comercial, pero conservará la relación con el producto original.

### 3.3 La tienda se integra con el sistema

Un pedido público no debe convertirse automáticamente en una venta definitiva.

Flujo recomendado:

```text
Cliente arma carrito
→ envía solicitud
→ sistema registra pedido
→ stock queda pendiente o reservado durante un periodo
→ vendedor confirma disponibilidad y forma de pago
→ pedido se convierte en reserva o venta
→ sistema actualiza inventario y reportes actuales
```

Esto evita ventas duplicadas y mantiene el control operativo existente.

### 3.4 Mobile first

La mayoría de las consultas por WhatsApp o redes sociales se originará desde un teléfono. El diseño debe priorizar:

- Carga rápida.
- Botones grandes.
- Fotografías optimizadas.
- Carrito fácil de revisar.
- Contacto en uno o dos pasos.
- Navegación inferior o controles accesibles en móvil.

## 4. Alcance funcional

## 4.1 Sitio público

### Página de inicio

La ruta `/` dejará de presentar el sistema interno y se convertirá en la portada comercial.

Contenido sugerido:

- Encabezado con logo, buscador, categorías y carrito.
- Banner principal con promoción o propuesta de valor.
- Categorías principales.
- Productos destacados.
- Ingresos recientes.
- Ofertas.
- Equipos recomendados.
- Beneficios de compra.
- Ubicación, horarios y medios de contacto.
- Redes sociales.
- Acceso discreto al sistema interno.

### Catálogo

Ruta sugerida:

```text
/catalogo
```

Funciones:

- Grilla responsive.
- Paginación.
- Orden por relevancia, precio, novedad o nombre.
- Filtros persistentes en URL.
- Contador de resultados.
- Vista vacía clara.
- Tarjetas con fotografía principal, título, precio, características y disponibilidad.
- Acción rápida para agregar al carrito.

### Categorías

Rutas sugeridas:

```text
/categoria/celulares
/categoria/computadoras
/categoria/accesorios
/categoria/productos-apple
```

Las categorías públicas podrán agrupar los inventarios internos sin depender estrictamente del nombre de sus tablas.

Ejemplos:

- iPhone.
- Mac.
- iPad.
- Apple Watch.
- AirPods.
- Cargadores.
- Fundas.
- Vidrios templados.
- Accesorios.

### Búsqueda

Ruta:

```text
/buscar?q=iphone+15
```

Buscará únicamente información pública:

- Título.
- Descripción.
- Categoría.
- Modelo.
- Capacidad.
- Color.
- Procesador.
- RAM.
- Almacenamiento.

No buscará ni devolverá IMEI, serie o costo.

### Detalle de producto

Ruta:

```text
/productos/{slug}
```

Contenido:

- Galería de fotografías.
- Título.
- Precio.
- Precio anterior o descuento, si existe.
- Estado de disponibilidad.
- Descripción.
- Características técnicas.
- Condición del equipo.
- Opciones de garantía.
- Cantidad, cuando aplique.
- Botón de carrito.
- Botón de WhatsApp.
- Botón de Telegram.
- Productos relacionados.
- Información de retiro, entrega y medios de pago.

### Páginas informativas

Rutas sugeridas:

```text
/nosotros
/contacto
/preguntas-frecuentes
/garantias
/envios-y-retiros
/terminos-y-condiciones
/privacidad
```

## 4.2 Carrito

El carrito debe existir desde la primera versión.

Funciones:

- Agregar un producto.
- Eliminar un producto.
- Cambiar cantidad cuando el producto admita múltiples unidades.
- Mostrar subtotal.
- Aplicar promociones futuras.
- Guardarse en el navegador.
- Recuperarse al volver a visitar el sitio.
- Validar nuevamente precio y disponibilidad antes de enviarse.
- Vaciarse después de crear un pedido.

### Estrategia inicial

El carrito puede mantenerse en `localStorage` mientras el cliente navega. Al enviar la solicitud, el backend recibe solamente identificadores y cantidades.

El servidor vuelve a consultar:

- Precio vigente.
- Estado del producto.
- Reserva activa.
- Cantidad permitida.
- Publicación activa.

Nunca se debe confiar en el precio enviado por el navegador.

### Productos unitarios y productos con cantidad

Celulares y computadoras normalmente son unidades individualizadas. No se permitirá una cantidad superior a uno por registro.

Productos generales pueden admitir varias unidades solamente si el modelo de inventario evoluciona para registrar stock cuantitativo. Actualmente cada registro representa un producto/ítem, por lo que inicialmente se tratarán también como unidades individuales.

## 4.3 WhatsApp

Habrá dos niveles de integración.

### Contacto rápido

Desde una tarjeta o detalle:

```text
Hola, quiero consultar por:
iPhone 15 Pro 256 GB — Bs 8.500
https://dominio.com/productos/iphone-15-pro-256gb
```

### Enviar carrito

El sistema registrará primero el pedido y generará un código. Después abrirá WhatsApp con un mensaje similar:

```text
Hola, quiero confirmar el pedido AB-W000123.

1 × iPhone 15 Pro 256 GB — Bs 8.500
1 × Funda MagSafe — Bs 250

Total referencial: Bs 8.750
Pedido: https://dominio.com/pedidos/AB-W000123/estado
```

Registrar el pedido antes de abrir WhatsApp evita perder toda la información si el cliente no completa el mensaje.

## 4.4 Telegram

Se contemplan dos alternativas:

### Compartir con la tienda

Abrir Telegram con el resumen del pedido y enlace de seguimiento.

### Bot de Telegram

En una etapa posterior, un bot puede:

- Recibir nuevos pedidos.
- Notificar a administradores o vendedores.
- Permitir tomar un pedido.
- Marcarlo como contactado.
- Enviar cambios de estado al cliente.

La primera versión puede utilizar enlace de compartir. El bot debe tratarse como una integración posterior para no bloquear el lanzamiento.

## 4.5 Pedido público

El carrito enviado generará un pedido real en la base de datos.

Datos:

- Código.
- Nombre del cliente.
- Teléfono.
- Correo opcional.
- Canal preferido.
- Ciudad o zona opcional.
- Notas.
- Subtotal.
- Descuento.
- Total.
- Estado.
- Fecha de vencimiento de la retención.
- Usuario/vendedor asignado.
- Reserva o venta resultante.

Estados sugeridos:

- `nuevo`
- `contactado`
- `confirmado`
- `reservado`
- `convertido`
- `cancelado`
- `vencido`

El pedido tendrá ítems con snapshot, de forma similar a `ventas_items` y `reserva_items`.

## 4.6 Seguimiento del pedido

El cliente recibirá un enlace sin necesidad de crear cuenta:

```text
/pedidos/{codigo}/estado?token={token_publico}
```

Mostrará solamente:

- Código.
- Fecha.
- Productos.
- Total.
- Estado.
- Instrucciones.
- Botón para contactar.

El token público debe ser aleatorio, no derivado del ID.

## 4.7 Administración del catálogo

Se agregará al panel administrativo un módulo `Catálogo público`.

Funciones:

- Ver productos publicados y no publicados.
- Filtrar por categoría, estado y disponibilidad.
- Crear o editar contenido comercial.
- Subir y ordenar fotografías.
- Elegir imagen principal.
- Publicar u ocultar.
- Marcar como destacado.
- Programar publicación, opcionalmente.
- Definir precio promocional.
- Configurar etiqueta: nuevo, oferta, recomendado o reacondicionado.
- Vista previa antes de publicar.

También puede aparecer una sección resumida dentro del formulario actual de cada producto:

```text
Catálogo público

[ ] Publicar
Título público
Descripción corta
Descripción completa
Categoría
Condición
Garantía
Precio promocional
[ ] Destacado
Fotografías
```

Para evitar duplicar código React, se construirá un componente compartido.

## 4.8 Gestión de pedidos

Nueva pantalla administrativa:

```text
/admin/pedidos-publicos
```

Funciones:

- Bandeja de pedidos.
- Filtros por estado, canal y fecha.
- Notificación de pedido nuevo.
- Datos de contacto.
- Detalle de productos.
- Asignación a vendedor.
- Acciones para WhatsApp o Telegram.
- Convertir a reserva.
- Convertir a venta.
- Cancelar.
- Liberar productos.
- Historial de cambios.

Los vendedores podrán ver pedidos asignados o una bandeja definida por reglas del negocio.

## 4.9 Cotizador en tiempo real

El cotizador será una función principal desde la primera versión, no una posibilidad futura.

Podrá iniciarse desde:

- Una tarjeta de producto.
- El detalle de producto.
- El carrito.
- La opción `Cotizador` del encabezado.
- Una cotización anterior dentro de `Mi cuenta`.

### Flujo

```text
Producto
→ agregar al carrito/cotizador
→ editar productos y cantidades
→ cálculo instantáneo
→ validar precio y disponibilidad en el servidor
→ completar datos del cliente
→ seleccionar pago, retiro o entrega
→ generar cotización
→ generar PDF
→ guardar en el CRM
→ compartir por WhatsApp, Telegram o correo
→ convertir posteriormente en reserva o venta
```

### Funciones del cotizador

- Agregar y retirar productos.
- Modificar cantidades cuando el inventario lo permita.
- Mostrar subtotal, descuentos y total en tiempo real.
- Mostrar precios promocionales vigentes.
- Aplicar únicamente descuentos autorizados.
- Identificar si el descuento fue público, promocional o concedido por un usuario interno.
- Seleccionar forma de pago.
- Seleccionar retiro en tienda o entrega.
- Registrar dirección o zona cuando corresponda.
- Agregar observaciones del cliente.
- Definir vigencia de la propuesta.
- Generar un código único.
- Guardar los precios y características mediante snapshot.
- Revalidar precio, publicación y disponibilidad antes de confirmar.

El cálculo React es informativo e inmediato. El cálculo definitivo siempre será realizado nuevamente por Laravel.

### Descuentos

Un visitante no podrá escribir un descuento libremente.

Los descuentos podrán proceder de:

- Precio promocional de la publicación.
- Cupón vigente, en una fase posterior.
- Descuento autorizado por administrador o vendedor.
- Regla comercial configurada.

El backend registrará origen, monto y usuario responsable.

### Integración con cotizaciones actuales

Se reutilizarán:

- Modelo `Cotizacion`.
- Generación de PDF existente.
- Plantilla de correo.
- Envío y reenvío por correo.
- Flujo de WhatsApp.
- Asociación con clientes.
- Campo JSON de ítems.

Será necesario ampliar las cotizaciones con campos como:

- Canal de origen: interno o web.
- Código público.
- Token público.
- Estado.
- Vigencia.
- Método de pago solicitado.
- Modalidad de entrega.
- Dirección o zona.
- Publicación y pedido de origen.
- Vendedor asignado.

## 4.10 PDF automático de cotización

Después de validar y guardar la cotización, Laravel generará automáticamente el PDF.

### Contenido

- Logo e identidad de Apple Boss.
- Código de cotización.
- Fecha de emisión.
- Fecha de vencimiento o vigencia.
- Datos del cliente.
- Productos.
- Fotografía principal de cada producto, cuando esté disponible.
- Características relevantes.
- Cantidad.
- Precio unitario.
- Descuento.
- Subtotal y total.
- Método de pago.
- Modalidad de retiro o entrega.
- Garantía.
- Condiciones comerciales.
- Observaciones.
- Datos de contacto.
- Código QR.
- Enlace a la versión digital.

### Acciones

- Descargar PDF.
- Abrir versión digital.
- Enviar por correo.
- Compartir por WhatsApp.
- Compartir por Telegram.
- Guardar en `Mi cuenta`.
- Enviar al administrador.
- Convertir en pedido.
- Repetir cotización.

### Reutilización técnica

No se construirá un segundo motor documental. Se ampliarán `CotizacionController`, las clases de correo y `resources/views/pdf/cotizacion.blade.php`.

El QR apuntará a una URL pública firmada o protegida por token. La cotización digital no expondrá IDs internos ni información privada.

## 4.11 Área privada de clientes

El ecommerce tendrá un portal básico de clientes incluido en el MVP.

### Rutas

```text
/mi-cuenta
/mi-cuenta/cotizaciones
/mi-cuenta/cotizaciones/{codigo}
/mi-cuenta/pedidos
/mi-cuenta/pedidos/{codigo}
/mi-cuenta/reservas
/mi-cuenta/favoritos
/mi-cuenta/perfil
/mi-cuenta/soporte
```

### Funciones del cliente

- Registrarse.
- Verificar su correo o teléfono.
- Iniciar y cerrar sesión.
- Recuperar acceso.
- Ver cotizaciones.
- Descargar PDFs.
- Repetir una cotización.
- Consultar pedidos.
- Revisar reservas.
- Guardar y eliminar favoritos.
- Actualizar sus datos.
- Administrar direcciones.
- Elegir canal preferido.
- Contactar soporte.

Comprar o solicitar una cotización como invitado seguirá siendo posible. Después se podrá vincular la operación a una cuenta mediante correo, teléfono y verificación.

### Administración de cuentas

El administrador podrá:

- Crear y editar clientes.
- Crear o vincular una cuenta.
- Activar, bloquear o reactivar acceso.
- Iniciar restablecimiento de contraseña.
- Consultar actividad.
- Ver cotizaciones, pedidos y reservas.
- Asignar vendedor.
- Convertir cotización o pedido en reserva/venta.
- Añadir notas internas no visibles para el cliente.
- Unificar registros duplicados mediante un proceso controlado.

### Estrategia de autenticación

Actualmente `users.rol` admite solamente `admin` y `vendedor`. Para no mezclar permisos internos con cuentas públicas, se recomienda:

```text
clientes
└── cliente_cuentas
    ├── cliente_id
    ├── correo
    ├── password
    ├── estado
    ├── email_verified_at
    ├── telefono_verified_at
    └── ultimo_acceso
```

Laravel utilizará un guard/proveedor separado para clientes. Esto reduce el riesgo de que una cuenta pública acceda accidentalmente a rutas administrativas.

## 4.12 Header profesional y administrable

El encabezado será un componente comercial, no solamente una barra de navegación fija.

### Escritorio

- Barra informativa/promocional.
- Logo Apple Boss.
- Buscador principal.
- Categorías.
- Ofertas.
- Productos.
- Cotizador.
- WhatsApp.
- Telegram.
- Mi cuenta.
- Carrito con contador.

### Móvil

- Menú.
- Logo.
- Buscar.
- Mi cuenta.
- Carrito.
- Acceso rápido a categorías.

### Configuración administrativa

El administrador podrá cambiar sin editar código:

- Logo.
- Favicon.
- Menús.
- Orden de enlaces.
- Barra promocional.
- Categorías visibles.
- Número y texto inicial de WhatsApp.
- Usuario, enlace o canal de Telegram.
- Horarios.
- Dirección.
- Mensajes de envío, retiro y garantía.
- Visibilidad de accesos.

## 4.13 Footer empresarial y administrable

El footer se organizará en columnas configurables:

- Productos.
- Ayuda.
- Empresa.
- Soporte.
- Información legal.
- Contacto.

Contenido:

- Categorías.
- Preguntas frecuentes.
- Nosotros.
- Garantía.
- Envíos y retiros.
- Términos y condiciones.
- Política de privacidad.
- WhatsApp y Telegram.
- Dirección y horarios.
- Redes sociales.
- Métodos de pago.
- Acceso del personal.

El administrador podrá editar textos, enlaces, orden, redes y visibilidad desde el CRM.

## 4.14 Identidad visual Apple Boss

La dirección visual combinará:

```text
Claridad y estética premium de una tienda Apple
+
eficiencia comercial y facilidad de búsqueda de Amazon
+
identidad propia de Apple Boss
```

No se copiarán interfaces, marcas ni componentes exactos de Apple o Amazon.

### Principios visuales

- Diseño premium y minimalista.
- Espacio visual generoso.
- Fotografías grandes.
- Tipografía limpia.
- Fondos blancos, negros y grises.
- Rojo Apple Boss como acento, no como relleno dominante.
- Tarjetas elegantes.
- Jerarquía tipográfica clara.
- Animaciones suaves.
- Transiciones discretas.
- Estados interactivos evidentes.
- Consistencia entre escritorio y móvil.

### Principios comerciales

- Buscador siempre accesible.
- Precio y disponibilidad fáciles de identificar.
- CTA principal inequívoco.
- Carrito visible.
- Categorías comprensibles.
- Pocos pasos hasta cotizar o contactar.
- Confianza mediante garantía, ubicación, medios de pago y datos reales.

## 5. Modelo de datos propuesto

## 5.1 Publicaciones

```text
catalogo_publicaciones
├── id
├── publicable_type
├── publicable_id
├── categoria_id
├── titulo
├── slug
├── resumen
├── descripcion
├── condicion
├── garantia
├── precio_promocional
├── etiqueta
├── publicado
├── destacado
├── orden
├── publicado_desde
├── publicado_hasta
├── created_at
└── updated_at
```

`publicable_type + publicable_id` crea una relación polimórfica con Celular, Computadora, ProductoGeneral o ProductoApple.

Reglas:

- Una publicación por producto de inventario.
- `slug` único.
- `precio_promocional` nunca reemplaza `precio_venta` interno.
- Un producto aparece solamente si publicación y producto están disponibles.

## 5.2 Imágenes

```text
catalogo_imagenes
├── id
├── publicacion_id
├── ruta
├── ruta_miniatura
├── texto_alternativo
├── orden
├── es_principal
├── created_at
└── updated_at
```

## 5.3 Categorías

```text
catalogo_categorias
├── id
├── parent_id
├── nombre
├── slug
├── descripcion
├── imagen
├── activa
├── orden
├── created_at
└── updated_at
```

`parent_id` permite categorías jerárquicas, por ejemplo Apple → iPhone.

## 5.4 Pedidos

```text
pedidos_publicos
├── id
├── codigo
├── token_publico
├── nombre_cliente
├── telefono
├── correo
├── canal_preferido
├── ciudad
├── direccion
├── notas
├── subtotal
├── descuento
├── total
├── estado
├── vence_en
├── user_id
├── reserva_id
├── venta_id
├── created_at
└── updated_at
```

## 5.5 Ítems de pedido

```text
pedido_publico_items
├── id
├── pedido_publico_id
├── tipo
├── producto_id
├── publicacion_id
├── titulo
├── cantidad
├── precio_unitario
├── descuento
├── subtotal
├── snapshot
├── created_at
└── updated_at
```

El snapshot conserva lo que vio el cliente al enviar el pedido.

## 5.6 Historial

```text
pedido_publico_eventos
├── id
├── pedido_publico_id
├── user_id
├── evento
├── estado_anterior
├── estado_nuevo
├── metadata
├── created_at
└── updated_at
```

Esto permite auditoría sin sobrecargar la tabla de pedidos.

## 5.7 Cuentas de clientes

```text
cliente_cuentas
├── id
├── cliente_id
├── correo
├── password
├── estado
├── email_verified_at
├── telefono_verified_at
├── ultimo_acceso
├── remember_token
├── created_at
└── updated_at
```

Estados sugeridos: `pendiente`, `activa`, `bloqueada` y `desactivada`.

## 5.8 Favoritos

```text
cliente_favoritos
├── id
├── cliente_id
├── publicacion_id
├── created_at
└── updated_at
```

La combinación cliente/publicación será única.

## 5.9 Configuración pública

```text
sitio_configuraciones
├── id
├── grupo
├── clave
├── valor
├── tipo
├── es_publica
├── updated_by
├── created_at
└── updated_at
```

Permitirá administrar header, footer, contacto y textos sin guardar credenciales o secretos en la base pública.

Los secretos de API continuarán en variables de entorno.

## 5.10 Menús y páginas

```text
sitio_menus
├── id
├── ubicacion
├── parent_id
├── etiqueta
├── url
├── orden
├── activo
└── timestamps

sitio_paginas
├── id
├── titulo
├── slug
├── contenido
├── meta_title
├── meta_description
├── publicada
└── timestamps
```

Esto cubre páginas legales, ayuda, empresa y soporte.

## 6. Reglas de publicación y stock

Un producto se muestra públicamente cuando:

```text
publicacion.publicado = true
AND producto.estado = 'disponible'
AND publicación dentro de fechas configuradas
AND producto no pertenece a reserva activa
AND producto no está retenido por pedido confirmado vigente
```

### Retención temporal

No se recomienda bloquear stock apenas se agrega al carrito: un cliente podría abandonar la página y dejar productos bloqueados.

La retención comienza cuando:

- El cliente envía el pedido y verifica su teléfono, o
- Un vendedor confirma el pedido.

Para el MVP puede comenzar cuando el vendedor lo marca como `confirmado`.

Un proceso programado liberará retenciones vencidas.

### Condición de carrera

Antes de confirmar o convertir un pedido:

- Abrir transacción.
- Bloquear los registros del producto.
- Volver a validar estado.
- Verificar reservas/pedidos activos.
- Crear reserva o venta.
- Actualizar estados.
- Confirmar transacción.

Esto evita que dos personas compren la misma unidad simultáneamente.

## 7. API y controladores

## 7.1 Controladores públicos

```text
Public/HomeController
Public/CatalogoController
Public/ProductoController
Public/CarritoController
Public/PedidoController
Public/CotizadorController
Public/CotizacionDigitalController
Public/ContactoController
```

## 7.2 Controladores administrativos

```text
Admin/CatalogoPublicacionController
Admin/CatalogoImagenController
Admin/CatalogoCategoriaController
Admin/PedidoPublicoController
Admin/CotizacionWebController
Admin/ClienteCuentaController
Admin/SitioConfiguracionController
Admin/SitioMenuController
Admin/SitioPaginaController
```

## 7.3 Recursos públicos

Se crearán transformadores explícitos:

```text
PublicacionCardResource
PublicacionDetailResource
PedidoPublicoResource
CotizacionDigitalResource
ClientePortalResource
```

Estos recursos formarán una lista blanca. Nunca serializarán directamente un modelo interno completo.

## 7.4 Rutas propuestas

### Públicas

```text
GET  /
GET  /catalogo
GET  /categoria/{categoria:slug}
GET  /buscar
GET  /productos/{publicacion:slug}
POST /pedidos
GET  /pedidos/{codigo}/estado
POST /cotizador/validar
POST /cotizaciones-web
GET  /cotizaciones/{codigo}
GET  /cotizaciones/{codigo}/pdf
POST /contacto
```

El acceso digital a pedidos y cotizaciones requerirá sesión del cliente, URL firmada o token público.

### Administrador

```text
GET    /admin/catalogo
GET    /admin/catalogo/{publicacion}/edit
PUT    /admin/catalogo/{publicacion}
POST   /admin/catalogo/{publicacion}/imagenes
PATCH  /admin/catalogo/{publicacion}/publicar
DELETE /admin/catalogo/imagenes/{imagen}

GET    /admin/pedidos-publicos
GET    /admin/pedidos-publicos/{pedido}
PATCH  /admin/pedidos-publicos/{pedido}/estado
POST   /admin/pedidos-publicos/{pedido}/convertir-reserva
POST   /admin/pedidos-publicos/{pedido}/convertir-venta

GET    /admin/cotizaciones-web
GET    /admin/cotizaciones-web/{cotizacion}
PATCH  /admin/cotizaciones-web/{cotizacion}/asignar
POST   /admin/cotizaciones-web/{cotizacion}/convertir-reserva
POST   /admin/cotizaciones-web/{cotizacion}/convertir-venta

GET    /admin/clientes-cuentas
PATCH  /admin/clientes-cuentas/{cuenta}/estado

GET    /admin/sitio/configuracion
PUT    /admin/sitio/configuracion
GET    /admin/sitio/menus
GET    /admin/sitio/paginas
```

## 8. Frontend propuesto

## 8.1 Layout público

Nuevo `PublicLayout` con:

- Barra promocional.
- Encabezado.
- Logo.
- Buscador.
- Menú de categorías.
- Enlace al cotizador.
- Acceso a Mi cuenta.
- Carrito.
- Navegación móvil.
- Footer empresarial.
- WhatsApp flotante opcional.

## 8.2 Páginas

```text
Pages/Public/Home.jsx
Pages/Public/Catalogo/Index.jsx
Pages/Public/Categorias/Show.jsx
Pages/Public/Productos/Show.jsx
Pages/Public/Carrito/Index.jsx
Pages/Public/Pedidos/Create.jsx
Pages/Public/Pedidos/Gracias.jsx
Pages/Public/Pedidos/Estado.jsx
Pages/Public/Cotizador/Index.jsx
Pages/Public/Cotizaciones/Show.jsx
Pages/Public/Cuenta/Dashboard.jsx
Pages/Public/Cuenta/Cotizaciones.jsx
Pages/Public/Cuenta/Pedidos.jsx
Pages/Public/Cuenta/Reservas.jsx
Pages/Public/Cuenta/Favoritos.jsx
Pages/Public/Cuenta/Perfil.jsx
Pages/Public/Cuenta/Soporte.jsx
Pages/Public/Contenido/Contacto.jsx
Pages/Public/Contenido/Pagina.jsx
```

## 8.3 Componentes

```text
Components/Public/Header.jsx
Components/Public/SearchBar.jsx
Components/Public/CategoryMenu.jsx
Components/Public/ProductCard.jsx
Components/Public/ProductGallery.jsx
Components/Public/ProductFilters.jsx
Components/Public/ProductPrice.jsx
Components/Public/CartDrawer.jsx
Components/Public/CartItem.jsx
Components/Public/QuoteSummary.jsx
Components/Public/QuoteCustomerForm.jsx
Components/Public/DeliveryMethod.jsx
Components/Public/WhatsAppButton.jsx
Components/Public/TelegramButton.jsx
Components/Public/RelatedProducts.jsx
Components/Public/AvailabilityBadge.jsx
Components/Public/BusinessFooter.jsx
Components/Public/AccountMenu.jsx
```

## 8.4 Estado del carrito

Se puede utilizar Context + reducer propio, sin agregar inicialmente una dependencia de estado global.

Responsabilidades:

- Inicializar desde `localStorage`.
- Agregar/eliminar productos.
- Mantener cantidades válidas.
- Calcular total visual.
- Sincronizar cambios.
- Limpiar carrito.
- Enviar IDs al backend para validación definitiva.

## 9. Fotografías

### Primera etapa

Almacenamiento:

```text
storage/app/public/catalogo/{publicacion_id}/
```

Requisitos:

- JPEG, PNG o WebP.
- Tamaño máximo configurable, sugerido 4 MB.
- Máximo sugerido de 8 imágenes.
- Conversión a WebP.
- Imagen grande y miniatura.
- Eliminación de metadatos EXIF.
- Orden manual.
- Texto alternativo.
- Una sola imagen principal.

### Evolución

Cuando aumente el tráfico:

- S3 o almacenamiento compatible.
- CDN.
- URLs versionadas.
- Carga diferida.
- `srcset` responsive.

## 10. SEO, rendimiento y accesibilidad

### SEO

- Título y descripción por producto.
- URL mediante slug.
- Canonical.
- Open Graph para WhatsApp, Facebook y Telegram.
- Datos estructurados `Product`, `Offer` y `BreadcrumbList`.
- Sitemap.
- `robots.txt`.
- Páginas de categorías indexables.

### Rendimiento

- WebP y miniaturas.
- Lazy loading.
- Paginación del servidor.
- Caché de categorías y destacados.
- Evitar enviar inventarios completos al navegador.
- Consultas con índices.
- Compilación de producción Vite.

### Accesibilidad

- Navegación por teclado.
- Etiquetas accesibles.
- Contraste suficiente.
- Texto alternativo de imágenes.
- Estados de foco visibles.
- Mensajes de error comprensibles.
- Botones con área táctil adecuada.

## 11. Seguridad y privacidad

- Lista blanca de atributos públicos.
- Validación de todos los pedidos en servidor.
- Limitación de solicitudes.
- Protección CSRF.
- Honeypot o CAPTCHA adaptativo en formularios.
- Token aleatorio de seguimiento.
- No revelar si un IMEI o serie existe.
- No exponer IDs secuenciales en URLs sensibles.
- Registro de cambios de pedidos.
- Política de privacidad.
- Consentimiento para contacto.
- Sanitización de descripción si admite contenido enriquecido.
- Eliminación segura de imágenes reemplazadas.

La Content Security Policy actual deberá ampliarse solamente para los dominios realmente utilizados por imágenes, analítica, pagos o mensajería.

## 12. Integración con módulos actuales

| Módulo actual | Integración pública |
|---|---|
| Celulares | Publicación, fotografía, detalle y pedido |
| Computadoras | Publicación, especificaciones y pedido |
| Productos generales | Publicación y futuro control cuantitativo |
| Productos Apple | Publicación y pedido |
| Reservas | Conversión de pedido confirmado |
| Ventas | Conversión final y actualización de stock |
| Clientes | Creación o asociación desde pedido |
| Cotizaciones | Cotizador web, PDF, correo, mensajería y conversión |
| Notificaciones | Alerta por pedido nuevo o vencido |
| Dashboard | Métricas de pedidos y conversión |
| Reportes | Ventas originadas en canal web |
| n8n | Seguimientos y reportes automáticos |
| CRM público | Header, footer, páginas y cuentas de clientes |

## 13. Métricas recomendadas

La tienda debería registrar eventos sin almacenar información excesiva:

- Vista de producto.
- Búsqueda.
- Producto agregado al carrito.
- Carrito enviado.
- Cotización iniciada.
- Cotización generada.
- PDF descargado o compartido.
- Canal elegido.
- Pedido confirmado.
- Pedido convertido en reserva.
- Pedido convertido en venta.
- Pedido cancelado.

Indicadores:

- Productos más vistos.
- Productos más agregados.
- Conversión visita → carrito.
- Conversión carrito → pedido.
- Conversión carrito → cotización.
- Conversión cotización → pedido, reserva o venta.
- Conversión pedido → venta.
- Ventas originadas en web.
- Tiempo promedio de respuesta.
- Abandono de carrito.
- Canal preferido.

## 14. Fases de implementación

### Fase 0 — Preparación

- Corregir inconsistencias de rutas y migraciones relevantes.
- Definir categorías públicas.
- Definir número de WhatsApp y usuario/canal de Telegram.
- Definir condiciones, garantía, entrega y retiro.
- Definir identidad visual y contenido del header/footer.
- Definir vigencia estándar de cotizaciones.
- Preparar fotografías iniciales.
- Decidir dominio público.

Resultado: reglas comerciales claras antes de programar.

### Fase 1 — Base del catálogo

- Migraciones de publicaciones, categorías e imágenes.
- Modelos y relaciones.
- Recursos públicos seguros.
- CRUD administrativo de contenido.
- Configuración administrable de header, footer y páginas.
- Carga y orden de fotografías.
- Publicar/ocultar/destacar.
- Reglas de disponibilidad.

Resultado: el administrador puede preparar el catálogo.

### Fase 2 — Sitio público

- Nuevo `PublicLayout`.
- Header profesional.
- Footer empresarial.
- Inicio.
- Catálogo.
- Categorías.
- Búsqueda.
- Filtros.
- Detalle.
- Productos relacionados.
- SEO básico.
- Responsive.
- Identidad visual premium Apple Boss.

Resultado: clientes pueden descubrir productos.

### Fase 3 — Carrito, cotizador y contacto

- Carrito persistente.
- Revalidación del servidor.
- Formulario de cliente.
- Cotizador con cálculo en tiempo real.
- Generación y almacenamiento de cotización.
- PDF automático con QR.
- Descarga, correo y uso compartido.
- Registro de pedido.
- WhatsApp.
- Telegram.
- Página de agradecimiento.
- Seguimiento por token.

Resultado: el tráfico público se convierte en pedidos registrables.

### Fase 4 — Operación interna y portal de clientes

- Bandeja administrativa.
- Asignación a vendedor.
- Estados e historial.
- Notificaciones.
- Conversión a reserva.
- Conversión a venta.
- Liberación de retenciones.
- Métricas de canal web.
- Registro e inicio de sesión de clientes.
- Panel de cotizaciones, pedidos y reservas.
- Descargas y favoritos.
- Administración de cuentas desde el CRM.

Resultado: el ecommerce queda integrado al trabajo diario.

### Fase 5 — Pagos y crecimiento

- Pasarela de pago definida para Bolivia.
- Comprobantes.
- Entregas y retiros.
- Bot de Telegram.
- Automatizaciones de seguimiento.
- Recuperación de carrito.
- Promociones y cupones.
- Reseñas verificadas.

Resultado: ecommerce transaccional completo.

## 15. MVP recomendado

El MVP debe incluir:

- Inicio comercial.
- Catálogo.
- Categorías.
- Búsqueda y filtros esenciales.
- Detalle con galería.
- Publicación administrable.
- Carrito.
- Cotizador en tiempo real.
- Cotización guardada en el CRM.
- PDF automático.
- Pedido público.
- WhatsApp.
- Telegram por enlace.
- Bandeja interna.
- Gestión de cotizaciones web.
- Conversión a reserva.
- Área básica de clientes.
- Header profesional administrable.
- Footer empresarial administrable.
- Identidad visual premium Apple Boss.
- Ocultamiento automático de productos no disponibles.
- SEO básico.
- Diseño móvil.

Debe dejar para una segunda versión:

- Pago en línea.
- Envío automatizado.
- Cupones complejos.
- Reseñas.
- Recomendaciones mediante IA.
- Bot completo de Telegram.

Esta delimitación no elimina esas funciones; evita que retrasen la primera versión comercial.

## 16. Criterios de aceptación del MVP

El MVP estará listo cuando:

1. Un administrador pueda publicar un producto existente sin duplicarlo.
2. El producto muestre fotografía, descripción, precio y atributos autorizados.
3. Un producto vendido, reservado o no publicado no aparezca como disponible.
4. Un visitante pueda buscar, filtrar y abrir el detalle.
5. Un visitante pueda agregar varios productos al carrito.
6. El servidor vuelva a validar precio y disponibilidad al enviar.
7. El carrito calcule subtotal, descuento autorizado y total en tiempo real.
8. Una cotización se guarde con código, vigencia y snapshot.
9. El sistema genere un PDF con identidad, productos, total, condiciones, QR y enlace.
10. La cotización pueda descargarse y compartirse por correo, WhatsApp o Telegram.
11. El pedido se guarde antes de abrir WhatsApp o Telegram.
12. El administrador reciba una notificación de pedido o cotización nueva.
13. El pedido o cotización pueda convertirse en reserva sin volver a cargar productos.
14. El cliente pueda registrarse y consultar cotizaciones, pedidos y reservas.
15. El cliente pueda consultar operaciones mediante sesión o enlace seguro.
16. El administrador pueda modificar contenido del header y footer sin editar código.
17. La tienda respete la identidad premium definida en móvil y escritorio.
18. Ninguna respuesta pública exponga costo, IMEI, serie, ganancia o datos privados.

## 17. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Dos clientes solicitan la misma unidad | Revalidación, transacción y retención controlada |
| Precio manipulado desde navegador | Recalcular todo en backend |
| Producto vendido sigue visible | Condición pública vinculada al estado real |
| Carritos abandonados bloquean stock | No retener al agregar; vencimiento automático |
| Fotografías vuelven lento el sitio | WebP, miniaturas, lazy loading y CDN futuro |
| Exposición de datos internos | Resources con lista blanca y pruebas de seguridad |
| WhatsApp se abre pero no se envía | Guardar pedido antes de redirigir |
| El PDF no coincide con el total visible | Un único servicio backend calcula y genera el snapshot |
| Cuenta pública obtiene permisos internos | Guard y proveedor separados para clientes |
| Contenido administrable rompe el diseño | Campos estructurados, límites y vista previa |
| Aumento de complejidad interna | Componentes y servicios compartidos |
| Reportes pierden trazabilidad | Guardar canal de origen y snapshots |

## 18. Decisiones que el negocio debe confirmar

Antes de implementar deben definirse:

- Número oficial de WhatsApp.
- Usuario, canal o bot de Telegram.
- Moneda y formato final de precios.
- Si los precios públicos incluyen promociones.
- Política de garantía.
- Ciudades y zonas atendidas.
- Retiro en tienda o entrega.
- Duración de una retención.
- Vigencia predeterminada de una cotización.
- Quién autoriza descuentos y hasta qué porcentaje.
- Quién recibe y asigna pedidos.
- Si un pedido crea reserva automática o requiere confirmación.
- Medios de pago iniciales.
- Dominio y ambiente de producción.
- Fotografías y textos iniciales.
- Estructura final del header y footer.
- Política de registro, verificación y bloqueo de clientes.

## 19. Arquitectura de integración recomendada

La solución correcta no es crear otra tienda separada ni copiar productos a una base distinta. Debemos incorporar un módulo público dentro del Laravel/Inertia actual:

```text
Inventario actual
       ↓
Capa editorial pública
       ↓
Catálogo, carrito y cotizador
       ↓
Cotización PDF o pedido registrado
       ↓
WhatsApp / Telegram
       ↓
Reserva o venta existente
       ↓
Reportes y dashboards actuales
```

Este diseño mantiene una sola fuente de stock, protege la información interna y permite lanzar una experiencia comercial completa sin perder los procesos que Apple Boss ya utiliza.

La implementación recomendada comienza con catálogo, carrito, cotizador, PDF, portal básico de clientes y pedidos por mensajería. Después de comprobar el uso real, se incorporan pagos, logística, fidelización y automatizaciones avanzadas.

## 20. Stock unitario y cuantitativo

El sistema debe distinguir dos formas de inventario:

```text
tipo_stock
├── unitario
└── cuantitativo
```

### Stock unitario

Se utiliza cuando cada registro representa una unidad física identificable.

Ejemplos:

- iPhone.
- MacBook.
- iPad usado.
- Equipo con IMEI o número de serie.

Reglas:

- Cantidad máxima uno por registro.
- No admite sobreventa.
- Una reserva o retención bloquea la unidad completa.
- Al venderse cambia a `vendido`.

### Stock cuantitativo

Se utiliza para productos intercambiables que comparten código.

Ejemplos:

- Cargadores.
- Cables.
- Fundas.
- Vidrios templados.
- Accesorios nuevos.

Campos requeridos:

```text
tipo_stock
stock_actual
stock_reservado
stock_minimo
permite_sobreventa
```

Disponibilidad:

```text
stock_disponible = stock_actual - stock_reservado
```

Reglas:

- El carrito no puede confirmar más unidades que el stock disponible.
- Una cotización no bloquea stock por sí sola.
- Un pedido confirmado o reserva incrementa `stock_reservado`.
- Una venta descuenta stock actual y libera lo reservado.
- Una cancelación o vencimiento libera stock reservado.
- Se generan alertas cuando el disponible alcanza `stock_minimo`.
- La sobreventa estará desactivada por defecto.

La incorporación de stock cuantitativo requiere migrar progresivamente los productos generales; no debe alterar el tratamiento unitario de equipos individualizados.

## 21. Diferencia entre carrito, cotización, pedido, reserva y venta

| Concepto | Propósito | Persiste | Bloquea stock | Tiene vigencia | Efecto financiero |
|---|---|---:|---:|---:|---:|
| Carrito | Selección temporal | Navegador | No | No | No |
| Cotización | Oferta comercial documentada | Sí | No | Sí | No |
| Pedido | Solicitud formal del cliente | Sí | Según estado | Puede tener | No |
| Reserva | Compromiso con anticipo o confirmación | Sí | Sí | Sí | Registra anticipo |
| Venta | Operación cerrada | Sí | Descuenta | No | Sí |

Reglas:

- Un carrito puede generar cotización o pedido.
- Una cotización aceptada puede generar pedido o reserva.
- Un pedido confirmado puede generar reserva.
- Una reserva puede convertirse en venta.
- La venta es el único estado que consolida el ingreso comercial definitivo.
- Cada conversión conserva referencia al documento de origen.
- No se reutilizará un mismo campo de estado para conceptos diferentes.

## 22. Máquinas de estado

Las transiciones se implementarán mediante servicios de dominio. No se aceptarán cambios arbitrarios de texto desde el frontend.

### Cotización

```text
borrador
   ↓
generada
   ↓
enviada
   ├──→ aceptada ──→ convertida
   ├──→ rechazada
   └──→ vencida
```

### Pedido

```text
nuevo
├──→ contactado
│      ├──→ confirmado
│      │      ├──→ reservado ──→ vendido
│      │      ├──→ vencido
│      │      └──→ cancelado
│      └──→ cancelado
└──→ cancelado
```

### Pago

```text
pendiente
├──→ en_revision
│      ├──→ confirmado
│      └──→ rechazado
├──→ parcial
└──→ cancelado

confirmado ──→ reembolsado
```

### Reglas de transición

Cada transición definirá:

- Roles autorizados.
- Validaciones previas.
- Si requiere confirmación.
- Si puede revertirse.
- Efecto sobre stock.
- Notificaciones.
- Evento de auditoría.
- Documento resultante.

No se borrarán operaciones cerradas para “volver atrás”; se utilizarán cancelaciones, ajustes o reembolsos auditables.

## 23. Política de precios, impuestos, moneda y redondeo

### Tipos de precio

- Precio normal.
- Precio anterior de referencia.
- Precio promocional.
- Descuento porcentual.
- Descuento fijo.
- Precio condicionado por método de pago.
- Precio en efectivo.
- Precio mediante QR.
- Precio de tarjeta en tienda.

### Reglas

- `precio_venta` continúa siendo el precio operativo base.
- Las promociones tienen fecha inicial y final.
- El precio anterior debe corresponder a un valor real e históricamente registrado.
- El administrador define límites de descuento por rol.
- Los vendedores no pueden superar su límite sin autorización.
- El servidor elige el precio vigente.
- Una cotización conserva su precio mediante snapshot hasta vencer.
- Un cambio posterior no modifica cotizaciones generadas.
- Al aceptar una cotización vencida se recalcula y requiere aprobación del cliente.
- El PDF muestra claramente precio, descuento, método y total.

### Moneda

Configuración inicial:

- Moneda: boliviano.
- Código: `BOB`.
- Símbolo comercial: `Bs`.
- Formato sugerido: `Bs 8.500,00`, sujeto a definición comercial.
- Decimales: dos en base de datos.

Se definirá:

- Regla de redondeo.
- Si los precios incluyen impuestos.
- Etiqueta legal correspondiente.

Preparación futura para USD:

```text
monedas
tipos_cambio
├── moneda_origen
├── moneda_destino
├── valor
├── vigente_desde
├── vigente_hasta
└── registrado_por
```

Cada documento guarda moneda y tipo de cambio aplicado.

### Historial de precio público

```text
catalogo_precio_historial
├── publicacion_id
├── precio_anterior
├── precio_nuevo
├── motivo
├── user_id
└── created_at
```

## 24. Entregas y retiros

Modalidades:

```text
retiro_tienda
entrega_local
envio_nacional
```

Configuración:

- Ciudades.
- Zonas.
- Costo.
- Umbral de entrega gratuita, si existe.
- Tiempo estimado.
- Horarios.
- Dirección de retiro.
- Productos restringidos.
- Transportista.
- Responsable.

Datos operativos:

```text
entregas
├── pedido_id
├── modalidad
├── ciudad
├── zona
├── direccion
├── referencia
├── costo
├── estado
├── responsable
├── transportista
├── codigo_seguimiento
├── fecha_programada
└── fecha_entregada
```

Estados sugeridos:

- Pendiente.
- Programada.
- Preparando.
- Lista para retirar.
- En camino.
- Entregada.
- Fallida.
- Cancelada.

El cliente verá el estado desde `Mi cuenta`.

## 25. Pagos y comprobantes

La arquitectura se preparará desde el inicio aunque la conciliación en línea se implemente después.

```text
pagos
├── id
├── pedido_id
├── reserva_id
├── venta_id
├── metodo
├── monto
├── moneda
├── referencia
├── estado
├── comprobante
├── motivo_rechazo
├── confirmado_por
├── fecha_confirmacion
└── timestamps
```

Métodos iniciales:

- Efectivo.
- QR.
- Transferencia.
- Tarjeta en tienda.
- Anticipo.
- Pago parcial.

Estados:

- Pendiente.
- En revisión.
- Confirmado.
- Rechazado.
- Parcial.
- Reembolsado.

### Comprobante del cliente

- JPEG, PNG o PDF.
- Tamaño y tipos validados.
- Almacenamiento privado.
- Vista previa autorizada.
- Estado de revisión.
- Rechazo con motivo.
- Confirmación administrativa.
- Registro del usuario verificador.
- Escaneo de archivos si la infraestructura lo permite.
- Nunca ejecutar ni servir archivos como contenido activo.

## 26. Garantías, cambios, devoluciones y reclamos

La garantía será información comercial y una entidad vinculada a la venta.

```text
garantias
├── venta_item_id
├── numero
├── tipo
├── duracion
├── inicia_en
├── vence_en
├── condiciones
├── exclusiones
└── estado
```

Reclamos:

```text
reclamos
├── cliente_id
├── garantia_id
├── tipo
├── descripcion
├── estado
├── evaluacion_tecnica
├── resolucion
├── responsable_id
└── timestamps
```

Resoluciones:

- Reparación.
- Cambio.
- Nota de crédito, si aplica.
- Reembolso, si aplica.
- Rechazo fundamentado.

Páginas:

```text
/garantias
/cambios-y-devoluciones
/reclamos
/mi-cuenta/garantias
/mi-cuenta/reclamos
```

## 27. Soporte posventa

El portal permitirá:

- Crear ticket.
- Elegir pedido o producto comprado.
- Definir motivo.
- Adjuntar fotografías.
- Consultar estado.
- Recibir respuestas.
- Cerrar o reabrir el caso según política.

El equipo interno administrará:

- Prioridad.
- Responsable.
- Categoría.
- SLA objetivo.
- Historial.
- Notas internas.
- Respuestas visibles.
- Archivos.
- Métricas de atención.

Estados: `nuevo`, `asignado`, `en_proceso`, `esperando_cliente`, `resuelto` y `cerrado`.

## 28. Notificaciones transaccionales

### Cliente

- Bienvenida.
- Verificación de cuenta.
- Recuperación de contraseña.
- Cotización generada.
- Cotización enviada.
- Cotización próxima a vencer.
- Pedido recibido.
- Pedido confirmado.
- Reserva creada.
- Reserva próxima a vencer.
- Pago aprobado o rechazado.
- Pedido listo para retirar.
- Pedido enviado.
- Venta completada.
- Garantía registrada.
- Cambio de estado de soporte.

### Equipo interno

- Nuevo pedido.
- Nueva cotización.
- Nuevo comprobante.
- Pedido sin atender.
- Reserva próxima a vencer.
- Producto con stock mínimo.
- Publicación incompleta.
- Error de generación de PDF.
- Error de correo.
- Fallo de automatización.
- Incidente técnico.

### Canales

- Panel.
- Correo.
- WhatsApp.
- Telegram.
- n8n.

Cada evento definirá destinatario, canal, prioridad, reintentos y condición de envío. Las plantillas serán personalizadas con Apple Boss y, cuando sea seguro, administrables desde el CRM.

## 29. CMS y confianza empresarial

### Contenido administrable

- Página de inicio.
- Banners.
- Secciones.
- Beneficios.
- Testimonios.
- Preguntas frecuentes.
- Preguntas y respuestas de productos.
- Sucursales.
- Medios de pago.
- Políticas.
- Redes.
- Header.
- Footer.
- SEO por página.

Tablas sugeridas:

```text
sitio_secciones
sitio_banners
sitio_testimonios
sitio_preguntas
sitio_sucursales
producto_preguntas
```

### Elementos de confianza

- Razón comercial.
- Responsable comercial.
- Dirección física.
- Mapa.
- Horarios.
- Teléfonos verificados.
- Fotografías reales.
- Redes oficiales.
- Métodos de pago visibles.
- Sellos propios de garantía y compra segura.
- SSL válido.
- Testimonios administrables y, cuando aplique, verificados.
- Políticas de cambio, devolución y privacidad.
- Formulario de contacto con código y seguimiento.

No se mostrarán certificaciones o sellos de terceros que Apple Boss no posea realmente.

## 30. SEO técnico avanzado

### Indexación

- Metadatos administrables para inicio, categorías y páginas.
- Canonical para productos, filtros y paginación.
- `noindex` para carrito, cuenta, checkout, pedidos, soporte y cotizaciones privadas.
- Control de combinaciones de filtros para evitar páginas duplicadas.
- `hreflang` solamente cuando existan versiones reales en otros idiomas.

### URLs

- Slugs estables.
- Redirección 301 al cambiar un slug.
- Historial de slugs.
- No eliminar inmediatamente la URL de un producto agotado.
- Producto agotado con alternativas y estado claro.
- Retirar la URL con 410 solamente cuando corresponda.
- Página 404 personalizada con buscador, categorías y productos sugeridos.

### Navegación y sitemaps

- Breadcrumbs visibles.
- Sitemap de productos.
- Sitemap de categorías.
- Sitemap de páginas.
- Índice de sitemaps.
- Actualización automática al publicar, retirar o cambiar URL.

### Datos estructurados

- `Organization`.
- `LocalBusiness`.
- `WebSite`.
- `SearchAction`.
- `BreadcrumbList`.
- `Product`.
- `Offer`.
- `FAQPage`.

### Herramientas

- Google Search Console.
- Bing Webmaster Tools.
- Envío y monitorización de sitemap.
- Seguimiento de cobertura, errores y Core Web Vitals.

## 31. Analítica y atribución

Integración:

- Google Analytics 4 o alternativa equivalente.
- Google Search Console.
- Bing Webmaster Tools.
- Gestor de consentimiento cuando corresponda.

Eventos:

- Búsqueda.
- Búsqueda sin resultados.
- Vista de categoría.
- Vista de producto.
- Agregado/eliminado del carrito.
- Inicio de cotización.
- Cotización abandonada.
- Cotización generada.
- Descarga de PDF.
- Clic en WhatsApp.
- Clic en Telegram.
- Registro.
- Pedido.
- Reserva.
- Pago.
- Venta originada en web.

Embudo:

```text
Visita
→ producto visto
→ agregado al carrito
→ cotización iniciada
→ cotización generada
→ pedido confirmado
→ reserva
→ venta
```

Se conservarán:

- Fuente.
- Medio.
- Campaña.
- Parámetros UTM.
- Página de entrada.
- Canal preferido.
- Vendedor asignado.

El dashboard mostrará conversiones por canal, campaña, producto y vendedor.

La analítica respetará la política de privacidad y no enviará IMEI, series, teléfonos, correos ni datos sensibles.

## 32. Búsqueda, favoritos y comparación

### Búsqueda avanzada

- Autocompletado.
- Corrección de errores comunes.
- Sinónimos.
- Relevancia.
- Búsquedas populares.
- Historial local o de cuenta.
- Filtros dinámicos.
- Alternativas si no hay stock.
- Registro de búsquedas sin resultados.

### Experiencia de cliente

- Favoritos.
- Comparación de equipos.
- Vistos recientemente.
- Compartir listas.
- Repetir cotización.
- Alerta de disponibilidad.
- Alerta de cambio de precio con consentimiento.

El comparador usará atributos compatibles por categoría y evitará comparar especificaciones sin equivalencia.

## 33. Operación avanzada del catálogo

Funciones:

- Duplicar publicación.
- Importar productos desde Excel o CSV.
- Importar fotografías por lote y código.
- Vista previa móvil y escritorio.
- Programar promociones.
- Publicación masiva.
- Despublicación masiva.
- Asignación masiva de categoría.
- Cambio masivo de garantía.
- Cambio masivo de precio con permisos.
- Exportar catálogo.
- Reporte de publicaciones incompletas.

Estados públicos:

- Disponible.
- Agotado.
- Reservado.
- Próximamente.
- Consultar.
- Oculto.

Controles:

- Motivo de despublicación.
- Historial de precio.
- Auditoría de publicación.
- Alertas sin foto.
- Alertas sin descripción.
- Alertas sin categoría.
- Alertas sin garantía.
- Alertas de promoción vencida.

Toda operación masiva mostrará resumen, validará antes de ejecutar y generará auditoría.

## 34. Roles, permisos y auditoría

Roles previstos:

- Superadministrador.
- Administrador.
- Supervisor.
- Vendedor.
- Atención al cliente.
- Gestor de catálogo.
- Marketing.
- Logística.
- Solo lectura.

Permisos independientes:

- Publicar productos.
- Cambiar precio.
- Autorizar descuentos.
- Ver clientes.
- Confirmar pagos.
- Convertir pedidos.
- Gestionar reservas.
- Gestionar garantías.
- Gestionar soporte.
- Editar SEO.
- Editar header/footer.
- Gestionar campañas.
- Ver reportes financieros.
- Ejecutar importaciones masivas.

La migración desde los roles actuales `admin` y `vendedor` debe ser gradual. Se recomienda una solución de roles/permisos en tablas en lugar de ampliar indefinidamente el enum.

### Auditoría

```text
audit_logs
├── user_id
├── accion
├── entidad
├── entidad_id
├── datos_anteriores
├── datos_nuevos
├── motivo
├── ip
├── user_agent
└── created_at
```

Se auditarán especialmente:

- Cambios de precio.
- Publicación/despublicación.
- Modificación de cotizaciones.
- Autorización de descuento.
- Confirmación/rechazo de pago.
- Cambio de pedido.
- Ajuste de stock.
- Conversión a reserva o venta.
- Gestión de garantía.
- Operaciones masivas.

Los logs no almacenarán contraseñas, tokens, comprobantes completos ni secretos.

## 35. Backups, continuidad y recuperación

### Alcance

- PostgreSQL.
- Imágenes.
- PDFs.
- Archivos privados.
- Configuración necesaria.
- Workflows n8n.

### Política mínima a formalizar

- Frecuencia.
- Copia externa.
- Retención diaria, semanal y mensual.
- Cifrado.
- Control de acceso.
- Verificación de integridad.
- Responsable.
- Registro de ejecuciones.
- Alertas de fallo.
- Prueba periódica de restauración.

El workflow diario existente de backup de base de datos será la base, pero debe complementarse con respaldo de archivos y copia fuera del servidor principal.

### Objetivos

- RPO: pérdida máxima aceptable de datos.
- RTO: tiempo objetivo de recuperación.

Los valores finales se definirán con el negocio según criticidad y costo.

### Procedimiento

1. Declarar incidente.
2. Aislar causa.
3. Elegir punto de restauración.
4. Restaurar en ambiente seguro.
5. Validar base de datos y archivos.
6. Habilitar servicio.
7. Verificar operaciones críticas.
8. Documentar incidente.

## 36. Monitoreo y observabilidad

Se controlará:

- Disponibilidad pública.
- Aplicación administrativa.
- Tiempo de respuesta.
- Errores HTTP.
- Excepciones Laravel.
- Cola.
- Cron/scheduler.
- PostgreSQL.
- Espacio en disco.
- Certificado SSL.
- Dominio.
- n8n.
- Envío de correos.
- Generación de PDF.
- Backups.
- Integraciones externas.

Alertas:

- Sitio caído.
- Error sostenido.
- Cola detenida.
- Disco próximo al límite.
- Certificado próximo a vencer.
- Backup fallido.
- PDF fallido.
- Automatización fallida.

Se dispondrá de un panel de salud técnica y logs centralizados con retención definida. Los logs no deben contener datos sensibles.

## 37. Ambientes, despliegue y reversión

Ambientes:

```text
local
staging
production
```

### Staging

- Dominio separado.
- Base separada.
- Credenciales distintas.
- Datos ficticios o anonimizados.
- Integraciones en sandbox cuando existan.
- `noindex`.
- Acceso restringido.

### Despliegue

1. Revisión de código.
2. Pruebas automáticas.
3. Backup previo cuando haya migraciones críticas.
4. Despliegue en staging.
5. Pruebas funcionales.
6. Aprobación.
7. Despliegue productivo.
8. Migraciones controladas.
9. Health check.
10. Verificación de flujos principales.

Cada entrega tendrá un plan de reversión compatible con los cambios de base de datos. No se dependerá de migraciones destructivas irreversibles.

## 38. Estrategia de pruebas

### Backend

- Publicación.
- Disponibilidad.
- Stock unitario y cuantitativo.
- Carrito y recálculo.
- Cotización.
- PDF.
- Pedido.
- Reserva.
- Venta.
- Pagos.
- Autenticación de clientes.
- Permisos.
- Tokens y URLs firmadas.
- Transiciones de estado.

### Frontend

- Componentes.
- Formularios.
- Carrito.
- Cotizador.
- Filtros.
- Búsqueda.
- Responsive.
- Accesibilidad.
- Estados vacíos.
- Errores.

### Integración

- Pedido completo.
- Cotización completa.
- Conversión.
- Pago y comprobante.
- Stock concurrente.
- Correo.
- WhatsApp.
- Telegram.
- PDF.
- Cola y notificaciones.

### Seguridad

- Accesos no autorizados.
- Enumeración de IDs.
- Manipulación de precio.
- Carga maliciosa.
- Rate limiting.
- XSS.
- CSRF.
- Exposición de IMEI, costo y datos personales.
- Escalamiento de privilegios.

### Regresión

Las pruebas actuales de ventas, reservas, autenticación, perfil y reportes deben continuar pasando. El ecommerce no puede romper la operación interna.

## 39. Criterios no funcionales medibles

Antes del desarrollo se fijarán objetivos verificables:

- Tiempo de carga de inicio.
- Largest Contentful Paint.
- Tiempo de búsqueda.
- Tiempo de respuesta de APIs.
- Tiempo de generación de PDF.
- Tamaño máximo de imagen.
- Capacidad máxima inicial del catálogo.
- Usuarios concurrentes esperados.
- Disponibilidad objetivo.
- Navegadores soportados.
- Resoluciones móviles y escritorio.
- Nivel WCAG objetivo.
- RPO y RTO.
- Retención de logs.

Valores iniciales recomendados para validación:

- API habitual: percentil 95 menor a 500 ms, excluyendo servicios externos.
- Búsqueda: percentil 95 menor a 800 ms.
- PDF: menor a 10 segundos en operación normal.
- Imágenes de tarjeta optimizadas idealmente por debajo de 200 KB.
- Accesibilidad objetivo: WCAG 2.2 AA en flujos principales.
- Navegadores: dos últimas versiones estables de Chrome, Safari, Edge y Firefox.

Estos valores deberán probarse con infraestructura y volumen reales.

## 40. Aspectos legales y privacidad

Páginas/documentos:

- Términos y condiciones.
- Política de privacidad.
- Política de cookies.
- Cambios y devoluciones.
- Garantías.
- Consentimiento de contacto.
- Consentimiento de promociones.
- Tratamiento de datos personales.
- Conservación y eliminación.
- Uso de fotografías.
- Disponibilidad y variación de precios.
- Vigencia de cotizaciones.
- Responsabilidad por servicios externos.

El texto definitivo debe revisarse conforme a la operación y normativa aplicable en Bolivia. La implementación técnica permitirá versionar políticas y registrar aceptación cuando corresponda.

## 41. Documentación y capacitación

Entregables:

- Manual de administrador.
- Manual de vendedor.
- Manual de catálogo.
- Manual de pedidos.
- Manual de cotizaciones.
- Manual de atención al cliente.
- Guía del portal de cliente.
- Procedimiento de backup y restauración.
- Procedimiento de despliegue.
- Variables de entorno documentadas sin secretos.
- Diagrama de arquitectura.
- Diccionario de base de datos.
- Catálogo de eventos y estados.
- Matriz de roles y permisos.
- Registro de cambios.

Se realizará capacitación práctica por rol y se dejarán datos de demostración en staging.

## 42. Plan de lanzamiento

### Preparación

- Dominio y SSL.
- Contenido legal.
- Configuración de contacto.
- Catálogo inicial.
- Fotografías optimizadas.
- Cuentas internas.
- Plantillas de correo.
- Analítica.
- Backups.
- Monitoreo.

### Ejecución

1. Pruebas internas.
2. Revisión en staging.
3. Prueba con clientes seleccionados.
4. Correcciones.
5. Carga final.
6. Lanzamiento controlado.
7. Comunicación en redes.
8. Seguimiento intensivo.

### Seguimiento

- Errores de primera semana.
- Búsquedas sin resultados.
- Productos más vistos.
- Carritos y cotizaciones.
- Pedidos.
- Conversión.
- Contactos por canal.
- Rendimiento.
- Revisión formal a los 30 días.

Debe existir un plan de contingencia que permita mostrar una página informativa y mantener el sistema interno operativo si la tienda pública presenta una falla.

## 43. Definición completa de la plataforma

La especificación se divide en cuatro capas:

### Experiencia comercial

```text
Catálogo
→ búsqueda
→ carrito
→ cotizador/PDF
→ pedido
→ área de clientes
```

### Operación interna

```text
Stock
→ cotización
→ pedido
→ reserva
→ pago
→ venta
→ entrega
→ garantía y soporte
```

### Plataforma técnica

```text
Seguridad
→ pruebas
→ observabilidad
→ backups
→ despliegue
→ recuperación
```

### Gobierno

```text
Roles y permisos
→ auditoría
→ políticas
→ documentación
→ métricas
→ mejora continua
```

## 44. Recomendación final

Con estas incorporaciones, la propuesta deja de ser solamente un catálogo con carrito y se convierte en una especificación profesional integral para el ecommerce Apple Boss.

El desarrollo debe seguir siendo incremental:

1. Consolidar catálogo, stock y CMS.
2. Lanzar experiencia pública, carrito y cotizador.
3. Integrar pedidos, reservas, ventas y portal del cliente.
4. Incorporar pagos, logística, garantías y soporte.
5. Completar gobierno, automatización y optimización continua.

No todos los módulos necesitan habilitarse el mismo día, pero la arquitectura, los estados y el modelo de datos deben contemplarlos desde el principio para evitar reconstrucciones costosas.
