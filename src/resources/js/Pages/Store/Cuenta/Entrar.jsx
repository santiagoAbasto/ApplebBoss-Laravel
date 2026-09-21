import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import StoreLayout, { StoreContainer } from '@/Layouts/StoreLayout';
import BotonGoogle from '@/Components/Auth/BotonGoogle';

const inputCls = 'h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition-shadow focus:ring-2';
const inputStyle = { borderColor: 'var(--border-light)', background: 'var(--surface-white)', color: 'var(--text-primary)' };

function EntrarTienda({ canResetPassword, status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '', password: '', remember: false,
    });

    return (
        <>
            <Head title="Entrar" />
            <StoreContainer className="py-10 md:py-16">
                <div className="mx-auto max-w-md">
                    <h1 className="text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>Entra a tu cuenta</h1>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Para seguir tus pedidos y comprar más rápido.
                    </p>

                    {status && (
                        <p className="mt-5 rounded-xl bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-800">{status}</p>
                    )}

                    <div className="mt-7">
                        <BotonGoogle texto="Entrar con Google" conSeparador />
                    </div>
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={(e) => { e.preventDefault(); post(route('cuenta.entrar.enviar'), { onFinish: () => reset('password') }); }}
                    >
                        <label className="block">
                            <span className="mb-1.5 block text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Correo</span>
                            <input type="email" className={inputCls} style={inputStyle} value={data.email}
                                onChange={(e) => setData('email', e.target.value)} autoComplete="email" required autoFocus />
                            {errors.email && <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.email}</span>}
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Contraseña</span>
                            <input type="password" className={inputCls} style={inputStyle} value={data.password}
                                onChange={(e) => setData('password', e.target.value)} autoComplete="current-password" required />
                            {errors.password && <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.password}</span>}
                        </label>

                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                <input type="checkbox" checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)} className="h-4 w-4 rounded" />
                                No cerrar sesión
                            </label>
                            {canResetPassword && (
                                <Link href={route('password.request')} className="text-sm font-semibold" style={{ color: 'var(--ab-navy)' }}>
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            )}
                        </div>

                        <button type="submit" disabled={processing}
                            className="mt-2 h-12 rounded-full text-sm font-bold text-white transition-opacity disabled:opacity-60"
                            style={{ background: 'var(--ab-navy)' }}>
                            {processing ? 'Entrando…' : 'Entrar'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                        ¿Primera vez?{' '}
                        <Link href={route('cuenta.crear')} className="font-bold" style={{ color: 'var(--ab-navy)' }}>Crea tu cuenta</Link>
                    </p>
                </div>
            </StoreContainer>
        </>
    );
}

export default function Entrar(props) {
    return <StoreLayout><EntrarTienda {...props} /></StoreLayout>;
}
