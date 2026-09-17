# Modelos de referencia: datos pendientes

> Generado con `php artisan modelos:pendientes --markdown`. No se edita a mano: los pendientes viven en
> `src/database/data/modelos_referencia/*.php`, en la lista `pendientes` de cada modelo.

**31 pendientes en 27 modelos · 24 datos faltan · 7 por verificar.**

- **Falta el dato**: el campo está vacío; la ficha no lo muestra hasta conseguir la fuente.
- **Por verificar**: el dato está cargado y se muestra, pero no sale de la página oficial que se pegó; hay que confirmarlo.

## Cómo cerrar un pendiente

1. Buscar el dato en la fuente indicada (sitio oficial de Apple).
2. Cargar o corregir el valor en `datos` del modelo.
3. Quitar el pendiente de la lista `pendientes` de ese modelo.
4. Revisar con `php artisan modelos:verificar`, cargar con `php artisan db:seed --class=ModelosReferenciaSeeder` y volver a generar este archivo.

## Resumen por dato

| Dato | Falta el dato | Por verificar | Modelos |
|---|---|---|---|
| ficha.salidas | — | 2 | Adaptador de corriente dinámico de 40 W de Apple, Adaptador de corriente USB‑C de 20 W de Apple |
| ficha.puerto | 3 | — | Cargador de pared de 35 W, Cargador Gerlax de 45 W, Cable de carga rápida |
| ficha.potencia | 1 | — | Cargador de pared con pantalla LED |
| sistema.modelo | 9 | — | Protector de pantalla para iPad, Protector de pantalla para MacBook, Spigen Glas.tR EZ Fit, Funda con teclado para iPad Pro, Funda para iPad, Videojuego Gran Turismo, Pack de accesorios Gamefitz 10 en 1, Llavero localizador ACEFAST, Set de juguetes coleccionables Cars |
| ficha.wifi | — | 1 | Amazon Echo Dot Max |
| ficha.bluetooth | — | 1 | Amazon Echo Dot Max |
| ficha.dimensiones | — | 1 | Amazon Echo Dot Max |
| ficha.peso | — | 1 | Amazon Echo Dot Max |
| sistema.anio | 2 | — | Amazon Echo Dot, Amazon Echo Auto |
| ficha.control | — | 1 | Amazon Fire TV Stick 4K Select |
| ficha.fabricante | 1 | — | Control inalámbrico para PS4 |
| ficha.bateria | 1 | — | Batería externa |
| ficha.conectividad | 2 | — | Parlante con luces RGB, Audífonos |
| sistema.identificador | 1 | — | MacBook Neo (13 pulgadas, A18 Pro) |
| bateria.capacidad_mah_solo_esim | 2 | — | iPhone 18 Pro, iPhone 18 Pro Max |
| rendimiento.ram_gb | 1 | — | iPhone Duo |
| bateria.capacidad_mah | 1 | — | iPhone Duo |

## Por modelo

### Adaptador de corriente dinámico de 40 W de Apple (2025)

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.salidas (`ficha.salidas`) | Por verificar | 5 V ⎓ 3 A · 9 V ⎓ 3 A · 9 a 15 V ⎓ 2,67 A (AVS) · 15 a 20 V ⎓ 2 A (AVS) | Apple no publica las salidas en su página: salen de la etiqueta de la versión A3365 que midió ChargerLAB. Confirmar con la etiqueta de las unidades (A3351). | chargerlab.com: teardown del A3365 |

### Adaptador de corriente USB‑C de 20 W de Apple (2020)

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.salidas (`ficha.salidas`) | Por verificar | 5 V ⎓ 3 A · 9 V ⎓ 2,22 A | Apple no publica las salidas en su página: salen de la etiqueta que midió ChargerLAB (versión A2940). Confirmar con la etiqueta de las unidades. | chargerlab.com: review del A2940 |

### Cargador de pared de 35 W

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.puerto (`ficha.puerto`) | Falta el dato | — (vacío) | El nombre del inventario no dice qué conectores tiene (USB‑C, USB‑A o dos). | Revisar la unidad |

### Cargador Gerlax de 45 W

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.puerto (`ficha.puerto`) | Falta el dato | — (vacío) | El nombre del inventario no dice qué conectores tiene. | Revisar la unidad |

### Cargador de pared con pantalla LED

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.potencia (`ficha.potencia`) | Falta el dato | — (vacío) | El nombre del inventario no dice la potencia ni los conectores. | Revisar la unidad |

### Protector de pantalla para iPad

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.modelo (`sistema.modelo`) | Falta el dato | — (vacío) | El nombre del inventario no dice para qué iPad es. | Revisar la caja |

### Protector de pantalla para MacBook

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.modelo (`sistema.modelo`) | Falta el dato | — (vacío) | El nombre del inventario no dice para qué MacBook es. | Revisar la caja |

### Spigen Glas.tR EZ Fit

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.modelo (`sistema.modelo`) | Falta el dato | — (vacío) | El nombre del inventario no dice para qué iPhone es. | Revisar la caja |

### Funda con teclado para iPad Pro

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.modelo (`sistema.modelo`) | Falta el dato | — (vacío) | El nombre del inventario no dice para qué iPad Pro es ni cómo se conecta el teclado. | Revisar la caja |

### Funda para iPad

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.modelo (`sistema.modelo`) | Falta el dato | — (vacío) | El nombre del inventario no dice para qué iPad es. | Revisar la caja |

### Cable de carga rápida

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.puerto (`ficha.puerto`) | Falta el dato | — (vacío) | El nombre del inventario no dice qué conectores tiene. | Revisar la unidad |

