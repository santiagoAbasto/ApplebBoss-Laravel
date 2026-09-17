import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ChevronDown, ChevronUp, CornerDownRight, Copy, ExternalLink, GripVertical, Navigation, Pencil, Plus, Trash2 } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import {
  Badge, Field, Input, Modal, PageHeader, Segmented, Select, Switch, Toast, buttonCls, inputCls, useToast,
} from '@/Components/Admin/ui';
import { Aviso, ModalEliminar, Stat } from '@/Components/Admin/inventario';
import LinkPicker from '@/Components/Admin/LinkPicker';
import { BadgesEnlace, Destino, MENUS, SiempreVisible, VistaMenu, menuDe } from '@/Components/Admin/menus';

// Tienda online → Menú: los enlaces con los que el cliente se mueve por la tienda.
// Son tres menús independientes porque no se ven en el mismo lugar; cada pestaña muestra dónde va el que estás editando
// y, al costado, cómo queda. Solo el de la computadora admite opciones adentro de un enlace.

const COLUMNA_NUEVA = '__nueva__';

function FormularioEnlace({ menu, item, padre, columnas, onCerrar }) {
  const editando = Boolean(item);
  const [columnaNueva, setColumnaNueva] = useState(false);

  const { data, setData, post, patch, processing, errors } = useForm({
    slot:            menu.key,
    parent_id:       padre?.id ?? null,
    label:           item?.label ?? '',
    url:             item?.url ?? '',
    group:           item?.group ?? (menu.columnas ? (columnas[0] ?? 'Comprar') : null),
    myskin:          item?.myskin ?? false,
    open_in_new_tab: item?.open_in_new_tab ?? false,
  });

  const guardar = () => {
    if (processing) return;
    const opciones = { preserveScroll: true, onSuccess: onCerrar };
    if (editando) patch(route('admin.menus.update', item.id), opciones);
    else post(route('admin.menus.store'), opciones);
  };

  const titulo = editando ? `Editar «${item.label}»` : padre ? `Nueva opción dentro de «${padre.label}»` : 'Nuevo enlace';

  return (
    <Modal
      title={titulo}
      onClose={onCerrar}
      footer={(
        <>
          <button type="button" onClick={onCerrar} className={buttonCls('secondary', 'h-11')}>Cancelar</button>
          <button type="button" onClick={guardar} disabled={processing || !data.label.trim()} className={buttonCls('primary', 'h-11')}>
            {processing ? 'Guardando…' : editando ? 'Guardar' : 'Agregar al menú'}
          </button>
        </>
      )}
    >
      <div className="grid gap-4">
        <Field label="Texto que ve el cliente" error={errors.label} value={data.label} max={24}
          hint="Corto y claro. Por ejemplo: iPhone, Ofertas, Cómo comprar.">
          <Input value={data.label} maxLength={120} autoFocus onChange={(e) => setData('label', e.target.value)} />
        </Field>

        <Field label="¿A dónde lleva?" error={errors.url}
          hint={padre || !menu.submenus
            ? 'Elige una página de la tienda o pega otra dirección.'
            : 'Elige una página. Si este enlace solo abre opciones adentro, puedes dejarlo sin enlace.'}>
          <LinkPicker
            value={data.url ?? ''}
            onChange={(v) => setData('url', v)}
            className={`${inputCls} h-11`}
            allowEmpty={!padre && menu.submenus}
            emptyLabel="Sin enlace (solo abre sus opciones)"
          />
        </Field>

        {menu.columnas && !padre && (
          <Field label="¿En qué columna del pie va?" error={errors.group}
            hint="Los enlaces que comparten columna salen juntos, uno debajo del otro.">
            {columnaNueva ? (
              <Input value={data.group ?? ''} maxLength={80} autoFocus placeholder="Nombre de la columna"
                onChange={(e) => setData('group', e.target.value)} />
            ) : (
              <Select
                value={data.group ?? ''}
                onChange={(e) => {
                  if (e.target.value === COLUMNA_NUEVA) { setColumnaNueva(true); setData('group', ''); return; }
                  setData('group', e.target.value);
                }}
              >
                {columnas.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value={COLUMNA_NUEVA}>Crear una columna nueva…</option>
              </Select>
            )}
          </Field>
        )}

        <div className="space-y-3 rounded-xl border border-slate-200 px-4 py-3">
          {menu.verde && !padre && (
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-slate-800">Resaltarlo en verde</span>
                <span className="block text-xs text-slate-500">El color de MYSKIN, para que se note entre los demás.</span>
              </span>
              <Switch checked={data.myskin} label="Resaltar en verde" onChange={(v) => setData('myskin', v)} />
            </label>
          )}
          <label className={`flex cursor-pointer items-center justify-between gap-3 ${menu.verde && !padre ? 'border-t border-slate-100 pt-3' : ''}`}>
            <span>
              <span className="block text-sm font-semibold text-slate-800">Abrirlo en otra pestaña</span>
              <span className="block text-xs text-slate-500">Para enlaces fuera de la tienda, como WhatsApp o Instagram.</span>
            </span>
            <Switch checked={data.open_in_new_tab} label="Abrir en otra pestaña" onChange={(v) => setData('open_in_new_tab', v)} />
          </label>
        </div>
      </div>
    </Modal>
  );
}

function Fila({ item, menu, indice, total, colecciones, onMover, onVisibilidad, onEditar, onAgregarDentro, onBorrar, arrastre }) {
  return (
    <li
      draggable
      onDragStart={() => arrastre.iniciar(indice)}
      onDragEnter={() => arrastre.sobre(indice)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={arrastre.soltar}
      className={`px-5 py-4 ${item.active ? '' : 'bg-slate-50/60'}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex shrink-0 flex-col items-center">
            <button type="button" onClick={() => onMover(indice, indice - 1)} disabled={indice === 0} aria-label={`Subir ${item.label}`}
              className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronUp className="h-4 w-4" />
            </button>
            <GripVertical className="h-4 w-4 cursor-grab text-slate-300 active:cursor-grabbing" aria-hidden="true" />
            <button type="button" onClick={() => onMover(indice, indice + 1)} disabled={indice === total - 1} aria-label={`Bajar ${item.label}`}
              className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-slate-900">
              {item.label}
              <BadgesEnlace item={item} menu={menu} />
              {menu.columnas && item.group && <Badge tone="navy">{item.group}</Badge>}
            </p>
            <p className="mt-0.5 text-[13px] text-slate-500">
              <Destino item={item} colecciones={colecciones} />
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:shrink-0 lg:pl-4">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
            <Switch checked={item.active} label={`${item.active ? 'Ocultar' : 'Mostrar'} ${item.label}`}
              onChange={(v) => onVisibilidad(item, v)} />
            {item.active ? 'Se ve' : 'Oculto'}
          </label>
          <button type="button" onClick={() => onEditar(item)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button type="button" onClick={() => onBorrar(item)} aria-label={`Quitar ${item.label}`}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {menu.submenus && (
        <div className="mt-3 space-y-1.5 pl-9">
          {item.children.map((hijo) => (
            <div key={hijo.id} className={`flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 ${hijo.active ? '' : 'bg-slate-50/60'}`}>
              <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-slate-800">
                  {hijo.label}
                  <BadgesEnlace item={hijo} menu={{ ...menu, verde: false }} />
                </span>
                <span className="block truncate text-xs text-slate-500"><Destino item={hijo} colecciones={colecciones} /></span>
              </span>
              <Switch checked={hijo.active} label={`${hijo.active ? 'Ocultar' : 'Mostrar'} ${hijo.label}`}
                onChange={(v) => onVisibilidad(hijo, v)} />
              <button type="button" onClick={() => onEditar(hijo)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Editar ${hijo.label}`}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => onBorrar(hijo)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Quitar ${hijo.label}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onAgregarDentro(item)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#585E9F] hover:underline">
            <Plus className="h-3.5 w-3.5" /> Agregar una opción dentro de «{item.label}»
          </button>
        </div>
      )}
    </li>
  );
}

