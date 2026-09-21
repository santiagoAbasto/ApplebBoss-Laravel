import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Lock, ShieldCheck } from 'lucide-react';
import StoreLayout, { StoreContainer } from '@/Layouts/StoreLayout';
import BotonGoogle from '@/Components/Auth/BotonGoogle';

const inputCls = 'h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition-shadow focus:ring-2';
const inputStyle = { borderColor: 'var(--border-light)', background: 'var(--surface-white)', color: 'var(--text-primary)' };

function Campo({ label, error, children, hint }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>{label}</span>
            {children}
            {hint && !error && <span className="mt-1 block text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
            {error && <span className="mt-1 block text-xs font-semibold text-rose-600">{error}</span>}
        </label>
    );
}

function CrearCuenta({ desdeCheckout = false }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '', email: '', telefono: '', password: '', password_confirmation: '',
    });

    return (
        <>
            <Head title="Crear cuenta" />
            <StoreContainer className="py-10 md:py-16">
                <div className="mx-auto max-w-md">
                    <h1 className="text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>Crea tu cuenta</h1>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {desdeCheckout
                            ? 'Para comprar necesitas una cuenta: así tu pedido queda a tu nombre y puedes seguirlo cuando quieras.'
                            : 'Con tu cuenta sigues tus pedidos y ves lo que preparamos para ti.'}
                    </p>

                    <div className="mt-7">
                        <BotonGoogle texto="Continuar con Google" conSeparador />
                    </div>
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={(e) => { e.preventDefault(); post(route('cuenta.registrar')); }}
                    >
                        <Campo label="Nombre completo *" error={errors.name}>
                            <input className={inputCls} style={inputStyle} value={data.name}
                                onChange={(e) => setData('name', e.target.value)} autoComplete="name" required />
                        </Campo>

                        <Campo label="Correo *" error={errors.email} hint="Ahí te avisamos de cada paso de tu pedido.">
                            <input type="email" className={inputCls} style={inputStyle} value={data.email}
                                onChange={(e) => setData('email', e.target.value)} autoComplete="email" required />
                        </Campo>

                        <Campo label="Teléfono / WhatsApp *" error={errors.telefono}>
                            <input className={inputCls} style={inputStyle} value={data.telefono}
                                onChange={(e) => setData('telefono', e.target.value)} autoComplete="tel" required />
                        </Campo>

                        <Campo label="Contraseña *" error={errors.password} hint="Mínimo 10 caracteres.">
                            <input type="password" className={inputCls} style={inputStyle} value={data.password}
                                onChange={(e) => setData('password', e.target.value)} autoComplete="new-password" required />
                        </Campo>

                        <Campo label="Repite la contraseña *" error={errors.password_confirmation}>
                            <input type="password" className={inputCls} style={inputStyle} value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)} autoComplete="new-password" required />
                        </Campo>

                        <button type="submit" disabled={processing}
                            className="mt-2 h-12 rounded-full text-sm font-bold text-white transition-opacity disabled:opacity-60"
                            style={{ background: 'var(--ab-navy)' }}>
                            {processing ? 'Creando…' : 'Crear mi cuenta'}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                        ¿Ya tienes cuenta?{' '}
                        <Link href={route('login')} className="font-bold" style={{ color: 'var(--ab-navy)' }}>Inicia sesión</Link>
                    </p>

                    <ul className="mt-7 flex flex-col gap-2 border-t pt-5 text-xs" style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
                        <li className="flex items-start gap-2">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                            Tu contraseña se guarda cifrada. Nadie de Apple Boss puede verla.
                        </li>
                        <li className="flex items-start gap-2">
                            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                            Usamos tus datos solo para tu pedido. No los vendemos ni los compartimos.
                        </li>
                    </ul>
                </div>
            </StoreContainer>
        </>
    );
}

// StoreLayout provee el contexto del carrito: tiene que estar montado por encima.
export default function Crear(props) {
    return <StoreLayout><CrearCuenta {...props} /></StoreLayout>;
}
