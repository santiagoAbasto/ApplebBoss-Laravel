import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { CheckCircle2, Eye, EyeOff, FileText, PackageCheck, Search, ShieldCheck, Store, Tag, X } from 'lucide-react';
import { EmptyState, Segmented, StepCard, Toast, bsFmt, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { CondicionBadge } from '@/Components/Admin/condicion';
import { EncabezadoFormulario, ErroresResumen, Linea, Nota, checkCls } from '@/Components/Admin/inventario';
import { CONDICIONES_TIENDA } from '@/Components/Admin/catalogo';

const VISIBILIDAD = [
  { value: 'si', label: 'Mostrar ahora', icon: Eye },
  { value: 'no', label: 'Guardar como borrador', icon: EyeOff },
];

const plural = (n, uno, varios) => `${n.toLocaleString('es-BO')} ${n === 1 ? uno : varios}`;

export default function Importar({ grupos = [], condiciones = [], grupoInicial = null }) {
  const { errors = {} } = usePage().props;
  const [toast] = useToast();
  // Abre en el grupo pedido (Categorías → «Publicar desde el inventario») o en el primero con productos por publicar
  const [grupo, setGrupo] = useState(() => (grupos.some((g) => g.tipo === grupoInicial)
    ? grupoInicial
    : grupos.find((g) => g.items.length)?.tipo ?? grupos[0]?.tipo));
  const [texto, setTexto] = useState('');
  const [sel, setSel] = useState(() => new Set());
  const [condicion, setCondicion] = useState('');
  const [publicar, setPublicar] = useState('si');
  const [myskin, setMyskin] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const todos = useMemo(() => grupos.flatMap((g) => g.items), [grupos]);
  const actual = grupos.find((g) => g.tipo === grupo);
  const q = texto.trim().toLowerCase();
  const visibles = useMemo(() => {
    const items = actual?.items ?? [];
    // También por la ficha: «certificado», «gorilla» o «funda de silicona» encuentran lo que se publica con esa ficha
    return q ? items.filter((i) => `${i.titulo} ${i.detalle} ${i.ficha ?? ''}`.toLowerCase().includes(q)) : items;
  }, [actual, q]);

  const elegidos = todos.filter((i) => sel.has(i.key));
  const soloFundas = elegidos.length > 0 && elegidos.every((i) => i.es_funda);
  const sinCondicion = elegidos.filter((i) => !i.condicion).length;
  const porCondicion = elegidos.reduce((acc, i) => (i.condicion ? { ...acc, [i.condicion]: (acc[i.condicion] ?? 0) + 1 } : acc), {});
  const resumenInventario = Object.entries(porCondicion).map(([c, n]) => `${n} ${c.toLowerCase()}`).join(' · ');
  const opcionesCondicion = CONDICIONES_TIENDA.filter((c) => condiciones.includes(c.value));

  const alternar = (key) => setSel((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const todosVisibles = visibles.length > 0 && visibles.every((i) => sel.has(i.key));
  const alternarVisibles = () => setSel((s) => {
    const n = new Set(s);
    visibles.forEach((i) => (todosVisibles ? n.delete(i.key) : n.add(i.key)));
    return n;
  });

  const falta = !sel.size ? 'Elige al menos un producto.' : (sinCondicion > 0 && !condicion ? 'Elige la condición de los que no la tienen.' : null);

  const enviar = () => {
    if (falta || enviando) return;
    router.post(route('admin.catalogo.importar.store'), {
      items: [...sel],
      condicion: sinCondicion > 0 ? condicion : null,
      publicar: publicar === 'si',
      marca: soloFundas && myskin ? 'MYSKIN' : 'APPLE_BOSS',
    }, { onStart: () => setEnviando(true), onFinish: () => setEnviando(false) });
  };

  return (
    <AdminLayout>
      <Head title="Agregar productos a la tienda" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <EncabezadoFormulario volverUrl={route('admin.catalogo.index')} volverLabel="Volver a productos en la tienda" titulo="Agregar productos a la tienda"
          subtitulo={todos.length
            ? `${plural(todos.length, 'producto disponible', 'productos disponibles')} en el inventario todavía no se ven en la tienda. El nombre, la descripción y el precio salen del inventario.`
            : 'Trae equipos y accesorios del inventario a la tienda.'} />

        {todos.length === 0 ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <EmptyState icon={CheckCircle2} title="Todo tu inventario disponible ya está en la tienda"
              text="Cuando cargues equipos nuevos al inventario, aparecerán aquí para agregarlos."
              action={<Link href={route('admin.catalogo.index')} className={buttonCls('secondary')}>Ver productos en la tienda</Link>} />
          </section>
        ) : (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-5">
              <StepCard step={1} title="Elige los productos" subtitle="Solo aparece lo disponible que todavía no está en la tienda.">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Tipo de producto">
                  {grupos.map((g) => {
                    const marcados = g.items.filter((i) => sel.has(i.key)).length;
                    const activo = grupo === g.tipo;
                    return (
                      <button key={g.tipo} type="button" role="tab" aria-selected={activo} onClick={() => { setGrupo(g.tipo); setTexto(''); }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${activo ? 'bg-[#011446] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {g.label} <span className={activo ? 'text-white/70' : 'opacity-60'}>{g.items.length}</span>
                        {marcados > 0 && <span className={`rounded-full px-1.5 text-[10px] ${activo ? 'bg-white text-[#011446]' : 'bg-[#011446] text-white'}`}>{marcados}</span>}
                      </button>
                    );
                  })}
                </div>

                {grupo === 'producto_general' && (
                  <Nota>Los accesorios iguales (mismo nombre y precio) se publican una sola vez y se muestran mientras quede al menos una unidad.</Nota>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar productos" placeholder="Buscar por nombre o detalle"
                      className={`${inputCls} h-11 pl-10 pr-10`} />
                    {texto && (
                      <button type="button" onClick={() => setTexto('')} aria-label="Borrar búsqueda"
                        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={alternarVisibles} disabled={!visibles.length} className={buttonCls('secondary', 'h-11 px-4')}>
                    {todosVisibles ? 'Quitar estos' : `Elegir ${visibles.length === (actual?.items.length ?? 0) ? 'todos' : 'los mostrados'} (${visibles.length})`}
                  </button>
                </div>

                <ul className="mt-3 max-h-[55vh] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                  {visibles.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-400">No hay productos pendientes en este grupo.</li>}
                  {visibles.map((i) => {
                    const marcado = sel.has(i.key);
                    return (
                      <li key={i.key}>
                        <label className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${marcado ? 'bg-[#585E9F]/[0.06]' : 'hover:bg-slate-50'}`}>
                          <input type="checkbox" checked={marcado} onChange={() => alternar(i.key)} className={checkCls} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">{i.titulo}</span>
                            <span className="block truncate text-xs text-slate-500">{i.detalle}</span>
                            {['producto_general', 'producto_apple'].includes(i.tipo) && (i.ficha ? (
                              <span className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-[#585E9F]/10 px-2 py-0.5 text-[11px] font-semibold text-[#454B8A]">
                                <FileText className="h-3 w-3 shrink-0" /> <span className="truncate">Ficha: {i.ficha}</span>
                              </span>
                            ) : (
                              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                {i.tipo === 'producto_apple' ? 'Sin ficha: la eliges al editar la publicación' : 'Sin ficha: se publica solo con el nombre'}
                              </span>
                            ))}
                          </span>
                          <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                            <CondicionBadge condicion={i.condicion} vacio={<span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">Sin condición</span>} />
                            {i.unidades > 1 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{i.unidades} en stock</span>}
                          </span>
                          <span className="shrink-0 text-sm font-bold tabular-nums text-slate-800">{bsFmt(i.precio)}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </StepCard>

              <StepCard step={2} icon={ShieldCheck} title="Condición" subtitle="Es la que se muestra en la tienda. Nunca se asume.">
                {!sel.size ? (
                  <p className="text-sm text-slate-500">Primero elige los productos.</p>
                ) : sinCondicion === 0 ? (
                  <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Todos ya tienen condición en el inventario: {resumenInventario}.
                  </p>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-slate-600">
                      {sinCondicion === elegidos.length
                        ? `Ninguno de los ${elegidos.length} tiene condición en el inventario. Si hay nuevos y usados mezclados, agrégalos en dos tandas.`
                        : `${sinCondicion} de los ${elegidos.length} no tienen condición: la que elijas es para ellos. Los demás mantienen la suya (${resumenInventario}).`}
                    </p>
                    <Segmented cols="grid-cols-2 sm:grid-cols-4" options={opcionesCondicion} value={condicion} onChange={setCondicion} ariaLabel="Condición" />
                    <Nota>{CONDICIONES_TIENDA.find((c) => c.value === condicion)?.ayuda ?? 'Si eliges Nuevo o Seminuevo, también queda guardada en el inventario.'}</Nota>
                  </>
                )}

                {soloFundas && (
                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
                    <input type="checkbox" checked={myskin} onChange={(e) => setMyskin(e.target.checked)} className={`${checkCls} mt-0.5`} />
                    <span className="text-sm text-slate-700">
                      <span className="font-bold">Estas fundas son de la marca MYSKIN</span>
                      <span className="block text-xs text-slate-500">Se muestran en la sección Fundas MYSKIN. Márcalo solo si realmente lo son.</span>
                    </span>
                  </label>
                )}
              </StepCard>

              <StepCard step={3} icon={Store} title="¿Se muestran ahora?" subtitle="Puedes agregar fotos y cambiar los textos después.">
                <Segmented options={VISIBILIDAD} value={publicar} onChange={setPublicar} ariaLabel="Visibilidad" />
                <Nota>{publicar === 'si' ? 'Se ven de inmediato. Sin foto se muestra una ilustración.' : 'Quedan guardados: los revisas, les pones fotos y los publicas cuando quieras.'}</Nota>
              </StepCard>
            </div>

            <aside className="xl:sticky xl:top-24">
              <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><PackageCheck className="h-[18px] w-[18px] text-[#585E9F]" /> Resumen</h2>
                </div>
                <div className="space-y-4 p-5">
                  <div className="rounded-xl bg-[#011446] px-4 py-3.5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Productos elegidos</p>
                    <p className="mt-1 text-[28px] font-extrabold leading-none tabular-nums">{sel.size.toLocaleString('es-BO')}</p>
                    <p className="mt-1.5 text-xs text-white/70">{sel.size ? grupos.map((g) => [g.label, g.items.filter((i) => sel.has(i.key)).length]).filter(([, n]) => n).map(([l, n]) => `${n} ${l}`).join(' · ') : 'Márcalos en el paso 1.'}</p>
                  </div>

                  <dl className="space-y-1.5 text-sm">
                    <Linea label="Condición del inventario" valor={resumenInventario} />
                    {sinCondicion > 0 && <Linea label={`Para ${sinCondicion} sin condición`} valor={condicion} />}
                    {soloFundas && <Linea label="Marca" valor={myskin ? 'MYSKIN' : 'Apple Boss'} />}
                    <Linea label="Precio" valor="El de venta del inventario" />
                    <Linea label="En la tienda" valor={publicar === 'si' ? 'Se muestran ahora' : 'Borrador'} />
                  </dl>

                  <ErroresResumen errores={errors} />
                  {falta && sel.size > 0 && <p className="text-center text-xs font-semibold text-amber-700">{falta}</p>}

                  <button type="button" onClick={enviar} disabled={Boolean(falta) || enviando} className={buttonCls('primary', 'h-12 w-full text-[15px]')}>
                    <Tag className="h-4 w-4" /> {enviando ? 'Agregando…' : sel.size ? `Agregar ${plural(sel.size, 'producto', 'productos')}` : 'Agregar a la tienda'}
                  </button>
                  <p className="text-center text-xs leading-relaxed text-slate-400">
                    Si cambias el precio en el inventario, cambia en la tienda. Nunca se copian IMEI, costo ni procedencia.
                  </p>
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
