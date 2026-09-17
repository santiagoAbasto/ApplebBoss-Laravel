import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { ExternalLink, Map as IconoMapa, MapPin, Star, Store, Trash2 } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { Badge, Field, Input, StepCard, Switch, Textarea, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { EncabezadoFormulario, ErroresResumen, ModalEliminar, Nota } from '@/Components/Admin/inventario';
import {
  EditorHorario, GuiaMapa, ListaDatos, VistaUbicaciones, aPublico, faltanDatos, horarioVacio, mapaDesdeTexto, soloCiudad,
} from '@/Components/Admin/ubicaciones';
import { normalizarHorario } from '@/Components/Store/horario';

// Un local de la tienda: dónde queda, cuándo abre, cómo contactarlo y su mapa. Mientras se escribe, al costado se ve
// cómo queda «Dónde estamos» en el inicio y qué datos faltan.

export default function Edit({ ubicacion = null, seraPrincipal = false, contacto = {} }) {
  const creando = !ubicacion;
  const [toast] = useToast();
  const [borrar, setBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const { data, setData, post, patch, processing, errors, isDirty, setDefaults } = useForm({
    name:          ubicacion?.name ?? '',
    address:       ubicacion?.address ?? '',
    city:          ubicacion?.city ?? 'Cochabamba',
    country:       ubicacion?.country ?? 'Bolivia',
    description:   ubicacion?.description ?? '',
    horarios:      ubicacion?.horarios?.length === 7 ? ubicacion.horarios : horarioVacio(),
    hours:         ubicacion?.hours ?? '',
    phone:         ubicacion?.phone ?? '',
    whatsapp:      ubicacion?.whatsapp ?? '',
    map_embed_url: ubicacion?.map_embed_url ?? '',
    map_link_url:  ubicacion?.map_link_url ?? '',
    active:        ubicacion?.active ?? true,
  });

  useEffect(() => {
    if (!isDirty) return undefined;
    const fn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [isDirty]);

  const principal = ubicacion?.principal || seraPrincipal;
  const faltan = faltanDatos(data, contacto);
  const mapa = mapaDesdeTexto(data.map_embed_url);
  const soloTextoDeHorario = !normalizarHorario(data.horarios) && data.hours.trim() !== '';

  const guardar = () => {
    if (processing) return;
    if (creando) post(route('admin.locations.store'));
    else patch(route('admin.locations.update', ubicacion.id), { preserveScroll: true, onSuccess: () => setDefaults() });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.locations.destroy', ubicacion.id), { onFinish: () => setBorrando(false) });
  };

  return (
    <AdminLayout>
      <Head title={creando ? 'Nueva ubicación' : `${ubicacion.name} · Ubicaciones`} />
      <Toast toast={toast} />

      {borrar && (
        <ModalEliminar
          titulo="Borrar ubicación"
          icon={MapPin}
          nombre={ubicacion.name}
          detalle={[ubicacion.address, ubicacion.city].filter(Boolean).join(' · ')}
          advertencia="Se borran sus datos y su mapa, y no se puede deshacer. Si solo quieres sacarlo por un tiempo, usa el interruptor «Se ve en la tienda»."
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(false)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EncabezadoFormulario
            volverUrl={route('admin.locations.index')}
            volverLabel="Volver a Ubicaciones"
            titulo={creando ? 'Nueva ubicación' : ubicacion.name}
            subtitulo={creando
              ? (seraPrincipal ? 'Va a ser tu local principal: el primero que ve el cliente.' : 'Se agrega al final de la lista.')
              : [ubicacion.address, ubicacion.city].filter(Boolean).join(' · ')}
          />
          {!creando && (
            <a href="/#contacto" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-10')}>
              <ExternalLink className="h-4 w-4" /> Ver en la tienda
            </a>
          )}
        </div>

        <AdminGuide id="ubicacion-local" title="¿Cómo se carga un local?" steps={[
          'Escribe el nombre como figura en Google Maps y la dirección como para llegar sin preguntar.',
          'Marca los días que abres con sus horas. Si cierras al mediodía, agrega el «Horario de tarde».',
          'Pega el mapa y el enlace «Cómo llegar» siguiendo los pasos del recuadro 4. Al costado ves lo que falta y cómo queda.',
        ]} tip="Lo que escribes acá lo lee el cliente antes de ir: si el horario o la dirección no son exactos, llega y se encuentra con la tienda cerrada." />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <StepCard step={1} title="El local" subtitle="Cómo se llama y dónde queda.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Nombre" error={errors.name} value={data.name} max={40}
                    hint="Igual que en Google Maps. Por ejemplo: Apple Boss Cochabamba.">
                    <Input value={data.name} maxLength={120} autoFocus={creando} onChange={(e) => setData('name', e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Dirección" error={errors.address} value={data.address} max={80}
                    hint="Calle, número y entre qué calles. Por ejemplo: Av. Heroínas 456, entre Lanza y Antezana.">
                    <Input value={data.address} maxLength={300} onChange={(e) => setData('address', e.target.value)} />
                  </Field>
                  {soloCiudad(data.address, data.city, data.country) && (
                    <p className="mt-1.5 text-xs font-semibold text-amber-700">
                      {data.address.trim() ? 'Solo dice la ciudad: el cliente no sabe a qué calle ir.' : 'Sin dirección, la tienda muestra solo la ciudad.'}
                    </p>
                  )}
                </div>
                <Field label="Ciudad" error={errors.city}>
                  <Input value={data.city} maxLength={100} onChange={(e) => setData('city', e.target.value)} />
                </Field>
                <Field label="País" error={errors.country}>
                  <Input value={data.country} maxLength={100} onChange={(e) => setData('country', e.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Descripción (opcional)" error={errors.description} value={data.description} max={160}
                    hint="Una o dos frases con lo que puede hacer el cliente al venir. Solo lo que cumples siempre.">
                    <Textarea rows={3} value={data.description} maxLength={1000} onChange={(e) => setData('description', e.target.value)} />
                  </Field>
                </div>
              </div>
            </StepCard>

            <StepCard step={2} title="Horario" subtitle="Día por día. Con él, la tienda avisa si estás abierto ahora y cuándo abres.">
              <EditorHorario valor={data.horarios} onChange={(v) => setData('horarios', v)} errores={errors} />
              {soloTextoDeHorario && (
                <Nota>
                  Hoy el horario es solo el texto de abajo. Márcalo día por día para que la tienda pueda decir «Abierto ahora».
                </Nota>
              )}
              <div className="mt-4">
                <Field label="Aclaración (opcional)" error={errors.hours} value={data.hours} max={60}
                  hint="Lo que no entra en la tabla. Por ejemplo: Feriados: cerrado.">
                  <Input value={data.hours} maxLength={200} onChange={(e) => setData('hours', e.target.value)} />
                </Field>
              </div>
            </StepCard>

            <StepCard step={3} title="Contacto" subtitle="Para que el cliente llame o escriba antes de ir.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Teléfono (opcional)" error={errors.phone}
                  hint="Como lo marcaría el cliente. En el celular se toca para llamar.">
                  <Input type="tel" value={data.phone} maxLength={50} placeholder="Ej.: 4 4123456" onChange={(e) => setData('phone', e.target.value)} />
                </Field>
                <Field label="WhatsApp del local (opcional)" error={errors.whatsapp}
                  hint="Con código de país, sin + ni espacios.">
                  <Input inputMode="numeric" value={data.whatsapp} maxLength={30} placeholder="59170000000" onChange={(e) => setData('whatsapp', e.target.value)} />
                </Field>
              </div>
              {contacto.whatsapp_activo ? (
                <Nota>
                  {contacto.whatsapp_numero
                    ? `Si lo dejas vacío, el botón «Consultar cómo llegar» usa el WhatsApp de la tienda (${contacto.whatsapp_numero}).`
                    : 'Si lo dejas vacío, no hay botón de WhatsApp: la tienda todavía no tiene su número cargado en Configuración.'}
                </Nota>
              ) : (
                <Nota tono="amber">
                  El WhatsApp de la tienda está apagado en Configuración: ningún local muestra WhatsApp hasta que lo actives.
                </Nota>
              )}
            </StepCard>

            <StepCard step={4} title="Mapa y cómo llegar" subtitle="El mapa se ve al lado de los datos; el enlace le abre la ruta al cliente.">
              <GuiaMapa />

              <div className="mt-5 grid gap-4">
                <Field label="Código del mapa" error={errors.map_embed_url}
                  hint="Pega todo lo que copiaste con «Copiar HTML»: empieza con <iframe.">
                  <Textarea rows={3} value={data.map_embed_url} onChange={(e) => setData('map_embed_url', e.target.value)}
                    className="font-mono text-xs" placeholder='<iframe src="https://www.google.com/maps/embed?pb=…' />
                </Field>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {mapa ? (
                    <iframe src={mapa} title="Vista previa del mapa" width="100%" height="240" style={{ border: 0, display: 'block' }}
                      loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
                  ) : (
                    <div className="flex h-[160px] flex-col items-center justify-center gap-2 px-6 text-center">
                      <IconoMapa className="h-7 w-7 text-slate-300" />
                      <p className="text-[13px] font-semibold text-slate-500">
                        {data.map_embed_url.trim()
                          ? 'Eso no parece un mapa de Google. Copia el código de «Insertar un mapa».'
                          : 'Acá vas a ver tu mapa apenas pegues el código.'}
                      </p>
                    </div>
                  )}
                </div>

                <Field label="Enlace «Cómo llegar»" error={errors.map_link_url}
                  hint="El que copiaste con «Copiar enlace». Empieza con https://">
                  <Input type="url" value={data.map_link_url} maxLength={500} placeholder="https://maps.app.goo.gl/…" onChange={(e) => setData('map_link_url', e.target.value)} />
                </Field>
              </div>
            </StepCard>

            {!creando && (
              <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <h2 className="text-base font-bold text-slate-900">Borrar esta ubicación</h2>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Se borran sus datos y su mapa. Para sacarla un tiempo, mejor apaga «Se ve en la tienda».
                </p>
                <button type="button" onClick={() => setBorrar(true)} className={buttonCls('danger', 'mt-3 h-10 w-full')}>
                  <Trash2 className="h-4 w-4" /> Borrar ubicación
                </button>
              </section>
            )}
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pb-1">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Store className="h-[18px] w-[18px] text-[#585E9F]" /> En la tienda
                </h2>
                <div className="flex items-center gap-1.5">
                  {principal && data.active && <Badge tone="navy"><Star className="h-3 w-3" aria-hidden="true" /> Principal</Badge>}
                  {data.active ? <Badge tone="emerald">Se ve</Badge> : <Badge tone="slate">Oculta</Badge>}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Se ve en la tienda</p>
                    <p className="text-xs text-slate-500">{data.active ? 'Sale en «Dónde estamos» y en Google.' : 'Queda guardada, pero no se muestra.'}</p>
                  </div>
                  <Switch checked={data.active} label="Mostrar la ubicación en la tienda" onChange={(v) => setData('active', v)} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Lo que ve el cliente</p>
                  <ListaDatos faltan={faltan} />
                </div>

                <ErroresResumen errores={errors} />
                {!creando && isDirty && <p className="text-center text-xs font-semibold text-amber-700">Tienes cambios sin guardar.</p>}
                <button type="button" onClick={guardar} disabled={processing || !data.name.trim() || (!creando && !isDirty)}
                  className={buttonCls('primary', 'h-12 w-full text-[15px]')}>
                  {processing ? 'Guardando…' : creando ? 'Agregar ubicación' : 'Guardar ubicación'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en el inicio</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                {principal ? 'Es el primer local de «Dónde estamos».' : 'Aparece al elegirlo entre tus locales.'}
              </p>
              <VistaUbicaciones locales={[aPublico({ ...data, id: ubicacion?.id })]} />
            </section>

          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
