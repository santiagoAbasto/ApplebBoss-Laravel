import { Link } from '@inertiajs/react';
import { Plus, GitCompare } from '@/Components/Store/Icons';
import ProductVisual from './ProductVisual';
import { useCompare } from './CompareContext';
import { useUsdt } from '@/Layouts/StoreLayout';

const money = (value) =>
    new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        maximumFractionDigits: 0,
    }).format(value);

// Badge de condición del producto
function ConditionBadge({ condition }) {
    if (!condition || condition === 'Nuevo') return null;

    const styles = {
        Seminuevo: { bg: 'rgba(88,94,159,0.12)', color: '#28224F' },
        'Open Box': { bg: 'rgba(198,203,54,0.20)', color: '#3A3F00' },
    };

    const style = styles[condition] ?? { bg: 'rgba(0,0,0,0.07)', color: '#55556A' };

    return (
        <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={style}
        >
            {condition}
        </span>
    );
}

export default function ProductCard({ product, onAdd, priority = false }) {
    const enUsdt = useUsdt();
    const isMyskin = product.is_myskin ?? false;
    const { inCompare, toggle, items, max } = useCompare();
    const compared = inCompare(product.slug);
    const full = items.length >= max && !compared;

    return (
        <article className="group min-w-0">
            {/* Imagen */}
            <Link
                href={product.url}
                className="block overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ '--tw-ring-color': 'var(--ab-periwinkle)' }}
                tabIndex={0}
            >
                <ProductVisual
                    product={product}
                    style={{ aspectRatio: '4 / 3' }}
                    className="transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                    priority={priority}
                />
            </Link>

            {/* Info */}
            <div className="pt-3.5">
                {/* Badges */}
                <div className="mb-1.5 flex items-center gap-2">
                    {isMyskin ? (
                        <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
                            style={{ background: '#A3BD31', color: '#0C1B47' }}
                        >
                            MYSKIN
                        </span>
                    ) : (
                        <span
                            className="text-[11px] font-semibold"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {product.marca ?? product.category_label}
                        </span>
                    )}
                    <ConditionBadge condition={product.condition} />
                    {product.battery && product.condition === 'Seminuevo' && (
                        <span
                            className="text-[10px] font-semibold"
                            style={{ color: 'var(--ab-periwinkle)' }}
                        >
                            Bat. {product.battery}%
                        </span>
                    )}
                </div>

                {/* Nombre y precio */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <Link
                            href={product.url}
                            className="block text-[15px] font-bold leading-tight transition-opacity hover:opacity-70 focus:outline-none focus-visible:underline"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <span className="line-clamp-2">{product.name}</span>
                        </Link>

                        {/* Specs clave */}
                        {product.specs?.length > 0 && (
                            <p
                                className="mt-1 truncate text-[11px]"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {product.specs.slice(0, 2).join(' · ')}
                            </p>
                        )}

                        {/* El precio va en Bs con su equivalente en USDT al dólar paralelo */}
                        {product.promo_price ? (
                            <div className="mt-2">
                                <p className="flex flex-wrap items-baseline gap-x-2">
                                    <span className="text-base font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                                        {money(product.promo_price)}
                                    </span>
                                    <span className="text-[11px] font-semibold tabular-nums line-through" style={{ color: 'var(--text-muted)' }}>
                                        {money(product.price)}
                                    </span>
                                </p>
                                {enUsdt(product.promo_price) && (
                                    <p className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                        ≈ {enUsdt(product.promo_price)}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="mt-2">
                                <p className="text-base font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                                    {money(product.price)}
                                </p>
                                {enUsdt(product.price) && (
                                    <p className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                        ≈ {enUsdt(product.price)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => onAdd(product)}
                            className="grid h-10 w-10 place-items-center rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            style={{
                                background: 'var(--ab-lime)',
                                color: 'var(--text-on-lime)',
                                '--tw-ring-color': 'var(--ab-periwinkle)',
                            }}
                            aria-label={`Agregar ${product.name} al carrito`}
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => toggle(product)}
                            disabled={full}
                            className="grid h-7 w-7 place-items-center rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-30"
                            style={{
                                background: compared ? 'var(--ab-periwinkle)' : 'var(--surface-muted)',
                                color: compared ? '#FFFFFF' : 'var(--text-muted)',
                                '--tw-ring-color': 'var(--ab-periwinkle)',
                            }}
                            title={compared ? 'Quitar de comparación' : full ? 'Máximo 3 productos' : 'Comparar'}
                            aria-label={compared ? `Quitar ${product.name} de comparación` : `Comparar ${product.name}`}
                        >
                            <GitCompare className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
