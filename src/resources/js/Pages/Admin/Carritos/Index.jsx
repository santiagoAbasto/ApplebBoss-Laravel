import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Mail, MessageCircle, RotateCcw, ShoppingCart, TrendingUp } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge, EmptyState, PageHeader, bsFmt, fmtDate } from '@/Components/Admin/ui';

// Un color por estado, para leer la lista de un vistazo
const TONO = { esperando: 'amber', recordado: 'blue', sin_respuesta: 'slate', recuperado: 'emerald' };

function Resumen({ icon: Icon, label, valor, tono, detalle }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tono}`}><Icon className="h-5 w-5" /></span>
                <p className="text-[13px] font-semibold text-slate-500">{label}</p>
            </div>
            <p className="mt-4 text-[24px] font-extrabold leading-none text-slate-900">{valor}</p>
            {detalle && <p className="mt-1.5 text-[12px] text-slate-400">{detalle}</p>}
        </div>
    );
}

export default function Index({ filas = [], resumen = {}, etiquetas = {}, primerAviso = 60, segundoAviso = 24 }) {
    const recordar = (id) => router.post(route('admin.carritos.recordar', id), {}, { preserveScroll: true });

    return (
        <AdminLayout title="Carritos abandonados">
            <Head title="Carritos abandonados" />

            <PageHeader
                title="Carritos abandonados"
                subtitle={`Clientes con cuenta que dejaron productos en el carrito o un pedido sin pagar. Reciben un correo ${primerAviso} minutos después del último cambio y otro ${segundoAviso} horas después; desde acá puedes adelantarlo o escribirles por WhatsApp.`}
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Resumen icon={ShoppingCart} label="Abiertos ahora" valor={resumen.abiertos ?? 0} tono="bg-amber-50 text-amber-800" />
                <Resumen icon={Mail} label="Recordados (30 días)" valor={resumen.recordados_30 ?? 0} tono="bg-blue-50 text-blue-700" />
                <Resumen icon={RotateCcw} label="Recuperados (30 días)" valor={resumen.recuperados_30 ?? 0} tono="bg-emerald-50 text-emerald-700"
                    detalle={resumen.tasa_30 != null ? `${resumen.tasa_30}% de los recordados` : 'Todavía sin datos'} />
                <Resumen icon={TrendingUp} label="Vendido gracias al recordatorio" valor={bsFmt(resumen.monto_30 ?? 0)} tono="bg-violet-50 text-violet-700" />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                {filas.length === 0 ? (
                    <EmptyState icon={ShoppingCart} title="Nadie dejó nada a medias"
                        text="Cuando un cliente con cuenta deje productos en el carrito o un pedido sin pagar, aparece acá." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-slate-50 text-[12px] uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Cliente</th>
                                    <th className="px-4 py-3 font-bold">Productos</th>
                                    <th className="px-4 py-3 font-bold text-right">Total</th>
                                    <th className="px-4 py-3 font-bold">Estado</th>
                                    <th className="px-4 py-3 font-bold">Última actividad</th>
                                    <th className="px-4 py-3 font-bold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filas.map((f) => (
                                    <tr key={f.id} className="align-top hover:bg-slate-50/60">
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-slate-900">{f.cliente.nombre ?? '—'}</p>
                                            <p className="text-slate-500">{f.cliente.email}</p>
                                            {f.cliente.telefono && <p className="text-slate-400">{f.cliente.telefono}</p>}
                                            {f.sin_recordatorios && <Badge tone="rose" className="mt-1">Pidió no recibir correos</Badge>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ul className="space-y-0.5">
                                                {f.items.map((n, i) => <li key={i} className="text-slate-700">{n}</li>)}
                                            </ul>
                                            {f.origen === 'pedido' && f.pedido && (
                                                <p className="mt-1 text-[12px] text-slate-400">
                                                    Del pedido{' '}
                                                    {f.pedido_id
                                                        ? <Link href={route('admin.pedidos.show', f.pedido_id)} className="font-semibold text-[#011446] hover:underline">{f.pedido}</Link>
                                                        : f.pedido}
                                                    , vencido sin pago
                                                </p>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">{bsFmt(f.total)}</td>
                                        <td className="px-4 py-3">
                                            <Badge tone={TONO[f.estado] ?? 'slate'}>{etiquetas[f.estado] ?? f.estado}</Badge>
                                            {f.recordatorios > 0 && !f.recuperado_en && (
                                                <p className="mt-1 text-[12px] text-slate-400">{f.recordatorios} de 2 correos · último {fmtDate(f.recordado_en)}</p>
                                            )}
                                            {f.recuperado && (
                                                <p className="mt-1 text-[12px] text-emerald-700">Compró: {f.recuperado}{f.recuperado_total != null ? ` · ${bsFmt(f.recuperado_total)}` : ''}</p>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(f.actualizado_en)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {f.whatsapp && (
                                                    <a href={f.whatsapp} target="_blank" rel="noopener"
                                                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[12px] font-bold text-emerald-800 hover:bg-emerald-100">
                                                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                                    </a>
                                                )}
                                                {!f.recuperado_en && !f.sin_recordatorios && (
                                                    <button type="button" onClick={() => recordar(f.id)}
                                                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-50">
                                                        <Mail className="h-3.5 w-3.5" /> Enviar recordatorio
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <p className="mt-4 text-[12px] text-slate-400">
                Solo clientes con sesión iniciada: a un visitante anónimo no se le puede escribir. Lo que ya se vendió no se recuerda. El historial se guarda seis meses.
            </p>
        </AdminLayout>
    );
}
