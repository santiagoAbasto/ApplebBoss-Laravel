import { Link, usePage } from '@inertiajs/react';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Piezas compartidas de las pantallas de Marketing y SEO del admin.

export const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[color:var(--ab-acento)] focus:outline-none focus:ring-4 focus:ring-[rgb(var(--ab-acento-rgb)_/_0.15)]';

export function PageHeader({ title, subtitle, actions }) {
    return (
        <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-[#011446]" style={{ fontFamily: "'Barlow Condensed', 'Barlow', sans-serif" }}>{title}</h1>
                {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
    );
}

export function Card({ title, subtitle, actions, children, className = '' }) {
    return (
        <section className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>
            {(title || actions) && (
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        {title && <h2 className="text-base font-bold text-slate-900">{title}</h2>}
                        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
                    </div>
                    {actions}
                </div>
            )}
            {children}
        </section>
    );
}

export function Field({ label, hint, value, max, error, children }) {
    const len = typeof value === 'string' ? value.length : null;
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</label>
                {max && len !== null && (
                    <span className={`text-[11px] tabular-nums ${len > max ? 'font-bold text-amber-600' : 'text-slate-400'}`}>{len}/{max}</span>
                )}
            </div>
            {children}
            {hint && <p className="text-[11px] leading-snug text-slate-500">{hint}</p>}
            {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        </div>
    );
}

export function Switch({ checked, onChange, disabled, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={!!checked}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className="relative inline-flex shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
            style={{ width: 44, height: 24, border: 0, padding: 0, background: checked ? '#16a34a' : '#cbd5e1' }}
        >
            <span className="inline-block rounded-full bg-white shadow transition-transform"
                style={{ width: 20, height: 20, transform: checked ? 'translateX(22px)' : 'translateX(2px)' }} />
        </button>
    );
}

const BUTTON_STYLES = {
    primary:   'bg-[#011446] text-white shadow-[0_8px_18px_-10px_rgba(1,20,70,0.6)] hover:bg-[#0A1F5C]',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    danger:    'border border-red-200 bg-white text-red-700 hover:bg-red-50',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700',
    ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
};

/** Clases de botón para usar también en <Link> o <a>. */
export const buttonCls = (variant = 'secondary', className = '') =>
    `inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant] ?? BUTTON_STYLES.secondary} ${className}`;

export function Button({ variant = 'secondary', className = '', ...props }) {
    return <button type="button" className={buttonCls(variant, className)} {...props} />;
}

/** Toast local + mensajes flash que llegan del servidor. */
export function useToast() {
    const { flash } = usePage().props;
    const [toast, setToast] = useState(null);
    const timer = useRef(null);

    const show = useCallback((msg, type = 'success') => {
        clearTimeout(timer.current);
        setToast({ msg, type });
        timer.current = setTimeout(() => setToast(null), 3500);
    }, []);

    useEffect(() => {
        if (flash?.success) show(flash.success);
        if (flash?.error) show(flash.error, 'error');
    }, [flash, show]);

    return [toast, show];
}

export function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div role="status" className={`fixed bottom-6 right-6 z-[1100] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
            {toast.msg}
        </div>
    );
}

export function MarketingTabs({ active }) {
    const tabs = [
        ['campaigns', 'Campañas', 'admin.newsletter.campaigns.index'],
        ['subscribers', 'Suscriptores', 'admin.newsletter.subscribers.index'],
        ['settings', 'Ajustes', 'admin.newsletter.settings.edit'],
        ['seo', 'Google y redes', 'admin.seo.index'],
    ];
    return (
        <nav className="flex gap-1 rounded-xl bg-slate-100 p-1" aria-label="Secciones de marketing">
            {tabs.map(([key, label, r]) => (
                <Link key={key} href={route(r)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${active === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    {label}
                </Link>
            ))}
        </nav>
    );
}

export function Modal({ title, onClose, children, footer, wide = false }) {
    useEffect(() => {
        const fn = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/40 px-4 py-6" role="dialog" aria-modal="true">
            <div className={`flex max-h-full w-full flex-col rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-black text-slate-900">{title}</h2>
                    <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">✕</button>
                </div>
                <div className="overflow-y-auto px-6 py-5">{children}</div>
                {footer && <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">{footer}</div>}
            </div>
        </div>
    );
}

export const fmtDate = (iso) => iso
    ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
    : '—';

/* ─── Piezas de formularios y listados del panel (misma línea visual en todas las pantallas) ─── */

export const bsFmt = (n) =>
    `Bs ${(Number(n) || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${inputCls} h-11 ${className}`} {...props} />;
});

export function Select({ className = '', children, ...props }) {
    return <select className={`${inputCls} h-11 pr-9 ${className}`} {...props}>{children}</select>;
}

export function Textarea({ className = '', rows = 3, ...props }) {
    return <textarea rows={rows} className={`${inputCls} py-2.5 leading-relaxed ${className}`} {...props} />;
}

