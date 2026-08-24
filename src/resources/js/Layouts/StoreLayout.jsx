import { Link, router, usePage } from '@inertiajs/react';
import { Menu, Search, ShoppingBag, Trash2, X, ChevronDown } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ProductVisual from '@/Components/Store/ProductVisual';

// ─── Context ─────────────────────────────────────────────────────────────────
const CartContext = createContext(null);
export const useStoreCart = () => useContext(CartContext);

// ─── Formateo de moneda ───────────────────────────────────────────────────────
export const money = (value) =>
    new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        maximumFractionDigits: 0,
    }).format(value);

// ─── Logo Apple Boss (PNG oficial) ───────────────────────────────────────────
function AppleBossLogo({ className = '' }) {
    return (
        <img
            src="/images/logo-appleboss.png"
            alt="Apple Boss"
            height="40"
            width="40"
            className={`h-10 w-10 object-contain ${className}`}
        />
    );
}

// ─── Mega menu config ─────────────────────────────────────────────────────────
const MEGA_MENU = [
    {
        label: 'iPhone',
        href: '/catalogo?categoria=celulares',
        items: [
            { label: 'Todos los iPhones', href: '/catalogo?categoria=celulares' },
            { label: 'Nuevos', href: '/catalogo?categoria=celulares&condicion=Nuevo' },
            { label: 'Seminuevos', href: '/catalogo?categoria=celulares&condicion=Seminuevo' },
            { label: 'Open Box', href: '/catalogo?categoria=celulares&condicion=Open+Box' },
        ],
        highlight: { label: 'iPhone 14 Plus disponible →', href: '/catalogo?categoria=celulares' },
    },
    {
        label: 'Mac',
        href: '/catalogo?categoria=computadoras',
        items: [
            { label: 'Todas las Mac', href: '/catalogo?categoria=computadoras' },
            { label: 'MacBook Air', href: '/catalogo?categoria=computadoras&q=air' },
            { label: 'MacBook Pro', href: '/catalogo?categoria=computadoras&q=pro' },
            { label: 'Mac mini', href: '/catalogo?categoria=computadoras&q=mini' },
        ],
    },
    {
        label: 'Apple',
        href: '/catalogo?categoria=productos-apple',
        items: [
            { label: 'Todos los productos', href: '/catalogo?categoria=productos-apple' },
            { label: 'iPad', href: '/catalogo?categoria=productos-apple&q=ipad' },
            { label: 'Apple Watch', href: '/catalogo?categoria=productos-apple&q=watch' },
            { label: 'AirPods', href: '/catalogo?categoria=productos-apple&q=airpods' },
        ],
    },
    {
        label: 'Fundas MYSKIN',
        href: '/catalogo?categoria=fundas',
        myskin: true,
        items: [
            { label: 'Todas las fundas', href: '/catalogo?categoria=fundas' },
            { label: 'Para iPhone 14', href: '/catalogo?categoria=fundas&q=14' },
            { label: 'Para iPhone 13', href: '/catalogo?categoria=fundas&q=13' },
            { label: 'Para iPhone 15', href: '/catalogo?categoria=fundas&q=15' },
        ],
        highlight: { label: 'Nuevos modelos disponibles →', href: '/catalogo?categoria=fundas', myskin: true },
    },
    {
        label: 'Accesorios',
        href: '/catalogo?categoria=accesorios',
        items: [
            { label: 'Todos los accesorios', href: '/catalogo?categoria=accesorios' },
            { label: 'Cargadores', href: '/catalogo?categoria=accesorios&q=cargador' },
            { label: 'Cables', href: '/catalogo?categoria=accesorios&q=cable' },
        ],
    },
    {
        label: 'Seminuevos',
        href: '/catalogo?condicion=Seminuevo',
        items: [
            { label: 'Todos los seminuevos', href: '/catalogo?condicion=Seminuevo' },
            { label: 'iPhone seminuevo', href: '/catalogo?categoria=celulares&condicion=Seminuevo' },
            { label: 'Mac seminueva', href: '/catalogo?categoria=computadoras&condicion=Seminuevo' },
        ],
    },
];

