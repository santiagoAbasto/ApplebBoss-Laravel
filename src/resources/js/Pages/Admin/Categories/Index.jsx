import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, House, List, PackagePlus, Pencil, Store, Tag } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { Badge, PageHeader, Switch, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { Aviso, Stat } from '@/Components/Admin/inventario';
import { MyskinBadge } from '@/Components/Admin/catalogo';
import { ChipsTipos, IconoCategoria, VistaCatalogo, VistaInicio, estadoInicio } from '@/Components/Admin/categorias';

// Tienda online → Categorías: los estantes de la tienda.
// Al publicar, cada producto cae solo en su categoría según el inventario del que sale, así que las categorías no se
// crean ni se borran: acá se eligen el nombre, el orden y dónde se muestra cada una, con la vista previa al lado.

function Fila({ c, indice, total, onMover, onVisibilidad, arrastre }) {
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

        <IconoCategoria slug={c.slug} />

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-slate-900">
            {c.name}
            {c.is_myskin && <MyskinBadge />}
            {!c.active && <Badge tone="slate">Oculta</Badge>}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-500">{c.description || 'Sin descripción'}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            {c.inventario && <span>Sale de {c.inventario.nombre}</span>}
            {c.inventario && <span aria-hidden="true">·</span>}
            <span className="font-semibold text-slate-700">{c.en_tienda.toLocaleString('es-BO')} en la tienda</span>
            {c.por_publicar > 0 && c.inventario && (
              <>
                <span aria-hidden="true">·</span>
                <Link href={route('admin.catalogo.importar', { grupo: c.inventario.tipo })} className="font-semibold text-[#585E9F] hover:underline">
                  {c.por_publicar.toLocaleString('es-BO')} por publicar
                </Link>
              </>
            )}
          </p>
          {c.tipos && <ChipsTipos tipos={c.tipos} />}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:shrink-0 lg:pl-4">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
          <Switch checked={c.active} label={`Mostrar «${c.name}» en el catálogo`} onChange={(v) => onVisibilidad(c, 'active', v)} />
          Catálogo
        </label>
        <label className={`flex items-center gap-2 text-[13px] font-semibold ${c.active ? 'cursor-pointer text-slate-600' : 'text-slate-400'}`}>
          <Switch checked={c.show_home} disabled={!c.active} label={`Mostrar «${c.name}» en el inicio`} onChange={(v) => onVisibilidad(c, 'show_home', v)} />
          Inicio
        </label>
        <Link href={route('admin.categories.edit', c.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Link>
      </div>
    </li>
  );
}

export default function Index({ categorias = [], resumen = {}, bloqueInicio = false }) {
  const [toast] = useToast();
  const [items, setItems] = useState(categorias);
  const desde = useRef(null);
  const hasta = useRef(null);

  // Lo que diga la base manda: al volver de guardar el orden o la visibilidad, se sincroniza
  useEffect(() => setItems(categorias), [categorias]);

  const mover = (origen, destino) => {
    if (destino < 0 || destino >= items.length || origen === destino) return;
    const lista = [...items];
    const [movida] = lista.splice(origen, 1);
    lista.splice(destino, 0, movida);
    setItems(lista);
    router.post(route('admin.categories.reorder'), { orden: lista.map((c, i) => ({ id: c.id, orden: i + 1 })) },
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

  const cambiarVisibilidad = (cat, campo, valor) => {
    setItems((lista) => lista.map((c) => (c.id === cat.id ? { ...c, [campo]: valor } : c)));
    router.patch(route('admin.categories.visibilidad', cat.id), { [campo]: valor }, { preserveScroll: true, preserveState: true });
  };

  const activas = items.filter((c) => c.active).length;
  const marcadas = items.filter((c) => c.active && c.show_home).length;
  const { visibles: enInicio, motivo } = estadoInicio(items, bloqueInicio);
  const ocultasConProductos = items.filter((c) => c.active && !c.show_home && c.en_tienda > 0);

  return (
    <AdminLayout>
      <Head title="Categorías" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Categorías"
          subtitle="Los estantes de la tienda. Al publicar, cada producto cae solo en su categoría según el inventario del que sale; acá eliges el nombre, el orden y dónde se muestra cada una."
          actions={(
            <a href="/catalogo" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
              <ExternalLink className="h-4 w-4" /> Ver el catálogo
            </a>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Tag} label="Categorías" value={items.length} hint={`${activas} en el catálogo · ${marcadas} marcadas para el inicio`} />
          <Stat icon={Store} label="Productos en la tienda" value={(resumen.en_tienda ?? 0).toLocaleString('es-BO')} tone="emerald"
            hint="Publicados y disponibles ahora" />
          <Stat icon={PackagePlus} label="Por publicar" value={(resumen.por_publicar ?? 0).toLocaleString('es-BO')} tone="lila"
            hint="Disponibles en el inventario" />
          <Stat icon={House} label="Accesos en el inicio" value={enInicio.length} tone="slate"
            hint={motivo ? 'Hoy el bloque no se muestra' : 'En «¿Qué estás buscando?»'} />
        </div>

        {ocultasConProductos.map((c) => (
          <Aviso key={c.id} tono="amber" icon={House} accion="Mostrar en el inicio" onAccion={() => cambiarVisibilidad(c, 'show_home', true)}>
            <span className="font-bold">
              «{c.name}» tiene {c.en_tienda.toLocaleString('es-BO')} {c.en_tienda === 1 ? 'producto' : 'productos'} en la tienda y no aparece en el inicio.
            </span>{' '}
            En «¿Qué estás buscando?» solo salen las categorías marcadas.
          </Aviso>
        ))}

        {!bloqueInicio && (
          <Aviso tono="amber" icon={House} accion="Ir a Portada" onAccion={() => router.visit(route('admin.home-builder.index'))}>
            El bloque «¿Qué estás buscando?» está apagado en Portada: el inicio no muestra los accesos de las categorías.
          </Aviso>
        )}

        <AdminGuide id="categorias-tienda" title="¿Para qué sirven las categorías?" steps={[
          'Cada producto cae solo en su categoría al publicarlo: los celulares en iPhone, las computadoras en Mac, los productos Apple en Apple y los productos generales en Accesorios. Las fundas que marcas como MYSKIN van a Fundas MYSKIN.',
          'Acá eliges el nombre, la descripción y el orden, y si cada una se muestra en el catálogo y en el inicio. Al lado ves cómo queda.',
          'Abre una categoría para escribir la portada de su página y cómo aparece en Google.',
        ]} tip="Las categorías no se crean ni se borran, y su dirección web no cambia: los productos se agrupan con ella. Los menús de arriba, del celular y del pie se arman en «Menú»." />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Tag className="h-[18px] w-[18px] text-[#585E9F]" /> Categorías
                <span className="text-sm font-semibold text-slate-400">{items.length}</span>
              </h2>
              <p className="text-xs text-slate-500">Arrastra o usa las flechas para cambiar el orden. Se guarda solo.</p>
            </div>

            <ol className="divide-y divide-slate-100">
              {items.map((c, i) => (
                <Fila key={c.id} c={c} indice={i} total={items.length} onMover={mover} onVisibilidad={cambiarVisibilidad} arrastre={arrastre} />
              ))}
            </ol>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en el inicio</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">El bloque «¿Qué estás buscando?»: las categorías marcadas que tienen productos.</p>
              <VistaInicio categorias={items} bloqueInicio={bloqueInicio} />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en el catálogo</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">El filtro «Categoría». Las que no tienen productos no aparecen.</p>
              <VistaCatalogo categorias={items} />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Los menús se arman aparte</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                El menú de arriba, el del celular y el del pie de página se editan en «Menú»; los carruseles de productos del inicio, en «Portada».
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={route('admin.menus.index')} className={buttonCls('secondary', 'h-10')}><List className="h-4 w-4" /> Ir a Menú</Link>
                <Link href={route('admin.home-builder.index')} className={buttonCls('secondary', 'h-10')}><House className="h-4 w-4" /> Ir a Portada</Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
