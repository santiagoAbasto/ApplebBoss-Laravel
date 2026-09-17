import { useId } from 'react';
import { BatteryCharge, Gamepad, Headphones, Keyboard, Package, Precision, Remote, Voice, Watch } from '@/Components/Store/Icons';

// Ilustración de un accesorio o de un producto Apple mientras no tenga foto. Se dibuja por la forma de su ficha
// (`sistema.forma`): cargador, vidrio, protector de cámara, funda, cable, parlante o control en los accesorios; iPad,
// reloj, AirPods, audífonos de diadema, Apple Pencil o Magic Mouse en los productos Apple. El resto usa su ícono.
// Misma línea que las ilustraciones del iPhone y la Mac (ModeloVisual): cuerpos claros, pantallas azul noche, sombra
// suave y nada de logos. El cargador lleva su potencia en el frente («20W») y la funda MagSafe, su anillo de imanes.

const CARCASA = ['#FFFFFF', '#E3E6F1'];
const PANTALLA = ['#2B3670', '#141B3C', '#0A0F26'];
const TRAZO = 'rgba(1,20,70,0.16)';

function Sombra({ ancho, y = 222 }) {
  return <ellipse cx="100" cy={y} rx={ancho} ry="4.5" fill="rgba(1,20,70,0.10)" />;
}

function Degrade({ id, colores, x2 = 1, y2 = 1 }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {colores.map((c, i) => <stop key={c} offset={colores.length === 1 ? 0 : i / (colores.length - 1)} stopColor={c} />)}
    </linearGradient>
  );
}

/** Cubo de pared con las patas del enchufe arriba, el puerto USB‑C abajo y su potencia en el frente. */
function Cargador({ id, etiqueta }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`cubo-${id}`} colores={CARCASA} />
        <Degrade id={`pata-${id}`} colores={['#C3C8D6', '#F4F5F9', '#B6BCCC']} y2={0} />
      </defs>
      <Sombra ancho={54} />
      <rect x="79" y="46" width="9" height="36" rx="2.5" fill={`url(#pata-${id})`} stroke="rgba(1,20,70,0.2)" strokeWidth="0.8" />
      <rect x="112" y="46" width="9" height="36" rx="2.5" fill={`url(#pata-${id})`} stroke="rgba(1,20,70,0.2)" strokeWidth="0.8" />
      <rect x="50" y="80" width="100" height="138" rx="24" fill={`url(#cubo-${id})`} stroke={TRAZO} />
      <rect x="52.5" y="82.5" width="95" height="133" rx="22" fill="none" stroke="#FFFFFF" strokeOpacity="0.9" />
      {etiqueta && (
        <text x="100" y="152" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="0.6"
          fill="rgba(1,20,70,0.32)" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">{etiqueta}</text>
      )}
      <rect x="83" y="186" width="34" height="12" rx="6" fill="#1C2340" />
      <rect x="89" y="190.75" width="22" height="2.5" rx="1.25" fill="#5A6390" />
    </svg>
  );
}

