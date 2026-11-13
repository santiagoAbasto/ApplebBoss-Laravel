// Música de la campaña de Navidad: villancicos tradicionales (dominio público) sintetizados en el navegador.
// No hay archivo de audio: se generan con Web Audio, así no pesa nada ni depende de licencias.
//
// Reglas:
// · Los navegadores no dejan sonar nada antes de que la persona toque la página: arranca con su primer gesto.
// · Cada visitante puede apagarla; se recuerda en su navegador. Apagada, no se crea nada ni queda un temporizador.
// · Vive fuera de React: sigue sonando al cambiar de página y se calla al ocultar la pestaña.
const CLAVE = 'appleboss:navidad-musica';
const AVISO = 'appleboss:navidad-musica-cambio';

// [nota MIDI, tiempos]. 0 = silencio.
const E = 64, F = 65, G = 67, C = 60, D = 62, A = 69, B = 71, C5 = 72, FS = 66, D4 = 62;
const CASCABELES = [
    [E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 4],
    [F, 1], [F, 1], [F, 1.5], [F, 0.5], [F, 1], [E, 1], [E, 1], [E, 0.5], [E, 0.5], [E, 1], [D, 1], [D, 1], [E, 1], [D, 2], [G, 2],
    [E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 4],
    [F, 1], [F, 1], [F, 1.5], [F, 0.5], [F, 1], [E, 1], [E, 1], [E, 0.5], [E, 0.5], [G, 1], [G, 1], [F, 1], [D, 1], [C, 4], [0, 4],
];
const FELIZ_NAVIDAD = [
    [D4, 1], [G, 1], [G, 0.5], [A, 0.5], [G, 0.5], [FS, 0.5], [E, 1], [E, 1], [E, 1],
    [A, 1], [A, 0.5], [B, 0.5], [A, 0.5], [G, 0.5], [FS, 1], [D4, 1], [D4, 1],
    [B, 1], [B, 0.5], [C5, 0.5], [B, 0.5], [A, 0.5], [G, 1], [E, 1], [D4, 0.5], [D4, 0.5],
    [E, 1], [A, 1], [FS, 1], [G, 3], [0, 4],
];
const CANCIONES = [{ notas: CASCABELES, tempo: 132 }, { notas: FELIZ_NAVIDAD, tempo: 120 }];

let ctx = null;
let salida = null;
let reloj = null;
let cancion = 0;
let indice = 0;
let proxima = 0;
let disponible = false;   // el panel la encendió para esta página
let conGesto = false;     // la persona ya tocó la página

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

export function musicaApagada() {
    try { return window.localStorage.getItem(CLAVE) === 'apagada'; } catch { return false; }
}

export function sonando() {
    return Boolean(reloj);
}

function avisar() {
    window.dispatchEvent(new CustomEvent(AVISO, { detail: sonando() }));
}

export function alCambiarMusica(fn) {
    const oir = (e) => fn(Boolean(e.detail));
    window.addEventListener(AVISO, oir);
    return () => window.removeEventListener(AVISO, oir);
}

// Una nota de campanita: dos senos (fundamental y octava) con ataque corto y caída larga.
function campana(midi, cuando, dura) {
    [[1, 0.5], [2, 0.18], [3, 0.05]].forEach(([armonico, nivel]) => {
        const osc = ctx.createOscillator();
        const gan = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = hz(midi + 12) * armonico;
        gan.gain.setValueAtTime(0.0001, cuando);
        gan.gain.exponentialRampToValueAtTime(nivel, cuando + 0.012);
        gan.gain.exponentialRampToValueAtTime(0.0001, cuando + Math.max(0.5, dura * 1.6));
        osc.connect(gan).connect(salida);
        osc.start(cuando);
        osc.stop(cuando + Math.max(0.55, dura * 1.7));
    });
}

function programar() {
    const { notas, tempo } = CANCIONES[cancion];
    const tiempo = 60 / tempo;
    while (proxima < ctx.currentTime + 0.6) {
        const [midi, largo] = notas[indice];
        if (midi) campana(midi, proxima, largo * tiempo);
        proxima += largo * tiempo;
        indice += 1;
        if (indice >= notas.length) { indice = 0; cancion = (cancion + 1) % CANCIONES.length; break; }
    }
}

function arrancar() {
    if (reloj || !disponible || !conGesto || musicaApagada() || document.hidden) return;
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    if (!ctx) {
        ctx = new Contexto();
        salida = ctx.createGain();
        salida.gain.value = 0.16;   // de fondo: se oye, no tapa
        salida.connect(ctx.destination);
    }
    ctx.resume?.();
    proxima = ctx.currentTime + 0.15;
    reloj = window.setInterval(programar, 200);
    programar();
    avisar();
}

function parar() {
    if (!reloj) return;
    window.clearInterval(reloj);
    reloj = null;
    ctx?.suspend?.();
    avisar();
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
    const apagar = sonando();
    try {
        if (apagar) window.localStorage.setItem(CLAVE, 'apagada');
        else window.localStorage.removeItem(CLAVE);
    } catch { /* sin almacenamiento, vale para esta visita */ }
    conGesto = true; // el clic en el botón ya es un gesto
    if (apagar) parar(); else arrancar();
    avisar();
}
