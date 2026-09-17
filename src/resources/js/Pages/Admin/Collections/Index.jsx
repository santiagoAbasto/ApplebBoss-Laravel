import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, House, Layers, List, Plus, Package, Pencil, ShoppingBag } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { Badge, EmptyState, Field, Input, Modal, PageHeader, Switch, Textarea, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { Aviso, Stat } from '@/Components/Admin/inventario';
import { DondeSeVe, VistaPortada, motivoOculta } from '@/Components/Admin/colecciones';

// Tienda online → Colecciones: las vitrinas que se arman a mano.
// A diferencia de una categoría, que se llena sola con el inventario del que sale cada producto, acá eliges tú qué
// publicaciones entran, en qué orden, y dónde se muestra la vitrina: su página, el inicio y los menús.

function Fila({ c, indice, total, onMover, onVisibilidad, arrastre }) {
  const motivo = motivoOculta(c);

  return (
    <li
      draggable
      onDragStart={() => arrastre.iniciar(indice)}
      onDragEnter={() => arrastre.sobre(indice)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={arrastre.soltar}
      className={`flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center ${c.active ? '' : 'bg-slate-50/60'}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex shrink-0 flex-col items-center">
          <button type="button" onClick={() => onMover(indice, indice - 1)} disabled={indice === 0} aria-label={`Subir ${c.name}`}
            className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronUp className="h-4 w-4" />
          </button>
          <GripVertical className="h-4 w-4 cursor-grab text-slate-300 active:cursor-grabbing" aria-hidden="true" />
          <button type="button" onClick={() => onMover(indice, indice + 1)} disabled={indice === total - 1} aria-label={`Bajar ${c.name}`}
            className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#585E9F]">
          <Layers className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-slate-900">
            {c.name}
            {!c.active && <Badge tone="slate">Oculta</Badge>}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-500">{c.description || 'Sin descripción'}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{c.en_venta} a la venta</span>
            {c.vendidos > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{c.vendidos} {c.vendidos === 1 ? 'ya no está' : 'ya no están'} disponible{c.vendidos === 1 ? '' : 's'}</span>
              </>
            )}
          </p>
          <DondeSeVe donde={c.donde} url={c.url} />
          {motivo && <p className="mt-1.5 text-xs font-semibold text-amber-700">{motivo}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 lg:shrink-0 lg:pl-4">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
          <Switch checked={c.active} label={`Mostrar «${c.name}» en la tienda`} onChange={(v) => onVisibilidad(c, v)} />
          Visible
        </label>
        <a href={c.url} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <ExternalLink className="h-3.5 w-3.5" /> Ver
        </a>
        <Link href={route('admin.collections.edit', c.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Link>
      </div>
    </li>
  );
}

function ModalNueva({ onCerrar }) {
  const { data, setData, post, processing, errors, reset } = useForm({ name: '', description: '' });

  const crear = () => {
    if (processing) return;
    post(route('admin.collections.store'), { onSuccess: () => { reset(); onCerrar(); } });
  };

  return (
    <Modal
      title="Nueva colección"
      onClose={onCerrar}
      footer={(
        <>
          <button type="button" onClick={onCerrar} className={buttonCls('secondary', 'h-11')}>Cancelar</button>
          <button type="button" onClick={crear} disabled={processing || !data.name.trim()} className={buttonCls('primary', 'h-11')}>
            {processing ? 'Creando…' : 'Crear y elegir productos'}
          </button>
        </>
      )}
    >
      <div className="grid gap-4">
        <Field label="Nombre" error={errors.name} value={data.name} max={30} hint="Es el título que ven tus clientes. Con él se arma la dirección web, que después no cambia.">
          <Input value={data.name} maxLength={120} placeholder="Ej.: Ofertas de la semana" autoFocus
            onChange={(e) => setData('name', e.target.value)} />
        </Field>
        <Field label="Descripción" error={errors.description} value={data.description} max={120} hint="Opcional. Una línea debajo del título, en su página.">
          <Textarea rows={2} value={data.description} maxLength={500} onChange={(e) => setData('description', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

export default function Index({ colecciones = [], resumen = {}, sinColeccion = [] }) {
  const [toast] = useToast();
  const [items, setItems] = useState(colecciones);
  const [nueva, setNueva] = useState(false);
  const desde = useRef(null);
  const hasta = useRef(null);

  // Lo que diga la base manda: al volver de guardar el orden o la visibilidad, se sincroniza
  useEffect(() => setItems(colecciones), [colecciones]);

  const mover = (origen, destino) => {
    if (destino < 0 || destino >= items.length || origen === destino) return;
    const lista = [...items];
    const [movida] = lista.splice(origen, 1);
    lista.splice(destino, 0, movida);
    setItems(lista);
    router.post(route('admin.collections.reorder'), { orden: lista.map((c, i) => ({ id: c.id, orden: i + 1 })) },
      { preserveScroll: true, preserveState: true });
  };

  const arrastre = {
    iniciar: (i) => { desde.current = i; },
    sobre: (i) => { hasta.current = i; },
    soltar: () => {
      const origen = desde.current;
      const destino = hasta.current;
      desde.current = null;
      hasta.current = null;
      if (origen !== null && destino !== null) mover(origen, destino);
    },
  };

  const cambiarVisibilidad = (col, valor) => {
    setItems((lista) => lista.map((c) => (c.id === col.id ? { ...c, active: valor } : c)));
    router.patch(route('admin.collections.visibilidad', col.id), { active: valor }, { preserveScroll: true, preserveState: true });
  };

  const visibles = items.filter((c) => c.active).length;
  const enInicio = items.filter((c) => (c.donde?.inicio ?? []).some((s) => s.activa)).length;
  const agotadas = items.filter((c) => c.active && c.total > 0 && c.en_venta === 0);
  const sinDestino = items.filter((c) => c.active && c.en_venta > 0
    && (c.donde?.inicio ?? []).length === 0 && (c.donde?.menus ?? []).length === 0);

  return (
    <AdminLayout>
      <Head title="Colecciones" />
      <Toast toast={toast} />
      {nueva && <ModalNueva onCerrar={() => setNueva(false)} />}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Colecciones"
          subtitle="Vitrinas que armas a mano para una campaña: tú eliges qué productos entran y en qué orden. Cada colección tiene su propia página y puede salir en el inicio y en los menús."
          actions={(
            <button type="button" onClick={() => setNueva(true)} className={buttonCls('primary', 'h-11 px-4')}>
              <Plus className="h-4 w-4" /> Nueva colección
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Layers} label="Colecciones" value={items.length} hint={`${visibles} ${visibles === 1 ? 'visible' : 'visibles'} en la tienda`} />
          <Stat icon={House} label="En el inicio" value={enInicio} tone="lila" hint="Carruseles encendidos en la portada" />
          <Stat icon={ShoppingBag} label="Productos a la venta" value={(resumen.en_venta ?? 0).toLocaleString('es-BO')} tone="emerald"
            hint="Entre ellos eliges qué va en cada vitrina" />
          <Stat icon={Package} label="Publicados" value={(resumen.publicados ?? 0).toLocaleString('es-BO')} tone="slate"
            hint="Incluye los vendidos y reservados" />
        </div>

        {sinColeccion.map((s) => (
          <Aviso key={s.id} tono="amber" icon={House} accion="Ir a Portada" onAccion={() => router.visit(route('admin.home-builder.index'))}>
            <span className="font-bold">La sección «{s.label}» del inicio está encendida y no tiene colección elegida.</span>{' '}
            Mientras no elijas una, ese espacio del inicio no muestra nada.
          </Aviso>
        ))}

        {agotadas.map((c) => (
          <Aviso key={c.id} tono="amber" icon={Layers} accion="Elegir productos" onAccion={() => router.visit(route('admin.collections.edit', c.id))}>
            <span className="font-bold">«{c.name}» ya no tiene nada a la venta.</span>{' '}
            Todo lo que elegiste se vendió, así que su página y sus carruseles no muestran productos.
          </Aviso>
        ))}

        {sinDestino.map((c) => (
          <Aviso key={c.id} tono="lila" icon={House} accion="Ir a Portada" onAccion={() => router.visit(route('admin.home-builder.index'))}>
            <span className="font-bold">«{c.name}» no está en el inicio ni en el menú.</span>{' '}
            Se llega solo con su enlace: {c.url}
          </Aviso>
        ))}

        <AdminGuide id="colecciones-tienda" title="¿Para qué sirven las colecciones?" steps={[
          'Una categoría se llena sola (cada producto cae en la suya según el inventario del que sale). Una colección la armas tú: eliges qué productos entran y en qué orden, mezclando categorías si quieres.',
          'Sirve para una campaña o una vitrina: «Ofertas de la semana», «Regreso a clases», «Lo más pedido». Cada una tiene su propia página para compartir por WhatsApp o Instagram.',
          'Para que salga en el inicio, enciende una sección «Colección de productos» en Portada y elígela ahí. Para ponerla en el menú, agrégala en «Menú».',
        ]} tip="En la tienda solo se muestran los productos que siguen a la venta: los vendidos quedan guardados en la colección, pero no se ven." />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Layers className="h-[18px] w-[18px] text-[#585E9F]" /> Colecciones
                <span className="text-sm font-semibold text-slate-400">{items.length}</span>
              </h2>
              {items.length > 1 && <p className="text-xs text-slate-500">Arrastra o usa las flechas para cambiar el orden. Se guarda solo.</p>}
            </div>

            {items.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="Todavía no hay ninguna colección"
                text="Crea la primera para agrupar a mano los productos de una campaña y darles una página propia."
                action={(
                  <button type="button" onClick={() => setNueva(true)} className={buttonCls('primary', 'h-11 px-4')}>
                    <Plus className="h-4 w-4" /> Nueva colección
                  </button>
                )}
              />
            ) : (
              <ol className="divide-y divide-slate-100">
                {items.map((c, i) => (
                  <Fila key={c.id} c={c} indice={i} total={items.length} onMover={mover} onVisibilidad={cambiarVisibilidad} arrastre={arrastre} />
                ))}
              </ol>
            )}
          </section>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en el inicio</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Las secciones «Colección de productos» de la portada y qué vitrina muestra cada una.</p>
              <VistaPortada colecciones={items} rutaPortada={route('admin.home-builder.index')} />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Colección o categoría</h2>
              <dl className="mt-3 space-y-3 text-[13px]">
                <div>
                  <dt className="font-bold text-slate-800">Categoría</dt>
                  <dd className="text-slate-500">Se llena sola con el inventario del que sale cada producto. No se crea ni se borra.</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-800">Colección</dt>
                  <dd className="text-slate-500">La armas tú, producto por producto, para una campaña. Se crea y se borra cuando quieras; los productos no se tocan.</dd>
                </div>
              </dl>
              <Link href={route('admin.categories.index')} className={buttonCls('secondary', 'mt-4 h-10 w-full')}>Ir a Categorías</Link>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Dónde se muestra</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                El carrusel del inicio se enciende en «Portada»; los enlaces del menú de arriba, del celular y del pie, en «Menú».
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={route('admin.home-builder.index')} className={buttonCls('secondary', 'h-10')}><House className="h-4 w-4" /> Ir a Portada</Link>
                <Link href={route('admin.menus.index')} className={buttonCls('secondary', 'h-10')}><List className="h-4 w-4" /> Ir a Menú</Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
