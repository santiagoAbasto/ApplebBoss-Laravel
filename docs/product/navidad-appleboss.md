# Navidad en Apple Boss — concepto y cobertura (13-11-2026)

## Concepto
Una tienda de tecnología preparada para la temporada de regalos: cálida, sin nieve permanente (Cochabamba),
con la marca intacta. El logotipo no se modifica: el gorro es una pieza aparte que se apoya encima.

- Paleta de temporada: pino `#143D2B`, pino claro `#1F5A40`, burdeos `#A42635`, oro `#B88A44` (solo decorativo),
  oro claro `#E2BC72`, marfil `#FFF8EE`.
- Dos intensidades. **Festiva**: el azul de marca cede al pino y el fondo al marfil. **Discreta**: colores de
  siempre, solo acentos (foco burdeos, lima → oro) y adornos.
- Por defecto: tienda festiva, panel discreto.
- El producto sigue siendo protagonista: ninguna pieza toca fotos, precios, estado del equipo ni el QR de pago.
- Los textos son saludos, no promociones. Nada dice descuento, envoltorio ni entrega antes de Navidad.

## Piezas (todas SVG propios, en `src/resources/js/Components/Temporada/`)
| Pieza | Archivo | Dónde se usa |
| --- | --- | --- |
| Gorro | Adornos.jsx | logotipo de la tienda, del panel y del acceso |
| Luces (horizontal y compacta) | Adornos.jsx | bajo el encabezado de la tienda; menú del panel |
| Regalo (4 tonos), Esfera, Campana, Estrella, Rama | Adornos.jsx | franja, tira, botón de la portada, pie, galería |
| Papá Noel con paquete | Personajes.jsx | portada (escena), acceso, muestra del panel |
| Duende técnico | Personajes.jsx | tira de servicio técnico, saludo del Resumen, búsqueda sin resultados |
| Reno | Personajes.jsx | tira de Trade-In, carrito vacío |
| Árbol con adornos de tecnología | Personajes.jsx | portada, agradecimiento |
| Escenas: bienvenida, carrito vacío, sin resultados, agradecimiento | Personajes.jsx | portada, carrito, búsqueda/catálogo; la de agradecimiento está en el registro y la galería, todavía sin montar en una página |

Los personajes se dibujan una vez (`…Dibujo`) y las escenas los reutilizan. El archivo de personajes se descarga
aparte y solo con la campaña encendida (3,0 KB gzip). La hoja `navidad.css` pesa 5,3 KB gzip.

## Cobertura
Estados: **V** verificado en navegador · **I** implementado (hereda del layout o de los tokens, sin revisar esa
pantalla una por una) · **P** pendiente · **N/A** no aplica.

| Superficie | Cómo se viste | Estado |
| --- | --- | --- |
| Encabezado de la tienda (StoreLayout) | gorro, cinta tricolor, franja de campaña, luces | V (1366 y 375) |
| Navegación y menú móvil | acentos por tokens | I |
| Portada | bloque de bienvenida con escena bajo el hero | V (1366 y 375) |
| Catálogo | tira «Ideas para regalar», tokens, vacío con escena | V |
| iPhone, Mac, Más Apple, accesorios, MYSKIN, seminuevos, colecciones | tira + tokens | I |
| Ficha de producto y página de modelo | tira + tokens | I |
| Comparadores | tira + tokens | I |
| Carrito (drawer) | vacío con escena del reno | I (código); no abierto en navegador |
| Checkout, pago y pedido | solo tokens y cinta; sin tira, sin personajes, sin nieve | I; no recorrido con un pedido de prueba |
| Seguimiento | tira de saludo, sin nieve | I |
| Trade-In | tira con el reno | V |
| Servicio técnico | tira con el duende | V (375) |
| Páginas informativas, novedades, FAQ | tira de saludo + tokens | I |
| Acceso (`/admin/login`) | gorro y Papá Noel en el panel de marca | V |
| Ingresar / crear cuenta / recuperar (tienda) | tira + tokens | I |
| Pie y WhatsApp | ramas de remate, control «Reducir efectos», filete dorado en el botón verde | I |
| Búsqueda sin resultados (overlay) | escena del duende | I |
| Errores 404 de la tienda | página por defecto de Laravel, sin layout | P |
| Panel: menú, barra de arriba | gorro, oro en el ítem activo, cinta, luces, control de efectos | V |
| Panel: Resumen | saludo con el duende | V |
| Panel: listados y tablas | botón primario pino, filete en títulos y cabeceras | V (Ventas) |
| Panel: formularios | foco burdeos por `--ab-acento`, casillas pino | V (Campaña de Navidad) |
| Panel: modales, toasts | heredan del `<html>` (no hay portales con estilos propios) | I |
| Panel del vendedor | mismas reglas que el administrador | I; no abierto |
| Modo oscuro | N/A: el proyecto no tiene | N/A |

## Segunda pasada: más temática (13-11-2026)
Pedido del dueño tras ver la primera versión («está muy simple»):
- **Trineo con renos** (`Trineo`): Papá Noel, saco de regalos y dos renos que galopan. Cruza la tira de cada página
  y el cielo del paisaje del pie.
- **Paisaje del pie** (`Paisaje`): colinas, pinos con luces, regalos y un reno que pasea, encima del boletín.
- **Colgantes en los márgenes** (`Colgantes`): esferas y estrellas que se mecen a los lados del contenido, solo desde
  1500 px de ancho (donde sobra espacio).
- **Botones-reno**: los botones principales de la tienda y del panel llevan astas doradas que se mueven al pasar el
  cursor. No cambian tamaño ni etiqueta. Quedan fuera los botones ya posicionados (por ejemplo «Buscar» dentro de
  su campo) y los de selección del panel.
- **Luces más ricas**: focos más grandes con halo, doble cable y colgantes (estrellas y esferas) entre foco y foco.

Nada de esto se monta en checkout ni en pedido. Todo se detiene con «Reducir efectos», con el interruptor
«Animaciones» o con `prefers-reduced-motion`. Verificado en navegador: /iphone y /catalogo a 1600 px, /catalogo a
375 px (sin desborde) y Ventas del panel.
