import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, Pause, Play, ShieldCheck, ShoppingBag, Star, Store, X } from '@/Components/Store/Icons';

/*
 * Las reseñas del inicio: a la izquierda la nota (la oficial de Google si está conectado), lo que califican los que
 * compraron (producto, entrega, atención) y «¿Fuiste cliente?»; a la derecha, un muro con todas las opiniones
 * pasando solas.
 *
 * Todo sale de Tienda online → Reseñas y solo lo aprobado: nada se inventa ni se rellena. El muro es CSS puro
 * (en GPU), se pausa con el mouse, con el foco o con su botón, y queda quieto si el usuario pidió reducir el
 * movimiento. Las copias del loop se ocultan a los lectores de pantalla.
 */

const ESTRELLA = 'M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6z';
const coma = (n) => n.toLocaleString('es-BO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fechaCorta = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' }) : null);
const iniciales = (firma) => firma.split(/\s+/).map((p) => p[0]).join('').replace('.', '').slice(0, 2).toUpperCase();
const ASPECTO_CORTO = { producto: 'Producto', entrega: 'Entrega', atencion: 'Atención' };

/* Acepta medias: con un promedio de 4,5 se dibujan 4 llenas y una a la mitad, no 5 */
function Estrellas({ n, tam = 'h-4 w-4', vacia = '#C9D0DE' }) {
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
                        <path d={ESTRELLA} fill={llena ? '#E3B11A' : 'none'} stroke={llena || media ? '#E3B11A' : vacia} strokeWidth="1.6" strokeLinejoin="round" />
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

/* El número sube de 0 a la nota cuando la sección entra en pantalla */
function Nota({ valor }) {
    const ref = useRef(null);
    const visto = useInView(ref, { once: true, margin: '-80px' });
    const quieto = useReducedMotion();
    const [mostrado, setMostrado] = useState(quieto ? valor : 0);

    useEffect(() => {
        if (!visto || quieto) { setMostrado(valor); return undefined; }
        const control = animate(0, valor, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: setMostrado });
        return () => control.stop();
    }, [visto, quieto, valor]);

    return <span ref={ref} className="tabular-nums">{coma(mostrado)}</span>;
}

function Barra({ aspecto, retraso }) {
    return (
        <div>
            <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-semibold text-white/80">{aspecto.etiqueta}</span>
                <span className="font-black tabular-nums text-white">{coma(aspecto.promedio)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full" style={{ background: 'var(--ab-lime)', originX: 0 }}
                    initial={{ scaleX: 0 }} whileInView={{ scaleX: aspecto.promedio / 5 }} viewport={{ once: true }}
                    transition={{ duration: 1.1, delay: retraso, ease: [0.22, 1, 0.36, 1] }} />
            </div>
        </div>
    );
}

function Tarjeta({ r, oculta = false }) {
    const aspectos = Object.entries(r.aspectos ?? {}).filter(([clave]) => ASPECTO_CORTO[clave]);
    return (
        <figure aria-hidden={oculta || undefined}
            className="ab-tarjeta rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: 'var(--surface-white)', boxShadow: '0 18px 40px -26px rgba(1,20,70,0.55), 0 0 0 1px rgba(1,20,70,0.06)' }}>
            <div className="flex items-center justify-between gap-3">
                <Estrellas n={r.calificacion} />
                <Origen resena={r} />
            </div>
            <blockquote className="mt-3 line-clamp-6 text-[15px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>“{r.texto}”</blockquote>
            {aspectos.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {aspectos.map(([clave, nota]) => (
                        <span key={clave} className="inline-flex items-center gap-1">
                            {ASPECTO_CORTO[clave]} <Star className="h-3 w-3" style={{ color: '#E3B11A', fill: '#E3B11A' }} /> {nota}
                        </span>
                    ))}
                </p>
            )}
            <figcaption className="mt-4 flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black" aria-hidden="true"
                    style={{ background: 'var(--ab-navy)', color: 'var(--ab-lime)' }}>
                    {iniciales(r.firma)}
                </span>
                <span className="min-w-0">
                    <span className="block text-sm font-black" style={{ color: 'var(--text-primary)' }}>{r.firma}</span>
                    <span className="block truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                        {[r.producto ? `Compró ${r.producto}` : null, fechaCorta(r.fecha)].filter(Boolean).join(' · ')}
                    </span>
                </span>
            </figcaption>
        </figure>
    );
}

/* Repite la lista hasta llenar la pista, y la duplica para que el loop no tenga corte */
const llenar = (lista, minimo) => {
    if (lista.length === 0) return [];
    const base = [];
    while (base.length < minimo) base.push(...lista);
    return base;
};

