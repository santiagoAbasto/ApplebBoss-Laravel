# Prompt para tapar los últimos huecos de las fichas de iPhone (segunda ronda)

> **Aplicado el 2026-09-15:** la segunda ronda cerró todos los pendientes (ver `informes/verificacion-apple-2026-09-15.md`). Queda como plantilla para investigar datos de modelos nuevos.

> Generado el 2026-09-15, después de contrastar el primer informe contra las páginas oficiales de Apple (ver [`informes/verificacion-apple-2026-09-15.md`](informes/verificacion-apple-2026-09-15.md)).
> Quedan 12 pendientes formales y algunos huecos que Apple no aclara. Esta ronda admite otras fuentes, con reglas.
>
> **Cómo cargar lo que vuelva:**
> - Fuente de Apple (actual o copia archivada de una página de Apple): se carga y se quita el pendiente.
> - Número de modelo de un organismo regulador (FCC u otro): se carga.
> - Dato de fuente externa confirmado por dos fuentes independientes: se carga y se registra en `CONFIRMADO` como fuente externa.
> - Dato con una sola fuente externa, o «No encontrado»: sigue pendiente.

---

Necesito completar los últimos datos de las fichas técnicas de iPhone de una tienda en Bolivia. Ya verifiqué casi todo en las páginas oficiales de Apple; lo que queda no aparece claro en ellas. Esta vez puedes usar otras fuentes, con las reglas de abajo. Fecha de referencia: septiembre de 2026 (iOS 27 es la versión actual).

## Reglas

1. Usa las fuentes en este orden de preferencia:
   1. **Apple actual:** apple.com, support.apple.com (en cualquier idioma) y apple.com/newsroom.
   2. **Apple archivada:** la misma página oficial en una copia de web.archive.org. Indica la fecha de la copia.
   3. **Organismos reguladores:** FCC (fcc.gov), Anatel, IMDA u otros. Sirven sobre todo para los números de modelo.
   4. **Fuentes externas confiables:** GSMArena, EveryMac, PhoneArena, MacRumors, 9to5Mac, The Verge, iFixit y las páginas de operadoras (Verizon, AT&T, T-Mobile, Entel, Tigo, Viva).
2. Un dato de una fuente externa solo vale si lo confirman al menos dos fuentes independientes. Anota las dos.
3. Cada dato lleva:
   - la URL exacta;
   - el tipo de fuente (Apple actual, Apple archivada, regulador o externa);
   - una cita textual corta de la página (máximo 20 palabras);
   - la fecha de la página, si la tiene.
4. No deduzcas ni completes por lógica. Si ninguna fuente lo dice de forma explícita, escribe «No encontrado» y anota qué páginas revisaste.
5. Si las fuentes se contradicen, anótalas todas y di cuál es la más reciente.
6. Formato de los valores:
   - iOS con la versión exacta, por ejemplo «iOS 26.0».
   - Vatios con coma decimal, por ejemplo «7,5 W».
   - Números de modelo como «A####».
7. No incluyas precios.
8. Escribe el informe en español.

## Qué investigar

Entre paréntesis va el valor que hoy está cargado.

### A. Pendientes de la base