/** Frente de un iPhone con la lámina de vidrio corrida hacia arriba, para que se vea que es una capa aparte. */
function Vidrio({ id }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`pantalla-${id}`} colores={PANTALLA} />
        <linearGradient id={`lamina-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.62" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.34" />
        </linearGradient>
      </defs>
      <Sombra ancho={46} />
      <rect x="64" y="30" width="84" height="186" rx="19" fill="#1C223F" stroke="rgba(1,20,70,0.25)" />
      <rect x="68" y="34" width="76" height="178" rx="16" fill={`url(#pantalla-${id})`} />
      <rect x="92" y="41" width="28" height="8.5" rx="4.25" fill="#05081A" />
      <g transform="translate(-13 -10)">
        <rect x="68" y="34" width="76" height="178" rx="16" fill={`url(#lamina-${id})`} stroke="#FFFFFF" strokeOpacity="0.95" strokeWidth="1.5" />
        <path d="M80 70L124 46M78 104L140 70" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Dorso de un iPhone con los aros de vidrio sobre cada lente de la cámara. */
function ProtectorCamara({ id }) {
  const lentes = [[80, 70], [80, 102], [110, 86]];
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`cuerpo-${id}`} colores={['#FFFFFF', '#E6E9F4']} />
        <radialGradient id={`lente-${id}`} cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#4A5696" />
          <stop offset="0.55" stopColor="#141B3C" />
          <stop offset="1" stopColor="#060918" />
        </radialGradient>
      </defs>
      <Sombra ancho={52} />
      <rect x="48" y="34" width="104" height="184" rx="24" fill={`url(#cuerpo-${id})`} stroke={TRAZO} />
      <rect x="60" y="48" width="74" height="76" rx="21" fill="rgba(1,20,70,0.06)" stroke="rgba(1,20,70,0.12)" strokeWidth="0.8" />
      {lentes.map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="15.5" fill="rgba(255,255,255,0.4)" stroke="#585E9F" strokeWidth="2.6" />
          <circle cx={cx} cy={cy} r="10.5" fill="#1C2340" />
          <circle cx={cx} cy={cy} r="7.5" fill={`url(#lente-${id})`} />
          <path d={`M${cx - 9} ${cy - 5}a11 11 0 0 1 7-6`} stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>
      ))}
      <circle cx="113" cy="61" r="4" fill="#F4E7BF" stroke="rgba(1,20,70,0.15)" strokeWidth="0.5" />
    </svg>
  );
}

/** Funda vista de atrás: el recorte deja ver la cámara del iPhone. La funda MagSafe lleva su anillo de imanes. */
function Funda({ id, magsafe }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`funda-${id}`} colores={['#8C92CF', '#585E9F']} />
      </defs>
      <Sombra ancho={50} />
      <rect x="54" y="24" width="98" height="194" rx="25" fill={`url(#funda-${id})`} />
      <rect x="59" y="29" width="88" height="184" rx="21" fill="none" stroke="#FFFFFF" strokeOpacity="0.28" />
      <rect x="152" y="70" width="3.5" height="26" rx="1.75" fill="#4A5096" />
      <rect x="152" y="104" width="3.5" height="18" rx="1.75" fill="#4A5096" />
      <rect x="64" y="36" width="46" height="46" rx="14" fill="#E6E9F4" stroke="rgba(1,20,70,0.22)" />
      {[[77, 50], [77, 69], [97, 59.5]].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="7" fill="#1C2340" />
          <circle cx={cx - 2} cy={cy - 2} r="1.6" fill="#FFFFFF" fillOpacity="0.45" />
        </g>
      ))}
      {magsafe && <circle cx="103" cy="134" r="26" fill="none" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="3" />}
    </svg>
  );
}

/** Cable en U con un conector en cada punta. */
function Cable({ id }) {
  const conector = (x) => (
    <g key={x}>
      <rect x={x - 5} y="26" width="10" height="16" rx="3" fill={`url(#metal-${id})`} stroke="rgba(1,20,70,0.2)" strokeWidth="0.8" />
      <rect x={x - 9} y="40" width="18" height="30" rx="6" fill={`url(#cabeza-${id})`} stroke={TRAZO} />
    </g>
  );
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`cabeza-${id}`} colores={CARCASA} />
        <Degrade id={`metal-${id}`} colores={['#C3C8D6', '#F4F5F9', '#B6BCCC']} y2={0} />
      </defs>
      <Sombra ancho={48} />
      <path d="M72 68V150c0 52 56 52 56 0V68" fill="none" stroke="rgba(1,20,70,0.14)" strokeWidth="9" strokeLinecap="round" />
      <path d="M72 68V150c0 52 56 52 56 0V68" fill="none" stroke="#FFFFFF" strokeWidth="6.5" strokeLinecap="round" />
      {conector(72)}
      {conector(128)}
    </svg>
  );
}

/** Parlante inteligente esférico, de tela, con su anillo de luz abajo. */
function Parlante({ id }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id={`tela-${id}`} cx="0.38" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#5F669A" />
          <stop offset="1" stopColor="#23284A" />
        </radialGradient>
        <pattern id={`trama-${id}`} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.8" fill="#FFFFFF" fillOpacity="0.1" />
        </pattern>
      </defs>
      <Sombra ancho={60} />
      <circle cx="100" cy="132" r="76" fill={`url(#tela-${id})`} />
      <circle cx="100" cy="132" r="76" fill={`url(#trama-${id})`} />
      <ellipse cx="76" cy="94" rx="24" ry="13" fill="#FFFFFF" fillOpacity="0.07" />
      <ellipse cx="100" cy="196" rx="46" ry="7.5" fill="none" stroke="#7FD4FF" strokeOpacity="0.9" strokeWidth="3" />
    </svg>
  );
}

