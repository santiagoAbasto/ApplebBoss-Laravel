# Capa de temporada (Navidad) — arquitectura

## Quién decide
`App\Support\Temporada` es el único lugar que resuelve si la campaña se ve y en qué superficie.

- Ajustes: claves `navidad_*` en `configuracion_tienda` (mismo modelo y caché que el resto de la configuración).
- `Temporada::activa()`: `apagado` → no; `manual` → sí; `programado` → `inicio <= ahora < fin`.
  Las fechas se guardan como hora local de `America/La_Paz` (`Y-m-d\TH:i`) y se convierten a instante al comparar
  con `now()` del servidor. No hay cron ni se usa la hora del navegador.
- `Temporada::superficie()`: rutas `admin.*` / `vendedor.*` (o URL `/admin`, `/vendedor`) → `admin`; el resto → `publico`.
- `Temporada::paraLaVista()`: devuelve `null` o `{nombre, superficie, intensidad, personajes, luces, animaciones,
  nieve, texto, enlace, vistaPrevia}`. La nieve, el texto y el enlace nunca salen en el panel.

## Cómo llega a la página
1. `HandleInertiaRequests` comparte la prop `temporada`.
2. `app.blade.php` escribe en `<html>`: `data-season="christmas"`, `data-season-surface`, `data-season-intensity` y
   `data-season-still` (sin animaciones). Apagada, no escribe nada.
3. `resources/js/temporada.js` repite esos atributos en cada navegación de Inertia (la tienda y el panel pueden
   tener la campaña distinta) y aplica la preferencia local «menos efectos».
4. `resources/css/navidad.css`: todas las reglas cuelgan de `html[data-season="christmas"]`.
   - Tienda: redefine los tokens que la tienda ya usa (`--ab-navy`, `--ab-lime`, `--surface-*`…).
   - Panel: redefine `--ab-acento` y pisa las clases de botón primario (`.bg-[#011446]`) dentro de `.ab-admin`.
5. `Components/Temporada/index.jsx`: las piezas que montan los layouts. Con `temporada === null` no dibujan nada,
   no registran listeners y `Personajes.jsx` no se descarga.

Los portales (búsqueda, diálogos) cuelgan de `<body>` y heredan del `<html>`.

## Apagar
- Botón «Apagar la campaña» o modo «Apagada» en *Tienda online → Campaña de Navidad* (`/admin/configuracion/navidad`).
- Efecto inmediato: se limpia la caché de configuración al guardar. No hay caché de página que invalidar.
- Sin el atributo en `<html>` ninguna regla de `navidad.css` aplica: no hace falta revertir commits.

## Vista previa
`POST /admin/configuracion/navidad/vista-previa` guarda los ajustes sin publicar en la sesión de quien los edita.
`Temporada::paraLaVista()` solo la respeta si el usuario tiene el permiso del módulo `tienda`. Ningún parámetro
de URL la activa y no se escribe nada en la base.

## Permisos y validación
- Rutas `admin.configuracion.navidad.*`: módulo `tienda` (PermisoMiddleware). Invitado → 404; otro rol → 403.
- Texto: sin HTML (`strip_tags`), 90 caracteres. Enlace: solo interno (`/…`, sin esquema ni `//`).
- No hay tabla de auditoría en el proyecto: cada cambio queda en `Log::info` con el id del usuario.

## Movimiento
Solo `transform`/`opacity`/`filter` en CSS, sin temporizadores de JS. Se apaga con cualquiera de: el interruptor
«Animaciones» del panel, el control «Reducir efectos de Navidad» (pie de la tienda y menú del panel; se guarda en
`localStorage`), o `prefers-reduced-motion`. La nieve (apagada por defecto) son 14 copos en CSS y no se monta en
checkout, pedido, seguimiento ni panel.

## Añadidos posteriores (13-11-2026)
- Claves nuevas: `navidad_musica` y `navidad_tapas` (por defecto encendidas). Salen en la prop `temporada` solo
  para la tienda (`musica`, `tapas`); en el panel valen siempre `false`.
- `resources/js/Components/Temporada/musica.js`: un `<audio>` único fuera de React (sobrevive a la navegación de
  Inertia). `temporada.js` lo importa de forma perezosa solo si la campaña trae música.
- `temporada.js` también pone `data-season-scrolled` en `<html>` al bajar (un listener pasivo que solo existe con
  la campaña encendida); `navidad.css` lo usa para recortar las luces del encabezado.
- Panel: `navidad.css` pisa las clases de color fijo de Tailwind (`bg-[#011446]`, `text-[#585E9F]`…) y los
  estilos en línea por su valor (`[style*="rgb(1, 20, 70)"]`), siempre dentro de
  `html[data-season][data-season-surface="admin"] .ab-admin`.
- Despliegue: los scripts de `scripts-servidor/` se copian con `scp` y se corren como archivo con `< /dev/null`.
  Pasados por la entrada estándar (`ssh … 'bash -s' < script`), `docker compose exec -T` se come el resto.
