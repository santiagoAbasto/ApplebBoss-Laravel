import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { MailWarning, Package, ShoppingBag } from 'lucide-react';
import StoreLayout, { StoreContainer, money } from '@/Layouts/StoreLayout';

const TONO = {
    pendiente_pago:   { fondo: '#fef3c7', texto: '#92400e' },
    pago_en_revision: { fondo: '#ede9fe', texto: '#5b21b6' },
    pagado:           { fondo: '#d1fae5', texto: '#065f46' },
    preparando:       { fondo: '#dbeafe', texto: '#1e40af' },
    enviado:          { fondo: '#e0e7ff', texto: '#3730a3' },
    entregado:        { fondo: '#f1f5f9', texto: '#334155' },
    cancelado:        { fondo: '#ffe4e6', texto: '#9f1239' },
};

const fecha = (iso) => (iso
    ? new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/La_Paz' })
    : '');

function MiCuenta({ pedidos, perfil }) {
    const filas = pedidos?.data ?? [];

    return (
        <>
            <Head title="Mi cuenta" />
            <StoreContainer className="py-8 md:py-12">
                <h1 className="text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>
                    Hola, {perfil.nombre.split(' ')[0]}
                </h1>
                <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{perfil.email}</p>

                {!perfil.verificado && (
                    <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                        <MailWarning className="mt-0.5 h-5 w-5 shrink-0" />
                        Te mandamos un correo para confirmar tu dirección. Confírmala para no perderte los avisos de tus pedidos.
                    </p>
                )}

                <h2 className="mt-9 mb-4 text-lg font-black" style={{ color: 'var(--text-primary)' }}>Mis pedidos</h2>

                {filas.length === 0 ? (
                    <div className="rounded-2xl border px-6 py-14 text-center" style={{ borderColor: 'var(--border-light)' }}>
                        <ShoppingBag className="mx-auto mb-4 h-11 w-11" style={{ color: 'var(--text-muted)' }} />
                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Todavía no hiciste ningún pedido</p>
                        <Link href="/catalogo" className="mt-5 inline-block rounded-full px-7 py-3 text-sm font-bold text-white"
                            style={{ background: 'var(--ab-navy)' }}>
                            Ver el catálogo
                        </Link>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {filas.map((p) => {
                            const tono = TONO[p.estado] ?? TONO.entregado;
                            return (
                                <li key={p.codigo}>
                                    <Link
                                        href={route('seguimiento.ver', { codigo: p.codigo, t: p.token })}
                                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 transition-shadow hover:shadow-md"
                                        style={{ borderColor: 'var(--border-light)' }}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2.5">
                                                <span className="font-black" style={{ color: 'var(--ab-navy)' }}>{p.codigo}</span>
                                                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                                    style={{ background: tono.fondo, color: tono.texto }}>
                                                    {p.etiqueta}
                                                </span>
                                            </div>
                                            <p className="mt-1.5 truncate text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {p.articulos.join(' · ')}
                                            </p>
                                            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{fecha(p.creado_en)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{money(p.total)}</p>
                                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--ab-navy)' }}>
                                                <Package className="h-3.5 w-3.5" /> Ver seguimiento
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </StoreContainer>
        </>
    );
}

export default function Index(props) {
    return <StoreLayout><MiCuenta {...props} /></StoreLayout>;
}
