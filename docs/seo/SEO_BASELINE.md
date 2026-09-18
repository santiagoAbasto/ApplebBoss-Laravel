# Línea base SEO — Apple Boss

**Fecha:** 18 de septiembre de 2026
**Stack verificado (Fase 0, sin suponer):** Laravel 13.32 · PHP 8.5 · Inertia.js 3 · React 19 · Vite 8 · PostgreSQL 18 · Docker · Cloudflare Tunnel.
**Renderizado:** SPA con Inertia. **No hay SSR.**
**Negocio:** tienda física en Cochabamba (Bolivia) + tienda en línea. Ficha de Google Business Profile activa (4,8 ★ · 72 opiniones · CID `9984482128729594095`).

> Método: todo lo de abajo está **verificado contra el sitio corriendo**, no supuesto. Cada hallazgo indica cómo se comprobó.

---

## 0. Resumen: por qué Google no muestra la web

La búsqueda «apple boss cochabamba» devuelve Facebook, Instagram y TikTok — **no el sitio**.

**Corrección importante:** el diagnóstico inicial (túneles temporales) correspondía al entorno **local**. El sitio **ya está publicado en `https://appleboss.com.bo`** con HTTPS válido, canonical correcto y sitemap con el dominio real. O sea: el dominio ya no es el problema.

Lo que **sí** sigue impidiendo que Google entienda el sitio, verificado pidiendo la home **como Googlebot**:

- El HTML llega con **30 caracteres de texto visible y 0 `<h1>`** (SPA sin SSR): Google recibe una página en blanco y depende de ejecutar JavaScript.
- **Cero datos estructurados** (ya corregido, ver §4).
- El `robots.txt` de producción **no declara el sitemap** (ya corregido en código, falta desplegar).

| # | Severidad | Hallazgo | Evidencia |
|---|-----------|----------|-----------|
| ~~H1~~ | ✅ Resuelto | ~~No existe dominio propio~~ → **el sitio ya está en producción en `https://appleboss.com.bo`** (HTTPS 200, `www` redirige 301 correctamente) | `dig` + `curl`: 200; `www` → 301 → raíz. *El diagnóstico inicial era del entorno local, que sí usaba Quick Tunnels* |
| **H1b** | 🟠 Alto | **Dominio duplicado roto:** `apple-boss.com.bo` (con guion) existe en DNS y devuelve **error 525**. `.env.production.example` apuntaba justamente ahí | `curl https://apple-boss.com.bo` → 525 |
| **H2** | 🟡 Medio (local) | `APP_URL=http://localhost:8010` en el entorno local → canonicals locales apuntan a localhost. **En producción el sitemap ya sale con el dominio correcto** | `src/.env` local vs sitemap de producción: `<loc>https://appleboss.com.bo/</loc>` |
| ~~H3~~ | 🟡 Medio (rebajado) | ~~El HTML llega vacío y Google no ve nada~~ → **Google sí renderiza el sitio.** El HTML servido trae 30 caracteres de texto, pero Search Console muestra la home **renderizada y completa**, indexada y con HTTPS válido | Inspección de URL en Search Console: «La URL está en Google» + HTML rastreado con el `<div id="app">` lleno (cabecera, productos, pie) |
| ~~H4~~ | ✅ Resuelto | ~~`public/robots.txt` estático tapaba al `RobotsController`~~ → se eliminó el archivo; producción ya sirve el controlador con `Sitemap:` y los `Disallow` correctos. El servido no bloquea `/admin` ni `/vendedor` y **no declara el Sitemap** | `curl /robots.txt` → `User-agent: *` / `Disallow:` (el controlador, bien hecho, nunca se sirve) |
| ~~H5~~ | ✅ Resuelto | ~~Cero datos estructurados~~ → `Store` + `WebSite` + `Product` + `BreadcrumbList`, impresos **en el servidor** | 1 bloque `application/ld+json` en el `<head>` de producción |
| **H6** | 🟠 Alto | **NAP incompleto e inconsistente** con Google Business Profile | BD: dirección «Cochabamba, Bolivia», teléfono `null`, horarios `null`. GBP: «Edificio Fidel Anze sobre la Melchor Urquidi», teléfono 75904313, abre 9:00 |
| **H7** | 🟠 Alto | **Sin analítica.** No hay GA4, ni GTM, ni ningún evento | Búsqueda de `gtag`/`GTM-`/`G-XXXX` en el HTML: solo hashes de Vite (falsos positivos) |
| ~~H8~~ | ✅ Resuelto | ~~Sin `og:image`~~ → en producción sale `https://appleboss.com.bo/images/LOGO.png` | `curl` a producción como Googlebot |
| ~~H9~~ | ✅ Resuelto | ~~Canonical usaba el host de la petición~~ → sale siempre de `SEO_PUBLIC_URL`. En producción: `https://appleboss.com.bo/` | `curl` a producción como Googlebot |
| **H10** | 🟡 Medio | Sitemap incluye **URLs con parámetros** (`/catalogo?categoria=…`) que duplican la categoría | sitemap en vivo (24 URLs) |
| **H11** | 🔴 Crítico | **El título indexado terminaba en «- Laravel»**: `Apple Boss — Tecnología Apple en Cochabamba **- Laravel**`. El servidor mandaba el título bien, pero React le pegaba la marca de respaldo. El build de producción no recibía `VITE_APP_NAME`, así que esa marca era `Laravel` | HTML rastreado en Search Console + `grep Laravel` dentro del bundle desplegado `app-BzVGhLvK.js` |
| **H12** | 🟠 Alto | **Dos negocios declarados.** El servidor emitía un `Store` y, al renderizar, `Home.jsx` inyectaba **otro** `Store` distinto. Con dos, Google no sabe cuál es el negocio real | HTML rastreado: el único `ld+json` visible era el del componente React, no el del servidor |
| **H13** | 🟡 Medio | **34 KB de rutas del panel en cada página pública.** Ziggy publicaba 206 rutas `admin.*` y 33 `vendedor.*` a cualquier visitante: peso muerto que retrasa la carga (y un problema de seguridad, ver `docs/seguridad`) | `GET /` anónimo: bloque Ziggy de 33,9 KB |
| ~~H14~~ | ✅ Verificado | ~~La URL del mapa tenía un enlace en formato Markdown pegado dentro~~ → en producción ya sale limpia | `curl` al HTML de producción: la URL del iframe es válida |

