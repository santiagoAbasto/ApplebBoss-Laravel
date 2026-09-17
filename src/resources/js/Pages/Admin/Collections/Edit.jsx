import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { ChevronDown, ChevronUp, ExternalLink, Globe, House, Layers, List, Lock, Plus, Search, Trash2, X } from 'lucide-react';
import { Badge, Field, Input, StepCard, Switch, Textarea, Toast, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { EncabezadoFormulario, ErroresResumen, ModalEliminar, Nota } from '@/Components/Admin/inventario';
import { CAT_LABELS, EstadoProducto, VistaPagina } from '@/Components/Admin/colecciones';

// Una colección: su nombre, qué productos van adentro y en qué orden, cómo aparece en Google y dónde se muestra.
// La dirección web no se cambia: los enlaces compartidos y los del menú apuntan ahí.

const mismosIds = (a, b) => a.length === b.length && a.every((p, i) => p.id === b[i].id);

function FilaElegida({ p, indice, total, onMover, onQuitar }) {
  return (
    <li className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
      <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-slate-400">{indice + 1}</span>
      <div className="flex shrink-0 flex-col">
        <button type="button" onClick={() => onMover(indice, indice - 1)} disabled={indice === 0} aria-label={`Subir ${p.titulo}`}
          className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => onMover(indice, indice + 1)} disabled={indice === total - 1} aria-label={`Bajar ${p.titulo}`}
          className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{p.titulo}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{CAT_LABELS[p.categoria] ?? p.categoria}</span>
          {p.condicion && <span>· {p.condicion}</span>}
          <EstadoProducto estado={p.estado} />
        </p>
      </div>
      <button type="button" onClick={() => onQuitar(p)} aria-label={`Quitar ${p.titulo} de la colección`}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

function Selector({ productos, candidatos, onGuardar, guardando }) {
  const [elegidos, setElegidos] = useState(productos);
  const [libres, setLibres] = useState(candidatos);
  const [busqueda, setBusqueda] = useState('');

  // Al volver de guardar, manda lo que diga la base
  useEffect(() => { setElegidos(productos); setLibres(candidatos); }, [productos, candidatos]);

  const sucio = !mismosIds(elegidos, productos);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return libres;
    return libres.filter((p) => p.titulo.toLowerCase().includes(q) || (CAT_LABELS[p.categoria] ?? '').toLowerCase().includes(q));
  }, [libres, busqueda]);

  const agregar = (p) => {
    setElegidos((lista) => [...lista, p]);
    setLibres((lista) => lista.filter((x) => x.id !== p.id));
  };

  const quitar = (p) => {
    setElegidos((lista) => lista.filter((x) => x.id !== p.id));
    setLibres((lista) => [p, ...lista]);
  };

  const mover = (origen, destino) => {
    if (destino < 0 || destino >= elegidos.length) return;
    const lista = [...elegidos];
    const [movido] = lista.splice(origen, 1);
    lista.splice(destino, 0, movido);
    setElegidos(lista);
  };

  const aLaVenta = elegidos.filter((p) => p.disponible).length;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-bold text-slate-700">
            En la colección <span className="text-slate-400">{elegidos.length}</span>
          </p>
          {elegidos.length > 0 && (
            <p className="text-xs text-slate-500">{aLaVenta} {aLaVenta === 1 ? 'se muestra' : 'se muestran'} en la tienda</p>
          )}
        </div>

        {elegidos.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[13px] text-slate-500">
            Todavía no elegiste ningún producto. Búscalo a la derecha y tócalo para agregarlo.
          </p>
        ) : (
          <ol className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
            {elegidos.map((p, i) => (
              <FilaElegida key={p.id} p={p} indice={i} total={elegidos.length} onMover={mover} onQuitar={quitar} />
            ))}
          </ol>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">{sucio ? 'Tienes cambios sin guardar.' : 'Todo guardado.'}</p>
          <button type="button" disabled={!sucio || guardando} onClick={() => onGuardar(elegidos.map((p) => p.id))}
            className={buttonCls('primary', 'h-10')}>
            {guardando ? 'Guardando…' : 'Guardar productos'}
          </button>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-bold text-slate-700">Agregar productos</p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca por nombre o categoría…"
            aria-label="Buscar un producto para agregar"
            className={`${inputCls} pl-9`}
          />
        </div>

        <ul className="mt-3 max-h-[26rem] space-y-1 overflow-y-auto pr-1">
          {filtrados.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[13px] text-slate-500">
              {busqueda ? 'Ningún producto publicado coincide con esa búsqueda.' : 'Ya agregaste todo lo que está publicado.'}
            </li>
          )}
          {filtrados.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => agregar(p)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50">
                <Plus className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{p.titulo}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{CAT_LABELS[p.categoria] ?? p.categoria}</span>
                    {!p.disponible && <EstadoProducto estado={p.estado} />}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Edit({ collection, productos = [], candidatos = [], donde = {}, google = {}, enVenta = 0 }) {
  const [toast] = useToast();
  const [guardando, setGuardando] = useState(false);
  const [borrar, setBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const { data, setData, patch, processing, errors, isDirty, setDefaults } = useForm({
    name:             collection.name             ?? '',
    description:      collection.description      ?? '',
    meta_title:       collection.meta_title       ?? '',
    meta_description: collection.meta_description ?? '',
    active:           collection.active           ?? true,
  });

  useEffect(() => {
    if (!isDirty) return undefined;
    const fn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [isDirty]);

  const tituloGoogle = `${data.name || collection.name}${google.sufijo ?? ''}`;
  const secciones = donde.inicio ?? [];
  const menus = donde.menus ?? [];

  const guardar = () => {
    if (processing) return;
    patch(route('admin.collections.update', collection.id), { preserveScroll: true, onSuccess: () => setDefaults() });
  };

  const guardarProductos = (ids) => {
    setGuardando(true);
    router.post(route('admin.collections.sync', collection.id), { ids },
      { preserveScroll: true, onFinish: () => setGuardando(false) });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.collections.destroy', collection.id), { onFinish: () => setBorrando(false) });
  };

  return (
    <AdminLayout>
      <Head title={`${collection.name} · Colecciones`} />
      <Toast toast={toast} />

      {borrar && (
        <ModalEliminar
          titulo="Borrar colección"
          icon={Layers}
          nombre={collection.name}
          advertencia="Las publicaciones no se borran: siguen en el catálogo y en su categoría. Se apagan la sección de la portada y los enlaces del menú que llevaban a esta colección. No se puede deshacer."
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(false)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EncabezadoFormulario
            volverUrl={route('admin.collections.index')}
            volverLabel="Volver a Colecciones"
            titulo={collection.name}
            subtitulo={`${productos.length} ${productos.length === 1 ? 'producto elegido' : 'productos elegidos'} · ${enVenta} a la venta`}
          />
          <a href={collection.url} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-10')}>
            <ExternalLink className="h-4 w-4" /> Ver en la tienda
          </a>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <StepCard step={1} title="Nombre y descripción" subtitle="El título y la línea que el cliente lee en la portada de la colección.">
              <div className="grid gap-4">
                <Field label="Nombre" error={errors.name} value={data.name} max={30}
                  hint="Corto: también es el título del carrusel en el inicio si no le pones otro.">
                  <Input value={data.name} maxLength={120} onChange={(e) => setData('name', e.target.value)} />
                </Field>
                <Field label="Descripción" error={errors.description} value={data.description} max={120}
                  hint="Una línea debajo del título, en su página.">
                  <Textarea rows={2} value={data.description} maxLength={500} onChange={(e) => setData('description', e.target.value)} />
                </Field>
                <Field label="Dirección web" hint="No se cambia: los enlaces que compartes y los del menú apuntan ahí. Si te equivocaste en el nombre, borra la colección y crea otra.">
                  <p className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{collection.url}</span>
                  </p>
                </Field>
              </div>
            </StepCard>

            <StepCard step={2} title="Qué productos van adentro"
              subtitle="Eliges uno por uno, de lo que ya está publicado, y el orden de la lista es el orden en que salen en la tienda.">
              <Selector productos={productos} candidatos={candidatos} onGuardar={guardarProductos} guardando={guardando} />
              <Nota>
                En la tienda solo se muestran los que siguen a la venta. Los vendidos o reservados quedan guardados acá —su ficha no se
                borra—, pero no se ven; quítalos cuando quieras.
              </Nota>
            </StepCard>

            <StepCard step={3} icon={Globe} title="Google" subtitle="Opcional: cómo aparece la página de la colección en Google y al compartirla por WhatsApp.">
              <div className="grid gap-4">
                <Field label="Título en Google" error={errors.meta_title} value={data.meta_title} max={60}>
                  <Input value={data.meta_title} maxLength={255} placeholder={tituloGoogle} onChange={(e) => setData('meta_title', e.target.value)} />
                </Field>
                <Field label="Descripción en Google" error={errors.meta_description} value={data.meta_description} max={160}>
                  <Textarea rows={2} value={data.meta_description} maxLength={500} placeholder={data.description}
                    onChange={(e) => setData('meta_description', e.target.value)} />
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

            <StepCard icon={List} title="Dónde se muestra" subtitle="Además de su página, una colección puede salir en el inicio y en los menús.">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#585E9F]"><House className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">En el inicio</p>
                    <p className="text-[13px] text-slate-500">
                      {secciones.length === 0
                        ? 'Ninguna sección de la portada la muestra. Enciende una «Colección de productos» y elígela ahí.'
                        : secciones.map((s) => `${s.titulo || s.label}${s.activa ? '' : ' (apagada)'}`).join(' · ')}
                    </p>
                  </div>
                  <Link href={route('admin.home-builder.index')} className={buttonCls('secondary', 'h-10')}>Ir a Portada</Link>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#585E9F]"><List className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">En los menús</p>
                    <p className="text-[13px] text-slate-500">
                      {menus.length === 0
                        ? 'Ningún menú lleva a esta colección. En «Menú» aparece como destino, junto a las páginas del sitio.'
                        : menus.map((m) => `${m.label} (${m.enlaces})`).join(' · ')}
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
                  <Layers className="h-[18px] w-[18px] text-[#585E9F]" /> En la tienda
                </h2>
                {data.active ? <Badge tone="emerald">Visible</Badge> : <Badge tone="slate">Oculta</Badge>}
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Mostrar la colección</p>
                    <p className="text-xs text-slate-500">
                      {data.active ? 'Su página abre y puede salir en el inicio.' : 'Su página no abre y no sale en el inicio.'}
                    </p>
                  </div>
                  <Switch checked={data.active} label="Mostrar la colección en la tienda" onChange={(v) => setData('active', v)} />
                </div>

                <ErroresResumen errores={errors} />
                {isDirty && <p className="text-center text-xs font-semibold text-amber-700">Tienes cambios sin guardar.</p>}
                <button type="button" onClick={guardar} disabled={processing || !isDirty} className={buttonCls('primary', 'h-12 w-full text-[15px]')}>
                  {processing ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <p className="text-center text-[11px] text-slate-400">Los productos se guardan con su propio botón.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve su página</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">El encabezado de {collection.url}</p>
              <VistaPagina nombre={data.name} descripcion={data.description} cantidad={enVenta} />
            </section>

            <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Borrar esta colección</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Se borra solo la vitrina. Las publicaciones no se tocan: siguen en el catálogo y en su categoría.
              </p>
              <button type="button" onClick={() => setBorrar(true)} className={buttonCls('danger', 'mt-3 h-10 w-full')}>
                <Trash2 className="h-4 w-4" /> Borrar colección
              </button>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
