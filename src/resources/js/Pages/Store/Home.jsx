import { Head, Link } from '@inertiajs/react';
import { ArrowRight, MessageCircle, ShieldCheck, Star, Zap } from 'lucide-react';
import StoreLayout, { useStoreCart } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';

const money = (v) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v);

// ─── Hero editorial — navy fondo, sin slider ───────────────────────────────
function Hero({ totalAvailable }) {
    return (
        <section
            className="relative overflow-hidden"
            style={{ background: 'var(--ab-navy)' }}
        >
            {/* Motivos decorativos círculos (brandbook AB) */}
            <div
                className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-[0.06]"
                style={{ background: 'var(--ab-periwinkle)' }}
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -bottom-20 left-[30%] h-[280px] w-[280px] rounded-full opacity-[0.04]"
                style={{ background: 'var(--ab-lime)' }}
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-[1440px] px-6 py-20 lg:px-10 lg:py-28">
                <div className="max-w-3xl">
                    {/* Pill */}
                    <span
                        className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
                        style={{ background: 'rgba(198,203,54,0.15)', color: 'var(--ab-lime)' }}
                    >
                        <Zap className="h-3 w-3" /> Stock real · Precios reales
                    </span>

                    <h1
                        className="text-balance text-[clamp(2.75rem,7vw,5.5rem)] font-black leading-[0.93] tracking-[-0.04em]"
                        style={{ color: '#FFFFFF' }}
                    >
                        El iPhone que buscas,{' '}
                        <em
                            className="not-italic"
                            style={{ color: 'var(--ab-lime)' }}
                        >
                            disponible hoy.
                        </em>
                    </h1>

                    <p
                        className="mt-6 max-w-[54ch] text-pretty text-[1.0625rem] leading-[1.75]"
                        style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                        Equipos Apple revisados, listos para usar. Armá tu selección y
                        consultá directamente con nuestro equipo en Cochabamba.
                    </p>

                    <div className="mt-9 flex flex-wrap gap-3">
                        <Link
                            href="/catalogo"
                            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold transition-opacity hover:opacity-90"
                            style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                        >
                            Ver {totalAvailable} productos <ArrowRight className="h-4 w-4" />
                        </Link>
                        <a
                            href="https://wa.me/59178000000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-bold transition-colors hover:bg-white/10"
                            style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}
                        >
                            <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Categorías en grid ────────────────────────────────────────────────────
const CAT_ACCENT = {
    celulares:        { bg: '#E5EAF5', ink: '#011446' },
    computadoras:     { bg: '#EAEAF2', ink: '#28224F' },
    'productos-apple':{ bg: '#E5E8F5', ink: '#011446' },
    fundas:           { bg: '#EEF2E5', ink: '#1A2A00' },
    accesorios:       { bg: '#F0EFEF', ink: '#28224F' },
};

function Categories({ categories }) {
    return (
        <section className="mx-auto max-w-[1440px] px-6 py-14 lg:px-10">
            <h2
                className="mb-6 text-[1.1rem] font-black uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
            >
                Categorías
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {categories.map((cat) => {
                    const accent = CAT_ACCENT[cat.slug] ?? { bg: '#F2F2F7', ink: '#28224F' };
                    const isMyskin = cat.myskin ?? false;
                    return (
                        <Link
                            key={cat.slug}
                            href={`/catalogo?categoria=${cat.slug}`}
                            className="group flex flex-col justify-between rounded-2xl p-5 transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2"
                            style={{
                                background: accent.bg,
                                '--tw-ring-color': 'var(--ab-periwinkle)',
                            }}
                        >
                            <div>
                                <p
                                    className="text-base font-black leading-tight"
                                    style={{ color: isMyskin ? '#0C1B47' : accent.ink }}
                                >
                                    {cat.name}
                                </p>
                                <p
                                    className="mt-1 text-[11px] leading-snug"
                                    style={{ color: isMyskin ? '#3A5000' : accent.ink, opacity: 0.65 }}
                                >
                                    {cat.description}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <span
                                    className="text-xs font-bold"
                                    style={{ color: accent.ink, opacity: 0.5 }}
                                >
                                    {cat.count} disponibles
                                </span>
                                <ArrowRight
                                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                                    style={{ color: accent.ink, opacity: 0.5 }}
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

// ─── Grid de productos ─────────────────────────────────────────────────────
function ProductGrid({ title, products, cta, ctaHref }) {
    const { add } = useStoreCart();
    if (!products?.length) return null;

    return (
        <section className="mx-auto max-w-[1440px] px-6 pb-16 lg:px-10">
            <div className="mb-6 flex items-end justify-between">
                <h2
                    className="text-[1.4rem] font-black leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {title}
                </h2>
                {cta && (
                    <Link
                        href={ctaHref}
                        className="inline-flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-70"
                        style={{ color: 'var(--ab-periwinkle)' }}
                    >
                        {cta} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                    <ProductCard key={p.key} product={p} onAdd={add} />
                ))}
            </div>
        </section>
    );
}

// ─── Sección MYSKIN co-branded ─────────────────────────────────────────────
function MyskinBanner({ myskin }) {
    const { add } = useStoreCart();
    if (!myskin?.length) return null;

    return (
        <section
            className="py-16"
            style={{ background: '#0C1B47' }}
        >
            <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
                {/* Header MYSKIN */}
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <span
                            className="mb-2 block text-[11px] font-bold uppercase tracking-widest"
                            style={{ color: '#A3BD31' }}
                        >
                            Sub-marca exclusiva
                        </span>
                        <h2
                            className="text-[1.6rem] font-black"
                            style={{ color: '#FFFFFF' }}
                        >
                            Fundas MYSKIN
                        </h2>
                        <p
                            className="mt-1 text-sm"
                            style={{ color: 'rgba(255,255,255,0.55)' }}
                        >
                            Protección con identidad propia para tu iPhone.
                        </p>
                    </div>
                    <Link
                        href="/catalogo?categoria=fundas"
                        className="inline-flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-70"
                        style={{ color: '#A3BD31' }}
                    >
                        Ver todas <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {myskin.map((p) => (
                        <ProductCard key={p.key} product={p} onAdd={add} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Trust signals (solo hechos verificables) ──────────────────────────────
function TrustBar() {
    const items = [
        { icon: ShieldCheck, text: 'Cada equipo es revisado antes de entregarlo' },
        { icon: MessageCircle, text: 'Atención directa — sin bots, sin formularios' },
        { icon: Star, text: 'Precios reales mostrados en el momento' },
    ];

    return (
        <section
            className="border-y"
            style={{
                background: 'var(--surface-muted)',
                borderColor: 'var(--border-light)',
            }}
        >
            <div className="mx-auto grid max-w-[1440px] divide-y px-6 py-10 sm:divide-x sm:divide-y-0 sm:grid-cols-3 lg:px-10"
                 style={{ '--tw-divide-opacity': 1, '--tw-divide-color': 'var(--border-light)' }}
            >
                {items.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3 py-5 sm:px-8 sm:py-0 first:pl-0 last:pr-0">
                        <div
                            className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                            style={{ background: 'rgba(1,20,70,0.08)' }}
                        >
                            <Icon className="h-4 w-4" style={{ color: 'var(--ab-navy)' }} />
                        </div>
                        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-secondary)' }}>
                            {text}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function Home({ featured, seminuevos, myskin, categories, totalAvailable }) {
    return (
        <StoreLayout title="Apple Boss — Tecnología Apple en Cochabamba">
            <Head>
                <title>Apple Boss — Tecnología Apple en Cochabamba</title>
                <meta
                    name="description"
                    content="iPhone, Mac, iPad y accesorios Apple disponibles en Cochabamba. Equipos revisados, precios reales, atención personalizada."
                />
            </Head>

            <Hero totalAvailable={totalAvailable} />
            <Categories categories={categories} />
            <TrustBar />
            <ProductGrid
                title="Disponibles ahora"
                products={featured}
                cta="Ver todo el catálogo"
                ctaHref="/catalogo"
            />
            {seminuevos?.length > 0 && (
                <ProductGrid
                    title="Seminuevos"
                    products={seminuevos}
                    cta="Ver seminuevos"
                    ctaHref="/catalogo?condicion=Seminuevo"
                />
            )}
            <MyskinBanner myskin={myskin} />
        </StoreLayout>
    );
}
