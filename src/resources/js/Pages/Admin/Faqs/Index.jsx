import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ChevronDown, ChevronUp, Copy, ExternalLink, GripVertical, HelpCircle, House, Pencil, Plus, Trash2 } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { Field, Input, Modal, PageHeader, Segmented, Switch, Textarea, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { Aviso, ModalEliminar, Stat } from '@/Components/Admin/inventario';
import { VistaPreguntas, iconoDe } from '@/Components/Admin/faqs';

// Tienda online → Preguntas frecuentes: lo que más te consultan, escrito una vez.
// Cada pregunta se muestra en un solo lugar de la tienda; si un lugar se queda sin preguntas, esa sección no se dibuja.

function Formulario({ lugar, pregunta, onCerrar }) {
  const editando = Boolean(pregunta);
  const { data, setData, post, patch, processing, errors } = useForm({
    scope:    lugar.clave,
    question: pregunta?.question ?? '',
    answer:   pregunta?.answer ?? '',
  });

  const guardar = () => {
    if (processing) return;
    const opciones = { preserveScroll: true, onSuccess: onCerrar };
    if (editando) patch(route('admin.faqs.update', pregunta.id), opciones);
    else post(route('admin.faqs.store'), opciones);
  };

  return (
    <Modal
      title={editando ? 'Editar pregunta' : `Nueva pregunta · ${lugar.label}`}
      onClose={onCerrar}
      footer={(
        <>
          <button type="button" onClick={onCerrar} className={buttonCls('secondary', 'h-11')}>Cancelar</button>
          <button type="button" onClick={guardar} disabled={processing || !data.question.trim() || !data.answer.trim()}
            className={buttonCls('primary', 'h-11')}>
            {processing ? 'Guardando…' : editando ? 'Guardar' : 'Agregar'}
          </button>
        </>
      )}
    >
      <div className="grid gap-4">
        <Field label="Pregunta" error={errors.question} value={data.question} max={80}
          hint="Escríbela como la diría el cliente. Por ejemplo: ¿Hacen envíos a otras ciudades?">
          <Input value={data.question} maxLength={500} autoFocus onChange={(e) => setData('question', e.target.value)} />
        </Field>
        <Field label="Respuesta" error={errors.answer} value={data.answer} max={300}
          hint="Clara y corta. Nada de promesas que no puedas cumplir: esto lo lee el cliente antes de comprar.">
          <Textarea rows={5} value={data.answer} maxLength={2000} onChange={(e) => setData('answer', e.target.value)} />
        </Field>
        {!editando && (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
            Se agrega en <span className="font-bold text-slate-800">{lugar.label}</span>: {lugar.donde}
          </p>
        )}
      </div>
    </Modal>
  );
}

function Fila({ p, indice, total, onMover, onVisibilidad, onEditar, onBorrar, arrastre }) {
  return (
    <li
      draggable
      onDragStart={() => arrastre.iniciar(indice)}
      onDragEnter={() => arrastre.sobre(indice)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={arrastre.soltar}
      className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start ${p.active ? '' : 'bg-slate-50/60'}`}
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

        <div className="min-w-0">
          <p className="text-[15px] font-bold text-slate-900">{p.question}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{p.resumen}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:shrink-0 lg:pl-4">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
          <Switch checked={p.active} label={`${p.active ? 'Ocultar' : 'Mostrar'} la pregunta`} onChange={(v) => onVisibilidad(p, v)} />
          {p.active ? 'Se ve' : 'Oculta'}
        </label>
        <button type="button" onClick={() => onEditar(p)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button type="button" onClick={() => onBorrar(p)} aria-label="Borrar la pregunta"
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default function Index({ lugares = [], preguntas = {}, bloqueInicio = true }) {
  const [toast] = useToast();
  const [clave, setClave] = useState(lugares[0]?.clave ?? 'general');
  const [items, setItems] = useState(preguntas[clave] ?? []);
  const [formulario, setFormulario] = useState(null);
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const desde = useRef(null);
  const hasta = useRef(null);

  // Lo que diga la base manda: al volver de guardar se sincroniza
  useEffect(() => setItems(preguntas[clave] ?? []), [preguntas, clave]);

  const lugar = lugares.find((l) => l.clave === clave) ?? lugares[0] ?? {};

  const mover = (origen, destino) => {
    if (destino < 0 || destino >= items.length || origen === destino) return;
    const lista = [...items];
    const [movida] = lista.splice(origen, 1);
    lista.splice(destino, 0, movida);
    setItems(lista);
    router.post(route('admin.faqs.reorder'), { orden: lista.map((p, i) => ({ id: p.id, orden: i + 1 })) },
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

  const cambiarVisibilidad = (pregunta, valor) => {
    setItems((lista) => lista.map((p) => (p.id === pregunta.id ? { ...p, active: valor } : p)));
    router.patch(route('admin.faqs.update', pregunta.id), { active: valor }, { preserveScroll: true, preserveState: true });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.faqs.destroy', borrar.id), {
      preserveScroll: true,
      onFinish: () => { setBorrando(false); setBorrar(null); },
    });
  };

  const copiarDe = (origen) => router.post(route('admin.faqs.copiar'), { desde: origen, hacia: clave }, { preserveScroll: true });

  const visibles = items.filter((p) => p.active).length;
  const Icono = iconoDe(clave);

  return (
    <AdminLayout>
      <Head title="Preguntas frecuentes" />
      <Toast toast={toast} />

      {formulario && (
        <Formulario lugar={lugar} pregunta={formulario.pregunta} onCerrar={() => setFormulario(null)} />
      )}

      {borrar && (
        <ModalEliminar
          titulo="Borrar pregunta"
          icon={HelpCircle}
          nombre={borrar.question}
          advertencia="Se borra de la tienda y no se puede deshacer. Si solo quieres sacarla por un tiempo, usa el interruptor."
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(null)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Preguntas frecuentes"
          subtitle="Lo que más te consultan antes de comprar, escrito una vez. Cada pregunta se muestra en un solo lugar de la tienda."
          actions={(
            <a href="/" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
              <ExternalLink className="h-4 w-4" /> Ver la tienda
            </a>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {lugares.map((l) => {
            const LIcono = iconoDe(l.clave);
            return (
              <button key={l.clave} type="button" onClick={() => setClave(l.clave)} className="text-left">
                <Stat
                  icon={LIcono}
                  label={l.label}
                  value={l.visibles}
                  tone={clave === l.clave ? 'navy' : 'slate'}
                  hint={l.total === l.visibles
                    ? (l.visibles === 1 ? 'pregunta en la tienda' : 'preguntas en la tienda')
                    : `de ${l.total} · ${l.total - l.visibles} ocultas`}
                />
              </button>
            );
          })}
        </div>

        <AdminGuide id="faq-tienda" title="¿Cómo funcionan las preguntas?" steps={[
          'Elige el lugar donde quieres que salga la pregunta con los botones de abajo: el final del inicio, la ficha de todos los productos, la página de iPhone o la de Seminuevos.',
          'Toca «Agregar pregunta» y escribe la pregunta tal como la hace el cliente, con una respuesta corta y clara. Arrastra para cambiar el orden: arriba van las que más te preguntan.',
          'El interruptor la esconde sin borrarla. Al costado ves cómo queda el bloque en la tienda.',
        ]} tip="Si un lugar se queda sin preguntas encendidas, esa sección no se dibuja: la tienda no muestra un título con un hueco debajo. Las mismas preguntas pueden ir en varios lugares con «Copiar de otro lugar»." />

        <Segmented
          ariaLabel="Elegir dónde se muestran las preguntas"
          value={clave}
          onChange={setClave}
          cols="grid-cols-2 sm:grid-cols-4"
          options={lugares.map((l) => ({ value: l.clave, label: l.label, icon: iconoDe(l.clave) }))}
        />

        {clave === 'general' && !bloqueInicio && (
          <Aviso tono="amber" icon={House} accion="Ir a Portada" onAccion={() => router.visit(route('admin.home-builder.index'))}>
            <span className="font-bold">La sección de preguntas del inicio está apagada en Portada.</span>{' '}
            Mientras siga apagada, estas preguntas no se ven aunque estén encendidas acá.
          </Aviso>
        )}

        {visibles === 0 && (
          <Aviso tono="lila" icon={HelpCircle} accion="Agregar pregunta" onAccion={() => setFormulario({ pregunta: null })}>
            <span className="font-bold">Este lugar no tiene ninguna pregunta encendida.</span>{' '}
            La tienda no dibuja esa sección hasta que agregues la primera.
          </Aviso>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Icono className="h-[18px] w-[18px] text-[#585E9F]" /> {lugar.label}
                  <span className="text-sm font-semibold text-slate-400">{items.length}</span>
                </h2>
                <p className="mt-0.5 text-[13px] text-slate-500">{lugar.donde}</p>
              </div>
              <button type="button" onClick={() => setFormulario({ pregunta: null })} className={buttonCls('primary', 'h-10')}>
                <Plus className="h-4 w-4" /> Agregar pregunta
              </button>
            </div>

            {items.length === 0 ? (
              <p className="px-5 py-12 text-center text-[13px] text-slate-500">
                Todavía no hay preguntas acá. Agrega la primera: lo que más te consultan por WhatsApp es un buen comienzo.
              </p>
            ) : (
              <ol className="divide-y divide-slate-100">
                {items.map((p, i) => (
                  <Fila key={p.id} p={p} indice={i} total={items.length} onMover={mover}
                    onVisibilidad={cambiarVisibilidad} onEditar={(x) => setFormulario({ pregunta: x })}
                    onBorrar={setBorrar} arrastre={arrastre} />
                ))}
              </ol>
            )}
          </section>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en la tienda</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">{lugar.donde}</p>
              <VistaPreguntas preguntas={items} />
              {lugar.url && (
                <a href={lugar.url} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'mt-4 h-10 w-full')}>
                  <ExternalLink className="h-4 w-4" /> Verlo en la tienda
                </a>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Copiar de otro lugar</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Trae las preguntas que ya escribiste en otro lugar y acá faltan. No repite las que ya están.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lugares.filter((l) => l.clave !== clave && l.visibles > 0).map((l) => (
                  <button key={l.clave} type="button" onClick={() => copiarDe(l.clave)} className={buttonCls('secondary', 'h-10')}>
                    <Copy className="h-4 w-4" /> De «{l.label}»
                  </button>
                ))}
                {lugares.filter((l) => l.clave !== clave && l.visibles > 0).length === 0 && (
                  <p className="text-[13px] text-slate-400">No hay preguntas en otros lugares todavía.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