/** Tarjeta de un paso de un formulario guiado: número (o ícono), título, ayuda y contenido. */
export function StepCard({ step, icon: Icon, title, subtitle, actions, children, className = '' }) {
    return (
        <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6 ${className}`}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgb(var(--ab-acento-rgb)_/_0.1)] text-[color:var(--ab-acento)]">
                        {step ? <span className="text-[15px] font-extrabold">{step}</span> : Icon ? <Icon className="h-5 w-5" /> : null}
                    </span>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">{title}</h2>
                        {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
                    </div>
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}

const SEGMENT_COLS = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4', 5: 'grid-cols-2 sm:grid-cols-5' };

/** Grupo de botones para elegir una sola opción (método de pago, tipo de producto…). */
export function Segmented({ options, value, onChange, ariaLabel, className = '', cols }) {
    return (
        <div role="radiogroup" aria-label={ariaLabel} className={`grid gap-2 ${cols ?? SEGMENT_COLS[options.length] ?? 'grid-cols-2'} ${className}`}>
            {options.map((o) => {
                const sel = value === o.value;
                const Icon = o.icon;
                return (
                    <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        onClick={() => onChange(o.value)}
                        className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-all ${
                            sel
                                ? 'border-[#011446] bg-[#011446] text-white shadow-[0_8px_18px_-10px_rgba(1,20,70,0.6)]'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        }`}
                    >
                        {Icon && <Icon className="h-4 w-4 shrink-0" />}
                        <span className="truncate">{o.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

const BADGE_TONES = {
    slate: 'bg-slate-100 text-slate-700',
    navy: 'bg-[#011446]/[0.07] text-[#011446]',
    lila: 'bg-[rgb(var(--ab-acento-rgb)_/_0.1)] text-[#3F4585]',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-800',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
};

export function Badge({ tone = 'slate', children, className = '' }) {
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${BADGE_TONES[tone] ?? BADGE_TONES.slate} ${className}`}>
            {children}
        </span>
    );
}

export function EmptyState({ icon: Icon, title, text, action }) {
    return (
        <div className="flex flex-col items-center px-6 py-14 text-center">
            {Icon && (
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <Icon className="h-6 w-6" />
                </span>
            )}
            <p className="mt-3 text-sm font-bold text-slate-800">{title}</p>
            {text && <p className="mt-1 max-w-sm text-[13px] text-slate-500">{text}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

/** Páginas a mostrar: la primera, la última y las vecinas de la actual, con «…» en los saltos. */
function paginasVisibles(actual, ultima) {
    if (ultima <= 7) return Array.from({ length: ultima }, (_, i) => i + 1);
    const set = new Set([1, ultima, actual - 1, actual, actual + 1]);
    if (actual <= 3) [2, 3, 4].forEach((p) => set.add(p));
    if (actual >= ultima - 2) [ultima - 3, ultima - 2, ultima - 1].forEach((p) => set.add(p));
    const orden = [...set].filter((p) => p >= 1 && p <= ultima).sort((a, b) => a - b);
    return orden.flatMap((p, i) => (i > 0 && p - orden[i - 1] > 1 ? ['…', p] : [p]));
}

/** Paginador para listados que vienen paginados del servidor (LengthAwarePaginator de Laravel). */
export function Paginador({ meta, onPagina, porPagina, onPorPagina, opciones = [25, 50, 100], cargando = false }) {
    const actual = Number(meta?.current_page) || 1;
    const ultima = Number(meta?.last_page) || 1;
    const total = Number(meta?.total) || 0;
    if (!total) return null;

    const boton = 'grid h-9 min-w-[36px] place-items-center rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40';

    return (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500" aria-live="polite">
                Mostrando{' '}
                <span className="font-bold text-slate-800">{(Number(meta.from) || 0).toLocaleString('es-BO')}–{(Number(meta.to) || 0).toLocaleString('es-BO')}</span>
                {' '}de <span className="font-bold text-slate-800">{total.toLocaleString('es-BO')}</span>
            </p>

            {ultima > 1 && (
                <nav className="flex flex-wrap items-center gap-1" aria-label="Paginación">
                    <button type="button" onClick={() => onPagina(actual - 1)} disabled={actual <= 1 || cargando} aria-label="Página anterior"
                        className={`${boton} text-slate-600 hover:bg-slate-100`}>
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {paginasVisibles(actual, ultima).map((p, i) => (p === '…'
                        ? <span key={`salto-${i}`} className="px-1 text-sm text-slate-400">…</span>
                        : (
                            <button key={p} type="button" onClick={() => p !== actual && onPagina(p)} disabled={cargando}
                                aria-label={`Página ${p}`} aria-current={p === actual ? 'page' : undefined}
                                className={`${boton} ${p === actual ? 'bg-[#011446] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                                {p}
                            </button>
                        )))}
                    <button type="button" onClick={() => onPagina(actual + 1)} disabled={actual >= ultima || cargando} aria-label="Página siguiente"
                        className={`${boton} text-slate-600 hover:bg-slate-100`}>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </nav>
            )}

            {onPorPagina && (
                <label className="flex items-center gap-2 text-xs text-slate-500">
                    Filas por página
                    <select value={porPagina} onChange={(e) => onPorPagina(Number(e.target.value))}
                        className="h-9 rounded-lg border border-slate-200 bg-white py-0 pl-2.5 pr-8 text-sm text-slate-700 focus:border-[color:var(--ab-acento)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ab-acento-rgb)_/_0.15)]">
                        {opciones.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                </label>
            )}
        </div>
    );
}
