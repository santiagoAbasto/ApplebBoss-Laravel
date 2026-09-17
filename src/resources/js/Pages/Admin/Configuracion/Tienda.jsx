import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
  ExternalLink, House, MapPin, Megaphone, MessageCircle, Search, Store, Wrench,
} from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { Field, Input, PageHeader, StepCard, Switch, Textarea, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { Aviso, Nota, Stat } from '@/Components/Admin/inventario';
import { GuiaConfiguracion, VistaAnuncio, VistaPie, VistaWhatsapp, numeroLegible, saludoDe, soloDigitos } from '@/Components/Admin/configuracion';

// Tienda online → Configuración: los datos generales de la tienda. Solo lo que la tienda lee de verdad y que no es de
// otro módulo: el WhatsApp con el que le escribe el cliente y la identidad (nombre, descripción, frase del pie y barra
// de anuncio). La dirección y el horario se cargan en Ubicaciones; el SEO, en «Google y redes sociales»; el hero y el
// orden del inicio, en Portada.

/** Los otros módulos que se llevaron datos que antes se pedían acá. */
const EN_OTRO_LADO = [
  { icon: MapPin, texto: 'La dirección, el horario, el teléfono y el mapa de cada local', modulo: 'Ubicaciones', ruta: 'admin.locations.index' },
  { icon: Search, texto: 'El título y la descripción de cada página en Google, y la imagen para redes', modulo: 'Google y redes sociales', ruta: 'admin.seo.index' },
  { icon: House,  texto: 'El texto del inicio, el orden de sus secciones y el botón del carrusel', modulo: 'Portada', ruta: 'admin.home-builder.index' },
];

export default function Tienda({ configuracion, largos = {}, contexto = {} }) {
  const [toast] = useToast();
  const { data, setData, post, processing, errors, isDirty, recentlySuccessful } = useForm({
    whatsapp_enabled:   configuracion.whatsapp_enabled ?? false,
    whatsapp_numero:    configuracion.whatsapp_numero ?? '',
    whatsapp_mensaje:   configuracion.whatsapp_mensaje ?? '',
    tienda_nombre:      configuracion.tienda_nombre ?? '',
    tienda_descripcion: configuracion.tienda_descripcion ?? '',
    footer_tagline:     configuracion.footer_tagline ?? '',
    anuncio_barra:      configuracion.anuncio_barra ?? '',
  });

  const guardar = (e) => {
    e.preventDefault();
    post(route('admin.configuracion.tienda.update'), { preserveScroll: true });
  };

  const nombre = data.tienda_nombre.trim() || 'Apple Boss';
  const numero = soloDigitos(data.whatsapp_numero);
  const anuncio = data.anuncio_barra.trim();
  const usanWhatsapp = (contexto.servicios_con_whatsapp ?? 0) + (contexto.locales_con_whatsapp ?? 0);
  const faltaNumero = data.whatsapp_enabled && !numero;

  return (
    <AdminLayout>
      <Head title="Configuración" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Configuración"
          subtitle="Los datos generales de la tienda: el WhatsApp con el que te escribe el cliente y el nombre, la frase del pie y la barra de anuncio que se ven en todas las páginas."
          actions={(
            <a href="/" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
              <ExternalLink className="h-4 w-4" /> Ver la tienda
            </a>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={MessageCircle}
            label="WhatsApp"
            value={configuracion.whatsapp_enabled ? 'Encendido' : 'Apagado'}
            tone={configuracion.whatsapp_enabled ? 'emerald' : 'slate'}
            hint={configuracion.whatsapp_enabled
              ? (configuracion.whatsapp_numero ? numeroLegible(configuracion.whatsapp_numero) : 'falta el número')
              : 'la tienda no muestra el botón verde'}
          />
          <Stat
            icon={Store}
            label="Nombre de la tienda"
            value={configuracion.tienda_nombre || 'Apple Boss'}
            tone="navy"
            hint="en el encabezado, el pie y Google"
          />
          <Stat
            icon={Megaphone}
            label="Barra de anuncio"
            value={(configuracion.anuncio_barra ?? '').trim() ? 'Se ve' : 'No se ve'}
            tone={(configuracion.anuncio_barra ?? '').trim() ? 'lila' : 'slate'}
            hint={(configuracion.anuncio_barra ?? '').trim() ? 'arriba de todas las páginas' : 'sin texto no se dibuja'}
          />
          <Stat
            icon={Wrench}
            label="Usan tu WhatsApp"
            value={usanWhatsapp}
            tone={usanWhatsapp > 0 ? 'lila' : 'slate'}
            hint={usanWhatsapp === 0 ? 'ningún servicio ni local' : 'botones de servicios y locales'}
          />
        </div>

        <AdminGuide id="configuracion-tienda" title="¿Qué se configura acá?" steps={[
          'Enciende el WhatsApp y escribe tu número con el código de país: aparece el botón verde en toda la tienda y se activan los botones de los servicios y de cada local.',
          'Escribe el nombre de la tienda y la frase del pie. El nombre sale en el encabezado, en el pie, en cada mensaje de WhatsApp y en los datos que lee Google.',
          'La barra de anuncio es la franja de arriba de todas las páginas: úsala para un aviso corto, o déjala vacía y no se dibuja.',
        ]} tip="Lo que no está acá se carga en su propia pantalla: la dirección y el horario en Ubicaciones, el título en Google en «Google y redes sociales», y el texto y el orden del inicio en Portada." />

        {recentlySuccessful && (
          <Aviso tono="lila" icon={Store}>
            <span className="font-bold">Configuración guardada.</span> Los cambios ya se ven en la tienda.
          </Aviso>
        )}

        {!configuracion.whatsapp_enabled && usanWhatsapp > 0 && (
          <Aviso tono="amber" icon={MessageCircle}>
            <span className="font-bold">El WhatsApp está apagado</span> y {usanWhatsapp === 1 ? 'hay 1 botón que lo usa' : `hay ${usanWhatsapp} botones que lo usan`}
            {' '}en los servicios y los locales: se ven sin su botón hasta que lo enciendas.
          </Aviso>
        )}

        {(contexto.locales_encendidos ?? 0) === 0 && (
          <Aviso tono="amber" icon={MapPin} accion="Ir a Ubicaciones" onAccion={() => router.visit(route('admin.locations.index'))}>
            <span className="font-bold">No hay ningún local encendido.</span> La dirección, el horario y el mapa se
            cargan en Ubicaciones: mientras no haya uno, la tienda no muestra «Dónde estamos» ni le da esos datos a Google.
          </Aviso>
        )}

        <form onSubmit={guardar} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <StepCard
              step="1"
              title="WhatsApp"
              subtitle="Por dónde te escribe el cliente desde cualquier página de la tienda."
              actions={(
                <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-slate-600">
                  <Switch
                    checked={data.whatsapp_enabled}
                    label={data.whatsapp_enabled ? 'Apagar el WhatsApp de la tienda' : 'Encender el WhatsApp de la tienda'}
                    onChange={(v) => setData('whatsapp_enabled', v)}
                  />
                  {data.whatsapp_enabled ? 'Encendido' : 'Apagado'}
                </label>
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Número"
                  error={errors.whatsapp_numero}
                  hint="Con el código de país y solo números, sin «+», espacios ni guiones. En Bolivia: 591 y los 8 dígitos."
                >
                  <Input
                    value={data.whatsapp_numero}
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="59175904313"
                    onChange={(e) => setData('whatsapp_numero', soloDigitos(e.target.value))}
                  />
                </Field>

                <Field label="Así queda el enlace">
                  <div className="flex h-[38px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                    {numero ? `wa.me/${numero}` : <span className="text-slate-400">Falta el número</span>}
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <Field
                  label="Mensaje con el que se abre la conversación"
                  error={errors.whatsapp_mensaje}
                  value={data.whatsapp_mensaje}
                  max={largos.whatsapp_mensaje}
                  hint="El del botón verde que flota en la tienda. Desde la ficha de un producto y desde el carrito, la tienda arma el mensaje con el equipo."
                >
                  <Textarea
                    rows={3}
                    maxLength={largos.whatsapp_mensaje}
                    value={data.whatsapp_mensaje}
                    placeholder={`${saludoDe(nombre)} quiero consultar sobre sus productos.`}
                    onChange={(e) => setData('whatsapp_mensaje', e.target.value)}
                  />
                </Field>
              </div>

              {faltaNumero && (
                <Nota tono="amber">
                  Encendido y sin número, la tienda no puede abrir la conversación. Escribe el número o apaga el interruptor.
                </Nota>
              )}

              {data.whatsapp_enabled && usanWhatsapp > 0 && (
                <Nota>
                  Este número también lo usan {usanWhatsapp === 1 ? 'un botón' : `${usanWhatsapp} botones`} de los
                  servicios del inicio y de los locales.
                </Nota>
              )}
            </StepCard>

            <StepCard
              step="2"
              title="La tienda"
              subtitle="El nombre y los textos que acompañan a todas las páginas."
            >
              <div className="grid gap-4">
                <Field
                  label="Nombre de la tienda"
                  error={errors.tienda_nombre}
                  value={data.tienda_nombre}
                  max={largos.tienda_nombre}
                  hint="Sale en el encabezado, en el pie, en cada mensaje de WhatsApp y en los datos del negocio que lee Google."
                >
                  <Input
                    value={data.tienda_nombre}
                    maxLength={largos.tienda_nombre}
                    onChange={(e) => setData('tienda_nombre', e.target.value)}
                  />
                </Field>

                <Field
                  label="Frase del pie de página"
                  error={errors.footer_tagline}
                  value={data.footer_tagline}
                  max={largos.footer_tagline}
                  hint="Va debajo del nombre, al final de todas las páginas. Una sola idea, de lo que cumples siempre."
                >
                  <Textarea
                    rows={2}
                    maxLength={largos.footer_tagline}
                    value={data.footer_tagline}
                    onChange={(e) => setData('footer_tagline', e.target.value)}
                  />
                </Field>

                <Field
                  label="Barra de anuncio"
                  error={errors.anuncio_barra}
                  value={data.anuncio_barra}
                  max={largos.anuncio_barra}
                  hint="La franja de arriba de todas las páginas. En el celular se corta: pocas palabras. Vacía, no se dibuja."
                >
                  <Input
                    value={data.anuncio_barra}
                    maxLength={largos.anuncio_barra}
                    placeholder="Sin texto, la barra no aparece"
                    onChange={(e) => setData('anuncio_barra', e.target.value)}
                  />
                </Field>

                <Field
                  label="Descripción corta de la tienda"
                  error={errors.tienda_descripcion}
                  value={data.tienda_descripcion}
                  max={largos.tienda_descripcion}
                  hint="Solo la leen los buscadores: describe el negocio en los datos que Google usa para la ficha del local. No se muestra en ninguna página."
                >
                  <Textarea
                    rows={2}
                    maxLength={largos.tienda_descripcion}
                    value={data.tienda_descripcion}
                    onChange={(e) => setData('tienda_descripcion', e.target.value)}
                  />
                </Field>
              </div>
            </StepCard>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Cómo escribir estos datos</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Son los que acompañan al cliente en todas las páginas.</p>
              <GuiaConfiguracion />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Esto se carga en otra pantalla</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Cada dato tiene un solo lugar: así no queda una dirección vieja dando vueltas.</p>
              <ul className="mt-4 grid gap-2">
                {EN_OTRO_LADO.map(({ icon: Icon, texto, modulo, ruta }) => (
                  <li key={modulo} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#585E9F]/10 text-[#585E9F]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 basis-full text-[13px] text-slate-600 sm:flex-1 sm:basis-[12rem]">{texto}</p>
                    <button type="button" onClick={() => router.visit(route(ruta))} className={buttonCls('secondary', 'h-9 shrink-0 px-3 text-xs')}>
                      Ir a {modulo}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en la tienda</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Cambia mientras escribes.</p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-600">Arriba de todas las páginas</p>
              <VistaAnuncio texto={anuncio} />

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-600">Al final de todas las páginas</p>
              <VistaPie
                nombre={nombre}
                tagline={data.footer_tagline.trim()}
                ciudad={contexto.ciudad}
                pais={contexto.pais}
              />

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-600">El botón que flota</p>
              <VistaWhatsapp
                activo={data.whatsapp_enabled}
                numero={data.whatsapp_numero}
                mensaje={data.whatsapp_mensaje}
                nombre={nombre}
              />
            </section>
          </aside>

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-5 py-3 shadow-sm backdrop-blur xl:col-span-2">
            <p className="text-[13px] text-slate-500">
              {isDirty ? 'Hay cambios sin guardar.' : 'Todo guardado.'}
            </p>
            <button type="submit" disabled={processing || !isDirty} className={buttonCls('primary', 'h-11 px-6')}>
              {processing ? 'Guardando…' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
