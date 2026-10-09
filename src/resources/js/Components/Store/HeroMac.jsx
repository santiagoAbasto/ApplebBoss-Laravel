import { Link, usePage } from '@inertiajs/react';
import {
    AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform,
} from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { money } from '@/Layouts/StoreLayout';
import { ArrowRight, Pause, Play } from '@/Components/Store/Icons';
import { esExterno } from '@/Components/Store/enlaces';
import { useNombreTienda } from '@/Components/Store/tienda';

/*
 * La portada grande. En computadora: el texto a la izquierda y, a la derecha, una MacBook Pro real, entera y con un
 * leve ángulo. En el celular: el texto arriba y la MacBook debajo.
 *
 * La MacBook se porta como una Mac: arranca con el logo de la tienda, arriba tiene su barra de menús con la hora, abajo
 * el Dock con las cuatro categorías (iPhone, Mac, Más Apple, MYSKIN) y en el centro una ventana de Safari con la foto de
 * estudio de la categoría, entera. Antes de cada cambio el cursor va al ícono del Dock, el ícono rebota y la ventana nueva
 * se abre desde ahí. Al costado, el destacado real de la categoría con su precio. Por todo el hero flotan, giran y laten
 * siluetas de lo que vende la tienda (iPhone, Android, plegables, iPad, Mac, PC, Watch, AirPods, audífonos, mandos,
 * cargadores), y siguen al mouse y al scroll por capas.
 *
 * Las imágenes (public/images/hero-mac-1) se generaron en Higgsfield y se recortaron: la pantalla de la MacBook es un
 * hueco transparente y lo de adentro se dibuja detrás, así la muesca y los bordes quedan encima. La foto de cada
 * categoría se cambia en Tienda online → Portada → «Portada grande» (ImagenPortadaService); la de la carpeta es la que
 * va si no hay una cargada. Si cambian las de la carpeta, van en una carpeta nueva: Cloudflare guarda los estáticos
 * varias horas.
 *
 * Lo que se lee sale de la tienda: el destacado, el texto de Portada → «Portada grande» y la frase de cada categoría.
 * Con «reducir movimiento» no hay arranque, cursor, vuelo, parallax ni avance automático.
 */

const CARPETA = '/images/hero-mac-1';
const MARCA = '/images/logo-appleboss-marca.png';
const DURACION = 6.5; // segundos por lámina
const SUAVE = [0.22, 1, 0.36, 1];

// El hueco de la pantalla dentro de macbook.webp (1813 × 1081), en porcentajes
const PANTALLA = { left: 10.5, top: 2.7, width: 79.3, height: 86.9 };

// Medidas dentro de la pantalla en «u»: 1 u es el 1 % de su ancho. La pantalla mide 100 × 65,4 u.
const ALTO_U = 100 / ((PANTALLA.width / PANTALLA.height) * (1813 / 1081));
const BARRA = 3.4;                                   // barra de menús
const VENTANA = { ancho: 70, arriba: BARRA + 2.2, barra: 3.6 };
const ALTO_VENTANA = VENTANA.ancho / 1.5 + VENTANA.barra; // la foto es 3:2 y va entera
const CENTRO_VENTANA = VENTANA.arriba + ALTO_VENTANA / 2;
const DOCK = { icono: 5.2, hueco: 1.2, borde: 0.9, abajo: 1.4 };

/** Centro del ícono i del Dock, en u. */
function centroIcono(i, n) {
    const total = n * DOCK.icono + (n - 1) * DOCK.hueco + 2 * DOCK.borde;
    return {
        x: 50 - total / 2 + DOCK.borde + DOCK.icono / 2 + i * (DOCK.icono + DOCK.hueco),
        y: ALTO_U - DOCK.abajo - DOCK.borde - DOCK.icono / 2,
    };
}

const LAMINAS = [
    { clave: 'iphone', label: 'iPhone',    hub: '/iphone', glow: '#E8742A', acento: '#FFB27A', elige: (p) => p.category === 'celulares',       frase: 'Nuevos y seminuevos' },
    { clave: 'mac',    label: 'Mac',       hub: '/mac',    glow: '#3E5BD8', acento: '#9EA5E8', elige: (p) => p.category === 'computadoras',    frase: 'Nuevas y seminuevas' },
    { clave: 'apple',  label: 'Más Apple', hub: '/apple',  glow: '#7B5BD6', acento: '#C4B5FD', elige: (p) => p.category === 'productos-apple', frase: 'iPad, Apple Watch y AirPods' },
    { clave: 'myskin', label: 'MYSKIN',    hub: '/myskin', glow: '#9DAA1F', acento: '#C6CB36', elige: (p) => p.is_myskin,                      frase: 'Protección premium · Bolivia' },
];

// Colores de la portada (Portada → «Portada grande» → Colores)
const TEMAS = {
    appleboss_navy: { oscuro: true, fondo: '#030A24' },
    myskin:         { oscuro: true, fondo: '#0E0820', glow: '#9DAA1F', acento: '#C6CB36' },
    light:          { oscuro: false, fondo: '#EEF0F6' },
};

/** Un enlace de la portada: una página de la tienda en la misma pestaña, otro sitio en una nueva. */
const destino = (url) => (esExterno(url) ? { href: url, target: '_blank', rel: 'noreferrer' } : { href: url });

