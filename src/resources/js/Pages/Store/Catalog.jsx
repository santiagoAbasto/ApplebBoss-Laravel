import { Head, Link, router } from '@inertiajs/react';
import { Search, SlidersHorizontal, X } from '@/Components/Store/Icons';
import { useEffect, useRef, useState } from 'react';
import StoreLayout, { StoreContainer, useStoreCart } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';

// ─── Helpers ───────────────────────────────────────────────────────────────
function push(params) {
    const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== 0 && v !== 'todos')
    );
    router.get('/catalogo', clean, { preserveScroll: true, replace: true });
}

// ─── Filtros laterales (drawer en mobile, sidebar en desktop) ──────────────
function FilterPanel({ categories, filters, onClose }) {
    const update = (next) => push({ ...buildParams(filters), ...next, page: undefined });

    return (
        <div className="flex flex-col gap-6">
            {/* Categorías */}
            <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Categoría
                </p>
                <div className="flex flex-col gap-1">
                    {[{ slug: 'todos', name: 'Todo el catálogo' }, ...categories].map((cat) => (
                        <button
                            key={cat.slug}
                            onClick={() => { update({ categoria: cat.slug, tipo: undefined }); onClose?.(); }}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-left transition-colors"
                            style={{
                                background: filters.category === cat.slug
                                    ? (cat.myskin ? '#A3BD31' : 'var(--ab-navy)')
                                    : 'transparent',
                                color: filters.category === cat.slug
                                    ? (cat.myskin ? '#0C1B47' : '#FFFFFF')
                                    : 'var(--text-secondary)',
                            }}
                        >
                            <span>{cat.name}</span>
                            {cat.count !== undefined && (
                                <span
                                    className="text-[11px] font-bold"
                                    style={{
                                        color: filters.category === cat.slug
                                            ? 'rgba(255,255,255,0.6)'
                                            : 'var(--text-muted)',
                                    }}
                                >
                                    {cat.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Condición */}
            <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Condición
                </p>
                <div className="flex flex-col gap-1">
                    {[
                        { value: 'todos', label: 'Cualquier condición' },
                        { value: 'Nuevo', label: 'Nuevo' },
                        { value: 'Seminuevo', label: 'Seminuevo' },
                        { value: 'Open Box', label: 'Open Box' },
                    ].map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => update({ condicion: value })}
                            className="rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors"
                            style={{
                                background: filters.condition === value || (value === 'todos' && filters.condition === 'todos')
                                    ? 'var(--surface-muted)'
                                    : 'transparent',
                                color: filters.condition === value || (value === 'todos' && filters.condition === 'todos')
                                    ? 'var(--text-primary)'
                                    : 'var(--text-secondary)',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Drawer móvil ──────────────────────────────────────────────────────────
function MobileFilterDrawer({ open, onClose, categories, filters }) {
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    return (
        <>
            {/* Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            {/* Panel */}
            <aside
                className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col overflow-y-auto p-6 shadow-2xl transition-transform duration-300"
                style={{
                    background: 'var(--surface-white)',
                    transform: open ? 'translateX(0)' : 'translateX(-100%)',
                }}
                aria-label="Filtros"
                aria-hidden={!open}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                        Filtros
                    </h2>
                    <button onClick={onClose} aria-label="Cerrar filtros">
                        <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>
                <FilterPanel categories={categories} filters={filters} onClose={onClose} />
            </aside>
        </>
    );
}

// ─── Build query params from current filters ───────────────────────────────
function buildParams(filters) {
    return {
        q: filters.query || undefined,
        categoria: filters.category !== 'todos' ? filters.category : undefined,
        orden: filters.sort !== 'novedades' ? filters.sort : undefined,
        condicion: filters.condition !== 'todos' ? filters.condition : undefined,
        precio_min: filters.priceMin > 0 ? filters.priceMin : undefined,
        precio_max: filters.priceMax > 0 ? filters.priceMax : undefined,
        modelo: filters.modelo || undefined,
        tipo: filters.tipo || undefined,
    };
}

// Botón de la portada de una categoría: una página de la tienda o una dirección externa
function BotonPortada({ cta }) {
    const cls = 'mt-5 inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-sm font-bold transition-opacity hover:opacity-85';
    const estilo = { background: 'var(--ab-navy)', color: '#FFFFFF' };
    return cta.url.startsWith('/')
        ? <Link href={cta.url} className={cls} style={estilo}>{cta.label}</Link>
        : <a href={cta.url} target="_blank" rel="noopener noreferrer" className={cls} style={estilo}>{cta.label}</a>;
}

// Chips de tipo en la portada de Accesorios (cargadores, vidrios, fundas…), con cuántos hay de cada uno
function TiposPortada({ tipos, activo, onChange }) {
    const todos = { key: null, label: 'Todos', count: tipos.reduce((suma, t) => suma + t.count, 0) };
    return (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Tipo de accesorio">
            {[todos, ...tipos].map((t) => {
                const sel = (activo ?? null) === t.key;
                return (
                    <button
                        key={t.key ?? 'todos'}
                        type="button"
                        aria-pressed={sel}
                        onClick={() => onChange(t.key ?? undefined)}
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors"
                        style={{ background: sel ? 'var(--ab-navy)' : 'var(--surface-muted)', color: sel ? '#FFFFFF' : 'var(--text-secondary)' }}
                    >
                        {t.label} <span className="tabular-nums" style={{ opacity: 0.6 }}>{t.count}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Catalog inner (inside CartContext) ────────────────────────────────────
function CatalogInner({ products, categories, categoria, filters, pagination }) {
    const { add } = useStoreCart();
    const [query, setQuery] = useState(filters.query || '');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const searchRef = useRef(null);

    const totalCats = categories.reduce((sum, c) => sum + (c.count ?? 0), 0);

    const update = (next) => push({ ...buildParams(filters), ...next, page: undefined });
    const submit = (e) => { e.preventDefault(); update({ q: query || undefined }); };
    const clearAll = () => { setQuery(''); router.get('/catalogo'); };

    const hasActiveFilter = filters.query || filters.modelo || filters.tipo || filters.category !== 'todos'
        || filters.condition !== 'todos' || filters.priceMin > 0 || filters.priceMax > 0;

    const conditionLabel = {
        todos: null, Nuevo: 'Nuevo', Seminuevo: 'Seminuevo', 'Open Box': 'Open Box',
    };

    return (
        <>

            <StoreContainer>
                {/* Header: en la página de una categoría, su portada (Tienda online → Categorías) */}
                <div className="border-b py-12" style={{ borderColor: 'var(--border-light)' }}>
                    <h1
                        className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.95] tracking-[-0.04em]"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {categoria?.titulo ?? 'Catálogo'}
                    </h1>
                    <p className="mt-2 max-w-2xl text-[1rem]" style={{ color: 'var(--text-secondary)' }}>
                        {categoria?.descripcion || 'Precios actualizados desde nuestro inventario real.'}
                    </p>
                    {categoria?.cta && <BotonPortada cta={categoria.cta} />}

                    {/* Búsqueda */}
                    <form onSubmit={submit} className="relative mt-7 max-w-2xl">
                        <label htmlFor="catalog-search" className="sr-only">Buscar en el catálogo</label>
                        <Search
                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                            style={{ color: 'var(--text-muted)' }}
                        />
                        <input
                            ref={searchRef}
                            id="catalog-search"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="iPhone 15, MacBook Pro M3, AirPods…"
                            className="h-14 w-full rounded-full border pl-12 pr-28 text-[0.9375rem] transition-shadow focus:outline-none focus:ring-2"
                            style={{
                                background: 'var(--surface-white)',
                                borderColor: 'var(--border-light)',
                                '--tw-ring-color': 'var(--ab-periwinkle)',
                                color: 'var(--text-primary)',
                            }}
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 h-10 rounded-full px-5 text-sm font-bold transition-opacity hover:opacity-80"
                            style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}
                        >
                            Buscar
                        </button>
                    </form>

                    {categoria?.tipos?.length > 1 && (
                        <TiposPortada tipos={categoria.tipos} activo={filters.tipo} onChange={(tipo) => update({ tipo })} />
                    )}
                </div>

                {/* Layout: sidebar + grid */}
                <div className="flex gap-8 py-10">
                    {/* Sidebar desktop */}
                    <aside className="hidden w-56 shrink-0 lg:block">
                        <FilterPanel categories={categories} filters={filters} />
                    </aside>

                    {/* Contenido principal */}
                    <div className="min-w-0 flex-1">
                        {/* Toolbar */}
                        <div
                            className="mb-6 flex items-center gap-3 border-b pb-5"
                            style={{ borderColor: 'var(--border-light)' }}
                        >
                            {/* Mobile filter trigger */}
                            <button
                                onClick={() => setDrawerOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold lg:hidden"
                                style={{ borderColor: 'var(--border-medium)', color: 'var(--text-secondary)' }}
                            >
                                <SlidersHorizontal className="h-4 w-4" /> Filtros
                            </button>

                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                                    {pagination.total}
                                </strong>{' '}
                                resultado{pagination.total !== 1 ? 's' : ''}
                            </p>

                            {/* Active filter chips */}
                            {filters.modelo && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                                    style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}
                                >
                                    {filters.modeloNombre ?? filters.modelo}
                                    <button
                                        onClick={() => update({ modelo: undefined })}
                                        aria-label="Quitar filtro de modelo"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {filters.condition !== 'todos' && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                                    style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}
                                >
                                    {conditionLabel[filters.condition]}
                                    <button
                                        onClick={() => update({ condicion: undefined })}
                                        aria-label="Quitar filtro de condición"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            <div className="flex-1" />

                            {/* Sort */}
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="catalog-sort"
                                    className="hidden text-sm font-semibold sm:block"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Ordenar
                                </label>
                                <select
                                    id="catalog-sort"
                                    value={filters.sort}
                                    onChange={(e) => update({ orden: e.target.value })}
                                    className="rounded-full border-0 py-2 pl-3 pr-8 text-sm font-bold focus:outline-none focus:ring-2"
                                    style={{
                                        background: 'var(--surface-muted)',
                                        color: 'var(--text-primary)',
                                        '--tw-ring-color': 'var(--ab-periwinkle)',
                                    }}
                                >
                                    <option value="novedades">Más recientes</option>
                                    <option value="precio-menor">Menor precio</option>
                                    <option value="precio-mayor">Mayor precio</option>
                                    <option value="nombre">Nombre A–Z</option>
                                </select>
                            </div>

                            {hasActiveFilter && (
                                <button
                                    onClick={clearAll}
                                    className="hidden items-center gap-1 text-sm font-bold transition-opacity hover:opacity-70 sm:inline-flex"
                                    style={{ color: 'var(--ab-periwinkle)' }}
                                >
                                    <X className="h-3.5 w-3.5" /> Limpiar
                                </button>
                            )}
                        </div>

                        {/* Grid */}
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
                                {products.map((p, i) => (
                                    <ProductCard key={p.key} product={p} onAdd={add} priority={i === 0} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center">
                                <h2
                                    className="text-2xl font-black"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Sin resultados
                                </h2>
                                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Prueba con otra búsqueda o revisa todas las categorías.
                                </p>
                                <button
                                    onClick={clearAll}
                                    className="mt-6 rounded-full px-6 py-3 text-sm font-bold"
                                    style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}
                                >
                                    Ver todo el catálogo
                                </button>
                            </div>
                        )}

                        {/* Paginación */}
                        {pagination.last > 1 && (
                            <nav
                                className="mt-14 flex items-center justify-center gap-3"
                                aria-label="Paginación del catálogo"
                            >
                                <button
                                    disabled={pagination.current === 1}
                                    onClick={() => update({ page: pagination.current - 1 })}
                                    className="rounded-full border px-5 py-2.5 text-sm font-bold transition-opacity disabled:opacity-30"
                                    style={{
                                        borderColor: 'var(--border-medium)',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    Anterior
                                </button>
                                <span className="px-2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                                    {pagination.current} de {pagination.last}
                                </span>
                                <button
                                    disabled={pagination.current === pagination.last}
                                    onClick={() => update({ page: pagination.current + 1 })}
                                    className="rounded-full px-5 py-2.5 text-sm font-bold transition-opacity disabled:opacity-30"
                                    style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}
                                >
                                    Siguiente
                                </button>
                            </nav>
                        )}
                    </div>
                </div>
            </StoreContainer>

            {/* Mobile filter drawer */}
            <MobileFilterDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                categories={categories}
                filters={filters}
            />
        </>
    );
}

// ─── Catalog page ──────────────────────────────────────────────────────────
export default function Catalog({ products, categories, filters, pagination, categoria = null }) {
    return (
        <StoreLayout>
            <CatalogInner
                products={products}
                categories={categories}
                categoria={categoria}
                filters={filters}
                pagination={pagination}
            />
        </StoreLayout>
    );
}
