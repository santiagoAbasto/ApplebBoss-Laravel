import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Send, Square, TriangleAlert, X } from 'lucide-react';
import { Button, Card, Field, Modal, PageHeader, Switch, Toast, buttonCls, fmtDate, inputCls, useToast } from '@/Components/Admin/ui';
import { Aviso, Nota } from '@/Components/Admin/inventario';
import { EstadoCampana } from '@/Components/Admin/newsletter';

const BLOCK_TYPES = [
    { tipo: 'titulo',    label: 'Título',    nuevo: { texto: '' } },
    { tipo: 'texto',     label: 'Texto',     nuevo: { texto: '' } },
    { tipo: 'imagen',    label: 'Imagen',    nuevo: { url: '', alt: '', enlace: '' } },
    { tipo: 'boton',     label: 'Botón',     nuevo: { texto: 'Ver más', url: '/catalogo' } },
    { tipo: 'producto',  label: 'Producto',  nuevo: { slug: '' } },
    { tipo: 'separador', label: 'Separador', nuevo: {} },
];
const LABEL = Object.fromEntries(BLOCK_TYPES.map((b) => [b.tipo, b.label]));

let uid = 0;
const withIds = (bloques) => bloques.map((b) => ({ ...b, _id: ++uid }));
const stripIds = (bloques) => bloques.map(({ _id, ...b }) => b);
const money = (v) => v != null ? new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v) : '—';

function useDebounced(value, ms) {
    const [v, setV] = useState(value);
    useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
    return v;
}

