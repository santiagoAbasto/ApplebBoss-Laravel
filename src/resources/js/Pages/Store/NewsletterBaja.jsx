import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import StoreLayout, { StoreContainer } from '@/Layouts/StoreLayout';
import { Check, Mail } from '@/Components/Store/Icons';
import { useNombreTienda } from '@/Components/Store/tienda';

export default function NewsletterBaja({ token, estado, email }) {
    const [sending, setSending] = useState(false);
    const nombre = useNombreTienda();

    const confirmar = () => {
        setSending(true);
        router.post(`/newsletter/baja/${token}`, {}, { preserveScroll: true, onFinish: () => setSending(false) });
    };

    return (
        <StoreLayout>
            <section className="py-20" style={{ background: 'var(--surface-muted)' }}>
                <StoreContainer>
                    <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm sm:p-10">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ background: 'rgba(1,20,70,0.07)', color: 'var(--ab-navy)' }}>
                            {estado === 'baja' ? <Check className="h-7 w-7" strokeWidth={2} /> : <Mail className="h-7 w-7" />}
                        </span>

                        {estado === 'activo' && (
                            <>
                                <h1 className="mt-5 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>¿Quieres dejar de recibir nuestros correos?</h1>
                                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Daremos de baja a <strong>{email}</strong> del newsletter de {nombre}.
                                </p>
                                <button type="button" onClick={confirmar} disabled={sending}
                                    className="mt-7 inline-flex h-12 items-center rounded-full px-8 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                    style={{ background: 'var(--ab-navy)' }}>
                                    {sending ? 'Procesando…' : 'Sí, darme de baja'}
                                </button>
                            </>
                        )}

                        {estado === 'baja' && (
                            <>
                                <h1 className="mt-5 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Listo, ya no recibirás nuestros correos</h1>
                                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {email} fue dado de baja. Si fue un error, puedes volver a suscribirte desde el pie de cualquier página.
                                </p>
                            </>
                        )}

                        {estado === 'invalido' && (
                            <>
                                <h1 className="mt-5 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Enlace no válido</h1>
                                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Este enlace de baja no existe o es de un correo de prueba.
                                </p>
                            </>
                        )}

                        <Link href="/" className="mt-6 block text-sm font-bold" style={{ color: 'var(--ab-periwinkle)' }}>Volver a la tienda</Link>
                    </div>
                </StoreContainer>
            </section>
        </StoreLayout>
    );
}
