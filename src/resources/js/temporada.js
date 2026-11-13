// Campaña de temporada (Navidad): mantiene en <html> los mismos atributos que escribe el servidor en app.blade.php.
//
// El servidor decide (App\Support\Temporada) y manda la prop `temporada`; acá solo se refleja al navegar, porque
// Inertia cambia de página sin volver a pedir el HTML (y la tienda y el panel pueden tener la campaña distinta).
// Con la campaña apagada se quitan los atributos y ningún estilo de navidad.css queda aplicado.
import { router } from '@inertiajs/react';

// La música se carga aparte y solo si la campaña la trae: apagada, ese archivo ni se descarga
let musica = null;
function sincronizarMusica(activa) {
    if (!activa && !musica) return;
    (musica ??= import('./Components/Temporada/musica')).then((m) => m.prepararMusica(activa));
}

const CLAVE = 'appleboss:navidad-efectos';
const AVISO = 'appleboss:navidad-efectos-cambio';

/** ¿La persona pidió menos efectos? Se recuerda en su navegador. */
export function efectosReducidos() {
    try { return window.localStorage.getItem(CLAVE) === 'reducidos'; } catch { return false; }
}

export function guardarEfectos(reducidos) {
    try {
        if (reducidos) window.localStorage.setItem(CLAVE, 'reducidos');
        else window.localStorage.removeItem(CLAVE);
    } catch { /* sin almacenamiento, la preferencia dura lo que dure la página */ }
    document.documentElement.toggleAttribute('data-season-still', reducidos || ultima?.animaciones === false);
    window.dispatchEvent(new CustomEvent(AVISO, { detail: reducidos }));
}

export function alCambiarEfectos(fn) {
    const oir = (e) => fn(Boolean(e.detail));
    window.addEventListener(AVISO, oir);
    return () => window.removeEventListener(AVISO, oir);
}

let ultima = null;

// Al bajar por la página, las luces del encabezado dejan libre la columna del contenido (los 1224 px del centro)
// para no cruzarse con títulos ni formularios. Un solo listener pasivo, que solo existe con la campaña encendida.
let escuchandoScroll = false;
const alDesplazar = () => document.documentElement.toggleAttribute('data-season-scrolled', window.scrollY > 24);

function vigilarScroll(activo) {
    if (activo === escuchandoScroll) return;
    escuchandoScroll = activo;
    if (activo) {
        window.addEventListener('scroll', alDesplazar, { passive: true });
        alDesplazar();
    } else {
        window.removeEventListener('scroll', alDesplazar);
        document.documentElement.removeAttribute('data-season-scrolled');
    }
}

export function aplicarTemporada(temporada) {
    const html = document.documentElement;
    ultima = temporada ?? null;

    vigilarScroll(Boolean(temporada));
    sincronizarMusica(Boolean(temporada?.musica));

    if (!temporada) {
        ['data-season', 'data-season-surface', 'data-season-intensity', 'data-season-still'].forEach((a) => html.removeAttribute(a));
        return;
    }

    html.setAttribute('data-season', temporada.nombre);
    html.setAttribute('data-season-surface', temporada.superficie);
    html.setAttribute('data-season-intensity', temporada.intensidad);
    html.toggleAttribute('data-season-still', !temporada.animaciones || efectosReducidos());
    alDesplazar();
}

/** Se llama una vez al montar la app. */
export function iniciarTemporada(paginaInicial) {
    aplicarTemporada(paginaInicial?.props?.temporada);
    router.on('navigate', (evento) => aplicarTemporada(evento.detail.page.props.temporada));
}
