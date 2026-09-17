import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { IPhone, MacBook, Watch } from '@/Components/Store/FloatingDevices';

// Sistema visual del acceso al panel: mismo azul, lila y lima que la tienda y el admin.
export const BRAND = {
    navy: '#011446',
    navy2: '#0A1F5C',
    periwinkle: '#585E9F',
    lime: '#C6CB36',
    ink: '#0D0D1A',
    page: '#F5F6FA',
};
export const DISPLAY = { fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif" };

const ASIDE_DEFAULT = {
    eyebrow: 'Panel de gestión',
    heading: 'Todo tu negocio Apple Boss en un solo lugar',
    text: 'Inventario, ventas, cotizaciones y la tienda online, con la misma cuenta.',
    bullets: ['Inventario y precios al día', 'Ventas, reservas y cotizaciones', 'Tienda online y campañas'],
};

function Floating({ children, className, style, delay = 0, dur = 7, rot = 0 }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            aria-hidden="true"
            className={`pointer-events-none absolute ${className}`}
            style={style}
            initial={{ opacity: 0, y: 20, rotate: rot }}
            animate={reduce ? { opacity: 1, y: 0, rotate: rot } : { opacity: 1, y: [0, -14, 0], rotate: [rot, rot + 2, rot] }}
            transition={reduce ? { duration: 0.6, delay } : {
                opacity: { duration: 1, delay },
                y: { duration: dur, delay, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: dur * 1.3, delay, repeat: Infinity, ease: 'easeInOut' },
            }}
        >
            {children}
        </motion.div>
    );
}

function Logo({ className = '' }) {
    return (
        <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
            <img src="/images/logo-appleboss.png" alt="" className="h-9 w-9 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            <span className="text-xl font-extrabold tracking-tight text-white" style={DISPLAY}>Apple Boss</span>
        </Link>
    );
}

/**
 * Marco de todas las pantallas de acceso: panel de marca a la izquierda y formulario a la derecha.
 * En celular el panel de marca se reduce a una franja con el logo.
 */
export default function AuthShell({ title, pageTitle, subtitle, icon: Icon, back, aside = {}, children, footer }) {
    const a = { ...ASIDE_DEFAULT, ...aside };
    const year = new Date().getFullYear();

    return (
        <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]" style={{ background: BRAND.page, fontFamily: "'Barlow', system-ui, sans-serif" }}>
            <Head title={pageTitle ?? title} />
            {/* Barlow se carga una sola vez en app.blade.php */}

            {/* ── Panel de marca ── */}
            <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14" style={{ background: `linear-gradient(160deg, ${BRAND.navy} 0%, ${BRAND.navy2} 100%)` }}>
                {/* Círculos de marca */}
                <span aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full" style={{ background: 'rgba(88,94,159,0.35)' }} />
                <span aria-hidden="true" className="absolute -bottom-16 left-[30%] h-40 w-40 rounded-full" style={{ background: 'rgba(198,203,54,0.12)' }} />

                {/* Siluetas de equipos flotando */}
                {/* Van en la franja derecha y arriba/abajo del texto para no taparlo nunca */}
                <Floating className="right-[20%] top-[9%] w-[170px] opacity-80" rot={-4} delay={0.5} dur={8}>
                    <MacBook stroke="#9EA5E8" sw={1.4} />
                </Floating>
                <Floating className="right-[6%] top-[36%] w-[78px]" rot={-8} delay={0.2}>
                    <IPhone stroke="#9EA5E8" sw={1.6} />
                </Floating>
                <Floating className="bottom-[13%] right-[16%] w-[58px]" rot={10} delay={0.8} dur={6}>
                    <Watch stroke={BRAND.lime} sw={1.6} />
                </Floating>

                <Logo className="relative" />

                <motion.div
                    className="relative max-w-[400px] xl:max-w-[430px]"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <span className="mb-4 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ background: 'rgba(198,203,54,0.16)', color: BRAND.lime }}>
                        {a.eyebrow}
                    </span>
                    <h2 className="text-[44px] font-extrabold leading-[1.02] tracking-tight text-white" style={DISPLAY}>{a.heading}</h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-white/75">{a.text}</p>
                    <ul className="mt-8 space-y-3">
                        {a.bullets.map((b) => (
                            <li key={b} className="flex items-center gap-3 text-sm font-medium text-white/90">
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: BRAND.lime, color: BRAND.ink }}>
                                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                </span>
                                {b}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <p className="relative text-xs text-white/50">© {year} Apple Boss · Cochabamba, Bolivia</p>
            </aside>

            {/* ── Formulario ── */}
            <main className="flex min-h-screen flex-col">
                {/* Franja de marca en celular */}
                <div className="flex items-center justify-between px-5 py-4 lg:hidden" style={{ background: BRAND.navy }}>
                    <Logo />
                </div>

                <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
                    <motion.div
                        className="w-full max-w-[420px]"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {back && (
                            <Link href={back.href} className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
                                <span aria-hidden="true">←</span> {back.label}
                            </Link>
                        )}

                        {Icon && (
                            <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl" style={{ background: 'rgba(88,94,159,0.12)', color: BRAND.periwinkle }}>
                                <Icon className="h-6 w-6" />
                            </span>
                        )}
                        <h1 className="text-[34px] font-extrabold leading-tight tracking-tight" style={{ ...DISPLAY, color: BRAND.navy }}>{title}</h1>
                        {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{subtitle}</p>}

                        <div className="mt-8">{children}</div>

                        {footer && <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">{footer}</div>}
                    </motion.div>
                </div>

                <p className="pb-6 text-center text-xs text-slate-400 lg:hidden">© {year} Apple Boss · Cochabamba, Bolivia</p>
            </main>
        </div>
    );
}
