import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import {
  AlertOctagon, BadgeCheck, CircleAlert, ClipboardList, Download, ExternalLink, History, Image, Info, Mail, MapPin, MessageCircle,
  PackagePlus, Phone, ShoppingBag, Trash2, User,
} from 'lucide-react';
import { Badge, Field, Input, StepCard, Textarea, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { EncabezadoFormulario, ErroresResumen, ModalEliminar, Nota } from '@/Components/Admin/inventario';
import {
  AntesDeRecibir, ETAPAS, EtapaBadge, GradoBadge, ICONOS_TIPO, bs, enlaceWhatsapp, fechaHora,
} from '@/Components/Admin/tradein';

// Una solicitud de Trade-In: lo que hay que revisar, las respuestas del cliente por paso, sus fotos y el historial; al
// costado, el cliente con el mensaje de WhatsApp, el seguimiento (etapa, valor estimado y notas) y el borrado.

const TONO_NIVEL = {
  critico: { punto: 'bg-rose-500', texto: 'text-rose-700', caja: 'border-rose-200 bg-rose-50' },
  revisar: { punto: 'bg-amber-500', texto: 'text-amber-800', caja: 'border-amber-200 bg-amber-50' },
  info: { punto: 'bg-slate-400', texto: 'text-slate-600', caja: 'border-slate-200 bg-slate-50' },
  ok: { punto: 'bg-emerald-500', texto: 'text-slate-800', caja: '' },
};

const EXPLICACION_GRADO = {
  como_nuevo: 'Sin rayas ni fallas declaradas y con buena batería.',
  muy_bueno: 'Marcas leves o batería entre 80 y 89 %.',
  bueno: 'Rayas o golpes visibles, o batería bajo 80 %.',
  detalles: 'Algo falla o tiene una rotura.',
  revisar: 'Tiene un bloqueo, bypass, reporte o reparación de placa: revísalo antes de dar un valor.',
};

function lineaHistorial(h, etapas) {
  const quien = h.usuario ?? 'Alguien';
  const etapa = (v) => etapas.find((e) => e.valor === v)?.label ?? v;
  switch (h.tipo) {
    case 'recibida': return 'Llegó desde el formulario de /trade-in.';
    case 'etapa': return `${quien} la pasó a «${etapa(h.a)}».`;
    case 'valor': return h.valor ? `${quien} puso el valor estimado en ${bs(h.valor)}.` : `${quien} quitó el valor estimado.`;
    case 'whatsapp': return `${quien} le escribió por WhatsApp.`;
    default: return h.tipo;
  }
}

function Dato({ label, children }) {
  if (!children) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-slate-900">{children}</dd>
    </div>
  );
}

