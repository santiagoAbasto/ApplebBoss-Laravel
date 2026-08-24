import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    AlertCircle, ArrowLeft, Check, CheckCircle, ChevronDown, Eye, Globe,
    GripVertical, Image as ImageIcon, Info, Loader2, Save, Star, Tag, Trash2, X,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const money = (v) =>
    v != null
        ? new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(v)
        : '—';

const CATEGORIAS = [
    { value: 'celulares',         label: 'Celulares' },
    { value: 'computadoras',      label: 'Computadoras' },
    { value: 'productos-apple',   label: 'Productos Apple' },
    { value: 'fundas',            label: 'Fundas' },
    { value: 'accesorios',        label: 'Accesorios' },
];

const GARANTIA_SUGERIDAS = [
    '1 mes por el negocio',
    '3 meses por el negocio',
    '6 meses por el negocio',
    '12 meses por el negocio',
    'Sin garantía',
];

const BADGES = ['OFERTA', 'NUEVO INGRESO', 'ÚLTIMAS UNIDADES', 'RECOMENDADO', 'MÁS VENDIDO'];

// ─── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, required, hint, error, children }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
                {label}{required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
            {error && <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>}
        </div>
    );
}

function Input({ error, ...props }) {
    return (
        <input
            {...props}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-400'
            }`}
        />
    );
}

function Textarea({ error, rows = 3, ...props }) {
    return (
        <textarea
            rows={rows}
            {...props}
            className={`w-full resize-y rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-400'
            }`}
        />
    );
}

function Select({ error, children, ...props }) {
    return (
        <select
            {...props}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-400'
            }`}
        >
            {children}
        </select>
    );
}

// ─── Readiness pill ────────────────────────────────────────────────────────────
function ReadinessPill({ missing }) {
    if (missing.length === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle className="h-3.5 w-3.5" /> Listo para publicar
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <AlertCircle className="h-3.5 w-3.5" /> {missing.length} campo{missing.length !== 1 ? 's' : ''} faltante{missing.length !== 1 ? 's' : ''}
        </span>
    );
}

// ─── Tab nav ───────────────────────────────────────────────────────────────────
const TABS = ['GENERAL', 'MEDIA', 'ATRIBUTOS', 'COMERCIAL', 'INVENTARIO', 'SEO', 'PUBLICACIÓN', 'PREVIEW'];