### Amazon Echo Dot Max (2025)

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.wifi (`ficha.wifi`) | Por verificar | Wi‑Fi 6E | Amazon no lo detalla en sus anuncios: sale de reseñas. | soundguys.com y tomsguide.com |
| ficha.bluetooth (`ficha.bluetooth`) | Por verificar | 5.3 | Amazon no lo detalla en sus anuncios: sale de reseñas. | soundguys.com y tomsguide.com |
| ficha.dimensiones (`ficha.dimensiones`) | Por verificar | 10,8 × 10,8 × 9,9 cm | Sale de reseñas y fichas de terceros. | matteralpha.com y soundguys.com |
| ficha.peso (`ficha.peso`) | Por verificar | 505 g | Sale de reseñas y fichas de terceros. | matteralpha.com y soundguys.com |

### Amazon Echo Dot

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.anio (`sistema.anio`) | Falta el dato | — (vacío) | El inventario no dice la generación del Echo Dot: con ella se suma lo propio de cada una (sonido, sensores). | Etiqueta de la unidad o amazon.com |

### Amazon Echo Auto

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.anio (`sistema.anio`) | Falta el dato | — (vacío) | El inventario no dice la generación (la 2.ª es de 2022): con ella se suman los micrófonos y lo que trae la caja. | Etiqueta de la unidad o amazon.com |

### Amazon Fire TV Stick 4K Select (2025)

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.control (`ficha.control`) | Por verificar | Control remoto por voz con Alexa | La tabla de Amazon para desarrolladores no nombra el control: sale de reseñas que coinciden. | tomsguide.com y cnx-software.com |

### Control inalámbrico para PS4

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.fabricante (`ficha.fabricante`) | Falta el dato | — (vacío) | El nombre dice «Dualshock 4», pero no si son originales de Sony: si lo son, se carga la ficha oficial. | Revisar la caja y el número de modelo (CUH‑ZCT2) |

### Videojuego Gran Turismo

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.modelo (`sistema.modelo`) | Falta el dato | — (vacío) | El nombre del inventario no dice qué edición ni para qué consola es (por ejemplo, Gran Turismo 7 para PS5). | Revisar la caja |

### Pack de accesorios Gamefitz 10 en 1

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.modelo (`sistema.modelo`) | Falta el dato | — (vacío) | El nombre del inventario no dice para qué consola es ni qué trae el pack. | Revisar la caja |

### Batería externa

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.bateria (`ficha.bateria`) | Falta el dato | — (vacío) | El nombre del inventario no dice la capacidad. | Revisar la unidad |

### Parlante con luces RGB

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.conectividad (`ficha.conectividad`) | Falta el dato | — (vacío) | El nombre del inventario no dice cómo se conecta (Bluetooth o cable). | Revisar la unidad |

### Llavero localizador ACEFAST

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.modelo (`sistema.modelo`) | Falta el dato | — (vacío) | ACEFAST tiene varios modelos (S1 a S4) y con cada uno cambian la compatibilidad (app Buscar de Apple) y la batería. | Revisar la caja |

### Audífonos

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| ficha.conectividad (`ficha.conectividad`) | Falta el dato | — (vacío) | El nombre del inventario no dice si son con cable o inalámbricos. | Revisar la unidad |

### Set de juguetes coleccionables Cars

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.modelo (`sistema.modelo`) | Falta el dato | — (vacío) | El nombre del inventario no dice qué trae el set. | Revisar la caja |

### MacBook Neo (13 pulgadas, A18 Pro) (2026)

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| sistema.identificador (`sistema.identificador`) | Falta el dato | — (vacío) | Identificador del modelo (MacXX,X): Apple todavía no incluye al MacBook Neo en «Identificar el modelo». | support.apple.com (Identificar el modelo de MacBook) o everymac.com |

### iPhone 18 Pro (2026)

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| bateria.capacidad_mah_solo_esim (`bateria.capacidad_mah_solo_esim`) | Falta el dato | — (vacío) | Batería de las unidades solo eSIM (EE. UU. y Canadá). MacRumors (2026-09-10) dice que todavía no está confirmada; gsmarena.com y Wikipedia dan 4.288 mAh, de registros previos al lanzamiento. | Desmontaje del iPhone 18 Pro solo eSIM (ifixit.com) o macrumors.com |

### iPhone 18 Pro Max (2026)

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| bateria.capacidad_mah_solo_esim (`bateria.capacidad_mah_solo_esim`) | Falta el dato | — (vacío) | Batería de las unidades solo eSIM (EE. UU. y Canadá). MacRumors (2026-09-10) dice que todavía no está confirmada; gsmarena.com y Wikipedia dan 5.567 mAh, de registros previos al lanzamiento. | Desmontaje del iPhone 18 Pro Max solo eSIM (ifixit.com) o macrumors.com |

### iPhone Duo (2026)

| Dato | Estado | Valor actual | Qué hay que confirmar | Fuente |
|---|---|---|---|---|
| rendimiento.ram_gb (`rendimiento.ram_gb`) | Falta el dato | — (vacío) | RAM: Xcode 27 todavía no reconoce al Duo. MacRumors (2026-09-09) solo supone 12 GB porque tiene el mismo chip que el 18 Pro. | macrumors.com (RAM según Xcode) o desmontaje en ifixit.com |
| bateria.capacidad_mah (`bateria.capacidad_mah`) | Falta el dato | — (vacío) | Capacidad de la doble batería: Apple no la publica y las cifras que circulan no coinciden (entre 4.700 y 5.800 mAh). | Etiqueta de energía del iPhone Duo en las páginas de Apple de la UE, macrumors.com o ifixit.com |
