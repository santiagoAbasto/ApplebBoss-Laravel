import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
  ExternalLink, Gauge, Mail, MailCheck, Megaphone, Send, ServerCog, TriangleAlert,
} from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import {
  Field, Input, MarketingTabs, PageHeader, StepCard, Switch, Textarea, Toast, buttonCls, useToast,
} from '@/Components/Admin/ui';
import { Aviso, Nota, Stat } from '@/Components/Admin/inventario';
import { EstadoDelServidor } from '@/Components/Admin/newsletter';

// Marketing y Google → Ajustes del newsletter: los textos del formulario de la tienda, con qué nombre llegan los
// correos y a qué velocidad salen. La cuenta y la clave del servidor de correo no se editan acá (son una credencial
// y viven en el .env del servidor): esta pantalla dice si están cargadas y deja mandar un correo de prueba.

/** El formulario tal como se ve al final de la tienda. */
function VistaFormulario({ titulo, subtitulo, boton, encendido }) {
  if (!encendido) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-500">
        Apagado: la franja no se dibuja en la tienda y nadie se puede suscribir. Tus suscriptores y campañas quedan como están.
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl px-4 py-5" style={{ background: '#585E9F' }}>
      <p className="text-[15px] font-black leading-tight text-white">{titulo || 'Sin título'}</p>
      {subtitulo && <p className="mt-1 text-xs leading-relaxed text-white/80">{subtitulo}</p>}
      <div className="mt-3 flex gap-2">
        <span className="flex h-9 flex-1 items-center rounded-full bg-white px-3.5 text-xs text-slate-400">tucorreo@correo.com</span>
        <span className="grid h-9 shrink-0 place-items-center rounded-full px-4 text-xs font-bold"
          style={{ background: '#C6CB36', color: '#0D0D1A' }}>
          {boton || 'Suscribirme'}
        </span>
      </div>
    </div>
  );
}

