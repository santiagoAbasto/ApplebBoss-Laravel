import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { Eye, FileClock, Globe, Image as ImageIcon, PackagePlus, Plus, Search, Store, Tag, X } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { EmptyState, PageHeader, Paginador, Switch, Toast, bsFmt, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { CondicionBadge } from '@/Components/Admin/condicion';
import { Aviso, ChipsEstado, Stat } from '@/Components/Admin/inventario';
import { CATEGORIAS, EstadoPublicacionBadge, MyskinBadge, categoriaTexto, tiendaUrl } from '@/Components/Admin/catalogo';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'publicados', label: 'En la tienda' },
  { key: 'borradores', label: 'Borradores' },
  { key: 'sin_imagen', label: 'Sin foto', alerta: true },
  { key: 'promociones', label: 'Con promoción' },
  { key: 'seminuevos', label: 'Seminuevos' },
  { key: 'myskin', label: 'MYSKIN' },
];

function Miniatura({ src }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50">
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-slate-300" />}
    </span>
  );
}

function Precio({ pub }) {
  const promo = Number(pub.precio_promocional) || 0;
  return (
    <div className="text-right">
      <p className="font-bold tabular-nums text-slate-900">{bsFmt(promo || pub.precio_venta)}</p>
      {promo > 0 && <p className="text-xs tabular-nums text-slate-400 line-through">{bsFmt(pub.precio_venta)}</p>}
    </div>
  );
}

function Destacado({ pub }) {
  const [enviando, setEnviando] = useState(false);
  return (
    <Switch checked={pub.destacado} disabled={enviando} label={pub.destacado ? `Quitar de destacados: ${pub.titulo}` : `Destacar en el inicio: ${pub.titulo}`}
      onChange={() => router.patch(route('admin.catalogo.destacado', pub.id), {}, {
        preserveScroll: true, preserveState: true, onStart: () => setEnviando(true), onFinish: () => setEnviando(false),
      })} />
  );
}

function Faltantes({ pub }) {
  if (pub.campos_faltantes?.length) {
    return (
      <p className="mt-1 max-w-[220px] text-[11px] leading-snug text-amber-700">
        Falta: {pub.campos_faltantes.slice(0, 2).join(', ').toLowerCase()}{pub.campos_faltantes.length > 2 && ` +${pub.campos_faltantes.length - 2}`}
      </p>
    );
  }
  if (pub.recomendaciones?.length) return <p className="mt-1 text-[11px] text-slate-400">Sugerido: {pub.recomendaciones[0].toLowerCase()}</p>;
  return null;
}

