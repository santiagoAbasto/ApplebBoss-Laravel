import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import StoreLayout, { StoreContainer, money, useStoreCart } from '@/Layouts/StoreLayout';
import ProductVisual from '@/Components/Store/ProductVisual';
import { Check, ChevronRight, ShoppingBag } from '@/Components/Store/Icons';

/* ── Tarjeta con inclinación 3D suave al pasar el mouse ──────────────────── */
function Tarjeta3D({ children, className = '', intensidad = 6 }) {
    const [t, setT] = useState({ x: 0, y: 0 });

    const mover = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        setT({ x: -py * intensidad, y: px * intensidad });
    };

    return (
        <motion.div
            onMouseMove={mover}
            onMouseLeave={() => setT({ x: 0, y: 0 })}
            animate={{ rotateX: t.x, rotateY: t.y }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            style={{ transformStyle: 'preserve-3d', perspective: 900 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ── Pasos del proceso ───────────────────────────────────────────────────── */
function Pasos({ actual }) {
    const pasos = ['Tus datos', 'Entrega', 'Pago'];
    return (
        <ol className="mb-8 flex items-center gap-2" aria-label="Pasos de la compra">
            {pasos.map((p, i) => {
                const hecho = i < actual;
                const activo = i === actual;
                return (
                    <li key={p} className="flex flex-1 items-center gap-2">
                        <motion.span
                            initial={false}
                            animate={{ scale: activo ? 1.1 : 1 }}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black"
                            style={{
                                background: hecho || activo ? 'var(--ab-navy)' : 'var(--surface-muted)',
                                color: hecho || activo ? '#fff' : 'var(--text-muted)',
                            }}
                        >
                            {hecho ? <Check className="h-4 w-4" /> : i + 1}
                        </motion.span>
                        <span className="hidden text-xs font-bold sm:block" style={{ color: activo ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {p}
                        </span>
                        {i < pasos.length - 1 && <span className="h-px flex-1" style={{ background: 'var(--border-light)' }} />}
                    </li>
                );
            })}
        </ol>
    );
}

function Campo({ label, error, children, requerido = false }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {label}{requerido && <span style={{ color: '#dc2626' }}> *</span>}
            </span>
            {children}
            {error && <span className="mt-1 block text-xs font-semibold" style={{ color: '#dc2626' }}>{error}</span>}
        </label>
    );
}

const inputCls = 'h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition-shadow focus:ring-2';
const inputStyle = { borderColor: 'var(--border-light)', background: 'var(--surface-white)', color: 'var(--text-primary)' };

function CheckoutInterno({ entrega = [], destinos = [], metodos = [], cliente = {} }) {
    const { cart, total, syncing } = useStoreCart();
    const disponibles = useMemo(() => cart.filter((i) => i.available !== false), [cart]);
    const noDisponibles = useMemo(() => cart.filter((i) => i.available === false), [cart]);

    const { data, setData, post, processing, errors } = useForm({
        claves: [],
        nombre_cliente: cliente.nombre ?? '', email_cliente: cliente.email ?? '',
        telefono_cliente: cliente.telefono ?? '', documento: '', razon_social: '',
        tipo_entrega: entrega[0]?.valor ?? 'retiro',
        envio_departamento: '', envio_ciudad: '', envio_direccion: '', envio_referencia: '',
        envio_destinatario: '', envio_telefono: '',
        metodo_pago: metodos[0]?.valor ?? '',
        notas_cliente: '',
    });

    // Las claves salen del carrito del navegador; el precio lo pone el servidor
    useEffect(() => {
        setData('claves', disponibles.map((i) => i.key));
    }, [disponibles.length]);

    const esEnvio = data.tipo_entrega === 'envio';
    const destino = destinos.find((d) => d.departamento === data.envio_departamento);
    const costoEnvio = esEnvio ? (destino?.costo ?? 0) : 0;
    const totalFinal = total + costoEnvio;

    const paso = !data.nombre_cliente ? 0 : (esEnvio && !data.envio_direccion) ? 1 : 2;

    const enviar = (e) => {
        e.preventDefault();
        post('/checkout', { preserveScroll: true });
    };

    if (!syncing && disponibles.length === 0) {
        return (
            <>
                <Head title="Checkout" />
                <StoreContainer className="py-20">
                    <div className="mx-auto max-w-md text-center">
                        <ShoppingBag className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--text-muted)' }} />
                        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Tu carrito está vacío</h1>
                        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Agrega un equipo para continuar con la compra.
                        </p>
                        <a href="/catalogo" className="mt-6 inline-block rounded-full px-7 py-3 text-sm font-bold text-white" style={{ background: 'var(--ab-navy)' }}>
                            Ver catálogo
                        </a>
                    </div>
                </StoreContainer>
            </>
        );
    }

    return (
        <>
            <Head title="Finalizar compra" />
            <StoreContainer className="py-8 md:py-12">
                <h1 className="mb-1 text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>Finalizar compra</h1>
                <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Tu equipo queda apartado apenas confirmes el pedido.
                </p>

                <Pasos actual={paso} />

                {noDisponibles.length > 0 && (
                    <div className="mb-6 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>
                        Quitamos {noDisponibles.length} producto(s) que ya se vendieron mientras comprabas.
                    </div>
                )}

                <form onSubmit={enviar} className="grid gap-8 lg:grid-cols-[1fr_380px]">
                    <div className="space-y-6">
                        {/* Datos */}
                        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                            <h2 className="mb-4 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Tus datos</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Campo label="Nombre completo" requerido error={errors.nombre_cliente}>
                                    <input className={inputCls} style={inputStyle} value={data.nombre_cliente}
                                        onChange={(e) => setData('nombre_cliente', e.target.value)} autoComplete="name" />
                                </Campo>
                                <Campo label="Teléfono / WhatsApp" requerido error={errors.telefono_cliente}>
                                    <input className={inputCls} style={inputStyle} value={data.telefono_cliente}
                                        onChange={(e) => setData('telefono_cliente', e.target.value)} inputMode="tel" autoComplete="tel" />
                                </Campo>
                                <Campo label="Correo" requerido error={errors.email_cliente}>
                                    <input type="email" className={inputCls} style={inputStyle} value={data.email_cliente}
                                        onChange={(e) => setData('email_cliente', e.target.value)} autoComplete="email" />
                                </Campo>
                                <Campo label="CI o NIT (para tu factura)" error={errors.documento}>
                                    <input className={inputCls} style={inputStyle} value={data.documento}
                                        onChange={(e) => setData('documento', e.target.value)} />
                                </Campo>
                            </div>
                        </motion.section>

                        {/* Entrega */}
                        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                            <h2 className="mb-4 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>¿Cómo lo recibes?</h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {entrega.map((op) => (
                                    <Tarjeta3D key={op.valor}>
                                        <button type="button" onClick={() => setData('tipo_entrega', op.valor)}
                                            className="w-full rounded-xl border p-4 text-left transition-shadow hover:shadow-md"
                                            style={{
                                                borderColor: data.tipo_entrega === op.valor ? 'var(--ab-navy)' : 'var(--border-light)',
                                                boxShadow: data.tipo_entrega === op.valor ? '0 0 0 2px var(--ab-navy) inset' : 'none',
                                            }}>
                                            <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{op.etiqueta}</span>
                                            <span className="mt-1 block text-xs" style={{ color: 'var(--text-secondary)' }}>{op.detalle}</span>
                                        </button>
                                    </Tarjeta3D>
                                ))}
                            </div>

                            {esEnvio && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 grid gap-4 overflow-hidden sm:grid-cols-2">
                                    <Campo label="Departamento" requerido error={errors.envio_departamento}>
                                        <select className={inputCls} style={inputStyle} value={data.envio_departamento}
                                            onChange={(e) => setData('envio_departamento', e.target.value)}>
                                            <option value="">Elige tu departamento</option>
                                            {destinos.map((d) => (
                                                <option key={d.departamento} value={d.departamento}>
                                                    {d.departamento} — {d.costo === 0 ? 'sin costo' : money(d.costo)}
                                                </option>
                                            ))}
                                        </select>
                                    </Campo>
                                    <Campo label="Ciudad" requerido error={errors.envio_ciudad}>
                                        <input className={inputCls} style={inputStyle} value={data.envio_ciudad}
                                            onChange={(e) => setData('envio_ciudad', e.target.value)} />
                                    </Campo>
                                    <div className="sm:col-span-2">
                                        <Campo label="Dirección" requerido error={errors.envio_direccion}>
                                            <input className={inputCls} style={inputStyle} value={data.envio_direccion}
                                                onChange={(e) => setData('envio_direccion', e.target.value)} autoComplete="street-address" />
                                        </Campo>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Campo label="Referencia (opcional)" error={errors.envio_referencia}>
                                            <input className={inputCls} style={inputStyle} value={data.envio_referencia}
                                                onChange={(e) => setData('envio_referencia', e.target.value)}
                                                placeholder="Ej.: casa de reja verde, frente a la plaza" />
                                        </Campo>
                                    </div>
                                    {destino?.plazo && (
                                        <p className="sm:col-span-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            Entrega estimada: {destino.plazo}.
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </motion.section>

                        {/* Pago */}
                        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                            <h2 className="mb-4 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>¿Cómo pagas?</h2>
                            {metodos.length === 0 ? (
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Todavía no hay formas de pago configuradas. Escríbenos por WhatsApp y lo cerramos por ahí.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {metodos.map((m) => (
                                        <button key={m.valor} type="button" onClick={() => setData('metodo_pago', m.valor)}
                                            className="flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-shadow hover:shadow-md"
                                            style={{
                                                borderColor: data.metodo_pago === m.valor ? 'var(--ab-navy)' : 'var(--border-light)',
                                                boxShadow: data.metodo_pago === m.valor ? '0 0 0 2px var(--ab-navy) inset' : 'none',
                                            }}>
                                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border"
                                                style={{ borderColor: data.metodo_pago === m.valor ? 'var(--ab-navy)' : 'var(--border-light)' }}>
                                                {data.metodo_pago === m.valor && <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--ab-navy)' }} />}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{m.etiqueta}</span>
                                                <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>{m.detalle}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {errors.metodo_pago && <p className="mt-2 text-xs font-semibold" style={{ color: '#dc2626' }}>{errors.metodo_pago}</p>}

                            <div className="mt-4">
                                <Campo label="Nota para nosotros (opcional)" error={errors.notas_cliente}>
                                    <textarea rows={2} className="w-full rounded-xl border p-3 text-sm outline-none" style={inputStyle}
                                        value={data.notas_cliente} onChange={(e) => setData('notas_cliente', e.target.value)} />
                                </Campo>
                            </div>
                        </motion.section>
                    </div>

                    {/* Resumen */}
                    <aside className="lg:sticky lg:top-24 lg:h-fit">
                        <Tarjeta3D intensidad={4}>
                            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-white)' }}>
                                <h2 className="mb-4 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Tu pedido</h2>

                                <div className="space-y-3">
                                    {disponibles.map((item) => (
                                        <div key={item.key} className="flex gap-3">
                                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                                                <ProductVisual product={item} compact className="h-full w-full" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                                <p className="mt-1 text-sm font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>{money(item.price)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 space-y-2 border-t pt-4 text-sm" style={{ borderColor: 'var(--border-light)' }}>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                        <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{money(total)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--text-secondary)' }}>Envío</span>
                                        <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                                            {esEnvio ? (destino ? (costoEnvio === 0 ? 'Sin costo' : money(costoEnvio)) : 'Elige departamento') : 'Retiro en tienda'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--border-light)' }}>
                                        <span className="font-black" style={{ color: 'var(--text-primary)' }}>Total</span>
                                        <motion.span key={totalFinal} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                                            className="text-lg font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>
                                            {money(totalFinal)}
                                        </motion.span>
                                    </div>
                                </div>

                                {errors.carrito && <p className="mt-3 text-xs font-semibold" style={{ color: '#dc2626' }}>{errors.carrito}</p>}

                                <motion.button type="submit" disabled={processing || metodos.length === 0}
                                    whileTap={{ scale: 0.98 }}
                                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white disabled:opacity-50"
                                    style={{ background: 'var(--ab-navy)' }}>
                                    {processing ? 'Creando tu pedido…' : <>Confirmar pedido <ChevronRight className="h-4 w-4" /></>}
                                </motion.button>

                                <ul className="mt-4 space-y-1.5 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
                                    <li className="flex items-start gap-2">
                                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ab-navy)' }} />
                                        Apartamos tu equipo mientras pagas.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ab-navy)' }} />
                                        El IMEI y la serie se te muestran al confirmarse el pago.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ab-navy)' }} />
                                        Recibes un código para seguir tu pedido.
                                    </li>
                                </ul>
                            </div>
                        </Tarjeta3D>
                    </aside>
                </form>
            </StoreContainer>
        </>
    );
}

/**
 * StoreLayout es quien PROVEE el contexto del carrito, así que tiene que estar montado por
 * encima de quien lo consume. Cuando `useStoreCart()` se llamaba dentro de este mismo
 * componente, el contexto todavía no existía: devolvía null y la página quedaba en blanco.
 */
export default function Checkout(props) {
    return (
        <StoreLayout>
            <CheckoutInterno {...props} />
        </StoreLayout>
    );
}
