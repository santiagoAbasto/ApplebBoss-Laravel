// Música de la campaña de Navidad: un villancico tradicional (dominio público) a ritmo de salay, sintetizado en el navegador.
// No hay archivo de audio: se generan con Web Audio, así no pesa nada ni depende de licencias.
//
// Reglas:
// · Los navegadores no dejan sonar nada antes de que la persona toque la página: arranca con su primer gesto.
// · Cada visitante puede apagarla; se recuerda en su navegador. Apagada, no se crea nada ni queda un temporizador.
// · Vive fuera de React: sigue sonando al cambiar de página y se calla al ocultar la pestaña.
const CLAVE = 'appleboss:navidad-musica';
const AVISO = 'appleboss:navidad-musica-cambio';

// «Jingle Bells» (tradicional, dominio público) a ritmo de SALAY, al estilo de Bolivia: charango rasgueado en
// «tán-taka», bombo, bajo de guitarra y la melodía en zampoña, con cascabeles para lo navideño.
// Es un arreglo propio: la melodía y los acordes son los del villancico, no los de ninguna canción con derechos.
// Todo cuantizado en semicorcheas (16 por compás de 4 tiempos). [nota MIDI, tiempos]; 0 = silencio.
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
const TEMPO = 132;   // el salay es rápido y saltado
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

// Rasgueo de charango: cinco cuerdas dobles, agudas, que no suenan a la vez sino barridas en unos milisegundos
function charango(acorde, cuando, fuerte) {
    const notas = [...ACORDES[acorde], ACORDES[acorde][0] + 12, ACORDES[acorde][1] + 12];
    notas.forEach((midi, i) => {
        const t = cuando + i * 0.006;
        voz({ tipo: 'triangle', frecuencia: hz(midi + 12), cuando: t, dura: 0.13, nivel: fuerte ? 0.075 : 0.045, ataque: 0.002 });
        voz({ tipo: 'sawtooth', frecuencia: hz(midi + 24), cuando: t, dura: 0.07, nivel: fuerte ? 0.022 : 0.013, ataque: 0.002, filtro: 5200 });
    });
    golpe({ cuando, dura: 0.03, nivel: fuerte ? 0.06 : 0.035, tipo: 'bandpass', frecuencia: 3200, q: 1.2 });   // el roce de la mano
}

// Zampoña: una nota soplada (ataque suave, un poco de aire al entrar) doblada a la octava, como tocan las tropas
function zampona(midi, cuando, dura) {
    voz({ tipo: 'sine', frecuencia: hz(midi), cuando, dura, nivel: 0.2, ataque: 0.03, a: eco });
    voz({ tipo: 'triangle', frecuencia: hz(midi + 12), cuando, dura: dura * 0.9, nivel: 0.085, ataque: 0.035, a: eco });
    voz({ tipo: 'sine', frecuencia: hz(midi) * 2.01, cuando, dura: dura * 0.7, nivel: 0.03, ataque: 0.04, a: eco });
    golpe({ cuando, dura: 0.07, nivel: 0.07, tipo: 'bandpass', frecuencia: 2600, q: 1.5 });   // el soplido
}

/**
 * Ritmo de salay (2/4, de Cochabamba): cada tiempo lleva la célula «tán-taka» —una corchea y dos
 * semicorcheas— en el charango, el bombo marca el tiempo y el bajo de guitarra alterna tónica y quinta.
 */
function tocarPaso(n, cuando) {
    const { notas, acordes } = SECCIONES[seccion];
    const enCompas = n % 16;
    const enTiempo = enCompas % 4 === 0;
    const sub = enCompas % 4;              // 0 = tán, 2 y 3 = ta-ka
    const tiempo = Math.floor(enCompas / 4);
    const acorde = acordes[Math.floor(n / 16)];
    const estribillo = seccion === 1;

    // bombo: grave y redondo en cada tiempo (más fuerte el primero de cada par), con el golpe de aro en el «taka»
    if (enTiempo) {
        voz({ tipo: 'sine', frecuencia: 120, hasta: 52, cuando, dura: 0.22, nivel: tiempo % 2 === 0 ? 0.9 : 0.55 });
        golpe({ cuando, dura: 0.05, nivel: 0.12, tipo: 'lowpass', frecuencia: 500 });
    }
    if (sub === 2 || sub === 3) golpe({ cuando, dura: 0.035, nivel: sub === 2 ? 0.1 : 0.07, tipo: 'bandpass', frecuencia: 1100, q: 2 });

    // charango: tán-taka en todos los tiempos
    if (sub === 0) charango(acorde, cuando, true);
    if (sub === 2 || sub === 3) charango(acorde, cuando, false);

    // bajo de guitarra: tónica en un tiempo, quinta en el siguiente
    if (enTiempo) voz({ tipo: 'triangle', frecuencia: hz(BAJOS[acorde] + 12 + (tiempo % 2 === 0 ? 0 : 7)), cuando, dura: 0.24, nivel: 0.44 });

    // cascabeles suaves en cada tiempo: lo navideño (en el estribillo, también en el contratiempo)
    if (enTiempo || (estribillo && sub === 2)) golpe({ cuando, dura: 0.06, nivel: enTiempo ? 0.11 : 0.07, tipo: 'bandpass', frecuencia: 9000, q: 6 });

    // melodía en zampoña
    const nota = notas.get(n);
    if (nota) {
        const [midi, largo] = nota;
        zampona(midi, cuando, Math.min(0.75, Math.max(0.18, largo * PASO * 0.92)));
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
    retardo.delayTime.value = PASO * 2;   // una corchea
    vuelta.gain.value = 0.16;
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
