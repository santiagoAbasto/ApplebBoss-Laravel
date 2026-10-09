import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Lock, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { route } from 'ziggy-js';
import StoreLayout from '@/Layouts/StoreLayout';
import BotonGoogle from '@/Components/Auth/BotonGoogle';
import { PasswordMatch } from '@/Components/Auth/AuthUI';
import {
    BotonPrincipal, Campo, CampoClave, PaginaCuenta, TarjetaCuenta, TituloCuenta, campoCls, enlaceCls, pieza, useSacudida,
} from '@/Components/Store/CuentaUI';

// /crear-cuenta: la cuenta de quien compra, con la misma tarjeta que «Acceder».
function CrearCuenta({ desdeCheckout = false }) {
    const [sacudida, sacudir] = useSacudida();
    const { data, setData, post, processing, errors } = useForm({
        name: '', email: '', telefono: '', password: '', password_confirmation: '',
    });
    const enviar = (e) => { e.preventDefault(); post(route('cuenta.registrar'), { preserveScroll: true, onError: sacudir }); };

    return (
        <>
            <Head title="Crear cuenta" />
            <PaginaCuenta>
                <TarjetaCuenta titulo={<TituloCuenta as="h1">Crea tu cuenta</TituloCuenta>}
                    subtitulo={desdeCheckout
                        ? 'Para comprar necesitas una cuenta: así tu pedido queda a tu nombre y puedes seguirlo cuando quieras.'
                        : 'Con tu cuenta sigues tus pedidos y ves lo que preparamos para ti.'}>
                    <motion.div variants={pieza}>
                        <BotonGoogle texto="Continuar con Google" conSeparador />
                    </motion.div>

                    <motion.div variants={pieza}>
                        <motion.form onSubmit={enviar} noValidate animate={sacudida} className="flex flex-col gap-3.5">
                            <Campo icono={UserRound} error={errors.name}>
                                <input className={campoCls} placeholder="Nombre completo" aria-label="Nombre completo" autoComplete="name"
                                    value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            </Campo>
                            <Campo icono={Mail} error={errors.email} ayuda="Ahí te avisamos de cada paso de tu pedido.">
                                <input type="email" inputMode="email" className={campoCls} placeholder="Tu correo" aria-label="Correo" autoComplete="email"
                                    value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            </Campo>
                            <Campo icono={Phone} error={errors.telefono}>
                                <input type="tel" inputMode="tel" className={campoCls} placeholder="Teléfono / WhatsApp" aria-label="Teléfono o WhatsApp" autoComplete="tel"
                                    value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} required />
                            </Campo>
                            <CampoClave error={errors.password} ayuda="Mínimo 10 caracteres." placeholder="Contraseña" aria-label="Contraseña" autoComplete="new-password"
                                value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                            <div>
                                <CampoClave error={errors.password_confirmation} placeholder="Repite la contraseña" aria-label="Repite la contraseña" autoComplete="new-password"
                                    value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required />
                                <PasswordMatch password={data.password} confirmation={data.password_confirmation} />
                            </div>
                            <BotonPrincipal cargando={processing} textoCargando="Creando…">Crear mi cuenta</BotonPrincipal>
                        </motion.form>
                    </motion.div>

                    <motion.div variants={pieza}>
                        <p className="mt-5 text-center text-[14px] text-slate-600">
                            ¿Ya tienes cuenta? <Link href={route('cuenta.entrar')} className={enlaceCls}>Inicia sesión</Link>
                        </p>
                        <ul className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
                            <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Tu contraseña se guarda cifrada. Nadie de Apple Boss puede verla.</li>
                            <li className="flex items-start gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0" />Usamos tus datos solo para tu pedido. No los vendemos ni los compartimos.</li>
                        </ul>
                    </motion.div>
                </TarjetaCuenta>
            </PaginaCuenta>
        </>
    );
}

// StoreLayout provee el contexto del carrito: tiene que estar montado por encima.
export default function Crear(props) {
    return <StoreLayout><CrearCuenta {...props} /></StoreLayout>;
}
