import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useMemo } from 'react';
import {
  ArrowDownRight, ArrowUpRight, Bot, CheckCircle2, CircleAlert, Clock, ExternalLink, Eye, Globe, MessageCircle,
  MonitorSmartphone, Search, ShoppingBag, Users, Wrench,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Field, Input, PageHeader, Toast, useToast } from '@/Components/Admin/ui';

// Tienda online → Tráfico: la medición propia de la tienda (sin cookies) y la puesta en marcha en Google, Bing y
// los buscadores de IA. Los datos vienen de App\Support\Trafico\Panel; los gráficos son SVG, sin librerías.

const num = (n) => (Number(n) || 0).toLocaleString('es-BO');
const pct = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);
const regiones = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;
const pais = (codigo) => { try { return regiones?.of(codigo) ?? codigo; } catch { return codigo; } };
const bandera = (codigo) => (/^[A-Z]{2}$/.test(codigo ?? '') ? String.fromCodePoint(...[...codigo].map((c) => 127397 + c.charCodeAt(0))) : '🌐');

function Variacion({ actual, antes }) {
  if (!antes) return <span className="text-[12px] font-semibold text-slate-400">sin período anterior</span>;
  const cambio = Math.round(((actual - antes) / antes) * 100);
  const sube = cambio >= 0;
  const Icono = sube ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12px] font-bold ${sube ? 'text-emerald-600' : 'text-rose-600'}`}>
      <Icono className="h-3.5 w-3.5" />{Math.abs(cambio)} % vs. período anterior
    </span>
  );
}

function Kpi({ icono: Icono, titulo, valor, pie, tono = 'bg-slate-100 text-slate-700' }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tono}`}><Icono className="h-5 w-5" /></span>
        <p className="text-[13px] font-semibold text-slate-500">{titulo}</p>
      </div>
      <p className="mt-4 text-[26px] font-extrabold leading-none text-slate-900 tabular-nums">{valor}</p>
      {pie && <div className="mt-2">{pie}</div>}
    </div>
  );
}