export default function Index({ publicaciones, filters = {}, counts = {}, pendientes = 0 }) {
  const [toast] = useToast();
  const [texto, setTexto] = useState(filters.q || '');
  const tablaRef = useRef(null);
  const primera = useRef(true);
  const tab = filters.tab || 'todos';
  const categoria = filters.categoria || 'todos';
  const filas = publicaciones?.data ?? [];

  const navegar = (params) => router.get(route('admin.catalogo.index'), { ...filters, page: undefined, ...params }, {
    replace: true, preserveScroll: true, preserveState: true,
  });

  // La búsqueda se aplica sola al dejar de escribir
  useEffect(() => {
    if (primera.current) { primera.current = false; return undefined; }
    const t = setTimeout(() => navegar({ q: texto.trim() || undefined }), 350);
    return () => clearTimeout(t);
  }, [texto]); // eslint-disable-line react-hooks/exhaustive-deps

  const irAPagina = (page) => {
    navegar({ page });
    tablaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hayFiltros = Boolean(filters.q) || categoria !== 'todos';
  const limpiar = () => { setTexto(''); navegar({ q: undefined, categoria: undefined }); };

  return (
    <AdminLayout>
      <Head title="Productos en la tienda" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Productos en la tienda"
          subtitle="Qué productos del inventario se muestran en la tienda y cómo se ven. El precio siempre sale del inventario y lo vendido desaparece solo."
          actions={(
            <>
              <a href={route('store.catalog')} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                <Globe className="h-4 w-4" /> Ver tienda
              </a>
              <Link href={route('admin.catalogo.importar')} className={buttonCls('primary', 'h-11 px-5')}>
                <Plus className="h-4 w-4" /> Agregar productos
              </Link>
            </>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Store} label="En la tienda" value={(counts.publicados ?? 0).toLocaleString('es-BO')} tone="emerald"
            hint={`De ${(counts.todos ?? 0).toLocaleString('es-BO')} publicaciones`} />
          <Stat icon={FileClock} label="Borradores" value={(counts.borradores ?? 0).toLocaleString('es-BO')} tone="slate" hint="Guardados, sin mostrarse" />
          <Stat icon={ImageIcon} label="Sin foto" value={(counts.sin_imagen ?? 0).toLocaleString('es-BO')} tone="lila" hint="Se muestran con una ilustración" />
          <Stat icon={PackagePlus} label="Por agregar" value={pendientes.toLocaleString('es-BO')} hint="Disponibles en el inventario" />
        </div>

        {pendientes > 0 && (
          <Aviso icon={PackagePlus} accion="Agregar a la tienda" onAccion={() => router.visit(route('admin.catalogo.importar'))}>
            <span className="font-bold">{pendientes} {pendientes === 1 ? 'producto disponible todavía no se ve' : 'productos disponibles todavía no se ven'} en la tienda.</span>{' '}
            Los eliges, revisas su condición y listo.
          </Aviso>
        )}

        <AdminGuide id="catalogo" title="¿Cómo funciona esta sección?" steps={[
          'Toca «Agregar productos» para traer equipos y accesorios desde tu inventario.',
          'Toca un producto para cambiar su nombre, descripción, fotos o promoción.',
          'Usa el interruptor «Destacado» para mostrarlo en los destacados del inicio.',
        ]} tip="El precio siempre sale del inventario. Cuando un equipo se vende, desaparece solo de la tienda." />

        {/* Búsqueda y filtros */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar publicaciones"
                placeholder="Buscar por nombre" className={`${inputCls} h-11 pl-10 pr-10`} />
              {texto && (
                <button type="button" onClick={() => setTexto('')} aria-label="Borrar búsqueda"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select value={categoria} onChange={(e) => navegar({ categoria: e.target.value === 'todos' ? undefined : e.target.value })}
              aria-label="Categoría" className={`${inputCls} h-11 pr-9 lg:w-56`}>
              <option value="todos">Todas las categorías</option>
              {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <ChipsEstado filtros={FILTROS} activo={tab} conteo={counts} onChange={(key) => navegar({ tab: key === 'todos' ? undefined : key })} />
        </section>

        {/* Listado */}
        <section ref={tablaRef} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Tag className="h-[18px] w-[18px] text-[#585E9F]" /> Publicaciones
            </h2>
            {hayFiltros && (
              <button type="button" onClick={limpiar} className={buttonCls('ghost', 'h-8 px-2.5 text-xs')}>
                <X className="h-3.5 w-3.5" /> Quitar filtros
              </button>
            )}
          </div>

          {filas.length === 0 ? (
            (counts.todos ?? 0) === 0 && !hayFiltros ? (
              <EmptyState icon={Store} title="Todavía no hay productos en la tienda"
                text="Trae equipos y accesorios desde el inventario: toma menos de un minuto."
                action={<Link href={route('admin.catalogo.importar')} className={buttonCls('primary')}><Plus className="h-4 w-4" /> Agregar productos</Link>} />
            ) : (
              <EmptyState icon={Search} title="Sin resultados" text="Prueba con otro nombre, otra categoría o quita los filtros."
                action={hayFiltros ? <button type="button" onClick={limpiar} className={buttonCls('secondary')}>Quitar filtros</button> : null} />
            )
          ) : (
            <>
              {/* Escritorio */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[980px] text-[13px]">
                  <thead>
                    <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      <th className="py-3 pl-5 pr-3">Producto</th>
                      <th className="px-3 py-3">Categoría</th>
                      <th className="px-3 py-3 text-right">Precio</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-3 py-3">Destacado</th>
                      <th className="py-3 pl-3 pr-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filas.map((pub) => (
                      <tr key={pub.id} className="hover:bg-slate-50/70">
                        <td className="py-3 pl-5 pr-3">
                          <div className="flex items-center gap-3">
                            <Miniatura src={pub.thumb} />
                            <div className="min-w-0">
                              <Link href={route('admin.catalogo.edit', pub.id)} className="block max-w-[340px] truncate font-semibold text-slate-900 hover:text-[#585E9F]">{pub.titulo}</Link>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span className="text-xs text-slate-500">{pub.tipo_label}</span>
                                <CondicionBadge condicion={pub.condicion} />
                                {pub.storefront === 'MYSKIN' && <MyskinBadge />}
                                {pub.imagenes_count === 0 && <span className="text-[11px] font-semibold text-amber-600">Sin foto</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{categoriaTexto(pub.categoria)}</td>
                        <td className="px-3 py-3"><Precio pub={pub} /></td>
                        <td className="px-3 py-3"><EstadoPublicacionBadge estado={pub.estado_publicacion} /><Faltantes pub={pub} /></td>
                        <td className="px-3 py-3"><Destacado pub={pub} /></td>
                        <td className="py-3 pl-3 pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            {pub.estado_publicacion === 'Publicado' && (
                              <a href={tiendaUrl(pub.slug)} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${pub.titulo} en la tienda`}
                                className={buttonCls('ghost', 'h-9 px-2.5')}><Eye className="h-4 w-4" /></a>
                            )}
                            <Link href={route('admin.catalogo.edit', pub.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>Editar</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Celular y tablet */}
              <ul className="divide-y divide-slate-100 lg:hidden">
                {filas.map((pub) => (
                  <li key={pub.id} className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <Miniatura src={pub.thumb} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <EstadoPublicacionBadge estado={pub.estado_publicacion} />
                          <CondicionBadge condicion={pub.condicion} />
                          {pub.storefront === 'MYSKIN' && <MyskinBadge />}
                        </div>
                        <Link href={route('admin.catalogo.edit', pub.id)} className="mt-1.5 block truncate text-[15px] font-bold text-slate-900">{pub.titulo}</Link>
                        <p className="truncate text-xs text-slate-500">{categoriaTexto(pub.categoria)} · {pub.tipo_label}</p>
                        <Faltantes pub={pub} />
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Destacado pub={pub} /> Destacado</label>
                          <Precio pub={pub} />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <Paginador meta={publicaciones} onPagina={irAPagina} porPagina={Number(filters.per_page) || 30}
            opciones={[30, 60, 100]} onPorPagina={(n) => navegar({ per_page: n === 30 ? undefined : n })} />
        </section>
      </div>
    </AdminLayout>
  );
}
