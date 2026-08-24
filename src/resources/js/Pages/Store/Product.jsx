import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    ArrowLeft, Battery, Box, Check, ChevronDown, ChevronUp,
    MapPin, MessageCircle, Package, ShieldCheck, ShoppingBag, Truck,
} from 'lucide-react';
import StoreLayout, { useStoreCart } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';
import ProductVisual from '@/Components/Store/ProductVisual';

const money = (v) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v);

// ─── JSON-LD — NUNCA expone IMEI, costo, proveedor ────────────────────────
function ProductJsonLd({ product }) {
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
        brand: { '@type': 'Brand', name: product.is_myskin ? 'MYSKIN' : 'Apple Boss' },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'BOB',
            price: product.promo_price ?? product.price,
            availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: typeof window !== 'undefined' ? window.location.href : '',
            ...(product.condition ? { itemCondition: conditionMap[product.condition] } : {}),
        },
    };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

// ─── Sticky nav (desktop) ──────────────────────────────────────────────────
function PdpNav({ sections, activeId }) {
    return (
        <nav
            className="sticky top-0 z-30 hidden border-b md:block"
            style={{ background: 'var(--surface-white)', borderColor: 'var(--border-light)' }}
        >
            <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-6 lg:px-10">
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
            </div>
        </nav>
    );
}

// ─── Sección wrapper ───────────────────────────────────────────────────────
function PdpSection({ id, title, children }) {
    return (
        <section id={id} className="scroll-mt-16 py-12 border-t" style={{ borderColor: 'var(--border-light)' }}>
            <h2 className="mb-6 text-[1.1rem] font-black" style={{ color: 'var(--text-primary)' }}>
                {title}
            </h2>
            {children}
        </section>
    );
}

// ─── Tabla de especificaciones ─────────────────────────────────────────────
const SPEC_LABELS = {
    modelo:            'Modelo',
    generacion:        'Generación',
    almacenamiento:    'Almacenamiento',
    ram:               'RAM',
    capacidad:         'Capacidad',
    color:             'Color',
    salud_bateria:     'Salud de batería',
    bateria:           'Batería',
    sim:               'SIM / eSIM',
    pantalla:          'Pantalla',
    chip:              'Chip',
    camara:            'Cámara',
    conectividad:      'Conectividad',
    material:          'Material',
    peso:              'Peso',
    dimensiones:       'Dimensiones',
    sistema_operativo: 'Sistema operativo',
    modelo_compatible: 'Compatible con',
    conectores:        'Conectores',
};

