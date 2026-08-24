import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { AlertCircle, CheckCircle, Clock, Eye, Globe, Image, Search, Tag, X } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (v) =>
    v != null
        ? new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v)
        : '—';

const ESTADO_CONFIG = {
    'Publicado':          { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    'Borrador':           { color: 'bg-gray-100 text-gray-700',       icon: Clock },
    'Incompleto':         { color: 'bg-amber-100 text-amber-800',     icon: AlertCircle },
    'Programado':         { color: 'bg-blue-100 text-blue-700',       icon: Clock },
    'Oculto':             { color: 'bg-slate-100 text-slate-600',     icon: X },
};

const TABS = [
    { key: 'todos',      label: 'Todos' },
    { key: 'publicados', label: 'Publicados' },
    { key: 'borradores', label: 'Borradores' },
    { key: 'sin_imagen', label: 'Sin imagen' },
    { key: 'myskin',     label: 'MYSKIN' },
    { key: 'seminuevos', label: 'Seminuevos' },
    { key: 'promociones', label: 'Promociones' },
];

// ─── Badge de estado ───────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
    const cfg = ESTADO_CONFIG[estado] ?? { color: 'bg-gray-100 text-gray-600', icon: Clock };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {estado}
        </span>
    );
}

// ─── Fila de producto ──────────────────────────────────────────────────────────
function PubRow({ pub }) {
    return (
        <tr className="group hover:bg-gray-50/80">
            {/* Producto */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                        style={{ border: '1px solid rgba(0,0,0,0.06)' }}
                    >
                        {pub.thumb ? (
                            <img src={pub.thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <Image className="h-5 w-5 text-gray-300" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900 text-sm">{pub.titulo}</p>
                        <p className="text-[11px] text-gray-400 truncate">{pub.producto_tipo} #{pub.producto_id}</p>
                        {pub.storefront === 'MYSKIN' && (
                            <span className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold"
                                style={{ background: '#A3BD31', color: '#0C1B47' }}>
                                MYSKIN
                            </span>
                        )}
                    </div>
                </div>
            </td>

            {/* Categoría */}
            <td className="hidden px-4 py-3 text-sm text-gray-600 md:table-cell">
                <span className="capitalize">{pub.categoria}</span>
                {pub.condicion && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                        {pub.condicion}
                    </span>
                )}
            </td>

            {/* Precio */}
            <td className="hidden px-4 py-3 text-sm font-mono lg:table-cell">
                <div>
                    <span className="font-semibold text-gray-900">{money(pub.precio_venta)}</span>
                    {pub.precio_promocional && (
                        <span className="ml-2 text-xs font-bold text-emerald-700">{money(pub.precio_promocional)}</span>
                    )}
                </div>
            </td>

            {/* Estado */}
            <td className="px-4 py-3">
                <EstadoBadge estado={pub.estado_publicacion} />
                {pub.campos_faltantes?.length > 0 && (
                    <p className="mt-1 text-[10px] text-amber-600 leading-tight">
                        Falta: {pub.campos_faltantes.slice(0, 2).join(', ')}
                        {pub.campos_faltantes.length > 2 && ` +${pub.campos_faltantes.length - 2}`}
                    </p>
                )}
            </td>

            {/* Imágenes */}
            <td className="hidden px-4 py-3 lg:table-cell">
                <span className={`flex items-center gap-1 text-xs ${pub.imagenes_count === 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                    <Image className="h-3.5 w-3.5" />
                    {pub.imagenes_count}
                </span>
            </td>

            {/* Acciones */}
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                    {pub.publicado && (
                        <a
                            href={`/productos/${pub.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden items-center gap-1 text-xs text-blue-600 hover:underline sm:inline-flex"
                        >
                            <Eye className="h-3.5 w-3.5" /> Ver
                        </a>
                    )}
                    <Link
                        href={route('admin.catalogo.edit', pub.id)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300"
                    >
                        Editar
                    </Link>
                </div>
            </td>
        </tr>
    );
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function CatalogoIndex({ publicaciones, filters, counts }) {
    const [q, setQ] = useState(filters.q || '');

    const navigate = (params) => {
        router.get(route('admin.catalogo.index'), { ...filters, ...params }, { replace: true, preserveScroll: true });
    };

    const search = (e) => {
        e.preventDefault();
        navigate({ q: q || undefined });
    };

    return (
        <AdminLayout>
            <Head title="Catálogo público" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Catálogo público</h1>
                        <p className="mt-1 text-sm text-gray-500">Gestioná qué productos aparecen en Apple Boss.</p>
                    </div>
                    <a
                        href="/catalogo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        <Globe className="h-4 w-4" /> Ver tienda
                    </a>
                </div>

                {/* Tab rail + Buscar */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Tabs */}
                    <nav className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
                        {TABS.map(({ key, label }) => {
                            const count = counts?.[key] ?? 0;
                            const active = filters.tab === key || (key === 'todos' && !filters.tab);
                            return (
                                <button
                                    key={key}
                                    onClick={() => navigate({ tab: key, page: undefined })}
                                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                                        active
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {label}
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-500'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Search */}
                    <form onSubmit={search} className="relative shrink-0">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar publicaciones..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64"
                        />
                    </form>
                </div>

                {/* Tabla */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Producto</th>
                                <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 md:table-cell">Categoría</th>
                                <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:table-cell">Precio</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                                <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:table-cell">Imgs</th>
                                <th className="px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {publicaciones.data?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <Tag className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                                        <p className="text-sm text-gray-500">No hay publicaciones en esta categoría.</p>
                                        <p className="mt-1 text-xs text-gray-400">Para crear una, abrí un producto del inventario y seleccioná "Publicar en web".</p>
                                    </td>
                                </tr>
                            )}
                            {publicaciones.data?.map((pub) => (
                                <PubRow key={pub.id} pub={pub} />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {publicaciones.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {publicaciones.from}–{publicaciones.to} de {publicaciones.total} resultados
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={!publicaciones.prev_page_url}
                                onClick={() => publicaciones.prev_page_url && router.get(publicaciones.prev_page_url)}
                                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={!publicaciones.next_page_url}
                                onClick={() => publicaciones.next_page_url && router.get(publicaciones.next_page_url)}
                                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
