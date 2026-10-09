import { Head } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, LockKeyhole } from 'lucide-react';

/*
 * Lo que ve quien encuentra el panel sin ser del equipo (o sin el permiso de esa parte): un aviso con el logo, sin
 * decir qué hay detrás ni dónde se entra. No depende de la tienda (sin menú ni carrito): se dibuja aunque el error
 * ocurra antes de que la página cargue sus datos. Lo arma bootstrap/app.php (withExceptions).
 */

const SUAVE = [0.22, 1, 0.36, 1];
const aparecer = (retraso) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: retraso, ease: SUAVE } });

export default function AccesoRestringido() {
    const quieto = useReducedMotion();
    const entra = (retraso) => (quieto ? {} : aparecer(retraso));

    return (
        <>
            <Head title="Acceso restringido">
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-16 text-white"
                style={{ background: 'radial-gradient(1100px 600px at 50% 0%, #1A3A96 0%, #0A2468 38%, #011446 75%)' }}>
                {/* Cuadrícula tenue y dos luces que se mueven despacio */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black, transparent 70%)' }} />
                <span aria-hidden="true" className="ab-acceso-brillo pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(198,203,54,0.55), transparent 70%)' }} />
                <span aria-hidden="true" className="ab-acceso-brillo-2 pointer-events-none absolute -bottom-32 -left-24 h-[460px] w-[460px] rounded-full opacity-40 blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(88,94,159,0.8), transparent 70%)' }} />

                <div className="relative flex max-w-xl flex-col items-center text-center">
                    {/* El logo con ondas que se abren, y el candado que cae encima */}
                    <div className="relative grid h-40 w-40 place-items-center">
                        {!quieto && [0, 1, 2].map((i) => (
                            <motion.span key={i} aria-hidden="true" className="absolute inset-0 rounded-full border border-white/25"
                                initial={{ scale: 0.55, opacity: 0 }} animate={{ scale: [0.55, 1.35], opacity: [0.55, 0] }}
                                transition={{ duration: 3.2, delay: 0.6 + i * 1.05, repeat: Infinity, ease: 'easeOut' }} />
                        ))}
                        <motion.div className="relative grid h-24 w-24 place-items-center rounded-[28px] bg-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/20 backdrop-blur-md"
                            initial={quieto ? false : { opacity: 0, scale: 0.7, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 14, stiffness: 160, delay: 0.1 }}>
                            <motion.img src="/images/logo-appleboss-marca.png" alt="Apple Boss" className="h-12 w-12 object-contain"
                                animate={quieto ? undefined : { y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
                            <motion.span className="absolute -bottom-3 -right-3 grid h-11 w-11 place-items-center rounded-2xl shadow-lg ring-4 ring-[#0A2468]"
                                style={{ background: 'var(--ab-lime, #C6CB36)', color: '#011446' }}
                                initial={quieto ? false : { opacity: 0, y: -26, scale: 0.6 }}
                                animate={quieto ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, rotate: [0, -12, 10, -6, 0] }}
                                transition={{ delay: 0.75, duration: 0.9, ease: SUAVE }}>
                                <LockKeyhole className="h-5 w-5" strokeWidth={2.4} />
                            </motion.span>
                        </motion.div>
                    </div>

                    <motion.p {...entra(0.35)} className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ab-lime, #C6CB36)' }} /> Apple Boss
                    </motion.p>
                    <motion.h1 {...entra(0.45)} className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight sm:text-[56px]">
                        Área restringida<span style={{ color: 'var(--ab-lime, #C6CB36)' }}>.</span>
                    </motion.h1>
                    <motion.p {...entra(0.55)} className="mt-4 max-w-md text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
                        No tienes acceso a esta sección. Si buscabas algo de la tienda, te esperamos del otro lado.
                    </motion.p>

                    <motion.div {...entra(0.65)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
                        <a href="/" className="group inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-bold transition-[filter] hover:brightness-105"
                            style={{ background: 'var(--ab-lime, #C6CB36)', color: '#011446' }}>
                            Volver a la tienda <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
                        </a>
                        <a href="/catalogo" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-[15px] font-bold text-white transition-colors hover:bg-white/10">
                            Ver el catálogo
                        </a>
                    </motion.div>

                    <motion.p {...entra(0.8)} className="mt-14 text-[12px] text-white/40">Apple Boss · Cochabamba, Bolivia</motion.p>
                </div>
            </main>
        </>
    );
}
