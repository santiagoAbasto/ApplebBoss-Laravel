import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Check, ChevronDown, ChevronRight, Exchange, GitCompare, Mail, Menu, Search, ShoppingBag, Trash2, X } from '@/Components/Store/Icons';
import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ProductVisual from '@/Components/Store/ProductVisual';
import SearchOverlay from '@/Components/Store/SearchOverlay';
import SeoHead from '@/Components/Store/SeoHead';
import { CompareProvider } from '@/Components/Store/CompareContext';
import CompareBar from '@/Components/Store/CompareBar';
import { esExterno } from '@/Components/Store/enlaces';
import WhatsAppFlotante from '@/Components/Store/WhatsAppFlotante';
import { nombreTienda, saludoWhatsapp } from '@/Components/Store/tienda';

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

// ─── Container central 1224px ─────────────────────────────────────────────────
// A 1366px: márgenes exactos de 71px cada lado (71+1224+71=1366)
// En pantallas mayores el contenido permanece centrado en 1224px
export function StoreContainer({ children, className = '' }) {
    return (
        <div className={`w-full max-w-[1224px] mx-auto px-4 sm:px-7 md:px-10 ${className}`}>
            {children}
        </div>
    );
}

// ─── Enlaces del menú (Tienda online → Menú) ─────────────────────────────────
// Los enlaces del panel pueden apuntar a una página de la tienda, a otro sitio (WhatsApp, Instagram) o a nada.
// Inertia solo sabe navegar dentro del sitio: lo de afuera va con <a> (ver esExterno) para que no se rompa.

function EnlaceMenu({ href, nuevaPestana = false, children, ...props }) {
    if (!href) return <span {...props}>{children}</span>;
    if (esExterno(href) || nuevaPestana) {
        return (
            <a href={href} target={nuevaPestana ? '_blank' : undefined} rel={nuevaPestana ? 'noreferrer' : undefined} {...props}>
                {children}
            </a>
        );
    }
    return <Link href={href} {...props}>{children}</Link>;
}

// ─── Mega menu config (fallback estático cuando no hay DB items) ──────────────
const MEGA_MENU_STATIC = [
    {
        label: 'iPhone',
        href: '/iphone',
        items: [
            { label: 'Ver todos los iPhones', href: '/iphone' },
            { label: 'Nuevos', href: '/catalogo?categoria=celulares&condicion=Nuevo' },
            { label: 'Seminuevos', href: '/catalogo?categoria=celulares&condicion=Seminuevo' },
            { label: 'Comparar modelos', href: '/comparar/iphone' },
        ],
    },
    {
        label: 'Mac',
        href: '/mac',
        items: [
            { label: 'Ver todas las Mac', href: '/mac' },
            { label: 'Nuevas', href: '/catalogo?categoria=computadoras&condicion=Nuevo' },
            { label: 'Seminuevos', href: '/catalogo?categoria=computadoras&condicion=Seminuevo' },
            { label: 'Comparar modelos', href: '/comparar/mac' },
        ],
    },
    {
        label: 'Más Apple',
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
        href: '/myskin',
        myskin: true,
        items: [
            { label: 'Ver todas las fundas', href: '/myskin' },
            { label: 'Para iPhone 14 Series', href: '/catalogo?categoria=fundas&q=14' },
            { label: 'Para iPhone 15 Series', href: '/catalogo?categoria=fundas&q=15' },
            { label: 'Para iPhone 13 Series', href: '/catalogo?categoria=fundas&q=13' },
        ],
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
        href: '/seminuevos',
        items: [
            { label: 'Ver seminuevos', href: '/seminuevos' },
            { label: 'iPhone seminuevo', href: '/catalogo?categoria=celulares&condicion=Seminuevo' },
            { label: 'Mac seminueva', href: '/catalogo?categoria=computadoras&condicion=Seminuevo' },
        ],
    },
];

