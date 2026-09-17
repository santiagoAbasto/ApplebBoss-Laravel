import { Link } from '@inertiajs/react';
import StoreLayout, { StoreContainer, useStoreCart } from '@/Layouts/StoreLayout';
import ProductCard from '@/Components/Store/ProductCard';

// La página de una colección: la vitrina que se arma a mano en Tienda online → Colecciones.
// Muestra solo lo que sigue a la venta, en el orden elegido en el panel.

function ColeccionInner({ coleccion, productos }) {
    const { add } = useStoreCart();
    const total = productos.length;

    return (
        <StoreContainer>
            <div className="border-b py-12" style={{ borderColor: 'var(--border-light)' }}>
                <nav aria-label="Ruta" className="mb-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    <Link href="/" className="hover:underline">Inicio</Link>
                    <span className="mx-1.5" aria-hidden="true">/</span>
                    <Link href="/catalogo" className="hover:underline">Catálogo</Link>
                </nav>
                <h1
                    className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.95] tracking-[-0.04em]"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {coleccion.nombre}
                </h1>
                {coleccion.descripcion && (
                    <p className="mt-2 max-w-2xl text-[1rem]" style={{ color: 'var(--text-secondary)' }}>
                        {coleccion.descripcion}
                    </p>
                )}
                {total > 0 && (
                    <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {total} {total === 1 ? 'producto disponible' : 'productos disponibles'}
                    </p>
                )}
            </div>

            <div className="py-12">
                {total > 0 ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
                        {productos.map((p, i) => (
                            <ProductCard key={p.key} product={p} onAdd={add} priority={i === 0} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                            Por ahora no hay nada en esta selección
                        </h2>
                        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Los productos que estaban acá ya se vendieron. Mira todo lo que tenemos disponible.
                        </p>
                        <Link
                            href="/catalogo"
                            className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-bold"
                            style={{ background: 'var(--ab-navy)', color: '#FFFFFF' }}
                        >
                            Ver todo el catálogo
                        </Link>
                    </div>
                )}
            </div>
        </StoreContainer>
    );
}

export default function Coleccion({ coleccion, productos = [] }) {
    return (
        <StoreLayout>
            <ColeccionInner coleccion={coleccion} productos={productos} />
        </StoreLayout>
    );
}
