import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { Search, X, ArrowRight } from '@/Components/Store/Icons';

const money = (v) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v);

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
    const inputRef = useRef(null);
    const debouncedQuery = useDebounce(query, 280);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setQuery('');
            setResults([]);
            setActive(-1);
            setTimeout(() => inputRef.current?.focus(), 30);
        }
    }, [open]);

    // Escape key closes overlay
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Lock body scroll while open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Fetch results
    useEffect(() => {
        if (debouncedQuery.length < 2) { setResults([]); setLoading(false); return; }
        let cancelled = false;
        setLoading(true);
        fetch(`/api/buscar?q=${encodeURIComponent(debouncedQuery)}`)
            .then((r) => r.json())
            .then((data) => { if (!cancelled) { setResults(data.results ?? []); setLoading(false); setActive(-1); } })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [debouncedQuery]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
        else if (e.key === 'Enter' && active >= 0 && results[active]) {
            window.location.href = results[active].url;
        }
    }, [active, results]);

    const goToAll = (e) => {
        e.preventDefault();
        onClose();
        window.location.href = `/catalogo${query.trim() ? '?q=' + encodeURIComponent(query.trim()) : ''}`;
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Panel */}
            <div
                className="w-full overflow-hidden shadow-2xl"
                style={{ background: 'var(--surface-white)', maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}
            >
                {/* Input row */}
                <div
                    className="flex items-center gap-3 border-b px-4 py-3 md:px-8"
                    style={{ borderColor: 'var(--border-light)' }}
                >
                    <Search className="h-5 w-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar iPhone, Mac, fundas, accesorios…"
                        className="flex-1 bg-transparent text-base outline-none"
                        style={{ color: 'var(--text-primary)' }}
                        aria-label="Buscar productos"
                        autoComplete="off"
                    />
                    {loading && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
                    )}
                    <button
                        onClick={onClose}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold"
                        style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)' }}
                        aria-label="Cerrar búsqueda"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                    {results.length > 0 ? (
                        <>
                            <ul role="listbox" aria-label="Resultados de búsqueda">
                                {results.map((r, i) => (
                                    <li key={r.slug} role="option" aria-selected={active === i}>
                                        <Link
                                            href={r.url}
                                            onClick={onClose}
                                            className="flex items-center gap-4 px-4 py-3 transition-colors md:px-8"
                                            style={{
                                                background: active === i ? 'var(--surface-muted)' : 'transparent',
                                            }}
                                            onMouseEnter={() => setActive(i)}
                                        >
                                            {/* Thumbnail */}
                                            <div
                                                className="h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                                                style={{ background: 'var(--surface-muted)' }}
                                            >
                                                {r.image ? (
                                                    <img src={r.image} alt={r.name} className="h-full w-full object-contain" loading="lazy" />
                                                ) : (
                                                    <div className="h-full w-full" />
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    {r.category}{r.condition && r.condition !== 'Nuevo' ? ` · ${r.condition}` : ''}
                                                </p>
                                            </div>
                                            {/* Price */}
                                            <span className="shrink-0 text-sm font-bold" style={{ color: 'var(--ab-navy)' }}>
                                                {money(r.price)}
                                            </span>
                                            <ArrowRight className="h-4 w-4 shrink-0 opacity-30" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            {/* Ver todos */}
                            <div className="border-t px-4 py-3 md:px-8" style={{ borderColor: 'var(--border-light)' }}>
                                <button
                                    onClick={goToAll}
                                    className="text-sm font-semibold transition-opacity hover:opacity-70"
                                    style={{ color: 'var(--ab-periwinkle)' }}
                                >
                                    Ver todos los resultados para "{query}" →
                                </button>
                            </div>
                        </>
                    ) : query.length >= 2 && !loading ? (
                        <div className="px-4 py-10 text-center md:px-8">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Sin resultados para "{query}"
                            </p>
                            <button
                                onClick={goToAll}
                                className="mt-3 text-sm font-semibold"
                                style={{ color: 'var(--ab-periwinkle)' }}
                            >
                                Buscar en todo el catálogo →
                            </button>
                        </div>
                    ) : query.length < 2 && query.length > 0 ? null : (
                        <div className="px-4 py-8 text-center text-xs md:px-8" style={{ color: 'var(--text-muted)' }}>
                            Escribí al menos 2 caracteres para buscar
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div
                    className="hidden items-center justify-end gap-4 border-t px-4 py-2 text-[11px] md:flex md:px-8"
                    style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}
                >
                    <span><kbd className="rounded border px-1 font-mono">↑↓</kbd> navegar</span>
                    <span><kbd className="rounded border px-1 font-mono">↵</kbd> abrir</span>
                    <span><kbd className="rounded border px-1 font-mono">Esc</kbd> cerrar</span>
                </div>
            </div>
        </div>
    );
}
