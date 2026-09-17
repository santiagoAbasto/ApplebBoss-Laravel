# RAM y capacidad de batería de los iPhone (2026-09-15)

Apple no publica ninguno de los dos datos en sus fichas de iPhone: las 13 páginas oficiales pegadas (los 38 modelos de la base) no mencionan la RAM ni los mAh. El 2026-09-15 el usuario decidió cargarlos con fuentes externas que los confirmen.

**Regla aplicada**
- Un valor se carga cuando coinciden dos fuentes: gsmarena.com y el infobox de Wikipedia. Wikipedia cita a MacRumors (RAM según Xcode), a iFixit y a registros de certificación.
- Si no coinciden, decide una tercera fuente: 9to5Mac o MacRumors.
- Desde el iPhone 17, Apple publica la batería en sus etiquetas de energía de la UE, y esa fuente vale como oficial.
- Lo que ninguna fuente confirma queda como «falta» en `pendientes` y la tienda no lo muestra.

## Resultado

- **RAM**: 37 de 38 confirmadas. Falta el Duo.
- **Batería**: 37 de 38 confirmadas. El 17 Pro y el 17 Pro Max suman la batería más grande de sus unidades solo eSIM. Faltan la batería del Duo y la de las unidades solo eSIM del 18 Pro y del 18 Pro Max.

## Diferencias entre fuentes (resueltas)

