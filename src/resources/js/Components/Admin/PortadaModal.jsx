import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Field, Input, Modal, Select, Textarea, buttonCls, inputCls } from '@/Components/Admin/ui';
import LinkPicker from '@/Components/Admin/LinkPicker';
import { metaDe } from '@/Components/Admin/portada';

// El editor de una sección de la portada: sus textos, sus botones, cuántos productos muestra y desde cuándo se ve.

const TEMAS = [
  { value: 'appleboss_navy', label: 'Azul Apple Boss' },
  { value: 'light', label: 'Claro' },
  { value: 'myskin', label: 'Verde MYSKIN' },
];

const CON_LIMITE = ['featured', 'category_products', 'product_collection', 'myskin', 'semiused', 'new_arrivals', 'offers'];
// Servicios y Dónde estamos no muestran productos, pero su título sí se cambia acá (el contenido, en su módulo)
const CON_TITULO = [...CON_LIMITE, 'services', 'location', 'news'];

const AYUDA_TITULO = {
  product_collection: 'Si lo dejas vacío, se usa el nombre de la colección.',
  services: 'Si lo dejas vacío, dice «Nuestros servicios». Las tarjetas se cargan en Tienda online → Servicios.',
  news: 'Si lo dejas vacío, dice «Lo último de Apple Boss». Las novedades se escriben en Tienda online → Novedades.',
  location: 'Si lo dejas vacío, dice «Estamos en» y la ciudad (o «Dónde estamos» si tienes locales en varias ciudades).',
};

const AYUDA_BAJADA = {
  location: 'Si la dejas vacía, se usa la descripción del local. Los locales, su orden y sus datos se cargan en Tienda online → Ubicaciones.',
};

const PLACEHOLDER_TITULO = { services: 'Nuestros servicios', location: 'Estamos en Cochabamba', news: 'Lo último de Apple Boss' };

