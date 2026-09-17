import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ChevronDown, ExternalLink, LogOut, Menu, UserPlus, X } from 'lucide-react';
import ConfirmLogoutModal from '@/Components/ConfirmLogoutModal';

// ─── Línea visual del panel (misma que el acceso y la tienda) ────────────────
export const AB = { navy: '#011446', navy2: '#0A1F5C', periwinkle: '#585E9F', lime: '#C6CB36', ink: '#0D0D1A', page: '#F5F6FA' };

/**
 * Cada panel tiene su color. El acento viaja como variable CSS (`--ab-acento`) para que las piezas
 * compartidas (ui.jsx, inventario.jsx, Components/Panel) tomen el del panel donde estén montadas.
 * `--ab-acento-rgb` son los mismos canales sueltos, que es lo que necesita Tailwind para las transparencias.
 */
export const TEMAS = {
    admin: {
        acento: '#585E9F', acentoRgb: '88 94 159',
        barra: '#011446',
        gradiente: 'linear-gradient(180deg, #011446 0%, #0A1F5C 100%)',
        halo: 'rgba(88,94,159,0.28)',
        velo: 'rgba(1,20,70,0.45)',
    },
    vendedor: {
        acento: '#5C5E99', acentoRgb: '92 94 153',
        // Morado fuerte arriba y bajando la intensidad: así la marca blanca del encabezado se lee de lejos
        barra: '#2B2C52',
        gradiente: 'linear-gradient(180deg, #2B2C52 0%, #3C3E74 22%, #52548E 62%, #64669F 100%)',
        halo: 'rgba(255,255,255,0.10)',
        velo: 'rgba(46,47,86,0.5)',
    },
};
export const DISPLAY_FONT = "'Barlow Condensed', 'Barlow', system-ui, sans-serif";
const BODY_FONT = "'Barlow', system-ui, sans-serif";
const SIDEBAR_W = 264;

/** ¿El rol puede abrir esta entrada del menú? La misma regla que aplica el servidor (PermisoMiddleware). */
export function puede(permisos, modulo) {
    if (!modulo) return true;
    const lista = permisos ?? [];
    return lista.includes('*') || lista.includes(modulo);
}

export function isActive(item) {
    try {
        if (route().current(item.r)) return true;
        if (item.exact) return false;
        return route().current(item.r.replace(/\.[^.]+$/, '') + '.*');
    } catch {
        return false;
    }
}

export function safeHref(r) {
    try { return route(r); } catch { return null; }
}

function readStore(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v === '1'; } catch { return fallback; }
}