/** Control de consola visto de frente. */
function Control({ id }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`control-${id}`} colores={CARCASA} />
      </defs>
      <Sombra ancho={66} y={198} />
      <path d="M46 104c0-15 12-24 28-24h52c16 0 28 9 28 24l10 50c4 20-10 32-24 26-9-4-13-13-20-20H80c-7 7-11 16-20 20-14 6-28-6-24-26z"
        fill={`url(#control-${id})`} stroke={TRAZO} />
      <rect x="84" y="88" width="32" height="22" rx="6" fill="#1C2340" />
      <circle cx="80" cy="132" r="11" fill="#1C2340" /><circle cx="80" cy="132" r="6" fill="#3A4270" />
      <circle cx="120" cy="132" r="11" fill="#1C2340" /><circle cx="120" cy="132" r="6" fill="#3A4270" />
      <path d="M58 102h14M65 95v14" stroke="#1C2340" strokeWidth="5" strokeLinecap="round" />
      {[[140, 94], [150, 104], [140, 114], [130, 104]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.2" fill="#585E9F" />)}
    </svg>
  );
}

// ─── Productos Apple (base productos_apple.php): iPad, Apple Watch, AirPods, Apple Pencil y Magic Mouse ─────────────

/** iPad de frente, con sus proporciones reales (alto y ancho de la ficha), bordes parejos y el botón superior. */
function Tablet({ id, altoMm = 248.6, anchoMm = 179.5 }) {
  const alto = 190;
  const ancho = Math.round(alto * (anchoMm / altoMm));
  const x = 100 - ancho / 2;
  const y = 22;
  const borde = Math.max(7, Math.round(ancho * 0.06));
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`cuerpo-${id}`} colores={['#F4F5F9', '#D7DBE8']} />
        <Degrade id={`pantalla-${id}`} colores={PANTALLA} />
      </defs>
      <Sombra ancho={ancho / 2 + 6} y={219} />
      <rect x={x + ancho - 34} y={y - 2.5} width="18" height="4" rx="2" fill="#C3C8D6" />
      <rect x={x} y={y} width={ancho} height={alto} rx="14" fill={`url(#cuerpo-${id})`} stroke={TRAZO} />
      <rect x={x + borde} y={y + borde} width={ancho - borde * 2} height={alto - borde * 2} rx="7" fill={`url(#pantalla-${id})`} />
      <path d={`M${x + borde + 10} ${y + borde + 18}l${ancho * 0.3} -10`} stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="14" strokeLinecap="round" />
    </svg>
  );
}

/** Apple Watch de frente: caja con esquinas redondeadas, pantalla negra, Digital Crown y botón lateral, y la correa. */
function Reloj({ id, altoMm = 46, anchoMm = 39 }) {
  const alto = 112;
  const ancho = Math.round(alto * (anchoMm / altoMm));
  const x = 100 - ancho / 2;
  const y = 64;
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`caja-${id}`} colores={['#3A3F55', '#1B1F30']} />
        <Degrade id={`correa-${id}`} colores={['#2E3350', '#1A1E33']} x2={0} />
      </defs>
      <Sombra ancho={40} y={226} />
      <path d={`M${x + 12} ${y + 6}L${x + 16} 14h${ancho - 32}L${x + ancho - 12} ${y + 6}z`} fill={`url(#correa-${id})`} />
      <path d={`M${x + 12} ${y + alto - 6}L${x + 16} 222h${ancho - 32}L${x + ancho - 12} ${y + alto - 6}z`} fill={`url(#correa-${id})`} />
      <rect x={x + ancho - 2} y={y + 30} width="9" height="18" rx="3.5" fill="#4A5068" />
      <rect x={x + ancho - 1} y={y + 58} width="5" height="22" rx="2.5" fill="#3A3F55" />
      <rect x={x} y={y} width={ancho} height={alto} rx="26" fill={`url(#caja-${id})`} stroke="rgba(255,255,255,0.14)" />
      <rect x={x + 7} y={y + 7} width={ancho - 14} height={alto - 14} rx="20" fill="#05070F" />
      <circle cx="100" cy={y + alto / 2} r="18" fill="none" stroke="#7FD4FF" strokeOpacity="0.55" strokeWidth="3.5" strokeDasharray="70 200" strokeLinecap="round" />
      <circle cx="100" cy={y + alto / 2} r="11" fill="none" stroke="#C6CB36" strokeOpacity="0.6" strokeWidth="3.5" strokeDasharray="40 200" strokeLinecap="round" />
    </svg>
  );
}

