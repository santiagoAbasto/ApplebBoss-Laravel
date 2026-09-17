import { Head, Link } from '@inertiajs/react';
import StoreLayout, { useStoreCart } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';
import { useNombreTienda } from '@/Components/Store/tienda';

// El carrito vive dentro de StoreLayout: el contenido que usa useStoreCart va en un componente hijo.
export default function MySkinHub(props) {
    return (
        <StoreLayout>
            <MySkinHubContent {...props} />
        </StoreLayout>
    );
}

function MySkinHubContent({ series, otras, total }) {
    const { add } = useStoreCart();
    const nombre = useNombreTienda();

    return (
        <>

            {/* Hero MYSKIN */}
            <section className="bg-[#C6CB36] py-16 px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#011446]/60">{nombre}</p>
                    <h1 className="text-4xl font-black tracking-tight text-[#011446] sm:text-5xl">MYSKIN</h1>
                    <p className="mt-4 text-base text-[#011446]/80 max-w-xl mx-auto">
                        Fundas y cases para iPhone. Diseño y protección. Exclusivo para modelos de iPhone.
                    </p>
                    {total > 0 && (
                        <p className="mt-3 text-sm font-semibold text-[#011446]">{total} modelos disponibles</p>
                    )}
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-12 space-y-14">

                {/* Series por modelo de iPhone */}
                {series.map(({ serie, items }) => (
                    <section key={serie}>
                        <div className="flex items-end justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Para {serie}</h2>
                            <Link
                                href={`/catalogo?categoria=fundas&q=${encodeURIComponent(serie)}`}
                                className="text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                Ver todas →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {items.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} />
                            ))}
                        </div>
                    </section>
                ))}

                {/* Otras */}
                {otras.length > 0 && (
                    <section>
                        <h2 className="mb-4 text-lg font-bold text-gray-900">Más fundas</h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {otras.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} />
                            ))}
                        </div>
                    </section>
                )}

                {total === 0 && (
                    <div className="py-20 text-center text-gray-400">
                        <p className="text-lg font-semibold">No hay fundas disponibles en este momento.</p>
                        <p className="mt-2 text-sm">Vuelve pronto o escríbenos para consultar.</p>
                    </div>
                )}

                {/* CTA a catálogo completo */}
                <div className="text-center">
                    <Link
                        href="/catalogo?categoria=fundas"
                        className="inline-block rounded-full bg-[#011446] px-8 py-3 text-sm font-semibold text-white hover:bg-[#011446]/90 transition-colors"
                    >
                        Ver catálogo completo de fundas
                    </Link>
                </div>

                {/* Info compatibilidad */}
                <section className="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-8">
                    <h2 className="mb-3 text-base font-bold text-gray-900">¿Cómo sé si es compatible con mi iPhone?</h2>
                    <p className="text-sm text-gray-600">
                        Cada funda indica con qué modelos de iPhone es compatible. Revisa la sección de compatibilidad en el producto antes de comprar.
                        Si tienes dudas, escríbenos y te asesoramos.
                    </p>
                </section>
            </div>
        </>
    );
}
