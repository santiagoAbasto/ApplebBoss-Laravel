import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useRef, useState } from 'react';
import { route } from 'ziggy-js';
import {
  AlertTriangle, CheckCircle2, ExternalLink, EyeOff, FileSearch, Globe, Image as ImageIcon, Pencil, Search, Share2, TriangleAlert,
} from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import {
  Field, Input, MarketingTabs, Modal, PageHeader, StepCard, Switch, Textarea, Toast, buttonCls, inputCls, useToast,
} from '@/Components/Admin/ui';
import { Aviso, Nota, Stat } from '@/Components/Admin/inventario';
import { Consejos } from '@/Components/Admin/newsletter';
import { CONSEJOS_SEO, Medida, VistaCompartir, VistaGoogle } from '@/Components/Admin/seo';

// Marketing y Google → «Google y redes sociales»: el título y la frase con que cada página aparece en Google, y la
// imagen que se ve al compartir un enlace. El texto que sale de verdad lo escribe el servidor (App\Support\Seo).

function urlDe(baseUrl, page) {
  const path = page.tipo === 'plantilla'
    ? page.path.replace('{slug}', 'ejemplo').replace('{titulo}', 'ejemplo')
    : page.path;
  return baseUrl + (path === '/' ? '' : path);
}

function SubirImagen({ path, url, onChange, onError, alto = 'w-48' }) {
  const ref = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [vista, setVista] = useState(url);

  const subir = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('imagen', file);
    setSubiendo(true);
    try {
      const { data } = await axios.post(route('admin.seo.image'), fd);
      setVista(data.url);
      onChange(data.path);
    } catch (e) {
      onError(e.response?.data?.errors?.imagen?.[0] ?? 'No se pudo subir la imagen (JPG, PNG o WEBP, hasta 4 MB).');
    } finally {
      setSubiendo(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className={`flex aspect-[1.91/1] ${alto} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-400`}>
        {path && vista ? <img src={vista} alt="" className="h-full w-full object-cover" /> : 'Sin imagen'}
      </div>
      <div className="space-y-2">
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => subir(e.target.files?.[0])} />
        <button type="button" onClick={() => ref.current?.click()} disabled={subiendo} className={buttonCls('secondary', 'h-10')}>
          <ImageIcon className="h-4 w-4" /> {subiendo ? 'Subiendo…' : path ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        {path && (
          <button type="button" onClick={() => { onChange(''); setVista(null); }}
            className="block text-xs font-semibold text-red-600 hover:underline">
            Quitar imagen
          </button>
        )}
        <p className="text-[11px] leading-relaxed text-slate-500">1200 × 630 px, JPG o PNG, hasta 4 MB.</p>
      </div>
    </div>
  );
}

function Formulario({ page, baseUrl, global, limites, onCerrar, onError }) {
  const { data, setData, patch, processing, errors } = useForm({
    title:       page.title ?? '',
    description: page.description ?? '',
    og_image:    page.og_image ?? '',
    noindex:     Boolean(page.noindex),
    canonical:   page.canonical ?? '',
  });

  const plantilla = page.tipo === 'plantilla';
  const llenar = (t) => (t || '').replaceAll('{titulo}', page.ejemplo ?? 'Ejemplo');
  const titulo = llenar(data.title || page.default?.title);
  const descripcion = llenar(data.description || page.default?.description || global.seo_descripcion_default);
  const url = urlDe(baseUrl, page);
  const imagen = data.og_image
    ? (data.og_image === page.og_image ? page.og_image_url : null)
    : global.og_default_url;

  const guardar = () => patch(route('admin.seo.update', page.id), { preserveScroll: true, onSuccess: onCerrar });

  return (
    <Modal
      wide
      title={page.label}
      onClose={onCerrar}
      footer={(
        <>
          <button type="button" onClick={onCerrar} className={buttonCls('secondary', 'h-11')}>Cancelar</button>
          <button type="button" onClick={guardar} disabled={processing} className={buttonCls('primary', 'h-11')}>
            {processing ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      )}
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid content-start gap-4">
          {plantilla && (
            <Nota>
              Es una plantilla: vale para todas las páginas de este tipo. Escribe <code className="rounded bg-white px-1">{'{titulo}'}</code> donde
              quieras que salga el nombre de cada uno. Acá se ve con «{page.ejemplo}».
            </Nota>
          )}

          <Field
            label="Título"
            error={errors.title}
            hint={page.default?.title ? `Si lo dejas vacío, se usa «${page.default.title}».` : 'Lo primero que se lee en Google.'}
          >
            <Input value={data.title} maxLength={191} placeholder={page.default?.title}
              onChange={(e) => setData('title', e.target.value)} />
            <div className="mt-1 flex justify-end">
              <Medida valor={titulo} max={limites.titulo} etiqueta="en Google" />
            </div>
          </Field>

          <Field
            label="Descripción"
            error={errors.description}
            hint={plantilla
              ? 'Si la dejas vacía, se usa el resumen de cada producto o novedad.'
              : `Lo ideal es entre ${limites.desc_min} y ${limites.desc_max} caracteres.`}
          >
            <Textarea rows={3} value={data.description} maxLength={320} placeholder={page.default?.description}
              onChange={(e) => setData('description', e.target.value)} />
            <div className="mt-1 flex justify-end">
              <Medida valor={descripcion} min={limites.desc_min} max={limites.desc_max} etiqueta="en Google" />
            </div>
          </Field>

          <Field label="Imagen al compartir" error={errors.og_image}
            hint={plantilla
              ? 'Los productos y las novedades usan su propia foto; esta solo sale si no tienen.'
              : 'La que se ve al pegar el enlace en WhatsApp o Facebook. Vacía, se usa la imagen general.'}>
            <SubirImagen path={data.og_image} url={page.og_image_url} onChange={(p) => setData('og_image', p)} onError={onError} />
          </Field>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 px-3.5 py-3">
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-slate-900">Ocultar de Google</span>
              <span className="block text-xs leading-relaxed text-slate-500">
                La página sigue abriéndose con su enlace, pero Google no la muestra y sale del sitemap.
              </span>
            </span>
            <Switch checked={data.noindex} onChange={(v) => setData('noindex', v)} label="Ocultar de Google" />
          </label>

          {!plantilla && (
            <Field label="Dirección principal" error={errors.canonical}
              hint="Solo si esta página repite el contenido de otra. Si no sabes qué poner, déjalo vacío: se usa su propia dirección.">
              <Input value={data.canonical} maxLength={255} placeholder={url}
                onChange={(e) => setData('canonical', e.target.value)} />
            </Field>
          )}
        </div>

        <div className="grid content-start gap-4 md:sticky md:top-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">En Google</p>
            <div className="mt-1.5">
              <VistaGoogle url={url} titulo={titulo} descripcion={descripcion} oculta={data.noindex} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Al compartir el enlace</p>
            <div className="mt-1.5">
              <VistaCompartir url={url} titulo={titulo} descripcion={descripcion} imagen={imagen}
                sitio={global.seo_sitio_nombre} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Fila({ p, baseUrl, onEditar }) {
  return (
    <li className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start ${p.noindex ? 'bg-slate-50/60' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold text-slate-900">{p.label}</span>
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{p.path}</code>
          {p.noindex && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              <EyeOff className="h-3 w-3" /> OCULTA
            </span>
          )}
          {p.propio
            ? <span className="rounded-full bg-[#585E9F]/10 px-2 py-0.5 text-[10px] font-bold text-[#585E9F]">ESCRITO POR TI</span>
            : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">TEXTO AUTOMÁTICO</span>}
        </div>

        <p className="mt-1 truncate text-[15px] text-[#1a0dab]">{p.titulo_real || 'Sin título'}</p>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">
          {p.descripcion_real || 'Sin descripción'}
        </p>

        {p.problemas.map((problema) => (
          <p key={problema.texto} className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-amber-700">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {problema.texto}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
        <a href={urlDe(baseUrl, p)} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <ExternalLink className="h-3.5 w-3.5" /> Ver
        </a>
        <button type="button" onClick={() => onEditar(p)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
      </div>
    </li>
  );
}

function Lista({ titulo, subtitulo, icon: Icon, pages, baseUrl, onEditar }) {
  if (pages.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Icon className="h-[18px] w-[18px] text-[#585E9F]" /> {titulo}
          <span className="text-sm font-semibold text-slate-400">{pages.length}</span>
        </h2>
        <p className="mt-0.5 text-[13px] text-slate-500">{subtitulo}</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {pages.map((p) => <Fila key={p.id} p={p} baseUrl={baseUrl} onEditar={onEditar} />)}
      </ul>
    </section>
  );
}

export default function SeoIndex({ pages, global, baseUrl, sitio, resumen, limites }) {
  const [toast, mostrarToast] = useToast();
  const [editando, setEditando] = useState(null);

  const generales = useForm({
    seo_sitio_nombre:        global.seo_sitio_nombre ?? '',
    seo_descripcion_default: global.seo_descripcion_default ?? '',
    seo_og_imagen_default:   global.seo_og_imagen_default ?? '',
  });

  const fijas = pages.filter((p) => p.tipo === 'pagina');
  const plantillas = pages.filter((p) => p.tipo === 'plantilla');
  const conProblemas = pages.filter((p) => p.problemas.length > 0);

  const guardarGenerales = (e) => {
    e.preventDefault();
    generales.post(route('admin.seo.global'), { preserveScroll: true });
  };

  return (
    <AdminLayout>
      <Head title="Google y redes sociales" />
      <Toast toast={toast} />

      {editando && (
        <Formulario page={editando} baseUrl={baseUrl} global={global} limites={limites}
          onCerrar={() => setEditando(null)} onError={(m) => mostrarToast(m, 'error')} />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Google y redes sociales"
          subtitle="El título y la frase con que cada página de tu tienda aparece en Google, y la foto que se ve cuando alguien comparte un enlace por WhatsApp."
          actions={(
            <>
              <a href={sitio.robots} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                <FileSearch className="h-4 w-4" /> robots.txt
              </a>
              <a href={sitio.sitemap} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                <ExternalLink className="h-4 w-4" /> Ver el sitemap
              </a>
            </>
          )}
        />

        <MarketingTabs active="seo" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Search} label="Páginas en Google" value={resumen.total - resumen.ocultas} tone="navy"
            hint={resumen.ocultas > 0 ? `${resumen.ocultas} ocultas a propósito` : 'todas se pueden encontrar'} />
          <Stat icon={Pencil} label="Escritas por ti" value={resumen.personalizadas} tone="emerald"
            hint={`de ${resumen.total}; el resto usa el texto automático`} />
          <Stat icon={AlertTriangle} label="Para revisar" value={resumen.con_problemas}
            tone={resumen.con_problemas > 0 ? 'slate' : 'emerald'}
            hint={resumen.con_problemas === 0 ? 'ninguna queda corta ni larga' : 'sin texto, o muy corto o muy largo'} />
          <Stat icon={Globe} label="Dirección del sitio" value={sitio.listo ? 'Lista' : 'De prueba'}
            tone={sitio.listo ? 'emerald' : 'slate'} hint={sitio.url.replace(/^https?:\/\//, '')} />
        </div>

        <AdminGuide id="seo-google" title="¿Cómo aparece tu tienda en Google?" steps={[
          'Cada página tiene un título y una frase. Si no escribes nada, Apple Boss pone un texto automático que ya sirve.',
          'Toca «Editar» en la página que quieras y escribe los tuyos: al costado ves cómo queda en Google y al compartir el enlace.',
          'Los productos, las novedades y las páginas informativas se configuran una sola vez con una plantilla: {titulo} se reemplaza por el nombre de cada uno.',
        ]} tip="Google puede tardar días o semanas en mostrar un cambio. Lo que sí se ve al toque es la tarjeta de WhatsApp: pega el enlace en un chat contigo mismo para probarla." />

        {!sitio.listo && (
          <Aviso tono="amber" icon={TriangleAlert}>
            <span className="font-bold">La dirección del sitio todavía no es la definitiva.</span> {sitio.falta}
          </Aviso>
        )}

        {conProblemas.length > 0 && (
          <Aviso tono="lila" icon={AlertTriangle}>
            <span className="font-bold">
              {conProblemas.length === 1 ? 'Una página necesita una vuelta' : `${conProblemas.length} páginas necesitan una vuelta`}:
            </span>{' '}
            {conProblemas.slice(0, 3).map((p) => p.label).join(', ')}
            {conProblemas.length > 3 && ` y ${conProblemas.length - 3} más`}. Están marcadas abajo.
          </Aviso>
        )}

        {resumen.con_problemas === 0 && sitio.listo && (
          <Aviso tono="lila" icon={CheckCircle2}>
            <span className="font-bold">Todo en orden.</span> Cada página tiene su título y su frase dentro de la medida que muestra Google.
          </Aviso>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <Lista
              titulo="Páginas de la tienda"
              subtitulo="El inicio, el catálogo, los hubs y las demás páginas fijas. Cada una tiene su propio texto."
              icon={Globe}
              pages={fijas}
              baseUrl={baseUrl}
              onEditar={setEditando}
            />

            <Lista
              titulo="Plantillas"
              subtitulo="Se aplican a todos los productos, novedades, páginas y colecciones de una vez. Si un producto tiene su propio texto, ese manda."
              icon={Share2}
              pages={plantillas}
              baseUrl={baseUrl}
              onEditar={setEditando}
            />

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Cómo escribir para Google</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Estos textos deciden si te hacen clic, no solo si te encuentran.</p>
              <Consejos
                consejos={CONSEJOS_SEO}
                cierre={(
                  <>
                    <span className="font-bold text-slate-800">Para que Google te encuentre antes:</span> date de alta gratis en
                    Google Search Console (search.google.com/search-console), verifica tu dominio y pégale la dirección de tu
                    sitemap, que es <code className="rounded bg-white px-1">{sitio.sitemap}</code>.
                  </>
                )}
              />
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <form onSubmit={guardarGenerales}>
              <StepCard
                icon={Globe}
                title="Para toda la tienda"
                subtitle="Lo que se usa en las páginas que no tienen texto propio."
              >
                <div className="grid gap-4">
                  <Field label="Nombre del sitio" error={generales.errors.seo_sitio_nombre}
                    hint="Acompaña a cada página en Google y en las redes.">
                    <Input value={generales.data.seo_sitio_nombre} maxLength={80}
                      onChange={(e) => generales.setData('seo_sitio_nombre', e.target.value)} />
                  </Field>

                  <Field label="Descripción por defecto" error={generales.errors.seo_descripcion_default}
                    hint="La frase que sale cuando una página no tiene la suya.">
                    <Textarea rows={3} value={generales.data.seo_descripcion_default} maxLength={320}
                      onChange={(e) => generales.setData('seo_descripcion_default', e.target.value)} />
                    <div className="mt-1 flex justify-end">
                      <Medida valor={generales.data.seo_descripcion_default} min={limites.desc_min} max={limites.desc_max} etiqueta="en Google" />
                    </div>
                  </Field>

                  <Field label="Imagen al compartir" hint="La que se ve al pegar cualquier enlace de tu tienda en WhatsApp.">
                    <SubirImagen
                      path={generales.data.seo_og_imagen_default}
                      url={global.og_default_url}
                      alto="w-40"
                      onChange={(p) => generales.setData('seo_og_imagen_default', p)}
                      onError={(m) => mostrarToast(m, 'error')}
                    />
                  </Field>

                  <button type="submit" disabled={generales.processing || !generales.isDirty}
                    className={buttonCls('primary', 'h-11 w-full')}>
                    {generales.processing ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </StepCard>
            </form>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Lo que lee Google</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Dos archivos que tu tienda arma sola.</p>
              <ul className="mt-4 grid gap-2">
                <li className="rounded-xl border border-slate-100 px-3.5 py-3">
                  <p className="text-[13px] font-bold text-slate-800">El sitemap</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    La lista de todas tus páginas, productos y novedades, al día. Las páginas ocultas no entran.
                  </p>
                  <a href={sitio.sitemap} target="_blank" rel="noopener noreferrer"
                    className={buttonCls('secondary', 'mt-2.5 h-9 px-3 text-xs')}>
                    <ExternalLink className="h-3.5 w-3.5" /> Abrirlo
                  </a>
                </li>
                <li className="rounded-xl border border-slate-100 px-3.5 py-3">
                  <p className="text-[13px] font-bold text-slate-800">El robots.txt</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    Le dice a Google qué no mirar: el panel, el acceso y las direcciones internas.
                  </p>
                  <a href={sitio.robots} target="_blank" rel="noopener noreferrer"
                    className={buttonCls('secondary', 'mt-2.5 h-9 px-3 text-xs')}>
                    <ExternalLink className="h-3.5 w-3.5" /> Abrirlo
                  </a>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
