import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Iniciar sesión | Apple Boss" />

            {/* CONTENEDOR PRINCIPAL */}
            <div className="
                relative min-h-screen flex items-center justify-center
                bg-gradient-to-br from-black via-zinc-900 to-black
                px-8
            ">
                {/* GLOW SUTIL */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-40 left-1/4 h-[420px] w-[420px] bg-red-600/20 blur-3xl rounded-full" />
                    <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] bg-red-500/10 blur-3xl rounded-full" />
                </div>

                {/* TEXTO CONTEXTO */}
                <div className="absolute top-6 left-6 text-white/40 text-sm tracking-wide">
                    Apple Boss · Sistema de Gestión
                </div>

                {/* CARD LOGIN */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="
                        relative z-10
                        w-full max-w-xl
                        rounded-2xl
                        bg-zinc-900/95
                        border border-white/10
                        px-12 py-10
                        shadow-[0_20px_60px_rgba(0,0,0,0.65)]
                    "
                >
                    {/* HEADER */}
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-semibold tracking-wide text-white">
                             Apple Boss
                        </h1>
                        <p className="mt-2 text-sm text-white/60">
                            Acceso al panel administrativo
                        </p>
                    </div>

                    {/* STATUS */}
                    {status && (
                        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                            {status}
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={submit} className="space-y-7">
                        {/* EMAIL */}
                        <div>
                            <InputLabel
                                htmlFor="email"
                                value="Correo electrónico"
                                className="text-white/80"
                            />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                isFocused
                                onChange={(e) => setData('email', e.target.value)}
                                className="
                                    mt-2 w-full rounded-xl
                                    bg-black/40
                                    border border-white/10
                                    text-white
                                    focus:border-red-500
                                    focus:ring-red-500
                                "
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <InputLabel
                                htmlFor="password"
                                value="Contraseña"
                                className="text-white/80"
                            />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                autoComplete="current-password"
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                className="
                                    mt-2 w-full rounded-xl
                                    bg-black/40
                                    border border-white/10
                                    text-white
                                    focus:border-red-500
                                    focus:ring-red-500
                                "
                            />
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        {/* OPCIONES */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-white/70">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                />
                                Recordarme
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-red-400 hover:text-red-300 transition"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            )}
                        </div>

                        {/* BOTÓN */}
                        <PrimaryButton
                            disabled={processing}
                            className="
                                w-full justify-center rounded-xl
                                bg-red-600 hover:bg-red-700
                                py-3 text-lg font-medium
                                transition
                            "
                        >
                            {processing ? 'Ingresando…' : 'Iniciar sesión'}
                        </PrimaryButton>
                    </form>

                    {/* FOOTER */}
                    <p className="mt-10 text-center text-xs text-white/40">
                        © {new Date().getFullYear()} Apple Boss · Todos los derechos reservados
                    </p>
                </motion.div>
            </div>
        </GuestLayout>
    );
}
