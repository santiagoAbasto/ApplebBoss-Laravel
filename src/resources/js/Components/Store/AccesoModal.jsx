import { Link, useForm } from '@inertiajs/react';
import { AnimatePresence, motion, useAnimationControls, useDragControls, useReducedMotion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail, PackageSearch, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import BotonGoogle from '@/Components/Auth/BotonGoogle';

/*
 * «Acceder» de la tienda: la cuenta de quien compra, en un modal. En la computadora es una tarjeta al centro; en el
 * celular, una hoja que sube desde abajo y se cierra arrastrándola. Entra por /ingresar (la misma comprobación que la
 * página), que solo acepta cuentas de clientes: el equipo tiene su propia puerta y la tienda no la nombra en ninguna parte.
 */

const SUAVE = [0.22, 1, 0.36, 1];
const RESORTE = { type: 'spring', damping: 32, stiffness: 340, mass: 0.9 };

function useEsCelular() {
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

const lista = { visible: { transition: { staggerChildren: 0.055, delayChildren: 0.12 } } };
const pieza = { oculto: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: SUAVE } } };

function Campo({ icono: Icono, error, children }) {
    return (
        <div>
            <div className="group relative">
                <Icono className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#011446]" />
                {children}
            </div>
            <AnimatePresence initial={false}>
                {error && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 overflow-hidden text-xs font-semibold text-rose-600">{error}</motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

const campoCls = 'h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-[15px] text-slate-900 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 focus:border-[#011446] focus:bg-white focus:shadow-[0_0_0_4px_rgba(1,20,70,0.08)]';

function Panel({ onCerrar }) {
    const celular = useEsCelular();
    const quieto = useReducedMotion();
    const tituloId = useId();
    const arrastre = useDragControls();
    const correo = useRef(null);
    const [verClave, setVerClave] = useState(false);
    const sacudida = useAnimationControls();
    const { data, setData, post, processing, errors, reset } = useForm({ email: '', password: '', remember: true });

    // Mientras está abierto: sin scroll detrás, Escape cierra y el foco va al correo (en el celular no: abriría el teclado)
    useEffect(() => {
        const antes = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const tecla = (e) => { if (e.key === 'Escape') onCerrar(); };
        window.addEventListener('keydown', tecla);
        const t = celular ? null : setTimeout(() => correo.current?.focus(), 280);
        return () => { document.body.style.overflow = antes; window.removeEventListener('keydown', tecla); clearTimeout(t); };
    }, [onCerrar, celular]);

    const enviar = (e) => {
        e.preventDefault();
        post(route('cuenta.entrar.enviar'), {
            preserveScroll: true,
            preserveState: true,           // con error, el modal sigue abierto con el mensaje
            // Un no sutil: el formulario se sacude y el mensaje aparece debajo del campo
            onError: () => { if (!quieto) sacudida.start({ x: [0, -9, 9, -6, 6, -2, 0], transition: { duration: 0.45 } }); },
            onFinish: () => reset('password'),
        });
    };

    const entrada = quieto ? { opacity: 0 } : celular ? { y: '100%' } : { opacity: 0, y: 28, scale: 0.96 };
    const salida = quieto ? { opacity: 0 } : celular ? { y: '100%' } : { opacity: 0, y: 18, scale: 0.97 };

    return (
        <div className="fixed inset-0 z-[1300] flex items-end justify-center sm:items-center sm:p-6">
            <motion.button type="button" aria-label="Cerrar" tabIndex={-1} onClick={onCerrar}
                className="absolute inset-0 cursor-default bg-[#020a24]/55 backdrop-blur-[6px]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: SUAVE }} />

            <motion.section role="dialog" aria-modal="true" aria-labelledby={tituloId}
                className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_40px_120px_-30px_rgba(1,20,70,0.6)] sm:max-w-[440px] sm:rounded-[30px]"
                initial={entrada} animate={{ opacity: 1, y: 0, scale: 1 }} exit={salida} transition={quieto ? { duration: 0.2 } : RESORTE}
                drag={celular && !quieto ? 'y' : false} dragControls={arrastre} dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 650) onCerrar(); }}>

                {/* Cabecera azul: en el celular se arrastra desde acá para cerrar */}
                <div className="relative shrink-0 touch-none overflow-hidden px-6 pb-7 pt-5 sm:px-8 sm:pt-7"
                    onPointerDown={(e) => celular && arrastre.start(e)}
                    style={{ background: 'linear-gradient(140deg, #011446 0%, #0A2468 55%, #1A3A96 100%)' }}>
                    <span aria-hidden="true" className="ab-acceso-brillo pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-60 blur-3xl"
                        style={{ background: 'radial-gradient(circle, rgba(198,203,54,0.55), transparent 70%)' }} />
                    <span aria-hidden="true" className="ab-acceso-brillo-2 pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full opacity-50 blur-3xl"
                        style={{ background: 'radial-gradient(circle, rgba(88,94,159,0.7), transparent 70%)' }} />
                    {celular && <span aria-hidden="true" className="relative mx-auto mb-4 block h-1.5 w-11 rounded-full bg-white/30" />}

                    <button type="button" onClick={onCerrar} aria-label="Cerrar"
                        className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5 sm:top-5">
                        <X className="h-[18px] w-[18px]" />
                    </button>

                    <motion.div className="relative" initial={quieto ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08, ease: SUAVE }}>
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                            <img src="/images/logo-appleboss-marca.png" alt="" className="h-7 w-7 object-contain" />
                        </span>
                        <h2 id={tituloId} className="mt-4 text-[26px] font-black leading-tight tracking-tight text-white sm:text-[28px]">
                            Tu cuenta Apple Boss<span style={{ color: 'var(--ab-lime)' }}>.</span>
                        </h2>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-white/70">Sigue tus pedidos, califica tus compras y paga más rápido.</p>
                    </motion.div>
                </div>

                <motion.div className="overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pb-8"
                    variants={lista} initial={quieto ? false : 'oculto'} animate="visible">
                    <motion.div variants={pieza}>
                        <BotonGoogle texto="Continuar con Google" conSeparador />
                    </motion.div>

                    <motion.div variants={pieza}>
                    <motion.form onSubmit={enviar} noValidate animate={sacudida} className="flex flex-col gap-3.5">
                        <Campo icono={Mail} error={errors.email}>
                            <input ref={correo} type="email" inputMode="email" autoComplete="email" placeholder="Tu correo" aria-label="Correo"
                                className={campoCls} value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                        </Campo>
                        <Campo icono={Lock} error={errors.password}>
                            <input type={verClave ? 'text' : 'password'} autoComplete="current-password" placeholder="Contraseña" aria-label="Contraseña"
                                className={`${campoCls} pr-12`} value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                            <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                                {verClave ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                            </button>
                        </Campo>

                        <div className="flex items-center justify-between gap-3 text-[13px]">
                            <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                                <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                                No cerrar sesión
                            </label>
                            {route().has('password.request') && (
                                <Link href={route('password.request')} onClick={onCerrar} className="font-semibold text-[#011446] hover:underline">¿Olvidaste tu contraseña?</Link>
                            )}
                        </div>

                        <motion.button type="submit" disabled={processing} whileTap={quieto ? undefined : { scale: 0.985 }}
                            className="group mt-1 inline-flex h-[52px] items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(1,20,70,0.8)] transition-[filter,opacity] hover:brightness-110 disabled:opacity-70"
                            style={{ background: 'linear-gradient(135deg, #011446, #1A3A96)' }}>
                            {processing
                                ? <><LoaderCircle className="h-[18px] w-[18px] animate-spin" /> Entrando…</>
                                : <>Entrar <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" /></>}
                        </motion.button>
                    </motion.form>
                    </motion.div>

                    <motion.div variants={pieza} className="mt-6 flex flex-col gap-2.5">
                        <p className="text-center text-[14px] text-slate-600">
                            ¿Primera vez?{' '}
                            <Link href={route('cuenta.crear')} onClick={onCerrar} className="font-bold text-[#011446] hover:underline">Crea tu cuenta</Link>
                        </p>
                        <Link href={route('seguimiento')} onClick={onCerrar}
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
                </motion.div>
            </motion.section>
        </div>
    );
}

export default function AccesoModal({ abierto, onCerrar }) {
    return <AnimatePresence>{abierto && <Panel key="acceso" onCerrar={onCerrar} />}</AnimatePresence>;
}
