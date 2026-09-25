import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useId, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Pause, Play, ShieldCheck } from '@/Components/Store/Icons';

/*
 * Las reseñas del inicio: una a la vez, pasando solas.
 *
 * Todo sale de Tienda online → Reseñas, y solo lo aprobado: nada se inventa ni se rellena. Con una sola reseña no hay
 * controles; con «reducir animaciones» no avanza sola.
 */

const DURACION = 7; // segundos que se queda cada opinión

const fechaCorta = (iso) => (iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
    : null);

const iniciales = (firma) => firma.split(/\s+/).map((p) => p[0]).join('').replace('.', '').slice(0, 2).toUpperCase();

const ESTRELLA = 'M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6z';

/* Acepta medias: con un promedio de 4,5 se dibujan 4 llenas y una a la mitad, no 5 */
function Estrellas({ n, tam = 'h-4 w-4' }) {
    const mitad = useId();
    const valor = Math.round(n * 2) / 2;
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${valor.toLocaleString('es-BO')} de 5 estrellas`}>
            {[1, 2, 3, 4, 5].map((i) => {
                const llena = valor >= i;
                const media = !llena && valor >= i - 0.5;
                return (
                    <svg key={i} viewBox="0 0 24 24" className={tam} aria-hidden="true">
                        {media && <defs><clipPath id={`${mitad}-${i}`}><rect x="0" y="0" width="12" height="24" /></clipPath></defs>}
                        <path d={ESTRELLA} fill={llena ? '#E3B11A' : 'none'} stroke={llena || media ? '#E3B11A' : '#C9D0DE'} strokeWidth="1.6" strokeLinejoin="round" />
                        {media && <path d={ESTRELLA} fill="#E3B11A" clipPath={`url(#${mitad}-${i})`} />}
                    </svg>
                );
            })}
        </span>
    );
}

