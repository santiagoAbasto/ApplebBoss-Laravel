// Personajes e ilustraciones de la campaña de Navidad. Misma familia que Adornos.jsx: formas redondeadas, relleno
// plano, sin contorno y sin filtros. Cada personaje se dibuja una vez (función `…Dibujo`, un <g>) y las escenas lo
// reutilizan con un `transform`, así no hay copias del mismo trazo.
//
// Este archivo se carga aparte (import() perezoso en Temporada/index.jsx): con la campaña apagada no se descarga.
import { NV, Svg } from './Adornos';

const DESTELLO = 'M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z';
const PELAJE = '#9A6B45';
const PELAJE_CLARO = '#C9A27A';
const PELAJE_OSCURO = '#6B4A2B';

function Destello({ x, y, s = 1, color = NV.oroClaro, className = '' }) {
  return <path className={className} d={DESTELLO} fill={color} transform={`translate(${x} ${y}) scale(${s})`} />;
}

function Sombra({ cx, cy, rx, ry = 5 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={NV.navy} opacity=".1" />;
}

/* ───────────── Papá Noel con un paquete de tecnología (saluda) — lienzo 160×200 ───────────── */
export function PapaNoelDibujo() {
  return (
    <g>
      <Sombra cx={80} cy={192} rx={50} ry={6} />
      {/* botas */}
      <rect x="55" y="160" width="21" height="28" rx="7" fill={NV.tinta} />
      <rect x="84" y="160" width="21" height="28" rx="7" fill={NV.tinta} />
      {/* brazo que saluda (se mueve como una sola pieza) */}
      <g className="nv-saludo">
        <path d="M47 108L27 78" stroke={NV.burdeos} strokeWidth="19" strokeLinecap="round" fill="none" />
        <path d="M30.500 83L26 76" stroke={NV.marfil} strokeWidth="21" strokeLinecap="round" fill="none" />
        <circle cx="21" cy="64" r="10" fill={NV.pinoClaro} />
      </g>
      {/* cuerpo */}
      <path d="M40 122C40 92 58 80 80 80C102 80 120 92 120 122V152C120 165 108 171 80 171C52 171 40 165 40 152Z" fill={NV.burdeos} />
      <path d="M104 86C114 93 120 105 120 122V152C120 160 116 165 108 168C110 150 110 110 104 86Z" fill={NV.burdeosOscuro} />
      <rect x="73" y="98" width="14" height="72" fill={NV.marfil} />
      <rect x="40" y="138" width="80" height="12" fill={NV.tinta} />
      <rect x="70" y="134" width="20" height="20" rx="4" fill={NV.oroClaro} />
      <rect x="75.500" y="139.500" width="9" height="9" rx="1.500" fill={NV.tinta} />
      <rect x="37" y="162" width="86" height="11" rx="5.500" fill={NV.marfil} />
      {/* paquete de tecnología */}
      <g className="nv-paquete">
        <rect x="104" y="118" width="44" height="36" rx="5" fill={NV.marfil} />
        <rect x="104" y="118" width="44" height="7" rx="3.500" fill="#EADFCB" />
        <rect x="118" y="127" width="16" height="22" rx="3.500" fill={NV.navy} />
        <rect x="120.500" y="130" width="11" height="14" rx="1.500" fill="#1F3A8A" />
        <Destello x={121.500} y={132.500} s={0.38} />
        <rect x="104" y="134" width="44" height="4" fill={NV.oroClaro} opacity=".0" />
      </g>
      {/* brazo que sostiene el paquete */}
      <path d="M113 106L122 124" stroke={NV.burdeos} strokeWidth="19" strokeLinecap="round" fill="none" />
      <circle cx="124" cy="132" r="10" fill={NV.pinoClaro} />
      {/* cabeza */}
      <circle cx="80" cy="62" r="24" fill={NV.piel} />
      <path d="M55 58C52 86 65 102 80 102C95 102 108 86 105 58C101 67 92 70 80 70C68 70 59 67 55 58Z" fill={NV.marfil} />
      <circle cx="64" cy="62" r="4.500" fill="#EFA08F" opacity=".55" />
      <circle cx="96" cy="62" r="4.500" fill="#EFA08F" opacity=".55" />
      <path d="M80 69C74 62 63 64 61 71C67 76 76 74 80 69Z" fill="#fff" />
      <path d="M80 69C86 62 97 64 99 71C93 76 84 74 80 69Z" fill="#fff" />
      <circle cx="80" cy="64" r="4.200" fill={NV.pielSombra} />
      <circle cx="71" cy="55" r="2.500" fill={NV.tinta} />
      <circle cx="89" cy="55" r="2.500" fill={NV.tinta} />
      {/* gorro */}
      <path d="M56 46C57 25 72 12 90 14C104 16 114 28 118 46L104 46C101 37 95 34 88 36C80 38 70 43 56 46Z" fill={NV.burdeos} />
      <path d="M104 46C101 37 95 34 88 36C94 33 103 34 110 44L118 46Z" fill={NV.burdeosOscuro} />
      <rect x="51" y="39" width="58" height="12" rx="6" fill={NV.marfil} />
      <circle cx="118" cy="50" r="7.500" fill={NV.marfil} />
    </g>
  );
}

export function PapaNoel(props) {
  return <Svg viewBox="0 0 160 200" {...props}><PapaNoelDibujo /></Svg>;
}

/* ───────────── Duende técnico con una tableta — lienzo 120×160 ───────────── */
export function DuendeDibujo() {
  return (
    <g>
      <Sombra cx={60} cy={153} rx={34} />
      <rect x="44" y="118" width="13" height="26" rx="5" fill={NV.pino} />
      <rect x="63" y="118" width="13" height="26" rx="5" fill={NV.pino} />
      <ellipse cx="46" cy="147" rx="11" ry="5.500" fill={NV.burdeosOscuro} />
      <ellipse cx="74" cy="147" rx="11" ry="5.500" fill={NV.burdeosOscuro} />
      <path d="M36 92C36 78 46 71 60 71C74 71 84 78 84 92V116C84 124 76 128 60 128C44 128 36 124 36 116Z" fill={NV.pinoClaro} />
      <path d="M40 73L47 85L54 75L60 86L66 75L73 85L80 73C74 70 66 69 60 69C54 69 46 70 40 73Z" fill={NV.burdeos} />
      {/* brazos y tableta */}
      <path d="M41 86L36 106" stroke={NV.pinoClaro} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M79 86L84 106" stroke={NV.pinoClaro} strokeWidth="12" strokeLinecap="round" fill="none" />
      <g className="nv-paquete">
        <rect x="38" y="92" width="44" height="30" rx="4.500" fill={NV.navy} />
        <rect x="42" y="96" width="36" height="22" rx="2" fill="#1F3A8A" />
        <Destello x={53} y={100} s={0.58} />
      </g>
      <circle cx="37" cy="108" r="6.500" fill={NV.piel} />
      <circle cx="83" cy="108" r="6.500" fill={NV.piel} />
      {/* cabeza */}
      <path d="M42 46L24 37L39 58Z" fill={NV.piel} />
      <path d="M78 46L96 37L81 58Z" fill={NV.piel} />
      <path d="M40 48L30 42L39 55Z" fill={NV.pielSombra} />
      <path d="M80 48L90 42L81 55Z" fill={NV.pielSombra} />
      <circle cx="60" cy="50" r="20" fill={NV.piel} />
      <circle cx="48" cy="56" r="3.600" fill="#EFA08F" opacity=".55" />
      <circle cx="72" cy="56" r="3.600" fill="#EFA08F" opacity=".55" />
      <circle cx="53" cy="50" r="2.300" fill={NV.tinta} />
      <circle cx="67" cy="50" r="2.300" fill={NV.tinta} />
      <path d="M54 58Q60 63.500 66 58" stroke={NV.tinta} strokeWidth="1.900" strokeLinecap="round" fill="none" />
      {/* gorro en punta */}
      <path d="M40 42C43 22 57 9 78 7C70 15 76 30 80 42Z" fill={NV.pino} />
      <rect x="37" y="37" width="46" height="9" rx="4.500" fill={NV.burdeos} />
      <circle cx="79" cy="7" r="4.500" fill={NV.oroClaro} />
    </g>
  );
}

export function Duende(props) {
  return <Svg viewBox="0 0 120 160" {...props}><DuendeDibujo /></Svg>;
}

/* ───────────── Reno pequeño con bufanda — lienzo 120×130 ───────────── */
export function RenoDibujo() {
  return (
    <g>
      <Sombra cx={60} cy={124} rx={30} />
      <g fill="none" stroke={PELAJE_OSCURO} strokeWidth="4.200" strokeLinecap="round" strokeLinejoin="round">
        <path d="M49 36C47 26 41 20 34 15M45 26C41 26 37 24 32 26" />
        <path d="M71 36C73 26 79 20 86 15M75 26C79 26 83 24 88 26" />
      </g>
      <rect x="44" y="104" width="11" height="19" rx="4.500" fill={PELAJE_OSCURO} />
      <rect x="65" y="104" width="11" height="19" rx="4.500" fill={PELAJE_OSCURO} />
      <ellipse cx="60" cy="96" rx="26" ry="22" fill={PELAJE} />
      <ellipse cx="60" cy="102" rx="14" ry="12" fill={PELAJE_CLARO} />
      <ellipse cx="37" cy="42" rx="8" ry="4.500" fill={PELAJE} transform="rotate(-28 37 42)" />
      <ellipse cx="83" cy="42" rx="8" ry="4.500" fill={PELAJE} transform="rotate(28 83 42)" />
      <ellipse cx="60" cy="54" rx="22" ry="20" fill={PELAJE} />
      <ellipse cx="60" cy="62" rx="13.500" ry="10.500" fill={PELAJE_CLARO} />
      <circle className="nv-nariz" cx="60" cy="58" r="5.800" fill={NV.burdeos} />
      <circle cx="58" cy="56" r="1.600" fill="#fff" opacity=".6" />
      <circle cx="51" cy="48" r="2.500" fill={NV.tinta} />
      <circle cx="69" cy="48" r="2.500" fill={NV.tinta} />
      <path d="M39 73Q60 84 81 73L82 81Q60 93 38 81Z" fill={NV.burdeos} />
      <rect x="69" y="80" width="10" height="20" rx="3" fill={NV.burdeosOscuro} />
      <rect x="69" y="94" width="10" height="2.500" fill={NV.oroClaro} />
    </g>
  );
}

export function Reno(props) {
  return <Svg viewBox="0 0 120 130" {...props}><RenoDibujo /></Svg>;
}

/* ───────────── Árbol con adornos de tecnología abstractos — lienzo 120×160 ───────────── */
const PISO = { strokeWidth: 9, strokeLinejoin: 'round' };

export function ArbolDibujo() {
  return (
    <g>
      <Sombra cx={60} cy={154} rx={40} />
      <rect x="52" y="138" width="16" height="16" rx="3" fill={PELAJE_OSCURO} />
      <path d="M60 80L104 138H16Z" fill={NV.pino} stroke={NV.pino} {...PISO} />
      <path d="M60 50L94 102H26Z" fill={NV.pinoClaro} stroke={NV.pinoClaro} {...PISO} />
      <path d="M60 24L84 64H36Z" fill={NV.pino} stroke={NV.pino} {...PISO} />
      {/* guirnaldas de luz */}
      <g fill="none" stroke={NV.oroClaro} strokeWidth="1.600" strokeLinecap="round" strokeDasharray="0.1 6.5">
        <path d="M40 58Q60 68 80 56" />
        <path d="M30 96Q60 110 90 94" />
        <path d="M22 130Q60 146 98 128" />
      </g>
      {/* adornos: esferas, un teléfono y un chip */}
      <circle className="nv-foco nv-foco-1" cx="50" cy="46" r="4" fill={NV.burdeos} />
      <circle className="nv-foco nv-foco-3" cx="72" cy="82" r="4.500" fill={NV.oroClaro} />
      <circle className="nv-foco nv-foco-2" cx="38" cy="120" r="4.500" fill={NV.burdeos} />
      <circle cx="84" cy="118" r="4" fill={NV.marfil} />
      <rect x="43" y="76" width="9" height="14" rx="2.200" fill={NV.marfil} />
      <rect x="45" y="78.500" width="5" height="7.500" rx=".8" fill={NV.navy} />
      <rect x="62" y="112" width="12" height="12" rx="2.500" fill={NV.oro} />
      <rect x="65.500" y="115.500" width="5" height="5" rx="1" fill={NV.pino} />
      <Destello x={48} y={2} s={1} className="nv-foco nv-foco-4" />
    </g>
  );
}

export function Arbol(props) {
  return <Svg viewBox="0 0 120 160" {...props}><ArbolDibujo /></Svg>;
}

/* ───────────── Escenas (lienzo 240×180): estados vacíos y agradecimiento ───────────── */

/** Carrito vacío: un reno junto a un carrito sin nada adentro. */
export function EscenaCarritoVacio(props) {
  return (
    <Svg viewBox="0 0 240 180" {...props}>
      <Destello x={38} y={22} s={0.8} className="nv-foco nv-foco-1" />
      <Destello x={196} y={40} s={0.55} color={NV.burdeos} className="nv-foco nv-foco-3" />
      <ellipse cx="96" cy="166" rx="62" ry="6" fill={NV.navy} opacity=".1" />
      <g fill="none" stroke={NV.pino} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 62H48L64 132H128L142 84H54" />
      </g>
      <circle cx="74" cy="152" r="9" fill={NV.pino} />
      <circle cx="120" cy="152" r="9" fill={NV.pino} />
      <circle cx="74" cy="152" r="3.200" fill={NV.marfil} />
      <circle cx="120" cy="152" r="3.200" fill={NV.marfil} />
      <path d="M86 102H116" stroke={NV.oroClaro} strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 9" fill="none" />
      <g transform="translate(138 52) scale(.92)"><RenoDibujo /></g>
    </Svg>
  );
}

/** Búsqueda sin resultados: el duende mira con una lupa. */
export function EscenaSinResultados(props) {
  return (
    <Svg viewBox="0 0 240 180" {...props}>
      <Destello x={34} y={30} s={0.6} color={NV.burdeos} className="nv-foco nv-foco-2" />
      <Destello x={200} y={24} s={0.8} className="nv-foco nv-foco-1" />
      <g transform="translate(36 18)"><DuendeDibujo /></g>
      <g className="nv-lupa">
        <path d="M176 110L204 142" stroke={NV.oro} strokeWidth="9" strokeLinecap="round" fill="none" />
        <circle cx="158" cy="88" r="28" fill={NV.marfil} opacity=".55" />
        <circle cx="158" cy="88" r="28" fill="none" stroke={NV.oroClaro} strokeWidth="7" />
        <path d="M144 78C148 72 156 69 164 71" stroke="#fff" strokeWidth="3.500" strokeLinecap="round" fill="none" opacity=".8" />
      </g>
    </Svg>
  );
}

/** Agradecimiento: árbol y regalos. No afirma ningún estado de pago: acompaña el mensaje real de la pantalla. */
export function EscenaGracias(props) {
  return (
    <Svg viewBox="0 0 240 180" {...props}>
      <Destello x={24} y={36} s={0.6} className="nv-foco nv-foco-2" />
      <Destello x={204} y={20} s={0.75} color={NV.burdeos} className="nv-foco nv-foco-3" />
      <g transform="translate(62 12)"><ArbolDibujo /></g>
      <g transform="translate(20 116)">
        <rect x="0" y="12" width="46" height="36" rx="4" fill={NV.burdeos} />
        <rect x="-3" y="6" width="52" height="11" rx="4" fill={NV.burdeosOscuro} />
        <rect x="19" y="6" width="8" height="42" fill={NV.oroClaro} />
        <path d="M23 6C17-5 5-3 8 4C10 8 18 7 23 6ZM23 6C29-5 41-3 38 4C36 8 28 7 23 6Z" fill={NV.oro} />
      </g>
      <g transform="translate(172 126)">
        <rect x="0" y="10" width="40" height="28" rx="4" fill={NV.marfil} />
        <rect x="-3" y="5" width="46" height="9" rx="3.500" fill="#EADFCB" />
        <rect x="16.500" y="5" width="7" height="33" fill={NV.burdeos} />
        <path d="M20 5C15-4 5-2 7.500 3.500C9 7 16 6 20 5ZM20 5C25-4 35-2 32.500 3.500C31 7 24 6 20 5Z" fill={NV.burdeosOscuro} />
      </g>
    </Svg>
  );
}

/** Bienvenida de la portada: Papá Noel con el árbol y regalos, en un solo lienzo. */
export function EscenaBienvenida(props) {
  return (
    <Svg viewBox="0 0 300 220" {...props}>
      <Destello x={20} y={26} s={0.75} className="nv-foco nv-foco-1" />
      <Destello x={268} y={54} s={0.6} color={NV.marfil} className="nv-foco nv-foco-3" />
      <g transform="translate(4 44) scale(1.06)"><ArbolDibujo /></g>
      <g className="nv-entrada" transform="translate(118 14)"><PapaNoelDibujo /></g>
      <g transform="translate(86 164)">
        <rect x="0" y="12" width="42" height="32" rx="4" fill={NV.pinoClaro} />
        <rect x="-3" y="6" width="48" height="10" rx="4" fill={NV.pino} />
        <rect x="17.500" y="6" width="7" height="38" fill={NV.oroClaro} />
        <path d="M21 6C16-4 5-2 8 4C10 8 17 7 21 6ZM21 6C26-4 37-2 34 4C32 8 25 7 21 6Z" fill={NV.oro} />
      </g>
    </Svg>
  );
}

/* ───────────── Trineo con renos (de perfil, mirando a la derecha) — lienzo 300×96 ───────────── */
function RenoDePerfil({ x, guia = false, fase = '' }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <g className={`nv-galope ${fase}`}>
        <g fill="none" stroke={PELAJE_OSCURO} strokeWidth="3.4" strokeLinecap="round">
          <path className="nv-pata nv-pata-a" d="M12 60L7 78" /><path className="nv-pata nv-pata-b" d="M19 61L22 78" />
          <path className="nv-pata nv-pata-b" d="M40 60L36 78" /><path className="nv-pata nv-pata-a" d="M46 59L52 77" />
          <path d="M58 26C57 18 53 14 48 11M56 19C53 19 50 17 47 18M61 25C63 18 67 14 72 12M63 19C66 18 69 16 72 17" strokeWidth="2.6" />
        </g>
        <ellipse cx="29" cy="52" rx="22" ry="11" fill={PELAJE} />
        <path d="M44 48L54 30L64 34L54 56Z" fill={PELAJE} />
        <ellipse cx="62" cy="33" rx="10" ry="8" fill={PELAJE} />
        <ellipse cx="69" cy="36" rx="6" ry="5" fill={PELAJE_CLARO} />
        <circle cx="74" cy="35" r="3.4" fill={guia ? NV.burdeos : NV.tinta} className={guia ? 'nv-foco nv-foco-1' : undefined} />
        <circle cx="62" cy="30" r="1.8" fill={NV.tinta} />
        <ellipse cx="52" cy="26" rx="5" ry="2.6" fill={PELAJE_OSCURO} transform="rotate(-35 52 26)" />
        <path d="M7 50Q3 46 5 42" stroke={PELAJE_CLARO} strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M46 44Q51 50 57 46" stroke={NV.burdeos} strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="52" cy="50" r="2.4" fill={NV.oroClaro} />
      </g>
    </g>
  );
}

