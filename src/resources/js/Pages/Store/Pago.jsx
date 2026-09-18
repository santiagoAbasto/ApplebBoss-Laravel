import { Head, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import StoreLayout, { StoreContainer, money, useStoreCart } from '@/Layouts/StoreLayout';
import { Check, ChevronRight } from '@/Components/Store/Icons';

/* Confeti simple al confirmarse el pago (sin librerías extra) */
function Confeti() {
    const piezas = Array.from({ length: 28 });
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {piezas.map((_, i) => (
                <motion.span
                    key={i}
                    initial={{ y: -20, x: `${(i * 37) % 100}%`, opacity: 1, rotate: 0 }}
                    animate={{ y: '120%', rotate: 360 }}
                    transition={{ duration: 1.6 + (i % 5) * 0.25, delay: (i % 7) * 0.06, ease: 'easeIn' }}
                    className="absolute h-2 w-2 rounded-sm"
                    style={{ background: i % 3 === 0 ? 'var(--ab-lime)' : i % 3 === 1 ? 'var(--ab-navy)' : '#f59e0b' }}
                />
            ))}
        </div>
    );
}

export default function Pago({ pedido, token, qr, transferencia, metodo }) {
    const { clear } = useStoreCart();
    const [estado, setEstado] = useState(pedido.estado);
    const [confirmado, setConfirmado] = useState(pedido.pago_confirmado);
    const yaLimpio = useRef(false);

    // El pedido ya está guardado en el servidor: el carrito del navegador deja de hacer falta
    useEffect(() => {
        if (!yaLimpio.current) { clear(); yaLimpio.current = true; }
    }, [clear]);

    // Si el pago es por QR, preguntamos al servidor hasta que el banco confirme
    useEffect(() => {
        if (confirmado || metodo !== 'qr_bnb') return undefined;
        const id = setInterval(async () => {
            try {
                const r = await fetch(`/pedido/${pedido.codigo}/estado?t=${encodeURIComponent(token)}`, {
                    headers: { Accept: 'application/json' },
                });
                if (!r.ok) return;
                const d = await r.json();
                setEstado(d.estado);
                if (d.pago_confirmado) setConfirmado(true);
            } catch { /* si falla una consulta, se reintenta en la siguiente */ }
        }, 5000);
        return () => clearInterval(id);
    }, [confirmado, metodo, pedido.codigo, token]);

    const reporte = useForm({ referencia: '', comprobante: null });
    const enviarComprobante = (e) => {
        e.preventDefault();
        reporte.post(`/pedido/${pedido.codigo}/pago/reportar?t=${encodeURIComponent(token)}`, {
            forceFormData: true, preserveScroll: true,
        });
    };

    const urlSeguimiento = `/seguimiento/${pedido.codigo}?t=${encodeURIComponent(token)}`;

    return (
        <StoreLayout>
            <Head title={`Pago del pedido ${pedido.codigo}`} />
            <StoreContainer className="py-8 md:py-12">
                <div className="mx-auto max-w-2xl">

                    <AnimatePresence mode="wait">
                        {confirmado ? (
                            <motion.div key="ok" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                                className="relative overflow-hidden rounded-2xl border p-8 text-center"
                                style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                <Confeti />
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                    className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full"
                                    style={{ background: 'var(--ab-lime)' }}>
                                    <Check className="h-8 w-8" style={{ color: 'var(--text-on-lime)' }} />
                                </motion.div>
                                <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>¡Pago confirmado!</h1>
                                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Tu pedido <strong>{pedido.codigo}</strong> ya está pagado. Ahora puedes ver los datos de tu equipo.
                                </p>
                                <a href={urlSeguimiento}
                                    className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white"
                                    style={{ background: 'var(--ab-navy)' }}>
                                    Ver mi pedido <ChevronRight className="h-4 w-4" />
                                </a>
                            </motion.div>
                        ) : (
                            <motion.div key="pendiente" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="mb-6 text-center">
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Pedido {pedido.codigo}</p>
                                    <h1 className="mt-1 text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>Completa tu pago</h1>
                                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Te guardamos el equipo. Total a pagar:{' '}
                                        <strong className="tabular-nums" style={{ color: 'var(--ab-navy)' }}>{money(pedido.total)}</strong>
                                    </p>
                                </div>

                                {/* QR del banco */}
                                {metodo === 'qr_bnb' && (
                                    <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                        {qr ? (
                                            <>
                                                <motion.img
                                                    src={`data:image/png;base64,${qr}`}
                                                    alt={`QR para pagar el pedido ${pedido.codigo}`}
                                                    initial={{ opacity: 0, rotateY: 40 }} animate={{ opacity: 1, rotateY: 0 }}
                                                    transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                                                    className="mx-auto h-56 w-56 rounded-xl border object-contain"
                                                    style={{ borderColor: 'var(--border-light)' }}
                                                />
                                                <p className="mt-4 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                                    Escanea el QR con la app de tu banco
                                                </p>
                                                <div className="mt-3 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
                                                        className="h-2 w-2 rounded-full" style={{ background: 'var(--ab-lime)' }} />
                                                    Esperando la confirmación del banco…
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                No pudimos generar el QR en este momento. Escríbenos por WhatsApp y lo resolvemos.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Transferencia / QR bancario manual */}
                                {metodo === 'transferencia' && transferencia && (
                                    <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                        <h2 className="mb-3 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Transfiere a esta cuenta</h2>
                                        <dl className="space-y-2 text-sm">
                                            {[['Banco', transferencia.banco], ['Titular', transferencia.titular], ['Cuenta', transferencia.cuenta], ['CI/NIT', transferencia.documento]]
                                                .filter(([, v]) => v)
                                                .map(([k, v]) => (
                                                    <div key={k} className="flex justify-between gap-4">
                                                        <dt style={{ color: 'var(--text-secondary)' }}>{k}</dt>
                                                        <dd className="font-bold" style={{ color: 'var(--text-primary)' }}>{v}</dd>
                                                    </div>
                                                ))}
                                            <div className="flex justify-between gap-4 border-t pt-2" style={{ borderColor: 'var(--border-light)' }}>
                                                <dt className="font-black" style={{ color: 'var(--text-primary)' }}>Monto exacto</dt>
                                                <dd className="font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>{money(pedido.total)}</dd>
                                            </div>
                                        </dl>

                                        <form onSubmit={enviarComprobante} className="mt-5 space-y-3 border-t pt-5" style={{ borderColor: 'var(--border-light)' }}>
                                            <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Ya transferí: sube tu comprobante</p>
                                            <input type="text" placeholder="N.° de transacción (opcional)"
                                                className="h-11 w-full rounded-xl border px-3.5 text-sm outline-none"
                                                style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}
                                                value={reporte.data.referencia} onChange={(e) => reporte.setData('referencia', e.target.value)} />
                                            <input type="file" accept="image/*,application/pdf"
                                                onChange={(e) => reporte.setData('comprobante', e.target.files[0])}
                                                className="w-full text-sm" />
                                            {reporte.errors.comprobante && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{reporte.errors.comprobante}</p>}
                                            <button type="submit" disabled={reporte.processing}
                                                className="h-11 w-full rounded-full text-sm font-bold text-white disabled:opacity-50"
                                                style={{ background: 'var(--ab-navy)' }}>
                                                {reporte.processing ? 'Enviando…' : 'Enviar comprobante'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Pago al retirar */}
                                {metodo === 'efectivo_tienda' && (
                                    <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            Tu equipo queda apartado. Pagas cuando lo retiras en la tienda y ahí mismo te entregamos
                                            los datos de tu equipo y tu boleta.
                                        </p>
                                    </div>
                                )}

                                {estado === 'pago_en_revision' && (
                                    <div className="mt-4 rounded-xl border px-4 py-3 text-sm"
                                        style={{ borderColor: '#fde68a', background: '#fffbeb', color: '#92400e' }}>
                                        Recibimos tu comprobante. Lo estamos verificando y te confirmamos en breve.
                                    </div>
                                )}

                                <div className="mt-6 text-center">
                                    <a href={urlSeguimiento} className="text-sm font-bold underline" style={{ color: 'var(--ab-navy)' }}>
                                        Guardar el enlace de seguimiento de mi pedido
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </StoreContainer>
        </StoreLayout>
    );
}
