import { useId } from 'react';
import { Laptop, Package } from '@/Components/Store/Icons';
import AccesorioVisual from '@/Components/Store/AccesorioVisual';

// Imagen de un modelo en la comparativa. Si el admin subió una foto (Tienda online → Modelos de referencia), se usa
// esa; si no, se dibuja una ilustración con las medidas reales de la base: un iPhone (alto, ancho y cámaras) o una Mac
// (por su ancho): un mini y un Pro Max, o una Air de 13 y una Pro de 16, se ven de su tamaño relativo. El redondeo y
// el tamaño los define quien lo usa (className). `altoMaximo`: en celulares, el alto del más alto; en Mac, el ancho.

const FONDO = 'linear-gradient(165deg, #F6F7FB 0%, #E3E6F2 100%)';

/** Dorso de un iPhone: cuerpo a escala, módulo de cámaras, flash y LiDAR. */
function TelefonoDorso({ v, altoMaximo }) {
  const id = useId().replace(/:/g, '');
  const escala = Math.max(0.55, v.alto_mm / (altoMaximo || v.alto_mm));
  const H = 188 * escala;
  const W = H * (v.ancho_mm / v.alto_mm);
  const x = 100 - W / 2;
  const y = 222 - H;

  const n = 1 + (v.ultra ? 1 : 0) + (v.tele ? 1 : 0);
  const m = W * (n === 1 ? 0.36 : 0.46);
  const mx = x + W * 0.08;
  const my = y + W * 0.08;
  const r = m * (n === 1 ? 0.27 : n === 2 ? 0.2 : 0.18);
  const lentes = { 1: [[0.4, 0.4]], 2: [[0.3, 0.3], [0.7, 0.7]], 3: [[0.3, 0.27], [0.3, 0.73], [0.72, 0.5]] }[n];
  const flash = n === 3 ? [0.76, 0.17] : [0.76, 0.24];

  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`cuerpo-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E6E9F4" />
        </linearGradient>
        <radialGradient id={`vidrio-${id}`} cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#4A5696" />
          <stop offset="0.55" stopColor="#141B3C" />
          <stop offset="1" stopColor="#060918" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="225" rx={W * 0.52} ry="4.5" fill="rgba(1,20,70,0.10)" />
      <rect x={x} y={y} width={W} height={H} rx={W * 0.17} fill={`url(#cuerpo-${id})`} stroke="rgba(1,20,70,0.16)" />
      <rect x={x + 1.6} y={y + 1.6} width={W - 3.2} height={H - 3.2} rx={W * 0.16} fill="none" stroke="#FFFFFF" strokeOpacity="0.8" />
      {v.plegable && (
        <line x1={x + W * 0.05} y1={y + H * 0.06} x2={x + W * 0.05} y2={y + H * 0.94} stroke="rgba(1,20,70,0.14)" strokeWidth="1.2" strokeLinecap="round" />
      )}

      <rect x={mx} y={my} width={m} height={m} rx={m * 0.3} fill="rgba(1,20,70,0.06)" stroke="rgba(1,20,70,0.12)" strokeWidth="0.8" />
      {lentes.map(([fx, fy]) => {
        const cx = mx + m * fx;
        const cy = my + m * fy;
        return (
          <g key={`${fx}-${fy}`}>
            <circle cx={cx} cy={cy} r={r} fill="#1C2340" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="0.8" />
            <circle cx={cx} cy={cy} r={r * 0.68} fill={`url(#vidrio-${id})`} />
            <circle cx={cx - r * 0.22} cy={cy - r * 0.22} r={r * 0.16} fill="#FFFFFF" fillOpacity="0.45" />
          </g>
        );
      })}
      <circle cx={mx + m * flash[0]} cy={my + m * flash[1]} r={m * 0.055} fill="#F4E7BF" stroke="rgba(1,20,70,0.15)" strokeWidth="0.5" />
      {v.lidar && <circle cx={mx + m * 0.76} cy={my + m * 0.83} r={m * 0.07} fill="#2A3150" />}
    </svg>
  );
}

/**
 * Una Mac de frente, a escala por su ancho: portátil abierta (pantalla con marco y, si tiene, la muesca de la cámara;
 * debajo, la base con el hueco para abrirla) o iMac (pantalla, mentón y pie). `anchoMaximo`: el ancho de la más grande.
 */
