import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import {
  AlertTriangle, ChevronDown, ChevronUp, CircleCheck, ExternalLink, Eye, GripVertical, House, MapPin, Pencil, Plus,
  Star, Trash2,
} from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { Badge, PageHeader, Switch, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { Aviso, ModalEliminar, Stat } from '@/Components/Admin/inventario';
import { GuiaUbicaciones, VistaUbicaciones, faltanDatos } from '@/Components/Admin/ubicaciones';
import { lineasHorario } from '@/Components/Store/horario';
import { direccionCompleta } from '@/Components/Store/Ubicacion';

// Tienda online → Ubicaciones: los locales de la tienda, con su dirección, horario, contacto y mapa. Es el único lugar
// de esos datos. «Dónde estamos» muestra los encendidos en el orden de la lista; el primero es el principal.

function estadoDeLaSeccion(seccion, encendidas) {
  switch (seccion.estado) {
    case 'apagada': return { valor: 'Apagada', tono: 'slate', hint: 'se enciende en Portada' };
    case 'programada': return { valor: 'Programada', tono: 'lila', hint: `se muestra desde el ${seccion.fecha}` };
    case 'vencida': return { valor: 'Terminó', tono: 'slate', hint: 'su fecha ya pasó en Portada' };
    case 'no_existe': return { valor: 'No está', tono: 'slate', hint: 'la portada no tiene esta sección' };
    default: return encendidas > 0
      ? { valor: 'Se ve', tono: 'emerald', hint: '«Dónde estamos» en el inicio' }
      : { valor: 'No se ve', tono: 'slate', hint: 'no hay ubicaciones encendidas' };
  }
}

const AVISO_SECCION = {
  apagada: 'La sección «Dónde estamos» está apagada en Portada. Mientras siga así, tus locales no se ven en el inicio (el pie y Google sí usan los datos).',
  vencida: 'La fecha de la sección «Dónde estamos» ya terminó en Portada, así que no se muestra.',
  no_existe: 'La portada no tiene la sección «Dónde estamos»: tus locales no se ven en el inicio.',
};

function Fila({ u, indice, total, principal, contacto, onMover, onVisibilidad, onBorrar, arrastre }) {
  const faltan = faltanDatos(u, contacto);
  const horario = lineasHorario(u.horarios);

  return (
    <li
      draggable
      onDragStart={() => arrastre.iniciar(indice)}
      onDragEnter={() => arrastre.sobre(indice)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={arrastre.soltar}
      className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start ${u.active ? '' : 'bg-slate-50/60'}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex shrink-0 flex-col items-center pt-0.5">
          <button type="button" onClick={() => onMover(indice, indice - 1)} disabled={indice === 0} aria-label="Subir"
            className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronUp className="h-4 w-4" />
          </button>
          <GripVertical className="h-4 w-4 cursor-grab text-slate-300 active:cursor-grabbing" aria-hidden="true" />
          <button type="button" onClick={() => onMover(indice, indice + 1)} disabled={indice === total - 1} aria-label="Bajar"
            className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${u.active ? 'bg-[#011446]/[0.07] text-[#011446]' : 'bg-slate-100 text-slate-400'}`}>
          <MapPin className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-slate-900">
            {u.name}
            {principal && <Badge tone="navy"><Star className="h-3 w-3" aria-hidden="true" /> Principal</Badge>}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-500">{direccionCompleta(u.publico)}</p>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {horario.length > 0
              ? horario.join(' · ')
              : (u.hours || <span className="text-slate-400">Sin horario</span>)}
          </p>

          {faltan.length === 0 ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Datos completos
            </p>
          ) : (
            <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Falta: {faltan.map((f) => f.label.toLowerCase()).join(', ')}.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:shrink-0 lg:pl-4">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
          <Switch checked={u.active} label={`${u.active ? 'Ocultar' : 'Mostrar'} «${u.name}»`} onChange={(v) => onVisibilidad(u, v)} />
          {u.active ? 'Se ve' : 'Oculta'}
        </label>
        <Link href={route('admin.locations.edit', u.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Link>
        <button type="button" onClick={() => onBorrar(u)} aria-label={`Borrar «${u.name}»`}
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default function Index({ ubicaciones = [], seccion = {}, contacto = {} }) {
  const [toast] = useToast();
  const [items, setItems] = useState(ubicaciones);
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const desde = useRef(null);
  const hasta = useRef(null);

  // Lo que diga la base manda: al volver de guardar se sincroniza
  useEffect(() => setItems(ubicaciones), [ubicaciones]);

  const mover = (origen, destino) => {
    if (destino < 0 || destino >= items.length || origen === destino) return;
    const lista = [...items];
    const [movida] = lista.splice(origen, 1);
    lista.splice(destino, 0, movida);
    setItems(lista);
    router.post(route('admin.locations.reorder'), { orden: lista.map((u, i) => ({ id: u.id, orden: i + 1 })) },
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

  const cambiarVisibilidad = (ubicacion, valor) => {
    setItems((lista) => lista.map((u) => (u.id === ubicacion.id ? { ...u, active: valor } : u)));
    router.patch(route('admin.locations.update', ubicacion.id), { active: valor }, { preserveScroll: true, preserveState: true });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.locations.destroy', borrar.id), {
      preserveScroll: true,
      onFinish: () => { setBorrando(false); setBorrar(null); },
    });
  };

  const encendidas = items.filter((u) => u.active);
  const principal = encendidas[0] ?? null;
  const completas = encendidas.filter((u) => faltanDatos(u, contacto).length === 0).length;
  const faltanPrincipal = principal ? faltanDatos(principal, contacto) : [];
  const estado = estadoDeLaSeccion(seccion, encendidas.length);
  const irAPortada = () => router.visit(route('admin.home-builder.index'));

  return (
    <AdminLayout>
      <Head title="Ubicaciones" />
      <Toast toast={toast} />

      {borrar && (
        <ModalEliminar
          titulo="Borrar ubicación"
          icon={MapPin}
          nombre={borrar.name}
          detalle={direccionCompleta(borrar.publico)}
          advertencia={borrar.id === principal?.id && encendidas.length === 1
            ? 'Es tu único local encendido: el inicio deja de mostrar «Dónde estamos» y Google deja de recibir tu dirección. No se puede deshacer: si solo quieres sacarlo por un tiempo, usa el interruptor.'
            : 'Se borran sus datos y su mapa, y no se puede deshacer. Si solo quieres sacarlo por un tiempo, usa el interruptor.'}
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(null)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Ubicaciones"
          subtitle="Tus locales, con la dirección, el horario, el contacto y el mapa. Es el único lugar de estos datos: los usan «Dónde estamos» en el inicio, el pie de página y Google."
          actions={(
            <>
              <a href="/#contacto" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                <ExternalLink className="h-4 w-4" /> Ver en la tienda
              </a>
              <Link href={route('admin.locations.create')} className={buttonCls('primary', 'h-11 px-4')}>
                <Plus className="h-4 w-4" /> Agregar ubicación
              </Link>
            </>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Eye} label="En la tienda" value={encendidas.length} tone="navy"
            hint={items.length === encendidas.length ? (encendidas.length === 1 ? 'ubicación encendida' : 'ubicaciones encendidas') : `de ${items.length} · ${items.length - encendidas.length} ocultas`} />
          <Stat icon={Star} label="Principal" value={principal?.city ?? '—'} tone="lila"
            hint={principal ? principal.name : 'ninguna encendida'} />
          <Stat icon={CircleCheck} label="Datos completos" value={encendidas.length ? `${completas} de ${encendidas.length}` : '—'} tone={encendidas.length > 0 && completas === encendidas.length ? 'emerald' : 'slate'}
            hint="dirección, horario, contacto y mapa" />
          <Stat icon={House} label="Sección del inicio" value={estado.valor} tone={estado.tono} hint={estado.hint} />
        </div>

        <AdminGuide id="ubicaciones-tienda" title="¿Cómo funcionan las ubicaciones?" steps={[
          'Toca «Agregar ubicación» y escribe la dirección como para llegar sin preguntar: calle, número y entre qué calles.',
          'Carga el horario día por día y pega el mapa de Google con el enlace «Cómo llegar»: el formulario te muestra los pasos exactos.',
          'Si tienes más de un local, arrástralos: el primero encendido es el principal. Da la ciudad de la tienda, la dirección del pie de página y es el primero que ve el cliente.',
        ]} tip="Escribe el nombre, la dirección, el teléfono y el horario igual que en tu perfil de Google Maps: cuando coinciden, el cliente confía y Google también. El título de la sección se cambia en Portada." />

        {AVISO_SECCION[seccion.estado] && (
          <Aviso tono="amber" icon={House} accion="Ir a Portada" onAccion={irAPortada}>
            {AVISO_SECCION[seccion.estado]}
          </Aviso>
        )}

        {seccion.estado === 'programada' && (
          <Aviso tono="lila" icon={House} accion="Ir a Portada" onAccion={irAPortada}>
            La sección «Dónde estamos» está programada en Portada: se muestra desde el {seccion.fecha}.
          </Aviso>
        )}

        {items.length > 0 && encendidas.length === 0 && (
          <Aviso tono="lila" icon={MapPin}>
            <span className="font-bold">Ninguna ubicación está encendida.</span>{' '}
            El inicio no muestra «Dónde estamos», el pie solo dice la ciudad y Google no recibe tu dirección.
          </Aviso>
        )}

        {principal && faltanPrincipal.length > 0 && (
          <Aviso tono="amber" icon={AlertTriangle} accion="Completar" onAccion={() => router.visit(route('admin.locations.edit', principal.id))}>
            <span className="font-bold">A «{principal.name}» le falta: {faltanPrincipal.map((f) => f.label.toLowerCase()).join(', ')}.</span>{' '}
            Es tu local principal: con esos datos el cliente llega sin preguntar.
          </Aviso>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <MapPin className="h-[18px] w-[18px] text-[#585E9F]" /> Tus locales
                    <span className="text-sm font-semibold text-slate-400">{items.length}</span>
                  </h2>
                  <p className="mt-0.5 text-[13px] text-slate-500">En este orden salen en el inicio. El primero encendido es el principal.</p>
                </div>
                <Link href={route('admin.locations.create')} className={buttonCls('primary', 'h-10')}>
                  <Plus className="h-4 w-4" /> Agregar ubicación
                </Link>
              </div>

              {items.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <MapPin className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-800">Todavía no cargaste tu local</p>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
                    Mientras no haya ninguno, el inicio no muestra «Dónde estamos» y Google no recibe tu dirección ni tu horario.
                  </p>
                </div>
              ) : (
                <ol className="divide-y divide-slate-100">
                  {items.map((u, i) => (
                    <Fila key={u.id} u={u} indice={i} total={items.length} principal={u.id === principal?.id} contacto={contacto}
                      onMover={mover} onVisibilidad={cambiarVisibilidad} onBorrar={setBorrar} arrastre={arrastre} />
                  ))}
                </ol>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Cómo cargar un local que dé confianza</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Antes de ir, el cliente mira tres cosas: dónde queda, si está abierto y cómo llegar.</p>
              <GuiaUbicaciones />
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en el inicio</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">«Dónde estamos», con los locales encendidos.</p>
              <VistaUbicaciones locales={encendidas.map((u) => u.publico)} titulo={seccion.titulo} subtitulo={seccion.subtitulo} />
              <a href="/#contacto" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'mt-4 h-10 w-full')}>
                <ExternalLink className="h-4 w-4" /> Verlo en la tienda
              </a>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
