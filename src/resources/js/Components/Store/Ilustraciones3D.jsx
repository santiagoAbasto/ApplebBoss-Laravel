import { motion, useReducedMotion } from 'framer-motion';

/*
 * Ilustraciones isométricas en SVG: sin imágenes, sin librerías 3D y con la paleta de la marca.
 *
 * Todo se dibuja en coordenadas del mundo (x, y en el suelo; z hacia arriba) y se proyecta con
 * `iso()`. Un `Bloque` es una caja con tres caras de distinto tono (arriba clara, izquierda media,
 * derecha oscura): de ahí sale el volumen. Los `Plano*` dejan dibujar en 2D sobre una cara.
 */

const COS = 0.866;
const SIN = 0.5;
const iso = (x, y, z) => [(x - y) * COS, (x + y) * SIN - z];
const pts = (...ps) => ps.map((p) => iso(...p).map((n) => n.toFixed(1)).join(',')).join(' ');

// [arriba, cara izquierda, cara derecha]
const T = {
    navy:    ['#2B4C9B', '#0B2B70', '#011446'],
    lima:    ['#E5E97A', '#C6CB36', '#9DA21E'],
    blanco:  ['#FFFFFF', '#EDF1F8', '#D6DDEA'],
    carton:  ['#F3D9A8', '#DDB677', '#C39A5A'],
    apagado: ['#EEF0F4', '#D5D9E2', '#B9BFCC'],
};
const VIDRIO = '#B9CEFF';