function Pista({ resenas, vertical, segundos, reversa = false }) {
    return (
        <div className={`ab-pista flex gap-4 ${vertical ? 'ab-sube flex-col' : 'ab-corre w-max'} ${reversa ? 'ab-reversa' : ''}`}
            style={{ animationDuration: `${segundos}s` }}>
            {[...resenas, ...resenas].map((r, i) => (
                <div key={`${r.id}-${i}`} className={vertical ? '' : 'w-[300px] shrink-0 sm:w-[340px]'}>
                    <Tarjeta r={r} oculta={i >= resenas.length} />
                </div>
            ))}
        </div>
    );
}

function Muro({ resenas }) {
    const [enPausa, setEnPausa] = useState(false);
    const vertical = llenar(resenas, 6);
    const columnas = [vertical.filter((_, i) => i % 2 === 0), vertical.filter((_, i) => i % 2 === 1)];

    return (
        <div className="ab-muro relative min-w-0" data-pausa={enPausa ? '1' : undefined}>
            {/* Escritorio: dos columnas subiendo a distinto ritmo */}
            <div className="hidden h-[560px] grid-cols-2 gap-4 overflow-hidden lg:grid"
                style={{ WebkitMaskImage: 'linear-gradient(180deg, transparent 0, #000 12%, #000 88%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0, #000 12%, #000 88%, transparent 100%)' }}>
                <Pista resenas={columnas[0]} vertical segundos={columnas[0].length * 9} />
                <Pista resenas={columnas[1]} vertical segundos={columnas[1].length * 11} reversa />
            </div>

            {/* Celular y tablet: una fila que corre */}
            <div className="-mx-1 overflow-hidden px-1 py-2 lg:hidden"
                style={{ WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)', maskImage: 'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)' }}>
                <Pista resenas={llenar(resenas, 4)} segundos={Math.max(resenas.length, 4) * 8} />
            </div>

            <button type="button" onClick={() => setEnPausa((p) => !p)}
                aria-label={enPausa ? 'Seguir pasando las opiniones' : 'Pausar las opiniones'}
                className="ab-pausa absolute bottom-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur transition-opacity hover:opacity-100 lg:bottom-4 lg:right-4"
                style={{ color: 'var(--ab-navy)' }}>
                {enPausa ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>

            <style>{`
                @keyframes ab-sube { from { transform: translate3d(0,0,0); } to { transform: translate3d(0,calc(-50% - 8px),0); } }
                @keyframes ab-corre { from { transform: translate3d(0,0,0); } to { transform: translate3d(calc(-50% - 8px),0,0); } }
                .ab-sube { animation: ab-sube linear infinite; will-change: transform; }
                .ab-corre { animation: ab-corre linear infinite; will-change: transform; }
                .ab-reversa { animation-direction: reverse; }
                .ab-muro:hover .ab-pista, .ab-muro:focus-within .ab-pista, .ab-muro[data-pausa="1"] .ab-pista { animation-play-state: paused; }
                @media (prefers-reduced-motion: reduce) {
                    .ab-pista { animation: none !important; }
                    .ab-muro .ab-pausa { display: none; }
                    .ab-muro [aria-hidden="true"] { display: none; }
                    .ab-muro .ab-corre { width: auto; overflow-x: auto; }
                    .ab-muro .ab-sube { overflow-y: auto; max-height: 560px; }
                }
            `}</style>
        </div>
    );
}

/* «¿Fuiste cliente?»: si compró en la web, califica su pedido (es compra verificada); si compró en el local o le
   repararon un equipo, la escribe en Google y llega sola a la tienda con la importación diaria. */
function DejarResena({ escribir, onClose }) {
    const { auth } = usePage().props;
    const esCliente = auth?.user?.rol === 'cliente';
    const quieto = useReducedMotion();

    useEffect(() => {
        const alTeclear = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', alTeclear);
        return () => window.removeEventListener('keydown', alTeclear);
    }, [onClose]);

    const opcion = 'group flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors hover:bg-[var(--surface-muted)]';

    return (
        <motion.div className="fixed inset-0 z-[1200] flex items-end justify-center bg-[rgba(1,20,70,0.55)] p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="dejar-resena-titulo"
                className="w-full max-w-md rounded-3xl p-6 shadow-2xl sm:p-7" style={{ background: 'var(--surface-white)' }}
                initial={quieto ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={quieto ? { opacity: 0 } : { opacity: 0, y: 16 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 id="dejar-resena-titulo" className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Déjanos tu reseña</h3>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Elige cómo nos compraste. Solo publicamos opiniones de clientes reales.</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Cerrar" autoFocus
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-[var(--surface-muted)]" style={{ color: 'var(--text-secondary)' }}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-5 space-y-3">
                    <Link href={esCliente ? '/cuenta' : '/seguimiento'} className={opcion} style={{ borderColor: 'var(--border-light)' }}>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}>
                            <ShoppingBag className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-black" style={{ color: 'var(--text-primary)' }}>Compré en la web</span>
                            <span className="mt-0.5 block text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {esCliente ? 'Entra a Mis pedidos' : 'Busca tu pedido'} y califica el producto, la entrega y la atención. Sale como compra verificada.
                            </span>
                        </span>
                        <ArrowRight className="mt-3 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--ab-navy)' }} />
                    </Link>

                    {escribir && (
                        <a href={escribir} target="_blank" rel="noopener noreferrer" className={opcion} style={{ borderColor: 'var(--border-light)' }}>
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: 'var(--ab-navy)' }}>
                                <Store className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-black" style={{ color: 'var(--text-primary)' }}>Compré en la tienda o reparé mi equipo</span>
                                <span className="mt-0.5 block text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Escríbela en Google. Llega a esta página al día siguiente, después de revisarla.
                                </span>
                            </span>
                            <ArrowRight className="mt-3 h-4 w-4 shrink-0 -rotate-45" style={{ color: 'var(--ab-navy)' }} />
                        </a>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function CarruselResenas({ resenas, resumen, titulo, subtitulo }) {
    const [dejar, setDejar] = useState(false);
    const quieto = useReducedMotion();
    const aspectos = resumen.aspectos ?? [];
    const deGoogle = resumen.fuente === 'google';
    const cuantas = deGoogle
        ? `${resumen.total.toLocaleString('es-BO')} ${resumen.total === 1 ? 'reseña' : 'reseñas'} en Google`
        : `${resumen.total} ${resumen.total === 1 ? 'opinión publicada' : 'opiniones publicadas'}`;

    return (
        <div className="relative isolate overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12 lg:px-12"
            style={{ background: 'radial-gradient(70% 60% at 0% 0%, rgba(198,203,54,0.22), transparent 60%), radial-gradient(60% 70% at 100% 100%, rgba(88,94,159,0.45), transparent 65%), var(--ab-navy)' }}>
            {/* Luces que flotan despacio detrás de todo */}
            <motion.span aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full blur-3xl"
                style={{ background: 'rgba(198,203,54,0.18)' }}
                animate={quieto ? undefined : { x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 -z-10 h-80 w-80 rounded-full blur-3xl"
                style={{ background: 'rgba(88,94,159,0.35)' }}
                animate={quieto ? undefined : { x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />

            {/* minmax(0,…): sin eso la cinta del celular, que es muy ancha, estira la columna fuera de la pantalla */}
            <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-14">
                <div className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--ab-lime)' }}>Opiniones reales</span>
                    <h2 id="home-resenas" className="mt-2 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">{titulo}</h2>
                    {subtitulo && <p className="mt-3 text-sm leading-relaxed text-white/70">{subtitulo}</p>}

                    <div className="mt-8 flex items-end gap-4">
                        <span className="text-6xl font-black leading-none text-white sm:text-7xl"><Nota valor={resumen.promedio} /></span>
                        <div className="pb-1.5">
                            <div><Estrellas n={resumen.promedio} tam="h-5 w-5" vacia="rgba(255,255,255,0.3)" /></div>
                            {deGoogle && resumen.enlace ? (
                                <a href={resumen.enlace} target="_blank" rel="noopener noreferrer"
                                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-white/75 underline-offset-2 hover:text-white hover:underline">
                                    {cuantas} <ArrowRight className="h-3 w-3 -rotate-45" />
                                </a>
                            ) : (
                                <p className="mt-1.5 text-xs font-bold text-white/75">{cuantas}</p>
                            )}
                        </div>
                    </div>

                    {aspectos.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Lo que califican quienes compraron</p>
                            {aspectos.map((a, i) => <Barra key={a.clave} aspecto={a} retraso={0.15 * i} />)}
                        </div>
                    )}

                    <motion.button type="button" onClick={() => setDejar(true)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                        className="mt-9 inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-black shadow-[0_14px_30px_-12px_rgba(198,203,54,0.7)]"
                        style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}>
                        <Star className="h-4 w-4" /> ¿Fuiste cliente? Déjanos tu reseña
                    </motion.button>
                    <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-white/60">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--ab-lime)' }} />
                        Solo publicamos opiniones de clientes reales, revisadas por nuestro equipo.
                    </p>
                </div>

                <Muro resenas={resenas} />
            </div>

            <AnimatePresence>{dejar && <DejarResena escribir={resumen.escribir} onClose={() => setDejar(false)} />}</AnimatePresence>
        </div>
    );
}
