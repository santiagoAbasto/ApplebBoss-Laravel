# Prompt para investigar los pendientes de las fichas de iPhone

> Generado el 2026-09-14 a partir de los 238 pendientes de `modelos:pendientes` (71 faltan y 167 por verificar, en 38 modelos).
> El usuario lo usa para armar un informe con fuentes oficiales; cuando lo devuelva, cada dato confirmado se carga en
> `generar_iphone.py`, se quita su pendiente y se regenera todo (ver `TRASPASO.md`).

---

Necesito un informe para completar y verificar las fichas técnicas de 38 modelos de iPhone de una tienda en Bolivia. Las fichas se armaron con las páginas de comparación de Apple España (apple.com/es/iphone/compare). Quedan datos que faltan y otros que están cargados sin fuente. Tu trabajo es confirmarlos o corregirlos uno por uno, con la fuente oficial. Fecha de referencia: septiembre de 2026; esas páginas de Apple ya mencionan iOS 27.

## Reglas

1. Usa solo fuentes oficiales de Apple: apple.com (de preferencia apple.com/es), support.apple.com (de preferencia /es-es), sus fichas técnicas, «Identificar el modelo de iPhone», las listas de modelos compatibles con cada versión de iOS, la disponibilidad de funciones por país, y apple.com/newsroom. Wikipedia, GSMArena, blogs u otras tiendas solo sirven para encontrar la página oficial, nunca como fuente.
2. Cada dato lleva la URL exacta de la página oficial y una cita textual corta de esa página (máximo 20 palabras).
3. No deduzcas ni completes por lógica. Si la fuente oficial no lo dice de forma explícita, escribe «No encontrado» y explica qué páginas revisaste.
4. Si el dato oficial es distinto del valor cargado, dilo claro: «No: corrige a …».
5. Si dos fuentes oficiales se contradicen, anota las dos con sus URL.
6. Formato de los valores: iOS con la versión exacta que da la fuente (por ejemplo «iOS 13.4»; si la fuente solo dice «iOS 13», anótalo así y aclara que no da la versión menor). Milímetros y vatios con coma decimal: «7,65 mm», «7,5 W».
7. No incluyas precios.
8. Escribe el informe en español.

## Qué investigar

Entre paréntesis va el valor que hoy está cargado. La clave técnica de cada campo va entre comillas invertidas.

### 1. Versiones de iOS

**1.1 iOS con el que salió a la venta** (`sistema.ios_lanzamiento`): la versión exacta que traía cada modelo. 37 modelos:
- iPhone XR, iPhone XS y iPhone XS Max (2018): (iOS 12)
- iPhone 11, 11 Pro y 11 Pro Max (2019): (iOS 13)
- iPhone SE (2.ª generación) (2020): (iOS 13)
- iPhone 12, 12 mini, 12 Pro y 12 Pro Max (2020): (iOS 14)
- iPhone 13 mini, 13, 13 Pro y 13 Pro Max (2021): (iOS 15)
- iPhone SE (3.ª generación) (2022): (iOS 15.4)
- iPhone 14, 14 Plus, 14 Pro y 14 Pro Max (2022): (iOS 16)
- iPhone 15, 15 Plus, 15 Pro y 15 Pro Max (2023): (iOS 17)
- iPhone 16, 16 Plus, 16 Pro y 16 Pro Max (2024): (iOS 18)
- iPhone 16e (2025): (iOS 18.3)
- iPhone 17, iPhone Air, 17 Pro y 17 Pro Max (2025): (iOS 26)
- iPhone 17e (2026): (iOS 26)
- iPhone 18 Pro, 18 Pro Max y iPhone Duo (2026): (iOS 27)

