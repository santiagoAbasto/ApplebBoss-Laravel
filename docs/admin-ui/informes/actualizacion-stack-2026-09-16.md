# Actualización del stack (2026-09-16)

El usuario pidió llevar el stack «a lo último que está, sin romper absolutamente nada». Se actualizó por pasos y cada
paso se verificó antes de seguir. No hay commit.

## Qué cambió

| Pieza | Antes | Ahora |
|---|---|---|
| PHP (imagen de Docker) | 8.3 | **8.5.10** (`php:8.5-apache`) |
| Laravel | 12.20 | **13.32** |
| Inertia (Laravel / React) | 2.0 / 2.3 | **3.3 / 3.7** |
| React | 18.3 | **19.3** |
| Vite / plugin de React / plugin de Laravel | 6.4 / 4.7 / 1.3 | **8.3 / 6.1 / 3.2** |
| PHPUnit / Tinker | 11.5 / 2.10 | **12.5 / 3.0** |
| framer-motion / lucide-react | 12.40 / 0.511 | **13.4 / 1.46** |
| PostgreSQL | 15 | **18.6** |
| n8n (y su `pg_dump`) | 2.25.7 (15) | **2.39.6** (18.6) |
| Resto de PHP y JS | — | última versión compatible (Sanctum 4.3, Dompdf 3.1.6, Ziggy 2.6.4, axios 1.20…) |

**A propósito, no se tocó:**
- **Tailwind CSS se queda en la 3.4.19** (la última de la 3). La 4 exige Safari 16.4: la tienda se vería rota en iPhone
  con iOS anterior (iPhone 7, 6s y SE de 1.ª generación no pasan de iOS 15). Si algún día se acepta dejar esos equipos
  afuera, se puede migrar.
- `node:24` ya es la LTS vigente. `cloudflared` del túnel rápido sigue fijo en 2025.10.1 por el problema anotado en
  `docker-compose.yml`.

## Ajustes que hicieron falta

1. **Inertia 3 (head):** las etiquetas SEO de `resources/views/app.blade.php` pasan de `inertia` a `data-inertia`; así
   `<SeoHead>` las reemplaza al navegar y no se duplican. Tres tests comparaban `<title inertia>`.
2. **Vite 8 (navegadores):** su objetivo por defecto es Safari 16.4. `vite.config.js` fija el de Vite 6
   (`es2020`, `safari14`, `chrome87`, `firefox78`, `edge88`).
3. **Vite 8 (CSS):** Lightning CSS reescribía listas de fuentes para esos navegadores. `build.cssMinify: 'esbuild'` deja
   el CSS igual que antes (esbuild se instaló como dependencia de desarrollo; Vite 8 lo marca como obsoleto a futuro).
4. **Inertia 3 usa es-toolkit, que llama a `Object.hasOwn`** (Safari 15.4). `resources/js/polyfills.js`, importado
   primero en `app.jsx`, lo agrega en iOS 14 a 15.3.
5. **PHP 8.5:** `imagedestroy()` es obsoleto (no hace nada desde PHP 8.0); en `ProcesaImagenes` se reemplazó por `unset()`.
6. **Composer:** `php` pasa a `^8.3` (mínimo de Laravel 13) y `config.platform.php` a 8.3.0: las dependencias quedan
   instalables en cualquier servidor con PHP 8.3 o más, aunque Docker corra 8.5 (Symfony queda en 7.4 LTS).
7. **PostgreSQL 18** guarda los datos en `/var/lib/postgresql/18/docker`: el servicio `db` monta un volumen nuevo,
   `appleboss_db_data_pg18`, en `/var/lib/postgresql`.

**Lo que se revisó y no hizo falta cambiar:** la caché guarda solo arreglos (la opción nueva `serializable_classes` no
afecta), la app ya define su prefijo de caché y el nombre de la cookie de sesión (nadie pierde la sesión), no hay
referencias a `VerifyCsrfToken`, anotaciones viejas de PHPUnit ni APIs que React 19 eliminó, y los 161 íconos de lucide
que usa la app existen en la 1.46.

## Cómo se verificó

- **563 tests** en cada paso. Con Inertia 3 las aserciones bajan de 5.426 a 5.088 porque su `assertInertia` las cuenta
  distinto; se comprobó con tests a propósito fallidos que siguen fallando cuando deben.
- **Build** en cada paso, y un conteo de APIs modernas en el JS y el CSS publicado (lo que usa iOS viejo).
- **120 capturas antes/después** (21 páginas de la tienda en escritorio y celular, 67 pantallas del panel admin y del
  vendedor con los datos reales): estilos calculados y posición de cada elemento, etiquetas del `<head>`, errores de
  consola e imagen. Las pantallas del panel se generaron dentro del proceso con el usuario en el guard y todo en una
  transacción que se deshace (sin iniciar sesión ni credenciales), y se borraron al terminar. Resultado final: iguales,
  salvo animaciones de entrada, un carrusel y el foco de un campo (ya cambiaban entre dos capturas «antes») y el trazo
  interno de algunos íconos de lucide 1 (mismo tamaño y lugar).
- **21 interacciones en navegador:** navegación de Inertia sin recargar (título y SEO sin duplicados), volver atrás, menú
  del celular, carrito, buscador, Trade-In, menú de usuario, aviso de cerrar sesión (Seguir trabajando y Escape), grupos
  del menú, un formulario con `useForm`, modal de Headless UI y menú lateral del vendedor en celular. Sin errores de JS.
- **CSRF con Laravel 13:** un POST del navegador como lo manda Inertia 3 pasa; sin token o desde otro sitio da 419
  (probado con el campo trampa del newsletter: no se guardó nada).
- **Avisos de obsolescencia de PHP 8.5:** ninguno al renderizar la tienda ni las 67 pantallas del panel.
- **PostgreSQL 18:** copia completa con `pg_dumpall` (app en mantenimiento, cola y n8n detenidos) y restauración.
  Coinciden los conteos de las 50 tablas, las 45 secuencias, 50 claves primarias, 34 foráneas, 33 únicas, 15 CHECK y 27
  índices. El respaldo diario de n8n (`pg_dump` 18) se probó contra la base nueva.
- `composer audit` y `npm audit`: sin vulnerabilidades.

## Respaldo y vuelta atrás

En `backups/database/pre-actualizacion-2026-09-16/` (ignorado por git):
- `codigo.tar.gz`: `src/` (sin vendor ni node_modules), Dockerfile, `docker-compose.yml`, `docker/`, `n8n/` y docs, tal
  como estaban antes de empezar.
- `appleboss-pg15.dump`, `dumpall-pg15.sql` y `globales-pg15.sql`: la base en PostgreSQL 15.
- `conteos-*.txt` y `secuencias-*.txt`: los conteos usados para comparar.
- `n8n-data-2.25.7.tar.gz`: el volumen de n8n antes de actualizarlo.

El volumen viejo de PostgreSQL 15 (`applebboss-laravel_appleboss-laravel_db_data`) quedó intacto. Para volver: en
`docker-compose.yml`, `image: postgres:15` y el volumen `appleboss-laravel_db_data:/var/lib/postgresql/data`; en el
Dockerfile, `php:8.3-apache`; y los `composer.json`/`package.json` y sus lock del tar. Cuando todo esté probado en uso
real, el volumen viejo se puede borrar con `docker volume rm applebboss-laravel_appleboss-laravel_db_data`.
