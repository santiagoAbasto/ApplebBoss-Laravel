import { Headphones, Laptop, Package, Smartphone, Watch } from '@/Components/Store/Icons';
import AccesorioVisual from '@/Components/Store/AccesorioVisual';
import { useNombreTienda } from '@/Components/Store/tienda';

// Placeholders por tipo — solo cuando no hay foto. Fondo blanco como las fotos: todas las cards quedan iguales,
// solo cambia el ícono (gris suave) para avisar que falta la foto.
const PLACEHOLDERS = {
    celular:          { Icon: Smartphone },
    computadora:      { Icon: Laptop },
    producto_apple:   { Icon: Watch },
    producto_general: { Icon: Headphones },
};
const PH_BG  = 'var(--surface-white)';
const PH_INK = '#C3C7D6'; // ícono gris suave sobre blanco

// Fondo de las ilustraciones de accesorios: blanco, igual que las fotos.
const FONDO_ACCESORIO = 'var(--surface-white)';

function Placeholder({ product, compact }) {
    // Accesorio o producto Apple con ficha: la ilustración de su tipo (cargador, vidrio, iPad, AirPods…)
    if (['producto_general', 'producto_apple'].includes(product.type) && product.visual) {
        return (
            <div className="relative h-full w-full overflow-hidden" style={{ background: FONDO_ACCESORIO }} aria-hidden="true">
                <AccesorioVisual visual={product.visual} />
            </div>
        );
    }
    const cfg = PLACEHOLDERS[product.type] ?? { Icon: Package };
    const Icon = cfg.Icon;
    return (
        <div className="relative grid h-full w-full place-items-center overflow-hidden" style={{ background: PH_BG }} aria-hidden="true">
            <Icon strokeWidth={compact ? 1.4 : 1.1} className={compact ? 'h-14 w-14' : 'h-[36%] w-[36%]'} style={{ color: PH_INK }} />
            {!compact && (
                <span className="absolute bottom-4 left-4 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: PH_INK }}>
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
export default function ProductVisual({ product, className = '', compact = false, style, priority = false }) {
    const nombre = useNombreTienda();
    const isMyskin = product.is_myskin ?? false;

    // Imagen principal: primer elemento marcado como principal, o el primero disponible
    const images  = product.images ?? [];
    const primary = images.find((i) => i.es_principal) ?? images[0] ?? null;
    const src     = compact ? primary?.url_thumb : primary?.url_card;
    const alt     = primary?.alt || product.name || `Producto ${nombre}`;

    return (
        <div
            style={{ background: 'var(--surface-white)', ...style }}
            className={`relative overflow-hidden ${className}`}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    width={compact ? 80 : 600}
                    height={compact ? 80 : 600}
                    loading={priority ? 'eager' : 'lazy'}
                    fetchpriority={priority ? 'high' : undefined}
                    decoding={priority ? 'sync' : 'async'}
                    className={`h-full w-full object-contain ${compact ? '' : 'p-[9%]'}`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            ) : (
                <Placeholder product={product} compact={compact} />
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
