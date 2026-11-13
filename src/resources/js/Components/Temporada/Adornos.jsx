// Adornos de la campaña de Navidad: piezas chicas, planas y sin contorno, que acompañan sin tapar nada.
//
// Una sola familia visual: formas redondeadas, relleno plano con una sombra del mismo tono y la paleta de
// `resources/css/navidad.css` (--nv-*). Todos son decorativos: `aria-hidden`, sin foco y sin capturar clics.
// Si alguno tiene que decir algo, se le pasa `titulo` y entonces se anuncia como imagen.

export const NV = {
  pino: 'var(--nv-pino, #143D2B)',
  pinoClaro: 'var(--nv-pino-claro, #1F5A40)',
  burdeos: 'var(--nv-burdeos, #A42635)',
  burdeosOscuro: 'var(--nv-burdeos-oscuro, #7E1B28)',
  oro: 'var(--nv-oro, #B88A44)',
  oroClaro: 'var(--nv-oro-claro, #E2BC72)',
  marfil: 'var(--nv-marfil, #FFF8EE)',
  piel: '#F2C9A5',
  pielSombra: '#E3A988',
  tinta: '#2A1B14',
  navy: '#011446',
};

/** El envoltorio común: decorativo por defecto, imagen con nombre si lleva `titulo`. */
export function Svg({ viewBox, titulo, className = '', children, ...rest }) {
  const accesible = titulo ? { role: 'img', 'aria-label': titulo } : { 'aria-hidden': true, focusable: 'false' };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} className={`nv-svg ${className}`} {...accesible} {...rest}>
      {children}
    </svg>
  );
}

const DESTELLO = 'M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z';

/** Gorro para acompañar el logotipo: se apoya encima, no modifica el archivo de la marca. */
export function Gorro(props) {
  return (
    <Svg viewBox="0 0 68 60" {...props}>
      {/* cono que cae hacia la derecha */}
      <path d="M10 43C9 24 22 8 39 8C51 8 60 17 60 31C57 26 52 24 48 27C44 30 45 37 46 43Z" fill={NV.burdeos} />
      <path d="M46 43C45 37 44 30 48 27C52 24 57 26 60 31C60 26 59 22 56 18C50 18 45 21 42 26C39 32 40 38 41 43Z" fill={NV.burdeosOscuro} />
      <path d="M17 34C19 25 25 18 34 14" fill="none" stroke="#C4505C" strokeWidth="3" strokeLinecap="round" opacity=".75" />
      {/* borde de piel, con volumen */}
      <rect x="4" y="38" width="46" height="14" rx="7" fill={NV.marfil} />
      {[10, 19, 28, 37, 45].map((x) => <circle key={x} cx={x} cy="40" r="5.6" fill={NV.marfil} />)}
      <path d="M9 49.500H45" stroke="#E9DCC6" strokeWidth="2.400" strokeLinecap="round" />
      {/* pompón */}
      <circle cx="60" cy="34" r="7" fill={NV.marfil} />
      <path d="M56 38.500C58.500 40 62 39.500 64 37" fill="none" stroke="#E9DCC6" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Saco de regalos: el ícono del carrito en Navidad. */
export function Saco(props) {
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <rect x="13" y="6" width="11" height="11" rx="2" fill={NV.oroClaro} transform="rotate(-12 18 12)" />
      <rect x="25" y="4" width="11" height="12" rx="2" fill={NV.marfil} transform="rotate(9 30 10)" />
      <rect x="29.500" y="4" width="2.600" height="12" fill={NV.burdeos} transform="rotate(9 30 10)" />
      <path d="M10 22C6 30 5 44 24 44C43 44 42 30 38 22C34 18 14 18 10 22Z" fill={NV.burdeos} />
      <path d="M30 20C38 24 40 36 34 43C42 40 41 29 38 22C36 20 33 19.500 30 20Z" fill={NV.burdeosOscuro} />
      <path d="M11 21C16 17 32 17 37 21" fill="none" stroke={NV.oroClaro} strokeWidth="3" strokeLinecap="round" />
      <path d={DESTELLO} fill={NV.oroClaro} transform="translate(17 26) scale(.5)" />
    </Svg>
  );
}

/** Destello de cuatro puntas: la «estrella» del sistema. */
export function Estrella({ color = NV.oroClaro, ...props }) {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <path d={DESTELLO} fill={color} />
    </Svg>
  );
}

