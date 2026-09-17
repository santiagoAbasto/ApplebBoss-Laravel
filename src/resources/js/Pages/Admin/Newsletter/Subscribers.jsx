import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import {
  Download, Globe, Mail, MailPlus, Search, Store, Trash2, TriangleAlert, Upload, UserMinus, UserPlus, Users, X,
} from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import {
  Field, Input, MarketingTabs, Modal, PageHeader, Paginador, Textarea, Toast, buttonCls, fmtDate, inputCls, useToast,
} from '@/Components/Admin/ui';
import { Aviso, ChipsEstado, ModalEliminar, Nota, Stat } from '@/Components/Admin/inventario';
import { CONSEJOS_LISTA, Consejos } from '@/Components/Admin/newsletter';

// Marketing y Google → Suscriptores: la lista de quienes reciben las campañas. Se llena sola con el formulario del
// final de la tienda; también se agregan a mano o se importa una lista de gente que ya te dio su correo.

const ORIGEN = {
  footer:      { label: 'Formulario de la tienda', icon: Store },
  admin:       { label: 'Agregado a mano',         icon: UserPlus },
  importacion: { label: 'Importado',               icon: Upload },
};

const FILTROS = [
  { key: 'activos', label: 'Activos' },
  { key: 'bajas',   label: 'De baja' },
  { key: 'todos',   label: 'Todos' },
];

function FormularioImportar({ onCerrar }) {
  const { data, setData, post, processing, errors } = useForm({ emails: '' });
  const cuenta = data.emails.split(/[\s,;]+/).filter(Boolean).length;

  const guardar = () => post(route('admin.newsletter.subscribers.import'), { preserveScroll: true, onSuccess: onCerrar });

  return (
    <Modal
      wide
      title="Importar una lista de correos"
      onClose={onCerrar}
      footer={(
        <>
          <button type="button" onClick={onCerrar} className={buttonCls('secondary', 'h-11')}>Cancelar</button>
          <button type="button" onClick={guardar} disabled={processing || cuenta === 0} className={buttonCls('primary', 'h-11')}>
            {processing ? 'Importando…' : cuenta > 0 ? `Importar ${cuenta}` : 'Importar'}
          </button>
        </>
      )}
    >
      <Field label="Pega los correos" error={errors.emails}
        hint="Uno por línea, o separados por comas. Los repetidos y los que estén mal escritos se saltan solos. Hasta 5.000 por vez.">
        <Textarea rows={9} value={data.emails} onChange={(e) => setData('emails', e.target.value)}
          placeholder={'ana@correo.com\njuan@correo.com\nmaria@correo.com'} />
      </Field>

      <Nota tono="amber">
        Importa <span className="font-bold">solo a quien te dio su correo para recibir tus novedades</span>. Mandar
        correos a quien no los pidió hace que te marquen como spam, y entonces tus campañas dejan de llegarle también a
        los demás. A los que ya estaban de baja no se los reactiva.
      </Nota>
    </Modal>
  );
}

