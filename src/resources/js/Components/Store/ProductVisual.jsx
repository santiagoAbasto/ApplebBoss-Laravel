import { Headphones, Laptop, Package, Smartphone, Watch } from 'lucide-react';

// Placeholders de marca por tipo — solo cuando no hay foto
const PLACEHOLDERS = {
    celular:          { bg: 'linear-gradient(145deg,#E8EBF5,#D0D5EE)', Icon: Smartphone, ink: '#011446' },
    computadora:      { bg: 'linear-gradient(145deg,#EAEAF2,#D5D5E8)', Icon: Laptop,     ink: '#28224F' },
    'producto-apple': { bg: 'linear-gradient(145deg,#E5E8F5,#CDD3EE)', Icon: Watch,      ink: '#011446' },
    'producto-general':{ bg: 'linear-gradient(145deg,#EEF2E5,#DDE8C8)', Icon: Headphones, ink: '#1A2A00' },
};

function BrandCircles({ isMyskin }) {
    if (isMyskin) return (
        <>
            <div className="absolute right-3 top-3 h-6 w-6 rounded-full opacity-50"  style={{ background: '#A3BD31' }} />
            <div className="absolute right-7 top-6 h-3 w-3 rounded-full opacity-30"  style={{ background: '#0C1B47' }} />
        </>
    );
    return (
        <>
            <div className="absolute right-4 top-4 h-5 w-5 rounded-full opacity-[0.18]" style={{ background: '#585E9F' }} />
            <div className="absolute right-8 top-7 h-2.5 w-2.5 rounded-full opacity-[0.12]" style={{ background: '#011446' }} />
        </>
    );
}

function Placeholder({ product, compact, isMyskin }) {
    const cfg = PLACEHOLDERS[product.type] ?? { bg: 'linear-gradient(145deg,#F0F0F5,#E0E0EE)', Icon: Package, ink: '#28224F' };
    const Icon = cfg.Icon;
    return (
        <div className="relative grid h-full w-full place-items-center overflow-hidden" style={{ background: cfg.bg }} aria-hidden="true">
            <BrandCircles isMyskin={isMyskin} />
            <div className="absolute inset-x-0 bottom-0 h-1/4" style={{ background: 'rgba(255,255,255,0.20)' }} />
            <Icon strokeWidth={compact ? 1.4 : 1.1} className={compact ? 'h-14 w-14' : 'h-[42%] w-[42%]'} style={{ color: cfg.ink }} />
            {!compact && (
                <span className="absolute bottom-4 left-4 text-[10px] font-bold uppercase tracking-[0.16em] opacity-35" style={{ color: cfg.ink }}>
                    {product.category_label}
                </span>
            )}
        </div>
    );
}

/**
 * ProductVisual — FOTO primero, placeholder editorial si no hay imagen.
 * Props:
 *   product.images   — array de objetos { url_card, url_detail, url_thumb, alt, es_principal }
 *   product.type     — para elegir placeholder correcto
 *   compact          — para el mini-visual del carrito
 *   style / className — forwarded al wrapper
 */
export default function ProductVisual({ product, className = '', compact = false, style }) {
    const isMyskin = product.is_myskin ?? false;

    // Imagen principal: primer elemento marcado como principal, o el primero disponible
    const images  = product.images ?? [];
    const primary = images.find((i) => i.es_principal) ?? images[0] ?? null;
    const src     = compact ? primary?.url_thumb : primary?.url_card;
    const alt     = primary?.alt || product.name || 'Producto Apple Boss';

    return (
        <div
            style={style}
            className={`relative overflow-hidden ${className}`}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    width={compact ? 80 : 600}
                    height={compact ? 80 : 600}
                    loading={compact ? 'lazy' : undefined}
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            ) : (
                <Placeholder product={product} compact={compact} isMyskin={isMyskin} />
            )}

            {/* Badge MYSKIN — solo en vista card (no compact) cuando es funda */}
            {isMyskin && !compact && (
                <span
                    className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide"
                    style={{ background: '#A3BD31', color: '#0C1B47' }}
                >
                    MYSKIN
                </span>
            )}
        </div>
    );
}
