# Navidad en correos, PDF y páginas de documentos (13-11-2026)

Todo documento que sale de Apple Boss se viste con la campaña y vuelve solo a su aspecto de siempre cuando la
campaña se apaga en el panel (botón «Apagar la campaña» o modo Apagada). No hay que tocar plantillas.

## Quién decide
`App\Support\Temporada::enDocumentos()`: verdadero solo si la campaña está activa (manual, o programada y dentro de
sus fechas) **y** el interruptor «Correos y documentos» (`navidad_documentos`) está encendido. Se consulta al armar
cada documento: un correo en cola se decide al enviarse y un PDF al pedirse (no se guardan PDF ya vestidos). Si la
consulta falla devuelve falso: un documento nunca deja de salir por el adorno.

## Qué se viste
| Documento | Cómo | Dónde |
| --- | --- | --- |
| Correos con el marco de marca (bienvenida, pedido, carrito, boleta, cotización, reserva, servicio, reseña, informe) | Franja de caramelo, saludo, banner animado y cabecera en verde pino con acento oro | `emails/layouts/marca.blade.php` + `emails/partials/navidad.blade.php` |
| Boletín | La misma franja, saludo y banner arriba | `emails/newsletter.blade.php` |
| Correos de solo texto | Una línea de saludo al final | `newsletter-text`, `solicitud-resena-text` |
| PDF A4 de marca (boleta, cotización, servicio, diagnóstico) | Franja, saludo con gorro, sello y acentos en oro, fichas, píldoras, total y pie en verde pino; iconos lima → oro | `pdf/partials/estilos`, `pdf/partials/membrete`, `App\Support\IconoPdf` |
| Los demás PDF (reserva, reportes, exportaciones, auditoría) | Franja y saludo al empezar | `pdf/partials/navidad.blade.php` |
| Tickets de 80 mm | La versión fina del saludo (`compacto`), para no pasar de una página | `pdf/partials/navidad.blade.php` |
| Página del enlace de un documento y del presupuesto | Franja, saludo y cabecera pino | `partials/navidad-pagina.blade.php` |

## Banner animado de los correos
`public/images/correo/navidad-trineo.gif` (366 KB, 840×186, 40 cuadros): el trineo con los renos cruza un paisaje de
pinos y las luces parpadean. Va en GIF porque es lo único que animan Gmail, Outlook y Apple Mail por igual. Lo genera
`scripts/generar-gif-navidad.py` (rsvg-convert + ImageMagick) con los mismos dibujos de la web. Quien tenga las
imágenes bloqueadas ve la franja y el saludo.

## Adornos de los PDF
`App\Support\Navidad\AdornoPdf`: franja de caramelo, gorro y arbolito como SVG en data URI, hechos con formas simples
porque dompdf no dibuja SVG en línea ni degradados repetidos.

## Verificado
- Pruebas: `tests/Feature/NavidadEnDocumentosTest.php` (apagada, encendida, apagar desde el panel, interruptor propio,
  programada, y que ningún PDF quede sin el saludo). Suite completa: 915 pruebas.
- PDF reales en local (boleta A4, ticket de 80 mm y cotización): misma cantidad de páginas con y sin campaña.
- Correo de bienvenida visto en navegador con la campaña encendida.

## Límites
- Dentro de cada correo, el botón y las viñetas conservan sus colores de siempre: solo cambia el marco.
- No se probó en clientes de correo reales (Gmail, Outlook, Apple Mail) ni en una impresora térmica.
