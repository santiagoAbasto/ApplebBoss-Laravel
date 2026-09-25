import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { ArrowLeft, Ban, CheckCircle2, FileText, Lock, Truck } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Textarea, bsFmt, fmtDate, inputCls } from '@/Components/Admin/ui';

const TONO = {
    pendiente_pago: 'amber', pago_en_revision: 'violet', pagado: 'emerald',
    preparando: 'blue', enviado: 'navy', entregado: 'slate', cancelado: 'rose',
};

const ETIQUETA_AVANCE = {
    preparando: 'Marcar como «preparando»',
    enviado: 'Marcar como enviado',
    entregado: 'Marcar como entregado',
};

const ENTREGA = { retiro: 'Retiro en tienda', envio: 'Envío al interior', delivery: 'Delivery en Cochabamba' };
const METODO = {
    binance_pay: 'Binance Pay (USDT)', transferencia: 'Transferencia', efectivo_tienda: 'Pago al retirar',
    qr_bnb: 'QR del BNB', libelula: 'Libélula',
};

function Dato({ label, children }) {
    if (!children) return null;
    return (
        <div>
            <dt className="text-[12px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
        </div>
    );
}

export default function Show({ pedido, avances = [] }) {
    const [modal, setModal] = useState(null); // 'confirmar' | 'cancelar' | estado a avanzar

    const confirmar = useForm({ referencia: pedido.pago?.referencia ?? '' });
    const cancelar = useForm({ motivo: '' });
    const avanzar = useForm({ estado: '', courier: '', tracking_codigo: '', tracking_url: '' });
    const nota = useForm({ nota: '' });

    const cerrar = () => setModal(null);
    const enviarA = (form, ruta, extra = {}) => {
        form.transform((d) => ({ ...d, ...extra }));
        form.post(route(ruta, pedido.id), { preserveScroll: true, onSuccess: cerrar });
    };

    return (
        <AdminLayout title={`Pedido ${pedido.codigo}`}>
            <Head title={`Pedido ${pedido.codigo}`} />

            <Link href={route('admin.pedidos.index')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
                <ArrowLeft className="h-4 w-4" /> Volver a pedidos
            </Link>

            <PageHeader
                title={`Pedido ${pedido.codigo}`}
                subtitle={`${fmtDate(pedido.creado_en)} · ${ENTREGA[pedido.tipo_entrega] ?? pedido.tipo_entrega}`}
                actions={<Badge tone={TONO[pedido.estado] ?? 'slate'}>{pedido.etiqueta}</Badge>}
            />

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
                <div className="flex flex-col gap-5">
                    {/* ── Pago ─────────────────────────────────────────────── */}
                    <Card title="Pago" subtitle={pedido.pago_confirmado ? 'Confirmado' : 'Todavía sin confirmar'}>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Dato label="Método">{METODO[pedido.pago?.metodo] ?? pedido.pago?.metodo}</Dato>
                            {/* Lo que se le cotizó al cliente: es lo que tiene que figurar en la captura de Binance */}
                            <Dato label="Monto en USDT">{pedido.pago?.monto_usdt ? `${Number(pedido.pago.monto_usdt).toFixed(2)} USDT` : null}</Dato>
                            <Dato label="Referencia">{pedido.pago?.referencia ?? '—'}</Dato>
                            <Dato label="Confirmado">{pedido.pago?.confirmado_en ? fmtDate(pedido.pago.confirmado_en) : '—'}</Dato>
                            <Dato label="Confirmado por">{pedido.pago?.confirmado_por ?? '—'}</Dato>
                        </dl>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {pedido.pago?.tiene_comprobante && (
                                <a
                                    href={route('admin.pedidos.comprobante', pedido.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    <FileText className="h-4 w-4" /> Ver comprobante
                                </a>
                            )}

                            {!pedido.pago_confirmado && pedido.estado !== 'cancelado' && (
                                <Button variant="primary" onClick={() => setModal('confirmar')}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar pago
                                </Button>
                            )}

                            {pedido.estado !== 'cancelado' && !pedido.pago_confirmado && (
                                <Button onClick={() => setModal('cancelar')}>
                                    <Ban className="mr-2 h-4 w-4" /> Cancelar pedido
                                </Button>
                            )}
                        </div>

                        {!pedido.pago_confirmado && (
                            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                                Al confirmar, el equipo queda vendido, se despublica de la tienda y recién ahí el
                                comprador ve el IMEI y el número de serie. Revisa el comprobante antes.
                            </p>
                        )}
                    </Card>

                    {/* ── Equipos ──────────────────────────────────────────── */}
                    <Card title="Equipos" subtitle={`${pedido.items.length} ${pedido.items.length === 1 ? 'artículo' : 'artículos'}`}>
                        <ul className="divide-y divide-slate-100">
                            {pedido.items.map((it, i) => (
                                <li key={i} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                    <div>
                                        <p className="font-bold text-slate-900">{it.nombre}</p>
                                        <p className="text-xs text-slate-500">
                                            {it.condicion} · {it.cantidad} × {bsFmt(it.precio)}
                                        </p>
                                        {(it.imei_1 || it.numero_serie) && (
                                            <p className="mt-1 font-mono text-[11px] text-slate-500">
                                                {it.imei_1 && <>IMEI {it.imei_1}{it.imei_2 ? ` / ${it.imei_2}` : ''}</>}
                                                {it.numero_serie && <> · Serie {it.numero_serie}</>}
                                            </p>
                                        )}
                                    </div>
                                    <span className="font-bold tabular-nums text-slate-900">{bsFmt(it.subtotal)}</span>
                                </li>
                            ))}
                        </ul>

                        <dl className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
                            <div className="flex justify-between text-slate-600"><dt>Subtotal</dt><dd className="tabular-nums">{bsFmt(pedido.subtotal)}</dd></div>
                            <div className="flex justify-between text-slate-600"><dt>Envío</dt><dd className="tabular-nums">{pedido.costo_envio > 0 ? bsFmt(pedido.costo_envio) : 'Sin costo'}</dd></div>
                            <div className="flex justify-between text-base font-extrabold text-slate-900"><dt>Total</dt><dd className="tabular-nums">{bsFmt(pedido.total)}</dd></div>
                        </dl>
                    </Card>

                    {/* ── Trazabilidad ─────────────────────────────────────── */}
                    <Card title="Línea de tiempo" subtitle="Todo lo que pasó con este pedido, con su autor">
                        <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                            {pedido.eventos.map((e, i) => (
                                <li key={i} className="relative">
                                    <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300" />
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-bold text-slate-900">{e.titulo}</p>
                                        {!e.publico && <Badge tone="slate">solo interno</Badge>}
                                    </div>
                                    {e.detalle && <p className="text-sm text-slate-600">{e.detalle}</p>}
                                    <p className="text-xs text-slate-400">
                                        {fmtDate(e.fecha)}{e.autor ? ` · ${e.autor}` : ''}
                                    </p>
                                </li>
                            ))}
                        </ol>

                        <form
                            className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4"
                            onSubmit={(e) => { e.preventDefault(); nota.post(route('admin.pedidos.nota', pedido.id), { preserveScroll: true, onSuccess: () => nota.reset() }); }}
                        >
                            <Textarea
                                value={nota.data.nota}
                                onChange={(e) => nota.setData('nota', e.target.value)}
                                placeholder="Nota interna (el cliente no la ve)"
                                rows={2}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={nota.processing || !nota.data.nota.trim()}>Guardar nota</Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* ── Columna lateral ──────────────────────────────────────── */}
                <div className="flex flex-col gap-5">
                    <Card title="Cliente">
                        <dl className="space-y-3">
                            <Dato label="Nombre">{pedido.cliente?.nombre}</Dato>
                            <Dato label="Teléfono">{pedido.cliente?.telefono}</Dato>
                            <Dato label="Correo">{pedido.cliente?.email}</Dato>
                            <Dato label="CI / NIT">{pedido.cliente?.documento}</Dato>
                            <Dato label="Razón social">{pedido.cliente?.razon_social}</Dato>
                        </dl>
                    </Card>

                    {pedido.envio && (
                        <Card title={pedido.tipo_entrega === 'delivery' ? 'Delivery' : 'Envío'}>
                            <dl className="space-y-3">
                                <Dato label="Departamento">{pedido.envio.departamento}</Dato>
                                <Dato label="Ciudad">{pedido.envio.ciudad}</Dato>
                                <Dato label="Zona">{pedido.envio.zona}</Dato>
                                <Dato label="Barrio">{pedido.envio.barrio}</Dato>
                                <Dato label="Dirección">{pedido.envio.direccion}</Dato>
                                <Dato label="Referencia">{pedido.envio.referencia}</Dato>
                                <Dato label="Ubicación">
                                    {pedido.envio.lat != null && (
                                        <a href={`https://www.google.com/maps?q=${pedido.envio.lat},${pedido.envio.lng}`} target="_blank" rel="noreferrer"
                                            className="font-semibold text-blue-700 underline">
                                            Abrir el punto en Google Maps
                                        </a>
                                    )}
                                </Dato>
                                <Dato label="Destinatario">{pedido.envio.destinatario}</Dato>
                                <Dato label="Courier">{pedido.envio.courier}</Dato>
                                <Dato label="Seguimiento">{pedido.envio.tracking}</Dato>
                            </dl>
                        </Card>
                    )}

                    {avances.length > 0 && (
                        <Card title="Siguiente paso">
                            <div className="flex flex-col gap-2">
                                {avances.map((e) => (
                                    <Button key={e} variant="primary" onClick={() => { avanzar.setData('estado', e); setModal(e); }}>
                                        <Truck className="mr-2 h-4 w-4" /> {ETIQUETA_AVANCE[e] ?? e}
                                    </Button>
                                ))}
                            </div>
                        </Card>
                    )}

                    {pedido.notas_cliente && (
                        <Card title="Nota del cliente">
                            <p className="whitespace-pre-line text-sm text-slate-700">{pedido.notas_cliente}</p>
                        </Card>
                    )}
                </div>
            </div>

            {/* ── Modales ──────────────────────────────────────────────────── */}
            {modal === 'confirmar' && (
                <Modal
                    title="Confirmar el pago"
                    onClose={cerrar}
                    footer={
                        <>
                            <Button onClick={cerrar}>Cancelar</Button>
                            <Button variant="primary" disabled={confirmar.processing} onClick={() => enviarA(confirmar, 'admin.pedidos.confirmarPago')}>
                                Sí, el pago entró
                            </Button>
                        </>
                    }
                >
                    <p className="mb-4 text-sm text-slate-600">
                        Verifica que el dinero esté efectivamente en la cuenta antes de confirmar. Esto vende el equipo,
                        lo saca de la tienda y le muestra al comprador el IMEI y la serie. No se deshace solo.
                    </p>
                    <Field label="Referencia de la transferencia" hint="Opcional, para tu registro">
                        <Input
                            value={confirmar.data.referencia}
                            onChange={(e) => confirmar.setData('referencia', e.target.value)}
                            placeholder="N.º de operación"
                        />
                    </Field>
                </Modal>
            )}

            {modal === 'cancelar' && (
                <Modal
                    title="Cancelar el pedido"
                    onClose={cerrar}
                    footer={
                        <>
                            <Button onClick={cerrar}>Volver</Button>
                            <Button variant="primary" disabled={cancelar.processing || !cancelar.data.motivo.trim()} onClick={() => enviarA(cancelar, 'admin.pedidos.cancelar')}>
                                Cancelar el pedido
                            </Button>
                        </>
                    }
                >
                    <p className="mb-4 text-sm text-slate-600">El equipo vuelve a la tienda y queda disponible para otra persona.</p>
                    <Field label="Motivo" hint="Queda en la línea de tiempo">
                        <Input value={cancelar.data.motivo} onChange={(e) => cancelar.setData('motivo', e.target.value)} placeholder="El cliente desistió" />
                    </Field>
                </Modal>
            )}

            {['preparando', 'enviado', 'entregado'].includes(modal) && (
                <Modal
                    title={ETIQUETA_AVANCE[modal]}
                    onClose={cerrar}
                    footer={
                        <>
                            <Button onClick={cerrar}>Cancelar</Button>
                            <Button variant="primary" disabled={avanzar.processing} onClick={() => enviarA(avanzar, 'admin.pedidos.avanzar', { estado: modal })}>
                                Confirmar
                            </Button>
                        </>
                    }
                >
                    {modal === 'enviado' ? (
                        <div className="flex flex-col gap-3">
                            {pedido.tipo_entrega === 'delivery' ? (
                                <>
                                    <p className="text-sm text-slate-600">El cliente ve en su seguimiento que el pedido va en camino.</p>
                                    <Field label="Repartidor" hint="Opcional"><Input value={avanzar.data.courier} onChange={(e) => avanzar.setData('courier', e.target.value)} placeholder="Nombre de quien lo lleva" /></Field>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-600">Si cargas el courier y el código, el cliente los ve en su seguimiento.</p>
                                    <Field label="Courier"><Input value={avanzar.data.courier} onChange={(e) => avanzar.setData('courier', e.target.value)} placeholder="Trans Copacabana" /></Field>
                                    <Field label="Código de seguimiento"><Input value={avanzar.data.tracking_codigo} onChange={(e) => avanzar.setData('tracking_codigo', e.target.value)} /></Field>
                                    <Field label="Enlace de seguimiento" hint="Opcional"><Input value={avanzar.data.tracking_url} onChange={(e) => avanzar.setData('tracking_url', e.target.value)} placeholder="https://..." /></Field>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-600">Queda registrado en la línea de tiempo y el cliente lo ve en su seguimiento.</p>
                    )}
                </Modal>
            )}
        </AdminLayout>
    );
}
