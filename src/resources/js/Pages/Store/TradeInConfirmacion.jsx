import { Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import StoreLayout, { StoreContainer, useWhatsApp } from '@/Layouts/StoreLayout';
import { ArrowRight, Check, Info, MessageCircle } from '@/Components/Store/Icons';

// La confirmación de una solicitud de Trade-In. Solo la ve el navegador que la envió (el servidor lo controla con la
// sesión). Los pasos para preparar un iPhone o un iPad salen de la ayuda de Apple para Latinoamérica
// (support.apple.com/es-lamr/109511). En otras marcas no se da un camino de menú: cambia según el fabricante.

export default function TradeInConfirmacion({ codigo, tipo, equipo, nombre, telefono, fotos = 0 }) {
    const wa = useWhatsApp();

    // La solicitud ya se envió: el borrador del formulario no sirve más
    useEffect(() => {
        try { localStorage.removeItem('ab-trade-in-borrador'); } catch { /* sin almacenamiento */ }
    }, []);

    const waUrl = wa.enabled && wa.number ? wa.url(`${wa.saludo} envié la solicitud de Trade-In ${codigo} por mi ${equipo}.`) : null;
    const dispositivo = tipo === 'iPad' ? 'iPad' : 'iPhone';
    const pasosEntrega = ['iPhone', 'iPad'].includes(tipo)
        ? [
            'Haz una copia de tus datos.',
            'Cierra sesión en tu cuenta de Apple: Configuración > [tu nombre] > Cerrar sesión.',
            `Bórralo: Configuración > General > Transferir o restablecer el ${dispositivo} > Borrar contenido y configuración.`,
        ]
        : {
            'Celular Android': [
                'Haz una copia de tus datos.',
                'Quita tu cuenta de Google y la de la marca (por ejemplo, Samsung).',
                'Restablécelo a la configuración de fábrica desde la app de Configuración.',
            ],
            Laptop: ['Haz una copia de tus archivos.', 'Cierra sesión en tus cuentas y quita la contraseña de inicio.', 'Si tiene contraseña de BIOS, quítala.'],
            'PC de escritorio': ['Haz una copia de tus archivos.', 'Cierra sesión en tus cuentas y quita la contraseña de inicio.', 'Si tiene contraseña de BIOS, quítala.'],
            Consola: ['Guarda tus partidas en la nube o en un disco.', 'Desvincula tu cuenta de la consola.', 'Restablécela desde su configuración.'],
            Otro: ['Haz una copia de tus datos.', 'Quita tus cuentas y contraseñas, y restablécelo si tiene esa opción.'],
        }[tipo] ?? [
            'Haz una copia de tus datos.',
            'Cierra sesión en tu cuenta de Apple y borra el equipo.',
        ];

    return (
        <StoreLayout>
            <section className="relative overflow-hidden" style={{ background: 'var(--ab-navy)' }}>
                <span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full" style={{ background: 'rgba(88,94,159,0.35)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-[20%] h-28 w-28 rounded-full" style={{ background: 'rgba(198,203,54,0.16)' }} />
                <StoreContainer className="relative py-12 md:py-16">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-2xl">
                        <span className="grid h-14 w-14 place-items-center rounded-full" style={{ background: 'rgba(198,203,54,0.18)', color: 'var(--ab-lime)' }}>
                            <Check className="h-7 w-7" strokeWidth={2.4} />
                        </span>
                        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--ab-lime)' }}>Solicitud recibida</p>
                        <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-white md:text-[42px]">Gracias, {nombre}</h1>
                        <p className="mt-3 text-[15px] leading-relaxed text-white/75">
                            Recibimos tu solicitud por tu <strong className="text-white">{equipo}</strong>{fotos > 0 ? `, con ${fotos} foto${fotos === 1 ? '' : 's'}` : ''}.
                        </p>
                        <div className="mt-6 inline-block rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">Número de solicitud</p>
                            <p className="mt-1 font-mono text-2xl font-bold" style={{ color: 'var(--ab-lime)' }}>{codigo}</p>
                        </div>
                    </motion.div>
                </StoreContainer>
            </section>

            <section className="py-10 md:py-14" style={{ background: 'var(--surface-page)' }}>
                <StoreContainer>
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-3xl border bg-white p-6 sm:p-8" style={{ borderColor: 'var(--border-light)' }}>
                            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Qué sigue</h2>
                            <ol className="mt-5 space-y-4">
                                {[
                                    'Revisamos tus respuestas y tus fotos.',
                                    `Te escribimos por WhatsApp al ${telefono} con un valor estimado.`,
                                    'Si te conviene, traes el equipo y confirmamos el valor al revisarlo.',
                                ].map((texto, i) => (
                                    <li key={texto} className="flex gap-3 text-[15px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--ab-navy)' }}>{i + 1}</span>
                                        <span className="pt-1">{texto}</span>
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-7 flex flex-wrap gap-3">
                                {waUrl && (
                                    <a href={waUrl} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold text-white transition-opacity hover:opacity-90"
                                        style={{ background: '#1FA855' }}>
                                        <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
                                    </a>
                                )}
                                <Link href="/catalogo"
                                    className="inline-flex h-12 items-center gap-2 rounded-full border px-6 text-sm font-bold transition-colors hover:bg-black/[0.03]"
                                    style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                                    Mirar equipos <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-3xl border bg-white p-6 sm:p-8" style={{ borderColor: 'var(--border-light)' }}>
                            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Antes de entregar tu equipo</h2>
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Hazlo recién cuando acordemos el valor.</p>
                            <ol className="mt-5 space-y-3">
                                {pasosEntrega.map((texto, i) => (
                                    <li key={texto} className="flex gap-3 text-[15px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: 'var(--surface-muted)', color: 'var(--ab-navy)' }}>{i + 1}</span>
                                        <span className="pt-1">{texto}</span>
                                    </li>
                                ))}
                            </ol>
                            <p className="mt-6 flex gap-2 rounded-2xl px-4 py-3 text-xs leading-relaxed" style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                                <Info className="h-4 w-4 shrink-0" style={{ color: 'var(--ab-periwinkle)' }} />
                                La cotización es estimada: el valor final se confirma al revisar el equipo en la tienda.
                            </p>
                        </div>
                    </div>
                </StoreContainer>
            </section>
        </StoreLayout>
    );
}
