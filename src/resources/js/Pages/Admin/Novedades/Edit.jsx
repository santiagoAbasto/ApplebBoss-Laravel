import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { CheckCircle2, CircleAlert, ExternalLink, Globe, ImagePlus, Lock, Newspaper, Trash2, Upload } from 'lucide-react';
import { Badge, Field, Input, Segmented, StepCard, Switch, Textarea, Toast, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { EncabezadoFormulario, ErroresResumen, ModalEliminar, Nota } from '@/Components/Admin/inventario';
import SimpleEditor from '@/Components/Admin/SimpleEditor';
import TarjetaNovedad from '@/Components/Store/TarjetaNovedad';
import { DondeSeVen, EstadoNovedad } from '@/Components/Admin/novedades';

// Una novedad: título, resumen, foto, texto, cómo aparece en Google y cuándo se publica. Mientras sea borrador nadie la
// ve y su dirección se puede cambiar; al publicarla la dirección queda fija. Con una fecha futura queda programada.

const soloTexto = (html) => (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const slugDe = (texto) => (texto ?? '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/[\s-]+/g, '-')
  .replace(/^-|-$/g, '');

/** La hora de ahora en Bolivia, con el formato del campo de fecha («2026-09-16T10:30»). */
function ahoraEnBolivia() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const v = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${v.year}-${v.month}-${v.day}T${v.hour === '24' ? '00' : v.hour}:${v.minute}`;
}

/** «2026-09-20T10:30» → «20/09/2026 a las 10:30». */
function fechaDeCampo(valor) {
  const [dia, hora] = (valor ?? '').split('T');
  const [a, m, d] = (dia ?? '').split('-');
  return a && m && d ? `${d}/${m}/${a}${hora ? ` a las ${hora}` : ''}` : '';
}

function Punto({ ok, titulo, texto }) {
  return (
    <li className="flex items-start gap-2.5">
      {ok
        ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Listo" />
        : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-label="Falta" />}
      <span className="min-w-0 text-[13px] leading-snug">
        <span className="font-semibold text-slate-800">{titulo}</span>
        <span className="block text-xs text-slate-500">{texto}</span>
      </span>
    </li>
  );
}

function Formulario({ novedad, donde, google, foto }) {
  const [borrar, setBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [slugTocado, setSlugTocado] = useState(novedad.slug !== slugDe(novedad.titulo));
  const [previa, setPrevia] = useState(null);
  const archivo = useRef(null);

  const { data, setData, post, processing, errors, isDirty, transform, clearErrors } = useForm({
    titulo:          novedad.titulo ?? '',
    slug:            novedad.slug ?? '',
    resumen:         novedad.resumen ?? '',
    cuerpo:          novedad.cuerpo ?? '',
    autor:           novedad.autor ?? '',
    estado:          novedad.estado === 'borrador' ? 'borrador' : 'publicada',
    fecha:           novedad.fecha ?? '',
    seo_title:       novedad.seo_title ?? '',
    seo_description: novedad.seo_description ?? '',
    indexable:       novedad.indexable ?? true,
    imagen:          null,
    quitar_imagen:   false,
  });

  // La foto viaja como archivo: el formulario va por POST con _method=patch
  transform(({ imagen, ...resto }) => ({ ...resto, ...(imagen ? { imagen } : {}), _method: 'patch' }));

  useEffect(() => {
    if (!isDirty) return undefined;
    const avisar = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [isDirty]);

  useEffect(() => () => { if (previa?.url) URL.revokeObjectURL(previa.url); }, [previa]);

  const texto = soloTexto(data.cuerpo);
  const palabras = texto ? texto.split(' ').length : 0;
  const minutos = Math.max(1, Math.ceil(palabras / 200));
  const publicar = data.estado === 'publicada';
  const programada = publicar && Boolean(data.fecha) && data.fecha > ahoraEnBolivia();
  const imagenActual = previa?.url ?? (data.quitar_imagen ? null : novedad.imagen);
  const tituloGoogle = `${data.titulo || novedad.titulo}${google.sufijo ?? ''}`;
  const slugVisible = novedad.direccion_fija ? novedad.slug : (data.slug || slugDe(data.titulo) || 'novedad');

  const cambiarTitulo = (valor) => setData((d) => ({
    ...d,
    titulo: valor,
    ...(!novedad.direccion_fija && !slugTocado ? { slug: slugDe(valor) } : {}),
  }));

  const elegirFoto = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setPrevia({ url, ancho: img.naturalWidth, alto: img.naturalHeight });
    img.onerror = () => setPrevia({ url, ancho: null, alto: null });
    img.src = url;
    setData((d) => ({ ...d, imagen: file, quitar_imagen: false }));
    clearErrors('imagen');
  };

  const quitarFoto = () => {
    setPrevia(null);
    if (archivo.current) archivo.current.value = '';
    setData((d) => ({ ...d, imagen: null, quitar_imagen: Boolean(novedad.imagen) }));
  };

  const guardar = () => {
    if (processing) return;
    post(route('admin.novedades.update', novedad.id), { forceFormData: true, preserveScroll: true });
  };

  const confirmarBorrado = () => {
    setBorrando(true);
    router.delete(route('admin.novedades.destroy', novedad.id), { onFinish: () => setBorrando(false) });
  };

  const fechaPrevia = publicar
    ? (data.fecha ? `${data.fecha}:00-04:00` : (novedad.estado !== 'borrador' && novedad.fecha ? `${novedad.fecha}:00-04:00` : new Date().toISOString()))
    : null;

  const estadoTexto = !publicar
    ? 'No se ve en la tienda. Guárdala así mientras la escribes.'
    : programada
      ? `Programada: se publica sola el ${fechaDeCampo(data.fecha)} (hora de Bolivia).`
      : data.fecha
        ? `Se ve en la tienda, con fecha ${fechaDeCampo(data.fecha)}.`
        : 'Se ve en la tienda desde que la guardes.';

  const botonGuardar = !publicar
    ? 'Guardar borrador'
    : novedad.estado === 'borrador'
      ? (programada ? 'Programar novedad' : 'Publicar novedad')
      : 'Guardar cambios';

  const sinTextoParaPublicar = publicar && palabras === 0;

  return (
    <>
      {borrar && (
        <ModalEliminar
          titulo="Borrar novedad"
          icon={Newspaper}
          nombre={novedad.titulo}
          detalle={novedad.estado === 'borrador' ? 'Borrador' : novedad.url}
          advertencia={novedad.estado === 'borrador'
            ? 'Se borran su texto y su foto. No se puede deshacer.'
            : 'Se borran su texto y su foto, y su dirección deja de abrir. No se puede deshacer: si solo quieres sacarla de la tienda, pásala a borrador.'}
          procesando={borrando}
          onConfirmar={confirmarBorrado}
          onCerrar={() => setBorrar(false)}
        />
      )}

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EncabezadoFormulario
            volverUrl={route('admin.novedades.index')}
            volverLabel="Volver a Novedades"
            titulo={novedad.titulo}
            subtitulo={novedad.actualizada ? `Guardada ${novedad.actualizada}` : null}
          />
          {novedad.estado === 'publicada' && (
            <a href={novedad.url} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-10')}>
              <ExternalLink className="h-4 w-4" /> Ver en la tienda
            </a>
          )}
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <StepCard step={1} title="Título y resumen" subtitle="Lo que se lee en las tarjetas del inicio y de /novedades, en Google y al compartirla.">
              <div className="grid gap-4">
                <Field label="Título" error={errors.titulo} value={data.titulo} max={70}
                  hint="Mejor corto y concreto: que diga la noticia.">
                  <Input value={data.titulo} maxLength={200} onChange={(e) => cambiarTitulo(e.target.value)} />
                </Field>

                <Field label="Dirección web" error={errors.slug}
                  hint={novedad.direccion_fija
                    ? 'Ya se publicó: la dirección no cambia porque es el enlace que se compartió.'
                    : 'Se arma sola con el título. Mientras sea borrador la puedes cambiar; al publicarla queda fija.'}>
                  {novedad.direccion_fija ? (
                    <p className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                      <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{novedad.url}</span>
                    </p>
                  ) : (
                    <div className="flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-[#585E9F] focus-within:ring-4 focus-within:ring-[#585E9F]/15">
                      <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-3 text-sm leading-[42px] text-slate-500">/novedades/</span>
                      <input value={data.slug} maxLength={200} aria-label="Dirección de la novedad"
                        onChange={(e) => { setSlugTocado(true); setData('slug', slugDe(e.target.value)); }}
                        className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-slate-900 focus:outline-none focus:ring-0" />
                    </div>
                  )}
                </Field>

                <Field label="Resumen" error={errors.resumen} value={data.resumen} max={160}
                  hint="Una o dos frases con lo importante. Sale debajo del título en las tarjetas y en Google.">
                  <Textarea rows={2} value={data.resumen} maxLength={300} onChange={(e) => setData('resumen', e.target.value)} />
                </Field>

                <Field label="Autor (opcional)" error={errors.autor} value={data.autor} max={40}
                  hint="El nombre de quien la escribió. Si lo dejas vacío, la firma Apple Boss.">
                  <Input value={data.autor} maxLength={100} placeholder="Apple Boss" onChange={(e) => setData('autor', e.target.value)} />
                </Field>
              </div>
            </StepCard>

            <StepCard step={2} title="Foto principal" subtitle="Va arriba de la novedad y en su tarjeta. Opcional, pero sin foto se ve el fondo de la marca.">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_230px]">
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">
                  {imagenActual ? (
                    <img src={imagenActual} alt="Foto principal" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-center text-slate-400">
                      <div>
                        <ImagePlus className="mx-auto h-8 w-8" />
                        <p className="mt-2 text-sm font-semibold">Sin foto</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => elegirFoto(e.target.files?.[0])} />
                  <button type="button" onClick={() => archivo.current?.click()} className={buttonCls('primary', 'h-11')}>
                    <Upload className="h-4 w-4" /> {imagenActual ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {imagenActual && (
                    <button type="button" onClick={quitarFoto} className={buttonCls('danger', 'h-10')}>
                      <Trash2 className="h-4 w-4" /> Quitar foto
                    </button>
                  )}
                  <p className="text-xs leading-snug text-slate-500">
                    Horizontal (16:9), de al menos {foto.min_ancho} px de ancho. JPG, PNG o WebP, hasta {foto.max_mb} MB.
                  </p>
                  {previa?.ancho && (
                    <p className="text-xs font-semibold text-slate-600">{previa.ancho} × {previa.alto} px · se sube al guardar</p>
                  )}
                  {!previa && imagenActual && novedad.imagen_meta?.width && (
                    <p className="text-xs text-slate-500">{novedad.imagen_meta.width} × {novedad.imagen_meta.height} px</p>
                  )}
                </div>
              </div>

              {previa?.ancho && previa.ancho < foto.min_ancho && (
                <Nota tono="amber">Esta foto mide {previa.ancho} px de ancho: se vería borrosa y no se va a guardar. Usa una de {foto.min_ancho} px o más.</Nota>
              )}
              {previa?.ancho && previa.alto > previa.ancho && (
                <Nota tono="amber">Es vertical: en la tienda se recorta arriba y abajo. Mejor una foto horizontal.</Nota>
              )}
              {errors.imagen && <p className="mt-2 text-xs font-semibold text-red-600">{errors.imagen}</p>}
            </StepCard>

            <StepCard step={3} title="Texto" subtitle="Escribe como en un documento. Con los botones de arriba pones títulos, negrita, listas y enlaces.">
              <SimpleEditor value={data.cuerpo} onChange={(v) => setData('cuerpo', v)} minHeight={320}
                placeholder="Cuenta la novedad: qué llegó, qué cambia para el cliente y qué tiene que hacer." />
              <p className="mt-2 text-xs text-slate-500">
                {palabras === 0 ? 'Todavía sin texto.' : `${palabras.toLocaleString('es-BO')} palabras · ${minutos} min de lectura`}
              </p>
              {errors.cuerpo && <p className="mt-1 text-xs font-semibold text-red-600">{errors.cuerpo}</p>}
              <Nota>
                Al pegar desde Word o desde otra página, el texto entra sin formatos raros. Solo se guardan títulos, negrita,
                cursiva, listas y enlaces.
                {novedad.extras > 0 && ` Esta novedad también tiene ${novedad.extras === 1 ? 'una imagen o cita' : `${novedad.extras} imágenes o citas`} que no se editan acá y se conservan.`}
              </Nota>
            </StepCard>

            <StepCard icon={Globe} title="Google" subtitle="Opcional: cómo aparece en Google y al compartirla por WhatsApp.">
              <div className="grid gap-4">
                <Field label="Título en Google" error={errors.seo_title} value={data.seo_title} max={60}>
                  <Input value={data.seo_title} maxLength={70} placeholder={tituloGoogle} onChange={(e) => setData('seo_title', e.target.value)} />
                </Field>
                <Field label="Descripción en Google" error={errors.seo_description} value={data.seo_description} max={160}>
                  <Textarea rows={2} value={data.seo_description} maxLength={160} placeholder={data.resumen}
                    onChange={(e) => setData('seo_description', e.target.value)} />
                </Field>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Mostrarla en Google</p>
                    <p className="text-xs text-slate-500">
                      {data.indexable ? 'Google puede listarla en sus resultados.' : 'Se ve en la tienda, pero Google no la lista.'}
                    </p>
                  </div>
                  <Switch checked={data.indexable} label="Mostrar la novedad en Google" onChange={(v) => setData('indexable', v)} />
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Así se vería en Google</p>
                  <p className="mt-1.5 truncate text-[15px] text-[#1a0dab]">{data.seo_title || tituloGoogle}</p>
                  <p className="truncate text-xs text-emerald-700">{google.base}{slugVisible}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-slate-600">
                    {data.seo_description || data.resumen || texto || 'Sin descripción: Google elegirá un texto de la novedad.'}
                  </p>
                </div>
              </div>
            </StepCard>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Newspaper className="h-[18px] w-[18px] text-[#585E9F]" /> Publicación
                </h2>
                <EstadoNovedad estado={novedad.estado} />
              </div>

              <div className="space-y-4 p-5">
                <Segmented ariaLabel="Estado de la novedad" value={data.estado} onChange={(v) => setData('estado', v)}
                  options={[{ value: 'borrador', label: 'Borrador' }, { value: 'publicada', label: 'Publicada' }]} />

                {publicar && (
                  <Field label="Fecha de publicación" error={errors.fecha}
                    hint="Vacía: desde ahora. Con una fecha futura queda programada y se publica sola a esa hora.">
                    <input type="datetime-local" value={data.fecha} onChange={(e) => setData('fecha', e.target.value)}
                      className={`${inputCls} h-11`} />
                  </Field>
                )}

                <p className={`rounded-xl px-4 py-3 text-[13px] font-semibold ${!publicar ? 'bg-slate-50 text-slate-600' : programada ? 'bg-[#585E9F]/10 text-[#3F4585]' : 'bg-emerald-50 text-emerald-800'}`}>
                  {estadoTexto}
                </p>

                <ul className="space-y-2.5">
                  <Punto ok={palabras > 0} titulo="Texto"
                    texto={palabras > 0 ? `${palabras.toLocaleString('es-BO')} palabras · ${minutos} min de lectura` : 'Falta: sin texto no se puede publicar.'} />
                  <Punto ok={Boolean(data.resumen.trim())} titulo="Resumen"
                    texto={data.resumen.trim() ? 'Sale en las tarjetas y en Google.' : 'Falta: la tarjeta queda solo con el título.'} />
                  <Punto ok={Boolean(imagenActual)} titulo="Foto"
                    texto={imagenActual ? (previa ? 'Nueva: se sube al guardar.' : 'Lista.') : 'Falta: se ve el fondo de la marca.'} />
                  <Punto ok={data.indexable} titulo="Google"
                    texto={data.indexable ? 'Puede aparecer en los resultados.' : 'Oculta en Google.'} />
                </ul>

                <ErroresResumen errores={errors} />
                {isDirty && <p className="text-center text-xs font-semibold text-amber-700">Tienes cambios sin guardar.</p>}
                {sinTextoParaPublicar && <p className="text-center text-xs font-semibold text-amber-700">Escribe el texto para poder publicarla.</p>}
                <button type="button" onClick={guardar} disabled={processing || !isDirty || sinTextoParaPublicar}
                  className={buttonCls('primary', 'h-12 w-full text-[15px]')}>
                  {processing ? 'Guardando…' : botonGuardar}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900">Así se ve la tarjeta</h2>
                {!publicar && <Badge tone="slate">Borrador</Badge>}
              </div>
              <p className="mt-0.5 text-[13px] text-slate-500">En el inicio, en /novedades y en «Otras novedades».</p>
              <div className="mt-4">
                <TarjetaNovedad vistaPrevia novedad={{
                  titulo: data.titulo,
                  resumen: data.resumen,
                  imagen: imagenActual,
                  fecha: fechaPrevia,
                  minutos: palabras > 0 ? minutos : 0,
                }} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Dónde se ven las novedades</h2>
              <DondeSeVen donde={donde} />
            </section>

            <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-bold text-slate-900">Borrar esta novedad</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Se borran su texto y su foto. Para sacarla de la tienda sin perderla, pásala a borrador.
              </p>
              <button type="button" onClick={() => setBorrar(true)} className={buttonCls('danger', 'mt-3 h-10 w-full')}>
                <Trash2 className="h-4 w-4" /> Borrar novedad
              </button>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}

export default function Edit({ novedad, donde = {}, google = {}, foto = {} }) {
  const [toast] = useToast();

  return (
    <AdminLayout>
      <Head title={`${novedad.titulo} · Novedades`} />
      <Toast toast={toast} />
      {/* Al guardar, el formulario vuelve a arrancar con lo que quedó en la base (la foto subida, la dirección final) */}
      <Formulario key={novedad.version} novedad={novedad} donde={donde} google={google} foto={foto} />
    </AdminLayout>
  );
}
