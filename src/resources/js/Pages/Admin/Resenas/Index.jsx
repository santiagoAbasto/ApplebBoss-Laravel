import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { BadgeCheck, CircleAlert, MessageSquareQuote, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Select, Switch, Textarea, Toast, fmtDate, useToast } from '@/Components/Admin/ui';

const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });

function Estrellas({ n, onElegir, tam = 'h-4 w-4' }) {
    return (
        <span className="inline-flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => {
                const icono = <Star className={`${tam} ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />;
                return onElegir
                    ? <button key={i} type="button" onClick={() => onElegir(i)} aria-label={`${i} de 5`} className="rounded p-0.5 hover:bg-slate-100">{icono}</button>
                    : <span key={i}>{icono}</span>;
            })}
        </span>
    );
}

function Resumen({ label, valor, tono, children }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <p className="text-[13px] font-semibold text-slate-500">{label}</p>
            <div className="mt-3 flex items-center gap-2">
                <p className={`text-[26px] font-extrabold leading-none ${tono}`}>{valor}</p>
                {children}
            </div>
        </div>
    );
}

function Formulario({ resena, fuentes, fuentesAMano, onClose }) {
    const editando = Boolean(resena);
    const verificada = Boolean(resena?.pedido);
    const { data, setData, post, patch, processing, errors } = useForm({
        nombre: resena?.nombre ?? '',
        calificacion: resena?.calificacion ?? 5,
        texto: resena?.texto ?? '',
        fuente: resena?.fuente ?? 'google',
        enlace: resena?.enlace ?? '',
        producto: resena?.producto ?? '',
        fecha: resena?.fecha ?? hoy(),
        publicada: resena?.publicada ?? true,
    });

    const guardar = () => {
        const opciones = { preserveScroll: true, onSuccess: onClose };
        if (editando) patch(route('admin.resenas.update', resena.id), opciones);
        else post(route('admin.resenas.store'), opciones);
    };

    return (
        <Modal title={editando ? 'Editar reseña' : 'Nueva reseña'} onClose={onClose} wide
            footer={<>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="primary" onClick={guardar} disabled={processing}>{processing ? 'Guardando…' : 'Guardar'}</Button>
            </>}>
            <div className="flex flex-col gap-4">
                {!editando && (
                    <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        Carga solo opiniones reales que te hayan dejado, tal como las escribieron. Si es de Google o de una red social, pega el enlace: así cualquiera la puede comprobar.
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nombre del cliente" hint="En la tienda sale solo el nombre y la inicial del apellido." error={errors.nombre}>
                        <Input value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} maxLength={80} />
                    </Field>
                    <Field label="Calificación" error={errors.calificacion}>
                        <div className="flex h-11 items-center"><Estrellas n={data.calificacion} onElegir={(n) => setData('calificacion', n)} tam="h-6 w-6" /></div>
                    </Field>
                </div>

                <Field label="Lo que escribió" value={data.texto} max={1000} error={errors.texto}>
                    <Textarea rows={4} value={data.texto} onChange={(e) => setData('texto', e.target.value)} maxLength={1000} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Dónde la dejó" error={errors.fuente}>
                        {verificada ? (
                            <Input value="Compra en la web (verificada)" disabled />
                        ) : (
                            <Select value={data.fuente} onChange={(e) => setData('fuente', e.target.value)}>
                                {fuentes.filter((f) => fuentesAMano.includes(f.valor)).map((f) => <option key={f.valor} value={f.valor}>{f.etiqueta}</option>)}
                            </Select>
                        )}
                    </Field>
                    <Field label="Fecha" error={errors.fecha}>
                        <Input type="date" value={data.fecha} max={hoy()} onChange={(e) => setData('fecha', e.target.value)} />
                    </Field>
                </div>

                {!verificada && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Enlace a la original" hint="Opcional. Google Maps, Facebook o Instagram." error={errors.enlace}>
                            <Input value={data.enlace} onChange={(e) => setData('enlace', e.target.value)} placeholder="https://" inputMode="url" />
                        </Field>
                        <Field label="Qué compró" hint="Opcional." error={errors.producto}>
                            <Input value={data.producto} onChange={(e) => setData('producto', e.target.value)} placeholder="iPhone 15 128 GB" maxLength={120} />
                        </Field>
                    </div>
                )}

                {!editando && <Switch checked={data.publicada} onChange={(v) => setData('publicada', v)} label="Publicarla en la tienda ahora" />}
            </div>
        </Modal>
    );
}

export default function Index({ resenas = [], fuentes = [], fuentesAMano = [], resumen = {}, bloqueInicio = true }) {
    const [toast] = useToast();
    const [editar, setEditar] = useState(null);   // null | 'nueva' | reseña
    const [borrar, setBorrar] = useState(null);
    const etiqueta = Object.fromEntries(fuentes.map((f) => [f.valor, f.etiqueta]));
    const pendientes = resenas.filter((r) => !r.publicada);

    const publicar = (r, valor) => router.patch(route('admin.resenas.update', r.id), { publicada: valor }, { preserveScroll: true, preserveState: true });

    return (
        <AdminLayout title="Reseñas">
            <Head title="Reseñas" />
            <Toast toast={toast} />

            <PageHeader
                title="Reseñas"
                subtitle="Las opiniones de tus clientes. Las que dejan al recibir su pedido llegan acá como compra verificada; las publicadas pasan una por una en el inicio, después de las preguntas frecuentes."
                actions={<Button variant="primary" onClick={() => setEditar('nueva')}><Plus className="mr-1.5 h-4 w-4" /> Nueva reseña</Button>}
            />

            {!bloqueInicio && (
                <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    La sección «Reseñas» está apagada en <Link href={route('admin.home-builder.index')} className="font-bold underline">Portada</Link>: aunque publiques, no se ve en la tienda.
                </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Resumen label="Publicadas" valor={resumen.publicadas ?? 0} tono="text-slate-900" />
                <Resumen label="Esperan tu aprobación" valor={resumen.pendientes ?? 0} tono={resumen.pendientes ? 'text-violet-700' : 'text-slate-900'} />
                <Resumen label="Promedio de las publicadas" valor={resumen.promedio !== null && resumen.promedio !== undefined ? String(resumen.promedio).replace('.', ',') : '—'} tono="text-slate-900">
                    {resumen.promedio ? <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> : null}
                </Resumen>
            </div>

            <div className="mt-6 space-y-3">
                {resenas.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-white">
                        <EmptyState icon={MessageSquareQuote} title="Todavía no hay reseñas"
                            text="Cuando un cliente reciba su pedido, puede dejar su opinión desde el seguimiento. También puedes cargar las que te dejaron en Google, redes o en la tienda."
                            action={<Button variant="primary" onClick={() => setEditar('nueva')}>Cargar una reseña</Button>} />
                    </div>
                ) : resenas.map((r) => (
                    <article key={r.id} className={`rounded-2xl border bg-white p-5 ${!r.publicada && r.pedido ? 'border-violet-200 ring-1 ring-violet-100' : 'border-slate-200/80'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Estrellas n={r.calificacion} />
                                    {r.pedido ? (
                                        <Badge tone="emerald"><BadgeCheck className="h-3 w-3" /> Compra verificada</Badge>
                                    ) : (
                                        <Badge tone="slate">{etiqueta[r.fuente] ?? r.fuente}</Badge>
                                    )}
                                    {!r.publicada && <Badge tone={r.pedido ? 'violet' : 'amber'}>{r.pedido ? 'Espera tu aprobación' : 'Oculta'}</Badge>}
                                </div>
                                <p className="mt-3 text-[15px] leading-relaxed text-slate-800">“{r.texto}”</p>
                                <p className="mt-3 text-xs text-slate-500">
                                    <span className="font-bold text-slate-700">{r.nombre}</span>
                                    {' · en la tienda sale como '}<span className="font-semibold">«{r.firma}»</span>
                                    {r.producto && <> · {r.producto}</>}
                                    {r.fecha && <> · {fmtDate(r.fecha)}</>}
                                    {r.pedido && <> · <Link href={route('admin.pedidos.show', r.pedido.id)} className="font-semibold text-blue-700 underline">{r.pedido.codigo}</Link></>}
                                    {r.enlace && <> · <a href={r.enlace} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">ver la original</a></>}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={r.publicada} onChange={(v) => publicar(r, v)} label={r.publicada ? 'Publicada' : 'Publicar'} />
                                <button type="button" onClick={() => setEditar(r)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
                                <button type="button" onClick={() => setBorrar(r)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Borrar"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {pendientes.length > 0 && (
                <p className="mt-4 text-xs text-slate-500">Revisa que la opinión no tenga datos personales ni insultos antes de publicarla.</p>
            )}

            {editar && (
                <Formulario resena={editar === 'nueva' ? null : editar} fuentes={fuentes} fuentesAMano={fuentesAMano} onClose={() => setEditar(null)} />
            )}

            {borrar && (
                <Modal title="¿Borrar esta reseña?" onClose={() => setBorrar(null)}
                    footer={<>
                        <Button onClick={() => setBorrar(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={() => router.delete(route('admin.resenas.destroy', borrar.id), { preserveScroll: true, onSuccess: () => setBorrar(null) })}>Borrar</Button>
                    </>}>
                    <p className="text-sm text-slate-600">Se borra para siempre. Si solo quieres que no se vea, apágala con el interruptor.</p>
                </Modal>
            )}
        </AdminLayout>
    );
}