export default function ModalSeccion({ section, colecciones = [], categorias = [], onCerrar }) {
  const meta = metaDe(section.type);
  const { data, setData, patch, processing, errors } = useForm({
    settings: { ...(section.settings ?? {}) },
    publicar_desde: section.publicar_desde ?? '',
    publicar_hasta: section.publicar_hasta ?? '',
  });

  const set = (campo, valor) => setData('settings', { ...data.settings, [campo]: valor });

  const guardar = () => {
    if (processing) return;
    patch(route('admin.home-builder.update', section.id), {
      preserveScroll: true,
      onSuccess: onCerrar,
    });
  };

  return (
    <Modal
      title={section.titulo}
      onClose={onCerrar}
      footer={(
        <>
          <button type="button" onClick={onCerrar} className={buttonCls('secondary', 'h-11')}>Cancelar</button>
          <button type="button" onClick={guardar} disabled={processing} className={buttonCls('primary', 'h-11')}>
            {processing ? 'Guardando…' : 'Guardar sección'}
          </button>
        </>
      )}
    >
      <div className="grid gap-4">
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
          <span className="font-bold text-slate-800">{meta.nombre}.</span> {meta.ayuda}
        </p>

        {section.type === 'hero' && (
          <>
            <p className="rounded-xl border border-slate-200 px-4 py-3 text-[13px] leading-relaxed text-slate-600">
              La volanta, el título y el texto se ven arriba a la izquierda de la portada; en el celular, arriba del equipo.
              Si los dejas vacíos, la portada muestra solo los equipos. El segundo botón va al lado de «Ver catálogo».
            </p>
            <Field label="Texto chico de arriba" value={data.settings.eyebrow} max={40}>
              <Input value={data.settings.eyebrow ?? ''} maxLength={80} placeholder="Ej.: Nuevos ingresos"
                onChange={(e) => set('eyebrow', e.target.value)} />
            </Field>
            <Field label="Título grande" value={data.settings.titulo} max={60}>
              <Input value={data.settings.titulo ?? ''} maxLength={120} onChange={(e) => set('titulo', e.target.value)} />
            </Field>
            <Field label="Texto" value={data.settings.descripcion} max={140}>
              <Textarea rows={2} value={data.settings.descripcion ?? ''} maxLength={300} onChange={(e) => set('descripcion', e.target.value)} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Botón principal: texto" value={data.settings.cta_label} max={24}>
                <Input value={data.settings.cta_label ?? ''} maxLength={40} placeholder="Ver catálogo"
                  onChange={(e) => set('cta_label', e.target.value)} />
              </Field>
              <Field label="Botón principal: a dónde lleva">
                <LinkPicker value={data.settings.cta_url ?? ''} onChange={(v) => set('cta_url', v)} className={`${inputCls} h-11`}
                  allowEmpty emptyLabel="Todo el catálogo (por defecto)" />
              </Field>
              <Field label="Segundo botón: texto" value={data.settings.cta2_label} max={24} hint="Déjalo vacío si no quieres un segundo botón.">
                <Input value={data.settings.cta2_label ?? ''} maxLength={40} onChange={(e) => set('cta2_label', e.target.value)} />
              </Field>
              <Field label="Segundo botón: a dónde lleva">
                <LinkPicker value={data.settings.cta2_url ?? ''} onChange={(v) => set('cta2_url', v)} className={`${inputCls} h-11`}
                  allowEmpty emptyLabel="Sin segundo botón" />
              </Field>
            </div>
            <Field label="Colores">
              <Select value={data.settings.tema ?? 'appleboss_navy'} onChange={(e) => set('tema', e.target.value)}>
                {TEMAS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
          </>
        )}

        {CON_TITULO.includes(section.type) && (
          <>
            <Field label="Título de la sección" value={data.settings.titulo} max={40} hint={AYUDA_TITULO[section.type]}>
              <Input value={data.settings.titulo ?? ''} maxLength={80}
                placeholder={PLACEHOLDER_TITULO[section.type] ?? section.label}
                onChange={(e) => set('titulo', e.target.value)} />
            </Field>
            <Field label="Bajada (opcional)" value={data.settings.subtitle} max={90} hint={AYUDA_BAJADA[section.type]}>
              <Input value={data.settings.subtitle ?? ''} maxLength={140} onChange={(e) => set('subtitle', e.target.value)} />
            </Field>
          </>
        )}

        {section.type === 'category_products' && (
          <Field label="¿Qué categoría muestra?">
            <Select value={data.settings.categoria ?? categorias[0]?.value ?? ''} onChange={(e) => set('categoria', e.target.value)}>
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>{c.label} ({c.cantidad} a la venta)</option>
              ))}
            </Select>
          </Field>
        )}

        {section.type === 'product_collection' && (
          <Field label="¿Qué colección muestra?"
            hint="Las colecciones se arman en Tienda online → Colecciones: tú eliges qué productos entran y en qué orden.">
            <Select value={data.settings.collection_id ?? ''} onChange={(e) => set('collection_id', Number(e.target.value) || '')}>
              <option value="">Elige una colección…</option>
              {colecciones.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.cantidad})</option>
              ))}
            </Select>
          </Field>
        )}

        {section.type === 'trade_in' && (
          <>
            <Field label="Título" value={data.settings.titulo} max={60}>
              <Input value={data.settings.titulo ?? ''} maxLength={120} onChange={(e) => set('titulo', e.target.value)} />
            </Field>
            <Field label="Texto" value={data.settings.descripcion} max={140}>
              <Textarea rows={2} value={data.settings.descripcion ?? ''} maxLength={300} onChange={(e) => set('descripcion', e.target.value)} />
            </Field>
            <Field label="Texto del botón" value={data.settings.cta_label} max={24}>
              <Input value={data.settings.cta_label ?? ''} maxLength={40} placeholder="Cotizar mi equipo"
                onChange={(e) => set('cta_label', e.target.value)} />
            </Field>
          </>
        )}

        {CON_LIMITE.includes(section.type) && (
          <Field label="Cuántos productos muestra" hint="Entre 1 y 12. Si hay menos, muestra los que haya.">
            <Input type="number" min={1} max={12} value={data.settings.limit ?? ''} placeholder="Por defecto"
              onChange={(e) => set('limit', e.target.value === '' ? '' : Math.min(12, Math.max(1, Number(e.target.value) || 1)))} />
          </Field>
        )}

        {section.type === 'news' && (
          <Field label="Cuántas novedades muestra" hint="Entre 1 y 12: salen las más nuevas. Con 3 queda una fila completa en la computadora.">
            <Input type="number" min={1} max={12} value={data.settings.limit ?? ''} placeholder="3"
              onChange={(e) => set('limit', e.target.value === '' ? '' : Math.min(12, Math.max(1, Number(e.target.value) || 1)))} />
          </Field>
        )}

        {section.type === 'featured' && (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Los productos se eligen marcando <strong>Destacado</strong> en cada publicación, en «Productos en la tienda».
          </p>
        )}

        {!section.editable && (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
            Esta sección no tiene textos para editar acá: su contenido sale entero de {meta.fuente?.label ?? 'otro módulo'}.
          </p>
        )}

        <div className="rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">Mostrarla solo entre dos fechas</p>
          <p className="mt-0.5 text-xs text-slate-500">Opcional. Sirve para una campaña: fuera de esas fechas la sección no se dibuja.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Desde" error={errors.publicar_desde}>
              <Input type="date" value={data.publicar_desde ?? ''} onChange={(e) => setData('publicar_desde', e.target.value)} />
            </Field>
            <Field label="Hasta" error={errors.publicar_hasta}>
              <Input type="date" value={data.publicar_hasta ?? ''} onChange={(e) => setData('publicar_hasta', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>
    </Modal>
  );
}
