# QA — Navidad en Apple Boss (13-11-2026, entorno local)

## Pruebas automáticas
`php -d memory_limit=2G vendor/bin/phpunit -d memory_limit=2G tests/Feature/CampanaNavidadTest.php` → 11 pruebas, OK.
Cubren: apagada (sin atributo ni prop), manual, programada con límites exactos (inicio inclusivo, fin exclusivo,
medianoche de Bolivia = 04:00 UTC), encendido y apagado solos con el reloj, tienda y panel por separado, permisos
(invitado 404, vendedor 403), validación (fechas, enlace externo, HTML en el texto), vista previa aislada (no
publica; no llega por URL ni a otro rol), apagado que conserva ajustes, y caché invalidada al guardar.

Suite completa (`php -d memory_limit=2G vendor/bin/phpunit -d memory_limit=2G`): 904 pruebas, 7763 aserciones, OK (2 avisos de deprecación que ya existían).

`npx vite build` → compila sin errores.

## Revisión en navegador (http://localhost:8010, build de producción)
| Qué | Resultado |
| --- | --- |
| Portada 1366 y 375 | bloque de bienvenida, franja, luces y gorro correctos; sin desborde horizontal |
| Catálogo, Trade-In (1366), servicio técnico (375) | tira por recorrido correcta |
| Catálogo sin resultados | escena del duende |
| `/admin/login` | gorro y Papá Noel; formulario intacto |
| Panel: Resumen, Ventas, Campaña de Navidad | acento, botón primario, cinta, saludo, galería de piezas |
| Apagado | `<html>` sin atributos, 0 elementos `nv-*`, `--ab-navy` = `#011446`, `Personajes` no se descarga |
| Navegación repetida (7 visitas) | siempre 1 tira de luces, 1 gorro, 1 franja; animaciones estables por página |
| «Reducir efectos» | `data-season-still` puesto, 0 animaciones `nv-*`, preferencia guardada |
| Consola | sin errores del sitio |

Defectos encontrados y corregidos durante la revisión: el SVG del botón de la portada salía gigante (regla de
tamaño con demasiada especificidad) y el botón «Buscar» del catálogo se salía de su campo (una regla le cambiaba
`position`).

## No verificado
- Carrito con productos, checkout, pago (QR) y seguimiento con un pedido de prueba.
- Panel del vendedor, modales del panel y el resto de los módulos uno por uno.
- Anchos 320, 425, 768, 1024, 1440 y 1536; zoom; navegación completa por teclado.
- Contraste medido con herramienta (los pares principales se calcularon a mano: blanco sobre pino 12:1,
  burdeos sobre blanco 6,6:1).
- Medición de rendimiento comparada (solo pesos: CSS 5,3 KB gzip, personajes 3,0 KB gzip).
- La escena de agradecimiento no está montada en ninguna página.
- Los 404 de la tienda siguen siendo la página por defecto de Laravel.

## Pasadas posteriores (13-11-2026, tarde)
Tras la primera entrega se sumaron: trineo y paisaje, colgantes de margen, astas en los botones, luces que
parpadean y que dejan libre la columna de 1224 px al bajar, carrito de temporada, campos y tarjetas con marco de
caramelo, música (Web Audio, con botón para apagarla) y tapas de regalo en las fotos del catálogo.

- Suite completa antes del commit: 904 pruebas, 7771 aserciones, OK. `npx vite build` OK.
- Navegador: catálogo e iPhone a 1366/1600/1800 px y catálogo a 375 px; carrito con un producto; música
  (enciende, sigue al navegar, se apaga y lo recuerda); tapas (5 puestas, destapar sin navegar, siguen abiertas
  al recargar y al cambiar de página).
- No verificado: el sonido en sí (no se puede oír desde la revisión automática), el rebote táctil con un dedo
  real, checkout/pago/seguimiento con un pedido de prueba, el panel del vendedor, Safari y Firefox.
