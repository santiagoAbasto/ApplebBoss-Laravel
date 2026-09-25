import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { KeyRound, Search, ShoppingBag, UserRound, Users } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge, EmptyState, Input, PageHeader, bsFmt, fmtDate } from '@/Components/Admin/ui';

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

export default function Index({ cuentas, filtros = {}, resumen = {} }) {
    const [q, setQ] = useState(filtros.q ?? '');
    const filtrar = (cambios) => router.get(route('admin.cuentas-tienda.index'), { ...filtros, ...cambios }, { preserveState: true, replace: true });
    const filas = cuentas?.data ?? [];

    return (
        <AdminLayout title="Usuarios de la tienda">
            <Head title="Usuarios de la tienda" />

            <PageHeader
                title="Usuarios de la tienda"
                subtitle="Las cuentas que crean los clientes para comprar por la web. No entran al panel: los usuarios del equipo están en Sistema → Usuarios y roles."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Resumen icon={Users} label="Cuentas creadas" valor={resumen.cuentas ?? 0} tono="bg-slate-100 text-slate-700" />
                <Resumen icon={ShoppingBag} label="Ya compraron" valor={resumen.compraron ?? 0} tono="bg-emerald-50 text-emerald-700" />
                <Resumen icon={UserRound} label="Nuevas esta semana" valor={resumen.esta_semana ?? 0} tono="bg-blue-50 text-blue-700" />
                <Resumen icon={KeyRound} label="Entran con Google" valor={resumen.con_google ?? 0} tono="bg-violet-50 text-violet-700" />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <form className="relative min-w-[240px] flex-1" onSubmit={(e) => { e.preventDefault(); filtrar({ q, page: undefined }); }}>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, correo o teléfono" className="pl-9" aria-label="Buscar cuentas" />
                </form>
                <select value={filtros.filtro ?? 'todos'} onChange={(e) => filtrar({ filtro: e.target.value, page: undefined })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" aria-label="Filtrar cuentas">
                    <option value="todos">Todas las cuentas</option>
                    <option value="compraron">Ya compraron</option>
                    <option value="sin_pedidos">Sin pedidos</option>
                </select>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                {filas.length === 0 ? (
                    <EmptyState icon={Users} title={filtros.q ? 'No encontramos esa cuenta' : 'Todavía no hay cuentas'}
                        text={filtros.q ? 'Prueba con otra parte del nombre, el correo o el teléfono.' : 'Cuando un cliente cree su cuenta para comprar por la web, aparece acá.'} />
                ) : (
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-slate-50 text-left text-[12px] uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-bold">Cliente</th>
                                <th className="px-4 py-3 font-bold">Teléfono</th>
                                <th className="px-4 py-3 text-right font-bold">Pedidos</th>
                                <th className="px-4 py-3 text-right font-bold">Comprado</th>
                                <th className="px-4 py-3 font-bold">Último pedido</th>
                                <th className="px-4 py-3 font-bold">Cuenta desde</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filas.map((c) => (
                                <tr key={c.id} className="cursor-pointer transition-colors hover:bg-slate-50/70" onClick={() => router.visit(route('admin.cuentas-tienda.show', c.id))}>
                                    <td className="px-4 py-3">
                                        <Link href={route('admin.cuentas-tienda.show', c.id)} className="font-bold text-[#011446] hover:underline" onClick={(e) => e.stopPropagation()}>
                                            {c.nombre}
                                        </Link>
                                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                            {c.email}
                                            {c.google && <Badge tone="lila">Google</Badge>}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-slate-600">{c.telefono || '—'}</td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{c.pedidos}</td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{c.total_comprado > 0 ? bsFmt(c.total_comprado) : '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{c.ultimo_pedido ? fmtDate(c.ultimo_pedido) : '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{fmtDate(c.creada_en)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {cuentas?.links?.length > 3 && (
                <nav className="mt-4 flex flex-wrap gap-1" aria-label="Paginación">
                    {cuentas.links.map((l, i) => (
                        <Link key={i} href={l.url ?? '#'} preserveState
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${l.active ? 'bg-[#011446] text-white' : l.url ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300'}`}
                            dangerouslySetInnerHTML={{ __html: l.label }} />
                    ))}
                </nav>
            )}
        </AdminLayout>
    );
}