export default function Index({ menus = {}, resumen = {}, faltantes = {}, columnas = [], colecciones = [], slotInicial = 'header' }) {
  const [toast] = useToast();
  const [slot, setSlot] = useState(slotInicial);
  const [items, setItems] = useState(menus[slot] ?? []);
  const [formulario, setFormulario] = useState(null);
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const desde = useRef(null);
  const hasta = useRef(null);

  // Lo que diga la base manda: al volver de guardar se sincroniza
  useEffect(() => setItems(menus[slot] ?? []), [menus, slot]);

  const menu = menuDe(slot);

  const mover = (origen, destino) => {
    if (destino < 0 || destino >= items.length || origen === destino) return;
    const lista = [...items];
    const [movido] = lista.splice(origen, 1);
    lista.splice(destino, 0, movido);
    setItems(lista);
    router.post(route('admin.menus.reorder'), { orden: lista.map((i, n) => ({ id: i.id, orden: n + 1 })) },
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

  const cambiarVisibilidad = (item, valor) => {
    setItems((lista) => lista.map((i) => (i.id === item.id
      ? { ...i, active: valor }
      : { ...i, children: i.children?.map((c) => (c.id === item.id ? { ...c, active: valor } : c)) ?? [] })));
    router.patch(route('admin.menus.update', item.id), { active: valor }, { preserveScroll: true, preserveState: true });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.menus.destroy', borrar.id), {
      preserveScroll: true,
      onFinish: () => { setBorrando(false); setBorrar(null); },
    });
  };

  const copiarDe = (origen) => router.post(route('admin.menus.copiar'), { desde: origen, hacia: slot }, { preserveScroll: true });

  const visibles = items.filter((i) => i.active).length;
  const faltanAqui = Object.entries(faltantes[slot] ?? {});

  return (
    <AdminLayout>
      <Head title="Menú" />
      <Toast toast={toast} />

      {formulario && (
        <FormularioEnlace
          menu={menu}
          item={formulario.item}
          padre={formulario.padre}
          columnas={columnas}
          onCerrar={() => setFormulario(null)}
        />
      )}

      {borrar && (
        <ModalEliminar
          titulo="Quitar del menú"
          icon={Navigation}
          nombre={borrar.label}
          advertencia={borrar.children?.length > 0
            ? `Se quitan también sus ${borrar.children.length} opciones. La página a la que lleva no se borra: sigue en la tienda. No se puede deshacer.`
            : 'La página a la que lleva no se borra: sigue en la tienda. Solo se quita el enlace del menú, y no se puede deshacer.'}
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(null)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Menú"
          subtitle="Los enlaces con los que tus clientes se mueven por la tienda. Son tres y se editan por separado, porque no se ven en el mismo lugar."
          actions={(
            <a href="/" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
              <ExternalLink className="h-4 w-4" /> Ver la tienda
            </a>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {MENUS.map((m) => {
            const datos = resumen[m.key] ?? {};
            return (
              <button key={m.key} type="button" onClick={() => setSlot(m.key)} className="text-left">
                <Stat
                  icon={m.Icon}
                  label={m.nombre}
                  value={datos.visibles ?? 0}
                  tone={slot === m.key ? 'navy' : 'slate'}
                  hint={datos.total === datos.visibles
                    ? `${datos.total === 1 ? 'enlace' : 'enlaces'} en la tienda`
                    : `de ${datos.total} · ${datos.total - datos.visibles} ocultos`}
                />
              </button>
            );
          })}
        </div>

        <AdminGuide id="menus-tienda" title="¿Cómo funciona el menú?" steps={[
          'Hay tres menús porque no se ven en el mismo lugar: la barra de arriba en la computadora, la lista que se abre en el celular y el pie de página. Cambia de menú con los botones de abajo.',
          'Cada fila es un enlace: el texto que ve el cliente y la página a la que lo lleva. Agrégalo con «Agregar enlace», arrástralo para cambiar el orden y usa el interruptor para esconderlo sin borrarlo.',
          'Al costado ves cómo queda ese menú en la tienda. Si un menú se queda sin enlaces, la tienda muestra uno de fábrica para que el cliente igual pueda moverse.',
        ]} tip="Los tres menús son independientes: agregar un enlace arriba no lo pone en el celular. Para no hacerlo a mano, usa «Copiar los que faltan»." />

        <Segmented
          ariaLabel="Elegir qué menú editar"
          value={slot}
          onChange={setSlot}
          cols="grid-cols-3"
          options={MENUS.map((m) => ({ value: m.key, label: m.corto, icon: m.Icon }))}
        />

        {faltanAqui.map(([otro, cuantos]) => (
          <Aviso key={otro} tono="lila" icon={Copy} accion="Copiar los que faltan" onAccion={() => copiarDe(otro)}>
            <span className="font-bold">
              «{menuDe(otro).nombre}» tiene {cuantos} {cuantos === 1 ? 'enlace' : 'enlaces'} que acá no {cuantos === 1 ? 'está' : 'están'}.
            </span>{' '}
            Los tres menús se editan por separado; puedes traerlos de una vez.
          </Aviso>
        ))}

        {visibles === 0 && (
          <Aviso tono="amber" icon={Navigation} accion="Agregar enlace" onAccion={() => setFormulario({ item: null, padre: null })}>
            <span className="font-bold">Este menú no tiene ningún enlace visible.</span>{' '}
            Mientras esté vacío, la tienda muestra un menú de fábrica para que el cliente pueda moverse igual.
          </Aviso>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <menu.Icon className="h-[18px] w-[18px] text-[#585E9F]" /> {menu.nombre}
                  <span className="text-sm font-semibold text-slate-400">{items.length}</span>
                </h2>
                <p className="mt-0.5 text-[13px] text-slate-500">{menu.donde}</p>
              </div>
              <button type="button" onClick={() => setFormulario({ item: null, padre: null })} className={buttonCls('primary', 'h-10')}>
                <Plus className="h-4 w-4" /> Agregar enlace
              </button>
            </div>

            <p className="border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs text-slate-500">{menu.ayuda}</p>

            {items.length === 0 ? (
              <p className="px-5 py-12 text-center text-[13px] text-slate-500">
                Este menú está vacío. Agrega el primer enlace para que tus clientes lleguen a lo que quieres mostrar.
              </p>
            ) : (
              <ol className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <Fila
                    key={item.id}
                    item={item}
                    menu={menu}
                    indice={i}
                    total={items.length}
                    colecciones={colecciones}
                    onMover={mover}
                    onVisibilidad={cambiarVisibilidad}
                    onEditar={(it) => setFormulario({ item: it, padre: null })}
                    onAgregarDentro={(padre) => setFormulario({ item: null, padre })}
                    onBorrar={setBorrar}
                    arrastre={arrastre}
                  />
                ))}
              </ol>
            )}
          </section>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en la tienda</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">{menu.donde}</p>
              <VistaMenu slot={slot} items={items} />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Esto sale siempre</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">No se edita acá: la tienda lo agrega sola.</p>
              <SiempreVisible slot={slot} />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Copiar de otro menú</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Trae los enlaces que ya tienes en otro menú y acá faltan. No repite los que ya están.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MENUS.filter((m) => m.key !== slot).map((m) => (
                  <button key={m.key} type="button" onClick={() => copiarDe(m.key)} className={buttonCls('secondary', 'h-10')}>
                    <Copy className="h-4 w-4" /> De «{m.corto}»
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
