# Fichas de las computadoras en stock (2026-09-15)

El usuario pidió llenar la base con las computadoras que hay **hoy en stock**, no con todos los modelos:
1. Primero, la ficha oficial de la marca.
2. Si faltan datos, otras fuentes.

Los precios no salen de aquí: vienen del inventario.

**Resultado**
- 16 modelos de Mac en `src/database/data/modelos_referencia/computadora.php` y la laptop gamer Lenovo en `pc.php`, todos completos para su esquema (`php artisan modelos:verificar`: 55 modelos, 0 errores).
- Solo falta el identificador del MacBook Neo: Apple todavía no lo lista.
- La Lenovo IdeaPad Gaming 3 (#10) tiene su ficha, con el MTM de la etiqueta. La ASUS ROG Strix (#13) está vendida y el usuario dijo que no hace falta.

## Cómo se llenó

- **Fuente oficial**: la ficha técnica de Apple en español de Latinoamérica.
  - La página de soporte `support.apple.com/<país>/docs/mac/<id>` es solo un índice.
  - La ficha se abre desde su enlace «Especificaciones técnicas»: `support.apple.com/es-lamr/<id>`.
  - Se bajó cada página y se cotejó con la versión en inglés (`en-us`).
- **Último macOS**: listas oficiales de compatibilidad de Apple.
  - [127255](https://support.apple.com/en-us/127255): macOS 27 Golden Gate, salió el 2026-09-14, solo Mac con chip de Apple.
  - [122867](https://support.apple.com/en-us/122867) (Tahoe), [120282](https://support.apple.com/en-us/120282) (Sequoia), [102861](https://support.apple.com/en-us/102861) (Ventura), [103111](https://support.apple.com/en-us/103111) (Big Sur).
- **Identificador** (MacXX,X): páginas «Identificar el modelo» de Apple ([102869](https://support.apple.com/en-us/102869), [108052](https://support.apple.com/en-us/108052), [108054](https://support.apple.com/en-us/108054), [103257](https://support.apple.com/en-us/103257)). También dan el sistema compatible más nuevo.
- **Otras fuentes**, solo para lo que Apple no publica:
  - everymac.com: el sistema con que salieron las Intel y su número de modelo (A1466, A1534, A1708, A2159).
  - macrumors.com y Apple Newsroom: el Touch ID del MacBook Neo, que solo trae el modelo de 512 GB.
- **Qué Mac es cada Intel**: se leyó en el número de serie.
  - Las Intel tienen un serial de 12 caracteres y los 4 últimos son el código del modelo.
  - Se decodificó con la tabla `modelinfo_autogen.h` de OpenCore. Resultado: #6 MacBook10,1; #7 y #32 MacBookPro15,4; #34 MacBookAir6,2; #38 MacBookPro14,1.
  - Así se eligió, por ejemplo, el MacBook Pro 2019 de **dos** puertos y no el de cuatro.
- **Datos que no se inventaron**:
  - El grosor del iMac: Apple no lo publica y queda vacío.
  - Los colores del MacBook Air 2014: su ficha no lista acabados. La publicación usa el color del inventario.

## Modelos cargados

| Modelo | Ficha oficial | Identificador | Salió con | Último macOS | Otras fuentes |
|---|---|---|---|---|---|
| MacBook Air (13 pulgadas, M5) | [126320](https://support.apple.com/es-lamr/126320) | Mac17,3 | macOS Tahoe 26 | macOS 27 Golden Gate | — |
| MacBook Air (15 pulgadas, M5) | [126321](https://support.apple.com/es-lamr/126321) | Mac17,4 | macOS Tahoe 26 | macOS 27 Golden Gate | — |
| MacBook Pro (14 pulgadas, M5 Pro) | [126318](https://support.apple.com/es-lamr/126318) | Mac17,7 / Mac17,9 (según el chip) | macOS Tahoe 26 | macOS 27 Golden Gate | — |
| MacBook Neo (13 pulgadas, A18 Pro) | [126322](https://support.apple.com/es-lamr/126322) | **falta** | macOS Tahoe 26 | macOS 27 Golden Gate | Touch ID: macrumors.com y Apple Newsroom |
| MacBook Pro (14 pulgadas, M5) | [125405](https://support.apple.com/es-lamr/125405) | Mac17,2 | macOS Tahoe 26 | macOS 27 Golden Gate | — |
| MacBook Air (13 pulgadas, M4, 2025) | [122209](https://support.apple.com/es-lamr/122209) | Mac16,12 | macOS Sequoia 15 | macOS 27 Golden Gate | — |
| MacBook Air (15 pulgadas, M4, 2025) | [122210](https://support.apple.com/es-lamr/122210) | Mac16,13 | macOS Sequoia 15 | macOS 27 Golden Gate | — |
| iMac (24 pulgadas, 2024, dos puertos) | [121556](https://support.apple.com/es-lamr/121556) | Mac16,2 | macOS Sequoia 15 | macOS 27 Golden Gate | — |
| iMac (24 pulgadas, 2024, cuatro puertos) | [121557](https://support.apple.com/es-lamr/121557) | Mac16,3 | macOS Sequoia 15 | macOS 27 Golden Gate | — |
| MacBook Air (13 pulgadas, M3, 2024) | [118551](https://support.apple.com/es-lamr/118551) | Mac15,12 | macOS Sonoma 14 | macOS 27 Golden Gate | — |
| MacBook Pro (14 pulgadas, M3 Pro, noviembre de 2023) | [117736](https://support.apple.com/es-lamr/117736) | Mac15,6 / 15,8 / 15,10 | macOS Sonoma 14 | macOS 27 Golden Gate | — |
| MacBook Pro (16 pulgadas, M3 Pro, noviembre de 2023) | [117737](https://support.apple.com/es-lamr/117737) | Mac15,7 / 15,9 / 15,11 | macOS Sonoma 14 | macOS 27 Golden Gate | — |
| MacBook Pro (13 pulgadas, 2019, dos puertos Thunderbolt 3) | [111945](https://support.apple.com/es-lamr/111945) | MacBookPro15,4 · A2159 | macOS Mojave 10.14 | macOS Sequoia 15 | everymac.com |
| MacBook Pro (13 pulgadas, 2017, dos puertos Thunderbolt 3) | [111951](https://support.apple.com/es-lamr/111951) | MacBookPro14,1 · A1708 | macOS Sierra 10.12 | macOS Ventura 13 | everymac.com |
| MacBook (Retina, 12 pulgadas, 2017) | [111986](https://support.apple.com/es-lamr/111986) | MacBook10,1 · A1534 | macOS Sierra 10.12 | macOS Ventura 13 | everymac.com |
| MacBook Air (13 pulgadas, principios de 2014) | [111944](https://support.apple.com/es-lamr/111944) | MacBookAir6,2 · A1466 | OS X Mavericks 10.9 | macOS Big Sur 11 | everymac.com |

## Unidades en stock y su modelo

Detección automática (`ModeloReferencia::deInventario`): cruza la línea, el chip, las pulgadas y el año del nombre y del procesador, y confirma que la RAM y el almacenamiento existan en ese modelo. Si queda más de un candidato, no elige: lo decide el admin en el editor.

| Unidad | Inventario | Modelo |
|---|---|---|
| #4 | MacBook Air 13" · M3 · 8 GB · 256 GB | MacBook Air (13 pulgadas, M3, 2024) |
| #5 | MacBook Air 15" · M4 · 16 GB · 256 GB | MacBook Air (15 pulgadas, M4, 2025) |
| #6 | MacBook Retina 2017 · Core i5 · 8 GB · 512 GB | MacBook (Retina, 12 pulgadas, 2017) |
| #7 | MacBook Pro 2019 · Core i5 · 8 GB · 256 GB | MacBook Pro (13 pulgadas, 2019, dos puertos) |
| #22, #27, #28, #29 | MacBook Air 15" · M5 · 16 o 24 GB · 512 GB | MacBook Air (15 pulgadas, M5) |
| #25 | MacBook Neo 13" · A18 Pro · 8 GB · 256 GB | MacBook Neo |
| #31 | MacBook Pro · M5 · 16 GB · 1 TB | MacBook Pro (14 pulgadas, M5) |
| #32 | MacBook Pro 2019 13" · i5 de 4 núcleos · 16 GB · 512 GB | MacBook Pro (13 pulgadas, 2019, dos puertos) |
| #33 | MacBook Pro 14" · M5 Pro · 24 GB · 1 TB | MacBook Pro (14 pulgadas, M5 Pro) |
| #34 | MacBook Air 13" · Core i7 1.7 GHz · 8 GB · 256 GB | MacBook Air (13 pulgadas, principios de 2014) |
| #38 | MacBook Pro 13" 2017 · Core i5 de 2 núcleos · 8 GB · 256 GB | MacBook Pro (13 pulgadas, 2017, dos puertos) |
| #39 | MacBook Air 13" · M4 · 16 GB · 256 GB | MacBook Air (13 pulgadas, M4, 2025) |
| #10 | Lenovo IdeaPad Gaming 3 · Ryzen 7 · 16 GB · 512 GB | Lenovo IdeaPad Gaming 3 15ARH7 (MTM 82SB00K9US) |

**Las elige el admin** (se cargaron los dos modelos posibles):

| Unidad | Inventario | Por qué no se elige sola |
|---|---|---|
| #9 | MacBook Pro · M3 Pro · 18 GB · 512 GB | El nombre no dice si es de 14 o de 16 pulgadas, y las dos existen con esa configuración. |
| #23 | MacBook Air · M5 · 24 GB · 512 GB | No dice si es de 13 o de 15 pulgadas. |
| #30 | iMac 24" · M4 · 16 GB · 256 GB · celeste | Hay iMac de dos y de cuatro puertos con esa configuración; se ve en la parte de atrás. |

**Hay que revisar el inventario**: **#26**, un MacBook Pro «M5 Pro · 24 GB · 512 GB». El M5 Pro no se vende con 512 GB (empieza en 1 TB). Puede ser un MacBook Pro de 14 pulgadas con M5, o el almacenamiento está mal cargado. No se enlaza a ningún modelo hasta corregirlo.

**Números de serie para revisar**: las Mac con chip de Apple tienen 10 caracteres y las Intel, 12. Hay seriales de 9 caracteres (#22, #23), de 11 (#25 a #31 y #33) y de 13 (#38). Los de 11 o 13 suelen traer la «S» del código de barras de la caja. No se cambió nada.

## Lenovo IdeaPad Gaming 3 15ARH7 (MTM 82SB00K9US), la #10

El usuario pasó una foto de la etiqueta de abajo. Dice:
- modelo IdeaPad Gaming 3 15ARH7, MTM 82SB00K9US;
- fabricada el 2023-02-21;
- entrada de 20 V ⎓ 8,5 A, es decir, 170 W.

La ASUS ROG Strix (#13) está vendida y el usuario dijo que no hace falta su ficha.

- **Una ficha por configuración.** La 15ARH7 se vendió con cuatro procesadores, cinco tarjetas gráficas, tres pantallas y dos baterías. Por eso la ficha es la del MTM exacto, no la de la familia.
- **Fuentes, en este orden:**
  1. **lenovo.com (EE. UU.)**, la página del número de parte 82SB00K9US: la configuración exacta. La tabla del MTM viene en los datos de la página. PSREF arma sus páginas con JavaScript y no se pudieron leer.
  2. **PSREF de Lenovo**, el PDF de la plataforma del 14 de diciembre de 2023. De ahí salen:
     - procesador y gráfica: núcleos, caché y TGP;
     - memoria y almacenamiento: monitores externos y ranuras;
     - puertos, cámara y audio;
     - autonomía, medidas, material y seguridad.
  3. **Otras que coinciden:**
     - laptoparena.net: teclado blanco, Wi‑Fi 6 2×2, Bluetooth 5.1 y 45 % NTSC;
     - mundolaptops.com: 4 celdas, teclado numérico y Windows 11 Home;
     - varias tiendas venden el 82SB00K9US con la misma configuración.
- **El inventario coincide:** Ryzen 7, 16 GB, 512 GB y color negro (Onyx Grey).

| Dato | Valor | Fuente |
|---|---|---|
| Procesador | AMD Ryzen 7 7735HS: 8 núcleos, 16 hilos, 3,2 a 4,75 GHz, 16 MB de caché L3 | lenovo.com y PSREF |
| Tarjeta gráfica | NVIDIA GeForce RTX 4050 de 6 GB GDDR6, 85 W con Dynamic Boost 2.0; además, AMD Radeon 680M integrada | lenovo.com y PSREF |
| Memoria | 16 GB DDR5-4800 en 2 × 8 GB SO‑DIMM: las dos ranuras ocupadas | lenovo.com y PSREF |
| Almacenamiento | SSD de 512 GB NVMe M.2 2242 PCIe 4.0, QLC; queda libre una ranura M.2 2280 PCIe 4.0 | lenovo.com y PSREF |
| Pantalla | 15,6 pulgadas Full HD IPS antirreflejo, 120 Hz con AMD FreeSync, 250 nits, 45 % NTSC, contraste de 800:1 | lenovo.com y PSREF |
| Batería | 60 Wh y 4 celdas; hasta 13,1 h de video local en 1080p (7,8 h con MobileMark 2018); Rapid Charge Boost | lenovo.com y PSREF |
| Cargador | 170 W con conector slim tip | lenovo.com, PSREF y la etiqueta (20 V ⎓ 8,5 A) |
| Conectividad | Wi‑Fi 6 2×2, Bluetooth 5.1 y Gigabit Ethernet | lenovo.com, PSREF y el módulo RTL8852BE de la etiqueta |
| Puertos | Dos USB‑A 3.2 Gen 1, USB‑C 3.2 Gen 2 con DisplayPort 1.4 y Power Delivery 3.0, HDMI 2.0, RJ‑45 y audio de 3.5 mm | lenovo.com y PSREF |
| Teclado | Retroiluminado en blanco, con teclado numérico y distribución en inglés (EE. UU.) | lenovo.com y laptoparena.net |
| Medidas y peso | 35,96 × 26,64 cm y 2,18 a 2,59 cm de grosor; desde 2,4 kg | lenovo.com. PSREF da desde 2,32 kg; vale la de EE. UU., como con Apple |
| Sistema y seguridad | Windows 11 Home; TPM 2.0 por firmware y tapa de privacidad en la cámara; sin lector de huellas | lenovo.com y PSREF |
| Año | 2023: la RTX 4050 para laptops salió en febrero de 2023 y la unidad se fabricó el 2023-02-21 | la etiqueta |

- **Color:** Lenovo lo llama Onyx Grey (gris ónix). La publicación usa el del inventario («Negro») porque los nombres no coinciden; se puede cambiar en el editor.
- **Cómo se reconoce en el inventario:** por la línea «IdeaPad Gaming» y el procesador «Ryzen 7», con 16 GB y 512 GB. Si llega otra IdeaPad Gaming 3 con Ryzen 5 o con 8 GB, no se enlaza sola.

## Las fichas no se borran al vender

- La base de modelos no depende del stock. El seeder solo crea o actualiza por slug y nunca borra.
- La comparativa muestra los 16 modelos haya o no equipos.
- La publicación guarda su propia copia de la ficha. Al venderse el equipo, la publicación deja de ofrecerse, pero conserva su ficha y su enlace al modelo.
- Test: `ComparadorModelosTest::test_la_ficha_de_una_mac_prevalece_cuando_se_vende`.