export function TrineoDibujo() {
  return (
    <g>
      {/* riendas */}
      <path d="M96 52Q140 58 176 46Q214 56 248 46" fill="none" stroke={NV.oro} strokeWidth="1.6" />
      {/* trineo */}
      <g className="nv-galope nv-galope-c">
        <path d="M6 78H86C97 78 102 71 102 62" fill="none" stroke={NV.oroClaro} strokeWidth="4" strokeLinecap="round" />
        <path d="M24 78V66M72 78V66" stroke={NV.oro} strokeWidth="3" strokeLinecap="round" />
        {/* saco de regalos */}
        <circle cx="26" cy="34" r="17" fill={NV.pinoClaro} />
        <rect x="14" y="18" width="13" height="12" rx="2" fill={NV.marfil} transform="rotate(-14 20 24)" />
        <rect x="30" y="14" width="12" height="12" rx="2" fill={NV.oroClaro} transform="rotate(10 36 20)" />
        {/* Papá Noel sentado */}
        <path d="M46 62C46 44 52 36 62 36C72 36 78 44 78 62Z" fill={NV.burdeos} />
        <circle cx="63" cy="27" r="10" fill={NV.piel} />
        <path d="M54 27C53 38 58 43 64 43C70 43 74 38 73 28C70 32 60 32 54 27Z" fill={NV.marfil} />
        <path d="M53 21C54 12 62 8 70 11C75 13 78 18 79 24L72 22C68 18 60 19 53 21Z" fill={NV.burdeos} />
        <rect x="51" y="19" width="23" height="5" rx="2.5" fill={NV.marfil} />
        <circle cx="80" cy="25" r="3.4" fill={NV.marfil} />
        <circle cx="67" cy="26" r="1.5" fill={NV.tinta} />
        <path d="M72 46L92 52" stroke={NV.burdeos} strokeWidth="8" strokeLinecap="round" />
        <circle cx="95" cy="52" r="5" fill={NV.pinoClaro} />
        {/* cuerpo del trineo */}
        <path d="M4 40C4 58 12 66 28 66H84C92 66 96 60 96 52V46H80V54H36C28 54 22 48 20 40Z" fill={NV.burdeosOscuro} />
        <path d="M8 44C10 56 16 62 28 62H84" fill="none" stroke={NV.oroClaro} strokeWidth="2" strokeLinecap="round" />
      </g>
      <RenoDePerfil x={118} fase="nv-galope-b" />
      <RenoDePerfil x={196} guia />
      <Destello x={2} y={8} s={0.45} className="nv-foco nv-foco-2" />
      <Destello x={104} y={2} s={0.35} color={NV.marfil} className="nv-foco nv-foco-4" />
    </g>
  );
}

