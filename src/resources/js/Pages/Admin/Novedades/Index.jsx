import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { CalendarClock, ExternalLink, FilePen, House, ImageOff, Newspaper, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { EmptyState, Field, Input, Modal, PageHeader, Switch, Toast, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { Aviso, ChipsEstado, ModalEliminar, Stat } from '@/Components/Admin/inventario';
import { ConsejosNovedad, DondeSeVen, EstadoNovedad, Faltantes, fechaHora, lineaFecha } from '@/Components/Admin/novedades';
import TarjetaNovedad from '@/Components/Store/TarjetaNovedad';

// Tienda online → Novedades: las publicaciones con fecha de la tienda (un equipo que llegó, una guía, un aviso).
// Se listan en /novedades y las más nuevas salen en el inicio. Acá se crean, se publican o se pasan a borrador y se
// borran; el texto y la foto se cargan adentro de cada una.

const FILTROS = [
  { key: 'todas', label: 'Todas' },
  { key: 'publicada', label: 'Publicadas' },
  { key: 'programada', label: 'Programadas' },
  { key: 'borrador', label: 'Borradores' },
  { key: 'sin_foto', label: 'Sin foto', alerta: true },
];

const normalizar = (t) => (t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function Miniatura({ imagen }) {
  return (
    <span className="relative block aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
      {imagen
        ? <img src={imagen} alt="" className="absolute inset-0 h-full w-full object-cover" />
        : <span className="absolute inset-0 grid place-items-center text-slate-300"><ImageOff className="h-5 w-5" /></span>}
    </span>
  );
}

function Fila({ n, onPublicar, onBorrar }) {
  const publicada = n.estado !== 'borrador';

  return (
    <li className={`flex flex-col gap-3 px-5 py-4 2xl:flex-row 2xl:items-center ${publicada ? '' : 'bg-slate-50/60'}`}>
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Miniatura imagen={n.imagen} />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-slate-900">
            <Link href={route('admin.novedades.edit', n.id)} className="break-words text-slate-900 hover:underline">{n.titulo}</Link>
            <EstadoNovedad estado={n.estado} />
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {lineaFecha(n)}{n.palabras > 0 ? ` · ${n.minutos} min de lectura` : ''}{n.estado !== 'borrador' && !n.indexable ? ' · Oculta en Google' : ''}
          </p>
          <p className="mt-1 line-clamp-1 text-[13px] text-slate-600">{n.resumen || 'Todavía sin texto.'}</p>
          <Faltantes lista={n.faltantes} />
        </div>
      </div>

      {/* Debajo del texto (alineados con él) hasta las pantallas muy anchas, para que el título no quede apretado */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:pl-32 2xl:shrink-0 2xl:pl-4">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
          <Switch checked={publicada} label={`${publicada ? 'Pasar a borrador' : 'Publicar'} «${n.titulo}»`} onChange={(v) => onPublicar(n, v)} />
          {n.estado === 'programada' ? 'Programada' : publicada ? 'Publicada' : 'Borrador'}
        </label>
        {n.estado === 'publicada' && (
          <a href={n.url} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
            <ExternalLink className="h-3.5 w-3.5" /> Ver
          </a>
        )}
        <Link href={route('admin.novedades.edit', n.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Link>
        <button type="button" onClick={() => onBorrar(n)} aria-label={`Borrar «${n.titulo}»`}
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function ModalNueva({ onCerrar }) {
  const { data, setData, post, processing, errors } = useForm({ titulo: '' });

  const crear = () => {
    if (processing || !data.titulo.trim()) return;
    post(route('admin.novedades.store'), { onSuccess: onCerrar });
  };

  return (
    <Modal
      title="Nueva novedad"
      onClose={onCerrar}
      footer={(
        <>
          <button type="button" onClick={onCerrar} className={buttonCls('secondary', 'h-11')}>Cancelar</button>
          <button type="button" onClick={crear} disabled={processing || !data.titulo.trim()} className={buttonCls('primary', 'h-11')}>
            {processing ? 'Creando…' : 'Crear y escribir'}
          </button>
        </>
      )}
    >
      <Field label="Título" error={errors.titulo} value={data.titulo} max={70}
        hint="Lo que se lee en el inicio, en Google y al compartirla. Por ejemplo: Llegaron los iPhone 17 Pro de 256 GB.">
        <Input value={data.titulo} maxLength={200} autoFocus placeholder="Ej.: Llegaron los iPhone 17 Pro"
          onChange={(e) => setData('titulo', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') crear(); }} />
      </Field>
      <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
        Se crea como borrador: escribes el texto y subes la foto con calma, y la publicas cuando esté lista.
      </p>
    </Modal>
  );
}

export default function Index({ novedades = [], resumen = {}, donde = {}, vistaInicio = [] }) {
  const [toast] = useToast();
  const [nueva, setNueva] = useState(false);
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [buscar, setBuscar] = useState('');

  // Si el filtro quedó vacío después de un cambio, vuelve a mostrar todas
  const conteo = useMemo(() => ({
    todas: novedades.length,
    publicada: novedades.filter((n) => n.estado === 'publicada').length,
    programada: novedades.filter((n) => n.estado === 'programada').length,
    borrador: novedades.filter((n) => n.estado === 'borrador').length,
    sin_foto: novedades.filter((n) => n.faltantes.includes('foto')).length,
  }), [novedades]);

  useEffect(() => {
    if (filtro !== 'todas' && conteo[filtro] === 0) setFiltro('todas');
  }, [conteo, filtro]);

  const texto = normalizar(buscar.trim());
  const visibles = novedades.filter((n) => (
    filtro === 'todas' || (filtro === 'sin_foto' ? n.faltantes.includes('foto') : n.estado === filtro)
  ) && (!texto || normalizar(n.titulo).includes(texto)));

  const publicar = (n, valor) => {
    router.patch(route('admin.novedades.publicacion', n.id), { publicada: valor }, { preserveScroll: true, preserveState: true });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.novedades.destroy', borrar.id), {
      preserveScroll: true,
      onFinish: () => { setBorrando(false); setBorrar(null); },
    });
  };

  const inicio = donde.inicio;
  const publicadasSinFoto = novedades.filter((n) => n.estado !== 'borrador' && n.faltantes.includes('foto'));
  const proxima = novedades.find((n) => n.estado === 'programada');

  return (
    <AdminLayout>
      <Head title="Novedades" />
      <Toast toast={toast} />
      {nueva && <ModalNueva onCerrar={() => setNueva(false)} />}

      {borrar && (
        <ModalEliminar
          titulo="Borrar novedad"
          icon={Newspaper}
          nombre={borrar.titulo}
          detalle={borrar.estado === 'borrador' ? 'Borrador' : borrar.url}
          advertencia={borrar.estado === 'borrador'
            ? 'Se borran su texto y su foto. No se puede deshacer.'
            : 'Se borran su texto y su foto, y su dirección deja de abrir: quien tenga el enlace verá «página no encontrada». No se puede deshacer; si solo quieres sacarla de la tienda, pásala a borrador.'}
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(null)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Novedades"
          subtitle="Las publicaciones con fecha de la tienda: un equipo que llegó, una guía o un aviso. Se listan en /novedades y las más nuevas salen en el inicio."
          actions={(
            <>
              <button type="button" onClick={() => setNueva(true)} className={buttonCls('primary', 'h-11 px-4')}>
                <Plus className="h-4 w-4" /> Nueva novedad
              </button>
              <a href="/novedades" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                <ExternalLink className="h-4 w-4" /> Ver en la tienda
              </a>
            </>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Newspaper} label="Publicadas" value={resumen.publicadas ?? 0} tone="emerald" hint="Se ven en /novedades" />
          <Stat icon={CalendarClock} label="Programadas" value={resumen.programadas ?? 0} tone="lila"
            hint={proxima ? `La próxima: ${fechaHora(proxima.fecha)}` : 'Ninguna en espera'} />
          <Stat icon={FilePen} label="Borradores" value={resumen.borradores ?? 0} tone="slate" hint="No se ven en la tienda" />
          <Stat icon={House} label="En el inicio" value={inicio?.en_vigor ? vistaInicio.length : 0}
            hint={!inicio ? 'Sin sección en Portada' : inicio.en_vigor ? `Sección «${inicio.titulo}»` : 'Sección apagada en Portada'} />
        </div>

        {publicadasSinFoto.length > 0 && (
          <Aviso tono="amber" icon={ImageOff} accion="Ver cuáles" onAccion={() => setFiltro('sin_foto')}>
            <span className="font-bold">
              {publicadasSinFoto.length === 1
                ? 'Una novedad publicada o programada no tiene foto'
                : `${publicadasSinFoto.length} novedades publicadas o programadas no tienen foto`}.
            </span>{' '}
            En el inicio y en /novedades se ven con el fondo de la marca.
          </Aviso>
        )}

        {(resumen.publicadas ?? 0) > 0 && !inicio?.en_vigor && (
          <Aviso tono="lila" icon={House} accion="Ir a Portada" onAccion={() => router.visit(route('admin.home-builder.index'))}>
            <span className="font-bold">La sección «Novedades» del inicio no se muestra.</span>{' '}
            Tus novedades solo se ven en /novedades.
          </Aviso>
        )}

        <AdminGuide id="novedades-tienda" title="¿Cómo funcionan las novedades?" steps={[
          'Una novedad es una publicación con fecha: un equipo que llegó, una guía de uso o un aviso de la tienda. Toca «Nueva novedad» y ponle un título: se crea como borrador.',
          'Adentro escribes el texto, subes una foto horizontal y un resumen corto. Mientras sea borrador, nadie la ve.',
          'Al publicarla sale en /novedades y, si está entre las más nuevas, en el inicio. Con una fecha futura queda programada y se publica sola a esa hora.',
        ]} tip="Desde que la publicas, su dirección ya no cambia: es el enlace que compartes. Si una novedad quedó vieja, pásala a borrador o bórrala." />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Newspaper className="h-[18px] w-[18px] text-[#585E9F]" /> Novedades
                    <span className="text-sm font-semibold text-slate-400">{novedades.length}</span>
                  </h2>
                  {novedades.length > 0 && (
                    <label className="relative block w-full sm:w-64">
                      <span className="sr-only">Buscar por título</span>
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por título"
                        className={`${inputCls} h-10 pl-9`} />
                    </label>
                  )}
                </div>
                {novedades.length > 0 && (
                  <ChipsEstado filtros={FILTROS.filter((f) => f.key === 'todas' || conteo[f.key] > 0)} activo={filtro} conteo={conteo}
                    onChange={setFiltro} etiqueta="Filtrar novedades" />
                )}
              </div>

              {novedades.length === 0 ? (
                <EmptyState
                  icon={Newspaper}
                  title="Todavía no hay ninguna novedad"
                  text="Escribe la primera: un equipo que llegó, una guía corta o un aviso de la tienda."
                  action={(
                    <button type="button" onClick={() => setNueva(true)} className={buttonCls('primary', 'h-11 px-4')}>
                      <Plus className="h-4 w-4" /> Nueva novedad
                    </button>
                  )}
                />
              ) : visibles.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">Ninguna novedad coincide con «{buscar}».</p>
              ) : (
                <ol className="divide-y divide-slate-100">
                  {visibles.map((n) => <Fila key={n.id} n={n} onPublicar={publicar} onBorrar={setBorrar} />)}
                </ol>
              )}
            </section>

            <ConsejosNovedad />
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ven en el inicio</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                {inicio?.en_vigor
                  ? `La sección «${inicio.titulo}», con las más nuevas primero.`
                  : 'La sección está apagada en Portada: así se verían si la enciendes.'}
              </p>
              {vistaInicio.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-500">
                  Todavía no hay novedades publicadas: la sección no se dibuja.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  <TarjetaNovedad novedad={vistaInicio[0]} vistaPrevia />
                  {vistaInicio.length > 1 && (
                    <p className="text-center text-xs text-slate-500">
                      {vistaInicio.length === 2 ? 'y una más al lado' : `y ${vistaInicio.length - 1} más al lado`}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Dónde se ven</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Solo las publicadas cuya fecha ya llegó.</p>
              <DondeSeVen donde={donde} />
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
