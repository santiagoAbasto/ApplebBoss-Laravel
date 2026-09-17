# Verificación en Apple de los pendientes de iPhone (2026-09-15)

Contraste del informe [`informe-pendientes-2026-09-15.md`](informe-pendientes-2026-09-15.md) contra las páginas oficiales de Apple, leídas directamente. Criterio:
- Lo que el informe decía mal se corrigió.
- Lo que ninguna fuente oficial confirma sigue como pendiente.
- Los números de modelo se cruzaron entre la versión en español y en inglés de la misma página.
- Una lectura automática dio un dato falso (que el iPhone 12 y el 13 no tienen bandeja SIM en EE. UU.) y no se usó.

**Resultado:** la primera ronda bajó los pendientes de 238 a 12. La segunda ronda cerró esos 12, así que hoy no queda ninguno (ver al final).

## Errores del informe

| Dato | El informe decía | Apple dice | Fuente |
|---|---|---|---|
| Último iOS del iPhone 11, 11 Pro, 11 Pro Max y SE (2.ª generación) | iOS 26 (26.5), sin iOS 27 | Están en la lista de modelos compatibles con iOS 27 | support.apple.com/guide/iphone/iphe3fa5df43/ios |
| Números del iPhone 13 mini, 13, 13 Pro y 13 Pro Max | Sin la variante de Rusia y países vecinos | Suma A2630, A2635, A2640 y A2645 | support.apple.com/es-es/108044 |
| Números del iPhone 14, 14 Plus, 14 Pro y 14 Pro Max | Sin la variante de Rusia y países vecinos | Suma A2883, A2887, A2891 y A2895 | support.apple.com/es-es/108044 |
| iPhone 16 Pro | A3083, A3292, A3293 y A3295 | A3083, A3292, A3293 y **A3294** | support.apple.com/es-es/108044 y en-us/108044 |
| iPhone 16 Pro Max | A3084, A3294, A3296 y A3297 | A3084, **A3295**, A3296 y A3297 | ídem |
| iPhone 16e (EE. UU.) | A3263 | **A3212** | ídem |
| iPhone 17 (EE. UU.) | A3254 | **A3258** | ídem |
| iPhone Air (EE. UU. y otros) | A3256 | **A3260** | ídem |
| iPhone 17 Pro (EE. UU.) | A3255 | **A3256** | ídem |
| iPhone X | A1865 y A1901 | Suma **A1902** (Japón) | ídem |
| Qi de 7,5 W del 12, 14, 15 y 16 | Citaba fichas de otros modelos | Confirmado en cada ficha en inglés, salvo el 16 y el 16 Plus, cuya ficha actual no lista Qi | Ver abajo |
| Disponibilidad de SOS vía satélite | Citaba support.apple.com/es-es/125126 (es del Apple Watch Ultra) | La lista de países está en support.apple.com/es-es/101573 | support.apple.com/es-es/101573 |
| Chip de banda ultraancha del 11 al 14 | «Chip U1» | Apple lo llama «chip de banda ultraancha de primera generación» | support.apple.com/en-us/109512 |
| iOS de lanzamiento del 17, Air, 17 Pro y 17 Pro Max | Citaba la guía de uso de iOS 26 | Los anuncios dicen que iOS 26 llegaba el 15 de septiembre como actualización, no que viniera instalado | apple.com/newsroom/2025/09 |

## Confirmado y cargado

