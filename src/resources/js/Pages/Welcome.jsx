import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Apple Boss | Gestión Inteligente" />

            <div className="relative min-h-screen overflow-hidden bg-black text-white">
                
                {/* Fondo Glow */}
                <div className="absolute inset-0">
                    <div className="absolute -top-32 -left-32 h-96 w-96 bg-red-600/30 blur-3xl rounded-full" />
                    <div className="absolute top-1/3 right-0 h-96 w-96 bg-red-500/20 blur-3xl rounded-full" />
                </div>

                {/* NAVBAR */}
                <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold tracking-wide">
                         Apple Boss
                    </h1>

                    <nav className="flex gap-4">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition"
                                >
                                    Login
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
                                >
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* HERO */}
                <main className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl"
                    >
                        <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">
                            Control total de tu <span className="text-red-500">negocio Apple</span>
                        </h2>

                        <p className="mt-6 text-lg text-white/70">
                            Ventas, inventario, cotizaciones, servicios técnicos y reportes
                            en una sola plataforma profesional, rápida y segura.
                        </p>

                        <div className="mt-10 flex gap-4">
                            <Link
                                href={route('login')}
                                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition text-lg font-semibold"
                            >
                                Ingresar al sistema
                            </Link>

                            <a
                                href="#features"
                                className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition text-lg"
                            >
                                Ver funcionalidades
                            </a>
                        </div>
                    </motion.div>
                </main>

                {/* FEATURES */}
                <section
                    id="features"
                    className="relative z-10 max-w-7xl mx-auto px-6 pb-24"
                >
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Ventas Inteligentes',
                                desc: 'Ventas múltiples, permutas, ganancias netas y boletas profesionales.'
                            },
                            {
                                title: 'Inventario Avanzado',
                                desc: 'Celulares, computadoras, productos Apple y control por IMEI.'
                            },
                            {
                                title: 'Reportes y Dashboards',
                                desc: 'Gráficos, PDFs, métricas reales y control financiero.'
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur hover:border-red-500/40 transition"
                            >
                                <h3 className="text-xl font-semibold mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-white/70">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* CTA FINAL */}
                <section className="relative z-10 pb-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h3 className="text-4xl font-bold">
                            Llevá tu negocio al siguiente nivel
                        </h3>
                        <p className="mt-4 text-white/70">
                            Apple Boss está diseñado para crecer con vos.
                        </p>

                        <Link
                            href={route('register')}
                            className="inline-block mt-8 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 transition text-lg font-semibold"
                        >
                            Empezar ahora
                        </Link>
                    </motion.div>
                </section>

                {/* FOOTER */}
                <footer className="relative z-10 text-center py-6 text-white/40 text-sm">
                    © {new Date().getFullYear()} Apple Boss · Sistema de Gestión Empresarial
                </footer>
            </div>
        </>
    );
}