// ─── Mega menu item ───────────────────────────────────────────────────────────
function MegaMenuItem({ item, acceso = false }) {
    const [open, setOpen] = useState(false);
    const timerRef = useRef(null);

    const handleEnter = () => { clearTimeout(timerRef.current); setOpen(true); };
    const handleLeave = () => { timerRef.current = setTimeout(() => setOpen(false), 120); };

    // Keyboard accessibility
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); }
        if (e.key === 'Escape') setOpen(false);
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <EnlaceMenu
                href={item.href}
                nuevaPestana={item.open_in_new_tab}
                className={acceso
                    ? `inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-xs font-bold transition-opacity ${open ? 'opacity-100' : 'hover:opacity-70'}`
                    : `inline-flex cursor-pointer items-center gap-1 whitespace-nowrap px-3 py-3 text-xs font-semibold tracking-wide transition-colors ${open ? 'opacity-100' : 'hover:opacity-70'}`}
                style={acceso ? { color: 'var(--ab-navy)' } : item.myskin ? { color: 'var(--ms-lime)' } : { color: 'var(--text-secondary)' }}
                onFocus={handleEnter}
                onBlur={handleLeave}
                onKeyDown={handleKeyDown}
                aria-expanded={open}
                aria-haspopup={!!item.items}
            >
                {item.Icon && <item.Icon className="h-3.5 w-3.5" />}
                {item.label}
                {item.items && <ChevronDown className={`h-3 w-3 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />}
            </EnlaceMenu>

            {item.items && open && (
                <div
                    className="absolute left-0 top-full z-50 min-w-[200px] rounded-xl border py-2 shadow-xl"
                    style={{ background: 'var(--surface-white)', borderColor: 'var(--border-light)' }}
                    onMouseEnter={handleEnter}
                    onMouseLeave={handleLeave}
                    role="menu"
                >
                    {item.items.map((sub) => (
                        <EnlaceMenu
                            key={sub.id ?? sub.href}
                            href={sub.href}
                            nuevaPestana={sub.open_in_new_tab}
                            className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
                            style={{ color: 'var(--text-primary)' }}
                            role="menuitem"
                            onClick={() => setOpen(false)}
                        >
                            {sub.label}
                        </EnlaceMenu>
                    ))}
                </div>
            )}
        </div>
    );
}

// Accesos rápidos fijos: van en la barra de categorías (escritorio) y como tarjetas en el menú del celular
const COMPARAR_HREF = '/comparar/iphone';
const COMPARAR_MAC_HREF = '/comparar/mac';
const COMPARAR_CARGADORES_HREF = '/comparar/cargadores';
const COMPARAR_VIDRIOS_HREF = '/comparar/vidrios';
const COMPARAR_APPLE_HREF = '/comparar/apple';
const ACCESOS_RAPIDOS = [
    { href: COMPARAR_HREF, label: 'Comparar iPhone', Icon: GitCompare },
    { href: COMPARAR_MAC_HREF, label: 'Comparar Mac', Icon: GitCompare },
    { href: COMPARAR_APPLE_HREF, label: 'Comparar productos Apple', Icon: GitCompare },
    { href: COMPARAR_CARGADORES_HREF, label: 'Comparar cargadores', Icon: GitCompare },
    { href: COMPARAR_VIDRIOS_HREF, label: 'Comparar vidrios', Icon: GitCompare },
    { href: '/trade-in', label: 'Trade-In', Icon: Exchange },
];
// En la barra de escritorio las comparativas van juntas en «Comparar», para que la barra entre en una sola línea
const ACCESOS_BARRA = [
    { href: COMPARAR_HREF, label: 'Comparar', Icon: GitCompare, items: [
        { label: 'Comparar iPhone', href: COMPARAR_HREF },
        { label: 'Comparar Mac', href: COMPARAR_MAC_HREF },
        { label: 'Comparar productos Apple', href: COMPARAR_APPLE_HREF },
        { label: 'Comparar cargadores', href: COMPARAR_CARGADORES_HREF },
        { label: 'Comparar vidrios templados', href: COMPARAR_VIDRIOS_HREF },
    ] },
    { href: '/trade-in', label: 'Trade-In', Icon: Exchange },
];

// ─── Header ──────────────────────────────────────────────────────────────────
function StoreHeader({ cart, cartOpen, setCartOpen, menuOpen, setMenuOpen }) {
    const { auth, navMenu, tienda } = usePage().props;
    const nombre  = nombreTienda(tienda);
    const anuncio = (tienda?.anuncio_barra ?? '').trim();
    const headerItems = (navMenu?.header?.length > 0) ? navMenu.header : MEGA_MENU_STATIC;
    const mobileItems = ((navMenu?.mobile?.length > 0) ? navMenu.mobile : MEGA_MENU_STATIC)
        .filter((item) => !ACCESOS_RAPIDOS.some((a) => a.href === item.href));
    const [searchOpen, setSearchOpen] = useState(false);

    const openSearch = () => setSearchOpen(true);
    const closeSearch = () => setSearchOpen(false);

    // El alto del header (cambia con el ancho de pantalla y con el menú del celular) queda en --alto-header para que
    // lo que va fijo debajo (barra de secciones del producto, galería) se ubique justo después y no quede tapado.
    const headerRef = useRef(null);
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return undefined;
        const medir = () => document.documentElement.style.setProperty('--alto-header', `${Math.round(el.getBoundingClientRect().height)}px`);
        medir();
        const observer = new ResizeObserver(medir);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Cmd+K / Ctrl+K global shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        // Fondo sólido, sin backdrop-blur: con el desenfoque, Chrome repinta el header en cada cuadro del scroll
        // (el logo está animado) y se ve un parpadeo blanco.
        <header
            ref={headerRef}
            data-header-tienda
            className="sticky top-0 z-40 border-b bg-white"
            style={{ borderColor: 'var(--border-light)' }}
        >
            {/* Barra de anuncio: el texto sale de Tienda online → Configuración. Vacía, la barra no se dibuja. */}
            {anuncio && (
                <div style={{ background: 'var(--ab-navy)' }}>
                    <StoreContainer className="truncate py-2 text-center text-[11px] font-semibold text-white sm:text-xs sm:tracking-wide">
                        {anuncio}
                    </StoreContainer>
                </div>
            )}

            {/* Main header: logo a la izquierda; búsqueda, cuenta, carrito y menú a la derecha */}
            <div>
                <StoreContainer className="flex h-[76px] items-center gap-3 sm:h-[100px]">
                    <Link
                        href="/"
                        className="flex shrink-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#585E9F]/35 focus-visible:ring-offset-2"
                        aria-label={`${nombre} — inicio`}
                    >
                        <img
                            src="/images/logo-appleboss.png"
                            alt={nombre}
                            className="store-brand-logo h-[58px] w-[58px] object-contain sm:h-20 sm:w-20"
                        />
                    </Link>

                    {/* Search trigger — desde tablet */}
                    <button
                        onClick={openSearch}
                        className="ml-4 hidden h-10 flex-1 items-center gap-3 rounded-full border px-4 text-sm md:flex"
                        style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)', background: 'var(--surface-muted)' }}
                        aria-label="Abrir búsqueda"
                    >
                        <Search className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">Buscar iPhone, Mac, fundas, accesorios...</span>
                        <kbd className="hidden shrink-0 rounded border px-1.5 text-[10px] font-mono lg:block" style={{ borderColor: 'var(--border-light)' }}>⌘K</kbd>
                    </button>

                    <div className="ml-auto flex items-center gap-1 md:ml-2">
                        {/* Acceder — escritorio */}
                        <Link
                            href={auth?.user ? '/dashboard' : '/login'}
                            className="mr-2 hidden text-sm font-semibold transition-opacity hover:opacity-70 lg:block"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {auth?.user ? 'Mi panel' : 'Acceder'}
                        </Link>

                        {/* Buscar — celular */}
                        <button
                            onClick={openSearch}
                            className="grid h-11 w-11 place-items-center rounded-full transition-colors active:bg-black/10 [@media(hover:hover)]:hover:bg-black/5 md:hidden"
                            aria-label="Buscar"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Search className="h-[22px] w-[22px]" />
                        </button>

                        {/* Carrito */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors active:bg-black/10 [@media(hover:hover)]:hover:bg-black/5"
                            aria-label={`Carrito, ${cart.length} productos`}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <ShoppingBag className="h-[22px] w-[22px]" />
                            {cart.length > 0 && (
                                <span
                                    className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold"
                                    style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                                >
                                    {cart.length}
                                </span>
                            )}
                        </button>

                        {/* Menú — celular y tablet, a la derecha */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="grid h-11 w-11 place-items-center rounded-full transition-colors active:bg-black/10 [@media(hover:hover)]:hover:bg-black/5 lg:hidden"
                            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                            aria-expanded={menuOpen}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </StoreContainer>
            </div>

            {/* Category mega menu — full width bg, container content */}
            <div className="hidden border-t lg:block" style={{ borderColor: 'var(--border-light)' }}>
                <StoreContainer className="flex items-center">
                    {headerItems.map((item) => (
                        <MegaMenuItem key={item.href} item={item} />
                    ))}
                    <div className="ml-auto flex items-center">
                        {ACCESOS_BARRA.map((acceso) => (
                            <Fragment key={acceso.href}>
                                {acceso.items ? <MegaMenuItem item={acceso} acceso /> : (
                                    <Link
                                        href={acceso.href}
                                        className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-xs font-bold transition-opacity hover:opacity-70"
                                        style={{ color: 'var(--ab-navy)' }}
                                    >
                                        <acceso.Icon className="h-3.5 w-3.5" /> {acceso.label}
                                    </Link>
                                )}
                                <span className="h-4 w-px" style={{ background: 'var(--border-light)' }} aria-hidden="true" />
                            </Fragment>
                        ))}
                        <Link
                            href="/catalogo"
                            className="inline-flex items-center gap-1 whitespace-nowrap py-3 pl-3 text-xs font-semibold transition-opacity hover:opacity-70"
                            style={{ color: 'var(--ab-periwinkle)' }}
                        >
                            Todo el catálogo
                        </Link>
                    </div>
                </StoreContainer>
            </div>

            {/* Menú del celular: categorías y, abajo, los accesos rápidos */}
            {menuOpen && (
                <nav
                    aria-label="Menú principal"
                    className="max-h-[calc(100dvh-110px)] overflow-y-auto border-t lg:hidden"
                    style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}
                >
                    <StoreContainer className="pb-5 pt-2">
                        <ul>
                            {mobileItems.map((item) => (
                                <li key={item.id ?? item.href} className="border-b last:border-b-0" style={{ borderColor: 'var(--border-light)' }}>
                                    <EnlaceMenu
                                        href={item.href}
                                        nuevaPestana={item.open_in_new_tab}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center justify-between py-3.5 text-[15px] font-semibold"
                                        style={item.myskin ? { color: 'var(--ms-lime)' } : { color: 'var(--text-primary)' }}
                                    >
                                        {item.label}
                                        <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                                    </EnlaceMenu>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {ACCESOS_RAPIDOS.map(({ href, label, Icon }, i) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-sm font-bold ${i === ACCESOS_RAPIDOS.length - 1 && ACCESOS_RAPIDOS.length % 2 ? 'col-span-2' : ''}`}
                                    style={{ background: 'var(--surface-muted)', color: 'var(--ab-navy)' }}
                                >
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    {label}
                                </Link>
                            ))}
                        </div>

                        <Link
                            href={auth?.user ? '/dashboard' : '/login'}
                            onClick={() => setMenuOpen(false)}
                            className="mt-4 block text-center text-sm font-semibold"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {auth?.user ? 'Ir a mi panel' : 'Acceder'}
                        </Link>
                    </StoreContainer>
                </nav>
            )}

            {/* Search overlay — rendered as portal-like fixed element */}
            <SearchOverlay open={searchOpen} onClose={closeSearch} />
        </header>
    );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ cart, remove, total, isOpen, onClose, syncing }) {
    const wa = useWhatsApp();
    const availableItems = cart.filter((i) => i.available !== false);
    const cartMsg = `${wa.saludo} quiero cotizar:\n\n${availableItems.map((item, i) => `${i + 1}. ${item.name} — ${money(item.price)}`).join('\n')}\n\nTotal referencial: ${money(total)}`;
    const waUrl = wa.enabled && wa.number ? wa.url(cartMsg) : null;

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
            )}
            <aside
                className={`fixed right-0 top-0 z-[60] flex h-full w-full max-w-sm flex-col shadow-2xl transition-transform sm:max-w-md ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ background: 'var(--surface-white)', transitionDuration: '280ms', transitionTimingFunction: 'cubic-bezier(.32,.72,0,1)' }}
                aria-hidden={!isOpen}
                aria-label="Carrito de compras"
            >
                <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: 'var(--border-light)' }}>
                    <div>
                        <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Tu selección</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{cart.length} {cart.length === 1 ? 'producto' : 'productos'}</p>
                    </div>
                    <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg" style={{ color: 'var(--text-secondary)' }} aria-label="Cerrar carrito">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {cart.length === 0 ? (
                        <div className="grid h-full place-content-center text-center">
                            <ShoppingBag className="mx-auto mb-4 h-10 w-10" style={{ color: 'var(--text-muted)' }} />
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Tu carrito está vacío</p>
                            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Agrega equipos para recibir una cotización.</p>
                            <Link href="/catalogo" onClick={onClose} className="mt-5 inline-block rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: 'var(--ab-navy)' }}>
                                Ver catálogo
                            </Link>
                        </div>
                    ) : (
                        cart.map((item) => {
                            const unavailable = item.available === false;
                            return (
                                <div key={item.key} className="flex gap-4 border-b py-4" style={{ borderColor: 'var(--border-light)', opacity: unavailable ? 0.5 : 1 }}>
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                                        <ProductVisual product={item} compact className="h-full w-full" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                        {item.condition && item.condition !== 'Nuevo' && (
                                            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{item.condition}</p>
                                        )}
                                        {unavailable ? (
                                            <p className="mt-1 text-xs font-bold text-red-600">Ya no disponible</p>
                                        ) : (
                                            <p className="mt-1.5 text-sm font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>{money(item.price)}</p>
                                        )}
                                    </div>
                                    <button onClick={() => remove(item.key)} className="self-start p-1.5 transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }} aria-label={`Quitar ${item.name ?? 'producto'}`}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="border-t p-6" style={{ borderColor: 'var(--border-light)' }}>
                        <div className="mb-4 flex justify-between">
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Total referencial</span>
                            <span className="text-lg font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>{money(total)}</span>
                        </div>
                        {/* Compra en línea: es la acción principal */}
                        <Link
                            href="/checkout"
                            onClick={onClose}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg"
                            style={{ background: 'var(--ab-navy)' }}
                        >
                            Finalizar compra <ChevronRight className="h-4 w-4" />
                        </Link>

                        {waUrl && (
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 flex h-11 w-full items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-90"
                                style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                            >
                                Prefiero consultar por WhatsApp
                            </a>
                        )}

                        {/* Confianza: en Bolivia la gente desconfía de comprar en línea */}
                        <ul className="mt-4 space-y-1.5 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
                            <li className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ab-navy)' }} />
                                Solo vendemos lo que tenemos en stock: al comprar, tu equipo queda apartado.
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ab-navy)' }} />
                                Pagas y recién ahí te mostramos el IMEI y la serie de tu equipo.
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ab-navy)' }} />
                                Sigues tu pedido paso a paso con tu código.
                            </li>
                        </ul>
                    </div>
                )}
            </aside>
        </>
    );
}

// ─── WhatsApp helpers ─────────────────────────────────────────────────────────
export function useWhatsApp() {
    const { tienda } = usePage().props;
    return {
        enabled: tienda?.whatsapp_enabled === true,
        // Con qué arranca cada mensaje que la tienda le arma al cliente: «Hola <nombre de la tienda>,»
        saludo:  saludoWhatsapp(tienda),
        number:  tienda?.whatsapp_numero ?? null,
        mensaje: tienda?.whatsapp_mensaje ?? '',
        url: (msg) => tienda?.whatsapp_numero
            ? `https://wa.me/${tienda.whatsapp_numero}?text=${encodeURIComponent(msg ?? tienda?.whatsapp_mensaje ?? '')}`
            : null,
    };
}

