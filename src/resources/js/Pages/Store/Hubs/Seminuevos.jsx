import { Head, Link } from '@inertiajs/react';
import StoreLayout, { useStoreCart } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';
import { ChevronDown } from '@/Components/Store/Icons';
import { useNombreTienda } from '@/Components/Store/tienda';

function SectionHeader({ title, href, count }) {
    return (
        <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {count > 0 && (
                <Link href={href} className="text-sm font-medium text-gray-500 hover:text-gray-900">
                    Ver todos ({count}) →
                </Link>
            )}
        </div>
    );
}

// El carrito vive dentro de StoreLayout: el contenido que usa useStoreCart va en un componente hijo.
export default function SeminuevosHub(props) {
    return (
        <StoreLayout>
            <SeminuevosHubContent {...props} />
        </StoreLayout>
    );
}

function SeminuevosHubContent({ celulares, mac, otros, total, faqs = [] }) {
    const { add } = useStoreCart();
    const nombre = useNombreTienda();

    return (
        <>

            {/* Hero */}
            <section className="bg-gray-900 text-white py-16 px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">{nombre}</p>
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Seminuevos</h1>
                    <p className="mt-4 text-base text-gray-300 max-w-xl mx-auto">
                        Equipos usados, revisados individualmente. La condición, estado de batería y garantía se indican en cada publicación.
                    </p>
                    {total > 0 && (
                        <p className="mt-3 text-sm font-semibold text-gray-400">{total} equipos disponibles</p>
                    )}
                </div>
            </section>

            {/* Transparencia */}
            <section className="border-b border-gray-100 bg-gray-50 py-6 px-4">
                <div className="mx-auto max-w-4xl">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[
                            { titulo: 'Condición explícita', desc: 'Nuevo / Seminuevo / Open Box. Nunca inferida.' },
                            { titulo: 'Batería informada', desc: 'El estado de salud de batería se informa cuando corresponde.' },
                            { titulo: 'Revisión individual', desc: 'Cada equipo es revisado antes de publicarse.' },
                        ].map(({ titulo, desc }) => (
                            <div key={titulo} className="rounded-xl border border-gray-200 bg-white p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{titulo}</p>
                                <p className="text-sm text-gray-600">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-12 space-y-14">

                {/* iPhone seminuevos */}
                {celulares.length > 0 && (
                    <section>
                        <SectionHeader
                            title="iPhone Seminuevo"
                            href="/catalogo?categoria=celulares&condicion=Seminuevo"
                            count={celulares.length}
                        />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {celulares.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Mac seminuevos */}
                {mac.length > 0 && (
                    <section>
                        <SectionHeader
                            title="Mac Seminuevo"
                            href="/catalogo?categoria=computadoras&condicion=Seminuevo"
                            count={mac.length}
                        />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {mac.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Otros */}
                {otros.length > 0 && (
                    <section>
                        <SectionHeader
                            title="Otros seminuevos"
                            href="/catalogo?condicion=Seminuevo"
                            count={otros.length}
                        />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {otros.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} />
                            ))}
                        </div>
                    </section>
                )}

                {total === 0 && (
                    <div className="py-20 text-center text-gray-400">
                        <p className="text-lg font-semibold">No hay equipos seminuevos disponibles en este momento.</p>
                        <p className="mt-2 text-sm">Escríbenos para consultar stock.</p>
                    </div>
                )}

                {/* Preguntas: se cargan en el panel; sin preguntas, la sección no se dibuja */}
                {faqs.length > 0 && (
                    <section>
                        <h2 className="mb-6 text-xl font-bold text-gray-900">Preguntas frecuentes</h2>
                        <div className="space-y-1">
                            {faqs.map(({ id, question, answer }) => (
                                <details key={id} className="group border-b border-gray-100 py-4">
                                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-900">
                                        {question}
                                        <ChevronDown className="ml-4 h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <p className="mt-3 text-sm text-gray-600">{answer}</p>
                                </details>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
