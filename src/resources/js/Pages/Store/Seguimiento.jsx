import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import StoreLayout, { StoreContainer, money } from '@/Layouts/StoreLayout';
import { EscenaEstado } from '@/Components/Store/Ilustraciones3D';
import { Check, ChevronRight, Clock, MapPin } from '@/Components/Store/Icons';

const fecha = (iso) => iso ? new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/La_Paz' }) : null;
const minuscula = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : '');
const TERMINADOS = ['entregado', 'cancelado'];

/* Los pasos dependen de cómo recibe: el retiro no pasa por «En camino». */
function pasosPara(entrega) {
    const base = [
        { etiqueta: 'Pedido recibido', estados: ['pendiente_pago', 'pago_en_revision'] },
        { etiqueta: 'Pago confirmado', estados: ['pagado'] },
        { etiqueta: 'Preparando', estados: ['preparando'] },
    ];
    if (entrega === 'retiro') return [...base, { etiqueta: 'Retirado', estados: ['entregado'] }];

    return [
        ...base,
        { etiqueta: entrega === 'delivery' ? 'En camino' : 'Enviado', estados: ['enviado'] },
        { etiqueta: 'Entregado', estados: ['entregado'] },
    ];
}

/* Lo que se le dice en cada momento: el título grande y la línea de abajo */
function mensaje({ estado, tipo_entrega: entrega, plazo, etiqueta }) {
    const retiro = entrega === 'retiro';
    const delivery = entrega === 'delivery';

    switch (estado) {
        case 'pendiente_pago':   return ['Esperando tu pago', 'Te guardamos el equipo mientras completas el pago.'];
        case 'pago_en_revision': return ['Revisando tu pago', 'Recibimos tu comprobante. Te avisamos por correo apenas lo confirmemos.'];
        case 'pagado':           return ['¡Pago confirmado!', 'Tu equipo ya es tuyo: abajo tienes su IMEI y su número de serie.'];
        case 'preparando':       return [
            retiro ? 'Preparando tu equipo' : 'Preparando tu pedido',
            retiro ? 'Te avisamos cuando esté listo para retirar en la tienda.'
                : delivery ? 'Lo estamos dejando listo para que salga con nuestro repartidor.'
                : 'Lo estamos empacando para entregarlo al courier.',
        ];
        case 'enviado':          return [
            delivery ? 'Tu pedido va en camino' : 'Tu pedido fue enviado',
            delivery ? 'Nuestro repartidor ya salió hacia tu dirección.' : plazo ? `Llega en ${minuscula(plazo)}.` : 'Ya está con el courier.',
        ];
        case 'entregado':        return [retiro ? '¡Retiraste tu equipo!' : '¡Pedido entregado!', 'Gracias por comprar en Apple Boss.'];
        case 'cancelado':        return ['Pedido cancelado', 'El equipo volvió a la tienda. Si fue un error, escríbenos y lo resolvemos.'];
        default:                 return [etiqueta, ''];
    }
}

const ETIQUETA_ENTREGA = { retiro: 'Retiro en tienda', envio: 'Envío al interior', delivery: 'Delivery en Cochabamba' };

