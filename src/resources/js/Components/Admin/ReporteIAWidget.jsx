import { useState, useEffect, useRef, useId } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { route } from 'ziggy-js';
import axios from 'axios';

const NAVY = '#16244E';
const LIMA = '#A8D82A';
const fmt = (d) => d.toISOString().slice(0, 10);

/* ───────────────── Oddy 🐕 — mascota IA de Apple Boss (golden retriever) ───────────────── */
const ODDY_LOGO = [
  'M315.6042 658.6135 m -48.4297 0 a 48.4297 48.4297 0 1 0 96.8594 0 a 48.4297 48.4297 0 1 0 -96.8594 0',
  'M341.7532,511.6514c1.1669,20.4965,15.1522,36.9813,34.0417,43.0261,1.684.5389,3.0933,1.6025,3.389,2.8654.4543,1.9408-.165,3.5682-1.689,4.8247-28.179,23.2331-70.3643,21.2347-95.491-5.501-10.3379-10.9999-22.0372-29.399-37.7623-16.9867-6.3755,5.0324-11.0792,11.6249-16.7183,17.4616-26.3661,27.2901-70.0523,28.1051-97.7688,2.6569-24.1516-22.175-29.0421-58.2969-11.0653-85.8909,12.786-19.6262,34.583-31.3276,57.6604-31.6511,23.8199-.3339,45.4583,11.0897,59.3084,30.6511,4.2189,5.9586,8.6029,11.4655,13.8553,16.354,2.8916,2.6913,6.9145,3.0388,9.9516.6906,1.9371-1.4977,4.042-3.2126,5.5418-5.1386l10.3406-13.2787c23.1041-31.9768,67.8899-38.8943,99.4887-15.1797.9786.7345,1.9592,2.6721,1.826,3.7335-.1492,1.1882-1.3867,3.0383-2.6575,3.498-19.9433,7.2146-33.4978,25.965-32.251,47.8647Z',
  'M310.3279,372.9568c7.5391,39.0212-19.9621,73.554-59.1045,77.0097-7.6712-38.83,20.0499-73.6192,59.1045-77.0097Z',
  'M370.5601 602.2384 m -28.5472 0 a 28.5472 28.5472 0 1 0 57.0944 0 a 28.5472 28.5472 0 1 0 -57.0944 0',
];
function Bot({ mood = 'idle', size = 120 }) {
  const uid = useId().replace(/[:]/g, '');
  const fur = `fur-${uid}`, ear = `ear-${uid}`, lim = `lim-${uid}`, col = `col-${uid}`, steel = `steel-${uid}`, med = `med-${uid}`, glow = `glow-${uid}`;
  const sad = mood === 'sad', thinking = mood === 'thinking', happy = mood === 'happy';
  const blink = { scaleY: [0, 0, 1, 0, 0] };
  const blinkT = { duration: 4.2, times: [0, 0.93, 0.965, 0.995, 1], repeat: Infinity };
  return (
    <motion.svg width={size} height={size * 1.05} viewBox="0 0 120 126" style={{ overflow: 'visible' }}
      animate={thinking ? { y: [0, -5, 0] } : happy ? { y: [0, -13, 0, -6, 0] } : { y: [0, -4, 0] }}
      transition={{ duration: happy ? 0.9 : 2.6, repeat: happy ? 0 : Infinity, ease: 'easeInOut' }}>
      <defs>
        <radialGradient id={glow} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#A8D82A" stopOpacity="0.32" /><stop offset="100%" stopColor="#A8D82A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={fur} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F7D488" /><stop offset="100%" stopColor="#E6AC49" /></linearGradient>
        <linearGradient id={ear} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#DBA048" /><stop offset="100%" stopColor="#BB7D2B" /></linearGradient>
        <linearGradient id={lim} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#C6EE5A" /><stop offset="100%" stopColor="#A8D82A" /></linearGradient>
        <linearGradient id={col} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C6EE5A" /><stop offset="100%" stopColor="#8FBE24" /></linearGradient>
        <linearGradient id={steel} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EEF1F6" /><stop offset="100%" stopColor="#9AA3B2" /></linearGradient>
        <radialGradient id={med} cx="42%" cy="34%" r="72%"><stop offset="0%" stopColor="#20356B" /><stop offset="100%" stopColor="#132043" /></radialGradient>
      </defs>

      <circle cx="60" cy="58" r="50" fill={`url(#${glow})`} />

      {/* órbita de datos (gira; más rápido al pensar) */}
      <motion.g style={{ transformOrigin: '60px 60px' }} animate={{ rotate: 360 }}
        transition={{ duration: thinking ? 7 : 22, repeat: Infinity, ease: 'linear' }}>
        <ellipse cx="60" cy="60" rx="52" ry="43" fill="none" stroke="#A8D82A" strokeWidth="1.3" strokeDasharray="1.5 5" opacity="0.5" transform="rotate(-16 60 60)" />
        <circle cx="9" cy="48" r="2.6" fill="#A8D82A" />
        <circle cx="111" cy="74" r="2.6" fill="#A8D82A" />
        <circle cx="93" cy="17" r="2" fill="#A8D82A" opacity="0.7" />
      </motion.g>

      {/* destellos IA */}
      <motion.g style={{ transformOrigin: '18px 32px' }}
        animate={{ opacity: [0.45, 1, 0.45], scale: [0.85, 1.12, 0.85] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M19 26 l1.4 3.2 3.2 1.4 -3.2 1.4 L19 36 l-1.4-3.6 L14.4 32 l3.2-1.4 Z" fill={`url(#${lim})`} />
        <path d="M14 46 l0.9 2 2 0.9 -2 0.9 L14 53 l-0.9-2.2 L11 51 l2-0.9 Z" fill="#A8D82A" opacity="0.8" />
      </motion.g>

      {/* tarjeta de gráfico */}
      <motion.g animate={{ y: [0, -2.5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        <g transform="rotate(8 97 22)">
          <rect x="85" y="11" width="26" height="22" rx="5" fill="#16244E" />
          <rect x="89" y="24" width="3.6" height="5.5" rx="1.2" fill="#A8D82A" />
          <rect x="94.7" y="21" width="3.6" height="8.5" rx="1.2" fill="#ffffff" />
          <rect x="100.4" y="17.5" width="3.6" height="12" rx="1.2" fill="#A8D82A" />
        </g>
      </motion.g>

      {/* sombra */}
      <ellipse cx="60" cy="117" rx="28" ry="5" fill="#0b1330" opacity="0.13" />

      {/* melena del pecho */}
      <path d="M42 88 Q50 100 60 100 Q70 100 78 88 Q74 103 60 104 Q46 103 42 88 Z" fill="#F7E2B4" />

      {/* orejas */}
      <motion.g style={{ transformOrigin: '42px 44px' }}
        animate={sad ? { rotate: 11 } : happy ? { rotate: [0, -5, 0] } : { rotate: [0, -3, 0] }}
        transition={sad ? { duration: 0.4 } : { duration: happy ? 0.6 : 3, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M40 40 C21 41 15 64 20 86 C21 94 29 97 35 92 C34 96 39 98 42 94 C47 82 48 54 45 43 Z" fill={`url(#${ear})`} />
        <path d="M39 46 C29 50 26 66 30 82" fill="none" stroke="#C98C3A" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      </motion.g>
      <motion.g style={{ transformOrigin: '78px 44px' }}
        animate={sad ? { rotate: -11 } : happy ? { rotate: [0, 5, 0] } : { rotate: [0, 3, 0] }}
        transition={sad ? { duration: 0.4 } : { duration: happy ? 0.6 : 3, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M80 40 C99 41 105 64 100 86 C99 94 91 97 85 92 C86 96 81 98 78 94 C73 82 72 54 75 43 Z" fill={`url(#${ear})`} />
        <path d="M81 46 C91 50 94 66 90 82" fill="none" stroke="#C98C3A" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      </motion.g>

      {/* patitas */}
      <ellipse cx="49" cy="109" rx="9" ry="6.5" fill={`url(#${fur})`} />
      <ellipse cx="71" cy="109" rx="9" ry="6.5" fill={`url(#${fur})`} />
      <path d="M46 110 v3 M49 110.5 v3.3 M52 110 v3" stroke="#D7B06A" strokeWidth="1" strokeLinecap="round" />
      <path d="M68 110 v3 M71 110.5 v3.3 M74 110 v3" stroke="#D7B06A" strokeWidth="1" strokeLinecap="round" />

      {/* collar + anilla + medalla con el logo */}
      <path d="M38 84 Q60 95 82 84 Q82 88 81 89 Q60 99 39 89 Q38 88 38 84 Z" fill={`url(#${col})`} />
      <path d="M40.5 85 Q60 94.3 79.5 85" fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0.45" strokeLinecap="round" />
      <path d="M40.5 88.4 Q60 97.3 79.5 88.4" fill="none" stroke="#6f9a18" strokeWidth="0.9" opacity="0.4" strokeLinecap="round" />
      <rect x="58.9" y="92.5" width="2.2" height="5.2" rx="1.1" fill={`url(#${steel})`} />
      <circle cx="60" cy="95.6" r="2.5" fill="none" stroke={`url(#${steel})`} strokeWidth="1.6" />
      <circle cx="60" cy="103" r="7" fill={`url(#${med})`} />
      <circle cx="60" cy="103" r="7" fill="none" stroke={`url(#${lim})`} strokeWidth="1.3" />
      <path d="M55.5 99.8 Q60 97.8 64.5 99.8" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.22" strokeLinecap="round" />
      <g fill="#ffffff" transform="translate(60,103.4) scale(0.026) translate(-253.5,-540)">
        {ODDY_LOGO.map((d, i) => <path key={i} d={d} />)}
      </g>

      {/* cabeza (tilt al pensar) */}
      <motion.g style={{ transformOrigin: '60px 82px' }}
        animate={thinking ? { rotate: [0, -7, -7, 0] } : { rotate: 0 }}
        transition={thinking ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}>
        <ellipse cx="60" cy="58" rx="34" ry="30" fill={`url(#${fur})`} />
        <path d="M55 30 Q58 22 61 30 Q64 23 66 31 Q60 33 55 30 Z" fill="#F7D488" />
        <ellipse cx="60" cy="53" rx="6.5" ry="17" fill="#FBE7BC" opacity="0.6" />
        <ellipse cx="60" cy="70" rx="19" ry="14" fill="#FCEFCF" />

        {/* ojos (miran arriba al pensar) */}
        <motion.g animate={thinking ? { y: -2 } : { y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>
          <circle cx="49" cy="55" r="6.6" fill="#1b2a47" />
          <circle cx="71" cy="55" r="6.6" fill="#1b2a47" />
          <circle cx="51.3" cy="52.7" r="2.1" fill="#fff" />
          <circle cx="73.3" cy="52.7" r="2.1" fill="#fff" />
          <circle cx="47.5" cy="57.5" r="1" fill="#fff" opacity="0.7" />
          <circle cx="69.5" cy="57.5" r="1" fill="#fff" opacity="0.7" />
        </motion.g>
        {/* parpadeo */}
        <motion.rect x="42.4" y="48" width="13.2" height="14.5" rx="6.6" fill={`url(#${fur})`} style={{ transformOrigin: '49px 55px' }}
          animate={blink} transition={blinkT} />
        <motion.rect x="64.4" y="48" width="13.2" height="14.5" rx="6.6" fill={`url(#${fur})`} style={{ transformOrigin: '71px 55px' }}
          animate={blink} transition={blinkT} />

        {/* cejitas */}
        <path d="M44 46 q5 -2.5 10 0" fill="none" stroke="#D2933F" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        <path d="M66 46 q5 -2.5 10 0" fill="none" stroke="#D2933F" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />

        {/* nariz */}
        <ellipse cx="60" cy="64" rx="5.4" ry="4.3" fill="#1b2a47" />
        <ellipse cx="58.2" cy="62.7" rx="1.5" ry="1.1" fill="#fff" opacity="0.5" />

        {/* boca por ánimo */}
        {happy ? (
          <g>
            <path d="M60 68 V71" stroke="#1b2a47" strokeWidth="2" strokeLinecap="round" />
            <path d="M60 71 Q51 80 45 74" fill="none" stroke="#1b2a47" strokeWidth="2" strokeLinecap="round" />
            <path d="M60 71 Q69 80 75 74" fill="none" stroke="#1b2a47" strokeWidth="2" strokeLinecap="round" />
            <path d="M54 73 q6 11 12 0 Z" fill="#F29B9B" />
          </g>
        ) : thinking ? (
          <g>
            <path d="M60 68 V71" stroke="#1b2a47" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="60" cy="75" rx="3.4" ry="4.2" fill="none" stroke="#1b2a47" strokeWidth="2" />
          </g>
        ) : sad ? (
          <g>
            <path d="M60 68 V71" stroke="#1b2a47" strokeWidth="2" strokeLinecap="round" />
            <path d="M52 77 Q60 71 68 77" fill="none" stroke="#1b2a47" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d="M60 68 V72" stroke="#1b2a47" strokeWidth="2" strokeLinecap="round" />
            <path d="M60 72 Q53 78 48 74" fill="none" stroke="#1b2a47" strokeWidth="2" strokeLinecap="round" />
            <path d="M60 72 Q67 78 72 74" fill="none" stroke="#1b2a47" strokeWidth="2" strokeLinecap="round" />
            <path d="M57 73 q3 7 6 0 Z" fill="#F29B9B" />
          </g>
        )}

        {/* cachetes */}
        <circle cx="40" cy="67" r="4.2" fill="#F6B59A" opacity="0.5" />
        <circle cx="80" cy="67" r="4.2" fill="#F6B59A" opacity="0.5" />
      </motion.g>

      {/* chispas al festejar */}
      {happy && [...Array(7)].map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return <motion.circle key={i} cx={60 + Math.cos(a) * 14} cy={58 + Math.sin(a) * 14} r="2.6" fill={i % 2 ? LIMA : '#ffd34d'}
          animate={{ cx: 60 + Math.cos(a) * 60, cy: 58 + Math.sin(a) * 50, opacity: [1, 0], scale: [1, 0] }}
          transition={{ duration: 0.95, ease: 'easeOut' }} />;
      })}
    </motion.svg>
  );
}

/* ───────────────── Botón hermoso ───────────────── */
function BotonMagico({ children, onClick, disabled }) {
  return (
    <motion.button onClick={onClick} disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03 }} whileTap={{ scale: disabled ? 1 : 0.96 }}
      className="group relative overflow-hidden rounded-2xl px-7 py-3.5 text-base font-extrabold text-white shadow-lg disabled:opacity-60"
      style={{ background: `linear-gradient(110deg, ${NAVY} 0%, #24407e 45%, ${NAVY} 100%)`,
        boxShadow: `0 10px 26px -8px ${NAVY}aa` }}>
      {/* brillo que barre */}
      <motion.span aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)' }}
        animate={{ x: ['-120%', '120%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
      {/* borde lima sutil */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1.5px ${LIMA}55` }} />
      <span className="relative flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}

const MENSAJES = ['Leyendo tus ventas…', 'Calculando márgenes por categoría…', 'Buscando tus productos estrella…',
  'Revisando qué reponer…', 'Pensando recomendaciones para decidir…'];

export default function ReporteIAWidget() {
  const hoy = new Date();
  const [desde, setDesde] = useState(fmt(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const [hasta, setHasta] = useState(fmt(hoy));
  const [estado, setEstado] = useState('idle'); // idle | cargando | listo | error
  const [prog, setProg] = useState(0);
  const [msg, setMsg] = useState(0);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const timers = useRef([]);
  const limpiar = () => { timers.current.forEach(clearInterval); timers.current = []; };
  useEffect(() => () => limpiar(), []);

  const chip = (label, di, df) => (
    <button type="button" onClick={() => { setDesde(di); setHasta(df); }}
      className={`rounded-full border px-3 py-1 text-xs font-bold transition ${desde === di && hasta === df
        ? 'border-transparent text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
      style={desde === di && hasta === df ? { background: NAVY } : {}}>{label}</button>
  );
  const rangos = () => {
    const d0 = fmt(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const d7 = fmt(new Date(Date.now() - 6 * 864e5));
    const dy = fmt(new Date(hoy.getFullYear(), 0, 1));
    return { hoyS: fmt(hoy), d0, d7, dy };
  };
  const R = rangos();

  const generar = async () => {
    setEstado('cargando'); setProg(6); setMsg(0); setErr('');
    const pt = setInterval(() => setProg((p) => (p < 92 ? p + Math.max(0.6, (92 - p) * 0.035) : p)), 350);
    const mt = setInterval(() => setMsg((m) => (m + 1) % MENSAJES.length), 2600);
    timers.current = [pt, mt];
    try {
      const { data: r } = await axios.post(route('admin.automation.generar'), { fecha_inicio: desde, fecha_fin: hasta });
      limpiar(); setProg(100); setData(r);
      setTimeout(() => setEstado('listo'), 450);
    } catch (e) {
      limpiar(); setErr(e?.response?.data?.message || 'No se pudo generar. Probá de nuevo.'); setEstado('error');
    }
  };

  const bs = (n) => 'Bs ' + Number(n || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 });
  const dmy = (s) => (s ? s.split('-').reverse().join('/') : '');

  return (
    <div className="rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#ffffff,#f6f8fc)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold tracking-widest" style={{ color: '#6a8f10' }}>ANÁLISIS CON IA</div>
          <h3 className="mt-0.5 text-xl font-extrabold" style={{ color: NAVY }}>Tu asesor comercial</h3>
          <p className="text-sm text-slate-500">Elegí un período y la IA te arma el resumen y las decisiones.</p>
        </div>
        <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: NAVY }}>Claude Opus 5.5</span>
      </div>

      <AnimatePresence mode="wait">
        {estado === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-4 flex flex-col items-center gap-4">
            <Bot mood="idle" />
            {/* chips de rango rápido */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {chip('Hoy', R.hoyS, R.hoyS)}{chip('7 días', R.d7, R.hoyS)}{chip('Este mes', R.d0, R.hoyS)}{chip('Este año', R.dy, R.hoyS)}
            </div>
            {/* fechas */}
            <div className="flex flex-wrap items-end justify-center gap-3">
              <label className="text-xs font-semibold text-slate-500">Desde
                <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)}
                  className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-slate-400 focus:outline-none" />
              </label>
              <label className="text-xs font-semibold text-slate-500">Hasta
                <input type="date" value={hasta} min={desde} max={R.hoyS} onChange={(e) => setHasta(e.target.value)}
                  className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-slate-400 focus:outline-none" />
              </label>
            </div>
            <BotonMagico onClick={generar}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="shrink-0">
                <rect x="2.5" y="14" width="4.2" height="7" rx="1.3" fill="#fff" opacity="0.92" />
                <rect x="9.9" y="10" width="4.2" height="11" rx="1.3" fill="#fff" />
                <rect x="17.3" y="12.5" width="4.2" height="8.5" rx="1.3" fill={LIMA} />
                <path d="M18 2 l1.2 2.5 2.5 1.2 -2.5 1.2 L18 9.4 l-1.2-2.5 L14.3 5.7 l2.5-1.2 Z" fill="#fff" />
              </svg>
              Generar análisis
            </BotonMagico>
            <p className="text-xs text-slate-400">También se genera solo cada noche a las 20:00 (con las ventas del día).</p>
          </motion.div>
        )}

        {estado === 'cargando' && (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-4 flex flex-col items-center gap-4 py-2">
            <Bot mood="thinking" />
            <div className="h-3 w-full max-w-sm overflow-hidden rounded-full bg-slate-100">
              <motion.div className="h-full rounded-full" style={{ width: `${prog}%`, background: `linear-gradient(90deg,${NAVY},${LIMA})` }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={msg} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-sm font-semibold" style={{ color: NAVY }}>{MENSAJES[msg]}</motion.p>
            </AnimatePresence>
            <p className="text-xs text-slate-400">{Math.round(prog)}% · analizando {dmy(desde)} – {dmy(hasta)}</p>
          </motion.div>
        )}

        {estado === 'listo' && data && data.sin_datos && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-4 flex flex-col items-center gap-3 py-3 text-center">
            <Bot mood="sad" size={92} />
            <div className="text-sm font-extrabold" style={{ color: NAVY }}>No hubo ventas en ese período 🗓️</div>
            <p className="max-w-sm text-sm text-slate-500">Probá con otro rango de fechas (por ejemplo "Este mes" o "Este año").</p>
            <button onClick={() => setEstado('idle')} className="rounded-2xl px-5 py-2.5 text-sm font-extrabold text-white" style={{ background: NAVY }}>
              Elegir otro período
            </button>
          </motion.div>
        )}

        {estado === 'listo' && data && !data.sin_datos && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
            <div className="flex items-center gap-4">
              <Bot mood="happy" size={88} />
              <div>
                <div className="text-sm font-extrabold" style={{ color: NAVY }}>¡Listo! Acá va tu resumen</div>
                <div className="text-xs text-slate-400">{dmy(data.period_start)} – {dmy(data.period_end)} · generado {data.generado}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[['Facturación', bs(data.facturacion)], ['Utilidad', bs(data.utilidad)],
                ['Margen', `${Number(data.margen || 0).toLocaleString('es-BO', { maximumFractionDigits: 2 })}%`]].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="text-[10px] font-semibold text-slate-400">{k.toUpperCase()}</div>
                  <div className="text-base font-extrabold" style={{ color: NAVY }}>{v}</div>
                </div>
              ))}
            </div>
            {data.resumen && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{data.resumen}</p>}
            {Array.isArray(data.recomendaciones) && data.recomendaciones.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-bold tracking-wide text-slate-400">QUÉ HACER</div>
                {data.recomendaciones.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold" style={{ background: LIMA, color: NAVY }}>{i + 1}</span>
                    <span className="text-sm text-slate-700">{r.accion || r.descripcion}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={route('admin.automation.show', data.report_id)}
                className="rounded-2xl px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition active:scale-95" style={{ background: NAVY }}>
                Ver informe completo →
              </Link>
              <button onClick={() => setEstado('idle')} className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 transition active:scale-95">
                Otro período
              </button>
            </div>
          </motion.div>
        )}

        {estado === 'error' && (
          <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-4 flex flex-col items-center gap-3 py-3">
            <Bot mood="sad" size={80} />
            <p className="text-sm font-semibold text-red-600">{err}</p>
            <button onClick={generar} className="rounded-2xl px-5 py-2.5 text-sm font-extrabold text-white" style={{ background: NAVY }}>Reintentar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