function Tarjeta({ titulo, subtitulo, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 ${className}`}>
      <h2 className="text-[15px] font-bold text-slate-900">{titulo}</h2>
      {subtitulo && <p className="mt-0.5 text-[12px] text-slate-500">{subtitulo}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Visitas y visitantes por día: dos áreas sobre el mismo eje, con la fecha de cada extremo. */
function GraficoDias({ serie }) {
  const W = 720; const H = 200; const P = 8;
  const max = Math.max(1, ...serie.map((d) => d.visitas));
  const x = (i) => P + (i * (W - 2 * P)) / Math.max(1, serie.length - 1);
  const y = (v) => H - P - (v / max) * (H - 2 * P);
  const linea = (k) => serie.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(' ');
  const area = (k) => `${linea(k)} L${x(serie.length - 1)},${H - P} L${x(0)},${H - P} Z`;
  const fecha = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
  if (!serie.some((d) => d.visitas)) return <p className="py-14 text-center text-sm text-slate-400">Todavía no hay visitas en este período. Se empiezan a contar desde que se sube esta versión.</p>;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full" role="img" aria-label="Visitas y visitantes por día">
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="#e2e8f0" strokeDasharray="4 4" />)}
        <path d={area('visitas')} fill="rgba(1,20,70,0.08)" />
        <path d={linea('visitas')} fill="none" stroke="#011446" strokeWidth="2.2" strokeLinejoin="round" />
        <path d={area('visitantes')} fill="rgba(198,203,54,0.18)" />
        <path d={linea('visitantes')} fill="none" stroke="#9aa025" strokeWidth="2" strokeLinejoin="round" />
        {serie.map((d, i) => <title key={d.dia}>{`${fecha(d.dia)}: ${d.visitas} visitas, ${d.visitantes} visitantes`}</title>)}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>{fecha(serie[0].dia)}</span><span>{fecha(serie[serie.length - 1].dia)}</span></div>
      <div className="mt-3 flex gap-4 text-[12px] font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#011446]" /> Visitas</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#9aa025]" /> Visitantes</span>
      </div>
    </div>
  );
}

function Horas({ horas }) {
  const max = Math.max(1, ...horas);
  const pico = horas.indexOf(Math.max(...horas));
  return (
    <div>
      <div className="flex h-28 items-end gap-[3px]">
        {horas.map((v, h) => (
          <div key={h} title={`${h}:00 — ${v} visitas`} className="flex-1 rounded-t" style={{ height: `${Math.max(3, (v / max) * 100)}%`, background: h === pico && v ? '#c6cb36' : '#011446', opacity: v ? 1 : 0.15 }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>0 h</span><span>12 h</span><span>23 h</span></div>
      {horas.some(Boolean) && <p className="mt-2 text-[12px] text-slate-500">La hora con más visitas: <strong>{pico}:00 a {pico + 1}:00</strong> (hora de Bolivia).</p>}
    </div>
  );
}

function Lista({ filas, vacio, etiqueta = (f) => f.etiqueta }) {
  const max = Math.max(1, ...filas.map((f) => f.total));
  if (!filas.length) return <p className="py-6 text-center text-sm text-slate-400">{vacio}</p>;
  return (
    <ul className="space-y-2">
      {filas.map((f, i) => (
        <li key={i} className="relative overflow-hidden rounded-lg">
          <span className="absolute inset-y-0 left-0 rounded-lg bg-[#011446]/[0.06]" style={{ width: `${(f.total / max) * 100}%` }} />
          <div className="relative flex items-center justify-between gap-3 px-3 py-1.5 text-[13px]">
            <span className="truncate text-slate-700">{etiqueta(f)}</span>
            <span className="shrink-0 font-bold tabular-nums text-slate-900">{num(f.total)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Embudo({ pasos }) {
  const base = pasos[0]?.total || 0;
  return (
    <ol className="space-y-2.5">
      {pasos.map((p, i) => (
        <li key={p.paso}>
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-semibold text-slate-700">{p.paso}</span>
            <span className="tabular-nums text-slate-500"><strong className="text-slate-900">{num(p.total)}</strong>{i > 0 && base > 0 ? ` · ${pct(p.total, base)} %` : ''}</span>
          </div>
          <div className="mt-1 h-2.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${base ? Math.max(p.total ? 2 : 0, pct(p.total, base)) : 0}%`, background: i === pasos.length - 1 ? '#c6cb36' : '#011446' }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Paso({ listo, titulo, children }) {
  const Icono = listo ? CheckCircle2 : CircleAlert;
  return (
    <li className="flex gap-3">
      <Icono className={`mt-0.5 h-5 w-5 shrink-0 ${listo ? 'text-emerald-600' : 'text-amber-500'}`} />
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-slate-900">{titulo}</p>
        <div className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{children}</div>
      </div>
    </li>
  );
}

const Enlace = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#011446] underline underline-offset-2">
    {children}<ExternalLink className="h-3 w-3" />
  </a>
);

