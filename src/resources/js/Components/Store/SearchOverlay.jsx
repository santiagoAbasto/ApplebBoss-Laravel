import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@inertiajs/react';
import { Search, X, ArrowRight } from '@/Components/Store/Icons';

/**
 * Buscador de la tienda.
 *
 * - **Panel, no franja:** una tarjeta centrada de ancho de lectura; en el celular ocupa toda la pantalla.
 *   Antes era una banda blanca de lado a lado que dejaba un vacío enorme cuando no había nada escrito.
 * - **Nunca queda vacío:** sin texto muestra las búsquedas recientes del visitante, sugerencias y accesos
 *   directos (catálogo, comparador, trade-in, novedades).
 * - **Se lee rápido:** cada resultado lleva su foto, la categoría, la condición y el precio del inventario,
 *   y se resalta la parte del nombre que coincide con lo buscado.
 * - Se maneja con teclado (↑ ↓ para moverse, Enter para abrir, Esc para cerrar) y se monta en el body para
 *   que ningún contenedor de la página lo tape.
 */

const MAX_RECIENTES = 5;
const CLAVE_RECIENTES = 'ab-busquedas';

const SUGERENCIAS = ['iPhone', 'Mac', 'iPad', 'Fundas', 'Cargadores', 'Seminuevos'];

const ATAJOS = [
    { titulo: 'Ver todo el catálogo', detalle: 'Todos los productos disponibles', url: '/catalogo' },
    { titulo: 'Comparar modelos', detalle: 'Ficha técnica lado a lado', url: '/comparar' },
    { titulo: 'Vender mi equipo', detalle: 'Cotiza tu usado (trade-in)', url: '/trade-in' },
    { titulo: 'Novedades', detalle: 'Lo último de la tienda', url: '/novedades' },
];

const money = (v) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v);

const sinTildes = (s) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function leerRecientes() {
    try {
        const crudo = JSON.parse(window.localStorage.getItem(CLAVE_RECIENTES) ?? '[]');
        return Array.isArray(crudo) ? crudo.filter((x) => typeof x === 'string').slice(0, MAX_RECIENTES) : [];
    } catch {
        return [];
    }
}

function guardarReciente(texto) {
    const limpio = texto.trim();
    if (limpio.length < 2) return leerRecientes();
    const lista = [limpio, ...leerRecientes().filter((x) => sinTildes(x) !== sinTildes(limpio))].slice(0, MAX_RECIENTES);
    try {
        window.localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(lista));
    } catch {
        /* navegación privada o almacenamiento bloqueado: la búsqueda funciona igual */
    }
    return lista;
}

