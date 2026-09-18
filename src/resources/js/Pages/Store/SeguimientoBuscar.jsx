import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import StoreLayout, { StoreContainer } from '@/Layouts/StoreLayout';
import { ChevronRight, Search } from '@/Components/Store/Icons';

export default function SeguimientoBuscar() {
    const { data, setData, post, processing, errors } = useForm({ codigo: '', email: '' });

    const enviar = (e) => {
        e.preventDefault();
        post('/seguimiento', { preserveScroll: true });
    };

    return (
        <StoreLayout>
            <Head title="Seguir mi pedido" />
            <StoreContainer className="py-12 md:py-20">
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
                    <div className="mb-6 text-center">
                        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full" style={{ background: 'var(--surface-muted)' }}>
                            <Search className="h-6 w-6" style={{ color: 'var(--ab-navy)' }} />
                        </span>
                        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Sigue tu pedido</h1>
                        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Ingresa el código de tu pedido y el correo con el que compraste.
                        </p>
                    </div>

                    <form onSubmit={enviar} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                        <label className="mb-4 block">
                            <span className="mb-1.5 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Código del pedido</span>
                            <input value={data.codigo} onChange={(e) => setData('codigo', e.target.value)} placeholder="AB-260918-0001"
                                className="h-11 w-full rounded-xl border px-3.5 text-sm outline-none"
                                style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }} />
                            {errors.codigo && <span className="mt-1 block text-xs font-semibold" style={{ color: '#dc2626' }}>{errors.codigo}</span>}
                        </label>

                        <label className="mb-5 block">
                            <span className="mb-1.5 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Tu correo</span>
                            <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                                className="h-11 w-full rounded-xl border px-3.5 text-sm outline-none"
                                style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }} />
                            {errors.email && <span className="mt-1 block text-xs font-semibold" style={{ color: '#dc2626' }}>{errors.email}</span>}
                        </label>

                        <button type="submit" disabled={processing}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white disabled:opacity-50"
                            style={{ background: 'var(--ab-navy)' }}>
                            {processing ? 'Buscando…' : <>Ver mi pedido <ChevronRight className="h-4 w-4" /></>}
                        </button>
                    </form>
                </motion.div>
            </StoreContainer>
        </StoreLayout>
    );
}
