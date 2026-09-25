import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { ArrowLeft, BadgeCheck, ChevronDown, ExternalLink, Mail, Package, Phone, Star } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge, Card, EmptyState, PageHeader, bsFmt, fmtDate } from '@/Components/Admin/ui';

const TONO = {
    pendiente_pago: 'amber', pago_en_revision: 'violet', pagado: 'emerald', preparando: 'blue',
    enviado: 'navy', entregado: 'slate', cancelado: 'rose',
};
const ENTREGA = { retiro: 'Retiro en tienda', envio: 'Envío al interior', delivery: 'Delivery en Cochabamba' };
const METODO = {
    binance_pay: 'Binance Pay', transferencia: 'Transferencia', efectivo_tienda: 'Pago al retirar',
    qr_bnb: 'QR del BNB', libelula: 'Libélula',
};

/* Los mismos pasos que ve el cliente en su seguimiento */
function pasosPara(entrega) {
    const base = [['Recibido', ['pendiente_pago', 'pago_en_revision']], ['Pagado', ['pagado']], ['Preparando', ['preparando']]];
    return entrega === 'retiro'
        ? [...base, ['Retirado', ['entregado']]]
        : [...base, [entrega === 'delivery' ? 'En camino' : 'Enviado', ['enviado']], ['Entregado', ['entregado']]];
}

function Avance({ pedido }) {
    if (pedido.estado === 'cancelado') return <p className="text-xs font-semibold text-rose-600">Cancelado</p>;
    const pasos = pasosPara(pedido.entrega);
    const actual = Math.max(0, pasos.findIndex(([, estados]) => estados.includes(pedido.estado)));
    const terminado = pedido.estado === 'entregado';

    return (
        <div>
            <div className="flex gap-1">
                {pasos.map(([label], i) => (
                    <span key={label} className={`h-1.5 flex-1 rounded-full ${i < actual || terminado ? 'bg-[#011446]' : i === actual ? 'bg-[#C6CB36]' : 'bg-slate-200'}`} />
                ))}
            </div>
            <div className="mt-1.5 flex gap-1">
                {pasos.map(([label], i) => (
                    <span key={label} className={`flex-1 text-[10px] font-bold ${i <= actual ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
                ))}
            </div>
        </div>
    );
}

function TarjetaPedido({ pedido }) {
    const [abierto, setAbierto] = useState(false);

    return (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={route('admin.pedidos.show', pedido.id)} className="text-base font-extrabold text-[#011446] hover:underline">{pedido.codigo}</Link>
                        <Badge tone={TONO[pedido.estado] ?? 'slate'}>{pedido.etiqueta}</Badge>
                        {pedido.sin_cuenta && <Badge tone="slate">Antes de crear la cuenta</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{fmtDate(pedido.creado_en)} · {ENTREGA[pedido.entrega] ?? pedido.entrega} · {METODO[pedido.metodo] ?? pedido.metodo ?? 'Sin método'}</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-extrabold tabular-nums text-slate-900">{bsFmt(pedido.total)}</p>
                    <Link href={route('admin.pedidos.show', pedido.id)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
                        Gestionar el pedido <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_280px]">
                <div className="space-y-1.5 text-sm text-slate-700">
                    {pedido.articulos.map((a, i) => <p key={i} className="flex items-center gap-2"><Package className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {a}</p>)}
                    {pedido.destino && <p className="text-xs text-slate-500">Entrega en: {pedido.destino}</p>}
                    {pedido.resena && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                            Dejó su opinión:
                            <span className="inline-flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= pedido.resena.calificacion ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}</span>
                            {!pedido.resena.publicada && <Link href={route('admin.resenas.index')} className="font-semibold text-violet-700 underline">espera aprobación</Link>}
                        </p>
                    )}
                </div>
                <Avance pedido={pedido} />
            </div>

            <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}
                className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">
                Línea de tiempo ({pedido.eventos.length})
                <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
            </button>
            {abierto && (
                <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">
                    {pedido.eventos.map((e, i) => (
                        <li key={i} className="relative">
                            <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${e.publico ? 'bg-[#011446]' : 'bg-amber-400'}`} />
                            <p className="text-sm font-bold text-slate-800">
                                {e.titulo}
                                {!e.publico && <Badge tone="amber" className="ml-2">Interno</Badge>}
                            </p>
                            {e.detalle && <p className="text-xs text-slate-600">{e.detalle}</p>}
                            <p className="text-[11px] text-slate-400">{fmtDate(e.fecha)}{e.autor ? ` · ${e.autor}` : ''}</p>
                        </li>
                    ))}
                </ol>
            )}
        </article>
    );
}

function Dato({ label, valor }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <p className="text-[12px] font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-extrabold leading-none tabular-nums text-slate-900">{valor}</p>
        </div>
    );
}

export default function Show({ cuenta, resumen = {}, pedidos = [] }) {
    const digitos = (cuenta.telefono ?? '').replace(/\D/g, '');
    // En Bolivia los celulares tienen 8 dígitos: se le suma el 591 para abrir WhatsApp
    const whatsapp = digitos.length === 8 ? `591${digitos}` : digitos.length > 8 ? digitos : null;

    return (
        <AdminLayout title="Usuarios de la tienda">
            <Head title={cuenta.nombre} />

            <Link href={route('admin.cuentas-tienda.index')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
                <ArrowLeft className="h-4 w-4" /> Usuarios de la tienda
            </Link>

            <PageHeader title={cuenta.nombre} subtitle={`Cuenta creada el ${fmtDate(cuenta.creada_en)}.`} />

            <Card className="mt-5">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                    <a href={`mailto:${cuenta.email}`} className="inline-flex items-center gap-2 font-semibold text-slate-700 hover:underline"><Mail className="h-4 w-4 text-slate-400" /> {cuenta.email}</a>
                    {cuenta.telefono && (
                        <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                            <Phone className="h-4 w-4 text-slate-400" /> {cuenta.telefono}
                            {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 underline">WhatsApp</a>}
                        </span>
                    )}
                    <span className="flex flex-wrap gap-2">
                        {cuenta.google && <Badge tone="lila">Entra con Google</Badge>}
                        {cuenta.verificada && <Badge tone="emerald"><BadgeCheck className="h-3 w-3" /> Correo verificado</Badge>}
                    </span>
                </div>
            </Card>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Dato label="Pedidos" valor={resumen.pedidos ?? 0} />
                <Dato label="Pagados" valor={resumen.pagados ?? 0} />
                <Dato label="Total comprado" valor={resumen.total_comprado ? bsFmt(resumen.total_comprado) : '—'} />
                <Dato label="En curso" valor={resumen.en_curso ?? 0} />
                <Dato label="Último pedido" valor={resumen.ultimo_pedido ? fmtDate(resumen.ultimo_pedido) : '—'} />
            </div>

            <h2 className="mb-3 mt-8 text-sm font-black uppercase tracking-wide text-slate-500">Sus pedidos</h2>
            {pedidos.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white">
                    <EmptyState icon={Package} title="Todavía no hizo pedidos" text="Creó su cuenta, pero no terminó ninguna compra." />
                </div>
            ) : (
                <div className="space-y-4">
                    {pedidos.map((p) => <TarjetaPedido key={p.id} pedido={p} />)}
                </div>
            )}
        </AdminLayout>
    );
}
