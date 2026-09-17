import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { ExternalLink, FileText, Globe, List, Lock, PanelBottom, Trash2 } from 'lucide-react';
import { Badge, Field, Input, StepCard, Switch, Textarea, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { EncabezadoFormulario, ErroresResumen, ModalEliminar, Nota } from '@/Components/Admin/inventario';
import SimpleEditor from '@/Components/Admin/SimpleEditor';
import { VistaPagina } from '@/Components/Admin/paginas';

// Una página de la tienda: su título, su texto, cómo aparece en Google y dónde figura.
// La dirección no se cambia: es el enlace que se comparte y el que usan los menús.

const soloTexto = (html) => (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function Edit({ page, donde = {}, google = {} }) {
  const [toast] = useToast();
  const [borrar, setBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const { data, setData, patch, processing, errors, isDirty, setDefaults } = useForm({
    title:            page.title            ?? '',
    content:          page.content          ?? '',
    meta_title:       page.meta_title       ?? '',
    meta_description: page.meta_description ?? '',
    active:           page.active           ?? false,
  });

  useEffect(() => {
    if (!isDirty) return undefined;
    const fn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [isDirty]);

  const texto = soloTexto(data.content);
  const tituloGoogle = `${data.title || page.title}${google.sufijo ?? ''}`;
  const menus = donde.menus ?? [];

  const guardar = () => {
    if (processing) return;
    patch(route('admin.pages.update', page.id), { preserveScroll: true, onSuccess: () => setDefaults() });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.pages.destroy', page.id), { onFinish: () => setBorrando(false) });
  };

  return (
    <AdminLayout>
      <Head title={`${page.title} · Páginas`} />
      <Toast toast={toast} />

      {borrar && (
        <ModalEliminar
          titulo="Borrar página"
          icon={FileText}
          nombre={page.title}
          detalle={page.url}
          advertencia="Se borra su texto y la dirección deja de abrir. Los enlaces del menú que llevaban a ella se ocultan. No se puede deshacer: si solo quieres sacarla por un tiempo, usa el interruptor."
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(false)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EncabezadoFormulario
            volverUrl={route('admin.pages.index')}
            volverLabel="Volver a Páginas"
            titulo={page.title}
            subtitulo={texto ? `${texto.length.toLocaleString('es-BO')} letras de texto` : 'Todavía sin texto'}
          />
          <a href={page.url} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-10')}>
            <ExternalLink className="h-4 w-4" /> Ver en la tienda
          </a>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <StepCard step={1} title="Título y dirección" subtitle="El título se ve arriba de la página y en la lista del pie.">
              <div className="grid gap-4">
                <Field label="Título" error={errors.title} value={data.title} max={40}>
                  <Input value={data.title} maxLength={255} onChange={(e) => setData('title', e.target.value)} />
                </Field>
                <Field label="Dirección web" hint="No se cambia: es el enlace que compartes y el que usan los menús.">
                  <p className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{page.url}</span>
                  </p>
                </Field>
              </div>
            </StepCard>

            <StepCard step={2} title="Texto de la página" subtitle="Escribe como en un documento. Con los botones de arriba pones títulos, negrita, listas y enlaces.">
              <SimpleEditor value={data.content} onChange={(v) => setData('content', v)}
                placeholder="Escribe acá lo que quieres contarle al cliente…" />
              {errors.content && <p className="mt-2 text-xs font-semibold text-red-600">{errors.content}</p>}
              <Nota>
                Al pegar desde Word o desde otra página, el texto entra sin formatos raros. Solo se guardan títulos, negrita, cursiva,
                listas y enlaces.
              </Nota>
            </StepCard>

            <StepCard step={3} icon={Globe} title="Google" subtitle="Opcional: cómo aparece esta página en Google y al compartirla por WhatsApp.">
              <div className="grid gap-4">
                <Field label="Título en Google" error={errors.meta_title} value={data.meta_title} max={60}>
                  <Input value={data.meta_title} maxLength={255} placeholder={tituloGoogle} onChange={(e) => setData('meta_title', e.target.value)} />
                </Field>
                <Field label="Descripción en Google" error={errors.meta_description} value={data.meta_description} max={160}>
                  <Textarea rows={2} value={data.meta_description} maxLength={500}
                    onChange={(e) => setData('meta_description', e.target.value)} />
                </Field>
                <div className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Así se vería en Google</p>
                  <p className="mt-1.5 truncate text-[15px] text-[#1a0dab]">{data.meta_title || tituloGoogle}</p>
                  <p className="truncate text-xs text-emerald-700">{google.url}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-slate-600">
                    {data.meta_description || texto || 'Sin descripción: Google elegirá un texto de la página.'}
                  </p>
                </div>
              </div>
            </StepCard>

            <StepCard icon={List} title="Dónde figura" subtitle="Las páginas encendidas salen solas en el pie; los menús se arman aparte.">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#585E9F]"><PanelBottom className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">En el pie de página</p>
                    <p className="text-[13px] text-slate-500">
                      {!data.active
                        ? 'Está oculta: no aparece en el pie.'
                        : donde.en_informacion
                          ? 'Sale sola en la columna «Información», en el orden del listado.'
                          : 'Tiene su propio enlace en el pie, así que no se lista en «Información».'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#585E9F]"><List className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">En los menús</p>
                    <p className="text-[13px] text-slate-500">
                      {menus.length === 0
                        ? 'Ningún menú lleva a esta página. En «Menú» aparece como destino, junto a las demás páginas del sitio.'
                        : menus.map((m) => m.label).join(' · ')}
                    </p>
                  </div>
                  <Link href={route('admin.menus.index')} className={buttonCls('secondary', 'h-10')}>Ir a Menú</Link>
                </div>
              </div>
            </StepCard>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <FileText className="h-[18px] w-[18px] text-[#585E9F]" /> En la tienda
                </h2>
                {data.active ? <Badge tone="emerald">Se ve</Badge> : <Badge tone="slate">Oculta</Badge>}
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Página visible</p>
                    <p className="text-xs text-slate-500">
                      {data.active ? 'Cualquiera puede abrirla.' : 'Quien entre verá «página no encontrada».'}
                    </p>
                  </div>
                  <Switch checked={data.active} label="Mostrar la página en la tienda" onChange={(v) => setData('active', v)} />
                </div>

                {data.active && !texto && (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800">
                    Está encendida y no tiene texto: quien entre verá la página vacía.
                  </p>
                )}

                <ErroresResumen errores={errors} />
                {isDirty && <p className="text-center text-xs font-semibold text-amber-700">Tienes cambios sin guardar.</p>}
                <button type="button" onClick={guardar} disabled={processing || !isDirty} className={buttonCls('primary', 'h-12 w-full text-[15px]')}>
                  {processing ? 'Guardando…' : 'Guardar página'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">El encabezado de {page.url}</p>
              <VistaPagina titulo={data.title} texto={texto} />
            </section>

            <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Borrar esta página</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Se borra su texto y su dirección deja de abrir. Para sacarla un tiempo, mejor usa el interruptor.
              </p>
              <button type="button" onClick={() => setBorrar(true)} className={buttonCls('danger', 'mt-3 h-10 w-full')}>
                <Trash2 className="h-4 w-4" /> Borrar página
              </button>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