export default function Settings({ settings, estado, maxPorMinuto, tienda }) {
  const [toast] = useToast();

  const { data, setData, post, processing, errors, isDirty } = useForm({
    newsletter_enabled:          settings.newsletter_enabled !== '0',
    newsletter_titulo:           settings.newsletter_titulo ?? '',
    newsletter_subtitulo:        settings.newsletter_subtitulo ?? '',
    newsletter_boton:            settings.newsletter_boton ?? 'Suscribirme',
    newsletter_remitente_nombre: settings.newsletter_remitente_nombre ?? tienda ?? '',
    newsletter_responder_a:      settings.newsletter_responder_a ?? '',
    newsletter_pie:              settings.newsletter_pie ?? '',
    newsletter_lote_por_minuto:  Number(settings.newsletter_lote_por_minuto || 20),
  });

  const prueba = useForm({ email: '' });

  const guardar = (e) => { e.preventDefault(); post(route('admin.newsletter.settings.update'), { preserveScroll: true }); };
  const mandarPrueba = (e) => {
    e.preventDefault();
    prueba.post(route('admin.newsletter.settings.test'), { preserveScroll: true, onSuccess: () => prueba.reset() });
  };

  const porMinuto = data.newsletter_lote_por_minuto;
  const suscriptores = estado?.activos ?? 0;
  const minutos = Math.max(1, Math.ceil((suscriptores || 1000) / porMinuto));
  const demora = minutos === 1
    ? 'en menos de un minuto'
    : minutos < 60
      ? `en unos ${minutos} minutos`
      : `en unas ${Math.round(minutos / 60)} horas`;

  return (
    <AdminLayout>
      <Head title="Ajustes del newsletter" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Ajustes del newsletter"
          subtitle="El formulario con el que la tienda junta correos, con qué nombre llegan tus campañas y a qué velocidad salen."
          actions={(
            <a href="/" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
              <ExternalLink className="h-4 w-4" /> Ver la tienda
            </a>
          )}
        />

        <MarketingTabs active="settings" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Megaphone} label="Formulario en la tienda"
            value={data.newsletter_enabled ? 'Se ve' : 'Apagado'}
            tone={data.newsletter_enabled ? 'emerald' : 'slate'}
            hint={data.newsletter_enabled ? 'al final de todas las páginas' : 'nadie se puede suscribir'} />
          <Stat icon={Mail} label="Servidor de correo" value={estado?.correo?.listo ? 'Listo' : 'Falta'}
            tone={estado?.correo?.listo ? 'emerald' : 'slate'}
            hint={estado?.correo?.desde ?? 'sin configurar'} />
          <Stat icon={ServerCog} label="Proceso de envío" value={estado?.cola?.listo ? 'Corriendo' : 'Detenido'}
            tone={estado?.cola?.listo ? 'emerald' : 'slate'}
            hint={estado?.cola?.pendientes ? `${estado.cola.pendientes} en cola` : 'sin envíos pendientes'} />
          <Stat icon={Gauge} label="Velocidad" value={`${porMinuto}/min`} tone="lila"
            hint={`${(porMinuto * 60).toLocaleString('es-BO')} correos por hora`} />
        </div>

        <AdminGuide id="newsletter-ajustes" title="¿Qué se configura acá?" steps={[
          'El formulario del final de la tienda: enciéndelo y escribe qué gana el cliente por dejarte su correo.',
          'El remitente: con qué nombre llega el correo a la bandeja y a dónde van las respuestas.',
          'La velocidad: cuántos correos por minuto salen, para no pasarte del límite de tu proveedor.',
        ]} tip="La cuenta y la clave del servidor de correo no se editan desde el panel: son una credencial y se cargan en el servidor. Acá se ve si están cargadas y puedes mandarte un correo de prueba para confirmarlo." />

        {!estado?.correo?.listo && (
          <Aviso tono="amber" icon={TriangleAlert}>
            <span className="font-bold">Los correos todavía no pueden salir.</span> {estado?.correo?.falta}
          </Aviso>
        )}

        <form onSubmit={guardar} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <StepCard
              step="1"
              title="El formulario de la tienda"
              subtitle="La franja del final de todas las páginas, donde el cliente deja su correo."
              actions={(
                <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-slate-600">
                  <Switch
                    checked={data.newsletter_enabled}
                    label={data.newsletter_enabled ? 'Ocultar el formulario' : 'Mostrar el formulario'}
                    onChange={(v) => setData('newsletter_enabled', v)}
                  />
                  {data.newsletter_enabled ? 'Se ve' : 'Apagado'}
                </label>
              )}
            >
              <div className="grid gap-4">
                <Field label="Título" error={errors.newsletter_titulo} value={data.newsletter_titulo} max={60}
                  hint="Lo que gana el cliente por dejarte su correo, en pocas palabras.">
                  <Input value={data.newsletter_titulo} maxLength={120}
                    onChange={(e) => setData('newsletter_titulo', e.target.value)} />
                </Field>
                <Field label="Subtítulo" error={errors.newsletter_subtitulo} value={data.newsletter_subtitulo} max={120}
                  hint="Una línea con qué le vas a mandar y cada cuánto. Es opcional.">
                  <Input value={data.newsletter_subtitulo} maxLength={200}
                    onChange={(e) => setData('newsletter_subtitulo', e.target.value)} />
                </Field>
                <Field label="Texto del botón" error={errors.newsletter_boton} value={data.newsletter_boton} max={24}>
                  <Input value={data.newsletter_boton} maxLength={40}
                    onChange={(e) => setData('newsletter_boton', e.target.value)} />
                </Field>
              </div>
            </StepCard>

            <StepCard
              step="2"
              title="Cómo llegan tus correos"
              subtitle="Lo que ve el cliente en su bandeja cuando le mandas una campaña."
            >
              <div className="grid gap-4">
                <Field label="Nombre del remitente" error={errors.newsletter_remitente_nombre}
                  value={data.newsletter_remitente_nombre} max={40}
                  hint="Así figura en la bandeja, antes del asunto. Usa el nombre de tu tienda: si no te reconocen, no abren.">
                  <Input value={data.newsletter_remitente_nombre} maxLength={80}
                    onChange={(e) => setData('newsletter_remitente_nombre', e.target.value)} />
                </Field>

                <Field label="Correo para las respuestas (opcional)" error={errors.newsletter_responder_a}
                  hint="Si el cliente responde la campaña, la respuesta llega acá. Vacío, llega a la misma cuenta desde la que sale el correo.">
                  <Input type="email" value={data.newsletter_responder_a} placeholder="ventas@tudominio.com"
                    onChange={(e) => setData('newsletter_responder_a', e.target.value)} />
                </Field>

                <Field label="Pie de los correos" error={errors.newsletter_pie} value={data.newsletter_pie} max={160}
                  hint="Va al final de cada campaña, arriba del enlace para darse de baja. Sirve para poner quién eres y dónde estás.">
                  <Textarea rows={2} value={data.newsletter_pie} maxLength={300}
                    onChange={(e) => setData('newsletter_pie', e.target.value)} />
                </Field>
              </div>

              <Nota>
                La dirección desde la que salen los correos <span className="font-bold">{estado?.correo?.desde ?? 'todavía no está cargada'}</span>{' '}
                se configura en el servidor: acá solo se cambia el nombre que la acompaña.
              </Nota>
            </StepCard>

            <StepCard
              step="3"
              title="A qué velocidad salen"
              subtitle="Los correos salen de a lotes, uno por minuto, para que el proveedor no corte el envío."
            >
              <Field label={`Correos por minuto (de 1 a ${maxPorMinuto})`} error={errors.newsletter_lote_por_minuto}
                hint={suscriptores > 0
                  ? `Con ${porMinuto} por minuto, tus ${suscriptores.toLocaleString('es-BO')} suscriptores reciben la campaña ${demora}.`
                  : `Con ${porMinuto} por minuto, 1.000 suscriptores la reciben ${demora}.`}>
                <div className="w-32">
                  <Input type="number" min={1} max={maxPorMinuto}
                    value={porMinuto}
                    onChange={(e) => setData('newsletter_lote_por_minuto', Math.min(maxPorMinuto, Math.max(1, Number(e.target.value) || 1)))} />
                </div>
              </Field>

              <Nota tono="amber">
                Una cuenta de Gmail deja mandar alrededor de <span className="font-bold">500 correos por día</span>. Si tu
                lista pasa de ahí, hay que conectar en el servidor un proveedor de envíos (Amazon SES, Brevo, Mailgun):
                el panel no cambia, solo los datos del servidor.
              </Nota>
            </StepCard>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Así se ve en la tienda</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Cambia mientras escribes.</p>
              <VistaFormulario
                encendido={data.newsletter_enabled}
                titulo={data.newsletter_titulo}
                subtitulo={data.newsletter_subtitulo}
                boton={data.newsletter_boton}
              />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">¿Salen los correos?</h2>
              <p className="mt-0.5 mb-4 text-[13px] text-slate-500">Lo que necesita el servidor, y cómo comprobarlo.</p>

              <EstadoDelServidor estado={estado} compacto />

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-[13px] font-bold text-slate-800">Mándate un correo de prueba</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  Es la forma de confirmar que la clave del correo quedó bien cargada, sin escribir una campaña.
                </p>
                <div className="mt-3 grid gap-2">
                  <Input type="email" value={prueba.data.email} placeholder="tu@correo.com"
                    onChange={(e) => prueba.setData('email', e.target.value)} />
                  {prueba.errors.email && <p className="text-xs font-semibold text-red-600">{prueba.errors.email}</p>}
                  <button type="button" onClick={mandarPrueba}
                    disabled={prueba.processing || !prueba.data.email.trim()}
                    className={buttonCls('secondary', 'h-10 w-full')}>
                    <Send className="h-4 w-4" /> {prueba.processing ? 'Enviando…' : 'Enviar prueba'}
                  </button>
                </div>
              </div>
            </section>
          </aside>

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-5 py-3 shadow-sm backdrop-blur xl:col-span-2">
            <p className="flex items-center gap-2 text-[13px] text-slate-500">
              {isDirty ? <><MailCheck className="h-4 w-4 text-amber-500" /> Hay cambios sin guardar.</> : 'Todo guardado.'}
            </p>
            <button type="submit" disabled={processing || !isDirty} className={buttonCls('primary', 'h-11 px-6')}>
              {processing ? 'Guardando…' : 'Guardar ajustes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
