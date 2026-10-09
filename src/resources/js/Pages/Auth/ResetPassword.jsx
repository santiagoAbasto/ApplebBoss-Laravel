import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { route } from 'ziggy-js';
import StoreLayout from '@/Layouts/StoreLayout';
import { PasswordMatch, PasswordStrength } from '@/Components/Auth/AuthUI';
import { BotonPrincipal, Campo, CampoClave, PaginaCuenta, TarjetaCuenta, TituloCuenta, campoCls, enlaceCls, pieza, useSacudida } from '@/Components/Store/CuentaUI';

// /reset-password/{token}: la contraseña nueva, con la tarjeta de la cuenta. Al guardarla, cada uno vuelve a su puerta.
function NuevaClave({ token, email }) {
    const [sacudida, sacudir] = useSacudida();
    const { data, setData, post, processing, errors, reset } = useForm({ token, email, password: '', password_confirmation: '' });
    const enviar = (e) => {
        e.preventDefault();
        post(route('password.store'), { onError: sacudir, onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <>
            <Head title="Nueva contraseña" />
            <PaginaCuenta>
                <TarjetaCuenta titulo={<TituloCuenta as="h1">Crea una nueva contraseña</TituloCuenta>}
                    subtitulo="Elige una contraseña que no uses en otros sitios.">
                    <motion.div variants={pieza}>
                        <motion.form onSubmit={enviar} noValidate animate={sacudida} className="flex flex-col gap-3.5">
                            <Campo icono={Mail} error={errors.email}>
                                <input type="email" className={campoCls} aria-label="Correo" autoComplete="username"
                                    value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            </Campo>
                            <div>
                                <CampoClave error={errors.password} placeholder="Nueva contraseña" aria-label="Nueva contraseña" autoComplete="new-password" autoFocus
                                    value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                                <PasswordStrength password={data.password} />
                            </div>
                            <div>
                                <CampoClave error={errors.password_confirmation} placeholder="Repite la contraseña" aria-label="Repite la contraseña" autoComplete="new-password"
                                    value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required />
                                <PasswordMatch password={data.password} confirmation={data.password_confirmation} />
                            </div>
                            <BotonPrincipal cargando={processing} textoCargando="Guardando…">Guardar contraseña</BotonPrincipal>
                        </motion.form>
                    </motion.div>
                    <motion.p variants={pieza} className="mt-6 text-center text-[14px] text-slate-600">
                        <Link href={route('cuenta.entrar')} className={enlaceCls}>Volver a iniciar sesión</Link>
                    </motion.p>
                </TarjetaCuenta>
            </PaginaCuenta>
        </>
    );
}

export default function ResetPassword(props) {
    return <StoreLayout><NuevaClave {...props} /></StoreLayout>;
}
