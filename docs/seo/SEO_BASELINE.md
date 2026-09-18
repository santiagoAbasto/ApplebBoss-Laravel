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
| **H3** | 🔴 Crítico | **El HTML llega prácticamente vacío**: 152 KB con **30 caracteres** de texto visible y **0 `<h1>`**. Todo el contenido lo pinta React | `curl /` + extracción de texto sin `<script>` |
| **H4** | 🟠 Alto | **`public/robots.txt` estático tapa al `RobotsController`.** El servido no bloquea `/admin` ni `/vendedor` y **no declara el Sitemap** | `curl /robots.txt` → `User-agent: *` / `Disallow:` (el controlador, bien hecho, nunca se sirve) |
| **H5** | 🟠 Alto | **Cero datos estructurados.** No hay `Organization`, `LocalBusiness`/`Store`, `Product`, `BreadcrumbList`, `WebSite` | 0 bloques `application/ld+json` en el `<head>` |
| **H6** | 🟠 Alto | **NAP incompleto e inconsistente** con Google Business Profile | BD: dirección «Cochabamba, Bolivia», teléfono `null`, horarios `null`. GBP: «Edificio Fidel Anze sobre la Melchor Urquidi», teléfono 75904313, abre 9:00 |
| **H7** | 🟠 Alto | **Sin analítica.** No hay GA4, ni GTM, ni ningún evento | Búsqueda de `gtag`/`GTM-`/`G-XXXX` en el HTML: solo hashes de Vite (falsos positivos) |
| **H8** | 🟡 Medio | **Sin `og:image`** → al compartir no se ve imagen | `<meta property="og:image">` ausente |
| **H9** | 🟡 Medio | Canonical usa el **host de la petición** (`http://127.0.0.1:8010`), no un dominio fijo | `<link rel="canonical">` en vivo |
| **H10** | 🟡 Medio | Sitemap incluye **URLs con parámetros** (`/catalogo?categoria=…`) que duplican la categoría | sitemap en vivo (24 URLs) |

**Lo que sí está bien hoy:** `title` y `meta description` propios y descriptivos; `meta robots: index,follow`; `twitter:card`; sitemap dinámico que **no filtra** rutas privadas (checkout, pedidos, seguimiento, admin, login); `SeoHead` ya sabe emitir OG/Twitter/canonical; hay un CMS de SEO (`SeoPage`: title, description, og_image, canonical, noindex).

---

## 1. El problema de fondo hoy: Google recibe una página en blanco

El sitio es una SPA de Inertia **sin SSR**. Pedida como Googlebot, la home devuelve 151.708 bytes de los cuales solo **30 son texto visible**, y **no hay ni un `<h1>`**. Todo el contenido viaja dentro del JSON de Inertia y lo pinta React en el navegador.

Google sí ejecuta JavaScript, pero:

- El renderizado va a una segunda cola, con retraso y presupuesto limitado.
- Si el JS falla, tarda o se bloquea, la página queda **sin contenido** para el índice.
- Las señales de estructura (encabezados, texto, enlaces internos) no existen en el HTML inicial.

Para una tienda que recién empieza a indexarse, esto es el mayor freno que queda.

**Las dos salidas, en orden de recomendación:**

1. **Inertia SSR** (lo correcto). Inertia 3.7 y React 19 ya lo soportan; falta el *entrypoint* `resources/js/ssr.jsx` y un proceso Node en producción. Google recibiría el HTML completo.
2. **Contenido crítico renderizado en Blade** (paliativo). Servir en el HTML inicial el `<h1>`, el texto clave y los enlaces principales. Debe ser **el mismo contenido** que ve la persona: si difiere, es *cloaking* y Google penaliza.

---

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
| Pruebas | `SeoTecnicoTest`: 10 casos que vigilan robots, sitemap, canonical, JSON-LD y detección de dominios no indexables |

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
7. ⏳ SSR o contenido crítico en HTML ← **el freno principal**
8. 🔒 Search Console, keyword research con datos reales, Core Web Vitals de campo → bloqueados hasta tener accesos
