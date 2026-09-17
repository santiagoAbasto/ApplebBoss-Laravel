import { Link } from '@inertiajs/react';
import { ArrowRight, MessageCircle, ServiceIcon } from '@/Components/Store/Icons';
import { esExterno } from '@/Components/Store/enlaces';

// Una tarjeta de «Nuestros servicios» del inicio. El panel (Tienda online → Servicios) la usa como vista previa: mismo
// ícono, textos y botón que ve el cliente.

/** Columnas según cuántas tarjetas hay, para que en la computadora no quede una sola suelta en la última fila. */
export function columnasServicios(cantidad) {
    if (cantidad <= 1) return 'max-w-sm';
    if (cantidad === 2) return 'sm:grid-cols-2 lg:max-w-3xl';
    if (cantidad === 3 || cantidad === 5 || cantidad === 6) return 'sm:grid-cols-2 lg:grid-cols-3';
    return 'sm:grid-cols-2 lg:grid-cols-4';
}

/**
 * `href` es a dónde lleva el botón: el chat de WhatsApp o la página elegida. Sin `href` la tarjeta solo informa.
 * `vistaPrevia` la dibuja con su botón pero sin navegar; `compacta` la achica para el costado del panel.
 */
export default function TarjetaServicio({ servicio, href = null, vistaPrevia = false, compacta = false }) {
    const whatsapp = servicio.accion === 'whatsapp';
    const conBoton = Boolean(servicio.boton) && (vistaPrevia || Boolean(href));

    const contenido = (
        <>
            <span
                className={`grid shrink-0 place-items-center rounded-xl ${compacta ? 'h-9 w-9' : 'h-11 w-11'}`}
                style={{ background: 'rgba(1,20,70,0.07)', color: 'var(--ab-navy)' }}
            >
                <ServiceIcon name={servicio.icon} className={compacta ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]'} />
            </span>
            <h3 className={`font-bold ${compacta ? 'mt-3 text-[13px] leading-snug' : 'mt-4 text-sm'}`} style={{ color: 'var(--text-primary)' }}>
                {servicio.title}
            </h3>
            {servicio.description && (
                <p className={`leading-relaxed ${compacta ? 'mt-1 text-[11px]' : 'mt-1.5 text-xs'}`} style={{ color: 'var(--text-secondary)' }}>
                    {servicio.description}
                </p>
            )}
            {conBoton && (
                <span className={`mt-auto inline-flex items-center gap-1.5 font-bold ${compacta ? 'pt-3 text-[11px]' : 'pt-4 text-xs'}`} style={{ color: 'var(--ab-navy)' }}>
                    {whatsapp && <MessageCircle className="h-3.5 w-3.5 shrink-0" />}
                    {servicio.boton}
                    {!whatsapp && <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />}
                </span>
            )}
        </>
    );

    const clase = `flex h-full flex-col rounded-2xl border bg-white ${compacta ? 'p-4' : 'p-6'}`;
    const estilo = { borderColor: 'var(--border-light)' };

    if (vistaPrevia || !conBoton) {
        return <div className={clase} style={estilo}>{contenido}</div>;
    }

    const interactiva = `group ${clase} transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(1,20,70,0.45)] focus-visible:outline-none focus-visible:ring-2`;

    // WhatsApp y los otros sitios se abren aparte; una página de la tienda, en la misma pestaña
    if (whatsapp || esExterno(href)) {
        return <a href={href} target="_blank" rel="noreferrer" className={interactiva} style={estilo}>{contenido}</a>;
    }

    return <Link href={href} className={interactiva} style={estilo}>{contenido}</Link>;
}
