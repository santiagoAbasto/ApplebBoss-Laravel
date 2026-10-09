import { Link, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { ArrowRight, CircleCheck, Eye, EyeOff, LoaderCircle, Lock, Mail, PackageSearch, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import BotonGoogle from '@/Components/Auth/BotonGoogle';

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
export function PaginaCuenta({ children }) {
    const quieto = useReducedMotion();
    return (
        <section className="relative overflow-hidden px-4 py-10 sm:py-16"
            style={{ background: 'radial-gradient(1200px 420px at 50% -10%, rgba(26,58,150,0.12), transparent 70%), var(--surface-page)' }}>
            <motion.div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-[30px] shadow-[0_40px_100px_-40px_rgba(1,20,70,0.45)] ring-1 ring-slate-200/70"
                initial={quieto ? false : { opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
                {children}
            </motion.div>
        </section>
    );
}
