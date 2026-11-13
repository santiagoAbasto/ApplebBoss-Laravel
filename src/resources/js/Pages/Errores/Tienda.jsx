import { Head, Link } from '@inertiajs/react';
import StoreLayout, { StoreContainer } from '@/Layouts/StoreLayout';
import { Ilustracion } from '@/Components/Temporada';

// Los errores que ve el cliente en la tienda (no encontrado, sin acceso, sesión vencida, demasiados intentos).
// Los arma bootstrap/app.php (withExceptions) y llegan con el layout completo: menú, carrito, pie y, si la campaña
// de Navidad está encendida, el tema entero. Los 500 y 503 usan las páginas estáticas de resources/views/errors.
const TEXTOS = {
    404: ['No encontramos esa página', 'La dirección puede estar mal escrita o el producto ya no está publicado. Prueba desde el inicio o el catálogo.'],
    403: ['No tienes acceso a esta página', 'Esta parte no está disponible para tu cuenta. Si crees que es un error, escríbenos.'],
    419: ['Tu sesión venció', 'Pasó mucho tiempo sin actividad. Vuelve a cargar la página e inténtalo otra vez.'],
    429: ['Demasiados intentos', 'Hiciste muchas solicitudes seguidas. Espera un momento y vuelve a intentar.'],
};
// Con la campaña encendida, cada error lleva su escena; sin ella, un dibujo simple de siempre.
const ESCENA = { 404: 'EscenaSinResultados', 403: 'Duende', 419: 'Reno', 429: 'Reno' };

export default function Tienda({ estado = 404 }) {
    const [titulo, texto] = TEXTOS[estado] ?? TEXTOS[404];

    return (
        <StoreLayout>
            <Head title={`${titulo} — Apple Boss`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <StoreContainer className="py-14 md:py-20">
                <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                    <Ilustracion nombre={ESCENA[estado] ?? 'Reno'} className="nv-vacio" />
                    <p className="nv-error-codigo text-[88px] font-black leading-none tracking-tight sm:text-[112px]" aria-hidden="true" style={{ color: 'var(--ab-navy)' }}>{estado}</p>
                    <h1 className="mt-3 text-2xl font-black sm:text-3xl" style={{ color: 'var(--text-primary)' }}>{titulo}</h1>
                    <p className="mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{texto}</p>
                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <Link href="/" className="inline-flex h-12 items-center rounded-full px-7 text-sm font-bold text-white" style={{ background: 'var(--ab-navy)' }}>
                            Volver al inicio
                        </Link>
                        <Link href="/catalogo" className="inline-flex h-12 items-center rounded-full border-2 px-7 text-sm font-bold" style={{ borderColor: 'var(--ab-navy)', color: 'var(--ab-navy)' }}>
                            Ver el catálogo
                        </Link>
                    </div>
                </div>
            </StoreContainer>
        </StoreLayout>
    );
}
