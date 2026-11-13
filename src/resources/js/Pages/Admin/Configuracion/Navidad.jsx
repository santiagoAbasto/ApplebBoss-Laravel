import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { CalendarClock, ExternalLink, Eye, EyeOff, Gift, Power, Sparkles } from 'lucide-react';
import { Field, Input, PageHeader, Segmented, StepCard, Switch, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { Aviso, Stat } from '@/Components/Admin/inventario';
import { Campana, Esfera, Estrella, Gorro, ILUSTRACIONES, Ilustracion, Luces, Rama, Regalo } from '@/Components/Temporada';

// Tienda online → Campaña de Navidad: enciende, programa, previsualiza y apaga la apariencia navideña de la tienda
// y del panel. Quién decide si se ve es el servidor (App\Support\Temporada); esta pantalla solo guarda sus ajustes.

const MODOS = [
  { value: 'apagado', label: 'Apagada', icon: Power },
  { value: 'manual', label: 'Encendida', icon: Sparkles },
  { value: 'programado', label: 'Programada', icon: CalendarClock },
];
const INTENSIDADES = [{ value: 'festiva', label: 'Festiva' }, { value: 'discreta', label: 'Discreta' }];

const fechaLegible = (local) => {
  if (!local) return null;
  const [dia, hora] = local.split('T');
  const [a, m, d] = dia.split('-');
  return `${d}/${m}/${a} a las ${hora}`;
};

function Interruptor({ checked, onChange, titulo, ayuda }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
      <Switch checked={checked} onChange={onChange} label={titulo} />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{titulo}</span>
        <span className="block text-[12px] leading-snug text-slate-500">{ayuda}</span>
      </span>
    </label>
  );
}

function Pieza({ nombre, children }) {
  return (
    <figure className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="grid h-24 w-full place-items-center">{children}</div>
      <figcaption className="text-center text-[11px] font-semibold text-slate-500">{nombre}</figcaption>
    </figure>
  );
}

/** Así se ve: un recorte de la tienda con los ajustes de esta pantalla, sin guardar nada. */
function Muestra({ data }) {
  const encendida = data.navidad_modo !== 'apagado' && data.navidad_publico;
  // El mismo atributo que lleva <html>, puesto en este recuadro: los estilos de navidad.css valen solo acá adentro
  const atributos = encendida ? { 'data-season': 'christmas', 'data-season-surface': 'publico', 'data-season-intensity': data.navidad_intensidad_publico } : {};

  return (
    <div {...atributos} className="overflow-hidden rounded-xl border border-slate-200" style={{ background: encendida && data.navidad_intensidad_publico === 'festiva' ? '#FFF8EE' : '#FAFAF9' }}>
      {encendida && data.navidad_texto.trim() && (
        <div className="nv-franja"><p className="nv-franja-contenido"><Estrella className="nv-franja-estrella" /><span className="truncate">{data.navidad_texto.trim()}</span></p></div>
      )}
      <div className="relative flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">
          {encendida && <Gorro className="nv-gorro" style={{ width: 26, left: -8, top: -8 }} />}AB
        </span>
        <span className="text-sm font-bold text-slate-800">Apple Boss</span>
        {encendida && data.navidad_luces && <Luces className="nv-luces-encabezado" />}
      </div>
      <div className="flex items-end justify-between gap-3 px-4 pb-4 pt-9">
        <div>
          <p className="text-[13px] font-bold text-slate-800">iPhone disponible hoy</p>
          <p className="text-[12px] text-slate-500">Bs 0.000 · precio de ejemplo</p>
          <span className="mt-2 inline-flex h-9 items-center rounded-full px-4 text-[12px] font-bold text-white"
            style={{ background: encendida && data.navidad_intensidad_publico === 'festiva' ? '#143D2B' : '#011446', boxShadow: encendida ? 'inset 0 0 0 1px rgba(226,188,114,.55)' : 'none' }}>
            Agregar al carrito
          </span>
        </div>
        {encendida && data.navidad_personajes && <Ilustracion nombre="PapaNoel" forzar className="w-16" />}
        {encendida && !data.navidad_personajes && <Regalo className="h-12 w-12" />}
      </div>
    </div>
  );
}