const fotoDe = (p) => {
    const img = p?.images?.find((i) => i.es_principal) ?? p?.images?.[0];
    return img?.url_card ?? img?.url_medium ?? null;
};

/** Chip y capacidad del equipo (o los primeros datos de su ficha). Nunca un texto fijo. */
function datosDe(p) {
    const a = p?.atributos ?? {};
    const datos = [a.chip, a.capacidad ?? a.almacenamiento].filter(Boolean);
    return (datos.length ? datos : (p?.specs ?? []).slice(0, 2)).join(' · ');
}

function useMedia(consulta) {
    const [coincide, setCoincide] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches);
    useEffect(() => {
        const mq = window.matchMedia(consulta);
        const alCambiar = () => setCoincide(mq.matches);
        alCambiar();
        // Safari viejo no tiene addEventListener en MediaQueryList
        if (mq.addEventListener) mq.addEventListener('change', alCambiar); else mq.addListener(alCambiar);
        return () => (mq.removeEventListener ? mq.removeEventListener('change', alCambiar) : mq.removeListener(alCambiar));
    }, [consulta]);
    return coincide;
}

/* El ancho de la pantalla manda en todo lo que se dibuja adentro */
function useUnidad(ref) {
    const [u, setU] = useState(6);
    useEffect(() => {
        if (!ref.current || typeof ResizeObserver === 'undefined') return undefined;
        const obs = new ResizeObserver(([e]) => setU(e.contentRect.width / 100));
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, [ref]);
    return u;
}

/* La hora de la barra de menús, la de Bolivia */
function useHora() {
    const ahora = () => new Date().toLocaleString('es-BO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/La_Paz' }).replace(/,/g, '');
    const [hora, setHora] = useState(ahora);
    useEffect(() => {
        const t = setInterval(() => setHora(ahora()), 20000);
        return () => clearInterval(t);
    }, []);
    return hora;
}

/* ── Siluetas que flotan por todo el hero: todo lo que vende la tienda ── */
const SILUETAS = {
    iphone: <><rect x="15" y="4" width="18" height="40" rx="4.5" /><rect x="21" y="7" width="6" height="2" rx="1" fill="currentColor" stroke="none" /></>,
    iphoneDorso: <><rect x="15" y="4" width="18" height="40" rx="4.5" /><rect x="16.2" y="5.8" width="15.6" height="11.5" rx="3.6" /><circle cx="20" cy="9.3" r="1.9" /><circle cx="20" cy="14" r="1.9" /><circle cx="24.4" cy="11.6" r="1.9" /><circle cx="28.8" cy="8.6" r="0.9" fill="currentColor" stroke="none" /></>,
    android: <><rect x="14" y="4" width="20" height="40" rx="3" /><circle cx="24" cy="7.6" r="1.1" fill="currentColor" stroke="none" /><path d="M21 41h6" /></>,
    plegable: <><rect x="6" y="10" width="36" height="28" rx="3.5" /><path d="M24 11v26" strokeDasharray="2 2" /><rect x="34" y="13" width="3" height="1.4" rx="0.7" fill="currentColor" stroke="none" /></>,
    ipad: <><rect x="11" y="4" width="26" height="40" rx="3.5" /><circle cx="24" cy="6.6" r="0.7" fill="currentColor" stroke="none" /></>,
    macbook: <><rect x="9" y="9" width="30" height="21" rx="1.8" /><rect x="22" y="9" width="4" height="1.6" rx="0.6" fill="currentColor" stroke="none" /><path d="M4 32h40l-2 3.2H6z" /><path d="M21 32h6" /></>,
    imac: <><rect x="5" y="6" width="38" height="26" rx="2.5" /><path d="M5 27h38" /><path d="M20.5 32l-1.5 9h10l-1.5-9" /><path d="M16 41h16" /></>,
    pc: <><rect x="14" y="4" width="20" height="40" rx="2" /><circle cx="24" cy="30" r="5.5" /><path d="M18 9h12M18 13h12" /><circle cx="30" cy="40" r="0.7" fill="currentColor" stroke="none" /></>,
    laptop: <><rect x="8" y="10" width="32" height="21" rx="1.5" /><path d="M3 33h42v2.5a1.5 1.5 0 0 1-1.5 1.5h-39A1.5 1.5 0 0 1 3 35.5z" /></>,
    watch: <><rect x="14" y="13" width="20" height="22" rx="6" /><path d="M18 13l1-8h10l1 8M18 35l1 8h10l1-8" /><rect x="34" y="20" width="2.2" height="5" rx="1" /></>,
    airpods: <><circle cx="16" cy="15" r="4.5" /><path d="M14.5 18.8V33a1.5 1.5 0 0 0 3 0V19" /><circle cx="32" cy="15" r="4.5" /><path d="M33.5 18.8V33a1.5 1.5 0 0 1-3 0V19" /></>,
    audifonos: <><path d="M9 27v-4a15 15 0 0 1 30 0v4" /><rect x="5" y="25" width="9" height="14" rx="3.5" /><rect x="34" y="25" width="9" height="14" rx="3.5" /></>,
    mando: <><path d="M14 17h20a8 8 0 0 1 7.7 10.2l-2.3 8a4 4 0 0 1-7.1 1.3L29 32H19l-3.3 4.5a4 4 0 0 1-7.1-1.3l-2.3-8A8 8 0 0 1 14 17z" /><path d="M14 22v6M11 25h6" /><circle cx="32" cy="23" r="1.2" /><circle cx="35" cy="26.5" r="1.2" /></>,
    cargador: <><rect x="13" y="6" width="22" height="22" rx="4" /><rect x="20.5" y="15" width="7" height="2.4" rx="1.2" /><path d="M24 28v6c0 4 4 4 4 8" /></>,
    lapiz: <><path d="M10 38L34 14l3.5 3.5-24 24-5 1.5z" /><path d="M31 17l3.5 3.5" /></>,
};
const FORMAS = Object.keys(SILUETAS);