// ─── Menú lateral ────────────────────────────────────────────────────────────
function NavGroup({ group, onNavigate }) {
    const reduce = useReducedMotion();
    const hasActive = group.items.some(isActive);
    const { avisosAdmin } = usePage().props;
    const [open, setOpen] = useState(() => hasActive || readStore(`ab-nav-${group.key}`, true));

    const toggle = () => {
        const next = !open;
        setOpen(next);
        try { localStorage.setItem(`ab-nav-${group.key}`, next ? '1' : '0'); } catch { /* sin almacenamiento */ }
    };

    const list = (
        <ul className="space-y-0.5">
            {group.items.map((item) => {
                const href = safeHref(item.r);
                if (!href) return null;
                const active = isActive(item);
                const Icon = item.icon;
                return (
                    <li key={item.r}>
                        <Link
                            href={href}
                            prefetch="hover"
                            onClick={onNavigate}
                            aria-current={active ? 'page' : undefined}
                            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-semibold transition-colors ${
                                active ? 'text-white' : 'text-white/75 hover:bg-white/[0.1] hover:text-white'
                            }`}
                        >
                            {active && (
                                <motion.span
                                    layoutId="ab-nav-active"
                                    className="absolute inset-0 rounded-xl bg-white/[0.16]"
                                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                >
                                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full" style={{ background: AB.lime }} />
                                </motion.span>
                            )}
                            <Icon className={`relative h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-[#C6CB36]' : ''}`} />
                            <span className="relative truncate">{item.label}</span>
                            {/* Pendientes del módulo (por ejemplo, solicitudes de Trade-In sin responder) */}
                            {item.aviso && avisosAdmin?.[item.aviso] > 0 && (
                                <span className="relative ml-auto rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums"
                                    style={{ background: AB.lime, color: AB.ink }} title={`${avisosAdmin[item.aviso]} sin responder`}>
                                    {avisosAdmin[item.aviso]}
                                </span>
                            )}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );

    if (!group.label) return <div className="mb-3">{list}</div>;

    return (
        <div className="mb-2">
            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded-lg px-3 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 transition-colors hover:text-white/80"
            >
                {group.label}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="list"
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        {list}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Sidebar({ nav, homeRoute, insignia, filtrarPorPermisos, tema, open, isDesktop, onClose, onLogout }) {
    const scrollRef = useRef(null);
    const { auth } = usePage().props;

    // El menú muestra solo lo que el rol puede abrir; el servidor aplica la misma regla
    const grupos = useMemo(() => {
        const base = filtrarPorPermisos
            ? nav.map((g) => ({ ...g, items: g.items.filter((i) => puede(auth?.permisos, i.modulo)) }))
            : nav;
        return base.filter((g) => g.items.length > 0);
    }, [nav, filtrarPorPermisos, auth?.permisos]);

    // El layout se vuelve a montar en cada página: se recuerda hasta dónde bajaste en el menú
    useLayoutEffect(() => {
        try { scrollRef.current.scrollTop = Number(sessionStorage.getItem('ab-nav-scroll') || 0); } catch { /* nada */ }
    }, []);
    // Se guarda una vez por cuadro, no en cada evento de scroll
    const pendiente = useRef(false);
    const onScroll = (e) => {
        const el = e.currentTarget;
        if (pendiente.current) return;
        pendiente.current = true;
        requestAnimationFrame(() => {
            pendiente.current = false;
            try { sessionStorage.setItem('ab-nav-scroll', String(el.scrollTop)); } catch { /* nada */ }
        });
    };

    return (
        <aside
            className="ab-reset ab-sidebar fixed inset-y-0 left-0 z-[1040] flex flex-col overflow-hidden"
            style={{
                width: SIDEBAR_W,
                // Color sólido debajo del degradado: nunca se ve blanco mientras el navegador repinta
                backgroundColor: tema.barra,
                backgroundImage: tema.gradiente,
                // En escritorio no se desplaza: sin transform, el menú fijo no se vuelve a componer al hacer scroll
                transform: isDesktop ? 'none' : (open ? 'translate3d(0,0,0)' : 'translate3d(-100%,0,0)'),
                transition: isDesktop ? 'none' : 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            aria-label="Menú del panel"
        >
            {/* Círculo de marca */}
            <span aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-24 h-52 w-52 rounded-full" style={{ background: tema.halo }} />

            {/* Encabezado: la silueta del logo (sin el texto de la imagen) y el nombre al lado */}
            {/* Misma altura que la barra de arriba: la línea de abajo queda alineada con su borde.
                El logo va a la izquierda y el nombre, centrado en el ancho del menú; en el celular la X va a la derecha. */}
            <div className="relative h-16 shrink-0"
                style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0) 100%)' }}>
                <Link href={safeHref(homeRoute) ?? '/'} className="group flex h-full items-center justify-center px-14" onClick={onClose}>
                    <img src="/images/logo-appleboss-marca.png" alt="" width="31" height="36"
                        className="absolute left-5 top-1/2 h-9 w-auto -translate-y-1/2 transition-transform duration-300 ease-out group-hover:scale-105"
                        style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.25))' }} />
                    <span className="min-w-0 text-center">
                        <span className="block truncate text-[22px] font-extrabold leading-none tracking-tight text-white" style={{ fontFamily: DISPLAY_FONT }}>Apple Boss</span>
                        {insignia && (
                            <span className="mt-1 block pl-[0.18em] text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: AB.lime }}>{insignia}</span>
                        )}
                    </span>
                </Link>
                {/* Línea que se desvanece a los lados */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-0 h-px"
                    style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0) 100%)' }} />
                {!isDesktop && (
                    <button type="button" onClick={onClose} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-white/70 hover:bg-white/10" aria-label="Cerrar menú">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <nav ref={scrollRef} onScroll={onScroll} className="ab-scroll relative flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-2">
                {grupos.map((g) => <NavGroup key={g.key} group={g} onNavigate={isDesktop ? undefined : onClose} />)}
            </nav>

            <div className="relative shrink-0 border-t border-white/10 p-3">
                <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-semibold text-white/75 transition-colors hover:bg-white/[0.1] hover:text-white"
                >
                    <LogOut className="h-[18px] w-[18px]" /> Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

// ─── Barra superior ──────────────────────────────────────────────────────────
function UserMenu({ user, tema, onLogout }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const iniciales = (user?.name ?? 'A').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
                className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-slate-100">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold" style={{ background: tema.barra, color: AB.lime }}>{iniciales}</span>
                <span className="hidden text-left sm:block">
                    <span className="block text-sm font-bold leading-tight text-slate-900">{user?.name}</span>
                    <span className="block text-[11px] font-medium capitalize leading-tight text-slate-500">{user?.rol ?? 'admin'}</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                    >
                        <div className="px-3 py-2">
                            <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                            <p className="truncate text-xs text-slate-500">{user?.email}</p>
                        </div>
                        <div className="my-1 h-px bg-slate-100" />
                        {user?.rol === 'admin' && safeHref('register') && (
                            <Link href={route('register')} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                <UserPlus className="h-4 w-4 text-slate-400" /> Crear usuario del equipo
                            </Link>
                        )}
                        <button type="button" onClick={() => { setOpen(false); onLogout(); }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
                            <LogOut className="h-4 w-4" /> Cerrar sesión
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Topbar({ nav, migaPorDefecto, tema, onMenu, onLogout }) {
    const { auth } = usePage().props;

    // Ruta de migas a partir del menú: «Inventario › Celulares»
    const miga = useMemo(() => {
        for (const g of nav) {
            const item = g.items.find(isActive);
            if (item) return { grupo: g.label, label: item.label };
        }
        return null;
    }, [nav]);

    return (
        <header className="ab-reset sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md lg:px-8">
            <button type="button" onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
            </button>

            <nav aria-label="Ubicación" className="min-w-0 flex-1 truncate text-sm">
                {miga?.grupo && <span className="font-medium text-slate-400">{miga.grupo} <span className="mx-1">›</span> </span>}
                <span className="font-bold text-slate-900">{miga?.label ?? migaPorDefecto}</span>
            </nav>

            <a href="/" target="_blank" rel="noreferrer"
                className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:inline-flex">
                <ExternalLink className="h-4 w-4" /> Ver tienda
            </a>

            <UserMenu user={auth?.user} tema={tema} onLogout={onLogout} />
        </header>
    );
}

// ─── Armazón compartido por el panel de administración y el del vendedor ─────
export default function PanelShell({
    children,
    nav,
    homeRoute,
    headTitle,
    migaPorDefecto,
    insignia = null,
    filtrarPorPermisos = false,
    tema = 'admin',
}) {
    const t = TEMAS[tema] ?? TEMAS.admin;
    const { post } = useForm();
    const { url } = usePage();
    const reduce = useReducedMotion();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() => (
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
    ));

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = (e) => { setIsDesktop(e.matches); if (e.matches) setSidebarOpen(false); };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        if (!sidebarOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [sidebarOpen]);

    const logout = () => { setSidebarOpen(false); setShowLogoutModal(true); };

    return (
        <>
            <Head title={headTitle} />

            {/* Bootstrap de las pantallas internas antiguas, sin las utilidades que chocan con Tailwind (scripts/sbadmin-compat.py) */}
            <link rel="stylesheet" href="/sbadmin/vendor/fontawesome-free/css/all.min.css" />
            <link rel="stylesheet" href="/sbadmin/css/sb-admin-2.compat.min.css" />
            {/* Barlow se carga una sola vez en app.blade.php */}
            <style>{`
        :root { --ab-acento: ${t.acento}; --ab-acento-rgb: ${t.acentoRgb}; }
        .ab-admin, .ab-admin .btn, .ab-admin .form-control, .ab-admin .card, .ab-admin table { font-family: ${BODY_FONT}; }
        .ab-admin h1, .ab-admin h2, .ab-admin h3, .ab-admin h4, .ab-admin .h1, .ab-admin .h2, .ab-admin .h3, .ab-admin .h4 { font-family: ${BODY_FONT}; }
        /* Piezas nuevas del panel: sin los márgenes que Bootstrap pone a p, listas, títulos y etiquetas */
        :where(.ab-reset) :where(p, ul, ol, h1, h2, h3, h4, h5, h6, label, figure) { margin: 0; }
        :where(.ab-reset) :where(ul, ol) { padding: 0; list-style: none; }
        :where(.ab-reset) a:hover { text-decoration: none; }
        /* Fondo del documento con el color del panel: al rebotar el scroll no aparece blanco */
        html:has(.ab-admin), html:has(.ab-admin) body { background: ${AB.page}; overscroll-behavior-y: none; }
        .ab-sidebar { height: 100vh; height: 100dvh; backface-visibility: hidden; contain: layout paint; isolation: isolate; }
        .ab-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.18) transparent; }
        .ab-scroll::-webkit-scrollbar { width: 6px; }
        .ab-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.18); border-radius: 9999px; }
      `}</style>

            <div className="ab-admin min-h-screen" style={{ background: AB.page, fontFamily: BODY_FONT, color: '#0f172a' }}>
                <AnimatePresence>
                    {!isDesktop && sidebarOpen && (
                        <motion.button
                            type="button"
                            aria-label="Cerrar menú"
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 z-[1035] border-0"
                            style={{ background: t.velo }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                    )}
                </AnimatePresence>

                <Sidebar
                    nav={nav}
                    homeRoute={homeRoute}
                    insignia={insignia}
                    filtrarPorPermisos={filtrarPorPermisos}
                    tema={t}
                    open={sidebarOpen}
                    isDesktop={isDesktop}
                    onClose={() => setSidebarOpen(false)}
                    onLogout={logout}
                />

                <div className="flex min-h-screen flex-col" style={{ marginLeft: isDesktop ? SIDEBAR_W : 0 }}>
                    <Topbar nav={nav} migaPorDefecto={migaPorDefecto} tema={t} onMenu={() => setSidebarOpen(true)} onLogout={logout} />

                    <motion.main
                        key={url}
                        className="flex-1 px-4 py-6 lg:px-8 lg:py-8"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {children}
                    </motion.main>
                </div>
            </div>

            <ConfirmLogoutModal
                open={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => post(route('logout'))}
            />
        </>
    );
}