export default function CampaignEdit({ campaign, seleccion: initialSel, activos, resumen, fallidosDetalle, productosInfo, remitente, motivo, estado }) {
    const { auth } = usePage().props;
    const [toast, showToast] = useToast();
    const editable = campaign.estado === 'borrador';

    const [form, setForm] = useState({
        asunto: campaign.asunto ?? '',
        preheader: campaign.preheader ?? '',
        destino: campaign.destino ?? 'todos',
        adjuntar_imagenes: !!campaign.adjuntar_imagenes,
    });
    const [bloques, setBloques]     = useState(() => withIds(campaign.bloques ?? []));
    const [seleccion, setSeleccion] = useState(initialSel ?? []);
    const [productos, setProductos] = useState(productosInfo ?? {});
    const [dirty, setDirty]         = useState(false);
    const [saving, setSaving]       = useState(false);
    const [preview, setPreview]     = useState('');
    const [testEmail, setTestEmail] = useState(auth?.user?.email ?? '');
    const [testing, setTesting]     = useState(false);
    const [confirmSend, setConfirmSend] = useState(false);
    const [confirmStop, setConfirmStop] = useState(false);
    const [live, setLive]           = useState({ estado: campaign.estado, total: campaign.total, enviados: campaign.enviados, fallidos: campaign.fallidos });

    const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };
    const updateBlock = (id, patch) => { setBloques((bs) => bs.map((b) => (b._id === id ? { ...b, ...patch } : b))); setDirty(true); };
    const removeBlock = (id) => { setBloques((bs) => bs.filter((b) => b._id !== id)); setDirty(true); };
    const moveBlock = (idx, dir) => {
        setBloques((bs) => {
            const to = idx + dir;
            if (to < 0 || to >= bs.length) return bs;
            const next = [...bs];
            [next[idx], next[to]] = [next[to], next[idx]];
            return next;
        });
        setDirty(true);
    };
    const addBlock = (tipo) => {
        const def = BLOCK_TYPES.find((b) => b.tipo === tipo);
        setBloques((bs) => [...bs, { tipo, ...def.nuevo, _id: ++uid }]);
        setDirty(true);
    };

    // ── Vista previa en vivo (la arma el servidor con la misma plantilla del envío) ──
    const previewPayload = useDebounced(JSON.stringify({ asunto: form.asunto, preheader: form.preheader, bloques: stripIds(bloques) }), 500);
    useEffect(() => {
        let cancel = false;
        axios.post(route('admin.newsletter.campaigns.preview'), JSON.parse(previewPayload), { responseType: 'text' })
            .then((r) => { if (!cancel) setPreview(r.data); })
            .catch(() => {});
        return () => { cancel = true; };
    }, [previewPayload]);

    // ── Guardado ──
    const save = useCallback(async (silent = false) => {
        if (!editable) return true;
        setSaving(true);
        try {
            await axios.patch(route('admin.newsletter.campaigns.update', campaign.id), {
                ...form,
                bloques: stripIds(bloques),
                seleccion: seleccion.map((s) => s.id),
            });
            setDirty(false);
            if (!silent) showToast('Campaña guardada.');
            return true;
        } catch (e) {
            showToast(e.response?.data?.message ?? 'Revisa el asunto: es obligatorio.', 'error');
            return false;
        } finally {
            setSaving(false);
        }
    }, [editable, campaign.id, form, bloques, seleccion, showToast]);

    // Aviso al salir con cambios sin guardar
    useEffect(() => {
        const fn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', fn);
        return () => window.removeEventListener('beforeunload', fn);
    }, [dirty]);

    const sendTest = async () => {
        if (!testEmail) return;
        setTesting(true);
        try {
            if (!(await save(true))) return;
            await axios.post(route('admin.newsletter.campaigns.test', campaign.id), { email: testEmail });
            showToast(`Prueba enviada a ${testEmail}.`);
        } catch (e) {
            showToast(e.response?.data?.message ?? 'No se pudo enviar la prueba.', 'error');
        } finally {
            setTesting(false);
        }
    };

    const destinatarios = form.destino === 'todos' ? activos : seleccion.length;

    const sendCampaign = async () => {
        setConfirmSend(false);
        if (!(await save(true))) return;
        try {
            const { data } = await axios.post(route('admin.newsletter.campaigns.send', campaign.id));
            showToast(`Envío iniciado a ${data.total} suscriptores.`);
            router.reload();
        } catch (e) {
            showToast(e.response?.data?.message ?? 'No se pudo iniciar el envío.', 'error');
        }
    };

    const cancelSend = async () => {
        setConfirmStop(false);
        await axios.post(route('admin.newsletter.campaigns.cancel', campaign.id));
        router.reload();
    };

    // ── Progreso en vivo mientras se envía ──
    useEffect(() => {
        if (live.estado !== 'enviando') return;
        const t = setInterval(async () => {
            try {
                const { data } = await axios.get(route('admin.newsletter.campaigns.status', campaign.id));
                setLive(data);
                if (data.estado !== 'enviando') { clearInterval(t); router.reload({ only: ['campaign', 'resumen', 'fallidosDetalle'] }); }
            } catch { /* reintenta en el próximo ciclo */ }
        }, 4000);
        return () => clearInterval(t);
    }, [live.estado, campaign.id]);

    const pct = live.total ? Math.round(((live.enviados + live.fallidos) / live.total) * 100) : 0;

    return (
        <AdminLayout>
            <Head title={`${form.asunto || 'Campaña'} — Newsletter`} />
            <Toast toast={toast} />

            <div className="mx-auto max-w-7xl space-y-5">
                {/* Cabecera */}
                <Link href={route('admin.newsletter.campaigns.index')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
                    <ArrowLeft className="h-4 w-4" /> Campañas
                </Link>

                <PageHeader
                    title={form.asunto || 'Campaña sin asunto'}
                    subtitle={editable
                        ? 'Arma el correo, mándate una prueba y recién ahí envíalo. Mientras es borrador, no le llega a nadie.'
                        : 'Una campaña enviada no se edita: duplícala para escribir la próxima sobre esta.'}
                    actions={editable ? (
                        <>
                            <button type="button" onClick={() => save()} disabled={saving} className={buttonCls('secondary', 'h-11 px-4')}>
                                {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                            <button type="button" onClick={() => setConfirmSend(true)} disabled={Boolean(motivo) || !bloques.length}
                                className={buttonCls('primary', 'h-11 px-4')}>
                                <Send className="h-4 w-4" /> Enviar campaña
                            </button>
                        </>
                    ) : (
                        <>
                            {live.estado === 'enviando' && (
                                <button type="button" onClick={() => setConfirmStop(true)} className={buttonCls('secondary', 'h-11 px-4')}>
                                    <Square className="h-4 w-4" /> Detener envío
                                </button>
                            )}
                            <button type="button" onClick={() => router.post(route('admin.newsletter.campaigns.duplicate', campaign.id))}
                                className={buttonCls('primary', 'h-11 px-4')}>
                                <Copy className="h-4 w-4" /> Duplicar como borrador
                            </button>
                        </>
                    )}
                />

                <div className="flex flex-wrap items-center gap-3">
                    <EstadoCampana estado={live.estado} />
                    {editable && (
                        <span className={`text-xs font-semibold ${dirty ? 'text-amber-600' : 'text-slate-400'}`}>
                            {dirty ? 'Cambios sin guardar' : 'Todo guardado'}
                        </span>
                    )}
                </div>

                {editable && motivo && (
                    <Aviso tono="amber" icon={TriangleAlert}>
                        <span className="font-bold">Todavía no se puede enviar.</span> {motivo}
                    </Aviso>
                )}

                {editable && !motivo && estado && !estado.correo?.listo && (
                    <Aviso tono="amber" icon={TriangleAlert} accion="Ir a Ajustes"
                        onAccion={() => router.visit(route('admin.newsletter.settings.edit'))}>
                        <span className="font-bold">El servidor de correo no está listo.</span> {estado.correo?.falta}
                    </Aviso>
                )}

                {!editable && (
                    <Card title="Resultado del envío">
                        <div className="grid gap-3 sm:grid-cols-4">
                            <Metric label="Destinatarios" value={live.total} />
                            <Metric label="Enviados" value={live.enviados} tone="text-emerald-700" />
                            <Metric label="Fallidos" value={live.fallidos} tone={live.fallidos ? 'text-red-600' : 'text-slate-900'} />
                            <Metric label="Omitidos (se dieron de baja)" value={resumen?.omitido ?? 0} tone="text-slate-500" />
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            Iniciada {fmtDate(campaign.iniciada_at)}{campaign.finalizada_at ? ` · Finalizada ${fmtDate(campaign.finalizada_at)}` : ''}
                            {live.estado === 'enviando' && ' · Se envía por lotes cada minuto; puedes cerrar esta pantalla.'}
                        </p>
                        {fallidosDetalle?.length > 0 && (
                            <details className="mt-4">
                                <summary className="cursor-pointer text-sm font-semibold text-red-700">Ver correos fallidos ({fallidosDetalle.length})</summary>
                                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                                    {fallidosDetalle.map((f) => <li key={f.email}><strong>{f.email}</strong> — {f.error}</li>)}
                                </ul>
                            </details>
                        )}
                    </Card>
                )}

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,620px)]">
                    {/* ── Editor ── */}
                    <div className="space-y-5">
                        <Card title="Correo">
                            <fieldset disabled={!editable} className="space-y-4">
                                <Field label="Asunto" value={form.asunto} max={80} hint="Lo primero que ve el suscriptor en su bandeja. Ideal: menos de 60 caracteres.">
                                    <input className={inputCls} value={form.asunto} maxLength={191} onChange={(e) => set('asunto', e.target.value)} />
                                </Field>
                                <Field label="Texto de vista previa (opcional)" value={form.preheader} max={110} hint="Aparece junto al asunto en Gmail y Outlook.">
                                    <input className={inputCls} value={form.preheader} maxLength={191} onChange={(e) => set('preheader', e.target.value)} />
                                </Field>
                            </fieldset>
                        </Card>

                        <Card title="Contenido" subtitle="Arma el correo con bloques. El diseño, los colores y el link de baja se agregan solos.">
                            <div className="space-y-3">
                                {bloques.length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Agrega el primer bloque.</p>}
                                {bloques.map((b, idx) => (
                                    <BlockEditor
                                        key={b._id}
                                        block={b}
                                        idx={idx}
                                        total={bloques.length}
                                        editable={editable}
                                        productos={productos}
                                        onChange={(patch) => updateBlock(b._id, patch)}
                                        onRemove={() => removeBlock(b._id)}
                                        onMove={(dir) => moveBlock(idx, dir)}
                                        onProduct={(info) => setProductos((p) => ({ ...p, [info.slug]: info }))}
                                        onError={(m) => showToast(m, 'error')}
                                    />
                                ))}
                            </div>
                            {editable && (
                                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                                    <span className="self-center text-xs font-semibold uppercase tracking-wide text-slate-500">Agregar:</span>
                                    {BLOCK_TYPES.map((t) => (
                                        <button key={t.tipo} type="button" onClick={() => addBlock(t.tipo)}
                                            className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700">
                                            + {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card title="Destinatarios">
                            <fieldset disabled={!editable} className="space-y-4">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <RadioCard checked={form.destino === 'todos'} onChange={() => set('destino', 'todos')}
                                        title="Todos los suscriptores" text={`${activos} suscriptores activos`} />
                                    <RadioCard checked={form.destino === 'seleccion'} onChange={() => set('destino', 'seleccion')}
                                        title="Elegir suscriptores" text={`${seleccion.length} seleccionados`} />
                                </div>
                                {form.destino === 'seleccion' && (
                                    <SubscriberPicker selected={seleccion} onChange={(s) => { setSeleccion(s); setDirty(true); }} />
                                )}
                                <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                                    <Switch checked={form.adjuntar_imagenes} onChange={(v) => set('adjuntar_imagenes', v)} label="Adjuntar imágenes" disabled={!editable} />
                                    <span className="text-sm text-slate-700">
                                        <strong>Adjuntar también las imágenes como archivos</strong>
                                        <span className="block text-xs text-slate-500">Las imágenes siempre se ven dentro del correo. Adjuntarlas hace el correo más pesado y puede mandarlo a spam; úsalo solo si lo necesitas.</span>
                                    </span>
                                </label>
                            </fieldset>
                        </Card>

                        {editable && (
                            <Card title="Enviar una prueba" subtitle="Te llega el correo tal cual lo verán tus suscriptores, marcado como [PRUEBA].">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <input type="email" className={inputCls} value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="tu@correo.com" />
                                    <Button onClick={sendTest} disabled={testing || !testEmail} className="shrink-0">{testing ? 'Enviando…' : 'Enviar prueba'}</Button>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500">Se envía desde {remitente}. Gmail permite alrededor de 500 correos por día por cuenta: para listas grandes conviene un proveedor de envíos masivos.</p>
                            </Card>
                        )}
                    </div>

                    {/* ── Vista previa ── */}
                    <div className="xl:sticky xl:top-4 xl:self-start">
                        <Card title="Vista previa" subtitle="Así se verá en la bandeja de entrada.">
                            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="truncate text-sm font-bold text-slate-900">{form.asunto || 'Sin asunto'}</p>
                                <p className="truncate text-xs text-slate-500">{form.preheader || 'Sin texto de vista previa'}</p>
                            </div>
                            <iframe title="Vista previa del correo" srcDoc={preview} sandbox="" className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white" />
                        </Card>
                    </div>
                </div>
            </div>

            {confirmStop && (
                <Modal title="Detener el envío" onClose={() => setConfirmStop(false)}
                    footer={<>
                        <button type="button" onClick={() => setConfirmStop(false)} className={buttonCls('secondary', 'h-11')}>Seguir enviando</button>
                        <button type="button" onClick={cancelSend} className={buttonCls('primary', 'h-11')}>Sí, detener</button>
                    </>}>
                    <p className="text-sm text-slate-700">
                        Se detiene el envío de <strong>«{form.asunto}»</strong>. Los {live.enviados} correos que ya salieron
                        no se pueden recuperar; los que faltaban no se mandan.
                    </p>
                    <Nota>La campaña queda como «Cancelada». Para retomarla, duplícala y envía la copia.</Nota>
                </Modal>
            )}

            {confirmSend && (
                <Modal title="Confirmar envío" onClose={() => setConfirmSend(false)}
                    footer={<>
                        <Button onClick={() => setConfirmSend(false)}>Cancelar</Button>
                        <Button variant="success" onClick={sendCampaign}>Sí, enviar a {destinatarios}</Button>
                    </>}>
                    <p className="text-sm text-slate-700">
                        Se enviará <strong>“{form.asunto}”</strong> a <strong>{destinatarios} suscriptores</strong>.
                        Una vez iniciado, el contenido ya no se puede editar.
                    </p>
                    <p className="mt-3 text-xs text-slate-500">Recomendación: envía primero una prueba a tu correo y revísala en el celular.</p>
                </Modal>
            )}
        </AdminLayout>
    );
}

function Metric({ label, value, tone = 'text-slate-900' }) {
    return (
        <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`text-xl font-black tabular-nums ${tone}`}>{value ?? 0}</p>
        </div>
    );
}

function RadioCard({ checked, onChange, title, text }) {
    return (
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${checked ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200'}`}>
            <input type="radio" checked={checked} onChange={onChange} className="mt-1" />
            <span>
                <span className="block text-sm font-bold text-slate-900">{title}</span>
                <span className="block text-xs text-slate-500">{text}</span>
            </span>
        </label>
    );
}

function BlockEditor({ block, idx, total, editable, productos, onChange, onRemove, onMove, onProduct, onError }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{idx + 1}. {LABEL[block.tipo]}</span>
                {editable && (
                    <div className="flex gap-1">
                        <IconBtn label="Subir" disabled={idx === 0} onClick={() => onMove(-1)}><ChevronUp className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Bajar" disabled={idx === total - 1} onClick={() => onMove(1)}><ChevronDown className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Quitar bloque" onClick={onRemove} danger><X className="h-3.5 w-3.5" /></IconBtn>
                    </div>
                )}
            </div>
            <fieldset disabled={!editable} className="space-y-3 p-3">
                {block.tipo === 'titulo' && (
                    <input className={inputCls} value={block.texto} maxLength={200} placeholder="Ej.: Llegaron los nuevos iPhone" onChange={(e) => onChange({ texto: e.target.value })} />
                )}
                {block.tipo === 'texto' && (
                    <textarea className={inputCls} rows={4} value={block.texto} maxLength={5000} placeholder="Escribe el mensaje. Los saltos de línea se respetan." onChange={(e) => onChange({ texto: e.target.value })} />
                )}
                {block.tipo === 'imagen' && <ImageBlock block={block} onChange={onChange} onError={onError} />}
                {block.tipo === 'boton' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                        <input className={inputCls} value={block.texto} maxLength={60} placeholder="Texto del botón" onChange={(e) => onChange({ texto: e.target.value })} />
                        <input className={inputCls} value={block.url} maxLength={500} placeholder="/catalogo o https://…" onChange={(e) => onChange({ url: e.target.value })} />
                    </div>
                )}
                {block.tipo === 'producto' && <ProductBlock block={block} info={productos[block.slug]} onChange={onChange} onProduct={onProduct} />}
                {block.tipo === 'separador' && <hr className="border-slate-200" />}
            </fieldset>
        </div>
    );
}

function IconBtn({ children, label, danger, ...props }) {
    return (
        <button type="button" aria-label={label} title={label}
            className={`rounded-md px-2 py-0.5 text-xs disabled:opacity-30 ${danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-500 hover:bg-slate-100'}`} {...props}>
            {children}
        </button>
    );
}

function ImageBlock({ block, onChange, onError }) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const upload = async (file) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('imagen', file);
        setUploading(true);
        try {
            const { data } = await axios.post(route('admin.newsletter.campaigns.image'), fd);
            onChange({ url: data.url, alt: block.alt || file.name.replace(/\.[^.]+$/, '') });
        } catch (e) {
            onError(e.response?.data?.errors?.imagen?.[0] ?? 'No se pudo subir la imagen (JPG, PNG, GIF o WEBP, máx. 5 MB).');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <button type="button" onClick={() => inputRef.current?.click()}
                className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-500 hover:border-blue-400">
                {block.url ? <img src={block.url} alt="" className="h-full w-full object-cover" /> : (uploading ? 'Subiendo…' : 'Subir imagen')}
            </button>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            <div className="space-y-2">
                <input className={inputCls} value={block.alt} maxLength={150} placeholder="Descripción de la imagen (accesibilidad)" onChange={(e) => onChange({ alt: e.target.value })} />
                <input className={inputCls} value={block.enlace ?? ''} maxLength={500} placeholder="Enlace al tocar la imagen (opcional)" onChange={(e) => onChange({ enlace: e.target.value })} />
                {block.url && <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-semibold text-blue-700 hover:underline">{uploading ? 'Subiendo…' : 'Cambiar imagen'}</button>}
            </div>
        </div>
    );
}

function ProductBlock({ block, info, onChange, onProduct }) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const dq = useDebounced(q, 300);

    useEffect(() => {
        if (!dq) { setResults([]); return; }
        axios.get(route('admin.newsletter.campaigns.products'), { params: { q: dq } }).then((r) => setResults(r.data)).catch(() => {});
    }, [dq]);

    return (
        <div className="space-y-2">
            {block.slug && (
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2">
                    {info?.imagen ? <img src={info.imagen} alt="" className="h-12 w-12 rounded-md object-cover" /> : <div className="h-12 w-12 rounded-md bg-slate-200" />}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{info?.titulo ?? block.slug}</p>
                        <p className="text-xs text-slate-500">{money(info?.precio)} · precio vigente al momento del envío</p>
                        {info && !info.disponible && <p className="text-xs font-semibold text-amber-600">No disponible: no se incluirá en el correo.</p>}
                    </div>
                </div>
            )}
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder={block.slug ? 'Cambiar producto… (busca por nombre)' : 'Busca un producto publicado por nombre'} />
            {results.length > 0 && (
                <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                    {results.map((p) => (
                        <li key={p.slug}>
                            <button type="button" onClick={() => { onChange({ slug: p.slug }); onProduct(p); setQ(''); setResults([]); }}
                                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50">
                                {p.imagen ? <img src={p.imagen} alt="" className="h-9 w-9 rounded object-cover" /> : <div className="h-9 w-9 rounded bg-slate-100" />}
                                <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{p.titulo}</span>
                                <span className="text-xs font-semibold text-slate-600">{money(p.precio)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function SubscriberPicker({ selected, onChange }) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const dq = useDebounced(q, 300);
    const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

    useEffect(() => {
        axios.get(route('admin.newsletter.subscribers.search'), { params: { q: dq } }).then((r) => setResults(r.data)).catch(() => {});
    }, [dq]);

    const add = (s) => !selectedIds.has(s.id) && onChange([...selected, s]);
    const addAll = () => onChange([...selected, ...results.filter((s) => !selectedIds.has(s.id))]);
    const remove = (id) => onChange(selected.filter((s) => s.id !== id));

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <div>
                <div className="flex gap-2">
                    <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por correo o nombre" />
                    <Button onClick={addAll} disabled={!results.length} className="shrink-0">Agregar todos</Button>
                </div>
                <ul className="mt-2 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                    {results.length === 0 && <li className="px-3 py-4 text-center text-xs text-slate-400">Sin resultados</li>}
                    {results.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2">
                            <span className="min-w-0 truncate text-sm text-slate-800">{s.email}{s.nombre && <span className="text-slate-400"> · {s.nombre}</span>}</span>
                            <button type="button" onClick={() => add(s)} disabled={selectedIds.has(s.id)}
                                className="shrink-0 text-xs font-semibold text-blue-700 disabled:text-slate-300">
                                {selectedIds.has(s.id) ? 'Agregado' : '+ Agregar'}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Seleccionados ({selected.length})</p>
                    {selected.length > 0 && <button type="button" onClick={() => onChange([])} className="text-xs font-semibold text-red-600">Quitar todos</button>}
                </div>
                <ul className="mt-2 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                    {selected.length === 0 && <li className="px-3 py-4 text-center text-xs text-slate-400">Todavía no elegiste a nadie.</li>}
                    {selected.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2">
                            <span className="min-w-0 truncate text-sm text-slate-800">{s.email}</span>
                            <button type="button" onClick={() => remove(s.id)} className="shrink-0 text-xs font-semibold text-red-600">Quitar</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
