import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft, ArrowRight, BadgeCheck, ChevronDown, Exchange,
    MapPin, MessageCircle, Scan, ShieldCheck, Smartphone, Watch,
} from '@/Components/Store/Icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StoreLayout, { StoreContainer, money, useStoreCart, useWhatsApp } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';
import ProductVisual from '@/Components/Store/ProductVisual';
import TarjetaCategoria from '@/Components/Store/TarjetaCategoria';
import TarjetaServicio, { columnasServicios } from '@/Components/Store/TarjetaServicio';
import TarjetaNovedad, { columnasNovedades } from '@/Components/Store/TarjetaNovedad';
import { FichaUbicacion, MapaUbicacion, SelectorLocales } from '@/Components/Store/Ubicacion';
import TrustMarquee from '@/Components/Store/TrustMarquee';
import Reveal from '@/Components/Store/Reveal';
import { esExterno } from '@/Components/Store/enlaces';
import { nombreTienda, useNombreTienda } from '@/Components/Store/tienda';

// ─── Hero ─────────────────────────────────────────────────────────────────────
// Cada lámina muestra un destacado de su categoría. El globo de «Especificaciones» sale de la ficha de ese producto;
// sin producto, la lámina dice algo general de la categoría (antes decía «A17 Pro» o «M3 Pro» sobre cualquier equipo).
const SLIDE_CONFIGS = [
    { bg: '#050E2E', glow: '#585E9F', accent: '#7B82D8', label: 'iPHONE',    elige: (p) => p.category === 'celulares',       img: '/images/hero/iphone.svg',   spec: 'Nuevos y seminuevos' },
    { bg: '#071435', glow: '#A3BD31', accent: '#C6CB36', label: 'MAC',       elige: (p) => p.category === 'computadoras',    img: '/images/hero/macbook.svg',  spec: 'Nuevas y seminuevas' },
    { bg: '#060E28', glow: '#7B82C8', accent: '#9EA5E8', label: 'MÁS APPLE', elige: (p) => p.category === 'productos-apple', img: '/images/hero/airpods.svg',  spec: 'iPad, Apple Watch y AirPods' },
    { bg: '#0E0820', glow: '#C6CB36', accent: '#A3BD31', label: 'MYSKIN',    elige: (p) => p.is_myskin,                      img: '/images/hero/myskin.svg',   spec: 'Protección premium · Bolivia' },
];

/** Dato del globo: chip y capacidad del equipo (o los primeros datos de su ficha). Nunca un texto fijo. */
function especificacionDe(product) {
    const a = product?.atributos ?? {};
    const datos = [a.chip, a.capacidad ?? a.almacenamiento].filter(Boolean);
    return (datos.length ? datos : (product?.specs ?? []).slice(0, 2)).join(' · ');
}

const CARD_TR = { duration: 0.58, ease: [0.32, 0.72, 0, 1] };

const GRAIN_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.055'/></svg>`
);

