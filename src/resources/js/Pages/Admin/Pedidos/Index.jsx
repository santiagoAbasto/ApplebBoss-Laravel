import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { FileText, Package, Search, Wallet } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge, EmptyState, Input, PageHeader, bsFmt, fmtDate } from '@/Components/Admin/ui';

// Un color por estado, para que la lista se lea de un vistazo
const TONO = {
    pendiente_pago: 'amber',
    pago_en_revision: 'violet',
    pagado: 'emerald',
    preparando: 'blue',
    enviado: 'navy',
    entregado: 'slate',
    cancelado: 'rose',
};

function Resumen({ icon: Icon, label, valor, tono }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tono}`}><Icon className="h-5 w-5" /></span>
                <p className="text-[13px] font-semibold text-slate-500">{label}</p>
            </div>
            <p className="mt-4 text-[24px] font-extrabold leading-none text-slate-900">{valor}</p>
        </div>
    );
}

export default function Index({ pedidos, filtros = {}, estados = [], conteos = {} }) {
    const [q, setQ] = useState(filtros.q ?? '');

    const filtrar = (cambios) => router.get(route('admin.pedidos.index'), { ...filtros, ...cambios }, {
        preserveState: true, replace: true,
    });

    const filas = pedidos?.data ?? [];

    return (
        <AdminLayout title="Pedidos de la tienda">
            <Head title="Pedidos" />

            <PageHeader
                title="Pedidos de la tienda"
                subtitle="Compras hechas por la web. Confirmar el pago vende el equipo y le muestra al comprador su IMEI y su serie."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Resumen icon={FileText} label="Esperan que revises el comprobante" valor={conteos.en_revision ?? 0} tono="bg-violet-50 text-violet-700" />
                <Resumen icon={Wallet} label="Sin pagar todavía" valor={conteos.pendiente_pago ?? 0} tono="bg-amber-50 text-amber-800" />
                <Resumen icon={Package} label="Pagados, listos para preparar" valor={conteos.pagados ?? 0} tono="bg-emerald-50 text-emerald-700" />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <form
                    className="relative flex-1 min-w-[240px]"
                    onSubmit={(e) => { e.preventDefault(); filtrar({ q }); }}
                >
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Código, nombre, correo o teléfono"
                        className="pl-9"
                        aria-label="Buscar pedidos"
                    />
                </form>

                <select
                    value={filtros.estado ?? 'todos'}
                    onChange={(e) => filtrar({ estado: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    aria-label="Filtrar por estado"
                >
                    <option value="todos">Todos los estados</option>
                    {estados.map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
                </select>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                {filas.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        title="Todavía no hay pedidos"
                        text="Cuando alguien compre por la web, el pedido aparece acá para que revises el pago."
                    />
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-[12px] uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-bold">Pedido</th>
                                <th className="px-4 py-3 font-bold">Cliente</th>
                                <th className="px-4 py-3 font-bold">Estado</th>
                                <th className="px-4 py-3 text-right font-bold">Total</th>
                                <th className="px-4 py-3 font-bold">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filas.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-slate-50/70">
                                    <td className="px-4 py-3">
                                        <Link href={route('admin.pedidos.show', p.id)} className="font-bold text-[#011446] hover:underline">
                                            {p.codigo}
                                        </Link>
                                        <p className="text-xs text-slate-500">
                                            {p.articulos} {p.articulos === 1 ? 'artículo' : 'artículos'} · {{ envio: 'Envío', delivery: 'Delivery' }[p.entrega] ?? 'Retiro'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{p.cliente}</td>
                                    <td className="px-4 py-3">
                                        <Badge tone={TONO[p.estado] ?? 'slate'}>{p.etiqueta}</Badge>
                                        {p.comprobante && p.estado === 'pago_en_revision' && (
                                            <span className="ml-2 text-xs font-semibold text-violet-700">comprobante subido</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{bsFmt(p.total)}</td>
                                    <td className="px-4 py-3 text-slate-500">{fmtDate(p.creado_en)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pedidos?.links?.length > 3 && (
                <nav className="mt-4 flex flex-wrap gap-1" aria-label="Paginación">
                    {pedidos.links.map((l, i) => (
                        <Link
                            key={i}
                            href={l.url ?? '#'}
                            preserveState
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                l.active ? 'bg-[#011446] text-white' : l.url ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300'
                            }`}
                            dangerouslySetInnerHTML={{ __html: l.label }}
                        />
                    ))}
                </nav>
            )}
        </AdminLayout>
    );
}
