// ─── Set de íconos Apple Boss ─────────────────────────────────────────────────
// SVG propios, trazo uniforme (1.6), esquinas redondeadas, grilla 24×24.
// Reemplaza lucide-react y emojis en toda la parte pública.
// API compatible con lucide: className, style, size, strokeWidth, color.

function makeIcon(name, children) {
    function Icon({ className = '', style, size, strokeWidth = 1.6, color = 'currentColor', title, ...rest }) {
        const dims = size ? { width: size, height: size } : {};
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                style={style}
                aria-hidden={title ? undefined : true}
                role={title ? 'img' : undefined}
                focusable="false"
                {...dims}
                {...rest}
            >
                {title && <title>{title}</title>}
                {children}
            </svg>
        );
    }
    Icon.displayName = name;
    return Icon;
}

// ─── Navegación ──────────────────────────────────────────────────────────────
export const ArrowRight   = makeIcon('ArrowRight',   <><path d="M4.5 12h15" /><path d="M13.5 6l6 6-6 6" /></>);
export const ArrowLeft    = makeIcon('ArrowLeft',    <><path d="M19.5 12h-15" /><path d="M10.5 6l-6 6 6 6" /></>);
export const ChevronDown  = makeIcon('ChevronDown',  <path d="M6 9.5l6 6 6-6" />);
export const ChevronUp    = makeIcon('ChevronUp',    <path d="M6 14.5l6-6 6 6" />);
export const ChevronLeft  = makeIcon('ChevronLeft',  <path d="M14.5 6l-6 6 6 6" />);
export const ChevronRight = makeIcon('ChevronRight', <path d="M9.5 6l6 6-6 6" />);
export const Menu         = makeIcon('Menu',         <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" /></>);
export const X            = makeIcon('X',            <><path d="M6.5 6.5l11 11" /><path d="M17.5 6.5l-11 11" /></>);
export const Plus         = makeIcon('Plus',         <><path d="M12 5v14" /><path d="M5 12h14" /></>);
export const Minus        = makeIcon('Minus',        <path d="M5 12h14" />);
export const Check        = makeIcon('Check',        <path d="M5 12.5l4.5 4.5L19 7.5" />);
export const Info         = makeIcon('Info',         <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 7.75h.01" strokeWidth="2.2" /></>);
export const Pause        = makeIcon('Pause',        <><path d="M9 6.5v11" /><path d="M15 6.5v11" /></>);
export const Play         = makeIcon('Play',         <path d="M8.5 6.25v11.5L18 12 8.5 6.25z" />);

// ─── Acciones ────────────────────────────────────────────────────────────────
export const Search = makeIcon('Search', <><circle cx="10.75" cy="10.75" r="6.25" /><path d="M15.5 15.5L20 20" /></>);
export const ZoomIn = makeIcon('ZoomIn', <><circle cx="10.75" cy="10.75" r="6.25" /><path d="M15.5 15.5L20 20" /><path d="M10.75 8.25v5" /><path d="M8.25 10.75h5" /></>);
export const SlidersHorizontal = makeIcon('SlidersHorizontal', <>
    <path d="M4 7.5h8.5" /><path d="M17.5 7.5H20" /><circle cx="15" cy="7.5" r="2.25" />
    <path d="M4 16.5h2.5" /><path d="M11.5 16.5H20" /><circle cx="9" cy="16.5" r="2.25" />
</>);
export const ShoppingBag = makeIcon('ShoppingBag', <>
    <path d="M5.5 8.5h13l-.85 10.65a1.5 1.5 0 0 1-1.5 1.35H7.85a1.5 1.5 0 0 1-1.5-1.35L5.5 8.5z" />
    <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
</>);
export const Trash2 = makeIcon('Trash2', <>
    <path d="M4.5 7h15" /><path d="M9.5 7V4.75h5V7" />
    <path d="M6.5 7l.8 11.6a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    <path d="M10.25 11v5" /><path d="M13.75 11v5" />
</>);
export const GitCompare = makeIcon('GitCompare', <>
    <path d="M8 19.5V5" /><path d="M5 8l3-3 3 3" />
    <path d="M16 4.5V19" /><path d="M13 16l3 3 3-3" />
</>);
export const Exchange = makeIcon('Exchange', <>
    <path d="M4.5 8.5h14" /><path d="M15.5 5.5l3 3-3 3" />
    <path d="M19.5 15.5h-14" /><path d="M8.5 12.5l-3 3 3 3" />
</>);
export const Mail = makeIcon('Mail', <>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="M4.5 7l7.5 5.5L19.5 7" />
</>);

// ─── Confianza / información ─────────────────────────────────────────────────
export const ShieldCheck = makeIcon('ShieldCheck', <>
    <path d="M12 3.25l7 2.75v5.25c0 4.4-2.9 7.9-7 9.5-4.1-1.6-7-5.1-7-9.5V6l7-2.75z" />
    <path d="M9 12l2.1 2.1L15.25 10" />
</>);
export const BadgeCheck = makeIcon('BadgeCheck', <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.25l2.4 2.4 4.6-4.9" />
</>);
export const MapPin = makeIcon('MapPin', <>
    <path d="M12 20.75s-6.75-5.9-6.75-11.1a6.75 6.75 0 0 1 13.5 0c0 5.2-6.75 11.1-6.75 11.1z" />
    <circle cx="12" cy="9.6" r="2.4" />
</>);
export const Clock = makeIcon('Clock', <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.75" /></>);
export const MessageCircle = makeIcon('MessageCircle', <>
    <path d="M20 11.6a8 8 0 0 1-11.7 7.1L4 20l1.3-4.1A8 8 0 1 1 20 11.6z" />
</>);
export const Phone = makeIcon('Phone', <path d="M8.15 3.75H5.7a1.95 1.95 0 0 0-1.95 2.05c.5 7.75 6.7 13.95 14.45 14.45a1.95 1.95 0 0 0 2.05-1.95v-2.45a1.25 1.25 0 0 0-.9-1.2l-2.95-.85a1.25 1.25 0 0 0-1.23.33l-1.27 1.27a12.3 12.3 0 0 1-5.35-5.35l1.27-1.27a1.25 1.25 0 0 0 .33-1.23l-.85-2.95a1.25 1.25 0 0 0-1.2-.9z" />);
export const Star = makeIcon('Star', <path d="M12 3.75l2.55 5.2 5.7.83-4.13 4.02.98 5.68L12 16.8l-5.1 2.68.98-5.68L3.75 9.78l5.7-.83L12 3.75z" />);
export const Zap = makeIcon('Zap', <path d="M13 3L5.5 13.25H11L10.25 21 18.5 10.75H13L13 3z" />);
export const Store = makeIcon('Store', <>
    <path d="M4.5 9.5L6 4.5h12l1.5 5" /><path d="M4.5 9.5h15" />
    <path d="M5.5 9.5V19.5h13V9.5" /><path d="M10 19.5v-5h4v5" />
</>);

// ─── Producto / logística ────────────────────────────────────────────────────
export const Package = makeIcon('Package', <>
    <path d="M12 3.25l8 4.5v8.5l-8 4.5-8-4.5v-8.5l8-4.5z" />
    <path d="M4 7.75l8 4.5 8-4.5" /><path d="M12 12.25v8.5" />
</>);
export const Box = Package;
export const Truck = makeIcon('Truck', <>
    <path d="M2.75 6.5h11v10h-11z" />
    <path d="M13.75 10h3.9l2.6 3v3.5h-6.5" />
    <circle cx="7" cy="17.25" r="1.75" /><circle cx="17" cy="17.25" r="1.75" />
</>);
// Entrega (ficha del producto): con relleno suave, para verse más grandes en su tarjeta
export const StorePickup = makeIcon('StorePickup', <>
    <path d="M3 8 5 4h14l2 4c0 1.4-1.1 2.2-2.25 2.2S16.5 9.4 16.5 8c0 1.4-1.1 2.2-2.25 2.2S12 9.4 12 8c0 1.4-1.1 2.2-2.25 2.2S7.5 9.4 7.5 8c0 1.4-1.1 2.2-2.25 2.2S3 9.4 3 8Z" fill="currentColor" fillOpacity="0.14" />
    <path d="M4.75 10.2V19.5h14.5v-9.3" />
    <path d="M10 19.5v-4a2 2 0 0 1 4 0v4" />
</>);
export const DeliveryTruck = makeIcon('DeliveryTruck', <>
    <rect x="6" y="5.5" width="9.5" height="9.5" rx="1.2" fill="currentColor" fillOpacity="0.14" />
    <path d="M15.5 9h3.1l2.4 3v3h-5.5" />
    <circle cx="9.5" cy="17" r="1.8" /><circle cx="18" cy="17" r="1.8" />
    <path d="M2 8.5h2.5" /><path d="M1.5 11.25H4" /><path d="M2.5 14h1.5" />
</>);
export const SecureBox = makeIcon('SecureBox', <>
    <path d="M12 2.8 20 7v9.9l-8 4.3-8-4.3V7l8-4.2Z" fill="currentColor" fillOpacity="0.14" />
    <path d="M4 7l8 4.2L20 7" /><path d="M12 11.2v10" /><path d="M8 4.9l8 4.2" />
    <path d="m14.2 16 1.5 1.4 2.6-3" />
</>);
export const Battery = makeIcon('Battery', <>
    <rect x="2.75" y="7.25" width="16" height="9.5" rx="2" />
    <path d="M21.25 10.5v3" /><path d="M6 10.25v3.5" /><path d="M9.25 10.25v3.5" /><path d="M12.5 10.25v3.5" />
</>);
export const BatteryCharge = makeIcon('BatteryCharge', <>
    <rect x="2.75" y="7.25" width="16" height="9.5" rx="2" />
    <path d="M21.25 10.5v3" /><path d="M11.75 9.25 8.75 12.25h3.5l-3 3" />
</>);
export const Wrench = makeIcon('Wrench', <>
    <path d="M14.75 4.25a4.25 4.25 0 0 0-4.1 5.4L4.4 15.9a2 2 0 0 0 2.83 2.83l6.25-6.25a4.25 4.25 0 0 0 5.4-4.1l-2.5 2.5-2.3-.6-.6-2.3 2.5-2.5a4.3 4.3 0 0 0-1.23-.23z" />
</>);
export const Scan = makeIcon('Scan', <>
    <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5" /><path d="M15.5 4H18a2 2 0 0 1 2 2v2.5" />
    <path d="M20 15.5V18a2 2 0 0 1-2 2h-2.5" /><path d="M8.5 20H6a2 2 0 0 1-2-2v-2.5" />
    <path d="M7.5 12h9" />
</>);

// ─── Dispositivos ────────────────────────────────────────────────────────────
export const Smartphone = makeIcon('Smartphone', <>
    <rect x="6.5" y="2.75" width="11" height="18.5" rx="2.75" />
    <path d="M10.5 5.75h3" />
</>);
export const Tablet = makeIcon('Tablet', <>
    <rect x="4.25" y="2.75" width="15.5" height="18.5" rx="2.5" />
    <path d="M11 18.25h2" />
</>);
export const Laptop = makeIcon('Laptop', <>
    <rect x="4.5" y="5" width="15" height="10.5" rx="1.5" />
    <path d="M2.5 18.75h19" />
</>);
export const Watch = makeIcon('Watch', <>
    <rect x="6.5" y="6.5" width="11" height="11" rx="3" />
    <path d="M9 6.5l.6-3.25h4.8L15 6.5" /><path d="M9 17.5l.6 3.25h4.8l.6-3.25" />
</>);
export const Headphones = makeIcon('Headphones', <>
    <path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" />
    <rect x="3.5" y="14" width="4" height="6.25" rx="1.5" />
    <rect x="16.5" y="14" width="4" height="6.25" rx="1.5" />
</>);
export const PcTower = makeIcon('PcTower', <>
    <rect x="6.5" y="2.75" width="11" height="18.5" rx="1.75" />
    <path d="M9.5 6.25h5M9.5 9.25h5" />
    <circle cx="12" cy="16.5" r="1.5" />
</>);

// ─── Íconos de servicios (administrables) ────────────────────────────────────
// El admin elige una clave; los emojis heredados se mapean para no romper datos viejos.
export const SERVICE_ICONS = {
    scan:     { Icon: Scan,        label: 'Diagnóstico' },
    wrench:   { Icon: Wrench,      label: 'Servicio técnico' },
    package:  { Icon: Package,     label: 'Paquete / entrega' },
    truck:    { Icon: Truck,       label: 'Envío' },
    badge:    { Icon: BadgeCheck,  label: 'Revisado / verificado' },
    shield:   { Icon: ShieldCheck, label: 'Garantía / protección' },
    battery:  { Icon: Battery,     label: 'Batería' },
    exchange: { Icon: Exchange,    label: 'Trade-In / cambio' },
    chat:     { Icon: MessageCircle, label: 'Atención / consulta' },
    store:    { Icon: Store,       label: 'Tienda física' },
    phone:    { Icon: Smartphone,  label: 'iPhone' },
    laptop:   { Icon: Laptop,      label: 'Mac' },
};

const LEGACY_EMOJI = {
    '🔍': 'scan', '🔎': 'scan', '🔧': 'wrench', '🛠️': 'wrench', '🛠': 'wrench',
    '📦': 'package', '🚚': 'truck', '✅': 'badge', '✔️': 'badge', '🛡️': 'shield', '🛡': 'shield',
    '🔋': 'battery', '♻️': 'exchange', '🔄': 'exchange', '💬': 'chat', '🏪': 'store',
    '📱': 'phone', '💻': 'laptop',
};

export function resolveServiceIcon(key) {
    const k = (key ?? '').trim();
    return SERVICE_ICONS[k] ? k : (LEGACY_EMOJI[k] ?? 'badge');
}

export function ServiceIcon({ name, ...props }) {
    const { Icon } = SERVICE_ICONS[resolveServiceIcon(name)];
    return <Icon {...props} />;
}

// ─── Ficha técnica ───────────────────────────────────────────────────────────
export const Cpu = makeIcon('Cpu', <>
    <rect x="6.25" y="6.25" width="11.5" height="11.5" rx="2" /><rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1" />
    <path d="M9.5 3.25v3M14.5 3.25v3M9.5 17.75v3M14.5 17.75v3M3.25 9.5h3M3.25 14.5h3M17.75 9.5h3M17.75 14.5h3" />
</>);
export const HardDrive = makeIcon('HardDrive', <>
    <rect x="3.25" y="5.25" width="17.5" height="13.5" rx="2.5" /><path d="M3.25 13.5h17.5" /><path d="M7 16.25h.01M10 16.25h.01" />
</>);
export const Camera = makeIcon('Camera', <>
    <path d="M4.75 7.75h2.6l1.4-2.25h6.5l1.4 2.25h2.6a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H4.75a1.5 1.5 0 0 1-1.5-1.5v-8.5a1.5 1.5 0 0 1 1.5-1.5z" />
    <circle cx="12" cy="13" r="3.25" />
</>);
export const Display = makeIcon('Display', <>
    <rect x="3.25" y="4.25" width="17.5" height="12" rx="2" /><path d="M8.5 20h7M12 16.25V20" />
</>);
export const Palette = makeIcon('Palette', <>
    <path d="M12 3.25a8.75 8.75 0 0 0 0 17.5c1.1 0 1.75-.8 1.75-1.65 0-1.2-1.05-1.6-1.05-2.6 0-.95.75-1.5 1.7-1.5h2.15a4.25 4.25 0 0 0 4.2-4.3c0-4.1-3.9-7.45-8.75-7.45z" />
    <circle cx="7.75" cy="11.5" r="1" /><circle cx="10.25" cy="7.5" r="1" /><circle cx="14.75" cy="7.75" r="1" />
</>);
export const Signal = makeIcon('Signal', <><path d="M5 18.5v-3M9.5 18.5v-6M14 18.5v-9M18.5 18.5V5.5" /></>);
export const SimCard = makeIcon('SimCard', <>
    <path d="M7 3.25h7.5l4 4v12a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5v-14.5A1.5 1.5 0 0 1 7 3.25z" />
    <rect x="8.75" y="11" width="6.5" height="6.5" rx="1" /><path d="M12 11v6.5M8.75 14.25h6.5" />
</>);
export const Droplet = makeIcon('Droplet', <path d="M12 3.5s-6 6.6-6 10.75a6 6 0 0 0 12 0C18 10.1 12 3.5 12 3.5z" />);
export const Scale = makeIcon('Scale', <>
    <path d="M6.25 7.75h11.5l1.75 12H4.5z" /><circle cx="12" cy="5.25" r="2" />
</>);
export const Plug = makeIcon('Plug', <>
    <path d="M9 3.25v4M15 3.25v4" /><path d="M6.25 7.25h11.5v3.5a5.75 5.75 0 0 1-11.5 0z" /><path d="M12 16.5v4.25" />
</>);
export const Fingerprint = makeIcon('Fingerprint', <>
    <path d="M6.2 17.5a10.5 10.5 0 0 1-.95-4.5 6.75 6.75 0 0 1 13.5 0v.5" /><path d="M9 19.75a9 9 0 0 1-1-4.75 4 4 0 0 1 8 0c0 1.9.35 3.4 1 4.75" />
    <path d="M12 15a13 13 0 0 0 1.5 5.75" />
</>);
export const Ruler = makeIcon('Ruler', <>
    <rect x="2.75" y="8.25" width="18.5" height="7.5" rx="1.5" /><path d="M6.5 8.25v3M10 8.25v2M13.5 8.25v3M17 8.25v2" />
</>);
export const Layers = makeIcon('Layers', <>
    <path d="M12 3.75l8.75 4.5L12 12.75 3.25 8.25z" /><path d="M3.25 12.25L12 16.75l8.75-4.5" /><path d="M3.25 16.25L12 20.75l8.75-4.5" />
</>);
export const Keyboard = makeIcon('Keyboard', <>
    <rect x="2.75" y="6.25" width="18.5" height="11.5" rx="2" /><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M8 14h8" />
</>);
export const Magnet = makeIcon('Magnet', <>
    <path d="M5.25 4.25h4v8a2.75 2.75 0 0 0 5.5 0v-8h4v8a6.75 6.75 0 0 1-13.5 0z" /><path d="M5.25 8.25h4M14.75 8.25h4" />
</>);
export const Cable = makeIcon('Cable', <>
    <rect x="8.25" y="2.75" width="7.5" height="6" rx="1.25" /><path d="M10.5 2.75V1.5M13.5 2.75V1.5" /><path d="M12 8.75v4a4 4 0 0 1-4 4H7a2.5 2.5 0 0 0-2.5 2.5v1.5" />
</>);
export const Sparkles = makeIcon('Sparkles', <>
    <path d="M11 4.25l1.6 4.15 4.15 1.6-4.15 1.6L11 15.75l-1.6-4.15L5.25 10l4.15-1.6z" /><path d="M18 14.5l.8 1.95 1.95.8-1.95.8L18 20l-.8-1.95-1.95-.8 1.95-.8z" />
</>);
export const Resolution = makeIcon('Resolution', <>
    <rect x="3.25" y="5.25" width="17.5" height="13.5" rx="2" /><path d="M7 9.25V8h1.25M17 9.25V8h-1.25M7 14.75V16h1.25M17 14.75V16h-1.25" />
</>);
export const Refresh = makeIcon('Refresh', <>
    <path d="M19.25 12a7.25 7.25 0 0 1-12.6 4.9" /><path d="M4.75 12a7.25 7.25 0 0 1 12.6-4.9" /><path d="M17.75 3.75v3.5h-3.5" /><path d="M6.25 20.25v-3.5h3.5" />
</>);
// ─── Ficha técnica del celular: un ícono propio por característica ───────────
// Cuadrícula de píxeles (tipo de pantalla).
export const Pixels = makeIcon('Pixels', <>
    <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="3.5" />
    <g fill="currentColor" stroke="none">
        <circle cx="8.25" cy="8.25" r="1.05" /><circle cx="12" cy="8.25" r="1.05" /><circle cx="15.75" cy="8.25" r="1.05" />
        <circle cx="8.25" cy="12" r="1.05" /><circle cx="12" cy="12" r="1.05" /><circle cx="15.75" cy="12" r="1.05" />
        <circle cx="8.25" cy="15.75" r="1.05" /><circle cx="12" cy="15.75" r="1.05" /><circle cx="15.75" cy="15.75" r="1.05" />
    </g>
</>);
// Sol (brillo).
export const Sun = makeIcon('Sun', <>
    <circle cx="12" cy="12" r="3.75" />
    <path d="M12 3.25V5M12 19v1.75M3.25 12H5M19 12h1.75M5.8 5.8l1.25 1.25M16.95 16.95l1.25 1.25M5.8 18.2l1.25-1.25M16.95 7.05l1.25-1.25" />
</>);
// Círculo mitad lleno (contraste).
export const Contrast = makeIcon('Contrast', <>
    <circle cx="12" cy="12" r="8.25" /><path d="M12 3.75a8.25 8.25 0 0 1 0 16.5z" fill="currentColor" stroke="none" />
</>);
// Teléfono que vibra (respuesta háptica).
export const Haptic = makeIcon('Haptic', <>
    <rect x="8" y="3.75" width="8" height="16.5" rx="2" /><path d="M11 17h2" /><path d="M4.75 9v6M19.25 9v6M2.5 10.75v2.5M21.5 10.75v2.5" />
</>);
// Módulo de memoria (RAM).
export const Memory = makeIcon('Memory', <>
    <rect x="3" y="7" width="18" height="9" rx="1.5" /><path d="M6.5 16v2.5M10 16v2.5M14 16v2.5M17.5 16v2.5" />
    <rect x="6" y="9.5" width="3" height="4" rx=".6" /><rect x="10.5" y="9.5" width="3" height="4" rx=".6" /><rect x="15" y="9.5" width="3" height="4" rx=".6" />
</>);
// Chip con red neuronal (Neural Engine).
export const NeuralEngine = makeIcon('NeuralEngine', <>
    <rect x="6" y="6" width="12" height="12" rx="2.25" /><path d="M9.5 3.5V6M14.5 3.5V6M9.5 18v2.5M14.5 18v2.5M3.5 9.5H6M3.5 14.5H6M18 9.5h2.5M18 14.5h2.5" />
    <circle cx="9.75" cy="10" r="1" /><circle cx="14.25" cy="10" r="1" /><circle cx="12" cy="14.25" r="1" /><path d="M10.75 10h2.5M10.3 10.9l1.2 2.4M13.7 10.9l-1.2 2.4" />
</>);
// Lente con reflejo (cámara principal).
export const Lens = makeIcon('Lens', <>
    <circle cx="12" cy="12" r="8.25" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.5" /><path d="M15.4 6.9a6.4 6.4 0 0 1 1.7 1.7" />
</>);
// Foto con destello (funciones de foto).
export const PhotoMagic = makeIcon('PhotoMagic', <>
    <rect x="3" y="6" width="14.5" height="13" rx="2" /><path d="M3 16l3.9-3.9a1.4 1.4 0 0 1 2 0L13.5 16.75" /><path d="M12 15.25l1.35-1.35a1.4 1.4 0 0 1 2 0l2.15 2.15" />
    <path d="M19.25 2.75l.65 1.6 1.6.65-1.6.65-.65 1.6-.65-1.6-1.6-.65 1.6-.65z" />
</>);
// Cámara de video con una persona (video frontal).
export const SelfieVideo = makeIcon('SelfieVideo', <>
    <rect x="2.75" y="6.25" width="12.5" height="11.5" rx="2" /><path d="M15.25 10.5l5-2.75v8.5l-5-2.75" />
    <circle cx="9" cy="10.4" r="1.9" /><path d="M5.9 15.5a3.4 3.4 0 0 1 6.2 0" />
</>);
// Ondas de pago sin contacto (NFC).
export const Contactless = makeIcon('Contactless', <>
    <path d="M7.25 8.75a4.6 4.6 0 0 1 0 6.5" /><path d="M10.5 6.25a8.2 8.2 0 0 1 0 11.5" /><path d="M13.75 3.75a11.8 11.8 0 0 1 0 16.5" />
    <circle cx="4.5" cy="12" r="1.15" fill="currentColor" stroke="none" />
</>);
// Diana de ubicación precisa (banda ultraancha).
export const Precision = makeIcon('Precision', <>
    <circle cx="12" cy="12" r="7.75" /><circle cx="12" cy="12" r="3.75" /><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <path d="M12 2.25v2.5M12 19.25v2.5M2.25 12h2.5M19.25 12h2.5" />
</>);
// Rostro dentro de un marco de escaneo (Face ID).
export const FaceId = makeIcon('FaceId', <>
    <path d="M3.75 8V6.25a2.5 2.5 0 0 1 2.5-2.5H8M16 3.75h1.75a2.5 2.5 0 0 1 2.5 2.5V8M20.25 16v1.75a2.5 2.5 0 0 1-2.5 2.5H16M8 20.25H6.25a2.5 2.5 0 0 1-2.5-2.5V16" />
    <path d="M9 9.25v1.25M15 9.25v1.25M12 9.25v3.5h-.75M9.25 15.25a4 4 0 0 0 5.5 0" />
</>);
// Cubo de capas (materiales).
export const Cube = makeIcon('Cube', <>
    <path d="M12 3.25l7.75 4.25v9L12 20.75 4.25 16.5v-9z" /><path d="M4.25 7.5L12 11.75l7.75-4.25M12 11.75v9" />
</>);
// Flecha de descarga a la bandeja (actualizaciones de software).
export const SoftwareUpdate = makeIcon('SoftwareUpdate', <>
    <path d="M12 3.75v10.5M8 10.5l4 4 4-4" /><path d="M4.75 14.75v2.5a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-2.5" />
</>);
// Teléfono con la diagonal medida (tamaño de pantalla).
export const ScreenSize = makeIcon('ScreenSize', <>
    <rect x="6.25" y="2.75" width="11.5" height="18.5" rx="2.75" /><path d="M9.5 15.25l5-6.5" /><path d="M9.5 12.5v2.75h2.75" /><path d="M14.5 11.5V8.75h-2.75" />
</>);
// Bandera de lanzamiento (iOS con el que salió).
export const Flag = makeIcon('Flag', <>
    <path d="M5.5 21V3.75" /><path d="M5.5 4.5h11.75l-2.5 4 2.5 4H5.5" />
</>);

// Teléfono con el control táctil al costado y el lente de la cámara (Control de Cámara).
export const CameraControl = makeIcon('CameraControl', <>
    <rect x="5.25" y="2.75" width="11" height="18.5" rx="2.75" /><circle cx="10.75" cy="8.25" r="2" /><path d="M19.25 12.5v4.5" />
</>);
// Teléfono con el botón lateral destacado (Botón Acción).
export const ActionButton = makeIcon('ActionButton', <>
    <rect x="7.75" y="2.75" width="11" height="18.5" rx="2.75" /><path d="M4.75 6.5v4" /><path d="M4.75 13.25v2" />
</>);
// Tres equipos conectados en red (Thread).
export const Mesh = makeIcon('Mesh', <>
    <circle cx="6" cy="7" r="2.25" /><circle cx="18" cy="7" r="2.25" /><circle cx="12" cy="17.5" r="2.25" /><path d="M8.25 7h7.5M7.1 9l3.8 6.5M16.9 9l-3.8 6.5" />
</>);
// Destello dentro de un círculo (Apple Intelligence).
export const Intelligence = makeIcon('Intelligence', <>
    <circle cx="12" cy="12" r="8.75" /><path d="M12 7.25l1.3 3.45 3.45 1.3-3.45 1.3L12 16.75l-1.3-3.45L7.25 12l3.45-1.3z" />
</>);
// Teléfono con la píldora de la Dynamic Island arriba.
export const Island = makeIcon('Island', <>
    <rect x="6.25" y="2.75" width="11.5" height="18.5" rx="2.75" /><rect x="9.5" y="5.25" width="5" height="1.75" rx="0.875" /><path d="M10.5 18.25h3" />
</>);
export const Aperture = makeIcon('Aperture', <>
    <circle cx="12" cy="12" r="8.5" /><path d="M14.5 3.9L9.8 12M20.1 9.5h-9.4M17.6 18.3l-4.7-8.1M9.5 20.1l4.7-8.1M3.9 14.5h9.4M6.4 5.7l4.7 8.1" />
</>);
export const Telephoto = makeIcon('Telephoto', <>
    <path d="M2.75 19.25h12.5" /><path d="M3.5 19.25l4.25-5.5 2.75 3.5 1.75-2.25 2.75 4.25" />
    <circle cx="16.25" cy="7.75" r="4" /><path d="M19.1 10.6l2.15 2.15" />
</>);
export const Selfie = makeIcon('Selfie', <>
    <rect x="6.5" y="2.75" width="11" height="18.5" rx="2.75" /><circle cx="12" cy="10" r="2.25" /><path d="M8.75 16a3.5 3.5 0 0 1 6.5 0" />
</>);
export const Video = makeIcon('Video', <>
    <rect x="2.75" y="6.25" width="12.5" height="11.5" rx="2" /><path d="M15.25 10.5l5.5-3v9l-5.5-3z" />
</>);
export const Wifi = makeIcon('Wifi', <>
    <path d="M3 9.25a13 13 0 0 1 18 0" /><path d="M6.25 12.75a8.5 8.5 0 0 1 11.5 0" /><path d="M9.5 16.25a4 4 0 0 1 5 0" /><path d="M12 19.5h.01" />
</>);
export const Bluetooth = makeIcon('Bluetooth', <path d="M7 7.5l10 9-5 4.25V3.25l5 4.25-10 9" />);
export const TagIcon = makeIcon('TagIcon', <>
    <path d="M3.75 12.1V4.75a1 1 0 0 1 1-1h7.35a1 1 0 0 1 .7.3l7.6 7.6a1 1 0 0 1 0 1.4l-7.35 7.35a1 1 0 0 1-1.4 0l-7.6-7.6a1 1 0 0 1-.3-.7z" /><circle cx="8.25" cy="8.25" r="1.25" />
</>);
export const Calendar = makeIcon('Calendar', <>
    <rect x="3.75" y="5.25" width="16.5" height="15" rx="2" /><path d="M3.75 9.75h16.5M8.25 3.25v4M15.75 3.25v4" />
</>);
export const Grid = makeIcon('Grid', <>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.25" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.25" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.25" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.25" />
</>);
export const Gpu = makeIcon('Gpu', <>
    <rect x="2.75" y="6.75" width="18.5" height="10.5" rx="2" /><circle cx="15.5" cy="12" r="2.75" /><path d="M6 10.25h4M6 13.75h4M6 17.25v2.5M10 17.25v2.5" />
</>);
export const Brush = makeIcon('Brush', <>
    <path d="M19.75 3.75l-8.5 8.5" /><path d="M11.25 12.25l1.5 1.5" /><path d="M9.5 13.5c-2.5 0-3.75 1.75-3.75 3.75 0 1.1-.75 2-2 2.25 1 1 2.75 1.25 4.25 1.25 3 0 4.5-1.75 4.5-4.25z" />
</>);
export const Collection = makeIcon('Collection', <>
    <rect x="3.75" y="8.25" width="16.5" height="12" rx="2" /><path d="M6 5.25h12M8.25 2.75h7.5" />
</>);
export const Noise = makeIcon('Noise', <>
    <path d="M3.75 10v4M7.5 7.5v9M11.25 4.75v14.5M15 8.5v7M18.75 10.75v2.5" />
</>);
export const Link = makeIcon('Link', <>
    <path d="M10 14a4 4 0 0 0 5.65 0l3-3a4 4 0 0 0-5.65-5.65l-1 1" /><path d="M14 10a4 4 0 0 0-5.65 0l-3 3a4 4 0 0 0 5.65 5.65l1-1" />
</>);
export const Globe = makeIcon('Globe', <>
    <circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><path d="M12 3.5c2.3 2.3 3.5 5.3 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.3-3.5-8.5S9.7 5.8 12 3.5z" />
</>);

// ─── Ficha técnica de la computadora: los que no comparte con el celular ─────
// Dos monitores: cuántas pantallas externas admite.
export const ExternalDisplay = makeIcon('ExternalDisplay', <>
    <rect x="2.5" y="4.75" width="8.75" height="7.5" rx="1.25" /><rect x="12.75" y="4.75" width="8.75" height="7.5" rx="1.25" />
    <path d="M6.88 12.25v6.5M4.75 18.75H9M17.13 12.25v6.5M15 18.75h4.25" />
</>);
// Flechas de ida y vuelta: ancho de banda de memoria.
export const Bandwidth = makeIcon('Bandwidth', <>
    <path d="M3.75 8.5h14.5" /><path d="M15 5.25l3.25 3.25L15 11.75" /><path d="M20.25 15.5H5.75" /><path d="M9 12.25 5.75 15.5 9 18.75" />
</>);
// Batería dentro de una vuelta: ciclos de carga.
export const BatteryCycle = makeIcon('BatteryCycle', <>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20.25 3.75v3.5h-3.5" />
    <rect x="7.75" y="9.75" width="7.5" height="4.5" rx="1" /><path d="M16.75 11.25v1.5" />
</>);
// Dos puertos USB‑C.
export const Ports = makeIcon('Ports', <>
    <rect x="3.25" y="5.75" width="17.5" height="5" rx="2.5" /><path d="M7.25 8.25h9.5" />
    <rect x="3.25" y="13.25" width="17.5" height="5" rx="2.5" /><path d="M7.25 15.75h9.5" />
</>);
export const Ethernet = makeIcon('Ethernet', <>
    <path d="M5.25 6.25h13.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-3.5v2h-6.5v-2h-3.5a1.5 1.5 0 0 1-1.5-1.5v-7.5a1.5 1.5 0 0 1 1.5-1.5z" />
    <path d="M8.5 9.5v2.25M11 9.5v2.25M13.5 9.5v2.25M16 9.5v2.25" />
</>);
export const Webcam = makeIcon('Webcam', <>
    <circle cx="12" cy="10" r="6.25" /><circle cx="12" cy="10" r="2.25" /><path d="M8.5 20.25h7M12 16.25v4" />
</>);
export const Speaker = makeIcon('Speaker', <>
    <rect x="6.25" y="2.75" width="11.5" height="18.5" rx="2.5" /><circle cx="12" cy="14.5" r="3.25" /><path d="M12 7.25h.01" />
</>);
export const Mic = makeIcon('Mic', <>
    <rect x="9" y="2.75" width="6" height="11" rx="3" /><path d="M5.75 11a6.25 6.25 0 0 0 12.5 0" /><path d="M12 17.25V21M9 21h6" />
</>);
export const Trackpad = makeIcon('Trackpad', <>
    <rect x="3.25" y="4.75" width="17.5" height="14.5" rx="2.25" /><path d="M3.25 15.25h17.5M12 15.25v4" />
</>);
// ─── Ficha de la PC (laptops con Windows): los que no tiene la Mac ─────
// Tarjeta gráfica con dos ventiladores: la GPU dedicada.
export const GraphicsCard = makeIcon('GraphicsCard', <>
    <rect x="2.75" y="5.75" width="18.5" height="11.5" rx="2" /><circle cx="8.25" cy="11.5" r="3" /><circle cx="15.75" cy="11.5" r="3" />
    <circle cx="8.25" cy="11.5" r=".6" /><circle cx="15.75" cy="11.5" r=".6" /><path d="M5.75 17.25v2.25M9 17.25v2.25M12.25 17.25v2.25" />
</>);
// Ranura libre (punteada) y un más: lo que se le puede agregar al equipo.
export const Upgrade = makeIcon('Upgrade', <>
    <rect x="2.75" y="10.25" width="13" height="7" rx="1.25" strokeDasharray="2.25 2" /><path d="M5.5 17.25v2.25M9.25 17.25v2.25M13 17.25v2.25" />
    <path d="M19 3.75v6M16 6.75h6" />
</>);

// ─── Ficha de accesorios (cargadores, vidrios, fundas y más) ────────────────
// Fábrica con techo en serrucho (quién lo fabrica).
export const Factory = makeIcon('Factory', <>
    <path d="M3.25 20.25V11l5.5-3.25V11l5.5-3.25V11l5.5-3.25v12.5z" /><path d="M7 16.25h2.5M12.25 16.25h2.5" />
</>);
// Rayo con flecha hacia arriba: lo más que entrega por momentos.
export const PowerBoost = makeIcon('PowerBoost', <>
    <path d="M10.5 3.25L4.25 12.5h5l-.75 8.25 6.5-9.75H10z" /><path d="M19.25 20.5v-9.75M16.75 13.25l2.5-2.5 2.5 2.5" />
</>);
// Cronómetro con rayo (carga rápida).
export const FastCharge = makeIcon('FastCharge', <>
    <circle cx="12" cy="13.5" r="7.25" /><path d="M10 3.25h4M12 3.25v3" /><path d="M12.9 9.5l-2.4 4.1h3l-2.4 4.1" />
</>);
// Conector USB‑C: el ovalado reversible.
export const UsbC = makeIcon('UsbC', <>
    <rect x="3.25" y="8.25" width="17.5" height="7.5" rx="3.75" /><path d="M7.5 12h9" />
</>);
// Símbolo de corriente continua (⎓) en un marco: voltajes y corrientes de salida.
export const Voltage = makeIcon('Voltage', <>
    <rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2.5" /><path d="M6.5 10h11" /><path d="M6.5 14h2.5M10.75 14h2.5M15 14h2.5" />
</>);
// Chip con rayo: la tecnología con la que el cargador y el equipo acuerdan la carga (USB Power Delivery).
export const PowerDelivery = makeIcon('PowerDelivery', <>
    <rect x="6.25" y="6.25" width="11.5" height="11.5" rx="2" /><path d="M12.75 8.75l-2.25 3.5h3l-2.25 3.5" />
    <path d="M9.5 3.25v3M14.5 3.25v3M9.5 17.75v3M14.5 17.75v3M3.25 9.5h3M3.25 14.5h3M17.75 9.5h3M17.75 14.5h3" />
</>);
// Lámina de vidrio con flechas que la comprimen (cómo se endurece).
export const Compression = makeIcon('Compression', <>
    <rect x="3.25" y="9.75" width="17.5" height="4.5" rx="1" /><path d="M12 2.75v4.5M9.75 5L12 7.25 14.25 5" /><path d="M12 21.25v-4.5M9.75 19L12 16.75 14.25 19" />
</>);
// Diamante (dureza contra rayones).
export const Diamond = makeIcon('Diamond', <>
    <path d="M6.75 4.25h10.5l3.5 4.75L12 19.75 3.25 9z" /><path d="M3.25 9h17.5" /><path d="M9.25 4.25L8 9l4 10.75L16 9l-1.25-4.75" />
</>);
// Pantalla con franjas en diagonal: el filtro del vidrio (antiespía, antirreflejo o luz azul).
export const ScreenFilter = makeIcon('ScreenFilter', <>
    <rect x="6.25" y="2.75" width="11.5" height="18.5" rx="2.5" /><path d="M8.75 16.75l6.5-6.5M8.75 11.75l4-4" />
</>);
// Gota que rebota sobre una superficie (recubrimiento que repele grasa y huellas).
export const Oleophobic = makeIcon('Oleophobic', <>
    <path d="M12 3.25s-4.25 4.6-4.25 7.6a4.25 4.25 0 0 0 8.5 0c0-3-4.25-7.6-4.25-7.6z" /><path d="M3.25 20h17.5" /><path d="M5.25 16.5l1.5 1.5M18.75 16.5l-1.5 1.5" />
</>);
// Esquinas de guía alrededor de un equipo (instalación alineada).
export const Install = makeIcon('Install', <>
    <path d="M3.25 7.75v-3a1.5 1.5 0 0 1 1.5-1.5h3M16.25 3.25h3a1.5 1.5 0 0 1 1.5 1.5v3M20.75 16.25v3a1.5 1.5 0 0 1-1.5 1.5h-3M7.75 20.75h-3a1.5 1.5 0 0 1-1.5-1.5v-3" />
    <rect x="8.25" y="6.25" width="7.5" height="11.5" rx="1.5" />
</>);
// Globo de diálogo con ondas de voz (asistente de voz).
export const Voice = makeIcon('Voice', <>
    <path d="M20.75 11.25c0 4.15-3.9 7.5-8.75 7.5-1.2 0-2.35-.2-3.4-.57L4 19.75l1.3-3.55a6.9 6.9 0 0 1-2.05-4.95c0-4.15 3.9-7.5 8.75-7.5s8.75 3.35 8.75 7.5z" />
    <path d="M8.75 10v2.5M12 8.5v5.5M15.25 10v2.5" />
</>);
// Casa con señal (casa inteligente).
export const SmartHome = makeIcon('SmartHome', <>
    <path d="M3.75 10.5L12 3.75l8.25 6.75" /><path d="M5.75 9v11.25h12.5V9" /><path d="M8.75 14a4.6 4.6 0 0 1 6.5 0M10.5 16a2.1 2.1 0 0 1 3 0" /><path d="M12 18.25h.01" />
</>);
// Gatillo con flecha doble (resistencia que cambia).
export const Trigger = makeIcon('Trigger', <>
    <path d="M10.25 20.75v-8.5a4.5 4.5 0 0 1 4.5-4.5h.5a4.5 4.5 0 0 1 4.5 4.5v8.5z" /><path d="M5.25 7.75v9.5M3.5 9.5l1.75-1.75L7 9.5M3.5 15.5l1.75 1.75L7 15.5" />
</>);
// Control remoto.
export const Remote = makeIcon('Remote', <>
    <rect x="7.25" y="2.75" width="9.5" height="18.5" rx="3" /><circle cx="12" cy="8.25" r="2" /><path d="M10.25 13.25h.01M13.75 13.25h.01M10.25 16.5h.01M13.75 16.5h.01" />
</>);
// Control de consola (videojuegos).
export const Gamepad = makeIcon('Gamepad', <>
    <path d="M7.25 7.25h9.5a4.75 4.75 0 0 1 4.6 5.9l-.9 3.6a2.6 2.6 0 0 1-4.35 1.2l-2.1-2.2H10l-2.1 2.2a2.6 2.6 0 0 1-4.35-1.2l-.9-3.6a4.75 4.75 0 0 1 4.6-5.9z" />
    <path d="M7.75 10.5v3M6.25 12h3" /><path d="M15.75 11h.01M17.25 13h.01" />
</>);
// Matraz de laboratorio (pruebas independientes).
export const Lab = makeIcon('Lab', <>
    <path d="M9.25 3.25h5.5M10 3.25v6L4.9 17.9A2 2 0 0 0 6.6 21h10.8a2 2 0 0 0 1.7-3.1L14 9.25v-6" /><path d="M7.25 14.75h9.5" />
</>);
// Documento con sello (normas de seguridad).
export const Certificate = makeIcon('Certificate', <>
    <path d="M13.5 20.75H5.75a1.5 1.5 0 0 1-1.5-1.5V4.75a1.5 1.5 0 0 1 1.5-1.5h12.5a1.5 1.5 0 0 1 1.5 1.5v5" /><path d="M8 7.75h8M8 11.25h5" />
    <circle cx="17.5" cy="15.25" r="2.75" /><path d="M16 17.75l-.75 3.5 2.25-1.25 2.25 1.25-.75-3.5" />
</>);

// ─── Ficha de los productos Apple (iPad, Apple Watch, AirPods y accesorios) ─────
// Caja del reloj con su medida al costado: el tamaño de la caja (41, 45, 46 mm…).
export const WatchCase = makeIcon('WatchCase', <>
    <rect x="4.5" y="6" width="10.5" height="12" rx="3" /><path d="M7 6l.5-2.75h4.5L12.5 6M7 18l.5 2.75h4.5l.5-2.75" />
    <path d="M19.25 6.75v10.5M17.75 8.25l1.5-1.5 1.5 1.5M17.75 15.75l1.5 1.5 1.5-1.5" />
</>);
// Apple Pencil: lápiz con su lado plano y la punta.
export const ApplePencil = makeIcon('ApplePencil', <>
    <path d="M15.25 4.75a2.12 2.12 0 0 1 3 0l1 1a2.12 2.12 0 0 1 0 3L9 19l-4.75 1 1-4.75z" /><path d="M13.5 6.5l4 4" /><path d="M5.25 15.25l3.5 3.5" />
</>);
// Chip con cuatro núcleos: los núcleos de la CPU.
export const CpuCores = makeIcon('CpuCores', <>
    <rect x="5" y="5" width="14" height="14" rx="2.5" />
    <rect x="8" y="8" width="3.25" height="3.25" rx=".6" /><rect x="12.75" y="8" width="3.25" height="3.25" rx=".6" />
    <rect x="8" y="12.75" width="3.25" height="3.25" rx=".6" /><rect x="12.75" y="12.75" width="3.25" height="3.25" rx=".6" />
    <path d="M9 2.75V5M15 2.75V5M9 19v2.25M15 19v2.25M2.75 9H5M2.75 15H5M19 9h2.25M19 15h2.25" />
</>);
// Oyente al centro y ondas a los dos lados: Audio Espacial.
export const SpatialAudio = makeIcon('SpatialAudio', <>
    <circle cx="12" cy="10.5" r="2.75" /><path d="M7.75 19.25a4.25 4.25 0 0 1 8.5 0" />
    <path d="M6.5 6.5a6.4 6.4 0 0 0 0 8.5M17.5 6.5a6.4 6.4 0 0 1 0 8.5" /><path d="M3.75 4a10.25 10.25 0 0 0 0 13.5M20.25 4a10.25 10.25 0 0 1 0 13.5" />
</>);
// Dos globos de diálogo con idiomas distintos: traducción en vivo.
export const Translate = makeIcon('Translate', <>
    <path d="M3.25 4.75h9v6.5h-3.5l-2.75 2.5v-2.5H3.25z" /><path d="M6 9.25l1.75-3.25 1.75 3.25M6.6 8.1h2.3" />
    <path d="M11.75 13.25h9v6.25h-2.75v2.25l-2.75-2.25h-3.5z" /><path d="M14 15.5h4.5M16.25 14.75v.75M17.75 15.5c-.45 1.55-1.5 2.45-3 2.95M15 16.75c.6.85 1.5 1.45 2.75 1.7" />
</>);
// Botón con su perilla estriada al costado: los controles (Digital Crown, botón lateral, control táctil).
export const Controls = makeIcon('Controls', <>
    <rect x="3.25" y="6.25" width="11.5" height="11.5" rx="3" /><rect x="14.75" y="9" width="3.75" height="6" rx="1.25" />
    <path d="M16.1 10.25v3.5M17.4 10.25v3.5" /><path d="M21.25 9.75v4.5" /><circle cx="9" cy="12" r="2" />
</>);
// Corazón con el trazo del pulso: las funciones de salud.
export const HeartPulse = makeIcon('HeartPulse', <>
    <path d="M12 20.25s-8.25-4.9-8.25-10.75a4.5 4.5 0 0 1 8.25-2.5 4.5 4.5 0 0 1 8.25 2.5c0 5.85-8.25 10.75-8.25 10.75z" />
    <path d="M6.75 12.25h2.75l1.25-2.25 2 4.5 1.25-2.25h3.25" />
</>);
// Oreja con ondas de sonido: la salud auditiva.
export const Ear = makeIcon('Ear', <>
    <path d="M6.25 9.25a5.75 5.75 0 0 1 11.5 0c0 3-1.85 4.1-3 5.25-1 1-1 2.75-1.6 3.9a3.4 3.4 0 0 1-5.9-.4" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1.25 2-1.85 2.9" /><path d="M20 6.5a8.5 8.5 0 0 1 0 6" />
</>);
// Estuche de carga con el rayo: el estuche de los AirPods.
export const ChargingCase = makeIcon('ChargingCase', <>
    <rect x="4" y="5.5" width="16" height="13.5" rx="4.75" /><path d="M4.25 9.75h15.5" /><path d="M12.9 11.5l-2 3h2.6l-2 3" />
</>);
// Flecha de ubicación precisa sobre el arco de distancia: la banda ultraancha (búsqueda de precisión).
export const UltraWideband = makeIcon('UltraWideband', <>
    <path d="M12 3.25l4.75 11.5L12 12l-4.75 2.75z" /><path d="M4.75 16.75a10.25 10.25 0 0 0 14.5 0" /><path d="M8.25 19.75a6.5 6.5 0 0 0 7.5 0" />
</>);
// Cinta de medir alrededor de la muñeca: la talla de las correas.
export const WristSize = makeIcon('WristSize', <>
    <ellipse cx="12" cy="13" rx="8.75" ry="5.25" /><path d="M6.5 8.9v2.1M9.25 8.05v2.5M12 7.75v2M14.75 8.05v2.5M17.5 8.9v2.1" />
</>);
