import { Link } from '@inertiajs/react';
import { ArrowRight, Headphones, Laptop, Package, ShieldCheck, Smartphone, Watch } from '@/Components/Store/Icons';

// Acceso a una categoría en el bloque «¿Qué estás buscando?» del inicio. El panel (Tienda online → Categorías) lo usa
// como vista previa: mismos colores, íconos y textos que ve el cliente.

const CAT_ACCENT = {
    celulares:         { bg: '#E5EAF5', ink: '#011446', Icon: Smartphone },
    computadoras:      { bg: '#EAEAF2', ink: '#28224F', Icon: Laptop },
    'productos-apple': { bg: '#E5E8F5', ink: '#011446', Icon: Watch },
    fundas:            { bg: '#EEF2E5', ink: '#1A2A00', Icon: ShieldCheck },
    accesorios:        { bg: '#F0EFEF', ink: '#28224F', Icon: Headphones },
};

export const acentoCategoria = (slug) => CAT_ACCENT[slug] ?? { bg: '#F2F2F7', ink: '#28224F', Icon: Package };

/** A dónde lleva el acceso: Fundas MYSKIN a /myskin; las demás, a su página del catálogo. */
export const urlCategoria = (cat) => cat.url ?? (cat.slug === 'fundas' ? '/myskin' : `/catalogo?categoria=${cat.slug}`);

export default function TarjetaCategoria({ cat, vistaPrevia = false }) {
    const accent = acentoCategoria(cat.slug);
    const estilo = { background: accent.bg, minHeight: 132 };
    const contenido = (
        <>
            <div>
                <accent.Icon className="mb-3 h-6 w-6" style={{ color: accent.ink }} />
                <p className="text-base font-black leading-tight" style={{ color: accent.ink }}>{cat.name}</p>
                <p className="mt-1 text-[11px] leading-snug" style={{ color: accent.ink, opacity: 0.65 }}>{cat.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold tabular-nums" style={{ color: accent.ink, opacity: 0.55 }}>
                    {cat.count} {cat.count === 1 ? 'disponible' : 'disponibles'}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: accent.ink, opacity: 0.55 }} />
            </div>
        </>
    );

    if (vistaPrevia) {
        return <div className="flex flex-col justify-between rounded-2xl p-5" style={estilo}>{contenido}</div>;
    }

    return (
        <Link
            href={urlCategoria(cat)}
            className="group flex flex-col justify-between rounded-2xl p-5 transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
            style={estilo}
        >
            {contenido}
        </Link>
    );
}
