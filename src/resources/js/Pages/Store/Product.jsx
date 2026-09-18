import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ArrowRight, BadgeCheck, Battery, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Cpu, DeliveryTruck, Factory,
    GitCompare, HardDrive, Layers, Link as Enlace, MapPin, Memory, MessageCircle, Package, Palette, ScreenSize, SecureBox, ShieldCheck,
    ShoppingBag, Signal, SmartHome, Smartphone, Speaker, Store, StorePickup, Truck, UsbC, Voice, X, Zap, ZoomIn,
} from '@/Components/Store/Icons';
import StoreLayout, { StoreContainer, useStoreCart, useWhatsApp } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';
import ProductVisual from '@/Components/Store/ProductVisual';
import { BateriaNivel, FichaTecnica, porcentajeBateria, valorCorto, valorDe } from '@/Components/Store/fichaTecnica';
import { useNombreTienda } from '@/Components/Store/tienda';

const money = (v) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v);

// ─── Galería PDP ────────────────────────────────────────────────────────────
// Marco blanco: las fotos de producto suelen tener fondo blanco y así no queda una franja dentro de un recuadro gris.
// Desde tablet, el marco ocupa todo el alto de la caja de compra (las miniaturas van al costado): así los botones de
// compra quedan siempre alineados con el final de la foto.
function PdpGallery({ product, className = '' }) {
    const nombreDeLaTienda = useNombreTienda();
    const images = product.images ?? [];
    const principalIdx = Math.max(images.findIndex((i) => i.es_principal), 0);
    const [active, setActive] = useState(principalIdx);
    const [lightbox, setLightbox] = useState(false);
    const [fondo, setFondo] = useState('#FFFFFF');
    const touchStart = useRef(null);

    // El marco toma el color de la esquina de la foto: si su fondo no es blanco puro (por ejemplo #F7F7F7), no se
    // nota el recuadro de la foto dentro del marco. Las fotos se sirven desde el mismo sitio, así que se pueden leer.
    const ajustarFondo = (e) => {
        try {
            const lienzo = document.createElement('canvas');
            lienzo.width = 8;
            lienzo.height = 8;
            const ctx = lienzo.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(e.currentTarget, 0, 0, 8, 8);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            setFondo(a > 250 && r > 200 && g > 200 && b > 200 ? `rgb(${r}, ${g}, ${b})` : '#FFFFFF');
        } catch {
            setFondo('#FFFFFF');
        }
    };

    const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length]);

    // Keyboard: flechas + Escape
    useEffect(() => {
        if (!lightbox) return;
        const handler = (e) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape') setLightbox(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightbox, prev, next]);

    // Touch swipe en galería y lightbox
    const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
        touchStart.current = null;
    };

    const current = images[active];
    const src = current?.url_detail ?? current?.url_medium ?? current?.url_card;
    const alt = current?.alt || product.name || nombreDeLaTienda;
    const varias = images.length > 1;

    if (images.length === 0) {
        return (
            <div className={`flex ${className}`}>
                <ProductVisual product={product} className="aspect-square w-full rounded-3xl md:aspect-auto md:min-h-[30rem]" />
            </div>
        );
    }

    const flecha = 'absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 transition-opacity md:grid md:opacity-0 md:group-hover:opacity-100';

    return (
        <>
            <div className={`flex flex-col gap-3 md:flex-row md:gap-4 ${className}`}>
                {/* Imagen principal */}
                <div
                    className="group relative order-1 aspect-square w-full cursor-zoom-in overflow-hidden rounded-3xl border transition-colors duration-300 md:order-2 md:aspect-auto md:min-h-[30rem] md:flex-1"
                    style={{ borderColor: 'var(--border-light)', background: fondo }}
                    onClick={() => setLightbox(true)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <img
                        src={src}
                        alt={alt}
                        className="absolute inset-0 h-full w-full object-contain p-[6%]"
                        loading="eager"
                        fetchpriority="high"
                        decoding="sync"
                        onLoad={ajustarFondo}
                    />

                    {varias && (
                        <>
                            <button type="button" className={`${flecha} left-3`} aria-label="Foto anterior"
                                onClick={(e) => { e.stopPropagation(); prev(); }} style={{ color: 'var(--text-primary)' }}>
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button type="button" className={`${flecha} right-3`} aria-label="Foto siguiente"
                                onClick={(e) => { e.stopPropagation(); next(); }} style={{ color: 'var(--text-primary)' }}>
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            <span className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums text-white" style={{ background: 'rgba(1,20,70,0.72)' }}>
                                {active + 1} / {images.length}
                            </span>
                        </>
                    )}
                    <button
                        type="button"
                        className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5"
                        onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
                        aria-label="Ampliar foto"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <ZoomIn className="h-[18px] w-[18px]" />
                    </button>
                </div>

                {/* Miniaturas: debajo en celular, en columna al costado desde tablet (sin estirar el alto de la galería) */}
                {varias && (
                    <div className="order-2 flex gap-2 overflow-x-auto pb-1 md:order-1 md:h-0 md:min-h-full md:w-[72px] md:shrink-0 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:pb-0"
                        style={{ scrollbarWidth: 'none' }}>
                        {images.map((img, idx) => (
                            <button
                                key={img.id ?? idx}
                                type="button"
                                onClick={() => setActive(idx)}
                                className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition-colors"
                                style={{ borderColor: idx === active ? 'var(--ab-navy)' : 'var(--border-light)' }}
                                aria-label={`Foto ${idx + 1}`}
                                aria-current={idx === active}
                            >
                                <img
                                    src={img.url_thumb ?? img.url_card}
                                    alt=""
                                    className="h-full w-full object-contain p-1.5"
                                    loading="lazy"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.92)' }}
                    onClick={() => setLightbox(false)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Fotos de ${product.name}`}
                >
                    <button
                        type="button"
                        className="absolute right-4 top-4 rounded-full p-2 text-white opacity-70 hover:opacity-100"
                        onClick={() => setLightbox(false)}
                        aria-label="Cerrar"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {varias && (
                        <button
                            type="button"
                            className="absolute left-4 rounded-full p-3 text-white opacity-70 hover:opacity-100"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            aria-label="Foto anterior"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}

                    <img
                        src={src}
                        alt={alt}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {varias && (
                        <button
                            type="button"
                            className="absolute right-4 rounded-full p-3 text-white opacity-70 hover:opacity-100"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            aria-label="Foto siguiente"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    )}

                    {varias && (
                        <div className="absolute bottom-6 flex gap-2">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setActive(idx); }}
                                    className="h-2 rounded-full transition-all"
                                    style={{
                                        width: idx === active ? '24px' : '8px',
                                        background: idx === active ? '#fff' : 'rgba(255,255,255,0.4)',
                                    }}
                                    aria-label={`Ir a la foto ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

// ─── JSON-LD — NUNCA expone IMEI, costo, proveedor ────────────────────────
function ProductJsonLd({ product }) {
    const nombre = useNombreTienda();
    const primaryImage = product.images?.find((i) => i.es_principal) ?? product.images?.[0];
    const conditionMap = {
        'Nuevo':           'https://schema.org/NewCondition',
        'Seminuevo':       'https://schema.org/UsedCondition',
        'Open Box':        'https://schema.org/OpenBoxCondition',
        'Reacondicionado': 'https://schema.org/RefurbishedCondition',
    };
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.summary,
        ...(primaryImage ? { image: primaryImage.url_detail ?? primaryImage.url_medium ?? primaryImage.url_card } : {}),
        brand: { '@type': 'Brand', name: product.is_myskin ? 'MYSKIN' : nombre },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'BOB',
            price: product.promo_price ?? product.price,
            availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: typeof window !== 'undefined' ? window.location.href : '',
            ...(product.condition ? { itemCondition: conditionMap[product.condition] } : {}),
            ...(product.numero_serie ? { serialNumber: product.numero_serie } : {}),
        },
    };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

// ─── Sticky nav (desktop) ──────────────────────────────────────────────────
function PdpNav({ sections, activeId }) {
    return (
        <nav
            className="sticky z-30 hidden border-b md:block"
            style={{ top: 'var(--alto-header, 0px)', background: 'var(--surface-white)', borderColor: 'var(--border-light)' }}
        >
            <StoreContainer className="flex gap-1 overflow-x-auto">
                {sections.map(({ id, label }) => (
                    <a
                        key={id}
                        href={`#${id}`}
                        className="shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
                        style={{
                            borderColor: activeId === id ? 'var(--ab-navy)' : 'transparent',
                            color: activeId === id ? 'var(--ab-navy)' : 'var(--text-muted)',
                        }}
                    >
                        {label}
                    </a>
                ))}
            </StoreContainer>
        </nav>
    );
}

// ─── Sección wrapper ───────────────────────────────────────────────────────
function PdpSection({ id, title, children }) {
    return (
        <section id={id} className="py-12 border-t" style={{ borderColor: 'var(--border-light)', scrollMarginTop: 'calc(var(--alto-header, 0px) + 64px)' }}>
            <h2 className="mb-6 text-[1.1rem] font-black" style={{ color: 'var(--text-primary)' }}>
                {title}
            </h2>
            {children}
        </section>
    );
}

// ─── FAQ accordion ─────────────────────────────────────────────────────────
// Las preguntas se cargan en el panel: Tienda online → Preguntas frecuentes, «En la ficha de los productos».

function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
            >
                {q}
                {open
                    ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                }
            </button>
            {open && (
                <p className="pb-4 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {a}
                </p>
            )}
        </div>
    );
}

// ─── Cross-sell MYSKIN ─────────────────────────────────────────────────────
function MyskinCrossSell({ crossSell }) {
    const { add } = useStoreCart();
    if (!crossSell?.length) return null;
    return (
        <section
            className="mt-20 rounded-2xl p-8"
            style={{ background: '#0C1B47' }}
        >
            <div className="mb-6">
                <span className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: '#A3BD31' }}>
                    Complemento perfecto
                </span>
                <h2 className="mt-1 text-xl font-black" style={{ color: '#FFFFFF' }}>
                    Fundas MYSKIN para tu iPhone
                </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {crossSell.map((p) => <ProductCard key={p.key} product={p} onAdd={add} />)}
            </div>
        </section>
    );
}

// ─── Grid de relacionados ──────────────────────────────────────────────────
function RelatedGrid({ related }) {
    const { add } = useStoreCart();
    if (!related?.length) return null;
    return (
        <section className="mt-20">
            <h2 className="mb-6 text-[1.3rem] font-black" style={{ color: 'var(--text-primary)' }}>
                También disponibles
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {related.map((p) => <ProductCard key={p.key} product={p} onAdd={add} />)}
            </div>
        </section>
    );
}


// ─── Caja de compra ────────────────────────────────────────────────────────
// Datos clave junto al botón de compra: los primeros que tenga la ficha del producto (celular, Mac o accesorio).
const DESTACADOS = [
    { key: 'capacidad', label: 'Capacidad', Icon: HardDrive },
    { key: 'almacenamiento', label: 'Almacenamiento', Icon: HardDrive },
    { key: 'ram', label: 'Memoria', Icon: Memory },
    { key: 'chip', label: 'Chip', Icon: Cpu },
    { key: 'tamano_pantalla', label: 'Pantalla', Icon: ScreenSize },
    { key: 'color', label: 'Color', Icon: Palette },
    { key: 'modelo_compatible', label: 'Compatible con', Icon: Smartphone },
    { key: 'material', label: 'Material', Icon: Layers },
    // Accesorios sin modelo de iPhone ni material: cargadores, cables, Alexa, controles…
    { key: 'potencia', label: 'Potencia', Icon: Zap },
    { key: 'puerto', label: 'Conector', Icon: UsbC },
    { key: 'proteccion', label: 'Protección', Icon: ShieldCheck },
    { key: 'audio', label: 'Sonido', Icon: Speaker },
    { key: 'asistente', label: 'Asistente de voz', Icon: Voice },
    { key: 'casa_inteligente', label: 'Casa inteligente', Icon: SmartHome },
    { key: 'conectividad', label: 'Conexión', Icon: Signal },
    { key: 'compatibilidad', label: 'Funciona con', Icon: Enlace },
    { key: 'fabricante', label: 'Fabricante', Icon: Factory },
];

const CONDICION_ESTILO = {
    Nuevo: { background: 'var(--ab-navy)', color: '#FFFFFF' },
    Seminuevo: { background: 'rgba(88,94,159,0.14)', color: 'var(--ab-deep-violet)' },
    'Open Box': { background: 'rgba(198,203,54,0.24)', color: '#3A3F00' },
    Reacondicionado: { background: 'rgba(88,94,159,0.14)', color: 'var(--ab-deep-violet)' },
};

function DatoClave({ Icon, label, children }) {
    return (
        <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border bg-white p-2.5 sm:gap-3 sm:p-3" style={{ borderColor: 'var(--border-light)' }}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10" style={{ background: 'rgba(88,94,159,0.10)', color: 'var(--ab-periwinkle)' }}>
                <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase leading-tight tracking-wider sm:text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</dt>
                <dd className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{children}</dd>
            </div>
        </div>
    );
}

function DatosClave({ atributos = {} }) {
    const bateria = valorDe('salud_bateria', atributos);
    const pct = porcentajeBateria(atributos);
    const datos = DESTACADOS.filter((d) => valorDe(d.key, atributos)).slice(0, bateria ? 3 : 4);
    if (!datos.length && !bateria) return null;

    return (
        <dl className="grid grid-cols-2 gap-2 sm:gap-2.5" aria-label="Datos clave">
            {datos.map(({ key, label, Icon }) => (
                <DatoClave key={key} Icon={Icon} label={label}>{valorCorto(key, atributos)}</DatoClave>
            ))}
            {bateria && (
                <DatoClave Icon={Battery} label="Salud de batería">
                    <span className="inline-flex items-center gap-2">
                        {bateria}
                        {pct && !atributos.bateria_sellada && <BateriaNivel porcentaje={pct} className="h-4 w-8" />}
                    </span>
                </DatoClave>
            )}
        </dl>
    );
}

function CompraConfianza({ product, ciudad }) {
    const items = [
        [BadgeCheck, 'Equipo revisado'],
        [Store, 'Stock confirmado'],
        [MessageCircle, 'Atención directa'],
        ...(product.garantia ? [[ShieldCheck, product.garantia]] : []),
        [MapPin, `Recojo en ${ciudad} sin costo`],
        [Truck, 'Envío a otras ciudades por consultar'],
    ];

    return (
        <ul className="grid content-center gap-x-6 gap-y-3.5 rounded-3xl p-5 sm:grid-cols-2 lg:grid-cols-3" style={{ background: 'var(--surface-muted)' }}>
            {items.map(([Icon, label]) => (
                <li key={label} className="flex min-w-0 items-center gap-2.5 text-[13px] font-semibold leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} style={{ color: 'var(--ab-periwinkle)' }} />
                    <span className="min-w-0">{label}</span>
                </li>
            ))}
        </ul>
    );
}

// ─── PDP inner (inside CartContext) ────────────────────────────────────────
function ProductInner({ product, related, crossSell, faqs = [] }) {
    const { add } = useStoreCart();
    const wa = useWhatsApp();
    const { tienda } = usePage().props;
    const [activeSection, setActiveSection] = useState('descripcion');
    const [showBuyBar, setShowBuyBar] = useState(false);
    const heroRef = useRef(null);

    useEffect(() => {
        const el = heroRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setShowBuyBar(!entry.isIntersecting),
            { rootMargin: '-80px 0px 0px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const waProductUrl = wa.enabled && wa.number ? wa.url(`${wa.saludo} quiero consultar por ${product.name} — ${money(product.promo_price ?? product.price)}`) : null;
    const waUnavailableUrl = wa.enabled && wa.number ? wa.url(`${wa.saludo} el ${product.name} ya no está disponible. ¿Tienen algo similar?`) : null;

    const compatibilidades = product.compatibilidades ?? {};
    const hasCompat = Object.keys(compatibilidades).length > 0;
    const hasSpecs = Object.keys(product.atributos ?? {}).length > 0 || Boolean(product.numero_serie);

    // Construir secciones dinámicas
    const sections = [
        { id: 'descripcion',      label: 'Descripción',       show: true },
        { id: 'especificaciones', label: 'Especificaciones',   show: hasSpecs },
        { id: 'compatibilidad',   label: 'Compatibilidad',     show: hasCompat },
        { id: 'condicion',        label: 'Condición',          show: product.condition && product.condition !== 'Nuevo' },
        { id: 'incluye',          label: '¿Qué incluye?',      show: !!product.que_incluye },
        { id: 'garantia',         label: 'Garantía',           show: !!product.garantia },
        { id: 'entrega',          label: 'Entrega',            show: true },
        { id: 'faq',              label: 'Preguntas',          show: faqs.length > 0 },
    ].filter((s) => s.show);

    // Observer para activar sección en nav
    useEffect(() => {
        const ids = sections.map((s) => s.id);
        const observers = ids.map((id) => {
            const el = document.getElementById(id);
            if (!el) return null;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
                { rootMargin: '-30% 0px -60% 0px' }
            );
            obs.observe(el);
            return obs;
        }).filter(Boolean);
        return () => observers.forEach((obs) => obs.disconnect());
    }, []);

    return (
        <>
            <ProductJsonLd product={product} />

            {/* Sticky buy bar (mobile) */}
            {showBuyBar && product.available && (
                <div
                    data-tope-flotante
                    className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 border-t px-4 py-3 md:hidden"
                    style={{ background: 'var(--surface-white)', borderColor: 'var(--border-light)' }}
                >
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
                            {product.name}
                        </p>
                        <p className="text-sm font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                            {money(product.promo_price ?? product.price)}
                        </p>
                    </div>
                    <button
                        onClick={() => add(product)}
                        className="flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-bold"
                        style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Agregar
                    </button>
                </div>
            )}

            <StoreContainer>
                {/* Ruta */}
                <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 py-5 text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    <Link href="/catalogo" className="shrink-0 transition-opacity hover:opacity-70">Catálogo</Link>
                    {product.category && product.category_label && (
                        <>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                            <Link href={`/catalogo?categoria=${encodeURIComponent(product.category)}`} className="shrink-0 transition-opacity hover:opacity-70">
                                {product.category_label}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }} aria-current="page">{product.name}</span>
                </nav>

                {/* Hero: galería y caja de compra del mismo alto; los botones cierran la caja a la altura del final de la foto */}
                <section ref={heroRef} className="grid gap-8 pb-8 md:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] md:items-stretch md:gap-10 lg:gap-14">
                    <div className="flex min-w-0 flex-col">
                        <PdpGallery product={product} className="md:flex-1" />
                    </div>

                    <div className="flex min-w-0 flex-col">
                        {/* Condición (siempre explícita) y disponibilidad */}
                        <div className="flex flex-wrap items-center gap-2">
                            {product.condition && (
                                <span className="rounded-full px-3 py-1 text-xs font-bold" style={CONDICION_ESTILO[product.condition] ?? CONDICION_ESTILO.Seminuevo}>
                                    {product.condition}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                                style={product.available
                                    ? { background: 'rgba(46,139,46,0.10)', color: '#1A6B1A' }
                                    : { background: 'rgba(40,34,79,0.08)', color: 'var(--ab-deep-violet)' }}>
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: product.available ? '#2E8B2E' : 'var(--ab-deep-violet)' }} aria-hidden="true" />
                                {product.available ? 'Disponible' : 'No disponible'}
                            </span>
                            {(product.marca ?? product.category_label) && (
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{product.marca ?? product.category_label}</span>
                            )}
                        </div>

                        {/* Nombre */}
                        <h1
                            className="mt-4 text-balance text-[clamp(1.875rem,3.2vw,2.75rem)] font-black leading-[1.05] tracking-[-0.035em]"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {product.name}
                        </h1>
                        {product.subtitulo && (
                            <p className="mt-2 text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {product.subtitulo}
                            </p>
                        )}

                        {/* Precio (del inventario, calculado en el servidor) */}
                        <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
                            <p className="text-[2.25rem] font-black leading-none tracking-tight tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                                {money(product.promo_price ?? product.price)}
                            </p>
                            {product.promo_price && (
                                <>
                                    <p className="pb-0.5 text-lg font-semibold tabular-nums line-through" style={{ color: 'var(--text-muted)' }}>
                                        {money(product.price)}
                                    </p>
                                    <span className="mb-1 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(46,139,46,0.10)', color: '#1A6B1A' }}>
                                        Ahorras {money(product.price - product.promo_price)}
                                    </span>
                                </>
                            )}
                            {product.promo_badge && (
                                <span className="mb-1 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}>
                                    {product.promo_badge}
                                </span>
                            )}
                        </div>

                        {/* Resumen */}
                        {product.summary && (
                            <p className="mt-4 max-w-[56ch] text-[0.9375rem] leading-[1.65]" style={{ color: 'var(--text-secondary)' }}>
                                {product.summary}
                            </p>
                        )}

                        {/* Datos clave */}
                        <div className="mt-6">
                            <DatosClave atributos={product.atributos ?? {}} />
                        </div>

                        {/* Compra: al final de la caja, alineada con el final de la foto */}
                        {product.available ? (
                            <div className="grid gap-3 pt-6 sm:grid-cols-2 md:mt-auto md:grid-cols-1 xl:grid-cols-2">
                                <button type="button" onClick={() => add(product)}
                                    className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full px-5 py-3 text-center text-[15px] font-bold transition-[transform,opacity] duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#585E9F]/40 focus-visible:ring-offset-2"
                                    style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}>
                                    <ShoppingBag className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                                    <span>Agregar al carrito</span>
                                </button>
                                {waProductUrl && (
                                    <a href={waProductUrl}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full border bg-white px-5 py-3 text-center text-[15px] font-bold transition-[transform,background-color,border-color] duration-200 hover:bg-black/[0.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#585E9F]/40 focus-visible:ring-offset-2"
                                        style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                                        <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                                        <span>Consultar por WhatsApp</span>
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3 pt-6 md:mt-auto">
                                <div className="rounded-2xl p-4" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-light)' }}>
                                    <p className="text-sm font-bold" style={{ color: 'var(--ab-deep-violet)' }}>
                                        Este equipo no está disponible actualmente
                                    </p>
                                    <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                                        Puede que tengamos un modelo similar. Escríbenos por WhatsApp.
                                    </p>
                                </div>
                                {waUnavailableUrl && (
                                    <a href={waUnavailableUrl}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold transition-opacity hover:opacity-90"
                                        style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}>
                                        <MessageCircle className="h-5 w-5" /> Consultar alternativas
                                    </a>
                                )}
                            </div>
                        )}

                    </div>
                </section>

                {/* Compra con confianza y comparar, a lo ancho debajo del hero */}
                <section aria-label="Compra con confianza" className="grid gap-4 pb-14 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
                    <CompraConfianza product={product} ciudad={tienda?.tienda_ciudad ?? 'Cochabamba'} />
                    {product.comparar_modelo && (
                        <Link href={product.comparar_modelo.url}
                            className="group flex items-center justify-between gap-4 rounded-3xl border bg-white p-5 transition-colors hover:border-[color:var(--ab-navy)]"
                            style={{ borderColor: 'var(--border-light)' }}>
                            <span className="flex min-w-0 items-center gap-3.5">
                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: 'rgba(88,94,159,0.10)', color: 'var(--ab-periwinkle)' }}>
                                    <GitCompare className="h-5 w-5" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{product.comparar_modelo.titulo}</span>
                                    <span className="mt-0.5 block text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                                        {product.comparar_modelo.texto}
                                    </span>
                                </span>
                            </span>
                            <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--ab-navy)' }} />
                        </Link>
                    )}
                </section>
            </StoreContainer>

            {/* Sticky nav */}
            <PdpNav sections={sections} activeId={activeSection} />

            {/* Secciones de contenido */}
            <StoreContainer>

                {/* Descripción */}
                <PdpSection id="descripcion" title="Descripción">
                    {product.description ? (
                        <div
                            className="prose prose-sm max-w-3xl"
                            style={{ color: 'var(--text-secondary)' }}
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    ) : (
                        <p className="max-w-3xl text-[0.9375rem] leading-[1.75]"
                            style={{ color: 'var(--text-secondary)' }}>
                            {product.summary}
                            {product.observaciones && (
                                <> {product.observaciones}</>
                            )}
                        </p>
                    )}
                    {product.observaciones && product.description && (
                        <p className="mt-4 rounded-xl p-4 text-sm"
                            style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                            {product.observaciones}
                        </p>
                    )}
                </PdpSection>

                {/* Especificaciones */}
                {hasSpecs && (
                    <PdpSection id="especificaciones" title="Especificaciones técnicas">
                        <FichaTecnica tipo={product.type} atributos={product.atributos} numeroSerie={product.numero_serie} />
                        {product.comparar_modelo && (
                            <Link href={product.comparar_modelo.url}
                                className="group mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl p-5 transition-colors sm:flex-row sm:items-center sm:p-6"
                                style={{ background: 'var(--surface-muted)' }}>
                                <span>
                                    <span className="block text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>{product.comparar_modelo.titulo}</span>
                                    <span className="mt-0.5 block text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {product.comparar_modelo.texto}
                                    </span>
                                </span>
                                <span className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity group-hover:opacity-90"
                                    style={{ background: 'var(--ab-navy)' }}>
                                    <GitCompare className="h-4 w-4" /> {product.comparar_modelo.boton}
                                </span>
                            </Link>
                        )}
                    </PdpSection>
                )}

                {/* Compatibilidad */}
                {hasCompat && (
                    <PdpSection id="compatibilidad" title="Compatibilidad">
                        <div className="space-y-6 max-w-2xl">
                            {compatibilidades.iphone?.length > 0 && (
                                <div>
                                    <p className="mb-3 text-sm font-bold uppercase tracking-widest"
                                        style={{ color: 'var(--text-muted)' }}>
                                        Compatible con
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Cada modelo llega como { id, name, slug } (antes se mostraba el objeto y la página fallaba) */}
                                        {compatibilidades.iphone.map((m) => (
                                            <span key={m.slug ?? m}
                                                className="rounded-full px-3 py-1.5 text-sm font-semibold"
                                                style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                                                {m.name ?? m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {compatibilidades.myskin?.length > 0 && (
                                <div>
                                    <p className="mb-3 text-sm font-bold uppercase tracking-widest"
                                        style={{ color: 'var(--text-muted)' }}>
                                        Fundas MYSKIN compatibles
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {compatibilidades.myskin.map((m) => (
                                            <span key={m.slug ?? m}
                                                className="rounded-full px-3 py-1.5 text-sm font-semibold"
                                                style={{ background: 'rgba(198,203,54,0.12)', color: '#3A3F00' }}>
                                                {m.name ?? m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Otros tipos de compatibilidad genérica */}
                            {Object.entries(compatibilidades)
                                .filter(([tipo]) => tipo !== 'iphone' && tipo !== 'myskin')
                                .map(([tipo, modelos]) => (
                                    <div key={tipo}>
                                        <p className="mb-3 text-sm font-bold uppercase tracking-widest"
                                            style={{ color: 'var(--text-muted)' }}>
                                            {tipo}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {modelos.map((m) => (
                                                <span key={m.slug ?? m}
                                                    className="rounded-full px-3 py-1.5 text-sm font-semibold"
                                                    style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                                                    {m.name ?? m}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </PdpSection>
                )}

                {/* Condición */}
                {product.condition && product.condition !== 'Nuevo' && (
                    <PdpSection id="condicion" title="Condición del equipo">
                        <div className="max-w-2xl rounded-xl p-6"
                            style={{
                                background: product.condition === 'Open Box'
                                    ? 'rgba(198,203,54,0.10)'
                                    : 'rgba(88,94,159,0.08)',
                                border: `1px solid ${product.condition === 'Open Box'
                                    ? 'rgba(198,203,54,0.30)'
                                    : 'rgba(88,94,159,0.20)'}`,
                            }}>
                            <p className="text-base font-bold"
                                style={{ color: product.condition === 'Open Box' ? '#3A3F00' : 'var(--ab-deep-violet)' }}>
                                {product.condition === 'Open Box' ? 'Producto Open Box' : `Equipo ${product.condition}`}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {product.condition === 'Open Box'
                                    ? 'Abierto pero sin uso real. Puede que le falte parte del embalaje original. Funciona como nuevo.'
                                    : 'Equipo revisado y funcional. Confirmamos el estado exacto antes de reservar.'}
                            </p>
                            {product.battery && product.condition === 'Seminuevo' && (
                                <div className="mt-4 flex items-center gap-2 text-sm font-semibold"
                                    style={{ color: 'var(--ab-deep-violet)' }}>
                                    <BateriaNivel porcentaje={porcentajeBateria({ salud_bateria: product.battery })} className="h-4 w-7" />
                                    Salud de batería: {product.battery} %
                                </div>
                            )}
                        </div>
                    </PdpSection>
                )}

                {/* ¿Qué incluye? */}
                {product.que_incluye && (
                    <PdpSection id="incluye" title="¿Qué incluye?">
                        <div className="max-w-2xl">
                            {product.que_incluye.split('\n').filter(Boolean).map((line, i) => (
                                <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0"
                                    style={{ borderColor: 'var(--border-light)' }}>
                                    <Package className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--ab-periwinkle)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{line}</span>
                                </div>
                            ))}
                        </div>
                    </PdpSection>
                )}

                {/* Garantía */}
                {product.garantia && (
                    <PdpSection id="garantia" title="Garantía">
                        <div className="flex max-w-2xl items-start gap-4 rounded-xl p-5"
                            style={{ background: 'var(--surface-muted)' }}>
                            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" style={{ color: 'var(--ab-periwinkle)' }} />
                            <div>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {product.garantia}
                                </p>
                                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                                    La garantía aplica sobre defectos de fabricación. No cubre daños físicos ni por líquidos.
                                </p>
                            </div>
                        </div>
                    </PdpSection>
                )}

                {/* Entrega: las tres opciones en una fila, del mismo tamaño */}
                <PdpSection id="entrega" title="Entrega y recojo">
                    <div className="grid gap-6 sm:grid-cols-3">
                        {[
                            {
                                icon: StorePickup,
                                title: 'Recojo en tienda',
                                desc: `Coordinamos el punto de entrega en ${tienda?.tienda_ciudad ?? 'Cochabamba'}. Sin costo adicional.`,
                            },
                            {
                                icon: DeliveryTruck,
                                title: 'Envío por consultar',
                                desc: 'Para otras ciudades, consúltanos el costo y el tiempo por WhatsApp antes de reservar.',
                            },
                            {
                                icon: SecureBox,
                                title: 'Embalaje seguro',
                                desc: 'Equipos bien protegidos para que lleguen en perfectas condiciones.',
                            },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex h-full flex-col rounded-3xl border bg-white p-6"
                                style={{ borderColor: 'var(--border-light)' }}>
                                <span className="grid h-14 w-14 place-items-center rounded-2xl"
                                    style={{ background: 'rgba(88,94,159,0.10)', color: 'var(--ab-navy)' }}>
                                    <Icon className="h-7 w-7" strokeWidth={1.5} />
                                </span>
                                <p className="mt-5 text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </PdpSection>

                {/* FAQ: se cargan en el panel; sin preguntas, la sección no se dibuja */}
                {faqs.length > 0 && (
                    <PdpSection id="faq" title="Preguntas frecuentes">
                        <div className="max-w-2xl rounded-xl border" style={{ borderColor: 'var(--border-light)' }}>
                            <div className="px-5">
                                {faqs.map((item) => <FaqItem key={item.id} q={item.question} a={item.answer} />)}
                            </div>
                        </div>
                    </PdpSection>
                )}

                {/* Cross-sell y relacionados */}
                <MyskinCrossSell crossSell={crossSell} />
                <RelatedGrid related={related} />

                <div className="h-20" />
            </StoreContainer>
        </>
    );
}

// ─── PDP principal ─────────────────────────────────────────────────────────
export default function Product({ product, related, crossSell, faqs = [] }) {
    return (
        <StoreLayout>
            <ProductInner product={product} related={related} crossSell={crossSell} faqs={faqs} />
        </StoreLayout>
    );
}