**1.2 Última versión de iOS que puede instalar** (`sistema.ios_maximo`), y si todavía recibe la versión más reciente. Si la recibe, escribe «iOS 27 (actual)» o la que corresponda. 38 modelos:
- Por confirmar: iPhone X (iOS 16); iPhone XR, XS y XS Max (iOS 18).
- Falta (vacío): iPhone 11, 11 Pro, 11 Pro Max, SE (2.ª generación), 12, 12 mini, 12 Pro, 12 Pro Max, 13 mini, 13, SE (3.ª generación), 13 Pro, 13 Pro Max, 14, 14 Plus, 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max, 16, 16 Plus, 16 Pro, 16 Pro Max, 16e, 17, Air, 17e, 17 Pro, 17 Pro Max, 18 Pro, 18 Pro Max y Duo.

### 2. Números de modelo (versiones por país)

**2.1** (`sistema.numeros_modelo`): todos los números de modelo (A####) de cada iPhone, con el país o la región de cada uno si Apple lo indica. Faltan en 37 modelos, todos menos el iPhone X (ya tiene A1865 y A1901):
iPhone XR, XS, XS Max, 11, 11 Pro, 11 Pro Max, SE (2.ª generación), 12, 12 mini, 12 Pro, 12 Pro Max, 13 mini, 13, SE (3.ª generación), 13 Pro, 13 Pro Max, 14, 14 Plus, 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max, 16, 16 Plus, 16 Pro, 16 Pro Max, 16e, 17, Air, 17e, 17 Pro, 17 Pro Max, 18 Pro, 18 Pro Max y Duo.

**2.2 (extra, para decidir)** SIM según el país de venta: del iPhone 14 al Duo, ¿qué modelos vendidos en EE. UU. no tienen bandeja para nano-SIM y funcionan solo con eSIM? ¿En qué otros países pasa lo mismo? En las fichas figura la versión de España: «Doble SIM (dos eSIM activas o nano-SIM y eSIM)»; el iPhone Air y el Duo figuran solo con eSIM.

### 3. Conectividad

**3.1 Chip de banda ultraancha** (`conectividad.uwb`): confirma que es el «chip U1» (cargado así) en el iPhone 11, 11 Pro, 11 Pro Max, 12, 12 mini, 12 Pro, 12 Pro Max, 13 mini, 13, 13 Pro, 13 Pro Max, 14, 14 Plus, 14 Pro y 14 Pro Max. Desde el 15, la comparación ya dice «de segunda generación»; esos no hace falta revisarlos.

### 4. Batería y carga

**4.1 Potencia de la carga inalámbrica Qi** (`bateria.qi_w`), cargada como 7,5 W, en: iPhone 12, 12 mini, 12 Pro, 12 Pro Max, 13 mini, 13, 13 Pro, 13 Pro Max, 14, 14 Plus, 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max, 16, 16 Plus, 16 Pro, 16 Pro Max, 17, Air, 17e, 17 Pro, 17 Pro Max, 18 Pro, 18 Pro Max y Duo. Es solo la potencia de Qi; MagSafe y Qi2 ya están cargados.

**4.2 iPhone Air: carga rápida con MagSafe** (`bateria.carga_rapida_magsafe_w`, cargado como «sí, con un adaptador de 30 W o superior»). La comparación se contradice: en una fila dice «hasta un 50 % de carga en 30 minutos… con un adaptador de 30 W o superior y un cargador MagSafe» y en la fila siguiente, «No disponible». Confirma con la ficha técnica del iPhone Air si tiene carga rápida con MagSafe, cuánto carga y con qué adaptador.

### 5. Diseño

**5.1 Material del dorso** (`diseno.dorso`), cargado como «vidrio». Anota el nombre exacto que usa Apple en español; por ejemplo, «vidrio mate texturizado»:
- iPhone 12, 12 mini, 13 mini, 13, 14, 14 Plus, 15, 15 Plus, 16, 16 Plus, 16e, 17 y 17e.
- iPhone 12 Pro, 12 Pro Max, 13 Pro, 13 Pro Max, 14 Pro, 14 Pro Max, 15 Pro, 15 Pro Max, 16 Pro y 16 Pro Max: confirma si es vidrio mate texturizado.

**5.2 Grosor exacto en milímetros** (`diseno.grosor_mm`). La comparación redondea a centímetros; confirma el valor de la ficha técnica:
- iPhone 13 mini, 13, 13 Pro y 13 Pro Max: (7,65 mm; la comparación dice 0,76 cm)
- iPhone 14 Pro y 14 Pro Max: (7,85 mm; 0,78 cm)
- iPhone 15 Pro, 15 Pro Max, 16 Pro y 16 Pro Max: (8,25 mm; 0,83 cm)
- iPhone 17: (7,95 mm; 0,8 cm)
- iPhone Air: (5,64 mm; 0,56 cm)
- iPhone 17 Pro y 17 Pro Max: (8,75 mm; 0,88 cm)

**5.3 Frente del iPhone 17 Pro y 17 Pro Max** (`diseno.frente`), cargado como «Ceramic Shield 2». La fila de la comparación lo dice, pero la nota 2 de esa misma página, que lista los modelos con Ceramic Shield 2, no los incluye. Confirma con su ficha técnica.

**5.4 Capacidades del iPhone 11 y del iPhone SE (2.ª generación)** (`diseno.capacidades_gb`), cargadas como 64, 128 y 256 GB. La comparación actual solo muestra 64 y 128 GB: confirma si también salieron con 256 GB.

### 6. Cámaras

**6.1 Niveles de zoom** (`camaras.zoom_opciones`). Confirma cómo explica Apple el 2x de los modelos con cámara principal de 48 MP: si sale del centro del sensor y si Apple lo llama «de calidad óptica». En el 17 Pro, 17 Pro Max, 18 Pro y 18 Pro Max, haz lo mismo con el 8x del teleobjetivo de 48 MP. Niveles cargados:
- iPhone 14 Pro, 14 Pro Max y 15 Pro: (0,5x, 1x, 2x y 3x)
- iPhone 15, 15 Plus, 16, 16 Plus, 17 y Duo: (0,5x, 1x y 2x)
- iPhone 15 Pro Max, 16 Pro y 16 Pro Max: (0,5x, 1x, 2x y 5x)
- iPhone 16e, Air y 17e: (1x y 2x)
- iPhone 17 Pro, 17 Pro Max, 18 Pro y 18 Pro Max: (0,5x, 1x, 2x, 4x y 8x)

### 7. Funciones que dependen del país o de la fecha

**7.1 Emergencia SOS vía satélite en Bolivia** (`seguridad.sos_satelite`): ¿está disponible en Bolivia? Si no, ¿en qué países de Sudamérica sí? Aplica a los 21 modelos del iPhone 14 en adelante; basta una respuesta con su fuente.

**7.2 iPhone Duo y Apple Pencil** (`pantalla.apple_pencil`): la comparación dice «Compatible con el Apple Pencil (USB‑C)», con la nota «Disponible este año». Confirma si ya funciona o desde cuándo, y con qué Apple Pencil.

## Formato del informe

Devuélvelo en tablas con estas columnas (lo voy a cargar en una base de datos, así que respeta el formato):

| Modelo | Campo | Valor confirmado | ¿Coincide con lo cargado? | Fuente (URL) | Cita textual | Notas |
|---|---|---|---|---|---|---|

- Una fila por modelo y por campo, sin juntar varios modelos en una fila. Solo la SOS vía satélite en Bolivia (7.1) va en una sola fila.
- En «Campo» usa la clave técnica (por ejemplo `sistema.ios_lanzamiento`).
- En números de modelo, todos los A#### del modelo van en la misma fila, separados por comas y con la región entre paréntesis si Apple la da.
- En «¿Coincide con lo cargado?»: «Sí», «No: corrige a …» o «No encontrado».
- Al final, agrega una lista de lo que no encontraste y qué páginas oficiales revisaste.
