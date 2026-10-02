import { useForm } from '@inertiajs/react';
import StoreLayout, { StoreContainer, useWhatsApp } from '@/Layouts/StoreLayout';
import SecuenciaDesarme from '@/Components/Store/SecuenciaDesarme';
import Reveal from '@/Components/Store/Reveal';
import { ArrowRight, Check, ChevronDown, Laptop, MapPin, MessageCircle, Smartphone, Tablet } from '@/Components/Store/Icons';

// /servicio-tecnico: qué se repara, cómo es el proceso y el formulario para pedir la revisión. Los textos llegan del
// servidor (ServicioTecnicoPublicoController::BLOQUES): son los mismos que se leen sin JavaScript.

const ICONOS = { Laptop, Smartphone, Tablet };
const CAMPO = 'h-12 w-full rounded-xl border bg-white px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-[color:var(--ab-periwinkle)]';
const ANCLA = { scrollMarginTop: 'calc(var(--alto-header, 0px) + 24px)' };
const borde = (error) => ({ borderColor: error ? '#EF4444' : 'var(--border-medium)', color: 'var(--text-primary)' });

export default function ServicioTecnico(props) {
  return (
    <StoreLayout>
      <Contenido {...props} />
    </StoreLayout>
  );
}

function Titulo({ children, bajada }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>{children}</h2>
      {bajada && <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{bajada}</p>}
    </div>
  );
}

function Tarjetas({ items, columnas }) {
  return (
    <ul className={`grid gap-3 sm:grid-cols-2 ${columnas}`}>
      {items.map((item, i) => {
        const Icono = ICONOS[item.icono] ?? Smartphone;
        return (
          <Reveal as="li" key={item.titulo} delay={i * 0.05} className="rounded-2xl border bg-white p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: 'var(--ab-navy)' }}>
              <Icono className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>{item.titulo}</h3>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.texto}</p>
          </Reveal>
        );
      })}
    </ul>
  );
}

function Grupo({ titulo, error, opcional = false, children }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        {titulo}
        {opcional && <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Opcional</span>}
      </p>
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function Pastilla({ elegida, children, ...props }) {
  return (
    <button type="button" {...props}
      className="inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors"
      style={elegida
        ? { background: 'var(--ab-navy)', borderColor: 'var(--ab-navy)', color: '#fff' }
        : { background: '#fff', borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
      {elegida && <Check className="h-3.5 w-3.5" />}{children}
    </button>
  );
}

function Recibida({ enviada }) {
  const wa = useWhatsApp();
  const waUrl = wa.enabled ? wa.url(`${wa.saludo} envié la solicitud de servicio técnico ${enviada.codigo} por mi ${enviada.equipo}.`) : null;

  return (
    <div className="rounded-3xl border bg-white p-6 sm:p-8" style={{ borderColor: 'var(--border-light)' }} role="status">
      <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: 'var(--ab-lime)', color: 'var(--ab-navy)' }}>
        <Check className="h-6 w-6" strokeWidth={2.4} />
      </span>
      <h3 className="mt-5 text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Recibimos tu solicitud, {enviada.nombre}</h3>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Te vamos a escribir por WhatsApp para coordinar la revisión de tu {enviada.equipo}.
      </p>
      <p className="mt-5 inline-block rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
        Tu código: <strong className="font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{enviada.codigo}</strong>
      </p>
      {waUrl && (
        <div className="mt-6">
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--ab-navy)' }}>
            <MessageCircle className="h-4 w-4" /> Escribirnos ahora
          </a>
        </div>
      )}
    </div>
  );
}

