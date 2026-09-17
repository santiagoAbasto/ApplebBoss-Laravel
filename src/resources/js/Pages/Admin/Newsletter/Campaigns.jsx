import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import {
  AlertTriangle, Copy, ExternalLink, Eye, FileText, Mail, Pencil, Plus, Send, Trash2, TriangleAlert, Users,
} from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { MarketingTabs, PageHeader, Paginador, Toast, buttonCls, fmtDate, useToast } from '@/Components/Admin/ui';
import { Aviso, ModalEliminar, Stat } from '@/Components/Admin/inventario';
import { CONSEJOS_CAMPANA, Consejos, EstadoCampana, EstadoDelServidor, Progreso } from '@/Components/Admin/newsletter';

// Marketing y Google → Campañas: los correos que se les mandan a los suscriptores. El envío lo hace la cola por
// lotes, así que la pantalla avisa antes si al servidor le falta algo (la clave del correo o el proceso de envío).

export default function Campaigns({ campaigns, stats, estado }) {
  const [toast] = useToast();
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);

  const nueva    = () => router.post(route('admin.newsletter.campaigns.store'));
  const duplicar = (c) => router.post(route('admin.newsletter.campaigns.duplicate', c.id), {}, { preserveScroll: true });

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.newsletter.campaigns.destroy', borrar.id), {
      preserveScroll: true,
      onFinish: () => { setBorrando(false); setBorrar(null); },
    });
  };

  const filas = campaigns.data ?? [];
  const enviando = filas.filter((c) => c.estado === 'enviando').length;

  return (
    <AdminLayout>
      <Head title="Campañas — Newsletter" />
      <Toast toast={toast} />

      {borrar && (
        <ModalEliminar
          titulo="Borrar campaña"
          icon={Mail}
          nombre={borrar.asunto}
          advertencia="Se borra el borrador y su historial de envío. Los correos que ya salieron no se pueden recuperar."
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(null)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Campañas"
          subtitle="Los correos que les mandas a tus suscriptores: novedades, ofertas y avisos. Se arman con bloques y salen de a poco, para que no caigan en spam."
          actions={(
            <button type="button" onClick={nueva} className={buttonCls('primary', 'h-11 px-4')}>
              <Plus className="h-4 w-4" /> Nueva campaña
            </button>
          )}
        />

        <MarketingTabs active="campaigns" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Users} label="Suscriptores activos" value={(estado?.activos ?? 0).toLocaleString('es-BO')} tone="navy"
            hint={estado?.bajas ? `${estado.bajas} de baja` : 'a quienes les llega'} />
          <Stat icon={FileText} label="Borradores" value={stats.borradores} tone="slate"
            hint={stats.borradores === 0 ? 'ninguno a medio escribir' : 'sin enviar todavía'} />
          <Stat icon={Send} label="Campañas enviadas" value={stats.enviadas} tone="emerald"
            hint={`${(stats.correos ?? 0).toLocaleString('es-BO')} correos entregados`} />
          <Stat icon={Mail} label="Correo del servidor" value={estado?.correo?.listo ? 'Listo' : 'Falta'}
            tone={estado?.correo?.listo ? 'emerald' : 'slate'}
            hint={estado?.correo?.listo ? (estado.correo.desde ?? '') : 'no se puede enviar'} />
        </div>

        <AdminGuide id="newsletter-campanas" title="¿Cómo mando un correo a mis suscriptores?" steps={[
          'Toca «Nueva campaña» y escribe el asunto: es lo único que se ve en la bandeja del cliente.',
          'Arma el correo con bloques: título, texto, foto, botón y productos de tu tienda, que salen con su precio de hoy.',
          'Mándate una prueba, ábrela en tu celular y recién ahí toca «Enviar campaña». Sale de a poco y puedes cerrar la pantalla.',
        ]} tip="Cada correo lleva su enlace para darse de baja, como exige la ley y piden Gmail y Outlook. Quien se da de baja no vuelve a recibir campañas y no hace falta que hagas nada." />

        {!estado?.correo?.listo && (
          <Aviso tono="amber" icon={TriangleAlert} accion="Ir a Ajustes"
            onAccion={() => router.visit(route('admin.newsletter.settings.edit'))}>
            <span className="font-bold">Los correos todavía no pueden salir.</span>{' '}
            {estado?.correo?.falta}
          </Aviso>
        )}

        {estado?.correo?.listo && !estado?.cola?.listo && (
          <Aviso tono="amber" icon={AlertTriangle}>
            <span className="font-bold">El proceso de envío está detenido.</span>{' '}
            {estado?.cola?.falta} Mientras tanto, una campaña enviada se queda esperando.
          </Aviso>
        )}

        {estado?.correo?.listo && estado?.activos === 0 && (
          <Aviso tono="lila" icon={Users} accion="Ir a Suscriptores"
            onAccion={() => router.visit(route('admin.newsletter.subscribers.index'))}>
            <span className="font-bold">Todavía no tienes suscriptores.</span>{' '}
            El formulario del final de la tienda los va sumando solo; también puedes agregarlos a mano o importar una lista.
          </Aviso>
        )}

        {enviando > 0 && (
          <Aviso tono="lila" icon={Send}>
            {enviando === 1 ? 'Hay una campaña saliendo ahora mismo.' : `Hay ${enviando} campañas saliendo ahora mismo.`}{' '}
            Ábrela para ver cuántos correos ya salieron o para detenerla.
          </Aviso>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Mail className="h-[18px] w-[18px] text-[#585E9F]" /> Tus campañas
                    <span className="text-sm font-semibold text-slate-400">{campaigns.total ?? filas.length}</span>
                  </h2>
                  <p className="mt-0.5 text-[13px] text-slate-500">De la más nueva a la más vieja.</p>
                </div>
                <button type="button" onClick={nueva} className={buttonCls('primary', 'h-10')}>
                  <Plus className="h-4 w-4" /> Nueva campaña
                </button>
              </div>

              {filas.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <Mail className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-800">Todavía no escribiste ninguna campaña</p>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
                    Empieza por lo más simple: los equipos que llegaron esta semana, con una foto y un botón al catálogo.
                  </p>
                  <button type="button" onClick={nueva} className={buttonCls('primary', 'mt-4 h-10')}>
                    <Plus className="h-4 w-4" /> Crear la primera campaña
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filas.map((c) => (
                    <li key={c.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link href={route('admin.newsletter.campaigns.edit', c.id)} className="text-[15px] font-bold text-slate-900 hover:text-[#585E9F]">
                            {c.asunto || 'Sin asunto'}
                          </Link>
                          <EstadoCampana estado={c.estado} />
                        </div>

                        <p className="mt-0.5 text-[13px] text-slate-500">
                          {c.destino === 'todos' ? 'A todos los suscriptores' : 'A una selección de suscriptores'}
                          {c.estado === 'borrador' && ` · hoy le llegaría a ${c.destinatarios.toLocaleString('es-BO')}`}
                          {c.bloques > 0 && ` · ${c.bloques} ${c.bloques === 1 ? 'bloque' : 'bloques'}`}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {c.estado === 'borrador'
                            ? `Última edición ${fmtDate(c.updated_at)}`
                            : `${c.estado === 'enviando' ? 'Empezó' : 'Salió'} ${fmtDate(c.finalizada_at ?? c.iniciada_at ?? c.updated_at)}`}
                        </p>

                        {c.aviso && (
                          <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-amber-700">
                            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {c.aviso}
                          </p>
                        )}
                      </div>

                      <div className="lg:w-[170px] lg:shrink-0">
                        {c.estado === 'borrador'
                          ? <span className="text-[13px] text-slate-400">Sin enviar</span>
                          : <Progreso {...c} />}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                        <Link href={route('admin.newsletter.campaigns.edit', c.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
                          {c.estado === 'borrador' ? <><Pencil className="h-3.5 w-3.5" /> Editar</> : <><Eye className="h-3.5 w-3.5" /> Ver</>}
                        </Link>
                        <button type="button" onClick={() => duplicar(c)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
                          <Copy className="h-3.5 w-3.5" /> Duplicar
                        </button>
                        {c.estado !== 'enviando' && (
                          <button type="button" onClick={() => setBorrar(c)} aria-label={`Borrar «${c.asunto}»`}
                            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <Paginador
                meta={campaigns}
                onPagina={(p) => router.get(route('admin.newsletter.campaigns.index'), { page: p }, { preserveScroll: true })}
              />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Cómo escribir una campaña que se abra</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">El cliente decide en dos segundos, desde la bandeja del celular.</p>
              <Consejos
                consejos={CONSEJOS_CAMPANA}
                cierre={(
                  <>
                    <span className="font-bold text-slate-800">¿Cada cuánto?</span> Una o dos veces al mes alcanza. Mandar
                    todas las semanas cansa y hace que se den de baja; mandar una vez al año hace que no te reconozcan y
                    te marquen como spam.
                  </>
                )}
              />
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">¿Está todo listo para enviar?</h2>
              <p className="mt-0.5 mb-4 text-[13px] text-slate-500">Lo que necesita el servidor para que los correos salgan.</p>
              <EstadoDelServidor estado={estado} compacto />
              {estado?.cola?.fallidos > 0 && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
                  <span className="font-bold">{estado.cola.fallidos}</span> {estado.cola.fallidos === 1 ? 'envío quedó' : 'envíos quedaron'} trabado{estado.cola.fallidos === 1 ? '' : 's'} en el servidor.
                  Quien administra el servidor los puede reintentar con <code className="rounded bg-white px-1">php artisan queue:retry all</code>.
                </p>
              )}
              <a href="/" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'mt-4 h-10 w-full')}>
                <ExternalLink className="h-4 w-4" /> Ver el formulario en la tienda
              </a>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