// ─── iPhone 15 Pro frame SVG (front face, transparent screen area) ────────────
function IPhoneFrame({ glow, accent }) {
    const id = `ph_${Math.random().toString(36).slice(2, 6)}`;
    return (
        <svg viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
                <linearGradient id={`${id}_body`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#2E2E32"/>
                    <stop offset="22%"  stopColor="#48484F"/>
                    <stop offset="50%"  stopColor="#3A3A40"/>
                    <stop offset="78%"  stopColor="#242428"/>
                    <stop offset="100%" stopColor="#1A1A1E"/>
                </linearGradient>
                <linearGradient id={`${id}_rim`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="rgba(255,255,255,0.22)"/>
                    <stop offset="50%"  stopColor="rgba(255,255,255,0.06)"/>
                    <stop offset="100%" stopColor="rgba(255,255,255,0.18)"/>
                </linearGradient>
                <linearGradient id={`${id}_reflect`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="rgba(255,255,255,0.12)"/>
                    <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                </linearGradient>
                <filter id={`${id}_glow`}>
                    <feGaussianBlur stdDeviation="18" result="b"/>
                    <feComposite in="SourceGraphic" in2="b" operator="over"/>
                </filter>
                <radialGradient id={`${id}_botglow`} cx="50%" cy="100%" r="60%">
                    <stop offset="0%"   stopColor={glow} stopOpacity="0.5"/>
                    <stop offset="100%" stopColor={glow} stopOpacity="0"/>
                </radialGradient>
            </defs>

            {/* Bottom ambient glow */}
            <ellipse cx="195" cy="860" rx="160" ry="50" fill={`url(#${id}_botglow)`}/>

            {/* Phone body — full rect with screen hole (evenodd) */}
            <path fillRule="evenodd"
                d="M0 64 Q0 0 64 0 H326 Q390 0 390 64 V780 Q390 844 326 844 H64 Q0 844 0 780 Z
                   M22 80 Q22 30 68 30 H322 Q368 30 368 80 V764 Q368 814 322 814 H68 Q22 814 22 764 Z"
                fill={`url(#${id}_body)`}/>

            {/* Rim highlight — top */}
            <path d="M64 1 Q0 1 1 64 L1 150 Q1 1 130 1 Z" fill={`url(#${id}_rim)`} opacity="0.6"/>

            {/* Rim highlight — left edge */}
            <rect x="0" y="64" width="2" height="650" fill={`url(#${id}_rim)`} opacity="0.5"/>

            {/* Rim highlight — right edge */}
            <rect x="388" y="64" width="2" height="650" fill="rgba(255,255,255,0.08)"/>

            {/* Dynamic Island */}
            <rect x="148" y="38" width="94" height="32" rx="16" fill="#050508"/>
            <circle cx="212" cy="54" r="10" fill="#0a0a10"/>
            <circle cx="212" cy="54" r="5.5" fill="#0f0f18" opacity="0.9"/>

            {/* Front camera (inside DI) */}
            <circle cx="196" cy="54" r="5" fill="#0a0a15"/>
            <circle cx="196" cy="54" r="2.5" fill="#141420" opacity="0.8"/>

            {/* Screen reflection overlay (top portion) */}
            <rect x="22" y="30" width="346" height="220" rx="46" fill={`url(#${id}_reflect)`} opacity="0.5"/>

            {/* Power button (right) */}
            <rect x="383" y="230" width="7" height="90" rx="3.5" fill="#2a2a30"/>
            <rect x="383" y="232" width="3" height="86" rx="1.5" fill="rgba(255,255,255,0.15)"/>

            {/* Volume buttons (left) */}
            <rect x="0"  y="190" width="7" height="52" rx="3.5" fill="#2a2a30"/>
            <rect x="0"  y="258" width="7" height="80" rx="3.5" fill="#2a2a30"/>
            <rect x="0"  y="352" width="7" height="80" rx="3.5" fill="#2a2a30"/>
            <rect x="4"  y="192" width="3" height="48" rx="1.5" fill="rgba(255,255,255,0.12)"/>
            <rect x="4"  y="260" width="3" height="76" rx="1.5" fill="rgba(255,255,255,0.12)"/>

            {/* Home indicator */}
            <rect x="160" y="810" width="70" height="5" rx="2.5" fill="rgba(200,200,220,0.3)"/>

            {/* Accent glow on edges */}
            <rect x="0" y="64" width="1" height="716" fill={accent} opacity="0.18"/>
            <rect x="389" y="64" width="1" height="716" fill={accent} opacity="0.1"/>
        </svg>
    );
}

// ─── MacBook backdrop SVG (outline only, decorative) ─────────────────────────
function MacBookBackdrop({ glow }) {
    return (
        <svg viewBox="0 0 900 560" xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.12 }}>
            <defs>
                <linearGradient id="mac_grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={glow} stopOpacity="0.9"/>
                    <stop offset="100%" stopColor={glow} stopOpacity="0.3"/>
                </linearGradient>
            </defs>
            {/* Lid */}
            <rect x="60" y="20" width="780" height="420" rx="14" fill="none" stroke="url(#mac_grad)" strokeWidth="2"/>
            {/* Screen bezel */}
            <rect x="80" y="38" width="740" height="384" rx="8" fill="none" stroke={glow} strokeWidth="1" opacity="0.5"/>
            {/* Hinge line */}
            <line x1="60" y1="440" x2="840" y2="440" stroke={glow} strokeWidth="1.5" opacity="0.6"/>
            {/* Base */}
            <rect x="20" y="440" width="860" height="90" rx="6" fill="none" stroke="url(#mac_grad)" strokeWidth="1.5"/>
            {/* Trackpad */}
            <rect x="360" y="464" width="180" height="52" rx="8" fill="none" stroke={glow} strokeWidth="1" opacity="0.4"/>
            {/* Keyboard area suggestion */}
            <rect x="60" y="452" width="780" height="10" rx="2" fill="none" stroke={glow} strokeWidth="0.5" opacity="0.3"/>
        </svg>
    );
}

// ─── Floating mini card (side product) ───────────────────────────────────────
function MiniCard({ slide, product }) {
    const img = product?.images?.find((i) => i.es_principal) ?? product?.images?.[0];
    const src = img?.url_card ?? slide.img;
    return (
        <div style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)', position: 'relative' }}>
            <img src={src} alt={product?.name ?? slide.label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
            <p style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 800, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                {product?.name?.split(' ').slice(0, 3).join(' ') ?? slide.label}
            </p>
        </div>
    );
}

// Colores de la portada grande (Portada → «Portada grande» → Colores). El azul deja a cada lámina con su tono;
// MYSKIN usa el morado y el lima de la sub-marca; el claro pasa a fondo claro con letras azules.
const TEMAS_HERO = {
    appleboss_navy: { oscuro: true },
    myskin: { oscuro: true, bg: '#0E0820', glow: '#A3BD31', accent: '#C6CB36' },
    light: { oscuro: false, bg: '#F3F4F8' },
};

/** Un enlace de la portada: una página de la tienda en la misma pestaña, otro sitio en una nueva. */
const destino = (url) => (esExterno(url) ? { href: url, target: '_blank', rel: 'noreferrer' } : { href: url });

function Hero({ featured, totalAvailable, cmsSettings = {} }) {
    const tema = TEMAS_HERO[cmsSettings.tema] ?? TEMAS_HERO.appleboss_navy;
    const slides = SLIDE_CONFIGS.map((base) => {
        const cfg = { ...base, ...(tema.bg ? { bg: tema.bg } : {}), ...(tema.glow ? { glow: tema.glow, accent: tema.accent } : {}) };
        return { cfg, product: (featured ?? []).find(base.elige) ?? null };
    });
    const count  = slides.length;

    // Lo que se escribe en Portada → «Portada grande». Sin texto, la portada queda como siempre: solo los equipos.
    const volanta = (cmsSettings.eyebrow ?? '').trim();
    const titulo  = (cmsSettings.titulo ?? '').trim();
    const texto   = (cmsSettings.descripcion ?? '').trim();
    const cta2    = (cmsSettings.cta2_label ?? '').trim() && (cmsSettings.cta2_url ?? '').trim()
        ? { label: cmsSettings.cta2_label.trim(), url: cmsSettings.cta2_url.trim() }
        : null;
    const conTexto = Boolean(volanta || titulo || texto);

    const tinta      = tema.oscuro ? '#fff' : '#011446';
    const tintaSuave = tema.oscuro ? 'rgba(255,255,255,0.68)' : 'rgba(1,20,70,0.66)';
    const vidrio     = tema.oscuro
        ? { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }
        : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(1,20,70,0.12)' };

    const [active, setActive]   = useState(0);
    const [ancho, setAncho]     = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
    const isMobile = ancho < 768;
    // Con texto, hasta 1280 px el texto va arriba y el equipo más chico debajo: nunca uno encima del otro
    const compacto = ancho < 1280;
    const bloqueTexto = useRef(null);
    const [altoTexto, setAltoTexto] = useState(0);
    const isAnimating = useRef(false);
    const autoRef     = useRef(null);

    useEffect(() => {
        const fn = () => setAncho(window.innerWidth);
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);

    useEffect(() => {
        if (!conTexto || !compacto || !bloqueTexto.current || typeof ResizeObserver === 'undefined') {
            setAltoTexto(0);
            return undefined;
        }
        const obs = new ResizeObserver(([e]) => setAltoTexto(Math.ceil(e.contentRect.height)));
        obs.observe(bloqueTexto.current);
        return () => obs.disconnect();
    }, [conTexto, compacto]);

    const go = useCallback((dir) => {
        if (isAnimating.current) return;
        isAnimating.current = true;
        setActive((p) => dir === 'next' ? (p + 1) % count : (p + count - 1) % count);
        setTimeout(() => { isAnimating.current = false; }, 580);
    }, [count]);

    const resetAuto = useCallback(() => {
        clearInterval(autoRef.current);
        autoRef.current = setInterval(() => go('next'), 5000);
    }, [go]);

    useEffect(() => { resetAuto(); return () => clearInterval(autoRef.current); }, [resetAuto]);

    useEffect(() => {
        const fn = (e) => {
            if (e.key === 'ArrowRight') { go('next'); resetAuto(); }
            if (e.key === 'ArrowLeft')  { go('prev'); resetAuto(); }
        };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [go, resetAuto]);

    const { cfg: activeCfg, product: activeProd } = slides[active];
    const leftIdx  = (active + count - 1) % count;
    const rightIdx = (active + 1) % count;
    const ctaUrl   = cmsSettings.cta_url || '/catalogo';

    // Active product image
    const fotoDelProducto = (() => {
        const img = activeProd?.images?.find((i) => i.es_principal) ?? activeProd?.images?.[0];
        return img?.url_medium ?? img?.url_card ?? null;
    })();
    const activeImg = fotoDelProducto ?? activeCfg.img;

    // Phone frame dimensions (responsive). Con texto en pantalla angosta, el equipo se achica para que entre debajo.
    const phoneW = conTexto && compacto ? (isMobile ? 170 : 220) : (isMobile ? 210 : 280);
    const phoneH = Math.round(phoneW * (844 / 390));
    // En computadora el texto usa el espacio libre a la izquierda del equipo
    const anchoTexto = `min(460px, calc(50vw - ${phoneW / 2}px - max(0px, (100vw - 1224px) / 2) - 88px))`;

    return (
        <section
            aria-label="Carrusel principal"
            // isolation: las capas de adentro (grano, texto, puntos) no se montan sobre el encabezado fijo al bajar
            style={{ position: 'relative', isolation: 'isolate', width: '100%', overflow: 'hidden', backgroundColor: activeCfg.bg, transition: 'background-color 600ms cubic-bezier(0.4,0,0.2,1)' }}
        >
            <div style={{ position: 'relative', height: '100svh', minHeight: 600, overflow: 'hidden' }}>

                {/* ── Background glow blobs ── */}
                {slides.map(({ cfg }, i) => (
                    <div key={i} style={{
                        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                        background: `radial-gradient(ellipse 70% 55% at 50% 5%, ${cfg.glow}45 0%, transparent 60%)`,
                        opacity: i === active ? 1 : 0, transition: 'opacity 600ms ease',
                    }} />
                ))}
                {/* Second blob — bottom accent */}
                {slides.map(({ cfg }, i) => (
                    <div key={`b${i}`} style={{
                        position: 'absolute', bottom: 0, left: '25%', right: '25%', height: '40%', zIndex: 1, pointerEvents: 'none',
                        background: `radial-gradient(ellipse 100% 80% at 50% 100%, ${cfg.accent ?? cfg.glow}30 0%, transparent 70%)`,
                        opacity: i === active ? 1 : 0, transition: 'opacity 600ms ease',
                    }} />
                ))}

                {/* ── Header vignette ── */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, zIndex: 4, pointerEvents: 'none', background: tema.oscuro ? 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' : 'linear-gradient(to bottom, rgba(255,255,255,0.7), transparent)' }} />

                {/* ── Grain ── */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none', opacity: tema.oscuro ? 0.35 : 0.12, backgroundImage: `url("${GRAIN_SVG}")`, backgroundSize: '200px 200px' }} />

                {/* ── Texto de la portada (Portada → «Portada grande») ── */}
                {conTexto && (
                    <div ref={bloqueTexto} style={{ position: 'absolute', top: compacto ? 20 : 'clamp(28px, 6vh, 64px)', left: 0, right: 0, zIndex: 55, pointerEvents: 'none' }}>
                        <StoreContainer>
                            <div style={{ maxWidth: compacto ? '100%' : anchoTexto, pointerEvents: 'auto' }}>
                                {volanta && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...vidrio, borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: tema.oscuro ? activeCfg.accent ?? activeCfg.glow : '#011446', marginBottom: 12 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeCfg.glow, display: 'inline-block' }} />
                                        {volanta}
                                    </span>
                                )}
                                {titulo && (
                                    <h1 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 900, fontSize: compacto ? 'clamp(24px, 6.4vw, 34px)' : 'clamp(30px, 2.8vw, 44px)', lineHeight: 1.04, letterSpacing: '-0.005em', textTransform: 'uppercase', color: tinta, margin: 0, textShadow: tema.oscuro ? '0 2px 16px rgba(0,0,0,0.45)' : 'none', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {titulo}
                                    </h1>
                                )}
                                {texto && (
                                    <p style={{ fontSize: compacto ? 13 : 15, lineHeight: 1.55, color: tintaSuave, margin: titulo ? '10px 0 0' : 0, display: '-webkit-box', WebkitLineClamp: compacto ? 2 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {texto}
                                    </p>
                                )}
                                {cta2 && compacto && (
                                    <a {...destino(cta2.url)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, fontWeight: 800, color: tinta, textDecoration: 'none' }}>
                                        {cta2.label} <ArrowRight size={14} strokeWidth={2.2} color={tinta} />
                                    </a>
                                )}
                            </div>
                        </StoreContainer>
                    </div>
                )}

                {/* ── Ghost word ── */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', paddingBottom: '5%' }}>
                    <AnimatePresence mode="popLayout">
                        <motion.span key={activeCfg.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 0.045, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.06 }}
                            transition={{ duration: 0.5 }}
                            style={{ fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 900, fontSize: 'clamp(100px,28vw,420px)', color: tinta, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.03em', whiteSpace: 'nowrap', textAlign: 'center' }}
                        >
                            {activeCfg.label}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* ── MacBook backdrop (desktop) ── */}
                {!isMobile && (
                    <motion.div
                        initial={false}
                        animate={{ opacity: 1 }}
                        style={{ position: 'absolute', bottom: '-8%', left: '5%', right: '5%', height: '75%', zIndex: 2, pointerEvents: 'none' }}
                    >
                        <MacBookBackdrop glow={activeCfg.glow} />
                    </motion.div>
                )}

                {/* ── Center phone stage ── */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: conTexto && compacto ? altoTexto + 24 : 0, paddingBottom: isMobile ? (conTexto ? '30%' : '12%') : '6%' }}>

                    {/* Left mini card */}
                    {!isMobile && (
                        <motion.div
                            key={`left_${leftIdx}`}
                            initial={{ opacity: 0, x: -40, rotateY: 20 }}
                            animate={{ opacity: 0.75, x: 0, rotateY: 20 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={CARD_TR}
                            style={{ position: 'absolute', left: 'calc(50% - 340px)', width: 140, height: 196, transformOrigin: 'right center', perspective: 800, filter: 'blur(0.5px)' }}
                        >
                            <MiniCard slide={slides[leftIdx].cfg} product={slides[leftIdx].product} />
                        </motion.div>
                    )}

                    {/* ── iPhone frame + product image ── */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'relative', width: phoneW, height: phoneH, flexShrink: 0, zIndex: 20, filter: tema.oscuro
                            ? `drop-shadow(0 40px 80px ${activeCfg.glow}60) drop-shadow(0 80px 120px rgba(0,0,0,0.8))`
                            // En fondo claro, la sombra negra deja una nube gris alrededor del equipo
                            : `drop-shadow(0 30px 60px ${activeCfg.glow}40) drop-shadow(0 40px 70px rgba(1,20,70,0.22))` }}
                    >
                        {/* Product image fills the screen area (behind frame) */}
                        <AnimatePresence mode="wait">
                            <motion.div key={active}
                                initial={{ opacity: 0, scale: 1.06 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.94 }}
                                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                                style={{ position: 'absolute', top: '3.6%', left: '5.7%', width: '88.7%', height: '92.8%', overflow: 'hidden', borderRadius: '11.5% / 5.3%' }}
                            >
                                <img src={activeImg} alt={activeProd?.name ?? activeCfg.label}
                                    loading="eager"
                                    // Sin foto del producto se usa el dibujo de la categoría (una MacBook es horizontal):
                                    // se muestra entero en la pantalla en vez de recortarlo hasta dejarla vacía
                                    style={fotoDelProducto
                                        ? { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%', display: 'block' }
                                        : { width: '100%', height: '100%', objectFit: 'contain', padding: '14%', boxSizing: 'border-box', display: 'block' }}
                                />
                                {/* Screen vignette */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.35) 100%)' }} />
                                {/* Screen tint overlay (brand color) */}
                                <div style={{ position: 'absolute', inset: 0, background: activeCfg.glow, opacity: 0.04, mixBlendMode: 'overlay' }} />
                            </motion.div>
                        </AnimatePresence>

                        {/* iPhone frame SVG overlay */}
                        <IPhoneFrame glow={activeCfg.glow} accent={activeCfg.accent ?? activeCfg.glow} />

                        {/* Floating condition badge */}
                        {activeProd?.condition && activeProd.condition !== 'Nuevo' && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                style={{ position: 'absolute', top: '8%', right: '-28%', ...vidrio, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRadius: 24, padding: '6px 16px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: tinta, whiteSpace: 'nowrap', zIndex: 30 }}
                            >
                                {activeProd.condition}
                            </motion.div>
                        )}

                        {/* Floating spec badge */}
                        <AnimatePresence mode="wait">
                            <motion.div key={`spec_${active}`}
                                initial={{ opacity: 0, x: 20, y: -8 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.35, delay: 0.15 }}
                                style={{ position: 'absolute', top: isMobile ? '14%' : '22%', right: isMobile ? '-32%' : '-38%', background: `linear-gradient(135deg, ${activeCfg.glow}22, ${activeCfg.glow}08)`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${activeCfg.glow}40`, borderRadius: 20, padding: '8px 18px', zIndex: 30, whiteSpace: 'nowrap' }}
                            >
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: activeCfg.glow, marginBottom: 3 }}>{activeProd && especificacionDe(activeProd) ? 'ESPECIFICACIONES' : 'EN APPLE BOSS'}</p>
                                <p style={{ fontSize: 11, fontWeight: 800, color: tinta, letterSpacing: '0.02em' }}>{(activeProd && especificacionDe(activeProd)) || activeCfg.spec}</p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Price badge (left side) */}
                        {activeProd?.price > 0 && (
                            <AnimatePresence mode="wait">
                                <motion.div key={`price_${active}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.35, delay: 0.2 }}
                                    style={{ position: 'absolute', bottom: '22%', left: isMobile ? '-40%' : '-50%', background: 'var(--ab-lime)', borderRadius: 20, padding: '10px 20px', zIndex: 30, whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                                >
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.55)', marginBottom: 2 }}>PRECIO</p>
                                    <p style={{ fontSize: 16, fontWeight: 900, color: '#0a1a00', letterSpacing: '-0.02em' }}>{money(activeProd.price)}</p>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </motion.div>

                    {/* Right mini card */}
                    {!isMobile && (
                        <motion.div
                            key={`right_${rightIdx}`}
                            initial={{ opacity: 0, x: 40, rotateY: -20 }}
                            animate={{ opacity: 0.75, x: 0, rotateY: -20 }}
                            exit={{ opacity: 0, x: 40 }}
                            transition={CARD_TR}
                            style={{ position: 'absolute', right: 'calc(50% - 340px)', width: 140, height: 196, transformOrigin: 'left center', perspective: 800, filter: 'blur(0.5px)' }}
                        >
                            <MiniCard slide={slides[rightIdx].cfg} product={slides[rightIdx].product} />
                        </motion.div>
                    )}
                </div>

                {/* ── Dot navigation ── */}
                <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 60 }}>
                    {slides.map((_, i) => (
                        <motion.button key={i}
                            onClick={() => { setActive(i); resetAuto(); }}
                            aria-label={`Slide ${i + 1}`}
                            animate={{ width: i === active ? 24 : 6, backgroundColor: i === active ? tinta : (tema.oscuro ? 'rgba(255,255,255,0.28)' : 'rgba(1,20,70,0.22)') }}
                            transition={{ duration: 0.2 }}
                            style={{ height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0 }}
                        />
                    ))}
                </div>

                {/* ── Bottom bar: info + flechas + CTA — alineado al contenedor de 1224px ── */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60, background: tema.oscuro ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' : 'linear-gradient(to top, rgba(243,244,248,0.96) 0%, transparent 100%)', paddingTop: isMobile ? 32 : 48, paddingBottom: isMobile ? 24 : 32 }}>
                    <StoreContainer className="flex items-end justify-between gap-4">
                        {/* Product info */}
                        <div style={{ minWidth: 0 }}>
                            <AnimatePresence mode="wait">
                                <motion.div key={active}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <span
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${activeCfg.glow}25`, border: `1px solid ${activeCfg.glow}50`, borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: activeCfg.glow, marginBottom: 8 }}
                                    >
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: activeCfg.glow, display: 'inline-block' }} />
                                        {activeCfg.label}
                                    </span>

                                    <p style={{ fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 900, fontSize: isMobile ? 22 : 32, letterSpacing: '0.02em', textTransform: 'uppercase', color: tinta, lineHeight: 1.1, textShadow: tema.oscuro ? '0 2px 12px rgba(0,0,0,0.5)' : 'none', margin: '0 0 4px' }}>
                                        {activeProd?.name ?? activeCfg.label}
                                    </p>

                                    {activeProd?.specs?.length > 0 && !isMobile && (
                                        <p style={{ fontSize: 12, color: tintaSuave, lineHeight: 1.6, margin: 0 }}>
                                            {activeProd.specs.slice(0, 3).join(' · ')}
                                        </p>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                {[['prev', ArrowLeft], ['next', ArrowRight]].map(([dir, Icon]) => (
                                    <motion.button key={dir}
                                        onClick={() => { go(dir); resetAuto(); }}
                                        aria-label={dir === 'prev' ? 'Anterior' : 'Siguiente'}
                                        whileHover={{ scale: 1.08, backgroundColor: tema.oscuro ? 'rgba(255,255,255,0.16)' : 'rgba(1,20,70,0.08)' }}
                                        whileTap={{ scale: 0.88 }}
                                        style={{ width: isMobile ? 42 : 48, height: isMobile ? 42 : 48, borderRadius: '50%', border: `1.5px solid ${tema.oscuro ? 'rgba(255,255,255,0.35)' : 'rgba(1,20,70,0.25)'}`, background: tema.oscuro ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
                                    >
                                        <Icon size={isMobile ? 16 : 19} strokeWidth={2} color={tinta} />
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* CTA: el segundo botón (si se cargó en Portada) va antes del principal */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, flexShrink: 0 }}>
                        {cta2 && !compacto && (
                            <motion.a {...destino(cta2.url)}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', borderRadius: 999, padding: '10px 18px', ...vidrio, color: tinta, fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}
                            >
                                {cta2.label} <ArrowRight size={16} strokeWidth={2.2} color={tinta} />
                            </motion.a>
                        )}
                        <motion.a {...destino(ctaUrl)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}
                        >
                            <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: 'clamp(15px,2.5vw,36px)', fontWeight: 900, letterSpacing: '-0.01em', textTransform: 'uppercase', color: tema.oscuro ? 'rgba(255,255,255,0.9)' : '#011446', textShadow: tema.oscuro ? '0 2px 8px rgba(0,0,0,0.4)' : 'none', whiteSpace: 'nowrap' }}>
                                {cmsSettings.cta_label || 'Ver catálogo'}
                            </span>
                            <span style={{ width: isMobile ? 38 : 48, height: isMobile ? 38 : 48, borderRadius: '50%', background: 'var(--ab-lime)', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 4px 24px rgba(198,203,54,0.4)' }}>
                                <ArrowRight size={isMobile ? 17 : 22} strokeWidth={2.2} color="#0a1a00" />
                            </span>
                        </motion.a>
                        </div>
                    </StoreContainer>
                </div>
            </div>
        </section>
    );
}

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
    return (
        <Section tone={tone} id="faq" labelledBy="home-faq">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-16">
                <div>
                    <SectionHeading id="home-faq" eyebrow="Ayuda" title="Preguntas frecuentes" subtitle="Lo que más nos consultan antes de comprar." />
                    {wa.enabled && wa.number && (
                        <a href={wa.url(`${wa.saludo} tengo una consulta`)} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-75" style={{ color: 'var(--ab-navy)' }}>
                            <MessageCircle className="h-4 w-4" /> ¿Otra consulta? Escríbenos
                        </a>
                    )}
                </div>
                <div className="border-t" style={{ borderColor: 'var(--border-light)' }}>
                    {items.map((item) => (
                        <details key={item.id} className="group border-b py-5" style={{ borderColor: 'var(--border-light)' }}>
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden" style={{ color: 'var(--text-primary)' }}>
                                {item.question}
                                <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180" style={{ color: 'var(--text-muted)' }} />
                            </summary>
                            <p className="mt-3 pr-9 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.answer}</p>
                        </details>
                    ))}
                </div>
            </div>
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
        case 'hero': case 'trust': case 'trade_in':
            return true;
        default: return false;
    }
}

// ─── Renderer de sección por tipo ────────────────────────────────────────────
function SectionRenderer({ section, products, tone, featured, categories, totalAvailable, faqs, services, locations, novedades }) {
    const s = section.settings ?? {};
    const hid = `home-sec-${section.id}`;
    const nombre = useNombreTienda();
    switch (section.type) {
        case 'hero':
            return <Hero featured={featured} totalAvailable={totalAvailable} cmsSettings={s} />;
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
        default:
            return null;
    }
}

// ─── Página principal ──────────────────────────────────────────────────────────
const FIXED_TONE = { hero: null, trust: null, myskin: 'dark' };

export default function Home({ sections, featured, categories, totalAvailable, faqs, services, locations, novedades }) {
    const { tienda } = usePage().props;
    // El título y la metaetiqueta del inicio los escribe el servidor con App\Support\Seo (se editan en Marketing y
    // Google → «Google y redes sociales»). Acá solo van los datos del negocio que lee Google.
    const nombre = nombreTienda(tienda);

    // CMS es la fuente de verdad. Solo se renderizan secciones activas con contenido,
    // alternando fondo blanco / gris para un ritmo visual limpio.
    const data = { categories, faqs, services, locations, novedades };
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

    // Lo que lee Google del negocio: cada local encendido con su dirección y su horario día por día (Tienda online →
    // Ubicaciones). Sin locales, solo el nombre de la tienda: nada de direcciones ni horarios de ejemplo.
    const datosGoogle = (locations ?? []).map((l) => l.google).filter(Boolean);
    const localBusiness = datosGoogle.length > 0
        ? { '@context': 'https://schema.org', '@graph': datosGoogle }
        : {
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: nombre,
            description: tienda?.tienda_descripcion ?? undefined,
            telephone: tienda?.whatsapp_enabled && tienda?.whatsapp_numero ? `+${tienda.whatsapp_numero}` : undefined,
            url: typeof window !== 'undefined' ? window.location.origin : '',
        };

    return (
        <StoreLayout>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
            />

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
                />
            ))}
        </StoreLayout>
    );
}