/** Regalo con lazo. `tono` cambia la caja: burdeos, pino, marfil o navy. */
export function Regalo({ tono = 'burdeos', ...props }) {
  const caja = { burdeos: [NV.burdeos, NV.burdeosOscuro], pino: [NV.pinoClaro, NV.pino], marfil: [NV.marfil, '#EADFCB'], navy: ['#0A1F5C', NV.navy] }[tono] ?? [NV.burdeos, NV.burdeosOscuro];

  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <rect x="7" y="21" width="34" height="23" rx="3" fill={caja[0]} />
      <rect x="7" y="21" width="34" height="5" fill={caja[1]} opacity=".55" />
      <rect x="4" y="14" width="40" height="9" rx="3" fill={caja[1]} />
      <rect x="21" y="14" width="6" height="30" fill={NV.oroClaro} />
      <g className="nv-lazo">
        <path d="M24 14C19 4 8 5 11 12C13 16 20 15 24 14Z" fill={NV.oro} />
        <path d="M24 14C29 4 40 5 37 12C35 16 28 15 24 14Z" fill={NV.oro} />
        <circle cx="24" cy="13.5" r="2.6" fill={NV.oroClaro} />
      </g>
    </Svg>
  );
}

/** Esfera de árbol. */
export function Esfera({ color = NV.burdeos, ...props }) {
  return (
    <Svg viewBox="0 0 32 40" {...props}>
      <circle cx="16" cy="4" r="2.4" fill="none" stroke={NV.oro} strokeWidth="1.6" />
      <rect x="12.5" y="6" width="7" height="5" rx="1.5" fill={NV.oro} />
      <circle cx="16" cy="25" r="13" fill={color} />
      <path d="M4 22C10 26 22 26 28 22" fill="none" stroke={NV.oroClaro} strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
      <ellipse cx="11" cy="19.5" rx="2.6" ry="4.4" fill="#fff" opacity=".24" transform="rotate(24 11 19.5)" />
    </Svg>
  );
}

/** Campana con moño. */
export function Campana(props) {
  return (
    <Svg viewBox="0 0 40 46" {...props}>
      <circle cx="20" cy="40" r="3.6" fill={NV.oro} />
      <path d="M20 8C12 8 9 15 9 23C9 30 6 32 4 36H36C34 32 31 30 31 23C31 15 28 8 20 8Z" fill={NV.oroClaro} />
      <path d="M26 10C28 13 29 18 29 23C29 30 32 32 34 36H36C34 32 31 30 31 23C31 16 29 12 26 10Z" fill={NV.oro} />
      <path d="M20 8C16 3 9 4 11 8C12 10 17 9.5 20 8Z" fill={NV.burdeos} />
      <path d="M20 8C24 3 31 4 29 8C28 10 23 9.5 20 8Z" fill={NV.burdeos} />
      <circle cx="20" cy="8" r="2" fill={NV.burdeosOscuro} />
    </Svg>
  );
}

// Las agujas de la rama se calculan una vez: pares a cada lado de un tallo curvo.
const AGUJAS = Array.from({ length: 13 }, (_, i) => {
  const t = (i + 1) / 14;
  const x = 6 + t * 108;
  const y = 40 - t * 30 - Math.sin(t * Math.PI) * 4;
  const largo = 13 - t * 5;

  return { x, y, largo };
});

/** Rama de pino estilizada. `espejo` la voltea para cerrar una esquina. */
export function Rama({ espejo = false, ...props }) {
  return (
    <Svg viewBox="0 0 120 48" {...props}>
      <g transform={espejo ? 'translate(120 0) scale(-1 1)' : undefined} fill="none" strokeLinecap="round">
        <path d="M6 40C40 34 80 22 114 10" stroke={NV.pino} strokeWidth="2.6" />
        {AGUJAS.map(({ x, y, largo }, i) => (
          <g key={i} stroke={i % 2 ? NV.pinoClaro : NV.pino} strokeWidth="2.2">
            <path d={`M${x.toFixed(1)} ${y.toFixed(1)}l${(largo * 0.75).toFixed(1)} ${(-largo).toFixed(1)}`} />
            <path d={`M${x.toFixed(1)} ${y.toFixed(1)}l${(largo * 0.95).toFixed(1)} ${(largo * 0.55).toFixed(1)}`} />
          </g>
        ))}
        <circle cx="30" cy="38" r="3.4" fill={NV.burdeos} stroke="none" />
        <circle cx="37" cy="40.5" r="2.6" fill={NV.burdeosOscuro} stroke="none" />
      </g>
    </Svg>
  );
}