// ─── WhatsApp que flota ───────────────────────────────────────────────────────
// El botón vive en Components/Store/WhatsAppFlotante.jsx; acá solo se arma el enlace con lo de Configuración.
function WhatsAppDeLaTienda() {
    const wa = useWhatsApp();
    if (!wa.enabled || !wa.number) return null;

    return <WhatsAppFlotante url={wa.url(wa.mensaje)} />;
}

// ─── Newsletter bar ───────────────────────────────────────────────────────────
// Guarda el correo de verdad (POST /newsletter). Nunca confirma sin respuesta del backend.
function NewsletterBar() {
    const { tienda } = usePage().props; // textos editables en Admin → Marketing y SEO → Ajustes newsletter
    const [email, setEmail]     = useState('');
    const [website, setWebsite] = useState(''); // honeypot anti-bots
    const [status, setStatus]   = useState('idle'); // idle | sending | done | error
    const [error, setError]     = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || status === 'sending') return;
        setStatus('sending');
        setError('');
        try {
            await axios.post('/newsletter', { email: email.trim(), website });
            setStatus('done');
            setEmail('');
        } catch (err) {
            setStatus('error');
            setError(
                err.response?.status === 429
                    ? 'Demasiados intentos. Prueba de nuevo en un minuto.'
                    : (err.response?.data?.errors?.email?.[0] ?? 'No pudimos registrar tu correo. Inténtalo de nuevo.')
            );
        }
    };

    if (tienda?.newsletter_enabled === false) return null;

    return (
        <section aria-labelledby="newsletter-title" style={{ background: 'var(--ab-periwinkle)' }}>
            <StoreContainer className="py-12">
                <div className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
                    <div className="flex items-start gap-4">
                        <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl sm:grid" style={{ background: 'rgba(255,255,255,0.14)' }}>
                            <Mail className="h-6 w-6 text-white" />
                        </span>
                        <div>
                            <h2 id="newsletter-title" className="text-xl font-black leading-tight text-white sm:text-2xl">
                                {tienda?.newsletter_titulo || 'Ofertas exclusivas para suscriptores'}
                            </h2>
                            {(tienda?.newsletter_subtitulo ?? 'Novedades, precios especiales y lanzamientos. Sin spam.') && (
                                <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.82)' }}>
                                    {tienda?.newsletter_subtitulo ?? 'Novedades, precios especiales y lanzamientos. Sin spam.'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:max-w-[480px] md:justify-self-end">
                        {status === 'done' ? (
                            <div role="status" className="flex h-12 items-center gap-2.5 rounded-full px-5" style={{ background: 'rgba(255,255,255,0.16)' }}>
                                <Check className="h-5 w-5 text-white" strokeWidth={2} />
                                <span className="text-sm font-bold text-white">¡Listo! Ya estás suscrito.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
                                <label htmlFor="newsletter-email" className="sr-only">Correo electrónico</label>
                                <input
                                    id="newsletter-email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@correo.com"
                                    className="h-12 min-w-0 flex-1 rounded-full border-0 bg-white px-5 text-sm font-medium outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[var(--ab-lime)]"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                                <input
                                    type="text"
                                    name="website"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="hidden"
                                    aria-hidden="true"
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'sending'}
                                    className="h-12 shrink-0 rounded-full px-7 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                                    style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                                >
                                    {status === 'sending' ? 'Enviando…' : (tienda?.newsletter_boton || 'Suscribirme')}
                                </button>
                            </form>
                        )}
                        {error && <p role="alert" className="mt-2 pl-5 text-xs font-semibold text-white">{error}</p>}
                    </div>
                </div>
            </StoreContainer>
        </section>
    );
}

