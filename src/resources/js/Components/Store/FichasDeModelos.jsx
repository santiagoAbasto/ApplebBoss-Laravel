import { Link } from '@inertiajs/react';

// Los modelos de una familia con el enlace a su página (/iphone/iphone-15-pro-max): ficha técnica, precio y stock de hoy.
export default function FichasDeModelos({ titulo, fichas = [] }) {
    if (!fichas.length) return null;

    return (
        <section>
            <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
            <p className="mb-4 mt-1 text-sm text-gray-500">La ficha técnica de cada modelo, con el precio y lo que hay hoy en la tienda.</p>
            <ul className="flex flex-wrap gap-2">
                {fichas.map((f) => (
                    <li key={f.url}>
                        <Link href={f.url} className="block rounded-full border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900">
                            {f.nombre}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