/** Marca en negrita el trozo del nombre que coincide con lo buscado. */
function Resaltado({ texto, busca }) {
    const corte = useMemo(() => {
        const t = sinTildes(texto);
        const b = sinTildes(busca).trim();
        const i = b.length >= 2 ? t.indexOf(b) : -1;
        return i < 0 ? null : [texto.slice(0, i), texto.slice(i, i + b.length), texto.slice(i + b.length)];
    }, [texto, busca]);

    if (!corte) return texto;
    return (
        <>
            {corte[0]}
            <mark style={{ background: 'transparent', color: 'inherit', fontWeight: 800 }}>{corte[1]}</mark>
            {corte[2]}
        </>
    );
}

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function SearchOverlay({ open, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(-1);
    const [recientes, setRecientes] = useState([]);
    const inputRef = useRef(null);
    const listaRef = useRef(null);
    const debouncedQuery = useDebounce(query, 280);

    useEffect(() => {
        if (!open) return;
        setQuery('');
        setResults([]);
        setActive(-1);
        setRecientes(leerRecientes());
        const t = setTimeout(() => inputRef.current?.focus(), 30);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Mientras el buscador está abierto, la página no se desplaza y el botón de WhatsApp se aparta.
    useEffect(() => {
        if (!open) return;
        const previo = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.dataset.buscando = '1';
        return () => {
            document.body.style.overflow = previo;
            delete document.body.dataset.buscando;
        };
    }, [open]);

    useEffect(() => {
        if (debouncedQuery.trim().length < 2) { setResults([]); setLoading(false); return; }
        let cancelado = false;
        setLoading(true);
        fetch(`/api/buscar?q=${encodeURIComponent(debouncedQuery.trim())}`)
            .then((r) => r.json())
            .then((data) => { if (!cancelado) { setResults(data.results ?? []); setLoading(false); setActive(-1); } })
            .catch(() => { if (!cancelado) { setResults([]); setLoading(false); } });
        return () => { cancelado = true; };
    }, [debouncedQuery]);

    const irACatalogo = useCallback((texto) => {
        const limpio = (texto ?? '').trim();
        guardarReciente(limpio);
        onClose();
        window.location.href = `/catalogo${limpio ? `?q=${encodeURIComponent(limpio)}` : ''}`;
    }, [onClose]);

    const abrirResultado = useCallback((r) => {
        guardarReciente(query);
        onClose();
        window.location.href = r.url;
    }, [onClose, query]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (active >= 0 && results[active]) abrirResultado(results[active]);
            else if (query.trim().length >= 2) irACatalogo(query);
        }
    }, [active, results, query, abrirResultado, irACatalogo]);

    // La fila elegida con el teclado siempre queda a la vista.
    useEffect(() => {
        if (active < 0) return;
        listaRef.current?.querySelectorAll('[data-fila]')?.[active]?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    const buscar = (texto) => {
        setQuery(texto);
        inputRef.current?.focus();
    };

    const limpiarRecientes = () => {
        try { window.localStorage.removeItem(CLAVE_RECIENTES); } catch { /* sin almacenamiento */ }
        setRecientes([]);
    };

    if (!open || typeof document === 'undefined') return null;

    const escribiendo = query.trim().length >= 2;
    const sinResultados = escribiendo && !loading && results.length === 0;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-stretch justify-center overflow-y-auto overscroll-contain px-0 py-0 sm:items-start sm:px-4 sm:py-[10vh]"
            style={{ background: 'rgba(1, 20, 70, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Buscar en la tienda"
        >
            <div
                className="flex h-[100dvh] w-full flex-col overflow-hidden sm:h-auto sm:max-h-[78vh] sm:max-w-[640px]"
                style={{
                    background: 'var(--surface-white)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: '0 32px 80px rgba(1,20,70,0.32)',
                }}
            >
                {/* Campo de búsqueda: sin caja, solo la lupa y el texto */}
                <div
                    className="flex items-center gap-4 border-b px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))] sm:px-7 sm:py-5"
                    style={{ borderColor: 'var(--border-light)' }}
                >
                    <Search className="h-5 w-5 shrink-0" style={{ color: 'var(--ab-navy)', opacity: 0.55 }} />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar iPhone, Mac, fundas…"
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[19px] font-medium tracking-tight outline-none ring-0 placeholder:font-normal placeholder:opacity-45 focus:outline-none focus:ring-0 sm:text-[21px]"
                        style={{ color: 'var(--text-primary)' }}
                        aria-label="Buscar productos"
                        autoComplete="off"
                        enterKeyHint="search"
                    />
                    {loading && (
                        <span
                            className="h-[18px] w-[18px] shrink-0 animate-spin rounded-full border-2 border-t-transparent"
                            style={{ borderColor: 'var(--border-medium)', borderTopColor: 'transparent' }}
                            aria-hidden="true"
                        />
                    )}
                    {query && !loading && (
                        <button
                            type="button"
                            onClick={() => buscar('')}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--surface-muted)]"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label="Borrar lo escrito"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 text-[13px] font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-60 sm:hidden"
                        style={{ color: 'var(--ab-periwinkle)' }}
                    >
                        Listo
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto" ref={listaRef}>
                    {/* Resultados */}
                    {results.length > 0 && (
                        <>
                            <p
                                className="px-5 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] sm:px-7"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Productos
                            </p>
                            <ul role="listbox" aria-label="Resultados de búsqueda" className="px-3 pb-3 sm:px-5">
                                {results.map((r, i) => (
                                    <li key={r.slug} role="option" aria-selected={active === i} data-fila>
                                        <Link
                                            href={r.url}
                                            onClick={() => guardarReciente(query)}
                                            onMouseEnter={() => setActive(i)}
                                            className="flex items-center gap-4 px-2 py-2.5 transition-colors"
                                            style={{
                                                background: active === i ? 'var(--surface-muted)' : 'transparent',
                                                borderRadius: 'var(--radius-lg)',
                                            }}
                                        >
                                            <div
                                                className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden"
                                                style={{ background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}
                                            >
                                                {r.image ? (
                                                    <img src={r.image} alt="" className="h-full w-full object-contain" loading="lazy" />
                                                ) : (
                                                    <Search className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                                    <Resaltado texto={r.name} busca={query} />
                                                </p>
                                                <p className="mt-0.5 flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                                                    <span>{r.category}</span>
                                                    {r.condition && r.condition !== 'Nuevo' && (
                                                        <span
                                                            className="rounded-full px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide"
                                                            style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}
                                                        >
                                                            {r.condition}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[15px] font-extrabold tabular-nums tracking-tight" style={{ color: 'var(--ab-navy)' }}>
                                                {money(r.price)}
                                            </span>
                                            <ArrowRight className="hidden h-4 w-4 shrink-0 opacity-30 sm:block" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {/* Sin resultados */}
                    {sinResultados && (
                        <div className="px-6 py-12 text-center">
                            <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                                No encontramos «{query.trim()}»
                            </p>
                            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                                Prueba con el modelo, por ejemplo «iPhone 15» o «funda».
                            </p>
                            <button
                                type="button"
                                onClick={() => irACatalogo(query)}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold"
                                style={{ background: 'var(--ab-navy)', color: 'var(--text-on-dark)', borderRadius: 'var(--radius-full)' }}
                            >
                                Buscar en todo el catálogo <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Estado inicial: recientes, sugerencias y accesos directos */}
                    {!escribiendo && (
                        <div className="px-5 pb-5 sm:px-7">
                            {recientes.length > 0 && (
                                <>
                                    <div className="flex items-center justify-between pb-2 pt-2">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                                            Tus búsquedas
                                        </p>
                                        <button
                                            type="button"
                                            onClick={limpiarRecientes}
                                            className="text-[12px] font-semibold transition-opacity hover:opacity-70"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            Borrar
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pb-4">
                                        {recientes.map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => buscar(t)}
                                                className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium transition-colors hover:opacity-80"
                                                style={{
                                                    background: 'var(--surface-muted)',
                                                    color: 'var(--text-secondary)',
                                                    borderRadius: 'var(--radius-full)',
                                                }}
                                            >
                                                <Search className="h-3 w-3 opacity-60" />
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            <p className="pb-2.5 pt-4 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                                Sugerencias
                            </p>
                            <div className="flex flex-wrap gap-2 pb-5">
                                {SUGERENCIAS.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => buscar(t)}
                                        className="px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-[var(--surface-muted)]"
                                        style={{
                                            background: 'var(--surface-white)',
                                            color: 'var(--ab-periwinkle)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-full)',
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <p className="pb-2.5 pt-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                                Ir directo a
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {ATAJOS.map((a) => (
                                    <Link
                                        key={a.url}
                                        href={a.url}
                                        onClick={onClose}
                                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-90"
                                        style={{ background: 'var(--surface-muted)', borderRadius: 'var(--radius-lg)' }}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{a.titulo}</p>
                                            <p className="truncate text-[12px]" style={{ color: 'var(--text-muted)' }}>{a.detalle}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 shrink-0 opacity-40" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Escribió una sola letra */}
                    {query.trim().length === 1 && (
                        <p className="px-6 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                            Escribe al menos 2 letras para buscar.
                        </p>
                    )}
                </div>

                {/* Pie: ver todos y atajos de teclado */}
                <div
                    className="flex items-center justify-between gap-3 border-t px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-7 sm:pb-3"
                    style={{ borderColor: 'var(--border-light)' }}
                >
                    <button
                        type="button"
                        onClick={() => irACatalogo(query)}
                        className="inline-flex items-center gap-1.5 text-[13px] font-bold transition-opacity hover:opacity-70"
                        style={{ color: 'var(--ab-periwinkle)' }}
                    >
                        {escribiendo ? `Ver todos los resultados de «${query.trim()}»` : 'Ver todo el catálogo'}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <span className="hidden items-center gap-3 text-[11px] sm:flex" style={{ color: 'var(--text-muted)' }}>
                        <span><kbd className="rounded border px-1 font-mono">↑↓</kbd> moverte</span>
                        <span><kbd className="rounded border px-1 font-mono">↵</kbd> abrir</span>
                        <span><kbd className="rounded border px-1 font-mono">Esc</kbd> cerrar</span>
                    </span>
                </div>
            </div>
        </div>,
        document.body,
    );
}