// ─── Footer real ──────────────────────────────────────────────────────────────
function StoreFooter() {
    const wa = useWhatsApp();
    const { tienda, navMenu, paginas } = usePage().props;
    const nombre = nombreTienda(tienda);

    // Group footer items by group label
    const footerGroups = useMemo(() => {
        const items = navMenu?.footer ?? [];
        if (!items.length) return null; // use static fallback
        const map = new Map();
        items.forEach(item => {
            const g = item.group || 'Otros';
            if (!map.has(g)) map.set(g, []);
            map.get(g).push(item);
        });
        return Array.from(map.entries()).map(([group, links]) => ({ group, links }));
    }, [navMenu?.footer]);

    // Páginas informativas (Nosotros, Garantía…): aparecen solas, salvo las que ya estén en el menú del pie
    const infoLinks = useMemo(() => {
        const enMenu = new Set((navMenu?.footer ?? []).map(i => i.href));
        return (paginas ?? []).filter(p => !enMenu.has(p.href));
    }, [paginas, navMenu?.footer]);
    const columnas = (footerGroups ? footerGroups.length : 3) + (infoLinks.length ? 1 : 0);
    const gridCols = {
        2: 'md:grid-cols-[2fr_1fr_1fr]',
        3: 'md:grid-cols-[2fr_1fr_1fr_1fr]',
        4: 'md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]',
        5: 'md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr]',
    }[columnas] ?? 'md:grid-cols-3 lg:grid-cols-4';
    const year = new Date().getFullYear();
    const ciudad  = tienda?.tienda_ciudad  ?? 'Cochabamba';
    const pais    = tienda?.tienda_pais    ?? 'Bolivia';
    // La dirección del local principal (Tienda online → Ubicaciones), con la ciudad si no la trae
    const direccion = (tienda?.tienda_direccion ?? '').trim();
    const lugar = !direccion
        ? `${ciudad}, ${pais}`
        : direccion.toLowerCase().includes(ciudad.toLowerCase()) ? direccion : `${direccion}, ${ciudad}`;
    const tagline = tienda?.footer_tagline ?? 'Tecnología seleccionada con criterio. Precios claros. Personas reales para ayudarte a elegir.';

    return (
        <footer style={{ background: 'var(--ab-navy)' }}>
            {/* Main footer grid */}
            <StoreContainer className="py-14">
                <div className={`grid gap-10 ${gridCols}`}>
                    {/* Brand column */}
                    <div>
                        <div className="flex items-center gap-3">
                            <img src="/images/logo-appleboss.png" alt={nombre} className="h-12 w-12 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
                            <span className="text-2xl font-black tracking-tight text-white">{nombre}</span>
                        </div>
                        <p className="mt-4 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.82)', maxWidth: '26ch' }}>
                            {tagline}
                        </p>
                        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}>
                            {pais} · {ciudad}
                        </span>

                        {/* Contact */}
                        <div className="mt-6 space-y-2">
                            {wa.enabled && wa.number && (
                            <a
                                href={`https://wa.me/${wa.number}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
                                style={{ color: 'rgba(255,255,255,0.88)' }}
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.955-1.418A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.073-1.114l-.292-.173-3.022.865.88-2.952-.19-.303A7.96 7.96 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" />
                                </svg>
                                WhatsApp
                            </a>
                            )}
                            {tienda?.tienda_mapa ? (
                                <a href={tienda.tienda_mapa} target="_blank" rel="noreferrer" className="block text-sm transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                    {lugar}
                                </a>
                            ) : (
                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                    {lugar}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer columns from DB or static fallback */}
                    {footerGroups ? footerGroups.map(({ group, links }) => (
                        <div key={group}>
                            <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,1)' }}>{group}</p>
                            {links.map(item => (
                                <EnlaceMenu
                                    key={item.id}
                                    href={item.href}
                                    nuevaPestana={item.open_in_new_tab}
                                    className="mt-3 block text-sm transition-opacity hover:opacity-80"
                                    style={{ color: item.myskin ? 'var(--ms-lime)' : 'rgba(255,255,255,0.88)' }}
                                >
                                    {item.label}
                                </EnlaceMenu>
                            ))}
                        </div>
                    )) : (
                        <>
                            {/* Comprar */}
                            <div>
                                <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,1)' }}>Comprar</p>
                                {[['iPhone','/iphone'],['Mac','/mac'],['Fundas MYSKIN','/myskin'],['Accesorios','/catalogo?categoria=accesorios'],['Seminuevos','/seminuevos'],['Trade-In','/trade-in'],['Comparar iPhone', COMPARAR_HREF],['Comparar Mac', COMPARAR_MAC_HREF],['Comparar productos Apple', COMPARAR_APPLE_HREF],['Comparar cargadores', COMPARAR_CARGADORES_HREF],['Comparar vidrios', COMPARAR_VIDRIOS_HREF],['Todo el catálogo','/catalogo']].map(([label,href]) => (
                                    <Link key={href} href={href} className="mt-3 block text-sm transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.88)' }}>{label}</Link>
                                ))}
                            </div>
                            {/* Ayuda */}
                            <div>
                                <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,1)' }}>Ayuda</p>
                                {[['Cómo comprar','/catalogo'],['Contacto','/#contacto'],['Preguntas frecuentes','/#faq']].map(([label,href]) => (
                                    <Link key={href} href={href} className="mt-3 block text-sm transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.88)' }}>{label}</Link>
                                ))}
                            </div>
                            {/* La tienda */}
                            <div>
                                <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,1)' }}>{nombre}</p>
                                {[['Nuestra tienda','/'],['Acceder','/login']].map(([label,href]) => (
                                    <Link key={href} href={href} className="mt-3 block text-sm transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.88)' }}>{label}</Link>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Información: páginas del admin (Sitio web → Páginas) */}
                    {infoLinks.length > 0 && (
                        <div>
                            <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,1)' }}>Información</p>
                            {infoLinks.map(p => (
                                <Link key={p.href} href={p.href} className="mt-3 block text-sm transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.88)' }}>{p.title}</Link>
                            ))}
                        </div>
                    )}
                </div>
            </StoreContainer>

            {/* Subfooter. `data-tope-flotante`: hasta acá baja el botón de WhatsApp, nunca sobre el copyright. */}
            <div data-tope-flotante style={{ borderTop: '1px solid rgba(255,255,255,0.14)' }}>
                {/* StoreContainer no acepta style: el color va por clase para que el copyright se lea en blanco */}
                <StoreContainer className="flex flex-wrap items-center justify-between gap-3 py-5 text-xs font-medium text-white">
                    <span>© {year} {nombre} · {pais}</span>
                    <span>Equipos revisados · Precios reales · Atención personalizada</span>
                </StoreContainer>
            </div>
        </footer>
    );
}

// ─── Layout principal ─────────────────────────────────────────────────────────
const CART_KEY = 'appleboss-cart-v2';
function loadStored() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}

export default function StoreLayout({ children }) {
    const [stored, setStored]   = useState([]);
    const [hydrated, setHydrated] = useState([]);
    const [syncing, setSyncing] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => { setStored(loadStored()); setReady(true); }, []);
    useEffect(() => { if (ready) localStorage.setItem(CART_KEY, JSON.stringify(stored)); }, [stored, ready]);

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
                setStored((prev) => prev.filter((s) => (data.items ?? []).some((h) => h.key === s.key)));
            })
            .catch(() => {})
            .finally(() => setSyncing(false));
    }, [ready, cartOpen]);

    const add = useCallback((product) => {
        setStored((cur) => cur.some((i) => i.key === product.key) ? cur : [...cur, { key: product.key, quantity: 1 }]);
        setHydrated((cur) => cur.some((i) => i.key === product.key) ? cur : [...cur, { key: product.key, quantity: 1, name: product.name, price: product.price, type: product.type, condition: product.condition ?? null, images: product.images ?? [], available: true }]);
        setCartOpen(true);
    }, []);

    const remove = useCallback((key) => {
        setStored((cur) => cur.filter((i) => i.key !== key));
        setHydrated((cur) => cur.filter((i) => i.key !== key));
    }, []);

    // Se usa al terminar la compra: el pedido ya quedó guardado en el servidor
    const clear = useCallback(() => {
        setStored([]);
        setHydrated([]);
        try { localStorage.removeItem(CART_KEY); } catch { /* sin almacenamiento */ }
    }, []);

    const total = useMemo(
        () => hydrated.filter((i) => i.available !== false).reduce((sum, i) => sum + Number(i.price ?? 0) * (i.quantity ?? 1), 0),
        [hydrated]
    );

    const cart = hydrated;

    useEffect(() => {
        document.body.style.overflow = cartOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [cartOpen]);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') { setCartOpen(false); setMenuOpen(false); } };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <CartContext.Provider value={{ cart, add, remove, total, open: () => setCartOpen(true), clear, syncing }}>
            <CompareProvider>
                {/* Las fuentes (Figtree y Barlow) se cargan una sola vez en app.blade.php: si el link viviera acá,
                    se quitaría y volvería a poner en cada cambio de página y el texto parpadearía. */}
                <div className="min-h-screen font-sans antialiased" style={{ background: 'var(--surface-page)', color: 'var(--text-primary)' }}>
                    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:shadow-lg">
                        Saltar al contenido
                    </a>

                    <SeoHead />

                    <StoreHeader cart={cart} cartOpen={cartOpen} setCartOpen={setCartOpen} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

                    <main id="main-content">
                        {children}
                    </main>

                    <NewsletterBar />
                    <StoreFooter />

                    <CartDrawer cart={cart} remove={remove} total={total} isOpen={cartOpen} onClose={() => setCartOpen(false)} syncing={syncing} />

                    <WhatsAppDeLaTienda />

                    <CompareBar />
                </div>
            </CompareProvider>
        </CartContext.Provider>
    );
}