**Lo que sí está bien hoy:** `title` y `meta description` propios y descriptivos; `meta robots: index,follow`; `twitter:card`; sitemap dinámico que **no filtra** rutas privadas (checkout, pedidos, seguimiento, admin, login); `SeoHead` ya sabe emitir OG/Twitter/canonical; hay un CMS de SEO (`SeoPage`: title, description, og_image, canonical, noindex).

---

## 1. Renderizado: qué ve Google de verdad

**Corrección respecto de la primera versión de este documento.** Yo había concluido que Google recibía una página en blanco, midiendo el HTML que devuelve el servidor: 151.708 bytes con solo **30 caracteres de texto visible** y **0 `<h1>`**. Eso es cierto, pero **era la mitad del cuadro**.

La Inspección de URL de Search Console mostró lo otro:

- **«La URL está en Google» · «La página está indexada» · HTTPS válido.**
- El **HTML rastreado** trae el `<div id="app">` **completo**: cabecera, carrusel, fichas de producto con precios, pie de página.

O sea: **Googlebot ejecutó el JavaScript y renderizó el sitio entero.** La home está indexada.

**Qué significa para el proyecto:** el SSR **deja de ser el freno principal**. Baja de crítico a mejora de rendimiento. Sigue valiendo la pena por tres razones concretas, pero ninguna bloquea la indexación:

1. El renderizado va a una **segunda cola** de Google: las páginas nuevas tardan más en entrar.
2. Si el JavaScript falla o tarda, **esa** página queda sin contenido.
3. Las redes sociales y los buscadores de IA **no ejecutan JavaScript**: leen el HTML crudo. Hoy ven una página vacía.

El punto 3 es el que más pesa hoy, y **ya está parcialmente cubierto**: `title`, `description`, `og:image`, canonical y los datos estructurados se imprimen **en el servidor**, así que se leen sin JavaScript.

## 2. Corregido en esta pasada