function SpecsTable({ atributos, battery, condition }) {
    const rows = Object.entries(atributos ?? {})
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => [SPEC_LABELS[k] ?? k, String(v)]);

    // Salud de batería no viene de atributos en celulares seminuevos — agregar si viene del producto
    if (battery && !atributos?.salud_bateria && !atributos?.bateria) {
        rows.push(['Salud de batería', `${battery}%`]);
    }

    if (!rows.length) return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin especificaciones disponibles.</p>;

    return (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-light)' }}>
            <table className="min-w-full text-sm">
                <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
                    {rows.map(([label, value]) => (
                        <tr key={label} className="even:bg-gray-50/60">
                            <td className="px-5 py-3 font-semibold w-48 shrink-0" style={{ color: 'var(--text-secondary)' }}>
                                {label}
                            </td>
                            <td className="px-5 py-3" style={{ color: 'var(--text-primary)' }}>
                                {value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── FAQ accordion ─────────────────────────────────────────────────────────
const FAQ_ITEMS = [
    {
        q: '¿Puedo ver el equipo antes de comprarlo?',
        a: 'Sí. Podés coordinar una visita a nuestra tienda en Cochabamba para revisar el equipo en persona.',
    },
    {
        q: '¿Cómo funciona el proceso de reserva?',
        a: 'Al agregar al carrito y consultar por WhatsApp confirmamos disponibilidad y acordamos la entrega o recojo.',
    },
    {
        q: '¿Los precios incluyen todo?',
        a: 'Sí. El precio publicado es el precio final en bolivianos. No hay costos adicionales ocultos.',
    },
    {
        q: '¿Aceptan permuta o parte de pago?',
        a: 'En algunos casos sí. Consultanos por WhatsApp con los detalles del equipo que tenés.',
    },
];

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


// ─── PDP inner (inside CartContext) ────────────────────────────────────────
function ProductInner({ product, related, crossSell }) {
    const { add } = useStoreCart();
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

    const waMessage = encodeURIComponent(
        `Hola Apple Boss, quiero consultar por ${product.name} — ${money(product.price)}`
    );

    const isMyskin  = product.is_myskin ?? false;
    const seoTitle  = `${product.name} — Apple Boss Cochabamba`;
    const seoDesc   = product.seo_description || `${product.name}. ${product.summary} Disponible en Apple Boss, Cochabamba.`;

    // Construir secciones dinámicas
    const sections = [
        { id: 'descripcion',     label: 'Descripción',       show: true },
        { id: 'especificaciones', label: 'Especificaciones',  show: Object.keys(product.atributos ?? {}).length > 0 },
        { id: 'condicion',       label: 'Condición',         show: product.condition && product.condition !== 'Nuevo' },
        { id: 'incluye',         label: '¿Qué incluye?',     show: !!product.que_incluye },
        { id: 'garantia',        label: 'Garantía',          show: !!product.garantia },
        { id: 'entrega',         label: 'Entrega',           show: true },
        { id: 'faq',             label: 'Preguntas',         show: true },
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
            <Head>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDesc} />
                <meta property="og:title"       content={seoTitle} />
                <meta property="og:description" content={seoDesc} />
                <meta property="og:type"        content="product" />
                {product.images?.[0] && (
                    <meta property="og:image" content={product.images[0].url_card ?? product.images[0].url_medium} />
                )}
                <link rel="canonical" href={`/productos/${product.slug}`} />
            </Head>
            <ProductJsonLd product={product} />

            {/* Sticky buy bar (mobile) */}
            {showBuyBar && product.available && (
                <div
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

            <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
                {/* Breadcrumb */}
                <div className="py-6">
                    <Link
                        href="/catalogo"
                        className="inline-flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <ArrowLeft className="h-4 w-4" /> Catálogo
                    </Link>
                </div>

                {/* Hero */}
                <section ref={heroRef} className="grid gap-10 pb-10 md:grid-cols-[1fr_1fr] lg:gap-20">
                    {/* Visual */}
                    <div>
                        <ProductVisual
                            product={product}
                            style={{ aspectRatio: '1 / 1', borderRadius: 'var(--radius-xl)' }}
                        />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-center">
                        {/* Categoría + condición + disponibilidad */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {isMyskin ? (
                                <span className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
                                    style={{ background: '#A3BD31', color: '#0C1B47' }}>
                                    MYSKIN
                                </span>
                            ) : (
                                <span className="text-sm font-bold" style={{ color: 'var(--ab-periwinkle)' }}>
                                    {product.category_label}
                                </span>
                            )}
                            {product.condition && product.condition !== 'Nuevo' && (
                                <>
                                    <span style={{ color: 'var(--border-medium)' }}>·</span>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                                        {product.condition}
                                    </span>
                                </>
                            )}
                            <span style={{ color: 'var(--border-medium)' }}>·</span>
                            <span className="text-sm font-semibold"
                                style={{ color: product.available ? '#1A7A1A' : 'var(--ab-deep-violet)' }}>
                                {product.available ? 'Disponible' : 'No disponible'}
                            </span>
                        </div>

                        {/* Nombre */}
                        <h1
                            className="mt-4 text-balance text-[clamp(1.75rem,4vw,3rem)] font-black leading-[1.02] tracking-[-0.04em]"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {product.name}
                        </h1>
                        {product.subtitulo && (
                            <p className="mt-2 text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {product.subtitulo}
                            </p>
                        )}

                        {/* Precio */}
                        <div className="mt-5 flex items-baseline gap-3">
                            <p className="text-[2rem] font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                                {money(product.promo_price ?? product.price)}
                            </p>
                            {product.promo_price && (
                                <p className="text-lg font-semibold line-through" style={{ color: 'var(--text-muted)' }}>
                                    {money(product.price)}
                                </p>
                            )}
                            {product.promo_badge && (
                                <span className="rounded-full px-2.5 py-1 text-xs font-bold"
                                    style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}>
                                    {product.promo_badge}
                                </span>
                            )}
                        </div>

                        {/* Resumen */}
                        <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-[1.75]"
                            style={{ color: 'var(--text-secondary)' }}>
                            {product.summary}
                        </p>

                        {/* Specs pills (top 4) */}
                        {product.specs?.length > 0 && (
                            <div className="mt-5 flex flex-wrap gap-2">
                                {product.specs.map((spec) => (
                                    <span key={spec}
                                        className="rounded-full px-4 py-1.5 text-sm font-semibold"
                                        style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* CTAs */}
                        {product.available ? (
                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                <button type="button" onClick={() => add(product)}
                                    className="flex items-center justify-center gap-2 rounded-full py-4 text-sm font-bold transition-opacity hover:opacity-90"
                                    style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}>
                                    <ShoppingBag className="h-5 w-5" /> Agregar al carrito
                                </button>
                                <a href={`https://wa.me/59178000000?text=${waMessage}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 rounded-full border py-4 text-sm font-bold transition-colors hover:bg-black/5"
                                    style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                                    <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
                                </a>
                            </div>
                        ) : (
                            <div className="mt-8 space-y-3">
                                <div className="rounded-2xl p-4"
                                    style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-light)' }}>
                                    <p className="text-sm font-bold" style={{ color: 'var(--ab-deep-violet)' }}>
                                        Este equipo no está disponible actualmente
                                    </p>
                                    <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                                        Puede que tengamos un modelo similar. Consultanos por WhatsApp.
                                    </p>
                                </div>
                                <a href={`https://wa.me/59178000000?text=${encodeURIComponent(`Hola Apple Boss, el ${product.name} ya no está disponible. ¿Tienen algo similar?`)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold transition-opacity hover:opacity-90"
                                    style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}>
                                    <MessageCircle className="h-5 w-5" /> Consultar alternativas
                                </a>
                            </div>
                        )}

                        {/* Trust micro-signals */}
                        <div className="mt-8 flex flex-wrap gap-5 border-t pt-6"
                            style={{ borderColor: 'var(--border-light)' }}>
                            {[
                                [ShieldCheck, 'Equipo revisado'],
                                [Check, 'Stock confirmado'],
                                [MessageCircle, 'Atención directa'],
                            ].map(([Icon, label]) => (
                                <div key={label} className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" style={{ color: 'var(--ab-periwinkle)' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Sticky nav */}
            <PdpNav sections={sections} activeId={activeSection} />

            {/* Secciones de contenido */}
            <div className="mx-auto max-w-[1440px] px-6 lg:px-10">

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
                {Object.keys(product.atributos ?? {}).length > 0 && (
                    <PdpSection id="especificaciones" title="Especificaciones técnicas">
                        <SpecsTable
                            atributos={product.atributos}
                            battery={product.battery}
                            condition={product.condition}
                        />
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
                                    <Battery className="h-4 w-4" />
                                    Salud de batería: {product.battery}%
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

                {/* Entrega */}
                <PdpSection id="entrega" title="Entrega y recojo">
                    <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                        {[
                            {
                                icon: MapPin,
                                title: 'Recojo en tienda',
                                desc: 'Coordinamos el punto de entrega en Cochabamba. Sin costo adicional.',
                            },
                            {
                                icon: Truck,
                                title: 'Envío por consultar',
                                desc: 'Para otras ciudades consultanos costo y tiempo por WhatsApp antes de reservar.',
                            },
                            {
                                icon: Box,
                                title: 'Embalaje seguro',
                                desc: 'Equipos bien protegidos para que lleguen en perfectas condiciones.',
                            },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-4 rounded-xl p-4"
                                style={{ background: 'var(--surface-muted)' }}>
                                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--ab-periwinkle)' }} />
                                <div>
                                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                                    <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </PdpSection>

                {/* FAQ */}
                <PdpSection id="faq" title="Preguntas frecuentes">
                    <div className="max-w-2xl rounded-xl border" style={{ borderColor: 'var(--border-light)' }}>
                        <div className="px-5">
                            {FAQ_ITEMS.map((item) => <FaqItem key={item.q} {...item} />)}
                        </div>
                    </div>
                </PdpSection>

                {/* Cross-sell y relacionados */}
                <MyskinCrossSell crossSell={crossSell} />
                <RelatedGrid related={related} />

                <div className="h-20" />
            </div>
        </>
    );
}

// ─── PDP principal ─────────────────────────────────────────────────────────
export default function Product({ product, related, crossSell }) {
    const seoTitle = `${product.name} — Apple Boss Cochabamba`;
    return (
        <StoreLayout title={seoTitle}>
            <ProductInner product={product} related={related} crossSell={crossSell} />
        </StoreLayout>
    );
}
