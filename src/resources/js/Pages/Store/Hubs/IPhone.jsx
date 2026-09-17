import { Head, Link } from '@inertiajs/react';
import StoreLayout, { useStoreCart } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';
import { ChevronDown, GitCompare } from '@/Components/Store/Icons';
import { useNombreTienda } from '@/Components/Store/tienda';

const money = (v) => `Bs ${Number(v).toLocaleString('es-BO')}`;

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
export default function IPhoneHub(props) {
    return (
        <StoreLayout>
            <IPhoneHubContent {...props} />
        </StoreLayout>
    );
}

function IPhoneHubContent({ nuevos, usados, myskin, modelos, totalNuevos, totalUsados, faqs = [] }) {
    const { add } = useStoreCart();
    const nombre = useNombreTienda();

    return (
        <>

            {/* Hero */}
            <section className="bg-[#011446] text-white py-16 px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-300">{nombre}</p>
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">iPhone</h1>
                    <p className="mt-4 text-base text-blue-100 max-w-xl mx-auto">
                        Nuevos y seminuevos, revisados individualmente. Condición explícita en cada publicación.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/catalogo?categoria=celulares&condicion=Nuevo"
                            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#011446] hover:bg-blue-50 transition-colors"
                        >
                            Ver nuevos
                        </Link>
                        <Link
                            href="/catalogo?categoria=celulares&condicion=Seminuevo"
                            className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                            Ver seminuevos
                        </Link>
                    </div>
                </div>
            </section>

            {/* Modelos disponibles (chips) */}
            {modelos.length > 0 && (
                <section className="border-b border-gray-100 bg-white py-4 px-4">
                    <div className="mx-auto max-w-6xl flex flex-wrap gap-2">
                        {modelos.map((m) => (
                            <Link
                                key={m}
                                href={`/catalogo?categoria=celulares&q=${encodeURIComponent(m)}`}
                                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors"
                            >
                                {m}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <div className="mx-auto max-w-6xl px-4 py-12 space-y-14">

                {/* Comparativa de modelos */}
                <Link
                    href="/comparar/iphone"
                    className="group flex flex-col gap-5 overflow-hidden rounded-3xl p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8"
                    style={{ background: 'linear-gradient(135deg, #011446 0%, #28224F 60%, #585E9F 140%)' }}
                >
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">¿Cuál te conviene?</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight">Compara modelos de iPhone</h2>
                        <p className="mt-2 max-w-xl text-sm text-blue-100">
                            Hasta 4 modelos lado a lado: pantalla, chip, cámaras, batería y más, con el precio de los que tenemos en tienda.
                        </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-6 py-3 text-sm font-bold text-[#011446] transition-transform group-hover:translate-x-0.5 sm:self-auto">
                        <GitCompare className="h-4 w-4" /> Comparar
                    </span>
                </Link>

                {/* Nuevos */}
                {nuevos.length > 0 && (
                    <section>
                        <SectionHeader
                            title="Nuevos"
                            href="/catalogo?categoria=celulares&condicion=Nuevo"
                            count={totalNuevos}
                        />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {nuevos.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Seminuevos / Open Box */}
                {usados.length > 0 && (
                    <section>
                        <SectionHeader
                            title="Seminuevos y Open Box"
                            href="/catalogo?categoria=celulares&condicion=Seminuevo"
                            count={totalUsados}
                        />
                        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                            <p className="text-xs text-amber-700">
                                Todos los equipos seminuevos son revisados individualmente.
                                La condición y estado de batería se indican en cada publicación.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {usados.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} />
                            ))}
                        </div>
                    </section>
                )}

                {/* MYSKIN cross-sell */}
                {myskin.length > 0 && (
                    <section className="rounded-2xl bg-[#011446] px-6 py-10 text-white">
                        <div className="mb-6 flex items-end justify-between">
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-300">MYSKIN</p>
                                <h2 className="text-xl font-bold">Fundas para tu iPhone</h2>
                            </div>
                            <Link
                                href="/myskin"
                                className="text-sm font-medium text-blue-300 hover:text-white"
                            >
                                Ver todas →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {myskin.map((p) => (
                                <ProductCard key={p.key} product={p} onAdd={add} dark />
                            ))}
                        </div>
                    </section>
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
