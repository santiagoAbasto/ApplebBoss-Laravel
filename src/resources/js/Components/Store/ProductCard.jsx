import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import ProductVisual from './ProductVisual';

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

export default function ProductCard({ product, onAdd }) {
    const isMyskin = product.is_myskin ?? false;

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
                            {product.category_label}
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

                        <p
                            className="mt-2 text-base font-black tabular-nums"
                            style={{ color: 'var(--ab-navy)' }}
                        >
                            {money(product.price)}
                        </p>
                    </div>

                    {/* Add to cart */}
                    <button
                        type="button"
                        onClick={() => onAdd(product)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                            background: 'var(--ab-lime)',
                            color: 'var(--text-on-lime)',
                            '--tw-ring-color': 'var(--ab-periwinkle)',
                        }}
                        aria-label={`Agregar ${product.name} al carrito`}
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </article>
    );
}
