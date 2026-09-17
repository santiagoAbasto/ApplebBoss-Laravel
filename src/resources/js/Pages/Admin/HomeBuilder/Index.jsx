import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ArrowDownUp, ChevronDown, ChevronUp, Eye, EyeOff, ExternalLink, GripVertical, House, LayoutList, ShoppingBag, Settings2 } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { PageHeader, Switch, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { Aviso, Stat } from '@/Components/Admin/inventario';
import { EstadoSeccion, FuentesDeContenido, VistaInicio, metaDe, rangoMenu } from '@/Components/Admin/portada';
import ModalSeccion from '@/Components/Admin/PortadaModal';

// Tienda online → Portada: el orden de la página de inicio.
// Las secciones no se crean ni se borran: son las piezas que sabe dibujar la tienda. Acá se enciende cada una, se
// mueve y se editan sus textos; el contenido sale de los otros módulos y una sección sin nada que mostrar no se dibuja.

function Fila({ s, indice, total, onMover, onEncender, onEditar, arrastre }) {
  const meta = metaDe(s.type);
  const categoria = s.settings?.categoria;

  return (
    <li
      draggable
      onDragStart={() => arrastre.iniciar(indice)}
      onDragEnter={() => arrastre.sobre(indice)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={arrastre.soltar}
      className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center ${s.active ? '' : 'bg-slate-50/60'}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex shrink-0 flex-col items-center">
          <button type="button" onClick={() => onMover(indice, indice - 1)} disabled={indice === 0} aria-label={`Subir ${s.titulo}`}
            className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronUp className="h-4 w-4" />
          </button>
          <GripVertical className="h-4 w-4 cursor-grab text-slate-300 active:cursor-grabbing" aria-hidden="true" />
          <button type="button" onClick={() => onMover(indice, indice + 1)} disabled={indice === total - 1} aria-label={`Bajar ${s.titulo}`}
            className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.se_ve ? 'bg-slate-100 text-[#585E9F]' : 'bg-slate-100 text-slate-400'}`}>
          <meta.Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-slate-900">
            {s.titulo}
            <EstadoSeccion section={s} />
          </p>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {meta.nombre}{categoria ? ` · ${categoria}` : ''} — {meta.ayuda}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            {s.cantidad !== null && s.se_ve && (
              <span className="font-semibold text-slate-700">
                {s.cantidad} {s.cantidad === 1 ? 'producto' : 'productos'}
              </span>
            )}
            {meta.fuente && (
              <>
                {s.cantidad !== null && s.se_ve && <span aria-hidden="true">·</span>}
                <span>Sale de</span>
                <Link href={route(meta.fuente.ruta)} className="font-semibold text-[#585E9F] hover:underline">{meta.fuente.label}</Link>
              </>
            )}
            {(s.publicar_desde || s.publicar_hasta) && (
              <>
                <span aria-hidden="true">·</span>
                <span>{s.publicar_desde ? `desde ${s.publicar_desde}` : ''}{s.publicar_hasta ? ` hasta ${s.publicar_hasta}` : ''}</span>
              </>
            )}
          </p>
          {s.motivo && <p className="mt-1.5 text-xs font-semibold text-amber-700">{s.motivo}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 lg:shrink-0 lg:pl-4">
        <button type="button" onClick={() => onEditar(s.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Settings2 className="h-3.5 w-3.5" /> Editar
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
          <Switch checked={s.active} label={`${s.active ? 'Apagar' : 'Encender'} ${s.titulo}`} onChange={(v) => onEncender(s, v)} />
          {s.active ? 'Encendida' : 'Apagada'}
        </label>
      </div>
    </li>
  );
}

export default function Index({ sections = [], resumen = {}, colecciones = [], categorias = [] }) {
  const [toast] = useToast();
  const [items, setItems] = useState(sections);
  const [editando, setEditando] = useState(null);
  const desde = useRef(null);
  const hasta = useRef(null);

  // Lo que diga la base manda: al volver de guardar se sincroniza
  useEffect(() => setItems(sections), [sections]);

  const guardarOrden = (lista) => {
    setItems(lista);
    router.post(route('admin.home-builder.reorder'), { orden: lista.map((s, i) => ({ id: s.id, orden: i + 1 })) },
      { preserveScroll: true, preserveState: true });
  };

  const mover = (origen, destino) => {
    if (destino < 0 || destino >= items.length || origen === destino) return;
    const lista = [...items];
    const [movida] = lista.splice(origen, 1);
    lista.splice(destino, 0, movida);
    guardarOrden(lista);
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

  const ordenarComoElMenu = () => guardarOrden([...items].sort((a, b) => rangoMenu(a) - rangoMenu(b) || a.orden - b.orden));

  const encender = (s, valor) => {
    setItems((lista) => lista.map((x) => (x.id === s.id ? { ...x, active: valor } : x)));
    router.patch(route('admin.home-builder.update', s.id), { active: valor }, { preserveScroll: true, preserveState: true });
  };

  const seccionEditando = editando ? items.find((s) => s.id === editando) : null;
  const vacias = items.filter((s) => s.active && !s.se_ve);

  return (
    <AdminLayout>
      <Head title="Portada" />
      <Toast toast={toast} />

      {seccionEditando && (
        <ModalSeccion
          section={seccionEditando}
          colecciones={colecciones}
          categorias={categorias}
          onCerrar={() => setEditando(null)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Portada"
          subtitle="El orden de la página de inicio. Las secciones no se crean ni se borran: acá enciendes cada una, la mueves y editas sus textos. Lo que muestra cada una sale de los otros módulos."
          actions={(
            <>
              <button type="button" onClick={ordenarComoElMenu} className={buttonCls('secondary', 'h-11 px-4')}
                title="iPhone → Mac → Más Apple → MYSKIN → Accesorios → Seminuevos">
                <ArrowDownUp className="h-4 w-4" /> Ordenar como el menú
              </button>
              <a href="/" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                <ExternalLink className="h-4 w-4" /> Ver la tienda
              </a>
            </>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={LayoutList} label="Secciones" value={resumen.total ?? items.length} hint={`${resumen.encendidas ?? 0} encendidas`} />
          <Stat icon={Eye} label="Se ven ahora" value={resumen.se_ven ?? 0} tone="emerald" hint="Las que hoy se dibujan en el inicio" />
          <Stat icon={EyeOff} label="Encendidas sin contenido" value={vacias.length} tone={vacias.length > 0 ? 'lila' : 'slate'}
            hint="No se dibujan hasta que tengan algo" />
          <Stat icon={ShoppingBag} label="Productos a la venta" value={(resumen.disponibles ?? 0).toLocaleString('es-BO')} tone="slate"
            hint="Lo que pueden mostrar las secciones" />
        </div>

        {vacias.length > 0 && (
          <Aviso tono="amber" icon={House} accion="Ver la tienda" onAccion={() => window.open('/', '_blank', 'noopener')}>
            <span className="font-bold">
              {vacias.length === 1
                ? 'Hay una sección encendida que hoy no muestra nada.'
                : `Hay ${vacias.length} secciones encendidas que hoy no muestran nada.`}
            </span>{' '}
            No dejan un hueco en la tienda: simplemente no se dibujan. Abajo, cada una dice por qué.
          </Aviso>
        )}

        <AdminGuide id="portada-inicio" title="¿Cómo se arma el inicio?" steps={[
          'Cada fila es una sección de la página de inicio. El interruptor la enciende o la apaga, y se ve al instante en la tienda.',
          'Arrastra o usa las flechas para cambiar el orden. «Ordenar como el menú» las deja en el mismo orden que ve el cliente arriba.',
          'Toca «Editar» para cambiar el título, el texto, los botones y cuántos productos muestra. También puedes mostrar una sección solo entre dos fechas.',
        ]} tip="El contenido no se carga acá: sale del catálogo, de las categorías, de las colecciones, de los servicios, de las ubicaciones y de las preguntas frecuentes. Una sección de productos que hoy no tiene nada que mostrar no se dibuja." />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <House className="h-[18px] w-[18px] text-[#585E9F]" /> Secciones del inicio
                <span className="text-sm font-semibold text-slate-400">{items.length}</span>
              </h2>
              <p className="text-xs text-slate-500">Arrastra o usa las flechas para cambiar el orden. Se guarda solo.</p>
            </div>

            <ol className="divide-y divide-slate-100">
              {items.map((s, i) => (
                <Fila key={s.id} s={s} indice={i} total={items.length} onMover={mover} onEncender={encender}
                  onEditar={setEditando} arrastre={arrastre} />
              ))}
            </ol>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así queda el inicio</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Lo que el cliente ve hoy, de arriba abajo. Las apagadas y las que no tienen contenido no aparecen.</p>
              <VistaInicio sections={items} />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">De dónde sale el contenido</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Acá se ordenan las secciones; lo que muestran se carga en su módulo.</p>
              <FuentesDeContenido ruta={route} />
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
