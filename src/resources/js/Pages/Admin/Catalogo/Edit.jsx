import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BadgePercent, CheckCircle2, Circle, ClipboardList, Eye, FileText, Globe,
  Image as ImageIcon, Loader2, Smartphone, Star, Tag, Trash2, Upload,
} from 'lucide-react';
import { Field, Input, Modal, Segmented, Select, StepCard, Switch, Textarea, Toast, bsFmt, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { EncabezadoFormulario, ErroresResumen, Linea, Nota } from '@/Components/Admin/inventario';
import {
  CATEGORIAS, CONDICIONES_TIENDA, EstadoPublicacionBadge, MARCAS, TarjetaTienda, faltantesDe, fechaParaCampo, inventarioUrl, slugDe, tiendaUrl,
} from '@/Components/Admin/catalogo';
import { BateriaNivel, CAMPOS_AUTOMATICOS, camposDeFamilia, gruposFicha } from '@/Components/Store/fichaTecnica';
import { noTiene } from '@/Components/Store/comparativa';

// Editor de una publicación de la tienda: lo que se ve en la ficha pública del producto.

const GARANTIAS = ['1 mes por el negocio', '3 meses por el negocio', '6 meses por el negocio', '12 meses por el negocio', 'Sin garantía'];
const ETIQUETAS = ['OFERTA', 'NUEVO INGRESO', 'ÚLTIMAS UNIDADES', 'RECOMENDADO', 'MÁS VENDIDO'];

const FAMILIAS = { iphone: 'iPhone', ipad: 'iPad', mac: 'Mac', watch: 'Apple Watch', airpods: 'AirPods', general: 'General' };

const SECCIONES = [
  ['producto', 'Producto'], ['fotos', 'Fotos'], ['descripcion', 'Descripción'], ['ficha', 'Ficha técnica'],
  ['precio', 'Precio y promoción'], ['compatibilidad', 'Compatibilidad'], ['google', 'Google'],
];

function Sugeridos({ opciones, onElegir }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {opciones.map((o) => (
        <button key={o} type="button" onClick={() => onElegir(o)}
          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900">{o}</button>
      ))}
    </div>
  );
}

/** Descripción con botones de formato. El servidor limpia el HTML (solo etiquetas seguras). */
function EditorDescripcion({ value, onChange }) {
  const ref = useRef(null);
  const [vista, setVista] = useState(false);

  const envolver = (antes, despues = '') => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: a, selectionEnd: b } = ta;
    onChange(value.slice(0, a) + antes + value.slice(a, b) + despues + value.slice(b));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(a + antes.length, b + antes.length); }, 0);
  };

  const herramientas = [
    ['B', 'Negrita', () => envolver('<strong>', '</strong>'), 'font-bold'],
    ['I', 'Cursiva', () => envolver('<em>', '</em>'), 'italic'],
    ['Título', 'Subtítulo', () => envolver('<h3>', '</h3>')],
    ['Lista', 'Lista con viñetas', () => envolver('<ul>\n  <li>', '</li>\n</ul>')],
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 focus-within:border-[#585E9F] focus-within:ring-4 focus-within:ring-[#585E9F]/15">
      <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
        {!vista && herramientas.map(([label, title, accion, cls]) => (
          <button key={label} type="button" title={title} onClick={accion}
            className={`rounded-lg px-2.5 py-1 text-xs text-slate-600 hover:bg-white hover:text-slate-900 ${cls ?? 'font-semibold'}`}>{label}</button>
        ))}
        <button type="button" onClick={() => setVista((v) => !v)} className="ml-auto rounded-lg px-2.5 py-1 text-xs font-semibold text-[#585E9F] hover:bg-white">
          {vista ? 'Editar' : 'Vista previa'}
        </button>
      </div>
      {vista ? (
        // Vista previa solo para quien edita; lo que se guarda pasa por la limpieza del servidor
        <div className="prose prose-sm min-h-[10rem] max-w-none px-3 py-2 text-slate-700"
          dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400">Sin contenido todavía.</p>' }} />
      ) : (
        <textarea ref={ref} rows={8} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="Cuenta todo lo importante del producto. Usa los botones para negrita, subtítulos o listas."
          className="block w-full resize-y border-0 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0" />
      )}
    </div>
  );
}

/* ─── Fotos ─── */

