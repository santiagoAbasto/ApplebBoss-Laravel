import { X, ArrowRight } from '@/Components/Store/Icons';
import { useCompare } from './CompareContext';

const money = (v) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v);

export default function CompareBar() {
    const { items, clear } = useCompare();

    if (items.length === 0) return null;

    const slugs = items.map((p) => p.slug).join(',');
    const href = `/comparar?slugs=${encodeURIComponent(slugs)}`;

    return (
        <div
            data-tope-flotante
            className="fixed bottom-0 inset-x-0 z-[9000] border-t shadow-2xl"
            style={{ background: 'var(--ab-navy)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-8">
                {/* Products */}
                <div className="flex flex-1 items-center gap-3 overflow-x-auto">
                    {items.map((p) => (
                        <div key={p.slug} className="flex shrink-0 items-center gap-2">
                            <div
                                className="h-10 w-10 shrink-0 overflow-hidden rounded-lg"
                                style={{ background: 'rgba(255,255,255,0.1)' }}
                            >
                                {p.image ? (
                                    <img src={p.image} alt={p.name} className="h-full w-full object-contain" />
                                ) : (
                                    <div className="h-full w-full" />
                                )}
                            </div>
                            <div className="hidden sm:block">
                                <p className="max-w-[120px] truncate text-[11px] font-bold text-white">{p.name}</p>
                                <p className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                    {money(p.price)}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Empty slots */}
                    {Array.from({ length: 3 - items.length }).map((_, i) => (
                        <div
                            key={`empty-${i}`}
                            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed sm:flex"
                            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                        >
                            <span className="text-[18px] font-thin" style={{ color: 'rgba(255,255,255,0.25)' }}>+</span>
                        </div>
                    ))}
                </div>

                {/* Label */}
                <span className="hidden shrink-0 text-[11px] font-semibold sm:block" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {items.length} de 3
                </span>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        onClick={clear}
                        className="grid h-8 w-8 place-items-center rounded-full transition-opacity hover:opacity-70"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                        aria-label="Limpiar comparación"
                    >
                        <X className="h-4 w-4 text-white" />
                    </button>
                    <a
                        href={href}
                        className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
                        style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                    >
                        Comparar <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
