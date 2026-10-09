import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { route } from 'ziggy-js';
import StoreLayout from '@/Layouts/StoreLayout';
import { Aviso, BotonPrincipal, Campo, PaginaCuenta, TarjetaCuenta, TituloCuenta, campoCls, enlaceCls, pieza, useSacudida } from '@/Components/Store/CuentaUI';

// /forgot-password: dentro de la tienda y con la tarjeta de la cuenta. Sirve a cualquiera; no muestra nada del panel.
function Recuperar({ status }) {
    const [sacudida, sacudir] = useSacudida();
    const { data, setData, post, processing, errors } = useForm({ email: '' });
    const enviar = (e) => { e.preventDefault(); post(route('password.email'), { preserveScroll: true, onError: sacudir }); };

    return (
        <>
            <Head title="Recuperar contraseña" />
            <PaginaCuenta>
                <TarjetaCuenta titulo={<TituloCuenta as="h1">¿Olvidaste tu contraseña?</TituloCuenta>}
                    subtitulo="Escribe tu correo y te enviamos un enlace para crear una nueva.">
                    <Aviso>{status}</Aviso>
                    <motion.div variants={pieza}>
                        <motion.form onSubmit={enviar} noValidate animate={sacudida} className="flex flex-col gap-3.5">
                            <Campo icono={Mail} error={errors.email}>
                                <input type="email" inputMode="email" autoFocus className={campoCls} placeholder="Tu correo" aria-label="Correo" autoComplete="email"
                                    value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            </Campo>
                            <BotonPrincipal cargando={processing} textoCargando="Enviando…">Enviar enlace</BotonPrincipal>
                        </motion.form>
                    </motion.div>
                    <motion.p variants={pieza} className="mt-6 text-center text-[14px] text-slate-600">
                        ¿Ya la recordaste? <Link href={route('cuenta.entrar')} className={enlaceCls}>Inicia sesión</Link>
                    </motion.p>
                </TarjetaCuenta>
            </PaginaCuenta>
        </>
    );
}

export default function ForgotPassword(props) {
    return <StoreLayout><Recuperar {...props} /></StoreLayout>;
}
