import { StoreContainer } from '@/Layouts/StoreLayout';
import { useNombreTienda } from '@/Components/Store/tienda';

/**
 * Franja de confianza en carrusel continuo (debajo del hero).
 * CSS puro: animación en GPU, se pausa al pasar el mouse o con foco,
 * y queda quieta (en grilla) si el usuario pidió reducir el movimiento.
 * La segunda copia de los ítems solo existe para el loop y se oculta a lectores de pantalla.
 */
export default function TrustMarquee({ items, label }) {
    const nombre = useNombreTienda();
    const loop = [...items, ...items];

    return (
        <section aria-label={label ?? `Por qué comprar en ${nombre}`} className="pb-2 pt-12 sm:pt-16" style={{ background: 'var(--surface-white)' }}>
            <StoreContainer>
                <div
                    className="ab-marquee relative overflow-hidden rounded-2xl border"
                    style={{
                        borderColor: 'var(--border-light)',
                        background: 'var(--surface-muted)',
                        WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)',
                        maskImage: 'linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)',
                    }}
                >
                    <ul className="ab-marquee-track flex w-max items-center">
                        {loop.map(({ icon: Icon, text }, i) => (
                            <li
                                key={i}
                                aria-hidden={i >= items.length ? 'true' : undefined}
                                className="ab-marquee-item flex shrink-0 items-center gap-3 py-5 pl-8"
                            >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-sm"
                                    style={{ color: 'var(--ab-navy)', boxShadow: '0 1px 2px rgba(1,20,70,0.08), 0 0 0 1px rgba(1,20,70,0.05)' }}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="whitespace-nowrap text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{text}</span>
                                <span aria-hidden="true" className="ml-5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--ab-lime)' }} />
                            </li>
                        ))}
                    </ul>
                </div>
            </StoreContainer>

            <style>{`
                @keyframes ab-marquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
                .ab-marquee-track { animation: ab-marquee 42s linear infinite; will-change: transform; }
                .ab-marquee:hover .ab-marquee-track,
                .ab-marquee:focus-within .ab-marquee-track { animation-play-state: paused; }
                @media (prefers-reduced-motion: reduce) {
                    .ab-marquee-track { animation: none; width: 100%; flex-wrap: wrap; justify-content: center; }
                    .ab-marquee-item[aria-hidden="true"] { display: none; }
                }
            `}</style>
        </section>
    );
}