1. **iPhone 16 y iPhone 16 Plus: potencia de carga con cargadores Qi (no Qi2)** (7,5 W). La ficha técnica actual en inglés (support.apple.com/en-us/121029 y 121030) solo lista MagSafe y Qi2 de hasta 25 W. Busca la ficha de lanzamiento de septiembre de 2024, por ejemplo en web.archive.org, y confirma si decía «Qi wireless charging up to 7.5W».
2. **iPhone 16 y iPhone 16 Pro: potencia máxima con MagSafe** (22 W). La comparación de Apple España dice hasta 22 W; la ficha técnica en inglés, hasta 25 W con un adaptador de 30 W. ¿Cuál vale hoy? ¿Cambió con una actualización de software o de cargador? ¿Desde cuándo?
3. **iPhone 17, iPhone Air, iPhone 17 Pro y iPhone 17 Pro Max: versión de iOS instalada de fábrica** (iOS 26). Apple anunció que iOS 26 salía el 15 de septiembre de 2025 y los equipos se vendieron desde el 19. Confirma la versión exacta que traían (por ejemplo, iOS 26.0 o 26.0.1).
4. **iPhone 18 Pro, iPhone 18 Pro Max y iPhone Duo: números de modelo por país o región** (vacío). Todavía no figuran en «Identificar el modelo de iPhone» (support.apple.com/108044). Busca en la FCC, en otros reguladores y en sitios que los hayan publicado.
5. **iPhone Duo: Apple Pencil (USB-C).** La ficha técnica dice «Disponible este año». ¿Ya funciona? ¿Desde qué fecha o qué versión de iOS?

### B. Huecos detectados al verificar

6. **iPhone Duo: ¿figura ya en la lista de modelos compatibles con iOS 27?** (support.apple.com/guide/iphone/iphe3fa5df43/ios). Se cargó iOS 27 por su ficha técnica, pero al 2026-09-15 no estaba en esa lista.
7. **iPhone 17, Air, 17e, 17 Pro, 17 Pro Max, 18 Pro, 18 Pro Max y Duo: ¿cargan con cargadores Qi (no Qi2)? ¿A qué potencia?** Sus fichas técnicas en inglés solo listan MagSafe y Qi2; en la base figura «Qi» sin potencia.
8. **Versión menor de iOS de fábrica.** Solo si una fuente lo dice de forma explícita (por ejemplo, «shipped with iOS 14.1»):
   - iPhone XR, XS y XS Max (iOS 12);
   - iPhone 11, 11 Pro, 11 Pro Max y SE (2.ª generación) (iOS 13);
   - iPhone 12, 12 mini, 12 Pro y 12 Pro Max (iOS 14);
   - iPhone 13 mini, 13, 13 Pro y 13 Pro Max (iOS 15);
   - iPhone 14, 14 Plus, 14 Pro y 14 Pro Max (iOS 16);
   - iPhone 15, 15 Plus, 15 Pro y 15 Pro Max (iOS 17);
   - iPhone 16, 16 Plus, 16 Pro y 16 Pro Max (iOS 18).
9. **Dorso del iPhone 16, 16 Plus y 17** (vidrio tintado en masa). La ficha técnica dice «Color-infused glass back»; «Identificar el modelo de iPhone» dice «textured matte glass». ¿Es el mismo vidrio tintado con acabado mate? Cita cómo lo describe Apple en español.

### C. Información para la tienda (no va en la ficha)

10. **SIM en equipos importados a Bolivia.** Del iPhone 14 al 16e, los vendidos en EE. UU. no tienen bandeja SIM; en la familia 17, tampoco los de 13 territorios (EE. UU., Canadá, México, Japón y otros). El iPhone Air y el Duo son solo eSIM en todo el mundo.
    - ¿Cómo se reconoce en la caja o en Ajustes que una unidad es solo eSIM (por ejemplo, por el número de modelo)?
    - ¿Qué operadoras de Bolivia (Entel, Tigo, Viva) ofrecen eSIM hoy? ¿Con qué requisitos y en qué planes? Usa sus sitios oficiales.
11. **SOS vía satélite.** No está disponible en Bolivia. ¿Funciona si un cliente de Bolivia viaja a un país donde sí está disponible, con un iPhone comprado en EE. UU. o en otro país? ¿Qué restricciones hay según el país de compra? (support.apple.com/101573).

## Formato de entrega

Una tabla por sección con estas columnas:
- Modelo
- Dato
- Valor encontrado
- ¿Coincide con lo cargado? («Sí», «No: corrige a …» o «No encontrado»)
- Tipo de fuente
- URL
- Cita textual
- Fecha de la página
- Notas

Al final, una lista de lo que no encontraste, con las páginas que revisaste.
