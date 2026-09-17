import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { route } from 'ziggy-js';
import { ExternalLink, Globe, List, Lock, Package, Store } from 'lucide-react';
import { Badge, Field, Input, StepCard, Switch, Textarea, Toast, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { EncabezadoFormulario, ErroresResumen, Nota } from '@/Components/Admin/inventario';
import LinkPicker from '@/Components/Admin/LinkPicker';
import TarjetaCategoria from '@/Components/Store/TarjetaCategoria';
import { OtrosLugares, TablaTipos, estadoInicio } from '@/Components/Admin/categorias';

// Una categoría de la tienda: su nombre y descripción, la portada de su página en el catálogo, cómo aparece en Google
// y qué productos le llegan. La dirección web no se cambia: los productos publicados se agrupan con ella.

export default function Edit({ category, categorias = [], google = {}, bloqueInicio = false }) {
  const [toast] = useToast();
  const { data, setData, patch, processing, errors, isDirty, setDefaults } = useForm({
    name:             category.name             ?? '',
    description:      category.description      ?? '',
    active:           category.active           ?? true,
    show_home:        category.show_home        ?? false,
    meta_title:       category.meta_title       ?? '',
    meta_description: category.meta_description ?? '',
    hero_titulo:      category.hero_titulo      ?? '',
    hero_descripcion: category.hero_descripcion ?? '',
    hero_cta_label:   category.hero_cta_label   ?? '',
    hero_cta_url:     category.hero_cta_url     ?? '',
  });

  useEffect(() => {
    if (!isDirty) return undefined;
    const fn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [isDirty]);

  const detalle = categorias.find((c) => c.id === category.id) ?? {};
  const posicion = categorias.findIndex((c) => c.id === category.id) + 1;
  const enTienda = detalle.en_tienda ?? 0;
  const tiposConStock = (detalle.tipos ?? []).filter((t) => t.en_tienda > 0);
  const tituloGoogle = `${data.name || category.name}${google.sufijo ?? ''}`;

  // La vista previa muestra la categoría como queda al guardar
  const previa = useMemo(
    () => categorias.map((c) => (c.id === category.id
      ? { ...c, name: data.name || c.name, description: data.description, active: data.active, show_home: data.show_home }
      : c)),
    [categorias, category.id, data.name, data.description, data.active, data.show_home],
  );

  const motivoFuera = !data.active
    ? 'Está oculta: no se ve en el catálogo ni en el inicio.'
    : !data.show_home ? 'No está marcada para el inicio.'
      : enTienda === 0 ? 'Todavía no tiene productos en la tienda.'
        : estadoInicio(previa, bloqueInicio).motivo;

  const guardar = () => {
    if (processing) return;
    patch(route('admin.categories.update', category.id), { preserveScroll: true, onSuccess: () => setDefaults() });
  };

  return (
    <AdminLayout>
      <Head title={`${category.name} · Categorías`} />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EncabezadoFormulario
            volverUrl={route('admin.categories.index')}
            volverLabel="Volver a Categorías"
            titulo={category.name}
            subtitulo={`Categoría ${posicion} de ${categorias.length} · ${enTienda.toLocaleString('es-BO')} ${enTienda === 1 ? 'producto' : 'productos'} en la tienda`}
          />
          <a href={detalle.url ?? '/catalogo'} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-10')}>
            <ExternalLink className="h-4 w-4" /> Ver en la tienda
          </a>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <StepCard step={1} title="Nombre y descripción" subtitle="Lo que lee el cliente en el inicio, en el filtro del catálogo y en la portada de la categoría.">
              <div className="grid gap-4">
                <Field label="Nombre" error={errors.name} value={data.name} max={24}
                  hint="Corto: se ve en los accesos del inicio y en el filtro del catálogo.">
                  <Input value={data.name} maxLength={100} onChange={(e) => setData('name', e.target.value)} />
                </Field>
                <Field label="Descripción corta" error={errors.description} value={data.description} max={60}
                  hint="Una línea. Va debajo del nombre en el acceso del inicio.">
                  <Textarea rows={2} value={data.description} maxLength={500} onChange={(e) => setData('description', e.target.value)} />
                </Field>
                <Field label="Dirección web" hint="No se cambia: los productos de la tienda se agrupan con ella.">
                  <p className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{detalle.url ?? `/catalogo?categoria=${category.slug}`}</span>
                  </p>
                </Field>
              </div>
            </StepCard>

            <StepCard step={2} title="Portada de la categoría" subtitle="El encabezado de su página en el catálogo. Si lo dejas vacío, se usan el nombre y la descripción.">
              <div className="grid gap-4">
                <Field label="Título de la portada" error={errors.hero_titulo} value={data.hero_titulo} max={60}>
                  <Input value={data.hero_titulo} maxLength={255} placeholder={data.name} onChange={(e) => setData('hero_titulo', e.target.value)} />
                </Field>
                <Field label="Texto de la portada" error={errors.hero_descripcion} value={data.hero_descripcion} max={160}>
                  <Textarea rows={2} value={data.hero_descripcion} maxLength={500} placeholder={data.description} onChange={(e) => setData('hero_descripcion', e.target.value)} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Botón: texto" error={errors.hero_cta_label} value={data.hero_cta_label} max={30} hint="Déjalo vacío si no quieres botón.">
                    <Input value={data.hero_cta_label} maxLength={60} placeholder="Ej.: Ver los cargadores" onChange={(e) => setData('hero_cta_label', e.target.value)} />
                  </Field>
                  <Field label="Botón: a dónde lleva" error={errors.hero_cta_url}>
                    <LinkPicker value={data.hero_cta_url} onChange={(v) => setData('hero_cta_url', v)} className={`${inputCls} h-11`} allowEmpty emptyLabel="Sin botón" />
                  </Field>
                </div>
              </div>
            </StepCard>

            <StepCard step={3} icon={Globe} title="Google" subtitle="Opcional: cómo aparece la página de la categoría en Google y al compartirla por WhatsApp.">
              <div className="grid gap-4">
                <Field label="Título en Google" error={errors.meta_title} value={data.meta_title} max={60}>
                  <Input value={data.meta_title} maxLength={255} placeholder={tituloGoogle} onChange={(e) => setData('meta_title', e.target.value)} />
                </Field>
                <Field label="Descripción en Google" error={errors.meta_description} value={data.meta_description} max={160}>
                  <Textarea rows={2} value={data.meta_description} maxLength={500} placeholder={data.description} onChange={(e) => setData('meta_description', e.target.value)} />
                </Field>
                <div className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Así se vería en Google</p>
                  <p className="mt-1.5 truncate text-[15px] text-[#1a0dab]">{data.meta_title || tituloGoogle}</p>
                  <p className="truncate text-xs text-emerald-700">{google.url}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-slate-600">
                    {data.meta_description || data.description || 'Sin descripción: Google elegirá un texto de la página.'}
                  </p>
                </div>
              </div>
            </StepCard>

            <StepCard icon={Package} title={category.is_myskin ? 'Qué va en Fundas MYSKIN' : `Qué va en ${category.name}`}
              subtitle="Al publicar un producto, su categoría sale del inventario del que viene: no se elige acá.">
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#585E9F]"><Store className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {detalle.inventario ? `Sale de «${detalle.inventario.nombre}»` : 'No sale de ningún inventario'}
                  </p>
                  <p className="text-[13px] text-slate-500">
                    {category.is_myskin
                      ? 'Solo las fundas que marcas como MYSKIN al publicarlas. Las demás fundas van a Accesorios.'
                      : `${enTienda.toLocaleString('es-BO')} en la tienda${detalle.por_publicar ? ` · ${detalle.por_publicar.toLocaleString('es-BO')} por publicar` : ''}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={route('admin.catalogo.index', { categoria: category.slug })} className={buttonCls('secondary', 'h-10')}>
                    Ver sus productos
                  </Link>
                  {detalle.inventario && (
                    <Link href={route('admin.catalogo.importar', { grupo: detalle.inventario.tipo })} className={buttonCls('primary', 'h-10')}>
                      Publicar desde el inventario
                    </Link>
                  )}
                </div>
              </div>

              {detalle.tipos?.length > 0 && (
                <div className="mt-5">
                  <TablaTipos tipos={detalle.tipos} />
                  <Nota>
                    El tipo sale de la ficha que se reconoce por el nombre del accesorio, en «Modelos y fotos». Los que no tienen ficha salen
                    con su nombre, dentro de «Otros accesorios». En la tienda, estos tipos son los filtros de la portada.
                  </Nota>
                </div>
              )}
            </StepCard>

            <StepCard icon={List} title="Dónde más figura" subtitle="Los menús y los carruseles del inicio se arman en sus propias secciones.">
              <OtrosLugares categoria={detalle} />
            </StepCard>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Store className="h-[18px] w-[18px] text-[#585E9F]" /> En la tienda
                </h2>
                {data.active ? <Badge tone="emerald">Visible</Badge> : <Badge tone="slate">Oculta</Badge>}
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-[13px] font-semibold text-slate-500">Su acceso en el inicio</p>
                  <div className="mt-2">
                    <TarjetaCategoria vistaPrevia cat={{ slug: category.slug, name: data.name || category.name, description: data.description, count: enTienda }} />
                  </div>
                  {motivoFuera && <p className="mt-2 text-xs text-slate-500">{motivoFuera}</p>}
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">En el catálogo</p>
                      <p className="text-xs text-slate-500">
                        {data.active ? 'Aparece en el filtro «Categoría».' : 'Oculta. Sus productos siguen a la venta en «Todo el catálogo».'}
                      </p>
                    </div>
                    <Switch checked={data.active} label="Mostrar en el catálogo" onChange={(v) => setData('active', v)} />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className={`text-sm font-semibold ${data.active ? 'text-slate-800' : 'text-slate-400'}`}>En el inicio</p>
                      <p className="text-xs text-slate-500">Su acceso en «¿Qué estás buscando?».</p>
                    </div>
                    <Switch checked={data.show_home} disabled={!data.active} label="Mostrar en el inicio" onChange={(v) => setData('show_home', v)} />
                  </div>
                </div>

                <ErroresResumen errores={errors} />
                {isDirty && <p className="text-center text-xs font-semibold text-amber-700">Tienes cambios sin guardar.</p>}
                <button type="button" onClick={guardar} disabled={processing || !isDirty} className={buttonCls('primary', 'h-12 w-full text-[15px]')}>
                  {processing ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve su portada</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">El encabezado de su página en el catálogo.</p>
              <div className="mt-4 rounded-2xl bg-[#F5F6FA] p-4">
                <p className="text-2xl font-black leading-tight tracking-tight text-[#0D0D1A]">{data.hero_titulo || data.name || category.name}</p>
                <p className="mt-1.5 text-[13px] text-slate-600">
                  {data.hero_descripcion || data.description || 'Precios actualizados desde nuestro inventario real.'}
                </p>
                {data.hero_cta_label && data.hero_cta_url && (
                  <span className="mt-3 inline-flex h-9 items-center rounded-full bg-[#011446] px-4 text-xs font-bold text-white">{data.hero_cta_label}</span>
                )}
                {tiposConStock.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#011446] px-3 py-1 text-[11px] font-bold text-white">Todos</span>
                    {tiposConStock.map((t) => (
                      <span key={t.key} className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                        {t.label} <span className="tabular-nums text-slate-400">{t.en_tienda}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
