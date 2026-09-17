import { motion } from 'framer-motion';
import { ArrowRight, Clock, MapPin, Phone } from '@/Components/Store/Icons';
import { estadoAhora, lineasHorario } from '@/Components/Store/horario';

// Un local de la tienda (Tienda online → Ubicaciones): sus datos y su mapa. Los usan la sección «Dónde estamos» del
// inicio y la vista previa del panel, así lo que ve el administrador es lo que ve el cliente.

/** «Av. Heroínas 456, Cochabamba»: la ciudad se suma si la dirección no la trae. */
export function direccionCompleta(local) {
    const direccion = (local.direccion ?? '').trim();
    const ciudad = (local.ciudad ?? '').trim();

    if (!direccion) return [ciudad, local.pais].filter(Boolean).join(', ');

    return ciudad && !direccion.toLowerCase().includes(ciudad.toLowerCase()) ? `${direccion}, ${ciudad}` : direccion;
}

function Fila({ Icon, label, compacta, children }) {
    return (
        <div className="flex items-start gap-3">
            <span
                className={`grid shrink-0 place-items-center rounded-lg ${compacta ? 'h-8 w-8' : 'h-9 w-9'}`}
                style={{ background: 'rgba(1,20,70,0.07)', color: 'var(--ab-navy)' }}
            >
                <Icon className={compacta ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
            </span>
            <div className="min-w-0">
                <p className={`font-semibold ${compacta ? 'text-[13px]' : 'text-sm'}`} style={{ color: 'var(--text-primary)' }}>{label}</p>
                {children}
            </div>
        </div>
    );
}

/** La dirección, el horario (con «Abierto ahora») y el teléfono del local. */
export function FichaUbicacion({ local, compacta = false }) {
    const lineas = lineasHorario(local.horarios);
    const estado = estadoAhora(local.horarios);
    const texto = compacta ? 'text-xs leading-relaxed' : 'text-sm leading-relaxed';
    const enlace = `${texto} transition-opacity hover:opacity-70`;

    return (
        <div className={compacta ? 'space-y-3' : 'space-y-4'}>
            <Fila Icon={MapPin} label="Dirección" compacta={compacta}>
                {local.como_llegar ? (
                    <a href={local.como_llegar} target="_blank" rel="noreferrer" className={enlace} style={{ color: 'var(--ab-periwinkle)' }}>
                        {direccionCompleta(local)}
                    </a>
                ) : (
                    <p className={texto} style={{ color: 'var(--text-secondary)' }}>{direccionCompleta(local)}</p>
                )}
            </Fila>

            {(lineas.length > 0 || local.horario_nota) && (
                <Fila Icon={Clock} label="Horario" compacta={compacta}>
                    {estado && (
                        <p className={`mb-1 flex items-center gap-1.5 font-semibold ${compacta ? 'text-[11px]' : 'text-xs'}`} style={{ color: estado.abierto ? '#15803d' : 'var(--text-muted)' }}>
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: estado.abierto ? '#22c55e' : '#94a3b8' }} aria-hidden="true" />
                            {estado.texto}
                        </p>
                    )}
                    {lineas.map((linea) => (
                        <p key={linea} className={texto} style={{ color: 'var(--text-secondary)' }}>{linea}</p>
                    ))}
                    {local.horario_nota && (
                        <p className={`${texto} ${lineas.length ? 'mt-0.5' : ''}`} style={{ color: lineas.length ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                            {local.horario_nota}
                        </p>
                    )}
                </Fila>
            )}

            {local.telefono && (
                <Fila Icon={Phone} label="Teléfono" compacta={compacta}>
                    <a href={local.telefono_url} className={enlace} style={{ color: 'var(--ab-periwinkle)' }}>{local.telefono}</a>
                </Fila>
            )}
        </div>
    );
}

/** Los locales para elegir, cuando hay más de uno. */
export function SelectorLocales({ locales, actual, onChange, compacta = false }) {
    return (
        <div role="tablist" aria-label="Elegir un local" className="flex flex-wrap gap-2">
            {locales.map((l, i) => {
                const elegido = i === actual;
                return (
                    <button
                        key={l.id}
                        type="button"
                        role="tab"
                        aria-selected={elegido}
                        onClick={() => onChange(i)}
                        className={`rounded-full border font-semibold transition-colors ${compacta ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-sm'}`}
                        style={elegido
                            ? { background: 'var(--ab-navy)', borderColor: 'var(--ab-navy)', color: '#fff' }
                            : { background: '#fff', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                    >
                        {l.nombre}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * El mapa de Google del local, con su nombre encima y el botón «Cómo llegar». Solo se dibuja si el local tiene mapa.
 * `animado` lo hace entrar con movimiento (en la tienda); en el panel va quieto.
 */
export function MapaUbicacion({ local, alto = 380, animado = true }) {
    if (!local.mapa) return null;

    const lugar = [local.ciudad, local.pais].filter(Boolean).join(', ');
    const Caja = animado ? motion.div : 'div';
    const Etiqueta = animado ? motion.div : 'div';
    const Boton = animado ? motion.a : 'a';
    const Pulso = animado ? motion.span : 'span';

    return (
        <Caja
            className="relative overflow-hidden rounded-3xl border shadow-[0_24px_60px_-30px_rgba(1,20,70,0.45)]"
            style={{ background: '#e6ebf2', borderColor: 'var(--border-light)' }}
            {...(animado ? {
                initial: { opacity: 0, scale: 0.96, y: 20 },
                whileInView: { opacity: 1, scale: 1, y: 0 },
                viewport: { once: true, margin: '-60px' },
                transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
            } : {})}
        >
            <iframe
                key={local.mapa}
                src={local.mapa}
                width="100%"
                height={alto}
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title={`Mapa de ${local.nombre} en ${lugar}`}
            />

            <Etiqueta
                className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 rounded-2xl bg-white/95 py-2.5 pl-2.5 pr-4 shadow-lg backdrop-blur"
                {...(animado ? {
                    initial: { opacity: 0, y: -24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { delay: 0.45, type: 'spring', stiffness: 260, damping: 18 },
                } : {})}
            >
                <span className="relative grid h-9 w-9 place-items-center rounded-xl" style={{ background: 'var(--ab-navy)', color: 'var(--ab-lime)' }}>
                    {animado && (
                        <Pulso
                            aria-hidden="true"
                            className="absolute inset-0 rounded-xl"
                            style={{ background: 'var(--ab-navy)' }}
                            animate={{ scale: [1, 1.5], opacity: [0.45, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                        />
                    )}
                    {animado ? (
                        <motion.span className="relative" animate={{ y: [0, -3, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                            <MapPin className="h-[18px] w-[18px]" />
                        </motion.span>
                    ) : (
                        <MapPin className="relative h-[18px] w-[18px]" />
                    )}
                </span>
                <span>
                    <span className="block text-sm font-black leading-tight" style={{ color: 'var(--ab-navy)' }}>{local.nombre}</span>
                    <span className="block text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{lugar}</span>
                </span>
            </Etiqueta>

            {local.como_llegar && (
                <Boton
                    href={local.como_llegar}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-lg"
                    style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                    {...(animado ? {
                        initial: { opacity: 0, scale: 0.8 },
                        whileInView: { opacity: 1, scale: 1 },
                        viewport: { once: true },
                        whileHover: { scale: 1.04 },
                        whileTap: { scale: 0.97 },
                        transition: { delay: 0.6, type: 'spring', stiffness: 300, damping: 20 },
                    } : {})}
                >
                    Cómo llegar <ArrowRight className="h-4 w-4" />
                </Boton>
            )}
        </Caja>
    );
}
