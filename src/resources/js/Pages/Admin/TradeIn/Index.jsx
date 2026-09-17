import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { CalendarPlus, CheckCircle2, Clock, ExternalLink, Eye, Handshake, Image, MessageCircle, Repeat, Search } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { Badge, EmptyState, PageHeader, Paginador, Toast, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { Aviso, ChipsEstado, Stat, paginar } from '@/Components/Admin/inventario';
import {
  AntesDeRecibir, ConsejosTradeIn, DondeSeLlega, EtapaBadge, GradoBadge, ICONOS_TIPO, bs, enlaceWhatsapp,
} from '@/Components/Admin/tradein';

// Tienda online → Trade-In: las solicitudes que llegan desde /trade-in, con lo que declaró el cliente, sus fotos y un
// grado sugerido. Acá se le escribe por WhatsApp y se sigue cada una hasta recibir el equipo o cerrar sin acuerdo.

const normalizar = (t) => (t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const POR_PAGINA = 25;

function Fila({ s, etapas, grados, horasDemora }) {
  const Icono = ICONOS_TIPO[s.tipo] ?? Repeat;

  const escribir = () => router.post(route('admin.trade-in.contacto', s.id), {}, { preserveScroll: true, preserveState: true });

  return (
    <li className={`flex flex-col gap-3 px-5 py-4 2xl:flex-row 2xl:items-center ${s.abierta ? '' : 'bg-slate-50/60'}`}>
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#585E9F]"><Icono className="h-5 w-5" /></span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <Link href={route('admin.trade-in.show', s.id)} className="break-words text-[15px] font-bold text-slate-900 hover:underline">
              {s.dispositivo || s.tipo}
            </Link>
            <EtapaBadge estado={s.estado} etapas={etapas} />
            <GradoBadge grado={s.grado} grados={grados} />
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-mono text-slate-600">{s.codigo}</span> · {s.cliente} · {s.telefono} · llegó {s.creada_hace}
            {s.atendida_por ? ` · atiende ${s.atendida_por}` : ''}
          </p>
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {s.demorada && <Badge tone="amber"><Clock className="h-3 w-3" /> Sin responder hace más de {horasDemora} h</Badge>}
            {s.criticas.map((texto) => <Badge key={texto} tone="rose">{texto}</Badge>)}
            {s.a_revisar > 0 && <Badge tone="amber">{s.a_revisar} {s.a_revisar === 1 ? 'punto' : 'puntos'} a revisar</Badge>}
            {s.fotos_total > 0 && <Badge tone="slate"><Image className="h-3 w-3" /> {s.fotos_total} {s.fotos_total === 1 ? 'foto' : 'fotos'}</Badge>}
            {s.valor ? <Badge tone="navy">Valor estimado {bs(s.valor)}</Badge> : null}
          </p>
        </div>
      </div>

      {/* Debajo del texto hasta las pantallas muy anchas, para que el equipo y las marcas no queden apretados */}
      <div className="flex flex-wrap items-center gap-2 sm:pl-[60px] 2xl:shrink-0 2xl:pl-4">
        {s.whatsapp && s.abierta && (
          <a href={enlaceWhatsapp(s.whatsapp, s.mensaje)} target="_blank" rel="noopener noreferrer" onClick={escribir}
            className={buttonCls('success', 'h-9 px-3 text-xs')}>
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        )}
        <Link href={route('admin.trade-in.show', s.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Eye className="h-3.5 w-3.5" /> Ver solicitud
        </Link>
      </div>
    </li>
  );
}

export default function Index({ solicitudes = [], resumen = {}, etapas = [], grados = {}, donde = {}, horasDemora = 24 }) {
  const [toast] = useToast();
  const [filtro, setFiltro] = useState('abiertas');
  const [buscar, setBuscar] = useState('');
  const [pagina, setPagina] = useState(1);

  const porEstado = resumen.por_estado ?? {};
  const abiertas = solicitudes.filter((s) => s.abierta).length;

  const filtros = useMemo(() => [
    { key: 'abiertas', label: 'En curso' },
    ...etapas.filter((e) => (porEstado[e.valor] ?? 0) > 0).map((e) => ({ key: e.valor, label: e.label, alerta: e.valor === 'nuevo' })),
    { key: 'todas', label: 'Todas' },
  ], [etapas, porEstado]);

  const conteo = { abiertas, todas: solicitudes.length, ...porEstado };

  useEffect(() => { setPagina(1); }, [filtro, buscar]);

  const texto = normalizar(buscar.trim());
  const filtradas = solicitudes.filter((s) => (
    filtro === 'todas' || (filtro === 'abiertas' ? s.abierta : s.estado === filtro)
  ) && (!texto || [s.codigo, s.cliente, s.dispositivo, s.telefono].some((v) => normalizar(v).includes(texto))));
  const { visibles, meta } = paginar(filtradas, pagina, POR_PAGINA);

  const enCurso = abiertas - (porEstado.nuevo ?? 0);

  return (
    <AdminLayout>
      <Head title="Trade-In" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Trade-In"
          subtitle="Las solicitudes de clientes que quieren entregar su equipo como parte de pago. Llegan desde /trade-in con lo que declaró el cliente, sus fotos y un grado sugerido."
          actions={(
            <a href="/trade-in" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
              <ExternalLink className="h-4 w-4" /> Ver el formulario
            </a>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Clock} label="Nuevas" value={porEstado.nuevo ?? 0} tone="lila"
            hint={resumen.demoradas ? `${resumen.demoradas} sin responder hace más de ${horasDemora} h` : 'Sin demoras'} />
          <Stat icon={Handshake} label="En curso" value={enCurso} tone="navy" hint="Esperando, en conversación, en revisión o cotizadas" />
          <Stat icon={CheckCircle2} label="Completadas este mes" value={resumen.completadas_mes ?? 0} tone="emerald"
            hint={`${porEstado.completado ?? 0} en total`} />
          <Stat icon={CalendarPlus} label="Llegaron este mes" value={resumen.llegadas_mes ?? 0} tone="slate" hint="Desde el formulario de /trade-in" />
        </div>

        {resumen.demoradas > 0 && (
          <Aviso tono="amber" icon={Clock} accion="Ver cuáles" onAccion={() => setFiltro('nuevo')}>
            <span className="font-bold">
              {resumen.demoradas === 1 ? 'Una solicitud nueva lleva' : `${resumen.demoradas} solicitudes nuevas llevan`} más de {horasDemora} h sin respuesta.
            </span>{' '}
            El cliente puede estar cotizando en otro lado.
          </Aviso>
        )}

        {(porEstado.aceptado ?? 0) > 0 && (
          <Aviso tono="lila" icon={Handshake} accion="Ver cuáles" onAccion={() => setFiltro('aceptado')}>
            <span className="font-bold">
              {porEstado.aceptado === 1 ? 'Un cliente aceptó el valor' : `${porEstado.aceptado} clientes aceptaron el valor`} y falta recibir el equipo.
            </span>{' '}
            Al recibirlo, márcala «Completada» y regístralo en el inventario.
          </Aviso>
        )}

        <AdminGuide id="trade-in-solicitudes" title="¿Cómo se atiende una solicitud de Trade-In?" steps={[
          'El cliente llena el formulario de /trade-in: el equipo, si tiene bloqueos o bypass, qué funciona, su estado, la batería, las reparaciones y fotos. Te avisamos en el Resumen y con un número junto a «Trade-In» en el menú.',
          'Abre la solicitud: arriba ves lo que hay que revisar y un grado sugerido. Escríbele con «WhatsApp»: el mensaje ya lleva su código y pasa a «Esperando respuesta».',
          'Carga el valor estimado y la etapa. Cuando recibas el equipo, revísalo con los pasos de «Al recibir un iPhone o iPad», márcala «Completada» y regístralo en el inventario.',
        ]} tip="El valor estimado y las notas internas nunca se muestran en la tienda: el valor se lo mandas tú por WhatsApp." />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Repeat className="h-[18px] w-[18px] text-[#585E9F]" /> Solicitudes
                    <span className="text-sm font-semibold text-slate-400">{solicitudes.length}</span>
                  </h2>
                  {solicitudes.length > 0 && (
                    <label className="relative block w-full sm:w-72">
                      <span className="sr-only">Buscar</span>
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Código, cliente, equipo o teléfono"
                        className={`${inputCls} h-10 pl-9`} />
                    </label>
                  )}
                </div>
                {solicitudes.length > 0 && (
                  <ChipsEstado filtros={filtros} activo={filtro} conteo={conteo} onChange={setFiltro} etiqueta="Filtrar por etapa" />
                )}
              </div>

              {solicitudes.length === 0 ? (
                <EmptyState
                  icon={Repeat}
                  title="Todavía no llegó ninguna solicitud"
                  text="Cuando un cliente llene el formulario de /trade-in, aparece acá y te avisamos en el Resumen."
                  action={(
                    <a href="/trade-in" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                      <ExternalLink className="h-4 w-4" /> Ver el formulario
                    </a>
                  )}
                />
              ) : filtradas.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">
                  {texto ? `Ninguna solicitud coincide con «${buscar}».` : 'No hay solicitudes en esta etapa.'}
                </p>
              ) : (
                <>
                  <ol className="divide-y divide-slate-100">
                    {visibles.map((s) => <Fila key={s.id} s={s} etapas={etapas} grados={grados} horasDemora={horasDemora} />)}
                  </ol>
                  <Paginador meta={meta} onPagina={setPagina} />
                </>
              )}
            </section>

            <ConsejosTradeIn />
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Por dónde llega el cliente</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Los accesos de la tienda al formulario de /trade-in.</p>
              <DondeSeLlega donde={donde} />
            </section>
            <AntesDeRecibir />
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
