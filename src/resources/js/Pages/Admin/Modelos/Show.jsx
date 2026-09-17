import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, ImagePlus, Trash2, Upload } from 'lucide-react';
import { Badge, Button, Modal, StepCard, Toast, bsFmt, buttonCls, fmtDate, useToast } from '@/Components/Admin/ui';
import { EncabezadoFormulario } from '@/Components/Admin/inventario';
import { CondicionBadge } from '@/Components/Admin/condicion';
import { EstadoPublicacionBadge } from '@/Components/Admin/catalogo';
import { EjemplosFoto, ListaRequisitos, PuntosRevision, analizarImagen, revisarFoto } from '@/Components/Admin/modelos';
import ModeloVisual from '@/Components/Store/ModeloVisual';
import { esencialesDe } from '@/Components/Store/comparativa';

// Pantalla de un modelo de referencia: subir o cambiar su foto (con revisión antes de guardar y vista previa de la
// comparativa), la guía de la foto, la ficha (solo lectura) y sus publicaciones.

const pesoTexto = (bytes) => {
  const kb = (Number(bytes) || 0) / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.round(kb)} KB`;
};

function Navegacion({ navegacion }) {
  const boton = (slug, children, label) => (slug
    ? <Link href={route('admin.modelos.show', slug)} aria-label={label} className={buttonCls('secondary', 'h-10 px-3')}>{children}</Link>
    : <span aria-hidden="true" className={buttonCls('secondary', 'pointer-events-none h-10 px-3 opacity-40')}>{children}</span>);

  return (
    <div className="flex items-center gap-2">
      {boton(navegacion.anterior, <><ChevronLeft className="h-4 w-4" /> Anterior</>, 'Modelo anterior')}
      {boton(navegacion.siguiente, <>Siguiente <ChevronRight className="h-4 w-4" /></>, 'Modelo siguiente')}
    </div>
  );
}

export default function Show({ modelo, publicaciones = [], navegacion, comparativa, requisitos }) {
  const [toast] = useToast();
  const { errors } = usePage().props;
  const [nueva, setNueva] = useState(null); // { archivo, url, puntos }
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [quitando, setQuitando] = useState(false);
  const input = useRef(null);

  // La vista previa local se libera al cambiar de foto o salir de la pantalla
  useEffect(() => () => { if (nueva?.url) URL.revokeObjectURL(nueva.url); }, [nueva]);

  const elegir = async (archivo) => {
    if (!archivo) return;
    const info = await analizarImagen(archivo);
    setNueva({ archivo, url: info.url, puntos: revisarFoto(archivo, info, { maxKb: requisitos.max_kb, minLado: requisitos.min_lado }) });
  };

  const bloqueada = Boolean(nueva?.puntos.some((p) => p.tono === 'error'));

  const guardar = () => {
    if (!nueva || bloqueada) return;
    router.post(route('admin.modelos.foto', modelo.slug), { foto: nueva.archivo }, {
      forceFormData: true,
      preserveScroll: true,
      onStart: () => { setSubiendo(true); setProgreso(0); },
      onProgress: (e) => setProgreso(Math.round(e?.percentage ?? 0)),
      onSuccess: () => setNueva(null),
      onFinish: () => setSubiendo(false),
    });
  };

  const quitar = () => router.delete(route('admin.modelos.foto.quitar', modelo.slug), {
    preserveScroll: true,
    onStart: () => setQuitando(true),
    onFinish: () => { setQuitando(false); setConfirmar(false); },
  });

  const soltar = (e) => {
    e.preventDefault();
    setArrastrando(false);
    elegir(e.dataTransfer.files?.[0]);
  };

  const vista = { nombre: modelo.nombre, visual: modelo.visual, imagen: nueva?.url ?? modelo.foto };
  const esenciales = useMemo(() => esencialesDe(modelo.tipo, modelo.familia), [modelo.tipo, modelo.familia]);
  const cargadas = navegacion.total - navegacion.sin_foto;
  const soloFaltaEste = !modelo.foto && navegacion.sin_foto === 1;
  const meta = modelo.foto_meta;

  return (
    <AdminLayout>
      <Head title={`${modelo.nombre} · Modelos y fotos`} />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EncabezadoFormulario volverUrl={route('admin.modelos.index')} volverLabel="Volver a Modelos y fotos"
            titulo={modelo.nombre} subtitulo={`${modelo.anio ? `${modelo.anio} · ` : ''}Modelo ${navegacion.posicion} de ${navegacion.total}`} />
          <Navegacion navegacion={navegacion} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <StepCard step={1} title="Foto del modelo" subtitle="La que se ve en la comparativa de la tienda. Una por modelo."
              actions={modelo.foto ? <Badge tone="emerald">Con foto</Badge> : <Badge tone="amber">Sin foto</Badge>}>
              <div className="grid gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
                <figure>
                  <ModeloVisual modelo={vista} tipo={modelo.tipo} className="aspect-[5/6] w-full rounded-2xl ring-1 ring-slate-200" />
                  <figcaption className="mt-2 text-center text-xs text-slate-500">
                    {nueva ? 'Foto nueva (sin guardar)' : modelo.foto ? 'Foto actual' : 'Hoy se ve esta ilustración'}
                  </figcaption>
                </figure>

                {nueva ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{nueva.archivo.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Revisión antes de guardar</p>
                    <div className="mt-3"><PuntosRevision puntos={nueva.puntos} /></div>
                    {errors.foto && <p className="mt-3 text-sm font-semibold text-rose-600" role="alert">{errors.foto}</p>}
                    {subiendo && (
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-[#585E9F] transition-[width]" style={{ width: `${progreso}%` }} />
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="primary" onClick={guardar} disabled={bloqueada || subiendo} className="h-11 px-5">
                        <Upload className="h-4 w-4" /> {subiendo ? `Subiendo… ${progreso} %` : 'Guardar foto'}
                      </Button>
                      <Button onClick={() => setNueva(null)} disabled={subiendo} className="h-11">Elegir otra</Button>
                    </div>
                    {bloqueada && <p className="mt-2 text-xs text-slate-500">Corrige lo marcado en rojo para poder guardarla.</p>}
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-col gap-3">
                    <label
                      onDragEnter={(e) => { e.preventDefault(); setArrastrando(true); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDragLeave={() => setArrastrando(false)}
                      onDrop={soltar}
                      className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors ${arrastrando ? 'border-[#585E9F] bg-[#585E9F]/[0.06]' : 'border-slate-200 bg-slate-50/60 hover:border-[#585E9F]/50'}`}
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#585E9F] shadow-sm"><ImagePlus className="h-6 w-6" /></span>
                      <span className="mt-3 text-sm font-bold text-slate-900">{modelo.foto ? 'Arrastra la foto nueva o elígela' : 'Arrastra la foto o elígela'}</span>
                      <span className="mt-1 text-xs text-slate-500">PNG sin fondo o JPG con fondo blanco · vertical 5:6 · hasta 10 MB</span>
                      <span className={buttonCls('primary', 'mt-4 h-10 px-4')}>Elegir foto</span>
                      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                        onChange={(e) => { elegir(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                    {errors.foto && <p className="text-sm font-semibold text-rose-600" role="alert">{errors.foto}</p>}
                    {modelo.foto && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
                        <p className="min-w-0 text-xs text-slate-500">
                          {meta?.width && meta?.height ? `${meta.width} × ${meta.height} px · ` : ''}
                          {meta?.extension ? `${String(meta.extension).toUpperCase()} · ` : ''}
                          {meta?.size ? `${pesoTexto(meta.size)} · ` : ''}
                          {modelo.foto_actualizada ? `subida el ${fmtDate(modelo.foto_actualizada)}` : ''}
                        </p>
                        <Button variant="danger" onClick={() => setConfirmar(true)} className="h-9 px-3 text-xs">
                          <Trash2 className="h-3.5 w-3.5" /> Quitar foto
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </StepCard>

            <StepCard step={2} title="Cómo tiene que ser la foto" subtitle="Así todas se ven parejas en la comparativa.">
              <EjemplosFoto modelo={modelo} />
              <div className="mt-5"><ListaRequisitos tipo={modelo.tipo} /></div>
            </StepCard>

            <StepCard step={3} title="Ficha del modelo" subtitle="Sale de la ficha oficial de la marca. No se edita acá.">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {esenciales.map((e) => (
                  <div key={e.key} className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{e.campo.label}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-900">{modelo.specs[e.key] || (e.vacio ?? '—')}</dd>
                  </div>
                ))}
                <div className="min-w-0">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Colores</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">{(modelo.specs.colores_disponibles ?? []).join(', ') || '—'}</dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Cómo se reconoce en el inventario</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[modelo.nombre, ...(modelo.alias ?? [])].map((a) => <Badge key={a} tone="slate">{a}</Badge>)}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {modelo.tipo === 'producto_general'
                    ? 'Son ejemplos: se reconoce cualquier accesorio del inventario con un nombre parecido, y al publicarlo su ficha y su descripción se llenan solas.'
                    : 'Al publicar un equipo del inventario con uno de estos nombres, su ficha técnica se llena sola.'}
                </p>
              </div>
            </StepCard>

            <StepCard step={4} title="En la tienda" subtitle="Publicaciones que usan este modelo.">
              {publicaciones.length === 0 ? (
                <p className="text-sm text-slate-500">Ningún equipo publicado usa este modelo todavía.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {publicaciones.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <Link href={p.editar} className="block truncate text-sm font-semibold text-slate-900 hover:text-[#585E9F]">{p.titulo}</Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <EstadoPublicacionBadge estado={p.estado} />
                          <CondicionBadge condicion={p.condicion} />
                          {!p.disponible && <Badge tone="rose">Sin stock</Badge>}
                        </div>
                      </div>
                      <p className="text-sm font-bold tabular-nums text-slate-900">{p.precio ? bsFmt(p.precio) : '—'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </StepCard>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Así se ve en la comparativa</p>
              <div className="mt-3 rounded-2xl bg-[#F5F6FA] p-4">
                <div className="flex items-center justify-between rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900">
                  <span className="truncate">{modelo.nombre}</span> <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </div>
                <ModeloVisual modelo={vista} tipo={modelo.tipo} className="mt-3 aspect-[5/6] w-full rounded-2xl" />
                <p className="mt-3 text-[11px] font-bold text-[#585E9F]">{modelo.anio}</p>
                <p className="text-base font-black leading-tight text-[#0D0D1A]">{modelo.nombre}</p>
              </div>
              {comparativa && (
                <a href={comparativa} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'mt-3 h-10 w-full')}>
                  <ExternalLink className="h-4 w-4" /> Ver en la comparativa
                </a>
              )}
            </section>

            <div className="rounded-2xl bg-[#011446] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Fotos cargadas</p>
              <p className="mt-1 text-[28px] font-extrabold leading-none tabular-nums">
                {cargadas} <span className="text-base font-semibold text-white/60">de {navegacion.total}</span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-[#C6CB36]" style={{ width: `${navegacion.total ? (cargadas / navegacion.total) * 100 : 0}%` }} />
              </div>
              {navegacion.siguiente_sin_foto ? (
                <Link href={route('admin.modelos.show', navegacion.siguiente_sin_foto.slug)}
                  className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3.5 py-3 text-sm font-semibold transition-colors hover:bg-white/15">
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-white/60">Siguiente sin foto</span>
                    <span className="block truncate">{navegacion.siguiente_sin_foto.nombre}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              ) : (
                <p className="mt-4 text-sm text-white/80">{soloFaltaEste ? 'Solo falta la foto de este modelo.' : 'Todos los modelos tienen foto.'}</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {confirmar && (
        <Modal title="¿Quitar la foto?" onClose={() => setConfirmar(false)}
          footer={(
            <>
              <Button onClick={() => setConfirmar(false)} disabled={quitando}>Cancelar</Button>
              <Button variant="danger" onClick={quitar} disabled={quitando}>{quitando ? 'Quitando…' : 'Quitar foto'}</Button>
            </>
          )}>
          <p className="text-sm text-slate-600">
            La comparativa volverá a mostrar la ilustración del {modelo.nombre}. Puedes subir otra foto cuando quieras.
          </p>
        </Modal>
      )}
    </AdminLayout>
  );
}