export function Trineo(props) {
  return <Svg viewBox="0 0 300 96" {...props}><TrineoDibujo /></Svg>;
}

/* ───────────── Paisaje del pie: colinas, árboles, regalos y un reno que pasea — lienzo 1200×120 ───────────── */
function Pino({ x, y, s = 1, claro = false }) {
  const c = claro ? NV.pinoClaro : NV.pino;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="34" width="6" height="8" fill={PELAJE_OSCURO} />
      <path d="M0 0L16 22H-16Z" fill={c} /><path d="M0 12L20 38H-20Z" fill={c} />
      <circle className="nv-foco nv-foco-3" cx="-6" cy="28" r="2" fill={NV.oroClaro} /><circle className="nv-foco nv-foco-1" cx="7" cy="18" r="2" fill={NV.burdeos} />
    </g>
  );
}

function Cajita({ x, y, c1, c2 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="6" width="22" height="16" rx="2" fill={c1} /><rect x="-2" y="2" width="26" height="6" rx="2" fill={c2} />
      <rect x="9" y="2" width="4" height="20" fill={NV.oroClaro} />
    </g>
  );
}

export function Paisaje(props) {
  return (
    <Svg viewBox="0 0 1200 120" preserveAspectRatio="xMidYMax slice" {...props}>
      <path d="M0 120V84Q150 54 300 80T600 76T900 82T1200 70V120Z" fill={NV.pinoClaro} opacity=".28" />
      <path d="M0 120V98Q200 76 400 96T800 94T1200 90V120Z" fill={NV.pino} opacity=".9" />
      <Pino x={70} y={50} s={1.1} /><Pino x={118} y={62} s={0.8} claro />
      <Pino x={420} y={56} s={0.9} claro /><Pino x={780} y={52} s={1.05} /><Pino x={826} y={64} s={0.75} claro />
      <Pino x={1120} y={46} s={1.15} /><Pino x={1066} y={62} s={0.8} claro />
      <Cajita x={150} y={80} c1={NV.burdeos} c2={NV.burdeosOscuro} /><Cajita x={450} y={84} c1={NV.marfil} c2="#EADFCB" />
      <Cajita x={860} y={80} c1={NV.burdeos} c2={NV.burdeosOscuro} /><Cajita x={1010} y={82} c1={NV.marfil} c2="#EADFCB" />
      <g className="nv-paseo"><g transform="translate(0 22) scale(.82)"><RenoDePerfil x={0} guia /></g></g>
    </Svg>
  );
}