function Formulario({ solicitud: s, etapas, grados }) {
  const [borrar, setBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [mensaje, setMensaje] = useState(s.mensaje);

  const { data, setData, patch, processing, errors, isDirty } = useForm({
    estado: s.estado,
    valor_estimado: s.valor_estimado ?? '',
    nota_estimacion: s.nota_estimacion ?? '',
    notas_internas: s.notas_internas ?? '',
  });

  useEffect(() => {
    if (!isDirty) return undefined;
    const avisar = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [isDirty]);

  const guardar = () => {
    if (processing) return;
    patch(route('admin.trade-in.update', s.id), { preserveScroll: true });
  };

  const escribir = () => router.post(route('admin.trade-in.contacto', s.id), {}, { preserveScroll: true });

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.trade-in.destroy', s.id), { onFinish: () => setBorrando(false) });
  };

  const Icono = ICONOS_TIPO[s.tipo] ?? ShoppingBag;
  const criticas = s.alertas.filter((a) => a.nivel === 'critico');
  const aRevisar = s.alertas.filter((a) => a.nivel === 'revisar');
  const sinProbar = s.alertas.filter((a) => a.nivel === 'info');

  return (
    <>
      {borrar && (
        <ModalEliminar
          titulo="Borrar solicitud"
          icon={Trash2}
          nombre={`${s.codigo} · ${s.dispositivo || s.tipo}`}
          detalle={s.cliente}
          advertencia="Se borran los datos del cliente, sus respuestas, sus fotos y el aviso del Resumen. No se puede deshacer. Úsalo para solicitudes falsas o si el cliente pide que borres sus datos; si solo no siguió, márcala «Cerrada sin acuerdo»."
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(false)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EncabezadoFormulario
            volverUrl={route('admin.trade-in.index')}
            volverLabel="Volver a Trade-In"
            titulo={s.dispositivo || s.tipo}
            subtitulo={`${s.codigo} · llegó el ${fechaHora(s.creada)}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <EtapaBadge estado={s.estado} etapas={etapas} />
            {s.ficha && (
              <a href={s.ficha} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-10')}>
                <ExternalLink className="h-4 w-4" /> Ficha del modelo
              </a>
            )}
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-5">
            {/* Lo que hay que revisar */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <ClipboardList className="h-[18px] w-[18px] text-[#585E9F]" /> Antes de cotizar
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Sale de lo que declaró el cliente: el valor final lo da la revisión del equipo.</p>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Grado sugerido:</span>
                <GradoBadge grado={s.grado} grados={grados} />
                {EXPLICACION_GRADO[s.grado]}
              </p>

              {s.alertas.length === 0 ? (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  <BadgeCheck className="h-4 w-4" /> Sin puntos a revisar según lo que declaró.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    ['Puede que no se reciba', criticas, 'critico', AlertOctagon],
                    ['Baja el valor o hay que confirmarlo', aRevisar, 'revisar', CircleAlert],
                    ['No lo probó', sinProbar, 'info', Info],
                  ].filter(([, lista]) => lista.length > 0).map(([titulo, lista, nivel, IconoNivel]) => (
                    <div key={nivel} className={`rounded-xl border p-3.5 ${TONO_NIVEL[nivel].caja}`}>
                      <p className={`flex items-center gap-1.5 text-xs font-bold ${TONO_NIVEL[nivel].texto}`}><IconoNivel className="h-3.5 w-3.5" /> {titulo}</p>
                      <ul className="mt-2 space-y-1">
                        {lista.map((a) => <li key={a.texto} className="text-[13px] leading-snug text-slate-800">{a.texto}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* El equipo */}
            <StepCard icon={Icono} title="El equipo" subtitle={s.tipo}>
              <dl className="grid gap-4 sm:grid-cols-3">
                <Dato label="Marca">{s.marca}</Dato>
                <Dato label="Modelo">{s.modelo}</Dato>
                <Dato label="Almacenamiento">{s.capacidad}</Dato>
                <Dato label="Memoria">{s.memoria}</Dato>
                {/* Lo propio del tipo, como el procesador y la tarjeta gráfica de una computadora */}
                {s.resumen.filter((paso) => paso.id === 'equipo').flatMap((paso) => paso.filas).map((f) => (
                  <Dato key={f.pregunta} label={f.pregunta}>{f.respuesta}</Dato>
                ))}
                <Dato label="Color">{s.color}</Dato>
                <Dato label="Fotos">{s.fotos.length ? `${s.fotos.length}` : 'Sin fotos'}</Dato>
              </dl>
            </StepCard>

            {/* Respuestas por paso */}
            {s.resumen.filter((paso) => paso.id !== 'equipo').map((paso) => (
              <StepCard key={paso.id} icon={ClipboardList} title={paso.titulo}>
                <ul className="divide-y divide-slate-100">
                  {paso.filas.map((f) => (
                    <li key={f.pregunta} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <span className="text-[13px] text-slate-500">{f.pregunta}</span>
                      <span className={`flex items-center gap-2 text-sm font-semibold sm:text-right ${TONO_NIVEL[f.nivel ?? 'ok']?.texto ?? 'text-slate-900'}`}>
                        {f.nivel && <span className={`h-2 w-2 shrink-0 rounded-full ${TONO_NIVEL[f.nivel].punto}`} aria-hidden="true" />}
                        {f.respuesta}
                      </span>
                    </li>
                  ))}
                </ul>
              </StepCard>
            ))}

            {s.observaciones && (
              <StepCard icon={MessageCircle} title="Lo que agregó el cliente">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{s.observaciones}</p>
              </StepCard>
            )}

            <StepCard icon={Image} title="Fotos" subtitle={s.fotos.length ? 'Solo se ven desde el panel.' : 'El cliente no subió fotos: pídeselas por WhatsApp si hace falta.'}>
              {s.fotos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {s.fotos.map((f, i) => (
                    <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer"
                      className="group relative block aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {f.imagen ? (
                        <img src={f.url} alt={`Foto ${i + 1} de ${s.codigo}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                      ) : (
                        <span className="grid h-full w-full place-items-center p-3 text-center text-xs font-semibold text-slate-500">
                          <span><Download className="mx-auto mb-1 h-5 w-5" />{f.nombre}<br />(HEIC: se descarga)</span>
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </StepCard>

            <StepCard icon={History} title="Historial">
              <ol className="space-y-3 border-l-2 border-slate-100 pl-4">
                {[...s.historial].reverse().map((h, i) => (
                  <li key={`${h.fecha}-${i}`} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#585E9F]" aria-hidden="true" />
                    <p className="text-sm text-slate-800">{lineaHistorial(h, etapas)}</p>
                    <p className="text-xs text-slate-400">{fechaHora(h.fecha)}</p>
                  </li>
                ))}
              </ol>
            </StepCard>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            {/* El cliente */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><User className="h-[18px] w-[18px] text-[#585E9F]" /> {s.cliente}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><a href={`tel:${s.telefono}`} className="hover:underline">{s.telefono}</a></li>
                {s.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><a href={`mailto:${s.email}`} className="break-all hover:underline">{s.email}</a></li>}
                {s.ciudad && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{s.ciudad}</li>}
                {s.interes && <li className="flex items-start gap-2"><ShoppingBag className="mt-0.5 h-4 w-4 text-slate-400" /><span>Quiere llevar: <span className="font-semibold">{s.interes}</span></span></li>}
              </ul>

              {s.whatsapp ? (
                <div className="mt-4">
                  <Field label="Mensaje de WhatsApp" hint="Se arma con el código y, si ya guardaste un valor, con el valor estimado y tu nota. Puedes cambiarlo antes de abrir WhatsApp.">
                    <Textarea rows={5} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
                  </Field>
                  <a href={enlaceWhatsapp(s.whatsapp, mensaje)} target="_blank" rel="noopener noreferrer" onClick={escribir}
                    className={buttonCls('success', 'mt-3 h-11 w-full')}>
                    <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
                  </a>
                </div>
              ) : (
                <Nota tono="amber">El número no parece de WhatsApp (un celular boliviano tiene 8 dígitos y empieza con 6 o 7). Llámalo.</Nota>
              )}
            </section>

            {/* Seguimiento */}
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-bold text-slate-900">Seguimiento</h2>
                {s.atendida_por && <p className="mt-0.5 text-xs text-slate-500">La atiende {s.atendida_por}.</p>}
              </div>
              <div className="space-y-4 p-5">
                <div role="radiogroup" aria-label="Etapa" className="grid gap-1.5">
                  {etapas.map((e) => {
                    const elegida = data.estado === e.valor;
                    return (
                      <button key={e.valor} type="button" role="radio" aria-checked={elegida} onClick={() => setData('estado', e.valor)}
                        className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${elegida ? 'border-[#011446] bg-[#011446]/[0.04]' : 'border-slate-200 hover:border-slate-300'}`}>
                        <span className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${elegida ? 'border-[#011446] bg-[#011446]' : 'border-slate-300'}`} aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900">{e.label}</span>
                          <span className="block text-xs text-slate-500">{ETAPAS[e.valor]?.ayuda}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.estado && <p className="text-xs font-semibold text-red-600">{errors.estado}</p>}

                <Field label="Valor estimado (Bs)" error={errors.valor_estimado} hint="No se muestra en la tienda: se lo mandas por WhatsApp.">
                  <Input type="number" min="0" step="0.01" inputMode="decimal" value={data.valor_estimado} placeholder="Ej.: 2800"
                    onChange={(e) => setData('valor_estimado', e.target.value)} />
                </Field>
                <Field label="Nota para el cliente" error={errors.nota_estimacion} value={data.nota_estimacion} max={200}
                  hint="Va al final del mensaje de WhatsApp. Ej.: Si la batería está sobre 85 %, sube a Bs 3.000.">
                  <Textarea rows={2} maxLength={500} value={data.nota_estimacion} onChange={(e) => setData('nota_estimacion', e.target.value)} />
                </Field>
                <Field label="Notas internas" error={errors.notas_internas} hint="Solo para el equipo: nunca salen del panel.">
                  <Textarea rows={3} maxLength={2000} value={data.notas_internas} onChange={(e) => setData('notas_internas', e.target.value)} />
                </Field>

                <ErroresResumen errores={errors} />
                {isDirty && <p className="text-center text-xs font-semibold text-amber-700">Tienes cambios sin guardar.</p>}
                <button type="button" onClick={guardar} disabled={processing || !isDirty} className={buttonCls('primary', 'h-12 w-full text-[15px]')}>
                  {processing ? 'Guardando…' : 'Guardar seguimiento'}
                </button>
              </div>
            </section>

            {s.inventario && ['aceptado', 'completado'].includes(s.estado) && (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <h2 className="text-base font-bold text-slate-900">Registrar el equipo</h2>
                <p className="mt-0.5 text-[13px] text-slate-500">Cuando lo recibas, cárgalo en {s.inventario.modulo} para venderlo.</p>
                <a href={s.inventario.url} className={buttonCls('secondary', 'mt-3 h-10 w-full')}>
                  <PackagePlus className="h-4 w-4" /> Ir a {s.inventario.modulo}
                </a>
              </section>
            )}

            {['iPhone', 'iPad'].includes(s.tipo) && <AntesDeRecibir />}

            <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Borrar la solicitud</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Para solicitudes falsas o si el cliente pide que borres sus datos.</p>
              <button type="button" onClick={() => setBorrar(true)} className={buttonCls('danger', 'mt-3 h-10 w-full')}>
                <Trash2 className="h-4 w-4" /> Borrar solicitud
              </button>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}

export default function Show({ solicitud, etapas = [], grados = {} }) {
  const [toast] = useToast();

  return (
    <AdminLayout>
      <Head title={`${solicitud.codigo} · Trade-In`} />
      <Toast toast={toast} />
      {/* Al guardar, el formulario vuelve a arrancar con lo que quedó en la base (y el mensaje de WhatsApp con el valor nuevo) */}
      <Formulario key={solicitud.version} solicitud={solicitud} etapas={etapas} grados={grados} />
    </AdminLayout>
  );
}