function Formulario({ formulario }) {
  const { data, setData, post, processing, errors } = useForm({
    tipo_equipo: '', marca: '', modelo: '', problemas: [], descripcion: '', nombre_contacto: '', telefono_contacto: '', sitio_web: '',
  });
  const esApple = formulario.apple.includes(data.tipo_equipo);
  const sugeridos = formulario.modelos[data.tipo_equipo] ?? [];
  const alternar = (clave) => setData((d) => ({ ...d, problemas: d.problemas.includes(clave) ? d.problemas.filter((p) => p !== clave) : [...d.problemas, clave] }));

  const enviar = (e) => {
    e.preventDefault();
    if (!processing) post('/servicio-tecnico', { preserveScroll: true });
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-7 rounded-3xl border bg-white p-6 sm:p-8" style={{ borderColor: 'var(--border-light)' }}>
      <Grupo titulo="¿Qué equipo es?" error={errors.tipo_equipo}>
        <div role="radiogroup" aria-label="Tipo de equipo" className="flex flex-wrap gap-2">
          {formulario.tipos.map((t) => (
            <Pastilla key={t} role="radio" aria-checked={data.tipo_equipo === t} elegida={data.tipo_equipo === t}
              onClick={() => setData((d) => ({ ...d, tipo_equipo: t, marca: '' }))}>
              {t}
            </Pastilla>
          ))}
        </div>
      </Grupo>

      <div className="grid gap-4 sm:grid-cols-2">
        {data.tipo_equipo && !esApple && (
          <Grupo titulo="Marca" error={errors.marca}>
            <input value={data.marca} maxLength={60} autoComplete="off" placeholder="Ej.: Samsung"
              onChange={(e) => setData('marca', e.target.value)} className={CAMPO} style={borde(errors.marca)} aria-label="Marca" />
          </Grupo>
        )}
        <Grupo titulo="Modelo" error={errors.modelo}>
          <input value={data.modelo} maxLength={120} autoComplete="off" list="modelos-servicio" placeholder={data.tipo_equipo && !esApple ? 'Ej.: Galaxy S23' : 'Ej.: iPhone 13 Pro'}
            onChange={(e) => setData('modelo', e.target.value)} className={CAMPO} style={borde(errors.modelo)} aria-label="Modelo" />
          <datalist id="modelos-servicio">{sugeridos.map((m) => <option key={m} value={m} />)}</datalist>
        </Grupo>
      </div>

      <Grupo titulo="¿Qué le pasa?" error={errors.problemas ?? errors['problemas.0']}>
        <div role="group" aria-label="Problemas del equipo" className="flex flex-wrap gap-2">
          {Object.entries(formulario.problemas).map(([clave, texto]) => (
            <Pastilla key={clave} aria-pressed={data.problemas.includes(clave)} elegida={data.problemas.includes(clave)} onClick={() => alternar(clave)}>
              {texto}
            </Pastilla>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Cuéntanos más" opcional error={errors.descripcion}>
        <textarea value={data.descripcion} maxLength={1000} rows={3} onChange={(e) => setData('descripcion', e.target.value)}
          placeholder="Desde cuándo falla, si se cayó o se mojó, si ya lo revisaron antes…" aria-label="Descripción del problema"
          className="w-full rounded-xl border bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[color:var(--ab-periwinkle)]"
          style={borde(errors.descripcion)} />
      </Grupo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Grupo titulo="Tu nombre" error={errors.nombre_contacto}>
          <input value={data.nombre_contacto} maxLength={120} autoComplete="name" onChange={(e) => setData('nombre_contacto', e.target.value)}
            className={CAMPO} style={borde(errors.nombre_contacto)} aria-label="Tu nombre" />
        </Grupo>
        <Grupo titulo="WhatsApp o teléfono" error={errors.telefono_contacto}>
          <input type="tel" value={data.telefono_contacto} maxLength={30} autoComplete="tel" placeholder="Ej.: 70012345"
            onChange={(e) => setData('telefono_contacto', e.target.value)} className={CAMPO} style={borde(errors.telefono_contacto)} aria-label="WhatsApp o teléfono" />
        </Grupo>
      </div>

      {/* Trampa para robots: una persona no ve este campo */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Sitio web<input tabIndex={-1} autoComplete="off" value={data.sitio_web} onChange={(e) => setData('sitio_web', e.target.value)} /></label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Usamos tus datos solo para responder esta solicitud.
        </p>
        <button type="submit" disabled={processing}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-7 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--ab-navy)' }}>
          {processing ? 'Enviando…' : 'Enviar solicitud'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

function Contenido({ servicio, formulario, faqs = [], locations = [], enviada = null }) {
  const wa = useWhatsApp();
  const waUrl = wa.enabled ? wa.url(`${wa.saludo} quiero consultar por el servicio técnico.`) : null;
  const bloque = (id) => servicio.bloques.find((b) => b.id === id);
  const [equipos, reparaciones, proceso] = [bloque('equipos'), bloque('reparaciones'), bloque('proceso')];
  const local = locations[0] ?? null;

  return (
    <>
      {/* Portada: un iPhone que se desarma al bajar; las piezas son «Lo que más reparamos» */}
      <SecuenciaDesarme titulo={servicio.titulo} waUrl={waUrl} tituloPiezas={reparaciones.titulo} piezas={reparaciones.items}
        bajada="Revisamos tu equipo sin costo para identificar el problema antes de cualquier reparación." />

      <StoreContainer>
        <section className="py-14">
          <Titulo bajada={equipos.texto}>{equipos.titulo}</Titulo>
          <Tarjetas items={equipos.items} columnas="lg:grid-cols-3" />
        </section>

        <section className="border-t py-14" style={{ borderColor: 'var(--border-light)' }}>
          <Titulo>{proceso.titulo}</Titulo>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {proceso.items.map((paso, i) => (
              <Reveal as="li" key={paso.titulo} delay={i * 0.06} className="rounded-2xl border bg-white p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-black tabular-nums" style={{ background: 'var(--ab-lime)', color: 'var(--ab-navy)' }}>{i + 1}</span>
                <h3 className="mt-4 text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>{paso.titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{paso.texto}</p>
              </Reveal>
            ))}
          </ol>
        </section>
      </StoreContainer>

      <section id="solicitud" style={{ background: 'var(--surface-muted)', ...ANCLA }}>
        <StoreContainer className="grid gap-8 py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>Pide la revisión de tu equipo</h2>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Cuéntanos qué equipo es y qué le pasa. Te escribimos por WhatsApp para coordinar cuándo lo traes.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{reparaciones.texto}</p>
            {local && (
              <div className="mt-6 flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--ab-periwinkle)' }} />
                <p>
                  <strong className="block font-bold" style={{ color: 'var(--text-primary)' }}>{local.nombre}</strong>
                  {local.direccion}
                  {local.como_llegar && (
                    <a href={local.como_llegar} target="_blank" rel="noopener noreferrer" className="mt-1 block font-semibold underline underline-offset-4" style={{ color: 'var(--ab-periwinkle)' }}>
                      Cómo llegar
                    </a>
                  )}
                </p>
              </div>
            )}
          </div>
          {enviada ? <Recibida enviada={enviada} /> : <Formulario formulario={formulario} />}
        </StoreContainer>
      </section>

      {/* Preguntas: se cargan en el panel; sin preguntas, la sección no se dibuja */}
      {faqs.length > 0 && (
        <StoreContainer>
          <section className="py-14">
            <Titulo>Preguntas frecuentes</Titulo>
            {faqs.map(({ id, question, answer }) => (
              <details key={id} className="group border-b py-4" style={{ borderColor: 'var(--border-light)' }}>
                <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {question}
                  <ChevronDown className="ml-4 h-4 w-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--text-muted)' }} />
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{answer}</p>
              </details>
            ))}
          </section>
        </StoreContainer>
      )}
    </>
  );
}
