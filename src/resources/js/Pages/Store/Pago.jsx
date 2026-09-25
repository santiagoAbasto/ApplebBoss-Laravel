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

/* Formulario para avisar que ya pagó; sirve para transferencia y para Binance manual */
function SubirComprobante({ reporte, onSubmit, titulo, placeholder }) {
    return (
        <form onSubmit={onSubmit} className="mt-5 space-y-3 border-t pt-5" style={{ borderColor: 'var(--border-light)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{titulo}</p>
            <input type="text" placeholder={placeholder}
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
    );
}

function Copiar({ texto }) {
    const [hecho, setHecho] = useState(false);
    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(texto);
            setHecho(true);
            setTimeout(() => setHecho(false), 1800);
        } catch { /* sin permiso de portapapeles: el dato queda a la vista para copiarlo a mano */ }
    };
    return (
        <button type="button" onClick={copiar}
            className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
            style={{ borderColor: hecho ? 'var(--ab-lime)' : 'var(--border-light)', background: hecho ? 'var(--ab-lime)' : 'transparent', color: hecho ? 'var(--text-on-lime)' : 'var(--ab-navy)' }}>
            {hecho ? 'Copiado' : 'Copiar'}
        </button>
    );
}

const usdt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PagoInterno({ pedido, token, qr, transferencia, binance, metodo }) {
    const { clear } = useStoreCart();
    const [estado, setEstado] = useState(pedido.estado);
    const [confirmado, setConfirmado] = useState(pedido.pago_confirmado);
    const yaLimpio = useRef(false);

    // Después de subir el comprobante, Inertia trae el pedido nuevo: el estado se sincroniza
    useEffect(() => { setEstado(pedido.estado); }, [pedido.estado]);

    // El pedido ya está guardado en el servidor: el carrito del navegador deja de hacer falta
    useEffect(() => {
        if (!yaLimpio.current) { clear(); yaLimpio.current = true; }
    }, [clear]);

    // Preguntamos al servidor hasta que se confirme: el QR lo confirma el banco (rápido); la
    // transferencia y Binance manual, una persona del equipo (más espaciado)
    useEffect(() => {
        if (confirmado || metodo === 'efectivo_tienda') return undefined;
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
        }, metodo === 'qr_bnb' ? 5000 : 15000);
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
        <>
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

                                        <SubirComprobante reporte={reporte} onSubmit={enviarComprobante}
                                            titulo="Ya transferí: sube tu comprobante" placeholder="N.° de transacción (opcional)" />
                                    </div>
                                )}

                                {/* Binance Pay manual: el cliente manda los USDT a nuestro Binance ID desde su app */}
                                {metodo === 'binance_pay' && (binance ? (
                                    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                        <div className="px-6 py-5 text-center" style={{ background: 'var(--ab-navy)' }}>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Monto exacto a enviar</p>
                                            <motion.p initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                className="mt-1 text-3xl font-black tabular-nums" style={{ color: 'var(--ab-lime)' }}>
                                                {usdt(binance.monto_usdt)} {binance.moneda}
                                            </motion.p>
                                            <p className="mt-1 text-xs text-white/70">Equivale a {money(pedido.total)} al dólar paralelo</p>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border-light)' }}>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Nuestro Binance ID</p>
                                                    <p className="truncate text-lg font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{binance.pay_id}</p>
                                                </div>
                                                <Copiar texto={binance.pay_id} />
                                            </div>

                                            <ol className="mt-5 space-y-3">
                                                {[
                                                    <>Abre tu app de Binance y entra a <strong>Pagar → Enviar</strong>.</>,
                                                    <>Elige <strong>Binance ID</strong> y pega el nuestro.</>,
                                                    <>Antes de confirmar, revisa que el destinatario diga <strong>APPLEBOSS</strong>.</>,
                                                    <>Elige <strong>{binance.moneda}</strong> (Binance a veces trae otra moneda elegida) y envía exactamente <strong>{usdt(binance.monto_usdt)} {binance.moneda}</strong>. En la nota escribe <strong>{pedido.codigo}</strong>.</>,
                                                    <>Sube aquí la captura del pago.</>,
                                                ].map((paso, i) => (
                                                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                                                        className="flex gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black"
                                                            style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}>{i + 1}</span>
                                                        <span className="pt-0.5">{paso}</span>
                                                    </motion.li>
                                                ))}
                                            </ol>

                                            <SubirComprobante reporte={reporte} onSubmit={enviarComprobante}
                                                titulo="Ya pagué: sube la captura" placeholder="ID de la orden de Binance (opcional)" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            No pudimos preparar el pago con Binance en este momento. Escríbenos por WhatsApp y lo resolvemos.
                                        </p>
                                    </div>
                                ))}

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
        </>
    );
}

/**
 * Mismo motivo que en Checkout: el contexto del carrito lo provee StoreLayout, así que
 * este componente tiene que quedar por debajo de él para poder leerlo con `useStoreCart()`.
 */
export default function Pago(props) {
    return (
        <StoreLayout>
            <PagoInterno {...props} />
        </StoreLayout>
    );
}