function MacFrente({ v, anchoMaximo }) {
  const id = useId().replace(/:/g, '');
  const escala = Math.max(0.5, v.ancho_mm / (anchoMaximo || v.ancho_mm));
  const escritorio = v.formato === 'escritorio';
  const W = (escritorio ? 172 : 164) * escala;
  const x = 100 - W / 2;

  const defs = (
    <defs>
      <linearGradient id={`carcasa-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#DCDFEA" />
      </linearGradient>
      <linearGradient id={`pantalla-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2B3670" />
        <stop offset="0.6" stopColor="#141B3C" />
        <stop offset="1" stopColor="#0A0F26" />
      </linearGradient>
      <linearGradient id={`reflejo-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
        <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
  );

  if (escritorio) {
    const H = W * 0.64;              // pantalla y mentón
    const y = 196 - H - W * 0.2;
    const menton = H * 0.16;
    const marco = W * 0.035;
    return (
      <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
        {defs}
        <ellipse cx="100" cy="222" rx={W * 0.3} ry="3.5" fill="rgba(1,20,70,0.10)" />
        <path d={`M${100 - W * 0.11} ${y + H} L${100 - W * 0.14} ${y + H + W * 0.19} H${100 + W * 0.14} L${100 + W * 0.11} ${y + H} Z`}
          fill={`url(#carcasa-${id})`} stroke="rgba(1,20,70,0.14)" strokeWidth="0.8" />
        <rect x={100 - W * 0.19} y={y + H + W * 0.185} width={W * 0.38} height={W * 0.03} rx={W * 0.012} fill="#D3D7E3" />
        <rect x={x} y={y} width={W} height={H} rx={W * 0.03} fill={`url(#carcasa-${id})`} stroke="rgba(1,20,70,0.16)" />
        <rect x={x + marco} y={y + marco} width={W - marco * 2} height={H - menton - marco} rx={W * 0.012} fill={`url(#pantalla-${id})`} />
        <rect x={x + marco} y={y + marco} width={W - marco * 2} height={H - menton - marco} rx={W * 0.012} fill={`url(#reflejo-${id})`} />
      </svg>
    );
  }

  const lid = W * 0.66;               // tapa abierta, casi 16:10
  const base = W * 0.05;
  const y = 200 - lid - base;
  const marco = W * 0.028;
  const pantallaX = x + marco;
  const pantallaW = W - marco * 2;
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      {defs}
      <ellipse cx="100" cy="212" rx={W * 0.58} ry="4" fill="rgba(1,20,70,0.10)" />
      <rect x={x} y={y} width={W} height={lid} rx={W * 0.03} fill="#1C223F" stroke="rgba(1,20,70,0.25)" />
      <rect x={pantallaX} y={y + marco} width={pantallaW} height={lid - marco * 1.6} rx={W * 0.014} fill={`url(#pantalla-${id})`} />
      <rect x={pantallaX} y={y + marco} width={pantallaW} height={lid - marco * 1.6} rx={W * 0.014} fill={`url(#reflejo-${id})`} />
      {v.muesca
        ? <rect x={100 - W * 0.06} y={y + marco - 0.2} width={W * 0.12} height={W * 0.028} rx={W * 0.012} fill="#1C223F" />
        : <circle cx="100" cy={y + marco * 0.5} r={Math.max(0.8, W * 0.005)} fill="#3A4270" />}
      <path d={`M${x - W * 0.04} ${y + lid} H${x + W * 1.04} a${base * 0.5} ${base * 0.5} 0 0 1 ${-base * 0.6} ${base} H${x - W * 0.04 + base * 0.6} a${base * 0.5} ${base * 0.5} 0 0 1 ${-base * 0.6} ${-base} Z`}
        fill={`url(#carcasa-${id})`} stroke="rgba(1,20,70,0.16)" strokeWidth="0.8" />
      <rect x={100 - W * 0.09} y={y + lid} width={W * 0.18} height={base * 0.36} rx={base * 0.18} fill="rgba(1,20,70,0.10)" />
    </svg>
  );
}

export default function ModeloVisual({ modelo, tipo, altoMaximo = null, className = 'rounded-3xl', fondo = true }) {
  const estilo = fondo ? { background: FONDO } : undefined;
  if (modelo.imagen) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={estilo}>
        <img src={modelo.imagen} alt={modelo.nombre} className="h-full w-full object-contain p-[6%]" loading="lazy" decoding="async" />
      </div>
    );
  }

  const Icono = tipo === 'computadora' ? Laptop : Package;
  return (
    <div className={`relative overflow-hidden ${className}`} style={estilo}
      role="img" aria-label={`Ilustración del ${modelo.nombre}`}>
      {tipo === 'celular' && modelo.visual && <TelefonoDorso v={modelo.visual} altoMaximo={altoMaximo} />}
      {tipo === 'computadora' && modelo.visual && <MacFrente v={modelo.visual} anchoMaximo={altoMaximo} />}
      {['producto_general', 'producto_apple'].includes(tipo) && modelo.visual && <AccesorioVisual visual={modelo.visual} />}
      {!modelo.visual && <div className="grid h-full w-full place-items-center"><Icono className="h-1/3 w-1/3" strokeWidth={1.1} style={{ color: 'var(--ab-navy)' }} /></div>}
    </div>
  );
}
