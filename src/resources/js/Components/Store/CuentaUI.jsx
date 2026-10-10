import { Link, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { ArrowRight, CircleCheck, Eye, EyeOff, LoaderCircle, Lock, Mail, PackageSearch, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import BotonGoogle from '@/Components/Auth/BotonGoogle';
import { AirPods, IMac, IPad, IPhone, MacBook, Watch } from '@/Components/Store/FloatingDevices';

/*
 * La cuenta de quien compra, con una sola línea visual: el modal «Acceder» y las páginas /ingresar, /crear-cuenta,
 * /forgot-password y /reset-password usan estas piezas. Si cambia una, cambian todas.
 */

export const SUAVE = [0.22, 1, 0.36, 1];
export const lista = { visible: { transition: { staggerChildren: 0.055, delayChildren: 0.12 } } };
export const pieza = { oculto: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: SUAVE } } };

export const campoCls = 'h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-[15px] text-slate-900 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 focus:border-[#011446] focus:bg-white focus:shadow-[0_0_0_4px_rgba(1,20,70,0.08)]';
export const enlaceCls = 'font-bold text-[#011446] hover:underline';

/** Un campo con su ícono a la izquierda y el error que aparece debajo. */
export function Campo({ icono: Icono, error, ayuda, children }) {
    return (
        <div>
            <div className="group relative">
                <Icono className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#011446]" />
                {children}
            </div>
            <AnimatePresence initial={false} mode="wait">
                {error ? (
                    <motion.p key="error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 overflow-hidden text-xs font-semibold text-rose-600">{error}</motion.p>
                ) : ayuda ? (
                    <p className="mt-1.5 text-xs text-slate-500">{ayuda}</p>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

/** Contraseña con el botón para mostrarla. */
export function CampoClave({ error, ayuda, ...props }) {
    const [ver, setVer] = useState(false);
    return (
        <Campo icono={Lock} error={error} ayuda={ayuda}>
            <input type={ver ? 'text' : 'password'} className={`${campoCls} pr-12`} {...props} />
            <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                {ver ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
        </Campo>
    );
}

export function BotonPrincipal({ cargando, textoCargando, children }) {
    const quieto = useReducedMotion();
    return (
        <motion.button type="submit" disabled={cargando} whileTap={quieto ? undefined : { scale: 0.985 }}
            className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(1,20,70,0.8)] transition-[filter,opacity] hover:brightness-110 disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #011446, #1A3A96)' }}>
            {cargando
                ? <><LoaderCircle className="h-[18px] w-[18px] animate-spin" /> {textoCargando}</>
                : <>{children} <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" /></>}
        </motion.button>
    );
}

/** Mensaje de que algo salió bien (enlace enviado, contraseña cambiada). */
export function Aviso({ children }) {
    if (!children) return null;
    return (
        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50 p-3.5 text-[13px] font-semibold leading-relaxed text-emerald-800">
            <CircleCheck className="mt-px h-[18px] w-[18px] shrink-0" /> {children}
        </motion.p>
    );
}

/** Sacude el formulario cuando el servidor dice que no. */
export function useSacudida() {
    const controles = useAnimationControls();
    const quieto = useReducedMotion();
    return [controles, () => { if (!quieto) controles.start({ x: [0, -9, 9, -6, 6, -2, 0], transition: { duration: 0.45 } }); }];
}

/**
 * La tarjeta: cabecera azul con dos luces que se mueven, el logo, título y bajada; debajo, el contenido.
 * `alCerrar` agrega la X; `arrastre` (del modal en el celular) deja cerrarla arrastrando la cabecera.
 */
export function TarjetaCuenta({ titulo, subtitulo, alCerrar, arrastre, asa = false, children, className = '' }) {
    const quieto = useReducedMotion();
    return (
        <div className={`relative flex w-full flex-col overflow-hidden bg-white ${className}`}>
            <div className="relative shrink-0 touch-none overflow-hidden px-6 pb-7 pt-5 sm:px-8 sm:pt-7"
                onPointerDown={arrastre ? (e) => arrastre.start(e) : undefined}
                style={{ background: 'linear-gradient(140deg, #011446 0%, #0A2468 55%, #1A3A96 100%)' }}>
                <span aria-hidden="true" className="ab-acceso-brillo pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-60 blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(198,203,54,0.55), transparent 70%)' }} />
                <span aria-hidden="true" className="ab-acceso-brillo-2 pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full opacity-50 blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(88,94,159,0.7), transparent 70%)' }} />
                {asa && <span aria-hidden="true" className="relative mx-auto mb-4 block h-1.5 w-11 rounded-full bg-white/30" />}
                {alCerrar && (
                    <button type="button" onClick={alCerrar} aria-label="Cerrar"
                        className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5 sm:top-5">
                        <X className="h-[18px] w-[18px]" />
                    </button>
                )}
                <motion.div className="relative" initial={quieto ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08, ease: SUAVE }}>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                        <img src="/images/logo-appleboss-marca.png" alt="" className="h-7 w-7 object-contain" />
                    </span>
                    {titulo}
                    {subtitulo && <p className="mt-1.5 text-[14px] leading-relaxed text-white/70">{subtitulo}</p>}
                </motion.div>
            </div>
            <motion.div className="overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pb-8"
                variants={lista} initial={quieto ? false : 'oculto'} animate="visible">
                {children}
            </motion.div>
        </div>
    );
}

/** El título de la cabecera, con el punto lima de la marca (no después de una pregunta: «¿…?.» se lee mal). */
export function TituloCuenta({ id, as: Etiqueta = 'h2', children }) {
    const pregunta = typeof children === 'string' && /[?!]$/.test(children.trim());
    return (
        <Etiqueta id={id} className="mt-4 text-[26px] font-black leading-tight tracking-tight text-white sm:text-[28px]">
            {children}{!pregunta && <span style={{ color: 'var(--ab-lime)' }}>.</span>}
        </Etiqueta>
    );
}

/**
 * Entrar a la cuenta: Google, correo y contraseña, y los caminos a crear cuenta y seguir un pedido. Lo usan el modal
 * y /ingresar. Los errores que llegan del servidor sin que se envíe el formulario (Google) también se muestran.
 */
export function FormularioEntrar({ alSalir, enfocar = false }) {
    const { errors: delServidor = {} } = usePage().props;
    const [sacudida, sacudir] = useSacudida();
    const correo = useRef(null);
    const { data, setData, post, processing, errors, reset } = useForm({ email: '', password: '', remember: true });

    useEffect(() => {
        if (!enfocar) return undefined;
        const t = setTimeout(() => correo.current?.focus(), 280);
        return () => clearTimeout(t);
    }, [enfocar]);

    const enviar = (e) => {
        e.preventDefault();
        post(route('cuenta.entrar.enviar'), {
            preserveScroll: true,
            preserveState: true,            // con error, la tarjeta sigue en pantalla con el mensaje
            onError: sacudir,
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <motion.div variants={pieza}>
                <BotonGoogle texto="Continuar con Google" conSeparador />
            </motion.div>

            <motion.div variants={pieza}>
                <motion.form onSubmit={enviar} noValidate animate={sacudida} className="flex flex-col gap-3.5">
                    <Campo icono={Mail} error={errors.email ?? delServidor.email}>
                        <input ref={correo} type="email" inputMode="email" autoComplete="email" placeholder="Tu correo" aria-label="Correo"
                            className={campoCls} value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                    </Campo>
                    <CampoClave error={errors.password} autoComplete="current-password" placeholder="Contraseña" aria-label="Contraseña"
                        value={data.password} onChange={(e) => setData('password', e.target.value)} required />

                    <div className="flex items-center justify-between gap-3 text-[13px]">
                        <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                            <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                            No cerrar sesión
                        </label>
                        <Link href={route('password.request')} onClick={alSalir} className="font-semibold text-[#011446] hover:underline">¿Olvidaste tu contraseña?</Link>
                    </div>

                    <BotonPrincipal cargando={processing} textoCargando="Entrando…">Entrar</BotonPrincipal>
                </motion.form>
            </motion.div>

            <motion.div variants={pieza} className="mt-6 flex flex-col gap-2.5">
                <p className="text-center text-[14px] text-slate-600">
                    ¿Primera vez? <Link href={route('cuenta.crear')} onClick={alSalir} className={enlaceCls}>Crea tu cuenta</Link>
                </p>
                <Link href={route('seguimiento')} onClick={alSalir}
                    className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5 transition-colors hover:border-slate-300 hover:bg-slate-50">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: 'rgba(198,203,54,0.18)', color: '#011446' }}>
                        <PackageSearch className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold text-slate-900">Seguir un pedido sin cuenta</span>
                        <span className="block text-[12px] text-slate-500">Con el código que te llegó al comprar</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
            </motion.div>
        </>
    );
}

/** Página de cuenta dentro de la tienda: la tarjeta al centro sobre un fondo suave, igual que el modal. */
/** ¿Pantalla de celular? (el mismo corte que `sm` de Tailwind) */
export function useEsCelular() {
    const consulta = '(max-width: 639px)';
    const [celular, setCelular] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches);
    useEffect(() => {
        const m = window.matchMedia(consulta);
        const cambio = () => setCelular(m.matches);
        m.addEventListener ? m.addEventListener('change', cambio) : m.addListener(cambio);
        return () => (m.removeEventListener ? m.removeEventListener('change', cambio) : m.removeListener(cambio));
    }, []);
    return celular;
}

// ─── El fondo de la cuenta (páginas y modal «Acceder»): los equipos de la tienda flotando alrededor de la tarjeta ──
// x / y en % del fondo y w en px. «giro» da la vuelta entera despacio; el resto se mece. «movil»: también en el celular;
// 'solo', únicamente ahí (llenan la franja de arriba, que es lo que deja ver la hoja del modal). En el celular los demás
// ni se montan: no gastan batería animándose ocultos.
const TRAZO = 'rgba(255,255,255,0.6)';
const LIMA = 'rgba(198,203,54,0.95)';
const EQUIPOS = [
    { C: MacBook, x: 3, y: 7, w: 200, rot: -6, trazo: TRAZO, dur: 9 },
    { C: IPhone, x: 24, y: 3, w: 56, rot: 14, trazo: LIMA, dur: 7, movil: true },
    { C: Watch, x: 14, y: 38, w: 66, rot: -10, trazo: TRAZO, dur: 8, giro: 26 },
    { C: IPad, x: 2, y: 58, w: 124, rot: 9, trazo: TRAZO, dur: 10 },
    { C: AirPods, x: 22, y: 80, w: 86, rot: -8, trazo: LIMA, dur: 7.5, giro: 32, movil: true },
    { C: IPhone, x: 9, y: 88, w: 44, rot: -18, trazo: TRAZO, dur: 6.6 },
    { C: IMac, x: 79, y: 5, w: 168, rot: 5, trazo: TRAZO, dur: 9.5, movil: true },
    { C: IPhone, x: 71, y: 30, w: 52, rot: -14, trazo: TRAZO, dur: 6.8 },
    { C: AirPods, x: 89, y: 37, w: 72, rot: 10, trazo: TRAZO, dur: 8.2, giro: 28 },
    { C: MacBook, x: 75, y: 63, w: 190, rot: 6, trazo: TRAZO, dur: 9.8, movil: true },
    { C: Watch, x: 92, y: 83, w: 56, rot: 12, trazo: LIMA, dur: 7.2, giro: 22 },
    { C: IPad, x: 66, y: 86, w: 90, rot: -7, trazo: TRAZO, dur: 8.6 },
    { C: AirPods, x: 3, y: 13, w: 60, rot: -10, trazo: TRAZO, dur: 7.8, giro: 30, movil: 'solo' },
    { C: Watch, x: 50, y: 9, w: 56, rot: 12, trazo: LIMA, dur: 7.4, giro: 24, movil: 'solo' },
];
const DESTELLOS = [[12, 24, 0.2], [32, 56, 1.4], [5, 47, 2.6], [30, 96, 0.8], [68, 14, 2], [86, 24, 0.5], [96, 58, 1.8], [70, 52, 3], [84, 96, 1.1], [48, 4, 2.3]];
const ESTRELLA = 'M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z';
const PROPORCION = new Map([[IPhone, 2], [MacBook, 90 / 140], [IPad, 120 / 90], [Watch, 100 / 60], [AirPods, 70 / 80], [IMac, 112 / 120]]);

function EquipoFlotante({ equipo: { C, x, y, w, rot, trazo, dur, giro }, orden, quieto }) {
    const h = w * PROPORCION.get(C);
    const retraso = 0.15 + orden * 0.12;
    const lima = trazo === LIMA;
    const mecerse = giro
        ? { rotate: [rot, rot + 360], transition: { duration: giro, repeat: Infinity, ease: 'linear' } }
        : { rotate: [rot - 6, rot + 6, rot - 6], transition: { duration: dur * 1.25, repeat: Infinity, ease: 'easeInOut' } };

    return (
        <motion.div className="absolute"
            style={{ left: `${x}%`, top: `${y}%`, width: `calc(${w}px * var(--ab-escala))`, height: `calc(${h}px * var(--ab-escala))` }}
            initial={quieto ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: retraso, ease: SUAVE }}>
            <motion.div className="relative h-full w-full"
                animate={quieto ? undefined : { y: [0, -18, 0], x: [0, 10, 0] }}
                transition={{ duration: dur, delay: retraso, repeat: Infinity, ease: 'easeInOut' }}>
                {/* Halo que respira detrás del equipo. closest-side: se apaga justo en el borde de su caja, sin cortarse */}
                <motion.span className="absolute -inset-[35%]"
                    style={{ background: `radial-gradient(closest-side, ${lima ? 'rgba(198,203,54,0.22)' : 'rgba(123,130,216,0.30)'}, transparent)` }}
                    animate={quieto ? undefined : { opacity: [0.4, 1, 0.4], scale: [0.9, 1.08, 0.9] }}
                    transition={{ duration: dur * 0.8, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="relative h-full w-full" initial={{ rotate: rot }} animate={quieto ? undefined : mecerse}>
                    <C width="100%" height="100%" stroke={trazo} sw={2} className="ab-trazo overflow-visible" style={{ '--ab-retraso': `${retraso}s` }} />
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

/** Decorativo: aria-hidden, sin eventos y quieto si el usuario pidió reducir el movimiento. */
export function FondoEquipos() {
    const quieto = useReducedMotion();
    const celular = useEsCelular();
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden [--ab-escala:0.6] sm:[--ab-escala:1]">
            {/* Trama de puntos y dos luces que se desplazan */}
            <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <span className="ab-acceso-brillo absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(88,94,159,0.6), transparent 65%)' }} />
            <span className="ab-acceso-brillo-2 absolute -bottom-48 -right-40 h-[600px] w-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(198,203,54,0.18), transparent 62%)' }} />

            {/* Dos órbitas alrededor de la tarjeta, cada una con su satélite */}
            {[[640, 70, 1, '#C6CB36'], [940, 110, -1, '#9EA5E8']].map(([d, s, sentido, color]) => (
                <motion.div key={d} className="absolute left-1/2 top-1/2 rounded-full border border-dashed border-white/[0.13]"
                    style={{ width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2 }}
                    animate={quieto ? undefined : { rotate: 360 * sentido }} transition={{ duration: s, repeat: Infinity, ease: 'linear' }}>
                    <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: color, boxShadow: `0 0 14px 3px ${color}` }} />
                </motion.div>
            ))}

            {EQUIPOS.map((equipo, i) => (celular ? equipo.movil : equipo.movil !== 'solo')
                && <EquipoFlotante key={i} equipo={equipo} orden={i} quieto={quieto} />)}

            {/* Destellos */}
            <svg className="absolute inset-0 h-full w-full">
                {DESTELLOS.map(([x, y, retraso], i) => (
                    <svg key={i} x={`${x}%`} y={`${y}%`} overflow="visible">
                        <motion.path d={ESTRELLA} fill={i % 2 ? '#C6CB36' : '#FFFFFF'}
                            initial={{ opacity: 0, scale: 0.3 }}
                            animate={quieto ? { opacity: 0.4, scale: 0.8 } : { opacity: [0, 0.9, 0], scale: [0.3, 1.1, 0.3], rotate: [0, 90, 180] }}
                            transition={quieto ? { duration: 0 } : { duration: 3.4, delay: retraso, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }} />
                    </svg>
                ))}
            </svg>
        </div>
    );
}

export function PaginaCuenta({ children }) {
    const quieto = useReducedMotion();
    return (
        <section className="relative flex min-h-[calc(100dvh-140px)] items-center overflow-hidden px-4 py-14 sm:min-h-[calc(100dvh-200px)] sm:py-20"
            style={{ background: 'radial-gradient(700px 520px at 50% 50%, rgba(123,130,216,0.30), transparent 70%), radial-gradient(1400px 800px at 50% 0%, #1A3A96 0%, #0A2468 45%, #011446 85%)' }}>
            <FondoEquipos />
            <motion.div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-[30px] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/20"
                initial={quieto ? false : { opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
                {children}
            </motion.div>
        </section>
    );
}