function TabNav({ active, onChange, errors }) {
    const tabsWithErrors = {
        GENERAL:      ['titulo','slug','resumen','descripcion','garantia','condicion','categoria','storefront'],
        MEDIA:        [],
        ATRIBUTOS:    ['atributos'],
        COMERCIAL:    ['precio_promocional','promocion_desde','promocion_hasta','badge'],
        INVENTARIO:   [],
        SEO:          ['seo_title','seo_description'],
        'PUBLICACIÓN': ['publicado','publicar_desde','publicar_hasta'],
        PREVIEW:      [],
    };

    return (
        <nav className="flex gap-0 overflow-x-auto border-b border-gray-200 bg-white">
            {TABS.map((tab) => {
                const hasError = tabsWithErrors[tab]?.some((k) => errors[k]);
                return (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => onChange(tab)}
                        className={`relative shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                            active === tab
                                ? 'border-b-2 border-gray-900 text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab}
                        {hasError && (
                            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                    </button>
                );
            })}
        </nav>
    );
}

// ─── MEDIA TAB ─────────────────────────────────────────────────────────────────
function MediaTab({ publicacion, imagenes: init }) {
    const [imagenes, setImagenes] = useState(init ?? []);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const inputRef = useRef(null);
    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    const apiCall = useCallback(async (url, options) => {
        const res = await fetch(url, { ...options, headers: { 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', ...options?.headers } });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`);
        return res.json();
    }, []);

    const upload = useCallback(async (file) => {
        setUploadError('');
        setUploading(true);
        const fd = new FormData();
        fd.append('imagen', file);
        try {
            const img = await apiCall(route('admin.catalogo.imagenes.upload', publicacion.id), { method: 'POST', body: fd });
            setImagenes((prev) => [...prev, img]);
        } catch (e) {
            setUploadError(e.message);
        } finally {
            setUploading(false);
        }
    }, [publicacion.id, apiCall]);

    const setPrincipal = useCallback(async (img) => {
        await apiCall(route('admin.catalogo.imagenes.principal', { publicacion: publicacion.id, imagen: img.id }), { method: 'POST' });
        setImagenes((prev) => prev.map((i) => ({ ...i, es_principal: i.id === img.id })));
    }, [publicacion.id, apiCall]);

    const deleteImg = useCallback(async (img) => {
        if (!window.confirm('¿Eliminar esta imagen?')) return;
        await apiCall(route('admin.catalogo.imagenes.delete', { publicacion: publicacion.id, imagen: img.id }), { method: 'DELETE' });
        setImagenes((prev) => prev.filter((i) => i.id !== img.id));
    }, [publicacion.id, apiCall]);

    const handleFiles = (files) => Array.from(files).forEach(upload);
    const handleDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };

    const principal = imagenes.find((i) => i.es_principal) ?? imagenes[0];

    return (
        <div className="space-y-6">
            {/* Imagen principal */}
            {principal && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Imagen principal</p>
                    <div className="relative inline-block">
                        <img
                            src={principal.url_detail ?? principal.url_card}
                            alt={principal.alt || publicacion.titulo}
                            className="h-56 w-auto max-w-xs rounded-xl object-contain border border-gray-100 bg-gray-50"
                        />
                        <span className="absolute bottom-2 left-2 rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            Principal
                        </span>
                    </div>
                </div>
            )}

            {/* Galería */}
            {imagenes.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Galería</p>
                    <div className="flex flex-wrap gap-3">
                        {imagenes.map((img) => (
                            <div
                                key={img.id}
                                className="group relative h-20 w-20 overflow-hidden rounded-xl border-2 bg-gray-50"
                                style={{ borderColor: img.es_principal ? '#F59E0B' : 'transparent' }}
                            >
                                <img
                                    src={img.url_thumb ?? img.url_card}
                                    alt={img.alt || ''}
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                    {!img.es_principal && (
                                        <button
                                            type="button"
                                            onClick={() => setPrincipal(img)}
                                            title="Marcar como principal"
                                            className="rounded-full bg-amber-400 p-1.5 text-amber-900 hover:bg-amber-300"
                                        >
                                            <Star className="h-3 w-3" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => deleteImg(img)}
                                        title="Eliminar"
                                        className="rounded-full bg-white p-1.5 text-gray-700 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Zona de upload */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Agregar imágenes</p>
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => inputRef.current?.click()}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-5 transition-colors hover:border-gray-400 hover:bg-gray-100"
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                    {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    ) : (
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                        <p className="text-sm text-gray-600">
                            {uploading ? 'Subiendo...' : <><span className="font-semibold text-blue-600">Seleccionar archivos</span> o arrastrar aquí</>}
                        </p>
                        <p className="text-[11px] text-gray-400">JPG, PNG, WebP — máx. 10 MB por imagen</p>
                    </div>
                </div>
                {uploadError && <p className="mt-2 text-xs font-medium text-red-600">{uploadError}</p>}
                {imagenes.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> La imagen principal es requerida para publicar.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── ATRIBUTOS TAB ─────────────────────────────────────────────────────────────
const ATRIBUTOS_BY_TIPO = {
    celular: [
        { key: 'modelo',      label: 'Modelo' },
        { key: 'generacion',  label: 'Generación' },
        { key: 'capacidad',   label: 'Almacenamiento' },
        { key: 'color',       label: 'Color' },
        { key: 'bateria',     label: 'Salud batería (%)' },
        { key: 'sim',         label: 'SIM / eSIM' },
        { key: 'pantalla',    label: 'Pantalla' },
        { key: 'chip',        label: 'Chip' },
    ],
    computadora: [
        { key: 'familia',        label: 'Familia' },
        { key: 'modelo',         label: 'Modelo' },
        { key: 'chip',           label: 'Chip' },
        { key: 'cpu_cores',      label: 'CPU (núcleos)' },
        { key: 'gpu_cores',      label: 'GPU (núcleos)' },
        { key: 'ram',            label: 'RAM' },
        { key: 'almacenamiento', label: 'Almacenamiento' },
        { key: 'pantalla',       label: 'Pantalla' },
        { key: 'color',          label: 'Color' },
    ],
    producto_apple: [
        { key: 'modelo',    label: 'Modelo' },
        { key: 'capacidad', label: 'Capacidad' },
        { key: 'color',     label: 'Color' },
        { key: 'chip',      label: 'Chip' },
    ],
    producto_general: [
        { key: 'modelo_compatible', label: 'iPhone compatible' },
        { key: 'material',          label: 'Material' },
        { key: 'color',             label: 'Color' },
        { key: 'magsafe',           label: 'MagSafe' },
        { key: 'acabado',           label: 'Acabado' },
        { key: 'proteccion',        label: 'Protección' },
        { key: 'coleccion',         label: 'Colección MYSKIN' },
    ],
};

function AtributosTab({ tipo, value, onChange, inventario }) {
    const fields = ATRIBUTOS_BY_TIPO[tipo] ?? [];
    if (!fields.length) return <p className="text-sm text-gray-500">No hay atributos definidos para este tipo de producto.</p>;

    return (
        <div className="space-y-4">
            {inventario?.existe && (
                <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm border border-blue-100">
                    <p className="font-semibold text-blue-800 flex items-center gap-1.5">
                        <Info className="h-4 w-4" /> Datos del inventario
                    </p>
                    <p className="mt-0.5 text-blue-700 text-xs">Los valores del inventario se muestran como referencia. Completá los atributos públicos según lo que querés mostrar en la tienda.</p>
                </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(({ key, label }) => (
                    <Field key={key} label={label}>
                        <Input
                            type="text"
                            value={value?.[key] ?? ''}
                            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                            placeholder={`Ej: ${key === 'bateria' ? '87' : key === 'ram' ? '16 GB' : '...'}`}
                        />
                    </Field>
                ))}
            </div>
        </div>
    );
}

// ─── GENERAL TAB ───────────────────────────────────────────────────────────────
function GeneralTab({ data, setData, errors, condiciones, storefronts, inventario }) {
    const autoSlug = (titulo) => {
        const base = titulo
            .toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim().replace(/\s+/g, '-');
        setData((d) => ({ ...d, titulo, slug: d.slug && d.slug !== autoSlugFrom(d.titulo) ? d.slug : base }));
    };
    const autoSlugFrom = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

    return (
        <div className="space-y-8">
            {/* Identidad */}
            <section>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Identidad</h3>
                <div className="grid gap-4">
                    {inventario?.existe && (
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
                            Nombre interno: <span className="font-mono font-semibold text-gray-700">{inventario.nombre_interno ?? `${inventario.tipo} #${inventario.id}`}</span>
                        </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Título público" required error={errors.titulo}>
                            <Input
                                type="text"
                                value={data.titulo}
                                onChange={(e) => autoSlug(e.target.value)}
                                placeholder="iPhone 15 Pro Max 256 GB Titanio Natural"
                                error={errors.titulo}
                            />
                        </Field>
                        <Field label="Subtítulo" hint="Opcional — aparece debajo del título en PDP">
                            <Input
                                type="text"
                                value={data.subtitulo}
                                onChange={(e) => setData('subtitulo', e.target.value)}
                                placeholder="La cámara más avanzada de la línea"
                            />
                        </Field>
                    </div>
                    <Field label="Slug (URL)" required hint={`URL: /productos/${data.slug || 'slug-del-producto'}`} error={errors.slug}>
                        <Input
                            type="text"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                            className="font-mono"
                            error={errors.slug}
                        />
                    </Field>
                </div>
            </section>

            {/* Organización */}
            <section>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Organización</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Categoría" required error={errors.categoria}>
                        <Select
                            value={data.categoria}
                            onChange={(e) => setData('categoria', e.target.value)}
                            error={errors.categoria}
                        >
                            <option value="">— seleccionar —</option>
                            {CATEGORIAS.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Marca / Storefront" required error={errors.storefront}>
                        <Select
                            value={data.storefront}
                            onChange={(e) => setData('storefront', e.target.value)}
                            error={errors.storefront}
                        >
                            <option value="APPLE_BOSS">Apple Boss</option>
                            <option value="MYSKIN">MYSKIN</option>
                        </Select>
                        {data.storefront === 'MYSKIN' && data.categoria !== 'fundas' && (
                            <p className="mt-1 text-[11px] font-medium text-red-600">MYSKIN solo está permitido para la categoría Fundas.</p>
                        )}
                    </Field>
                    <Field label="Condición" required hint="El equipo la define. Nunca automática." error={errors.condicion}>
                        <Select
                            value={data.condicion}
                            onChange={(e) => setData('condicion', e.target.value)}
                            error={errors.condicion}
                        >
                            <option value="">— definir condición —</option>
                            {condiciones.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </Field>
                </div>
            </section>

            {/* Contenido */}
            <section>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Contenido</h3>
                <div className="grid gap-4">
                    <Field label="Resumen" required hint="Visible en tarjeta de catálogo. Máx. 1000 caracteres." error={errors.resumen}>
                        <Textarea
                            rows={2}
                            value={data.resumen}
                            onChange={(e) => setData('resumen', e.target.value)}
                            maxLength={1000}
                            placeholder="Descripción concisa para el catálogo y buscadores."
                            error={errors.resumen}
                        />
                        <p className="mt-1 text-right text-[11px] text-gray-400">{data.resumen.length}/1000</p>
                    </Field>
                    <Field label="Descripción completa" hint="Texto editorial extenso. Aparece en la solapa Descripción del PDP.">
                        <Textarea
                            rows={5}
                            value={data.descripcion}
                            onChange={(e) => setData('descripcion', e.target.value)}
                        />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Qué incluye" hint="Ej: Caja original, cable USB-C, documentación">
                            <Textarea
                                rows={2}
                                value={data.que_incluye}
                                onChange={(e) => setData('que_incluye', e.target.value)}
                            />
                        </Field>
                        <Field label="Observaciones públicas" hint="Detalles de estado, rayones, etc. Solo para seminuevos.">
                            <Textarea
                                rows={2}
                                value={data.observaciones}
                                onChange={(e) => setData('observaciones', e.target.value)}
                            />
                        </Field>
                    </div>
                    <Field label="Garantía" hint="Ej: 3 meses por el negocio">
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                value={data.garantia}
                                onChange={(e) => setData('garantia', e.target.value)}
                            />
                            <div className="relative">
                                <select
                                    onChange={(e) => e.target.value && setData('garantia', e.target.value)}
                                    value=""
                                    className="h-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600 focus:outline-none"
                                >
                                    <option value="">Sugeridas</option>
                                    {GARANTIA_SUGERIDAS.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                    </Field>
                </div>
            </section>
        </div>
    );
}

// ─── COMERCIAL TAB ─────────────────────────────────────────────────────────────
function ComercialTab({ data, setData, errors, inventario }) {
    const precioNormal = inventario?.precio_venta;
    const promoActiva = data.precio_promocional
        && (!data.promocion_desde || new Date(data.promocion_desde) <= new Date())
        && (!data.promocion_hasta || new Date(data.promocion_hasta) >= new Date());

    return (
        <div className="space-y-6">
            {/* Precio de inventario */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Precio de venta (inventario)</p>
                <p className="mt-1 text-2xl font-black text-gray-900">{money(precioNormal)}</p>
                <p className="mt-1 text-[11px] text-gray-400">Precio autoridad. No editable aquí — se gestiona desde el módulo de inventario.</p>
            </div>

            {/* Promoción */}
            <section>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Promoción</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Precio promocional" hint="Debe ser menor al precio de venta." error={errors.precio_promocional}>
                        <div className="flex items-center gap-2">
                            <span className="shrink-0 text-sm font-semibold text-gray-500">Bs</span>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.precio_promocional ?? ''}
                                onChange={(e) => setData('precio_promocional', e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="0.00"
                                error={errors.precio_promocional}
                            />
                        </div>
                        {data.precio_promocional && precioNormal && data.precio_promocional >= precioNormal && (
                            <p className="mt-1 text-[11px] font-medium text-red-600">El precio promocional debe ser menor a {money(precioNormal)}.</p>
                        )}
                    </Field>
                    <Field label="Badge" hint="Etiqueta visible en la tarjeta del catálogo.">
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                value={data.badge ?? ''}
                                onChange={(e) => setData('badge', e.target.value)}
                                placeholder="OFERTA"
                                maxLength={60}
                            />
                            <select
                                onChange={(e) => e.target.value && setData('badge', e.target.value)}
                                value=""
                                className="rounded-lg border border-gray-300 bg-gray-50 px-3 text-xs text-gray-600 focus:outline-none"
                            >
                                <option value="">Sugeridos</option>
                                {BADGES.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </Field>
                    <Field label="Promoción desde" hint="Opcional. Si vacío, aplica de inmediato." error={errors.promocion_desde}>
                        <Input
                            type="datetime-local"
                            value={data.promocion_desde ?? ''}
                            onChange={(e) => setData('promocion_desde', e.target.value || null)}
                            error={errors.promocion_desde}
                        />
                    </Field>
                    <Field label="Promoción hasta" hint="Opcional. Si vacío, aplica indefinidamente." error={errors.promocion_hasta}>
                        <Input
                            type="datetime-local"
                            value={data.promocion_hasta ?? ''}
                            onChange={(e) => setData('promocion_hasta', e.target.value || null)}
                            error={errors.promocion_hasta}
                        />
                    </Field>
                </div>

                {/* Preview de promoción */}
                {data.precio_promocional > 0 && (
                    <div className="mt-4 rounded-xl border border-gray-100 p-4 bg-white">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Vista previa de promoción</p>
                        <div className="flex items-baseline gap-3">
                            <span className="text-lg font-black" style={{ color: '#011446' }}>{money(data.precio_promocional)}</span>
                            <span className="text-sm text-gray-400 line-through">{money(precioNormal)}</span>
                        </div>
                        {(data.promocion_desde || data.promocion_hasta) && (
                            <p className="mt-1 text-xs text-gray-500">
                                {data.promocion_desde && `Desde ${new Date(data.promocion_desde).toLocaleDateString('es-BO')}`}
                                {data.promocion_desde && data.promocion_hasta && ' → '}
                                {data.promocion_hasta && `Hasta ${new Date(data.promocion_hasta).toLocaleDateString('es-BO')}`}
                            </p>
                        )}
                        <p className={`mt-1 text-xs font-semibold ${promoActiva ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {promoActiva ? '● Activa ahora' : '○ Inactiva (fuera de vigencia)'}
                        </p>
                    </div>
                )}
            </section>

            {/* Visibilidad */}
            <section>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Visibilidad</h3>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.destacado}
                            onChange={(e) => setData('destacado', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Destacado en Home</span>
                    </label>
                    <Field label="Orden (menor = primero)" hint="">
                        <Input
                            type="number"
                            min={0}
                            value={data.orden}
                            onChange={(e) => setData('orden', parseInt(e.target.value) || 0)}
                            className="w-24"
                        />
                    </Field>
                </div>
            </section>
        </div>
    );
}

// ─── INVENTARIO TAB ────────────────────────────────────────────────────────────
function InventarioTab({ inventario, publicacion }) {
    if (!inventario?.existe) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
                <p className="text-sm font-semibold text-red-700">Producto de inventario no encontrado</p>
                <p className="mt-1 text-xs text-red-500">El producto {publicacion.producto_tipo} #{publicacion.producto_id} no existe o fue eliminado.</p>
            </div>
        );
    }

    const rows = [
        { label: 'Tipo', value: inventario.tipo },
        { label: 'ID interno', value: `#${inventario.id}` },
        { label: 'Estado', value: inventario.estado },
        { label: 'Precio de venta', value: money(inventario.precio_venta) },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Datos del inventario</p>
                <dl className="grid gap-y-2 sm:grid-cols-2">
                    {rows.map(({ label, value }) => (
                        <div key={label} className="flex flex-col">
                            <dt className="text-[11px] text-gray-400">{label}</dt>
                            <dd className="text-sm font-semibold text-gray-800">{value}</dd>
                        </div>
                    ))}
                </dl>
                <p className="mt-3 text-[11px] text-gray-400">
                    El precio de venta, IMEI, serial y datos de procedencia son internos y nunca se exponen públicamente.
                </p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs text-blue-700">
                    Para modificar el estado o precio del inventario, usá el módulo de{' '}
                    <Link href={route('admin.celulares.index')} className="font-semibold underline">Inventario</Link>.
                </p>
            </div>
        </div>
    );
}

// ─── SEO TAB ───────────────────────────────────────────────────────────────────
function SeoTab({ data, setData, errors }) {
    const effectiveTitle = data.seo_title || data.titulo;
    const effectiveDesc  = data.seo_description || data.resumen;

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <Field
                    label="SEO Title"
                    hint={data.seo_title ? '' : 'Usando título público como fallback.'}
                    error={errors.seo_title}
                >
                    <Input
                        type="text"
                        value={data.seo_title}
                        onChange={(e) => setData('seo_title', e.target.value)}
                        maxLength={60}
                        placeholder={data.titulo || 'Dejar vacío para usar el título público'}
                        error={errors.seo_title}
                    />
                    <p className="mt-1 text-right text-[11px] text-gray-400">{(data.seo_title || '').length}/60</p>
                </Field>
                <Field
                    label="Meta description"
                    hint={data.seo_description ? '' : 'Usando resumen como fallback.'}
                    error={errors.seo_description}
                >
                    <Textarea
                        rows={2}
                        value={data.seo_description}
                        onChange={(e) => setData('seo_description', e.target.value)}
                        maxLength={160}
                        placeholder={data.resumen || 'Dejar vacío para usar el resumen'}
                        error={errors.seo_description}
                    />
                    <p className="mt-1 text-right text-[11px] text-gray-400">{(data.seo_description || '').length}/160</p>
                </Field>
            </div>

            {/* Google preview */}
            <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Vista previa — Google</p>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[13px] font-medium text-blue-700 truncate">{effectiveTitle} — Apple Boss Cochabamba</p>
                    <p className="text-[11px] text-green-700">appleboss.bo/productos/{data.slug || 'slug'}</p>
                    <p className="mt-1 text-[12px] text-gray-500 line-clamp-2">{effectiveDesc || 'Sin descripción aún.'}</p>
                </div>
            </div>
        </div>
    );
}

// ─── PUBLICACIÓN TAB ───────────────────────────────────────────────────────────
function PublicacionTab({ data, setData, errors, missing }) {
    return (
        <div className="space-y-6">
            {/* Readiness */}
            <div className={`rounded-xl p-4 ${missing.length === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                <p className={`font-semibold text-sm flex items-center gap-2 ${missing.length === 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {missing.length === 0 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {missing.length === 0 ? 'Todos los campos requeridos completos' : `Faltan ${missing.length} campo${missing.length !== 1 ? 's' : ''}`}
                </p>
                {missing.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-sm text-amber-700 list-disc list-inside">
                        {missing.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                )}
            </div>

            {/* Estado */}
            <section>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Estado</h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.publicado}
                            onChange={(e) => setData('publicado', e.target.checked)}
                            disabled={missing.length > 0 && !data.publicado}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 disabled:opacity-40"
                        />
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Publicar en la tienda</p>
                            <p className="text-[11px] text-gray-500">Visible para todos los visitantes.</p>
                        </div>
                    </label>
                    {missing.length > 0 && !data.publicado && (
                        <p className="text-[11px] text-amber-600 ml-8">Completá los campos faltantes para poder publicar.</p>
                    )}
                    {errors.publicado && <p className="text-xs text-red-600">{errors.publicado}</p>}
                </div>
            </section>

            {/* Programación */}
            <section>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Programación (opcional)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Publicar desde" error={errors.publicar_desde}>
                        <Input
                            type="datetime-local"
                            value={data.publicar_desde ?? ''}
                            onChange={(e) => setData('publicar_desde', e.target.value || null)}
                            error={errors.publicar_desde}
                        />
                    </Field>
                    <Field label="Publicar hasta" error={errors.publicar_hasta}>
                        <Input
                            type="datetime-local"
                            value={data.publicar_hasta ?? ''}
                            onChange={(e) => setData('publicar_hasta', e.target.value || null)}
                            error={errors.publicar_hasta}
                        />
                    </Field>
                </div>
            </section>
        </div>
    );
}

// ─── PREVIEW TAB ───────────────────────────────────────────────────────────────
function PreviewTab({ publicacion, data, inventario }) {
    const money2 = (v) => v != null ? `Bs ${Number(v).toLocaleString('es-BO')}` : '—';
    const price = data.precio_promocional || inventario?.precio_venta;
    const imgs = publicacion.imagenes ?? [];
    const main = imgs.find((i) => i.es_principal) ?? imgs[0];

    return (
        <div className="space-y-8">
            {/* Card preview */}
            <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Vista de tarjeta</p>
                <div className="w-48">
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="relative aspect-square bg-gray-50">
                            {main ? (
                                <img src={main.url_card ?? main.url_thumb} alt="" className="h-full w-full object-contain" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <ImageIcon className="h-10 w-10 text-gray-200" />
                                </div>
                            )}
                            {data.badge && (
                                <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: '#C6CB36', color: '#0D0D1A' }}>
                                    {data.badge}
                                </span>
                            )}
                        </div>
                        <div className="p-3">
                            <p className="text-xs font-bold truncate" style={{ color: '#011446' }}>{data.titulo || 'Sin título'}</p>
                            <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">{data.resumen || 'Sin resumen'}</p>
                            <p className="mt-2 text-sm font-black" style={{ color: '#011446' }}>{money2(price)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Link a preview público */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                    Para ver el PDP completo con datos guardados:{' '}
                    <a
                        href={`/productos/${data.slug || publicacion.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:underline"
                    >
                        /productos/{data.slug || publicacion.slug} →
                    </a>
                </p>
                {!publicacion.publicado && (
                    <p className="mt-1 text-[11px] text-amber-600">La publicación no está activa — el URL existe pero no aparece en el catálogo.</p>
                )}
            </div>
        </div>
    );
}

// ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function CatalogoEdit({
    publicacion,
    inventario,
    condiciones,
    storefronts,
    camposFaltantes,
    estadoPublicacion,
}) {
    const [activeTab, setActiveTab] = useState('GENERAL');
    const [dirty, setDirty] = useState(false);

    const { data, setData: _setData, patch, processing, errors } = useForm({
        storefront:          publicacion.storefront          ?? 'APPLE_BOSS',
        titulo:              publicacion.titulo               ?? '',
        subtitulo:           publicacion.subtitulo            ?? '',
        slug:                publicacion.slug                 ?? '',
        resumen:             publicacion.resumen              ?? '',
        descripcion:         publicacion.descripcion          ?? '',
        que_incluye:         publicacion.que_incluye          ?? '',
        observaciones:       publicacion.observaciones        ?? '',
        garantia:            publicacion.garantia             ?? '',
        condicion:           publicacion.condicion            ?? '',
        categoria:           publicacion.categoria            ?? '',
        subcategoria:        publicacion.subcategoria         ?? '',
        tags:                publicacion.tags                 ?? [],
        atributos:           publicacion.atributos            ?? {},
        seo_title:           publicacion.seo_title            ?? '',
        seo_description:     publicacion.seo_description      ?? '',
        publicado:           publicacion.publicado            ?? false,
        destacado:           publicacion.destacado            ?? false,
        publicar_desde:      publicacion.publicar_desde       ?? null,
        publicar_hasta:      publicacion.publicar_hasta       ?? null,
        orden:               publicacion.orden                ?? 0,
        precio_promocional:  publicacion.precio_promocional   ?? null,
        promocion_desde:     publicacion.promocion_desde      ?? null,
        promocion_hasta:     publicacion.promocion_hasta      ?? null,
        badge:               publicacion.badge                ?? '',
    });

    const setData = useCallback((...args) => {
        setDirty(true);
        if (typeof args[0] === 'function') {
            _setData(args[0]);
        } else {
            _setData(...args);
        }
    }, [_setData]);

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.catalogo.update', publicacion.id), {
            onSuccess: () => setDirty(false),
        });
    };

    // Warn on unsaved changes
    useEffect(() => {
        if (!dirty) return;
        const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const missing = camposFaltantes ?? [];

    return (
        <AdminLayout>
            <Head title={`Editor: ${publicacion.titulo}`} />

            <div className="flex h-full flex-col">
                {/* Header sticky */}
                <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
                    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href={route('admin.catalogo.index')}
                                className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-gray-900">{publicacion.titulo}</p>
                                <p className="text-[11px] text-gray-400">{publicacion.producto_tipo} #{publicacion.producto_id}</p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <ReadinessPill missing={missing} />
                            {publicacion.publicado && (
                                <a
                                    href={`/productos/${publicacion.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden items-center gap-1 text-xs text-blue-600 hover:underline sm:inline-flex"
                                >
                                    <Globe className="h-3.5 w-3.5" /> Ver en tienda
                                </a>
                            )}
                            {dirty && (
                                <span className="hidden text-[11px] text-amber-600 sm:block">● Cambios sin guardar</span>
                            )}
                            <button
                                type="button"
                                onClick={submit}
                                disabled={processing}
                                className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Guardar
                            </button>
                        </div>
                    </div>

                    {/* Tab nav */}
                    <div className="mx-auto max-w-5xl px-4 sm:px-6">
                        <TabNav active={activeTab} onChange={setActiveTab} errors={errors} />
                    </div>
                </div>

                {/* Contenido del tab */}
                <form onSubmit={submit} className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
                    <div className="min-h-[400px]">
                        {activeTab === 'GENERAL' && (
                            <GeneralTab
                                data={data}
                                setData={setData}
                                errors={errors}
                                condiciones={condiciones}
                                storefronts={storefronts}
                                inventario={inventario}
                            />
                        )}
                        {activeTab === 'MEDIA' && (
                            <MediaTab publicacion={publicacion} imagenes={publicacion.imagenes} />
                        )}
                        {activeTab === 'ATRIBUTOS' && (
                            <AtributosTab
                                tipo={publicacion.producto_tipo}
                                value={data.atributos}
                                onChange={(v) => setData('atributos', v)}
                                inventario={inventario}
                            />
                        )}
                        {activeTab === 'COMERCIAL' && (
                            <ComercialTab data={data} setData={setData} errors={errors} inventario={inventario} />
                        )}
                        {activeTab === 'INVENTARIO' && (
                            <InventarioTab inventario={inventario} publicacion={publicacion} />
                        )}
                        {activeTab === 'SEO' && (
                            <SeoTab data={data} setData={setData} errors={errors} />
                        )}
                        {activeTab === 'PUBLICACIÓN' && (
                            <PublicacionTab data={data} setData={setData} errors={errors} missing={missing} />
                        )}
                        {activeTab === 'PREVIEW' && (
                            <PreviewTab publicacion={publicacion} data={data} inventario={inventario} />
                        )}
                    </div>

                    {/* Footer de acciones */}
                    <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('¿Eliminar esta publicación? Las imágenes también serán eliminadas.')) {
                                    router.delete(route('admin.catalogo.destroy', publicacion.id));
                                }
                            }}
                            className="text-sm font-medium text-red-500 hover:text-red-700"
                        >
                            Eliminar publicación
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {processing ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