/** Un audífono con tallo, visto de costado. `pro`: con almohadilla de silicona. */
function Audifono({ x, id, pro, espejo = false }) {
  const t = espejo ? `translate(${x * 2 + 0} 0) scale(-1 1)` : undefined;
  return (
    <g transform={t}>
      <rect x={x - 7} y="96" width="14" height="92" rx="7" fill={`url(#blanco-${id})`} stroke={TRAZO} />
      <circle cx={x} cy="84" r="26" fill={`url(#blanco-${id})`} stroke={TRAZO} />
      {/* Hacia afuera: la almohadilla de silicona (Pro) o la rejilla del parlante */}
      {pro
        ? <ellipse cx={x + 22} cy="78" rx="10" ry="13" fill="#E7EAF3" stroke={TRAZO} />
        : <ellipse cx={x + 15} cy="78" rx="6" ry="9" fill="#1C2340" fillOpacity="0.85" />}
      <rect x={x - 3} y="178" width="6" height="6" rx="3" fill="#C3C8D6" />
    </g>
  );
}

/** AirPods de frente: los dos audífonos con su tallo. `variante`: pro (con almohadillas) o abiertos. */
function Audifonos({ id, variante }) {
  const pro = variante === 'pro';
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs><Degrade id={`blanco-${id}`} colores={CARCASA} /></defs>
      <Sombra ancho={58} y={206} />
      <Audifono x={132} id={id} pro={pro} />
      <Audifono x={68} id={id} pro={pro} espejo />
    </svg>
  );
}

/** Audífonos de diadema: la diadema de malla, los brazos y las orejeras con sus almohadillas. */
function AudifonosDiadema({ id }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`copa-${id}`} colores={['#2E3350', '#161A2C']} />
        <Degrade id={`malla-${id}`} colores={['#4A5068', '#2A2F45']} x2={0} />
      </defs>
      <Sombra ancho={70} y={212} />
      <path d="M44 128V96a56 56 0 0 1 112 0v32" fill="none" stroke="#2A2F45" strokeWidth="8" strokeLinecap="round" />
      <path d="M58 104a42 42 0 0 1 84 0" fill="none" stroke={`url(#malla-${id})`} strokeWidth="12" strokeLinecap="round" />
      <path d="M58 104a42 42 0 0 1 84 0" fill="none" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="12" strokeDasharray="1.5 3" />
      {[30, 136].map((x) => (
        <g key={x}>
          <rect x={x} y="122" width="34" height="74" rx="15" fill={`url(#copa-${id})`} stroke="rgba(255,255,255,0.12)" />
          <rect x={x === 30 ? x + 26 : x - 4} y="130" width="12" height="58" rx="6" fill="#3A3F55" />
        </g>
      ))}
      <rect x="160" y="132" width="6" height="12" rx="3" fill="#4A5068" />
    </svg>
  );
}

/** Apple Pencil en diagonal: cuerpo blanco con su lado plano y la punta. */
function Lapiz({ id }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs><Degrade id={`lapiz-${id}`} colores={['#FFFFFF', '#DDE1EC']} x2={0} y2={1} /></defs>
      <Sombra ancho={54} y={212} />
      <g transform="rotate(-38 100 120)">
        <rect x="93" y="18" width="14" height="186" rx="6" fill={`url(#lapiz-${id})`} stroke={TRAZO} />
        <rect x="104" y="30" width="3" height="150" fill="#C9CEDC" fillOpacity="0.8" />
        <path d="M93 204h14l-5 22h-4z" fill="#F4F5F9" stroke={TRAZO} />
        <path d="M98.5 222h3l-.9 5h-1.2z" fill="#6B7185" />
      </g>
    </svg>
  );
}

