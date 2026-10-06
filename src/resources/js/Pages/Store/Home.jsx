import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight, BadgeCheck, ChevronDown, Exchange,
    MapPin, MessageCircle, Scan, ShieldCheck, Smartphone, Watch,
} from '@/Components/Store/Icons';
import { useState } from 'react';
import { motion } from 'framer-motion';
import StoreLayout, { StoreContainer, money, useStoreCart, useWhatsApp } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';
import ProductVisual from '@/Components/Store/ProductVisual';
import TarjetaCategoria from '@/Components/Store/TarjetaCategoria';
import TarjetaServicio, { columnasServicios } from '@/Components/Store/TarjetaServicio';
import TarjetaNovedad, { columnasNovedades } from '@/Components/Store/TarjetaNovedad';
import { FichaUbicacion, MapaUbicacion, SelectorLocales } from '@/Components/Store/Ubicacion';
import TrustMarquee from '@/Components/Store/TrustMarquee';
import CarruselResenas from '@/Components/Store/CarruselResenas';
import HeroMac from '@/Components/Store/HeroMac';
import Reveal from '@/Components/Store/Reveal';
import { nombreTienda, useNombreTienda } from '@/Components/Store/tienda';

// ─── Portada grande: components/Store/HeroMac.jsx ────────────────────────────

// ─── Ritmo visual común ───────────────────────────────────────────────────────
const TONE_BG = {
    white: 'var(--surface-white)',
    muted: 'var(--surface-muted)',
    dark:  'var(--ms-navy)',
};

// Las secciones con `id` se abren desde otras páginas (/#servicios, /#faq): el margen evita que el título quede tapado
// por el encabezado fijo de la tienda.
function Section({ tone = 'white', id, labelledBy, children }) {
    return (
        <section id={id} aria-labelledby={labelledBy} className={`py-10 sm:py-12 ${id ? 'scroll-mt-28 lg:scroll-mt-40' : ''}`} style={{ background: TONE_BG[tone] ?? TONE_BG.white }}>
            <StoreContainer>
                <Reveal>{children}</Reveal>
            </StoreContainer>
        </section>
    );
}

function SectionHeading({ id, eyebrow, title, subtitle, href, cta, dark = false }) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
                {eyebrow && (
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: dark ? 'var(--ms-lime)' : 'var(--ab-periwinkle)' }}>
                        {eyebrow}
                    </span>
                )}
                <h2 id={id} className="text-2xl font-black tracking-tight sm:text-[28px]" style={{ color: dark ? '#fff' : 'var(--text-primary)' }}>
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: dark ? 'rgba(255,255,255,0.72)' : 'var(--text-secondary)' }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {href && cta && (
                <Link
                    href={href}
                    className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-75"
                    style={{ color: dark ? 'var(--ms-lime)' : 'var(--ab-navy)' }}
                >
                    {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            )}
        </div>
    );
}

// ─── Trust bar ────────────────────────────────────────────────────────────────
// Carrusel continuo, separado del hero y dentro del contenedor de 1224px.
// Solo afirmaciones verificables (nada de "garantía oficial", "envío nacional", etc.).
function TrustBar() {
    const { tienda } = usePage().props;
    const ciudad = tienda?.tienda_ciudad || 'Cochabamba';

    return (
        <TrustMarquee items={[
            { icon: ShieldCheck,   text: 'Revisados antes de entregarte' },
            { icon: MessageCircle, text: 'Atención directa, sin bots' },
            { icon: BadgeCheck,    text: 'Precios reales, sin letra chica' },
            { icon: Scan,          text: 'Condición explícita en cada equipo' },
            { icon: Exchange,      text: 'Tu equipo actual como parte de pago' },
            // Solo con un local cargado en Tienda online → Ubicaciones
            ...(tienda?.tienda_local ? [{ icon: MapPin, text: `Visítanos en ${ciudad}` }] : []),
        ]} />
    );
}