/* Reparte siluetas en una grilla con desplazamiento al azar (siempre el mismo azar: misma semilla), así llenan todo el
   hero sin amontonarse. */
function repartir(columnas, filas, semilla) {
    let a = semilla;
    const azar = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const lugares = [];
    for (let f = 0; f < filas; f++) {
        for (let c = 0; c < columnas; c++) {
            const i = lugares.length;
            lugares.push({
                s: FORMAS[(i * 7 + f) % FORMAS.length],
                x: ((c + 0.15 + azar() * 0.7) / columnas) * 100,
                y: ((f + 0.1 + azar() * 0.75) / filas) * 100,
                t: 20 + Math.round(azar() * 34),
                r: Math.round(azar() * 50 - 25),
                d: 0.3 + azar() * 1,
                gira: azar() < 0.32,
                flota: 5 + azar() * 6,
                late: 2.4 + azar() * 2.8,
                vuelta: 18 + azar() * 26,
                retraso: -azar() * 10,
                lima: azar() < 0.2,
            });
        }
    }
    return lugares;
}
const LUGARES_ANCHA = repartir(10, 5, 7);
const LUGARES_MOVIL = repartir(4, 7, 11);

function Silueta({ lugar, i, sx, sy, avance, quieto, tenue }) {
    const px = useTransform(sx, [-1, 1], [-24 * lugar.d, 24 * lugar.d]);
    const py = useTransform(sy, [-1, 1], [-18 * lugar.d, 18 * lugar.d]);
    const sube = useTransform(avance, [0, 1], [0, quieto ? 0 : -160 * lugar.d]);
    const opacidad = (lugar.lima ? 0.42 : 0.18) * (tenue ? 0.55 : 1);
    return (
        <motion.div aria-hidden="true" className="pointer-events-none absolute" style={{ left: `${lugar.x}%`, top: `${lugar.y}%`, x: px, y: py }}
            initial={quieto ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.8 + (i % 12) * 0.07, ease: SUAVE }}>
            <motion.div style={{ y: sube }}>
                <div className="ab-flota" style={{ '--d': `${lugar.flota}s`, '--a': `${-(6 + (i % 4) * 4)}px`, '--r0': `${lugar.r - 8}deg`, '--r1': `${lugar.r + 8}deg`, animationDelay: `${lugar.retraso}s` }}>
                    <div className={lugar.gira ? 'ab-gira' : ''} style={{ '--g': `${lugar.vuelta}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}>
                        <svg viewBox="0 0 48 48" width={lugar.t} height={lugar.t} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"
                            className="ab-late block"
                            style={{ '--l': `${lugar.late}s`, '--o': opacidad, animationDelay: `${lugar.retraso / 2}s`, color: lugar.lima ? 'var(--ab-lime)' : '#ffffff',
                                filter: lugar.lima ? 'drop-shadow(0 0 10px rgba(198,203,54,0.55))' : 'drop-shadow(0 0 8px rgba(158,165,232,0.4))' }}>
                            {SILUETAS[lugar.s]}
                        </svg>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* El nombre de la categoría, cambiando con ella (si Portada no tiene un título escrito). El padding de abajo deja
   entera la «p» de iPhone. */
function NombreQueCambia({ lamina, quieto, className, style }) {
    return (
        <span className={`relative block overflow-hidden pb-[0.14em] ${className}`} style={style}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={lamina.clave} className="inline-block"
                    initial={quieto ? { opacity: 0 } : { y: '110%' }} animate={{ y: 0, opacity: 1 }}
                    exit={quieto ? { opacity: 0 } : { y: '-110%' }} transition={{ duration: 0.65, ease: SUAVE }}>
                    {lamina.label}<span style={{ color: 'var(--ab-lime)' }}>.</span>
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

/* Íconos de la barra de menús */
const Wifi = ({ s }) => <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 8.5a15 15 0 0 1 20 0M5.5 12.2a10 10 0 0 1 13 0M9 15.8a5 5 0 0 1 6 0" /><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" /></svg>;
// `s` llega como «12.34px»: se pasa a número antes de estirarlo (antes daba un ancho NaN en la consola)
const Bateria = ({ s }) => <svg viewBox="0 0 28 14" width={`${(parseFloat(s) * 1.8).toFixed(2)}px`} height={s} fill="none"><rect x="1" y="1.5" width="23" height="11" rx="3" stroke="currentColor" strokeWidth="1.4" /><rect x="3" y="3.5" width="16" height="7" rx="1.6" fill="currentColor" /><path d="M26 5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
const Lupa = ({ s }) => <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></svg>;

/* Una ventana de Safari con la foto de la categoría. Se abre desde su ícono del Dock y vuelve a él al cerrarse. */
function Ventana({ lamina, indice, total, quieto, chica, px, foto }) {
    const c = centroIcono(indice, total);
    const desdeElDock = { opacity: 0, scale: 0.05, x: `${((c.x - 50) / VENTANA.ancho) * 100}%`, y: `${((c.y - CENTRO_VENTANA) / ALTO_VENTANA) * 100}%` };
    return (
        <motion.div className="absolute z-10 overflow-hidden"
            style={{ left: `${50 - VENTANA.ancho / 2}%`, top: `${(VENTANA.arriba / ALTO_U) * 100}%`, width: `${VENTANA.ancho}%`,
                borderRadius: px(1.3), background: '#1c1e26', boxShadow: `0 ${px(2)} ${px(6)} rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12)` }}
            initial={quieto ? { opacity: 0 } : desdeElDock} animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={quieto ? { opacity: 0 } : desdeElDock}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}>
            {/* Barra de Safari */}
            <div className="flex items-center bg-[#2a2c35]" style={{ height: px(VENTANA.barra), padding: `0 ${px(1.4)}`, gap: px(1) }}>
                {['#FF5F57', '#FEBC2E', '#28C840'].map((c2) => <span key={c2} className="rounded-full" style={{ width: px(1.1), height: px(1.1), background: c2 }} />)}
                <span className="mx-auto flex items-center justify-center rounded-md bg-white/10 text-white/80"
                    style={{ width: '46%', height: px(2.2), fontSize: px(1.15), gap: px(0.6) }}>
                    <svg viewBox="0 0 24 24" width={px(1.1)} height={px(1.1)} fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1v11H6V10h1zm2 0h6V8a3 3 0 0 0-6 0v2z" /></svg>
                    appleboss.com.bo{lamina.hub}
                </span>
                <span style={{ width: px(4.6) }} />
            </div>
            <img src={foto(lamina.clave, chica ? 'chica' : 'grande')} alt="" draggable="false"
                className="block w-full object-cover" style={{ aspectRatio: '3 / 2' }} />
        </motion.div>
    );
}

/* Lo que se ve en la pantalla de la MacBook: un escritorio de Mac */
function Pantalla({ laminas, activa, onElegir, quieto, encendida, chica, corre, foto }) {
    const caja = useRef(null);
    const u = useUnidad(caja);
    const px = (n) => `${(n * u).toFixed(2)}px`;
    const angosta = u < 4.2; // pantalla de celular: barra y ventana sin letra chica
    const hora = useHora();
    const lamina = laminas[activa];
    const total = laminas.length;
    const proximo = centroIcono((activa + 1) % total, total);
    const reposo = { x: 74, y: ALTO_U * 0.55 };

    return (
        <div ref={caja} className="absolute overflow-hidden bg-black"
            style={{ left: `${PANTALLA.left}%`, top: `${PANTALLA.top}%`, width: `${PANTALLA.width}%`, height: `${PANTALLA.height}%` }}>
            {/* Fondo de escritorio: la misma foto, desenfocada */}
            <AnimatePresence initial={false}>
                <motion.img key={`fondo-${lamina.clave}`} src={foto(lamina.clave, 'chica')} alt="" draggable="false"
                    className="absolute inset-0 h-full w-full scale-125 object-cover" style={{ filter: 'blur(18px) brightness(0.6) saturate(1.4)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} />
            </AnimatePresence>

            {/* Barra de menús */}
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-black/35 text-white backdrop-blur-md"
                style={{ height: px(BARRA), padding: `0 ${px(1.8)}`, fontSize: px(1.25) }}>
                <span className="flex items-center" style={{ gap: px(1.5) }}>
                    <img src={MARCA} alt="" style={{ height: px(1.8) }} />
                    <b className="font-bold">Apple Boss</b>
                    {!angosta && laminas.map((l) => (
                        <span key={l.clave} className={l.clave === lamina.clave ? 'text-white' : 'text-white/60'}>{l.label}</span>
                    ))}
                </span>
                <span className="flex items-center" style={{ gap: px(1.3) }}>
                    {!angosta && <><Wifi s={px(1.5)} /><Bateria s={px(1.1)} /><Lupa s={px(1.4)} /></>}
                    <span className="whitespace-nowrap tabular-nums">{hora}</span>
                </span>
            </div>

            {/* La ventana, con la foto entera */}
            <AnimatePresence initial={false}>
                <Ventana key={lamina.clave} lamina={lamina} indice={activa} total={total} quieto={quieto} chica={chica} px={px} foto={foto} />
            </AnimatePresence>

            {/* Dock: el ícono activo rebota, como al abrir una app */}
            <div className="absolute left-1/2 z-20 flex -translate-x-1/2 items-end border border-white/20 bg-white/15 backdrop-blur-xl"
                style={{ bottom: px(DOCK.abajo), padding: px(DOCK.borde), gap: px(DOCK.hueco), borderRadius: px(2.2) }}>
                {laminas.map((l, i) => (
                    <motion.button key={l.clave} type="button" onClick={() => onElegir(i)} aria-label={`Ver ${l.label}`} tabIndex={-1}
                        className="relative transition-transform hover:scale-110"
                        style={{ width: px(DOCK.icono), height: px(DOCK.icono) }}
                        animate={i === activa && !quieto ? { y: [0, -2.6 * u, 0, -1.2 * u, 0] } : { y: 0 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}>
                        <img src={foto(l.clave, 'chica')} alt="" className="h-full w-full object-cover"
                            style={{ borderRadius: px(1.2), boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }} />
                        <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white transition-opacity"
                            style={{ bottom: px(-0.65), width: px(0.45), height: px(0.45), opacity: i === activa ? 0.9 : 0 }} />
                    </motion.button>
                ))}
            </div>

            {/* El cursor: descansa sobre la ventana y antes del cambio va al ícono siguiente y lo toca */}
            {!quieto && corre && encendida && (
                <motion.svg key={`cursor-${activa}`} viewBox="0 0 24 24" className="pointer-events-none absolute z-30"
                    style={{ width: px(2.3), height: px(2.3), filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}
                    initial={{ left: `${reposo.x}%`, top: `${(reposo.y / ALTO_U) * 100}%` }}
                    animate={{
                        left: [`${reposo.x}%`, `${reposo.x - 4}%`, `${proximo.x - 0.5}%`, `${proximo.x - 0.5}%`, `${proximo.x - 0.5}%`],
                        top: [`${(reposo.y / ALTO_U) * 100}%`, `${((reposo.y + 3) / ALTO_U) * 100}%`, `${((proximo.y - 0.6) / ALTO_U) * 100}%`, `${((proximo.y - 0.6) / ALTO_U) * 100}%`, `${((proximo.y - 0.6) / ALTO_U) * 100}%`],
                        scale: [1, 1, 1, 0.8, 1],
                    }}
                    transition={{ duration: DURACION, times: [0, 0.45, 0.88, 0.94, 1], ease: 'easeInOut' }}>
                    <path d="M4 2l15 8.6-6.6 1.6 3.9 7-2.5 1.4-3.9-7L5 18z" fill="#fff" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
                </motion.svg>
            )}

            {/* Arranque: el logo de la tienda y la barra de carga, como al prender una Mac */}
            <AnimatePresence>
                {!encendida && (
                    <motion.div key="arranque" className="absolute inset-0 z-40 grid place-items-center bg-black" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                        <div className="flex flex-col items-center" style={{ gap: px(4) }}>
                            <img src={MARCA} alt="" style={{ height: px(9) }} />
                            <div className="overflow-hidden rounded-full bg-white/20" style={{ width: px(16), height: px(0.6) }}>
                                <motion.div className="h-full bg-white" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.3, ease: 'easeInOut', delay: 0.3 }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* El destacado real de la categoría: foto, nombre, datos y precio. Sin producto, el enlace a la categoría. */
function Destacado({ lamina, producto, quieto, vidrio, tinta, tintaSuave, fotoPantalla }) {
    const foto = fotoDe(producto);
    const precio = producto?.promo_price ?? producto?.price;
    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.a key={lamina.clave} href={producto?.url ?? lamina.hub}
                className="group flex w-full max-w-[400px] items-center gap-3 rounded-2xl border p-2.5 pr-4 text-left backdrop-blur-xl transition-colors"
                style={vidrio}
                initial={quieto ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={quieto ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: SUAVE }}>
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
                    <img src={foto ?? fotoPantalla(lamina.clave, 'chica')} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: lamina.acento }}>
                        {producto ? `Destacado · ${producto.condition ?? lamina.label}` : 'En la tienda'}
                    </span>
                    <span className="block truncate text-[14px] font-black" style={{ color: tinta }}>{producto?.name ?? `Ver ${lamina.label}`}</span>
                    <span className="block truncate text-[12px]" style={{ color: tintaSuave }}>
                        {producto ? [datosDe(producto), precio > 0 ? money(precio) : null].filter(Boolean).join(' · ') : lamina.frase}
                    </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: tinta }} />
            </motion.a>
        </AnimatePresence>
    );
}

export default function HeroMac({ featured = [], totalAvailable = 0, cmsSettings = {} }) {
    const tema = TEMAS[cmsSettings.tema] ?? TEMAS.appleboss_navy;
    const laminas = LAMINAS.map((l) => ({ ...l, ...(tema.glow ? { glow: tema.glow, acento: tema.acento } : {}) }));
    const productos = laminas.map((l) => featured.find(l.elige) ?? null);
    const quieto = useReducedMotion();
    const ancha = useMedia('(min-width: 1024px)'); // computadora: texto a la izquierda y MacBook a la derecha
    const chica = useMedia('(max-width: 640px)');
    const nombre = useNombreTienda();
    const tituloPagina = usePage().props.seo?.title;

    // Las fotos de la MacBook se cambian en Tienda online → Portada → «Portada grande»; sin foto cargada, la original
    const pantallas = cmsSettings.pantallas ?? {};
    const foto = (clave, tam) => pantallas[clave]?.[tam] ?? `${CARPETA}/pantalla-${clave}${tam === 'chica' ? '-chica' : ''}.webp`;

    const volanta = (cmsSettings.eyebrow ?? '').trim() || `${nombre} · Cochabamba`;
    const titulo = (cmsSettings.titulo ?? '').trim();
    const texto = (cmsSettings.descripcion ?? '').trim();
    const ctaUrl = cmsSettings.cta_url || '/catalogo';
    const cta2 = (cmsSettings.cta2_label ?? '').trim() && (cmsSettings.cta2_url ?? '').trim()
        ? { label: cmsSettings.cta2_label.trim(), url: cmsSettings.cta2_url.trim() } : null;

    const tinta = tema.oscuro ? '#fff' : '#011446';
    const tintaSuave = tema.oscuro ? 'rgba(255,255,255,0.68)' : 'rgba(1,20,70,0.66)';
    const vidrio = tema.oscuro
        ? { background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.14)', color: '#fff' }
        : { background: 'rgba(255,255,255,0.75)', borderColor: 'rgba(1,20,70,0.12)', color: '#011446' };

    const [activa, setActiva] = useState(0);
    const [enPausa, setEnPausa] = useState(false);
    const [encendida, setEncendida] = useState(false);
    const lamina = laminas[activa];
    // Avanza solo; se detiene con su botón (la MacBook ocupa casi todo el hero: pausar con el mouse encima la dejaría quieta)
    const corre = !quieto && !enPausa && encendida;

    const ir = useCallback((paso) => setActiva((a) => (a + paso + laminas.length) % laminas.length), [laminas.length]);

    // La Mac arranca (logo y barra de carga) mientras entra; después se precargan las otras fotos
    useEffect(() => {
        const t = setTimeout(() => setEncendida(true), quieto ? 0 : 1900);
        const p = setTimeout(() => LAMINAS.forEach((l) => { new Image().src = foto(l.clave, chica ? 'chica' : 'grande'); }), 2400);
        return () => { clearTimeout(t); clearTimeout(p); };
    }, [quieto, chica]); // eslint-disable-line react-hooks/exhaustive-deps

    // Mouse: la MacBook gira apenas y las siluetas se mueven por capas (profundidad)
    const seccion = useRef(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 60, damping: 18 });
    const sy = useSpring(my, { stiffness: 60, damping: 18 });
    const giroY = useTransform(sx, [-1, 1], ancha ? [-6, -2] : [-3, 3]);
    const giroX = useTransform(sy, [-1, 1], [2.5, -2.5]);
    const mover = (e) => {
        if (quieto || e.pointerType !== 'mouse') return;
        const r = seccion.current.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
    };

    // Scroll: al bajar, la MacBook se acerca y las siluetas suben a distinto ritmo
    const { scrollYProgress: avance } = useScroll({ target: seccion, offset: ['start start', 'end start'] });
    const escalaMac = useTransform(avance, [0, 1], [1, quieto ? 1 : 1.06]);
    const subeTexto = useTransform(avance, [0, 1], [0, quieto ? 0 : -60]);
    const opacidadTexto = useTransform(avance, [0, 0.6], [1, 0]);

    const teclas = (e) => {
        if (e.key === 'ArrowRight') ir(1);
        if (e.key === 'ArrowLeft') ir(-1);
    };

    const entra = (retraso, desde = {}) => (quieto
        ? { initial: false }
        : { initial: { opacity: 0, ...desde }, animate: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, rotateX: 0 }, transition: { duration: 1.1, delay: retraso, ease: SUAVE } });

    const boton = 'inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm';
    const lugares = ancha ? LUGARES_ANCHA : LUGARES_MOVIL;

    const bloqueTexto = (
        <motion.div style={{ y: subeTexto, opacity: opacidadTexto }}
            className={`relative z-30 flex w-full flex-col ${ancha ? 'items-start text-left' : 'items-center text-center'}`}>
            <motion.span {...entra(0.05, { y: 14 })}
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] backdrop-blur" style={vidrio}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ab-lime)' }} />
                {volanta}
            </motion.span>

            {/* Los cuatro nombres van del mismo tamaño y ninguno se corta: «MYSKIN.», que no se parte en dos líneas, mide
                3,75 veces su letra, así que la letra no pasa del 25% del ancho de la columna (cqw). */}
            <motion.div {...entra(0.15, { y: 24 })} className="mt-4 w-full [container-type:inline-size]" style={{ color: tinta }}>
                {titulo
                    ? <h1 className="text-[clamp(32px,4.6vw,64px)] font-black leading-[1.03] tracking-tight">{titulo}</h1>
                    : <NombreQueCambia lamina={lamina} quieto={quieto} className="text-[clamp(52px,8.2vw,124px)] font-black leading-[1.02] tracking-[-0.04em] supports-[width:1cqw]:text-[min(clamp(52px,8.2vw,124px),25cqw)]" />}
            </motion.div>

            <div className="relative mt-2 w-full">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.p key={texto ? 'fijo' : lamina.clave} className={`max-w-md text-[16px] leading-relaxed sm:text-[18px] ${ancha ? '' : 'mx-auto'}`} style={{ color: tintaSuave }}
                        initial={quieto ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                        {texto || lamina.frase}
                    </motion.p>
                </AnimatePresence>
            </div>

            <motion.div {...entra(0.3, { y: 16 })} className={`mt-7 flex flex-wrap items-center gap-3 ${ancha ? '' : 'justify-center'}`}>
                <motion.a {...destino(ctaUrl)} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    className={`${boton} font-black shadow-[0_16px_36px_-14px_rgba(198,203,54,0.75)]`} style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}>
                    {cmsSettings.cta_label || 'Ver catálogo'} <ArrowRight className="h-4 w-4" />
                </motion.a>
                {cta2 ? (
                    <motion.a {...destino(cta2.url)} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                        className={`${boton} border font-bold backdrop-blur`} style={vidrio}>{cta2.label}</motion.a>
                ) : (
                    <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} className="inline-flex">
                        <Link href={lamina.hub} className={`${boton} border font-bold backdrop-blur`} style={vidrio}>Ver {lamina.label}</Link>
                    </motion.span>
                )}
            </motion.div>

            {ancha && (
                <motion.div {...entra(0.45, { y: 16 })} className="mt-8 w-full">
                    <Destacado lamina={lamina} producto={productos[activa]} quieto={quieto} vidrio={vidrio} tinta={tinta} tintaSuave={tintaSuave} fotoPantalla={foto} />
                </motion.div>
            )}
        </motion.div>
    );

    const pestanas = (
        <motion.div {...entra(ancha ? 0.6 : 1.1, { y: 16 })} className={`relative z-30 flex max-w-full items-center gap-2 overflow-x-auto px-1 pb-1 ${ancha ? 'mt-6' : 'mt-6 self-stretch'}`}
            role="tablist" aria-label="Destacados por categoría">
            {laminas.map((l, i) => {
                const esta = i === activa;
                return (
                    <button key={l.clave} type="button" role="tab" aria-selected={esta} onClick={() => setActiva(i)}
                        className="relative shrink-0 overflow-hidden rounded-full border px-4 py-2 text-[13px] font-bold backdrop-blur transition-colors"
                        style={esta ? { background: tinta, color: tema.oscuro ? '#011446' : '#fff', borderColor: tinta } : vidrio}>
                        {l.label}
                        {esta && (
                            <motion.span key={`${activa}-${corre}`} aria-hidden="true" className="absolute inset-x-3 bottom-1 h-[2px] rounded-full"
                                style={{ background: 'var(--ab-lime)', originX: 0 }}
                                initial={{ scaleX: 0 }} animate={{ scaleX: corre ? 1 : 0 }}
                                transition={{ duration: corre ? DURACION : 0, ease: 'linear' }}
                                onAnimationComplete={() => { if (corre) ir(1); }} />
                        )}
                    </button>
                );
            })}
            {!quieto && (
                <button type="button" onClick={() => setEnPausa((p) => !p)} aria-label={enPausa ? 'Seguir pasando los destacados' : 'Pausar los destacados'}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border backdrop-blur" style={vidrio}>
                    {enPausa ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
            )}
        </motion.div>
    );

    const escenario = (
        <div className="relative" style={{ perspective: 2000 }}>
            {/* Pastilla con un dato real de la tienda (fuera del giro de la MacBook, para que no se tuerza) */}
            {ancha && totalAvailable > 0 && (
                <motion.div className="pointer-events-none absolute z-30 flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-bold backdrop-blur-xl"
                    style={{ ...vidrio, left: '6%', top: '-7%' }} {...entra(1.3, { y: 14, scale: 0.85 })}>
                    <span className="relative flex h-2 w-2">
                        {!quieto && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'var(--ab-lime)' }} />}
                        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--ab-lime)' }} />
                    </span>
                    {totalAvailable} {totalAvailable === 1 ? 'producto disponible' : 'productos disponibles'}
                </motion.div>
            )}
            {/* La MacBook entera: el ancho deja margen para el giro, así ningún borde se corta */}
            <motion.div className="relative mx-auto"
                style={{ width: '100%', rotateY: giroY, rotateX: giroX, scale: escalaMac, transformStyle: 'preserve-3d', transformOrigin: '50% 60%' }}>
                <motion.div {...entra(0.1, { y: 90, x: ancha ? 60 : 0, scale: 0.92, rotateX: 22 })} style={{ transformOrigin: '50% 100%' }} className="relative">
                    {/* Brillo debajo de la MacBook */}
                    <motion.div aria-hidden="true" className="absolute inset-x-[8%] bottom-[-6%] h-[22%] rounded-[50%] blur-3xl"
                        animate={{ background: lamina.glow, opacity: tema.oscuro ? 0.65 : 0.3 }} transition={{ duration: 1.2 }} />
                    <div className="relative" style={{ aspectRatio: '1813 / 1081' }}>
                        <Pantalla laminas={laminas} activa={activa} onElegir={setActiva} quieto={quieto} encendida={encendida} chica={chica} corre={corre} foto={foto} />
                        <img src={`${CARPETA}/${chica ? 'macbook-chica' : 'macbook'}.webp`} alt="" width="1600" height="954"
                            fetchpriority="high" className="pointer-events-none relative block h-auto w-full select-none" draggable="false"
                            style={{ filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.6))' }} />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );

    return (
        <section ref={seccion} aria-label="Portada" onPointerMove={mover} onPointerLeave={() => { mx.set(0); my.set(0); }} onKeyDown={teclas}
            className="relative isolate overflow-hidden"
            style={{ background: tema.fondo, minHeight: ancha ? 'calc(100svh - var(--alto-header, 170px))' : undefined }}>

            {/* ── Luces de fondo: toman el color de la lámina y se mueven despacio ── */}
            <motion.div aria-hidden="true" className="pointer-events-none absolute -z-10 rounded-full blur-[120px]"
                style={{ width: '55vw', height: '55vw', right: '-12vw', top: '-22vw' }}
                animate={{ background: lamina.glow, opacity: tema.oscuro ? 0.45 : 0.25, ...(quieto ? {} : { x: [0, -50, 0], y: [0, 40, 0] }) }}
                transition={{ background: { duration: 1.2 }, opacity: { duration: 1.2 }, x: { duration: 18, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 18, repeat: Infinity, ease: 'easeInOut' } }} />
            <motion.div aria-hidden="true" className="pointer-events-none absolute -z-10 rounded-full blur-[130px]"
                style={{ width: '45vw', height: '45vw', left: '-14vw', bottom: '-26vw' }}
                animate={{ background: lamina.acento, opacity: tema.oscuro ? 0.22 : 0.18, ...(quieto ? {} : { x: [0, 50, 0], y: [0, -30, 0] }) }}
                transition={{ background: { duration: 1.2 }, opacity: { duration: 1.2 }, x: { duration: 22, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 22, repeat: Infinity, ease: 'easeInOut' } }} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10"
                style={{
                    backgroundImage: `linear-gradient(${tema.oscuro ? 'rgba(255,255,255,0.04)' : 'rgba(1,20,70,0.05)'} 1px, transparent 1px), linear-gradient(90deg, ${tema.oscuro ? 'rgba(255,255,255,0.04)' : 'rgba(1,20,70,0.05)'} 1px, transparent 1px)`,
                    backgroundSize: '64px 64px',
                    WebkitMaskImage: 'radial-gradient(60% 70% at 70% 45%, #000, transparent 75%)',
                    maskImage: 'radial-gradient(60% 70% at 70% 45%, #000, transparent 75%)',
                }} />

            {/* Siluetas: flotan, giran y laten (CSS, en la GPU); siguen al mouse y al scroll con framer-motion */}
            {tema.oscuro && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                    {/* Las que caen detrás del texto van más tenues */}
                    {lugares.map((l, i) => (
                        <Silueta key={`${ancha ? 'a' : 'm'}-${i}`} lugar={l} i={i} sx={sx} sy={sy} avance={avance} quieto={quieto}
                            tenue={ancha ? l.x < 40 && l.y > 15 && l.y < 92 : l.y < 45} />
                    ))}
                    <style>{`
                        @keyframes ab-flota { 0%, 100% { transform: translateY(0) rotate(var(--r0)); } 50% { transform: translateY(var(--a)) rotate(var(--r1)); } }
                        @keyframes ab-gira { to { transform: rotate(360deg); } }
                        @keyframes ab-late { 0%, 100% { opacity: var(--o); transform: scale(1); } 50% { opacity: calc(var(--o) * 1.9); transform: scale(1.16); } }
                        .ab-flota { animation: ab-flota var(--d) ease-in-out infinite; will-change: transform; }
                        .ab-gira { animation: ab-gira var(--g) linear infinite; will-change: transform; }
                        .ab-late { opacity: var(--o); animation: ab-late var(--l) ease-in-out infinite; will-change: transform, opacity; }
                        @media (prefers-reduced-motion: reduce) { .ab-flota, .ab-gira, .ab-late { animation: none; } }
                    `}</style>
                </div>
            )}

            {/* Fundido hacia la sección siguiente (antes del contenido, para no tapar las pestañas) */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                style={{ background: `linear-gradient(to bottom, transparent, ${tema.fondo})` }} />

            {!titulo && tituloPagina && <h1 className="sr-only">{tituloPagina}</h1>}

            {ancha ? (
                /* Computadora: la columna del texto arranca donde arranca el resto de la página; la MacBook, entera, a la derecha */
                <div className="relative grid items-center gap-10 py-10"
                    style={{
                        minHeight: 'inherit', gridTemplateColumns: 'minmax(0, 0.66fr) minmax(0, 1.34fr)',
                        paddingLeft: 'max(40px, calc((100vw - 1224px) / 2 + 40px))',
                        paddingRight: 'max(32px, calc((100vw - 1224px) / 2 - 40px))',
                    }}>
                    <div className="min-w-0">
                        {bloqueTexto}
                        {pestanas}
                    </div>
                    {escenario}
                </div>
            ) : (
                <div className="relative flex flex-col items-center px-4 pb-10 pt-8 sm:px-7 md:px-10">
                    {bloqueTexto}
                    <div className="mt-10 w-full max-w-[760px]">{escenario}</div>
                    <div className="mt-12 flex w-full max-w-[420px] justify-center">
                        <Destacado lamina={lamina} producto={productos[activa]} quieto={quieto} vidrio={vidrio} tinta={tinta} tintaSuave={tintaSuave} fotoPantalla={foto} />
                    </div>
                    {pestanas}
                </div>
            )}
        </section>
    );
}
