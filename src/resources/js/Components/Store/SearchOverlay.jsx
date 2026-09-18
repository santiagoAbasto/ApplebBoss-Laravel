import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@inertiajs/react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Search, X, ArrowRight } from '@/Components/Store/Icons';

/**
 * Buscador de la tienda.
 *
 * - **Dos columnas en escritorio:** a la izquierda la lista, a la derecha la vista previa del producto elegido
 *   (foto grande, condición y precio). En el celular ocupa toda la pantalla y va en una sola columna.
 * - **Filtros por categoría** (Todo, iPhone, Mac, Apple, Accesorios, Seminuevos) que aplica el servidor.
 * - **Nunca queda vacío:** sin texto muestra los destacados de la tienda, las búsquedas recientes del visitante
 *   y accesos directos.
 * - El input va limpio (sin caja), la fila elegida se marca con un fondo que se desliza entre filas y la vista
 *   previa cambia con un fundido. Con «reducir movimiento» del sistema todo queda quieto.
 * - Solo aparece lo que se puede comprar, con el precio que se cobra, tal como lo devuelve /api/buscar.
 */

const MAX_RECIENTES = 5;
const CLAVE_RECIENTES = 'ab-busquedas';

const CATEGORIAS = [
    { id: '', nombre: 'Todo' },
    { id: 'celulares', nombre: 'iPhone' },
    { id: 'computadoras', nombre: 'Mac' },
    { id: 'productos-apple', nombre: 'Apple' },
    { id: 'accesorios', nombre: 'Accesorios' },
    { id: 'seminuevos', nombre: 'Seminuevos' },
];

const ATAJOS = [
    { titulo: 'Todo el catálogo', url: '/catalogo' },
    { titulo: 'Comparar modelos', url: '/comparar' },
    { titulo: 'Vender mi equipo', url: '/trade-in' },
    { titulo: 'Novedades', url: '/novedades' },
];

const money = (v) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v);

const sinTildes = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const suave = [0.22, 1, 0.36, 1];

function leerRecientes() {
    try {
        const crudo = JSON.parse(window.localStorage.getItem(CLAVE_RECIENTES) ?? '[]');
        return Array.isArray(crudo) ? crudo.filter((x) => typeof x === 'string').slice(0, MAX_RECIENTES) : [];
    } catch {
        return [];
    }
}

function guardarReciente(texto) {
    const limpio = (texto ?? '').trim();
    if (limpio.length < 2) return;
    const lista = [limpio, ...leerRecientes().filter((x) => sinTildes(x) !== sinTildes(limpio))].slice(0, MAX_RECIENTES);
    try {
        window.localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(lista));
    } catch {
        /* navegación privada o almacenamiento bloqueado: la búsqueda funciona igual */
    }
}

/** Marca el trozo del nombre que coincide con lo buscado. */
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
            <mark style={{ background: 'transparent', color: 'var(--ab-navy)', fontWeight: 800 }}>{corte[1]}</mark>
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

