import { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

// ─── Siluetas de dispositivos Apple (trazo fino, estilo línea) ────────────────
// Solo contorno: se leen como producto sin copiar imágenes ni logos de Apple.
// pathLength="1" en cada trazo permite dibujarlas al entrar (clase .ab-trazo en app-vite.css).
const S = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

function IPhone({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 60 120" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <rect x="2" y="2" width="56" height="116" rx="12" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <rect x="6.5" y="6.5" width="47" height="107" rx="8.5" opacity="0.45" pathLength="1" />
            <rect x="22" y="11" width="16" height="5" rx="2.5" fill={stroke} stroke="none" opacity="0.8" />
            <path d="M58.5 32v12" opacity="0.7" pathLength="1" />
        </svg>
    );
}

function MacBook({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 140 90" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <rect x="16" y="4" width="108" height="70" rx="5" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <rect x="21.5" y="9.5" width="97" height="59" rx="2" opacity="0.45" pathLength="1" />
            <rect x="64" y="9.5" width="12" height="3" rx="1.5" fill={stroke} stroke="none" opacity="0.7" />
            <path d="M4 76h132l-3.5 7.5a3 3 0 0 1-2.7 1.7H10.2a3 3 0 0 1-2.7-1.7L4 76z" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <path d="M60 76a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3" opacity="0.6" pathLength="1" />
        </svg>
    );
}

function IPad({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 90 120" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <rect x="2" y="2" width="86" height="116" rx="9" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <rect x="7.5" y="7.5" width="75" height="105" rx="4.5" opacity="0.45" pathLength="1" />
            <circle cx="45" cy="4.8" r="1.1" fill={stroke} stroke="none" />
        </svg>
    );
}

function Watch({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 60 100" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <path d="M17 21l2.5-17h21L43 21" opacity="0.7" pathLength="1" />
            <path d="M17 79l2.5 17h21L43 79" opacity="0.7" pathLength="1" />
            <rect x="8" y="20" width="44" height="60" rx="13" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <rect x="13" y="25" width="34" height="50" rx="9" opacity="0.45" pathLength="1" />
            <rect x="52" y="38" width="4" height="11" rx="2" pathLength="1" />
        </svg>
    );
}

function AirPods({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 80 70" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <rect x="4" y="6" width="72" height="58" rx="22" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <path d="M4.6 25h70.8" opacity="0.6" pathLength="1" />
            <circle cx="40" cy="43" r="1.6" fill={stroke} stroke="none" />
        </svg>
    );
}

function IMac({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 120 112" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <rect x="4" y="4" width="112" height="80" rx="5" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <path d="M4 68h112" opacity="0.5" pathLength="1" />
            <path d="M50 84l-4 20h28l-4-20" pathLength="1" />
            <path d="M40 106h40" pathLength="1" />
        </svg>
    );
}

// Otras marcas: formas genéricas, sin copiar el diseño de ningún fabricante.
function AndroidPhone({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 60 120" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <rect x="2" y="2" width="56" height="116" rx="8" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <rect x="5.5" y="5.5" width="49" height="109" rx="5" opacity="0.45" pathLength="1" />
            <circle cx="30" cy="11" r="2.2" fill={stroke} stroke="none" opacity="0.85" />
            <path d="M58.5 26v10M58.5 42v14" opacity="0.7" pathLength="1" />
        </svg>
    );
}

function LaptopGamer({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 150 96" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <path d="M18 6h114l4 64H14z" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <path d="M24 12h102l3 52H21z" opacity="0.45" pathLength="1" />
            <path d="M6 72h138l-6 16a4 4 0 0 1-3.7 2.5H15.7A4 4 0 0 1 12 88z" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <path d="M22 77h106M24 82h102" opacity="0.5" pathLength="1" />
            <path d="M40 86h20M90 86h20" opacity="0.6" pathLength="1" />
        </svg>
    );
}

function Gamepad({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 120 84" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <path d="M36 10h48c16 0 26 10 30 26l4 22c2.5 14-10 22-20 14l-12-10H34L22 72c-10 8-22.5 0-20-14l4-22C10 20 20 10 36 10z" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <path d="M28 32v16M20 40h16" pathLength="1" />
            <circle cx="86" cy="32" r="3" pathLength="1" />
            <circle cx="96" cy="42" r="3" pathLength="1" />
            <circle cx="76" cy="42" r="3" pathLength="1" />
            <circle cx="86" cy="52" r="3" pathLength="1" />
            <circle cx="46" cy="54" r="6" opacity="0.6" pathLength="1" />
            <circle cx="72" cy="58" r="6" opacity="0.6" pathLength="1" />
        </svg>
    );
}

function PcTower({ stroke, sw, ...rest }) {
    return (
        <svg viewBox="0 0 60 110" {...S} stroke={stroke} strokeWidth={sw} {...rest}>
            <rect x="2" y="2" width="56" height="106" rx="5" fill="rgba(255,255,255,0.03)" pathLength="1" />
            <path d="M12 14h36M12 22h36" opacity="0.5" pathLength="1" />
            <circle cx="30" cy="62" r="14" opacity="0.45" pathLength="1" />
            <circle cx="30" cy="62" r="4" opacity="0.6" pathLength="1" />
            <circle cx="46" cy="96" r="2.4" fill={stroke} stroke="none" />
        </svg>
    );
}

// Alto ÷ ancho del viewBox de cada silueta, para ubicarlas en el lienzo sin deformarlas.
const PROPORCION = new Map([
    [IPhone, 2], [MacBook, 90 / 140], [IPad, 120 / 90], [Watch, 100 / 60], [AirPods, 70 / 80], [IMac, 112 / 120],
    [AndroidPhone, 2], [LaptopGamer, 96 / 150], [Gamepad, 84 / 120], [PcTower, 110 / 60],
]);

const BLANCO = 'rgba(255,255,255,0.5)';
const LIMA = 'rgba(198,203,54,0.9)';

// Cada margen es un lienzo de 200 × 400 que se escala al espacio que queda fuera del contenedor de 1224 px.
// profundidad = cuánto se corre la silueta siguiendo el puntero (las más cercanas se mueven más).
const MARGENES = {
    izquierda: {
        equipos: [
            { C: MacBook, x: 10, y: 22, w: 118, rot: 4, trazo: BLANCO, dur: 8.4, retraso: 0.15, profundidad: 9 },
            { C: IPhone, x: 140, y: 42, w: 44, rot: 12, trazo: LIMA, dur: 7.2, retraso: 0.45, profundidad: 18 },
            { C: Watch, x: 34, y: 150, w: 42, rot: -8, trazo: BLANCO, dur: 6.6, retraso: 0.75, profundidad: 14 },
            { C: Gamepad, x: 98, y: 266, w: 70, rot: -6, trazo: BLANCO, dur: 7.8, retraso: 1.05, profundidad: 8 },
            { C: PcTower, x: 26, y: 284, w: 40, rot: -8, trazo: BLANCO, dur: 6.9, retraso: 1.35, profundidad: 16 },
        ],
        // Del iPhone de color al control de la consola, pasando por el ícono de canje: se recibe de todo
        camino: 'M162 140 C 184 186, 156 226, 134 262',
        canje: [164, 204],
        destellos: [[92, 130, 0.2], [188, 272, 1.6], [12, 240, 2.8], [150, 384, 0.9], [72, 10, 2.2]],
    },
    derecha: {
        equipos: [
            { C: IPad, x: 104, y: 16, w: 76, rot: 8, trazo: BLANCO, dur: 9.0, retraso: 0.3, profundidad: 11 },
            { C: AndroidPhone, x: 24, y: 56, w: 44, rot: -12, trazo: BLANCO, dur: 6.9, retraso: 0.6, profundidad: 18 },
            { C: IMac, x: 94, y: 162, w: 90, rot: -4, trazo: BLANCO, dur: 8.8, retraso: 0.9, profundidad: 8 },
            { C: Watch, x: 28, y: 250, w: 40, rot: 10, trazo: LIMA, dur: 7.4, retraso: 1.2, profundidad: 15 },
            { C: LaptopGamer, x: 78, y: 300, w: 114, rot: -5, trazo: BLANCO, dur: 8.2, retraso: 1.5, profundidad: 10 },
        ],
        camino: 'M46 150 C 20 188, 76 214, 50 250',
        canje: [48, 201],
        destellos: [[186, 140, 0.6], [10, 18, 1.8], [190, 268, 2.4], [12, 372, 1.2], [150, 392, 0.3]],
    },
};

const ESTRELLA = 'M0 -4.5 L1.1 -1.1 L4.5 0 L1.1 1.1 L0 4.5 L-1.1 1.1 L-4.5 0 L-1.1 -1.1 Z';

function Equipo({ equipo, px, py, reduce, id }) {
    const { C, x, y, w, rot, trazo, dur, retraso, profundidad } = equipo;
    const h = w * PROPORCION.get(C);
    const dx = useTransform(px, (v) => v * -profundidad);
    const dy = useTransform(py, (v) => v * -profundidad);
    const lima = trazo === LIMA;

    return (
        <motion.g style={{ x: dx, y: dy }}>
            <motion.g
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0.4 : 1.1, delay: reduce ? 0 : retraso, ease: [0.22, 1, 0.36, 1] }}
            >
                <motion.g
                    initial={{ rotate: rot }}
                    animate={reduce ? { rotate: rot } : { y: [0, -9, 0], rotate: [rot, rot + 3, rot] }}
                    transition={reduce ? { duration: 0 } : {
                        y: { duration: dur, delay: retraso, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: dur * 1.3, delay: retraso, repeat: Infinity, ease: 'easeInOut' },
                    }}
                >
                    {/* Halo que respira detrás de la silueta */}
                    <motion.circle
                        cx={x + w / 2} cy={y + h / 2} r={Math.max(w, h) * 0.62}
                        fill={`url(#${id}-${lima ? 'halo-lima' : 'halo'})`}
                        initial={{ opacity: 0.5 }}
                        animate={reduce ? { opacity: 0.7 } : { opacity: [0.45, 1, 0.45] }}
                        transition={reduce ? { duration: 0 } : { duration: dur * 0.8, delay: retraso, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <C
                        x={x} y={y} width={w} height={h} stroke={trazo} sw={2}
                        className="ab-trazo" style={{ '--ab-retraso': `${retraso}s`, overflow: 'visible' }}
                    />
                </motion.g>
            </motion.g>
        </motion.g>
    );
}

function Margen({ lado, px, py, reduce }) {
    const id = `ab-${lado}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const { equipos, camino, canje, destellos } = MARGENES[lado];

    return (
        <div
            className={`absolute inset-y-0 hidden px-4 py-2 min-[1500px]:block ${lado === 'izquierda' ? 'left-0' : 'right-0'}`}
            style={{ width: 'calc((100% - 1224px) / 2)' }}
        >
            <svg viewBox="0 0 200 400" preserveAspectRatio="xMidYMid meet" className="h-full w-full overflow-visible">
                <defs>
                    <radialGradient id={`${id}-halo`}>
                        <stop offset="0%" stopColor="#7B82D8" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#7B82D8" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id={`${id}-halo-lima`}>
                        <stop offset="0%" stopColor="#C6CB36" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#C6CB36" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Órbitas punteadas que giran despacio */}
                <motion.circle
                    cx="100" cy="200" r="98" fill="none" stroke="rgba(158,165,232,0.24)" strokeWidth="1" strokeDasharray="2 9"
                    animate={reduce ? undefined : { strokeDashoffset: [0, lado === 'izquierda' ? -110 : 110] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                />
                <motion.circle
                    cx="100" cy="200" r="150" fill="none" stroke="rgba(158,165,232,0.14)" strokeWidth="1" strokeDasharray="1 12"
                    animate={reduce ? undefined : { strokeDashoffset: [0, lado === 'izquierda' ? 130 : -130] }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                />

                {/* Camino del canje: un equipo va y el otro vuelve */}
                <path id={`${id}-camino`} d={camino} fill="none" stroke="rgba(198,203,54,0.28)" strokeWidth="1.2" strokeDasharray="3 5" strokeLinecap="round" />
                {!reduce && [0, 1].map((vuelta) => (
                    <circle key={vuelta} r="2.6" fill={vuelta ? '#9EA5E8' : '#C6CB36'} opacity="0">
                        <animateMotion
                            dur="4.8s" begin={`${1.8 + vuelta * 2.4}s`} repeatCount="indefinite" calcMode="linear"
                            keyPoints={vuelta ? '1;0' : '0;1'} keyTimes="0;1"
                        >
                            <mpath href={`#${id}-camino`} />
                        </animateMotion>
                        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="4.8s" begin={`${1.8 + vuelta * 2.4}s`} repeatCount="indefinite" />
                    </circle>
                ))}

                {equipos.map((equipo, i) => <Equipo key={i} equipo={equipo} px={px} py={py} reduce={reduce} id={id} />)}

                {/* Ícono de canje: late y gira cada tanto */}
                <g transform={`translate(${canje[0]} ${canje[1]})`}>
                    {!reduce && (
                        <motion.circle
                            r="14" fill="none" stroke="rgba(198,203,54,0.5)" strokeWidth="1"
                            initial={{ scale: 1, opacity: 0 }}
                            animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                            transition={{ duration: 2.4, delay: 2, repeat: Infinity, ease: 'easeOut' }}
                        />
                    )}
                    <motion.g
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: reduce ? 0 : 1.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <circle r="14" fill="#0B1250" stroke="rgba(198,203,54,0.75)" strokeWidth="1.2" />
                        <motion.g
                            animate={reduce ? undefined : { rotate: [0, 0, 180, 180, 360] }}
                            transition={{ duration: 6, delay: 2.4, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1], ease: 'easeInOut' }}
                        >
                            <path d="M-6 -2.5h11.5l-3-3M6 2.5h-11.5l3 3" fill="none" stroke="#C6CB36" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.g>
                    </motion.g>
                </g>

                {/* Destellos */}
                {destellos.map(([cx, cy, retraso], i) => (
                    // El translate va en un <g>: framer escribe su propio transform sobre el elemento que anima
                    <g key={i} transform={`translate(${cx} ${cy})`}>
                        <motion.path
                            d={ESTRELLA} fill={i % 2 ? '#C6CB36' : '#FFFFFF'}
                            initial={{ opacity: 0, scale: 0.3 }}
                            animate={reduce ? { opacity: 0.35, scale: 0.7 } : { opacity: [0, 0.85, 0], scale: [0.3, 1, 0.3] }}
                            transition={reduce ? { duration: 0 } : { duration: 3.2, delay: retraso, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
                        />
                    </g>
                ))}
            </svg>
        </div>
    );
}

