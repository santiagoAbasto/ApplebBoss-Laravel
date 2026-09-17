import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import {
  AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Eye, EyeOff, GripVertical, House, MessageCircle,
  MousePointerClick, Pencil, Plus, Trash2, Wrench,
} from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import LinkPicker, { nombreDestino, usePaginasDestino } from '@/Components/Admin/LinkPicker';
import { Badge, Field, Input, Modal, PageHeader, Switch, Textarea, Toast, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { Aviso, ModalEliminar, Nota, Stat } from '@/Components/Admin/inventario';
import { GuiaEscritura, SelectorAccion, SelectorIcono, VistaServicios, accionDe, paraVista } from '@/Components/Admin/servicios';
import { ServiceIcon } from '@/Components/Store/Icons';
import TarjetaServicio from '@/Components/Store/TarjetaServicio';

// Tienda online → Servicios: las tarjetas de «Nuestros servicios» del inicio. Cada una puede solo informar, abrir
// WhatsApp con un mensaje sobre ese servicio o llevar a una página. La sección se enciende y se titula en Portada.

const BOTON_POR_DEFECTO = { whatsapp: 'Consultar por WhatsApp', enlace: 'Ver más' };

/** Cómo está la sección del inicio, en palabras: sale de Portada y de si hay tarjetas encendidas. */
function estadoDeLaSeccion(seccion, visibles) {
  switch (seccion.estado) {
    case 'apagada': return { valor: 'Apagada', tono: 'slate', hint: 'se enciende en Portada' };
    case 'programada': return { valor: 'Programada', tono: 'lila', hint: `se muestra desde el ${seccion.fecha}` };
    case 'vencida': return { valor: 'Terminó', tono: 'slate', hint: 'su fecha ya pasó en Portada' };
    case 'no_existe': return { valor: 'No está', tono: 'slate', hint: 'la portada no tiene esta sección' };
    default: return visibles > 0
      ? { valor: 'Se ve', tono: 'emerald', hint: `«${seccion.titulo}» en el inicio` }
      : { valor: 'No se ve', tono: 'slate', hint: 'no hay tarjetas encendidas' };
  }
}

const AVISO_SECCION = {
  apagada: 'La sección «Servicios» está apagada en Portada. Mientras siga así, estas tarjetas no se ven aunque estén encendidas acá.',
  vencida: 'La fecha de la sección «Servicios» ya terminó en Portada, así que no se muestra.',
  no_existe: 'La portada no tiene la sección «Servicios»: estas tarjetas no se ven en ningún lado.',
};

function Formulario({ servicio, whatsapp, saludo, onCerrar }) {
  const editando = Boolean(servicio);
  const { data, setData, post, patch, processing, errors } = useForm({
    icon: servicio?.icon ?? 'wrench',
    title: servicio?.title ?? '',
    description: servicio?.description ?? '',
    accion: servicio?.accion ?? 'ninguna',
    enlace: servicio?.enlace ?? '',
    boton: servicio?.boton ?? '',
  });

  const porDefecto = BOTON_POR_DEFECTO[data.accion];
  const faltaEnlace = data.accion === 'enlace' && !data.enlace;

  const guardar = () => {
    if (processing) return;
    const opciones = { preserveScroll: true, onSuccess: onCerrar };
    if (editando) patch(route('admin.services.update', servicio.id), opciones);
    else post(route('admin.services.store'), opciones);
  };

  return (
    <Modal
      wide
      title={editando ? 'Editar servicio' : 'Nuevo servicio'}
      onClose={onCerrar}
      footer={(
        <>
          <button type="button" onClick={onCerrar} className={buttonCls('secondary', 'h-11')}>Cancelar</button>
          <button type="button" onClick={guardar} disabled={processing || !data.title.trim() || faltaEnlace}
            className={buttonCls('primary', 'h-11')}>
            {processing ? 'Guardando…' : editando ? 'Guardar' : 'Agregar'}
          </button>
        </>
      )}
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="grid content-start gap-4">
          <Field label="Ícono" error={errors.icon}>
            <SelectorIcono valor={data.icon} onChange={(v) => setData('icon', v)} />
          </Field>

          <Field label="Título" error={errors.title} value={data.title} max={30}
            hint="Lo que ofreces en pocas palabras. Por ejemplo: Diagnóstico sin costo.">
            <Input value={data.title} maxLength={120} autoFocus onChange={(e) => setData('title', e.target.value)} />
          </Field>

          <Field label="Descripción" error={errors.description} value={data.description} max={110}
            hint="Una frase con lo que gana el cliente. Es opcional, pero ayuda a entender el servicio.">
            <Textarea rows={3} value={data.description} maxLength={300} onChange={(e) => setData('description', e.target.value)} />
          </Field>

          <Field label="Cuando el cliente toca la tarjeta" error={errors.accion}>
            <SelectorAccion valor={data.accion} onChange={(v) => setData('accion', v)} />
          </Field>

          {data.accion === 'whatsapp' && (whatsapp ? (
            <Nota>
              Se abre WhatsApp con este mensaje: «{saludo} quiero consultar por: {data.title.trim() || 'el nombre del servicio'}».
            </Nota>
          ) : (
            <Nota tono="amber">
              El WhatsApp de la tienda está apagado en Configuración de la tienda: la tarjeta se va a ver sin este botón hasta que lo actives.
            </Nota>
          ))}

          {data.accion === 'enlace' && (
            <Field label="¿A dónde lleva?" error={errors.enlace}
              hint="Una página de la tienda, una colección, una página informativa o pega otra dirección.">
              <LinkPicker value={data.enlace ?? ''} onChange={(v) => setData('enlace', v)} className={`${inputCls} h-11`} />
            </Field>
          )}

          {porDefecto && (
            <Field label="Texto del botón" error={errors.boton} value={data.boton} max={24}
              hint={`Si lo dejas vacío, dice «${porDefecto}».`}>
              <Input value={data.boton ?? ''} maxLength={40} placeholder={porDefecto} onChange={(e) => setData('boton', e.target.value)} />
            </Field>
          )}
        </div>

        <div className="self-start md:sticky md:top-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Así queda en la tienda</p>
          <div className="mt-1.5 rounded-xl bg-[#F5F5F7] p-3">
            <TarjetaServicio vistaPrevia servicio={paraVista({ ...data, title: data.title.trim() || 'Nombre del servicio' }, whatsapp)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Fila({ s, indice, total, extras, onMover, onVisibilidad, onEditar, onBorrar, arrastre }) {
  const accion = accionDe(s.accion);

  return (
    <li
      draggable
      onDragStart={() => arrastre.iniciar(indice)}
      onDragEnter={() => arrastre.sobre(indice)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={arrastre.soltar}
      className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start ${s.active ? '' : 'bg-slate-50/60'}`}
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

        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${s.active ? 'bg-[#011446]/[0.07] text-[#011446]' : 'bg-slate-100 text-slate-400'}`}>
          <ServiceIcon name={s.icon} className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-[15px] font-bold text-slate-900">{s.title}</p>
          {s.description
            ? <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{s.description}</p>
            : <p className="mt-0.5 text-[13px] text-slate-400">Sin descripción: la tarjeta muestra solo el título.</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <Badge tone={accion.tono}><accion.Icon className="h-3 w-3" aria-hidden="true" /> {accion.label}</Badge>
            {s.accion === 'enlace' && s.enlace && (
              <span className="min-w-0 truncate">a {nombreDestino(s.enlace, extras)}</span>
            )}
            {s.accion !== 'ninguna' && s.texto_boton && <span>· botón «{s.texto_boton}»</span>}
          </div>

          {s.aviso && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {s.aviso}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:shrink-0 lg:pl-4">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
          <Switch checked={s.active} label={`${s.active ? 'Ocultar' : 'Mostrar'} «${s.title}»`} onChange={(v) => onVisibilidad(s, v)} />
          {s.active ? 'Se ve' : 'Oculto'}
        </label>
        <button type="button" onClick={() => onEditar(s)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button type="button" onClick={() => onBorrar(s)} aria-label={`Borrar «${s.title}»`}
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default function Index({ servicios = [], seccion = {}, whatsapp = false, saludo = 'Hola,', colecciones = [] }) {
  const [toast] = useToast();
  const [items, setItems] = useState(servicios);
  const [formulario, setFormulario] = useState(null);
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const desde = useRef(null);
  const hasta = useRef(null);
  const paginas = usePaginasDestino();

  // Lo que diga la base manda: al volver de guardar se sincroniza
  useEffect(() => setItems(servicios), [servicios]);

  const extras = [...colecciones.map((c) => [c.url, c.nombre]), ...paginas];

  const mover = (origen, destino) => {
    if (destino < 0 || destino >= items.length || origen === destino) return;
    const lista = [...items];
    const [movido] = lista.splice(origen, 1);
    lista.splice(destino, 0, movido);
    setItems(lista);
    router.post(route('admin.services.reorder'), { orden: lista.map((s, i) => ({ id: s.id, orden: i + 1 })) },
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

  const cambiarVisibilidad = (servicio, valor) => {
    setItems((lista) => lista.map((s) => (s.id === servicio.id ? { ...s, active: valor } : s)));
    router.patch(route('admin.services.update', servicio.id), { active: valor }, { preserveScroll: true, preserveState: true });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.services.destroy', borrar.id), {
      preserveScroll: true,
      onFinish: () => { setBorrando(false); setBorrar(null); },
    });
  };

  const encendidos = items.filter((s) => s.active);
  const visibles = encendidos.length;
  const ocultos = items.length - visibles;
  const conBoton = encendidos.filter((s) => paraVista(s, whatsapp).boton).length;
  const sinWhatsapp = whatsapp ? 0 : encendidos.filter((s) => s.accion === 'whatsapp').length;
  const estado = estadoDeLaSeccion(seccion, visibles);
  const irAPortada = () => router.visit(route('admin.home-builder.index'));

  return (
    <AdminLayout>
      <Head title="Servicios" />
      <Toast toast={toast} />

      {formulario && (
        <Formulario servicio={formulario.servicio} whatsapp={whatsapp} saludo={saludo} onCerrar={() => setFormulario(null)} />
      )}

      {borrar && (
        <ModalEliminar
          titulo="Borrar servicio"
          icon={Wrench}
          nombre={borrar.title}
          advertencia="Se borra la tarjeta del inicio y no se puede deshacer. Si solo quieres sacarla por un tiempo, usa el interruptor."
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(null)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Servicios"
          subtitle="Las tarjetas de «Nuestros servicios» del inicio: lo que ofreces además de vender equipos. Cada una puede solo informar, abrir WhatsApp o llevar a una página."
          actions={(
            <a href="/#servicios" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
              <ExternalLink className="h-4 w-4" /> Ver en la tienda
            </a>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Eye} label="En la tienda" value={visibles} tone="navy"
            hint={visibles === 1 ? 'tarjeta encendida' : 'tarjetas encendidas'} />
          <Stat icon={EyeOff} label="Ocultos" value={ocultos} tone="slate"
            hint={ocultos === 0 ? 'ninguno escondido' : 'guardados, pero no se ven'} />
          <Stat icon={MousePointerClick} label="Con botón" value={conBoton} tone="lila"
            hint="abren WhatsApp o una página" />
          <Stat icon={House} label="Sección del inicio" value={estado.valor} tone={estado.tono} hint={estado.hint} />
        </div>

        <AdminGuide id="servicios-tienda" title="¿Cómo funcionan los servicios?" steps={[
          'Toca «Agregar servicio», elige un ícono y escribe qué ofreces: un título corto que se entienda solo y una frase con lo que gana el cliente.',
          'Elige qué pasa cuando el cliente toca la tarjeta: solo informa, abre WhatsApp con un mensaje sobre ese servicio o lo lleva a una página, como Trade-In o Garantía.',
          'Ordénalos arrastrando: así salen en el inicio. El interruptor oculta uno sin borrarlo y al costado ves la sección tal como la ve el cliente.',
        ]} tip="El título de la sección y su lugar en el inicio se cambian en Portada. Sin tarjetas encendidas la sección no se dibuja. Esto no es «Servicio técnico»: ahí se cargan las órdenes de reparación; acá, lo que lee el cliente." />

        {AVISO_SECCION[seccion.estado] && (
          <Aviso tono="amber" icon={House} accion="Ir a Portada" onAccion={irAPortada}>
            {AVISO_SECCION[seccion.estado]}
          </Aviso>
        )}

        {seccion.estado === 'programada' && (
          <Aviso tono="lila" icon={House} accion="Ir a Portada" onAccion={irAPortada}>
            La sección «Servicios» está programada en Portada: se muestra desde el {seccion.fecha}.
          </Aviso>
        )}

        {items.length > 0 && visibles === 0 && (
          <Aviso tono="lila" icon={EyeOff} accion="Agregar servicio" onAccion={() => setFormulario({ servicio: null })}>
            <span className="font-bold">Ningún servicio está encendido.</span>{' '}
            La tienda no dibuja la sección hasta que enciendas o agregues uno.
          </Aviso>
        )}

        {sinWhatsapp > 0 && (
          <Aviso tono="amber" icon={MessageCircle} accion="Ir a Configuración"
            onAccion={() => router.visit(route('admin.configuracion.tienda.edit'))}>
            <span className="font-bold">El WhatsApp de la tienda está apagado.</span>{' '}
            {sinWhatsapp === 1
              ? 'Una tarjeta con botón de WhatsApp se ve sin su botón.'
              : `${sinWhatsapp} tarjetas con botón de WhatsApp se ven sin su botón.`}
          </Aviso>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Wrench className="h-[18px] w-[18px] text-[#585E9F]" /> Tus servicios
                    <span className="text-sm font-semibold text-slate-400">{items.length}</span>
                  </h2>
                  <p className="mt-0.5 text-[13px] text-slate-500">En este orden salen en el inicio.</p>
                </div>
                <button type="button" onClick={() => setFormulario({ servicio: null })} className={buttonCls('primary', 'h-10')}>
                  <Plus className="h-4 w-4" /> Agregar servicio
                </button>
              </div>

              {items.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <Wrench className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-800">Todavía no hay servicios</p>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
                    Empieza por lo que más te consultan: diagnóstico, envíos, Trade-In. Mientras no haya ninguno, la
                    sección no se muestra en el inicio.
                  </p>
                </div>
              ) : (
                <ol className="divide-y divide-slate-100">
                  {items.map((s, i) => (
                    <Fila key={s.id} s={s} indice={i} total={items.length} extras={extras} onMover={mover}
                      onVisibilidad={cambiarVisibilidad} onEditar={(x) => setFormulario({ servicio: x })}
                      onBorrar={setBorrar} arrastre={arrastre} />
                  ))}
                </ol>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Cómo escribir un buen servicio</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">El cliente lee estas tarjetas de pasada, antes de decidir si te escribe.</p>
              <GuiaEscritura />
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en el inicio</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Las tarjetas encendidas, con el botón que ve el cliente.</p>
              <VistaServicios servicios={items} titulo={seccion.titulo ?? 'Nuestros servicios'} subtitulo={seccion.subtitulo} whatsapp={whatsapp} />
              <a href="/#servicios" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'mt-4 h-10 w-full')}>
                <ExternalLink className="h-4 w-4" /> Verlo en la tienda
              </a>
            </section>

          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