function Origen({ resena }) {
    if (resena.verificada) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ background: 'rgba(198,203,54,0.22)', color: 'var(--ab-navy)' }}>
                <BadgeCheck className="h-3.5 w-3.5" /> Compra verificada
            </span>
        );
    }

    const chip = (
        <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold"
            style={{ borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
            {resena.fuente_label}
            {resena.enlace && <ArrowRight className="h-3 w-3 -rotate-45" />}
        </span>
    );

    return resena.enlace
        ? <a href={resena.enlace} target="_blank" rel="noopener noreferrer nofollow" aria-label={`Ver la reseña original en ${resena.fuente_label}`}>{chip}</a>
        : chip;
}

export default function CarruselResenas({ resenas, resumen }) {
    const quieto = useReducedMotion();
    const [i, setI] = useState(0);
    const [dir, setDir] = useState(1);
    const [enPausa, setEnPausa] = useState(false);
    const [encima, setEncima] = useState(false);
    const [oculta, setOculta] = useState(false);

    const total = resenas.length;
    const r = resenas[i % total];
    const variasAlaVez = total > 1;
    const corre = variasAlaVez && !quieto && !enPausa && !encima && !oculta;

    const ir = useCallback((paso) => {
        setDir(paso);
        setI((actual) => (actual + paso + total) % total);
    }, [total]);

    // Con la pestaña en segundo plano no avanza; al volver sigue sola (la pausa del usuario se respeta aparte)
    useEffect(() => {
        const alCambiar = () => setOculta(document.hidden);
        document.addEventListener('visibilitychange', alCambiar);
        return () => document.removeEventListener('visibilitychange', alCambiar);
    }, []);

    const teclas = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); }
    };

    return (
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-14">
            {/* Promedio y cantidad: solo de lo aprobado */}
            <div>
                <div className="flex items-end gap-3">
                    <span className="text-5xl font-black leading-none tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                        {resumen.promedio.toLocaleString('es-BO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                    <div className="pb-1">
                        <Estrellas n={resumen.promedio} />
                        <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                            {resumen.total === 1 ? '1 opinión publicada' : `${resumen.total} opiniones publicadas`}
                        </p>
                    </div>
                </div>
                <p className="mt-5 flex items-start gap-2 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--ab-navy)' }} />
                    Solo publicamos opiniones de clientes reales, revisadas por nuestro equipo.
                </p>
            </div>

            <div className="relative" onMouseEnter={() => setEncima(true)} onMouseLeave={() => setEncima(false)}
                onFocus={() => setEncima(true)} onBlur={() => setEncima(false)}>
                <div role="group" aria-roledescription="carrusel" aria-label="Opiniones de clientes" tabIndex={0} onKeyDown={teclas}
                    className="relative overflow-hidden rounded-3xl border p-7 outline-none focus-visible:ring-2 sm:p-10"
                    style={{
                        borderColor: 'var(--border-light)',
                        background: 'radial-gradient(90% 120% at 100% 0%, rgba(198,203,54,0.13), transparent 55%), var(--surface-white)',
                        boxShadow: '0 24px 60px -34px rgba(1,20,70,0.35)',
                    }}>
                    {/* Comillas de la marca, enteras dentro de la tarjeta */}
                    <svg viewBox="0 0 64 48" className="pointer-events-none absolute right-7 top-7 h-9 w-12 sm:right-9 sm:top-9" aria-hidden="true">
                        <path d="M0 48V28C0 12 8 3 24 0l3 7C18 10 14 15 13 22h11v26H0zm36 0V28C36 12 44 3 60 0l3 7c-9 3-13 8-14 15h11v26H36z" fill="var(--ab-lime)" />
                    </svg>

                    <div className="relative min-h-[210px] sm:min-h-[190px]" aria-live={corre ? 'off' : 'polite'}>
                        <AnimatePresence mode="wait" custom={dir} initial={false}>
                            <motion.figure key={r.id} custom={dir}
                                initial={quieto ? { opacity: 0 } : { opacity: 0, x: dir * 36 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={quieto ? { opacity: 0 } : { opacity: 0, x: dir * -36 }}
                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                drag={variasAlaVez ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18}
                                onDragEnd={(_, info) => { if (info.offset.x < -60) ir(1); else if (info.offset.x > 60) ir(-1); }}
                                className="cursor-default select-none">
                                <Estrellas n={r.calificacion} />
                                <blockquote className="mt-4 text-lg font-medium leading-relaxed sm:text-xl" style={{ color: 'var(--text-primary)' }}>
                                    “{r.texto}”
                                </blockquote>
                                <figcaption className="mt-6 flex flex-wrap items-center gap-3">
                                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black"
                                        style={{ background: 'var(--ab-navy)', color: 'var(--ab-lime)' }} aria-hidden="true">
                                        {iniciales(r.firma)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{r.firma}</p>
                                        <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {[r.producto ? `Compró ${r.producto}` : null, fechaCorta(r.fecha)].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <Origen resena={r} />
                                </figcaption>
                            </motion.figure>
                        </AnimatePresence>
                    </div>

                    {variasAlaVez && (
                        <div className="relative mt-8 flex items-center gap-4">
                            <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
                                {/* La barra marca el tiempo de cada opinión; al llenarse, pasa a la siguiente */}
                                <motion.span key={`${i}-${corre}`} className="block h-full rounded-full"
                                    style={{ background: 'var(--ab-navy)', originX: 0 }}
                                    initial={{ scaleX: 0 }} animate={{ scaleX: corre ? 1 : 0 }}
                                    transition={{ duration: corre ? DURACION : 0, ease: 'linear' }}
                                    onAnimationComplete={() => { if (corre) ir(1); }} />
                            </div>
                            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                {(i % total) + 1} / {total}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {!quieto && (
                                    <button type="button" onClick={() => setEnPausa((p) => !p)} aria-label={enPausa ? 'Seguir pasando las opiniones' : 'Pausar las opiniones'}
                                        className="grid h-9 w-9 place-items-center rounded-full border transition-colors hover:bg-[var(--surface-muted)]"
                                        style={{ borderColor: 'var(--border-light)', color: 'var(--ab-navy)' }}>
                                        {enPausa ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                    </button>
                                )}
                                <button type="button" onClick={() => ir(-1)} aria-label="Opinión anterior"
                                    className="grid h-9 w-9 place-items-center rounded-full border transition-colors hover:bg-[var(--surface-muted)]"
                                    style={{ borderColor: 'var(--border-light)', color: 'var(--ab-navy)' }}>
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => ir(1)} aria-label="Opinión siguiente"
                                    className="grid h-9 w-9 place-items-center rounded-full text-white transition-opacity hover:opacity-90"
                                    style={{ background: 'var(--ab-navy)' }}>
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