function Etiqueta({ children, className = '' }) {
    return (
        <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${className}`} style={{ color: 'var(--text-muted)' }}>
            {children}
        </p>
    );
}

function Condicion({ valor }) {
    if (!valor || valor === 'Nuevo') return null;
    return (
        <span
            className="rounded-full px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide"
            style={{ background: 'rgba(88,94,159,0.12)', color: 'var(--ab-periwinkle)' }}
        >
            {valor}
        </span>
    );
}

function FilaEsqueleto() {
    return (
        <div className="flex items-center gap-4 px-3 py-3">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl" style={{ background: 'var(--surface-muted)' }} />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 animate-pulse rounded-full" style={{ background: 'var(--surface-muted)' }} />
                <div className="h-3 w-1/3 animate-pulse rounded-full" style={{ background: 'var(--surface-muted)' }} />
            </div>
        </div>
    );
}

/** La columna derecha: el producto elegido en grande. */
function VistaPrevia({ item, reduce, onAbrir }) {
    return (
        <div className="relative hidden w-[300px] shrink-0 border-l md:block" style={{ borderColor: 'var(--border-light)' }}>
            <AnimatePresence mode="wait" initial={false}>
                {item ? (
                    <motion.div
                        key={item.slug}
                        className="flex h-full flex-col p-6"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, y: -6 }}
                        transition={{ duration: 0.22, ease: suave }}
                    >
                        <div
                            className="relative grid aspect-square w-full place-items-center overflow-hidden"
                            style={{
                                borderRadius: 'var(--radius-xl)',
                                background: 'radial-gradient(120% 90% at 50% 20%, #FFFFFF 0%, #EEF0FA 60%, #E3E6F5 100%)',
                            }}
                        >
                            {item.image_large || item.image ? (
                                <motion.img
                                    src={item.image_large || item.image}
                                    alt=""
                                    className="h-[82%] w-[82%] object-contain drop-shadow-[0_18px_24px_rgba(1,20,70,0.18)]"
                                    initial={reduce ? false : { scale: 0.92, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.35, ease: suave }}
                                />
                            ) : (
                                <Search className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
                            )}
                        </div>
                        <div className="mt-5 flex items-center gap-2 text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                            <span>{item.category}</span>
                            <Condicion valor={item.condition} />
                        </div>
                        <p className="mt-1.5 text-[17px] font-bold leading-snug tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {item.name}
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-[22px] font-extrabold tabular-nums tracking-tight" style={{ color: 'var(--ab-navy)' }}>
                                {money(item.price)}
                            </span>
                            {item.price_before && (
                                <span className="text-[13px] tabular-nums line-through" style={{ color: 'var(--text-muted)' }}>
                                    {money(item.price_before)}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => onAbrir(item)}
                            className="mt-auto inline-flex h-11 items-center justify-center gap-2 text-[14px] font-bold text-white transition-transform active:scale-[0.98]"
                            style={{ background: 'var(--ab-navy)', borderRadius: 'var(--radius-full)' }}
                        >
                            Ver producto <ArrowRight className="h-4 w-4" />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="vacio"
                        className="grid h-full place-items-center p-8 text-center"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduce ? undefined : { opacity: 0 }}
                    >
                        <div>
                            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: 'var(--surface-muted)' }}>
                                <Search className="h-6 w-6" style={{ color: 'var(--ab-periwinkle)' }} />
                            </div>
                            <p className="mt-4 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Pasa el cursor por un producto</p>
                            <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>y lo ves aquí en grande, con su precio.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function SearchOverlay({ open, onClose }) {
    const reduce = useReducedMotion();
    const [query, setQuery] = useState('');
    const [categoria, setCategoria] = useState('');
    const [results, setResults] = useState([]);
    const [destacados, setDestacados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(0);
    const [recientes, setRecientes] = useState([]);
    const inputRef = useRef(null);
    const listaRef = useRef(null);
    const debouncedQuery = useDebounce(query, 260);

    const escribiendo = query.trim().length >= 2;
    const lista = escribiendo ? results : destacados;

    useEffect(() => {
        if (!open) return;
        setQuery('');
        setCategoria('');
        setResults([]);
        setActive(0);
        setRecientes(leerRecientes());
        const t = setTimeout(() => inputRef.current?.focus(), 40);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Mientras está abierto, la página no se desplaza y el botón de WhatsApp se aparta.
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

    // Destacados para el estado inicial (según la categoría elegida).
    useEffect(() => {
        if (!open) return;
        let cancelado = false;
        const params = new URLSearchParams({ destacados: '1' });
        if (categoria) params.set('categoria', categoria);
        fetch(`/api/buscar?${params}`)
            .then((r) => r.json())
            .then((data) => { if (!cancelado) setDestacados(data.results ?? []); })
            .catch(() => { if (!cancelado) setDestacados([]); });
        return () => { cancelado = true; };
    }, [open, categoria]);

    // Resultados de la búsqueda.
    useEffect(() => {
        const q = debouncedQuery.trim();
        if (q.length < 2) { setResults([]); setLoading(false); return; }
        let cancelado = false;
        setLoading(true);
        const params = new URLSearchParams({ q });
        if (categoria) params.set('categoria', categoria);
        fetch(`/api/buscar?${params}`)
            .then((r) => r.json())
            .then((data) => { if (!cancelado) { setResults(data.results ?? []); setLoading(false); setActive(0); } })
            .catch(() => { if (!cancelado) { setResults([]); setLoading(false); } });
        return () => { cancelado = true; };
    }, [debouncedQuery, categoria]);

    useEffect(() => { setActive(0); }, [escribiendo, categoria]);

    const irA = useCallback((url) => {
        onClose();
        window.location.href = url;
    }, [onClose]);

    const irACatalogo = useCallback((texto) => {
        const limpio = (texto ?? '').trim();
        guardarReciente(limpio);
        const params = new URLSearchParams();
        if (limpio) params.set('q', limpio);
        if (categoria && categoria !== 'seminuevos') params.set('categoria', categoria);
        irA(`/catalogo${params.toString() ? `?${params}` : ''}`);
    }, [categoria, irA]);

    const abrirResultado = useCallback((r) => {
        guardarReciente(query);
        irA(r.url);
    }, [irA, query]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, lista.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (escribiendo && lista[active]) abrirResultado(lista[active]);
            else if (escribiendo) irACatalogo(query);
        }
    }, [active, lista, escribiendo, query, abrirResultado, irACatalogo]);

    // La fila elegida con el teclado siempre queda a la vista.
    useEffect(() => {
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

    if (typeof document === 'undefined') return null;

    const sinResultados = escribiendo && !loading && results.length === 0;
    const elegido = lista[active] ?? null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    key="buscador"
                    className="fixed inset-0 z-[9999] flex items-stretch justify-center overflow-y-auto overscroll-contain sm:items-start sm:px-4 sm:py-[9vh]"
                    style={{ background: 'rgba(1, 20, 70, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Buscar en la tienda"
                >
                    <motion.div
                        className="relative flex h-[100dvh] w-full flex-col overflow-hidden sm:h-auto sm:max-h-[80vh] sm:max-w-[880px]"
                        style={{
                            background: 'var(--surface-white)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: '0 40px 100px rgba(1,20,70,0.38)',
                        }}
                        initial={reduce ? false : { opacity: 0, y: -14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? undefined : { opacity: 0, y: -10, scale: 0.985 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    >
                        {/* Filo de marca arriba */}
                        <div
                            aria-hidden="true"
                            className="h-[3px] w-full shrink-0"
                            style={{ background: 'linear-gradient(90deg, var(--ab-navy), var(--ab-periwinkle) 55%, var(--ab-lime))' }}
                        />

                        {/* Campo: sin caja, solo la lupa y el texto */}
                        <div className="flex items-center gap-4 px-5 pt-[max(16px,env(safe-area-inset-top))] sm:px-7 sm:pt-6">
                            <Search className="h-[22px] w-[22px] shrink-0" style={{ color: 'var(--ab-navy)', opacity: 0.6 }} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="¿Qué estás buscando?"
                                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[20px] font-semibold tracking-tight outline-none ring-0 placeholder:font-medium placeholder:opacity-40 focus:outline-none focus:ring-0 sm:text-[24px]"
                                style={{ color: 'var(--text-primary)' }}
                                aria-label="Buscar productos"
                                autoComplete="off"
                                enterKeyHint="search"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => buscar('')}
                                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--surface-muted)]"
                                    style={{ color: 'var(--text-muted)' }}
                                    aria-label="Borrar lo escrito"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="hidden shrink-0 items-center rounded-md border px-2 py-1 font-mono text-[11px] font-semibold transition-colors hover:bg-[var(--surface-muted)] sm:inline-flex"
                                style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}
                                aria-label="Cerrar búsqueda"
                            >
                                Esc
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="shrink-0 text-[14px] font-semibold sm:hidden"
                                style={{ color: 'var(--ab-periwinkle)' }}
                            >
                                Cerrar
                            </button>
                        </div>

                        {/* Filtros por categoría */}
                        <LayoutGroup id="buscador-categorias">
                            <div
                                className="flex gap-1.5 overflow-x-auto border-b px-5 pb-4 pt-4 sm:px-7"
                                style={{ borderColor: 'var(--border-light)', scrollbarWidth: 'none' }}
                                role="tablist"
                                aria-label="Filtrar por categoría"
                            >
                                {CATEGORIAS.map((c) => {
                                    const activa = categoria === c.id;
                                    return (
                                        <button
                                            key={c.id || 'todo'}
                                            type="button"
                                            role="tab"
                                            aria-selected={activa}
                                            onClick={() => { setCategoria(c.id); inputRef.current?.focus(); }}
                                            className="relative shrink-0 px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
                                            style={{ color: activa ? '#FFFFFF' : 'var(--text-secondary)', borderRadius: 'var(--radius-full)' }}
                                        >
                                            {activa && (
                                                <motion.span
                                                    layoutId="categoria-activa"
                                                    className="absolute inset-0"
                                                    style={{ background: 'var(--ab-navy)', borderRadius: 'var(--radius-full)' }}
                                                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
                                                />
                                            )}
                                            <span className="relative">{c.nombre}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </LayoutGroup>

                        <div className="flex min-h-0 flex-1 sm:min-h-[420px]">
                            {/* Columna izquierda: resultados o estado inicial */}
                            <div className="min-w-0 flex-1 overflow-y-auto" ref={listaRef}>
                                {!escribiendo && recientes.length > 0 && (
                                    <div className="px-5 pt-5 sm:px-7">
                                        <div className="flex items-center justify-between">
                                            <Etiqueta>Tus búsquedas</Etiqueta>
                                            <button
                                                type="button"
                                                onClick={limpiarRecientes}
                                                className="text-[12px] font-semibold transition-opacity hover:opacity-70"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                Borrar
                                            </button>
                                        </div>
                                        <div className="mt-2.5 flex flex-wrap gap-2">
                                            {recientes.map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => buscar(t)}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--border-light)]"
                                                    style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-full)' }}
                                                >
                                                    <Search className="h-3 w-3 opacity-60" />
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(lista.length > 0 || (escribiendo && loading)) && (
                                    <Etiqueta className="px-5 pb-1 pt-5 sm:px-7">
                                        {escribiendo ? `Productos${results.length ? ` · ${results.length}` : ''}` : 'Destacados de la tienda'}
                                    </Etiqueta>
                                )}

                                {escribiendo && loading && results.length === 0 && (
                                    <div className="px-2 sm:px-4">
                                        <FilaEsqueleto /><FilaEsqueleto /><FilaEsqueleto />
                                    </div>
                                )}

                                {lista.length > 0 && (
                                    <LayoutGroup id="buscador-filas">
                                        <ul role="listbox" aria-label="Resultados de búsqueda" className="px-2 pb-3 sm:px-4">
                                            {lista.map((r, i) => (
                                                <motion.li
                                                    key={r.slug}
                                                    role="option"
                                                    aria-selected={active === i}
                                                    data-fila
                                                    initial={reduce ? false : { opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.22, delay: reduce ? 0 : Math.min(i, 6) * 0.03, ease: suave }}
                                                >
                                                    <Link
                                                        href={r.url}
                                                        onClick={() => guardarReciente(query)}
                                                        onMouseEnter={() => setActive(i)}
                                                        onFocus={() => setActive(i)}
                                                        className="relative flex items-center gap-4 px-3 py-2.5"
                                                    >
                                                        {active === i && (
                                                            <motion.span
                                                                layoutId="fila-activa"
                                                                className="absolute inset-0"
                                                                style={{ background: 'var(--surface-muted)', borderRadius: 'var(--radius-lg)' }}
                                                                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 40 }}
                                                            />
                                                        )}
                                                        <div
                                                            className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden"
                                                            style={{ background: 'var(--surface-white)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}
                                                        >
                                                            {r.image ? (
                                                                <img src={r.image} alt="" className="h-[86%] w-[86%] object-contain" loading="lazy" />
                                                            ) : (
                                                                <Search className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                                                            )}
                                                        </div>
                                                        <div className="relative min-w-0 flex-1">
                                                            <p className="truncate text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                                                <Resaltado texto={r.name} busca={query} />
                                                            </p>
                                                            <p className="mt-0.5 flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                                                                <span>{r.category}</span>
                                                                <Condicion valor={r.condition} />
                                                            </p>
                                                        </div>
                                                        <div className="relative shrink-0 text-right">
                                                            <p className="text-[15px] font-extrabold tabular-nums tracking-tight" style={{ color: 'var(--ab-navy)' }}>
                                                                {money(r.price)}
                                                            </p>
                                                            {r.price_before && (
                                                                <p className="text-[11px] tabular-nums line-through" style={{ color: 'var(--text-muted)' }}>
                                                                    {money(r.price_before)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </LayoutGroup>
                                )}

                                {sinResultados && (
                                    <div className="px-6 py-14 text-center">
                                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: 'var(--surface-muted)' }}>
                                            <Search className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                        <p className="mt-4 text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>
                                            No encontramos «{query.trim()}»
                                        </p>
                                        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                                            Prueba con el modelo, por ejemplo «iPhone 15» o «funda»{categoria ? ', o cambia a Todo' : ''}.
                                        </p>
                                    </div>
                                )}

                                {query.trim().length === 1 && (
                                    <p className="px-6 py-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                                        Escribe al menos 2 letras para buscar.
                                    </p>
                                )}

                                {!escribiendo && (
                                    <div className="px-5 pb-5 pt-3 sm:px-7">
                                        <Etiqueta>Ir directo a</Etiqueta>
                                        <div className="mt-2.5 flex flex-wrap gap-2">
                                            {ATAJOS.map((a) => (
                                                <Link
                                                    key={a.url}
                                                    href={a.url}
                                                    onClick={onClose}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-[var(--surface-muted)]"
                                                    style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: 'var(--radius-full)' }}
                                                >
                                                    {a.titulo} <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Columna derecha: vista previa */}
                            <VistaPrevia item={elegido} reduce={reduce} onAbrir={abrirResultado} />
                        </div>

                        {/* Pie */}
                        <div
                            className="flex items-center justify-between gap-3 border-t px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-7 sm:pb-3"
                            style={{ borderColor: 'var(--border-light)', background: 'var(--surface-page)' }}
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
                                <span><kbd className="rounded border bg-white px-1 font-mono">↑↓</kbd> moverte</span>
                                <span><kbd className="rounded border bg-white px-1 font-mono">↵</kbd> abrir</span>
                                <span><kbd className="rounded border bg-white px-1 font-mono">Esc</kbd> cerrar</span>
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