export default function Navidad({ ajustes, activa, vistaPrevia, zona, ahora, largoTexto = 90 }) {
  const [toast] = useToast();
  const { data, setData, post, processing, errors, isDirty } = useForm({
    navidad_modo: ajustes.navidad_modo,
    navidad_publico: ajustes.navidad_publico,
    navidad_admin: ajustes.navidad_admin,
    navidad_inicio: ajustes.navidad_inicio ?? '',
    navidad_fin: ajustes.navidad_fin ?? '',
    navidad_intensidad_publico: ajustes.navidad_intensidad_publico,
    navidad_intensidad_admin: ajustes.navidad_intensidad_admin,
    navidad_personajes: ajustes.navidad_personajes,
    navidad_luces: ajustes.navidad_luces,
    navidad_animaciones: ajustes.navidad_animaciones,
    navidad_nieve: ajustes.navidad_nieve,
    navidad_musica: ajustes.navidad_musica,
    navidad_tapas: ajustes.navidad_tapas,
    navidad_texto: ajustes.navidad_texto ?? '',
    navidad_enlace: ajustes.navidad_enlace ?? '',
  });

  const guardar = (e) => { e.preventDefault(); post(route('admin.configuracion.navidad.update'), { preserveScroll: true }); };
  const previsualizar = () => post(route('admin.configuracion.navidad.vista-previa'), { preserveScroll: true });
  const salirDePrevia = () => router.delete(route('admin.configuracion.navidad.vista-previa.salir'), { preserveScroll: true });
  const apagar = () => router.post(route('admin.configuracion.navidad.apagar'), {}, { preserveScroll: true });

  const programada = data.navidad_modo === 'programado';
  const estado = ajustes.navidad_modo === 'apagado' ? 'Apagada' : activa ? 'Se ve ahora' : 'Programada, todavía no se ve';

  return (
    <AdminLayout>
      <Head title="Campaña de Navidad" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Campaña de Navidad"
          subtitle="La apariencia navideña de la tienda y del panel: colores de temporada, luces, personajes y un texto de campaña. Se enciende, se programa y se apaga desde acá, sin tocar nada más."
          actions={(
            <>
              <a href="/" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                <ExternalLink className="h-4 w-4" /> Ver la tienda
              </a>
              {ajustes.navidad_modo !== 'apagado' && (
                <button type="button" onClick={apagar} className={buttonCls('danger', 'h-11 px-4')}>
                  <Power className="h-4 w-4" /> Apagar la campaña
                </button>
              )}
            </>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Gift} label="Campaña" value={estado} tone={activa ? 'emerald' : 'slate'}
            hint={ajustes.navidad_modo === 'programado' ? `del ${fechaLegible(ajustes.navidad_inicio)} al ${fechaLegible(ajustes.navidad_fin)}` : ajustes.navidad_modo === 'manual' ? 'encendida a mano, hasta que la apagues' : 'la tienda se ve como siempre'} />
          <Stat icon={Sparkles} label="Tienda" value={ajustes.navidad_publico ? ajustes.navidad_intensidad_publico : 'sin Navidad'} tone={ajustes.navidad_publico ? 'lila' : 'slate'} hint="lo que ve el cliente" />
          <Stat icon={Sparkles} label="Panel" value={ajustes.navidad_admin ? ajustes.navidad_intensidad_admin : 'sin Navidad'} tone={ajustes.navidad_admin ? 'lila' : 'slate'} hint="administrador y vendedor" />
          <Stat icon={CalendarClock} label="Hora de Bolivia" value={fechaLegible(ahora)} tone="navy" hint={`zona ${zona}: con esta hora se programa`} />
        </div>

        {vistaPrevia && (
          <Aviso tono="amber" icon={Eye} accion="Salir de la vista previa" onAccion={salirDePrevia}>
            <span className="font-bold">Estás en vista previa.</span> Solo tú ves la tienda y el panel con los ajustes que probaste; los clientes siguen viendo lo publicado.
          </Aviso>
        )}

        <form onSubmit={guardar} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <StepCard step="1" title="Cuándo se ve" subtitle="Apagada, encendida a mano o entre dos fechas.">
              <Segmented options={MODOS} value={data.navidad_modo} onChange={(v) => setData('navidad_modo', v)} ariaLabel="Modo de la campaña" />
              {errors.navidad_modo && <p className="mt-2 text-xs font-semibold text-red-600">{errors.navidad_modo}</p>}

              {programada && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Empieza" error={errors.navidad_inicio} hint="Desde ese minuto exacto ya se ve.">
                    <Input type="datetime-local" value={data.navidad_inicio} onChange={(e) => setData('navidad_inicio', e.target.value)} />
                  </Field>
                  <Field label="Termina" error={errors.navidad_fin} hint="A esa hora exacta deja de verse (ese minuto ya no cuenta).">
                    <Input type="datetime-local" value={data.navidad_fin} onChange={(e) => setData('navidad_fin', e.target.value)} />
                  </Field>
                  <p className="text-[12px] leading-snug text-slate-500 sm:col-span-2">
                    Las dos fechas son en hora de Bolivia ({zona}). La tienda se enciende y se apaga sola con el reloj del servidor:
                    {data.navidad_inicio && data.navidad_fin
                      ? <> se verá desde el <b>{fechaLegible(data.navidad_inicio)}</b> y dejará de verse el <b>{fechaLegible(data.navidad_fin)}</b>.</>
                      : ' elige las dos fechas.'}
                  </p>
                </div>
              )}
            </StepCard>

            <StepCard step="2" title="Dónde se ve" subtitle="La tienda y el panel se encienden por separado, cada uno con su intensidad.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Interruptor checked={data.navidad_publico} onChange={(v) => setData('navidad_publico', v)} titulo="Tienda (lo que ve el cliente)" ayuda="Portada, catálogo, fichas, carrito, Trade-In, servicio técnico y acceso." />
                  <Field label="Intensidad en la tienda" error={errors.navidad_intensidad_publico} hint="Festiva cambia fondos y botones al verde pino y marfil. Discreta deja los colores de siempre y suma solo adornos y acentos.">
                    <Segmented options={INTENSIDADES} value={data.navidad_intensidad_publico} onChange={(v) => setData('navidad_intensidad_publico', v)} ariaLabel="Intensidad en la tienda" />
                  </Field>
                </div>
                <div className="space-y-3">
                  <Interruptor checked={data.navidad_admin} onChange={(v) => setData('navidad_admin', v)} titulo="Panel (administrador y vendedor)" ayuda="Menú, barra de arriba, botones y encabezados. Las tablas y los formularios no se animan." />
                  <Field label="Intensidad en el panel" error={errors.navidad_intensidad_admin} hint="Discreta mantiene el menú azul con detalles de temporada. Festiva lo viste de verde pino.">
                    <Segmented options={INTENSIDADES} value={data.navidad_intensidad_admin} onChange={(v) => setData('navidad_intensidad_admin', v)} ariaLabel="Intensidad en el panel" />
                  </Field>
                </div>
              </div>
            </StepCard>

            <StepCard step="3" title="Qué lleva" subtitle="Cada pieza se puede apagar por separado.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Interruptor checked={data.navidad_personajes} onChange={(v) => setData('navidad_personajes', v)} titulo="Personajes" ayuda="Papá Noel, el duende técnico, el reno y las escenas de los estados vacíos." />
                <Interruptor checked={data.navidad_luces} onChange={(v) => setData('navidad_luces', v)} titulo="Luces" ayuda="La tira de luces cálidas bajo el encabezado y en el menú del panel." />
                <Interruptor checked={data.navidad_animaciones} onChange={(v) => setData('navidad_animaciones', v)} titulo="Animaciones" ayuda="El saludo de la portada, el brillo de las luces y de los botones. Quien pide menos movimiento en su equipo no las ve nunca." />
                <Interruptor checked={data.navidad_nieve} onChange={(v) => setData('navidad_nieve', v)} titulo="Nieve (opcional)" ayuda="Unos pocos copos sobre la tienda. Nunca cae sobre el pago, el seguimiento ni el panel." />
                <Interruptor checked={data.navidad_tapas} onChange={(v) => setData('navidad_tapas', v)} titulo="Tapas de regalo en el catálogo" ayuda="Cada foto de producto aparece tapada con una caja de regalo roja con cinta y moño dorados. El primer clic la destapa y queda abierta hasta que el visitante cierre la web. Ojo: mientras está tapada no se ve el producto, solo su nombre y su precio." />
                <Interruptor checked={data.navidad_musica} onChange={(v) => setData('navidad_musica', v)} titulo="Música navideña" ayuda="Villancicos suaves en la tienda. Empiezan con el primer clic del visitante (los navegadores no dejan antes) y cada persona puede apagarlos con un botón que queda a la vista." />
              </div>
            </StepCard>

            <StepCard step="4" title="Texto de campaña" subtitle="La franja de arriba de la tienda y el título del bloque de la portada. Vacío, la franja no se dibuja.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Texto" value={data.navidad_texto} max={largoTexto} error={errors.navidad_texto} hint="Un saludo o una invitación. No prometas descuentos, envoltorio ni entregas que no estén vigentes.">
                  <Input value={data.navidad_texto} maxLength={largoTexto} placeholder="Esta Navidad, regala tecnología" onChange={(e) => setData('navidad_texto', e.target.value)} />
                </Field>
                <Field label="Enlace (una página de la tienda)" error={errors.navidad_enlace} hint="Empieza con «/». Por ejemplo /catalogo, /iphone o /seminuevos.">
                  <Input value={data.navidad_enlace} maxLength={200} placeholder="/catalogo" onChange={(e) => setData('navidad_enlace', e.target.value)} />
                </Field>
              </div>
            </StepCard>

            <StepCard icon={Sparkles} title="Piezas de la campaña" subtitle="Todas son dibujos propios del sitio. Acá se revisan sus tamaños y que hablen el mismo idioma.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Pieza nombre="Gorro"><Gorro className="h-12 w-auto" style={{ width: 60 }} /></Pieza>
                <Pieza nombre="Regalos"><span className="flex items-end gap-1"><Regalo className="h-8 w-8" tono="marfil" /><Regalo className="h-12 w-12" /><Regalo className="h-9 w-9" tono="pino" /><Regalo className="h-7 w-7" tono="navy" /></span></Pieza>
                <Pieza nombre="Esferas"><span className="flex items-end gap-2"><Esfera style={{ width: 28 }} /><Esfera style={{ width: 22 }} color="#1F5A40" /><Esfera style={{ width: 18 }} color="#E2BC72" /></span></Pieza>
                <Pieza nombre="Campana y estrella"><span className="flex items-center gap-3"><Campana style={{ width: 40 }} /><Estrella style={{ width: 22 }} /></span></Pieza>
                <Pieza nombre="Rama"><Rama style={{ width: 120 }} /></Pieza>
                <Pieza nombre="Luces (compacta)"><Luces compacta /></Pieza>
                {Object.entries(ILUSTRACIONES).map(([clave, { nombre }]) => (
                  <Pieza key={clave} nombre={nombre}><Ilustracion nombre={clave} forzar className="h-24" /></Pieza>
                ))}
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white px-2 pt-1"><Luces /></div>
            </StepCard>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-20">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Así queda la tienda</p>
              <p className="mb-3 mt-1 text-[12px] text-slate-500">Un recorte con lo que elegiste arriba. Todavía no se guardó nada.</p>
              <Muestra data={data} />

              <div className="mt-4 flex flex-col gap-2">
                <button type="button" onClick={previsualizar} disabled={processing} className={buttonCls('secondary', 'h-11 w-full')}>
                  <Eye className="h-4 w-4" /> Probar en la tienda (solo yo)
                </button>
                {vistaPrevia && (
                  <button type="button" onClick={salirDePrevia} className={buttonCls('ghost', 'h-10 w-full')}>
                    <EyeOff className="h-4 w-4" /> Salir de la vista previa
                  </button>
                )}
                <p className="text-[12px] leading-snug text-slate-500">
                  La vista previa viste la tienda y el panel solo en tu sesión, con estos ajustes y sin esperar la fecha. Nadie más la ve y no cambia lo publicado.
                </p>
              </div>
            </section>
          </aside>

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-5 py-3 shadow-sm backdrop-blur xl:col-span-2">
            <p className="text-[13px] text-slate-500">{isDirty ? 'Hay cambios sin guardar.' : 'Todo guardado.'}</p>
            <button type="submit" disabled={processing || !isDirty} className={buttonCls('primary', 'h-11 px-6')}>
              {processing ? 'Guardando…' : 'Guardar campaña'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