| Qué | Cómo |
|-----|------|
| URL oficial única | `config/seo.php` + `App\Support\Seo\UrlPublica`: canonical, `og:url` y sitemap salen **siempre** del dominio configurado (`SEO_PUBLIC_URL`), nunca del host de la petición |
| `robots.txt` real | Se eliminó el `public/robots.txt` estático que tapaba al controlador. Ahora declara `Sitemap:` y cierra `/admin`, `/vendedor`, `/checkout`, `/pedido/`, `/seguimiento/`, `/api/` |
| Datos estructurados | `App\Support\Seo\DatosEstructurados`: `Store` (LocalBusiness) + `WebSite` + `Product` + `BreadcrumbList`, impresos **en el servidor** (los lee Google sin ejecutar JS) |
| Producto con datos reales | `Product`/`Offer` con precio del inventario, `InStock`/`OutOfStock` según disponibilidad real y `NewCondition`/`UsedCondition` según la condición comercial |
| Sin datos falsos | El JSON-LD **nunca** emite `aggregateRating`, `reviewCount` ni `ratingValue`; si falta teléfono o dirección, el campo simplemente no se publica |
| `og:image` por defecto | `SEO_OG_IMAGE`, con respaldo del logo |
| Dominio de producción | `.env.production.example` apuntaba a `apple-boss.com.bo` (roto, 525). Corregido a `appleboss.com.bo` |
| Título sin «- Laravel» | Doble arreglo: la marca de respaldo en `app.jsx` pasó de `Laravel` a `Apple Boss`, y `Dockerfile.production` ahora inyecta `VITE_APP_NAME` al build. Antes el build de producción no veía el `.env` y caía en el respaldo |
| Un solo negocio | Se quitó el `<script ld+json>` que `Home.jsx` inyectaba al renderizar. El `Store` queda solo en el servidor, y se le sumaron el **horario real** del panel y `hasMap` |
| Dirección honesta | `DatosEstructurados::calleReal()`: si la dirección guardada es solo «Cochabamba, Bolivia», **no** se publica como `streetAddress`. Cuando cargues la calle real, entra sola |
| Panel fuera del HTML público | `config/ziggy.php` grupo `publico` (`!admin.*`, `!vendedor.*`, `!automation.*`). Bloque de rutas: **33,9 KB → 5,1 KB**. Con sesión iniciada, el panel recibe la lista completa |
| Teléfono en formato internacional | `negocio()` ahora se arma sobre `StoreLocation::datosParaGoogle()`, que ya normaliza el teléfono (`+591…`) y agrupa el horario día por día |
| Cada local, un negocio | Si hay más de una sucursal encendida, cada una se declara como su propio `Store` |
| Pruebas | `SeoTecnicoTest` (**13 casos**) + `SeguridadHardeningTest` (3 sobre Ziggy) + `UbicacionesAdminTest` reapuntado al JSON-LD del servidor. Suite: **619 en verde** que vigilan robots, sitemap, canonical, JSON-LD, un único `Store`, la dirección honesta y la detección de dominios no indexables |

---

## 3. Lo que depende de datos o accesos que no tengo

Siguiendo la regla de **no inventar**:

| Necesito | Para qué | Estado |
|----------|----------|--------|
| Acceso a Google Search Console | Cobertura real, consultas, inspección de URL | ❌ Falta |
| ID de medición GA4 (`G-XXXXXXX`) | Analítica y conversiones | ❌ Falta |
| Confirmar dirección y teléfono exactos | `LocalBusiness` y consistencia NAP | ⚠️ Los tengo de tu ficha de Google; falta que los confirmes |
| URLs de tus perfiles oficiales | `sameAs` (Facebook, Instagram, TikTok, Google) | ⚠️ Los vi en la búsqueda; falta confirmarlos |
| GTIN / SKU de productos | `Product` completo y Merchant Center | ❌ Falta |
| Decisión sobre `apple-boss.com.bo` | Redirigir 301 al dominio bueno o soltarlo | ⚠️ Tuya |

---

## 4. Estado del plan

1. ✅ Inspección (Fase 0)
2. ✅ Diagnóstico de indexación (Fase 2)
3. ✅ Dominio canónico configurable, robots, sitemap
4. ✅ Datos estructurados + `og:image`
5. ⏳ SEO local (completar NAP con datos confirmados)
6. ⏳ GA4 (falta el ID)
7. ⏳ SSR o contenido crítico en HTML ← **ya NO es el freno**: Google renderiza e indexa (§1). Queda como mejora
8. 🔒 Search Console, keyword research con datos reales, Core Web Vitals de campo → bloqueados hasta tener accesos