// ─── Categorías — sólo con stock ─────────────────────────────────────────────
// Las tarjetas salen de Components/Store/TarjetaCategoria: las mismas que la vista previa del panel.
function Categories({ categories, tone }) {
    const withStock = categories.filter((c) => c.count > 0);
    // Con una sola categoría el bloque queda vacío: el menú ya lleva ahí
    if (withStock.length < 2) return null;

    return (
        <Section tone={tone} labelledBy="home-categorias">
            <SectionHeading id="home-categorias" title="¿Qué estás buscando?" href="/catalogo" cta="Todo el catálogo" />
            <div className={`grid gap-3 ${withStock.length >= 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {withStock.map((cat) => <TarjetaCategoria key={cat.slug} cat={cat} />)}
            </div>
        </Section>
    );
}

// ─── Spotlight: 1–2 productos ─────────────────────────────────────────────────
function ProductSpotlight({ product, onAdd }) {
    const img = product.images?.find((i) => i.es_principal) ?? product.images?.[0];
    return (
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="flex items-center justify-center bg-gray-50 p-6" style={{ minHeight: 220 }}>
                    {img ? (
                        <img src={img.url_medium ?? img.url_card} alt={img.alt ?? product.name} className="max-h-[220px] w-auto object-contain" />
                    ) : (
                        <ProductVisual product={product} className="h-44 w-full rounded-xl" />
                    )}
                </div>
                <div className="flex flex-col justify-center p-6 md:p-8">
                    {product.condition && product.condition !== 'Nuevo' && (
                        <span className="mb-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)' }}>
                            {product.condition}
                        </span>
                    )}
                    <h3 className="text-2xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                    {product.summary && <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{product.summary}</p>}
                    {product.specs?.length > 0 && <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>{product.specs.join(' · ')}</p>}
                    <p className="mt-6 text-3xl font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                        {product.price > 0 ? money(product.price) : 'Consultar precio'}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href={product.url} className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-90" style={{ background: 'var(--ab-navy)', color: '#fff' }}>
                            Ver detalles
                        </Link>
                        {product.available && (
                            <button onClick={() => onAdd(product)} className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-bold transition-colors hover:bg-gray-50" style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                                Agregar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sección de productos genérica (destacados, categorías, seminuevos, MYSKIN) ─
function ProductSection({ id, eyebrow, title, subtitle, products, cta, ctaHref, tone = 'white' }) {
    const { add } = useStoreCart();
    if (!products?.length) return null;
    const dark = tone === 'dark';

    return (
        <Section tone={tone} labelledBy={id}>
            <SectionHeading id={id} eyebrow={eyebrow} title={title} subtitle={subtitle} href={ctaHref} cta={cta} dark={dark} />

            {products.length <= 2 ? (
                <div className="space-y-4">
                    {products.map((p) => <ProductSpotlight key={p.key} product={p} onAdd={add} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                    {products.map((p, i) => (
                        dark ? (
                            <div key={p.key} className="rounded-2xl bg-white p-3">
                                <ProductCard product={p} onAdd={add} />
                            </div>
                        ) : (
                            <ProductCard key={p.key} product={p} onAdd={add} priority={i === 0} />
                        )
                    ))}
                </div>
            )}
        </Section>
    );
}

const CATEGORY_META = {
    celulares:         { title: 'iPhone',     href: '/iphone',                             cta: 'Ver todos los iPhone' },
    computadoras:      { title: 'Mac',        href: '/mac',                                cta: 'Ver todas las Mac' },
    'productos-apple': { title: 'Más Apple',  href: '/catalogo?categoria=productos-apple', cta: 'Ver más Apple' },
    accesorios:        { title: 'Accesorios', href: '/catalogo?categoria=accesorios',      cta: 'Ver accesorios' },
};

// ─── Trade-In ────────────────────────────────────────────────────────────────
function TradeInSection({ settings = {}, tone }) {
    const steps = [
        { Icon: Smartphone, title: 'Cuéntanos de tu equipo', text: 'Cómo está pieza por pieza, su batería y fotos, paso a paso.' },
        { Icon: Scan,       title: 'Revisamos tu solicitud', text: 'Te escribimos por WhatsApp con un valor estimado.' },
        { Icon: Exchange,   title: 'Úsalo como parte de pago', text: 'Aplica el valor acordado a tu próximo equipo.' },
    ];
    return (
        <Section tone={tone} id="trade-in" labelledBy="home-trade-in">
            <div className="relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12 lg:px-14" style={{ background: 'var(--ab-navy)' }}>
                {/* Círculos de marca (logo Apple Boss) */}
                <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full" style={{ background: 'rgba(88,94,159,0.35)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-[38%] h-24 w-24 rounded-full" style={{ background: 'rgba(198,203,54,0.14)' }} />

                <div className="relative grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
                    <div>
                        <span className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ background: 'rgba(198,203,54,0.16)', color: 'var(--ab-lime)' }}>
                            <Exchange className="h-3.5 w-3.5" /> Trade-In
                        </span>
                        <h2 id="home-trade-in" className="text-3xl font-black leading-tight tracking-tight text-white sm:text-[34px]">
                            {settings.titulo || 'Tu equipo actual vale como parte de pago'}
                        </h2>
                        <p className="mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                            {settings.descripcion || 'Cotiza tu iPhone, Mac, celular Android, laptop, PC gamer o consola en línea. Sin costo y sin compromiso.'}
                        </p>
                        <Link
                            href="/trade-in"
                            className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                            style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                        >
                            {settings.cta_label || 'Cotizar mi equipo'} <ArrowRight className="h-4 w-4" strokeWidth={2} />
                        </Link>
                    </div>

                    <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        {steps.map(({ Icon, title, text }, i) => (
                            <li key={title} className="flex items-start gap-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: 'rgba(255,255,255,0.10)', color: '#fff' }}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-white">
                                        <span className="mr-1.5 tabular-nums" style={{ color: 'var(--ab-lime)' }}>{i + 1}.</span>{title}
                                    </p>
                                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </Section>
    );
}

// ─── Servicios ────────────────────────────────────────────────────────────────
// Las tarjetas se cargan en el panel: Tienda online → Servicios. El título se cambia en Portada. Sin servicios
// encendidos la sección no se dibuja (antes mostraba cuatro servicios escritos acá que nadie podía cambiar).
function ServicesSection({ services, settings = {}, tone }) {
    const wa = useWhatsApp();
    const items = services ?? [];
    return (
        <Section tone={tone} id="servicios" labelledBy="home-servicios">
            <SectionHeading id="home-servicios" title={settings.titulo || 'Nuestros servicios'} subtitle={settings.subtitle} />
            <div className={`grid gap-4 ${columnasServicios(items.length)}`}>
                {items.map((item) => (
                    <TarjetaServicio
                        key={item.id}
                        servicio={item}
                        href={item.accion === 'whatsapp' ? wa.url(item.mensaje) : item.enlace}
                    />
                ))}
            </div>
        </Section>
    );
}

// ─── Dónde estamos ───────────────────────────────────────────────────────────
// Los locales se cargan en el panel: Tienda online → Ubicaciones, y salen en el orden de esa lista. El título y la
// bajada se cambian en Portada. Sin locales encendidos la sección no se dibuja (antes usaba la dirección y el horario de
// ejemplo de Configuración).
function LocationSection({ locations, settings = {}, tone }) {
    const wa = useWhatsApp();
    const nombre = useNombreTienda();
    const [actual, setActual] = useState(0);
    const locales = locations ?? [];
    const local = locales[actual] ?? locales[0];

    if (!local) return null;

    const ciudades = [...new Set(locales.map((l) => l.ciudad).filter(Boolean))];
    const titulo = settings.titulo || (ciudades.length === 1 ? `Estamos en ${ciudades[0]}` : 'Dónde estamos');
    const numero = local.whatsapp ?? (wa.enabled ? wa.number : null);

    return (
        <Section tone={tone} id="contacto" labelledBy="home-ubicacion">
            <div className={`grid grid-cols-1 items-center gap-10 ${local.mapa ? 'md:grid-cols-2' : ''}`}>
                <div className={local.mapa ? '' : 'max-w-2xl'}>
                    <SectionHeading id="home-ubicacion" eyebrow={`Visita ${nombre}`} title={titulo} subtitle={settings.subtitle || local.descripcion} />

                    {locales.length > 1 && (
                        <div className="mb-6">
                            <SelectorLocales locales={locales} actual={actual} onChange={setActual} />
                        </div>
                    )}

                    <FichaUbicacion local={local} />

                    {(numero || (!local.mapa && local.como_llegar)) && (
                        <div className="mt-8 flex flex-wrap gap-3">
                            {numero && (
                                <a
                                    href={`https://wa.me/${numero}?text=${encodeURIComponent(`${wa.saludo} quiero saber cómo llegar a ${local.nombre}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                                    style={{ background: 'var(--ab-navy)', color: '#fff' }}
                                >
                                    <MessageCircle className="h-4 w-4" /> Consultar cómo llegar
                                </a>
                            )}
                            {!local.mapa && local.como_llegar && (
                                <a
                                    href={local.como_llegar}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                                    style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                                >
                                    Ver en Google Maps <ArrowRight className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    )}
                </div>

                <MapaUbicacion local={local} />
            </div>
        </Section>
    );
}