const FOCOS = [
  { x: 30, y: 17, color: NV.oroClaro },
  { x: 90, y: 17, color: NV.burdeos },
  { x: 150, y: 17, color: '#F4F0E6' },
  { x: 210, y: 17, color: NV.pinoClaro },
];
// Entre foco y foco cuelga un adorno chico: estrella, esfera, estrella, campanita
const COLGANTES = [60, 120, 180, 240];

function TramoDeLuces() {
  return (
    <Svg viewBox="0 0 240 46" className="nv-luces-tramo" preserveAspectRatio="xMidYMin meet">
      <path d="M0 4Q30 20 60 4T120 4T180 4T240 4" fill="none" stroke={NV.pino} strokeWidth="1.6" />
      <path d="M0 2Q30 13 60 2T120 2T180 2T240 2" fill="none" stroke={NV.oro} strokeWidth="1" opacity=".7" />
      {COLGANTES.map((x, i) => (
        <g key={x} className={`nv-pendulo nv-pendulo-${'abc'[i % 3]}`}>
          <path d={`M${x} 4V${i % 2 ? 22 : 16}`} stroke={NV.oro} strokeWidth="1" />
          {i % 2
            ? <circle cx={x} cy="27" r="5" fill={i === 1 ? NV.burdeos : NV.pinoClaro} />
            : <path d={DESTELLO} fill={NV.oroClaro} transform={`translate(${x - 6} 14) scale(.5)`} />}
        </g>
      ))}
      {FOCOS.map(({ x, y, color }, i) => (
        <g key={x}>
          <circle className={`nv-halo nv-foco-${i + 1}`} cx={x} cy={y + 3} r="10" fill={color} opacity=".28" />
          <rect x={x - 3} y={y - 7} width="6" height="4.4" rx="1.2" fill={NV.pino} />
          <ellipse className={`nv-foco nv-foco-${i + 1}`} cx={x} cy={y + 3} rx="5.4" ry="7.2" fill={color} />
          <ellipse cx={x - 1.8} cy={y + 0.5} rx="1.3" ry="2.4" fill="#fff" opacity=".55" />
        </g>
      ))}
    </Svg>
  );
}

/**
 * Tira de luces cálidas. Horizontal: una fila de tramos que se corta al ancho del contenedor.
 * `compacta` deja un solo tramo, para una tarjeta o el panel.
 */
export function Luces({ compacta = false, className = '' }) {
  return (
    <div className={`nv-luces ${compacta ? 'nv-luces-compacta' : ''} ${className}`} aria-hidden="true">
      {Array.from({ length: compacta ? 1 : 9 }, (_, i) => <TramoDeLuces key={i} />)}
    </div>
  );
}

/** El carrito de Navidad: un carrito de compras de verdad (se reconoce de un vistazo) que lleva un regalo. */
export function CarritoConRegalo(props) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <g className="nv-lazo">
        <rect x="12.6" y="9.4" width="10" height="8.6" rx="1.3" fill={NV.burdeos} />
        <rect x="16.5" y="9.4" width="2.2" height="8.6" fill={NV.oroClaro} />
        <path d="M17.6 9.4C15.6 5.800 12.400 7 13.600 8.700C14.400 9.700 16.400 9.600 17.600 9.400ZM17.600 9.400C19.600 5.800 22.800 7 21.600 8.700C20.800 9.700 18.800 9.600 17.600 9.400Z" fill={NV.oro} />
      </g>
      <path d="M3 6.500H6.600L9.700 20.500H23.400L26.300 10.500" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.300 14H10.800M24.400 14H25.300" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" />
      <circle cx="12" cy="25.500" r="2.100" fill="currentColor" />
      <circle cx="21.800" cy="25.500" r="2.100" fill="currentColor" />
    </Svg>
  );
}
