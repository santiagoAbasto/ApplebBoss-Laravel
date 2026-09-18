import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import StoreLayout, { StoreContainer, money } from '@/Layouts/StoreLayout';
import { Check } from '@/Components/Store/Icons';

const PASOS = [
    { estado: 'pendiente_pago', etiqueta: 'Pedido creado' },
    { estado: 'pagado', etiqueta: 'Pago confirmado' },
    { estado: 'preparando', etiqueta: 'Preparando' },
    { estado: 'enviado', etiqueta: 'En camino' },
    { estado: 'entregado', etiqueta: 'Entregado' },
];

const ORDEN = { pendiente_pago: 0, pago_en_revision: 0, pagado: 1, preparando: 2, enviado: 3, entregado: 4, cancelado: -1 };

const fecha = (iso) => iso ? new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/La_Paz' }) : null;

export default function Seguimiento({ pedido }) {
    const avance = ORDEN[pedido.estado] ?? 0;
    const cancelado = pedido.estado === 'cancelado';

    return (
        <StoreLayout>
            <Head title={`Pedido ${pedido.codigo}`} />
            <StoreContainer className="py-8 md:py-12">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Pedido {pedido.codigo}</p>
                        <h1 className="mt-1 text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>{pedido.etiqueta}</h1>
                        {pedido.creado_en && (
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Creado el {fecha(pedido.creado_en)}</p>
                        )}
                    </div>

                    {/* Barra de avance */}
                    {!cancelado && (
                        <div className="mb-8 rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                            <ol className="flex items-center gap-1">
                                {PASOS.map((p, i) => {
                                    const hecho = i <= avance;
                                    return (
                                        <li key={p.estado} className="flex flex-1 items-center gap-1">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <motion.span
                                                    initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 14 }}
                                                    className="grid h-8 w-8 place-items-center rounded-full"
                                                    style={{ background: hecho ? 'var(--ab-navy)' : 'var(--surface-muted)', color: hecho ? '#fff' : 'var(--text-muted)' }}
                                                >
                                                    {hecho ? <Check className="h-4 w-4" /> : <span className="text-xs font-black">{i + 1}</span>}
                                                </motion.span>
                                                <span className="hidden text-center text-[10px] font-bold leading-tight sm:block"
                                                    style={{ color: hecho ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                    {p.etiqueta}
                                                </span>
                                            </div>
                                            {i < PASOS.length - 1 && (
                                                <motion.span className="h-1 flex-1 rounded-full" initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: i < avance ? 1 : 0 }} style={{ originX: 0, background: 'var(--ab-navy)' }} />
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}

                    {cancelado && (
                        <div className="mb-8 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>
                            Este pedido fue cancelado.
                        </div>
                    )}

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
                                <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Envío</span><span className="tabular-nums">{pedido.costo_envio > 0 ? money(pedido.costo_envio) : 'Sin costo'}</span></div>
                                <div className="flex justify-between font-black"><span>Total</span><span className="tabular-nums" style={{ color: 'var(--ab-navy)' }}>{money(pedido.total)}</span></div>
                            </div>
                        </section>

                        {/* Entrega + línea de tiempo */}
                        <div className="space-y-6">
                            {pedido.envio && (
                                <section className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                    <h2 className="mb-3 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Envío</h2>
                                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{pedido.envio.direccion}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pedido.envio.ciudad}, {pedido.envio.departamento}</p>
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
                                <ol className="space-y-4">
                                    {pedido.eventos.map((ev, i) => (
                                        <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                            className="flex gap-3">
                                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--ab-navy)' }} />
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
