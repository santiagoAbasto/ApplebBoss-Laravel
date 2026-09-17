import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShoppingBag, Check, Minus } from '@/Components/Store/Icons';
import StoreLayout, { StoreContainer, useStoreCart } from '@/Layouts/StoreLayout';

const money = (v) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v);

// Rows to compare — label + key from product object
const ROWS = [
    { label: 'Precio',      key: 'price',     render: (v) => v ? money(v) : '—' },
    { label: 'Condición',   key: 'condition',  render: (v) => v ?? '—' },
    { label: 'Categoría',   key: 'category_label', render: (v) => v ?? '—' },
    { label: 'Garantía',    key: 'garantia',   render: (v) => v ?? '—' },
    { label: 'Capacidad',   key: '_cap',       render: (v) => v ?? '—' },
    { label: 'Color',       key: '_color',     render: (v) => v ?? '—' },
    { label: 'RAM',         key: '_ram',       render: (v) => v ?? '—' },
    { label: 'Almacenamiento', key: '_storage', render: (v) => v ?? '—' },
    { label: 'Chip',        key: '_chip',      render: (v) => v ?? '—' },
    { label: 'Pantalla',    key: '_screen',    render: (v) => v ?? '—' },
    { label: 'Cámara',      key: '_camera',    render: (v) => v ?? '—' },
    { label: 'Batería',     key: '_battery',   render: (v) => v ? `${v} %` : '—' },
];

function extractVal(product, key) {
    if (!key.startsWith('_')) return product[key];
    const attr = product.atributos ?? {};
    const map = {
        _cap:     attr.capacidad ?? attr.almacenamiento,
        _color:   attr.color,
        _ram:     attr.ram,
        _storage: attr.almacenamiento,
        _chip:    attr.chip,
        _screen:  attr.tamano_pantalla ?? attr.pantalla,
        _camera:  attr.camara_principal ?? attr.camara,
        _battery: attr.salud_bateria ?? attr.bateria,
    };
    return map[key] ?? null;
}

function isEmpty(val) {
    return val === null || val === undefined || val === '' || val === '—';
}

function Cell({ value, rendered, isHighlight }) {
    if (isEmpty(value)) {
        return (
            <td className="px-4 py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                <Minus className="mx-auto h-4 w-4 opacity-30" />
            </td>
        );
    }
    return (
        <td
            className="px-4 py-4 text-center text-sm font-semibold"
            style={{ color: isHighlight ? 'var(--ab-periwinkle)' : 'var(--text-primary)' }}
        >
            {rendered}
        </td>
    );
}

function CompareTable({ products }) {
    const cols = products.length;

    // For price row, find lowest price to highlight
    const prices = products.map((p) => p.price ?? 0).filter(Boolean);
    const minPrice = prices.length ? Math.min(...prices) : null;

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: `${cols * 220 + 160}px` }}>
                {/* Product headers */}
                <thead>
                    <tr>
                        <th className="w-40 shrink-0 px-4 pb-6 pt-0 text-left text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                            &nbsp;
                        </th>
                        {products.map((p) => (
                            <th key={p.slug} className="px-4 pb-6 pt-0 text-center align-top">
                                {/* Image */}
                                <Link href={p.url} className="block">
                                    <div
                                        className="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-2xl"
                                        style={{ background: 'var(--surface-muted)' }}
                                    >
                                        {p.images?.[0] ? (
                                            <img
                                                src={p.images[0].url_medium ?? p.images[0].url_card}
                                                alt={p.name}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <div className="h-full w-full" />
                                        )}
                                    </div>
                                    <p
                                        className="text-sm font-black leading-snug hover:underline"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {p.name}
                                    </p>
                                </Link>

                                {/* CTA */}
                                <div className="mt-4 flex flex-col items-center gap-2">
                                    <p className="text-lg font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                                        {money(p.price)}
                                    </p>
                                    {p.available ? (
                                        <AddButton product={p} />
                                    ) : (
                                        <span
                                            className="rounded-full px-4 py-2 text-xs font-bold"
                                            style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)' }}
                                        >
                                            No disponible
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Rows */}
                <tbody>
                    {ROWS.map(({ label, key, render }, rowIdx) => {
                        const vals = products.map((p) => extractVal(p, key));
                        // Skip row if all empty
                        if (vals.every(isEmpty)) return null;

                        return (
                            <tr
                                key={key}
                                style={{ background: rowIdx % 2 === 0 ? 'transparent' : 'var(--surface-muted)' }}
                            >
                                <td
                                    className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    {label}
                                </td>
                                {products.map((p, pIdx) => {
                                    const val = vals[pIdx];
                                    const rendered = render(val);
                                    const isHighlight = key === 'price' && val === minPrice && prices.length > 1;
                                    return <Cell key={p.slug} value={val} rendered={rendered} isHighlight={isHighlight} />;
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function AddButton({ product }) {
    const { add } = useStoreCart();
    return (
        <button
            type="button"
            onClick={() => add(product)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}
        >
            <ShoppingBag className="h-4 w-4" /> Agregar
        </button>
    );
}

export default function Compare({ products }) {
    return (
        <StoreLayout>

            <StoreContainer className="pb-24 pt-10">
                {/* Back */}
                <Link
                    href="/catalogo"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <ArrowLeft className="h-4 w-4" /> Volver al catálogo
                </Link>

                <h1
                    className="mb-8 text-[clamp(1.75rem,4vw,3rem)] font-black leading-tight tracking-[-0.03em]"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Comparar productos
                </h1>

                {products.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>
                            No hay productos seleccionados para comparar.
                        </p>
                        <Link
                            href="/catalogo"
                            className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-bold"
                            style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}
                        >
                            Ver catálogo
                        </Link>
                    </div>
                ) : (
                    <CompareTable products={products} />
                )}
            </StoreContainer>
        </StoreLayout>
    );
}
