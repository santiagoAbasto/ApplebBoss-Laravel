import { Head, Link } from '@inertiajs/react';
import StoreLayout, { useStoreCart } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';
import { useNombreTienda } from '@/Components/Store/tienda';

// El carrito vive dentro de StoreLayout: el contenido que usa useStoreCart va en un componente hijo.
export default function MacHub(props) {
    return (
        <StoreLayout>
            <MacHubContent {...props} />
        </StoreLayout>
    );
}

function MacHubContent({ nuevas, usadas, total }) {
    const { add } = useStoreCart();
    const nombre = useNombreTienda();

    return (
        <>

            {/* Hero */}
            <section className="bg-[#011446] text-white py-16 px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-300">{nombre}</p>
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Mac</h1>
                    <p className="mt-4 text-base text-blue-100 max-w-xl mx-auto">
                        MacBook Air, MacBook Pro y Mac mini. Nuevas y seminuevos revisados.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/catalogo?categoria=computadoras&condicion=Nuevo"
                            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#011446] hover:bg-blue-50 transition-colors"
                        >
                            Ver nuevas
                        </Link>
                        <Link
                            href="/catalogo?categoria=computadoras&condicion=Seminuevo"
                            className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                            Ver seminuevos
                        </Link>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-12 space-y-14">

                {nuevas.length > 0 && (
                    <section>
                        <div className="flex items-end justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Nuevas</h2>
                            <Link href="/catalogo?categoria=computadoras&condicion=Nuevo" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                                Ver todas →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {nuevas.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} />
                            ))}
                        </div>
                    </section>
                )}

                {usadas.length > 0 && (
                    <section>
                        <div className="flex items-end justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Seminuevos</h2>
                            <Link href="/catalogo?categoria=computadoras&condicion=Seminuevo" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                                Ver todas →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {usadas.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} />
                            ))}
                        </div>
                    </section>
                )}

                {total === 0 && (
                    <div className="py-20 text-center text-gray-400">
                        <p className="text-lg font-semibold">No hay Mac disponibles en este momento.</p>
                    </div>
                )}
            </div>
        </>
    );
}