| Dato | Modelos | Valor | Fuente |
|---|---|---|---|
| Último iOS | iPhone X | iOS 16 (está en la lista de iOS 16, no en la de iOS 17) | support.apple.com/es-es/guide/iphone/iphe3fa5df43/16.0/ios/16.0 y 17.0 |
| Último iOS | XR, XS y XS Max | iOS 18 (está en la lista de iOS 18, no en la de iOS 26) | …/18.0/ios/18.0 y …/26.0/ios/26.0 |
| Último iOS | Del 11 al 18 Pro Max (33 modelos) | iOS 27 | support.apple.com/guide/iphone/iphe3fa5df43/ios |
| Último iOS | iPhone Duo | iOS 27, según su ficha técnica; todavía no figura en la lista de compatibilidad | apple.com/es/iphone-duo/specs |
| Números de modelo | 35 modelos, del X al 17 Pro Max | Ver `generar_iphone.py` (`NUMEROS`) | support.apple.com/es-es/108044 y en-us/108044 |
| Grosor | 13 mini, 13, 13 Pro y 13 Pro Max | 7,65 mm | support.apple.com/en-us/111873, 111872, 111871 y 111870 |
| Grosor | 14 Pro y 14 Pro Max | 7,85 mm | en-us/111849 y 111846 |
| Grosor | 15 Pro, 15 Pro Max y 16 Pro Max | 8,25 mm | en-us/111829, 111828 y 121032 |
| Grosor | 17 y Air | 7,95 mm y 5,64 mm | en-us/125089 y 125092 |
| Grosor | 17 Pro y 17 Pro Max | 8,75 mm | en-us/125090 y 125091 |
| Grosor | 18 Pro y 18 Pro Max | **8,75 mm** (estaba cargado 8,8 por el redondeo de 0,88 cm) | apple.com/iphone-18-pro/specs |
| Grosor | iPhone Duo | 11,3 mm cerrado y 5,2 mm abierto | apple.com/iphone-duo/specs |
| Banda ultraancha | Del 11 al 14 Pro Max | Chip de banda ultraancha de primera generación | support.apple.com/en-us/109512 |
| Qi de 7,5 W | 12 mini, 12, 12 Pro, 12 Pro Max, familia 13, 14, 14 Plus, 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max, 16 Pro y 16 Pro Max | 7,5 W | en-us/111877, 111876, 111875, 111874, 111873, 111872, 111871, 111870, 111850, 111854, 111849, 111846, 111831, 111830, 111829, 111828, 121031 y 121032 |
| Dorso | 11 Pro y 11 Pro Max | Vidrio mate texturizado | support.apple.com/es-es/108044 |
| Dorso | 17 | Vidrio tintado en masa («Color-infused glass back») | en-us/125089 |
| Capacidades | 11 y SE (2.ª generación) | 64, 128 y 256 GB | en-us/111865 y kb/SP820 |
| iOS de lanzamiento | 17e | iOS 26 («iPhone 17e comes with iOS 26») | apple.com/newsroom/2026/03/apple-introduces-iphone-17e |
| iOS de lanzamiento | 18 Pro, 18 Pro Max y Duo | iOS 27 | apple.com/es/iphone-18-pro/specs y apple.com/es/iphone-duo/specs |
| SOS vía satélite | Del 14 al Duo | Funciona en 20 países (Alemania, Andorra, Australia, Austria, Bélgica, Canadá, España, Francia, Irlanda, Islandia, Italia, Japón, Luxemburgo, México, Nueva Zelanda, Países Bajos, Portugal, Reino Unido, Suiza y EE. UU.); Bolivia y Sudamérica no figuran | support.apple.com/es-es/101573 |

## Decisiones del usuario (2026-09-15)

- **SIM:** la ficha del modelo avisa qué unidades son solo eSIM, sin usar la procedencia del equipo.
  - Del 14 al 16e: «…; las unidades de EE. UU. son solo eSIM».
  - En la familia 17: «…; las unidades de EE. UU., Canadá, México, Japón y otros 9 territorios son solo eSIM».
  - El 18 Pro y el 18 Pro Max no llevan aviso hasta que Apple lo publique.
  - Campo `conectividad.solo_esim_en`. Datos de Apple:
- **SIM según el país de venta** (support.apple.com/es-es/108044):
  - **14, 15, 16 y 16e:** «En los Estados Unidos no tiene bandeja SIM. En otros países o regiones, tiene una bandeja SIM en el lateral izquierdo que aloja una tarjeta nano-SIM».
  - **17, 17e, 17 Pro y 17 Pro Max:** sin bandeja en Estados Unidos, Puerto Rico, Baréin, Canadá, Guam, Japón, Kuwait, México, Omán, Qatar, Arabia Saudita, Emiratos Árabes Unidos e Islas Vírgenes de EE. UU.
  - **Air:** «No tiene bandeja SIM».
  - **Duo:** solo eSIM, según su ficha técnica.
- **SOS vía satélite:** se mantiene el aviso «SOS vía satélite (no disponible en Bolivia)».

## Pendientes que quedaron tras la primera ronda (cerrados en la segunda)

| Modelo | Dato | Por qué sigue abierto |
|---|---|---|
| iPhone 16 y 16 Plus | Potencia de Qi (cargada 7,5 W) | La ficha actual en inglés (en-us/121029 y 121030) solo lista MagSafe y Qi2 de hasta 25 W |
| iPhone 16 y 16 Pro | MagSafe (cargado 22 W) | La comparación de Apple España dice 22 W; la ficha en inglés, 25 W con un adaptador de 30 W |
| iPhone 17, Air, 17 Pro y 17 Pro Max | iOS de lanzamiento (cargado iOS 26) | Los anuncios no dicen que viniera instalado |
| iPhone 18 Pro, 18 Pro Max y Duo | Números de modelo | Apple todavía no los lista en support.apple.com/108044 |
| iPhone Duo | Apple Pencil | La ficha dice «Disponible este año», sin fecha |