function PuestaEnMarcha({ puesta, medicion }) {
  const form = useForm({ ga4: medicion.ga4 ?? '', clarity: medicion.clarity ?? '' });
  const legalesPendientes = puesta.legales.filter((l) => l.borrador);
  const fechaIndexNow = puesta.indexnow?.fecha ? new Date(puesta.indexnow.fecha).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : null;

  return (
    <Tarjeta titulo="Puesta en marcha en Google, Bing y buscadores de IA" subtitulo="Lo que hace falta para que la tienda aparezca en Google, ChatGPT, Gemini, Copilot y Perplexity.">
      <ol className="space-y-4">
        <Paso listo={puesta.publicados >= 30} titulo={`Productos publicados: ${num(puesta.publicados)}`}>
          Es lo que más pesa: Google y los asistentes de IA recomiendan tiendas con productos para comprar. Publica el inventario disponible en Tienda online → Productos en la tienda.
        </Paso>
        <Paso listo titulo="Google Search Console">
          El dominio ya está verificado. Revisa ahí qué páginas indexa Google y pide indexar las nuevas. <Enlace href={puesta.enlaces.search_console}>Abrir Search Console</Enlace>
        </Paso>
        <Paso listo={false} titulo="Bing Webmaster Tools (ChatGPT y Copilot buscan sobre Bing)">
          Entra con la cuenta de Google de la tienda, elige «Importar desde Google Search Console» y confirma. En dos minutos Bing toma el sitio y el sitemap. <Enlace href={puesta.enlaces.bing}>Abrir Bing Webmaster</Enlace>
        </Paso>
        <Paso listo={Boolean(fechaIndexNow)} titulo="IndexNow: aviso automático a Bing">
          {fechaIndexNow ? `Último aviso: ${fechaIndexNow} (${num(puesta.indexnow.direcciones)} direcciones).` : 'Se activa solo al subir esta versión: cada 15 minutos avisa lo nuevo, lo que cambió y lo vendido.'} El sitemap tiene {num(puesta.sitemap)} direcciones.
        </Paso>
        <Paso listo={puesta.resenas} titulo="Perfil de Google y reseñas">
          {puesta.resenas ? 'Conectado: las reseñas de Google se importan solas.' : 'Conecta el perfil en Tienda online → Reseñas.'} Publica fotos y novedades en el perfil cada semana. <Enlace href={puesta.enlaces.perfil_google}>Abrir el perfil</Enlace>
        </Paso>
        <Paso listo={!legalesPendientes.length} titulo="Textos legales">
          {legalesPendientes.length
            ? <>Faltan datos por confirmar en {legalesPendientes.map((l, i) => <span key={l.url}>{i ? ', ' : ''}<a href={l.url} target="_blank" rel="noreferrer" className="font-semibold underline">{l.titulo}</a></span>)}. Mientras tanto se ven en la tienda pero Google no los indexa. Complétalos en Tienda online → Páginas.</>
            : 'Privacidad, términos y cookies completos y publicados.'}
        </Paso>
      </ol>

      <form onSubmit={(e) => { e.preventDefault(); form.patch(route('admin.trafico.medicion'), { preserveScroll: true }); }} className="mt-6 rounded-xl border border-slate-200 p-4">
        <p className="text-[14px] font-semibold text-slate-900">Google Analytics y Microsoft Clarity (opcionales)</p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
          Esta pantalla ya mide sin ellos. Si quieres además grabaciones de visitas y mapas de calor (Clarity, gratis) o los informes de Google, pega acá su código.
          Solo cargan si el visitante acepta el aviso de cookies, que aparece solo cuando hay un código cargado.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="ID de medición de GA4" error={form.errors.ga4} hint={<>Admin → Flujos de datos → Web. <Enlace href={puesta.enlaces.analytics}>Google Analytics</Enlace></>}>
            <Input value={form.data.ga4} onChange={(e) => form.setData('ga4', e.target.value)} placeholder="G-XXXXXXXXXX" />
          </Field>
          <Field label="ID de proyecto de Clarity" error={form.errors.clarity} hint={<>Settings → Overview → Project ID. <Enlace href={puesta.enlaces.clarity}>Clarity</Enlace></>}>
            <Input value={form.data.clarity} onChange={(e) => form.setData('clarity', e.target.value)} placeholder="abcd1234ef" />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" variant="primary" disabled={form.processing}>{form.processing ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Tarjeta>
  );
}