function Bloque({ x = 0, y = 0, z = 0, w, d, h, t = T.blanco, caras = 'top izq der' }) {
    const [top, izq, der] = t;
    return (
        <g>
            {caras.includes('izq') && <polygon points={pts([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} fill={izq} />}
            {caras.includes('der') && <polygon points={pts([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} fill={der} />}
            {caras.includes('top') && <polygon points={pts([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} fill={top} />}
        </g>
    );
}

/* Dibujo 2D sobre una cara. u avanza por el borde, v sube. */
const PlanoIzq = ({ x, y, z, children }) => { const [X, Y] = iso(x, y, z); return <g transform={`matrix(${COS} ${SIN} 0 -1 ${X} ${Y})`}>{children}</g>; };
const PlanoDer = ({ x, y, z, children }) => { const [X, Y] = iso(x, y, z); return <g transform={`matrix(${-COS} ${SIN} 0 -1 ${X} ${Y})`}>{children}</g>; };
const PlanoSuelo = ({ x, y, z = 0, children }) => { const [X, Y] = iso(x, y, z); return <g transform={`matrix(${COS} ${SIN} ${-COS} ${SIN} ${X} ${Y})`}>{children}</g>; };

function Sombra({ x, y, rx = 46, ry = 16 }) {
    const [X, Y] = iso(x, y, 0);
    return (
        <g opacity="0.14">
            <ellipse cx={X} cy={Y} rx={rx} ry={ry} fill="#011446" />
            <ellipse cx={X} cy={Y} rx={rx * 0.66} ry={ry * 0.62} fill="#011446" />
        </g>
    );
}

/* Movimientos: se apagan solos si la persona pidió reducir animaciones */
function Flota({ children, amp = 4, dur = 3.2, delay = 0 }) {
    const quieto = useReducedMotion();
    return (
        <motion.g animate={quieto ? undefined : { y: [0, -amp, 0] }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }}>
            {children}
        </motion.g>
    );
}

const Rueda = ({ cx, cy }) => (
    <g>
        <circle cx={cx} cy={cy} r="7" fill="#0A1433" />
        <circle cx={cx} cy={cy} r="3" fill="#C4CDDF" />
    </g>
);

/* ─── Piezas ─────────────────────────────────────────────────────────── */

function Tienda() {
    return (
        <g>
            <Sombra x={42} y={40} rx={54} ry={18} />
            <Bloque x={10} y={10} w={60} d={50} h={40} t={T.blanco} />
            <Bloque x={6} y={6} z={40} w={68} d={58} h={5} t={T.navy} />
            <PlanoIzq x={10} y={60} z={0}>
                <rect x="10" y="0" width="16" height="25" rx="1.5" fill={T.navy[2]} />
                <circle cx="23" cy="12" r="1.3" fill={T.lima[1]} />
                <rect x="33" y="11" width="20" height="14" rx="1.5" fill={VIDRIO} />
            </PlanoIzq>
            <PlanoDer x={70} y={10} z={0}>
                <rect x="12" y="11" width="24" height="14" rx="1.5" fill={VIDRIO} />
            </PlanoDer>
            {/* Toldo */}
            <Bloque x={8} y={60} z={31} w={64} d={9} h={4} t={T.lima} />
        </g>
    );
}

function Camion() {
    return (
        <g>
            <Bloque x={0} y={38} z={4} w={90} d={24} h={5} t={T.navy} />
            <Bloque x={0} y={36} z={9} w={62} d={28} h={34} t={T.blanco} />
            <Bloque x={62} y={38} z={9} w={26} d={24} h={24} t={T.navy} />
            <PlanoDer x={88} y={38} z={9}>
                <rect x="3" y="10" width="18" height="11" rx="1.5" fill={VIDRIO} />
            </PlanoDer>
            <PlanoIzq x={62} y={62} z={9}>
                <rect x="4" y="11" width="12" height="10" rx="1.5" fill={VIDRIO} />
            </PlanoIzq>
            <PlanoIzq x={0} y={64} z={9}>
                <rect x="0" y="13" width="62" height="5" fill={T.lima[1]} />
            </PlanoIzq>
            <PlanoIzq x={0} y={62} z={0}>
                <Rueda cx={16} cy={6} />
                <Rueda cx={74} cy={6} />
            </PlanoIzq>
        </g>
    );
}

function Moto() {
    return (
        <g>
            {/* Caja de delivery de la tienda */}
            <Bloque x={8} y={41} z={23} w={24} d={18} h={20} t={T.navy} />
            <PlanoIzq x={8} y={59} z={23}>
                <rect x="0" y="8" width="24" height="4" fill={T.lima[1]} />
            </PlanoIzq>
            <Bloque x={16} y={44} z={10} w={40} d={12} h={9} t={T.lima} />
            <Bloque x={34} y={44} z={7} w={22} d={12} h={3} t={T.navy} />
            <Bloque x={22} y={44} z={19} w={26} d={12} h={5} t={T.navy} />
            {/* Escudo delantero: es lo que hace que se lea como scooter y no como carrito */}
            <Bloque x={56} y={44} z={7} w={9} d={12} h={24} t={T.lima} />
            <Bloque x={59} y={47} z={31} w={5} d={6} h={6} t={T.navy} />
            <Bloque x={57} y={40} z={37} w={5} d={20} h={3} t={T.navy} />
            <PlanoDer x={65} y={44} z={24}>
                <circle cx="6" cy="0" r="2.8" fill="#FFFFFF" />
            </PlanoDer>
            <PlanoIzq x={0} y={50} z={0}>
                <Rueda cx={22} cy={7} />
                <Rueda cx={70} cy={7} />
            </PlanoIzq>
        </g>
    );
}

/* ─── Íconos de las tres entregas (checkout) ─────────────────────────── */

const VISTA_ICONO = {
    retiro:   '-62 -46 126 118',
    envio:    '-62 -34 114 116',
    delivery: '-54 -30 98 100',
};

export function IconoEntrega({ tipo, className = 'h-16 w-16', animado = false }) {
    const Pieza = { retiro: Tienda, envio: Camion, delivery: Moto }[tipo] ?? Tienda;
    const dibujo = tipo === 'retiro' ? <Pieza /> : <><Sombra x={45} y={50} rx={48} ry={14} /><Pieza /></>;

    return (
        <svg viewBox={VISTA_ICONO[tipo] ?? VISTA_ICONO.retiro} className={className} aria-hidden="true">
            {animado ? <Flota amp={3} dur={2.4}>{dibujo}</Flota> : dibujo}
        </svg>
    );
}

/* ─── Escenas de cada estado del pedido (seguimiento) ────────────────── */

function Destellos({ en }) {
    const quieto = useReducedMotion();
    const estrella = 'M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z';
    // framer pisa el atributo transform del elemento que anima: la posición va en un <g> aparte
    return en.map(([x, y, s, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
            <motion.path d={estrella} fill={c} initial={{ scale: s }}
                animate={quieto ? undefined : { opacity: [0, 1, 0], scale: [s * 0.4, s, s * 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.45 }} />
        </g>
    ));
}

function Insignia({ x, y, tono = T.lima[1], trazo = T.navy[2], children }) {
    const quieto = useReducedMotion();
    return (
        <motion.g initial={quieto ? false : { scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.25 }}>
            <circle cx={x} cy={y} r="15" fill={tono} />
            <circle cx={x} cy={y} r="15" fill="none" stroke="#fff" strokeWidth="3" />
            <g stroke={trazo} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none">{children}</g>
        </motion.g>
    );
}

function EscenaPendiente() {
    const quieto = useReducedMotion();
    return (
        <g>
            <Sombra x={47} y={43} rx={40} ry={13} />
            <Flota>
                <Bloque x={30} y={40} w={34} d={6} h={62} t={T.navy} />
                <PlanoIzq x={30} y={46} z={0}>
                    <rect x="3" y="5" width="28" height="53" rx="2.5" fill="#1C3A85" />
                    <rect x="9" y="24" width="16" height="16" rx="2" fill={T.lima[1]} />
                    <rect x="11" y="34" width="4" height="4" fill={T.navy[2]} />
                    <rect x="19" y="34" width="4" height="4" fill={T.navy[2]} />
                    <rect x="11" y="26" width="4" height="4" fill={T.navy[2]} />
                    <rect x="9" y="47" width="16" height="3" rx="1.5" fill={T.lima[0]} opacity="0.7" />
                </PlanoIzq>
            </Flota>
            {/* Moneda que cae */}
            <motion.g animate={quieto ? undefined : { y: [-10, 6, -10] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
                <circle cx="52" cy="-42" r="10" fill={T.lima[1]} />
                <circle cx="52" cy="-42" r="6.5" fill="none" stroke={T.lima[2]} strokeWidth="2" />
            </motion.g>
            {/* Reloj: te guardamos el equipo mientras pagas */}
            <g transform="translate(-40 -30)">
                <circle r="14" fill="#fff" stroke={T.navy[2]} strokeWidth="2.6" />
                <motion.g animate={quieto ? undefined : { rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
                    <circle r="10" fill="none" />
                    <line x1="0" y1="0" x2="0" y2="-8" stroke={T.navy[2]} strokeWidth="2.4" strokeLinecap="round" />
                </motion.g>
                <line x1="0" y1="0" x2="5" y2="2" stroke={T.lima[2]} strokeWidth="2.4" strokeLinecap="round" />
            </g>
        </g>
    );
}

function EscenaRevision() {
    const quieto = useReducedMotion();
    const [cx, cy] = iso(46, 44, 40);
    return (
        <g>
            <Sombra x={46} y={42} rx={40} ry={13} />
            <Bloque x={26} y={40} w={40} d={4} h={58} t={T.blanco} />
            <PlanoIzq x={26} y={44} z={0}>
                <rect x="6" y="46" width="22" height="3.2" rx="1.6" fill="#9AA8C7" />
                <rect x="6" y="38" width="28" height="3.2" rx="1.6" fill="#9AA8C7" />
                <rect x="6" y="30" width="18" height="3.2" rx="1.6" fill="#9AA8C7" />
                <rect x="6" y="20" width="14" height="3.2" rx="1.6" fill={T.lima[1]} />
                <rect x="6" y="8" width="28" height="4.5" rx="2" fill={T.navy[2]} />
            </PlanoIzq>
            <motion.g animate={quieto ? undefined : { x: [-16, 14, -16], y: [0, 6, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}>
                <line x1={cx + 11} y1={cy + 11} x2={cx + 25} y2={cy + 25} stroke={T.navy[2]} strokeWidth="6" strokeLinecap="round" />
                <circle cx={cx} cy={cy} r="15" fill="rgba(198,203,54,0.22)" stroke={T.navy[2]} strokeWidth="4" />
            </motion.g>
        </g>
    );
}

function EscenaPagado() {
    const quieto = useReducedMotion();
    return (
        <g>
            <Sombra x={48} y={45} rx={44} ry={14} />
            <Flota>
                <Bloque x={26} y={40} w={44} d={10} h={50} t={T.lima} />
                <PlanoIzq x={26} y={50} z={0}>
                    <motion.path d="M11 26 L19 17 L34 35" fill="none" stroke={T.navy[2]} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
                        initial={quieto ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
                </PlanoIzq>
            </Flota>
            <Destellos en={[[-30, -40, 1.1, T.lima[1]], [58, -30, 0.9, T.navy[1]], [-44, 6, 0.7, T.navy[1]], [52, 18, 1, T.lima[1]]]} />
        </g>
    );
}

function EscenaPreparando() {
    const quieto = useReducedMotion();
    const caja = { x: 18, y: 22, w: 58, d: 44, h: 30 };
    return (
        <g>
            <Sombra x={47} y={44} rx={52} ry={17} />
            {/* Solapas de atrás, abiertas */}
            <polygon points={pts([18, 22, 30], [76, 22, 30], [76, 11, 45], [18, 11, 45])} fill={T.carton[0]} />
            <polygon points={pts([18, 22, 30], [18, 66, 30], [7, 66, 45], [7, 22, 45])} fill={T.carton[1]} />
            <Bloque {...caja} caras="top" t={['#B98A4E', '', '']} />
            {/* El equipo entra a la caja */}
            <motion.g animate={quieto ? undefined : { y: [-30, 0, 0] }} transition={{ duration: 2.8, times: [0, 0.55, 1], repeat: Infinity, ease: 'easeOut' }}>
                <Bloque x={34} y={34} z={24} w={26} d={18} h={11} t={T.blanco} />
                <PlanoSuelo x={34} y={34} z={35}>
                    <rect x="10" y="6" width="6" height="6" rx="3" fill={T.navy[1]} />
                </PlanoSuelo>
            </motion.g>
            <Bloque {...caja} caras="izq der" t={T.carton} />
            <PlanoIzq x={18} y={66} z={0}>
                <rect x="24" y="0" width="10" height="30" fill="#E9C98A" opacity="0.7" />
            </PlanoIzq>
        </g>
    );
}

function EscenaEnCamino({ delivery }) {
    const quieto = useReducedMotion();
    return (
        <g>
            <PlanoSuelo x={-40} y={30}>
                <rect x="0" y="0" width="190" height="40" fill="#E6EBF3" />
                <rect x="0" y="0" width="190" height="2" fill="#D3DAE6" />
                <rect x="0" y="38" width="190" height="2" fill="#D3DAE6" />
            </PlanoSuelo>
            <PlanoSuelo x={-40} y={49}>
                <motion.g animate={quieto ? undefined : { x: [0, -24] }} transition={{ duration: 0.55, repeat: Infinity, ease: 'linear' }}>
                    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={i * 24} y="0" width="12" height="2.6" rx="1.3" fill="#fff" />)}
                </motion.g>
            </PlanoSuelo>
            <Sombra x={45} y={50} rx={50} ry={14} />
            <motion.g animate={quieto ? undefined : { y: [0, -1.6, 0] }} transition={{ duration: 0.45, repeat: Infinity }}>
                {delivery ? <Moto /> : <Camion />}
            </motion.g>
            {/* Líneas de velocidad */}
            {!quieto && [0, 1, 2].map((i) => (
                <motion.line key={i} x1={-60 - i * 4} y1={-2 + i * 9} x2={-44 - i * 4} y2={6 + i * 9}
                    stroke={T.navy[1]} strokeWidth="2.4" strokeLinecap="round"
                    animate={{ opacity: [0, 0.6, 0], x: [6, -6] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />
            ))}
        </g>
    );
}

function EscenaEntregado({ retiro }) {
    return (
        <g>
            {retiro ? <Tienda /> : (
                <g>
                    <Sombra x={48} y={40} rx={56} ry={18} />
                    <Bloque x={20} y={10} w={56} d={44} h={34} t={T.blanco} />
                    <polygon points={pts([76, 10, 34], [76, 54, 34], [76, 32, 54])} fill={T.blanco[2]} />
                    <polygon points={pts([16, 58, 32], [80, 58, 32], [80, 32, 56], [16, 32, 56])} fill={T.navy[1]} />
                    <polygon points={pts([80, 58, 32], [80, 32, 56], [80, 31, 53], [80, 55, 31])} fill={T.navy[2]} />
                    <PlanoIzq x={20} y={54} z={0}>
                        <rect x="22" y="0" width="14" height="22" rx="1.5" fill={T.navy[2]} />
                        <circle cx="33" cy="11" r="1.2" fill={T.lima[1]} />
                        <rect x="42" y="12" width="10" height="10" rx="1.5" fill={VIDRIO} />
                    </PlanoIzq>
                    <PlanoDer x={76} y={10} z={0}>
                        <rect x="14" y="12" width="14" height="10" rx="1.5" fill={VIDRIO} />
                    </PlanoDer>
                    <Bloque x={36} y={60} w={16} d={14} h={12} t={T.carton} />
                    <PlanoSuelo x={36} y={60} z={12}>
                        <rect x="6" y="0" width="4" height="14" fill="#E9C98A" />
                    </PlanoSuelo>
                </g>
            )}
            <Insignia x={54} y={-34}>
                <path d={`M47.5 -34 L52 -29.5 L60.5 -38.5`} />
            </Insignia>
        </g>
    );
}

function EscenaCancelado() {
    return (
        <g>
            <Sombra x={48} y={46} rx={44} ry={14} />
            <Bloque x={24} y={26} w={48} d={40} h={34} t={T.apagado} />
            <PlanoSuelo x={24} y={26} z={34}>
                <rect x="21" y="0" width="6" height="40" fill="#C9CED8" />
            </PlanoSuelo>
            <Insignia x={52} y={-30} tono="#FEE2E2" trazo="#B91C1C">
                <path d="M46 -36 L58 -24 M58 -36 L46 -24" />
            </Insignia>
        </g>
    );
}

/**
 * La escena del estado actual. `entrega` cambia el vehículo (camión o moto) y el cierre
 * (casa o tienda).
 */
export function EscenaEstado({ estado, entrega, className = 'h-48 w-48' }) {
    const escenas = {
        pendiente_pago:   <EscenaPendiente />,
        pago_en_revision: <EscenaRevision />,
        pagado:           <EscenaPagado />,
        preparando:       <EscenaPreparando />,
        enviado:          <EscenaEnCamino delivery={entrega === 'delivery'} />,
        entregado:        <EscenaEntregado retiro={entrega === 'retiro'} />,
        cancelado:        <EscenaCancelado />,
    };

    return (
        <svg viewBox="-72 -62 150 142" className={className} role="img" aria-label={`Estado del pedido: ${estado}`}>
            {escenas[estado] ?? escenas.pendiente_pago}
        </svg>
    );
}