export default function Subscribers({ subscribers, filters, counts, estado }) {
  const [toast] = useToast();
  const [q, setQ] = useState(filters.q ?? '');
  const [importar, setImportar] = useState(false);
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const agregar = useForm({ email: '', nombre: '' });

  useEffect(() => setQ(filters.q ?? ''), [filters.q]);

  const ir = (params) => router.get(route('admin.newsletter.subscribers.index'), { ...filters, ...params },
    { preserveState: true, preserveScroll: true, replace: true });

  const guardarNuevo = (e) => {
    e.preventDefault();
    agregar.post(route('admin.newsletter.subscribers.store'), { preserveScroll: true, onSuccess: () => agregar.reset() });
  };

  const cambiarBaja = (s) => router.patch(route('admin.newsletter.subscribers.update', s.id),
    { baja: !s.unsubscribed_at }, { preserveScroll: true });

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.newsletter.subscribers.destroy', borrar.id), {
      preserveScroll: true,
      onFinish: () => { setBorrando(false); setBorrar(null); },
    });
  };

  const filas = subscribers.data ?? [];

  return (
    <AdminLayout>
      <Head title="Suscriptores — Newsletter" />
      <Toast toast={toast} />

      {importar && <FormularioImportar onCerrar={() => setImportar(false)} />}

      {borrar && (
        <ModalEliminar
          titulo="Borrar de la lista"
          icon={Mail}
          nombre={borrar.email}
          advertencia="Se borra el correo y no se puede deshacer. Si solo quieres que deje de recibir campañas, usa «Dar de baja»: así queda el registro de que se dio de baja."
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(null)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Suscriptores"
          subtitle="Las personas que reciben tus campañas. La lista se llena sola con el formulario del final de la tienda, y cada correo lleva su enlace para darse de baja."
          actions={(
            <>
              <button type="button" onClick={() => setImportar(true)} className={buttonCls('secondary', 'h-11 px-4')}>
                <Upload className="h-4 w-4" /> Importar lista
              </button>
              <a href={route('admin.newsletter.subscribers.export', { filtro: filters.filtro })}
                className={buttonCls('secondary', 'h-11 px-4')}>
                <Download className="h-4 w-4" /> Descargar CSV
              </a>
            </>
          )}
        />

        <MarketingTabs active="subscribers" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Users} label="Reciben campañas" value={counts.activos.toLocaleString('es-BO')} tone="navy"
            hint={counts.activos === 0 ? 'todavía nadie' : 'suscriptores activos'} />
          <Stat icon={UserMinus} label="De baja" value={counts.bajas.toLocaleString('es-BO')} tone="slate"
            hint={counts.bajas === 0 ? 'nadie se dio de baja' : 'no vuelven a recibir'} />
          <Stat icon={Store} label="Desde la tienda" value={(counts.del_sitio ?? 0).toLocaleString('es-BO')} tone="emerald"
            hint="dejaron su correo en el sitio" />
          <Stat icon={MailPlus} label="Este mes" value={(counts.del_mes ?? 0).toLocaleString('es-BO')} tone="lila"
            hint="se sumaron en el mes" />
        </div>

        <AdminGuide id="newsletter-suscriptores" title="¿De dónde salen los suscriptores?" steps={[
          'Del formulario del final de la tienda: el cliente deja su correo y entra solo a esta lista.',
          'A mano, cuando alguien te lo deja en el local, o pegando una lista con «Importar lista».',
          'Quien se da de baja desde un correo queda de baja acá mismo, y no vuelve a recibir campañas.',
        ]} tip="Dar de baja no borra a la persona: queda el registro de que pidió no recibir más. Borrarla la saca del todo, y si vuelve a suscribirse desde la tienda entra como nueva." />

        {!estado?.correo?.listo && (
          <Aviso tono="amber" icon={TriangleAlert} accion="Ir a Ajustes"
            onAccion={() => router.visit(route('admin.newsletter.settings.edit'))}>
            <span className="font-bold">La lista crece, pero los correos todavía no pueden salir.</span>{' '}
            {estado?.correo?.falta}
          </Aviso>
        )}

        {counts.activos === 0 && counts.todos > 0 && (
          <Aviso tono="lila" icon={UserMinus}>
            <span className="font-bold">No queda nadie activo en la lista.</span>{' '}
            Todos los correos que tienes están de baja, así que una campaña no le llegaría a nadie.
          </Aviso>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <Users className="h-[18px] w-[18px] text-[#585E9F]" /> Tu lista
                      <span className="text-sm font-semibold text-slate-400">{(subscribers.total ?? filas.length).toLocaleString('es-BO')}</span>
                    </h2>
                    <p className="mt-0.5 text-[13px] text-slate-500">Del último en sumarse al primero.</p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); ir({ q, page: 1 }); }} className="flex gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input className={`${inputCls} h-10 w-56 pl-9`} value={q} onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar correo o nombre" aria-label="Buscar suscriptor" />
                      {q && (
                        <button type="button" onClick={() => { setQ(''); ir({ q: '', page: 1 }); }} aria-label="Limpiar búsqueda"
                          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <button type="submit" className={buttonCls('secondary', 'h-10')}>Buscar</button>
                  </form>
                </div>

                <ChipsEstado
                  filtros={FILTROS}
                  activo={filters.filtro}
                  conteo={{ activos: counts.activos, bajas: counts.bajas, todos: counts.todos ?? 0 }}
                  onChange={(k) => ir({ filtro: k, page: 1 })}
                  etiqueta="Filtrar suscriptores"
                />
              </div>

              {filas.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <Users className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-800">
                    {filters.q ? 'Ningún suscriptor coincide con la búsqueda' : 'Todavía no hay suscriptores acá'}
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
                    {filters.q
                      ? 'Prueba con parte del correo o del nombre.'
                      : 'El formulario del final de la tienda los suma solo. También puedes agregarlos acá abajo.'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filas.map((s) => {
                    const origen = ORIGEN[s.source] ?? { label: s.source ?? 'Sin origen', icon: Globe };
                    const OrigenIcon = origen.icon;
                    return (
                      <li key={s.id} className={`flex flex-col gap-3 px-5 py-3.5 lg:flex-row lg:items-center ${s.unsubscribed_at ? 'bg-slate-50/60' : ''}`}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold text-slate-900">{s.email}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                            {s.nombre && <span className="font-semibold text-slate-600">{s.nombre}</span>}
                            <span className="inline-flex items-center gap-1"><OrigenIcon className="h-3 w-3" /> {origen.label}</span>
                            <span>· desde {fmtDate(s.created_at)}</span>
                          </p>
                          {s.unsubscribed_at && (
                            <p className="mt-1 text-xs font-semibold text-slate-500">Se dio de baja el {fmtDate(s.unsubscribed_at)}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.unsubscribed_at ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
                            {s.unsubscribed_at ? 'De baja' : 'Recibe campañas'}
                          </span>
                          <button type="button" onClick={() => cambiarBaja(s)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
                            {s.unsubscribed_at ? <><UserPlus className="h-3.5 w-3.5" /> Reactivar</> : <><UserMinus className="h-3.5 w-3.5" /> Dar de baja</>}
                          </button>
                          <button type="button" onClick={() => setBorrar(s)} aria-label={`Borrar ${s.email}`}
                            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Paginador meta={subscribers} onPagina={(p) => ir({ page: p })} />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Cómo cuidar tu lista</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">De esto depende que tus correos lleguen a la bandeja y no a spam.</p>
              <Consejos
                consejos={CONSEJOS_LISTA}
                cierre={(
                  <>
                    <span className="font-bold text-slate-800">Lo que dice la ley y piden Gmail y Outlook:</span> que cada
                    correo tenga un enlace para darse de baja y que se respete. Apple Boss lo agrega solo en todas las
                    campañas, así que no tienes que hacer nada.
                  </>
                )}
              />
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Agregar a mano</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Para el cliente que te deja su correo en el local.</p>
              <form onSubmit={guardarNuevo} className="mt-4 grid gap-3">
                <Field label="Correo" error={agregar.errors.email}>
                  <Input type="email" required value={agregar.data.email} placeholder="cliente@correo.com"
                    onChange={(e) => agregar.setData('email', e.target.value)} />
                </Field>
                <Field label="Nombre (opcional)" error={agregar.errors.nombre}
                  hint="Solo para que lo reconozcas en la lista.">
                  <Input value={agregar.data.nombre} maxLength={120}
                    onChange={(e) => agregar.setData('nombre', e.target.value)} />
                </Field>
                <button type="submit" disabled={agregar.processing || !agregar.data.email.trim()}
                  className={buttonCls('primary', 'h-11 w-full')}>
                  <UserPlus className="h-4 w-4" /> {agregar.processing ? 'Agregando…' : 'Agregar a la lista'}
                </button>
              </form>
              <Nota>
                Pídele permiso antes: agregar a alguien que no lo pidió es la forma más rápida de que te marquen como spam.
              </Nota>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
