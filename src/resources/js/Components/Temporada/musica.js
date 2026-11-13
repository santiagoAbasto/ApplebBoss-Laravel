// Música de la campaña de Navidad: la pista de la tienda (public/audio/navidad.mp3), en bucle y de fondo.
//
// Reglas:
// · Los navegadores no dejan sonar nada antes de que la persona toque la página: arranca con su primer gesto.
// · Cada visitante puede apagarla; se recuerda en su navegador.
// · El archivo no se descarga hasta que va a sonar: quien la tiene apagada no gasta datos en él.
// · Vive fuera de React: sigue sonando (sin volver a empezar) al cambiar de página y se calla al ocultar la pestaña.
const CLAVE = 'appleboss:navidad-musica';
const AVISO = 'appleboss:navidad-musica-cambio';
const PISTA = '/audio/navidad.mp3';
const VOLUMEN = 0.35;   // de fondo: se oye, no tapa

let audio = null;
let suena = false;
let disponible = false;   // el panel la encendió para esta página
let conGesto = false;     // la persona ya tocó la página

export function musicaApagada() {
    try { return window.localStorage.getItem(CLAVE) === 'apagada'; } catch { return false; }
}

export function sonando() {
    return suena;
}

function avisar() {
    window.dispatchEvent(new CustomEvent(AVISO, { detail: suena }));
}

export function alCambiarMusica(fn) {
    const oir = (e) => fn(Boolean(e.detail));
    window.addEventListener(AVISO, oir);
    return () => window.removeEventListener(AVISO, oir);
}

function crearAudio() {
    audio = new Audio();
    audio.preload = 'none';
    audio.loop = true;
    audio.volume = VOLUMEN;
    audio.src = PISTA;
    // El estado del botón sale de lo que de verdad pasa con el audio, no de lo que se intentó
    audio.addEventListener('playing', () => { suena = true; avisar(); });
    audio.addEventListener('pause', () => { suena = false; avisar(); });
    audio.addEventListener('error', () => { suena = false; avisar(); });
}

function arrancar() {
    if (suena || !disponible || !conGesto || musicaApagada() || document.hidden) return;
    if (!audio) crearAudio();
    // Si el navegador todavía no deja (falta un gesto), no pasa nada: se reintenta con el próximo
    audio.play().catch(() => { suena = false; avisar(); });
}

function parar() {
    if (audio && !audio.paused) audio.pause();
}

const alPrimerGesto = (evento) => {
    conGesto = true;
    ['pointerdown', 'keydown'].forEach((e) => window.removeEventListener(e, alPrimerGesto));
    // Si el primer gesto es sobre el propio botón de la música, decide ese clic (si no, arrancaría y se apagaría)
    if (evento?.target?.closest?.('.nv-musica')) return;
    arrancar();
};
const alOcultar = () => (document.hidden ? parar() : arrancar());
let escuchando = false;

/** La llama temporada.js en cada página: `activa` = la campaña tiene música y esta es la tienda. */
export function prepararMusica(activa) {
    disponible = Boolean(activa);
    if (disponible && !escuchando) {
        escuchando = true;
        if (!conGesto) ['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, alPrimerGesto, { passive: true }));
        document.addEventListener('visibilitychange', alOcultar);
    }
    if (!disponible && escuchando) {
        escuchando = false;
        ['pointerdown', 'keydown'].forEach((e) => window.removeEventListener(e, alPrimerGesto));
        document.removeEventListener('visibilitychange', alOcultar);
    }
    if (disponible) arrancar(); else parar();
}

/** El botón del visitante: enciende o apaga, y lo recuerda. */
export function alternarMusica() {
    const apagar = suena;
    try {
        if (apagar) window.localStorage.setItem(CLAVE, 'apagada');
        else window.localStorage.removeItem(CLAVE);
    } catch { /* sin almacenamiento, vale para esta visita */ }
    conGesto = true; // el clic en el botón ya es un gesto
    if (apagar) parar(); else arrancar();
}