## Segunda ronda (2026-09-15): Apple EE. UU. y otras fuentes

El usuario importa desde EE. UU. Por eso, cuando dos fuentes de Apple no coinciden, vale la de EE. UU. Para el 18 Pro, el 18 Pro Max y el Duo se sumaron las fichas de Apple de cada país y fuentes externas.

| Modelo | Dato | Valor cargado | Fuente |
|---|---|---|---|
| iPhone 16 y 16 Pro | MagSafe | **25 W** (la comparación de Apple España decía 22 W) | apple.com/iphone-16/specs y support.apple.com/en-us/121031, «MagSafe wireless charging up to 25W» |
| iPhone 16 y 16 Plus | Potencia de Qi | Vacía: Apple ya no la publica | apple.com/iphone-16/specs solo lista MagSafe y Qi2 de hasta 25 W |
| iPhone 16e | Potencia de Qi | 7,5 W | apple.com/newsroom/2026/03/apple-introduces-iphone-17e, «7.5W Qi wireless charging on iPhone 16e» |
| iPhone 17, Air, 17 Pro y 17 Pro Max | iOS de fábrica | iOS 26 (compilación 23A330, con actualización obligatoria el primer día) | macrumors.com/2025/09/18/ios-26-day-one-updates-required y Wikipedia (iPhone 17 Pro) |
| iPhone 18 Pro | Números de modelo | A3472 (EE. UU.), A3713 (Canadá), A3714 (Reino Unido), A3715 (China) | apple.com, apple.com/ca, apple.com/uk e apple.com.cn (fichas técnicas); coinciden con gsmarena.com |
| iPhone 18 Pro Max | Números de modelo | A3473 (EE. UU.), A3716 (Canadá), A3717 (Reino Unido), A3718 (China) | Ídem |
| iPhone 18 Pro y 18 Pro Max | SIM | Aviso «las unidades de EE. UU. y Canadá son solo eSIM» | apple.com/iphone-18-pro/specs y apple.com/ca/iphone-18-pro/specs, «not compatible with physical SIM cards» |
| iPhone Duo | Números de modelo | A3447 (EE. UU.), A3719 (Canadá), A3720 (Reino Unido), A3721 (China) | apple.com, apple.com/ca y apple.com/uk (fichas técnicas) y apple.com.cn; coinciden con gsmarena.com |
| iPhone Duo | iOS de fábrica | **iOS 27.1** | Apple Newsroom (2026-09), «iPhone Duo will be available with iOS 27.1» |
| iPhone Duo | Apple Pencil | «Apple Pencil (USB-C), con una actualización prevista para más adelante en 2026» | apple.com/iphone-duo/specs («Coming later this year») y Apple Newsroom |

**Se revisó, pero no cambia:**
- **iOS de fábrica del iPhone 12, 12 mini, 12 Pro y 12 Pro Max:** GSMArena dice iOS 14.1 y otras fuentes apuntan a 14.2 en el mini y el Pro Max. Sigue cargado como «iOS 14».
- **iPhone SE (2.ª generación):** GSMArena solo dice «iOS 13».

**5G mmWave (decidido con el usuario el 2026-09-15):** las fichas de Apple EE. UU. dicen «5G (sub-6 GHz and mmWave)» y la base usaba la versión de España («sub-6 GHz»). El usuario pidió avisarlo como con la SIM. La red móvil ahora dice «…; las unidades de EE. UU. también admiten 5G mmWave» (campo `conectividad.mmwave_en`). En Bolivia no hay redes mmWave, así que no cambia el uso del equipo.

| Modelos | mmWave en EE. UU. | Fuente |
|---|---|---|
| 12, 12 mini, 12 Pro, 12 Pro Max, 13 mini, 13, 13 Pro, 13 Pro Max | Sí | support.apple.com/kb/SP829, SP830, SP831, SP832, SP847, SP848, SP851 y SP852 |
| 14, 14 Plus, 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max | Sí | support.apple.com/kb/SP873, SP874, SP875 y SP876; support.apple.com/en-us/111828, 111829, 111830 y 111831 |
| 16, 16 Plus, 16 Pro, 16 Pro Max | Sí | support.apple.com/en-us/121029, 121030, 121031 y 121032 |
| 17, 17 Pro, 17 Pro Max, 18 Pro, 18 Pro Max, Duo | Sí | support.apple.com/en-us/125090 y 125091; apple.com/iphone-17/specs, iphone-18-pro/specs e iphone-duo/specs |
| SE (3.ª generación), 16e, Air, 17e | No, solo «5G (sub-6 GHz)» | support.apple.com/kb/SP867, support.apple.com/en-us/122208, apple.com/iphone-air/specs y apple.com/iphone-17e/specs |