// ─── Novedades ───────────────────────────────────────────────────────────────
// Se escriben en el panel: Tienda online → Novedades, y salen las más nuevas. El título y cuántas se muestran se
// cambian en Portada. Sin novedades publicadas la sección no se dibuja.
function NewsSection({ novedades, settings = {}, tone }) {
    const items = novedades ?? [];
    const nombre = useNombreTienda();
    return (
        <Section tone={tone} id="novedades" labelledBy="home-novedades">
            <SectionHeading id="home-novedades" eyebrow="Novedades" title={settings.titulo || `Lo último de ${nombre}`}
                subtitle={settings.subtitle} href="/novedades" cta="Ver todas" />
            <div className={`grid gap-5 ${columnasNovedades(items.length)}`}>
                {items.map((n) => <TarjetaNovedad key={n.id} novedad={n} />)}
            </div>
        </Section>
    );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FaqSection({ faqs, tone }) {
    const wa = useWhatsApp();
    // Las preguntas se cargan en el panel: Tienda online → Preguntas frecuentes
    const items = faqs ?? [];

    // Con muchas preguntas, una sola columna estira la sección y deja la izquierda vacía.
    // Desde la séptima se reparten en dos columnas y el encabezado acompaña el scroll.
    const enDosColumnas = items.length >= 7;
    const corte = Math.ceil(items.length / 2);
    const columnas = enDosColumnas ? [items.slice(0, corte), items.slice(corte)] : [items];

    return (
        <Section tone={tone} id="faq" labelledBy="home-faq">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,290px)_1fr] lg:gap-14">
                {/* El encabezado se queda fijo: sin esto, con la lista larga quedaba un vacío enorme */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                    <SectionHeading id="home-faq" eyebrow="Ayuda" title="Preguntas frecuentes" subtitle="Lo que más nos consultan antes de comprar." />
                    {wa.enabled && wa.number && (
                        <a href={wa.url(`${wa.saludo} tengo una consulta`)} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-75" style={{ color: 'var(--ab-navy)' }}>
                            <MessageCircle className="h-4 w-4" /> ¿Otra consulta? Escríbenos
                        </a>
                    )}
                </div>

                <div className={`grid items-start gap-x-12 ${enDosColumnas ? 'xl:grid-cols-2' : ''}`}>
                    {columnas.map((columna, i) => (
                        <div key={i} className="border-t" style={{ borderColor: 'var(--border-light)' }}>
                            {columna.map((item) => (
                                <details key={item.id} className="group border-b py-5" style={{ borderColor: 'var(--border-light)' }}>
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden" style={{ color: 'var(--text-primary)' }}>
                                        {item.question}
                                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180" style={{ color: 'var(--text-muted)' }} />
                                    </summary>
                                    <p className="mt-3 pr-9 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.answer}</p>
                                </details>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}

// ─── Reseñas: las opiniones aprobadas en Tienda online → Reseñas ──────────────
function ResenasSection({ resenas, resumen, settings = {}, tone }) {
    const nombre = useNombreTienda();
    return (
        <Section tone={tone} id="resenas" labelledBy="home-resenas">
            <CarruselResenas resenas={resenas} resumen={resumen}
                titulo={settings.titulo || 'Lo que dicen nuestros clientes'}
                subtitulo={settings.subtitle || `Opiniones de personas que ya compraron en ${nombre}.`} />
        </Section>
    );
}

// ─── Productos de cada sección ───────────────────────────────────────────────
// Cada sección de productos trae su propio listado, ya filtrado y limitado por el backend.
// Un producto se muestra una sola vez en la portada: si ya apareció arriba, no se repite más abajo.
const SECCIONES_DE_PRODUCTOS = new Set([
    'featured', 'category_products', 'product_collection', 'myskin', 'semiused', 'new_arrivals', 'offers',
]);

// ─── ¿La sección tiene contenido para mostrar? ───────────────────────────────
function hasContent(section, data) {
    switch (section.type) {
        // El bloque de accesos necesita al menos dos categorías con productos
        case 'category_rail': return data.categories?.filter((c) => c.count > 0).length > 1;
        // Sin preguntas cargadas no hay nada que mostrar
        case 'faq': return (data.faqs?.length ?? 0) > 0;
        // Solo las tarjetas encendidas en Tienda online → Servicios
        case 'services': return (data.services?.length ?? 0) > 0;
        // Solo los locales encendidos en Tienda online → Ubicaciones
        case 'location': return (data.locations?.length ?? 0) > 0;
        // Solo las novedades publicadas en Tienda online → Novedades
        case 'news': return (data.novedades?.length ?? 0) > 0;
        // Solo las reseñas aprobadas en Tienda online → Reseñas
        case 'reviews': return (data.resenas?.length ?? 0) > 0 && Boolean(data.resenasResumen);
        case 'hero': case 'trust': case 'trade_in':
            return true;
        default: return false;
    }
}

// ─── Renderer de sección por tipo ────────────────────────────────────────────
function SectionRenderer({ section, products, tone, featured, categories, totalAvailable, faqs, services, locations, novedades, resenas, resenasResumen }) {
    const s = section.settings ?? {};
    const hid = `home-sec-${section.id}`;
    const nombre = useNombreTienda();
    switch (section.type) {
        case 'hero':
            return <HeroMac featured={featured} totalAvailable={totalAvailable} cmsSettings={s} />;
        case 'trust':
            return <TrustBar />;
        case 'featured':
            return (
                <ProductSection id={hid} tone={tone}
                    eyebrow={`Selección ${nombre}`}
                    title={s.titulo || 'Productos destacados'}
                    subtitle={s.subtitle || 'Elegidos por nuestro equipo entre lo disponible hoy.'}
                    products={products}
                    cta="Ver todo el catálogo" ctaHref="/catalogo" />
            );
        case 'category_rail':
            return <Categories categories={categories} tone={tone} />;
        case 'category_products': {
            const meta = CATEGORY_META[s.categoria] ?? { title: section.label, href: '/catalogo', cta: 'Ver más' };
            return (
                <ProductSection id={hid} tone={tone}
                    title={s.titulo || meta.title}
                    subtitle={s.subtitle}
                    products={products}
                    cta={meta.cta} ctaHref={meta.href} />
            );
        }
        case 'myskin':
            return (
                <ProductSection id={hid} tone="dark"
                    eyebrow="Sub-marca exclusiva"
                    title={s.titulo || 'Fundas MYSKIN'}
                    subtitle={s.subtitle || 'Protección con identidad propia para tu iPhone.'}
                    products={products}
                    cta="Ver todas las fundas" ctaHref="/myskin" />
            );
        case 'semiused':
            return (
                <ProductSection id={hid} tone={tone}
                    title={s.titulo || 'Seminuevos'}
                    subtitle={s.subtitle || 'La condición de cada equipo está indicada en su publicación.'}
                    products={products}
                    cta="Ver seminuevos" ctaHref="/seminuevos" />
            );
        case 'trade_in':
            return <TradeInSection settings={s} tone={tone} />;
        case 'product_collection': {
            // La vitrina elegida a mano en Tienda online → Colecciones
            const col = section.coleccion;
            return (
                <ProductSection id={hid} tone={tone}
                    title={s.titulo || col?.nombre || section.label}
                    subtitle={s.subtitle}
                    products={products}
                    cta={col ? 'Ver la colección' : 'Ver todo el catálogo'} ctaHref={col?.url ?? '/catalogo'} />
            );
        }
        case 'offers':
            // Publicaciones con precio promocional vigente (se pone en el editor de cada publicación)
            return (
                <ProductSection id={hid} tone={tone}
                    eyebrow="Precio rebajado"
                    title={s.titulo || 'Ofertas'}
                    subtitle={s.subtitle}
                    products={products}
                    cta="Ver todo el catálogo" ctaHref="/catalogo" />
            );
        case 'new_arrivals':
            return (
                <ProductSection id={hid} tone={tone}
                    title={s.titulo || 'Nuevos ingresos'}
                    products={products}
                    cta="Ver todos" ctaHref="/catalogo" />
            );
        case 'services':
            return <ServicesSection services={services} settings={s} tone={tone} />;
        case 'location':
            return <LocationSection locations={locations} settings={s} tone={tone} />;
        case 'news':
            return <NewsSection novedades={novedades} settings={s} tone={tone} />;
        case 'faq':
            return <FaqSection faqs={faqs} tone={tone} />;
        case 'reviews':
            return <ResenasSection resenas={resenas} resumen={resenasResumen} settings={s} tone={tone} />;
        default:
            return null;
    }
}

// ─── Página principal ──────────────────────────────────────────────────────────
const FIXED_TONE = { hero: null, trust: null, myskin: 'dark' };

export default function Home({ sections, featured, categories, totalAvailable, faqs, services, locations, novedades, resenas = [], resenasResumen = null }) {
    const { tienda } = usePage().props;
    // El título y la metaetiqueta del inicio los escribe el servidor con App\Support\Seo (se editan en Marketing y
    // Google → «Google y redes sociales»). Acá solo van los datos del negocio que lee Google.
    const nombre = nombreTienda(tienda);

    // CMS es la fuente de verdad. Solo se renderizan secciones activas con contenido,
    // alternando fondo blanco / gris para un ritmo visual limpio.
    const data = { categories, faqs, services, locations, novedades, resenas, resenasResumen };
    const seen = new Set();
    let light = 0;

    // Las vitrinas elegidas a mano (Colecciones) se reservan sus productos antes que nadie: se eligieron para ahí,
    // así que no se los puede comer un carrusel de más arriba. Igual cada producto sale una sola vez en la portada.
    (sections ?? []).forEach((section) => {
        if (section.type !== 'product_collection') return;
        (section.products ?? []).forEach((p) => seen.add(p.key));
    });

    const rendered = (sections ?? [])
        .map((section) => {
            if (!SECCIONES_DE_PRODUCTOS.has(section.type)) {
                return { section, products: null, visible: hasContent(section, data) };
            }
            const curada = section.type === 'product_collection';
            const lista = section.products ?? [];
            const products = curada ? lista : lista.filter((p) => !seen.has(p.key));
            if (!curada) products.forEach((p) => seen.add(p.key));
            return { section, products, visible: products.length > 0 };
        })
        .filter(({ visible }) => visible)
        .map(({ section, products }) => ({
            section,
            products,
            tone: section.type in FIXED_TONE ? FIXED_TONE[section.type] : (light++ % 2 === 0 ? 'white' : 'muted'),
        }));

    // Los datos del negocio para Google ya NO se pintan acá. Los imprime el servidor en el <head>
    // (App\Support\Seo\DatosEstructurados), así Google los lee sin ejecutar JavaScript y —sobre todo—
    // existe un solo Store para la tienda. Tener dos le impedía saber cuál es el negocio de verdad.

    return (
        <StoreLayout>
            {rendered.map(({ section, products, tone }) => (
                <SectionRenderer
                    key={section.id}
                    section={section}
                    products={products}
                    tone={tone}
                    featured={featured}
                    categories={categories}
                    totalAvailable={totalAvailable}
                    faqs={faqs}
                    services={services}
                    locations={locations}
                    novedades={novedades}
                    resenas={resenas}
                    resenasResumen={resenasResumen}
                />
            ))}
        </StoreLayout>
    );
}
