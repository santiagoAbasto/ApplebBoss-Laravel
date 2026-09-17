import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ChevronDown, ChevronUp, ExternalLink, FileText, GripVertical, List, Pencil, PanelBottom, Plus, Trash2 } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { EmptyState, Field, Input, Modal, PageHeader, Switch, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { Aviso, ModalEliminar, Stat } from '@/Components/Admin/inventario';
import { DondeSeVe, EstadoPagina, VistaPie } from '@/Components/Admin/paginas';

// Tienda online → Páginas: las páginas de solo texto de la tienda (Nosotros, Garantía, Envíos…).
// Cada una vive en /paginas/… y sale sola en la columna «Información» del pie, salvo que se le ponga un enlace propio
// en «Menú». Acá se crean, se ordenan, se encienden y se borran; el texto se escribe adentro de cada una.

function Fila({ p, indice, total, onMover, onVisibilidad, onBorrar, arrastre }) {
  return (
    <li
      draggable
      onDragStart={() => arrastre.iniciar(indice)}
      onDragEnter={() => arrastre.sobre(indice)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={arrastre.soltar}
      className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center ${p.active ? '' : 'bg-slate-50/60'}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex shrink-0 flex-col items-center">
          <button type="button" onClick={() => onMover(indice, indice - 1)} disabled={indice === 0} aria-label={`Subir ${p.title}`}
            className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronUp className="h-4 w-4" />
          </button>
          <GripVertical className="h-4 w-4 cursor-grab text-slate-300 active:cursor-grabbing" aria-hidden="true" />
          <button type="button" onClick={() => onMover(indice, indice + 1)} disabled={indice === total - 1} aria-label={`Bajar ${p.title}`}
            className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#585E9F]">
          <FileText className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-slate-900">
            {p.title}
            <EstadoPagina pagina={p} />
          </p>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {p.vacia ? 'Todavía no tiene texto.' : p.resumen}
          </p>
          <DondeSeVe donde={p.donde} url={p.url} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:shrink-0 lg:pl-4">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
          <Switch checked={p.active} label={`${p.active ? 'Ocultar' : 'Mostrar'} ${p.title}`} onChange={(v) => onVisibilidad(p, v)} />
          {p.active ? 'Se ve' : 'Oculta'}
        </label>
        <a href={p.url} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <ExternalLink className="h-3.5 w-3.5" /> Ver
        </a>
        <Link href={route('admin.pages.edit', p.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Link>
        <button type="button" onClick={() => onBorrar(p)} aria-label={`Borrar ${p.title}`}
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function ModalNueva({ onCerrar }) {
  const { data, setData, post, processing, errors } = useForm({ title: '' });

  const crear = () => {
    if (processing) return;
    post(route('admin.pages.store'), { onSuccess: onCerrar });
  };

  return (
    <Modal
      title="Nueva página"
      onClose={onCerrar}
      footer={(
        <>
          <button type="button" onClick={onCerrar} className={buttonCls('secondary', 'h-11')}>Cancelar</button>
          <button type="button" onClick={crear} disabled={processing || !data.title.trim()} className={buttonCls('primary', 'h-11')}>
            {processing ? 'Creando…' : 'Crear y escribir'}
          </button>
        </>
      )}
    >
      <Field label="Título de la página" error={errors.title} value={data.title} max={40}
        hint="Es lo que lee el cliente y con lo que se arma su dirección, que después no cambia. Por ejemplo: Cambios y devoluciones.">
        <Input value={data.title} maxLength={255} autoFocus placeholder="Ej.: Cómo comprar"
          onChange={(e) => setData('title', e.target.value)} />
      </Field>
      <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
        Se crea apagada: escribes el texto con calma y la enciendes cuando esté lista.
      </p>
    </Modal>
  );
}

export default function Index({ paginas = [], resumen = {} }) {
  const [toast] = useToast();
  const [items, setItems] = useState(paginas);
  const [nueva, setNueva] = useState(false);
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const desde = useRef(null);
  const hasta = useRef(null);

  // Lo que diga la base manda: al volver de guardar se sincroniza
  useEffect(() => setItems(paginas), [paginas]);

  const mover = (origen, destino) => {
    if (destino < 0 || destino >= items.length || origen === destino) return;
    const lista = [...items];
    const [movida] = lista.splice(origen, 1);
    lista.splice(destino, 0, movida);
    setItems(lista);
    router.post(route('admin.pages.reorder'), { orden: lista.map((p, i) => ({ id: p.id, orden: i + 1 })) },
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

  const cambiarVisibilidad = (pagina, valor) => {
    setItems((lista) => lista.map((p) => (p.id === pagina.id ? { ...p, active: valor } : p)));
    router.patch(route('admin.pages.visibilidad', pagina.id), { active: valor }, { preserveScroll: true, preserveState: true });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.pages.destroy', borrar.id), { onFinish: () => { setBorrando(false); setBorrar(null); } });
  };

  const vacias = items.filter((p) => p.active && p.vacia);

  return (
    <AdminLayout>
      <Head title="Páginas" />
      <Toast toast={toast} />
      {nueva && <ModalNueva onCerrar={() => setNueva(false)} />}

      {borrar && (
        <ModalEliminar
          titulo="Borrar página"
          icon={FileText}
          nombre={borrar.title}
          detalle={`Se borra su texto y ${borrar.url} deja de abrir. Los enlaces del menú que llevaban a ella se ocultan. Si solo quieres sacarla de la tienda por un tiempo, usa el interruptor.`}
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(null)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Páginas"
          subtitle="Las páginas de solo texto de la tienda: Nosotros, Garantía, Envíos, Términos. Sirven para explicarle algo al cliente; no llevan productos."
          actions={(
            <>
              <button type="button" onClick={() => setNueva(true)} className={buttonCls('primary', 'h-11 px-4')}>
                <Plus className="h-4 w-4" /> Nueva página
              </button>
              <a href="/" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                <ExternalLink className="h-4 w-4" /> Ver la tienda
              </a>
            </>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={FileText} label="Páginas" value={resumen.total ?? items.length} hint={`${resumen.visibles ?? 0} se pueden abrir`} />
          <Stat icon={PanelBottom} label="En el pie de página" value={items.filter((p) => p.active && p.donde?.en_informacion).length}
            tone="lila" hint="En la columna «Información»" />
          <Stat icon={FileText} label="Sin texto" value={vacias.length} tone={vacias.length > 0 ? 'amber' : 'slate'}
            hint="Encendidas y todavía en blanco" />
        </div>

        {vacias.map((p) => (
          <Aviso key={p.id} tono="amber" icon={FileText} accion="Escribir el texto" onAccion={() => router.visit(route('admin.pages.edit', p.id))}>
            <span className="font-bold">«{p.title}» está encendida y no tiene texto.</span>{' '}
            Quien entre a {p.url} va a ver la página vacía.
          </Aviso>
        ))}

        <AdminGuide id="paginas-tienda" title="¿Para qué sirven las páginas?" steps={[
          'Son páginas de solo texto para explicarle algo al cliente: quiénes son, cómo es la garantía, cómo se entrega, los términos. No llevan productos ni formularios.',
          'Toca «Nueva página», ponle un título y escribe el texto como en un documento: títulos, negrita, listas y enlaces. Se crea apagada hasta que la enciendas.',
          'Todas las encendidas salen solas en el pie de la tienda, en la columna «Información». Si quieres una en el menú de arriba o del celular, agrégala en «Menú».',
        ]} tip="La dirección de una página se arma con su título al crearla y después no cambia: es el enlace que compartes. Si te equivocaste, bórrala y crea otra." />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <FileText className="h-[18px] w-[18px] text-[#585E9F]" /> Páginas
                <span className="text-sm font-semibold text-slate-400">{items.length}</span>
              </h2>
              {items.length > 1 && <p className="text-xs text-slate-500">Arrastra o usa las flechas: ese es el orden del pie. Se guarda solo.</p>}
            </div>

            {items.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Todavía no hay ninguna página"
                text="Crea la primera para explicarle algo a tus clientes: quiénes son, la garantía, cómo se entrega."
                action={(
                  <button type="button" onClick={() => setNueva(true)} className={buttonCls('primary', 'h-11 px-4')}>
                    <Plus className="h-4 w-4" /> Nueva página
                  </button>
                )}
              />
            ) : (
              <ol className="divide-y divide-slate-100">
                {items.map((p, i) => (
                  <Fila key={p.id} p={p} indice={i} total={items.length} onMover={mover}
                    onVisibilidad={cambiarVisibilidad} onBorrar={setBorrar} arrastre={arrastre} />
                ))}
              </ol>
            )}
          </section>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ven en el pie</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">La columna «Información», en el final de la tienda, en el orden de esta lista.</p>
              <VistaPie paginas={items} />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">¿Y si la quiero en el menú?</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                En «Menú» puedes ponerle un enlace en la barra de arriba, en el celular o en una columna del pie. Si le pones uno en el pie,
                deja de listarse sola en «Información».
              </p>
              <Link href={route('admin.menus.index')} className={buttonCls('secondary', 'mt-3 h-10 w-full')}>
                <List className="h-4 w-4" /> Ir a Menú
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