/* ───────────── Colgantes para los márgenes vacíos — lienzo 120×200 ───────────── */
export function Colgantes(props) {
  const hilo = { stroke: NV.oro, strokeWidth: 1.4 };
  return (
    <Svg viewBox="0 0 120 200" {...props}>
      <g className="nv-pendulo nv-pendulo-a"><path d="M24 0V78" {...hilo} /><circle cx="24" cy="94" r="16" fill={NV.burdeos} /><path d="M9 91Q24 99 39 91" fill="none" stroke={NV.oroClaro} strokeWidth="2" /><rect x="20" y="74" width="8" height="6" rx="1.5" fill={NV.oro} /></g>
      <g className="nv-pendulo nv-pendulo-b"><path d="M62 0V128" {...hilo} /><path d={DESTELLO} fill={NV.oroClaro} transform="translate(44 126) scale(1.5)" /></g>
      <g className="nv-pendulo nv-pendulo-c"><path d="M98 0V46" {...hilo} /><circle cx="98" cy="60" r="13" fill={NV.pinoClaro} /><ellipse cx="94" cy="55" rx="3" ry="5" fill="#fff" opacity=".25" /><rect x="94.500" y="43" width="7" height="5" rx="1.500" fill={NV.oro} /></g>
    </Svg>
  );
}
