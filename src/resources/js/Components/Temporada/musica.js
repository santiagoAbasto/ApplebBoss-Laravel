// Música de la campaña de Navidad: un villancico tradicional (dominio público) en versión pop, sintetizado en el navegador.
// No hay archivo de audio: se generan con Web Audio, así no pesa nada ni depende de licencias.
//
// Reglas:
// · Los navegadores no dejan sonar nada antes de que la persona toque la página: arranca con su primer gesto.
// · Cada visitante puede apagarla; se recuerda en su navegador. Apagada, no se crea nada ni queda un temporizador.
// · Vive fuera de React: sigue sonando al cambiar de página y se calla al ocultar la pestaña.
const CLAVE = 'appleboss:navidad-musica';
const AVISO = 'appleboss:navidad-musica-cambio';

// «Jingle Bells» (tradicional, dominio público) en versión pop: bombo a cuatro tiempos, palmas, platillos,
// bajo que rebota, acordes punteados a contratiempo y la melodía con un sintetizador brillante y eco.
// Todo cuantizado en semicorcheas (16 por compás). [nota MIDI, tiempos]; 0 = silencio.
const G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74, E5 = 76, F5 = 77, G5 = 79, A5 = 81;
const ESTROFA = {
    melodia: [
        [G4, 1], [E5, 1], [D5, 1], [C5, 1], [G4, 3], [G4, 0.5], [G4, 0.5], [G4, 1], [E5, 1], [D5, 1], [C5, 1], [A4, 4],
        [A4, 1], [F5, 1], [E5, 1], [D5, 1], [B4, 4], [G5, 1], [G5, 1], [F5, 1], [D5, 1], [E5, 4],
        [G4, 1], [E5, 1], [D5, 1], [C5, 1], [G4, 3], [G4, 0.5], [G4, 0.5], [G4, 1], [E5, 1], [D5, 1], [C5, 1], [A4, 4],
        [A4, 1], [F5, 1], [E5, 1], [D5, 1], [G5, 1], [G5, 1], [G5, 1], [G5, 1], [A5, 1], [G5, 1], [F5, 1], [D5, 1], [C5, 2], [G5, 2],
    ],
    acordes: ['C', 'C', 'C', 'F', 'Dm', 'G', 'G', 'C', 'C', 'C', 'C', 'F', 'Dm', 'G', 'G', 'C'],
};
const ESTRIBILLO = {
    melodia: [
        [E5, 1], [E5, 1], [E5, 2], [E5, 1], [E5, 1], [E5, 2], [E5, 1], [G5, 1], [C5, 1.5], [D5, 0.5], [E5, 4],
        [F5, 1], [F5, 1], [F5, 1.5], [F5, 0.5], [F5, 1], [E5, 1], [E5, 1], [E5, 0.5], [E5, 0.5], [E5, 1], [D5, 1], [D5, 1], [E5, 1], [D5, 2], [G5, 2],
        [E5, 1], [E5, 1], [E5, 2], [E5, 1], [E5, 1], [E5, 2], [E5, 1], [G5, 1], [C5, 1.5], [D5, 0.5], [E5, 4],
        [F5, 1], [F5, 1], [F5, 1.5], [F5, 0.5], [F5, 1], [E5, 1], [E5, 1], [E5, 0.5], [E5, 0.5], [G5, 1], [G5, 1], [F5, 1], [D5, 1], [C5, 4],
    ],
    acordes: ['C', 'C', 'C', 'C', 'F', 'C', 'Dm', 'G', 'C', 'C', 'C', 'C', 'F', 'C', 'G', 'C'],
};
const ACORDES = { C: [60, 64, 67], F: [60, 65, 69], G: [59, 62, 67], Dm: [62, 65, 69] };
const BAJOS = { C: 36, F: 41, G: 43, Dm: 38 };
const TEMPO = 118;
const PASO = 60 / TEMPO / 4;   // una semicorchea

// Cada sección ya «compilada»: en qué semicorchea arranca cada nota de la melodía
const SECCIONES = [ESTROFA, ESTRIBILLO].map(({ melodia, acordes }) => {
    const notas = new Map();
    let paso = 0;
    melodia.forEach(([midi, tiempos]) => { if (midi) notas.set(Math.round(paso), [midi, tiempos * 4]); paso += tiempos * 4; });

    return { notas, acordes, pasos: acordes.length * 16 };
});

let ctx = null;
let salida = null;
let eco = null;
let ruido = null;
let reloj = null;
let seccion = 0;
let paso = 0;
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

/** Una voz: oscilador → (filtro) → envolvente → salida. Se libera sola al terminar. */
function voz({ tipo, frecuencia, cuando, dura, nivel, ataque = 0.005, filtro, a = salida, hasta }) {
    const osc = ctx.createOscillator();
    const gan = ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frecuencia, cuando);
    if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, cuando + dura);
    gan.gain.setValueAtTime(0.0001, cuando);
    gan.gain.exponentialRampToValueAtTime(nivel, cuando + ataque);
    gan.gain.exponentialRampToValueAtTime(0.0001, cuando + dura);
    let nodo = osc;
    if (filtro) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = filtro;
        osc.connect(f);
        nodo = f;
    }
    nodo.connect(gan).connect(a);
    osc.start(cuando);
    osc.stop(cuando + dura + 0.03);
}