// ─── Mega menu item ───────────────────────────────────────────────────────────
function MegaMenuItem({ item }) {
    const [open, setOpen] = useState(false);
    const timerRef = useRef(null);

    const handleEnter = () => {
        clearTimeout(timerRef.current);
        setOpen(true);
    };
    const handleLeave = () => {
        timerRef.current = setTimeout(() => setOpen(false), 120);
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <Link
                href={item.href}
                className={`inline-flex items-center gap-1 px-3 py-3 text-xs font-semibold tracking-wide transition-colors ${open ? 'opacity-100' : 'hover:opacity-70'}`}
                style={item.myskin ? { color: 'var(--ms-lime)' } : { color: 'var(--text-secondary)' }}
            >
                {item.label}
                {item.items && <ChevronDown className="h-3 w-3 opacity-50" />}
            </Link>

            {item.items && open && (
                <div
                    className="absolute left-0 top-full z-50 min-w-[220px] rounded-xl border py-2 shadow-xl"
                    style={{
                        background: 'var(--surface-white)',
                        borderColor: 'var(--border-light)',
                        boxShadow: 'var(--shadow-raised)',
                    }}
                    onMouseEnter={handleEnter}
                    onMouseLeave={handleLeave}
                >
                    {item.items.map((sub) => (
                        <Link
                            key={sub.href}
                            href={sub.href}
                            className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {sub.label}
                        </Link>
                    ))}
                    {item.highlight && (
                        <div
                            className="mx-2 mt-1 rounded-lg px-3 py-2.5"
                            style={{ background: item.highlight.myskin ? '#0C1B47' : 'var(--surface-muted)' }}
                        >
                            <Link
                                href={item.highlight.href}
                                className="text-xs font-bold"
                                style={{ color: item.highlight.myskin ? '#A3BD31' : 'var(--ab-periwinkle)' }}
                            >
                                {item.highlight.label}
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Header ──────────────────────────────────────────────────────────────────
function StoreHeader({ cart, cartOpen, setCartOpen, menuOpen, setMenuOpen }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef(null);

    const submitSearch = (e) => {
        e.preventDefault();
        setSearchOpen(false);
        router.get('/catalogo', search.trim() ? { q: search.trim() } : {}, { preserveState: false });
    };

    const openSearch = () => {
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
    };

    return (
        <header
            className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-lg"
            style={{ borderColor: 'var(--border-light)' }}
        >
            {/* Announcement bar */}
            <div
                className="px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-white"
                style={{ background: 'var(--ab-navy)' }}
            >
                Equipos revisados · Stock real · Atención en Bolivia
            </div>

            {/* Main header */}
            <div
                className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-10"
            >
                {/* Mobile menu btn */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="grid h-10 w-10 place-items-center rounded-lg lg:hidden"
                    aria-label="Abrir menú"
                    aria-expanded={menuOpen}
                    style={{ color: 'var(--text-primary)' }}
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Logo */}
                <Link
                    href="/"
                    className="flex shrink-0 items-center gap-2.5"
                    aria-label="Apple Boss — inicio"
                >
                    <AppleBossLogo />
                    <span
                        className="hidden text-xl font-black tracking-tight sm:block"
                        style={{ color: 'var(--ab-navy)' }}
                    >
                        Apple Boss
                    </span>
                </Link>

                {/* Desktop search */}
                {searchOpen ? (
                    <form
                        onSubmit={submitSearch}
                        className="relative ml-4 flex-1 max-w-2xl hidden md:block"
                    >
                        <label htmlFor="store-search-main" className="sr-only">Buscar productos</label>
                        <Search
                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                            style={{ color: 'var(--text-muted)' }}
                        />
                        <input
                            ref={searchRef}
                            id="store-search-main"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onBlur={() => !search && setSearchOpen(false)}
                            placeholder="Buscar iPhone, Mac, fundas, accesorios..."
                            className="h-11 w-full rounded-full border pl-12 pr-4 text-sm outline-none focus:ring-2"
                            style={{
                                borderColor: 'var(--ab-periwinkle)',
                                '--tw-ring-color': 'var(--ab-periwinkle)',
                                color: 'var(--text-primary)',
                                background: 'var(--surface-muted)',
                            }}
                        />
                    </form>
                ) : (
                    <button
                        onClick={openSearch}
                        className="ml-4 hidden h-11 flex-1 max-w-2xl items-center gap-3 rounded-full border px-4 text-sm md:flex"
                        style={{
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-muted)',
                            background: 'var(--surface-muted)',
                        }}
                    >
                        <Search className="h-4 w-4 shrink-0" />
                        Buscar iPhone, Mac, fundas, accesorios...
                    </button>
                )}

                {/* Desktop nav */}
                <nav className="ml-auto hidden items-center gap-5 text-sm font-semibold lg:flex" style={{ color: 'var(--text-primary)' }}>
                    <Link
                        href={auth?.user ? '/dashboard' : '/login'}
                        className="transition-colors hover:opacity-70"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {auth?.user ? 'Mi panel' : 'Acceder'}
                    </Link>
                </nav>

                {/* Mobile search icon */}
                <button
                    onClick={openSearch}
                    className="grid h-10 w-10 place-items-center rounded-lg md:hidden"
                    aria-label="Buscar"
                    style={{ color: 'var(--text-primary)' }}
                >
                    <Search className="h-5 w-5" />
                </button>

                {/* Cart btn */}
                <button
                    onClick={() => setCartOpen(true)}
                    className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors"
                    aria-label={`Carrito, ${cart.length} productos`}
                    style={{ color: 'var(--text-primary)' }}
                >
                    <ShoppingBag className="h-5 w-5" />
                    {cart.length > 0 && (
                        <span
                            className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-white"
                            style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                        >
                            {cart.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Category mega menu (desktop) */}
            <div
                className="hidden border-t lg:block"
                style={{ borderColor: 'var(--border-light)' }}
            >
                <nav className="mx-auto flex max-w-[1440px] items-center px-10">
                    {MEGA_MENU.map((item) => (
                        <MegaMenuItem key={item.href} item={item} />
                    ))}
                    <Link
                        href="/catalogo"
                        className="ml-auto inline-flex items-center gap-1 px-3 py-3 text-xs font-semibold"
                        style={{ color: 'var(--ab-periwinkle)' }}
                    >
                        Todo el catálogo
                    </Link>
                </nav>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <nav
                    className="border-t px-5 py-4 text-sm lg:hidden"
                    style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}
                >
                    {MEGA_MENU.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="block py-3 font-semibold"
                            style={item.myskin ? { color: 'var(--ms-lime)' } : { color: 'var(--text-primary)' }}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <div
                        className="mt-3 border-t pt-3"
                        style={{ borderColor: 'var(--border-light)' }}
                    >
                        <Link
                            href={auth?.user ? '/dashboard' : '/login'}
                            className="block py-2 text-sm font-semibold"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {auth?.user ? 'Mi panel' : 'Acceder'}
                        </Link>
                    </div>
                </nav>
            )}
        </header>
    );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ cart, remove, total, isOpen, onClose, syncing }) {
    const availableItems = cart.filter((i) => i.available !== false);
    const waMessage = encodeURIComponent(
        `Hola Apple Boss, quiero cotizar:\n\n${availableItems.map((item, i) => `${i + 1}. ${item.name} — ${money(item.price)}`).join('\n')}\n\nTotal referencial: ${money(total)}`
    );

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/40"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={`fixed right-0 top-0 z-[60] flex h-full w-full max-w-sm flex-col shadow-2xl transition-transform sm:max-w-md ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{
                    background: 'var(--surface-white)',
                    transitionDuration: 'var(--dur-panel)',
                    transitionTimingFunction: 'var(--ease-drawer)',
                }}
                aria-hidden={!isOpen}
                aria-label="Carrito de compras"
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between border-b px-6 py-5"
                    style={{ borderColor: 'var(--border-light)' }}
                >
                    <div>
                        <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                            Tu selección
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="grid h-9 w-9 place-items-center rounded-lg transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        aria-label="Cerrar carrito"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {cart.length === 0 ? (
                        <div className="grid h-full place-content-center text-center">
                            <ShoppingBag
                                className="mx-auto mb-4 h-10 w-10"
                                style={{ color: 'var(--text-muted)' }}
                            />
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                Tu carrito está vacío
                            </p>
                            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Agrega equipos para recibir una cotización.
                            </p>
                            <Link
                                href="/catalogo"
                                onClick={onClose}
                                className="mt-5 inline-block rounded-full px-6 py-3 text-sm font-bold text-white"
                                style={{ background: 'var(--ab-navy)' }}
                            >
                                Ver catálogo
                            </Link>
                        </div>
                    ) : (
                        cart.map((item) => {
                            const unavailable = item.available === false;
                            const changed = item.changed === true;
                            return (
                                <div
                                    key={item.key}
                                    className="flex gap-4 border-b py-4"
                                    style={{
                                        borderColor: 'var(--border-light)',
                                        opacity: unavailable ? 0.5 : 1,
                                    }}
                                >
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                                        <ProductVisual product={item} compact className="h-full w-full" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                            {item.name}
                                        </p>
                                        {item.condition && item.condition !== 'Nuevo' && (
                                            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{item.condition}</p>
                                        )}
                                        {unavailable ? (
                                            <p className="mt-1 text-xs font-bold" style={{ color: '#C0392B' }}>
                                                Ya no disponible — se quitará del carrito
                                            </p>
                                        ) : (
                                            <>
                                                {changed && (
                                                    <p className="mt-0.5 text-[10px] font-bold" style={{ color: 'var(--ab-periwinkle)' }}>
                                                        Precio actualizado
                                                    </p>
                                                )}
                                                <p className="mt-1.5 text-sm font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                                                    {money(item.price)}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => remove(item.key)}
                                        className="self-start p-1.5 transition-opacity hover:opacity-70"
                                        style={{ color: 'var(--text-muted)' }}
                                        aria-label={`Quitar ${item.name ?? 'producto'}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer CTA */}
                {cart.length > 0 && (
                    <div
                        className="border-t p-6"
                        style={{ borderColor: 'var(--border-light)' }}
                    >
                        <div className="mb-4 flex justify-between">
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                Total referencial
                            </span>
                            <span className="text-lg font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                                {money(total)}
                            </span>
                        </div>
                        <a
                            href={`https://wa.me/59178000000?text=${waMessage}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-12 w-full items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-90"
                            style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                        >
                            Cotizar por WhatsApp
                        </a>
                        <p
                            className="mt-3 text-center text-xs leading-5"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Confirmamos precio y disponibilidad antes de reservar.
                        </p>
                    </div>
                )}
            </aside>
        </>
    );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function StoreFooter() {
    return (
        <footer
            className="mt-24"
            style={{ background: 'var(--ab-navy)', color: '#fff' }}
        >
            <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-10">
                <div>
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/logo-appleboss.png"
                            alt="Apple Boss"
                            className="h-10 w-10 object-contain"
                        />
                        <span className="text-xl font-black">Apple Boss</span>
                    </div>
                    <p
                        className="mt-4 max-w-[28ch] text-sm leading-6"
                        style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                        Tecnología seleccionada con criterio. Precios claros. Personas reales para ayudarte a elegir.
                    </p>
                    <p
                        className="mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                        style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                    >
                        Bolivia · Cochabamba
                    </p>
                </div>

                <div>
                    <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Comprar
                    </p>
                    {[
                        ['iPhone', '/catalogo?categoria=celulares'],
                        ['Mac', '/catalogo?categoria=computadoras'],
                        ['Apple', '/catalogo?categoria=productos-apple'],
                        ['Fundas MYSKIN', '/catalogo?categoria=fundas'],
                        ['Accesorios', '/catalogo?categoria=accesorios'],
                    ].map(([label, href]) => (
                        <Link
                            key={href}
                            href={href}
                            className="mt-3 block text-sm transition-opacity hover:opacity-80"
                            style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                <div>
                    <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Nosotros
                    </p>
                    {[
                        ['Nuestra tienda', '/'],
                        ['Contacto', '/#contacto'],
                        ['Acceder', '/login'],
                    ].map(([label, href]) => (
                        <Link
                            key={href}
                            href={href}
                            className="mt-3 block text-sm transition-opacity hover:opacity-80"
                            style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                <div>
                    <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Confianza
                    </p>
                    {[
                        'Equipos revisados',
                        'Stock actualizado',
                        'Cotización confirmada',
                        'Atención personalizada',
                    ].map((text) => (
                        <p
                            key={text}
                            className="mt-3 text-sm"
                            style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                            {text}
                        </p>
                    ))}
                </div>
            </div>

            <div
                className="border-t px-6 py-5 text-center text-xs"
                style={{ borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.35)' }}
            >
                © {new Date().getFullYear()} Apple Boss · Bolivia
            </div>
        </footer>
    );
}

// ─── Layout principal ─────────────────────────────────────────────────────────
// localStorage guarda SOLO { key, quantity } — el servidor es autoridad de precios.
const CART_KEY = 'appleboss-cart-v2';

function loadStored() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}

export default function StoreLayout({ children }) {
    // refs almacenados — solo identidad
    const [stored, setStored]   = useState([]);  // [{ key, quantity }]
    // datos hidratados por el servidor — lo que se muestra al usuario
    const [hydrated, setHydrated] = useState([]); // [{ key, quantity, name, price, type, condition, available, changed }]
    const [syncing, setSyncing] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [ready, setReady] = useState(false);

    // Cargar del localStorage al montar
    useEffect(() => {
        setStored(loadStored());
        setReady(true);
    }, []);

    // Persistir en localStorage cuando cambia stored
    useEffect(() => {
        if (ready) localStorage.setItem(CART_KEY, JSON.stringify(stored));
    }, [stored, ready]);

    // Sincronizar con el servidor cuando el carrito se abre o cuando stored cambia
    useEffect(() => {
        if (!ready || stored.length === 0) { setHydrated([]); return; }
        setSyncing(true);
        fetch('/api/carrito/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ items: stored }),
        })
            .then((r) => r.ok ? r.json() : Promise.reject())
            .then((data) => {
                setHydrated(data.items ?? []);
                // Quitar del stored los que el servidor marcó como no disponibles
                setStored((prev) =>
                    prev.filter((s) => (data.items ?? []).some((h) => h.key === s.key))
                );
            })
            .catch(() => {})
            .finally(() => setSyncing(false));
    }, [ready, cartOpen]);

    const add = useCallback((product) => {
        // Solo guardar identificador estable
        setStored((current) =>
            current.some((item) => item.key === product.key)
                ? current
                : [...current, { key: product.key, quantity: 1 }]
        );
        // Optimistic: agregar al hydrated con datos del producto actual (se sobreescribe en sync)
        setHydrated((current) =>
            current.some((item) => item.key === product.key)
                ? current
                : [...current, {
                    key:       product.key,
                    quantity:  1,
                    name:      product.name,
                    price:     product.price,
                    type:      product.type,
                    condition: product.condition ?? null,
                    images:    product.images ?? [],
                    available: true,
                }]
        );
        setCartOpen(true);
    }, []);

    const remove = useCallback((key) => {
        setStored((current) => current.filter((item) => item.key !== key));
        setHydrated((current) => current.filter((item) => item.key !== key));
    }, []);

    // total computado desde datos del SERVIDOR (no del localStorage)
    const total = useMemo(
        () => hydrated.filter((i) => i.available !== false).reduce((sum, item) => sum + Number(item.price ?? 0) * (item.quantity ?? 1), 0),
        [hydrated]
    );

    // cart expuesto al contexto = datos hidratados (o stored si aún no sincronizó)
    const cart = hydrated;

    useEffect(() => {
        document.body.style.overflow = cartOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [cartOpen]);

    // Keyboard accessibility
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') { setCartOpen(false); setMenuOpen(false); } };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <CartContext.Provider value={{ cart, add, remove, total, open: () => setCartOpen(true) }}>
            {/* Google Fonts — Barlow Condensed (Cocogoose fallback) + Barlow (MADE TOMMY fallback) */}
            <link
                rel="preconnect"
                href="https://fonts.googleapis.com"
                crossOrigin="anonymous"
            />
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap"
            />

            <div
                className="min-h-screen font-sans antialiased"
                style={{ background: 'var(--surface-page)', color: 'var(--text-primary)' }}
            >
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:shadow-lg"
                >
                    Saltar al contenido
                </a>

                <StoreHeader
                    cart={cart}
                    cartOpen={cartOpen}
                    setCartOpen={setCartOpen}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                />

                <main id="main-content">
                    {children}
                </main>

                <StoreFooter />

                <CartDrawer
                    cart={cart}
                    remove={remove}
                    total={total}
                    isOpen={cartOpen}
                    onClose={() => setCartOpen(false)}
                    syncing={syncing}
                />
            </div>
        </CartContext.Provider>
    );
}