export default function Index({ dias, periodos, datos, medicion, puesta }) {
  const [toast] = useToast();
  const r = datos.resumen;
  const conversion = useMemo(() => (r.visitantes ? ((r.pedidos / r.visitantes) * 100).toLocaleString('es-BO', { maximumFractionDigits: 1 }) : '0'), [r]);

  return (
    <AdminLayout title="Tráfico y visitas">
      <Head title="Tráfico y visitas" />
      <PageHeader
        title="Tráfico y visitas"
        subtitle="Quién visita la tienda, de dónde llega, qué mira y cuánto termina en un pedido. Medición propia, sin cookies; los bots no se cuentan."
        actions={(
          <div className="flex rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Período">
            {periodos.map((p) => (
              <button key={p} type="button" role="radio" aria-checked={p === dias}
                onClick={() => router.get(route('admin.trafico.index'), { dias: p }, { preserveScroll: true, preserveState: true })}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${p === dias ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {p} días
              </button>
            ))}
          </div>
        )}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icono={Eye} titulo="Visitas" valor={num(r.visitas)} tono="bg-[#011446]/[0.07] text-[#011446]" pie={<Variacion actual={r.visitas} antes={r.visitas_antes} />} />
        <Kpi icono={Users} titulo="Visitantes" valor={num(r.visitantes)} tono="bg-lime-50 text-lime-700" pie={<Variacion actual={r.visitantes} antes={r.visitantes_antes} />} />
        <Kpi icono={ShoppingBag} titulo="Pedidos en la web" valor={num(r.pedidos)} tono="bg-emerald-50 text-emerald-700" pie={<span className="text-[12px] font-semibold text-slate-500">{conversion} % de los visitantes</span>} />
        <Kpi icono={MessageCircle} titulo="Clics en WhatsApp" valor={num(r.whatsapp)} tono="bg-green-50 text-green-700" pie={<span className="text-[12px] font-semibold text-slate-500">{num(r.solicitudes)} solicitudes de servicio y Trade-In</span>} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Tarjeta titulo="Visitas por día" className="xl:col-span-2"><GraficoDias serie={datos.serie} /></Tarjeta>
        <Tarjeta titulo="De la visita al pedido" subtitulo="Cuántos llegan a cada paso de la compra."><Embudo pasos={datos.embudo} /></Tarjeta>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Tarjeta titulo="De dónde llegan" subtitulo="Visitantes según el sitio desde el que entraron.">
          <Lista filas={datos.origenes} vacio="Sin visitas todavía." />
        </Tarjeta>
        <Tarjeta titulo="Páginas más vistas"><Lista filas={datos.paginas} vacio="Sin visitas todavía." /></Tarjeta>
        <Tarjeta titulo="A qué hora entran" subtitulo={<span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Visitas por hora del día</span>}>
          <Horas horas={datos.horas} />
        </Tarjeta>
        <Tarjeta titulo="Productos más vistos"><Lista filas={datos.productos} vacio="Nadie abrió un producto en este período." /></Tarjeta>
        <Tarjeta titulo="Agregados al carrito"><Lista filas={datos.agregados} vacio="Nadie agregó al carrito en este período." /></Tarjeta>
        <Tarjeta titulo="Lo que buscan" subtitulo={<span className="inline-flex items-center gap-1"><Search className="h-3 w-3" /> En el buscador de la tienda</span>}>
          <Lista filas={datos.busquedas} vacio="Sin búsquedas en este período." />
        </Tarjeta>
        <Tarjeta titulo="Lo que buscan y no encuentran" subtitulo="Ideas de qué publicar o qué traer.">
          <Lista filas={datos.sin_resultados} vacio="Todas las búsquedas encontraron algo." />
        </Tarjeta>
        <Tarjeta titulo="Países" subtitulo={<span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> Según la red de Cloudflare</span>}>
          <Lista filas={datos.paises} vacio="Sin datos de país todavía." etiqueta={(f) => `${bandera(f.etiqueta)} ${pais(f.etiqueta)}`} />
        </Tarjeta>
        <Tarjeta titulo="Dispositivos y navegadores" subtitulo={<span className="inline-flex items-center gap-1"><MonitorSmartphone className="h-3 w-3" /> {num(r.bots)} visitas de bots no se cuentan</span>}>
          <Lista filas={datos.dispositivos} vacio="Sin datos todavía." />
          <div className="mt-4"><Lista filas={datos.navegadores} vacio="" /></div>
        </Tarjeta>
      </div>

      <div className="mt-4"><PuestaEnMarcha puesta={puesta} medicion={medicion} /></div>

      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-slate-400"><Bot className="h-3.5 w-3.5" /> Las visitas se guardan 14 meses, sin IP ni datos personales. <Wrench className="ml-2 h-3.5 w-3.5" /> Los pedidos y solicitudes los registra el servidor.</p>
      <Toast toast={toast} />
    </AdminLayout>
  );
}