function Fotos({ publicacion, imagenes, setImagenes, titulo, avisar }) {
  const [subiendo, setSubiendo] = useState(0);
  const [borrar, setBorrar] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef(null);
  const desde = useRef(null);

  const subir = async (archivos) => {
    const lista = Array.from(archivos ?? []);
    if (!lista.length) return;
    setSubiendo((n) => n + lista.length);
    await Promise.all(lista.map(async (archivo) => {
      const fd = new FormData();
      fd.append('imagen', archivo);
      try {
        const { data } = await axios.post(route('admin.catalogo.imagenes.upload', publicacion.id), fd);
        setImagenes((prev) => [...prev, data]);
      } catch (e) {
        avisar(`${archivo.name}: ${e.response?.data?.error || e.response?.data?.message || 'no se pudo subir.'}`, 'error');
      } finally {
        setSubiendo((n) => n - 1);
      }
    }));
  };

  const principal = async (img) => {
    setImagenes((prev) => prev.map((i) => ({ ...i, es_principal: i.id === img.id })));
    try {
      await axios.post(route('admin.catalogo.imagenes.principal', { publicacion: publicacion.id, imagen: img.id }));
    } catch {
      avisar('No se pudo marcar la foto principal.', 'error');
    }
  };

  const eliminar = async () => {
    const img = borrar;
    setBorrar(null);
    try {
      await axios.delete(route('admin.catalogo.imagenes.delete', { publicacion: publicacion.id, imagen: img.id }));
      setImagenes((prev) => prev.filter((i) => i.id !== img.id));
    } catch {
      avisar('No se pudo eliminar la foto.', 'error');
    }
  };

  const mover = async (de, a) => {
    if (a < 0 || a >= imagenes.length || de === a) return;
    const nuevo = [...imagenes];
    const [m] = nuevo.splice(de, 1);
    nuevo.splice(a, 0, m);
    setImagenes(nuevo);
    try {
      await axios.post(route('admin.catalogo.imagenes.reordenar', publicacion.id), { orden: nuevo.map((img, i) => ({ id: img.id, orden: i })) });
    } catch {
      avisar('No se pudo guardar el orden de las fotos.', 'error');
    }
  };

  return (
    <StepCard step={2} title="Fotos" subtitle="La primera marcada con estrella es la principal. Arrastra o usa las flechas para ordenar."
      actions={<span className="text-xs font-semibold tabular-nums text-slate-400">{imagenes.length} {imagenes.length === 1 ? 'foto' : 'fotos'}</span>}>
      {imagenes.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {imagenes.map((img, i) => (
            <li key={img.id} draggable
              onDragStart={() => { desde.current = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); mover(desde.current, i); desde.current = null; }}
              className={`group relative overflow-hidden rounded-xl border-2 bg-slate-50 ${img.es_principal ? 'border-amber-400' : 'border-transparent'}`}>
              <img src={img.url_card ?? img.url_thumb} alt={img.alt || titulo} className="aspect-square w-full cursor-grab object-contain active:cursor-grabbing" draggable={false} />
              {img.es_principal && <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-amber-950">Principal</span>}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <div className="flex gap-1">
                  <button type="button" onClick={() => mover(i, i - 1)} disabled={i === 0} aria-label="Mover a la izquierda"
                    className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-slate-700 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => mover(i, i + 1)} disabled={i === imagenes.length - 1} aria-label="Mover a la derecha"
                    className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-slate-700 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
                <div className="flex gap-1">
                  {!img.es_principal && (
                    <button type="button" onClick={() => principal(img)} aria-label="Marcar como principal" title="Marcar como principal"
                      className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400 text-amber-950"><Star className="h-3.5 w-3.5" /></button>
                  )}
                  <button type="button" onClick={() => setBorrar(img)} aria-label="Eliminar foto"
                    className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); if (e.dataTransfer.files?.length) subir(e.dataTransfer.files); }}
        className={`flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-5 py-5 text-left transition-colors ${arrastrando ? 'border-[#585E9F] bg-[#585E9F]/[0.06]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#585E9F]">
          {subiendo > 0 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-800">{subiendo > 0 ? `Subiendo ${subiendo} ${subiendo === 1 ? 'foto' : 'fotos'}…` : 'Elegir fotos o arrastrarlas aquí'}</span>
          <span className="block text-xs text-slate-500">JPG, PNG o WebP, hasta 10 MB cada una.</span>
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
        onChange={(e) => { subir(e.target.files); e.target.value = ''; }} />
      {imagenes.length === 0 && <Nota tono="amber">Con foto se vende mejor. Sin foto, la tienda muestra una ilustración.</Nota>}

      {borrar && (
        <Modal title="Eliminar foto" onClose={() => setBorrar(null)}
          footer={<><button type="button" onClick={() => setBorrar(null)} className={buttonCls('secondary')}>Cancelar</button><button type="button" onClick={eliminar} className={buttonCls('danger')}>Eliminar</button></>}>
          <div className="flex items-center gap-4">
            <img src={borrar.url_thumb ?? borrar.url_card} alt="" className="h-20 w-20 rounded-xl bg-slate-50 object-contain" />
            <p className="text-sm text-slate-600">La foto se borra de la tienda y no se puede recuperar.</p>
          </div>
        </Modal>
      )}
    </StepCard>
  );
}

/* ─── Compatibilidad ─── */

function Compatibilidad({ publicacion, iniciales, targets, avisar }) {
  const [sel, setSel] = useState(() => new Set(iniciales ?? []));
  const [guardadas, setGuardadas] = useState(() => new Set(iniciales ?? []));
  const [familia, setFamilia] = useState(() => (targets.some((t) => t.family === 'iphone') ? 'iphone' : targets[0]?.family));
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  const porFamilia = useMemo(() => targets.reduce((acc, t) => {
    (acc[t.family] ??= {});
    (acc[t.family][t.generation] ??= []).push(t);
    return acc;
  }, {}), [targets]);

  const q = texto.trim().toLowerCase();
  const generaciones = Object.entries(porFamilia[familia] ?? {})
    .map(([gen, items]) => [gen, q ? items.filter((t) => t.name.toLowerCase().includes(q)) : items])
    .filter(([, items]) => items.length);

  const cambios = sel.size !== guardadas.size || [...sel].some((id) => !guardadas.has(id));
  const alternar = (ids, marcar) => setSel((s) => { const n = new Set(s); ids.forEach((id) => (marcar ? n.add(id) : n.delete(id))); return n; });

  const guardar = async () => {
    setGuardando(true);
    try {
      await axios.post(route('admin.catalogo.compatibilidades.sync', publicacion.id), { target_ids: [...sel] });
      setGuardadas(new Set(sel));
      avisar('Compatibilidades guardadas.');
    } catch {
      avisar('No se pudieron guardar las compatibilidades.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!targets.length) return <p className="text-sm text-slate-500">Todavía no hay modelos cargados para elegir.</p>;

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(porFamilia).map((f) => {
          const n = Object.values(porFamilia[f]).flat().filter((t) => sel.has(t.id)).length;
          const activo = familia === f;
          return (
            <button key={f} type="button" onClick={() => { setFamilia(f); setTexto(''); }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${activo ? 'bg-[#011446] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {FAMILIAS[f] ?? f}{n > 0 && <span className={activo ? 'text-white/70' : 'opacity-60'}>{n}</span>}
            </button>
          );
        })}
      </div>
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={`Buscar en ${FAMILIAS[familia] ?? familia}`} aria-label="Buscar modelo"
        className={`${inputCls} mt-3 h-10`} />
      <div className="mt-3 max-h-[380px] space-y-3 overflow-y-auto pr-1">
        {generaciones.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Sin resultados.</p>}
        {generaciones.map(([gen, items]) => {
          const todos = items.every((t) => sel.has(t.id));
          return (
            <div key={gen} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{gen}</span>
                <button type="button" onClick={() => alternar(items.map((t) => t.id), !todos)} className="text-[11px] font-semibold text-[#585E9F] hover:underline">
                  {todos ? 'Quitar todos' : 'Elegir todos'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((t) => {
                  const on = sel.has(t.id);
                  return (
                    <button key={t.id} type="button" aria-pressed={on} onClick={() => alternar([t.id], !on)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${on ? 'border-[#011446] bg-[#011446] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={guardar} disabled={guardando || !cambios} className={buttonCls('primary')}>
          {guardando ? 'Guardando…' : `Guardar compatibilidad (${sel.size})`}
        </button>
        <span className="text-xs text-slate-500">{cambios ? 'Se guarda aparte del resto del formulario.' : 'Sin cambios pendientes.'}</span>
      </div>
    </>
  );
}

/* ─── Página ─── */

export default function Edit({
  publicacion, inventario, condiciones = [], estadoPublicacion, compatibilidades = [], compatibility_targets = [], modelosReferencia = [], modeloSugerido = null,
  familiaAccesorio = null,
}) {
  const [toast, avisar] = useToast();
  const [imagenes, setImagenes] = useState(publicacion.imagenes ?? []);
  const [borrar, setBorrar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [verCompat, setVerCompat] = useState(false);

  const inicial = useMemo(() => ({
    storefront: publicacion.storefront ?? 'APPLE_BOSS',
    titulo: publicacion.titulo ?? '',
    subtitulo: publicacion.subtitulo ?? '',
    slug: publicacion.slug ?? '',
    resumen: publicacion.resumen ?? '',
    descripcion: publicacion.descripcion ?? '',
    que_incluye: publicacion.que_incluye ?? '',
    observaciones: publicacion.observaciones ?? '',
    garantia: publicacion.garantia ?? '',
    condicion: publicacion.condicion ?? '',
    categoria: publicacion.categoria ?? '',
    subcategoria: publicacion.subcategoria ?? '',
    tags: publicacion.tags ?? [],
    atributos: publicacion.atributos ?? {},
    seo_title: publicacion.seo_title ?? '',
    seo_description: publicacion.seo_description ?? '',
    publicado: Boolean(publicacion.publicado),
    destacado: Boolean(publicacion.destacado),
    publicar_desde: fechaParaCampo(publicacion.publicar_desde),
    publicar_hasta: fechaParaCampo(publicacion.publicar_hasta),
    orden: publicacion.orden ?? 0,
    precio_promocional: publicacion.precio_promocional ?? '',
    promocion_desde: fechaParaCampo(publicacion.promocion_desde),
    promocion_hasta: fechaParaCampo(publicacion.promocion_hasta),
    badge: publicacion.badge ?? '',
    modelo_referencia_id: publicacion.modelo_referencia_id ?? '',
  }), [publicacion]);

  const { data, setData, transform, patch, processing, errors, isDirty } = useForm(inicial);
  const cambiar = useCallback((campo, valor) => setData(campo, valor), [setData]);

  // Los campos vacíos viajan como null y los números como número
  transform((d) => ({
    ...d,
    condicion: d.condicion || null,
    precio_promocional: d.precio_promocional === '' ? null : Number(d.precio_promocional),
    publicar_desde: d.publicar_desde || null,
    publicar_hasta: d.publicar_hasta || null,
    promocion_desde: d.promocion_desde || null,
    promocion_hasta: d.promocion_hasta || null,
    orden: Number(d.orden) || 0,
    modelo_referencia_id: d.modelo_referencia_id ? Number(d.modelo_referencia_id) : null,
  }));

  useEffect(() => {
    if (!isDirty) return undefined;
    const fn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [isDirty]);

  const precio = Number(inventario?.precio_venta) || 0;
  const promo = Number(data.precio_promocional) || 0;
  const faltan = faltantesDe(data, inventario?.existe ? precio : 0);
  const myskinInvalido = data.storefront === 'MYSKIN' && data.categoria !== 'fundas';
  const promoInvalida = promo > 0 && precio > 0 && promo >= precio;
  const principal = imagenes.find((i) => i.es_principal) ?? imagenes[0];
  const esAccesorio = ['fundas', 'accesorios'].includes(data.categoria);
  const grupos = gruposFicha(publicacion.producto_tipo);
  const bateria = inventario?.bateria ?? {};
  const ahora = new Date();
  const promoActiva = promo > 0 && (!data.promocion_desde || new Date(data.promocion_desde) <= ahora) && (!data.promocion_hasta || new Date(data.promocion_hasta) >= ahora);
  const urlTienda = tiendaUrl(publicacion.slug);

  const [modeloElegido, setModeloElegido] = useState(String(publicacion.modelo_referencia_id ?? modeloSugerido ?? ''));
  const [aMano, setAMano] = useState({});

  // Con un modelo vinculado se sabe por qué un campo está vacío: lo que el modelo no tiene (teleobjetivo, LiDAR…) se
  // resume al pie de su grupo en vez de quedar como un campo en blanco; y si la base sumó datos después de llenar la
  // ficha (p. ej. «No compatible» en Apple Intelligence), se avisa que «Llenar desde modelo» los completa.
  const vacio = (v) => String(v ?? '').trim() === '';
  const modeloVinculado = modelosReferencia.find((m) => String(m.id) === String(data.modelo_referencia_id ?? ''));
  const noLoTiene = (campo) => Boolean(modeloVinculado && noTiene(publicacion.producto_tipo, campo.key)
    && vacio(data.atributos?.[campo.key]) && vacio(modeloVinculado.ficha?.[campo.key]));
  // Mac o PC: cada una ve sus campos (Neural Engine y Touch ID son de la Mac; tarjeta gráfica y ampliación, de la PC).
  // Sin modelo vinculado se deduce del título («MacBook», «iMac»); si no se sabe, se ven todos.
  // Un accesorio ve los campos de la familia de su ficha (cargador, vidrio, funda…) o, sin ficha vinculada, los de su tipo
  // en el inventario. En todos los casos se ven también los campos que ya tienen un dato, para no esconder nada.
  // Un producto Apple ve los de su familia (iPad, Apple Watch, AirPods o accesorio de Apple), por su ficha o por el título.
  const familiaApple = () => {
    const t = (data.titulo ?? '').toLowerCase();
    if (/\bipad\b/.test(t)) return 'ipad';
    if (/\b(i?watch)\b/.test(t)) return 'watch';
    if (/\bairpods\b/.test(t)) return 'airpods';
    return /\b(pencil|magic (mouse|keyboard|trackpad))\b/.test(t) ? 'accesorio_apple' : null;
  };
  const familiaFicha = publicacion.producto_tipo === 'producto_general'
    ? modeloVinculado?.familia ?? familiaAccesorio
    : publicacion.producto_tipo === 'producto_apple' ? modeloVinculado?.familia ?? familiaApple()
    : publicacion.producto_tipo !== 'computadora' ? null
      : modeloVinculado?.familia ?? (/\b(macbook|imac|mac mini|mac studio|mac pro)\b/i.test(data.titulo ?? '') ? 'mac' : null);
  const camposDe = (g) => {
    const deLaFamilia = new Set(camposDeFamilia(g, familiaFicha).map((campo) => campo.key));
    return g.campos.filter((campo) => deLaFamilia.has(campo.key) || !vacio(data.atributos?.[campo.key]));
  };
  // Textos de la publicación que un accesorio toma de su ficha si están vacíos
  const TEXTOS_DEL_MODELO = ['resumen', 'descripcion', 'que_incluye'];
  const sinCopiar = modeloVinculado && String(modeloVinculado.id) === modeloElegido
    ? Object.entries(modeloVinculado.ficha ?? {})
      .filter(([clave, valor]) => clave !== 'autonomia_video_horas' && !CAMPOS_AUTOMATICOS.includes(clave) && !vacio(valor) && vacio(data.atributos?.[clave]))
      .length
      + TEXTOS_DEL_MODELO.filter((clave) => !vacio(modeloVinculado.contenido?.[clave]) && vacio(data[clave])).length
    : 0;

  // Completa solo los campos vacíos de la ficha (y, en un accesorio, la descripción); lo escrito a mano y lo del
  // inventario no se tocan
  const llenarDesdeModelo = () => {
    const modelo = modelosReferencia.find((m) => String(m.id) === modeloElegido);
    if (!modelo) return;
    const actuales = data.atributos ?? {};
    const nuevos = { ...actuales };
    let completados = 0;
    Object.entries(modelo.ficha ?? {}).forEach(([clave, valor]) => {
      if (CAMPOS_AUTOMATICOS.includes(clave) || String(actuales[clave] ?? '').trim() !== '') return;
      nuevos[clave] = valor;
      if (clave !== 'autonomia_video_horas') completados += 1;
    });
    const textos = {};
    TEXTOS_DEL_MODELO.forEach((clave) => {
      if (vacio(data[clave]) && !vacio(modelo.contenido?.[clave])) {
        textos[clave] = modelo.contenido[clave];
        completados += 1;
      }
    });
    setData((d) => ({ ...d, ...textos, atributos: nuevos, modelo_referencia_id: modelo.id }));
    avisar(completados
      ? `Se completaron ${completados} datos con la ficha del ${modelo.nombre}. Revisa y guarda.`
      : `La ficha ya tenía todos los datos del ${modelo.nombre}.`);
  };

  const cambiarTitulo = (titulo) => setData((d) => ({ ...d, titulo, slug: !d.slug || d.slug === slugDe(d.titulo) ? slugDe(titulo) : d.slug }));

  const guardar = () => {
    if (processing) return;
    if (data.publicado && faltan.length) {
      avisar('Para mostrarlo en la tienda completa lo que falta, o apaga «En la tienda».', 'error');
      return;
    }
    patch(route('admin.catalogo.update', publicacion.id), {
      preserveScroll: true,
      onError: () => avisar('Revisa los datos marcados.', 'error'),
    });
  };

  const eliminar = () => {
    if (eliminando) return;
    router.delete(route('admin.catalogo.destroy', publicacion.id), { onStart: () => setEliminando(true), onFinish: () => setEliminando(false) });
  };

  const irA = (id) => document.getElementById(`seccion-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <AdminLayout>
      <Head title={`Editar · ${publicacion.titulo}`} />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <EncabezadoFormulario volverUrl={route('admin.catalogo.index')} volverLabel="Volver a productos en la tienda" titulo="Editar publicación"
          subtitulo={[publicacion.titulo, inventario?.nombre_interno && `Inventario: ${inventario.nombre_interno}`].filter(Boolean).join(' · ')} />

        <nav aria-label="Secciones" className="sticky top-16 z-10 -mx-1 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur">
          {SECCIONES.filter(([id]) => id !== 'ficha' || grupos.length).map(([id, label]) => (
            <button key={id} type="button" onClick={() => irA(id)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900">{label}</button>
          ))}
        </nav>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <div id="seccion-producto" className="scroll-mt-32">
              <StepCard step={1} title="Producto" subtitle="Nombre, dirección web, categoría y condición.">
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nombre en la tienda" error={errors.titulo} value={data.titulo} max={255}>
                      <Input value={data.titulo} maxLength={255} onChange={(e) => cambiarTitulo(e.target.value)} placeholder="iPhone 15 Pro Max 256 GB Titanio Natural" />
                    </Field>
                    <Field label="Subtítulo (opcional)" error={errors.subtitulo} hint="Aparece debajo del nombre en la ficha.">
                      <Input value={data.subtitulo} maxLength={255} onChange={(e) => cambiar('subtitulo', e.target.value)} placeholder="La cámara más avanzada de la línea" />
                    </Field>
                  </div>
                  <Field label="Dirección web" error={errors.slug} hint="Se arma sola con el nombre. Si ya compartiste el enlace, evita cambiarla.">
                    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 focus-within:border-[#585E9F] focus-within:ring-4 focus-within:ring-[#585E9F]/15">
                      <span className="hidden items-center bg-slate-50 px-3 text-xs text-slate-500 sm:flex">/productos/</span>
                      <input value={data.slug} onChange={(e) => cambiar('slug', slugDe(e.target.value.replace(/\s/g, '-')))} aria-label="Dirección web"
                        className="min-w-0 flex-1 border-0 px-3 py-2 font-mono text-sm text-slate-900 focus:outline-none focus:ring-0" />
                    </div>
                  </Field>
                  <Field label="Categoría" error={errors.categoria}>
                    <Segmented cols="grid-cols-2 sm:grid-cols-5" options={CATEGORIAS} value={data.categoria} onChange={(v) => cambiar('categoria', v)} ariaLabel="Categoría" />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                    <Field label="Marca" error={errors.storefront}>
                      <Segmented options={MARCAS} value={data.storefront} onChange={(v) => cambiar('storefront', v)} ariaLabel="Marca" />
                      {myskinInvalido && <p className="text-xs font-semibold text-red-600">MYSKIN es solo para la categoría Fundas.</p>}
                    </Field>
                    <Field label="Condición" error={errors.condicion}
                      hint={inventario?.condicion ? `En el inventario figura como ${inventario.condicion}. Nuevo o Seminuevo también se guardan allí.` : 'La eliges tú: nunca se asume.'}>
                      <Segmented cols="grid-cols-2 sm:grid-cols-4" options={CONDICIONES_TIENDA.filter((c) => condiciones.includes(c.value))}
                        value={data.condicion} onChange={(v) => cambiar('condicion', v)} ariaLabel="Condición" />
                    </Field>
                  </div>
                </div>
              </StepCard>
            </div>

            <div id="seccion-fotos" className="scroll-mt-32">
              <Fotos publicacion={publicacion} imagenes={imagenes} setImagenes={setImagenes} titulo={data.titulo} avisar={avisar} />
            </div>

            <div id="seccion-descripcion" className="scroll-mt-32">
              <StepCard step={3} icon={FileText} title="Descripción" subtitle="Lo que lee el cliente en la tarjeta y en la ficha del producto.">
                <div className="grid gap-4">
                  <Field label="Descripción corta" error={errors.resumen} value={data.resumen} max={1000} hint="Se ve en la tarjeta del catálogo: una o dos frases.">
                    <Textarea rows={2} value={data.resumen} maxLength={1000} onChange={(e) => cambiar('resumen', e.target.value)} placeholder="Una o dos frases que resuman el producto." />
                  </Field>
                  <Field label="Descripción completa (opcional)" error={errors.descripcion}>
                    <EditorDescripcion value={data.descripcion} onChange={(v) => cambiar('descripcion', v)} />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Qué incluye" error={errors.que_incluye} hint="Ej.: caja original y cable USB-C.">
                      <Textarea rows={2} value={data.que_incluye} onChange={(e) => cambiar('que_incluye', e.target.value)} />
                    </Field>
                    <Field label="Observaciones" error={errors.observaciones} hint="Detalles de estado visibles al cliente (rayones, marcas…).">
                      <Textarea rows={2} value={data.observaciones} onChange={(e) => cambiar('observaciones', e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Garantía" error={errors.garantia}>
                    <Input value={data.garantia} maxLength={255} onChange={(e) => cambiar('garantia', e.target.value)} placeholder="Ej.: 3 meses por el negocio" />
                    <Sugeridos opciones={GARANTIAS} onElegir={(g) => cambiar('garantia', g)} />
                  </Field>
                </div>
              </StepCard>
            </div>

            {grupos.length > 0 && (
              <div id="seccion-ficha" className="scroll-mt-32">
                <StepCard step={4} icon={ClipboardList} title="Ficha técnica" subtitle="Toda la información técnica. En la tienda se muestra con íconos; deja vacío lo que no aplique.">
                  {modelosReferencia.length > 0 && (
                    <div className="mb-6 rounded-xl border border-[#585E9F]/20 bg-[#585E9F]/[0.05] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                          <Field label="Modelo de referencia"
                            hint={sinCopiar > 0
                              ? `El ${modeloVinculado.nombre} tiene ${sinCopiar === 1 ? 'un dato que esta ficha todavía no tiene' : `${sinCopiar} datos que esta ficha todavía no tiene`}: «Llenar desde modelo» ${sinCopiar === 1 ? 'lo completa' : 'los completa'} sin tocar lo demás.`
                              : modeloSugerido && !publicacion.modelo_referencia_id && String(modeloSugerido) === modeloElegido
                                ? 'Detectado por el nombre del inventario. Completa solo los campos vacíos.'
                                : 'Completa solo los campos vacíos con la ficha del modelo.'}>
                            <Select value={modeloElegido} onChange={(e) => setModeloElegido(e.target.value)} aria-label="Modelo de referencia">
                              <option value="">Elige el modelo</option>
                              {modelosReferencia.map((m) => <option key={m.id} value={m.id}>{m.nombre}{m.anio ? ` (${m.anio})` : ''}</option>)}
                            </Select>
                          </Field>
                        </div>
                        <button type="button" onClick={llenarDesdeModelo} disabled={!modeloElegido} className={buttonCls('primary', 'h-10 shrink-0')}>
                          Llenar desde modelo
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-6">
                    {grupos.map((g) => {
                      const Icon = g.icon;
                      const ausentes = aMano[g.id] ? [] : camposDe(g).filter(noLoTiene);
                      return (
                        <fieldset key={g.id}>
                          <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#585E9F]/10 text-[#585E9F]"><Icon className="h-[18px] w-[18px]" /></span>
                            {g.label}
                          </legend>
                          <div className="grid gap-4 md:grid-cols-2">
                            {camposDe(g).filter((campo) => (campo.key !== 'ciclos_bateria' || bateria.ciclos != null) && !ausentes.includes(campo)).map((campo) => (CAMPOS_AUTOMATICOS.includes(campo.key) && (campo.key !== 'salud_bateria' || bateria.salud) ? (
                              <div key={campo.key} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                                {campo.key === 'salud_bateria' && bateria.salud ? <BateriaNivel porcentaje={bateria.salud} className="h-5 w-9 text-slate-500" /> : null}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{campo.label}</p>
                                  <p className="text-sm font-bold text-slate-900">
                                    {campo.key === 'salud_bateria'
                                      ? `${bateria.salud} %${bateria.sellado ? ' · sellado' : ''}`
                                      : `${bateria.ciclos} ciclos`}
                                  </p>
                                  <p className="text-[11px] text-slate-500">Se toma sola del inventario.</p>
                                </div>
                              </div>
                            ) : (
                              <Field key={campo.key} label={campo.key === 'salud_bateria' ? `${campo.label} (%)` : campo.label}
                                hint={campo.key === 'salud_bateria' ? 'El inventario no tiene un porcentaje claro: escríbelo aquí. Si lo cargas en el inventario, se usa ese.' : campo.hint}>
                                <Input value={data.atributos?.[campo.key] ?? ''} placeholder={campo.key === 'salud_bateria' ? 'Ej.: 87' : (campo.placeholder ? `Ej.: ${campo.placeholder}` : '')}
                                  inputMode={campo.key === 'salud_bateria' ? 'numeric' : undefined}
                                  onChange={(e) => cambiar('atributos', { ...data.atributos, [campo.key]: e.target.value })} />
                              </Field>
                            )))}
                          </div>
                          {ausentes.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl bg-slate-50 px-4 py-3">
                              <p className="text-[13px] leading-snug text-slate-600">
                                <span className="font-semibold text-slate-800">El {modeloVinculado.nombre} no tiene:</span> {ausentes.map((campo) => campo.label).join(', ')}.
                                {' '}Quedan vacíos a propósito y no se muestran en la tienda.
                              </p>
                              <button type="button" onClick={() => setAMano((a) => ({ ...a, [g.id]: true }))}
                                className="shrink-0 text-xs font-bold text-[#585E9F] hover:underline">Completar a mano</button>
                            </div>
                          )}
                        </fieldset>
                      );
                    })}
                  </div>
                  <Nota>El IMEI, el costo y la procedencia nunca se muestran en la tienda, aunque se escriban aquí.</Nota>
                </StepCard>
              </div>
            )}

            <div id="seccion-precio" className="scroll-mt-32">
              <StepCard step={5} icon={BadgePercent} title="Precio y promoción" subtitle="El precio de venta sale del inventario; aquí solo defines una promoción.">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Precio de venta del inventario</p>
                    <p className="mt-0.5 text-xl font-extrabold tabular-nums text-slate-900">{precio ? bsFmt(precio) : 'Sin precio'}</p>
                  </div>
                  {inventario?.existe && inventarioUrl(inventario.tipo, inventario.id) && (
                    <Link href={inventarioUrl(inventario.tipo, inventario.id)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>Cambiar en el inventario</Link>
                  )}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Precio promocional (opcional)" error={errors.precio_promocional || (promoInvalida ? `Debe ser menor a ${bsFmt(precio)}.` : null)}>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Bs</span>
                      <Input type="number" min="0" step="0.01" inputMode="decimal" value={data.precio_promocional} onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => cambiar('precio_promocional', e.target.value)} placeholder="0,00" className="pl-11 font-bold tabular-nums" />
                    </div>
                  </Field>
                  <Field label="Etiqueta (opcional)" error={errors.badge} hint="Se ve sobre la foto en el catálogo.">
                    <Input value={data.badge} maxLength={60} onChange={(e) => cambiar('badge', e.target.value.toUpperCase())} placeholder="OFERTA" />
                    <Sugeridos opciones={ETIQUETAS} onElegir={(b) => cambiar('badge', b)} />
                  </Field>
                  <Field label="Promoción desde" error={errors.promocion_desde} hint="Vacío: empieza de inmediato.">
                    <Input type="datetime-local" value={data.promocion_desde} onChange={(e) => cambiar('promocion_desde', e.target.value)} />
                  </Field>
                  <Field label="Promoción hasta" error={errors.promocion_hasta} hint="Vacío: sin fecha de fin.">
                    <Input type="datetime-local" value={data.promocion_hasta} onChange={(e) => cambiar('promocion_hasta', e.target.value)} />
                  </Field>
                </div>
                {promo > 0 && !promoInvalida && (
                  <p className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold ${promoActiva ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {promoActiva ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    {promoActiva ? `Promoción activa: ahorran ${bsFmt(precio - promo)}.` : 'La promoción está fuera de sus fechas.'}
                  </p>
                )}
              </StepCard>
            </div>

            <div id="seccion-compatibilidad" className="scroll-mt-32">
              <StepCard step={6} icon={Smartphone} title="Compatibilidad" subtitle="Modelos con los que funciona: se muestran en la ficha y ayudan a recomendarlo.">
                {esAccesorio || verCompat ? (
                  <Compatibilidad publicacion={publicacion} iniciales={compatibilidades} targets={compatibility_targets} avisar={avisar} />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">Es útil sobre todo para fundas y accesorios.</p>
                    <button type="button" onClick={() => setVerCompat(true)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
                      Elegir modelos{compatibilidades.length ? ` (${compatibilidades.length})` : ''}
                    </button>
                  </div>
                )}
              </StepCard>
            </div>

            <div id="seccion-google" className="scroll-mt-32">
              <StepCard step={7} icon={Globe} title="Google" subtitle="Opcional. Si lo dejas vacío se usan el nombre y la descripción corta.">
                <div className="grid gap-4">
                  <Field label="Título en Google" error={errors.seo_title} value={data.seo_title} max={60}>
                    <Input value={data.seo_title} maxLength={255} onChange={(e) => cambiar('seo_title', e.target.value)} placeholder={data.titulo} />
                  </Field>
                  <Field label="Descripción en Google" error={errors.seo_description} value={data.seo_description} max={160}>
                    <Textarea rows={2} value={data.seo_description} maxLength={500} onChange={(e) => cambiar('seo_description', e.target.value)} placeholder={data.resumen} />
                  </Field>
                  <div className="rounded-xl border border-slate-200 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Así se vería en Google</p>
                    <p className="mt-1.5 truncate text-[15px] text-[#1a0dab]">{data.seo_title || data.titulo || 'Sin título'} · Apple Boss</p>
                    <p className="truncate text-xs text-emerald-700">{route('store.product', data.slug || 'producto')}</p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-slate-600">{data.seo_description || data.resumen || 'Sin descripción.'}</p>
                  </div>
                </div>
              </StepCard>
            </div>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Tag className="h-[18px] w-[18px] text-[#585E9F]" /> Publicación</h2>
                <EstadoPublicacionBadge estado={estadoPublicacion} />
              </div>
              <div className="space-y-4 p-5">
                <TarjetaTienda titulo={data.titulo} resumen={data.resumen} imagen={principal?.url_card ?? principal?.url_thumb}
                  precio={precio} promo={promoActiva && !promoInvalida ? promo : 0} badge={data.badge} condicion={data.condicion} />

                <div className={`rounded-xl px-4 py-3 text-sm ${faltan.length ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>
                  <p className="flex items-center gap-2 font-bold">
                    {faltan.length ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {faltan.length ? `Falta ${faltan.length === 1 ? '1 dato' : `${faltan.length} datos`} para mostrarlo` : 'Listo para mostrarse en la tienda'}
                  </p>
                  {faltan.length > 0 && <ul className="mt-1.5 list-disc space-y-0.5 pl-6 text-[13px]">{faltan.map((f) => <li key={f}>{f}</li>)}</ul>}
                  {!faltan.length && !imagenes.length && <p className="mt-1 text-[13px]">Sugerido: agrega una foto.</p>}
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">En la tienda</p>
                      <p className="text-xs text-slate-500">{data.publicado ? 'Visible para los clientes.' : 'Guardado como borrador.'}</p>
                    </div>
                    <Switch checked={data.publicado} disabled={!data.publicado && faltan.length > 0} label="Mostrar en la tienda" onChange={(v) => cambiar('publicado', v)} />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Destacado en el inicio</p>
                      <p className="text-xs text-slate-500">Sale en «Productos destacados».</p>
                    </div>
                    <Switch checked={data.destacado} label="Destacado en el inicio" onChange={(v) => cambiar('destacado', v)} />
                  </div>
                  {data.destacado && (
                    <Field label="Posición" hint="El número más bajo aparece primero." error={errors.orden}>
                      <Input type="number" min="0" value={data.orden} onChange={(e) => cambiar('orden', e.target.value)} className="w-28 tabular-nums" />
                    </Field>
                  )}
                  <details className="group border-t border-slate-100 pt-3" open={Boolean(data.publicar_desde || data.publicar_hasta)}>
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">Mostrar solo entre fechas</summary>
                    <div className="mt-3 grid gap-3">
                      <Field label="Desde" error={errors.publicar_desde}>
                        <Input type="datetime-local" value={data.publicar_desde} onChange={(e) => cambiar('publicar_desde', e.target.value)} />
                      </Field>
                      <Field label="Hasta" error={errors.publicar_hasta}>
                        <Input type="datetime-local" value={data.publicar_hasta} onChange={(e) => cambiar('publicar_hasta', e.target.value)} />
                      </Field>
                    </div>
                  </details>
                </div>

                <ErroresResumen errores={errors} />
                {isDirty && <p className="text-center text-xs font-semibold text-amber-700">Tienes cambios sin guardar.</p>}
                <button type="button" onClick={guardar} disabled={processing || !isDirty || myskinInvalido || promoInvalida} className={buttonCls('primary', 'h-12 w-full text-[15px]')}>
                  {processing ? 'Guardando…' : 'Guardar cambios'}
                </button>
                {estadoPublicacion === 'Publicado' && urlTienda && (
                  <a href={urlTienda} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 w-full')}>
                    <Eye className="h-4 w-4" /> Ver en la tienda
                  </a>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><ImageIcon className="h-4 w-4 text-[#585E9F]" /> Inventario</h2>
              {inventario?.existe ? (
                <>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <Linea label="Producto" valor={inventario.nombre_interno} />
                    <Linea label="Estado" valor={inventario.estado} />
                    <Linea label="Condición" valor={inventario.condicion} />
                    <Linea label="Precio de venta" valor={precio ? bsFmt(precio) : ''} />
                  </dl>
                  {inventario.estado !== 'disponible' && <Nota tono="amber">No está disponible en el inventario: la tienda no lo muestra.</Nota>}
                  {inventarioUrl(inventario.tipo, inventario.id) && (
                    <Link href={inventarioUrl(inventario.tipo, inventario.id)} className={buttonCls('ghost', 'mt-3 h-9 w-full text-xs')}>Abrir en el inventario</Link>
                  )}
                </>
              ) : (
                <Nota tono="amber">El producto del inventario ya no existe. Esta publicación no se puede mostrar.</Nota>
              )}
              <button type="button" onClick={() => setBorrar(true)} className={buttonCls('danger', 'mt-4 h-10 w-full')}>
                <Trash2 className="h-4 w-4" /> Eliminar publicación
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">Solo la saca de la tienda: el inventario no cambia.</p>
            </section>
          </aside>
        </div>
      </div>

      {borrar && (
        <Modal title="Eliminar publicación" onClose={() => !eliminando && setBorrar(false)}
          footer={(
            <>
              <button type="button" onClick={() => setBorrar(false)} disabled={eliminando} className={buttonCls('secondary')}>Cancelar</button>
              <button type="button" onClick={eliminar} disabled={eliminando} className={buttonCls('danger')}>{eliminando ? 'Eliminando…' : 'Sí, eliminar'}</button>
            </>
          )}>
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-900">{publicacion.titulo}</span> deja de verse en la tienda y se borran sus {imagenes.length} fotos.
            El producto sigue en el inventario y puedes volver a agregarlo.
          </p>
        </Modal>
      )}
    </AdminLayout>
  );
}
