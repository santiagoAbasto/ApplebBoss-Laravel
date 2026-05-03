import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck } from 'lucide-react';

/* ─── Indicador de fortaleza de contraseña ─── */
function PasswordStrength({ password }) {
    const checks = [
        { label: 'Al menos 8 caracteres', ok: password.length >= 8 },
        { label: 'Una letra mayúscula', ok: /[A-Z]/.test(password) },
        { label: 'Una letra minúscula', ok: /[a-z]/.test(password) },
        { label: 'Un número',           ok: /[0-9]/.test(password) },
        { label: 'Un símbolo especial', ok: /[^A-Za-z0-9]/.test(password) },
    ];

    const passed  = checks.filter((c) => c.ok).length;
    const pct     = (passed / checks.length) * 100;
    const color   =
        passed <= 1 ? 'bg-red-500'
        : passed <= 3 ? 'bg-yellow-500'
        : 'bg-green-500';
    const label   =
        passed === 0 ? ''
        : passed <= 1 ? 'Muy débil'
        : passed <= 2 ? 'Débil'
        : passed <= 3 ? 'Regular'
        : passed === 4 ? 'Fuerte'
        : '¡Excelente!';

    if (!password) return null;

    return (
        <div className="mt-2 space-y-2">
            {/* barra */}
            <div className="h-1.5 w-full rounded-full bg-white/10">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className={`text-xs font-medium ${color.replace('bg-', 'text-')}`}>
                {label}
            </p>
            {/* checks */}
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                {checks.map((c) => (
                    <li key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-green-400' : 'text-white/40'}`}>
                        <span>{c.ok ? '✓' : '○'}</span>
                        {c.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ─── Campo con icono + show/hide ─── */
function Field({ id, label, type = 'text', icon: Icon, value, onChange, error, autoComplete, showToggle = false }) {
    const [show, setShow] = useState(false);
    const inputType = showToggle ? (show ? 'text' : 'password') : type;

    return (
        <div>
            <InputLabel
                htmlFor={id}
                value={label}
                className="text-white/80 text-sm"
            />
            <div className="relative mt-2">
                {Icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                        <Icon size={16} />
                    </span>
                )}
                <input
                    id={id}
                    type={inputType}
                    name={id}
                    value={value}
                    autoComplete={autoComplete}
                    onChange={onChange}
                    required
                    className="
                        w-full rounded-xl
                        bg-black/40 border border-white/10
                        text-white placeholder-white/30
                        py-2.5
                        focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none
                        transition
                        text-sm
                    "
                    style={{ paddingLeft: Icon ? '2.25rem' : '0.75rem', paddingRight: showToggle ? '2.5rem' : '0.75rem' }}
                />
                {showToggle && (
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShow((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
            {error && <InputError message={error} className="mt-1 text-xs" />}
        </div>
    );
}

/* ─── Componente principal ─── */
export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Crear cuenta | Apple Boss" />

            <div className="
                relative min-h-screen flex items-center justify-center
                bg-gradient-to-br from-black via-zinc-900 to-black
                px-8 py-12
            ">
                {/* Glow */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-red-600/20 blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-red-500/10 blur-3xl" />
                </div>

                {/* Contexto */}
                <div className="absolute top-6 left-6 text-sm tracking-wide text-white/40">
                    Apple Boss · Registro de usuario
                </div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="
                        relative z-10 w-full max-w-xl
                        rounded-2xl bg-zinc-900/95
                        border border-white/10
                        px-10 py-10
                        shadow-[0_20px_60px_rgba(0,0,0,0.65)]
                    "
                >
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 ring-1 ring-red-500/40">
                            <ShieldCheck size={22} className="text-red-400" />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-wide text-white">
                            Crear cuenta
                        </h1>
                        <p className="mt-1 text-sm text-white/50">
                            Acceso restringido · Solo personal autorizado
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={submit} className="space-y-5" noValidate>

                        {/* Nombre */}
                        <Field
                            id="name"
                            label="Nombre completo"
                            icon={User}
                            value={data.name}
                            autoComplete="name"
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />

                        {/* Email */}
                        <Field
                            id="email"
                            label="Correo electrónico"
                            type="email"
                            icon={Mail}
                            value={data.email}
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                        />

                        {/* Contraseña */}
                        <div>
                            <Field
                                id="password"
                                label="Contraseña"
                                icon={Lock}
                                value={data.password}
                                autoComplete="new-password"
                                showToggle
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                            />
                            <PasswordStrength password={data.password} />
                        </div>

                        {/* Confirmar contraseña */}
                        <Field
                            id="password_confirmation"
                            label="Confirmar contraseña"
                            icon={Lock}
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            showToggle
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            error={errors.password_confirmation}
                        />

                        {/* Indicador de coincidencia */}
                        {data.password && data.password_confirmation && (
                            <p className={`text-xs font-medium ${data.password === data.password_confirmation ? 'text-green-400' : 'text-red-400'}`}>
                                {data.password === data.password_confirmation ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                            </p>
                        )}

                        {/* Botón */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="
                                mt-2 w-full rounded-xl
                                bg-red-600 hover:bg-red-700
                                disabled:opacity-50 disabled:cursor-not-allowed
                                py-3 text-base font-semibold text-white
                                transition duration-200
                                flex items-center justify-center gap-2
                            "
                        >
                            {processing ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Creando cuenta…
                                </>
                            ) : 'Crear cuenta'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <Link
                            href={route('login')}
                            className="text-sm text-red-400 hover:text-red-300 transition"
                        >
                            ¿Ya tenés cuenta? Iniciá sesión
                        </Link>
                        <p className="text-xs text-white/30 text-center">
                            © {new Date().getFullYear()} Apple Boss · Todos los derechos reservados
                        </p>
                    </div>
                </motion.div>
            </div>
        </GuestLayout>
    );
}