/** Un golpe de ruido filtrado: palmas, platillos y cascabeles. */
function golpe({ cuando, dura, nivel, tipo, frecuencia, q = 1 }) {
    const fuente = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const gan = ctx.createGain();
    fuente.buffer = ruido;
    f.type = tipo;
    f.frequency.value = frecuencia;
    f.Q.value = q;
    gan.gain.setValueAtTime(nivel, cuando);
    gan.gain.exponentialRampToValueAtTime(0.0001, cuando + dura);
    fuente.connect(f).connect(gan).connect(salida);
    fuente.start(cuando, Math.random() * 0.5, dura + 0.02);
}

function tocarPaso(n, cuando) {
    const { notas, acordes } = SECCIONES[seccion];
    const enCompas = n % 16;
    const acorde = acordes[Math.floor(n / 16)];
    const estribillo = seccion === 1;

    // batería
    if (enCompas % 4 === 0) voz({ tipo: 'sine', frecuencia: 150, hasta: 46, cuando, dura: 0.16, nivel: 0.9 });
    if (enCompas === 4 || enCompas === 12) golpe({ cuando, dura: 0.13, nivel: 0.42, tipo: 'bandpass', frecuencia: 1700, q: 0.9 });
    if (enCompas % 2 === 0) golpe({ cuando, dura: 0.04, nivel: enCompas % 4 === 2 ? 0.16 : 0.07, tipo: 'highpass', frecuencia: 7500 });
    // cascabeles: en el estribillo, en cada semicorchea
    if (estribillo || enCompas % 4 === 2) golpe({ cuando, dura: 0.05, nivel: estribillo ? 0.07 : 0.05, tipo: 'bandpass', frecuencia: 9500, q: 7 });

    // bajo: tónica en los tiempos, octava a contratiempo
    if (enCompas % 4 === 0) voz({ tipo: 'triangle', frecuencia: hz(BAJOS[acorde] + 12), cuando, dura: 0.2, nivel: 0.42 });
    if (enCompas % 4 === 2) voz({ tipo: 'triangle', frecuencia: hz(BAJOS[acorde] + 24), cuando, dura: 0.12, nivel: 0.24 });

    // acordes punteados a contratiempo
    if (enCompas % 4 === 2) ACORDES[acorde].forEach((midi) => voz({ tipo: 'sawtooth', frecuencia: hz(midi + 12), cuando, dura: 0.18, nivel: 0.055, filtro: 2200 }));

    // melodía: dos osciladores apenas desafinados, con eco
    const nota = notas.get(n);
    if (nota) {
        const [midi, largo] = nota;
        const dura = Math.min(0.9, Math.max(0.16, largo * PASO * 0.9));
        voz({ tipo: 'square', frecuencia: hz(midi), cuando, dura, nivel: 0.1, filtro: 3400, a: eco });
        voz({ tipo: 'sawtooth', frecuencia: hz(midi) * 1.006, cuando, dura, nivel: 0.08, filtro: 3000, a: eco });
        voz({ tipo: 'sine', frecuencia: hz(midi + 12), cuando, dura: dura * 0.6, nivel: 0.05, a: eco });
    }
}

function programar() {
    while (proxima < ctx.currentTime + 0.35) {
        tocarPaso(paso, proxima);
        proxima += PASO;
        paso += 1;
        if (paso >= SECCIONES[seccion].pasos) { paso = 0; seccion = (seccion + 1) % SECCIONES.length; }
    }
}

function prepararAudio() {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return false;
    ctx = new Contexto();
    const compresor = ctx.createDynamicsCompressor();
    salida = ctx.createGain();
    salida.gain.value = 0.3;   // de fondo: se oye, no tapa
    salida.connect(compresor).connect(ctx.destination);
    // eco corto para la melodía
    eco = ctx.createGain();
    const retardo = ctx.createDelay(1);
    const vuelta = ctx.createGain();
    retardo.delayTime.value = PASO * 3;
    vuelta.gain.value = 0.26;
    eco.connect(salida);
    eco.connect(retardo).connect(vuelta).connect(retardo);
    vuelta.connect(salida);
    // un segundo de ruido blanco, que comparten palmas, platillos y cascabeles
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const datos = ruido.getChannelData(0);
    for (let i = 0; i < datos.length; i += 1) datos[i] = Math.random() * 2 - 1;

    return true;
}

function arrancar() {
    if (reloj || !disponible || !conGesto || musicaApagada() || document.hidden) return;
    if (!ctx && !prepararAudio()) return;
    ctx.resume?.();
    proxima = ctx.currentTime + 0.12;
    reloj = window.setInterval(programar, 120);
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