/**
 * Fondo animado del hero de Trade-In. Las siluetas van en los márgenes, fuera del contenedor de 1224 px, así nunca
 * tapan el texto: se dibujan al entrar, flotan, siguen un poco al puntero y un canje va y vuelve entre dos equipos.
 * Debajo, en todos los tamaños, dos luces suaves que se desplazan y una trama de puntos.
 * Decorativo: aria-hidden, sin eventos de puntero y quieto si el usuario pidió reducir el movimiento.
 */
export default function FloatingDevices() {
    const reduce = useReducedMotion();
    const [px, py] = usePuntero(reduce);

    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {/* Trama de puntos que se desvanece hacia el centro */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                    maskImage: 'radial-gradient(ellipse 75% 90% at 50% 50%, transparent 35%, black 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 75% 90% at 50% 50%, transparent 35%, black 100%)',
                }}
            />
            {/* Luces suaves */}
            <motion.div
                className="absolute -left-48 -top-56 h-[34rem] w-[34rem] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(88,94,159,0.55) 0%, transparent 65%)' }}
                animate={reduce ? undefined : { x: [0, 90, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute -bottom-64 -right-40 h-[36rem] w-[36rem] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(198,203,54,0.13) 0%, transparent 62%)' }}
                animate={reduce ? undefined : { x: [0, -80, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            />

            <Margen lado="izquierda" px={px} py={py} reduce={reduce} />
            <Margen lado="derecha" px={px} py={py} reduce={reduce} />
        </div>
    );
}

/** Dónde está el puntero en la ventana, de -1 a 1 en cada eje, suavizado. Quieto con «reducir movimiento». */
function usePuntero(reduce) {
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const px = useSpring(mx, { stiffness: 50, damping: 16, mass: 0.8 });
    const py = useSpring(my, { stiffness: 50, damping: 16, mass: 0.8 });

    useEffect(() => {
        if (reduce) return undefined;
        const mover = (e) => {
            mx.set((e.clientX / window.innerWidth) * 2 - 1);
            my.set((e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener('pointermove', mover, { passive: true });
        return () => window.removeEventListener('pointermove', mover);
    }, [reduce, mx, my]);

    return [px, py];
}

// ─── Equipo en revisión (la derecha del hero) ────────────────────────────────
// Lienzo de 480 × 340. Cada equipo se dibuja, una línea lo recorre y se marcan los puntos que revisa el formulario
// para ese tipo de equipo (salen de App\Support\TradeIn\Cuestionario). Después pasa al siguiente: se recibe de todo.
const CICLO_MS = 8000;
const REVISIONES = [
    { C: IPhone, w: 100, puntos: ['Cuenta de Apple', 'Bypass', 'Face ID', 'Pantalla', 'Batería', 'Historial de piezas'] },
    { C: AndroidPhone, w: 100, puntos: ['Cuenta de Google', 'Bloqueo de IMEI', 'Huella', 'Pantalla', 'Batería', 'Cámaras'] },
    { C: LaptopGamer, w: 190, puntos: ['Procesador', 'Tarjeta gráfica', 'Teclado', 'Pantalla', 'Batería', 'Contraseña de BIOS'] },
    { C: Gamepad, w: 180, puntos: ['Cuenta', 'Baneo en línea', 'Controles', 'Lectora de discos', 'Ventiladores', 'Carcasa'] },
];
// Izquierda termina en x = 138; derecha empieza en x = 342. Se activan en zigzag, de arriba abajo.
const LUGARES = [
    { lado: 'izq', y: 92 }, { lado: 'der', y: 120 }, { lado: 'izq', y: 170 },
    { lado: 'der', y: 198 }, { lado: 'izq', y: 248 }, { lado: 'der', y: 276 },
];
const ancho = (texto) => Math.round(40 + texto.length * 6.9);

function Punto({ texto, lugar, orden, caja, reduce }) {
    const w = ancho(texto);
    const x = lugar.lado === 'izq' ? 138 - w : 342;
    const bordeChip = lugar.lado === 'izq' ? 138 : 342;
    const bordeEquipo = lugar.lado === 'izq' ? caja.x - 6 : caja.x + caja.w + 6;
    const yEquipo = Math.min(Math.max(lugar.y, caja.y + 12), caja.y + caja.h - 12);
    const retraso = reduce ? 0 : 1.2 + orden * 0.75;
    const marcado = reduce ? { opacity: 1 } : { opacity: 1, transition: { delay: retraso, duration: 0.35 } };

    return (
        <g>
            {/* Línea hasta el equipo */}
            <motion.path
                d={`M${bordeChip} ${lugar.y} C ${(bordeChip + bordeEquipo) / 2} ${lugar.y}, ${(bordeChip + bordeEquipo) / 2} ${yEquipo}, ${bordeEquipo} ${yEquipo}`}
                fill="none" stroke="rgba(198,203,54,0.55)" strokeWidth="1" strokeDasharray="2 4"
                initial={{ opacity: 0.15 }} animate={marcado}
            />
            <motion.circle cx={bordeEquipo} cy={yEquipo} r="2.6" fill="#C6CB36" initial={{ opacity: 0 }} animate={marcado} />

            <g transform={`translate(${x} ${lugar.y - 15})`}>
                <motion.g
                    initial={{ opacity: 0, x: lugar.lado === 'izq' ? -14 : 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, delay: reduce ? 0 : 0.3 + orden * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                    <motion.g
                        animate={reduce ? undefined : { y: [0, -3, 0] }}
                        transition={{ duration: 3.6 + orden * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        {/* Fondo sólido: las órbitas y los destellos pasan por detrás sin cruzar el texto */}
                        <rect width={w} height="30" rx="15" fill="#0A1656" stroke="rgba(255,255,255,0.18)" />
                        <motion.rect width={w} height="30" rx="15" fill="rgba(198,203,54,0.10)" stroke="rgba(198,203,54,0.65)"
                            initial={{ opacity: 0 }} animate={marcado} />
                        <circle cx="15" cy="15" r="8" fill="none" stroke="rgba(255,255,255,0.28)" />
                        <motion.circle cx="15" cy="15" r="8" fill="#C6CB36" initial={{ opacity: 0 }} animate={marcado} />
                        <motion.path d="M11.3 15.2l2.5 2.5 4.9-5.2" fill="none" stroke="#011446" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
                            initial={{ opacity: 0 }} animate={marcado} />
                        <text x="30" y="19.3" fontSize="12.5" fontWeight="600" fill="rgba(255,255,255,0.9)">{texto}</text>
                    </motion.g>
                </motion.g>
            </g>
        </g>
    );
}

/**
 * La derecha del hero de Trade-In: un equipo en revisión, dentro del contenedor y al lado del texto. Va pasando por un
 * iPhone, un celular Android, una laptop y un control de consola. Decorativo: el contenedor que lo usa lleva aria-hidden.
 */
export function EquipoEnRevision() {
    const reduce = useReducedMotion();
    const [px, py] = usePuntero(reduce);
    const [indice, setIndice] = useState(0);
    const id = `ab-revision-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

    useEffect(() => {
        if (reduce) return undefined;
        const reloj = setInterval(() => setIndice((i) => (i + 1) % REVISIONES.length), CICLO_MS);
        return () => clearInterval(reloj);
    }, [reduce]);

    const lejos = [useTransform(px, (v) => v * -4), useTransform(py, (v) => v * -4)];
    const cerca = [useTransform(px, (v) => v * -10), useTransform(py, (v) => v * -10)];

    const { C, w, puntos } = REVISIONES[indice];
    const h = w * PROPORCION.get(C);
    const caja = { x: 240 - w / 2, y: 170 - h / 2, w, h };

    return (
        <div className="pointer-events-none absolute inset-x-0 -inset-y-14 md:-inset-y-20">
            <svg viewBox="0 0 480 340" preserveAspectRatio="xMidYMid meet" className="h-full w-full overflow-visible">
                <defs>
                    <radialGradient id={`${id}-luz`}>
                        <stop offset="0%" stopColor="#7B82D8" stopOpacity="0.38" />
                        <stop offset="60%" stopColor="#7B82D8" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#7B82D8" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id={`${id}-haz`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C6CB36" stopOpacity="0" />
                        <stop offset="100%" stopColor="#C6CB36" stopOpacity="0.32" />
                    </linearGradient>
                </defs>

                {/* Fondo: luz que respira, órbitas, un cometa y latidos desde el centro */}
                <motion.g style={{ x: lejos[0], y: lejos[1] }}>
                    <motion.circle cx="240" cy="170" r="175" fill={`url(#${id}-luz)`}
                        animate={reduce ? undefined : { opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
                    <motion.circle cx="240" cy="170" r="125" fill="none" stroke="rgba(158,165,232,0.26)" strokeDasharray="2 9"
                        animate={reduce ? undefined : { strokeDashoffset: [0, -121] }} transition={{ duration: 16, repeat: Infinity, ease: 'linear' }} />
                    <motion.circle cx="240" cy="170" r="160" fill="none" stroke="rgba(158,165,232,0.13)" strokeDasharray="1 13"
                        animate={reduce ? undefined : { strokeDashoffset: [0, 140] }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }} />
                    {!reduce && (
                        <>
                            <circle cx="240" cy="170" r="125" fill="none" stroke="#C6CB36" strokeWidth="1.6" strokeLinecap="round"
                                pathLength="1000" strokeDasharray="70 930" opacity="0.8">
                                <animate attributeName="stroke-dashoffset" from="0" to="-1000" dur="7s" repeatCount="indefinite" />
                            </circle>
                            <g>
                                <animateTransform attributeName="transform" type="rotate" from="0 240 170" to="-360 240 170" dur="30s" repeatCount="indefinite" />
                                <circle cx="240" cy="10" r="2.4" fill="#9EA5E8" />
                                <circle cx="80" cy="170" r="1.8" fill="#C6CB36" />
                                <circle cx="353" cy="283" r="2" fill="#FFFFFF" opacity="0.7" />
                            </g>
                            {[0, 1].map((i) => (
                                <motion.circle key={i} cx="240" cy="170" r="70" fill="none" stroke="rgba(198,203,54,0.35)"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: [0.8, 2.1], opacity: [0.45, 0] }}
                                    transition={{ duration: 4, delay: i * 2, repeat: Infinity, ease: 'easeOut' }} />
                            ))}
                        </>
                    )}
                </motion.g>

                <AnimatePresence mode="wait">
                    <motion.g key={indice} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.45 } }}>
                        {/* El equipo, flotando, con el haz que lo recorre */}
                        <motion.g style={{ x: lejos[0], y: lejos[1] }}>
                            <motion.g
                                initial={{ y: 10 }}
                                animate={reduce ? { y: 0 } : { y: [0, -6, 0] }}
                                transition={reduce ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <C x={caja.x} y={caja.y} width={w} height={h} stroke="rgba(255,255,255,0.78)" sw={w > 120 ? 1.5 : 1.25}
                                    className="ab-trazo" style={{ '--ab-retraso': '0s', overflow: 'visible' }} />
                                {!reduce && (
                                    <>
                                        <clipPath id={`${id}-recorte-${indice}`}>
                                            <rect x={caja.x} y={caja.y} width={w} height={h} rx="10" />
                                        </clipPath>
                                        <g clipPath={`url(#${id}-recorte-${indice})`}>
                                            <motion.g
                                                initial={{ y: 0, opacity: 0 }}
                                                animate={{ y: [0, h + 30], opacity: [0, 1, 1, 0] }}
                                                transition={{ duration: 4.8, delay: 1, ease: 'linear', times: [0, 1], opacity: { duration: 4.8, delay: 1, times: [0, 0.08, 0.9, 1] } }}
                                            >
                                                <rect x={caja.x} y={caja.y - 30} width={w} height="28" fill={`url(#${id}-haz)`} />
                                                <rect x={caja.x} y={caja.y - 2} width={w} height="1.6" fill="#C6CB36" opacity="0.9" />
                                            </motion.g>
                                        </g>
                                    </>
                                )}
                            </motion.g>
                        </motion.g>

                        {/* Los puntos que revisa el formulario para este equipo */}
                        <motion.g style={{ x: cerca[0], y: cerca[1] }}>
                            {puntos.map((texto, i) => (
                                <Punto key={texto} texto={texto} lugar={LUGARES[i]} orden={i} caja={caja} reduce={reduce} />
                            ))}
                        </motion.g>
                    </motion.g>
                </AnimatePresence>

                {/* Destellos que suben */}
                {!reduce && [[150, 300, 0], [330, 310, 1.4], [200, 330, 2.6], [290, 60, 0.8], [420, 170, 2]].map(([cx, cy, retraso], i) => (
                    <motion.circle key={i} cx={cx} cy={cy} r={i % 2 ? 1.6 : 2.2} fill={i % 2 ? '#C6CB36' : '#FFFFFF'}
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 0.8, 0], y: [0, -46] }}
                        transition={{ duration: 3.8, delay: retraso, repeat: Infinity, repeatDelay: 1, ease: 'easeOut' }} />
                ))}
            </svg>
        </div>
    );
}

// Siluetas reutilizables (pantallas de acceso)
export { IPhone, MacBook, IPad, Watch };