/** Magic Mouse visto desde arriba: forma alargada y plana, con la superficie Multi‑Touch. */
function Mouse({ id }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id={`raton-${id}`} cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9DDE9" />
        </radialGradient>
      </defs>
      <Sombra ancho={46} y={214} />
      <rect x="58" y="26" width="84" height="182" rx="42" fill={`url(#raton-${id})`} stroke={TRAZO} />
      <path d="M100 36v44" stroke="rgba(1,20,70,0.10)" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="86" cy="70" rx="14" ry="26" fill="#FFFFFF" fillOpacity="0.55" />
    </svg>
  );
}

/** Monitor selfie de 5 pulgadas: pantalla apaisada con marco fino y el anillo de imanes que se ve de costado. */
function Monitor({ id }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <Degrade id={`marco-${id}`} colores={['#3A3F55', '#1B1F30']} />
        <Degrade id={`pantalla-${id}`} colores={PANTALLA} />
      </defs>
      <Sombra ancho={70} y={172} />
      <rect x="26" y="78" width="148" height="86" rx="10" fill={`url(#marco-${id})`} stroke="rgba(255,255,255,0.14)" />
      <rect x="33" y="85" width="134" height="72" rx="5" fill={`url(#pantalla-${id})`} />
      <circle cx="100" cy="121" r="17" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="100" cy="121" r="5" fill="#FFFFFF" fillOpacity="0.35" />
      <path d="M40 94l30-6" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

/** Ventilador de cuello visto de frente: el arco que abraza el cuello, con las rejillas de los ventiladores. */
function VentiladorCuello({ id }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs><Degrade id={`cuello-${id}`} colores={['#3A3F55', '#1B1F30']} /></defs>
      <Sombra ancho={64} y={206} />
      <path d="M46 96c0 64 26 96 54 96s54-32 54-96" fill="none" stroke={`url(#cuello-${id})`} strokeWidth="30" strokeLinecap="round" />
      <path d="M46 96c0 64 26 96 54 96s54-32 54-96" fill="none" stroke="#FFFFFF" strokeOpacity="0.10" strokeWidth="30" strokeLinecap="round" strokeDasharray="1.5 4" />
      {[[46, 104], [154, 104], [58, 148], [142, 148]].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="9" fill="#11152A" />
          <circle cx={cx} cy={cy} r="9" fill="none" stroke="#7FD4FF" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="3 2" />
        </g>
      ))}
    </svg>
  );
}

const DIBUJOS = {
  cargador: Cargador, vidrio: Vidrio, protector_camara: ProtectorCamara, funda: Funda, cable: Cable, parlante: Parlante, control: Control,
  tablet: Tablet, reloj: Reloj, audifonos: Audifonos, audifonos_diadema: AudifonosDiadema, lapiz: Lapiz, mouse: Mouse,
  monitor: Monitor, ventilador_cuello: VentiladorCuello,
};

const ICONOS = {
  teclado: Keyboard, mouse: Precision, audifonos: Headphones, reloj: Watch, bateria: BatteryCharge, auto: Voice,
  streaming: Remote, juego: Gamepad, otro: Package,
};

/**
 * `visual`: { forma, etiqueta } de la ficha del accesorio o, en un producto Apple, { forma, alto_mm, ancho_mm } o
 * { forma, variante } (ModeloReferencia::visual).
 */
export default function AccesorioVisual({ visual }) {
  const id = useId().replace(/:/g, '');
  const Dibujo = DIBUJOS[visual?.forma];
  if (Dibujo) {
    return (
      <Dibujo id={id} etiqueta={visual.etiqueta} magsafe={visual.etiqueta === 'MagSafe'}
        altoMm={visual.alto_mm ?? undefined} anchoMm={visual.ancho_mm ?? undefined} variante={visual.variante} />
    );
  }
  const Icono = ICONOS[visual?.forma] ?? Package;
  return (
    <div className="grid h-full w-full place-items-center">
      <Icono className="h-1/3 w-1/3" strokeWidth={1.1} style={{ color: 'var(--ab-navy)' }} />
    </div>
  );
}
