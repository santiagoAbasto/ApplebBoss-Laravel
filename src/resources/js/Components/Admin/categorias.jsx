import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { LayoutList, List } from 'lucide-react';
import { Badge, buttonCls } from '@/Components/Admin/ui';
import TarjetaCategoria, { acentoCategoria } from '@/Components/Store/TarjetaCategoria';

// Piezas compartidas de Tienda online → Categorías: el listado y la pantalla de cada categoría muestran lo mismo.

/** Un acceso del inicio se ve solo si la categoría está activa, marcada para el inicio y tiene productos. */
export const vaEnInicio = (c) => Boolean(c.active && c.show_home && c.en_tienda > 0);

/** El bloque «¿Qué estás buscando?» necesita estar encendido en Portada y dos categorías con productos. */
export function estadoInicio(categorias, bloqueInicio) {
  const visibles = categorias.filter(vaEnInicio);
  if (!bloqueInicio) return { visibles, motivo: 'El bloque «¿Qué estás buscando?» está apagado en Portada.' };
  if (visibles.length < 2) return { visibles, motivo: 'El bloque aparece cuando dos categorías o más tienen productos en la tienda.' };
  return { visibles, motivo: null };
}

export function IconoCategoria({ slug }) {
  const { bg, ink, Icon } = acentoCategoria(slug);
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: bg, color: ink }} aria-hidden="true">
      <Icon className="h-5 w-5" />
    </span>
  );
}

/** El bloque del inicio tal como lo ve el cliente, con los datos de la tienda. */
export function VistaInicio({ categorias, bloqueInicio }) {
  const { visibles, motivo } = estadoInicio(categorias, bloqueInicio);
  return (
    <div className="mt-4 rounded-2xl bg-[#F5F6FA] p-4">
      {motivo ? (
        <p className="px-2 py-8 text-center text-[13px] text-slate-500">{motivo}</p>
      ) : (
        <>
          <p className="text-lg font-black leading-tight text-[#0D0D1A]">¿Qué estás buscando?</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {visibles.map((c) => (
              <TarjetaCategoria key={c.slug} vistaPrevia cat={{ slug: c.slug, name: c.name, description: c.description, count: c.en_tienda }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** El filtro «Categoría» del catálogo: las activas con productos. */
export function VistaCatalogo({ categorias }) {
  const visibles = categorias.filter((c) => c.active && c.en_tienda > 0);
  const total = visibles.reduce((suma, c) => suma + c.en_tienda, 0);

  return (
    <div className="mt-4 rounded-2xl bg-[#F5F6FA] p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Categoría</p>
      {visibles.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-slate-500">Ninguna categoría tiene productos en la tienda todavía.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          <li className="flex items-center justify-between gap-3 rounded-xl bg-[#011446] px-3 py-2 text-sm font-semibold text-white">
            <span>Todo el catálogo</span> <span className="tabular-nums text-white/60">{total}</span>
          </li>
          {visibles.map((c) => (
            <li key={c.slug} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600">
              <span className="truncate">{c.name}</span> <span className="tabular-nums text-slate-400">{c.en_tienda}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Tipos de accesorio del listado: los que están en la tienda o, si no hay ninguno, los que faltan publicar. */
export function ChipsTipos({ tipos = [] }) {
  const conStock = tipos.filter((t) => t.en_tienda > 0);
  const lista = (conStock.length ? conStock : tipos.filter((t) => t.por_publicar > 0)).slice(0, 6);
  if (lista.length === 0) return null;
  const campo = conStock.length ? 'en_tienda' : 'por_publicar';

  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
      <span className="font-semibold">{conStock.length ? 'En la tienda:' : 'Por publicar:'}</span>
      {lista.map((t) => (
        <span key={t.key} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
          {t.label} <span className="tabular-nums text-slate-400">{t[campo].toLocaleString('es-BO')}</span>
        </span>
      ))}
    </p>
  );
}

/** Accesorios por tipo: lo que está a la venta y lo que falta publicar. */
export function TablaTipos({ tipos = [] }) {
  if (tipos.length === 0) return null;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
          <th className="pb-2 text-left font-bold">Tipo</th>
          <th className="pb-2 text-right font-bold">En la tienda</th>
          <th className="pb-2 text-right font-bold">Por publicar</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {tipos.map((t) => (
          <tr key={t.key}>
            <td className="py-2 font-semibold text-slate-800">{t.label}</td>
            <td className="py-2 text-right font-semibold tabular-nums text-slate-700">{t.en_tienda.toLocaleString('es-BO')}</td>
            <td className="py-2 text-right tabular-nums text-slate-500">{t.por_publicar.toLocaleString('es-BO')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Dónde figura la categoría fuera de este módulo: los menús y el carrusel del inicio. */
export function OtrosLugares({ categoria = {} }) {
  const menus = categoria.menu ?? [];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-slate-200 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><List className="h-4 w-4 text-[#585E9F]" /> En los menús</p>
        {menus.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {menus.map((m) => (
              <Badge key={m.slot} tone="navy">{m.label} · {m.enlaces} {m.enlaces === 1 ? 'enlace' : 'enlaces'}</Badge>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-[13px] text-slate-500">No figura en ningún menú.</p>
        )}
        <Link href={route('admin.menus.index')} className={buttonCls('ghost', 'mt-2 h-8 px-2 text-xs')}>Editar en Menú</Link>
      </div>

      <div className="rounded-xl border border-slate-200 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><LayoutList className="h-4 w-4 text-[#585E9F]" /> Carrusel del inicio</p>
        {categoria.carrusel ? (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-slate-600">
            «{categoria.carrusel.titulo}»
            {categoria.carrusel.activo ? <Badge tone="emerald">Encendido</Badge> : <Badge tone="slate">Apagado</Badge>}
          </p>
        ) : (
          <p className="mt-1.5 text-[13px] text-slate-500">No tiene carrusel propio en el inicio.</p>
        )}
        <Link href={route('admin.home-builder.index')} className={buttonCls('ghost', 'mt-2 h-8 px-2 text-xs')}>Editar en Portada</Link>
      </div>
    </div>
  );
}