| Modelo | gsmarena.com | Wikipedia | Tercera fuente | Cargado |
|---|---|---|---|---|
| iPhone 13 mini | 2.438 mAh | 2.406 mAh | [9to5Mac](https://9to5mac.com/2023/11/21/iphone-battery-mah-capacity-list/): 2.406 | 2.406 mAh |
| iPhone 13 | 3.240 mAh | 3.227 mAh | 9to5Mac: 3.227 | 3.227 mAh |
| iPhone 14 Plus | 4.323 mAh | 4.325 mAh | 9to5Mac y [MacRumors](https://www.macrumors.com/2022/09/11/iphone-14-battery-capacities-mah/): 4.325 | 4.325 mAh |
| iPhone 15 Pro Max | 4.441 mAh | 4.422 mAh | 9to5Mac: 4.422 | 4.422 mAh |
| iPhone 17 Pro (con SIM) | 3.998 mAh | 3.988 mAh | [MacRumors, desmontajes](https://www.macrumors.com/2025/09/19/iphone-17-and-17-pro-sim-esim-battery-capacities/): 3.988 | 3.988 mAh |

Las cifras distintas de gsmarena.com venían de registros previos al lanzamiento.

## Pendientes (no se muestran hasta tener fuente)

| Modelo | Dato | Por qué falta |
|---|---|---|
| iPhone Duo | RAM | Xcode 27 todavía no lo reconoce. [MacRumors](https://www.macrumors.com/2026/09/09/iphone-18-pro-and-pro-max-ram/) solo supone 12 GB porque tiene el mismo chip que el 18 Pro. |
| iPhone Duo | Batería | Apple no publica la capacidad de su doble batería y las cifras que circulan van de 4.700 a 5.800 mAh. |
| iPhone 18 Pro y 18 Pro Max | Batería solo eSIM | [MacRumors](https://www.macrumors.com/2026/09/10/iphone-18-pro-max-battery-capacities-ram/) dice que aún no está confirmada. gsmarena.com y Wikipedia dan 4.288 y 5.567 mAh, de registros previos al lanzamiento. |

Se listan con `php artisan modelos:pendientes` (ver [`../modelos-referencia-pendientes.md`](../modelos-referencia-pendientes.md)).

## Por modelo

«Batería» es la de la versión con bandeja SIM, o la única cuando no hay variantes. La columna de gsmarena.com muestra lo que publica ese sitio.

| Modelo | RAM | Batería (mAh) | gsmarena.com (RAM · mAh) | Wikipedia |
|---|---|---|---|---|
| iPhone X | 3 GB | 2.716 | [3 GB · 2716](https://www.gsmarena.com/apple_iphone_x-8858.php) | [iPhone X](https://en.wikipedia.org/wiki/iPhone_X) |
| iPhone XR | 3 GB | 2.942 | [3 GB · 2942](https://www.gsmarena.com/apple_iphone_xr-9320.php) | [iPhone XR](https://en.wikipedia.org/wiki/iPhone_XR) |
| iPhone XS | 4 GB | 2.658 | [4 GB · 2658](https://www.gsmarena.com/apple_iphone_xs-9318.php) | [iPhone XS](https://en.wikipedia.org/wiki/iPhone_XS) |
| iPhone XS Max | 4 GB | 3.174 | [4 GB · 3174](https://www.gsmarena.com/apple_iphone_xs_max-9319.php) | [iPhone XS](https://en.wikipedia.org/wiki/iPhone_XS) |
| iPhone 11 | 4 GB | 3.110 | [4 GB · 3110](https://www.gsmarena.com/apple_iphone_11-9848.php) | [iPhone 11](https://en.wikipedia.org/wiki/iPhone_11) |
| iPhone 11 Pro | 4 GB | 3.046 | [4 GB · 3046](https://www.gsmarena.com/apple_iphone_11_pro-9847.php) | [iPhone 11 Pro](https://en.wikipedia.org/wiki/iPhone_11_Pro) |
| iPhone 11 Pro Max | 4 GB | 3.969 | [4 GB · 3969](https://www.gsmarena.com/apple_iphone_11_pro_max-9846.php) | [iPhone 11 Pro](https://en.wikipedia.org/wiki/iPhone_11_Pro) |
| iPhone SE (2.ª generación) | 3 GB | 1.821 | [3 GB · 1821](https://www.gsmarena.com/apple_iphone_se_(2020)-10170.php) | [iPhone SE (2nd generation)](https://en.wikipedia.org/wiki/iPhone_SE_(2nd_generation)) |
| iPhone 12 | 4 GB | 2.815 | [4 GB · 2815](https://www.gsmarena.com/apple_iphone_12-10509.php) | [iPhone 12](https://en.wikipedia.org/wiki/iPhone_12) |
| iPhone 12 mini | 4 GB | 2.227 | [4 GB · 2227](https://www.gsmarena.com/apple_iphone_12_mini-10510.php) | [iPhone 12](https://en.wikipedia.org/wiki/iPhone_12) |
| iPhone 12 Pro | 6 GB | 2.815 | [6 GB · 2815](https://www.gsmarena.com/apple_iphone_12_pro-10508.php) | [iPhone 12 Pro](https://en.wikipedia.org/wiki/iPhone_12_Pro) |
| iPhone 12 Pro Max | 6 GB | 3.687 | [6 GB · 3687](https://www.gsmarena.com/apple_iphone_12_pro_max-10237.php) | [iPhone 12 Pro](https://en.wikipedia.org/wiki/iPhone_12_Pro) |
| iPhone 13 mini | 4 GB | 2.406 | [4 GB · 2438](https://www.gsmarena.com/apple_iphone_13_mini-11104.php) | [iPhone 13](https://en.wikipedia.org/wiki/iPhone_13) |
| iPhone 13 | 4 GB | 3.227 | [4 GB · 3240](https://www.gsmarena.com/apple_iphone_13-11103.php) | [iPhone 13](https://en.wikipedia.org/wiki/iPhone_13) |
| iPhone SE (3.ª generación) | 4 GB | 2.018 | [4 GB · 2018](https://www.gsmarena.com/apple_iphone_se_(2022)-11410.php) | [iPhone SE (3rd generation)](https://en.wikipedia.org/wiki/iPhone_SE_(3rd_generation)) |
| iPhone 13 Pro | 6 GB | 3.095 | [6 GB · 3095](https://www.gsmarena.com/apple_iphone_13_pro-11102.php) | [iPhone 13 Pro](https://en.wikipedia.org/wiki/iPhone_13_Pro) |
| iPhone 13 Pro Max | 6 GB | 4.352 | [6 GB · 4352](https://www.gsmarena.com/apple_iphone_13_pro_max-11089.php) | [iPhone 13 Pro](https://en.wikipedia.org/wiki/iPhone_13_Pro) |
| iPhone 14 | 6 GB | 3.279 | [6 GB · 3279](https://www.gsmarena.com/apple_iphone_14-11861.php) | [iPhone 14](https://en.wikipedia.org/wiki/iPhone_14) |
| iPhone 14 Plus | 6 GB | 4.325 | [6 GB · 4323](https://www.gsmarena.com/apple_iphone_14_plus-11862.php) | [iPhone 14](https://en.wikipedia.org/wiki/iPhone_14) |
| iPhone 14 Pro | 6 GB | 3.200 | [6 GB · 3200](https://www.gsmarena.com/apple_iphone_14_pro-11860.php) | [iPhone 14 Pro](https://en.wikipedia.org/wiki/iPhone_14_Pro) |
| iPhone 14 Pro Max | 6 GB | 4.323 | [6 GB · 4323](https://www.gsmarena.com/apple_iphone_14_pro_max-11773.php) | [iPhone 14 Pro](https://en.wikipedia.org/wiki/iPhone_14_Pro) |
| iPhone 15 | 6 GB | 3.349 | [6 GB · 3349](https://www.gsmarena.com/apple_iphone_15-12559.php) | [iPhone 15](https://en.wikipedia.org/wiki/iPhone_15) |
| iPhone 15 Plus | 6 GB | 4.383 | [6 GB · 4383](https://www.gsmarena.com/apple_iphone_15_plus-12558.php) | [iPhone 15](https://en.wikipedia.org/wiki/iPhone_15) |
| iPhone 15 Pro | 8 GB | 3.274 | [8 GB · 3274](https://www.gsmarena.com/apple_iphone_15_pro-12557.php) | [iPhone 15 Pro](https://en.wikipedia.org/wiki/iPhone_15_Pro) |
| iPhone 15 Pro Max | 8 GB | 4.422 | [8 GB · 4441](https://www.gsmarena.com/apple_iphone_15_pro_max-12548.php) | [iPhone 15 Pro](https://en.wikipedia.org/wiki/iPhone_15_Pro) |
| iPhone 16 | 8 GB | 3.561 | [8 GB · 3561](https://www.gsmarena.com/apple_iphone_16-13317.php) | [iPhone 16](https://en.wikipedia.org/wiki/iPhone_16) |
| iPhone 16 Plus | 8 GB | 4.674 | [8 GB · 4674](https://www.gsmarena.com/apple_iphone_16_plus-13316.php) | [iPhone 16](https://en.wikipedia.org/wiki/iPhone_16) |
| iPhone 16 Pro | 8 GB | 3.582 | [8 GB · 3582](https://www.gsmarena.com/apple_iphone_16_pro-13315.php) | [iPhone 16 Pro](https://en.wikipedia.org/wiki/iPhone_16_Pro) |
| iPhone 16 Pro Max | 8 GB | 4.685 | [8 GB · 4685](https://www.gsmarena.com/apple_iphone_16_pro_max-13123.php) | [iPhone 16 Pro](https://en.wikipedia.org/wiki/iPhone_16_Pro) |
| iPhone 16e | 8 GB | 4.005 | [8 GB · 4005](https://www.gsmarena.com/apple_iphone_16e-13395.php) | [iPhone 16e](https://en.wikipedia.org/wiki/iPhone_16e) |
| iPhone 17 | 8 GB | 3.692 | [8 GB · 3692](https://www.gsmarena.com/apple_iphone_17-14050.php) | [iPhone 17](https://en.wikipedia.org/wiki/iPhone_17) |
| iPhone Air | 12 GB | 3.149 | [12 GB · 3149](https://www.gsmarena.com/apple_iphone_17_air-13502.php) | [iPhone Air](https://en.wikipedia.org/wiki/iPhone_Air) |
| iPhone 17e | 8 GB | 4.005 | [8 GB · 4005](https://www.gsmarena.com/apple_iphone_17e-14487.php) | [iPhone 17e](https://en.wikipedia.org/wiki/iPhone_17e) |
| iPhone 17 Pro | 12 GB | 3.988 · solo eSIM: 4.252 | [12 GB · 3998 / 4252](https://www.gsmarena.com/apple_iphone_17_pro-14049.php) | [iPhone 17 Pro](https://en.wikipedia.org/wiki/iPhone_17_Pro) |
| iPhone 17 Pro Max | 12 GB | 4.823 · solo eSIM: 5.088 | [12 GB · 4823 / 5088](https://www.gsmarena.com/apple_iphone_17_pro_max-13964.php) | [iPhone 17 Pro](https://en.wikipedia.org/wiki/iPhone_17_Pro) |
| iPhone 18 Pro | 12 GB | 4.056 · solo eSIM: pendiente | [12 GB · 4056 / 4288](https://www.gsmarena.com/apple_iphone_18_pro-14934.php) | [iPhone 18 Pro](https://en.wikipedia.org/wiki/iPhone_18_Pro) |
| iPhone 18 Pro Max | 12 GB | 5.391 · solo eSIM: pendiente | [12 GB · 5391 / 5567](https://www.gsmarena.com/apple_iphone_18_pro_max-14716.php) | [iPhone 18 Pro](https://en.wikipedia.org/wiki/iPhone_18_Pro) |
| iPhone Duo | pendiente | pendiente | [12 GB · sin mAh](https://www.gsmarena.com/apple_iphone_duo_fold-13804.php) | [iPhone Duo](https://en.wikipedia.org/wiki/iPhone_Duo) |

## Fuentes que confirman los modelos nuevos

- iPhone 17, Air, 17 Pro y 17 Pro Max: etiquetas de energía de Apple en la UE ([MacRumors, 2025-09-09](https://www.macrumors.com/2025/09/09/iphone-17-and-17-pro-battery-capacities/)) y desmontajes ([MacRumors, 2025-09-19](https://www.macrumors.com/2025/09/19/iphone-17-and-17-pro-sim-esim-battery-capacities/)). La versión con SIM del 17 no tiene una cifra propia: la etiqueta de la UE y el desmontaje de la versión solo eSIM dan 3.692 mAh.
- iPhone 16e: desmontaje ([MacRumors, 2025-02-26](https://www.macrumors.com/2025/02/26/iphone-16e-battery-capacity/)), 4.005 mAh.
- iPhone 17e: batería según la etiqueta de energía de Apple en la UE ([MacRumors, 2026-03-02](https://www.macrumors.com/2026/03/02/iphone-17e-smaller-details/)) y RAM según Xcode ([MacRumors, 2026-03-05](https://www.macrumors.com/2026/03/05/iphone-17e-has-8gb-of-ram/)).
- iPhone 18 Pro y 18 Pro Max: RAM según Xcode 27 ([MacRumors, 2026-09-09](https://www.macrumors.com/2026/09/09/iphone-18-pro-and-pro-max-ram/)) y batería de la versión con SIM según las etiquetas de energía de Apple en la UE ([MacRumors, 2026-09-09](https://www.macrumors.com/2026/09/09/iphone-18-pro-max-battery-capacities/)).

## Cómo se muestra

- **Ficha del producto:** «Memoria RAM» va en Rendimiento, después de Almacenamiento. «Capacidad de batería» va en Batería y carga, después de la salud. Donde corresponde, lleva la nota «… mAh en las unidades solo eSIM».
- **Texto de ayuda:** dice que Apple no publica el dato y que lo confirman fuentes independientes.
- **Comparativa:** muestra las mismas filas. El Duo aparece con guion hasta que haya fuente.
- **Datos en la base:** `rendimiento.ram_gb`, `bateria.capacidad_mah` y `bateria.capacidad_mah_solo_esim`, en `generar_iphone.py` (`RAM_GB`, `BATERIA_MAH` y `BATERIA_MAH_SOLO_ESIM`). Cada uno lleva su fuente en `CONFIRMADO`.

## Otros datos revisados y no agregados

- **Frecuencia de la CPU (GHz):** Apple no la publica y las fuentes no coinciden.
- **Bandas de red por país:** son listas largas por número de modelo. La ficha ya dice qué redes admite y avisa del 5G mmWave y de las unidades solo eSIM.
- **Versión de iOS instalada:** es de cada equipo, no del modelo. Se escribe en la publicación.