/* El pedido se actualiza solo: cada 20 s pregunta el estado y, si cambió, trae la página nueva */
function useEnVivo(pedido, token) {
    useEffect(() => {
        if (!token || TERMINADOS.includes(pedido.estado)) return undefined;
        const id = setInterval(async () => {
            try {
                const r = await fetch(`/pedido/${pedido.codigo}/estado?t=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
                if (!r.ok) return;
                const d = await r.json();
                if (d.estado !== pedido.estado) router.reload({ only: ['pedido'] });
            } catch { /* si falla una consulta, se reintenta en la siguiente */ }
        }, 20000);
        return () => clearInterval(id);
    }, [pedido.estado, pedido.codigo, token]);
}

function Progreso({ pasos, actual, terminado }) {
    const quieto = useReducedMotion();
    return (
        <div className="mt-7">
            <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={pasos.length} aria-valuenow={actual + 1}>
                {pasos.map((p, i) => {
                    const hecho = i < actual || (terminado && i === actual);
                    const enCurso = i === actual && !terminado;
                    return (
                        <div key={p.etiqueta} className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
                            {(hecho || enCurso) && (
                                <motion.span className="absolute inset-0 rounded-full" style={{ background: 'var(--ab-navy)', originX: 0 }}
                                    initial={{ scaleX: 0 }} animate={{ scaleX: hecho ? 1 : 0.45 }} transition={{ delay: 0.15 + i * 0.12, duration: 0.5 }} />
                            )}
                            {enCurso && !quieto && (
                                <motion.span className="absolute inset-y-0 w-1/3 rounded-full"
                                    style={{ background: 'linear-gradient(90deg, transparent, var(--ab-lime), transparent)' }}
                                    animate={{ left: ['-35%', '100%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
                            )}
                        </div>
                    );
                })}
            </div>
            <ol className="mt-3 flex gap-1.5">
                {pasos.map((p, i) => {
                    const hecho = i < actual || (terminado && i === actual);
                    const enCurso = i === actual && !terminado;
                    return (
                        <li key={p.etiqueta} className="flex flex-1 items-start gap-1 text-[11px] font-bold leading-tight sm:text-xs"
                            style={{ color: hecho || enCurso ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {hecho && <Check className="mt-px hidden h-3.5 w-3.5 shrink-0 sm:block" style={{ color: 'var(--ab-navy)' }} />}
                            <span className={enCurso ? '' : 'hidden sm:inline'}>{p.etiqueta}</span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

export default function Seguimiento({ pedido, token }) {
    useEnVivo(pedido, token);

    const cancelado = pedido.estado === 'cancelado';
    const pasos = pasosPara(pedido.tipo_entrega);
    const actual = Math.max(0, pasos.findIndex((p) => p.estados.includes(pedido.estado)));
    const [titulo, subtitulo] = mensaje(pedido);
    const enVivo = token && !TERMINADOS.includes(pedido.estado);
    const tituloEntrega = pedido.tipo_entrega === 'delivery' ? 'Delivery' : 'Envío';

    return (
        <StoreLayout>
            <Head title={`Pedido ${pedido.codigo}`} />
            <StoreContainer className="py-8 md:py-12">
                <div className="mx-auto max-w-3xl">
                    {/* ── Estado actual ─────────────────────────────────────── */}
                    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="relative mb-8 overflow-hidden rounded-3xl border p-6 md:p-8"
                        style={{
                            borderColor: 'var(--border-light)',
                            background: cancelado
                                ? 'var(--surface-white)'
                                : 'radial-gradient(120% 90% at 0% 0%, rgba(198,203,54,0.20), transparent 55%), radial-gradient(90% 80% at 100% 100%, rgba(1,20,70,0.06), transparent 60%), var(--surface-white)',
                        }}>
                        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
                            <AnimatePresence mode="wait">
                                <motion.div key={pedido.estado} className="shrink-0"
                                    initial={{ opacity: 0, scale: 0.85, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
                                    <EscenaEstado estado={pedido.estado} entrega={pedido.tipo_entrega} className="h-44 w-44 md:h-56 md:w-56" />
                                </motion.div>
                            </AnimatePresence>

                            <div className="min-w-0 flex-1 text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Pedido {pedido.codigo}</p>
                                    {enVivo && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
                                            style={{ background: 'rgba(198,203,54,0.22)', color: 'var(--ab-navy)' }}>
                                            <motion.span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ab-navy)' }}
                                                animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                                            En vivo
                                        </span>
                                    )}
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.h1 key={titulo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="mt-2 text-2xl font-black leading-tight md:text-4xl" style={{ color: 'var(--text-primary)' }}>
                                        {titulo}
                                    </motion.h1>
                                </AnimatePresence>
                                <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>{subtitulo}</p>

                                {!TERMINADOS.includes(pedido.estado) && (
                                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
                                            style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', background: 'var(--surface-white)' }}>
                                            <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--ab-navy)' }} />
                                            {ETIQUETA_ENTREGA[pedido.tipo_entrega] ?? 'Entrega'}
                                        </span>
                                        {pedido.plazo && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
                                                style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', background: 'var(--surface-white)' }}>
                                                <Clock className="h-3.5 w-3.5" style={{ color: 'var(--ab-navy)' }} />
                                                {pedido.plazo}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {pedido.estado === 'pendiente_pago' && token && (
                                    <a href={`/pedido/${pedido.codigo}/pago?t=${encodeURIComponent(token)}`}
                                        className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white"
                                        style={{ background: 'var(--ab-navy)' }}>
                                        Completar el pago <ChevronRight className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {!cancelado && <Progreso pasos={pasos} actual={actual} terminado={pedido.estado === 'entregado'} />}
                    </motion.section>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Productos */}
                        <section className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                            <h2 className="mb-3 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Tu equipo</h2>
                            <div className="space-y-4">
                                {pedido.items.map((item, i) => (
                                    <div key={i} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: 'var(--border-light)' }}>
                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.nombre}</p>
                                        {item.condicion && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.condicion}</p>}
                                        <p className="mt-1 text-sm font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>{money(item.precio)}</p>

                                        {/* Los datos de la unidad salen solo con el pago confirmado */}
                                        {pedido.pago_confirmado ? (
                                            <motion.dl initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                className="mt-2 rounded-lg p-3 text-xs" style={{ background: 'var(--surface-muted)' }}>
                                                {item.imei_1 && <div className="flex justify-between gap-3"><dt style={{ color: 'var(--text-secondary)' }}>IMEI</dt><dd className="font-bold tabular-nums">{item.imei_1}</dd></div>}
                                                {item.imei_2 && <div className="flex justify-between gap-3"><dt style={{ color: 'var(--text-secondary)' }}>IMEI 2</dt><dd className="font-bold tabular-nums">{item.imei_2}</dd></div>}
                                                {item.numero_serie && <div className="flex justify-between gap-3"><dt style={{ color: 'var(--text-secondary)' }}>N.° de serie</dt><dd className="font-bold">{item.numero_serie}</dd></div>}
                                            </motion.dl>
                                        ) : (
                                            <p className="mt-2 rounded-lg p-3 text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)' }}>
                                                El IMEI y el número de serie se muestran aquí cuando se confirme tu pago.
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 space-y-1.5 border-t pt-3 text-sm" style={{ borderColor: 'var(--border-light)' }}>
                                <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span className="tabular-nums">{money(pedido.subtotal)}</span></div>
                                <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Entrega</span><span className="tabular-nums">{pedido.costo_envio > 0 ? money(pedido.costo_envio) : 'Gratis'}</span></div>
                                <div className="flex justify-between font-black"><span>Total</span><span className="tabular-nums" style={{ color: 'var(--ab-navy)' }}>{money(pedido.total)}</span></div>
                                {pedido.metodo_pago === 'binance_pay' && pedido.pago_monto_usdt && (
                                    <div className="flex justify-between text-xs"><span style={{ color: 'var(--text-muted)' }}>Pagado con Binance</span><span className="font-bold tabular-nums">{Number(pedido.pago_monto_usdt).toFixed(2)} USDT</span></div>
                                )}
                            </div>
                        </section>

                        {/* Entrega + línea de tiempo */}
                        <div className="space-y-6">
                            {pedido.envio && (
                                <section className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                    <h2 className="mb-3 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>{tituloEntrega}</h2>
                                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{pedido.envio.direccion}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {[pedido.envio.barrio, pedido.envio.zona, pedido.envio.ciudad, pedido.tipo_entrega === 'envio' ? pedido.envio.departamento : null]
                                            .filter(Boolean).join(', ')}
                                    </p>
                                    {pedido.envio.referencia && (
                                        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Referencia: {pedido.envio.referencia}</p>
                                    )}
                                    {pedido.envio.tracking && (
                                        <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: 'var(--surface-muted)' }}>
                                            <p style={{ color: 'var(--text-secondary)' }}>{pedido.envio.courier}</p>
                                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Seguimiento: {pedido.envio.tracking}</p>
                                            {pedido.envio.tracking_url && (
                                                <a href={pedido.envio.tracking_url} target="_blank" rel="noreferrer"
                                                    className="mt-1 inline-block font-bold underline" style={{ color: 'var(--ab-navy)' }}>
                                                    Ver en el courier
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </section>
                            )}

                            <section className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                <h2 className="mb-3 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Historial</h2>
                                <ol className="relative space-y-4">
                                    <span className="absolute bottom-2 left-[3px] top-2 w-px" style={{ background: 'var(--border-light)' }} aria-hidden="true" />
                                    {[...pedido.eventos].reverse().map((ev, i) => (
                                        <motion.li key={`${ev.fecha}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                            className="relative flex gap-3">
                                            <span className="relative mt-1 h-2 w-2 shrink-0 rounded-full"
                                                style={{ background: i === 0 ? 'var(--ab-lime)' : 'var(--ab-navy)', boxShadow: i === 0 ? '0 0 0 4px rgba(198,203,54,0.25)' : 'none' }} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ev.titulo}</p>
                                                {ev.detalle && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ev.detalle}</p>}
                                                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>{fecha(ev.fecha)}</p>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ol>
                            </section>
                        </div>
                    </div>
                </div>
            </StoreContainer>
        </StoreLayout>
    );
}
